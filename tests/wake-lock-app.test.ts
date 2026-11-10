import { it, expect, vi, afterEach } from "vitest";
const env = vi.hoisted(() => ({ state: { prefs: { wake: true, haptics: true } } }));
vi.mock("../src/app/store.js", () => ({ state: env.state }));
vi.mock("../src/app/exercises.js", () => ({}));
vi.mock("../src/app/log.js", () => ({}));
vi.mock("../src/app/programs.js", () => ({}));
vi.mock("../src/app/live.js", () => ({}));
vi.mock("../src/app/home.js", () => ({}));
vi.mock("../src/app/history.js", () => ({}));
vi.mock("../src/app/stats.js", () => ({}));
vi.mock("../src/app/library.js", () => ({}));
vi.mock("../src/app/tools.js", () => ({}));
vi.mock("../src/app/backup.js", () => ({}));
vi.mock("../src/app/settings.js", () => ({}));
vi.mock("../src/app/cloud.js", () => ({}));
vi.mock("../src/app/streak.js", () => ({}));
// @ts-expect-error JavaScript app module
import { buzz, keepAwake, wakeLock } from "../src/app/ui.js";
afterEach(async () => { await keepAwake(false); env.state.prefs = { wake: true, haptics: true }; vi.unstubAllGlobals(); });
function lock() { return { release: vi.fn(async () => {}), addEventListener: vi.fn() }; }
it("Y2: concurrent wake requests share a lock and release on stop", async () => {
  const held = lock(), request = vi.fn(async () => held);
  vi.stubGlobal("navigator", { wakeLock: { request } });
  await Promise.all([keepAwake(true), keepAwake(true), keepAwake(true)]);
  expect(request).toHaveBeenCalledTimes(1); expect(wakeLock).toBe(held);
  await keepAwake(false); expect(held.release).toHaveBeenCalledTimes(1); expect(wakeLock).toBeNull();
});
it("Y2: a request resolving after cancellation is immediately released", async () => {
  let resolve!: (value: unknown) => void;
  const held = lock(), request = vi.fn(() => new Promise(r => { resolve = r; }));
  vi.stubGlobal("navigator", { wakeLock: { request } });
  const pending = keepAwake(true); await keepAwake(false); resolve(held); await pending;
  expect(held.release).toHaveBeenCalledTimes(1); expect(wakeLock).toBeNull();
});
it("Y2: unsupported and rejected wake locks are silent", async () => {
  vi.stubGlobal("navigator", {}); await expect(keepAwake(true)).resolves.toBeUndefined();
  vi.stubGlobal("navigator", { wakeLock: { request: vi.fn().mockRejectedValue(new Error("denied")) } });
  await expect(keepAwake(true)).resolves.toBeUndefined(); expect(wakeLock).toBeNull();
});
it("Y1/Y2: preferences gate haptics and screen requests", async () => {
  const vibrate = vi.fn(), request = vi.fn(); vi.stubGlobal("navigator", { vibrate, wakeLock: { request } });
  env.state.prefs = { wake: false, haptics: false }; buzz([40,60,40]); await keepAwake(true);
  expect(vibrate).not.toHaveBeenCalled(); expect(request).not.toHaveBeenCalled();
  env.state.prefs.haptics = true; buzz([20,40,20,40,20]); expect(vibrate).toHaveBeenCalledWith([20,40,20,40,20]);
});
