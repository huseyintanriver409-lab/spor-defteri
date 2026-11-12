// @ts-nocheck
import { it, expect, vi, beforeEach } from "vitest";
// @ts-ignore Node runtime is available to Vitest without @types/node
import { readdirSync } from "node:fs";
// Guards against "Cannot access 'x' before initialization": real (unmocked) app modules must evaluate
// without throwing despite the circular import graph. No DOM library is installed, so a minimal stub is used.
const stub = (): any => new Proxy(function () {}, {
  get: (_t, k) => k === Symbol.toPrimitive ? () => "" : k === "length" ? 0 : stub(),
  apply: () => stub(), construct: () => stub(), set: () => true,
});
const mods: string[] = (readdirSync(new URL("../src/app", import.meta.url)) as string[]).filter(f => f.endsWith(".js")).sort();
beforeEach(() => {
  vi.resetModules();
  const mem = new Map<string, string>();
  const ls = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, String(v)), removeItem: (k: string) => void mem.delete(k) };
  vi.stubGlobal("localStorage", ls); vi.stubGlobal("sessionStorage", ls);
  vi.stubGlobal("document", stub()); vi.stubGlobal("window", stub());
  for (const g of ["navigator", "matchMedia", "addEventListener", "requestAnimationFrame", "setInterval"]) if (g !== "setInterval") vi.stubGlobal(g, stub());
});
it("app.js entry order: store.js first, then every app module, loads without throwing", { timeout: 30000 }, async () => {
  await import("../src/app/store.js");
  for (const m of mods) await import(/* @vite-ignore */ `../src/app/${m}`);
});
it.each(mods)("%s loads as the first entry of a fresh module graph", { timeout: 30000 }, async m => {
  await expect(import(/* @vite-ignore */ `../src/app/${m}`)).resolves.toBeTruthy();
});
