import { afterEach, expect, it, vi } from "vitest";
import { calendarTimeZone, dayEventId, DONE_MARK, lastCalendarSyncError, MAX_UNTIL_DAYS, planSignature, plannedDates, runCalendar, syncSince, TASK_MARK, type CalendarState, type Task } from "../src/core/calendar.ts";
import { calendarClient } from "../src/sync/calendar.ts";
import { tasksClient } from "../src/sync/tasks.ts";
import { ymd } from "../src/core/dates.ts";

const now = new Date(2026, 10, 10, 12);
const h = { now: +now, timeZone: "Europe/Istanbul", describeProgram: () => "", describeSession: () => ({ title: "", details: "" }) };
const p = { id: "p", name: "A", items: [{ ex: "Press", sets: 5 }] };
const state = (): CalendarState => ({ gcal: { id: "cal", log: false, plan: false, planSig: "d1:old", dated: 1, dates: ["2026-11-09", "2026-11-11"] }, plan: { days: {}, dur: 60, remind: 0 }, programs: [p], sessions: [] });
const calendar = () => ({ createCalendar: vi.fn(async () => "cal"), getEvent: vi.fn(async () => ({ completed: false })), upsertEvent: vi.fn(async () => {}), deleteEvent: vi.fn(async () => {}) });
afterEach(() => vi.restoreAllMocks());

it.each(["UTC", "legacy"])("B10: timezone signature migration (%s) keeps deterministic event ids", async previous => {
  const s = state(), c = calendar(); s.gcal.plan = true; s.plan.days = { TU: { prog: "p" } }; s.plan.until = "2026-11-10";
  s.gcal.dates = ["2026-11-10"];
  s.gcal.planSig = planSignature(s.plan, s.programs, "UTC");
  if (previous === "legacy") {
    const data = JSON.parse(s.gcal.planSig.slice(3)); data.splice(1, 1);
    s.gcal.planSig = "d1:" + JSON.stringify(data);
  }
  await runCalendar(s, c, h);
  expect(c.upsertEvent).toHaveBeenCalledExactlyOnceWith("cal", dayEventId("2026-11-10"), expect.objectContaining({ start: expect.objectContaining({ timeZone: h.timeZone }) }));
  expect(c.deleteEvent).not.toHaveBeenCalled();
  expect(s.gcal.planSig).toBe(planSignature(s.plan, s.programs, h.timeZone));
  await runCalendar(s, c, h);
  expect(c.upsertEvent).toHaveBeenCalledTimes(1);
});
it("B10: default timezone has a UTC fallback", () => {
  vi.spyOn(Intl, "DateTimeFormat").mockImplementation(() => { throw new Error("unavailable"); });
  expect(calendarTimeZone()).toBe("UTC");
});
it("B11: shared lower bound is 60 calendar days back, including DST boundaries", () => {
  expect(syncSince(now)).toBe("2026-09-11");
  expect(syncSince(new Date(2026, 3, 1))).toBe("2026-01-31");
});
it("B11: calendar and tasks use the same lower bound without truncating a 366-day plan", async () => {
  const f = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => new Response(JSON.stringify({ items: [] })));
  const c = calendarClient("token", f), tc = tasksClient("token", f), s = state();
  s.gcal.plan = true; s.gcal.mode = "task"; s.gcal.taskList = "list"; s.gcal.planSig = "";
  const end = new Date(now); end.setDate(end.getDate() + MAX_UNTIL_DAYS);
  s.plan.until = ymd(end); s.plan.days = Object.fromEntries(["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map(code => [code, { prog: "p" }]));
  const farthest = plannedDates(s.plan, s.programs, now).at(-1)!.date;
  expect(farthest).toBe(ymd(end));
  await c.listDayEvents!("cal", syncSince(now));
  // Only inspect listing query parameters; no upper bound can exclude the farthest date.
  s.plan.days = {};
  await runCalendar(s, calendar(), h, tc);
  const urls = f.mock.calls.map(call => new URL(String(call[0])));
  expect(urls[0].searchParams.get("timeMin")).toBe(new Date("2026-09-11T00:00:00").toISOString());
  expect(urls[1].searchParams.get("dueMin")).toBe("2026-09-11T00:00:00.000Z");
  expect(urls[0].searchParams.has("timeMax")).toBe(false);
  expect(urls[1].searchParams.has("dueMax")).toBe(false);
});
it("B11: listing failure records a diagnostic and still writes the new plan", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {}), c = { ...calendar(), listDayEvents: vi.fn().mockRejectedValue(new Error("offline")) }, s = state();
  s.gcal.plan = true; s.plan.days = { TU: { prog: "p" } }; s.plan.until = "2026-11-10";
  await runCalendar(s, c, h);
  expect(lastCalendarSyncError).toEqual({ operation: "listDayEvents", message: "offline" });
  expect(warn).toHaveBeenCalled(); expect(c.upsertEvent).toHaveBeenCalled();
});
it.each(["completed", "error", "unfinished"])("B12: rechecks past and removed future events: %s", async fresh => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  const c = calendar(), s = state();
  if (fresh === "error") c.getEvent.mockRejectedValue(new Error("offline"));
  else c.getEvent.mockResolvedValue({ completed: fresh === "completed" });
  await runCalendar(s, c, h);
  expect(c.getEvent).toHaveBeenCalledTimes(2);
  expect(c.deleteEvent).toHaveBeenCalledTimes(fresh === "unfinished" ? 2 : 0);
  expect(s.gcal.dates).toHaveLength(fresh === "unfinished" ? 0 : 2);
  if (fresh === "unfinished") expect(c.getEvent.mock.invocationCallOrder[0]).toBeLessThan(c.deleteEvent.mock.invocationCallOrder[0]);
});
it.each(["completed", "error", "unfinished", "unmarked"])("B12: rechecks tasks before obsolete and duplicate deletion: %s", async fresh => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  const s = state(); s.gcal.mode = "task"; s.gcal.planSig = ""; s.gcal.taskSig = "old"; s.gcal.taskList = "list";
  const task: Task = { id: "one", notes: TASK_MARK, due: "2026-11-09", status: "needsAction" };
  const tc = { createList: vi.fn(async () => "list"), listTasks: vi.fn(async () => [task, { ...task, id: "two" }]),
    getTask: vi.fn(async (_: string, id: string) => ({ ...task, id, notes: fresh === "unmarked" ? "personal" : TASK_MARK, status: fresh === "completed" ? "completed" : "needsAction" })),
    deleteTask: vi.fn(async () => {}), insertTask: vi.fn(async () => {}), patchTask: vi.fn(async () => {}) };
  if (fresh === "error") tc.getTask.mockRejectedValue(new Error("offline"));
  await runCalendar(s, calendar(), h, tc);
  expect(tc.getTask).toHaveBeenCalledTimes(2);
  expect(tc.deleteTask).toHaveBeenCalledTimes(fresh === "unfinished" ? 2 : 0);
});
it("B12: REST single reads detect completion and propagate read failures", async () => {
  const f = vi.fn(async (_url: any, _init: any) => new Response(JSON.stringify({ summary: DONE_MARK + "Done", id: "task", status: "completed" })));
  expect(await calendarClient("t", f).getEvent("a@b", "event")).toEqual({ completed: true });
  expect(await tasksClient("t", f).getTask("list", "a/b")).toMatchObject({ status: "completed" });
  expect(f.mock.calls.map(c => c[1].method)).toEqual(["GET", "GET"]);
  expect(f.mock.calls[1][0]).toContain("a%2Fb");
  const bad = vi.fn(async () => new Response("", { status: 500 }));
  await expect(calendarClient("t", bad).getEvent("cal", "id")).rejects.toThrow();
  await expect(tasksClient("t", bad).getTask("list", "id")).rejects.toThrow();
});

it.each([404, 410])("A1: missing single reads (%s) are null", async status => {
  const fetcher = vi.fn(async () => new Response("", { status }));
  expect(await calendarClient("t", fetcher).getEvent("cal", "id")).toBeNull();
  expect(await tasksClient("t", fetcher).getTask("list", "id")).toBeNull();
});
it("A1: vanished events leave tracking without a delete or diagnostic", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {}), s = state();
  const c = { ...calendar(), getEvent: vi.fn(async () => null) };
  await runCalendar(s, c, h);
  expect(s.gcal.dates).toEqual([]);
  expect(c.deleteEvent).not.toHaveBeenCalled();
  expect(warn).not.toHaveBeenCalled(); expect(lastCalendarSyncError).toBeNull();
});
it("A1: vanished obsolete and duplicate tasks need no delete or diagnostic", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {}), s = state();
  s.gcal = { ...s.gcal, mode: "task", taskList: "list", taskSig: "old", planSig: "" };
  const task = { id: "one", due: "2026-11-09", notes: TASK_MARK, status: "needsAction" };
  const tc = { createList: vi.fn(async () => "list"), listTasks: vi.fn(async () => [task, {...task, id: "two"}]),
    getTask: vi.fn(async () => null), deleteTask: vi.fn(async () => {}), insertTask: vi.fn(async () => {}), patchTask: vi.fn(async () => {}) };
  await runCalendar(s, calendar(), h, tc);
  expect(tc.getTask).toHaveBeenCalledTimes(2); expect(tc.deleteTask).not.toHaveBeenCalled();
  expect(s.gcal.taskSig).toBe(""); expect(warn).not.toHaveBeenCalled(); expect(lastCalendarSyncError).toBeNull();
});
it.each([false, true])("A2: successful sync clears previous diagnostic (idle %s)", async idle => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  await runCalendar(state(), { ...calendar(), getEvent: vi.fn().mockRejectedValue(new Error("offline")) }, h);
  expect(lastCalendarSyncError).not.toBeNull();
  const s = state(); if (idle) s.gcal.planSig = "";
  await runCalendar(s, calendar(), h);
  expect(lastCalendarSyncError).toBeNull();
});
