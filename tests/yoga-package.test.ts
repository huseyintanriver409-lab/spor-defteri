import { describe, expect, it } from "vitest";
import { LIB, YOGA, YOGA_POSES } from "../src/core/library.ts";
import { vi } from "vitest";
import { buildQuickFlow, homeActivityDates, activityDates, yogaWeekGoal, practiceSeconds } from "../src/core/yoga.ts";
import { work } from "../src/core/training.ts";
import { mondayOf, ymd } from "../src/core/dates.ts";
const groupOf = (ex: string) => LIB[YOGA].includes(ex) ? YOGA : "Sport";
describe("quick flow", () => {
 it("uses a repeatable daily seed, changes across days, and leaves the library untouched", () => {
  const before = structuredClone(YOGA_POSES);
  const a = buildQuickFlow(20, "all", YOGA_POSES, "2026-11-10");
  expect(buildQuickFlow(20, "all", YOGA_POSES, "2026-11-10")).toEqual(a);
  expect(buildQuickFlow(20, "all", YOGA_POSES, "2026-11-11").map(p => p.ex)).not.toEqual(a.map(p => p.ex));
  expect(YOGA_POSES).toEqual(before);
  vi.useFakeTimers();
  try {
   vi.setSystemTime(new Date(2026, 10, 10, 23, 59));
   expect(buildQuickFlow(20, "all", YOGA_POSES)).toEqual(a);
  } finally { vi.useRealTimers(); }
 });
 it.each([5, 10, 15, 20].flatMap(m => ["all", "hips", "back", "shoulders", "legs"].map(r => [m, r] as const)))("fills %s minutes in %s", (minutes, region) => {
  const flow = buildQuickFlow(minutes, region, YOGA_POSES);
  expect(flow.length).toBeGreaterThan(0);
  expect(new Set(flow.map(p => p.ex)).size).toBe(flow.length);
  const duration = flow.reduce((n, p) => n + +p.reps * (p.sides.length || 1), 0);
  expect(Math.abs(duration - minutes * 60)).toBeLessThanOrEqual(Math.max(...flow.map(p => +p.reps)));
  for (const p of flow) {
   const meta = YOGA_POSES.find(m => m.ex === p.ex)!;
   if (region !== "all") expect(meta.region).toBe(region);
   expect(p.sides).toEqual(meta.unilateral ? ["left", "right"] : []);
   expect(p.rest).toBe(0); expect(p.sets).toBe(1);
  }
 });
 it("handles empty pools and invalid durations", () => {
  expect(buildQuickFlow(10, "unknown", YOGA_POSES)).toEqual([]);
  expect(buildQuickFlow(0, "all", YOGA_POSES)).toEqual([]);
  expect(buildQuickFlow(NaN, "all", YOGA_POSES)).toEqual([]);
 });
 it("provides metadata for every library pose", () => {
  expect(YOGA_POSES.map(p => p.ex)).toEqual(LIB[YOGA]);
  expect(YOGA_POSES.every(p => p.seconds > 0 && p.level >= 1)).toBe(true);
 });
});
describe("yoga day counts", () => {
 const entry = (date: string, sec: number, ex = "Mountain Pose") => ({ date, ex, sets: [{ sec, w: 0, r: 0 }] });
 it("counts duration-only yoga on home in lift focus while keeping sport goals separate", () => {
  const entries = [entry("2026-11-09", 30)];
  expect(work(entries[0].sets)).toHaveLength(1);
  expect(homeActivityDates(entries, groupOf)).toEqual(["2026-11-09"]);
  expect(activityDates(entries, "lift", groupOf)).toEqual([]);
 });
 it("aggregates daily practice, counts both sides and excludes warmups and sport", () => {
  const monday = ymd(mondayOf(new Date(2026, 10, 12)));
  const entries = [entry("2026-11-08", 500), entry(monday, 149), entry(monday, 150),
    entry("2026-11-10", 300), entry("2026-11-11", 1000, "Plank"), entry("2026-11-16", 500),
    {date: "2026-11-12", ex: "Warrior I", sets: [{ sides: [{ sec: 150 }, { sec: 150 }], sec: 150 }]},
    {date: monday, ex: "Mountain Pose", sets: [{ sec: 500, t: "w" }]}];
  expect(yogaWeekGoal(entries, groupOf, monday)).toEqual({ days: 2, progress: 2/3 });
  entries.push(entry(monday, 1));
  expect(yogaWeekGoal(entries, groupOf, monday)).toEqual({ days: 3, progress: 1 });
  entries.push(entry("2026-11-13", 300));
  expect(yogaWeekGoal(entries, groupOf, monday)).toEqual({ days: 4, progress: 1 });
  expect(practiceSeconds([{ sec: 300 }])).toBe(300);
 });
 it("starts the goal ring empty without penalties", () => {
  expect(yogaWeekGoal([], groupOf, "2026-11-09")).toEqual({ days: 0, progress: 0 });
 });
});
