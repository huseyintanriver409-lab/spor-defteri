// Vücut haritası: kas başına yorgunluk ve yük kademeleri, kasa göre hareketler (araştırmaya dayalı).
import type { MuscleRecovery } from "./recovery.ts";
import { t } from "./i18n.ts";
// ad alanı "muscles" içinde dinamik anahtar (kas kimliği / kademe adıyla)
const mt = (k: string) => t("muscles." + k);
import trMuscles from "../i18n/tr/muscles.ts";
import enMuscles from "../i18n/en/muscles.ts";
import { EVIDENCE, STRETCH, type Level } from "./muscledata.ts";
export { EVIDENCE, SUMMARY, INFERENCE, WEIGHTS, STRETCH, type Level } from "./muscledata.ts";

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
  if ((r.multiplier || 1) > 1) return "toparlaniyor";
  if (r.pct >= .5) return "toparlaniyor";
  return r.sets >= HEAVY_DAY ? "asiri" : "yorgun";
}

// KAYNAK: Remmert, Pelland, Robinson, Hinson, Zourdos 2025, "Is There Too Much of a Good Thing?"
// SportRxiv ÖN BASKI (hakemli değil), DOI 10.51224/SRXIV.537: tek seansta kas başına yaklaşık
// 11 kesirli setten sonra ek hipertrofi getirisi ayırt edilemiyor (PUOS); yüksek hacim verisi az.
// Kesirli sayım (dolaylı set 0,5): Pelland ve ark., Sports Medicine (haftalık hacim meta-regresyonu).
// Nosaka & Sakamoto 2001, Med Sci Sports Exerc 33(1):22-29: aynı işte kas uzun boydayken yapılan
// eksantrik çalışma daha fazla hasar belirtisi verir. Bartolomei ve ark. 2017, Eur J Appl Physiol
// 117:1287-1298: yüksek hacimli seans (8×10), yüksek şiddetliye (8×3) göre daha büyük ve uzun
// süren performans kaybı. McHugh 2003, Scand J Med Sci Sports 13:88-97: alışkın olunan egzersizde
// hasar belirgin azalır (tekrarlı seans etkisi). Damas ve ark. 2016, J Physiol 594:5209-5222:
// hasar büyümenin koşulu değil.
// YORUM (kaynağı yok, uygulama kalibrasyonu): 1/3/5/8 kesim noktaları; "8+ = maksimum"
// (PUOS ~11'e yaklaşan bölge); risk eşiği 12,5 ve uzamış pozisyon çarpanı 1,5. Bu iki sayı örnek
// programlarla kalibre edildi: "5 set Deadlift + 7 set Romanian Deadlift" hamstring'de mor (R=13),
// hazır programların hiçbiri mor değil (en yüksek R≈11,9). Mor ölçülmüş hasar değil,
// "bu kasa tek seansta olağandışı çok yük bindi" uyarısıdır. Tükeniş ve deneyim çarpanı bilerek
// eklenmedi (recovery.ts zaten ele alıyor).
export type SessionTier = "yok" | "dusuk" | "koruma" | "minimum" | "iyi" | "maksimum" | "hasar";
export const SESSION_TIERS: [SessionTier, string, string][] = (["dusuk", "koruma", "minimum", "iyi", "maksimum", "hasar"] as SessionTier[]).map(id => [id, mt("session_" + id), mt("session_" + id + "_d")]);
export const SESSION_TIER_LIMITS = [1, 3, 5, 8] as const;
export const STRETCH_FACTOR = 1.5;
export const SESSION_RISK_LIMIT = 12.5;
export const SESSION_TOO_MUCH = SESSION_RISK_LIMIT;
const SESSION_EPSILON = 1e-9;
export function sessionTier(sets: number, risk = sets): SessionTier {
  if (!(sets > 0)) return "yok";
  if (risk > SESSION_RISK_LIMIT + SESSION_EPSILON) return "hasar";
  const [maintenance, minimum, high, maximum] = SESSION_TIER_LIMITS;
  return sets < maintenance - SESSION_EPSILON ? "dusuk" : sets < minimum - SESSION_EPSILON ? "koruma"
    : sets < high - SESSION_EPSILON ? "minimum" : sets < maximum - SESSION_EPSILON ? "iyi" : "maksimum";
}
export type Muscles = { p: string[]; s: string[]; w?: Record<string, number> };
type MusclesOf = (ex: string) => Muscles;
// Açık boş pay nesnesi de bilinçli atamadır; yedek ana/yardımcı paylara düşmez.
export function weightsOf(m: Muscles): Record<string, number> {
  if (m.w) return m.w;
  const w: Record<string, number> = {}; m.s.forEach(x => w[x] = .5); m.p.forEach(x => w[x] = 1); return w;
}
export type SessionItem = { ex: string; sets: number };
export type SessionContribution = { ex: string; sets: number; share: number; stretch: boolean };
export type SessionLoad = { sets: number; risk: number; baseTier: SessionTier; tier: SessionTier; from: SessionContribution[] };
// Yinelenen hareketler birleştirilir; set sayısı 0 ise katkı yoktur, varsayılan set eklenmez.
export function sessionLoad(items: SessionItem[], musclesOf: MusclesOf): Record<string, SessionLoad> {
  const counts = new Map<string, number>();
  for (const { ex, sets } of items) if (Number.isFinite(sets) && sets > 0) counts.set(ex, (counts.get(ex) || 0) + sets);
  const by: Record<string, SessionLoad> = {};
  for (const [ex, sets] of counts) {
    for (const [muscle, share] of Object.entries(weightsOf(musclesOf(ex)))) {
      if (!Number.isFinite(share) || !(share > 0)) continue;
      const stretch = STRETCH[ex]?.includes(muscle) || false;
      const effective = sets * share;
      const row = by[muscle] ||= { sets: 0, risk: 0, baseTier: "yok", tier: "yok", from: [] };
      row.sets += effective; row.risk += effective * (stretch ? STRETCH_FACTOR : 1);
      row.from.push({ ex, sets: effective, share, stretch });
    }
  }
  for (const row of Object.values(by)) { row.baseTier = sessionTier(row.sets, 0); row.tier = sessionTier(row.sets, row.risk); }
  return by;
}
export function sessionBreakdown(items: SessionItem[], musclesOf: MusclesOf): ({ muscle: string } & SessionLoad)[] {
  return Object.entries(sessionLoad(items, musclesOf)).map(([muscle, row]) => ({ muscle, ...row })).sort((a, b) => b.sets - a.sets);
}
export function setsByMuscle(items: SessionItem[], musclesOf: MusclesOf): Record<string, number> {
  return Object.fromEntries(Object.entries(sessionLoad(items, musclesOf)).map(([muscle, row]) => [muscle, row.sets]));
}



// Önce kanıt grupları, sonra ana (pay ≥ 0,75), sonra yardımcı; aynı grupta kullanım sayısı.
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
