import { describe, it, expect } from "vitest";
import { EX_RENAMES, canonicalEx, migrateExNames } from "../src/core/renames.ts";
import { LIB } from "../src/core/library.ts";
import { matchExercise, parseProgram } from "../src/core/importer.ts";
import { DEFAULTS, withDefaults, mergeStates } from "../src/core/schema.ts";
import { syncOnce } from "../src/core/sync.ts";

const known = Object.values(LIB).flat();

describe("kütüphane adları", () => {
  it("her yeni ad kütüphanede var, hiçbir eski ad kütüphanede kalmadı", () => {
    for (const [o, n] of Object.entries(EX_RENAMES)) {
      expect(known, `${o} → ${n}`).toContain(n);
      expect(known, `${o} hâlâ kütüphanede`).not.toContain(o);
    }
  });
  it("kütüphane adlarında Türkçe karakter yok ve ad çakışması yok", () => {
    expect(known.filter(n => /[çğıöşüÇĞİÖŞÜ]/.test(n))).toEqual([]);
    expect(new Set(known).size).toBe(known.length);
  });
  it("canonicalEx eski adı çevirir, yeni ve bilinmeyen adı olduğu gibi bırakır", () => {
    expect(canonicalEx("Şınav (Push-up)")).toBe("Push-up");
    expect(canonicalEx("Push-up")).toBe("Push-up");
    expect(canonicalEx("Benim Hareketim")).toBe("Benim Hareketim");
    expect(canonicalEx("toString")).toBe("toString");
  });
});

const oldState = () => {
  const s = DEFAULTS();
  s.entries = [
    { id: "a", ts: 1, date: "2026-10-01", ex: "Barfiks (Pull-up)", sets: [{ w: 0, r: 8 }] },
    { id: "b", ts: 2, date: "2026-10-01", ex: "Back Squat", sets: [{ w: 100, r: 5 }] },
    { id: "c", ts: 3, date: "2026-10-02", ex: "Koşu (Bant)", sets: [{ w: 25, r: 4 }] },
    { id: "d", ts: 4, date: "2026-10-02", ex: "Benim Özel", sets: [{ w: 1, r: 1 }] },
  ];
  s.programs = [{ id: "p", name: "P", items: [{ ex: "Şınav (Push-up)", sets: 3, reps: "10" }, { ex: "Lat Pulldown (Geniş)", sets: 3, reps: "10" }] }];
  s.sessions = [{ id: "s", date: "2026-10-01", start: 1, end: 2, prog: "p" }];
  s.favs = ["Mekik (Sit-up)", "Plank"];
  s.baseline = { "Ağırlıklı Barfiks": { w: 10, r: 5, date: "2026-09-01" } };
  s.exNotes = { "Tek Bacak RDL": "diz açık" };
  s.exPrefs = { "Yüzme": { timed: true } };
  s.live = { start: 1, date: "2026-10-03", prog: null, items: [{ ex: "Incline Şınav", sets: 3, reps: "" }], idx: 0 };
  s.draft = { ex: "Eliptik" };
  s.custom = [{ name: "Benim Özel", group: "Göğüs" }];
  return s;
};

describe("migrateExNames", () => {
  it("merges a stale remote alias into a local canonical entry only once", () => {
    const local = DEFAULTS(), remote = DEFAULTS();
    local.entries = [{ id: "new", u: 20, date: "2026-10-01", ex: "Machine Chest Press", sets: [{ w: 20, r: 5 }] }];
    remote.entries = [{ id: "old", u: 10, date: "2026-10-01", ex: "Chest Press Makinesi", sets: [{ w: 10, r: 8 }] }];
    const once = mergeStates(local, remote).state;
    expect(once.entries).toHaveLength(1);
    expect(once.entries[0].sets).toHaveLength(2);
    expect(mergeStates(once, remote).state).toEqual(once);
  });
  it("preserves repeated program rows and targets in their original order", () => {
    const s = DEFAULTS();
    s.programs = [{ id: "p", items: [{ ex: "Chest Press Makinesi", sets: 2, reps: "5" }, { ex: "Back Squat", sets: 3, reps: "8" }, { ex: "Machine Chest Press", sets: 4, reps: "12" }] }];
    const m = migrateExNames(s);
    expect(m.programs[0].items).toEqual(s.programs[0].items.map((i: any) => ({ ...i, ex: canonicalEx(i.ex) })));
    expect(migrateExNames(m)).toEqual(m);
  });
  it("records dropped ids and survives repeated stale remote merges", () => {
    const raw = oldState();
    raw.entries.push({ id: "new", u: 10, date: "2026-10-01", ex: "Pull-up", sets: [{ w: 0, r: 5 }] });
    const before = JSON.stringify(raw);
    let state = migrateExNames(raw);
    expect(state.deleted).toContainEqual(expect.objectContaining({ c: "entries", k: "a" }));
    expect(migrateExNames(state)).toEqual(state);
    for (let i = 0; i < 3; i++) {
      state = mergeStates(state, raw).state;
      expect(state.entries.filter(e => e.ex === "Pull-up")).toHaveLength(1);
      expect(state.entries.find(e => e.id === "new")!.sets).toHaveLength(2);
    }
    expect(JSON.stringify(raw)).toBe(before);
  });
  it("uploads a name-only migration once", async () => {
    const raw = oldState();
    let content = JSON.stringify(raw), writes = 0;
    const store = { read: async () => content, write: async (c: string) => { content = c; writes++; } };
    const r = await syncOnce(withDefaults(raw), store, 100);
    expect(r.uploaded).toBe(true);
    expect(JSON.parse(content).entries[0].ex).toBe("Pull-up");
    expect((await syncOnce(r.state, store, 101)).uploaded).toBe(false);
    expect(writes).toBe(1);
  });
  it("tüm ad taşıyan koleksiyonları yeni ada çevirir", () => {
    const m = migrateExNames(oldState());
    expect(m.entries.map(e => e.ex)).toEqual(["Pull-up", "Back Squat", "Treadmill Run", "Benim Özel"]);
    expect(m.programs[0].items.map((i: any) => i.ex)).toEqual(["Push-up", "Wide-Grip Lat Pulldown"]);
    expect(m.sessions).toEqual(oldState().sessions);
    expect(m.favs).toEqual(["Sit-up", "Plank"]);
    expect(m.baseline["Weighted Pull-up"]).toBeTruthy();
    expect(m.baseline["Ağırlıklı Barfiks"]).toBeUndefined();
    expect(m.exNotes).toEqual({ "Single-Leg RDL": "diz açık" });
    expect(m.exPrefs).toEqual({ "Swimming": { timed: true } });
    expect(m.live.items[0].ex).toBe("Incline Push-up");
    expect(m.draft.ex).toBe("Elliptical");
  });
  it("özel hareketlere dokunmaz; eski adla özel hareket varsa o ad korunur", () => {
    const s = oldState();
    s.custom.push({ name: "Eliptik", group: "Kardiyo" });
    const m = migrateExNames(s);
    expect(m.custom).toEqual(s.custom);
    expect(m.entries[3].ex).toBe("Benim Özel");
    expect(m.draft.ex).toBe("Eliptik");
  });
  it("tekrar çalıştırmak aynı sonucu verir ve girdiyi değiştirmez", () => {
    const s = oldState(), before = JSON.stringify(s);
    const once = migrateExNames(s);
    expect(JSON.stringify(s)).toBe(before);
    expect(migrateExNames(once)).toEqual(once);
  });
  it("yeni ad zaten varsa çift kayıt oluşmaz, değerler ezilmez", () => {
    const s = oldState();
    s.entries.push({ id: "e", ts: 5, date: "2026-10-01", ex: "Pull-up", sets: [{ w: 0, r: 5 }] });
    s.favs = ["Barfiks (Pull-up)", "Pull-up"];
    s.exPrefs = { "Yüzme": { timed: false }, "Swimming": { timed: true } };
    s.exNotes = { "Tek Bacak RDL": "eski", "Single-Leg RDL": "yeni" };
    s.programs[0].items.push({ ex: "Push-up", sets: 1, reps: "" });
    const m = migrateExNames(s);
    const pu = m.entries.filter(e => e.ex === "Pull-up" && e.date === "2026-10-01");
    expect(pu).toHaveLength(1);
    expect(pu[0].sets).toHaveLength(2);
    expect(m.favs).toEqual(["Pull-up"]);
    expect(m.exPrefs["Swimming"]).toEqual({ timed: true });
    expect(m.exNotes["Single-Leg RDL"]).toBe("yeni\neski");
    expect(m.programs[0].items).toEqual(s.programs[0].items.map((i: any) => ({ ...i, ex: canonicalEx(i.ex) })));
  });
  it("withDefaults eski adlı veriyi yükleme sırasında taşır", () => {
    expect(withDefaults(JSON.parse(JSON.stringify(oldState()))).entries[0].ex).toBe("Pull-up");
  });
});

describe("eski adlarla eşleştirme", () => {
  it("matchExercise eski adı yeni ada çözer; eski adlı özel hareket korunur", () => {
    expect(matchExercise("Şınav (Push-up)", known)).toBe("Push-up");
    expect(matchExercise("Sinav (Push-up)", known)).toBe("Push-up");
    expect(matchExercise("Dips (Göğüs)", known)).toBe("Chest Dip");
    expect(matchExercise("Dips (Triceps)", known)).toBe("Triceps Dip");
    expect(matchExercise("Koşu (Bant)", known)).toBe("Treadmill Run");
    expect(matchExercise("Koşu (Bant)", [...known, "Koşu (Bant)"])).toBe("Koşu (Bant)");
  });
  it("eski adlı #ekle= bağlantısı yeni adlara çözülür", () => {
    const link = "https://x.test/spor-defteri.html#ekle=" + encodeURIComponent("p=Eski;g=A:Barfiks (Pull-up)/3/8,Şınav (Push-up)/3/10,Lat Pulldown (Geniş)/3/10,Dumbbell Row (Tek Kol)/3/10");
    const r = parseProgram(link, known)!;
    expect(r.days[0].items.map(i => i.ex)).toEqual(["Pull-up", "Push-up", "Wide-Grip Lat Pulldown", "Single-Arm Dumbbell Row"]);
    expect(r.days[0].items.every(i => i.known)).toBe(true);
  });
});

describe("eşitleme", () => {
  it("eski adlı uzak veri birleşirken yeni ada taşınır", () => {
    const local = withDefaults({ ...DEFAULTS(), deviceId: "L" });
    const remote = JSON.parse(JSON.stringify(oldState()));
    remote.entries.forEach((e: any) => { e.u = 5; });
    const { state } = mergeStates(local, remote);
    expect(state.entries.map(e => e.ex).sort()).toEqual(["Back Squat", "Benim Özel", "Pull-up", "Treadmill Run"]);
  });
  it("syncOnce eski adlı Drive dosyasını taşır", async () => {
    const remote = JSON.parse(JSON.stringify(oldState())); remote.entries.forEach((e: any) => { e.u = 5; });
    const store = { content: JSON.stringify(remote) as string | null, read: async () => store.content, write: async (c: string) => { store.content = c; } };
    const r = await syncOnce(withDefaults({ ...DEFAULTS(), deviceId: "L" }), store, 100);
    expect(r.state.entries.find(e => e.id === "a")!.ex).toBe("Pull-up");
  });
});
