import { describe, expect, it } from "vitest";
import { groupWeek, planWeek, presetWeek, programGroup, weeklyLoad } from "../src/core/weekly-load.ts";
import { programById } from "../src/core/programs.ts";
import { sessionLoad, WEIGHTS } from "../src/core/musclemap.ts";
import type { Plan } from "../src/core/plan.ts";

const musclesOf = (ex: string) => ({ p: [], s: [], w: WEIGHTS[ex] || {} });
const simple = () => ({ p: ["main"], s: ["assist"] });
const programs = [
  { id: "a", name: "Full Body · A", items: [{ ex: "a", sets: 2 }] },
  { id: "b", name: "Full Body · B", items: [{ ex: "b", sets: 4 }] },
  { id: "c", name: "Other", items: [{ ex: "c", sets: 10 }] },
];
const fixed: Plan = { days: { MO: { prog: "a" }, TH: { prog: "b" } }, dur: 60, remind: 0 };

describe("weekly totals", () => {
  it("preserves fractional shares and divides only after summation", () => {
    expect(weeklyLoad([[{ ex: "a", sets: 3 }], [{ ex: "b", sets: 2 }]], simple, 2)).toEqual({ main: 2.5, assist: 1.25 });
    expect(() => weeklyLoad([], simple, 0)).toThrow(RangeError);
  });
});

describe("Beginner Full Body", () => {
  const p = programById("baslangic-tam")!;
  const days = p.sessions.map(s => s.items.map(([ex, sets]) => ({ ex, sets })));
  const sum = Object.fromEntries(Object.keys(weeklyLoad(days, musclesOf)).map(m => [m, days.reduce((n, day) => n + (sessionLoad(day, musclesOf)[m]?.sets || 0), 0)]));
  it("two days counts A+B once", () => {
    expect(presetWeek(p, 2, musclesOf)).toEqual({ load: sum, weeks: 1, averaged: false });
  });
  it("three days averages ABA + BAB over two weeks", () => {
    const result = presetWeek(p, 3, musclesOf);
    expect(result.weeks).toBe(2); expect(result.averaged).toBe(true);
    for (const [m, n] of Object.entries(sum)) expect(result.load[m]).toBeCloseTo(n * 1.5);
  });
  it("honors explicit preset rotation", () => {
    const result = presetWeek({ ...p, rotation: { 3: [0, 1, 0] } }, 3, musclesOf);
    expect(result.weeks).toBe(1); expect(result.averaged).toBe(false);
    expect(result.load).toEqual(weeklyLoad([days[0], days[1], days[0]], musclesOf));
  });
});

describe("planned and grouped weeks", () => {
  it("fixed plans start on Monday and can filter groups", () => {
    expect(planWeek(fixed, programs, "2026-11-13", simple)).toEqual({ load: { main: 6, assist: 3 }, weeks: 1, averaged: false });
    expect(planWeek(fixed, programs, "2026-11-13", simple, ["a"])?.load).toEqual({ main: 2, assist: 1 });
    expect(planWeek(fixed, programs, "2026-11-13", simple, ["c"])).toBeNull();
  });
  it("averages rotating plans and respects shift", () => {
    const rot: Plan = { ...fixed, days: { MO: { prog: "a" }, WE: { prog: "b" }, FR: { prog: "a" } }, mode: "rot", rot: ["a", "b"], anchor: "2026-11-09", shift: 1 };
    expect(planWeek(rot, programs, "2026-11-13", simple)).toEqual({ load: { main: 9, assist: 4.5 }, weeks: 2, averaged: true });
    expect(planWeek(rot, programs, "2026-11-13", simple, ["a"])?.load.main).toBe(3);
  });
  it("returns null after until and with no valid days", () => {
    expect(planWeek({ ...fixed, until: "2026-11-12" }, programs, "2026-11-13", simple)).toBeNull();
    expect(planWeek({ ...fixed, days: {} }, programs, new Date(2026, 10, 13), simple)).toBeNull();
    expect(planWeek(fixed, [], "2026-11-13", simple)).toBeNull();
  });
  it("does not count beyond until inside a week", () => {
    expect(planWeek({ ...fixed, until: "2026-11-11" }, programs, "2026-11-09", simple)?.load.main).toBe(2);
  });
  it("groups only matching delimited prefixes", () => {
    expect(programGroup(programs, "a")).toEqual(["a", "b"]);
    expect(programGroup(programs, "c")).toEqual(["c"]);
    expect(programGroup(programs, "missing")).toEqual([]);
    expect(programGroup([...programs, { ...programs[0], id: "d", name: "Full Body" }], "a")).toEqual(["a", "b"]);
  });
  it("single day repeats three times", () => {
    expect(groupWeek(programs, ["a"], simple)).toEqual({ load: { main: 6, assist: 3 }, weeks: 1, averaged: false, perWeek: 3 });
  });
  it("four days each occur once", () => {
    const four = [...programs, { ...programs[0], id: "d" }];
    expect(groupWeek(four, four.map(p => p.id), simple)).toEqual({ load: { main: 18, assist: 9 }, weeks: 1, averaged: false, perWeek: 4 });
  });
  it("averages two group sessions with repeated ids", () => {
    expect(groupWeek(programs, ["a", "b", "a"], simple)).toEqual({ load: { main: 9, assist: 4.5 }, weeks: 2, averaged: true, perWeek: 3 });
    expect(groupWeek(programs, [], simple).load).toEqual({});
  });
});
