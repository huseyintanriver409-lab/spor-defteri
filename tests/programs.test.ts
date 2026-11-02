import { describe, it, expect } from "vitest";
import { PROGRAMS, recommend, weeklyPlan, PLAN_DAYS, type Answers, type Level, type Goal, type Equip } from "../src/core/programs.ts";
import { LIB } from "../src/core/library.ts";

const allNames = new Set(Object.values(LIB).flat());

describe("hazır programlar", () => {
  it("her programdaki her hareket uygulamanın kütüphanesinde var", () => {
    const missing = PROGRAMS.flatMap(p => p.sessions.flatMap(s => s.items.filter(([ex]) => !allNames.has(ex)).map(([ex]) => `${p.name}: ${ex}`)));
    expect(missing).toEqual([]);
  });

  it("kimlikler benzersiz; her programda seans, ilerleme, takılma ve kaynak bilgisi var", () => {
    expect(new Set(PROGRAMS.map(p => p.id)).size).toBe(PROGRAMS.length);
    for (const p of PROGRAMS) {
      expect(p.sessions.length, p.id).toBeGreaterThan(0);
      expect(p.progression.length, p.id).toBeGreaterThan(0);
      expect(p.stall, p.id).not.toBe("");
      expect(p.source, p.id).not.toBe("");
      for (const s of p.sessions) for (const [, sets, reps] of s.items) {
        expect(sets).toBeGreaterThan(0);
        expect(reps).toMatch(/^\d+(-\d+)?$/);
      }
    }
  });

  it("haftalık plan, desteklenen her gün sayısında doğru sayıda güne yerleşir ve var olan seanslara işaret eder", () => {
    for (const p of PROGRAMS) for (const d of p.days) {
      const plan = weeklyPlan(p, d);
      expect(plan.map(([c]) => c)).toEqual(PLAN_DAYS[d]);
      for (const [, i] of plan) expect(p.sessions[i], `${p.id} ${d}`).toBeDefined();
    }
  });

  it("Üst/Alt 4 günde Üst, Alt, Üst, Alt; PPL 6 günde iki tur", () => {
    const ua = PROGRAMS.find(p => p.id === "ust-alt")!;
    expect(weeklyPlan(ua, 4).map(([, i]) => ua.sessions[i].name)).toEqual(["Üst", "Alt", "Üst", "Alt"]);
    const ppl = PROGRAMS.find(p => p.id === "ppl")!;
    expect(weeklyPlan(ppl, 6).map(([, i]) => ppl.sessions[i].name)).toEqual(["Push", "Pull", "Legs", "Push", "Pull", "Legs"]);
  });
});

describe("program önerisi", () => {
  const levels: Level[] = ["yeni", "orta", "ileri"], goals: Goal[] = ["genel", "kas", "guc"], equips: Equip[] = ["salon", "ev", "yok"];
  const all: Answers[] = levels.flatMap(level => goals.flatMap(goal => equips.flatMap(equip => [2, 3, 4, 5, 6].map(days => ({ level, goal, equip, days })))));

  it("her cevap birleşiminde geçerli bir program, desteklenen bir gün sayısı ve en az bir gerekçe verir", () => {
    for (const a of all) {
      const r = recommend(a);
      expect(r.program.days, JSON.stringify(a)).toContain(r.days);
      expect(r.reasons.length).toBeGreaterThan(0);
      for (const alt of r.alternatives) {
        expect(alt.program.id).not.toBe(r.program.id);
        expect(alt.program.days).toContain(alt.days);
      }
    }
  });

  it("ekipmana uyar: ekipmansıza barbell programı, eve salon programı önermez", () => {
    for (const a of all) {
      const r = recommend(a);
      if (a.equip === "yok") expect(r.program.equip).toBe("yok");
      if (a.equip === "ev") expect(r.program.equip).toBe("ev");
      if (a.equip === "salon") expect(r.program.equip).toBe("salon");
    }
  });

  it("yeni başlayana orta/ileri seviye programı önermez", () => {
    for (const a of all.filter(x => x.level === "yeni")) expect(recommend(a).program.levels, JSON.stringify(a)).toContain("yeni");
  });

  it("yaygın durumlar", () => {
    expect(recommend({ level: "yeni", goal: "genel", equip: "salon", days: 3 }).program.id).toBe("baslangic-tam");
    expect(recommend({ level: "yeni", goal: "guc", equip: "salon", days: 3 }).program.id).toBe("5x5");
    expect(recommend({ level: "yeni", goal: "guc", equip: "salon", days: 2 }).program.id).toBe("3x5");
    expect(recommend({ level: "orta", goal: "kas", equip: "salon", days: 4 }).program.id).toBe("ust-alt");
    expect(recommend({ level: "ileri", goal: "kas", equip: "salon", days: 6 }).program.id).toBe("ppl");
    expect(recommend({ level: "orta", goal: "guc", equip: "salon", days: 3 }).program.id).toBe("gzclp");
  });

  it("yeni başlayan 5-6 gün isterse daha az gün ve kardiyo önerir", () => {
    const r = recommend({ level: "yeni", goal: "genel", equip: "salon", days: 6 });
    expect(r.days).toBeLessThanOrEqual(3);
    expect(r.reasons.join(" ")).toMatch(/kardiyo/i);
  });

  it("her öneri haftalık kardiyo hatırlatması içerir", () => {
    for (const a of all) expect(recommend(a).reasons.some(x => /150 dk/.test(x))).toBe(true);
  });
});
