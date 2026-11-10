// Kas toparlanması: her kasın son çalıştırıldığı günden bu yana geçen süreyi, gereken dinlenmeye oranlar.
// Dayanak: Sousa, Zourdos, Storey, Helms 2024 (J Hum Kinet 91:205) — alt vücut 48–72 sa, üst vücut ≤24 sa;
// yüksek hacim toparlanmayı uzatır. Morán-Navarro ve ark. 2017 (Eur J Appl Physiol) — tükenişe kadar setler,
// aynı hacimde bile toparlanmayı 24–48 sa uzatır.
import { parse, ymd } from "./dates.ts";
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
  // w: hareketin kaslara payı (set × pay); pay araştırma verisinden (muscledata.ts WEIGHTS); yoksa (yalnız kütüphane dışı hareket) yedek: p ana 1, s yardımcı 0,5
  musclesOf: (ex: string) => Muscles;
  now?: number;
  profile?: ExperienceProfile;
}
export interface ExperienceProfile { exp?: "auto" | "new" | "back" | "active"; expAt?: number }
export interface MuscleRecovery { date: string; sets: number; fail: boolean; hrs: number; need: number; pct: number; multiplier?: number }
export const sorenessPossible = (r?: MuscleRecovery): boolean => !!r && (r.multiplier || 1) > 1 && r.pct < 1;

// Calendar days avoid daylight-saving shifts at the 21/30/183-day boundaries.
const dayNumber = (date: string) => { const d = parse(date); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5; };
// Profil modu penceresi [expAt, expAt + 21 gün): seans anı (at) YA DA gerçek şimdi (realNow) pencere içindeyse geçerli.
export function experienceMode(profile: ExperienceProfile = {}, at = Date.now(), realNow = at): NonNullable<ExperienceProfile["exp"]> {
  if (profile.exp === "active") return "active";
  if ((profile.exp === "new" || profile.exp === "back") && Number.isFinite(profile.expAt)) {
    const inWindow = (t: number) => t >= profile.expAt! && t - profile.expAt! < 21 * 864e5;
    if (inWindow(at) || inWindow(realNow)) return profile.exp;
  }
  return "auto";
}

// Pure per-muscle history rule; dates are meaningful training days, not warmups/cardio.
// now: seans anı (oto hesap buna göre); realNow: gerçek şimdi (verilmezse now) — yalnız profil penceresi için.
export function experienceMultiplier(dates: string[], profile: ExperienceProfile = {}, now = Date.now(), realNow = now): number {
  const mode = experienceMode(profile, now, realNow);
  if (mode === "active") return 1;
  const d = new Date(now), today = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5;
  const days = [...new Set(dates.map(dayNumber))].filter(n => Number.isFinite(n) && n <= today).sort((a, b) => a - b);
  let start = days[0], returned: number | undefined;
  for (let i = 1; i < days.length; i++) {
    const gap = days[i] - days[i - 1];
    if (gap >= 183) { start = days[i]; returned = undefined; }
    else if (gap >= 30) returned = days[i];
  }
  const auto = start === undefined || today - start < 21 ? 2 : returned !== undefined && today - returned < 21 ? 1.5 : 1;
  return Math.max(auto, mode === "new" ? 2 : mode === "back" ? 1.5 : 1);
}

export const BEGINNER_VOLUME_MIN_SETS = 5;
export const BEGINNER_VOLUME_DAYS = 14;
export interface BeginnerVolumeInput {
  programId: string;
  days: { items: { ex: string; sets: number }[] }[];
  mode: NonNullable<ExperienceProfile["exp"]>;
  startDate: string;
  today: string;
  // Meaningful training dates, as in experienceMultiplier; used only in auto mode.
  trainingDates?: string[];
}
export interface BeginnerVolumeSuggestion {
  key: string;
  days: { items: { ex: string; sets: number }[] }[];
}
// A suggestion only: does not mutate the program or persist accept/reject decisions.
export function beginnerVolumeSuggestion({ programId, days, mode, startDate, today, trainingDates = [] }: BeginnerVolumeInput): BeginnerVolumeSuggestion | null {
  const validDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    Number.isFinite(dayNumber(s)) && ymd(parse(s)) === s;
  if (!validDate(startDate) || !validDate(today)) return null;
  const elapsed = dayNumber(today) - dayNumber(startDate);
  const beginner = mode === "new" || (mode === "auto" && experienceMultiplier(trainingDates, {}, parse(today).getTime()) === 2);
  if (!beginner || elapsed < 0 || elapsed >= BEGINNER_VOLUME_DAYS ||
      !days.some(d => d.items.some(i => Number.isFinite(i.sets) && i.sets >= BEGINNER_VOLUME_MIN_SETS))) return null;
  return {
    key: JSON.stringify([programId, startDate]),
    days: days.map(d => ({ items: d.items.map(i => ({ ex: i.ex,
      sets: Number.isFinite(i.sets) && i.sets > 0 ? Math.min(i.sets, Math.max(2, Math.ceil(i.sets * .6))) : i.sets,
    })) })),
  };
}

// Gereken dinlenme: alt vücut 48 sa, üst vücut 24 sa; o gün 8+ etkili set ya da tükenişe kadar set yapıldıysa her biri +24 sa.
export function restNeed(muscle: string, sets: number, fail: boolean): number {
  return (LOWER_BODY.includes(muscle) ? 48 : 24) + (sets >= HIGH_VOLUME_DAY ? 24 : 0) + (fail ? 24 : 0);
}

export function recoveryMap({ entries, sessions, isCardio, musclesOf, profile, now = Date.now() }: RecoveryInput): Record<string, MuscleRecovery> {
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
    const dates = Object.keys(days[mu]).filter(d => days[mu][d].sets >= MIN_FATIGUE_SETS && parse(d).getTime() <= now).sort();
    const date = dates.at(-1);
    if (!date) continue;
    const { sets, fail } = days[mu][date];
    // antrenman saati bilinmiyorsa günün 18:00'i varsayılır
    const ses = sessions.filter(s => s.date === date).sort((a, b) => b.end - a.end)[0];
    const at_ = ses ? ses.end : parse(date).getTime() + 18 * 36e5;
    // çarpan bugüne göre değil, kasın son çalışıldığı seansın tarihine göre belirlenir (geriye dönük kısalmaz)
    const multiplier = experienceMultiplier(dates, profile, Math.min(now, at_), now);
    const need = restNeed(mu, sets, fail) * multiplier;
    const hrs = Math.max(0, (now - at_) / 36e5);
    res[mu] = { date, sets, fail, hrs, need, multiplier, pct: Math.min(1, hrs / need) };
  }
  return res;
}
