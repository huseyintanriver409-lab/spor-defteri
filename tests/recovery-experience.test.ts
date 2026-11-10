import { describe, expect, it } from "vitest";
import { experienceMode, experienceMultiplier, recoveryMap, sorenessPossible } from "../src/core/recovery.ts";
import { fatigueTier } from "../src/core/musclemap.ts";
import { parse } from "../src/core/dates.ts";
import { DEFAULTS, mergeStates, withDefaults } from "../src/core/schema.ts";

const at = (d: string) => parse(d).getTime() + 18 * 36e5;
const mul = (dates: string[], now: string) => experienceMultiplier(dates, {}, at(now));
describe("experience recovery", () => {
  it("never-trained muscles and the first 21 days use x2; day 21 uses x1", () => {
    expect(mul([], "2026-01-01")).toBe(2);
    expect(mul(["2026-01-01"], "2026-01-21")).toBe(2);
    expect(mul(["2026-01-01"], "2026-01-22")).toBe(1);
  });
  it("a novice doing 5x5 legs is still recovering at 48 hours", () => {
    const r = recoveryMap({ entries: [{ ex: "Squat", date: "2026-01-01", sets: Array.from({ length: 5 }, () => ({ w: 60, r: 5 })) }], sessions: [{ date: "2026-01-01", end: at("2026-01-01") }], isCardio: () => false, musclesOf: () => ({ p: ["Quadriceps"], s: [] }), now: at("2026-01-03") });
    expect(r.Quadriceps).toMatchObject({ need: 96, pct: .5, multiplier: 2 });
    expect(fatigueTier(r.Quadriceps)).toBe("toparlaniyor");
    expect(fatigueTier({ ...r.Quadriceps, pct: .1 })).toBe("toparlaniyor");
    expect(fatigueTier({ ...r.Quadriceps, pct: 1 })).toBe("hazir");
    expect(sorenessPossible(r.Quadriceps)).toBe(true);
    expect(sorenessPossible({ ...r.Quadriceps, pct: 1 })).toBe(false);
    expect(sorenessPossible({ ...r.Quadriceps, multiplier: 1 })).toBe(false);
    expect(sorenessPossible()).toBe(false);
  });
  it("multiplier is fixed by the last session date, not by today", () => {
    // 2026-01-01 first trained; legs on the 20th day are inside the 21-day window
    const full = (now: number) => recoveryMap({ entries: [
      { ex: "Squat", date: "2026-01-01", sets: [{ w: 60, r: 5 }] },
      { ex: "Squat", date: "2026-01-20", sets: Array.from({ length: 5 }, () => ({ w: 60, r: 5 })) },
    ], sessions: [{ date: "2026-01-20", end: at("2026-01-20") }], isCardio: () => false, musclesOf: () => ({ p: ["Quadriceps"], s: [] }), now }).Quadriceps;
    for (const h of [24, 48]) {
      const r = full(at("2026-01-20") + h * 36e5);
      expect(r).toMatchObject({ multiplier: 2, need: 96 });
      expect(r.pct).toBeLessThan(1);
    }
    expect(full(at("2026-01-20") + 96 * 36e5).pct).toBe(1);
  });
  it("seven months reset the period, two months open a 21-day return window", () => {
    expect(mul(["2026-01-01", "2026-08-01"], "2026-08-02")).toBe(2);
    expect(mul(["2026-01-01", "2026-03-01"], "2026-03-02")).toBe(1.5);
    expect(mul(["2026-01-01", "2026-03-01"], "2026-03-22")).toBe(1);
  });
  it("distinguishes the exact 30- and 183-day boundaries", () => {
    expect(mul(["2026-01-01", "2026-01-30"], "2026-01-30")).toBe(1);
    expect(mul(["2026-01-01", "2026-01-31"], "2026-01-31")).toBe(1.5);
    expect(mul(["2026-01-01", "2026-07-02"], "2026-07-02")).toBe(1.5);
    expect(mul(["2026-01-01", "2026-07-03"], "2026-07-03")).toBe(2);
  });
  it("Active always uses x1; New and Back are minimums and expire to Auto", () => {
    const now = at("2026-04-01");
    expect(experienceMultiplier([], { exp: "active" }, now)).toBe(1);
    for (const [exp, minimum] of [["new", 2], ["back", 1.5]] as const) {
      const profile = { exp, expAt: now };
      expect(experienceMultiplier(["2026-01-01"], profile, now)).toBe(minimum);
      expect(experienceMode(profile, now + 21 * 864e5)).toBe("auto");
      expect(experienceMultiplier(["2026-01-01"], profile, now + 21 * 864e5)).toBe(1);
    }
    expect(experienceMultiplier([], { exp: "back", expAt: now }, now)).toBe(2);
  });
  describe("profile chosen relative to the session", () => {
    const t0 = at("2026-03-25"), H = 36e5;
    const run = (profile: { exp: "new" | "back"; expAt: number }, now: number) => recoveryMap({ entries: [
      { ex: "Squat", date: "2026-03-01", sets: [{ w: 60, r: 5 }] },
      { ex: "Squat", date: "2026-03-25", sets: Array.from({ length: 5 }, () => ({ w: 60, r: 5 })) },
    ], sessions: [{ date: "2026-03-25", end: t0 }], isCardio: () => false, musclesOf: () => ({ p: ["Quadriceps"], s: [] }), profile, now }).Quadriceps;
    it("New picked after the session still covers it while the window is open", () => {
      const r = run({ exp: "new", expAt: t0 + 2 * H }, t0 + 48 * H);
      expect(r).toMatchObject({ multiplier: 2, need: 96 });
      expect(r.pct).toBeLessThan(1);
      expect(sorenessPossible(r)).toBe(true);
      expect(run({ exp: "back", expAt: t0 + 2 * H }, t0 + 48 * H).multiplier).toBe(1.5);
    });
    it("a selection made 30 days ago does not touch today's session (Auto, x1)", () => {
      expect(run({ exp: "new", expAt: t0 - 30 * 864e5 }, t0 + 2 * H).multiplier).toBe(1);
    });
    it("a session inside the window keeps x2 after the window ends", () => {
      expect(run({ exp: "new", expAt: t0 - H }, t0 + 22 * 864e5).multiplier).toBe(2);
    });
    it("explicit realNow argument is backward compatible", () => {
      const p = { exp: "new" as const, expAt: t0 + 2 * H };
      expect(experienceMultiplier(["2026-03-01", "2026-03-25"], p, t0)).toBe(1);
      expect(experienceMultiplier(["2026-03-01", "2026-03-25"], p, t0, t0 + 48 * H)).toBe(2);
    });
  });
  it("old profiles default to Auto, without migration", () => {
    expect(experienceMode(withDefaults({ profile: { sex: "m" } }).profile)).toBe("auto");
  });
  it("multiplies both volume and failure additions and keeps muscle histories independent", () => {
    const r = recoveryMap({ entries: [
      { ex: "Arms", date: "2026-01-01", sets: [{ w: 10, r: 5 }] },
      { ex: "Arms", date: "2026-01-25", sets: [{ w: 10, r: 5 }] },
      { ex: "Legs", date: "2026-01-25", sets: Array.from({ length: 8 }, () => ({ w: 60, r: 5, t: "f" })) },
    ], sessions: [], isCardio: () => false, musclesOf: ex => ({ p: [ex === "Legs" ? "Quadriceps" : "Biceps"], s: [] }), now: at("2026-01-26") });
    expect(r.Quadriceps.need).toBe(192);
    expect(r.Biceps.need).toBe(24);
  });
  it("merge preserves the new profile fields in either direction and with older clients", () => {
    const old = DEFAULTS(), selected = DEFAULTS();
    selected.profile = { ...selected.profile, exp: "new", expAt: at("2026-01-01") }; selected.settingsU = 10;
    expect(mergeStates(old, selected).state.profile).toEqual(selected.profile);
    expect(mergeStates(selected, old).state.profile).toEqual(selected.profile);
    old.settingsU = 20;
    expect(mergeStates(selected, old).state.profile).toMatchObject({ exp: "new", expAt: selected.profile.expAt });
    old.profile.exp = "auto"; old.profile.expAt = 30;
    expect(mergeStates(selected, old).state.profile.exp).toBe("auto");
  });
});
