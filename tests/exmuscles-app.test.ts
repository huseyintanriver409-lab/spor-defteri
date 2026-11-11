import { describe, it, expect, vi } from "vitest";
import { LIB, CARDIO, YOGA } from "../src/core/library.ts";
vi.mock("../src/app/store.js", async () => {
  const schema = await import("../src/core/schema.ts");
  const library = await import("../src/core/library.ts");
  return { state: schema.DEFAULTS(), LIB: library.LIB, CARDIO: library.CARDIO, YOGA: library.YOGA, fmt: String };
});
// @ts-ignore app uses vanilla JavaScript
import { state } from "../src/app/store.js";
// @ts-ignore app uses vanilla JavaScript
import { musclesOf, unassignedExercises, unmappedMuscles } from "../src/app/exercises.js";
import { sessionLoad } from "../src/core/musclemap.ts";

describe("muscle assignment priority and unknown status", () => {
  it("overrides library weights and reset restores the defaults", () => {
    const original = musclesOf("Deadlift").w;
    state.exMuscles.Deadlift = { Biceps: 1, Triceps: .5 };
    expect(musclesOf("Deadlift").w).toEqual({ Biceps: 1, Triceps: .5 });
    expect(sessionLoad([{ ex: "Deadlift", sets: 3 }], musclesOf).Biceps.sets).toBe(3);
    delete state.exMuscles.Deadlift;
    expect(musclesOf("Deadlift").w).toEqual(original);
  });
  it("reports unknown strength exercises without warning about intentional unmapped muscles or yoga/cardio", () => {
    const cardio = Object.values(LIB[CARDIO])[0], yoga = Object.values(LIB[YOGA])[0];
    expect(unassignedExercises([{ ex: "zz unknown strength" }, { ex: "zz unknown strength" }, { ex: "Tibialis Raise" }, { ex: cardio }, { ex: yoga }])).toEqual(["zz unknown strength"]);
    expect(unmappedMuscles("Tibialis Raise")).toBe(true);
    expect(musclesOf("Tibialis Raise").w).toEqual({});
  });
  it("keeps name fallback and honors explicitly empty user assignments", () => {
    expect(musclesOf("My Romanian variation").p).toContain("Hamstring");
    state.exMuscles["My Romanian variation"] = {};
    expect(unassignedExercises([{ ex: "My Romanian variation" }])).toEqual(["My Romanian variation"]);
    delete state.exMuscles["My Romanian variation"];
    expect(musclesOf("My Romanian variation").p).toContain("Hamstring");
  });
});
