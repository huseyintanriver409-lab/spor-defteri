import { describe, it, expect } from "vitest";
import html from "../spor-defteri.html?raw";
import tr from "../src/i18n/tr/index.ts";
import en from "../src/i18n/en/index.ts";
import { detectLang, fmtNum, t } from "../src/core/i18n.ts";

const flat = (d: Record<string, Record<string, string>>) =>
  Object.fromEntries(Object.entries(d).flatMap(([ns, o]) => Object.entries(o).map(([k, v]) => [ns + "." + k, v])));
const TR = flat(tr), EN = flat(en);
const holders = (s: string) => [...new Set([...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]))].sort().join(",");

const sources = import.meta.glob<string>("../src/**/*.{js,ts}", { query: "?raw", import: "default", eager: true });

describe("i18n sözlükleri", () => {
  it("tr ve en aynı ad alanı ve anahtar kümesine sahip", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(tr).sort());
    expect(Object.keys(EN).sort()).toEqual(Object.keys(TR).sort());
  });
  it("boş değer yok", () => {
    for (const [k, v] of [...Object.entries(TR), ...Object.entries(EN)]) expect(v.trim(), k).not.toBe("");
  });
  it("yer tutucu kümeleri aynı", () => {
    for (const k of Object.keys(TR)) expect(holders(EN[k]), k).toBe(holders(TR[k]));
  });
  it("kodda ve HTML'de kullanılan anahtarlar tanımlı", () => {
    const keys = new Set<string>();
    for (const [f, src] of Object.entries(sources)) if (!f.includes("/i18n/")) for (const m of src.matchAll(/\bt\(\s*(["'])([a-z0-9_]+\.[a-z0-9_]+)\1/g)) keys.add(m[2]);
    for (const m of html.matchAll(/data-i18n(?:-html|-title|-aria|-placeholder)?="([^"]+)"/g)) keys.add(m[1]);
    for (const k of keys) { expect(TR[k], "tr " + k).toBeDefined(); expect(EN[k], "en " + k).toBeDefined(); }
  });
});

describe("i18n işlevleri", () => {
  it("detectLang", () => {
    expect(detectLang("tr-TR")).toBe("tr"); expect(detectLang("TR")).toBe("tr");
    expect(detectLang("en-US")).toBe("en"); expect(detectLang("de")).toBe("en"); expect(detectLang()).toBe("en");
  });
  it("t: yer tutucu ve geri düşüş (node'da varsayılan tr)", () => {
    expect(t("settings.lang_label")).toBe("Dil");
    expect(t("yok.anahtar")).toBe("yok.anahtar");
    expect(t("anahtarsiz")).toBe("anahtarsiz");
  });
  it("fmtNum tr varsayılan", () => { expect(fmtNum(1234.5)).toBe("1.234,5"); });
  it("fmtNum ve t en tercihinde", () => {
    const g = globalThis as any, old = g.localStorage;
    g.localStorage = { getItem: () => "en", setItem() {} };
    try { expect(fmtNum(1234.5)).toBe("1,234.5"); expect(t("settings.lang_label")).toBe("Language"); }
    finally { if (old === undefined) delete g.localStorage; else g.localStorage = old; }
  });
});
