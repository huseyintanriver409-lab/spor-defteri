// Vücut haritası: kas başına yorgunluk ve yük kademeleri, kasa göre en iyi hareketler.
import type { MuscleRecovery } from "./recovery.ts";

export const MUSCLES = ["Göğüs", "Lat", "Trapez", "Bel", "Ön Omuz", "Yan Omuz", "Arka Omuz", "Biceps", "Triceps", "Önkol", "Quadriceps", "Hamstring", "Kalça", "İç Bacak", "Baldır", "Karın", "Oblik", "Rotator Manşet"];
type MusclesOf = (ex: string) => { p: string[]; s: string[] };

// Haftalık etkili set (ana kas 1, yardımcı ½). Pelland ve ark. 2025 (Sports Medicine), kas büyümesi:
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

// Tek antrenmanın (ya da tek hareketin) kasa verdiği uyarı, etkili setle (ana kas 1, yardımcı ½). Altı kademe,
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
// Kas başına hangi hareketten kaç set geldiği (ana kas tam, yardımcı yarım); en yüklü kas önce
export function sessionBreakdown(items: { ex: string; sets: number }[], musclesOf: MusclesOf): { muscle: string; sets: number; from: { ex: string; sets: number }[] }[] {
  const by: Record<string, { ex: string; sets: number }[]> = {};
  items.forEach(({ ex, sets }) => { const m = musclesOf(ex);
    m.p.forEach(x => (by[x] ||= []).push({ ex, sets })); m.s.forEach(x => (by[x] ||= []).push({ ex, sets: sets / 2 })); });
  return Object.entries(by).map(([muscle, from]) => ({ muscle, from, sets: from.reduce((a, f) => a + f.sets, 0) })).sort((a, b) => b.sets - a.sets);
}

// ana kas tam set, yardımcı kas yarım set
export function setsByMuscle(items: { ex: string; sets: number }[], musclesOf: MusclesOf): Record<string, number> {
  const ms: Record<string, number> = {};
  items.forEach(({ ex, sets }) => { const m = musclesOf(ex); m.p.forEach(x => ms[x] = (ms[x] || 0) + sets); m.s.forEach(x => ms[x] = (ms[x] || 0) + sets / 2); });
  return ms;
}

// Kasa göre öne çıkan hareketler (EMG ve hipertrofi çalışmalarında öne çıkanlar; yaklaşık sıralama)
export const BEST: Record<string, string[]> = {
  "Göğüs": ["Bench Press (Barbell)", "Dumbbell Bench Press", "Incline Dumbbell Press", "Dips (Göğüs)", "Cable Crossover", "Pec Deck (Butterfly)"],
  "Lat": ["Barfiks (Pull-up)", "Lat Pulldown (Geniş)", "Chest-Supported Row", "Seated Cable Row", "Dumbbell Row (Tek Kol)"],
  "Trapez": ["Barbell Shrug", "Dumbbell Shrug", "Rack Pull", "Farmer's Walk", "Barbell Row"],
  "Bel": ["Back Extension (Hiperekstansiyon)", "Deadlift", "Good Morning", "Reverse Hyperextension"],
  "Ön Omuz": ["Overhead Press (Barbell)", "Seated Dumbbell Shoulder Press", "Arnold Press", "Incline Bench Press"],
  "Yan Omuz": ["Cable Lateral Raise", "Lateral Raise (Dumbbell)", "Machine Lateral Raise", "Upright Row"],
  "Arka Omuz": ["Reverse Pec Deck", "Rear Delt Fly (Dumbbell)", "Cable Rear Delt Fly", "Face Pull"],
  "Biceps": ["Incline Dumbbell Curl", "Bayesian Cable Curl", "Barbell Curl", "Preacher Curl", "Chin-up"],
  "Triceps": ["Overhead Cable Extension", "Skull Crusher (EZ-Bar)", "Close-Grip Bench Press", "Dips (Triceps)", "Triceps Pushdown (Halat)"],
  "Önkol": ["Farmer's Walk", "Wrist Curl", "Reverse Wrist Curl", "Dead Hang", "Hammer Curl"],
  "Quadriceps": ["Back Squat", "Hack Squat", "Leg Press", "Bulgarian Split Squat", "Leg Extension", "Front Squat"],
  "Hamstring": ["Seated Leg Curl", "Romanian Deadlift", "Nordic Curl", "Lying Leg Curl", "Stiff-Leg Deadlift"],
  "Kalça": ["Hip Thrust (Barbell)", "Bulgarian Split Squat", "Romanian Deadlift", "Back Squat", "Walking Lunge"],
  "İç Bacak": ["Hip Adduction Makinesi", "Sumo Deadlift", "Lateral Lunge"],
  "Baldır": ["Standing Calf Raise", "Seated Calf Raise", "Leg Press Calf Raise", "Donkey Calf Raise"],
  "Karın": ["Cable Crunch", "Hanging Leg Raise", "Ab Wheel Rollout", "Crunch", "Plank"],
  "Oblik": ["Cable Woodchopper", "Pallof Press", "Side Plank", "Russian Twist", "Bicycle Crunch"],
  "Rotator Manşet": ["Cable External Rotation", "Dumbbell External Rotation (Yan Yatarak)", "Face Pull", "Cuban Press"],
};

// En iyiler (sırasıyla), sonra kası ana çalıştıranlar, en sonda yardımcı çalıştıranlar.
// Aynı kademede çok yapılan, sonra kasa odaklı olan (daha az ana kas) önce gelir; eşitse ada göre.
export type RankKind = "best" | "ana" | "yardimci";
export function rankForMuscle(muscle: string, names: string[], musclesOf: MusclesOf, counts: Record<string, number> = {}): { name: string; kind: RankKind }[] {
  const have = new Set(names), best = (BEST[muscle] || []).filter(n => have.has(n)), seen = new Set(best);
  const by = (a: string, b: string) => (counts[b] || 0) - (counts[a] || 0) || musclesOf(a).p.length - musclesOf(b).p.length || a.localeCompare(b, "tr");
  const ana = names.filter(n => !seen.has(n) && musclesOf(n).p.includes(muscle)).sort(by);
  const yard = names.filter(n => !seen.has(n) && !musclesOf(n).p.includes(muscle) && musclesOf(n).s.includes(muscle)).sort(by);
  return [...best.map(name => ({ name, kind: "best" as const })), ...ana.map(name => ({ name, kind: "ana" as const })), ...yard.map(name => ({ name, kind: "yardimci" as const }))];
}
