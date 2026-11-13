import { expect, it } from "vitest";
import { sessionTierRange, visibleSessionTiers } from "../src/core/session-legend.ts";

it("keeps only painted session tiers in scale order, without duplicates or unpainted colors", () => {
  expect(visibleSessionTiers(["g-hasar", "g-yok", "g-iyi", "g-dusuk", "g-iyi", "hazir"]))
    .toEqual(["dusuk", "iyi", "hasar"]);
  expect(visibleSessionTiers(new Set(["g-yok"]))).toEqual([]);
  expect(visibleSessionTiers()).toEqual([]);
});

it("labels all set ranges and leaves risk and empty tiers without a range", () => {
  expect(visibleSessionTiers(["g-dusuk", "g-koruma", "g-minimum", "g-iyi", "g-yuksek", "g-maksimum", "g-hasar"])
    .map(sessionTierRange)).toEqual(["<1", "1–3", "3–5", "5–7", "7–9", "9+", ""]);
  expect(sessionTierRange("yok")).toBe("");
});
