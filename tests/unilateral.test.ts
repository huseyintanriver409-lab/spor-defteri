import { describe, it, expect } from "vitest";
// @ts-expect-error Node types are not installed; Vitest runs this in Node.
import { readFileSync } from "node:fs";
import { isUnilateral, LIB, UNILATERAL } from "../src/core/library.ts";
import { completeSide, pendingSide, type SideWorkout } from "../src/core/unilateral.ts";
import type { WorkSet } from "../src/core/training.ts";
import { work, volume } from "../src/core/training.ts";
import { DEFAULTS, withDefaults } from "../src/core/schema.ts";

describe("unilateral workout", () => {
  it.each(["Cable Woodchopper", "Bulgarian Split Squat", "Single-Arm Cable Row", "Single-Leg RDL", "Reverse Lunge", "Single-Arm Dumbbell Press"])("marks %s", name => expect(isUnilateral(name)).toBe(true));
  it.each(["Bench Press (Barbell)", "Romanian Deadlift", "Cable Crossover", "Bicycle Crunch", "Alternating Dumbbell Curl"])("keeps %s bilateral/alternating", name => expect(isUnilateral(name)).toBe(false));
  it("metadata names all exist in the library", () => {
    const names = Object.values(LIB).flat();
    for (const name of UNILATERAL) expect(names).toContain(name);
  });
  it("left then right completes exactly one set, then starts left again", () => {
    const live: SideWorkout = {}, sets: WorkSet[] = [];
    expect(completeSide(live, "row", 0, { w: 30, r: 8 })).toBeNull();
    expect(pendingSide(live, "row", 0)).toBeDefined();
    expect(sets).toHaveLength(0);
    sets.push(completeSide(live, "row", 0, { w: 30, r: 8 })!);
    expect(pendingSide(live, "row", 1)).toBeUndefined();
    expect(work(sets)).toHaveLength(1);
    expect(volume(sets)).toBe(240);
    expect(completeSide(live, "row", 1, { w: 30, r: 8 })).toBeNull();
    sets.push(completeSide(live, "row", 1, { w: 30, r: 8 })!);
    expect(work(sets)).toHaveLength(2);
    expect(volume(sets)).toBe(480);
  });
  it("resumes the other side after persistence and exercise navigation", () => {
    const live = DEFAULTS(); live.live = {};
    completeSide(live.live, "row", 2, { w: 30, r: 8, rir: 2 });
    completeSide(live.live, "lunge", 0, { w: 20, r: 10 });
    const resumed = withDefaults(JSON.parse(JSON.stringify(live))).live;
    expect(pendingSide(resumed, "row", 2)?.first.rir).toBe(2);
    expect(completeSide(resumed, "row", 2, { w: 25, r: 7 })).toMatchObject({ w: 30, r: 8, rir: 2, sides: [{ w: 30, r: 8 }, { w: 25, r: 7 }] });
    expect(pendingSide(resumed, "lunge", 0)).toBeDefined();
  });
  it("discards stale progress after logged set count changes", () => {
    const live: SideWorkout = {};
    completeSide(live, "row", 1, { w: 30, r: 8 });
    expect(pendingSide(live, "row", 0)).toBeUndefined();
    expect(completeSide(live, "row", 0, { w: 30, r: 8 })).toBeNull();
  });
  it("pairs timed and warmup sets without counting warmups", () => {
    const live: SideWorkout = {};
    completeSide(live, "plank", 0, { w: 0, r: 0, sec: 30 });
    expect(completeSide(live, "plank", 0, { w: 0, r: 0, sec: 25 })?.sec).toBe(30);
    completeSide(live, "row", 0, { w: 15, r: 8, t: "w" });
    const warm = completeSide(live, "row", 0, { w: 15, r: 8, t: "w" })!;
    expect(work([warm])).toHaveLength(0);
    expect(volume([warm])).toBe(0);
  });
  it("old saves need no migration and old sets retain their volume", () => {
    expect(pendingSide({}, "row", 0)).toBeUndefined();
    expect(volume([{ w: 30, r: 8 }])).toBe(240);
  });
});
it("body profile fields stay together outside training settings", () => {
  const html = readFileSync("spor-defteri.html", "utf8");
  const general = html.slice(html.indexOf('data-i18n="html.general_settings_title"')).split("</details>")[0];
  const training = html.slice(html.indexOf('data-i18n="html.train_settings_title"')).split("</details>")[0];
  const body = html.slice(html.indexOf('data-i18n="html.profile_body_title"')).split('<details')[0];
  for (const id of ["profileHeight", "profileAge", "profileWeight", "bSex", "profileModel", "profileExp"]) {
    expect(body).toContain('id="' + id + '"');
    expect(training).not.toContain('id="' + id + '"');
    expect(html.split('id="' + id + '"')).toHaveLength(2);
  }
  expect(html).not.toContain('id="bBody"');
  for (const id of ["setLang"]) {
    expect(general).toContain('id="' + id + '"');
    expect(training).not.toContain('id="' + id + '"');
    expect(html.split('id="' + id + '"')).toHaveLength(2);
  }
  expect(training).toContain('id="setRest"');
});
