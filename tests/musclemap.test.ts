import { describe, it, expect } from "vitest";
import { EVIDENCE, MUSCLES, WEIGHTS, SUMMARY, fatigueTier, loadTier, rankForMuscle, sessionBreakdown, sessionTier, setsByMuscle } from "../src/core/musclemap.ts";
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
  it("araştırma verisi: hareketler kütüphanede, paylar 0–1, her kasın kanıt grupları ve özeti var", () => {
    expect(Object.keys(WEIGHTS).filter(n => !allNames.has(n))).toEqual([]);
    expect(Object.values(EVIDENCE).flat().flatMap(g => g.ex).filter(n => !allNames.has(n))).toEqual([]);
    expect(Object.values(WEIGHTS).flatMap(w => Object.entries(w)).filter(([m, v]) => !MUSCLES.includes(m) || !(v > 0 && v <= 1))).toEqual([]);
    expect(MUSCLES.filter(m => !EVIDENCE[m]?.length || !SUMMARY[m])).toEqual([]);
  });
  it("araştırma düzeltmeleri: bilek hareketi trapez değil, tibialis baldır değil, squat iç bacağı ve kalçayı çalıştırır", () => {
    expect(WEIGHTS["Wrist Curl"]["Trapez"]).toBeUndefined();
    expect(WEIGHTS["Tibialis Raise"]?.["Baldır"]).toBeUndefined();
    expect(WEIGHTS["Back Squat"]["Kalça"]).toBeGreaterThanOrEqual(.75);
    expect(WEIGHTS["Back Squat"]["İç Bacak"]).toBeGreaterThan(0);
  });
  it("haftalık set kademeleri", () => {
    expect([0, 2, 3.5, 4, 10, 10.5, 18, 19].map(loadTier)).toEqual(["yok", "baslangic", "baslangic", "verimli", "verimli", "orta", "orta", "dusukverim"]);
  });
  it("yorgunluk kademeleri: ağır günden sonra aşırı yorgun", () => {
    const r = (pct: number, sets: number) => ({ date: "2026-01-01", sets, fail: false, hrs: 0, need: 48, pct });
    expect(fatigueTier(undefined)).toBe("yok");
    expect(fatigueTier(r(1, 20))).toBe("hazir");
    expect(fatigueTier(r(.6, 20))).toBe("toparlaniyor");
    expect(fatigueTier(r(.2, 6))).toBe("yorgun");
    expect(fatigueTier(r(.2, 12))).toBe("asiri");
  });
  it("set sayımı: pay yoksa ana kas tam, yardımcı yarım; pay varsa set × pay", () => {
    expect(setsByMuscle([{ ex: "Bench Press (Barbell)", sets: 4 }], musclesOf)).toEqual({ "Göğüs": 4, "Ön Omuz": 2, "Triceps": 2 });
    const w = () => ({ p: ["Göğüs"], s: ["Ön Omuz"], w: { "Göğüs": 1, "Ön Omuz": .6, "Triceps": .1 } });
    expect(setsByMuscle([{ ex: "x", sets: 5 }], w)).toEqual({ "Göğüs": 5, "Ön Omuz": 3, "Triceps": .5 });
  });
  it("sıralama: önce kanıt grupları (eşit seçenekler), sonra ana, sonra yardımcı (payı büyük önce)", () => {
    const r = rankForMuscle("Göğüs", Object.keys(M), musclesOf, { "Dumbbell Fly": 3 });
    expect(r.map(x => [x.name, x.kind])).toEqual([
      ["Bench Press (Barbell)", "kanit"], ["Dumbbell Fly", "kanit"], ["Cable Crossover", "kanit"], ["Close-Grip Bench Press", "yardimci"],
    ]);
    expect(r[0].level).toBe(EVIDENCE["Göğüs"][0].level);
  });
  it("tek antrenman kademeleri ve kas başına dağılım", () => {
    expect([0, 0.5, 1, 1.5, 2, 2.5, 3, 5.5, 6, 11, 12].map(sessionTier)).toEqual(["yok", "dusuk", "koruma", "koruma", "minimum", "minimum", "iyi", "iyi", "maksimum", "maksimum", "hasar"]);
    const b = sessionBreakdown([{ ex: "Bench Press (Barbell)", sets: 4 }, { ex: "Close-Grip Bench Press", sets: 3 }], musclesOf);
    expect(b[0]).toEqual({ muscle: "Göğüs", sets: 5.5, from: [{ ex: "Bench Press (Barbell)", sets: 4 }, { ex: "Close-Grip Bench Press", sets: 1.5 }] });
  });
});
