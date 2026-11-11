import { describe, it, expect } from "vitest";
import { DEFAULTS, withDefaults, takeSnapshot, stampChanges, mergeStates } from "../src/core/schema.ts";
import { migrateExNames } from "../src/core/renames.ts";
import { mergeExercise } from "../src/core/merge.ts";

describe("persistent muscle assignments", () => {
  it("defaults old backups and round-trips assignments", () => {
    expect(withDefaults({ v: 2 }).exMuscles).toEqual({});
    const s = withDefaults({ v: 2, exMuscles: { Deadlift: { Biceps: 1 } } });
    expect(withDefaults(JSON.parse(JSON.stringify(s))).exMuscles).toEqual(s.exMuscles);
  });
  it("stamps edits and resets per exercise", () => {
    const s = DEFAULTS(), snap = takeSnapshot(s);
    s.exMuscles.Deadlift = { Biceps: 1 };
    const next = stampChanges(s, snap, 100);
    expect(s.exMusclesU.Deadlift).toBe(100);
    delete s.exMuscles.Deadlift;
    stampChanges(s, next, 200);
    expect(s.exMusclesU.Deadlift).toBe(200);
  });
  it("keeps assignments when an old client updates unrelated settings", () => {
    const s = withDefaults({ exMuscles: { Deadlift: { Biceps: 1 } }, exMusclesU: { Deadlift: 10 }, settingsU: 10 });
    const old: any = { ...DEFAULTS(), settingsU: 999 };
    delete old.exMuscles; delete old.exMusclesU;
    expect(mergeStates(s, old).state.exMuscles).toEqual(s.exMuscles);
    expect(mergeStates(withDefaults(old), s).state.exMuscles).toEqual(s.exMuscles);
  });
  it("merges independent exercises and does not resurrect a reset", () => {
    const a = withDefaults({ exMuscles: { Deadlift: { Biceps: 1 } }, exMusclesU: { Deadlift: 10 } });
    const b = withDefaults({ exMuscles: { "Back Squat": { Quadriceps: 1 } }, exMusclesU: { Deadlift: 20, "Back Squat": 30 } });
    for (const s of [mergeStates(a, b).state, mergeStates(b, a).state]) {
      expect(s.exMuscles).toEqual({ "Back Squat": { Quadriceps: 1 } });
      expect(s.exMusclesU.Deadlift).toBe(20);
    }
  });
  it("migrates old exercise names together with reset clocks", () => {
    const s = DEFAULTS(); s.exMuscles = { "Şınav (Push-up)": { Triceps: .5 } }; s.exMusclesU = { "Şınav (Push-up)": 100 };
    const out = migrateExNames(s);
    expect(out.exMuscles).toEqual({ "Push-up": { Triceps: .5 } });
    expect(out.exMusclesU).toEqual({ "Push-up": 100 });
  });
  it("exercise merge carries assignment and prevents stale source resurrection", () => {
    const s = DEFAULTS(); s.exMuscles = { Mine: { Biceps: 1 } }; s.exMusclesU = { Mine: 100 };
    mergeExercise(s, "Mine", "Deadlift");
    expect(s.exMuscles).toEqual({ Deadlift: { Biceps: 1 } });
    expect(s.exMusclesU.Mine).toBeGreaterThan(100);
  });
  it("merging a custom old alias into its canonical name keeps the transferred assignment", () => {
    const s = DEFAULTS(); s.custom = [{ name: "Şınav (Push-up)", group: "Göğüs" }];
    s.exMuscles = { "Şınav (Push-up)": { Triceps: 1 } }; s.exMusclesU = { "Şınav (Push-up)": 100 };
    mergeExercise(s, "Şınav (Push-up)", "Push-up");
    expect(migrateExNames(s).exMuscles).toEqual({ "Push-up": { Triceps: 1 } });
  });
});

it("muscle edits do not stamp unrelated settings and another device profile survives", () => {
  const s = DEFAULTS(); s.settingsU = 10;
  const snapshot = takeSnapshot(s);
  s.exMuscles.Deadlift = { Biceps: 1 };
  stampChanges(s, snapshot, 200);
  expect(s.settingsU).toBe(10);
  const other = DEFAULTS(); other.settingsU = 100; other.profile.bw = "88";
  for (const result of [mergeStates(s, other).state, mergeStates(other, s).state]) {
    expect(result.profile.bw).toBe("88");
    expect(result.exMuscles.Deadlift).toEqual({ Biceps: 1 });
  }
});

it("sanitizes untrusted imported assignments and prototype keys", () => {
  const raw = JSON.parse('{"Deadlift":{"Biceps":1,"Triceps":0.5,"Kal?a":2,"Lat":0,"Bel":-1,"bad":1,"__proto__":1},"constructor":{"Biceps":1},"__proto__":{"Biceps":1}}');
  raw.Deadlift.Trapez = Infinity;
  const s = withDefaults({ v: 2, exMuscles: raw });
  expect(s.exMuscles).toEqual({ Deadlift: { Biceps: 1, Triceps: .5 } });
  expect(Object.hasOwn(s.exMuscles, "__proto__")).toBe(false);
  expect(Object.hasOwn(s.exMuscles, "constructor")).toBe(false);
});
