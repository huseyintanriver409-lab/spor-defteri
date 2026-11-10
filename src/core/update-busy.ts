export function updateBusy(live: unknown, hold: unknown, restEnd: number, tag?: string, hidden = false): boolean {
  return !!(live || hold || restEnd || (!hidden && tag && /^(INPUT|TEXTAREA|SELECT)$/.test(tag)));
}
