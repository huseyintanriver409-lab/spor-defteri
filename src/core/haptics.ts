// Transition feedback is distinct from set completion and countdown ticks.
export const YOGA_HAPTICS = { pose: [40, 60, 40], side: [20, 40, 20, 40, 20] } as const;
export function yogaTransitionHaptic(yoga: boolean, side: boolean, poseChanged: boolean): number[] | null {
  return yoga && (side || poseChanged) ? [...YOGA_HAPTICS[side ? "side" : "pose"]] : null;
}
