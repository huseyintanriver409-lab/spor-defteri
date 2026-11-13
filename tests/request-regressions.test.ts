import { it, expect, vi, afterEach } from "vitest";
import { DEFAULTS, withDefaults, mergeStates } from "../src/core/schema.ts";
import { toPayload } from "../src/core/sync.ts";
import { programItems } from "../src/core/program-data.ts";
import { tCount } from "../src/core/i18n.ts";
import en from "../src/i18n/en/index.ts";
import tr from "../src/i18n/tr/index.ts";
// @ts-ignore Node built-in used by the existing module-load test too
import { readFileSync } from "node:fs";
// @ts-ignore process is a Node global
const css = readFileSync(process.cwd() + "/src/styles.css", "utf8");
import sw from "../public/sw.js?raw";
afterEach(() => vi.unstubAllGlobals());
it("syncs assignments and reset clocks through the serialized payload", () => {
 const local = withDefaults({ ...DEFAULTS(), exMuscles: { Squat: { Quadriceps: 1 } }, exMusclesU: { Squat: 10 } });
 const remote = withDefaults({ ...DEFAULTS(), exMuscles: { Push: { Triceps: 1 } }, exMusclesU: { Squat: 20, Push: 20 } });
 const merged = mergeStates(local, JSON.parse(JSON.stringify(toPayload(remote)))).state;
 expect(merged.exMuscles.Push).toEqual({ Triceps: 1 }); expect(merged.exMuscles.Squat).toBeUndefined(); expect(merged.exMusclesU.Squat).toBe(20);
});
it("old payload cannot clear local assignments", () => {
 const local = withDefaults({ ...DEFAULTS(), exMuscles: { Push: { Triceps: 1 } }, exMusclesU: { Push: 10 } });
 expect(mergeStates(local, { settingsU: 100 }).state.exMuscles).toEqual(local.exMuscles);
});
it("old remote body default preserves the local explicit model", () => {
 const local = withDefaults({ ...DEFAULTS(), prefs: { body: "f" } });
 expect(mergeStates(local, { settingsU: 100, profile: { sex: "m" } }).state.prefs.body).toBe("f");
 expect(mergeStates(local, { settingsU: 100, prefs: { body: "m" } }).state.prefs.body).toBe("m");
});
it("normalizes missing program data without changing saved records", () => {
 expect(programItems({})).toEqual([]);
 const p = { items: [{ ex: "Squat" }] }; const items = programItems(p);
 expect(items.reduce((n, i) => n + i.sets, 0)).toBe(0); expect(items[0].reps).toBe(""); expect(p.items[0]).toEqual({ ex: "Squat" });
});
it.each([0,1,2])("English count labels for %i", n => {
 vi.stubGlobal("localStorage", { getItem: () => "en" });
 for (const [key,one,many] of [["history.count_workouts","workout","workouts"],["history.sets_count","set","sets"]]) expect(tCount(key,n)).toBe(n+" "+(n===1?one:many));
 for (const [key,one,many] of [["home.workouts_label","workout","workouts"],["home.set_label","set","sets"],["html.stat_days","day","days"],["html.stat_sets","working set","working sets"]]) expect(tCount(key,n)).toBe(n===1?one:many);
});
it("Turkish count labels stay unchanged", () => {
 vi.stubGlobal("localStorage", { getItem: () => "tr" });
 expect(tCount("history.count_workouts",1)).toBe(tr.history.count_workouts.replace("{n}","1"));
 expect(tCount("home.set_label",1)).toBe(tr.home.set_label);
});
it("yoga group headings agree in both dictionaries", () => {
 expect(en.groups.yoga).toBe(en.library.part_yoga); expect(tr.groups.yoga).toBe(tr.library.part_yoga);
});
it("focus touch overlays have at least 44px without resizing visible controls", () => {
 expect(css).toContain('.f-note,#fManual{position:relative}');
 expect(css).toMatch(/.f-note::after,#fManual::after{[^}]*min-width:44px;min-height:44px/);
});
it("service worker uses v82", () => { expect(sw).toContain("v82"); expect(sw).not.toContain("v81"); });
