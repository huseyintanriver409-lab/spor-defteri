import { describe, it, expect } from "vitest";
import { work, volume, e1rm, warmupSets, platesFor, liftScore, repRange, overloadDecision } from "../src/core/training.ts";

describe("hacim ve 1RM", () => {
  it("ısınma setleri hacme girmez, metin değerler sayıya çevrilir", () => {
    const sets = [{ w: 40, r: 10, t: "w" }, { w: 100, r: 5 }, { w: "100", r: "4" }];
    expect(work(sets)).toHaveLength(2);
    expect(volume(sets)).toBe(900);
  });

  it("Epley 1RM: tek tekrar kilonun kendisi, 0 tekrar 0", () => {
    expect(e1rm(100, 1)).toBe(100);
    expect(e1rm(100, 0)).toBe(0);
    expect(e1rm(100, 5)).toBeCloseTo(116.67, 2);
  });
});

describe("ısınma setleri", () => {
  it("barbell: boş bar ve %40/60/80, 2,5 kg'a yuvarlı", () => {
    expect(warmupSets(100, 20)).toEqual([{ w: 20, r: 10 }, { w: 40, r: 5 }, { w: 60, r: 3 }, { w: 80, r: 2 }]);
  });

  it("dumbbell: %50 ve %75", () => {
    expect(warmupSets(30, 0)).toEqual([{ w: 15, r: 8 }, { w: 22.5, r: 4 }]);
  });

  it("hafif kiloda tekrar eden ya da bardan hafif basamaklar atlanır", () => {
    expect(warmupSets(24, 20)).toEqual([]);
    expect(warmupSets(40, 20)).toEqual([{ w: 20, r: 10 }, { w: 25, r: 3 }, { w: 32.5, r: 2 }]);
  });
});

describe("plakalar", () => {
  const all = [25, 20, 15, 10, 5, 2.5, 1.25];
  it("bir tarafı büyükten küçüğe doldurur", () => {
    expect(platesFor(41.25, all)).toEqual({ used: [25, 15, 1.25], rest: 0 });
  });

  it("salonda olmayan plakayı kullanmaz, kalanı bildirir", () => {
    const r = platesFor(17.5, [20, 10, 5]);
    expect(r.used).toEqual([10, 5]);
    expect(r.rest).toBeCloseTo(2.5);
  });
});

describe("güç puanı", () => {
  const t = [0.75, 1.25, 1.5, 2.25, 2.75];
  it("eşiklerde seviye atlar, ara değerleri doğrusal puanlar", () => {
    expect(liftScore(0.375, t)).toEqual({ s: 10, lv: 0 });
    expect(liftScore(1.25, t)).toEqual({ s: 40, lv: 2 });
    expect(liftScore(1.375, t)).toEqual({ s: 50, lv: 2 });
    expect(liftScore(3, t)).toEqual({ s: 100, lv: 5 });
  });
});

describe("tekrar aralığı", () => {
  it("program metninden alt ve üst sınırı çıkarır", () => {
    expect(repRange("8-12")).toEqual({ lo: 8, hi: 12 });
    expect(repRange("10")).toEqual({ lo: 10, hi: 10 });
    expect(repRange("")).toEqual({ lo: "", hi: "" });
    expect(repRange(undefined)).toEqual({ lo: "", hi: "" });
  });
});

describe("kademeli yüklenme", () => {
  const range = repRange("6-8");
  const s = (w: number, r: number, rir?: number) => ({ w, r, rir });

  it("bütün setlerde üst sınıra ulaşıldıysa kilo artar", () => {
    const d = overloadDecision([s(80, 8), s(80, 8), s(80, 8)], 3, range, false);
    expect(d).toMatchObject({ hitTop: true, increase: true, hard: false });
  });

  it("üst sınıra ulaşılmadı ama hepsi rahat (RIR 3+) geçtiyse kilo artar", () => {
    const d = overloadDecision([s(80, 6, 3), s(80, 7, 4), s(80, 6, 3)], 3, range, false);
    expect(d).toMatchObject({ hitTop: false, easy: true, increase: true });
  });

  it("RIR bilinmiyorsa rahat sayılmaz", () => {
    expect(overloadDecision([s(80, 6), s(80, 7), s(80, 6)], 3, range, false).increase).toBe(false);
  });

  it("tükenip alt sınırın altında kalınca aynı kilo önerilir", () => {
    const d = overloadDecision([s(80, 6, 1), s(80, 5, 0), s(80, 4, 0)], 3, range, false);
    expect(d).toMatchObject({ hard: true, increase: false });
  });

  it("önceki seansta yeterli set yoksa ya da kilo girilmemişse karar verilmez", () => {
    expect(overloadDecision([s(80, 8), s(80, 8)], 3, range, false).full).toBe(false);
    expect(overloadDecision([s(0, 8), s(80, 8), s(80, 8)], 3, range, false).full).toBe(false);
  });

  it("yalnız ilk `sets` set değerlendirilir; fazladan setler kararı bozmaz", () => {
    expect(overloadDecision([s(80, 8), s(80, 8), s(80, 8), s(60, 3)], 3, range, false).increase).toBe(true);
  });

  it("kardiyoda ve tekrar hedefi yoksa kademeli yüklenme yok", () => {
    expect(overloadDecision([s(30, 5), s(30, 5), s(30, 5)], 3, range, true).full).toBe(false);
    expect(overloadDecision([s(80, 8), s(80, 8), s(80, 8)], 3, repRange(""), false).full).toBe(false);
  });

  it("formdan metin olarak gelen değerlerle de çalışır", () => {
    const d = overloadDecision([{ w: "80", r: "8" }, { w: "80", r: "8" }, { w: "80", r: "8" }], 3, range, false);
    expect(d.increase).toBe(true);
  });
});
