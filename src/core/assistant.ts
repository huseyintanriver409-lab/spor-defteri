/* ---------- Claude bağlayıcısının işlemleri ----------
   Claude, uzak MCP sunucusu (mcp/ klasörü) üzerinden kullanıcının Drive'daki eşitleme dosyasını okur ve değiştirir.
   Buradaki fonksiyonlar o dosyadan okunan State üzerinde çalışır; sunucu değişiklikten sonra stampChanges ile
   damgalayıp dosyayı geri yazar, telefon da bir sonraki eşitlemede mergeStates ile alır.
   Program ekleme ve plan kurma, bağlantıyla eklemedeki (app/importer.js) kurallarla aynıdır.
   Tarayıcıya bağlı değildir; testleri tests/assistant.test.ts. */
import { LIB } from "./library.ts";
import { dayCode, matchExercise, normalize, parseDate, parseTime } from "./importer.ts";
import { e1rm, work, volume } from "./training.ts";
import { parse, ymd } from "./dates.ts";
import { MAX_UNTIL_DAYS } from "./calendar.ts";
import type { State, Stamped } from "./schema.ts";

export const WEEK = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
const DAY_NAMES: Record<string, string> = { MO: "Pazartesi", TU: "Salı", WE: "Çarşamba", TH: "Perşembe", FR: "Cuma", SA: "Cumartesi", SU: "Pazar" };
export const MAX_ITEMS = 30;

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
  const sessions = [...s.sessions].filter(x => x.end).sort((a, b) => b.start - a.start).slice(0, recent);
  return {
    today: ymd(today),
    programs: s.programs.map(p => ({ id: p.id, name: p.name, items: p.items.map((i: any) => ({ exercise: i.ex, sets: i.sets, reps: i.reps || "" })) })),
    plan: planView(s),
    weeklyGoal: s.goal,
    totalWorkouts: s.sessions.filter(x => x.end).length,
    recentWorkouts: sessions.map(x => ({
      date: x.date, program: x.prog ? progName(s, x.prog) : "", minutes: Math.round((x.end - x.start) / 60000),
      exercises: s.entries.filter(e => e.date === x.date && work(e.sets).length).map(e => ({ exercise: e.ex, sets: setsText(e.sets) })),
    })),
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
