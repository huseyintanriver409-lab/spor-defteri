/* ---------- Google Takvim eşitlemesi (istemciden bağımsız) ----------
   Uygulama yalnız kendi oluşturduğu "Spor Defteri" takvimine yazar (kapsam calendar.app.created).
   - Biten antrenmanlar (sessions) gerçek başlangıç/bitiş saatiyle etkinlik olur. Yazılan oturuma cal: 1
     işareti konur; işaret Drive ile eşitlendiği için takvim izni tek cihazda olsa da bütün cihazların
     antrenmanları yazılır.
   - Haftalık plan, her gün için tekrarlayan (RRULE) ve hatırlatmalı bir etkinliktir; plan değişince
     imzası (planSig) değişir ve yedi gün yeniden yazılır.
   Etkinlik kimlikleri kayıttan türetilir: aynı oturum iki cihazdan yazılsa da tek etkinlik olur. */
import { pad, ymd } from "./dates.ts";

export const CAL_SUMMARY = "Spor Defteri";
export const CAL_DESCRIPTION = "Spor Defteri uygulamasının yazdığı antrenmanlar ve haftalık plan.";
// takvim açılınca en fazla bu kadar gün geriye bakılır; bir çalıştırmada en fazla bu kadar oturum yazılır
export const BACKFILL_DAYS = 30;
export const MAX_PER_RUN = 20;

const WEEKDAYS: [string, number][] = [["MO", 1], ["TU", 2], ["WE", 3], ["TH", 4], ["FR", 5], ["SA", 6], ["SU", 0]];

export interface CalendarClient {
  createCalendar(summary: string, description: string, timeZone: string): Promise<string>;
  // aynı kimlikle varsa günceller (silinmişse geri getirir), yoksa oluşturur
  upsertEvent(calendarId: string, eventId: string, body: object): Promise<void>;
  // etkinlik zaten yoksa hata vermez
  deleteEvent(calendarId: string, eventId: string): Promise<void>;
}
// Takvim Google'da silinmiş: yeniden oluşturulmalı
export class CalendarMissing extends Error {}

// Google etkinlik kimliği yalnız base32hex (0-9, a-v) karakterlerinden oluşabilir, 5-1024 uzunlukta.
// Kayıt anahtarı UTF-8 onaltılık kodlanır (0-9a-f ⊂ base32hex); önek de bu alfabeden seçildi.
export const eventId = (prefix: string, raw: string): string =>
  prefix + [...new TextEncoder().encode(raw)].map(b => b.toString(16).padStart(2, "0")).join("");
export const sessionEventId = (sessionId: string) => eventId("sdses", sessionId);
export const planEventId = (dayCode: string) => eventId("sdplan", dayCode);

// Yerel saatle "YYYY-MM-DDTHH:MM:00" (tekrarlayan etkinlikler saat dilimiyle birlikte bunu ister)
export const localDateTime = (d: Date) => `${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

// bugün ya da sonraki ilk `jsDay` günü (0 = pazar)
export function nextDateFor(jsDay: number, from: Date): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  while (d.getDay() !== jsDay) d.setDate(d.getDate() + 1);
  return d;
}

export interface Plan { days: Record<string, { prog: string; time?: string }>; dur: number; remind: number }
export interface Program { id: string; name: string; items: { ex: string; sets: number; reps?: string }[] }

const planDays = (plan: Plan, programs: Program[]) =>
  WEEKDAYS.map(([code, js]) => {
    const d = plan.days[code];
    return { code, js, d, p: d ? programs.find(x => x.id === d.prog) : undefined };
  });

// Takvimdeki planın neye göre yazıldığı. Tarih içermez: aynı plan her gün yeniden yazılmaz.
export function planSignature(plan: Plan, programs: Program[]): string {
  return JSON.stringify([plan.dur, plan.remind, planDays(plan, programs).map(({ code, d, p }) => p ? [code, d!.time || "19:00", p.name, p.items] : [code])]);
}

export function planEvents(plan: Plan, programs: Program[], opts: { today: Date; timeZone: string; describe: (p: Program) => string }) {
  return planDays(plan, programs).map(({ code, js, d, p }) => {
    if (!p) return { id: planEventId(code), body: null };
    const [h, m] = (d!.time || "19:00").split(":").map(Number);
    const start = nextDateFor(js, opts.today); start.setHours(h, m, 0, 0);
    const end = new Date(start.getTime() + (plan.dur || 60) * 60000);
    return {
      id: planEventId(code),
      body: {
        summary: "Antrenman: " + p.name,
        description: opts.describe(p),
        start: { dateTime: localDateTime(start), timeZone: opts.timeZone },
        end: { dateTime: localDateTime(end), timeZone: opts.timeZone },
        recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${code}`],
        reminders: plan.remind > 0 ? { useDefault: false, overrides: [{ method: "popup", minutes: plan.remind }] } : { useDefault: false },
        status: "confirmed",
      },
    };
  });
}

export interface Session { id: string; date: string; start: number; end: number; prog?: string | null; cal?: number }

export function sessionEvent(s: Session, text: { title: string; details: string }) {
  return {
    summary: text.title,
    description: text.details,
    start: { dateTime: new Date(s.start).toISOString() },
    end: { dateTime: new Date(Math.max(s.end, s.start + 60000)).toISOString() },
    reminders: { useDefault: false },
    status: "confirmed",
  };
}

// Henüz takvime yazılmamış, son BACKFILL_DAYS içinde biten oturumlar (eskiden yeniye, en fazla MAX_PER_RUN)
export function pendingSessions(sessions: Session[], now: number): Session[] {
  const since = now - BACKFILL_DAYS * 864e5;
  return sessions.filter(s => !s.cal && s.end && s.end > since).sort((a, b) => a.end - b.end).slice(0, MAX_PER_RUN);
}

export interface CalendarState {
  gcal: { log: boolean; plan: boolean; id: string; planSig: string };
  plan: Plan; programs: Program[]; sessions: Session[];
}
export interface CalendarHelpers {
  describeProgram: (p: Program) => string;
  describeSession: (s: Session) => { title: string; details: string };
  timeZone: string;
  now?: number;
}

// Gerekenleri takvime yazar. state'i yerinde değiştirir (takvim kimliği, planSig, oturumlardaki cal işareti);
// hata olursa o ana kadar yapılanlar state'te kalır, çağıran her durumda kaydetmelidir.
export async function runCalendar(state: CalendarState, client: CalendarClient, h: CalendarHelpers) {
  const g = state.gcal, now = h.now ?? Date.now(), out = { written: 0, planUpdated: false, created: false };
  // plan kapatıldıysa ama takvimde hâlâ plan varsa (planSig dolu) silinmesi gerekir
  if (!g.log && !g.plan && !g.planSig) return out;
  const ensure = async () => {
    if (!g.id) { g.id = await client.createCalendar(CAL_SUMMARY, CAL_DESCRIPTION, h.timeZone); out.created = true; }
    return g.id;
  };
  // takvim kullanıcı tarafından silinmişse bir kez yeniden oluşturup tekrar dener; plan da yeniden yazılır
  const withCal = async (fn: (calId: string) => Promise<void>) => {
    try { await fn(await ensure()); }
    catch (e) {
      if (!(e instanceof CalendarMissing)) throw e;
      g.id = ""; g.planSig = "";
      await fn(await ensure());
    }
  };

  const target = g.plan ? planSignature(state.plan, state.programs) : "";
  if (target !== g.planSig) {
    if (!g.plan && !g.id) g.planSig = "";
    else {
      const evs = planEvents(state.plan, state.programs, { today: new Date(now), timeZone: h.timeZone, describe: h.describeProgram });
      await withCal(async cal => {
        for (const ev of evs) {
          if (g.plan && ev.body) await client.upsertEvent(cal, ev.id, ev.body);
          else await client.deleteEvent(cal, ev.id);
        }
      });
      g.planSig = target; out.planUpdated = true;
    }
  }

  if (g.log) {
    for (const s of pendingSessions(state.sessions, now)) {
      await withCal(cal => client.upsertEvent(cal, sessionEventId(s.id), sessionEvent(s, h.describeSession(s))));
      s.cal = 1; out.written++;
    }
  }
  return out;
}
