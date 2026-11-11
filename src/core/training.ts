// Antrenman hesapları: hacim, 1RM tahmini, ısınma setleri, plaka dağılımı, güç seviyesi ve kademeli yüklenme.
// Global duruma bağlı değildir; ihtiyaç duyduğu ayarları parametre olarak alır.

// Set: w = kilo (kardiyoda dakika), r = tekrar (kardiyoda km), t = tür ("w" ısınma, "d" drop, "f" tükeniş),
// rir = yedekte kalan tekrar, sec = süreli hareketlerde süre. Değerler formdan metin olarak da gelebilir.
// sid is an optional live-session marker; legacy clients ignore it.
export interface WorkSet { sid?: string; sides?: WorkSet[]; w?: number | string; r?: number | string; t?: string; rir?: number | string | null; sec?: number | string }

export const work = <T extends WorkSet>(sets: T[]): T[] => sets.filter(s => s.t !== "w");
export const volume = (sets: WorkSet[]): number => work(sets).reduce((a, s) => a + (+s.w! || 0) * (+s.r! || 0), 0);
// Epley formülü; tek tekrarda kaldırılan kilo kendisidir
export const e1rm = (w: number, r: number): number => r <= 0 ? 0 : r === 1 ? w : w * (1 + r / 30);

// Çalışma kilosuna göre ısınma setleri (2,5 kg'a yuvarlı). bar > 0 ise barbell: önce boş bar.
export function warmupSets(w: number, bar: number): { w: number; r: number }[] {
  const r25 = (x: number) => Math.round(x / 2.5) * 2.5, out: { w: number; r: number }[] = [];
  const steps = bar > 0 ? [[.4, 5], [.6, 3], [.8, 2]] : [[.5, 8], [.75, 4]];
  if (bar > 0 && w > bar * 1.25) out.push({ w: bar, r: 10 });
  steps.forEach(([p, r]) => { const x = r25(w * p); if (x > bar && x < w && !out.some(o => o.w === x)) out.push({ w: x, r }); });
  return out;
}

// Bir tarafa takılacak plakalar (büyükten küçüğe) ve karşılanamayan kalan.
// available: salonda bulunan plaka ağırlıkları (ayarlardan).
export const PLATE_WEIGHTS = [25, 20, 15, 10, 5, 2.5, 1.25];
export function platesFor(side: number, available: number[]): { used: number[]; rest: number } {
  const used: number[] = [];
  PLATE_WEIGHTS.filter(w => available.includes(w)).forEach(w => { while (side >= w - 1e-9) { used.push(w); side -= w; } });
  return { used, rest: side };
}

// 1RM / vücut ağırlığı oranını 0–100 puana ve seviyeye çevirir. t: Başlangıç…Elit eşikleri (5 değer).
export function liftScore(ratio: number, t: number[]): { s: number; lv: number } {
  if (ratio < t[0]) return { s: 20 * ratio / t[0], lv: 0 };
  for (let i = 0; i < 4; i++) if (ratio < t[i + 1]) return { s: 20 * (i + 1) + 20 * (ratio - t[i]) / (t[i + 1] - t[i]), lv: i + 1 };
  return { s: 100, lv: 5 };
}

// Programdaki tekrar hedefini ("8-12", "10", "5x5"…) alt ve üst sınıra çevirir. Sayı yoksa "" döner.
export function repRange(reps: unknown): { lo: number | ""; hi: number | "" } {
  const nums = (String(reps || "").match(/\d+(\.\d+)?/g) || []).map(Number);
  const lo = nums[0] || "", hi = nums[nums.length - 1] || lo;
  return { lo, hi };
}

// Kademeli yüklenme kararı: önceki seansın ilk `sets` çalışma setine bakar.
// - hitTop: hepsinde üst tekrar sınırına ulaşıldı → kilo artır
// - easy: alt sınır tutturuldu ve hepsi RIR 3+ (rahat) → kilo artır
// - hard: RIR 0 olup alt sınırın altında kalan set var → aynı kiloda kal
export function overloadDecision(prevWork: WorkSet[], sets: number, range: { lo: number | ""; hi: number | "" }, cardio: boolean) {
  const { lo, hi } = range, first = prevWork.slice(0, sets);
  const full = !cardio && !!hi && prevWork.length >= sets && first.every(s => (+s.w! || 0) > 0);
  const hitTop = full && first.every(s => (+s.r! || 0) >= +hi);
  const easy = full && !hitTop && first.every(s => (+s.r! || 0) >= +lo && s.rir != null && +s.rir >= 3);
  const hard = full && first.some(s => s.rir === 0 && (+s.r! || 0) < +lo);
  return { full, hitTop, easy, hard, increase: hitTop || easy };
}

// Shared default classification; callers supply custom exercise groups and preferences.
export const TIMED_RE = /plank|wall sit|dead hang|l-sit|hollow body|battle rope|farmer|copenhagen|suitcase|bear crawl|lateral walk/i;
export const timedExercise = (name: string, cardio: boolean, yoga: boolean, preference?: boolean): boolean =>
  preference != null ? preference : !cardio && (yoga || TIMED_RE.test(name));
