// Vücut haritası: kas başına yorgunluk ve yük kademeleri, kasa göre hareketler (araştırmaya dayalı).
import type { MuscleRecovery } from "./recovery.ts";
import { EVIDENCE, type Level } from "./muscledata.ts";
export { EVIDENCE, SUMMARY, INFERENCE, WEIGHTS, type Level } from "./muscledata.ts";

export const MUSCLES = ["Göğüs", "Lat", "Trapez", "Bel", "Ön Omuz", "Yan Omuz", "Arka Omuz", "Biceps", "Triceps", "Önkol", "Quadriceps", "Hamstring", "Kalça", "İç Bacak", "Baldır", "Karın", "Oblik", "Rotator Manşet"];

// Haftalık etkili set (set × hareketin kasa payı). Pelland ve ark. 2025 (Sports Medicine), kas büyümesi:
// 4 set en az etkili doz, 5–10 en verimli, 11–18 orta verim, 19+ düşük verim (zarar değil; ek setin getirisi azalır).
export type LoadTier = "yok" | "baslangic" | "verimli" | "orta" | "dusukverim";
export const LOAD_TIERS: [LoadTier, string, string][] = [
  ["baslangic", "Başlangıç", "1–3 set: gelişim için az"], ["verimli", "En verimli", "4–10 set"], ["orta", "Orta verim", "11–18 set: daha fazla gelişim, set başına daha az"], ["dusukverim", "Düşük verim", "19+ set: ek setin getirisi az"],
];
export const MIN_EFFECTIVE_WEEK = 4;
export function loadTier(sets: number): LoadTier {
  if (!(sets > 0)) return "yok";
  return sets < MIN_EFFECTIVE_WEEK ? "baslangic" : sets <= 10 ? "verimli" : sets <= 18 ? "orta" : "dusukverim";
}

// Şu anki durum: toparlanma oranı ve son gün yapılan set sayısıyla
export type FatigueTier = "yok" | "hazir" | "toparlaniyor" | "yorgun" | "asiri";
export const FATIGUE_TIERS: [FatigueTier, string, string][] = [
  ["hazir", "Hazır", "dinlenmiş"], ["toparlaniyor", "Toparlanıyor", "hafif çalışılabilir"], ["yorgun", "Yorgun", "dinlendir"], ["asiri", "Aşırı yorgun", "kas hasarı riski"],
];
export const HEAVY_DAY = 12;
export function fatigueTier(r?: MuscleRecovery): FatigueTier {
  if (!r) return "yok";
  if (r.pct >= 1) return "hazir";
  if (r.pct >= .5) return "toparlaniyor";
  return r.sets >= HEAVY_DAY ? "asiri" : "yorgun";
}

// Tek antrenmanın (ya da tek hareketin) kasa verdiği uyarı, etkili setle (set × pay). Altı kademe,
// her yerde aynı renk: mavi çok az, yeşil koruma, turuncu minimum gelişim, kırmızı iyi gelişim, bordo maksimum,
// mor kas hasarı. Haftada 2-3 kez çalışılan kasa 3 set zaten güçlü bir uyarıdır. Remmert ve ark. 2025 (SportRxiv
// ön baskı): tek antrenmanda ~11 setten sonra ek büyüme ölçülemiyor, yorgunluk ve hasar artmaya devam ediyor.
// Yorum (araştırmada ayrı eşik yok): 3–11 arası verimli aralık ikiye bölündü; 6+ set "maksimum", 11'i aşınca "kas hasarı".
export type SessionTier = "yok" | "dusuk" | "koruma" | "minimum" | "iyi" | "maksimum" | "hasar";
export const SESSION_TIERS: [SessionTier, string, string][] = [
  ["dusuk", "Çok az", "1 setten az"], ["koruma", "Koruma düzeyi", "1–2 set"], ["minimum", "Minimum gelişim", "2–3 set"],
  ["iyi", "İyi gelişim", "3–6 set"], ["maksimum", "Maksimum gelişim", "6–11 set"], ["hasar", "Kas hasarı", "11+ set: ek gelişim yok"],
];
export const SESSION_TOO_MUCH = 11;
export function sessionTier(sets: number): SessionTier {
  if (!(sets > 0)) return "yok";
  return sets < 1 ? "dusuk" : sets < 2 ? "koruma" : sets < 3 ? "minimum" : sets < 6 ? "iyi" : sets <= SESSION_TOO_MUCH ? "maksimum" : "hasar";
}
// Hareketin kaslara payı (1 = ana hedef). w yoksa eski kural: ana kas 1, yardımcı ½.
export type Muscles = { p: string[]; s: string[]; w?: Record<string, number> };
type MusclesOf = (ex: string) => Muscles;
export function weightsOf(m: Muscles): Record<string, number> {
  if (m.w) return m.w;
  const w: Record<string, number> = {}; m.s.forEach(x => w[x] = .5); m.p.forEach(x => w[x] = 1); return w;
}
// Kas başına hangi hareketten kaç etkili set geldiği (set × pay); en yüklü kas önce
export function sessionBreakdown(items: { ex: string; sets: number }[], musclesOf: MusclesOf): { muscle: string; sets: number; from: { ex: string; sets: number }[] }[] {
  const by: Record<string, { ex: string; sets: number }[]> = {};
  items.forEach(({ ex, sets }) => { for (const [x, w] of Object.entries(weightsOf(musclesOf(ex)))) (by[x] ||= []).push({ ex, sets: sets * w }); });
  return Object.entries(by).map(([muscle, from]) => ({ muscle, from, sets: from.reduce((a, f) => a + f.sets, 0) })).sort((a, b) => b.sets - a.sets);
}

// kas başına etkili set: set × hareketin o kasa payı
export function setsByMuscle(items: { ex: string; sets: number }[], musclesOf: MusclesOf): Record<string, number> {
  const ms: Record<string, number> = {};
  items.forEach(({ ex, sets }) => { for (const [x, w] of Object.entries(weightsOf(musclesOf(ex)))) ms[x] = (ms[x] || 0) + sets * w; });
  return ms;
}

// Kasa göre hareketler, araştırmaya göre (src/core/muscledata.ts, arastirma/ klasörü). Tek "en iyi" yok:
// önce kanıt grupları (aynı gruptakiler eşit), sonra kası ana olarak (pay ≥ 0,75), sonra yardımcı çalıştıranlar.
// Aynı kademede çok yapılan önce; yardımcılarda payı büyük olan önce; eşitse ada göre.
export const MAIN_SHARE = .75;
export type RankKind = "kanit" | "ana" | "yardimci";
export type Ranked = { name: string; kind: RankKind; w: number; level?: Level; group?: number };
export function rankForMuscle(muscle: string, names: string[], musclesOf: MusclesOf, counts: Record<string, number> = {}): Ranked[] {
  const have = new Set(names), seen = new Set<string>(), out: Ranked[] = [];
  const wOf = (n: string) => weightsOf(musclesOf(n))[muscle] || 0;
  const byCount = (a: string, b: string) => (counts[b] || 0) - (counts[a] || 0) || a.localeCompare(b, "tr");
  (EVIDENCE[muscle] || []).forEach((g, i) => g.ex.filter(n => have.has(n) && !seen.has(n) && wOf(n) > 0).sort(byCount)
    .forEach(name => { seen.add(name); out.push({ name, kind: "kanit", w: wOf(name), level: g.level, group: i }); }));
  const rest = names.filter(n => !seen.has(n) && wOf(n) > 0);
  rest.filter(n => wOf(n) >= MAIN_SHARE).sort(byCount).forEach(name => out.push({ name, kind: "ana", w: wOf(name) }));
  rest.filter(n => wOf(n) < MAIN_SHARE).sort((a, b) => wOf(b) - wOf(a) || byCount(a, b)).forEach(name => out.push({ name, kind: "yardimci", w: wOf(name) }));
  return out;
}
