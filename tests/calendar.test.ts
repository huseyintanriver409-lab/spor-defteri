import { describe, it, expect, vi } from "vitest";
import {
  eventId, sessionEventId, planEventId, planEvents, planSignature, pendingSessions, sessionEvent, runCalendar,
  CalendarMissing, BACKFILL_DAYS, MAX_PER_RUN, type CalendarClient, type CalendarState, type Session,
} from "../src/core/calendar.ts";
import { calendarClient } from "../src/sync/calendar.ts";
import { AuthError } from "../src/sync/drive.ts";
import { withDefaults, mergeStates, DEFAULTS } from "../src/core/schema.ts";

const NOW = new Date(2026, 10, 1, 12, 0).getTime(); // 1 Kasım 2026 Pazar 12:00 (yerel)
const H = 36e5;
const progs = [
  { id: "p1", name: "Push", items: [{ ex: "Bench Press (Barbell)", sets: 3, reps: "6-8" }] },
  { id: "p2", name: "Pull", items: [{ ex: "Barbell Row", sets: 3, reps: "8" }] },
];
const plan = () => ({ days: { MO: { prog: "p1", time: "18:30" }, TH: { prog: "p2" } } as Record<string, { prog: string; time?: string }>, dur: 75, remind: 30 });
const ses = (id: string, endAgoH: number, extra: Partial<Session> = {}): Session => ({ id, date: "2026-10-31", start: NOW - endAgoH * H - H, end: NOW - endAgoH * H, ...extra });
const helpers = { describeProgram: (p: any) => "• " + p.items[0].ex, describeSession: (s: Session) => ({ title: "Antrenman " + s.id, details: "ayrıntı" }), timeZone: "Europe/Istanbul", now: NOW };

// Bellekte takvim tutan sahte istemci
function fakeCalendar() {
  const cals: Record<string, Map<string, any>> = {};
  let n = 0;
  const log: string[] = [];
  const client: CalendarClient & { cals: typeof cals; log: string[] } = {
    cals, log,
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
    for (const id of [sessionEventId("mvxvpkn1z6fw"), sessionEventId("ğüş-çö"), planEventId("SU"), eventId("sdses", "a")]) {
      expect(id).toMatch(/^[0-9a-v]{5,1024}$/);
    }
  });
  it("aynı kayıt hep aynı kimliği verir, farklı kayıtlar farklı", () => {
    expect(sessionEventId("abc")).toBe(sessionEventId("abc"));
    expect(sessionEventId("abc")).not.toBe(sessionEventId("abd"));
    expect(planEventId("MO")).not.toBe(sessionEventId("MO"));
  });
});

describe("haftalık plan etkinlikleri", () => {
  const evs = planEvents(plan(), progs, { today: new Date(NOW), timeZone: "Europe/Istanbul", describe: helpers.describeProgram });
  it("yedi gün; programsız günler silinecek (body null)", () => {
    expect(evs).toHaveLength(7);
    expect(evs.filter(e => e.body).map(e => e.id)).toEqual([planEventId("MO"), planEventId("TH")]);
  });
  it("sonraki ilk günden başlayan, haftalık tekrarlayan, hatırlatmalı etkinlik", () => {
    const mo = evs.find(e => e.id === planEventId("MO"))!.body!;
    expect(mo).toMatchObject({
      summary: "Antrenman: Push",
      start: { dateTime: "2026-11-02T18:30:00", timeZone: "Europe/Istanbul" },
      end: { dateTime: "2026-11-02T19:45:00", timeZone: "Europe/Istanbul" },
      recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=MO"],
      reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 30 }] },
    });
    // saat girilmemişse 19:00
    expect(evs.find(e => e.id === planEventId("TH"))!.body!.start.dateTime).toBe("2026-11-05T19:00:00");
  });
  it("hatırlatma 0 ise hatırlatma yok", () => {
    const p = { ...plan(), remind: 0 };
    const b = planEvents(p, progs, { today: new Date(NOW), timeZone: "UTC", describe: () => "" }).find(e => e.body)!.body!;
    expect(b.reminders).toEqual({ useDefault: false });
  });
  it("imza tarihle değişmez; saat, süre, program adı ve içeriğiyle değişir", () => {
    const base = planSignature(plan(), progs);
    expect(planSignature(plan(), progs)).toBe(base);
    const p2 = plan(); p2.days.MO.time = "19:00";
    expect(planSignature(p2, progs)).not.toBe(base);
    expect(planSignature({ ...plan(), dur: 60 }, progs)).not.toBe(base);
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
      summary: "T", description: "D", start: { dateTime: new Date(s.start).toISOString() }, end: { dateTime: new Date(s.end).toISOString() },
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
    const c = fakeCalendar(), st = calState({ log: true, plan: true }, [ses("a", 1), ses("b", 2)]);
    const r = await runCalendar(st, c, helpers);
    expect(r).toMatchObject({ created: true, planUpdated: true, written: 2 });
    expect(st.gcal.id).toBe("cal1");
    expect(st.gcal.planSig).toBe(planSignature(st.plan, st.programs));
    expect(st.sessions.every(s => s.cal === 1)).toBe(true);
    expect([...c.cals.cal1.keys()].sort()).toEqual([planEventId("MO"), planEventId("TH"), sessionEventId("a"), sessionEventId("b")].sort());
  });

  it("ikinci çalıştırmada değişiklik yoksa istek yapmaz", async () => {
    const c = fakeCalendar(), st = calState({ log: true, plan: true }, [ses("a", 1)]);
    await runCalendar(st, c, helpers);
    c.log.length = 0;
    expect(await runCalendar(st, c, helpers)).toMatchObject({ written: 0, planUpdated: false, created: false });
    expect(c.log).toEqual([]);
  });

  it("plan değişince yeniden yazar, plandan çıkan gün silinir", async () => {
    const c = fakeCalendar(), st = calState({ plan: true });
    await runCalendar(st, c, helpers);
    delete st.plan.days.TH; st.plan.days.SA = { prog: "p2", time: "10:00" };
    await runCalendar(st, c, helpers);
    expect([...c.cals.cal1.keys()].sort()).toEqual([planEventId("MO"), planEventId("SA")].sort());
  });

  it("plan kapatılınca takvimdeki plan silinir, imza boşalır", async () => {
    const c = fakeCalendar(), st = calState({ plan: true });
    await runCalendar(st, c, helpers);
    st.gcal.plan = false;
    await runCalendar(st, c, helpers);
    expect(c.cals.cal1.size).toBe(0);
    expect(st.gcal.planSig).toBe("");
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
    st.sessions.push(ses("b", 0.5));
    await runCalendar(st, c, helpers);
    expect(st.gcal.id).toBe("cal2");
    expect(c.cals.cal2.has(sessionEventId("b"))).toBe(true);
    // plan imzası sıfırlandığı için bir sonraki çalıştırmada plan yeni takvime yazılır
    await runCalendar(st, c, helpers);
    expect(c.cals.cal2.has(planEventId("MO"))).toBe(true);
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
    expect(withDefaults({ v: 2 }).gcal).toEqual({ log: false, plan: false, id: "", planSig: "" });
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
