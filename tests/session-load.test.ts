import { expect, it } from "vitest";
import { entryBaseline, plannedSessionItems, sessionEntries, targetSets } from "../src/core/session-load.ts";

it("finish summary excludes earlier sets and new warmups on the same day", () => {
  const entries = [{ id: "a", ex: "Back Squat", date: "2026-11-11", sets: [{ r: 5 }] }];
  const entryBase = entryBaseline(entries);
  entries[0].sets.push({ r: 5, t: "w" } as any, { r: 8 });
  entries.push({ id: "b", ex: "Barbell Row", date: "2026-11-11", sets: [{ r: 5 }, { r: 5 }] });
  expect(sessionEntries(entries, { date: "2026-11-11", entryBase })).toEqual([
    { ex: "Back Squat", sets: 1 }, { ex: "Barbell Row", sets: 2 },
  ]);
});

it("old running workouts retain compatible counting", () => {
  expect(sessionEntries([{ id: "a", ex: "Row", date: "x", sets: [{ t: "w" }, { r: 8 }] }], { date: "x" })).toEqual([{ ex: "Row", sets: 1 }]);
});

it("planned totals aggregate repeated exercises and retain recorded removed exercises", () => {
  expect(plannedSessionItems([{ ex: "A", sets: 5 }, { ex: "A", sets: 7 }, { ex: "B", sets: 0 }], [{ ex: "A", sets: 3 }, { ex: "C", sets: 2 }]))
    .toEqual([{ ex: "A", sets: 12 }, { ex: "B", sets: 0 }, { ex: "C", sets: 2 }]);
});

import { DEFAULTS, mergeStates, withDefaults } from "../src/core/schema.ts";
import { mergeExercise } from "../src/core/merge.ts";

it("session stamps survive two same-day workouts, history deletion and exercise merge", () => {
  const s = DEFAULTS();
  s.entries = [
    { id: "a", ex: "Mine", date: "day", sets: [{ r: 10 }, { r: 8, sid: "first" }, { r: 8, sid: "second" }] },
    { id: "b", ex: "Deadlift", date: "day", sets: [{ r: 10 }, { r: 8, sid: "second" }, { t: "w", sid: "second" }] },
  ];
  const workout = { date: "day", sessionId: "second", entryBase: entryBaseline(s.entries as any) };
  s.entries[0].sets.shift();
  expect(sessionEntries(s.entries as any, workout)).toEqual([{ ex: "Mine", sets: 1 }, { ex: "Deadlift", sets: 1 }]);
  mergeExercise(s, "Mine", "Deadlift");
  expect(sessionEntries(s.entries as any, workout)).toEqual([{ ex: "Deadlift", sets: 2 }]);
  expect(sessionEntries(s.entries as any, { date: "day", sessionId: "first" })).toEqual([{ ex: "Deadlift", sets: 1 }]);
  s.entries[0] = { ...s.entries[0], id: "recreated" };
  expect(sessionEntries(s.entries as any, workout)).toEqual([{ ex: "Deadlift", sets: 2 }]);
  const saved = withDefaults(JSON.parse(JSON.stringify(s)));
  const merged = mergeStates(DEFAULTS(), saved).state;
  expect(sessionEntries(merged.entries as any, workout)).toEqual([{ ex: "Deadlift", sets: 2 }]);
});

it("target sets share zero and finite defaults between cards and plans", () => {
  for (const [sets, expected] of [[0, 0], [5, 5], [-1, 3], [NaN, 3], [Infinity, 3], [undefined, 3]] as const) {
    expect(targetSets({ sets })).toBe(expected);
    expect(plannedSessionItems([{ ex: "A", sets }], [])).toEqual([{ ex: "A", sets: expected }]);
  }
});
