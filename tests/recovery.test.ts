import { describe, it, expect } from "vitest";
import { recoveryMap } from "../src/core/recovery.ts";
import { parse } from "../src/core/dates.ts";

const H = 36e5;
const muscles: Record<string, { p: string[]; s: string[] }> = {
  "Bench Press (Barbell)": { p: ["Göğüs"], s: ["Triceps"] },
  "Triceps Pushdown (Halat)": { p: ["Triceps"], s: [] },
  "Koşu (Bant)": { p: ["Quadriceps"], s: [] },
};
const base = {
  isCardio: (ex: string) => ex.startsWith("Koşu"),
  musclesOf: (ex: string) => muscles[ex] || { p: [], s: [] },
};
const sets = (n: number) => Array.from({ length: n }, () => ({ w: 60, r: 8 }));

describe("toparlanma", () => {
  it("saat bilinmiyorsa günün 18:00'inden sayar; büyük kas 48 sa ister", () => {
    const at = parse("2026-10-01").getTime() + 18 * H;
    const r = recoveryMap({ ...base, entries: [{ ex: "Bench Press (Barbell)", date: "2026-10-01", sets: sets(3) }], sessions: [], now: at + 24 * H });
    expect(r["Göğüs"]).toMatchObject({ sets: 3, need: 48, hrs: 24, pct: 0.5 });
  });

  it("yardımcı kas yarım set sayılır, küçük kas 36 sa ister", () => {
    const at = parse("2026-10-01").getTime() + 18 * H;
    const r = recoveryMap({ ...base, entries: [{ ex: "Bench Press (Barbell)", date: "2026-10-01", sets: sets(4) }], sessions: [], now: at + 36 * H });
    expect(r["Triceps"]).toMatchObject({ sets: 2, need: 36, pct: 1 });
  });

  it("aynı gündeki setler toplanır; 8+ set dinlenmeyi 24 sa uzatır", () => {
    const entries = [
      { ex: "Bench Press (Barbell)", date: "2026-10-01", sets: sets(4) },
      { ex: "Triceps Pushdown (Halat)", date: "2026-10-01", sets: sets(6) },
    ];
    const r = recoveryMap({ ...base, entries, sessions: [], now: parse("2026-10-03").getTime() });
    expect(r["Triceps"].sets).toBe(8);
    expect(r["Triceps"].need).toBe(60);
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
