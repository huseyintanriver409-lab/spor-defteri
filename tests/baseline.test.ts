import { describe, it, expect } from "vitest";
import { baseBest, baseSet, buildBaseline, progressRows } from "../src/core/baseline.ts";
import { DEFAULTS, mergeStates, withDefaults } from "../src/core/schema.ts";

describe("başlangıç noktası", () => {
  it("formu temizler: boş satırlar atılır, virgüllü sayılar okunur, süreli hareket saniye olur", () => {
    const b = buildBaseline([
      { ex: "Back Squat", w: "82,5", r: "5" },
      { ex: "Plank", w: "", sec: "60" },
      { ex: "", w: "50", r: "5" },
      { ex: "Deadlift", w: "", r: "" },
    ], {}, "2026-11-03");
    expect(b).toEqual({ "Back Squat": { w: 82.5, r: 5, date: "2026-11-03" }, Plank: { w: 0, r: 0, sec: 60, date: "2026-11-03" } });
  });

  it("değeri değişmeyen hareketin tarihi korunur, değişeninki yenilenir", () => {
    const old = { "Back Squat": { w: 80, r: 5, date: "2026-10-01" }, Deadlift: { w: 100, r: 5, date: "2026-10-01" } };
    const b = buildBaseline([{ ex: "Back Squat", w: 80, r: 5 }, { ex: "Deadlift", w: 110, r: 5 }], old, "2026-11-03");
    expect(b["Back Squat"].date).toBe("2026-10-01");
    expect(b.Deadlift.date).toBe("2026-11-03");
  });

  it("şimdi değeri başlangıçtan sonraki en son antrenmanın en iyi seti; fark hesaplanır", () => {
    const base = { "Back Squat": { w: 80, r: 5, date: "2026-10-01" }, Plank: { w: 0, r: 0, sec: 45, date: "2026-10-01" }, "Bench Press (Barbell)": { w: 60, r: 8, date: "2026-10-01" } };
    const entries = [
      { ex: "Back Squat", date: "2026-09-01", sets: [{ w: 200, r: 1 }] }, // başlangıçtan önce: sayılmaz
      { ex: "Back Squat", date: "2026-10-10", sets: [{ w: 85, r: 5 }] },
      { ex: "Back Squat", date: "2026-10-20", sets: [{ w: 40, r: 10, t: "w" }, { w: 90, r: 5 }, { w: 90, r: 4 }] },
      { ex: "Plank", date: "2026-10-05", sets: [{ sec: 50 }, { sec: 60 }] },
    ];
    const rows = progressRows(base, entries);
    expect(rows.map(r => r.ex)).toEqual(["Back Squat", "Bench Press (Barbell)", "Plank"]);
    expect(rows[0]).toMatchObject({ now: { w: 90, r: 5 }, nowDate: "2026-10-20", diffKg: 10, diffReps: 0 });
    expect(rows[1]).toMatchObject({ now: null, diffKg: 0 });
    expect(rows[2]).toMatchObject({ now: { sec: 60 }, diffSec: 15 });
  });

  it("öneri ve rekor için set biçimi", () => {
    expect(baseSet({ w: 80, r: 5, date: "x" })).toEqual({ w: 80, r: 5 });
    expect(baseSet({ w: 0, r: 0, sec: 60, date: "x" })).toEqual({ w: 0, r: 0, sec: 60 });
    expect(baseBest({ w: 100, r: 5, date: "x" }).e).toBeCloseTo(116.67, 1);
    expect(baseBest({ w: 100, r: 20, date: "x" })).toEqual({ w: 100, e: 0 });
    expect(baseBest(undefined)).toEqual({ w: 0, e: 0 });
  });

  it("ayarlarla eşitlenir; başlangıcı bilmeyen eski sürümün dosyası onu silmez", () => {
    const local = withDefaults({ ...DEFAULTS(), v: 2, settingsU: 1, baseline: { Deadlift: { w: 100, r: 5, date: "2026-11-01" } } });
    const newer = { ...DEFAULTS(), v: 2, settingsU: 5, baseline: { Deadlift: { w: 120, r: 3, date: "2026-11-02" } } };
    expect(mergeStates(local, newer).state.baseline.Deadlift.w).toBe(120);
    const { baseline, ...oldVersion } = newer;
    const m = mergeStates(local, oldVersion).state;
    expect(m.settingsU).toBe(5);
    expect(m.baseline.Deadlift.w).toBe(100);
  });
});
