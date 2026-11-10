import { expect, it } from "vitest";
import { beginnerVolumeSuggestion, type BeginnerVolumeInput } from "../src/core/recovery.ts";
const input = (): BeginnerVolumeInput => ({ programId: "5x5", days: [{ items: [{ ex: "Squat", sets: 5 }, { ex: "Press", sets: 5 }] }], mode: "new", startDate: "2026-11-01", today: "2026-11-01" });
it("suggests 3 sets for new + 5x5 + day 1 without changing the source", () => {
  const data = input(), before = structuredClone(data), out = beginnerVolumeSuggestion(data)!;
  expect(out.days[0].items.map(i => i.sets)).toEqual([3, 3]);
  expect(data).toEqual(before);
  expect(out.key).toBe(beginnerVolumeSuggestion({ ...data, today: "2026-11-02" })!.key);
  expect(out.key).not.toBe(beginnerVolumeSuggestion({ ...data, programId: "other" })!.key);
  expect(out.key).not.toBe(beginnerVolumeSuggestion({ ...data, startDate: "2026-10-31" })!.key);
});
it.each(["2026-11-01", "2026-11-14"])("suggests within the first 14 days: %s", today => {
  expect(beginnerVolumeSuggestion({ ...input(), today })).not.toBeNull();
});
it.each(["2026-11-15", "2026-10-31", "invalid", "2026-02-30"])("does not suggest outside the date window: %s", today => {
  expect(beginnerVolumeSuggestion({ ...input(), today })).toBeNull();
});
it.each(["active", "back"] as const)("does not suggest for mode %s", mode => {
  expect(beginnerVolumeSuggestion({ ...input(), mode })).toBeNull();
});
it("does not suggest for 3x10 or an empty program", () => {
  expect(beginnerVolumeSuggestion({ ...input(), days: [{ items: [{ ex: "Squat", sets: 3 }] }] })).toBeNull();
  expect(beginnerVolumeSuggestion({ ...input(), days: [] })).toBeNull();
});
it("auto follows the existing experience history rule", () => {
  expect(beginnerVolumeSuggestion({ ...input(), mode: "auto" })).not.toBeNull();
  expect(beginnerVolumeSuggestion({ ...input(), mode: "auto", trainingDates: ["2026-10-20"] })).not.toBeNull();
  expect(beginnerVolumeSuggestion({ ...input(), mode: "auto", trainingDates: ["2026-09-01", "2026-10-01", "2026-10-25"] })).toBeNull();
});
it("does not increase low-volume exercises in a mixed day", () => {
  const out = beginnerVolumeSuggestion({ ...input(), days: [{ items: [1, 2, 3, 5, 6].map(sets => ({ ex: String(sets), sets })) }] })!;
  expect(out.days[0].items.map(i => i.sets)).toEqual([1, 2, 2, 3, 4]);
});
