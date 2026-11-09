import type { WorkSet } from "./training.ts";

export type SideProgress = { count: number; first: WorkSet };
export type SideWorkout = { sides?: Record<string, SideProgress> };
// Pending efforts belong to the live workout, never to counted entry sets.
export function pendingSide(live: SideWorkout, ex: string, count: number): SideProgress | undefined {
  const pending = live.sides?.[ex];
  if (pending && pending.count === count) return pending;
  if (pending) delete live.sides![ex];
}
export function completeSide(live: SideWorkout, ex: string, count: number, set: WorkSet): WorkSet | null {
  const pending = pendingSide(live, ex, count);
  if (!pending) {
    (live.sides ||= {})[ex] = { count, first: { ...set } };
    return null;
  }
  delete live.sides![ex];
  // Keep one conventional record per pair. First-side values remain the
  // representative load/reps for legacy volume, PR and overload calculations.
  return { ...pending.first, sides: [{ ...pending.first }, { ...set }] };
}
