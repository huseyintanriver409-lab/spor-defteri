import { CARDIO, YOGA } from "./library.ts";
import { work, type WorkSet } from "./training.ts";
export const sportGroup = (g: string): boolean => g !== YOGA && g !== CARDIO;
export const restSeconds = (yoga: boolean, general: number, pref?: number): number => yoga ? (pref ?? 0) : (pref || general);
export const autoYogaHold = (full: boolean, yoga: boolean, timed: boolean, rest: number,
 nextYoga: boolean, nextTimed: boolean, unfinished: boolean): boolean =>
 full && yoga && timed && rest === 0 && nextYoga && nextTimed && unfinished;
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
// Both sides contribute to practice time; the pair remains a single counted set.
export const practiceSeconds = (sets: WorkSet[]): number => work(sets).reduce((sum, s) =>
 sum + (s.sides?.length ? s.sides.reduce((n, side) => n + (+side.sec! || 0), 0) : (+s.sec! || 0)), 0);
