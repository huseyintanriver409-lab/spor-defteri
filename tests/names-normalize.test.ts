import { it, expect } from "vitest";
import { LIB } from "../src/core/library.ts";
import { normalizeExerciseName, resolveExerciseName } from "../src/core/names.ts";
it("Turkish dotted/dotless I variants share one key", () => {
  const keys = new Set(["İlk", "ilk", "Ilk", "ılk", "ILK"].map(normalizeExerciseName));
  expect(keys.size).toBe(1);
});
it("normalized library names stay unique", () => {
  const all = Object.values(LIB).flat();
  expect(new Set(all.map(normalizeExerciseName)).size).toBe(new Set(all).size);
});
it("messy upper-case names resolve to the library exercise", () => {
  expect(resolveExerciseName(" İNCLINE  dumbbell  curl ")).toBe(resolveExerciseName("incline dumbbell curl"));
  expect(Object.values(LIB).flat()).toContain(resolveExerciseName("incline dumbbell curl"));
});
