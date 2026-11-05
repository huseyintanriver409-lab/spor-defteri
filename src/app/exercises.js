import { CARDIO, LIB, YOGA, fmt, state } from "./store.js";

/* ---------- Exercise metadata ---------- */
export function allEx(){
  const list = [];
  for (const g in LIB) LIB[g].forEach(n => list.push({name:n, group:g}));
  state.custom.forEach(c => list.push({name:c.name, group:c.group, custom:true}));
  return list;
}
export function groupOf(name){ const e = allEx().find(x => x.name === name); return e ? e.group : "Diğer"; }
export const isCardio = name => groupOf(name) === CARDIO;
export const isYoga = name => groupOf(name) === YOGA;
// Ayarlar → Antrenman ayarları → "ne için kullanıyorsun": both | lift (yoga gizli) | yoga (ağırlık gizli; kardiyo ve özel hareketler kalır)
export const focus = () => ["lift", "yoga"].includes(state.prefs.focus) ? state.prefs.focus : "both";
export const yogaOn = () => focus() !== "lift";
export const liftOn = () => focus() !== "yoga";
export const groupShown = g => g === YOGA ? yogaOn() : liftOn() || g === CARDIO || g === "Diğer";
export const pickableEx = () => allEx().filter(e => groupShown(e.group));

// [desen, ana kaslar, yardımcı kaslar] — ilk eşleşen kural geçerli
export const MUSCLE_RULES = [
  [/calf|tibialis/, ["Baldır"], []],
  [/lateral raise|y-raise|upright row/, ["Yan Omuz"], ["Trapez"]],
  // dış rotasyon: rotator manşet (infraspinatus, teres minör); face pull ikisini de çalıştırır
  [/external rotation|cuban/, ["Rotator Manşet"], ["Arka Omuz"]],
  [/face pull/, ["Arka Omuz"], ["Trapez","Rotator Manşet"]],
  [/rear delt|reverse pec/, ["Arka Omuz"], ["Trapez"]],
  [/front raise/, ["Ön Omuz"], []],
  [/shoulder press|overhead press|arnold|push press|handstand|standing dumbbell press/, ["Ön Omuz"], ["Yan Omuz","Triceps"]],
  [/close-grip bench|jm press|diamond|dips \(triceps\)|bench dips/, ["Triceps"], ["Göğüs","Ön Omuz"]],
  [/pullover/, ["Lat"], ["Göğüs"]],
  [/fly|crossover|pec deck/, ["Göğüs"], ["Ön Omuz"]],
  [/romanian|stiff-leg|rdl|good morning/, ["Hamstring","Kalça"], ["Bel"]],
  [/deadlift|rack pull/, ["Kalça","Hamstring","Bel"], ["Quadriceps","Trapez","Önkol"]],
  [/shrug/, ["Trapez"], ["Önkol"]],
  [/back extension|superman|reverse hyper/, ["Bel"], ["Kalça","Hamstring"]],
  [/chin-up/, ["Lat","Biceps"], ["Arka Omuz"]],
  [/pull-up|barfiks|pulldown|straight-arm|muscle-up/, ["Lat"], ["Biceps","Arka Omuz"]],
  [/row/, ["Lat","Trapez"], ["Biceps","Arka Omuz"]],
  [/leg extension|sissy/, ["Quadriceps"], []],
  [/lunge|split squat|step-up|pistol/, ["Quadriceps","Kalça"], ["Hamstring"]],
  [/leg curl|nordic|glute-ham/, ["Hamstring"], ["Baldır"]],
  [/adduction/, ["İç Bacak"], []],
  [/hip thrust|glute bridge|kickback \(kalça\)|frog|pull-through|abduction/, ["Kalça"], ["Hamstring"]],
  [/swing/, ["Kalça","Hamstring"], ["Bel"]],
  [/clean|snatch|jerk/, ["Kalça","Quadriceps","Trapez"], ["Ön Omuz","Hamstring"]],
  [/thruster|wall ball/, ["Quadriceps","Ön Omuz"], ["Kalça","Triceps"]],
  [/squat|leg press|wall sit/, ["Quadriceps"], ["Kalça"]],
  [/farmer|dead hang|wrist|pinch/, ["Önkol"], ["Trapez"]],
];
export const GROUP_MUSCLES = {
  "Göğüs":[["Göğüs"],["Ön Omuz","Triceps"]], "Sırt":[["Lat"],["Biceps"]], "Omuz":[["Ön Omuz","Yan Omuz"],[]],
  "Biceps":[["Biceps"],["Önkol"]], "Triceps":[["Triceps"],[]], "Önkol & Kavrama":[["Önkol"],[]],
  "Bacak (Ön)":[["Quadriceps"],["Kalça"]], "Arka Bacak & Kalça":[["Hamstring","Kalça"],[]], "Baldır":[["Baldır"],[]],
  "Karın & Core":[["Karın"],[]]
};
// karın hareketleri: yan karın (oblik) ağırlıklı olanlar ayrı
const CORE_RULES = [[/twist|side plank|woodchop|side bend|bicycle|pallof|windshield/, ["Oblik"], ["Karın"]]];
export const MUSCLE_ORDER = ["Göğüs","Lat","Trapez","Bel","Ön Omuz","Yan Omuz","Arka Omuz","Biceps","Triceps","Önkol","Quadriceps","Hamstring","Kalça","İç Bacak","Baldır","Karın","Oblik","Rotator Manşet"];
export const _mCache = {};
export function musclesOf(name){
  if (_mCache[name]) return _mCache[name];
  const g = groupOf(name), n = name.toLowerCase();
  const def = GROUP_MUSCLES[g] ? { p: GROUP_MUSCLES[g][0], s: GROUP_MUSCLES[g][1] } : { p: [], s: [] };
  // kardiyo ve yogada kurallar uygulanmaz; karında yalnız oblik kuralı. Listede olmayan ("Diğer") hareketler de
  // adından tanınır (ör. "Dumbbell Overhead Press" → ön omuz); tanınmazsa kas haritasına girmez.
  const r = g === "Karın & Core" ? CORE_RULES.find(([re]) => re.test(n)) : [CARDIO, YOGA].includes(g) ? null : MUSCLE_RULES.find(([re]) => re.test(n));
  return _mCache[name] = r ? { p: r[1], s: r[2] } : def;
}
export const EQUIPS = ["Barbell","Dumbbell","Kablo","Makine","Smith","Kettlebell","Vücut Ağırlığı","Diğer","Kardiyo"];
export const HOME = ["Dumbbell","Kettlebell","Vücut Ağırlığı","Kardiyo"];
export function equipOf(name){
  const n = name.toLowerCase(), g = groupOf(name);
  if (g === CARDIO) return "Kardiyo";
  if (g === YOGA) return "Vücut Ağırlığı";
  if (/smith/.test(n)) return "Smith";
  if (/kettlebell|turkish/.test(n)) return "Kettlebell";
  if (/cable|pulldown|pushdown|face pull|crossover|pull-through|woodchop|pallof/.test(n)) return "Kablo";
  if (/makine|machine|leg press|hack squat|pec deck|pendulum|belt squat|leg extension|leg curl|standing calf|seated calf|donkey|chest-supported|reverse pec|t-bar|glute-ham|reverse hyper/.test(n)) return "Makine";
  if (/plate|sled|battle|wall ball|man maker|ab wheel/.test(n)) return "Diğer";
  if (/dumbbell|goblet|arnold|hammer curl|concentration|kickback|farmer|bulgarian|lunge|step-up|spider|zottman|side bend|seal row|y-raise|lateral raise|front raise|rear delt|svend|pullover|wrist/.test(n)) return "Dumbbell";
  if (/şınav|push-up|barfiks|pull-up|chin-up|dips|plank|crunch|mekik|sit-up|leg raise|knee raise|burpee|mountain|v-up|hollow|l-sit|dead bug|bird dog|superman|nordic|pistol|sissy|inverted|dead hang|glute bridge|frog|wall sit|muscle-up|box jump|handstand|dragon|tek bacak calf|tibialis|back extension|russian|air squat/.test(n)) return "Vücut Ağırlığı";
  if (g === "Diğer") return "Diğer";
  return "Barbell";
}
// set türleri: w = ısınma (istatistiklere girmez), d = drop set, f = tükenişe kadar
export const SET_TYPES = { w: "Isınma", d: "Drop", f: "Tükeniş" };
export const TYPE_LETTER = { w: "I", d: "D", f: "T" };
// Süreli hareketler (plank, wall sit…): set { w: ek ağırlık, sec: süre, r: 0 }. r=0 olduğu için hacim, 1RM ve tekrar rekorlarına girmez.
export const TIMED_RE = /plank|wall sit|dead hang|l-sit|hollow body|battle rope|farmer/i;
// yoga pozları da süreli; kullanıcı hareket ayarından değiştirebilir (exPrefs.timed)
export const timedByDefault = name => !isCardio(name) && (isYoga(name) || TIMED_RE.test(name));
export const isTimed = name => { const p = (state.exPrefs[name] || {}).timed; return p != null ? p : timedByDefault(name); };
export const fmtSec = s => { s = Math.round(+s || 0); return s < 60 ? `${s} sn` : `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")} dk`; };
export const setLabel = (s, cardio) => s.sec != null ? `${fmtSec(s.sec)}${+s.w ? ` · +${fmt(+s.w)} kg` : ""}`
  : cardio ? `${fmt(+s.w||0)} dk${+s.r ? " · "+fmt(+s.r)+" km" : ""}`
  : `${fmt(+s.w||0)} kg × ${+s.r||0}${s.rir != null && s.rir !== "" ? ` @${s.rir}` : ""}`;
export const durText = ms => { const m = Math.round(ms/60000); return m >= 60 ? `${Math.floor(m/60)} sa ${m%60} dk` : `${m} dk`; };
