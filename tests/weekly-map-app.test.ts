// @ts-nocheck
import { beforeAll, expect, it, vi } from "vitest";
const stub = () => new Proxy(function () {}, {
  get: (_t, k) => k === Symbol.toPrimitive ? () => "" : k === "length" ? 0 : stub(),
  apply: () => stub(), construct: () => stub(), set: () => true,
});
let map, state, programWeek, preference = "tr";
beforeAll(async () => {
  const ls = { getItem: k => k === "sporDefteri.lang" ? preference : null, setItem: () => {}, removeItem: () => {} };
  vi.stubGlobal("localStorage", ls); vi.stubGlobal("sessionStorage", ls);
  for (const g of ["document", "window", "navigator", "matchMedia", "addEventListener", "requestAnimationFrame"]) vi.stubGlobal(g, stub());
  map = await import("../src/app/bodymap.js");
  ({ state } = await import("../src/app/store.js"));
  ({ programWeek } = await import("../src/app/weekly-map.js"));
});
it("session legend contains only painted ranges and neutral stretch label", () => {
  const html = map.legend("session", new Set(["g-dusuk", "g-iyi", "g-hasar"]));
  expect(html).toContain("&lt;1"); expect(html).toContain("5–7"); expect(html).toContain("Gerilme 12,5+");
  expect(html).not.toContain("data-t=\"g-koruma\"");
  expect(html).not.toMatch(/Düşük|Koruma|Minimum|Maksimum|Hasar|<details/);
});
it("weekly legend contains only painted tiers and localized ranges", () => {
  const html = map.legend("weekly", new Set(["g-w-orta", "g-w-yeterli", "g-w-yok"]));
  expect(html).toContain("Orta"); expect(html).toContain("5–9,5"); expect(html).toContain("10–20");
  expect(html).not.toContain("g-w-az"); expect(html).not.toContain("g-w-yuksek");
});
it("weekly map has average heading and no per-muscle value list", () => {
  const html = map.weeklyLoadHTML({ load: { "Göğüs": 10.26, Lat: 4.7 }, averaged: true });
  expect(html).toContain("Haftalık ortalama"); expect(html).not.toContain("weekly-values");
  expect(html).toContain('data-t="g-w-yeterli"'); expect(html).toContain('data-t="g-w-az"');
  expect(map.weeklyLoadHTML(null)).toBe("");
});
it("English legend uses decimal points and neutral stretch text", () => {
  preference = "en";
  try {
    const html = map.legend("weekly", new Set(["g-w-orta", "g-w-yeterli"]));
    expect(html).toContain("Moderate"); expect(html).toContain("5–9.5"); expect(html).toContain("Adequate");
    expect(map.legend("session", new Set(["g-hasar"]))).toContain("Stretch 12.5+");
  } finally { preference = "tr"; }
});
it("a tier hidden by a merged shoulder region stays out of the legend", () => {
  const html = map.weeklyLoadHTML({ load: { "Ön Omuz": 1, "Yan Omuz": 12, "Arka Omuz": 1 }, averaged: false });
  const legend = html.match(/<div class="bm-legend"[\s\S]*?<\/div>/)[0];
  expect(legend).toContain("g-w-yeterli"); expect(legend).not.toContain("g-w-az");
});
it("group maps use plan frequency and never fall back after plan expiry", () => {
  state.programs = [{ id: "a", name: "Group · A", items: [{ ex: "Bench Press (Barbell)", sets: 3 }] }];
  state.plan = { days: {}, dur: 60, remind: 0 };
  const once = programWeek("a").load["Göğüs"];
  state.plan.days = { MO: { prog: "a" }, TH: { prog: "a" } };
  expect(programWeek("a").load["Göğüs"]).toBe(once * 2);
  state.plan.until = "2000-01-01";
  expect(programWeek("a")).toBeNull();
});
