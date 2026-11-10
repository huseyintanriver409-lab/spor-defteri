import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { DEFAULTS } from "../src/core/schema.ts";
const env = vi.hoisted(() => {
  const nodes = new Map<string, any>();
  const node = (key: string): any => {
    if (!nodes.has(key)) nodes.set(key, {
      value: "", style: {}, classList: { toggle() {}, add() {}, remove() {} },
      querySelectorAll: () => [], setAttribute() {}, scrollIntoView() {},
      set innerHTML(html: string) {
        // Minimal form surface: rendering the current exercise replaces its inputs.
        if (key === "#fBody") for (const match of html.matchAll(/id="(f_[wr])"[^>]*value="([^"]*)"/g)) node("#" + match[1]).value = match[2];
      },
    });
    return nodes.get(key);
  };
  return { node, nodes };
});
vi.mock("../src/app/store.js", async () => ({
  ...await import("../src/core/library.ts"),
  state: DEFAULTS(), $: env.node, esc: String, fmt: String, ic: () => "", save: vi.fn(),
  toast: vi.fn(), uid: () => "id", ask: vi.fn(), setState: vi.fn(),
}));
vi.mock("../src/app/ui.js", () => Object.fromEntries([
  "buzz", "closeSheet", "keepAwake", "openPicker", "openSheet", "refreshAll", "sheetHead", "showTab", "undoable",
].map(k => [k, vi.fn()])));
vi.mock("../src/app/log.js", () => ({ barFor: () => 0, bestOf: () => ({ n: 1, w: 20, e: 25 }), bestSecOf: () => 10 }));
vi.mock("../src/app/programs.js", async () => {
  // @ts-expect-error App modules are JavaScript; exercised through Vitest.
  const { state } = await import("../src/app/store.js");
  const { restSeconds } = await import("../src/core/yoga.ts");
  // @ts-expect-error App modules are JavaScript; exercised through Vitest.
  const { isYoga } = await import("../src/app/exercises.js");
  return { at: vi.fn(), defaultInc: () => 2, defaultStep: () => 2, exPref: (ex: string, k: string) => state.exPrefs[ex]?.[k],
    overloadStep: () => 2, stepFor: () => 2, ssLabels: (items: unknown[]) => items.map(() => ""),
    restFor: (ex: string) => restSeconds(isYoga(ex), state.rest, state.exPrefs[ex]?.rest) };
});
vi.mock("../src/app/tools.js", () => ({
  PLATES: [], audio: null, beep: vi.fn(), mmss: String, pfmt: String, plateText: String,
  platesFor: () => ({ used: [], rest: 0 }), renderFocusRest: vi.fn(), setAudio: vi.fn(), startTimer: vi.fn(), stopTimer: vi.fn(),
}));
vi.mock("../src/app/cloud.js", () => ({ runCal: vi.fn(), runSync: vi.fn() }));
vi.mock("../src/app/streak.js", () => ({ celebrateStreak: vi.fn() }));
// @ts-expect-error App modules are JavaScript; exercised through Vitest.
import { state, toast } from "../src/app/store.js";
// @ts-expect-error App modules are JavaScript; exercised through Vitest.
import { toggleHold, hold, fDraft, completeSet, openExPrefs } from "../src/app/live.js";
// @ts-expect-error App modules are JavaScript; exercised through Vitest.
import { startTimer } from "../src/app/tools.js";
beforeEach(() => {
  vi.useFakeTimers(); vi.clearAllMocks(); env.nodes.clear();
  Object.assign(state, DEFAULTS());
  for (const k in fDraft) delete fDraft[k];
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });
function start(ex: string, next = "Mountain Pose", rest?: number) {
  state.live = { start: Date.now(), date: "2026-11-10", idx: 0, items: [{ ex, sets: 1, reps: "30" }, { ex: next, sets: 1, reps: "30" }] };
  if (rest != null) state.exPrefs[ex] = { rest };
  env.node("#f_w").value = "0"; env.node("#f_r").value = "30";
  toggleHold();
}
it("runs left, right, then the next pose with three-second preparation and no rest/PR", () => {
  start("Warrior II");
  expect(hold?.phase).toBe("lead");
  vi.advanceTimersByTime(33000);
  expect(state.entries).toHaveLength(0);
  expect(state.live.sides["Warrior II"]).toBeDefined();
  expect(hold?.phase).toBe("lead");
  vi.advanceTimersByTime(33000);
  expect(state.entries[0].sets[0].sides).toHaveLength(2);
  expect(state.live.idx).toBe(1);
  expect(hold?.phase).toBe("lead");
  expect(hold?.t0).toBe(Date.now() + 3000);
  vi.advanceTimersByTime(33000);
  expect(hold).toBeNull();
  expect(state.entries).toHaveLength(2);
  expect(startTimer).not.toHaveBeenCalled();
  expect(state.live.prs || 0).toBe(0);
});
it.each([0, 45])("does not auto-start sport after yoga (rest %s)", rest => {
  start("Mountain Pose", "Plank", rest);
  vi.advanceTimersByTime(33000);
  expect(hold).toBeNull();
  expect(state.live.idx).toBe(1);
  if (rest) expect(startTimer).toHaveBeenCalledWith(rest);
  else expect(startTimer).not.toHaveBeenCalled();
});
it("preserves sport timed rest and PR", () => {
  start("Plank"); vi.advanceTimersByTime(33000);
  expect(hold).toBeNull(); expect(startTimer).toHaveBeenCalledWith(90);
  expect(state.live.prs).toBe(1);
  expect(toast).toHaveBeenCalledWith(expect.any(String), "trophy");
});
it("manual save does not automatically start another hold", () => {
  state.live = { start: Date.now(), date: "2026-11-10", idx: 0, items: [{ ex: "Mountain Pose", sets: 2 }] };
  env.node("#f_w").value = "0"; env.node("#f_r").value = "30";
  completeSet(); expect(hold).toBeNull(); expect(startTimer).not.toHaveBeenCalled();
});
it("saves and clears explicit zero in the existing preference form", () => {
  const it = { ex: "Mountain Pose", sets: 1, reps: "30" };
  state.live = { start: Date.now(), date: "2026-11-10", idx: 0, items: [it] };
  openExPrefs(it);
  env.node("#xpSets").value = "1"; env.node("#xpReps").value = "30";
  env.node("#xpRest").value = "0"; env.node("#xpSave").onclick();
  expect(state.exPrefs[it.ex].rest).toBe(0);
  openExPrefs(it); env.node("#xpRest").value = ""; env.node("#xpSave").onclick();
  expect(state.exPrefs[it.ex]?.rest).toBeUndefined();
});
