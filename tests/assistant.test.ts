import { describe, it, expect } from "vitest";
import { addProgram, setBaseline, deleteLog, deleteProgram, findProgram, history, logWorkouts, overview, setPlan, updateProgram } from "../src/core/assistant.ts";
import { DEFAULTS, mergeStates, stampChanges, takeSnapshot, withDefaults } from "../src/core/schema.ts";
import { toPayload } from "../src/core/sync.ts";

const TODAY = new Date(2026, 10, 3);
let n = 0;
const uid = () => "id" + ++n;
const fresh = () => withDefaults({ ...DEFAULTS(), v: 2 });

describe("program ekleme", () => {
  it("her gün ayrı program olur, hareket adları kütüphaneyle eşlenir, bilinmeyen özel hareket olur", () => {
    const s = fresh();
    const r = addProgram(s, "Üst Alt", [
      { name: "Üst", items: [{ exercise: "bench press", sets: 4, reps: "6-8" }, { exercise: "Sandbag Carry", sets: 3, reps: 20 }] },
      { name: "Alt", items: [{ exercise: "Back Squat", sets: 99, reps: "5 tekrar" }] },
    ], uid);
    expect(r.created.map(c => c.name)).toEqual(["Üst Alt · Üst", "Üst Alt · Alt"]);
    expect(s.programs[0].items).toEqual([{ ex: "Bench Press (Barbell)", sets: 4, reps: "6-8" }, { ex: "Sandbag Carry", sets: 3, reps: "20" }]);
    expect(s.programs[1].items[0]).toEqual({ ex: "Back Squat", sets: 20, reps: "5" });
    expect(s.custom).toEqual([{ name: "Sandbag Carry", group: "Diğer" }]);
    expect(r.notes.join(" ")).toMatch(/Sandbag Carry/);
    // aynı ad ikinci kez: (2)
    expect(addProgram(s, "Üst Alt", [{ name: "Üst", items: [{ exercise: "Plank" }] }, { name: "Alt", items: [{ exercise: "Plank" }] }], uid).created[0].name).toBe("Üst Alt · Üst (2)");
  });

  it("boş program reddedilir", () => {
    expect(() => addProgram(fresh(), "X", [], uid)).toThrow();
    expect(() => addProgram(fresh(), "X", [{ items: [] }], uid)).toThrow();
  });

  it("günceller ve siler; silinen programın plan günleri boşalır", () => {
    const s = fresh();
    addProgram(s, "Tam", [{ items: [{ exercise: "Deadlift", sets: 1, reps: 5 }] }], uid);
    addProgram(s, "Kol", [{ items: [{ exercise: "Barbell Curl" }] }], uid);
    expect(updateProgram(s, "tam", { name: "Tam Vücut", items: [{ exercise: "Back Squat", sets: 3, reps: 5 }] }).name).toBe("Tam Vücut");
    expect(findProgram(s, "TAM VÜCUT")!.items).toEqual([{ ex: "Back Squat", sets: 3, reps: "5" }]);
    setPlan(s, [{ day: "Pazartesi", program: "Kol" }, { day: "WE", program: "Tam Vücut" }], undefined, TODAY);
    expect(deleteProgram(s, "Kol").freedDays).toEqual(["Pazartesi"]);
    expect(Object.keys(s.plan.days)).toEqual(["WE"]);
    expect(() => deleteProgram(s, "yok")).toThrow(/bulunamadı/);
  });
});

describe("kilolar başlangıç noktasına", () => {
  it("programdaki kg başlangıç verisi olur; baslangic_kaydet üzerine ekler ya da değiştirir", () => {
    const s = fresh();
    const r = addProgram(s, "Full Body", [{ name: "A", items: [{ exercise: "Back Squat", sets: 3, reps: "5", kg: 115 }, { exercise: "Plank", reps: "45" }] }], uid, TODAY);
    expect(r.startingWeights).toEqual(["Back Squat"]);
    expect(s.baseline).toEqual({ "Back Squat": { w: 115, r: 5, date: "2026-11-03" } });
    const b = setBaseline(s, [{ exercise: "Conventional Deadlift", kg: 140, reps: 5 }, { exercise: "Plank", seconds: 60 }], false, TODAY);
    expect(b.notes).toContain('"Conventional Deadlift" → "Deadlift"');
    expect(Object.keys(s.baseline).sort()).toEqual(["Back Squat", "Deadlift", "Plank"]);
    expect(s.baseline.Plank).toMatchObject({ sec: 60 });
    expect(overview(s, TODAY).startingPoint).toContainEqual({ exercise: "Deadlift", kg: 140, reps: 5, since: "2026-11-03" });
    updateProgram(s, "Full Body", { items: [{ exercise: "Back Squat", reps: "5", kg: 120 }] }, TODAY);
    expect(s.baseline["Back Squat"].w).toBe(120);
    setBaseline(s, [{ exercise: "Deadlift", kg: 150, reps: 3 }], true, TODAY);
    expect(Object.keys(s.baseline)).toEqual(["Deadlift"]);
  });
});

describe("haftalık plan", () => {
  it("plan Google'da görev ya da etkinlik olarak seçilebilir; görevde biten antrenman ayrıca yazılmaz", () => {
    const s = fresh();
    addProgram(s, "Full Body", [{ name: "A", items: [{ exercise: "Back Squat" }] }], uid);
    s.gcal = { ...s.gcal, log: true };
    const v = setPlan(s, [{ day: "MO" }, { day: "WE" }, { day: "FR" }], "2027-01-01", TODAY, "gorev");
    expect(s.gcal).toMatchObject({ plan: true, mode: "task", log: false });
    expect(v.googleCalendar).toMatch(/^gorev/);
    setPlan(s, [{ day: "MO" }], undefined, TODAY, "etkinlik");
    expect(s.gcal).toMatchObject({ plan: true, mode: "event" });
    // verilmezse ayar değişmez
    setPlan(s, [{ day: "TU" }], undefined, TODAY);
    expect(s.gcal.mode).toBe("event");
    setPlan(s, [{ day: "TU" }], undefined, TODAY, "kapali");
    expect(s.gcal.plan).toBe(false);
    expect(() => setPlan(s, [], undefined, TODAY, "tikli")).toThrow();
  });

  const withProgs = () => {
    const s = fresh();
    addProgram(s, "AB", [{ name: "A", items: [{ exercise: "Back Squat" }] }, { name: "B", items: [{ exercise: "Deadlift" }] }], uid);
    return s;
  };

  it("pazartesi, çarşamba, cumartesi 18:00, 6 Ocak'a kadar: programlar sırayla dağılır", () => {
    const s = withProgs();
    const v = setPlan(s, [{ day: "cumartesi", time: "10" }, { day: "Pzt", time: "18:00" }, { day: "çarşamba", time: "18.00" }], "6.1.2027", TODAY);
    expect(v.days.map(d => [d.code, d.time])).toEqual([["MO", "18:00"], ["WE", "18:00"], ["SA", "10:00"]]);
    expect(Object.values(s.plan.days).map((d: any) => d.prog).sort()).toEqual([s.programs[0].id, s.programs[0].id, s.programs[1].id].sort());
    expect(s.plan.until).toBe("2027-01-06");
    expect(s.goal).toBe(3);
  });

  it("programı yazılmayan gün mevcut plandaki programı korur; until verilmezse bitiş tarihi kalır, \"\" süresiz yapar", () => {
    const s = withProgs();
    setPlan(s, [{ day: "MO", program: "AB · B", time: "07:30" }], "2027-01-06", TODAY);
    setPlan(s, [{ day: "MO" }, { day: "FR" }], undefined, TODAY);
    expect(s.plan.days.MO).toEqual({ prog: s.programs[1].id, time: "07:30" });
    expect(s.plan.days.FR.prog).toBe(s.programs[1].id);
    expect(s.plan.until).toBe("2027-01-06");
    setPlan(s, [{ day: "MO" }], "", TODAY);
    expect(s.plan.until).toBe("");
  });

  it("sirayla: programlar günlere hafta hafta döner; günler program yazılmadan değişince sıra sürer", () => {
    const s = withProgs();
    // 3 Kasım salı: sıradaki gün çarşamba A alır
    const v = setPlan(s, [{ day: "MO" }, { day: "WE" }, { day: "FR" }], undefined, TODAY, undefined, ["AB · A", "AB · B"]);
    expect(v).toMatchObject({ type: "sirayla", rotation: ["AB · A", "AB · B"] });
    expect(v.next14.map(x => x.date.slice(8) + x.program.slice(-1))).toEqual(["04A", "06B", "09A", "11B", "13A", "16B"]);
    setPlan(s, [{ day: "MO" }, { day: "WE" }, { day: "FR", time: "08:00" }], undefined, TODAY);
    expect(s.plan.mode).toBe("rot");
    expect(overview(s, TODAY).plan.next14[0]).toMatchObject({ date: "2026-11-04", program: "AB · A" });
    // günlere program yazılırsa sabit plana döner
    setPlan(s, [{ day: "MO", program: "AB · B" }], undefined, TODAY);
    expect(s.plan.mode).toBe("fixed");
    expect(() => setPlan(s, [{ day: "MO" }], undefined, TODAY, undefined, ["Yok"])).toThrow(/bulunamadı/);
    // liste metin olarak gelse de anlaşılır
    expect(setPlan(s, [{ day: "MO" }, { day: "FR" }], undefined, TODAY, undefined, '["AB · A","AB · B"]' as any).rotation).toEqual(["AB · A", "AB · B"]);
    expect(setPlan(s, [{ day: "MO" }, { day: "FR" }], undefined, TODAY, undefined, "AB · B, AB · A" as any).rotation).toEqual(["AB · B", "AB · A"]);
  });

  it("hatalı gün, saat, tarih ve program reddedilir", () => {
    const s = withProgs();
    expect(() => setPlan(s, [{ day: "Zz" }], undefined, TODAY)).toThrow(/Gün/);
    expect(() => setPlan(s, [{ day: "MO", time: "25:00" }], undefined, TODAY)).toThrow(/Saat/);
    expect(() => setPlan(s, [{ day: "MO" }, { day: "Pazartesi" }], undefined, TODAY)).toThrow(/iki kez/);
    expect(() => setPlan(s, [{ day: "MO" }], "2026-11-01", TODAY)).toThrow(/geçmişte/);
    expect(() => setPlan(s, [{ day: "MO" }], "2028-06-01", TODAY)).toThrow(/bir yıl/);
    expect(() => setPlan(s, [{ day: "MO", program: "Yok" }], undefined, TODAY)).toThrow(/bulunamadı/);
    expect(() => setPlan(fresh(), [{ day: "MO" }], undefined, TODAY)).toThrow(/Önce bir program/);
  });
});

describe("okuma", () => {
  const logged = () => {
    const s = fresh();
    addProgram(s, "Güç", [{ items: [{ exercise: "Back Squat", sets: 3, reps: 5 }] }], uid);
    s.entries.push(
      { id: "e1", date: "2026-10-20", ex: "Back Squat", sets: [{ w: 20, r: 10, t: "w" }, { w: 80, r: 5 }, { w: 85, r: 3 }] },
      { id: "e2", date: "2026-10-27", ex: "Back Squat", sets: [{ w: 82.5, r: 5 }] },
      { id: "e3", date: "2026-10-27", ex: "Plank", sets: [{ sec: 45 }] },
    );
    s.sessions.push({ id: "s1", date: "2026-10-27", start: Date.UTC(2026, 9, 27, 17), end: Date.UTC(2026, 9, 27, 18), prog: s.programs[0].id });
    return s;
  };

  it("özet programları, planı ve son antrenmanları verir", () => {
    const o = overview(logged(), TODAY);
    expect(o.programs[0]).toMatchObject({ name: "Güç", items: [{ exercise: "Back Squat", sets: 3, reps: "5" }] });
    expect(o.recentWorkouts[0]).toEqual({ date: "2026-10-27", program: "Güç", minutes: 60,
      exercises: [{ exercise: "Back Squat", sets: "82.5x5" }, { exercise: "Plank", sets: "45sn" }] });
  });

  it("hareket geçmişi ısınma setlerini saymaz, en ağır seti ve tahmini 1RM'i bulur", () => {
    const h = history(logged(), "back squat", 30, TODAY);
    expect(h.exercise).toBe("Back Squat");
    expect(h.entries.map(e => e.sets)).toEqual(["80x5, 85x3", "82.5x5"]);
    expect(h.best!.heaviest).toEqual({ date: "2026-10-20", w: 85, r: 3 });
    expect(h.best!.estimated1RM!).toMatchObject({ date: "2026-10-27", kg: 96.3 });
    expect(history(logged(), "Bench Press", 30, TODAY).found).toBe(false);
  });
});

describe("antrenman kaydetme", () => {
  it("başka uygulamadan gelen geçmiş antrenmanları uygulamanın set biçimine çevirir", () => {
    const s = fresh();
    const r = logWorkouts(s, [
      { date: "2026-10-01", exercises: [
        { exercise: "squat", sets: [{ kg: 20, reps: 10, warmup: true }, { kg: 80, reps: 5, rir: 2 }, { kg: 80, reps: 5 }] },
        { exercise: "Plank", sets: [{ seconds: 60 }] },
        { exercise: "Koşu (Bant)", sets: [{ minutes: 25, km: 4.2 }] },
        { exercise: "Barfiks", sets: [{ reps: 8 }], note: "kolay" },
      ] },
      { date: "3.10.2026", exercises: [{ exercise: "Garip Hareket", sets: [{ kg: 10, reps: 12 }] }] },
    ], TODAY, uid);
    expect(r).toMatchObject({ days: 2, exercises: 5, sets: 7, alreadyLogged: 0 });
    const by = (ex: string) => s.entries.find(e => e.ex === ex)!;
    expect(s.entries[0]).toMatchObject({ date: "2026-10-01", sets: [{ w: 20, r: 10, t: "w" }, { w: 80, r: 5, rir: 2 }, { w: 80, r: 5 }] });
    expect(s.entries[0].ex).toMatch(/Squat/);
    expect(by("Plank").sets).toEqual([{ w: 0, r: 0, sec: 60 }]);
    expect(by("Koşu (Bant)").sets).toEqual([{ w: 25, r: 4.2 }]);
    expect(s.entries[3]).toMatchObject({ note: "kolay", sets: [{ w: 0, r: 8 }] });
    expect(by("Garip Hareket").date).toBe("2026-10-03");
    expect(s.custom.map(c => c.name)).toEqual(["Garip Hareket"]);
    // özet tarihlere göre sayar
    expect(overview(s, TODAY)).toMatchObject({ totalWorkouts: 2, firstWorkout: "2026-10-01" });
  });

  it("yoga pozları İngilizce ya da Türkçe adla bulunur ve süreli kaydedilir", () => {
    const s = fresh();
    logWorkouts(s, [{ date: "2026-10-01", exercises: [
      { exercise: "Downward Dog", sets: [{ seconds: 30 }, { seconds: 45 }] },
      { exercise: "ağaç", sets: [{ seconds: 20 }] },
    ] }], TODAY, uid);
    expect(s.entries.map(e => e.ex)).toEqual(["Aşağı Bakan Köpek (Downward Dog)", "Ağaç (Tree Pose)"]);
    expect(s.entries[0].sets).toEqual([{ w: 0, r: 0, sec: 30 }, { w: 0, r: 0, sec: 45 }]);
    expect(s.custom).toEqual([]);
  });

  it("aynı liste iki kez gönderilirse çift kayıt olmaz; aynı güne yeni set eklenir", () => {
    const s = fresh();
    const w = [{ date: "2026-10-01", exercises: [{ exercise: "Deadlift", sets: [{ kg: 100, reps: 5 }] }] }];
    logWorkouts(s, w, TODAY, uid);
    expect(logWorkouts(s, w, TODAY, uid)).toMatchObject({ exercises: 0, alreadyLogged: 1 });
    logWorkouts(s, [{ date: "2026-10-01", exercises: [{ exercise: "Deadlift", sets: [{ kg: 110, reps: 3 }] }] }], TODAY, uid);
    expect(s.entries).toHaveLength(1);
    expect(s.entries[0].sets).toEqual([{ w: 100, r: 5 }, { w: 110, r: 3 }]);
  });

  it("gelecek tarih, boş set ve hatalı tarih reddedilir; kayıt silinebilir", () => {
    const s = fresh();
    expect(() => logWorkouts(s, [{ date: "2026-11-04", exercises: [{ exercise: "Deadlift", sets: [{ kg: 1, reps: 1 }] }] }], TODAY, uid)).toThrow(/Gelecek/);
    expect(() => logWorkouts(s, [{ date: "dün", exercises: [{ exercise: "Deadlift", sets: [{ kg: 1, reps: 1 }] }] }], TODAY, uid)).toThrow(/Tarih/);
    expect(() => logWorkouts(s, [{ date: "2026-11-01", exercises: [{ exercise: "Deadlift", sets: [{}] }] }], TODAY, uid)).toThrow(/değer yok/);
    logWorkouts(s, [{ date: "2026-11-01", exercises: [{ exercise: "Deadlift", sets: [{ kg: 100, reps: 5 }] }, { exercise: "Plank", sets: [{ seconds: 30 }] }] }], TODAY, uid);
    s.sessions.push({ id: "s", date: "2026-11-01", start: 1, end: 2 });
    expect(deleteLog(s, "2026-11-01", "deadlift").deleted).toEqual(["Deadlift"]);
    expect(s.sessions).toHaveLength(1);
    expect(deleteLog(s, "1.11.2026").deleted).toEqual(["Plank"]);
    expect(s.sessions).toHaveLength(0);
    expect(() => deleteLog(s, "2026-11-01")).toThrow(/bulunamadı/);
  });
});

describe("telefonla birleştirme", () => {
  it("Claude'un dosyaya yazdığı program ve plan, telefondaki verinin üzerine birleşir", () => {
    // telefon: bir antrenman kaydı var, Drive'daki dosya da aynı
    const phone = fresh();
    phone.entries.push({ id: "e1", date: "2026-11-01", ex: "Deadlift", sets: [{ w: 100, r: 5 }], u: 1000 });
    phone.settingsU = 1000;
    // sunucu: dosyayı okur, değiştirir, damgalar
    const remote = withDefaults(JSON.parse(JSON.stringify(toPayload(phone))));
    const snap = takeSnapshot(remote);
    addProgram(remote, "AB", [{ name: "A", items: [{ exercise: "Back Squat" }] }, { name: "B", items: [{ exercise: "Deadlift" }] }], uid);
    setPlan(remote, [{ day: "MO", time: "18:00" }, { day: "TH" }], "2027-01-06", TODAY);
    stampChanges(remote, snap, 2000);
    expect(remote.settingsU).toBe(2000);
    // telefon eşitlerken birleştirir
    const { state, stats } = mergeStates(phone, JSON.parse(JSON.stringify(toPayload(remote))));
    expect(stats.added).toBe(2);
    expect(state.programs.map(p => p.name)).toEqual(["AB · A", "AB · B"]);
    expect(state.plan.until).toBe("2027-01-06");
    expect(Object.keys(state.plan.days)).toEqual(["MO", "TH"]);
    expect(state.entries).toHaveLength(1);
  });
});
