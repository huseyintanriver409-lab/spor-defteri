import { expect, it, vi } from "vitest";
import { DEFAULTS } from "../src/core/schema.ts";
import { sessionEntries } from "../src/core/session-load.ts";
const env = vi.hoisted(() => ({ fields: { "#logEx": { value: "Deadlift" }, "#logDate": { value: "day" } } as Record<string, any> }));
vi.mock("../src/app/store.js", async () => ({
 ...await import("../src/core/library.ts"), state: DEFAULTS(), $: (q: string) => env.fields[q], fmt: String,
 ask: vi.fn(), esc: String, ic: vi.fn(), save: vi.fn(), toast: vi.fn(), uid: () => "id",
}));
vi.mock("../src/app/ui.js", () => ({}));
vi.mock("../src/app/programs.js", () => ({}));
// @ts-expect-error JavaScript app surface.
import { rowData, setRow } from "../src/app/log.js";
// @ts-expect-error JavaScript app surface.
import { state } from "../src/app/store.js";
function row(original: any, existing: boolean, r = "12") {
 const fields: Record<string, any> = { ".w": { value: "50" }, ".r": { value: r }, ".n": { dataset: { t: "" } }, ".rir": { value: "" } };
 return { _setOriginal: original, _setExisting: existing, querySelector: (q: string) => fields[q] };
}
it("editing/reordering old rows preserves session membership while new editor rows are stamped", () => {
 state.live = { date: "day", sessionId: "second" };
 const old = rowData(row({ r: 8, sid: "first" }, true));
 const current = rowData(row({ r: 8, sid: "second", sides: [{ r: 8 }, { r: 8 }] }, true));
 const unmarkedOld = rowData(row({ r: 8 }, true));
 const added = rowData(row({}, false));
 expect(old.sid).toBe("first"); expect(current.sid).toBe("second"); expect(current.sides).toHaveLength(2);
 expect(unmarkedOld.sid).toBeUndefined(); expect(added.sid).toBe("second");
 const entries = [{ id: "new-id", ex: "Deadlift", date: "day", sets: [added, current, old, unmarkedOld] }];
 expect(sessionEntries(entries, state.live)).toEqual([{ ex: "Deadlift", sets: 2 }]);
 expect(sessionEntries([{ ...entries[0], sets: [added, current, old] }], state.live)).toEqual([{ ex: "Deadlift", sets: 2 }]);
 state.live = null;
});

it("new prefilled setRow is stamped while an explicitly restored existing row is preserved", () => {
 state.live = { date: "day", sessionId: "second" };
 const children: any[] = [];
 env.fields["#setRows"] = { children, appendChild: (d: any) => children.push(d) };
 vi.stubGlobal("document", { createElement: () => {
  const fields: Record<string, any> = { ".w": { value: "50" }, ".r": { value: "8" }, ".n": { dataset: { t: "" }, setAttribute() {} }, ".rir": { value: "" }, ".x": {} };
  return { querySelector: (q: string) => fields[q], innerHTML: "" };
 } });
 try {
  const added = setRow({ w: 50, r: 8 });
  const existing = setRow({ w: 50, r: 8, _existing: true });
  expect(rowData(added).sid).toBe("second");
  expect(rowData(existing).sid).toBeUndefined();
  expect(rowData(existing)).not.toHaveProperty("_existing");
 } finally { vi.unstubAllGlobals(); state.live = null; }
});
