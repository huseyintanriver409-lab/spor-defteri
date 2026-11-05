/* ---------- Haftalık plan: hangi tarihte hangi program ----------
   İki tür plan var:
   - Sabit (mode "fixed" ya da yok): her gün kendi programını alır (days[kod].prog), her hafta aynı.
   - Sırayla (mode "rot"): antrenman günleri sıradaki programı alır. rot = program sırası (ör. A, B);
     3 gün ve 2 programla hafta hafta A-B-A, B-A-B döner. Sıra takvime göre ilerler (kaçırılan gün sırayı
     kaydırmaz), böylece takvim ve görevler önceden yazılabilir. Sayım, anchor haftasının pazartesisinden
     başlar; shift sırayı elle kaydırır.
   Sırayla planda days[kod].prog yine o günün bu haftaki programıyla doldurulur: eski sürümdeki bir cihaz
   planı sabit olarak görür ama bozmaz. */
import { mondayOf, parse, ymd } from "./dates.ts";

export interface PlanDay { prog: string; time?: string }
export interface Plan {
  days: Record<string, PlanDay>; dur: number; remind: number; until?: string;
  mode?: "fixed" | "rot"; rot?: string[]; anchor?: string; shift?: number;
}

// pazartesiden başlayan gün kodları ve JS gün numaraları
export const WEEK_CODES: [string, number][] = [["MO", 1], ["TU", 2], ["WE", 3], ["TH", 4], ["FR", 5], ["SA", 6], ["SU", 0]];
export const codeOf = (d: Date) => WEEK_CODES.find(([, js]) => js === d.getDay())![0];

export const isRot = (plan: Plan) => plan.mode === "rot" && (plan.rot || []).length > 0;
// planlı günler hafta sırasıyla
const planCodes = (plan: Plan) => WEEK_CODES.map(([c]) => c).filter(c => plan.days[c]);

// O tarihte plandaki programın kimliği (bitiş tarihine bakmaz); o gün plan yoksa null
export function progIdOn(plan: Plan, date: string): string | null {
  const d = parse(date), code = codeOf(d), e = plan.days[code];
  if (!e) return null;
  if (!isRot(plan)) return e.prog || null;
  const rot = plan.rot!, codes = planCodes(plan);
  const anchor = mondayOf(parse(plan.anchor || ymd(mondayOf(d))));
  // yaz saati geçişinde gün 23/25 saat sürebilir: yuvarlanır
  const weeks = Math.round((mondayOf(d).getTime() - anchor.getTime()) / (7 * 864e5));
  const n = weeks * codes.length + codes.indexOf(code) + (plan.shift || 0);
  return rot[((n % rot.length) + rot.length) % rot.length];
}

// bugünden başlayarak plandaki ilk antrenman günü (bugün dahil)
export function nextPlanDate(plan: Plan, today: Date): string | null {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  for (let i = 0; i < 7; i++, d.setDate(d.getDate() + 1)) if (plan.days[codeOf(d)]) return ymd(d);
  return null;
}

// Sırayı yeniden başlatır: sayım bu haftadan, ilk antrenman günü `first` programını (yoksa sıranın ilkini) alır.
// Ardından days[kod].prog bu haftanın programlarıyla doldurulur.
export function startRotation(plan: Plan, today: Date, first?: string | null) {
  plan.anchor = ymd(mondayOf(today)); plan.shift = 0;
  if (!isRot(plan)) return plan;
  const date = nextPlanDate(plan, today), want = first && plan.rot!.includes(first) ? first : plan.rot![0];
  if (date) for (let s = 0; s < plan.rot!.length; s++) { plan.shift = s; if (progIdOn(plan, date) === want) break; }
  return fillWeek(plan, today);
}

// Plan değişince (gün eklendi, sıra değişti) sıra kopmasın: değişiklikten önce sıradaki antrenman hangi programsa
// yeni planda da sıradaki o olsun.
export function keepRotation(plan: Plan, prev: Plan, today: Date) {
  const date = nextPlanDate(prev, today);
  return startRotation(plan, today, date ? progIdOn(prev, date) : null);
}

// Sırayla planda her günün "bu haftaki" programını days'e yazar (eski sürümler ve sabit plana geçiş için)
export function fillWeek(plan: Plan, today: Date) {
  if (!isRot(plan)) return plan;
  const mon = mondayOf(today);
  for (const [i, [c]] of WEEK_CODES.entries()) {
    if (!plan.days[c]) continue;
    const d = new Date(mon); d.setDate(mon.getDate() + i);
    plan.days[c] = { ...plan.days[c], prog: progIdOn(plan, ymd(d)) || plan.days[c].prog };
  }
  return plan;
}

// Program silinince plandan çıkar. Sırayla planda sıradan düşer; sıra boşalırsa bütün günler boşalır.
// Dönen değer: boşalan gün kodları.
export function dropProgram(plan: Plan, id: string, today: Date): string[] {
  if (isRot(plan) && plan.rot!.includes(id)) {
    const prev = { ...plan, days: { ...plan.days } };
    plan.rot = plan.rot!.filter(x => x !== id);
    if (plan.rot.length) { keepRotation(plan, prev, today); return []; }
    const freed = Object.keys(plan.days); plan.days = {}; plan.mode = "fixed"; return freed;
  }
  const freed = Object.keys(plan.days).filter(c => plan.days[c].prog === id);
  freed.forEach(c => delete plan.days[c]);
  return freed;
}
