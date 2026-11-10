import { describe, expect, it } from "vitest";
import { bodyModel, setGender } from "../src/core/body-model.ts";
import { DEFAULTS, withDefaults } from "../src/core/schema.ts";
// @ts-expect-error Node types are not installed.
import { readFileSync } from "node:fs";

describe("independent body model", () => {
  it.each(["m", "f"])("gender %s supplies a default that can be overridden", sex => {
    const state = DEFAULTS();
    setGender(state, sex);
    expect(bodyModel(state.prefs)).toBe(sex);
    state.prefs.body = sex === "m" ? "f" : "m";
    expect(bodyModel(state.prefs)).not.toBe(sex);
    expect(state.profile.sex).toBe(sex);
    expect(bodyModel(withDefaults(JSON.parse(JSON.stringify(state))).prefs)).toBe(state.prefs.body);
  });
  it.each(["o", ""])("gender %s preserves the drawing preference", sex => {
    const state = DEFAULTS(); state.prefs.body = "f";
    setGender(state, sex);
    expect(state.profile.sex).toBe(sex);
    expect(bodyModel(state.prefs)).toBe("f");
  });
  it("loads old saves without requiring a new field or schema", () => {
    expect(bodyModel(withDefaults({ profile: { sex: "" } }).prefs)).toBe("m");
    expect(bodyModel(withDefaults({ profile: { sex: "o" }, prefs: { body: "f" } }).prefs)).toBe("f");
  });
  it("derives the model from sex only when prefs.body was never saved", () => {
    expect(bodyModel(withDefaults({ profile: { sex: "f" } }).prefs)).toBe("f");
    expect(bodyModel(withDefaults({ profile: { sex: "m" } }).prefs)).toBe("m");
    expect(bodyModel(withDefaults({ profile: { sex: "f" }, prefs: { body: "m" } }).prefs)).toBe("m");
    expect(bodyModel(withDefaults({ profile: { sex: "o" } }).prefs)).toBe("m");
  });
  it("offers all four genders and keeps the general model selector available", () => {
    const html = readFileSync("spor-defteri.html", "utf8");
    const gender = html.match(/<select id="bSex">([\s\S]*?)<\/select>/)![1];
    expect([...gender.matchAll(/value="([^"]*)"/g)].map(x => x[1])).toEqual(["m", "f", "o", ""]);
    expect(html).toContain('id="profileModelWrap"');
    const settings = readFileSync("src/app/settings.js", "utf8");
    expect(settings).toContain('$("#bBodyWrap").classList.remove("hidden")');
    expect(settings).toContain('setGender(state, $("#bSex").value)');
    const onboarding = readFileSync("src/app/presets.js", "utf8");
    expect(onboarding).toContain('["", t("html.sex_none")]');
    expect(onboarding).toContain('setGender(state, a.sex)');
    expect(onboarding).toContain('$("#onboardModel").classList.toggle("hidden", ["m", "f"].includes(a.sex))');
  });
});
