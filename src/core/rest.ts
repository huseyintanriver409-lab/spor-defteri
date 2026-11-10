import { WEIGHTS } from "./muscledata.ts";
import { repRange, type WorkSet } from "./training.ts";

export interface RestContext {
  ex: string; yoga?: boolean; targetReps?: unknown; lastSet?: WorkSet; estimated1RM?: number;
}

export function autoRestSeconds({ ex, yoga = false, targetReps, lastSet, estimated1RM = 0 }: RestContext): number {
  if (yoga) return 0;
  const target = repRange(targetReps).hi, last = Number(lastSet?.r);
  if ((target !== "" && target > 0 && target <= 5) || (last > 0 && last <= 5) ||
    (estimated1RM > 0 && Number(lastSet?.w) >= .85 * estimated1RM)) return 180;
  return Object.values(WEIGHTS[ex] || {}).filter(w => w >= .5).length >= 2 ? 120 : 75;
}

export function exerciseRestSeconds(context: RestContext, general: number, auto: boolean, pref?: number): number {
  if (context.yoga) return pref ?? 0;
  return pref ?? (auto ? autoRestSeconds(context) : general);
}

// Within a superset there is no break; at the end use the longest individual break.
export const supersetRestSeconds = (rests: number[], withinGroup: boolean): number =>
  withinGroup ? 0 : Math.max(0, ...rests);
