// @ts-nocheck
import { readFileSync } from "node:fs";
import { beforeAll, expect, it, vi } from "vitest";
const stub = () => new Proxy(function () {}, {
  get: (_t, k) => k === Symbol.toPrimitive ? () => "" : k === "length" ? 0 : stub(),
  apply: () => stub(), construct: () => stub(), set: () => true,
});
let map;
beforeAll(async () => {
  const ls = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  vi.stubGlobal("localStorage", ls); vi.stubGlobal("sessionStorage", ls);
  for (const g of ["document", "window", "navigator", "matchMedia", "addEventListener", "requestAnimationFrame"]) vi.stubGlobal(g, stub());
  map = await import("../src/app/bodymap.js");
});
const src = rel => readFileSync(new URL(rel, import.meta.url), "utf8");

it("program load maps render without the tap class", () => {
  const weekly = map.weeklyLoadHTML({ load: { "Göğüs": 10, Lat: 5 }, averaged: false }, { small: false });
  const session = map.sessionLoadHTML([{ ex: "Bench Press (Barbell)", sets: 3 }], { small: false });
  for (const html of [weekly, session]) {
    expect(html).toContain('class="bodymap');
    expect(html).not.toMatch(/class="bodymap[^"]*\btap\b/);
    expect(html).not.toMatch(/dokun|Tap |açılır|hareketler açılır/i);
  }
  expect(session).not.toContain('data-tap=');
});

it("the program map call site no longer enables tapping", () => {
  const programs = src("../src/app/programs.js");
  const block = programs.slice(programs.indexOf("export function openProgramMap"), programs.indexOf("// Program yazarken"));
  expect(block).toContain("{ small: false }");
  expect(block).not.toMatch(/tap:\s*true/);
});

it("the live summary and preset previews do not enable tapping", () => {
  expect(src("../src/app/live.js")).not.toMatch(/sessionLoadHTML\([^)]*tap:\s*true/);
  expect(src("../src/app/presets.js")).not.toMatch(/tap:\s*true/);
  expect(src("../src/app/weekly-map.js")).not.toMatch(/tap:\s*true/);
});
