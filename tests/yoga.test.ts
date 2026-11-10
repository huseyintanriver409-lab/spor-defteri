import { exerciseRestSeconds } from "../src/core/rest.ts";
import { describe, it, expect } from "vitest";
import { LIB, YOGA, CARDIO, isUnilateral } from "../src/core/library.ts";
import { timedExercise, work, volume } from "../src/core/training.ts";
import { completeSide, pendingSide, type SideWorkout } from "../src/core/unilateral.ts";
import { DEFAULTS, withDefaults } from "../src/core/schema.ts";
import { autoYogaHold, recordAllowed, programVisible, sportGroup, activityDates, calendarLoad, practiceSeconds } from "../src/core/yoga.ts";
import { computeWeekStreak } from "../src/core/streak.ts";
const groupOf = (ex: string) => Object.keys(LIB).find(g => LIB[g].includes(ex)) || "Diğer";
describe("timed yoga flow", () => {
  it("defaults to zero, preserves preferences and sport rest", () => {
    expect(exerciseRestSeconds({ ex: "Pose", yoga: true }, 90, false)).toBe(0);
    expect(exerciseRestSeconds({ ex: "Pose", yoga: true }, 90, false, 45)).toBe(45);
    expect(exerciseRestSeconds({ ex: "Pose", yoga: true }, 90, false, 0)).toBe(0);
    expect(exerciseRestSeconds({ ex: "Press", yoga: false }, 90, false)).toBe(90);
    expect(exerciseRestSeconds({ ex: "Press", yoga: false }, 90, false, 0)).toBe(0);
    expect(exerciseRestSeconds({ ex: "Press", yoga: false }, 90, false, 120)).toBe(120);
  });
  it("continues natural and manual zero-rest holds to unfinished timed yoga", () => {
    expect(autoYogaHold(true, true, 0, true, true, true)).toBe(true);
    expect(autoYogaHold(true, true, 30, true, true, true)).toBe(false);
    expect(autoYogaHold(false, true, 0, true, true, true)).toBe(false);
    expect(autoYogaHold(true, true, 0, false, true, true)).toBe(false);
    expect(autoYogaHold(true, true, 0, true, false, true)).toBe(false);
    expect(autoYogaHold(true, true, 0, true, true, false)).toBe(false);
  });
  it("pairs timed left/right into one set and sums both holds after reload", () => {
    let live: SideWorkout = {};
    const ex = "Warrior II";
    expect(timedExercise(ex, false, true)).toBe(true);
    expect(completeSide(live, ex, 0, { sec: 30, r: 0, w: 0 })).toBeNull();
    live = JSON.parse(JSON.stringify(live));
    expect(pendingSide(live, ex, 0)?.first.sec).toBe(30);
    const pair = completeSide(live, ex, 0, { sec: 25, r: 0, w: 0 })!;
    expect(work([pair])).toHaveLength(1);
    expect(pendingSide(live, ex, 1)).toBeUndefined();
    expect(practiceSeconds([pair])).toBe(55);
    expect(completeSide(live, ex, 1, { sec: 30 })).toBeNull();
  });
  it.each(["Warrior I", "Warrior II", "Reverse Warrior", "Triangle Pose", "Extended Side Angle", "Half Moon", "Tree Pose", "Low Lunge", "Pigeon Pose", "Supine Twist", "Hamstring Stretch", "Quad Stretch", "Hip Flexor Stretch", "Shoulder Stretch", "Chest Stretch"])("restores %s", ex => {
    expect(LIB[YOGA]).toContain(ex); expect(isUnilateral(ex)).toBe(true);
  });
  it.each(["Downward Dog", "Child's Pose", "Cobra Pose", "Mountain Pose"])("keeps symmetric %s", ex => expect(isUnilateral(ex)).toBe(false));
  it("preserves old records and explicit zero through defaults", () => {
    const s = DEFAULTS(); s.exPrefs = { "Warrior I": { rest: 0 } };
    expect(withDefaults(JSON.parse(JSON.stringify(s))).exPrefs["Warrior I"].rest).toBe(0);
    expect(practiceSeconds([{ sec: 30 }, { sec: 100, t: "w" }])).toBe(30);
  });
});
describe("focus, sport totals and PR", () => {
  const entries = [
    { date: "2026-11-09", ex: "Warrior I", sets: [{ sec: 30, w: 100, r: 5 }] },
    { date: "2026-11-10", ex: "Bench Press (Barbell)", sets: [{ w: 50, r: 10 }] },
    { date: "2026-11-10", ex: "Treadmill Run", sets: [{ w: 20 }] },
  ];
  it.each(["both", "lift", "yoga"])("separates yoga from sport counts in %s", () => {
    const sport = entries.filter(e => sportGroup(groupOf(e.ex)));
    expect(sport.reduce((n,e) => n + work(e.sets).length, 0)).toBe(1);
    expect(sport.reduce((n,e) => n + volume(e.sets), 0)).toBe(500);
    expect(sportGroup(CARDIO)).toBe(false);
    expect(calendarLoad(entries, groupOf, "lift")).toEqual({ "2026-11-10": 4 });
  });
  it("marks yoga-only days in both and yoga modes without adding to sport load", () => {
    for (const focus of ["both", "yoga"]) expect(calendarLoad(entries, groupOf, focus)).toEqual({ "2026-11-09": 1, "2026-11-10": 4 });
    expect(calendarLoad([{ date: "2026-11-09", ex: "Warrior I", sets: [{ sec: 30, w: 0, r: 0 }, { sec: 30, w: 0, r: 0 }] }], groupOf, "both")).toEqual({ "2026-11-09": 1 });
    expect(calendarLoad(entries, groupOf, "lift")).toEqual({ "2026-11-10": 4 });
  });
  it.each(["both", "lift", "yoga"])("applies %s to weekly streak and goal", focus => {
    const dates = activityDates(entries, focus, groupOf);
    const result = computeWeekStreak(dates, 2, new Date(2026, 10, 10, 12));
    expect(result.thisWeek).toBe(focus === "lift" ? 1 : 2);
    expect(result.goalMet).toBe(focus !== "lift");
  });
  it.each(["both", "yoga"])("counts yoga days for %s", focus => {
    expect(activityDates(entries, focus, groupOf)).toEqual(["2026-11-09", "2026-11-10"]);
    expect(programVisible(focus, [{ex:"Warrior I"}], groupOf)).toBe(true);
  });
  it("hides yoga and mixed programs and excludes yoga-only days in lift mode", () => {
    expect(programVisible("lift", [{ex:"Warrior I"}], groupOf)).toBe(false);
    expect(programVisible("lift", [{ex:"Warrior I"}, {ex:"Plank"}], groupOf)).toBe(false);
    expect(programVisible("lift", [{ex:"Plank"}], groupOf)).toBe(true);
    expect(activityDates(entries, "lift", groupOf)).toEqual(["2026-11-10"]);
    expect(activityDates([{date:"2026-11-08",ex:"Plank",sets:[{t:"w",sec:30}]}], "both", groupOf)).toEqual([]);
  });
  it("suppresses yoga PRs while allowing timed and weighted sport PRs", () => {
    for (const ex of ["Warrior I", "Hamstring Stretch", "Plank", "Bench Press (Barbell)"]) {
      expect(recordAllowed(groupOf(ex) === YOGA, groupOf(ex) === CARDIO)).toBe(groupOf(ex) !== YOGA);
    }
    expect(recordAllowed(false, true)).toBe(false);
  });
});
