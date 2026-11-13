import { sessionLoad, type SessionItem, type Muscles } from "./musclemap.ts";
import { weeklyPlan, type ProgramDef } from "./programs.ts";
import { plannedOn } from "./calendar.ts";
import { WEEK_CODES, isRot, type Plan } from "./plan.ts";
import { mondayOf, parse, ymd } from "./dates.ts";
import { programItems } from "./program-data.ts";

type MusclesOf = (ex: string) => Muscles;
type Program = Parameters<typeof plannedOn>[1][number];
export type WeeklyTier = "yok" | "az" | "orta" | "yeterli" | "yuksek";
export const WEEKLY_TIERS = ["az", "orta", "yeterli", "yuksek"] as const;
export const WEEKLY_TIER_LIMITS = [5, 10, 20] as const;
// KAYNAK: Schoenfeld, Ogborn, Krieger 2017, J Sports Sci 35(11):1073-82 — haftalık set <5 / 5-9 / 10+ kategorileri (kategori eğilimi p=0.074, sürekli değişken anlamlı). => 5 ve 10 sınırları.
// KAYNAK: Baz-Valle ve ark. 2022, J Hum Kinet (PMC8884877) — haftalık kas başına 12-20 set olası optimum öneri (az çalışma). => 20 üst sınırı.
// KAYNAK: Pelland ve ark. 2025, Sports Med, DOI 10.1007/s40279-025-02344-w — hacim-etki eğrisi sürekli ve azalan getirili; dolaylı set 0,5 (ana 1 / yardımcı 0,5).
// YORUM: kademe adları (Az/Orta/Yeterli/Yüksek), 10-12 aralığının Yeterli ye katılması ve 20 üstünün ayrı kademe olması uygulama kararıdır; 20 üstü için zarar iddiası yok, yalnızca önerilen bandın üstü.
export const roundHalf = (x: number): number => Math.round(x * 2) / 2;
export function weeklyTier(sets: number): WeeklyTier {
  sets = roundHalf(sets);
  const [low, adequate, high] = WEEKLY_TIER_LIMITS;
  return !(sets > 0) ? "yok" : sets < low ? "az" : sets < adequate ? "orta" : sets <= high ? "yeterli" : "yuksek";
}
export function weeklyLoad(days: SessionItem[][], musclesOf: MusclesOf, weeks = 1): Record<string, number> {
  if (!Number.isFinite(weeks) || weeks <= 0) throw new RangeError("weeks must be positive");
  const load: Record<string, number> = {};
  for (const day of days) for (const [m, row] of Object.entries(sessionLoad(day, musclesOf))) load[m] = (load[m] || 0) + row.sets;
  return Object.fromEntries(Object.entries(load).map(([m, sets]) => [m, sets / weeks]));
}
const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
export function presetWeek(p: ProgramDef, days: number, musclesOf: MusclesOf) {
  const week = weeklyPlan(p, days), n = p.sessions.length, k = week.length;
  const rotating = n > 1 && !p.rotation?.[days] && k % n !== 0;
  const weeks = rotating ? n / gcd(n, k) : 1;
  const sessions: SessionItem[][] = [];
  for (let w = 0; w < weeks; w++) week.forEach(([, index], j) => {
    sessions.push(p.sessions[rotating ? (w * k + j) % n : index].items.map(([ex, sets]) => ({ ex, sets })));
  });
  return { load: weeklyLoad(sessions, musclesOf, weeks), weeks, averaged: weeks > 1 };
}
export function planWeek(plan: Plan, programs: Program[], today: Date | string, musclesOf: MusclesOf, onlyIds?: string[]) {
  const date = typeof today === "string" ? parse(today) : today;
  if (plan.until && ymd(date) > plan.until) return null;
  const k = WEEK_CODES.filter(([c]) => plan.days[c]).length;
  if (!k) return null;
  const weeks = isRot(plan) ? plan.rot!.length / gcd(plan.rot!.length, k) : 1;
  const d = mondayOf(date), sessions: SessionItem[][] = [];
  for (let i = 0; i < weeks * 7; i++, d.setDate(d.getDate() + 1)) {
    const p = plannedOn(plan, programs, ymd(d));
    if (p && (!onlyIds || onlyIds.includes(p.id))) sessions.push(programItems(p));
  }
  return sessions.length ? { load: weeklyLoad(sessions, musclesOf, weeks), weeks, averaged: weeks > 1 } : null;
}
export function programGroup(programs: { id: string; name: string }[], id: string): string[] {
  const p = programs.find(p => p.id === id);
  if (!p) return [];
  if (!p.name.includes(" · ")) return [id];
  const prefix = p.name.split(" · ")[0];
  return programs.filter(p => p.name.includes(" · ") && p.name.split(" · ")[0] === prefix).map(p => p.id);
}
export function groupWeek(programs: Program[], ids: string[], musclesOf: MusclesOf) {
  return { load: weeklyLoad(programs.filter(p => ids.includes(p.id)).map(programItems), musclesOf), weeks: 1, averaged: false };
}
