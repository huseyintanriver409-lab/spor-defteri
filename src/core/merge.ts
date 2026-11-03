/* ---------- Hareket birleştirme ----------
   Aynı hareket iki adla girildiyse (ör. eski sürümde ayrı eklenen "Conventional Deadlift" ve kütüphanedeki
   "Deadlift") bütün izleri tek ada toplanır: kayıtlar, programlar, başlangıç verisi, notlar, tercihler,
   favoriler, süren antrenman ve taslak. Aynı günde iki adla kayıt varsa setler tek kayıtta birleşir.
   Eski ad özel hareketse listeden kalkar. Değişiklikleri stampChanges damgalar, eşitleme diğer cihazlara taşır.
   Tarayıcıya bağlı değildir; testleri tests/merge.test.ts. */
import type { State } from "./schema.ts";

export function mergeExercise(s: State, from: string, to: string) {
  from = String(from || "").trim(); to = String(to || "").trim();
  if (!from || !to) throw new Error("İki hareket de seçilmeli.");
  if (from === to) throw new Error("Aynı hareket seçildi.");
  let entries = 0, programs = 0;
  const keep: typeof s.entries = [];
  for (const e of s.entries) {
    if (e.ex !== from) { keep.push(e); continue; }
    entries++;
    const same = s.entries.find(x => x.ex === to && x.date === e.date);
    if (same) { same.sets = [...(same.sets || []), ...(e.sets || [])]; if (e.note) same.note = same.note ? `${same.note}\n${e.note}` : e.note; }
    else { e.ex = to; keep.push(e); }
  }
  s.entries = keep;
  for (const p of s.programs) {
    if (!p.items?.some((i: any) => i.ex === from)) continue;
    programs++;
    const seen = new Set<string>();
    // aynı programda iki ad da varsa tek satır kalır
    p.items = p.items.map((i: any) => i.ex === from ? { ...i, ex: to } : i).filter((i: any) => !seen.has(i.ex) && seen.add(i.ex));
  }
  const b = s.baseline || {};
  if (b[from]) { if (!b[to] || b[from].date > b[to].date) b[to] = b[from]; delete b[from]; }
  if (s.exNotes?.[from]) { s.exNotes[to] = s.exNotes[to] ? `${s.exNotes[to]}\n${s.exNotes[from]}` : s.exNotes[from]; delete s.exNotes[from]; }
  if (s.exPrefs?.[from]) { if (!s.exPrefs[to]) s.exPrefs[to] = s.exPrefs[from]; delete s.exPrefs[from]; }
  if (Array.isArray(s.favs) && s.favs.includes(from)) s.favs = [...new Set(s.favs.map((f: string) => f === from ? to : f))];
  for (const i of s.live?.items || []) if (i.ex === from) i.ex = to;
  if (s.draft?.ex === from) s.draft.ex = to;
  s.custom = s.custom.filter(c => c.name !== from);
  return { entries, programs };
}
