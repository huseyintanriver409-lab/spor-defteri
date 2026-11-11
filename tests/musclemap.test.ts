import { describe, it, expect } from "vitest";
import { EVIDENCE, MUSCLES, WEIGHTS, SUMMARY, STRETCH, SESSION_TIER_LIMITS, SESSION_RISK_LIMIT, STRETCH_FACTOR, sessionLoad, fatigueTier, loadTier, rankForMuscle, sessionBreakdown, sessionTier, setsByMuscle } from "../src/core/musclemap.ts";
import { LIB } from "../src/core/library.ts";
import { PROGRAMS } from "../src/core/programs.ts";
import tr from "../src/i18n/tr/muscles.ts";
import en from "../src/i18n/en/muscles.ts";

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
    expect([0, .99, 1, 2.99, 3, 4.99, 5, 7.99, 8, 12.5, 12.51, -1, NaN].map(n => sessionTier(n))).toEqual(["yok", "dusuk", "koruma", "koruma", "minimum", "minimum", "iyi", "iyi", "maksimum", "maksimum", "hasar", "yok", "yok"]);
    const b = sessionBreakdown([{ ex: "Bench Press (Barbell)", sets: 4 }, { ex: "Close-Grip Bench Press", sets: 3 }], musclesOf);
    expect(b[0]).toEqual({ muscle: "Göğüs", sets: 5.5, risk: 5.5, baseTier: "iyi", tier: "iyi", from: [{ ex: "Bench Press (Barbell)", sets: 4, share: 1, stretch: false }, { ex: "Close-Grip Bench Press", sets: 1.5, share: .5, stretch: false }] });
  });
  const realMuscles = (ex: string) => ({ p: [], s: [], w: WEIGHTS[ex] || {} });
  it("uzamış pozisyon tablosu yalnız gerçek hareket ve pozitif kas payı içerir", () => {
    for (const [ex, muscles] of Object.entries(STRETCH)) {
      expect(allNames.has(ex), ex).toBe(true);
      expect(WEIGHTS[ex], ex).toBeDefined();
      for (const muscle of muscles) expect(WEIGHTS[ex][muscle], ex + muscle).toBeGreaterThan(0);
    }
  });
  it("risk seanstaki tüm hareketlerden toplanır; ana kasın üç seti minimumdur", () => {
    const h = sessionLoad([{ ex: "Deadlift", sets: 5 }, { ex: "Romanian Deadlift", sets: 7 }], realMuscles).Hamstring;
    expect(h.sets).toBe(9.5); expect(h.risk).toBe(13); expect(h.baseTier).toBe("maksimum"); expect(h.tier).toBe("hasar");
    expect(sessionLoad([{ ex: "Romanian Deadlift", sets: 7 }], realMuscles).Hamstring.tier).toBe("iyi");
    expect(sessionLoad([{ ex: "Bench Press (Barbell)", sets: 3 }], realMuscles)["Göğüs"].tier).toBe("minimum");
    expect(STRETCH_FACTOR).toBe(1.5); expect(SESSION_RISK_LIMIT).toBe(12.5);
    expect(sessionTier(8, 12.5 + 1e-10)).toBe("maksimum");
    expect(sessionTier(3 - 1e-10)).toBe("minimum");
  });
  it("tüm hazır program günleri mor olmayan yük taşır", () => {
    for (const p of PROGRAMS) for (const day of p.sessions) {
      const load = sessionLoad(day.items.map(([ex, sets]) => ({ ex, sets })), realMuscles);
      expect(Object.entries(load).filter(([, row]) => row.tier === "hasar"), p.id + ":" + day.name).toEqual([]);
    }
  });
  it("StrongLifts benzeri gün en az üç kademe taşır, mor yoktur", () => {
    const tiers = Object.values(sessionLoad(["Back Squat", "Bench Press (Barbell)", "Barbell Row"].map(ex => ({ ex, sets: 5 })), realMuscles)).map(x => x.tier);
    expect(new Set(tiers).size).toBeGreaterThanOrEqual(3); expect(tiers).not.toContain("hasar");
  });
  it("yinelenen hareket birleşir; katkı toplamları etkili set ve riskle tutarlıdır", () => {
    const load = sessionLoad([{ ex: "Romanian Deadlift", sets: 2 }, { ex: "Romanian Deadlift", sets: 3 }, { ex: "Deadlift", sets: 1 }], realMuscles);
    for (const row of Object.values(load)) {
      expect(row.from.reduce((a, x) => a + x.sets, 0)).toBeCloseTo(row.sets);
      expect(row.from.reduce((a, x) => a + x.sets * (x.stretch ? STRETCH_FACTOR : 1), 0)).toBeCloseTo(row.risk);
      expect(new Set(row.from.map(x => x.ex)).size).toBe(row.from.length);
    }
    expect(load.Hamstring.from[0].sets).toBe(5);
    expect(sessionLoad([{ ex: "Deadlift", sets: 0 }, { ex: "Deadlift", sets: NaN }, { ex: "Deadlift", sets: -1 }], realMuscles)).toEqual({});
  });
  it("verilen kullanıcı payları hareketin araştırma payını geçersiz kılar", () => {
    const userMuscles = (ex: string) => ex === "Deadlift" ? { p: ["Biceps"], s: [], w: { Biceps: 1 } } : realMuscles(ex);
    expect(Object.keys(sessionLoad([{ ex: "Deadlift", sets: 3 }], userMuscles))).toEqual(["Biceps"]);
  });
  it("iki dilde aralıklar hesap sabitleriyle tutarlıdır", () => {
    expect(SESSION_TIER_LIMITS).toEqual([1, 3, 5, 8]);
    for (const dict of [tr, en]) {
      for (const [tier, range] of [["koruma", "1–3"], ["minimum", "3–5"], ["iyi", "5–8"], ["maksimum", "8+"]]) expect(dict["session_" + tier + "_d"]).toContain(range);
    }
    expect(tr.session_iyi).toBe("Yüksek gelişim"); expect(en.session_iyi).toBe("High growth");
  });
});
