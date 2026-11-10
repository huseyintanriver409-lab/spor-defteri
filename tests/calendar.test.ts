import { describe, it, expect, vi } from "vitest";
import {
  eventId, sessionEventId, planEventId, dayEventId, plannedDates, plannedEvent, planSignature, pendingSessions, sessionEvent, runCalendar,
  CalendarMissing, TaskListMissing, plannedOn, type TasksClient, type Task, BACKFILL_DAYS, MAX_PER_RUN, MAX_PLAN_PER_RUN, HORIZON_DAYS, type CalendarClient, type CalendarState, type Session,
} from "../src/core/calendar.ts";
import { calendarClient } from "../src/sync/calendar.ts";
import { tasksClient } from "../src/sync/tasks.ts";
import { AuthError } from "../src/sync/drive.ts";
import { withDefaults, mergeStates, DEFAULTS } from "../src/core/schema.ts";

const NOW = new Date(2026, 10, 1, 12, 0).getTime(); // 1 Kasım 2026 Pazar 12:00 (yerel)
const H = 36e5;
const progs = [
  { id: "p1", name: "Push", items: [{ ex: "Bench Press (Barbell)", sets: 3, reps: "6-8" }] },
  { id: "p2", name: "Pull", items: [{ ex: "Barbell Row", sets: 3, reps: "8" }] },
];
const plan = () => ({ days: { MO: { prog: "p1", time: "18:30" }, TH: { prog: "p2" } } as Record<string, { prog: string; time?: string }>, dur: 75, remind: 30, until: "" });
// NOW'dan sonraki 56 günün pazartesi ve perşembeleri (2 Kasım – 24 Aralık)
const MO_TH = Array.from({ length: HORIZON_DAYS + 1 }, (_, i) => new Date(2026, 10, 1 + i)).filter(d => d.getDay() === 1 || d.getDay() === 4)
  .map(d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
const ses = (id: string, endAgoH: number, extra: Partial<Session> = {}): Session => ({ id, date: "2026-10-31", start: NOW - endAgoH * H - H, end: NOW - endAgoH * H, ...extra });
const helpers = { describeProgram: (p: any) => "• " + p.items[0].ex, describeSession: (s: Session) => ({ title: "Antrenman " + s.id, details: "ayrıntı" }), timeZone: "Europe/Istanbul", now: NOW };

// Bellekte takvim tutan sahte istemci
function fakeCalendar() {
  const cals: Record<string, Map<string, any>> = {};
  let n = 0;
  const log: string[] = [];
  const client: CalendarClient & { cals: typeof cals; log: string[] } = {
    cals, log,
    async getEvent(cal, id) { return { completed: String(cals[cal]?.get(id)?.summary || "").startsWith(String.fromCodePoint(0x2705)) }; },
    async createCalendar(summary) { const id = `cal${++n}`; cals[id] = new Map(); log.push(`create ${summary}`); return id; },
    async upsertEvent(cal, id, body) { if (!cals[cal]) throw new CalendarMissing(); cals[cal].set(id, body); log.push(`upsert ${id}`); },
    async deleteEvent(cal, id) { if (!cals[cal]) throw new CalendarMissing(); cals[cal].delete(id); log.push(`delete ${id}`); },
  };
  return client;
}
const calState = (over: Partial<CalendarState["gcal"]> = {}, sessions: Session[] = []): CalendarState =>
  ({ gcal: { log: false, plan: false, id: "", planSig: "", ...over }, plan: plan(), programs: progs, sessions });

describe("etkinlik kimlikleri", () => {
  it("yalnız Google'ın izin verdiği base32hex karakterleri ve 5+ uzunluk", () => {
    for (const id of [sessionEventId("mvxvpkn1z6fw"), sessionEventId("ğüş-çö"), planEventId("SU"), dayEventId("2026-11-02"), eventId("sdses", "a")]) {
      expect(id).toMatch(/^[0-9a-v]{5,1024}$/);
    }
  });
  it("aynı kayıt hep aynı kimliği verir, farklı kayıtlar farklı", () => {
    expect(sessionEventId("abc")).toBe(sessionEventId("abc"));
    expect(sessionEventId("abc")).not.toBe(sessionEventId("abd"));
    expect(planEventId("MO")).not.toBe(sessionEventId("MO"));
    expect(dayEventId("2026-11-02")).not.toBe(sessionEventId("2026-11-02"));
  });
});

describe("haftalık plan etkinlikleri", () => {
  const today = new Date(NOW), opts = { timeZone: "Europe/Istanbul", describe: helpers.describeProgram };
  it(`bitiş tarihi yoksa bugünden ${HORIZON_DAYS} gün ilerisine kadar plandaki günler`, () => {
    const days = plannedDates(plan(), progs, today);
    expect(days.map(d => d.date)).toEqual(MO_TH);
    expect(days[0]).toMatchObject({ date: "2026-11-02", code: "MO", time: "18:30" });
    // saat girilmemişse 19:00
    expect(days[1]).toMatchObject({ date: "2026-11-05", code: "TH", time: "19:00" });
  });
  it("bitiş tarihi o gün dahil; geçmişte kalmışsa hiç gün yok; bugün plandaysa bugün de", () => {
    expect(plannedDates({ ...plan(), until: "2026-11-12" }, progs, today).map(d => d.date)).toEqual(["2026-11-02", "2026-11-05", "2026-11-09", "2026-11-12"]);
    expect(plannedDates({ ...plan(), until: "2026-10-01" }, progs, today)).toEqual([]);
    const su = plan(); su.days.SU = { prog: "p1" };
    expect(plannedDates(su, progs, today)[0].date).toBe("2026-11-01");
  });
  it("6 Ocak'a kadar pazartesi, çarşamba, cumartesi", () => {
    const p = { ...plan(), days: { MO: { prog: "p1" }, WE: { prog: "p2" }, SA: { prog: "p1" } }, until: "2027-01-06" };
    const days = plannedDates(p, progs, today).map(d => d.date);
    expect(days[0]).toBe("2026-11-02");
    expect(days.at(-1)).toBe("2027-01-06");
    expect(days).toHaveLength(29);
  });
  it("programı silinmiş gün atlanır", () => {
    expect(plannedDates(plan(), [progs[0]], today).every(d => d.code === "MO")).toBe(true);
  });
  it("tek seferlik, saat dilimli, hatırlatmalı etkinlik; hatırlatma 0 ise hatırlatma yok", () => {
    const [mo] = plannedDates(plan(), progs, today);
    expect(plannedEvent(mo, plan(), opts)).toEqual({
      summary: "Antrenman: Push", description: "• Bench Press (Barbell)",
      start: { dateTime: "2026-11-02T18:30:00", timeZone: "Europe/Istanbul" },
      end: { dateTime: "2026-11-02T19:45:00", timeZone: "Europe/Istanbul" },
      reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 30 }] },
      status: "confirmed",
    });
    expect(plannedEvent(mo, { ...plan(), remind: 0 }, opts).reminders).toEqual({ useDefault: false });
  });
  it("imza tarihle değişmez; saat, süre, bitiş, program adı ve içeriğiyle değişir", () => {
    const base = planSignature(plan(), progs);
    expect(planSignature(plan(), progs)).toBe(base);
    const p2 = plan(); p2.days.MO.time = "19:00";
    expect(planSignature(p2, progs)).not.toBe(base);
    expect(planSignature({ ...plan(), dur: 60 }, progs)).not.toBe(base);
    expect(planSignature({ ...plan(), until: "2027-01-06" }, progs)).not.toBe(base);
    expect(planSignature(plan(), [{ ...progs[0], name: "Push A" }, progs[1]])).not.toBe(base);
    expect(planSignature(plan(), [{ ...progs[0], items: [] }, progs[1]])).not.toBe(base);
  });
});

describe("biten antrenmanlar", () => {
  it("yazılmamış ve son 30 günde bitenler, eskiden yeniye", () => {
    const list = [ses("yeni", 1), ses("eski", 48), ses("yazili", 2, { cal: 1 }), ses("cokEski", (BACKFILL_DAYS + 1) * 24)];
    expect(pendingSessions(list, NOW).map(s => s.id)).toEqual(["eski", "yeni"]);
  });
  it(`bir çalıştırmada en fazla ${MAX_PER_RUN}`, () => {
    const list = Array.from({ length: MAX_PER_RUN + 5 }, (_, i) => ses("s" + i, i + 1));
    expect(pendingSessions(list, NOW)).toHaveLength(MAX_PER_RUN);
  });
  it("etkinlik gerçek başlangıç ve bitişi taşır; bitişsiz kısa oturum en az 1 dk", () => {
    const s = ses("x", 0);
    expect(sessionEvent(s, { title: "T", details: "D" })).toMatchObject({
      summary: "✅ T", description: "D", start: { dateTime: new Date(s.start).toISOString() }, end: { dateTime: new Date(s.end).toISOString() },
    });
    const z = { ...s, end: s.start };
    expect(sessionEvent(z, { title: "", details: "" }).end.dateTime).toBe(new Date(s.start + 60000).toISOString());
  });
});

describe("runCalendar", () => {
  it("kapalıyken hiçbir istek yapmaz", async () => {
    const c = fakeCalendar();
    await runCalendar(calState({}, [ses("a", 1)]), c, helpers);
    expect(c.log).toEqual([]);
  });

  it("ilk açılışta takvimi oluşturur, planı ve bekleyen antrenmanları yazar, işaretler", async () => {
    // a ve b aynı gün: önce başlayan b o günün kimliğini alır, a kendi kimliğiyle yazılır
    const c = fakeCalendar(), st = calState({ log: true, plan: true }, [ses("a", 1), ses("b", 2)]);
    const r = await runCalendar(st, c, helpers);
    expect(r).toMatchObject({ created: true, planUpdated: true, written: 2 });
    expect(st.gcal.id).toBe("cal1");
    expect(st.gcal.planSig).toBe(planSignature(st.plan, st.programs, helpers.timeZone));
    expect(st.gcal.dates).toEqual(MO_TH);
    expect(st.sessions.every(s => s.cal === 1)).toBe(true);
    expect([...c.cals.cal1.keys()].sort()).toEqual([...MO_TH.map(dayEventId), dayEventId("2026-10-31"), sessionEventId("a")].sort());
  });

  it("ikinci çalıştırmada değişiklik yoksa istek yapmaz", async () => {
    const c = fakeCalendar(), st = calState({ log: true, plan: true }, [ses("a", 1)]);
    await runCalendar(st, c, helpers);
    c.log.length = 0;
    expect(await runCalendar(st, c, helpers)).toMatchObject({ written: 0, planUpdated: false, created: false });
    expect(c.log).toEqual([]);
  });

  it("günler geçtikçe bitmemiş geçmiş planlar silinir ve yeni tarihler eklenir", async () => {
    const c = fakeCalendar(), st = calState({ plan: true });
    await runCalendar(st, c, helpers);
    c.log.length = 0;
    await runCalendar(st, c, { ...helpers, now: NOW + 7 * 24 * H });
    expect(c.log).toEqual(["delete " + dayEventId("2026-11-02"), "delete " + dayEventId("2026-11-05"), "upsert " + dayEventId("2026-12-28"), "upsert " + dayEventId("2026-12-31")]);
    expect(st.gcal.dates![0]).toBe("2026-11-09");
    expect(c.cals.cal1.has(dayEventId("2026-11-02"))).toBe(false);
  });

  it("plan değişince yeniden yazar, plandan çıkan gün silinir", async () => {
    const c = fakeCalendar(), st = calState({ plan: true });
    await runCalendar(st, c, helpers);
    delete st.plan.days.TH; st.plan.days.SA = { prog: "p2", time: "10:00" };
    await runCalendar(st, c, helpers);
    const keys = [...c.cals.cal1.keys()];
    expect(keys).not.toContain(dayEventId("2026-11-05"));
    expect(c.cals.cal1.get(dayEventId("2026-11-07")).start.dateTime).toBe("2026-11-07T10:00:00");
    expect(keys).toHaveLength(st.gcal.dates!.length);
  });

  it("bitiş tarihi öne çekilince sonraki tarihler silinir", async () => {
    const c = fakeCalendar(), st = calState({ plan: true });
    st.plan.until = "2027-01-06";
    await runCalendar(st, c, helpers);
    expect(st.gcal.dates!.at(-1)).toBe("2027-01-04");
    st.plan.until = "2026-11-10";
    await runCalendar(st, c, helpers);
    expect([...c.cals.cal1.keys()].sort()).toEqual(["2026-11-02", "2026-11-05", "2026-11-09"].map(dayEventId).sort());
  });

  it(`çok uzun plan parça parça yazılır (çalıştırma başına ${MAX_PLAN_PER_RUN})`, async () => {
    const c = fakeCalendar(), st = calState({ plan: true });
    for (const d of ["MO", "TU", "WE", "TH", "FR", "SA", "SU"]) st.plan.days[d] = { prog: "p1" };
    st.plan.until = "2027-03-01";
    await runCalendar(st, c, helpers);
    expect(c.cals.cal1.size).toBe(MAX_PLAN_PER_RUN);
    await runCalendar(st, c, helpers); await runCalendar(st, c, helpers);
    expect(c.cals.cal1.size).toBe(plannedDates(st.plan, progs, new Date(NOW)).length);
  });

  it("antrenman bitince o günün plan etkinliği ✅ olur; plan sonra değişse de silinmez", async () => {
    const c = fakeCalendar(), st = calState({ log: true, plan: true });
    st.plan.days.SU = { prog: "p1", time: "09:00" };
    await runCalendar(st, c, helpers);
    expect(c.cals.cal1.get(dayEventId("2026-11-01")).summary).toBe("Antrenman: Push");
    st.sessions.push({ id: "bugun", date: "2026-11-01", start: NOW - 2 * H, end: NOW - H });
    await runCalendar(st, c, helpers);
    const ev = c.cals.cal1.get(dayEventId("2026-11-01"));
    expect(ev.summary).toBe("✅ Antrenman bugun");
    expect(ev.start.dateTime).toBe(new Date(NOW - 2 * H).toISOString());
    expect(c.cals.cal1.has(sessionEventId("bugun"))).toBe(false);
    expect(st.gcal.dates).not.toContain("2026-11-01");
    delete st.plan.days.SU;
    await runCalendar(st, c, helpers);
    expect(c.cals.cal1.get(dayEventId("2026-11-01")).summary).toBe("✅ Antrenman bugun");
  });

  it("eski sürümün tekrarlayan plan etkinlikleri bir kez silinir", async () => {
    const c = fakeCalendar(), st = calState({ plan: true, id: "cal0", planSig: "eski" });
    c.cals.cal0 = new Map([[planEventId("MO"), {}], [planEventId("TH"), {}], [sessionEventId("x"), {}]]);
    await runCalendar(st, c, helpers);
    expect(st.gcal.dated).toBe(1);
    expect(c.cals.cal0.has(planEventId("MO"))).toBe(false);
    expect(c.cals.cal0.has(planEventId("TH"))).toBe(false);
    expect(c.cals.cal0.has(sessionEventId("x"))).toBe(true);
    c.log.length = 0;
    await runCalendar(st, c, helpers);
    expect(c.log).toEqual([]);
    // eski sürümdeki bir cihaz tekrarlayan etkinliği geri yazarsa yeniden temizlenir
    c.cals.cal0.set(planEventId("MO"), {}); st.gcal.planSig = '[75,30,["MO"]]';
    await runCalendar(st, c, helpers);
    expect(c.cals.cal0.has(planEventId("MO"))).toBe(false);
    expect(st.gcal.planSig.startsWith("d1:")).toBe(true);
  });

  it("plan kapatılınca takvimdeki gelecek plan silinir, imza boşalır", async () => {
    const c = fakeCalendar(), st = calState({ plan: true });
    await runCalendar(st, c, helpers);
    st.gcal.plan = false;
    await runCalendar(st, c, helpers);
    expect(c.cals.cal1.size).toBe(0);
    expect(st.gcal.planSig).toBe("");
    expect(st.gcal.dates).toEqual([]);
  });

  it("plan yazımı yarıda kesilirse kalan tarihler sonraki sefere", async () => {
    const c = fakeCalendar(), st = calState({ plan: true });
    let calls = 0;
    const flaky: CalendarClient = { ...c, async upsertEvent(cal, id, body) { if (++calls === 4) throw new Error("ağ yok"); return c.upsertEvent(cal, id, body); } };
    await expect(runCalendar(st, flaky, helpers)).rejects.toThrow("ağ yok");
    expect(st.gcal.dates).toEqual(MO_TH.slice(0, 3));
    await runCalendar(st, c, helpers);
    expect(st.gcal.dates).toEqual(MO_TH);
  });

  it("takvim hiç oluşturulmadan plan kapatılırsa takvim oluşturmaz", async () => {
    const c = fakeCalendar(), st = calState({ planSig: "eski" });
    await runCalendar(st, c, helpers);
    expect(c.log).toEqual([]);
    expect(st.gcal.planSig).toBe("");
  });

  it("kullanıcı takvimi Google'da silerse yeniden oluşturup planı da yeniden yazar", async () => {
    const c = fakeCalendar(), st = calState({ log: true, plan: true }, [ses("a", 1)]);
    await runCalendar(st, c, helpers);
    delete c.cals.cal1;
    st.sessions.push(ses("b", 0.5, { date: "2026-11-01" }));
    await runCalendar(st, c, helpers);
    expect(st.gcal.id).toBe("cal2");
    expect(c.cals.cal2.has(dayEventId("2026-11-01"))).toBe(true);
    // plan imzası sıfırlandığı için plan da yeni takvime yazılır
    expect(st.gcal.dates).toEqual(MO_TH);
    expect(c.cals.cal2.has(dayEventId("2026-11-02"))).toBe(true);
  });

  it("yarıda hata olursa yazılanlar işaretli kalır, kalanlar sonraki sefere", async () => {
    const c = fakeCalendar(), st = calState({ log: true }, [ses("a", 3), ses("b", 2), ses("c", 1)]);
    let calls = 0;
    const flaky: CalendarClient = { ...c, async upsertEvent(cal, id, body) { if (++calls === 2) throw new Error("ağ yok"); return c.upsertEvent(cal, id, body); } };
    await expect(runCalendar(st, flaky, helpers)).rejects.toThrow("ağ yok");
    expect(st.sessions.map(s => s.cal ?? 0)).toEqual([1, 0, 0]);
    await runCalendar(st, c, helpers);
    expect(st.sessions.map(s => s.cal)).toEqual([1, 1, 1]);
  });

  it("iki cihaz aynı oturumu yazarsa tek etkinlik olur", async () => {
    const c = fakeCalendar();
    const a = calState({ log: true, id: "cal0" }, [ses("x", 1)]), b = calState({ log: true, id: "cal0" }, [ses("x", 1)]);
    c.cals.cal0 = new Map();
    await runCalendar(a, c, helpers); await runCalendar(b, c, helpers);
    expect(c.cals.cal0.size).toBe(1);
  });
});

describe("takvim ayarları ve Drive birleştirmesi", () => {
  it("eski verilerde takvim ayarı kapalı varsayılır", () => {
    expect(withDefaults({ v: 2 }).gcal).toEqual({ log: false, plan: false, id: "", planSig: "", dates: [], dated: 0, mode: "event", taskList: "", taskSig: "" });
    expect(withDefaults({ v: 2, gcal: { log: true } }).gcal).toMatchObject({ log: true, plan: false, id: "" });
  });
  it("takvim kimliği ve 'yazıldı' işareti cihazlar arasında eşitlenir", () => {
    const local = { ...DEFAULTS(), deviceId: "tel", settingsU: 1, sessions: [{ id: "s1", date: "x", start: 1, end: 2, u: 1 }] };
    const remote = { ...DEFAULTS(), settingsU: 5, gcal: { log: true, plan: false, id: "calX", planSig: "" }, sessions: [{ id: "s1", date: "x", start: 1, end: 2, u: 9, cal: 1 }] };
    const { state } = mergeStates(local, remote);
    expect(state.gcal.id).toBe("calX");
    expect(state.sessions[0].cal).toBe(1);
  });
});

describe("calendarClient", () => {
  const res = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status });
  const make = (handler: (url: string, init: RequestInit) => Response) => {
    const calls: { url: string; method: string; body: any }[] = [];
    const fetchFn = vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, method: init.method!, body: init.body ? JSON.parse(String(init.body)) : undefined });
      return handler(url, init);
    }) as unknown as typeof fetch;
    return { client: calendarClient("TOK", fetchFn), calls };
  };

  it("takvim oluşturur ve kimliğini döndürür", async () => {
    const { client, calls } = make(() => res(200, { id: "abc@group.calendar.google.com" }));
    expect(await client.createCalendar("Spor Defteri", "d", "Europe/Istanbul")).toBe("abc@group.calendar.google.com");
    expect(calls[0]).toMatchObject({ method: "POST", url: "https://www.googleapis.com/calendar/v3/calendars", body: { summary: "Spor Defteri", timeZone: "Europe/Istanbul" } });
  });

  it("var olan etkinliği PUT ile günceller (tek istek)", async () => {
    const { client, calls } = make(() => res(200));
    await client.upsertEvent("c@g", "sdses01", { summary: "S" });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ method: "PUT", url: expect.stringContaining("/calendars/c%40g/events/sdses01"), body: { id: "sdses01", summary: "S" } });
  });

  it("etkinlik yoksa (404) aynı kimlikle oluşturur", async () => {
    const { client, calls } = make((_, init) => init.method === "PUT" ? res(404) : res(200));
    await client.upsertEvent("c", "sdses01", { summary: "S" });
    expect(calls.map(c => c.method)).toEqual(["PUT", "POST"]);
    expect(calls[1].body.id).toBe("sdses01");
  });

  it("araya başka cihaz girerse (409) bir kez daha günceller", async () => {
    let puts = 0;
    const { client, calls } = make((_, init) => init.method === "PUT" ? res(++puts === 1 ? 404 : 200) : res(409));
    await client.upsertEvent("c", "sdses01", {});
    expect(calls.map(c => c.method)).toEqual(["PUT", "POST", "PUT"]);
  });

  it("takvimin kendisi yoksa CalendarMissing", async () => {
    const { client } = make(() => res(404));
    await expect(client.upsertEvent("c", "sdses01", {})).rejects.toBeInstanceOf(CalendarMissing);
  });

  it("silmede 404/410 sorun değil, 500 hata", async () => {
    await make(() => res(404)).client.deleteEvent("c", "x1234");
    await make(() => res(410)).client.deleteEvent("c", "x1234");
    await expect(make(() => res(500)).client.deleteEvent("c", "x1234")).rejects.toThrow("500");
  });

  it("401 ve izin 403'ü yeniden giriş ister; kota 403'ü istemez", async () => {
    await expect(make(() => res(401)).client.deleteEvent("c", "x1234")).rejects.toBeInstanceOf(AuthError);
    await expect(make(() => res(403, { error: { errors: [{ reason: "insufficientPermissions" }] } })).client.deleteEvent("c", "x1234")).rejects.toBeInstanceOf(AuthError);
    const e = await make(() => res(403, { error: { errors: [{ reason: "rateLimitExceeded" }] } })).client.deleteEvent("c", "x1234").catch(x => x);
    expect(e).not.toBeInstanceOf(AuthError);
  });
});

// Bellekte görev listesi tutan sahte istemci (kimliği Google verir gibi kendisi üretir)
function fakeTasks() {
  const lists: Record<string, Task[]> = {};
  let n = 0;
  const log: string[] = [];
  const list = (id: string) => { if (!lists[id]) throw new TaskListMissing(); return lists[id]; };
  const client: TasksClient & { lists: typeof lists; log: string[] } = {
    lists, log,
    async getTask(id, tid) { return { ...list(id).find(t => t.id === tid)! }; },
    async createList(title) { const id = `tl${++n}`; lists[id] = []; log.push(`list ${title}`); return id; },
    async listTasks(id, dueMin) { return list(id).filter(t => t.due!.slice(0, 10) >= dueMin).map(t => ({ ...t })); },
    async insertTask(id, body: any) { list(id).push({ id: `t${++n}`, ...body }); log.push(`insert ${body.due.slice(0, 10)}`); },
    async patchTask(id, tid, body: any) { const t = list(id).find(x => x.id === tid); if (t) Object.assign(t, body); log.push(`patch ${t?.due?.slice(0, 10)} ${body.status || "metin"}`); },
    async deleteTask(id, tid) { lists[id] = list(id).filter(x => x.id !== tid); log.push(`delete ${tid}`); },
  };
  return client;
}
const taskState = (over: Partial<CalendarState["gcal"]> = {}, sessions: Session[] = []): CalendarState =>
  ({ gcal: { log: false, plan: true, id: "", planSig: "", mode: "task", taskList: "", taskSig: "", ...over }, plan: plan(), programs: progs, sessions });

describe("görev modu", () => {
  it("plan kurulmadan önce yapılmış antrenman tamamlanmış görev olarak eklenir; ikinci kez eklenmez", async () => {
    // 30 Ekim cuma: oturumu yok, yalnız kayıt var (elle ya da Claude'la girilmiş); 1 Eylül 30 günden eski
    const st: CalendarState = { ...taskState(), entries: [{ date: "2026-10-30", sets: [{ w: 100, r: 5 }] }, { date: "2026-11-01", sets: [{}] }, { date: "2026-09-01", sets: [{}] }] };
    st.plan.days.FR = { prog: "p2" };
    const tc = fakeTasks();
    await runCalendar(st, fakeCalendar(), helpers, tc);
    const past = tc.lists[st.gcal.taskList!].filter(t => t.due! < "2026-11-01");
    expect(past).toEqual([expect.objectContaining({ due: "2026-10-30T00:00:00.000Z", status: "completed", title: "Antrenman: Pull" })]);
    // bugün plan dışı yapılan antrenman da tiklenmiş görev olur
    expect(tc.lists[st.gcal.taskList!].find(t => t.due!.startsWith("2026-11-01"))).toMatchObject({ status: "completed", title: "Antrenman: serbest" });
    tc.log.length = 0;
    await runCalendar(st, fakeCalendar(), helpers, tc);
    expect(tc.log).toEqual([]);
  });

  it("plan tarihleri görev olur, takvime etkinlik yazılmaz; ikinci çalıştırma bir şey değiştirmez", async () => {
    const st = taskState(), cal = fakeCalendar(), tc = fakeTasks();
    const r = await runCalendar(st, cal, helpers, tc);
    expect(r.planUpdated).toBe(true);
    const tasks = tc.lists[st.gcal.taskList!];
    expect(tasks.map(t => t.due!.slice(0, 10))).toEqual(MO_TH);
    expect(tasks[0]).toMatchObject({ title: "Antrenman: Push", notes: "• Bench Press (Barbell)\n[spor-defteri]", status: "needsAction", due: "2026-11-02T00:00:00.000Z" });
    expect(cal.log).toEqual([]);
    expect(st.gcal.taskSig).toBe(planSignature(st.plan, progs, helpers.timeZone));
    tc.log.length = 0;
    await runCalendar(st, cal, helpers, tc);
    expect(tc.log).toEqual([]);
  });

  it("antrenman bitince o günün görevi tiklenir; plan değişince gelecekteki görevler güncellenir", async () => {
    const st = taskState(), cal = fakeCalendar(), tc = fakeTasks();
    await runCalendar(st, cal, helpers, tc);
    st.sessions.push({ id: "s1", date: "2026-11-02", start: NOW + 30 * H, end: NOW + 31 * H });
    st.plan.days = { MO: { prog: "p2" } };
    const later = { ...helpers, now: NOW + 32 * H };
    const r = await runCalendar(st, cal, later, tc);
    expect(r.ticked).toBe(1);
    const tasks = tc.lists[st.gcal.taskList!];
    expect(tasks.find(t => t.due!.startsWith("2026-11-02"))).toMatchObject({ status: "completed", title: "Antrenman: Push" });
    // perşembeler plandan çıktı, pazartesiler Pull oldu
    expect(tasks.filter(t => t.status !== "completed").every(t => new Date(t.due!).getUTCDay() === 1 && t.title === "Antrenman: Pull")).toBe(true);
  });

  it("plan kapatılınca ya da etkinliğe dönülünce tamamlanmamış görevler silinir, tamamlananlar kalır", async () => {
    const st = taskState({}, [{ id: "s1", date: "2026-11-02", start: NOW + 30 * H, end: NOW + 31 * H }]), cal = fakeCalendar(), tc = fakeTasks();
    await runCalendar(st, cal, { ...helpers, now: NOW + 32 * H }, tc);
    st.gcal.mode = "event";
    await runCalendar(st, cal, { ...helpers, now: NOW + 32 * H }, tc);
    expect(tc.lists[st.gcal.taskList!].map(t => t.status)).toEqual(["completed"]);
    expect(st.gcal.taskSig).toBe("");
    // artık etkinlik olarak yazıldı
    expect(cal.cals[st.gcal.id].size).toBeGreaterThan(0);
  });

  it("silinen liste yeniden oluşturulur; iki cihazın açtığı aynı günlük görevden biri silinir", async () => {
    const st = taskState({ taskList: "yok" }), cal = fakeCalendar(), tc = fakeTasks();
    await runCalendar(st, cal, helpers, tc);
    expect(tc.log[0]).toBe("list Spor Defteri");
    const list = tc.lists[st.gcal.taskList!];
    list.push({ ...list[0], id: "kopya" });
    await runCalendar(st, cal, helpers, tc);
    expect(tc.lists[st.gcal.taskList!].filter(t => t.due === list[0].due)).toHaveLength(1);
  });
});

describe("tasksClient", () => {
  it("Tasks API kapalıysa izin istemez, anlaşılır hata verir; liste yoksa TaskListMissing", async () => {
    const f403 = vi.fn(async () => new Response('{"error":{"status":"PERMISSION_DENIED","details":[{"reason":"SERVICE_DISABLED"}]}}', { status: 403 }));
    await expect(tasksClient("t", f403 as any).createList("x")).rejects.toThrow(/Tasks API/);
    const f404 = vi.fn(async () => new Response("", { status: 404 }));
    await expect(tasksClient("t", f404 as any).listTasks("l", "2026-11-01")).rejects.toBeInstanceOf(TaskListMissing);
    const f401 = vi.fn(async () => new Response("", { status: 401 }));
    await expect(tasksClient("t", f401 as any).deleteTask("l", "x")).rejects.toBeInstanceOf(AuthError);
  });
});

describe("plannedOn (uygulamadaki takvim)", () => {
  it("gün koduna göre program verir; bitiş tarihinden sonra plan yok", () => {
    const p = { ...plan(), until: "2026-11-30" };
    expect(plannedOn(p, progs, "2026-11-02")?.name).toBe("Push");
    expect(plannedOn(p, progs, "2026-11-05")?.name).toBe("Pull");
    expect(plannedOn(p, progs, "2026-11-03")).toBeNull();
    expect(plannedOn(p, progs, "2026-12-07")).toBeNull();
  });
});

describe("stale cleanup", () => {
 it("recovers forgotten dates while protecting remote and local completed days", async () => {
  const c = fakeCalendar(), st = calState({plan:true});
  await runCalendar(st,c,helpers);
  c.listDayEvents = vi.fn().mockResolvedValue([{date:"2025-01-01",completed:false},{date:"2025-01-02",completed:true},{date:"2025-01-03",completed:false}]);
  st.entries=[{date:"2025-01-03",sets:[{}]}]; c.log.length=0;
  await runCalendar(st,c,helpers);
  expect(c.log).toEqual(["delete " + dayEventId("2025-01-01")]);
 });
 it("retries failed deletion without losing its mapping", async () => {
  const c = fakeCalendar(), st = calState({plan:true}); await runCalendar(st,c,helpers);
  st.gcal.dates!.push("2025-01-01"); const del=c.deleteEvent;
  c.deleteEvent=vi.fn().mockRejectedValueOnce(new Error("offline"));
  await runCalendar(st,c,helpers); // silme hatası plan yazımını engellemez
  expect(st.gcal.dates).toContain("2025-01-01"); c.deleteEvent=del;
  await runCalendar(st,c,helpers); expect(st.gcal.dates).not.toContain("2025-01-01");
 });
 it("cleans tasks older than backfill and preserves finished and unrelated tasks", async () => {
  const tc=fakeTasks(), st=taskState(); await runCalendar(st,fakeCalendar(),helpers,tc);
  tc.lists[st.gcal.taskList!].push({id:"old",title:"Workout: Push",notes:"[spor-defteri]",due:"2026-10-01",status:"needsAction"},{id:"done",title:"Workout: Push",due:"2025-01-02",status:"completed"},{id:"other",title:"Personal",due:"2025-01-01",status:"needsAction"});
  await runCalendar(st,fakeCalendar(),helpers,tc);
  const ids=tc.lists[st.gcal.taskList!].map(t=>t.id);
  expect(ids).not.toContain("old"); expect(ids).toContain("done"); expect(ids).toContain("other");
 });
 it("reads all Google pages and ignores unrelated event ids", async () => {
  const f=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({items:[{id:dayEventId("2025-01-01"),summary:"Workout: Push"},{id:sessionEventId("abc")}],nextPageToken:"next"}))).mockResolvedValueOnce(new Response(JSON.stringify({items:[{id:dayEventId("2025-01-02"),summary:String.fromCodePoint(0x2705)+" Workout: Push"}]})));
  expect(await calendarClient("token",f).listDayEvents!("cal")).toEqual([{date:"2025-01-01",completed:false},{date:"2025-01-02",completed:true}]);
  expect(f.mock.calls[1][0]).toContain("pageToken=next");
 });
});
