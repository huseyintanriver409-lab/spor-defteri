import { beforeEach, expect, it, vi } from "vitest";
import { DEFAULTS } from "../src/core/schema.ts";
vi.mock("../src/app/store.js", () => ({ state: DEFAULTS(), $: vi.fn(), ask: vi.fn(), esc: String, fmt: String, ic: vi.fn(), save: vi.fn(), toast: vi.fn(), uid: vi.fn() }));
vi.mock("../src/app/exercises.js", () => ({
  isYoga: (ex: string) => ex === "Mountain Pose", isTimed: (ex: string) => ex === "Mountain Pose",
}));
vi.mock("../src/app/ui.js", () => ({}));
vi.mock("../src/app/bodymap.js", () => ({}));
vi.mock("../src/app/log.js", () => ({ bestOf: () => ({ e: 100 }) }));
vi.mock("../src/app/live.js", () => ({}));
vi.mock("../src/app/importer.js", () => ({}));
vi.mock("../src/app/presets.js", () => ({}));
// @ts-expect-error JavaScript app module
import { state } from "../src/app/store.js";
// @ts-expect-error JavaScript app module
import { restFor } from "../src/app/programs.js";
beforeEach(() => Object.assign(state, DEFAULTS()));
it("uses the live target and most recent recorded set, regardless of entry order", () => {
  state.live = { items: [{ ex: "Dumbbell Fly", reps: "8-12" }] };
  state.entries = [
    { date: "2026-11-10", ex: "Dumbbell Fly", sets: [{ w: 85, r: 8 }] },
    { date: "2026-11-09", ex: "Dumbbell Fly", sets: [{ w: 20, r: 10 }] },
  ];
  expect(restFor("Dumbbell Fly")).toBe(180);
  state.entries[0].sets[0].w = 84;
  expect(restFor("Dumbbell Fly")).toBe(75);
  expect(restFor("Dumbbell Fly", { reps: "5" })).toBe(180);
});
it("resolves per-exercise overrides, numeric settings and yoga", () => {
  expect(restFor("Bench Press (Barbell)")).toBe(120);
  state.exPrefs["Bench Press (Barbell)"] = { rest: 45 };
  expect(restFor("Bench Press (Barbell)")).toBe(45);
  state.restAuto = false; state.rest = 150;
  expect(restFor("Dumbbell Fly")).toBe(150);
  expect(restFor("Mountain Pose", { reps: "5" })).toBe(0);
  state.exPrefs["Mountain Pose"] = { rest: 30 };
  expect(restFor("Mountain Pose")).toBe(30);
});
