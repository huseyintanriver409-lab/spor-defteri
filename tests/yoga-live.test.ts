import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { DEFAULTS } from "../src/core/schema.ts";
const env = vi.hoisted(() => {
  const nodes = new Map<string, any>();
  const node = (key: string): any => {
    if (!nodes.has(key)) nodes.set(key, {
      value: "", style: {}, classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
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
import { state, toast, ask } from "../src/app/store.js";
// @ts-expect-error App modules are JavaScript; exercised through Vitest.
import { toggleHold, hold, fDraft, completeSet, openExPrefs, resetHold, finishHold, addFocusExercise, finishWorkout, removeDoneSet, startQuickWorkout, workDone } from "../src/app/live.js";
// @ts-expect-error App modules are JavaScript; exercised through Vitest.
import { startTimer } from "../src/app/tools.js";
beforeEach(() => {
  resetHold();
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
it("manual yoga save automatically starts another hold", () => {
  state.live = { start: Date.now(), date: "2026-11-10", idx: 0, items: [{ ex: "Mountain Pose", sets: 2 }] };
  env.node("#f_w").value = "0"; env.node("#f_r").value = "30";
  completeSet(); expect(hold?.phase).toBe("lead"); expect(startTimer).not.toHaveBeenCalled();
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

it('B1: ignores ended and replaced workouts', () => {
 start('Mountain Pose'); state.live = null;
 expect(() => completeSet()).not.toThrow(); finishHold(30, true);
 expect(hold).toBeNull(); expect(state.entries).toHaveLength(0);
 start('Mountain Pose'); state.live = { ...state.live };
 vi.advanceTimersByTime(33000);
 expect(hold).toBeNull(); expect(state.entries).toHaveLength(0);
});
it('B2: blocks adding and rejects removed exercise', () => {
 start('Mountain Pose'); addFocusExercise();
 expect(state.live.items).toHaveLength(2);
 state.live.items.splice(0, 1); vi.advanceTimersByTime(33000);
 expect(hold).toBeNull(); expect(state.entries).toHaveLength(0);
});

it('B1: finishing clears hold immediately', async () => {
 start('Mountain Pose'); vi.mocked(ask).mockResolvedValueOnce(true);
 vi.stubGlobal('document', { body: { classList: { remove() {}, toggle() {} } } });
 env.node('#focus').classList.contains = () => true;
 try { await finishWorkout(); expect(hold).toBeNull(); expect(state.live).toBeNull(); }
 finally { vi.unstubAllGlobals(); }
});
it('B2: deleting earlier item preserves held exercise; deleting held item stops it', async () => {
 start('Mountain Pose'); resetHold();
 const previous = state.live.items[0]; state.live.idx = 1; toggleHold();
 vi.mocked(ask).mockResolvedValueOnce(true);
 openExPrefs(previous); await env.node('#xpRemove').onclick();
 expect(state.live.idx).toBe(0); expect(hold.item).toBe(state.live.items[0]);
 vi.mocked(ask).mockResolvedValueOnce(true);
 openExPrefs(state.live.items[0]); await env.node('#xpRemove').onclick();
 expect(hold).toBeNull();
});

it("early manual hold completion advances to the next yoga pose", () => {
 start("Mountain Pose", "Child's Pose");
 vi.advanceTimersByTime(13000); toggleHold();
 expect(state.entries[0].sets[0].sec).toBe(10);
 expect(state.live.idx).toBe(1); expect(hold?.phase).toBe("lead");
 expect(hold.item.ex).toBe("Child's Pose");
 expect(startTimer).not.toHaveBeenCalled();
});
it("early manual plank completion preserves sport behavior", () => {
 start("Plank", "Child's Pose");
 vi.advanceTimersByTime(13000); toggleHold();
 expect(state.entries[0].sets[0].sec).toBe(10);
 expect(hold).toBeNull(); expect(startTimer).toHaveBeenCalledWith(90);
});
it("deletes immediately without confirmation and restores through undo", async () => {
 // @ts-expect-error App modules are JavaScript; exercised through Vitest.
 const { undoable } = await import("../src/app/ui.js");
 state.live = { start: Date.now(), date: "2026-11-10", idx: 0, items: [{ ex: "Mountain Pose", sets: 1 }] };
 const entry = { id: "e", date: state.live.date, ex: "Mountain Pose", sets: [{ sec: 30 }] };
 state.entries = [entry];
 await removeDoneSet(0);
 expect(ask).not.toHaveBeenCalled(); expect(state.entries).toHaveLength(0);
 expect(undoable).toHaveBeenCalledOnce();
 vi.mocked(undoable).mock.calls[0][1]();
 expect(state.entries).toEqual([entry]); expect(entry.sets).toEqual([{ sec: 30 }]);
});
it("quick flow uses its generated target and preserves earlier daily practice", () => {
 vi.stubGlobal("document", { body: { classList: { add() {}, toggle() {} } } });
 try {
  state.entries = [{ id: "prior", date: new Date().toLocaleDateString("sv-SE"), ex: "Mountain Pose", sets: [{ sec: 99 }] }];
  startQuickWorkout([{ ex: "Mountain Pose", sets: 1, reps: "40", rest: 0 }]);
  expect(workDone(state.live.items[0])).toBe(0);
  expect(env.node("#f_r").value).toBe("40");
  completeSet();
  expect(workDone(state.live.items[0])).toBe(1);
  expect(state.entries[0].sets.map((s: any) => s.sec)).toEqual([99, 40]);
 } finally { vi.unstubAllGlobals(); }
});
