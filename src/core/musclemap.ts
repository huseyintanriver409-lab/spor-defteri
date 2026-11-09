// Vücut haritası: kas başına yorgunluk ve yük kademeleri, kasa göre hareketler (araştırmaya dayalı).
import type { MuscleRecovery } from "./recovery.ts";
import { t } from "./i18n.ts";
// ad alanı "muscles" içinde dinamik anahtar (kas kimliği / kademe adıyla)
const mt = (k: string) => t("muscles." + k);
import trMuscles from "../i18n/tr/muscles.ts";
import enMuscles from "../i18n/en/muscles.ts";
import { EVIDENCE, type Level } from "./muscledata.ts";
export { EVIDENCE, SUMMARY, INFERENCE, WEIGHTS, type Level } from "./muscledata.ts";

export const MUSCLES = ["Göğüs", "Lat", "Trapez", "Bel", "Ön Omuz", "Yan Omuz", "Arka Omuz", "Biceps", "Triceps", "Önkol", "Quadriceps", "Hamstring", "Kalça", "İç Bacak", "Baldır", "Karın", "Oblik", "Rotator Manşet"];

// Görünen ad (anatomik Latince) ve yaygın ad. İç kimlik (MUSCLES, anahtarlar, kayıtlar) Türkçe kalır; yalnız ekranda bu adlar gösterilir.
// Kalça: araştırma ağırlıkla gluteus maximus'u ölçüyor (medius/minimus ayrıca not edildi), bu yüzden "Gluteus maximus".
export const MUSCLE_LABEL: Record<string, string> = {
  "Göğüs": "Pectoralis major", "Lat": "Latissimus dorsi", "Trapez": "Trapezius", "Bel": "Erector spinae", "Ön Omuz": "Deltoideus anterior", "Yan Omuz": "Deltoideus medius",
  "Arka Omuz": "Deltoideus posterior", "Biceps": "Biceps brachii", "Triceps": "Triceps brachii", "Önkol": "Musculi antebrachii", "Quadriceps": "Quadriceps femoris",
  "Hamstring": "Hamstrings", "Kalça": "Gluteus maximus", "İç Bacak": "Adductores", "Baldır": "Triceps surae", "Karın": "Rectus abdominis", "Oblik": "Obliqui abdominis", "Rotator Manşet": "Rotator cuff",
};
// sözlük anahtarı için kısa ascii ad
const MUSCLE_KEY: Record<string, string> = {"Göğüs":"gogus","Lat":"lat","Trapez":"trapez","Bel":"bel","Ön Omuz":"on_omuz","Yan Omuz":"yan_omuz","Arka Omuz":"arka_omuz","Biceps":"biceps","Triceps":"triceps","Önkol":"onkol","Quadriceps":"quadriceps","Hamstring":"hamstring","Kalça":"kalca","İç Bacak":"ic_bacak","Baldır":"baldir","Karın":"karin","Oblik":"oblik","Rotator Manşet":"rotator"};
export const MUSCLE_COMMON: Record<string, string> = Object.fromEntries(Object.entries(MUSCLE_KEY).map(([id, k]) => [id, mt("common_" + k)]));
export const muscleLabel = (id: string): string => MUSCLE_LABEL[id] ?? id;
// arama: kimlik, Latince ad ve yaygın ad birlikte
export const muscleSearchText = (id: string): string => `${id} ${MUSCLE_LABEL[id] ?? ""} ${MUSCLE_COMMON[id] ?? ""} ${trMuscles["common_" + MUSCLE_KEY[id]] ?? ""} ${enMuscles["common_" + MUSCLE_KEY[id]] ?? ""}`;

// Haftalık etkili set (set × hareketin kasa payı). Pelland ve ark. 2025 (Sports Medicine), kas büyümesi:
// 4 set en az etkili doz, 5–10 en verimli, 11–18 orta verim, 19+ düşük verim (zarar değil; ek setin getirisi azalır).
export type LoadTier = "yok" | "baslangic" | "verimli" | "orta" | "dusukverim";
export const LOAD_TIERS: [LoadTier, string, string][] = (["baslangic", "verimli", "orta", "dusukverim"] as LoadTier[]).map(id => [id, mt("load_" + id), mt("load_" + id + "_d")]);
export const MIN_EFFECTIVE_WEEK = 4;
export function loadTier(sets: number): LoadTier {
  if (!(sets > 0)) return "yok";
  return sets < MIN_EFFECTIVE_WEEK ? "baslangic" : sets <= 10 ? "verimli" : sets <= 18 ? "orta" : "dusukverim";
}

// Şu anki durum: toparlanma oranı ve son gün yapılan set sayısıyla
export type FatigueTier = "yok" | "hazir" | "toparlaniyor" | "yorgun" | "asiri";
export const FATIGUE_TIERS: [FatigueTier, string, string][] = (["hazir", "toparlaniyor", "yorgun", "asiri"] as FatigueTier[]).map(id => [id, mt("fatigue_" + id), mt("fatigue_" + id + "_d")]);
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
export const SESSION_TIERS: [SessionTier, string, string][] = (["dusuk", "koruma", "minimum", "iyi", "maksimum", "hasar"] as SessionTier[]).map(id => [id, mt("session_" + id), mt("session_" + id + "_d")]);
export const SESSION_TOO_MUCH = 11;
export function sessionTier(sets: number): SessionTier {
  if (!(sets > 0)) return "yok";
  return sets < 1 ? "dusuk" : sets < 2 ? "koruma" : sets < 3 ? "minimum" : sets < 6 ? "iyi" : sets <= SESSION_TOO_MUCH ? "maksimum" : "hasar";
}
// Hareketin kaslara payı (1 = ana hedef). Pay araştırma verisinden (muscledata.ts WEIGHTS); w yoksa (yalnız kütüphane dışı/kullanıcı hareketi) yedek: ana 1, yardımcı 0,5.
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
