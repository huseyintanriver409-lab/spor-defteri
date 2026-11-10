import { beginnerVolumeSuggestion, experienceMode, type ExperienceProfile } from './recovery.ts';

interface Item { ex: string; sets: number }
interface Program<T extends Item> { id: string; items: T[]; startDate?: string; selectedDate?: string }
export type VolumeDecisions = Record<string, 'accept' | 'reject'>;

// No inferred "today" fallback for old programs: an unknown start must remain unknown.
export function volumeStartDate(program: { id: string; startDate?: string; selectedDate?: string }, sessions: { prog?: string | null; date: string }[]): string | undefined {
  return program.startDate || [...sessions.filter(s => s.prog === program.id).map(s => s.date), ...(program.selectedDate ? [program.selectedDate] : [])].sort()[0];
}
export function beginnerVolumePlan<T extends Item>({ program, sessions = [], profile = {}, trainingDates = [], today, decisions = {} }: {
  program: Program<T>; sessions?: { prog?: string | null; date: string }[]; profile?: ExperienceProfile;
  trainingDates?: string[]; today: string; decisions?: VolumeDecisions;
}): { card: string | null; items: T[] } {
  const startDate = volumeStartDate(program, sessions);
  const unchanged = { card: null, items: program.items };
  if (!startDate) return unchanged;
  const suggestion = beginnerVolumeSuggestion({ programId: program.id, days: [{ items: program.items }],
    mode: experienceMode(profile, new Date(today + 'T12:00:00').getTime()), startDate, today, trainingDates });
  if (!suggestion) return unchanged;
  const choice = decisions[suggestion.key];
  if (choice === 'reject') return unchanged;
  if (choice === 'accept') return { card: null, items: program.items.map((it, i) => ({ ...it, sets: suggestion.days[0].items[i].sets })) };
  return { card: suggestion.key, items: program.items };
}
