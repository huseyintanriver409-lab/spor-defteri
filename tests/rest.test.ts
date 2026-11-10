import { describe, it, expect } from "vitest";
import { autoRestSeconds, exerciseRestSeconds, supersetRestSeconds } from "../src/core/rest.ts";
import { DEFAULTS, withDefaults, mergeStates, SETTINGS } from "../src/core/schema.ts";

describe("automatic rest", () => {
  const single = { ex: "Dumbbell Fly" };
  it("keeps yoga at zero even with heavy inputs", () => {
    expect(autoRestSeconds({ ...single, yoga: true, targetReps: 1 })).toBe(0);
  });
  it.each([1, 5, "3-5"])("uses 180 for a heavy target %s", targetReps => {
    expect(autoRestSeconds({ ...single, targetReps })).toBe(180);
  });
  it.each([1, 5])( "uses 180 for low last reps %s", r => {
    expect(autoRestSeconds({ ...single, targetReps: 10, lastSet: { r } })).toBe(180);
  });
  it("ignores empty/zero reps and uses 75 above five", () => {
    for (const r of [undefined, "", 0, 6, "5-8"]) expect(autoRestSeconds({ ...single, targetReps: r, lastSet: { r } })).toBe(75);
  });
  it("includes the 85 percent boundary", () => {
    expect(autoRestSeconds({ ...single, lastSet: { w: 85, r: 8 }, estimated1RM: 100 })).toBe(180);
    expect(autoRestSeconds({ ...single, lastSet: { w: 84.99, r: 8 }, estimated1RM: 100 })).toBe(75);
    expect(autoRestSeconds({ ...single, lastSet: { w: 85, r: 8 } })).toBe(75);
  });
  it("includes muscle share 0.5, excludes shares below it; unknown uses 75", () => {
    expect(autoRestSeconds({ ex: "Low-to-High Cable Fly" })).toBe(120);
    expect(autoRestSeconds({ ex: "Incline Dumbbell Fly" })).toBe(75);
    expect(autoRestSeconds({ ex: "Unknown" })).toBe(75);
  });
  it("manual preference wins, then auto, then general; yoga retains overrides", () => {
    expect(exerciseRestSeconds(single, 90, true, 45)).toBe(45);
    expect(exerciseRestSeconds(single, 90, true, 0)).toBe(0);
    expect(exerciseRestSeconds(single, 90, true)).toBe(75);
    expect(exerciseRestSeconds(single, 150, false)).toBe(150);
    expect(exerciseRestSeconds({ ...single, yoga: true }, 150, false)).toBe(0);
    expect(exerciseRestSeconds({ ...single, yoga: true }, 150, true, 30)).toBe(30);
  });
  it("supersets rest only at the end using the maximum", () => {
    expect(supersetRestSeconds([180, 75, 120], true)).toBe(0);
    expect(supersetRestSeconds([180, 75, 120], false)).toBe(180);
    expect(supersetRestSeconds([45, 240], false)).toBe(240);
  });
});

describe("rest migration", () => {
  it("defaults to auto while retaining a numeric rest", () => {
    expect(DEFAULTS()).toMatchObject({ rest: 90, restAuto: true, restAutoMig: true });
  });
  it("migrates 90 only once and leaves exercise preferences untouched", () => {
    const raw = { rest: 90, exPrefs: { Fly: { rest: 45 } } };
    const once = withDefaults(raw);
    expect(once).toMatchObject({ rest: 90, restAuto: true, restAutoMig: true, exPrefs: raw.exPrefs });
    expect(withDefaults({ ...once, restAuto: false }).restAuto).toBe(false);
    expect(raw).not.toHaveProperty("restAutoMig");
  });
  it("keeps non-90 values and marks the migration done", () => {
    expect(withDefaults({ rest: 120 })).toMatchObject({ rest: 120, restAuto: false, restAutoMig: true });
  });
  it("does not rerun when flagged", () => {
    expect(withDefaults({ rest: 90, restAuto: false, restAutoMig: true }).restAuto).toBe(false);
  });
  it("syncs both flags and numeric rest through settings", () => {
    expect(SETTINGS).toEqual(expect.arrayContaining(["restAuto", "restAutoMig"]));
    const remote = { ...DEFAULTS(), rest: 150, restAuto: false, settingsU: 10 };
    const merged = mergeStates(DEFAULTS(), remote).state;
    expect(withDefaults(merged)).toMatchObject({ rest: 150, restAuto: false, restAutoMig: true });
    expect(mergeStates(merged, { ...remote, rest: 90, restAuto: true, settingsU: 20 }).state.restAuto).toBe(true);
  });
});

it.each([[false, 90, false], [true, 120, false], [true, 90, true]])("preserves local auto choice %s with legacy remote rest %s", (auto, rest, expected) => {
 const local = { ...DEFAULTS(), restAuto: auto };
 const remote: any = { ...DEFAULTS(), rest, settingsU: 10 }; delete remote.restAutoMig; delete remote.restAuto;
 expect(mergeStates(local, remote).state).toMatchObject({ rest, restAuto: expected, restAutoMig: true });
});
