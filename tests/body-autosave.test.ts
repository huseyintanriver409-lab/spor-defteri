vi.mock("../src/app/equipment.js", () => ({ mountEquipment: vi.fn(), setOwnedEquipment: vi.fn() }));
import { beforeEach, expect, it, vi } from "vitest";
const env = vi.hoisted(() => {
 const nodes = new Map<string, any>(), state = { body: [] as any[] };
 const node = (key: string) => {
  if (!nodes.has(key)) nodes.set(key, { value: "", innerHTML: "", classList: { toggle() {} }, querySelectorAll: () => [], addEventListener() {}, reportValidity: () => true });
  return nodes.get(key);
 };
 return { nodes, state, node };
});
vi.mock("../src/app/store.js", () => ({ $: env.node, state: env.state, LIB: {}, YOGA: {}, save: vi.fn(), esc: String, fmt: String, ic: () => "" }));
vi.mock("../src/app/exercises.js", () => ({ EQUIPS: [], groupShown: () => true, yogaOn: () => true }));
vi.mock("../src/app/ui.js", () => ({ emptyHTML: () => "" }));
vi.mock("../src/app/stats.js", () => ({ chart: () => "" }));
vi.mock("../src/app/yoga.js", () => ({}));
vi.mock("../src/app/log.js", () => ({}));
vi.mock("../src/app/live.js", () => ({}));
vi.mock("../src/app/bodymap.js", () => ({}));
// @ts-expect-error JavaScript app module
import { setup, renderBody } from "../src/app/library.js";
beforeEach(() => { env.nodes.clear(); env.state.body = []; vi.stubGlobal("document", { addEventListener: vi.fn() }); setup(); env.node("#bDate").value = "2026-11-10"; });
it("U10: measurement changes update one record per day and preserve other fields", () => {
 env.node("#b_weight").value = "80"; env.node("#b_weight").onchange();
 env.node("#b_waist").value = "90"; env.node("#b_waist").onchange();
 env.node("#b_weight").value = "81"; env.node("#b_weight").onchange();
 expect(env.state.body).toEqual([{ date: "2026-11-10", weight: 81, waist: 90 }]);
});
it("U10: changing date loads that date without copying previous measurements", () => {
 env.state.body = [{ date: "2026-11-10", weight: 80 }]; renderBody();
 env.node("#bDate").value = "2026-11-11"; env.node("#bDate").onchange();
 expect(env.node("#b_weight").value).toBe("");
 env.node("#b_waist").value = "90"; env.node("#b_waist").onchange();
 expect(env.state.body).toEqual([{ date: "2026-11-10", weight: 80 }, { date: "2026-11-11", waist: 90 }]);
});
it("U10: empty values preserve saved measurements, signed reach remains supported", () => {
 env.state.body = [{ date: "2026-11-10", weight: 80 }];
 env.node("#b_weight").value = ""; env.node("#b_weight").onchange();
 env.node("#b_reach").value = "-4"; env.node("#b_reach").onchange();
 expect(env.state.body).toEqual([{ date: "2026-11-10", weight: 80, reach: -4 }]);
});
