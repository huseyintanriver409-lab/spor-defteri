/* ---------- Başlangıç noktası (mevcut verilerim) ----------
   Başka uygulamadan geçen ya da defter tutmadan çalışmış kullanıcı, her hareket için şu anki kilosunu ve
   tekrarını bir kez girer. Bu bir antrenman değildir: geçmişe, takvime ve haftalık istatistiklere girmez.
   Uygulama o hareketin kaydı yokken öneriyi ve rekor karşılaştırmasını bu değerle yapar; antrenman
   yapıldıkça "şimdi" değeri en son yapılanla güncellenir. state.baseline'da tutulur, ayarlarla eşitlenir.
   Tarayıcıya bağlı değildir; testleri tests/baseline.test.ts. */
import { e1rm, work, type WorkSet } from "./training.ts";

// w: kg (kardiyoda dakika), r: tekrar (kardiyoda km), sec: süreli hareketlerde saniye; date: girildiği gün
export interface Base { w: number; r: number; sec?: number; date: string }
export type Baseline = Record<string, Base>;
export interface Entry { ex: string; date: string; sets: WorkSet[] }

const n = (v: unknown, max: number) => { const x = parseFloat(String(v ?? "").replace(",", ".")); return Number.isFinite(x) && x > 0 ? Math.min(Math.round(x * 100) / 100, max) : 0; };

// Formdan gelen satırları temizler: adı boş ya da değersiz satırlar atılır; değeri değişmeyen hareketin tarihi korunur
export function buildBaseline(rows: { ex: string; w?: unknown; r?: unknown; sec?: unknown }[], old: Baseline, today: string): Baseline {
  const out: Baseline = {};
  for (const row of rows) {
    const ex = String(row.ex || "").trim();
    if (!ex) continue;
    const b: Base = { w: n(row.w, 1000), r: Math.round(n(row.r, 1000) * 100) / 100, date: today };
    const sec = n(row.sec, 36000);
    if (sec) { b.sec = sec; b.r = 0; }
    if (!b.w && !b.r && !b.sec) continue;
    const prev = old[ex];
    if (prev && prev.w === b.w && prev.r === b.r && (prev.sec || 0) === (b.sec || 0)) b.date = prev.date;
    out[ex] = b;
  }
  return out;
}

// Başlangıç verisi uygulamanın set biçiminde (öneri ve "son kez" ipucu için)
export const baseSet = (b: Base): WorkSet => b.sec ? { w: b.w, r: 0, sec: b.sec } : { w: b.w, r: b.r };

// Bir kaydın en iyi seti: süreli harekette en uzun süre, diğerlerinde en ağır (eşitse çok tekrarlı) set
function topSet(sets: WorkSet[]): WorkSet | null {
  const ws = work(sets);
  if (!ws.length) return null;
  return ws.reduce((a, s) => {
    if (s.sec != null || a.sec != null) return (+s.sec! || 0) > (+a.sec! || 0) ? s : a;
    const aw = +a.w! || 0, sw = +s.w! || 0;
    return sw > aw || (sw === aw && (+s.r! || 0) > (+a.r! || 0)) ? s : a;
  });
}

export interface ProgressRow { ex: string; start: Base; now: WorkSet | null; nowDate: string; diffKg: number; diffReps: number; diffSec: number }

// Başlangıç → şimdi: başlangıç tarihinden sonraki (o gün dahil) en son antrenmanın en iyi seti
export function progressRows(baseline: Baseline, entries: Entry[]): ProgressRow[] {
  return Object.keys(baseline).sort((a, b) => a.localeCompare(b, "tr")).map(ex => {
    const start = baseline[ex];
    const last = entries.filter(e => e.ex === ex && e.date >= start.date && work(e.sets).length)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))[0];
    const now = last ? topSet(last.sets) : null;
    return {
      ex, start, now, nowDate: last ? last.date : "",
      diffKg: now && !start.sec ? Math.round(((+now.w! || 0) - start.w) * 100) / 100 : 0,
      diffReps: now && !start.sec ? (+now.r! || 0) - start.r : 0,
      diffSec: now && start.sec ? (+now.sec! || 0) - start.sec : 0,
    };
  });
}

// Rekor karşılaştırmasında başlangıç değeri de sayılır: ilk antrenmanda başlangıcı geçmek rekor olur
export const baseBest = (b: Base | undefined) => b && !b.sec ? { w: b.w, e: b.r > 0 && b.r <= 12 ? e1rm(b.w, b.r) : 0 } : { w: 0, e: 0 };
