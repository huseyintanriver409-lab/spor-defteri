import { describe, it, expect } from "vitest";
import { computeStreak, earnedBadges, nextBadge } from "../src/core/streak.ts";

const TUE = new Date(2026, 10, 3, 15, 30); // 3 Kasım 2026 salı, öğleden sonra
const PLAN = ["MO", "WE", "FR"];

describe("plana göre seri", () => {
  it("dinlenme günleri seriyi bozmaz, gün sayılır; bugün plan dışıysa risk yok", () => {
    const r = computeStreak(["2026-10-26", "2026-10-28", "2026-10-30", "2026-11-02"], PLAN, 3, TUE);
    expect(r).toMatchObject({ days: 8, best: 8, start: "2026-10-26", doneToday: false, atRisk: false, frozen: [], freezesLeft: 2, mode: "plan" });
  });

  it("kaçırılan planlı gün dondurmayla kurtarılır", () => {
    const r = computeStreak(["2026-10-26", "2026-10-30", "2026-11-02"], PLAN, 3, TUE);
    expect(r.days).toBe(8);
    expect(r.frozen).toEqual(["2026-10-28"]);
    // dondurma ay başına: kasımda hâlâ 2 tane var
    expect(r.freezesLeft).toBe(2);
  });

  it("ayın dondurmaları bitince seri kırılır; en uzun seri saklanır", () => {
    const r = computeStreak(["2026-10-12", "2026-10-21", "2026-10-23", "2026-10-26", "2026-10-28", "2026-10-30", "2026-11-02"], PLAN, 3, TUE);
    expect(r.frozen).toEqual(["2026-10-14", "2026-10-16"]);
    expect(r.start).toBe("2026-10-21");
    expect(r.days).toBe(13);
    expect(r.best).toBe(13);
  });

  it("plan dışı günde yapılan antrenman da seriyi sürdürür; bugün yapıldıysa bugün sayılır", () => {
    const r = computeStreak(["2026-11-01", "2026-11-02", "2026-11-03"], PLAN, 3, TUE);
    expect(r).toMatchObject({ days: 3, doneToday: true, atRisk: false });
  });

  it("bugün planlı gün ve yapılmadıysa risk; seri dünkü haliyle görünür", () => {
    const wed = new Date(2026, 10, 4, 9);
    expect(computeStreak(["2026-11-02"], PLAN, 3, wed)).toMatchObject({ days: 2, atRisk: true });
    expect(computeStreak([], PLAN, 3, wed)).toMatchObject({ days: 0, best: 0, start: "" });
  });

  it("uzun aradan sonra eski seri en uzun olarak kalır", () => {
    const r = computeStreak(["2026-09-07", "2026-09-09", "2026-09-11", "2026-11-02"], PLAN, 3, TUE);
    expect(r.days).toBe(1);
    expect(r.best).toBe(11); // 7-17 Eylül: iki dondurma, 18 Eylül üçüncü kaçırmada kırıldı
  });
});

describe("plansız: haftalık hedef serisi", () => {
  it("hedefin tutturulduğu haftalar seriyi sürdürür; eksik hafta dondurulur", () => {
    const r = computeStreak(["2026-10-19", "2026-10-21", "2026-10-23", "2026-10-27", "2026-11-02"], [], 3, TUE);
    expect(r.mode).toBe("week");
    expect(r.frozen).toEqual(["2026-10-26"]);
    expect(r).toMatchObject({ start: "2026-10-19", days: 15 });
  });

  it("zincirin başladığı yarım hafta sayılmaz", () => {
    expect(computeStreak(["2026-10-29", "2026-10-31"], [], 3, TUE)).toMatchObject({ days: 5, frozen: [] });
  });

  it("haftanın hedefine yetişmek için bugün gerekiyorsa risk", () => {
    expect(computeStreak(["2026-11-02"], [], 3, TUE).atRisk).toBe(false);
    expect(computeStreak(["2026-11-02"], [], 7, TUE).atRisk).toBe(true);
  });
});

describe("rozetler", () => {
  it("en uzun seriye göre kazanılır", () => {
    expect(earnedBadges(31)).toEqual([7, 14, 30]);
    expect(nextBadge(31)).toBe(60);
    expect(nextBadge(400)).toBeNull();
  });
});
