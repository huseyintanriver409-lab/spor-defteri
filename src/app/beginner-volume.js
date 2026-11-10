import { beginnerVolumePlan } from '../core/beginner-volume.ts';
import { ymd } from '../core/dates.ts';
import { state } from './store.js';
import { isSport } from './exercises.js';

export const volumePlan = program => beginnerVolumePlan({ program, sessions: state.sessions, profile: state.profile,
  trainingDates: state.entries.filter(e => isSport(e.ex) && e.sets.some(s => s.t !== 'w')).map(e => e.date),
  today: ymd(new Date()), decisions: state.prefs.beginnerVolume });
