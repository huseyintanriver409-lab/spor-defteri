import { describe, it, expect } from "vitest";
import { BEST, MUSCLES, fatigueTier, loadTier, rankForMuscle, sessionBreakdown, sessionTier, setsByMuscle } from "../src/core/musclemap.ts";
import { LIB } from "../src/core/library.ts";

const allNames = new Set(Object.values(LIB).flat());
const M: Record<string, { p: string[]; s: string[] }> = {
  "Bench Press (Barbell)": { p: ["Göğüs"], s: ["Ön Omuz", "Triceps"] },
  "Dumbbell Fly": { p: ["Göğüs"], s: ["Ön Omuz"] },
  "Cable Crossover": { p: ["Göğüs"], s: ["Ön Omuz"] },
  "Close-Grip Bench Press": { p: ["Triceps"], s: ["Göğüs", "Ön Omuz"] },
  "Barbell Curl": { p: ["Biceps"], s: ["Önkol"] },
};
const musclesOf = (n: string) => M[n] || { p: [], s: [] };

describe("vücut haritası", () => {
  it("en iyi hareket listeleri kütüphanede var ve her kasın listesi dolu", () => {
    expect(Object.values(BEST).flat().filter(n => !allNames.has(n))).toEqual([]);
    expect(MUSCLES.filter(m => !BEST[m]?.length)).toEqual([]);
  });
  it("haftalık set kademeleri", () => {
    expect([0, 2, 4, 9.5, 10, 20, 21].map(loadTier)).toEqual(["yok", "dusuk", "koruma", "koruma", "gelisim", "gelisim", "asiri"]);
  });
  it("yorgunluk kademeleri: ağır günden sonra aşırı yorgun", () => {
    const r = (pct: number, sets: number) => ({ date: "2026-01-01", sets, hrs: 0, need: 48, pct });
    expect(fatigueTier(undefined)).toBe("yok");
    expect(fatigueTier(r(1, 20))).toBe("hazir");
    expect(fatigueTier(r(.6, 20))).toBe("toparlaniyor");
    expect(fatigueTier(r(.2, 6))).toBe("yorgun");
    expect(fatigueTier(r(.2, 12))).toBe("asiri");
  });
  it("set sayımı: ana kas tam, yardımcı yarım", () => {
    expect(setsByMuscle([{ ex: "Bench Press (Barbell)", sets: 4 }], musclesOf)).toEqual({ "Göğüs": 4, "Ön Omuz": 2, "Triceps": 2 });
  });
  it("sıralama: en iyiler, sonra ana, sonra yardımcı; çok yapılan önce", () => {
    const r = rankForMuscle("Göğüs", Object.keys(M), musclesOf, { "Dumbbell Fly": 3 });
    expect(r).toEqual([
      { name: "Bench Press (Barbell)", kind: "best" }, { name: "Cable Crossover", kind: "best" },
      { name: "Dumbbell Fly", kind: "ana" }, { name: "Close-Grip Bench Press", kind: "yardimci" },
    ]);
  });
  it("tek antrenman kademeleri ve kas başına dağılım", () => {
    expect([0, 3, 4, 8, 9, 11, 12].map(sessionTier)).toEqual(["yok", "hafif", "ideal", "ideal", "yuksek", "yuksek", "asiri"]);
    const b = sessionBreakdown([{ ex: "Bench Press (Barbell)", sets: 4 }, { ex: "Close-Grip Bench Press", sets: 3 }], musclesOf);
    expect(b[0]).toEqual({ muscle: "Göğüs", sets: 5.5, from: [{ ex: "Bench Press (Barbell)", sets: 4 }, { ex: "Close-Grip Bench Press", sets: 1.5 }] });
  });
});
