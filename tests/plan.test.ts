import { describe, it, expect } from "vitest";
import { dropProgram, fillWeek, keepRotation, progIdOn, startRotation, type Plan } from "../src/core/plan.ts";
import { plannedDates, planSignature } from "../src/core/calendar.ts";

// 5 Kasım 2026 Perşembe; o haftanın pazartesisi 2 Kasım
const THU = new Date(2026, 10, 5);
const days = (...codes: string[]) => Object.fromEntries(codes.map(c => [c, { prog: "A", time: "19:00" }]));
const rotPlan = (over: Partial<Plan> = {}): Plan => ({ days: days("MO", "WE", "FR"), dur: 60, remind: 30, mode: "rot", rot: ["A", "B"], anchor: "2026-11-02", shift: 0, ...over });
const week = (p: Plan, mon: string) => {
  const d = new Date(mon), out: string[] = [];
  for (const off of [0, 2, 4]) { const x = new Date(d); x.setDate(d.getDate() + off); out.push(progIdOn(p, x.toISOString().slice(0, 10))!); }
  return out.join("");
};
const progs = [{ id: "A", name: "Full Body · A", items: [] }, { id: "B", name: "Full Body · B", items: [] }];

describe("sırayla plan", () => {
  it("3 gün, A ve B: hafta hafta ABA, BAB", () => {
    const p = rotPlan();
    expect(week(p, "2026-11-02")).toBe("ABA");
    expect(week(p, "2026-11-09")).toBe("BAB");
    expect(week(p, "2026-11-16")).toBe("ABA");
    // başlangıçtan önceki haftalar da tutarlı
    expect(week(p, "2026-10-26")).toBe("BAB");
    expect(progIdOn(p, "2026-11-03")).toBeNull();
  });

  it("sabit planda her gün kendi programı", () => {
    const p: Plan = { days: { MO: { prog: "A" }, WE: { prog: "B" } }, dur: 60, remind: 30 };
    expect(progIdOn(p, "2026-11-02")).toBe("A");
    expect(progIdOn(p, "2026-11-11")).toBe("B");
  });

  it("başlatınca sıradaki antrenman günü istenen programı alır", () => {
    // perşembe: sıradaki gün cuma
    const p = startRotation(rotPlan({ anchor: "", shift: 5 }), THU, "B");
    expect(progIdOn(p, "2026-11-06")).toBe("B");
    expect(progIdOn(p, "2026-11-09")).toBe("A");
    // bu haftanın programları eski sürümler için days'e yazılır
    expect([p.days.MO.prog, p.days.WE.prog, p.days.FR.prog]).toEqual(["B", "A", "B"]);
  });

  it("gün eklenince sıra kopmaz: sıradaki antrenman aynı kalır", () => {
    const prev = rotPlan();
    expect(progIdOn(prev, "2026-11-06")).toBe("A");
    const next = { ...prev, days: days("MO", "TU", "WE", "FR") };
    keepRotation(next, prev, THU);
    expect(progIdOn(next, "2026-11-06")).toBe("A");
    expect(progIdOn(next, "2026-11-09")).toBe("B");
  });

  it("takvim tarihleri ve imza sıraya göre", () => {
    const p = rotPlan({ until: "2026-11-13" });
    expect(plannedDates(p, progs, THU).map(x => x.date + x.p.id)).toEqual(["2026-11-06A", "2026-11-09B", "2026-11-11A", "2026-11-13B"]);
    expect(planSignature(p, progs)).not.toBe(planSignature({ ...p, shift: 1 }, progs));
    // sabit planın imzası eskisiyle aynı biçimde kalır (takvim boşuna yeniden yazılmaz)
    const fixed: Plan = { days: { MO: { prog: "A", time: "19:00" } }, dur: 60, remind: 30 };
    expect(planSignature(fixed, progs)).not.toContain("rot");
  });

  it("sıradaki program silinince sıra kalan programla sürer; sıra boşalınca plan boşalır", () => {
    const p = rotPlan();
    expect(dropProgram(p, "B", THU)).toEqual([]);
    expect(p.rot).toEqual(["A"]);
    expect(week(p, "2026-11-09")).toBe("AAA");
    expect(dropProgram(p, "A", THU)).toEqual(["MO", "WE", "FR"]);
    expect(p.days).toEqual({});
  });

  it("fillWeek sırayla planı bu haftanın sabit karşılığına çevirir", () => {
    const p = fillWeek(rotPlan({ shift: 1 }), THU);
    expect([p.days.MO.prog, p.days.WE.prog, p.days.FR.prog]).toEqual(["B", "A", "B"]);
  });
});
