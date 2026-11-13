import { beforeEach, describe, expect, it, vi } from "vitest";
import { rankForMuscle } from "../src/core/musclemap.ts";
import { EQUIPMENT_IDS } from "../src/core/equipment.ts";
import { LIB } from "../src/core/library.ts";

vi.mock("../src/app/store.js", async () => {
  const { DEFAULTS } = await import("../src/core/schema.ts");
  const { LIB, CARDIO, YOGA } = await import("../src/core/library.ts");
  return { state: DEFAULTS(), LIB, CARDIO, YOGA, fmt: String, save: vi.fn(), esc: String, ic: () => "<svg></svg>" };
});
vi.mock("../src/app/ui.js", () => ({ openSheet: vi.fn(), sheetHead: String }));
// @ts-expect-error vanilla app module
import { state, save } from "../src/app/store.js";
// @ts-expect-error vanilla app module
import { discoverableEx, equipmentAllowed, musclesOf } from "../src/app/exercises.js";
// @ts-expect-error vanilla app module
import { bindEquipmentEmpty, equipmentEmptyHTML, mountEquipment } from "../src/app/equipment.js";
// @ts-expect-error vanilla app module
import { openSheet } from "../src/app/ui.js";

class Buttons {
  html = "";
  buttons: any[] = [];
  set innerHTML(value: string) {
    this.html = value;
    this.buttons = [...value.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(m => ({ attrs: m[1], dataset: { equipment: /data-equipment="([^"]+)"/.exec(m[1])?.[1] }, onclick: undefined }));
  }
  get innerHTML() { return this.html; }
  querySelectorAll(selector: string) { const attr = selector.slice(1, -1); return this.buttons.filter(b => new RegExp(`\\b${attr}(?:[ =]|$)`).test(b.attrs)); }
  querySelector(selector: string) { return this.querySelectorAll(selector)[0]; }
}

beforeEach(() => { state.prefs.equip = []; state.custom = []; vi.clearAllMocks(); vi.stubGlobal("document", { dispatchEvent: vi.fn() }); });

describe("equipment discovery integration", () => {
  it("filters before muscle ranking and keeps the same relative order", () => {
    const names = Object.values(LIB).flat();
    const all = rankForMuscle("Göğüs", names, musclesOf);
    state.prefs.equip = ["dumbbell"];
    const filtered = rankForMuscle("Göğüs", discoverableEx().map((e: any) => e.name), musclesOf);
    expect(filtered.map(x => x.name)).toEqual(all.filter(x => equipmentAllowed(x.name)).map(x => x.name));
    expect(filtered.some(x => x.name === "Push-up")).toBe(true);
    expect(filtered.some(x => x.name === "Bench Press (Barbell)")).toBe(false);
  });
  it("shows a normalized exercise's muscle weights", () => {
    expect(musclesOf(" bench press (barbell) ").w).toEqual(musclesOf("Bench Press (Barbell)").w);
  });
  it("persists multiple chip selections and clear with pressed states", () => {
    const root = new Buttons(); mountEquipment(root, { expanded: true });
    root.buttons.find(b => b.dataset.equipment === "dumbbell").onclick();
    root.buttons.find(b => b.dataset.equipment === "bench").onclick();
    expect(state.prefs.equip).toEqual(expect.arrayContaining(["dumbbell", "bench"]));
    expect(root.buttons.find(b => b.dataset.equipment === "bench").attrs).toContain('aria-pressed="true"');
    root.querySelector("[data-equipment-all]").onclick();
    expect(state.prefs.equip).toEqual([]); expect(save).toHaveBeenCalledTimes(3);
  });
  it("redraws badge and chips from saved selection when data loads after mount", () => {
    const listeners: Record<string, () => void> = {};
    vi.stubGlobal("document", { dispatchEvent: vi.fn(), addEventListener: (n: string, f: () => void) => { listeners[n] = f; } });
    const root = new Buttons(); mountEquipment(root, { expanded: true });
    expect(root.html).toContain('<span class="tag">Tümü</span>');
    expect(root.buttons.find(b => /data-equipment-all/.test(b.attrs)).attrs).toContain('aria-pressed="true"');
    state.prefs.equip = ["dumbbell", "bench", "band"];   // load()/sync replaces state after the first draw
    listeners.equipmentrefresh();
    expect(root.html).toContain('<span class="tag">3</span>');
    expect(root.buttons.filter(b => /aria-pressed="true"/.test(b.attrs))).toHaveLength(3);
    expect(root.buttons.find(b => b.dataset.equipment === "band").attrs).toContain('aria-pressed="true"');
  });
  it("labels all selected equipment as all only when the all option is enabled", () => {
    state.prefs.equip = [...EQUIPMENT_IDS];
    const root = new Buttons(); mountEquipment(root, { expanded: true });
    expect(root.html).toContain('<span class="tag">Tümü</span>');
    expect(root.querySelector("[data-equipment-all]").attrs).toContain('aria-pressed="true"');
    mountEquipment(root, { all: false });
    expect(root.html).toContain('<span class="tag">' + EQUIPMENT_IDS.length + '</span>');
  });
  it("offers one empty-state action that opens the shared chooser", () => {
    const root = new Buttons(); root.innerHTML = equipmentEmptyHTML();
    const panel = new Buttons();
    vi.mocked(openSheet).mockReturnValue({ querySelector: () => panel });
    bindEquipmentEmpty(root);
    expect(root.buttons).toHaveLength(1);
    root.querySelector("[data-equipment-change]").onclick();
    expect(openSheet).toHaveBeenCalledTimes(1);
    expect(panel.buttons.some(b => b.dataset.equipment === "band")).toBe(true);
  });
});

it("keeps one refresh listener per root and uses the newest mount options", () => {
 const listeners = new Set<() => void>();
 vi.stubGlobal("document", { addEventListener: (_: string, f: () => void) => listeners.add(f), removeEventListener: (_: string, f: () => void) => listeners.delete(f) });
 const root = new Buttons(); const oldGet = vi.fn(() => []); const newGet = vi.fn(() => ["bench"]);
 mountEquipment(root, { get: oldGet }); mountEquipment(root, { get: newGet });
 oldGet.mockClear(); newGet.mockClear(); listeners.forEach(f => f());
 expect(listeners.size).toBe(1); expect(oldGet).not.toHaveBeenCalled(); expect(newGet).toHaveBeenCalledTimes(1);
 expect(root.html).toContain('<span class="tag">1</span>');
});
