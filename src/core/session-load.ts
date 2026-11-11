import { work, type WorkSet } from "./training.ts";

type Entry = { id: string; ex: string; date: string; sets: WorkSet[] };
type Workout = { date: string; sessionId?: string; entryBase?: Record<string, number>; quickBase?: Record<string, number> };

// Set indices include warmups: filtering happens after the session boundary.
export const entryBaseline = (entries: Entry[]): Record<string, number> =>
  Object.fromEntries(entries.map(e => [e.id, e.sets.length]));

export function sessionEntries(entries: Entry[], workout: Workout): { ex: string; sets: number }[] {
  return entries.filter(e => e.date === workout.date).map(e => ({
    ex: e.ex,
    sets: workout.sessionId
      ? work(e.sets.filter(s => s.sid === workout.sessionId)).length
      : workout.entryBase
      ? work(e.sets.slice(workout.entryBase[e.id] ?? 0)).length
      // Already-running older clients have no boundary; retain their daily convention.
      : Math.max(0, work(e.sets).length - (workout.quickBase?.[e.ex] ?? 0)),
  })).filter(e => e.sets > 0);
}

export const targetSets = (it: { sets?: number }): number => Number.isFinite(it.sets) && it.sets! >= 0 ? it.sets! : 3;

export function plannedSessionItems(planned: { ex: string; sets?: number }[], recorded: { ex: string; sets: number }[]): { ex: string; sets: number }[] {
  const totals = new Map<string, number>(), actual = new Map<string, number>();
  planned.forEach(i => totals.set(i.ex, (totals.get(i.ex) ?? 0) + targetSets(i)));
  recorded.forEach(i => actual.set(i.ex, (actual.get(i.ex) ?? 0) + i.sets));
  actual.forEach((sets, ex) => totals.set(ex, Math.max(totals.get(ex) ?? 0, sets)));
  return [...totals].map(([ex, sets]) => ({ ex, sets }));
}
