import { it, expect, vi, beforeEach } from "vitest";
// @ts-ignore Node runtime is available to Vitest without @types/node
import { readFileSync } from "node:fs";
const env = vi.hoisted(() => ({ lift: true, render: vi.fn(), nodes: new Map<string, any>() }));
vi.mock("../src/app/store.js", () => ({ $: (s: string) => env.nodes.get(s), state: { prefs: {} } }));
vi.mock("../src/app/exercises.js", () => ({ liftOn: () => env.lift }));
vi.mock("../src/app/log.js", () => ({ renderDay: env.render, updateHint: env.render }));
vi.mock("../src/app/programs.js", () => ({ renderProg: env.render, renderPlan: env.render }));
vi.mock("../src/app/live.js", () => ({}));
vi.mock("../src/app/home.js", () => ({ renderHome: env.render }));
vi.mock("../src/app/history.js", () => ({}));
vi.mock("../src/app/stats.js", () => ({ renderRecovery: env.render, renderWeek: env.render, renderRecords: env.render, renderHistSelect: env.render, renderPower: env.render }));
vi.mock("../src/app/library.js", () => ({ renderLib: env.render, renderBody: env.render }));
vi.mock("../src/app/tools.js", () => ({ renderTools: env.render }));
vi.mock("../src/app/backup.js", () => ({ renderBackup: env.render }));
vi.mock("../src/app/settings.js", () => ({ renderSettings: env.render }));
vi.mock("../src/app/cloud.js", () => ({}));
vi.mock("../src/app/streak.js", () => ({}));
vi.mock("../src/app/bodymap.js", () => ({}));
vi.mock("../src/app/muscleassign.js", () => ({}));
// @ts-ignore vanilla app module
import { segState, renderSeg, restoreNav } from "../src/app/ui.js";
const html = readFileSync(new URL("../spor-defteri.html", import.meta.url), "utf8");
const order = (name: string) => [...html.match(new RegExp(`data-seg="${name}">(.*?)</div>`))![1].matchAll(/data-v="(.*?)"/g)].map(m => m[1]);
const node = (v = "") => ({ dataset: { v }, classList: { toggle: vi.fn() }, setAttribute: vi.fn() });
beforeEach(() => {
  env.lift = true; env.nodes.clear(); env.render.mockClear();
  Object.assign(segState, { train: "lib", stats: "rest", profile: "settings", bm: "now" });
  const segs = new Map(["train", "stats"].map(n => [n, { querySelectorAll: () => order(n).map(v => node(v)) }]));
  for (const n of ["train", "stats"]) for (const v of order(n)) env.nodes.set(`#${n}-${v}`, node());
  for (const n of ["home", "train", "history", "progress", "profile"]) env.nodes.set(`#tab-${n}`, node());
  vi.stubGlobal("document", { querySelector: (s: string) => segs.get(s.match(/data-seg="(.*?)"/)![1]), querySelectorAll: () => [] });
  vi.stubGlobal("sessionStorage", { getItem: vi.fn(() => null), setItem: vi.fn() });
  vi.stubGlobal("scrollY", 0); vi.stubGlobal("scrollTo", vi.fn());
});
it("defaults train/lib and stats/rest with immediate render", () => {
  expect(segState.train).toBe("lib"); expect(segState.stats).toBe("rest"); expect(segState.bm).toBe("now");
  renderSeg("train"); renderSeg("stats"); expect(env.render).toHaveBeenCalledTimes(2);
});
it("places lib and rest first in real markup", () => {
  expect(order("train")).toEqual(["lib", "prog", "log", "plan"]);
  expect(order("stats")).toEqual(["rest", "week", "hist", "rec", "power", "body"]);
});
it("restores old saved segments and the body map view", () => {
  vi.mocked(sessionStorage.getItem).mockReturnValue(JSON.stringify({ tab: "train", seg: { train: "prog", stats: "week", bm: "week" } }));
  restoreNav(); expect(segState.train).toBe("prog"); expect(segState.stats).toBe("week"); expect(segState.bm).toBe("week");
});
it("yoga uses the first visible segment even with rest first in DOM", () => {
  env.lift = false; renderSeg("stats"); expect(segState.stats).toBe("week");
  segState.stats = "power"; renderSeg("stats"); expect(segState.stats).toBe("week");
});
it("rejects obsolete segment ids safely", () => {
  segState.train = "invalid"; renderSeg("train"); expect(segState.train).toBe("lib");
});
