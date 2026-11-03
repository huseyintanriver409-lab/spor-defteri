/* ---------- Seri (Duolingo tarzı, plana göre) ----------
   Seri gün sayar: ilk antrenmandan bugüne kesintisiz zincirin uzunluğu (dinlenme günleri de sayılır).
   - Haftalık planı olan: planlı bir günü antrenmansız geçirmek seriyi bozar; plan dışı günler bozmaz,
     plan dışı günde yapılan antrenman da seriyi sürdürür.
   - Planı olmayan: haftalık hedefin tutturulmadığı her hafta (pazartesi-pazar) seriyi bozar; zincirin başladığı hafta sayılmaz.
   - Dondurma: takvim ayı başına FREEZES_PER_MONTH kez, kaçırılan gün/hafta seriyi bozmaz (kendiliğinden kullanılır).
   - Bugün henüz yapılmadıysa seri bozulmaz; seri dünkü haliyle görünür, bugün planlı günse "risk" işaretlenir.
   Hepsi kayıtlardan hesaplanır, saklanmaz: bütün cihazlarda aynı sonucu verir. Eski günler için de bugünkü
   plan geçerli sayılır. Tarayıcıya bağlı değildir; testleri tests/streak.test.ts. */
import { mondayOf, parse, ymd } from "./dates.ts";

export const FREEZES_PER_MONTH = 2;
export const BADGES = [7, 14, 30, 60, 100, 180, 365];
const CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"]; // Date.getDay() sırası

export interface StreakResult {
  days: number;          // şu anki seri (gün)
  best: number;          // en uzun seri
  start: string;         // şu anki zincirin başladığı gün ("" = seri yok)
  doneToday: boolean;
  atRisk: boolean;       // bugün planlı gün (ya da haftanın hedefi için bugün gerekli) ve henüz yapılmadı
  frozen: string[];      // dondurmayla kurtarılan günler (haftalık modda haftanın pazartesisi)
  freezesLeft: number;   // bu ay kalan dondurma
  mode: "plan" | "week";
}

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const between = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 864e5);

// workoutDates: antrenman yapılan günler ("YYYY-MM-DD"); planDays: haftalık plandaki gün kodları (MO…SU)
export function computeStreak(workoutDates: Iterable<string>, planDays: string[], goal: number, now: Date): StreakResult {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const done = new Set(workoutDates), todayS = ymd(today), mode = planDays.length ? "plan" : "week";
  const planned = new Set(planDays);
  const first = [...done].filter(d => d <= todayS).sort()[0];
  const used: Record<string, number> = {}, frozen: string[] = [];
  let start = "", best = 0;
  const month = (d: string) => d.slice(0, 7);
  // kaçırma: dondurma varsa kullan, yoksa zincir kırılır (son gün = kırılmadan önceki gün)
  const miss = (d: string, lastDay: string) => {
    if (!start) return;
    if ((used[month(d)] || 0) < FREEZES_PER_MONTH) { used[month(d)] = (used[month(d)] || 0) + 1; frozen.push(d); return; }
    best = Math.max(best, between(start, lastDay) + 1);
    start = "";
  };
  if (first) {
    for (let d = parse(first); ymd(d) < todayS; d = addDays(d, 1)) {
      const k = ymd(d);
      if (done.has(k)) { if (!start) start = k; }
      else if (mode === "plan" && planned.has(CODES[d.getDay()])) miss(k, ymd(addDays(d, -1)));
      // haftalık modda hafta pazar günü kapanır (bu hafta henüz bitmedi)
      if (mode === "week" && d.getDay() === 0 && start) {
        const mon = addDays(d, -6), monS = ymd(mon);
        if (start <= monS) {
          let n = 0; for (let i = 0; i < 7; i++) if (done.has(ymd(addDays(mon, i)))) n++;
          if (n < goal) miss(monS, ymd(addDays(mon, -1)));
        }
      }
    }
  }
  const doneToday = done.has(todayS);
  if (doneToday && !start) start = todayS;
  const end = doneToday ? todayS : ymd(addDays(today, -1));
  const days = start && start <= end ? between(start, end) + 1 : 0;
  best = Math.max(best, days);
  let atRisk = false;
  if (!doneToday) {
    if (mode === "plan") atRisk = planned.has(CODES[today.getDay()]);
    else {
      // bu haftanın hedefine yetişmek için kalan günlerin hepsi gerekiyorsa bugün de gerekli
      const mon = mondayOf(today);
      let n = 0; for (let i = 0; i < 7; i++) if (done.has(ymd(addDays(mon, i)))) n++;
      atRisk = n < goal && goal - n >= 7 - Math.round((today.getTime() - mon.getTime()) / 864e5);
    }
  }
  return { days, best, start: days ? start : "", doneToday, atRisk, frozen, freezesLeft: Math.max(0, FREEZES_PER_MONTH - (used[month(todayS)] || 0)), mode };
}

// Kazanılan rozetler (en uzun seriye göre) ve sıradaki eşik
export const earnedBadges = (best: number) => BADGES.filter(b => best >= b);
export const nextBadge = (days: number) => BADGES.find(b => b > days) || null;
