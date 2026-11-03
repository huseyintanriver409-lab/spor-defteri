/* ---------- Claude bağlayıcısının işlemleri ----------
   Claude, uzak MCP sunucusu (mcp/ klasörü) üzerinden kullanıcının Drive'daki eşitleme dosyasını okur ve değiştirir.
   Buradaki fonksiyonlar o dosyadan okunan State üzerinde çalışır; sunucu değişiklikten sonra stampChanges ile
   damgalayıp dosyayı geri yazar, telefon da bir sonraki eşitlemede mergeStates ile alır.
   Program ekleme ve plan kurma, bağlantıyla eklemedeki (app/importer.js) kurallarla aynıdır.
   Tarayıcıya bağlı değildir; testleri tests/assistant.test.ts. */
import { CARDIO, LIB } from "./library.ts";
import { dayCode, matchExercise, normalize, parseDate, parseTime } from "./importer.ts";
import { e1rm, work, volume } from "./training.ts";
import { parse, ymd } from "./dates.ts";
import { MAX_UNTIL_DAYS } from "./calendar.ts";
import type { State, Stamped } from "./schema.ts";

export const WEEK = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
const DAY_NAMES: Record<string, string> = { MO: "Pazartesi", TU: "Salı", WE: "Çarşamba", TH: "Perşembe", FR: "Cuma", SA: "Cumartesi", SU: "Pazar" };
export const MAX_ITEMS = 30;
export const MAX_WORKOUTS = 100;

// Kullanıcının bildiği bütün hareketler: kütüphane + kendi eklediği
export const knownExercises = (s: State): string[] => [...Object.values(LIB).flat(), ...s.custom.map(c => c.name)];

const progName = (s: State, id: string) => s.programs.find(p => p.id === id)?.name || "";

// Programı kimliğiyle ya da adıyla bulur (büyük/küçük harf ve Türkçe harf farkı gözetmez)
export function findProgram(s: State, ref: string): Stamped | undefined {
  const n = normalize(ref || "");
  return s.programs.find(p => p.id === ref) || s.programs.find(p => normalize(p.name) === n);
}

export interface ItemInput { exercise: string; sets?: number; reps?: string | number }
export interface ProgItem { ex: string; sets: number; reps: string }

// Hareket adları kütüphanedeki yazımla eşlenir; bulunamayanlar yeni (özel) hareket olarak eklenir
function toItems(s: State, items: ItemInput[], notes: string[]): ProgItem[] {
  if (!Array.isArray(items) || !items.length) throw new Error("Programda en az bir hareket olmalı.");
  if (items.length > MAX_ITEMS) throw new Error(`Bir günde en fazla ${MAX_ITEMS} hareket olabilir.`);
  return items.map(it => {
    const raw = String(it.exercise || "").trim().slice(0, 80);
    if (!raw) throw new Error("Hareket adı boş olamaz.");
    const m = matchExercise(raw, knownExercises(s));
    if (!m) {
      s.custom.push({ name: raw, group: "Diğer" });
      notes.push(`"${raw}" listede yoktu, yeni hareket olarak eklendi.`);
    } else if (m !== raw) notes.push(`"${raw}" → "${m}"`);
    const reps = String(it.reps ?? "").trim().match(/\d+(-\d+)?/)?.[0] || "";
    return { ex: m || raw, sets: Math.min(20, Math.max(1, Math.round(+it.sets! || 3))), reps };
  });
}

const uniqueName = (s: State, name: string) => {
  if (!s.programs.some(p => p.name === name)) return name;
  let n = 2; while (s.programs.some(p => p.name === `${name} (${n})`)) n++;
  return `${name} (${n})`;
};

export interface DayInput { name?: string; items: ItemInput[] }

// Çok günlü program her gün için ayrı bir program olur ("Ad · Gün"), uygulamadaki gibi
export function addProgram(s: State, name: string, days: DayInput[], uid: () => string) {
  const base = String(name || "").trim().slice(0, 60) || "Claude'dan program";
  if (!Array.isArray(days) || !days.length) throw new Error("En az bir gün gerekli.");
  if (days.length > 7) throw new Error("En fazla 7 gün olabilir.");
  const notes: string[] = [];
  const created = days.map((d, i) => {
    const dn = String(d.name || "").trim().slice(0, 30) || String.fromCharCode(65 + i);
    const prog = { id: uid(), name: uniqueName(s, days.length > 1 ? `${base} · ${dn}` : base), items: toItems(s, d.items, notes) };
    s.programs.push(prog);
    return { id: prog.id, name: prog.name };
  });
  s.onboarded = true;
  return { created, notes };
}

export function updateProgram(s: State, ref: string, change: { name?: string; items?: ItemInput[] }) {
  const p = findProgram(s, ref);
  if (!p) throw new Error(`Program bulunamadı: ${ref}`);
  const notes: string[] = [];
  if (change.name != null && String(change.name).trim()) {
    const n = String(change.name).trim().slice(0, 60);
    if (n !== p.name) p.name = uniqueName(s, n);
  }
  if (change.items) p.items = toItems(s, change.items, notes);
  return { id: p.id, name: p.name, notes };
}

// Program silinir; haftalık planda o programa ayrılmış günler boşalır
export function deleteProgram(s: State, ref: string) {
  const p = findProgram(s, ref);
  if (!p) throw new Error(`Program bulunamadı: ${ref}`);
  s.programs = s.programs.filter(x => x !== p);
  const freed = Object.keys(s.plan.days).filter(c => s.plan.days[c].prog === p.id);
  if (freed.length) {
    s.plan.days = Object.fromEntries(Object.entries(s.plan.days).filter(([c]) => !freed.includes(c)));
    s.goal = Object.keys(s.plan.days).length || s.goal;
  }
  return { name: p.name, freedDays: freed.map(c => DAY_NAMES[c]) };
}

export interface PlanDayInput { day: string; program?: string; time?: string }

// Haftalık planı baştan kurar. Programı yazılmayan günler, mevcut plandaki programı ya da planlı programları sırayla alır.
// until: "" = süresiz, verilmezse (undefined) eski bitiş tarihi kalır.
export function setPlan(s: State, days: PlanDayInput[], until: string | undefined, today: Date) {
  if (!Array.isArray(days)) throw new Error("Günler listesi gerekli.");
  if (days.length && !s.programs.length) throw new Error("Önce bir program ekle; plan programlara göre kurulur.");
  const old = s.plan.days, next: Record<string, { prog: string; time: string }> = {};
  const pool = [...new Set(Object.values(old).map((d: any) => d.prog).filter((id: string) => s.programs.some(p => p.id === id)))];
  if (!pool.length) pool.push(...s.programs.map(p => p.id));
  let rot = 0;
  for (const d of days) {
    const code = dayCode(String(d.day || ""));
    if (!code) throw new Error(`Gün anlaşılamadı: ${d.day}`);
    if (next[code]) throw new Error(`${DAY_NAMES[code]} iki kez yazılmış.`);
    let prog: string;
    if (d.program) {
      const p = findProgram(s, d.program);
      if (!p) throw new Error(`Program bulunamadı: ${d.program}`);
      prog = p.id;
    } else prog = old[code]?.prog && s.programs.some(p => p.id === old[code].prog) ? old[code].prog : pool[rot++ % pool.length];
    let time = old[code]?.time || "19:00";
    if (d.time) { time = parseTime(String(d.time)); if (!time) throw new Error(`Saat anlaşılamadı: ${d.time}`); }
    next[code] = { prog, time };
  }
  if (until !== undefined) {
    const u = String(until).trim();
    if (u) {
      const v = parseDate(u);
      if (!v) throw new Error(`Bitiş tarihi anlaşılamadı: ${u}`);
      if (v < ymd(today)) throw new Error("Bitiş tarihi geçmişte olamaz.");
      const max = new Date(today.getFullYear(), today.getMonth(), today.getDate() + MAX_UNTIL_DAYS);
      if (parse(v) > max) throw new Error("Bitiş tarihi en fazla bir yıl ileride olabilir.");
      s.plan.until = v;
    } else s.plan.until = "";
  }
  // gün sırası haftaya göre
  s.plan.days = Object.fromEntries(WEEK.filter(c => next[c]).map(c => [c, next[c]]));
  if (days.length) s.goal = days.length;
  return planView(s);
}

export function planView(s: State) {
  return {
    days: WEEK.filter(c => s.plan.days[c]).map(c => ({ day: DAY_NAMES[c], code: c, time: s.plan.days[c].time || "19:00", program: progName(s, s.plan.days[c].prog) })),
    until: s.plan.until || "",
    durationMin: s.plan.dur, reminderMin: s.plan.remind,
    googleCalendar: !!s.gcal?.plan,
  };
}

const setsText = (sets: any[]) => work(sets).map(x => x.sec != null ? `${x.sec}sn${+x.w ? "+" + x.w + "kg" : ""}` : `${+x.w || 0}x${+x.r || 0}`).join(", ");

// Genel durum: programlar, plan, son antrenmanlar
export function overview(s: State, today: Date, recent = 8) {
  const dates = [...new Set(s.entries.filter(e => work(e.sets).length).map(e => e.date as string))].sort().reverse();
  return {
    today: ymd(today),
    programs: s.programs.map(p => ({ id: p.id, name: p.name, items: p.items.map((i: any) => ({ exercise: i.ex, sets: i.sets, reps: i.reps || "" })) })),
    plan: planView(s),
    weeklyGoal: s.goal,
    totalWorkouts: dates.length,
    firstWorkout: dates[dates.length - 1] || null,
    recentWorkouts: dates.slice(0, recent).map(date => {
      const ss = s.sessions.filter(x => x.date === date && x.end), prog = ss.find(x => x.prog)?.prog;
      return {
        date, program: prog ? progName(s, prog) : "", minutes: ss.length ? Math.round(ss.reduce((a, x) => a + x.end - x.start, 0) / 60000) : null,
        exercises: s.entries.filter(e => e.date === date && work(e.sets).length).map(e => ({ exercise: e.ex, sets: setsText(e.sets) })),
      };
    }),
    profile: { sex: s.profile?.sex, bodyweightKg: +s.profile?.bw || null },
  };
}

// Hareket geçmişi: bir hareketin (ya da son günlerdeki bütün hareketlerin) setleri ve en iyi değerleri
export function history(s: State, exercise: string | undefined, days: number, today: Date) {
  const since = ymd(new Date(today.getFullYear(), today.getMonth(), today.getDate() - Math.min(Math.max(days || 30, 1), 3650)));
  let ex = "";
  if (exercise) {
    const used = [...new Set(s.entries.map(e => e.ex as string))];
    ex = matchExercise(exercise, used) || "";
    if (!ex) return { exercise, found: false, entries: [], knownExercisesInLog: used.slice(0, 200) };
  }
  const list = s.entries.filter(e => e.date >= since && (!ex || e.ex === ex) && work(e.sets).length)
    .sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
  const entries = list.slice(-200).map(e => ({ date: e.date, exercise: e.ex, sets: setsText(e.sets), volumeKg: Math.round(volume(e.sets)), ...(e.note ? { note: e.note } : {}) }));
  let best = null;
  if (ex) {
    const all = s.entries.filter(e => e.ex === ex).flatMap(e => work(e.sets).map((x: any) => ({ date: e.date, w: +x.w || 0, r: +x.r || 0 })));
    const top = all.reduce((a, x) => (!a || x.w > a.w ? x : a), null as any);
    const topE = all.filter(x => x.r > 0 && x.r <= 12).reduce((a, x) => (!a || e1rm(x.w, x.r) > e1rm(a.w, a.r) ? x : a), null as any);
    best = { heaviest: top, estimated1RM: topE ? { ...topE, kg: Math.round(e1rm(topE.w, topE.r) * 10) / 10 } : null };
  }
  return { exercise: ex || null, since, found: true, entries, best };
}

export interface SetInput { kg?: number; reps?: number; seconds?: number; minutes?: number; km?: number; warmup?: boolean; rir?: number }
export interface WorkoutInput { date: string; exercises: { exercise: string; sets: SetInput[]; note?: string }[] }

const num = (v: unknown, max: number) => { const n = +(v as any); return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0; };
const isCardioEx = (s: State, ex: string) => LIB[CARDIO].includes(ex) || s.custom.some(c => c.name === ex && c.group === CARDIO);
const isTimedEx = (s: State, ex: string) => { const p = (s.exPrefs?.[ex] || {}).timed; return p != null ? !!p : /plank|wall sit|dead hang|l-sit|hollow body|battle rope|farmer/i.test(ex); };

// Uygulamanın set biçimine çevirir: ağırlık w/tekrar r; süreli harekette sec; kardiyoda w = dakika, r = km; ısınma t: "w"
function toSet(s: State, ex: string, x: SetInput) {
  if (isCardioEx(s, ex)) return { w: num(x.minutes ?? (x.seconds ? x.seconds / 60 : 0), 1440), r: num(x.km, 1000) };
  const o: any = { w: num(x.kg, 1000), r: num(x.reps, 1000) };
  if (x.warmup) o.t = "w";
  if (x.seconds || (isTimedEx(s, ex) && !x.reps)) { o.sec = num(x.seconds, 36000); o.r = 0; }
  else if (x.rir != null && Number.isFinite(+x.rir)) o.rir = Math.max(0, Math.min(10, Math.round(+x.rir)));
  return o;
}

// Geçmiş (ya da bugünkü) antrenmanları deftere yazar; başka uygulamadan geçenler eski kayıtlarını böyle aktarır.
// Uygulamadaki elle kayıt gibi: aynı gün aynı harekete eklenen setler aynı kayda girer. Aynı setler zaten
// kayıtlıysa tekrar yazılmaz, böylece aynı liste iki kez gönderilse de çift kayıt olmaz.
export function logWorkouts(s: State, workouts: WorkoutInput[], today: Date, uid: () => string) {
  if (!Array.isArray(workouts) || !workouts.length) throw new Error("En az bir antrenman gerekli.");
  if (workouts.length > MAX_WORKOUTS) throw new Error(`Bir seferde en fazla ${MAX_WORKOUTS} antrenman yazılabilir; kalanını ayrı çağrıda gönder.`);
  const notes: string[] = [], todayS = ymd(today);
  let added = 0, sets = 0, skipped = 0;
  const days = new Set<string>();
  for (const w of workouts) {
    const date = parseDate(String(w.date || ""));
    if (!date) throw new Error(`Tarih anlaşılamadı: ${w.date}`);
    if (date > todayS) throw new Error(`Gelecekteki bir tarihe antrenman yazılamaz: ${date}`);
    if (date < "1990-01-01") throw new Error(`Tarih çok eski: ${date}`);
    if (!Array.isArray(w.exercises) || !w.exercises.length) throw new Error(`${date}: hareket yok.`);
    for (const e of w.exercises) {
      const raw = String(e.exercise || "").trim().slice(0, 80);
      if (!raw) throw new Error(`${date}: hareket adı boş.`);
      let ex = matchExercise(raw, knownExercises(s));
      if (!ex) { ex = raw; s.custom.push({ name: raw, group: "Diğer" }); notes.push(`"${raw}" listede yoktu, yeni hareket olarak eklendi.`); }
      else if (ex !== raw && !notes.includes(`"${raw}" → "${ex}"`)) notes.push(`"${raw}" → "${ex}"`);
      if (!Array.isArray(e.sets) || e.sets.length > 50) throw new Error(`${date} ${ex}: 1-50 set olmalı.`);
      const list = e.sets.map(x => toSet(s, ex!, x || {})).filter(x => x.w || x.r || x.sec);
      if (!list.length) throw new Error(`${date} ${ex}: setlerde değer yok (kg/tekrar, saniye ya da dakika/km).`);
      const note = String(e.note || "").trim().slice(0, 300);
      const same = s.entries.find(x => x.ex === ex && x.date === date);
      if (same && JSON.stringify(same.sets).includes(JSON.stringify(list).slice(1, -1))) { skipped++; continue; }
      if (same) { same.sets.push(...list); if (note) same.note = same.note ? same.note + " · " + note : note; }
      else s.entries.push({ id: uid(), ts: Date.now(), date, ex, sets: list, ...(note ? { note } : {}) });
      added++; sets += list.length; days.add(date);
    }
  }
  if (added) s.onboarded = true;
  return { days: days.size, exercises: added, sets, alreadyLogged: skipped, notes };
}

// Bir günün kayıtlarını (ya da o gün tek bir hareketi) siler
export function deleteLog(s: State, date: string, exercise?: string) {
  const d = parseDate(String(date || ""));
  if (!d) throw new Error(`Tarih anlaşılamadı: ${date}`);
  let list = s.entries.filter(e => e.date === d);
  if (exercise) {
    const ex = matchExercise(exercise, [...new Set(list.map(e => e.ex as string))]);
    list = ex ? list.filter(e => e.ex === ex) : [];
  }
  if (!list.length) throw new Error(`${d} için ${exercise ? `"${exercise}" ` : ""}kayıt bulunamadı.`);
  s.entries = s.entries.filter(e => !list.includes(e));
  // o günden hiç kayıt kalmadıysa antrenman oturumu da gider
  if (!s.entries.some(e => e.date === d)) s.sessions = s.sessions.filter(x => x.date !== d);
  return { date: d, deleted: list.map(e => e.ex) };
}
