import { describe, it, expect } from "vitest";
import { addProgram, deleteProgram, findProgram, history, overview, setPlan, updateProgram } from "../src/core/assistant.ts";
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

describe("haftalık plan", () => {
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
