import { afterEach, describe, expect, it, vi } from "vitest";
import { PROGRAMS, programById, programName, presetSessionIndex, presetSessionName } from "../src/core/programs.ts";
import { plannedEvent } from "../src/core/calendar.ts";
import { DEFAULT_PLAN } from "../src/core/schema.ts";
const language = (value: string) => vi.stubGlobal("localStorage", { getItem: () => value });
afterEach(() => vi.unstubAllGlobals());
describe("saved preset names", () => {
  it("localizes every session of all twelve presets in both directions after JSON storage", () => {
    for (const from of ["tr", "en"]) {
      language(from);
      const saved = JSON.parse(JSON.stringify(PROGRAMS.flatMap(p => p.sessions.map((_, i) => ({ lib: p.id, name: presetSessionName(p, i) })))));
      const original = JSON.stringify(saved);
      language(from === "tr" ? "en" : "tr");
      expect(PROGRAMS.length).toBe(12);
      for (const p of saved) {
        const index = presetSessionIndex(p)!;
        expect(programName(p)).toBe(presetSessionName(programById(p.lib)!, index));
      }
      expect(JSON.stringify(saved)).toBe(original);
    }
  });
  it("translates existing Turkish 5x5 A and B names in English", () => {
    language("en");
    for (const session of ["A", "B"]) expect(programName({ lib: "5x5", name: `5×5 Güç · ${session}` })).toBe(`5×5 Strength · ${session}`);
  });
  it("preserves custom, renamed, copied, and unknown programs", () => {
    language("en");
    for (const p of [{name:"5×5 Güç · A"}, {lib:"5x5",name:"My strength"}, {lib:"unknown",name:"Özel"}, {lib:"5x5",name:"5×5 Güç · A",customName:true}]) expect(programName(p)).toBe(p.name);
  });
  it("refreshes catalog descriptions and session labels without reimporting", () => {
    language("tr"); const tr = programById("ust-alt")!;
    language("en"); const en = programById("ust-alt")!;
    expect(en.name).not.toBe(tr.name); expect(en.short).not.toBe(tr.short);
    expect(en.sessions[0].name).toBe("Upper");
  });
  it("localizes calendar event titles for legacy presets", () => {
    language("en");
    const event = plannedEvent({date:"2026-11-10",code:"TU",time:"19:00",p:{id:"p",lib:"5x5",name:"5×5 Güç · A",items:[]}}, DEFAULT_PLAN(), {timeZone:"Europe/Istanbul",describe:()=>""});
    expect(event.summary).toBe("Workout: 5×5 Strength · A");
  });
});
