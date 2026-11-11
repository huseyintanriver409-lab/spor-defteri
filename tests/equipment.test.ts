import { describe, it, expect } from "vitest";
import { LIB, CARDIO, YOGA } from "../src/core/library.ts";
import { canDo, filterByEquipment, EQUIPMENT, EQUIPMENT_IDS, requirementOf, sanitizeEquipment } from "../src/core/equipment.ts";
import { NEW_EXERCISES } from "../src/core/new-exercises.ts";
import { MUSCLES, rankForMuscle, weightsOf } from "../src/core/musclemap.ts";
import { WEIGHTS, INFERENCE, EVIDENCE, STRETCH } from "../src/core/muscledata.ts";
import { matchesExercise, resolveExerciseName, SEARCH_ALIASES } from "../src/core/names.ts";
import { matchExercise } from "../src/core/importer.ts";
const strength = Object.entries(LIB).filter(([g]) => g !== CARDIO && g !== YOGA).flatMap(([, names]) => names);
const musclesOf = (name: string) => { const w = WEIGHTS[resolveExerciseName(name)] ?? {}; return { ex: name, p: Object.keys(w).filter(m => w[m] >= .75), s: [], w }; };
describe("equipment requirements", () => {
  it("empty owned selection includes all; equipment-free and unknown remain visible", () => {
    expect(filterByEquipment(strength, [])).toEqual(strength);
    expect(canDo("Push-up", ["barbell"])).toBe(true);
    expect(canDo("My new movement", ["band"])).toBe(true);
    expect(canDo("Outdoor Run", ["band"])).toBe(true);
    expect(canDo("Cobra Pose", ["band"])).toBe(true);
  });
  it("requires the whole need set or one whole alternative", () => {
    expect(canDo("Bench Press (Barbell)", ["barbell"])).toBe(false);
    expect(canDo("Bench Press (Barbell)", ["barbell", "bench"])).toBe(true);
    expect(canDo("Pull-up", ["rings_trx"])).toBe(true);
    expect(canDo("Pull-up", ["dumbbell"])).toBe(false);
    expect(canDo("Band-Assisted Pull-up", ["band"])).toBe(false);
    expect(canDo("Band-Assisted Pull-up", ["band", "pullup_bar"])).toBe(true);
  });
  it("sanitizes ids, resolves custom requirements and preserves unknown fallbacks", () => {
    expect(sanitizeEquipment(["dumbbell", "constructor", "dumbbell", 3, "__proto__"])).toEqual(["dumbbell"]);
    expect(canDo("My Row", ["band"], [{ name: "My Row", need: ["dumbbell"] }])).toBe(false);
    expect(canDo("My Row", ["band"], [{ name: "My Row", need: [] }])).toBe(true);
    expect(requirementOf("Custom Dumbbell Raise")).toEqual({ need: ["dumbbell"] });
    expect(requirementOf("Kablo Hareketi")).toEqual({ need: ["cable"] });
    expect(requirementOf("Makine Hareketi")).toEqual({ need: ["machine"] });
    expect(requirementOf("constructor")).toBeUndefined();
  });
  it("covers every strength movement with valid ids and minimum named equipment", () => {
    for (const name of strength) {
      expect(Object.hasOwn(EQUIPMENT, name), name).toBe(true);
      const req = EQUIPMENT[name];
      for (const need of [req.need, ...(req.alt ?? [])]) for (const id of need) expect(EQUIPMENT_IDS, name).toContain(id);
      if (/Dumbbell/.test(name)) expect(req.need, name).toContain("dumbbell");
      if (/Machine/.test(name) && !/Smith/.test(name)) expect(req.need, name).toEqual(["machine"]);
      if (/Hanging/.test(name)) expect(req.need, name).toContain("pullup_bar");
    }
  });
  it("filtering before muscle ranking preserves relative rank", () => {
    const chest = strength.filter(name => weightsOf(musclesOf(name))["Göğüs"] > 0);
    const all = rankForMuscle("Göğüs", chest, musclesOf).map(x => x.name);
    const filtered = filterByEquipment(chest, ["dumbbell"]);
    expect(rankForMuscle("Göğüs", filtered, musclesOf).map(x => x.name)).toEqual(all.filter(name => filtered.includes(name)));
    expect(filtered).not.toContain("Bench Press (Barbell)");
    expect(filtered).toContain("Dumbbell Floor Press");
  });
});
describe("reviewed movement additions and name resolution", () => {
  it("adds 60–90 unique movements with enough band and suspension choices", () => {
    expect(NEW_EXERCISES.length).toBeGreaterThanOrEqual(60);
    expect(NEW_EXERCISES.length).toBeLessThanOrEqual(90);
    expect(NEW_EXERCISES.filter(ex => ex.need.includes("band")).length).toBeGreaterThanOrEqual(12);
    expect(NEW_EXERCISES.filter(ex => ex.need.includes("rings_trx")).length).toBeGreaterThanOrEqual(8);
    for (const ex of NEW_EXERCISES) {
      expect(strength.filter(n => n === ex.name), ex.name).toHaveLength(1);
      expect(WEIGHTS[ex.name]).toEqual(ex.w);
      expect(EQUIPMENT[ex.name].need).toEqual(ex.need);
      expect(Math.max(...Object.values(ex.w)), ex.name).toBeGreaterThanOrEqual(.75);
      for (const [m, w] of Object.entries(ex.w)) {
        expect(MUSCLES, ex.name).toContain(m);
        expect(w).toBeGreaterThan(0); expect(w).toBeLessThanOrEqual(1);
        expect(INFERENCE[m], ex.name).toContain(ex.name);
        expect(JSON.stringify(EVIDENCE[m] ?? [])).not.toContain('"' + ex.name + '"');
      }
      for (const m of STRETCH[ex.name] ?? []) expect(MUSCLES).toContain(m);
    }
  });
  it("normalizes names without modifying stored strings", () => {
    expect(resolveExerciseName(" bench   press (barbell) ")).toBe("Bench Press (Barbell)");
    expect(musclesOf(" bench press (barbell) ").w["Göğüs"]).toBe(1);
    expect(requirementOf(" bench press (barbell) ")?.need).toEqual(["barbell", "bench"]);
    expect(matchesExercise("Pull-up", "Barfiks")).toBe(true);
    expect(matchExercise("Barfiks", strength)).toBe("Pull-up");
    expect(matchExercise("Mekik", strength)).toBe("Crunch");
    expect(matchExercise("Overhead Press", strength)).toBe("Overhead Press (Barbell)");
    for (const target of Object.values(SEARCH_ALIASES)) expect(Object.values(LIB).flat()).toContain(target);
  });
});
