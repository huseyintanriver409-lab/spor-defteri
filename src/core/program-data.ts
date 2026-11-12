export const programItems = (p: { items?: any[] }) => (p.items ?? []).map(i => ({ ...i, sets: i.sets ?? 0, reps: i.reps ?? "" }));
