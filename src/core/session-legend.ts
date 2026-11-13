import { SESSION_TIERS, SESSION_TIER_LIMITS, type SessionTier } from "./musclemap.ts";

// Input is the set of colors actually painted by the body map (including region merges).
export function visibleSessionTiers(painted: Iterable<string> = []): SessionTier[] {
  const visible = new Set(painted);
  return SESSION_TIERS.map(([tier]) => tier).filter(tier => visible.has("g-" + tier));
}

export function sessionTierRange(tier: SessionTier): string {
  const index = SESSION_TIERS.findIndex(([id]) => id === tier);
  if (index < 0 || tier === "hasar") return "";
  if (index === 0) return `<${SESSION_TIER_LIMITS[0]}`;
  if (index === SESSION_TIER_LIMITS.length) return `${SESSION_TIER_LIMITS[index - 1]}+`;
  return `${SESSION_TIER_LIMITS[index - 1]}–${SESSION_TIER_LIMITS[index]}`;
}
