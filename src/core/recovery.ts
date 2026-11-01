// Kas toparlanması: her kasın son çalıştırıldığı günden bu yana geçen süreyi, gereken dinlenmeye oranlar.
import { parse } from "./dates.ts";
import { work, type WorkSet } from "./training.ts";

export const BIG_MUSCLES = ["Göğüs", "Lat", "Trapez", "Bel", "Quadriceps", "Hamstring", "Kalça"];

export interface RecoveryInput {
  entries: { ex: string; date: string; sets: WorkSet[] }[];
  sessions: { date: string; end: number }[];
  isCardio: (ex: string) => boolean;
  // p: ana çalışan kaslar (tam set sayılır), s: yardımcı kaslar (yarım set sayılır)
  musclesOf: (ex: string) => { p: string[]; s: string[] };
  now?: number;
}
export interface MuscleRecovery { date: string; sets: number; hrs: number; need: number; pct: number }

// Gereken dinlenme: büyük kaslar 48 sa, küçükler 36 sa; o gün 8+ etkili set yapıldıysa +24 sa.
export function recoveryMap({ entries, sessions, isCardio, musclesOf, now = Date.now() }: RecoveryInput): Record<string, MuscleRecovery> {
  const last: Record<string, { date: string; sets: number }> = {};
  entries.filter(e => !isCardio(e.ex)).forEach(e => {
    const n = work(e.sets).length, m = musclesOf(e.ex);
    const add = (mu: string, v: number) => { const o = last[mu]; if (!o || e.date > o.date) last[mu] = { date: e.date, sets: v }; else if (e.date === o.date) o.sets += v; };
    m.p.forEach(mu => add(mu, n)); m.s.forEach(mu => add(mu, n / 2));
  });
  const res: Record<string, MuscleRecovery> = {};
  for (const mu in last) {
    const { date, sets } = last[mu];
    // antrenman saati bilinmiyorsa günün 18:00'i varsayılır
    const ses = sessions.filter(s => s.date === date).sort((a, b) => b.end - a.end)[0];
    const at_ = ses ? ses.end : parse(date).getTime() + 18 * 36e5;
    const need = (BIG_MUSCLES.includes(mu) ? 48 : 36) + (sets >= 8 ? 24 : 0);
    const hrs = Math.max(0, (now - at_) / 36e5);
    res[mu] = { date, sets, hrs, need, pct: Math.min(1, hrs / need) };
  }
  return res;
}
