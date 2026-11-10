import { CARDIO, YOGA } from "./library.ts";
import { work, type WorkSet } from "./training.ts";
export const sportGroup = (g: string): boolean => g !== YOGA && g !== CARDIO;
export const restSeconds = (yoga: boolean, general: number, pref?: number): number => yoga ? (pref ?? 0) : (pref || general);
export const autoYogaHold = (_full: boolean, yoga: boolean, timed: boolean, rest: number,
 nextYoga: boolean, nextTimed: boolean, unfinished: boolean): boolean =>
 yoga && timed && rest === 0 && nextYoga && nextTimed && unfinished;
export const recordAllowed = (yoga: boolean, cardio: boolean): boolean => !yoga && !cardio;
export const programVisible = (focus: string, items: { ex: string }[], groupOf: (ex: string) => string): boolean =>
 focus !== "lift" || !items.some(i => groupOf(i.ex) === YOGA);
export const countsForGoal = (focus: string, group: string): boolean => focus !== "lift" || group !== YOGA;
// Takvim yükü: spor setleri sayılır, yoga setleri bu toplama girmez. Focus "lift" değilse yalnız yoga içeren
// günler, spor yükü yoksa, 1 ile işaretlenir; takvimde görünür ve planlı gün kontrolünde dolu sayılır.
export function calendarLoad(entries: { date: string; ex: string; sets: WorkSet[] }[],
 groupOf: (ex: string) => string, focus: string = "both"): Record<string, number> {
 const load: Record<string, number> = {}, yogaDays = new Set<string>();
 for (const e of entries) {
  const group = groupOf(e.ex);
  if (group === YOGA) { if (focus !== "lift" && work(e.sets).length) yogaDays.add(e.date); continue; }
  const n = group === CARDIO ? (e.sets.length ? 3 : 0) : work(e.sets).length;
  if (n) load[e.date] = (load[e.date] || 0) + n;
 }
 for (const d of yogaDays) if (!load[d]) load[d] = 1;
 return load;
}
export function activityDates(entries: { date: string; ex: string; sets: WorkSet[] }[], focus: string,
 groupOf: (ex: string) => string): string[] {
 return [...new Set(entries.filter(e => countsForGoal(focus, groupOf(e.ex)) &&
 (groupOf(e.ex) === CARDIO ? e.sets.length > 0 : work(e.sets).length > 0)).map(e => e.date))];
}
export const homeActivityDates = (entries: Parameters<typeof activityDates>[0], groupOf: (ex: string) => string): string[] =>
 activityDates(entries, "both", groupOf);
// Both sides contribute to practice time; the pair remains a single counted set.
export const practiceSeconds = (sets: WorkSet[]): number => work(sets).reduce((sum, s) =>
 sum + (s.sides?.length ? s.sides.reduce((n, side) => n + (+side.sec! || 0), 0) : (+s.sec! || 0)), 0);

export interface QuickPose { ex: string; region: string; seconds: number; unilateral: boolean }
export function buildQuickFlow(minutes: number, region: string, library: QuickPose[]) {
 const pool = library.filter(p => region === "all" || p.region === region);
 if (!pool.length || !Number.isFinite(minutes) || minutes <= 0) return [];
 const target = minutes * 60;
 const chosen: QuickPose[] = [];
 let total = 0;
 for (const pose of pool) {
  chosen.push(pose); total += pose.seconds * (pose.unilateral ? 2 : 1);
  if (total >= target) break;
 }
 // Small regional pools use longer holds rather than repeated exercise keys.
 const scale = target / total;
 return chosen.map(p => ({ ex: p.ex, sets: 1, reps: String(Math.max(5, Math.round(p.seconds * scale / 5) * 5)), rest: 0,
  sides: p.unilateral ? ["left", "right"] : [] }));
}
export function yogaWeekGoal(entries: { date: string; ex: string; sets: WorkSet[] }[],
 groupOf: (ex: string) => string, weekStart: string): { days: number; progress: number } {
 const end = new Date(weekStart + "T12:00:00"); end.setDate(end.getDate() + 7);
 const endKey = end.getFullYear() + "-" + String(end.getMonth()+1).padStart(2,"0") + "-" + String(end.getDate()).padStart(2,"0");
 const totals: Record<string, number> = {};
 for (const e of entries) if (e.date >= weekStart && e.date < endKey && groupOf(e.ex) === YOGA)
  totals[e.date] = (totals[e.date] || 0) + practiceSeconds(e.sets);
 const days = Object.values(totals).filter(n => n >= 300).length;
 return { days, progress: Math.min(1, days / 3) };
}
