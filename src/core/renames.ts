/* ---------- Hareket adı geçişi (Türkçe karışık adlar → standart İngilizce) ----------
   Kütüphanedeki hareket adları standart İngilizce adlara çevrildi. Kullanıcı verisi hareketi ADLA tuttuğu için
   eski adlarla kaydedilmiş her şey (kayıtlar, programlar, başlangıç verisi, notlar, tercihler, favoriler,
   süren antrenman, taslak, Drive'daki dosya, yedekler, paylaşım bağlantıları) açılırken yeni ada taşınır.
   BU TABLO KALICIDIR: eski adlı yedekler ve başka cihazlar yıllar sonra da gelebilir; satır silinmez, yalnız eklenir.
   Kullanıcı eski adla özel hareket eklediyse (state.custom) o ada dokunulmaz.
   Tarayıcıya bağlı değildir; testleri tests/renames.test.ts. */
import type { State } from "./schema.ts";

export const EX_RENAMES: Record<string, string> = {
  "Chest Press Makinesi": "Machine Chest Press",
  "Incline Chest Press Makinesi": "Machine Incline Chest Press",
  "Dips (Göğüs)": "Chest Dip",
  "Şınav (Push-up)": "Push-up",
  "Incline Şınav": "Incline Push-up",
  "Decline Şınav": "Decline Push-up",
  "Barfiks (Pull-up)": "Pull-up",
  "Ağırlıklı Barfiks": "Weighted Pull-up",
  "Asistanlı Barfiks Makinesi": "Assisted Pull-up Machine",
  "Lat Pulldown (Geniş)": "Wide-Grip Lat Pulldown",
  "Lat Pulldown (Dar / V-Bar)": "Close-Grip Lat Pulldown (V-Bar)",
  "Tek Kol Lat Pulldown": "Single-Arm Lat Pulldown",
  "Dumbbell Row (Tek Kol)": "Single-Arm Dumbbell Row",
  "Dumbbell Pullover (Sırt)": "Dumbbell Pullover (Lats)",
  "Back Extension (Hiperekstansiyon)": "Back Extension",
  "Dumbbell External Rotation (Yan Yatarak)": "Side-Lying Dumbbell External Rotation",
  "Cable Hammer Curl (Halat)": "Cable Hammer Curl (Rope)",
  "21'ler": "21s",
  "Triceps Pushdown (Halat)": "Triceps Pushdown (Rope)",
  "Tek Kol Cable Pushdown": "Single-Arm Cable Pushdown",
  "Dips (Triceps)": "Triceps Dip",
  "Diamond Şınav": "Diamond Push-up",
  "Tek Bacak Leg Press": "Single-Leg Leg Press",
  "Air Squat (Vücut Ağırlığı)": "Air Squat",
  "Tek Bacak RDL": "Single-Leg RDL",
  "Hip Thrust Makinesi": "Machine Hip Thrust",
  "Tek Bacak Glute Bridge": "Single-Leg Glute Bridge",
  "Cable Kickback (Kalça)": "Cable Glute Kickback",
  "Hip Abduction Makinesi": "Machine Hip Abduction",
  "Hip Adduction Makinesi": "Machine Hip Adduction",
  "Tek Bacak Calf Raise": "Single-Leg Calf Raise",
  "Mekik (Sit-up)": "Sit-up",
  "Koşu (Bant)": "Treadmill Run",
  "Koşu (Dış Mekan)": "Outdoor Run",
  "Yürüyüş / Eğimli Yürüyüş": "Walking / Incline Walk",
  "Sabit Bisiklet": "Stationary Bike",
  "Bisiklet (Dış Mekan)": "Outdoor Cycling",
  "Eliptik": "Elliptical",
  "Kürek Makinesi": "Rowing Machine",
  "Merdiven Makinesi": "Stair Climber",
  "İp Atlama": "Jump Rope",
  "Yüzme": "Swimming",
  "Dağ Duruşu (Mountain Pose)": "Mountain Pose",
  "Güneşe Selam (Sun Salutation)": "Sun Salutation",
  "Aşağı Bakan Köpek (Downward Dog)": "Downward Dog",
  "Yukarı Bakan Köpek (Upward Dog)": "Upward Dog",
  "Kobra (Cobra Pose)": "Cobra Pose",
  "Alçak Plank (Chaturanga)": "Chaturanga",
  "Çocuk Pozu (Child's Pose)": "Child's Pose",
  "Kedi-İnek (Cat-Cow)": "Cat-Cow",
  "Savaşçı 1 (Warrior I)": "Warrior I",
  "Savaşçı 2 (Warrior II)": "Warrior II",
  "Ters Savaşçı (Reverse Warrior)": "Reverse Warrior",
  "Üçgen (Triangle Pose)": "Triangle Pose",
  "Yan Uzanma Açısı (Extended Side Angle)": "Extended Side Angle",
  "Yarım Ay (Half Moon)": "Half Moon",
  "Ağaç (Tree Pose)": "Tree Pose",
  "Sandalye (Chair Pose)": "Chair Pose",
  "Ayakta Öne Eğilme (Standing Forward Fold)": "Standing Forward Fold",
  "Oturarak Öne Eğilme (Seated Forward Fold)": "Seated Forward Fold",
  "Alçak Hamle (Low Lunge)": "Low Lunge",
  "Güvercin (Pigeon Pose)": "Pigeon Pose",
  "Kelebek (Butterfly Pose)": "Butterfly Pose",
  "Köprü (Bridge Pose)": "Bridge Pose",
  "Deve (Camel Pose)": "Camel Pose",
  "Kayık (Boat Pose)": "Boat Pose",
  "Mutlu Bebek (Happy Baby)": "Happy Baby",
  "Yatarak Omurga Bükme (Supine Twist)": "Supine Twist",
  "Duvara Bacak (Legs Up the Wall)": "Legs Up the Wall",
  "Derin Rahatlama (Corpse Pose)": "Corpse Pose",
  "Hamstring Esnetme (Hamstring Stretch)": "Hamstring Stretch",
  "Quadriceps Esnetme (Quad Stretch)": "Quad Stretch",
  "Kalça Fleksör Esnetme (Hip Flexor Stretch)": "Hip Flexor Stretch",
  "Omuz Esnetme (Shoulder Stretch)": "Shoulder Stretch",
  "Göğüs Esnetme (Chest Stretch)": "Chest Stretch",
};

export const canonicalEx = (name: string): string => (typeof name === "string" && Object.prototype.hasOwnProperty.call(EX_RENAMES, name) ? EX_RENAMES[name] : name);

// state içindeki tüm hareket adlarını yeni adlara çevirir; girdiyi değiştirmez, yeni nesne döndürür. Tekrar çalıştırmak zararsızdır.
export function migrateExNames(s: State): State {
  const custom = new Set((Array.isArray(s.custom) ? s.custom : []).map(c => c?.name));
  const ren = (n: any) => (typeof n === "string" && !custom.has(n) ? canonicalEx(n) : n);
  const touched = (n: any) => ren(n) !== n;
  const out: State = { ...s };

  if (Array.isArray(s.entries) && s.entries.some(e => touched(e?.ex))) {
    const res: typeof s.entries = [];
    const moved: typeof s.entries = [];
    for (const e of s.entries) {
      if (s.deleted?.some(d => d.c === "entries" && d.k === e.id && d.at >= (e.u || 0))) continue;
      (touched(e?.ex) ? moved : res).push(e);
    }
    // aynı gün yeni adla zaten kayıt varsa setler onda birleşir (çift kayıt oluşmaz)
    for (const e of moved) {
      const to = ren(e.ex);
      const i = res.findIndex(x => x.ex === to && x.date === e.date);
      if (i >= 0) {
        const t = res[i];
        const at = Math.max(t.u || 0, e.u || 0, t.ts || 0, e.ts || 0, 1);
        out.deleted = [...(out.deleted || []).filter(d => !(d.c === "entries" && d.k === e.id)), { c: "entries", k: e.id, at }];
        res[i] = { ...t, u: at + 1, sets: [...(t.sets || []), ...(e.sets || [])], ...(e.note ? { note: t.note ? t.note + "\n" + e.note : e.note } : {}) };
      } else res.push({ ...e, ex: to });
    }
    // özgün sıra korunur
    const idx = new Map(s.entries.map((e, i) => [e.id, i] as const));
    const at = (x: any) => idx.get(x.id) ?? 1e9;
    out.entries = res.sort((x, y) => at(x) - at(y));
  }

  if (Array.isArray(s.programs) && s.programs.some(p => p?.items?.some((i: any) => touched(i?.ex)))) {
    out.programs = s.programs.map(p => {
      if (!p?.items?.some((i: any) => touched(i?.ex))) return p;
      return { ...p, items: p.items.map((i: any) => touched(i?.ex) ? { ...i, ex: ren(i.ex) } : i) };
    });
  }

  if (s.baseline && Object.keys(s.baseline).some(touched)) {
    const b: Record<string, any> = {};
    for (const [k, v] of Object.entries(s.baseline)) if (!touched(k)) b[k] = v;
    for (const [k, v] of Object.entries<any>(s.baseline)) if (touched(k)) {
      const to = ren(k);
      if (!b[to] || (v?.date || "") > (b[to]?.date || "")) b[to] = v;
    }
    out.baseline = b;
  }
  if (s.exNotes && Object.keys(s.exNotes).some(touched)) {
    const m: Record<string, string> = {};
    for (const [k, v] of Object.entries<string>(s.exNotes)) if (!touched(k)) m[k] = v;
    for (const [k, v] of Object.entries<string>(s.exNotes)) if (touched(k)) { const to = ren(k); m[to] = m[to] ? m[to] + "\n" + v : v; }
    out.exNotes = m;
  }
  if (s.exPrefs && Object.keys(s.exPrefs).some(touched)) {
    const m: Record<string, any> = {};
    for (const [k, v] of Object.entries(s.exPrefs)) if (!touched(k)) m[k] = v;
    for (const [k, v] of Object.entries(s.exPrefs)) if (touched(k)) { const to = ren(k); if (!m[to]) m[to] = v; }
    out.exPrefs = m;
  }
  if (Array.isArray(s.favs) && s.favs.some(touched)) out.favs = [...new Set(s.favs.map(ren))];
  if (s.live?.items?.some((i: any) => touched(i?.ex))) out.live = { ...s.live, items: s.live.items.map((i: any) => touched(i?.ex) ? { ...i, ex: ren(i.ex) } : i) };
  if (touched(s.draft?.ex)) out.draft = { ...s.draft, ex: ren(s.draft.ex) };
  return out;
}
