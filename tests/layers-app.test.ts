import { expect, it, vi } from "vitest";
// @ts-ignore vanilla app module
import { createLayers } from "../src/app/layers.js";

function browser(initial: any = null){
  const entries: any[] = [initial], listeners = new Map<string, Function>();
  let index = 0, queued = 0;
  const history = {
    get state(){ return entries[index]; },
    pushState: vi.fn((state: any) => { entries.splice(++index); entries.push(structuredClone(state)); }),
    replaceState: vi.fn((state: any) => { entries[index] = structuredClone(state); }),
    back: vi.fn(() => { queued++; }),
  };
  const win = { history, addEventListener: (k: string, f: Function) => listeners.set(k, f), removeEventListener: (k: string) => listeners.delete(k) };
  return { win, history, entries,
    flush(){ let guard = 30; while (queued && guard--) { queued--; index = Math.max(0, index - 1); listeners.get("popstate")?.({ state: history.state }); } if (queued) throw Error("traversal loop"); },
    back(){ history.back(); this.flush(); },
    escape(){ listeners.get("keydown")?.({ key: "Escape", preventDefault: vi.fn() }); },
  };
}
it("open -> browser Back dismisses exactly once", () => {
  const b = browser(), m = createLayers(b.win), dismiss = vi.fn();
  m.open("bs", dismiss); b.back(); expect(dismiss).toHaveBeenCalledTimes(1);
  expect(b.history.pushState).toHaveBeenCalledTimes(1);
});
it("X consumes history asynchronously without dismissing twice", async () => {
  const b = browser(), m = createLayers(b.win), dismiss = vi.fn();
  m.open("bs", dismiss); m.close("bs"); m.close("bs");
  await Promise.resolve(); expect(b.history.back).toHaveBeenCalledTimes(1); b.flush();
  expect(dismiss).toHaveBeenCalledTimes(1);
});
it("two nested layers need two Back presses", () => {
  const b = browser(), m = createLayers(b.win), a = vi.fn(), c = vi.fn();
  m.open("focus", a); m.open("bs", c); b.back();
  expect(c).toHaveBeenCalledTimes(1); expect(a).not.toHaveBeenCalled();
  b.back(); expect(a).toHaveBeenCalledTimes(1);
});
it("reopening the same layer updates its callback without pushing", () => {
  const b = browser(), m = createLayers(b.win), a = vi.fn(), c = vi.fn();
  m.open("reel", a); m.open("reel", c);
  expect(b.history.pushState).toHaveBeenCalledTimes(1);
  b.back(); expect(a).not.toHaveBeenCalled(); expect(c).toHaveBeenCalledTimes(1);
});
it("close then immediate open reuses the entry without a traversal", () => {
  const b = browser(), m = createLayers(b.win), a = vi.fn(), c = vi.fn();
  m.open("reel", a); m.close("reel"); m.open("bs", c);
  expect(b.history.pushState).toHaveBeenCalledTimes(1);
  b.flush(); expect(b.history.pushState).toHaveBeenCalledTimes(1);
  expect(b.history.replaceState).toHaveBeenCalledTimes(1); expect(b.history.back).not.toHaveBeenCalled();
  expect(c).not.toHaveBeenCalled(); expect(b.history.state["sporDefteri.layers"].path).toHaveLength(1);
  b.back(); expect(c).toHaveBeenCalledTimes(1); expect(b.history.state).toBeNull();
});
it("popstate with no layer does nothing", () => {
  const b = browser(); createLayers(b.win); b.back();
  expect(b.history.back).toHaveBeenCalledTimes(1); expect(b.history.pushState).not.toHaveBeenCalled();
});
it("replacement closed before traversal leaves no extra entry", async () => {
  const b = browser(), m = createLayers(b.win), c = vi.fn();
  m.open("reel", vi.fn()); m.close("reel"); m.open("bs", c); m.close("bs"); await Promise.resolve(); b.flush();
  expect(c).toHaveBeenCalledTimes(1); expect(b.history.pushState).toHaveBeenCalledTimes(1);
});
it("closing a parent while a child is open rebuilds only the surviving child", async () => {
  const b = browser(), m = createLayers(b.win), c = vi.fn();
  m.open("focus", vi.fn()); m.open("bs", c); m.close("focus"); await Promise.resolve(); b.flush();
  expect(c).not.toHaveBeenCalled(); expect(b.history.state["sporDefteri.layers"].path).toHaveLength(1);
  b.back(); expect(c).toHaveBeenCalledTimes(1); expect(b.history.state).toBeNull();
});
it("Escape closes only the top layer", async () => {
  const b = browser(), m = createLayers(b.win), a = vi.fn(), c = vi.fn();
  m.open("focus", a); m.open("modal", c); b.escape(); await Promise.resolve(); b.flush();
  expect(c).toHaveBeenCalledTimes(1); expect(a).not.toHaveBeenCalled();
});
it("preserves foreign state and URL by omitting the URL argument", () => {
  const b = browser({ external: 42 }), m = createLayers(b.win);
  m.open("bs", vi.fn()); expect(b.history.state.external).toBe(42);
  expect(b.history.pushState.mock.calls[0]).toHaveLength(2);
});
it("reload does not resurrect overlays from a previous manager", () => {
  const b = browser(), first = createLayers(b.win), old = vi.fn();
  first.open("focus", old); first.open("bs", old); first.destroy();
  b.history.back.mockClear(); b.history.replaceState.mockClear();
  const m = createLayers(b.win);
  expect(b.history.back).not.toHaveBeenCalled();
  expect(b.history.replaceState).toHaveBeenCalledTimes(1);
  expect(b.history.state?.["sporDefteri.layers"]).toBeUndefined();
  const dismiss = vi.fn(); m.open("reel", dismiss); b.back();
  expect(dismiss).toHaveBeenCalledTimes(1); expect(old).not.toHaveBeenCalled();
});

it("opening while a traversal is already pending waits for popstate", async () => {
  const b = browser(), m = createLayers(b.win), c = vi.fn();
  m.open("reel", vi.fn()); m.close("reel"); await Promise.resolve();
  m.open("bs", c); expect(b.history.pushState).toHaveBeenCalledTimes(1);
  b.flush(); expect(b.history.pushState).toHaveBeenCalledTimes(2);
  expect(c).not.toHaveBeenCalled(); b.back(); expect(c).toHaveBeenCalledTimes(1);
});
