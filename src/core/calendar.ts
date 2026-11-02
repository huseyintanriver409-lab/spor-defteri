/* ---------- Google Takvim eşitlemesi (istemciden bağımsız) ----------
   Uygulama yalnız kendi oluşturduğu "Spor Defteri" takvimine yazar (kapsam calendar.app.created).
   - Biten antrenmanlar (sessions) gerçek başlangıç/bitiş saatiyle etkinlik olur. Yazılan oturuma cal: 1
     işareti konur; işaret Drive ile eşitlendiği için takvim izni tek cihazda olsa da bütün cihazların
     antrenmanları yazılır.
   - Haftalık plan, her tarih için ayrı ve hatırlatmalı bir etkinliktir: bugünden planın bitiş tarihine
     (plan.until) kadar, bitiş yoksa HORIZON_DAYS ilerisine kadar (her açılışta ilerler). Yazılan tarihler
     gcal.dates'te tutulur; plan değişince imzası (planSig) değişir, plandan çıkan tarihler silinir, kalanlar
     yeniden yazılır. Geçmiş tarihlere dokunulmaz.
   - O gün antrenman bitince ilk oturum aynı tarih kimliğiyle "✅" etkinliği olarak yazılır: takvimdeki plan
     etkinliği tamamlandıya döner, yanında ikinci bir etkinlik açılmaz.
   Etkinlik kimlikleri kayıttan türetilir: aynı oturum iki cihazdan yazılsa da tek etkinlik olur. */
import { pad, parse, ymd } from "./dates.ts";

export const CAL_SUMMARY = "Spor Defteri";
export const CAL_DESCRIPTION = "Spor Defteri uygulamasının yazdığı antrenmanlar ve haftalık plan.";
// takvim açılınca en fazla bu kadar gün geriye bakılır; bir çalıştırmada en fazla bu kadar oturum yazılır
export const BACKFILL_DAYS = 30;
export const MAX_PER_RUN = 20;
// bitiş tarihi yoksa plan bu kadar gün ilerisine yazılır; bitiş tarihi en fazla bu kadar ileride olabilir
export const HORIZON_DAYS = 56;
export const MAX_UNTIL_DAYS = 366;
// bir çalıştırmada en fazla bu kadar plan etkinliği yazılır, kalanı sonraki sefere
export const MAX_PLAN_PER_RUN = 60;
export const DONE_MARK = "✅ ";

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
export const dayEventId = (date: string) => eventId("sdgun", date);
// eski sürümün haftalık tekrarlayan plan etkinlikleri (artık yalnız silmek için)
export const planEventId = (dayCode: string) => eventId("sdplan", dayCode);

// Yerel saatle "YYYY-MM-DDTHH:MM:00" (tekrarlayan etkinlikler saat dilimiyle birlikte bunu ister)
export const localDateTime = (d: Date) => `${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

export interface Plan { days: Record<string, { prog: string; time?: string }>; dur: number; remind: number; until?: string }
export interface Program { id: string; name: string; items: { ex: string; sets: number; reps?: string }[] }

// Takvimdeki planın neye göre yazıldığı. Bugünün tarihini içermez: aynı plan her gün yeniden yazılmaz.
// Önek, imzanın tarihli plana ait olduğunu gösterir; eski sürüm (tekrarlayan etkinlik) "[" ile başlayan imza yazar.
export const SIG_PREFIX = "d1:";
export function planSignature(plan: Plan, programs: Program[]): string {
  return SIG_PREFIX + JSON.stringify([plan.dur, plan.remind, plan.until || "", WEEKDAYS.map(([code]) => {
    const d = plan.days[code], p = d && programs.find(x => x.id === d.prog);
    return p ? [code, d!.time || "19:00", p.name, p.items] : [code];
  })]);
}

export interface PlannedDay { date: string; code: string; time: string; p: Program }

// Planın takvimde olması gereken tarihleri: bugünden bitiş tarihine (yoksa HORIZON_DAYS ilerisine) kadar
export function plannedDates(plan: Plan, programs: Program[], today: Date): PlannedDay[] {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (plan.until ? MAX_UNTIL_DAYS : HORIZON_DAYS));
  if (plan.until && /^\d{4}-\d{2}-\d{2}$/.test(plan.until) && parse(plan.until) < end) end = parse(plan.until);
  const out: PlannedDay[] = [];
  for (; d <= end; d.setDate(d.getDate() + 1)) {
    const code = WEEKDAYS.find(([, js]) => js === d.getDay())![0];
    const e = plan.days[code], p = e && programs.find(x => x.id === e.prog);
    if (p) out.push({ date: ymd(d), code, time: e.time || "19:00", p });
  }
  return out;
}

export function plannedEvent(x: PlannedDay, plan: Plan, opts: { timeZone: string; describe: (p: Program) => string }) {
  const [h, m] = x.time.split(":").map(Number);
  const start = parse(x.date); start.setHours(h, m, 0, 0);
  const end = new Date(start.getTime() + (plan.dur || 60) * 60000);
  return {
    summary: "Antrenman: " + x.p.name,
    description: opts.describe(x.p),
    start: { dateTime: localDateTime(start), timeZone: opts.timeZone },
    end: { dateTime: localDateTime(end), timeZone: opts.timeZone },
    reminders: plan.remind > 0 ? { useDefault: false, overrides: [{ method: "popup", minutes: plan.remind }] } : { useDefault: false },
    status: "confirmed",
  };
}

export interface Session { id: string; date: string; start: number; end: number; prog?: string | null; cal?: number }

export function sessionEvent(s: Session, text: { title: string; details: string }) {
  return {
    summary: DONE_MARK + text.title,
    description: text.details,
    start: { dateTime: new Date(s.start).toISOString() },
    end: { dateTime: new Date(Math.max(s.end, s.start + 60000)).toISOString() },
    reminders: { useDefault: false },
    status: "confirmed",
  };
}

// Günün ilk antrenmanı o tarihin plan etkinliğinin yerine yazılır; aynı gün başka bir antrenman
// önce başladıysa ya da zaten yazıldıysa kendi kimliğiyle ayrı etkinlik olur
export function sessionTargetId(s: Session, sessions: Session[]): string {
  const same = sessions.filter(x => x.date === s.date && x.id !== s.id && x.end);
  return same.some(x => x.cal || x.start < s.start) ? sessionEventId(s.id) : dayEventId(s.date);
}

// Henüz takvime yazılmamış, son BACKFILL_DAYS içinde biten oturumlar (eskiden yeniye, en fazla MAX_PER_RUN)
export function pendingSessions(sessions: Session[], now: number): Session[] {
  const since = now - BACKFILL_DAYS * 864e5;
  return sessions.filter(s => !s.cal && s.end && s.end > since).sort((a, b) => a.end - b.end).slice(0, MAX_PER_RUN);
}

export interface CalendarState {
  gcal: { log: boolean; plan: boolean; id: string; planSig: string; dates?: string[]; dated?: number };
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
      g.id = ""; g.planSig = ""; g.dates = [];
      await fn(await ensure());
    }
  };

  if (g.log) {
    for (const s of pendingSessions(state.sessions, now)) {
      await withCal(cal => client.upsertEvent(cal, sessionTargetId(s, state.sessions), sessionEvent(s, h.describeSession(s))));
      s.cal = 1; out.written++;
    }
  }

  // eski sürümün haftalık tekrarlayan etkinlikleri silinir: ilk sefer ve eski sürümde kalmış bir cihaz
  // onları yeniden yazdıysa (imzası eski biçimde)
  if (!g.dated || (g.planSig && !g.planSig.startsWith(SIG_PREFIX))) {
    if (g.id) await withCal(async cal => { for (const [code] of WEEKDAYS) await client.deleteEvent(cal, planEventId(code)); });
    g.dated = 1;
  }

  // geçmiş tarihler ve antrenmanı yapılmış günler artık planın değil (yapılan gün ✅ etkinliğiyle değişti)
  const today = ymd(new Date(now));
  const done = new Set(g.log ? state.sessions.filter(s => s.end).map(s => s.date) : []);
  g.dates = (g.dates || []).filter(d => d >= today && !done.has(d));
  const want = g.plan ? plannedDates(state.plan, state.programs, new Date(now)).filter(x => !done.has(x.date)) : [];
  const target = g.plan ? planSignature(state.plan, state.programs) : "";
  if (target !== g.planSig) {
    if (!g.id) g.dates = [];
    // plandan çıkan tarihler silinir; kalanlar aşağıda yeni haliyle yeniden yazılır
    const keep = new Set(want.map(x => x.date));
    for (const d of [...g.dates]) {
      if (!keep.has(d)) await withCal(cal => client.deleteEvent(cal, dayEventId(d)));
      g.dates = g.dates.filter(x => x !== d);
    }
    g.planSig = target; out.planUpdated = true;
  }
  let n = 0;
  for (const x of want) {
    if (g.dates.includes(x.date)) continue;
    if (n++ >= MAX_PLAN_PER_RUN) break;
    await withCal(cal => client.upsertEvent(cal, dayEventId(x.date), plannedEvent(x, state.plan, { timeZone: h.timeZone, describe: h.describeProgram })));
    g.dates.push(x.date); out.planUpdated = true;
  }
  return out;
}
