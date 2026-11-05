import { describe, it, expect } from "vitest";
import { recoveryMap, restNeed } from "../src/core/recovery.ts";
import { parse } from "../src/core/dates.ts";

const H = 36e5;
const muscles: Record<string, { p: string[]; s: string[] }> = {
  "Bench Press (Barbell)": { p: ["Göğüs"], s: ["Triceps"] },
  "Triceps Pushdown (Halat)": { p: ["Triceps"], s: [] },
  "Deadlift": { p: ["Kalça", "Hamstring", "Bel"], s: ["Quadriceps"] },
  "Back Squat": { p: ["Quadriceps"], s: ["Kalça"] },
  "Koşu (Bant)": { p: ["Quadriceps"], s: [] },
};
const base = {
  isCardio: (ex: string) => ex.startsWith("Koşu"),
  musclesOf: (ex: string) => muscles[ex] || { p: [], s: [] },
};
const sets = (n: number, t?: string) => Array.from({ length: n }, () => ({ w: 60, r: 8, ...(t ? { t } : {}) }));
const at6pm = (d: string) => parse(d).getTime() + 18 * H;

describe("toparlanma", () => {
  it("dinlenme: alt vücut 48 sa, üst vücut 24 sa; yüksek hacim ve tükeniş her biri +24 sa", () => {
    expect(restNeed("Göğüs", 3, false)).toBe(24);
    expect(restNeed("Quadriceps", 3, false)).toBe(48);
    expect(restNeed("Göğüs", 8, false)).toBe(48);
    expect(restNeed("Hamstring", 8, true)).toBe(96);
  });

  it("saat bilinmiyorsa günün 18:00'inden sayar; üst vücut 24 sa ister", () => {
    const r = recoveryMap({ ...base, entries: [{ ex: "Bench Press (Barbell)", date: "2026-10-01", sets: sets(3) }], sessions: [], now: at6pm("2026-10-01") + 12 * H });
    expect(r["Göğüs"]).toMatchObject({ sets: 3, need: 24, hrs: 12, pct: 0.5, fail: false });
  });

  it("yardımcı kas yarım set sayılır; 1 setin altı yorgunluk sayılmaz", () => {
    const r = recoveryMap({ ...base, entries: [{ ex: "Bench Press (Barbell)", date: "2026-10-01", sets: sets(4) }], sessions: [], now: at6pm("2026-10-01") + 24 * H });
    expect(r["Triceps"]).toMatchObject({ sets: 2, need: 24, pct: 1 });
    const one = recoveryMap({ ...base, entries: [{ ex: "Bench Press (Barbell)", date: "2026-10-01", sets: sets(1) }], sessions: [], now: at6pm("2026-10-02") });
    expect(one["Göğüs"]).toBeDefined();
    expect(one["Triceps"]).toBeUndefined();
  });

  it("hafif çalışılan günde önceki anlamlı gün geçerli olur", () => {
    const entries = [
      { ex: "Back Squat", date: "2026-10-01", sets: sets(4) },
      { ex: "Bench Press (Barbell)", date: "2026-10-03", sets: sets(1) }, // triceps ½ set
      { ex: "Triceps Pushdown (Halat)", date: "2026-10-01", sets: sets(3) },
    ];
    const r = recoveryMap({ ...base, entries, sessions: [], now: at6pm("2026-10-03") });
    expect(r["Triceps"]).toMatchObject({ date: "2026-10-01", sets: 3 });
    expect(r["Quadriceps"]).toMatchObject({ date: "2026-10-01", need: 48, pct: 1 });
  });

  it("aynı gündeki setler toplanır; 8+ set dinlenmeyi 24 sa uzatır", () => {
    const entries = [
      { ex: "Bench Press (Barbell)", date: "2026-10-01", sets: sets(4) },
      { ex: "Triceps Pushdown (Halat)", date: "2026-10-01", sets: sets(6) },
    ];
    const r = recoveryMap({ ...base, entries, sessions: [], now: parse("2026-10-03").getTime() });
    expect(r["Triceps"].sets).toBe(8);
    expect(r["Triceps"].need).toBe(48);
  });

  it("tükenişe kadar set ana kasın dinlenmesini 24 sa uzatır, yardımcı kası etkilemez", () => {
    const r = recoveryMap({ ...base, entries: [{ ex: "Deadlift", date: "2026-10-01", sets: [...sets(2), ...sets(1, "f")] }], sessions: [], now: at6pm("2026-10-02") });
    expect(r["Hamstring"]).toMatchObject({ sets: 3, fail: true, need: 72 });
    expect(r["Quadriceps"]).toMatchObject({ sets: 1.5, fail: false, need: 48 });
  });

  it("antrenman bitiş saati varsa ona göre sayar, en son biten seansı alır", () => {
    const end = parse("2026-10-01").getTime() + 9 * H;
    const r = recoveryMap({
      ...base,
      entries: [{ ex: "Bench Press (Barbell)", date: "2026-10-01", sets: sets(3) }],
      sessions: [{ date: "2026-10-01", end: end - 2 * H }, { date: "2026-10-01", end }],
      now: end + 12 * H,
    });
    expect(r["Göğüs"].hrs).toBe(12);
  });

  it("yalnız en son çalıştırılan gün dikkate alınır; ısınma ve kardiyo sayılmaz", () => {
    const r = recoveryMap({
      ...base,
      entries: [
        { ex: "Bench Press (Barbell)", date: "2026-09-20", sets: sets(10) },
        { ex: "Bench Press (Barbell)", date: "2026-10-01", sets: [...sets(2), { w: 20, r: 10, t: "w" }] },
        { ex: "Koşu (Bant)", date: "2026-10-01", sets: [{ w: 30, r: 5 }] },
      ],
      sessions: [],
      now: parse("2026-10-02").getTime(),
    });
    expect(r["Göğüs"]).toMatchObject({ date: "2026-10-01", sets: 2 });
    expect(r["Quadriceps"]).toBeUndefined();
  });
});
