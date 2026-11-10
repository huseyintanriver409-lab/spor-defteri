import { it, expect, vi } from "vitest";
import cloud from "../src/app/cloud.js?raw";
import { YOGA } from "../src/core/library.ts";
import { runCalendar, TASK_MARK, dayEventId, type CalendarState, type Task } from "../src/core/calendar.ts";
import { programVisible } from "../src/core/yoga.ts";
const p = { id: "p", name: "Push", items: [{ ex: "Press", sets: 3 }] };
const h = { now: new Date(2026, 10, 1, 12).getTime(), timeZone: "Europe/Istanbul", describeProgram: () => "old template", describeSession: () => ({ title: "Done", details: "" }) };
const state = (task = false): CalendarState => ({ gcal: { log: false, plan: true, id: "cal", planSig: "d1:old", dated: 1, dates: ["2026-11-03"], mode: task ? "task" : "event", taskList: "list" }, plan: { days: { MO: { prog: "p" } }, dur: 60, remind: 0, until: "2026-11-02" }, programs: [p], sessions: [] });
const calendar = () => ({ createCalendar: vi.fn(async () => "cal"), upsertEvent: vi.fn(async () => {}), deleteEvent: vi.fn(async () => {}) });
function tasks(list: Task[]) {
  return { createList: vi.fn(async () => "list"), listTasks: vi.fn(async () => list.map(t => ({ ...t }))), insertTask: vi.fn(async (_: string, body: object) => { list.push({ id: "new", ...body }); }), patchTask: vi.fn(async (_: string, id: string, body: object) => { Object.assign(list.find(t => t.id === id)!, body); }), deleteTask: vi.fn(async (_: string, id: string) => { const i = list.findIndex(t => t.id === id); if (i >= 0) list.splice(i, 1); }) };
}
it("B5: failed obsolete date deletion does not prevent writing and retries with unchanged signature", async () => {
  const s = state(), c = calendar(); c.deleteEvent.mockRejectedValueOnce(new Error("offline"));
  await runCalendar(s, c, h);
  expect(c.upsertEvent).toHaveBeenCalledWith("cal", dayEventId("2026-11-02"), expect.anything());
  expect(s.gcal.dates).toContain("2026-11-03");
  await runCalendar(s, c, h);
  expect(c.deleteEvent).toHaveBeenCalledTimes(2);
  expect(s.gcal.dates).not.toContain("2026-11-03");
});
it("B5: each legacy recurring deletion is isolated and retried", async () => {
  const s = state(), c = calendar(); s.gcal.dated = 0; c.deleteEvent.mockRejectedValueOnce(new Error("offline"));
  await runCalendar(s, c, h); expect(c.upsertEvent).toHaveBeenCalled(); expect(s.gcal.dated).toBe(0);
  await runCalendar(s, c, h); expect(s.gcal.dated).toBe(1);
});
it("B6: prefix alone, wrong notes and out-of-range exact titles remain untouched", async () => {
  const list: Task[] = [
    { id: "manual", title: "Antrenman: X", due: "2026-10-01" },
    { id: "notes", title: "Antrenman: Push", notes: "personal", due: "2026-11-02" },
    { id: "past", title: "Antrenman: Push", due: "2026-10-26" },
  ];
  const tc = tasks(list); await runCalendar(state(true), calendar(), h, tc);
  expect(tc.deleteTask).not.toHaveBeenCalled(); expect(tc.patchTask).not.toHaveBeenCalled();
  expect(list.slice(0, 3).map(t => t.id)).toEqual(["manual", "notes", "past"]);
});
it.each(["", "old template"])("B6: exact legacy task is adopted through patch, preserving notes (%s)", async notes => {
  const list = [{ id: "legacy", title: "Antrenman: Push", notes, due: "2026-11-02" }];
  const tc = tasks(list); await runCalendar(state(true), calendar(), h, tc);
  expect(tc.patchTask).toHaveBeenCalledWith("list", "legacy", { notes: notes ? notes + "\n" + TASK_MARK : TASK_MARK });
  expect(tc.insertTask).not.toHaveBeenCalled();
});
it("B6: failed adoption patch leaves uncertain task alone", async () => {
  const tc = tasks([{ id: "legacy", title: "Antrenman: Push", due: "2026-11-02" }]); tc.patchTask.mockRejectedValue(new Error("offline"));
  await runCalendar(state(true), calendar(), h, tc); expect(tc.deleteTask).not.toHaveBeenCalled();
});
it("B6: marker recognizes renamed tasks; delete failures do not block new tasks and retry", async () => {
  const tc = tasks([{ id: "owned", title: "Renamed", notes: "personal\n" + TASK_MARK, due: "2026-10-01" }]);
  tc.deleteTask.mockRejectedValueOnce(new Error("offline")); const s = state(true);
  await runCalendar(s, calendar(), h, tc); expect(tc.insertTask).toHaveBeenCalled();
  expect(tc.insertTask.mock.calls[0][1]).toMatchObject({ notes: "old template\n" + TASK_MARK });
  await runCalendar(s, calendar(), h, tc); expect(tc.deleteTask).toHaveBeenCalledTimes(2);
});
it("B8: owned task notes are rebuilt from the current template when program content changes", async () => {
  const list: Task[] = [{ id: "owned", title: "Antrenman: Push", notes: "old template\n" + TASK_MARK, due: "2026-11-02" }];
  const tc = tasks(list); await runCalendar(state(true), calendar(), { ...h, describeProgram: () => "new template" }, tc);
  expect(tc.patchTask).toHaveBeenCalledWith("list", "owned", expect.objectContaining({ notes: "new template\n" + TASK_MARK }));
  expect(list[0].notes).toBe("new template\n" + TASK_MARK);
});
it("B8: hand-written task without the mark is not patched when program content changes", async () => {
  const list: Task[] = [{ id: "manual", title: "Antrenman: Push", notes: "elle yazılmış not", due: "2026-11-02" }];
  const tc = tasks(list); await runCalendar(state(true), calendar(), { ...h, describeProgram: () => "new template" }, tc);
  expect(tc.patchTask).not.toHaveBeenCalledWith("list", "manual", expect.anything());
  expect(list[0].notes).toBe("elle yazılmış not");
});
it.each([false, true])("B7: visible program filter excludes hidden yoga from calendar/task plan (%s)", async task => {
  const s = state(task); s.programs = [{ ...p, items: [{ ex: "Yoga", sets: 1 }] }].filter(p => programVisible("lift", p.items, () => YOGA));
  const c = calendar(), tc = tasks([]); await runCalendar(s, c, h, tc);
  expect(c.upsertEvent).not.toHaveBeenCalled(); expect(tc.insertTask).not.toHaveBeenCalled();
  expect(cloud).toContain("runCalendar({ ...state, programs: visiblePrograms() }");
  expect(cloud).toContain("planSignature(state.plan, visiblePrograms())");
});
