// Kas toparlanması: her kasın son çalıştırıldığı günden bu yana geçen süreyi, gereken dinlenmeye oranlar.
// Dayanak: Sousa, Zourdos, Storey, Helms 2024 (J Hum Kinet 91:205) — alt vücut 48–72 sa, üst vücut ≤24 sa;
// yüksek hacim toparlanmayı uzatır. Morán-Navarro ve ark. 2017 (Eur J Appl Physiol) — tükenişe kadar setler,
// aynı hacimde bile toparlanmayı 24–48 sa uzatır.
import { parse } from "./dates.ts";
import { work, type WorkSet } from "./training.ts";
import { MAIN_SHARE, weightsOf, type Muscles } from "./musclemap.ts";

export const LOWER_BODY = ["Quadriceps", "Hamstring", "Kalça", "Bel", "İç Bacak", "Baldır"];
// bir günde kasa bu kadar etkili set düştüyse dinlenme uzar
export const HIGH_VOLUME_DAY = 8;
// yalnız yardımcı olarak hafifçe çalışan kas (1 etkili setin altı) yorgun sayılmaz
export const MIN_FATIGUE_SETS = 1;

export interface RecoveryInput {
  entries: { ex: string; date: string; sets: WorkSet[] }[];
  sessions: { date: string; end: number }[];
  isCardio: (ex: string) => boolean;
  // w: hareketin kaslara payı (set × pay); yoksa p ana kaslar (tam set), s yardımcılar (yarım set)
  musclesOf: (ex: string) => Muscles;
  now?: number;
}
export interface MuscleRecovery { date: string; sets: number; fail: boolean; hrs: number; need: number; pct: number }

// Gereken dinlenme: alt vücut 48 sa, üst vücut 24 sa; o gün 8+ etkili set ya da tükenişe kadar set yapıldıysa her biri +24 sa.
export function restNeed(muscle: string, sets: number, fail: boolean): number {
  return (LOWER_BODY.includes(muscle) ? 48 : 24) + (sets >= HIGH_VOLUME_DAY ? 24 : 0) + (fail ? 24 : 0);
}

export function recoveryMap({ entries, sessions, isCardio, musclesOf, now = Date.now() }: RecoveryInput): Record<string, MuscleRecovery> {
  // kas → gün → { set, tükeniş }
  const days: Record<string, Record<string, { sets: number; fail: boolean }>> = {};
  entries.filter(e => !isCardio(e.ex)).forEach(e => {
    const ws = work(e.sets), n = ws.length, fail = ws.some(s => s.t === "f"), m = musclesOf(e.ex);
    const add = (mu: string, v: number, f: boolean) => {
      const d = ((days[mu] ||= {})[e.date] ||= { sets: 0, fail: false });
      d.sets += v; d.fail ||= f;
    };
    // tükeniş yalnız ana kası (pay ≥ 0,75) yorar sayılır
    for (const [mu, w] of Object.entries(weightsOf(m))) add(mu, n * w, fail && w >= MAIN_SHARE);
  });
  const res: Record<string, MuscleRecovery> = {};
  for (const mu in days) {
    // anlamlı çalıştığı en son gün
    const date = Object.keys(days[mu]).filter(d => days[mu][d].sets >= MIN_FATIGUE_SETS).sort().pop();
    if (!date) continue;
    const { sets, fail } = days[mu][date];
    // antrenman saati bilinmiyorsa günün 18:00'i varsayılır
    const ses = sessions.filter(s => s.date === date).sort((a, b) => b.end - a.end)[0];
    const at_ = ses ? ses.end : parse(date).getTime() + 18 * 36e5;
    const need = restNeed(mu, sets, fail);
    const hrs = Math.max(0, (now - at_) / 36e5);
    res[mu] = { date, sets, fail, hrs, need, pct: Math.min(1, hrs / need) };
  }
  return res;
}
