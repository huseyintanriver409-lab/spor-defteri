import { MONTHS, DAYS, pad, ymd, parse, niceDate, shortDate, mondayOf } from "./core/dates.ts";
import { DEFAULTS, withDefaults, mergeStates, takeSnapshot as snapshotOf, stampChanges as stampState } from "./core/schema.ts";
import { work, volume, e1rm, warmupSets, platesFor as platesForCore, liftScore, repRange, overloadDecision } from "./core/training.ts";
import { recoveryMap as recoveryMapCore } from "./core/recovery.ts";
import { syncOnce } from "./core/sync.ts";
import { driveStore, AuthError } from "./sync/drive.ts";
import { cachedToken, preload as preloadGoogle, gisReady, requestToken, dropScope, revoke, DRIVE_SCOPE, CAL_SCOPE } from "./sync/google.ts";
import { runCalendar, planSignature } from "./core/calendar.ts";
import { calendarClient } from "./sync/calendar.ts";
import { GOOGLE_CLIENT_ID } from "./config.ts";

const LIB = {
  "Göğüs": ["Bench Press (Barbell)","Dumbbell Bench Press","Incline Bench Press","Incline Dumbbell Press","Decline Bench Press","Decline Dumbbell Press","Smith Machine Bench Press","Smith Machine Incline Press","Chest Press Makinesi","Incline Chest Press Makinesi","Dumbbell Fly","Incline Dumbbell Fly","Pec Deck (Butterfly)","Cable Crossover","Low-to-High Cable Fly","High-to-Low Cable Fly","Dips (Göğüs)","Şınav (Push-up)","Incline Şınav","Decline Şınav","Dumbbell Pullover","Landmine Press","Svend Press","Floor Press"],
  "Sırt": ["Barfiks (Pull-up)","Chin-up","Ağırlıklı Barfiks","Asistanlı Barfiks Makinesi","Lat Pulldown (Geniş)","Lat Pulldown (Dar / V-Bar)","Tek Kol Lat Pulldown","Seated Cable Row","Barbell Row","Pendlay Row","Dumbbell Row (Tek Kol)","T-Bar Row","Chest-Supported Row","Seal Row","Machine Row","Meadows Row","Inverted Row","Straight-Arm Pulldown","Dumbbell Pullover (Sırt)","Deadlift","Rack Pull","Back Extension (Hiperekstansiyon)","Good Morning","Barbell Shrug","Dumbbell Shrug","Superman"],
  "Omuz": ["Overhead Press (Barbell)","Seated Dumbbell Shoulder Press","Standing Dumbbell Press","Arnold Press","Machine Shoulder Press","Smith Machine Shoulder Press","Push Press","Landmine Shoulder Press","Lateral Raise (Dumbbell)","Cable Lateral Raise","Machine Lateral Raise","Front Raise (Dumbbell)","Plate Front Raise","Cable Front Raise","Rear Delt Fly (Dumbbell)","Reverse Pec Deck","Cable Rear Delt Fly","Face Pull","Upright Row","Y-Raise","Handstand Push-up"],
  "Biceps": ["Barbell Curl","EZ-Bar Curl","Dumbbell Curl","Alternating Dumbbell Curl","Hammer Curl","Cable Hammer Curl (Halat)","Incline Dumbbell Curl","Preacher Curl","Machine Preacher Curl","Concentration Curl","Cable Curl","Bayesian Cable Curl","Spider Curl","Drag Curl","Reverse Curl","Zottman Curl","21'ler"],
  "Triceps": ["Triceps Pushdown (Halat)","Triceps Pushdown (Bar)","Tek Kol Cable Pushdown","Overhead Cable Extension","Overhead Dumbbell Extension","Skull Crusher (EZ-Bar)","Dumbbell Skull Crusher","Close-Grip Bench Press","Dips (Triceps)","Bench Dips","Triceps Kickback","Cable Kickback (Triceps)","JM Press","Machine Triceps Extension","Diamond Şınav"],
  "Önkol & Kavrama": ["Wrist Curl","Reverse Wrist Curl","Farmer's Walk","Dead Hang","Plate Pinch","Wrist Roller"],
  "Bacak (Ön)": ["Back Squat","Front Squat","High-Bar Squat","Low-Bar Squat","Goblet Squat","Hack Squat","Pendulum Squat","Belt Squat","Smith Machine Squat","Leg Press","Tek Bacak Leg Press","Bulgarian Split Squat","Walking Lunge","Reverse Lunge","Forward Lunge","Lateral Lunge","Step-up","Leg Extension","Sissy Squat","Pistol Squat","Box Squat","Zercher Squat","Wall Sit"],
  "Arka Bacak & Kalça": ["Romanian Deadlift","Dumbbell Romanian Deadlift","Tek Bacak RDL","Stiff-Leg Deadlift","Sumo Deadlift","Trap Bar Deadlift","Lying Leg Curl","Seated Leg Curl","Standing Leg Curl","Nordic Curl","Glute-Ham Raise","Hip Thrust (Barbell)","Hip Thrust Makinesi","Glute Bridge","Tek Bacak Glute Bridge","Cable Kickback (Kalça)","Cable Pull-through","Hip Abduction Makinesi","Hip Adduction Makinesi","Kettlebell Swing","Reverse Hyperextension","Frog Pump"],
  "Baldır": ["Standing Calf Raise","Seated Calf Raise","Leg Press Calf Raise","Smith Machine Calf Raise","Tek Bacak Calf Raise","Donkey Calf Raise","Tibialis Raise"],
  "Karın & Core": ["Crunch","Mekik (Sit-up)","Decline Sit-up","Cable Crunch","Machine Crunch","Bicycle Crunch","Reverse Crunch","Hanging Leg Raise","Hanging Knee Raise","Lying Leg Raise","Captain's Chair Leg Raise","Plank","Side Plank","Ab Wheel Rollout","Russian Twist","Pallof Press","Cable Woodchopper","Dragon Flag","Dead Bug","Bird Dog","Mountain Climber","V-Up","Hollow Body Hold","L-Sit","Side Bend (Dumbbell)"],
  "Tüm Vücut & Olimpik": ["Power Clean","Hang Clean","Clean and Jerk","Snatch","Power Snatch","Thruster","Clean & Press","Burpee","Turkish Get-up","Kettlebell Goblet Clean","Sled Push","Sled Pull","Battle Rope","Box Jump","Wall Ball","Muscle-up","Man Maker"],
  "Kardiyo": ["Koşu (Bant)","Koşu (Dış Mekan)","Yürüyüş / Eğimli Yürüyüş","Sabit Bisiklet","Bisiklet (Dış Mekan)","Eliptik","Kürek Makinesi","Merdiven Makinesi","İp Atlama","Yüzme","Assault Bike","HIIT"]
};
const CARDIO = "Kardiyo";
const KEY = "sporDefteri.v1";
const $ = s => document.querySelector(s);
const ic = (n, cls = "") => `<svg class="ic${cls ? " " + cls : ""}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt = n => (Math.round(n*10)/10).toLocaleString("tr-TR");
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,6);

/* ---------- Data layer ----------
   Veri modeli, damgalama ve birleştirme core/schema.ts içinde (bkz. YOL-HARITASI.md "Veri modeli").
   Damgalama save() içinde merkezi olarak yapılır: her kayıt bir önceki kaydedilen haliyle karşılaştırılır. */
let state = DEFAULTS();
let snapshot = null;
function takeSnapshot(){ snapshot = snapshotOf(state); }
function stampChanges(){ snapshot = stampState(state, snapshot); }
function load(){
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = withDefaults(JSON.parse(raw));
  } catch(e){ toast("Kayıtlar okunamadı"); }
  if (!state.deviceId) state.deviceId = "d-" + uid();
  takeSnapshot();
}
function save(){
  stampChanges();
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch(e){ toast("Kaydedilemedi! Yedek al."); }
  // plan ya da programlar değiştiyse takvimdeki planı birkaç saniye sonra güncelle (art arda değişiklikler tek seferde)
  if (state.gcal.plan || state.gcal.planSig) calSoon();
}
// Tarayıcının confirm() penceresi bazı uygulama içi görüntüleyicilerde engellenir; bu yüzden kendi onay penceremiz
// choices: [{ label, value, primary? }]; dışarı tıklamak null döndürür
function choose(msg, choices){
  return new Promise(res => {
    $("#modalMsg").textContent = msg;
    $("#modalBtns").innerHTML = `<span class="grow"></span>` + choices.map((c,i) => `<button class="btn${c.primary ? " primary" : ""}" data-i="${i}">${esc(c.label)}</button>`).join("");
    $("#modal").classList.remove("hidden");
    const done = v => { $("#modal").classList.add("hidden"); res(v); };
    $("#modalBtns").querySelectorAll("button").forEach(b => b.onclick = () => done(choices[+b.dataset.i].value));
    $("#modal").onclick = e => { if (e.target.id === "modal") done(null); };
  });
}
const ask = (msg, yes = "Evet, sil") => choose(msg, [{ label: "Vazgeç", value: false }, { label: yes, value: true, primary: true }]).then(v => !!v);
function toast(msg, icon = "info"){ const t=$("#toast"); t.innerHTML = ic(icon) + "<span>" + esc(msg) + "</span>"; t.classList.add("show"); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove("show"),2200); }

/* ---------- Exercise metadata ---------- */
function allEx(){
  const list = [];
  for (const g in LIB) LIB[g].forEach(n => list.push({name:n, group:g}));
  state.custom.forEach(c => list.push({name:c.name, group:c.group, custom:true}));
  return list;
}
function groupOf(name){ const e = allEx().find(x => x.name === name); return e ? e.group : "Diğer"; }
const isCardio = name => groupOf(name) === CARDIO;

// [desen, ana kaslar, yardımcı kaslar] — ilk eşleşen kural geçerli
const MUSCLE_RULES = [
  [/calf|tibialis/, ["Baldır"], []],
  [/lateral raise|y-raise|upright row/, ["Yan Omuz"], ["Trapez"]],
  [/rear delt|reverse pec|face pull/, ["Arka Omuz"], ["Trapez"]],
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
const GROUP_MUSCLES = {
  "Göğüs":[["Göğüs"],["Ön Omuz","Triceps"]], "Sırt":[["Lat"],["Biceps"]], "Omuz":[["Ön Omuz","Yan Omuz"],[]],
  "Biceps":[["Biceps"],["Önkol"]], "Triceps":[["Triceps"],[]], "Önkol & Kavrama":[["Önkol"],[]],
  "Bacak (Ön)":[["Quadriceps"],["Kalça"]], "Arka Bacak & Kalça":[["Hamstring","Kalça"],[]], "Baldır":[["Baldır"],[]],
  "Karın & Core":[["Karın"],[]]
};
const MUSCLE_ORDER = ["Göğüs","Lat","Trapez","Bel","Ön Omuz","Yan Omuz","Arka Omuz","Biceps","Triceps","Önkol","Quadriceps","Hamstring","Kalça","İç Bacak","Baldır","Karın"];
const _mCache = {};
function musclesOf(name){
  if (_mCache[name]) return _mCache[name];
  const g = groupOf(name), n = name.toLowerCase();
  const def = GROUP_MUSCLES[g] ? { p: GROUP_MUSCLES[g][0], s: GROUP_MUSCLES[g][1] } : { p: [], s: [] };
  // kardiyo, karın ve özel ("Diğer") hareketlerde kurallar uygulanmaz
  const r = [CARDIO, "Diğer", "Karın & Core"].includes(g) ? null : MUSCLE_RULES.find(([re]) => re.test(n));
  return _mCache[name] = r ? { p: r[1], s: r[2] } : def;
}
const EQUIPS = ["Barbell","Dumbbell","Kablo","Makine","Smith","Kettlebell","Vücut Ağırlığı","Diğer","Kardiyo"];
const HOME = ["Dumbbell","Kettlebell","Vücut Ağırlığı","Kardiyo"];
function equipOf(name){
  const n = name.toLowerCase(), g = groupOf(name);
  if (g === CARDIO) return "Kardiyo";
  if (/smith/.test(n)) return "Smith";
  if (/kettlebell|turkish/.test(n)) return "Kettlebell";
  if (/cable|pulldown|pushdown|face pull|crossover|pull-through|woodchop|pallof/.test(n)) return "Kablo";
  if (/makine|machine|leg press|hack squat|pec deck|pendulum|belt squat|leg extension|leg curl|standing calf|seated calf|donkey|chest-supported|reverse pec|t-bar|glute-ham|reverse hyper/.test(n)) return "Makine";
  if (/plate|sled|battle|wall ball|man maker|ab wheel/.test(n)) return "Diğer";
  if (/dumbbell|goblet|arnold|hammer curl|concentration|kickback|farmer|bulgarian|lunge|step-up|spider|zottman|side bend|seal row|y-raise|lateral raise|front raise|rear delt|svend|pullover|wrist/.test(n)) return "Dumbbell";
  if (/şınav|push-up|barfiks|pull-up|chin-up|dips|plank|crunch|mekik|sit-up|leg raise|knee raise|burpee|mountain|v-up|hollow|l-sit|dead bug|bird dog|superman|nordic|pistol|sissy|inverted|dead hang|glute bridge|frog|wall sit|muscle-up|box jump|handstand|dragon|tek bacak calf|tibialis|back extension|russian/.test(n)) return "Vücut Ağırlığı";
  if (g === "Diğer") return "Diğer";
  return "Barbell";
}
// set türleri: w = ısınma (istatistiklere girmez), d = drop set, f = tükenişe kadar
const SET_TYPES = { w: "Isınma", d: "Drop", f: "Tükeniş" };
const TYPE_LETTER = { w: "I", d: "D", f: "T" };
// Süreli hareketler (plank, wall sit…): set { w: ek ağırlık, sec: süre, r: 0 }. r=0 olduğu için hacim, 1RM ve tekrar rekorlarına girmez.
const TIMED_RE = /plank|wall sit|dead hang|l-sit|hollow body|battle rope|farmer/i;
const isTimed = name => { const p = (state.exPrefs[name] || {}).timed; return p != null ? p : !isCardio(name) && TIMED_RE.test(name); };
const fmtSec = s => { s = Math.round(+s || 0); return s < 60 ? `${s} sn` : `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")} dk`; };
const setLabel = (s, cardio) => s.sec != null ? `${fmtSec(s.sec)}${+s.w ? ` · +${fmt(+s.w)} kg` : ""}`
  : cardio ? `${fmt(+s.w||0)} dk${+s.r ? " · "+fmt(+s.r)+" km" : ""}`
  : `${fmt(+s.w||0)} kg × ${+s.r||0}${s.rir != null && s.rir !== "" ? ` @${s.rir}` : ""}`;
const durText = ms => { const m = Math.round(ms/60000); return m >= 60 ? `${Math.floor(m/60)} sa ${m%60} dk` : `${m} dk`; };

/* ---------- Helpers: haptics, wake lock, undo, bottom sheet ---------- */
function buzz(p){ if (state.prefs.haptics) try { navigator.vibrate && navigator.vibrate(p); } catch(e){} }
let wakeLock = null;
// antrenman sürerken ekranın kararmaması için (destekleyen tarayıcılarda)
async function keepAwake(on){
  try {
    if (on && state.prefs.wake && "wakeLock" in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => { wakeLock = null; });
    }
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch(e){}
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && state.live) keepAwake(true); });

// silme işlemleri onay sormaz; bunun yerine birkaç saniye "Geri al" sunulur
let undoTimer = null;
function undoable(msg, undo){
  const s = $("#snack");
  $("#snackMsg").textContent = msg; $("#toast").classList.remove("show"); s.classList.add("show");
  clearTimeout(undoTimer);
  $("#snackBtn").onclick = () => { clearTimeout(undoTimer); s.classList.remove("show"); undo(); toast("Geri alındı", "undo-2"); };
  undoTimer = setTimeout(() => s.classList.remove("show"), 5000);
}

let sheetOnClose = null;
function openSheet(head, body, onClose){
  $("#bsHead").innerHTML = head; $("#bsBody").innerHTML = body;
  $("#bs").classList.remove("hidden"); sheetOnClose = onClose || null;
  const c = $("#bsHead [data-close]"); if (c) c.onclick = closeSheet;
  return $("#bsBody");
}
function closeSheet(){
  $("#bs").classList.add("hidden"); $("#bsBody").innerHTML = "";
  const f = sheetOnClose; sheetOnClose = null; if (f) f();
}
$("#bs").addEventListener("click", e => { if (e.target.id === "bs") closeSheet(); });
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (!$("#modal").classList.contains("hidden")) $("#modal").click();
  else if (!$("#bs").classList.contains("hidden")) closeSheet();
});
const sheetHead = title => `<div class="row" style="margin-bottom:12px"><h3 class="grow">${esc(title)}</h3><button class="iconbtn" data-close title="Kapat">${ic("x")}</button></div>`;
const emptyHTML = (icon, title, text) => `<div class="empty">${ic(icon)}<b>${esc(title)}</b>${esc(text)}</div>`;

/* ---------- Exercise picker ---------- */
function recentExercises(){
  const seen = new Set(), out = [];
  state.entries.slice().sort((a,b) => (b.ts||0) - (a.ts||0)).forEach(e => { if (!seen.has(e.ex)) { seen.add(e.ex); out.push(e.ex); } });
  return out.slice(0, 15);
}
function openPicker(title, onPick){
  openSheet(sheetHead(title) + `<div class="search">${ic("search")}<input id="pkQ" placeholder="Hareket ara" autocomplete="off" aria-label="Hareket ara"></div>
    <div class="fchips" id="pkChips" style="margin:10px 0 4px"></div>`, `<div class="pk-list" id="pkList"></div>`);
  let filter = recentExercises().length ? "recent" : state.favs.length ? "fav" : "all";
  const chips = [["recent", "Son kullanılanlar", "history"], ["fav", "Favoriler", "star"], ["all", "Tümü", "list"], ...groups().map(g => [g, g, ""])];
  const renderChips = () => {
    $("#pkChips").innerHTML = chips.map(([k,l,i]) => `<button class="fchip${filter===k ? " on" : ""}" data-k="${esc(k)}">${i ? ic(i) : ""}${esc(l)}</button>`).join("");
    $("#pkChips").querySelectorAll("button").forEach(b => b.onclick = () => { filter = b.dataset.k; renderChips(); renderList(); });
  };
  const known = n => allEx().find(e => e.name===n) || { name: n, group: groupOf(n) };
  const renderList = () => {
    const raw = $("#pkQ").value.trim(), q = raw.toLocaleLowerCase("tr");
    let list;
    if (q) list = allEx().filter(e => { const m = musclesOf(e.name); return [e.name, e.group, equipOf(e.name), ...m.p, ...m.s].join(" ").toLocaleLowerCase("tr").includes(q); });
    else if (filter === "recent") list = recentExercises().map(known);
    else if (filter === "fav") list = state.favs.map(known);
    else if (filter === "all") list = allEx();
    else list = allEx().filter(e => e.group === filter);
    const exact = q && allEx().some(e => e.name.toLocaleLowerCase("tr") === q);
    let html = q && !exact ? `<div class="pk-item"><button class="pk-main" data-new="1"><b>${ic("circle-plus", "acc")} “${esc(raw)}” ekle</b><small>Kendi hareketin olarak kaydedilir</small></button></div>` : "";
    html += list.map(e => {
      const m = musclesOf(e.name), fav = state.favs.includes(e.name);
      return `<div class="pk-item"><button class="pk-main" data-ex="${esc(e.name)}"><b>${esc(e.name)}</b><small><span class="tag">${esc(equipOf(e.name))}</span>${esc(m.p.join(", ") || e.group)}</small></button>
        <button class="iconbtn star${fav ? " on" : ""}" data-fav="${esc(e.name)}" title="${fav ? "Favorilerden çıkar" : "Favorilere ekle"}" aria-pressed="${fav}">${ic("star")}</button></div>`;
    }).join("");
    if (!html) html = filter === "fav" ? emptyHTML("star", "Henüz favori yok", "Yıldıza dokunarak sık yaptığın hareketleri buraya ekle.")
      : emptyHTML("history", "Henüz kayıt yok", "Tümü sekmesinden ya da arayarak bir hareket seç.");
    $("#pkList").innerHTML = html;
    $("#pkList").querySelectorAll("[data-ex]").forEach(b => b.onclick = () => { closeSheet(); onPick(b.dataset.ex); });
    $("#pkList").querySelectorAll("[data-fav]").forEach(b => b.onclick = () => {
      const n = b.dataset.fav;
      state.favs = state.favs.includes(n) ? state.favs.filter(x => x !== n) : [...state.favs, n];
      save(); renderList(); buzz(8);
    });
    const nb = $("#pkList [data-new]");
    if (nb) nb.onclick = () => { state.custom.push({ name: raw, group: "Diğer" }); save(); refreshDatalist(); closeSheet(); toast(`"${raw}" eklendi`, "check"); onPick(raw); };
  };
  $("#pkQ").oninput = renderList;
  renderChips(); renderList();
  if (matchMedia("(pointer: fine)").matches) setTimeout(() => $("#pkQ") && $("#pkQ").focus(), 60);
}

/* ---------- Navigation ---------- */
const TABS = ["home", "train", "history", "progress", "profile"];
let curTab = "home";
document.querySelectorAll("nav.tabs button").forEach(b => b.onclick = () => showTab(b.dataset.tab));
function showTab(t){
  curTab = t;
  document.querySelectorAll("nav.tabs button").forEach(b => { const on = b.dataset.tab === t; b.classList.toggle("on", on); b.setAttribute("aria-current", on ? "page" : "false"); });
  TABS.forEach(x => $("#tab-" + x).classList.toggle("hidden", x !== t));
  renderTab(t); scrollTo(0, 0);
}
function renderTab(t){
  if (t === "home") renderHome();
  if (t === "train") renderSeg("train");
  if (t === "history") renderHistory();
  if (t === "progress") renderSeg("stats");
  if (t === "profile") renderSeg("profile");
}
function refreshAll(){ renderTab(curTab); renderLiveBar(); renderBackupBanner(); }
const segState = { stats: "week", train: "prog", profile: "settings" };
document.querySelectorAll(".seg").forEach(seg => seg.querySelectorAll("button").forEach(b => b.onclick = () => { segState[seg.dataset.seg] = b.dataset.v; renderSeg(seg.dataset.seg); }));
function renderSeg(name){
  const v = segState[name], seg = document.querySelector(`.seg[data-seg="${name}"]`);
  seg.querySelectorAll("button").forEach(b => { const on = b.dataset.v === v; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); $(`#${name}-${b.dataset.v}`).classList.toggle("hidden", !on); });
  ({ week: renderWeek, hist: renderHistSelect, rec: renderRecords, rest: renderRecovery, power: renderPower, body: renderBody,
     prog: renderProg, log: () => { renderDay(); updateHint(); }, plan: renderPlan,
     settings: renderSettings, lib: renderLib, tools: renderTools, backup: renderBackup })[v]();
}

/* ---------- Manual log (geçmişe dönük ya da canlı mod olmadan kayıt) ---------- */
let editingId = null;
function refreshDatalist(){
  $("#exList").innerHTML = allEx().map(e => `<option value="${esc(e.name)}"></option>`).join("");
}
function setRow(s = {}){
  const cardio = isCardio($("#logEx").value);
  const rir = s.rir == null ? "" : String(s.rir);
  const div = document.createElement("div");
  div.className = "setrow";
  div.innerHTML = `<button class="n" type="button" data-t="${s.t||""}"></button>
    <input type="number" inputmode="decimal" step="0.5" min="0" placeholder="${cardio?"dk":"kg"}" value="${s.w ?? ""}" class="w" aria-label="${cardio?"Süre (dk)":"Ağırlık (kg)"}">
    <input type="number" inputmode="${cardio?"decimal":"numeric"}" step="${cardio?"0.1":"1"}" min="0" placeholder="${cardio?"km":"tekrar"}" value="${s.sec ?? s.r ?? ""}" class="r" aria-label="${cardio?"Mesafe (km)":"Tekrar"}">
    <select class="rir" aria-label="RIR"${cardio ? ' style="visibility:hidden"' : ""}><option value="">–</option>${[0,1,2,3,4,5].map(v => `<option value="${v}"${rir===String(v)?" selected":""}>${v===5?"5+":v}</option>`).join("")}</select>
    <button class="x" type="button" title="Seti sil">${ic("x")}</button>`;
  div.querySelector(".n").onclick = e => {
    const order = ["", "w", "d", "f"], b = e.currentTarget;
    b.dataset.t = order[(order.indexOf(b.dataset.t) + 1) % order.length];
    numberRows(); saveDraft();
  };
  div.querySelector(".x").onclick = () => { div.remove(); if (!$("#setRows").children.length) setRow(); numberRows(); saveDraft(); };
  $("#setRows").appendChild(div); numberRows();
  return div;
}
function numberRows(){
  let k = 0;
  [...$("#setRows").children].forEach(d => {
    const b = d.querySelector(".n"), t = b.dataset.t;
    b.textContent = t === "w" ? "I" : (t ? TYPE_LETTER[t] : "") + (++k);
    const lbl = (t ? SET_TYPES[t] : "Normal set") + ", türü değiştirmek için dokun";
    b.title = lbl; b.setAttribute("aria-label", lbl);
  });
}
function rowData(d){
  const o = { w: parseFloat(d.querySelector(".w").value)||0, r: parseFloat(d.querySelector(".r").value)||0 };
  const t = d.querySelector(".n").dataset.t, rir = d.querySelector(".rir").value;
  const ex = $("#logEx").value;
  if (t) o.t = t;
  if (isTimed(ex)) { o.sec = o.r; o.r = 0; return o; }
  if (rir !== "" && !isCardio(ex)) o.rir = +rir;
  return o;
}
const readRows = () => [...$("#setRows").children].map(rowData).filter(s => s.w || s.r || s.sec);
// yarım kalan girişler sayfa kapansa da kaybolmasın
function saveDraft(){
  state.draft = { ex: $("#logEx").value, date: $("#logDate").value, note: $("#logNote").value, editingId,
    rows: [...$("#setRows").children].map(d => ({ ...rowData(d), w: d.querySelector(".w").value, r: d.querySelector(".r").value })) };
  save();
}
function restoreDraft(){
  const d = state.draft; if (!d) return false;
  $("#logEx").value = d.ex || ""; if (d.date) $("#logDate").value = d.date; $("#logNote").value = d.note || "";
  editingId = d.editingId && state.entries.some(e => e.id===d.editingId) ? d.editingId : null;
  if (editingId) { $("#editTitle").textContent = "Kaydı düzenle"; $("#cancelEdit").classList.remove("hidden"); }
  $("#setRows").innerHTML = ""; (d.rows && d.rows.length ? d.rows : [{}]).forEach(r => setRow(r));
  relabel(); updateHint(); showExNote();
  return true;
}
$("#setRows").addEventListener("input", saveDraft);
$("#setRows").addEventListener("change", saveDraft);
$("#logNote").addEventListener("input", saveDraft);
function resetEditor(keepEx){
  editingId = null;
  $("#editTitle").textContent = "Elle kayıt";
  $("#cancelEdit").classList.add("hidden");
  $("#ovHint").classList.add("hidden");
  if (!keepEx) $("#logEx").value = "";
  $("#logNote").value = "";
  $("#setRows").innerHTML = ""; setRow(); relabel(); updateHint(); showExNote();
  state.draft = null; save();
}
$("#logEx").onclick = () => openPicker("Hareket seç", n => { $("#logEx").value = n; $("#logEx").dispatchEvent(new Event("input")); });
$("#logEx").addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("#logEx").click(); } });
$("#addSet").onclick = () => {
  const rows = $("#setRows").children, last = rows[rows.length-1];
  const s = last ? rowData(last) : {};
  setRow({ w: last ? last.querySelector(".w").value : "", r: last ? last.querySelector(".r").value : "", rir: s.rir });
  $("#setRows").lastChild.querySelector(".w").focus(); saveDraft();
};
const barFor = ex => equipOf(ex) === "Barbell" ? 20 : 0;
$("#addWarm").onclick = () => {
  const ex = $("#logEx").value.trim();
  if (!ex) return toast("Önce bir hareket seç");
  if (isCardio(ex)) return toast("Kardiyoda ısınma seti yok");
  const rows = [...$("#setRows").children].filter(d => d.querySelector(".n").dataset.t !== "w");
  const first = rows.map(rowData).find(s => s.w > 0);
  if (!first) return toast("Önce ilk çalışma setinin kilosunu gir");
  const ws = warmupSets(first.w, barFor(ex));
  if (!ws.length) return toast("Bu kilo için ısınma setine gerek yok");
  const keep = rows.map(d => ({ ...rowData(d), w: d.querySelector(".w").value, r: d.querySelector(".r").value }));
  $("#setRows").innerHTML = "";
  ws.forEach(s => setRow({ ...s, t: "w" })); keep.forEach(s => setRow(s));
  saveDraft(); toast(`${ws.length} ısınma seti eklendi`, "flame");
};
$("#logEx").addEventListener("input", () => { updateHint(); relabel(); $("#ovHint").classList.add("hidden"); showExNote(); saveDraft(); });
$("#logDate").addEventListener("change", () => { renderDay(); updateHint(); saveDraft(); });
function relabel(){
  const ex = $("#logEx").value, cardio = isCardio(ex), timed = isTimed(ex);
  const [wl, rl] = cardio ? ["dk", "km"] : timed ? ["+kg", "sn"] : ["kg", "tekrar"];
  $("#setRows").querySelectorAll(".w").forEach(i => { i.placeholder = wl; i.setAttribute("aria-label", cardio ? "Süre (dk)" : timed ? "Ek ağırlık (kg)" : "Ağırlık (kg)"); });
  $("#setRows").querySelectorAll(".r").forEach(i => { i.placeholder = rl; i.setAttribute("aria-label", cardio ? "Mesafe (km)" : timed ? "Süre (saniye)" : "Tekrar"); });
  $("#setRows").querySelectorAll(".rir").forEach(i => i.style.visibility = cardio || timed ? "hidden" : "");
  $("#hW").textContent = cardio ? "dk" : timed ? "ek kg" : "kg"; $("#hR").textContent = cardio ? "km" : timed ? "süre (sn)" : "tekrar";
  $("#hRir").style.visibility = cardio || timed ? "hidden" : "";
}
function showExNote(){
  const ex = $("#logEx").value.trim(), ta = $("#exNote");
  const known = ex && allEx().some(e => e.name===ex);
  ta.classList.toggle("hidden", !known);
  if (known) ta.value = state.exNotes[ex] || "";
}
$("#exNote").addEventListener("input", () => {
  const ex = $("#logEx").value.trim(), v = $("#exNote").value.trim(); if (!ex) return;
  if (v) state.exNotes[ex] = $("#exNote").value; else delete state.exNotes[ex];
  save();
});
function prevEntry(ex, beforeOrOn, excludeId){
  return state.entries.filter(e => e.ex===ex && e.id!==excludeId && e.date <= beforeOrOn)
    .sort((a,b) => b.date.localeCompare(a.date) || b.ts-a.ts)[0];
}
function updateHint(){
  const ex = $("#logEx").value.trim(), h = $("#lastHint");
  const prev = prevEntry(ex, $("#logDate").value, editingId);
  if (!prev){ h.classList.add("hidden"); return; }
  const c = isCardio(ex);
  h.innerHTML = `<b>Son kez</b> (${niceDate(prev.date)}): ` + work(prev.sets).map(s => setLabel(s,c)).join(", ") + (prev.note ? `<br>${ic("notebook-pen")} ${esc(prev.note)}` : "");
  h.classList.remove("hidden");
}
function bestOf(ex, excludeId){
  let w = 0, e = 0, n = 0;
  state.entries.forEach(x => { if (x.ex===ex && x.id!==excludeId) work(x.sets).forEach(s => { n++; w = Math.max(w, +s.w||0); if (s.r<=12) e = Math.max(e, e1rm(+s.w||0, +s.r||0)); }); });
  return { w, e, n };
}
const bestSecOf = (ex, excludeId) => Math.max(0, ...state.entries.filter(x => x.ex===ex && x.id!==excludeId).flatMap(x => work(x.sets)).map(s => +s.sec||0));
function saveEditor(){
  const ex = $("#logEx").value.trim(), date = $("#logDate").value, sets = readRows(), note = $("#logNote").value.trim();
  if (!ex) { toast("Önce bir hareket seç"); return false; }
  if (!date) { toast("Tarih seç"); return false; }
  if (!sets.length) { toast("En az bir set gir"); return false; }
  if (!allEx().some(e => e.name===ex)) { state.custom.push({name:ex, group:"Diğer"}); refreshDatalist(); }
  const before = bestOf(ex, editingId), beforeSec = bestSecOf(ex, editingId);
  if (editingId){
    const e = state.entries.find(x => x.id===editingId);
    Object.assign(e, {ex, date, sets}); if (note) e.note = note; else delete e.note;
  } else {
    const same = state.entries.find(e => e.ex===ex && e.date===date);
    if (same) { same.sets.push(...sets); if (note) same.note = same.note ? same.note + " · " + note : note; }
    else state.entries.push({ id: uid(), ts: Date.now(), date, ex, sets, ...(note ? { note } : {}) });
  }
  save();
  let msg = "Kaydedildi", icon = "check";
  const ws = work(sets);
  if (isTimed(ex)) {
    const ns = Math.max(0, ...ws.map(s => +s.sec||0));
    if (before.n && ns > beforeSec) { msg = `Yeni süre rekoru: ${fmtSec(ns)}!`; icon = "trophy"; }
  } else if (!isCardio(ex) && before.n && ws.length) {
    const nw = Math.max(...ws.map(s => +s.w||0)), ne = Math.max(...ws.filter(s => s.r<=12).map(s => e1rm(+s.w||0, +s.r||0)), 0);
    if (nw > before.w) { msg = `Yeni rekor: ${fmt(nw)} kg!`; icon = "trophy"; }
    else if (ne > before.e + 0.05) { msg = `Yeni tahmini 1RM rekoru: ${fmt(ne)} kg!`; icon = "trophy"; }
  }
  toast(msg, icon); buzz(icon === "trophy" ? [30,60,30,60,80] : 20);
  resetEditor(true); renderDay();
  return true;
}
$("#saveEntry").onclick = () => saveEditor();
$("#cancelEdit").onclick = () => { resetEditor(); renderDay(); };

function entryHTML(e, actions, prs){
  const c = isCardio(e.ex);
  const extra = c ? `${fmt(e.sets.reduce((a,s)=>a+(+s.w||0),0))} dk toplam` : `${work(e.sets).length} set · ${fmt(volume(e.sets))} kg hacim`;
  let k = 0;
  const chips = e.sets.map((s,i) => {
    const warm = s.t === "w", pr = prs && prs.has(i);
    const lbl = warm ? "I" : (s.t ? TYPE_LETTER[s.t] : "") + (++k);
    return `<span class="chip${warm ? " warm" : ""}${pr ? " pr" : ""}" title="${s.t ? SET_TYPES[s.t] : "Normal set"}">${pr ? ic("trophy") : ""}${lbl}) ${setLabel(s,c)}</span>`;
  }).join("");
  return `<div class="entry"><div class="row"><div class="grow"><div class="t">${esc(e.ex)}</div><div class="g">${esc(groupOf(e.ex))} · ${extra}</div></div>
    ${actions ? `<button class="iconbtn" data-edit="${e.id}" title="Düzenle">${ic("pencil")}</button><button class="iconbtn danger" data-del="${e.id}" title="Sil">${ic("trash-2")}</button>` : ""}</div>
    <div class="chips">${chips}</div>${e.note ? `<div class="note">${ic("notebook-pen")}${esc(e.note)}</div>` : ""}</div>`;
}
function bindEntryActions(root, rerender){
  root.querySelectorAll("[data-del]").forEach(b => b.onclick = () => deleteEntry(b.dataset.del, rerender));
  root.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => editEntry(b.dataset.edit));
}
function deleteEntry(id, rerender){
  const i = state.entries.findIndex(e => e.id===id); if (i < 0) return;
  const [e] = state.entries.splice(i, 1); save(); rerender(); buzz(15);
  undoable(`${e.ex} silindi`, () => { state.entries.splice(Math.min(i, state.entries.length), 0, e); save(); rerender(); });
}
function editEntry(id){
  const e = state.entries.find(x => x.id===id); if (!e) return;
  segState.train = "log"; showTab("train");
  editingId = e.id; $("#logEx").value = e.ex; $("#logDate").value = e.date; $("#logNote").value = e.note || "";
  $("#setRows").innerHTML = ""; e.sets.forEach(s => setRow(s));
  $("#editTitle").textContent = "Kaydı düzenle"; $("#cancelEdit").classList.remove("hidden"); $("#ovHint").classList.add("hidden");
  relabel(); updateHint(); showExNote(); saveDraft(); renderDay(); scrollTo(0,0);
}
function renderDay(){
  const date = $("#logDate").value;
  $("#dayTitle").textContent = date === ymd(new Date()) ? "Bugün" : niceDate(date);
  const list = state.entries.filter(e => e.date===date).sort((a,b) => a.ts-b.ts);
  $("#dayList").innerHTML = list.length ? list.map(e => entryHTML(e,true)).join("") : emptyHTML("calendar-days", "Bu gün kayıt yok", "Yukarıdan hareket seçip setlerini gir.");
  const ss = state.sessions.filter(s => s.date===date);
  // antrenman Google Takvim'e kendiliğinden yazıldıysa elle eklemek kopya oluşturur
  $("#dayCal").classList.toggle("hidden", !list.length || autoLogged(ss));
  $("#daySess").innerHTML = ss.length ? `${ic("timer")} Antrenman süresi: ${durText(ss.reduce((a,s) => a + s.end - s.start, 0))}` : "";
  bindEntryActions($("#dayList"), () => { renderDay(); updateHint(); });
}

/* ---------- Programs ---------- */
const TEMPLATES = {
  "Push (İtiş)": [["Bench Press (Barbell)",4,"6-8"],["Incline Dumbbell Press",3,"8-10"],["Seated Dumbbell Shoulder Press",3,"8-10"],["Lateral Raise (Dumbbell)",3,"12-15"],["Triceps Pushdown (Halat)",3,"10-12"],["Overhead Cable Extension",3,"10-12"]],
  "Pull (Çekiş)": [["Deadlift",3,"5"],["Barfiks (Pull-up)",3,"6-10"],["Seated Cable Row",3,"8-12"],["Face Pull",3,"12-15"],["Barbell Curl",3,"8-12"],["Hammer Curl",3,"10-12"]],
  "Legs (Bacak)": [["Back Squat",4,"6-8"],["Romanian Deadlift",3,"8-10"],["Leg Press",3,"10-12"],["Lying Leg Curl",3,"10-12"],["Leg Extension",3,"12-15"],["Standing Calf Raise",4,"12-15"]],
  "Upper (Üst Vücut)": [["Bench Press (Barbell)",4,"6-8"],["Barbell Row",4,"6-8"],["Overhead Press (Barbell)",3,"8-10"],["Lat Pulldown (Geniş)",3,"8-12"],["EZ-Bar Curl",2,"10-12"],["Skull Crusher (EZ-Bar)",2,"10-12"]],
  "Lower (Alt Vücut)": [["Back Squat",4,"6-8"],["Romanian Deadlift",3,"8-10"],["Bulgarian Split Squat",3,"10"],["Seated Leg Curl",3,"10-12"],["Seated Calf Raise",4,"12-15"],["Hanging Leg Raise",3,"10-15"]],
  "Full Body A": [["Back Squat",3,"5"],["Bench Press (Barbell)",3,"5"],["Barbell Row",3,"5"],["Plank",3,"45"]],
  "Full Body B": [["Back Squat",3,"5"],["Overhead Press (Barbell)",3,"5"],["Deadlift",1,"5"],["Hanging Knee Raise",3,"12"]],
  "5x5 (A)": [["Back Squat",5,"5"],["Bench Press (Barbell)",5,"5"],["Barbell Row",5,"5"]],
  "5x5 (B)": [["Back Squat",5,"5"],["Overhead Press (Barbell)",5,"5"],["Deadlift",1,"5"]]
};
const fromTemplate = n => ({ id: uid(), name: n, items: TEMPLATES[n].map(([ex,sets,reps]) => ({ex, sets, reps})) });
let progEditId = null;
$("#tplSel").innerHTML = Object.keys(TEMPLATES).map(n => `<option>${esc(n)}</option>`).join("");
$("#tplAdd").onclick = () => {
  const n = $("#tplSel").value;
  state.programs.push(fromTemplate(n));
  save(); renderProg(); toast(`"${n}" eklendi`, "check");
};
function pRow(it = {ex:"", sets:3, reps:"10"}){
  const div = document.createElement("div");
  div.className = "prow";
  div.innerHTML = `<button class="pss${it.ss ? " on" : ""}" type="button" title="Bir önceki hareketle süperset" aria-pressed="${!!it.ss}">${ic("arrow-left-right")}</button>
    <div class="pickfield"><input class="pe" readonly placeholder="Hareket seç" value="${esc(it.ex)}" aria-label="Hareket"></div>
    <input class="ps" type="number" inputmode="numeric" min="1" value="${esc(it.sets)}" aria-label="Set sayısı">
    <input class="pr" placeholder="8-12" value="${esc(it.reps)}" aria-label="Hedef tekrar">
    <button class="iconbtn danger" title="Hareketi kaldır" style="width:32px">${ic("x")}</button>`;
  const ss = div.querySelector(".pss");
  ss.onclick = () => { ss.classList.toggle("on"); ss.setAttribute("aria-pressed", ss.classList.contains("on")); };
  const pe = div.querySelector(".pe");
  pe.onclick = () => openPicker("Hareket seç", n => pe.value = n);
  pe.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pe.click(); } };
  div.querySelector(".danger").onclick = () => div.remove();
  $("#pRows").appendChild(div);
  return div;
}
function resetProgEditor(){
  progEditId = null; $("#pTitle").textContent = "Yeni program"; $("#pName").value = "";
  $("#pRows").innerHTML = ""; pRow(); $("#pCancel").classList.add("hidden");
}
$("#pAddRow").onclick = () => pRow().querySelector(".pe").click();
$("#pCancel").onclick = resetProgEditor;
$("#pSave").onclick = () => {
  const name = $("#pName").value.trim();
  const items = [...$("#pRows").children].map(d => ({ ex: d.querySelector(".pe").value.trim(), sets: Math.max(1, parseInt(d.querySelector(".ps").value)||1), reps: d.querySelector(".pr").value.trim(), ss: d.querySelector(".pss").classList.contains("on") }))
    .filter(i => i.ex).map((i, k) => { if (!i.ss || k === 0) delete i.ss; return i; });
  if (!name) return toast("Programa bir ad ver");
  if (!items.length) return toast("En az bir hareket ekle");
  items.forEach(i => { if (!allEx().some(e => e.name===i.ex)) state.custom.push({name:i.ex, group:"Diğer"}); });
  if (progEditId) Object.assign(state.programs.find(p => p.id===progEditId), {name, items});
  else state.programs.push({ id: uid(), name, items });
  save(); refreshDatalist(); resetProgEditor(); renderProg(); toast("Program kaydedildi", "check");
};
// süperset grupları için A1/A2, B1/B2 etiketleri; tek başına hareketler etiketsiz
function ssLabels(items){
  const groups = []; items.forEach((it, k) => { if (it.ss && k > 0) groups[groups.length-1].push(k); else groups.push([k]); });
  const out = items.map(() => ""); let g = 0;
  groups.forEach(gr => { if (gr.length > 1) { const L = String.fromCharCode(65 + g++); gr.forEach((k, j) => out[k] = L + (j+1)); } });
  return out;
}
const ssTag = l => l ? `<span class="ssl">${l}</span>` : "";
function renderProg(){
  $("#pList").innerHTML = state.programs.length ? state.programs.map(p => {
    const ms = {}; p.items.forEach(i => { const m = musclesOf(i.ex); m.p.forEach(x => ms[x] = (ms[x]||0) + i.sets); m.s.forEach(x => ms[x] = (ms[x]||0) + i.sets/2); });
    const top = Object.entries(ms).sort((a,b) => b[1]-a[1]).slice(0,4).map(([m]) => m).join(" · ");
    const L = ssLabels(p.items), total = p.items.reduce((a,i) => a + i.sets, 0);
    return `<div class="card progcard">
      <div class="eyebrow">${p.items.length} hareket · ${total} set${top ? " · " + esc(top) : ""}</div>
      <h3>${esc(p.name)}</h3>
      <ol>${p.items.map((i,k) => `<li>${ssTag(L[k])}${esc(i.ex)}<span>${i.sets} × ${esc(i.reps||"–")}</span></li>`).join("")}</ol>
      <div class="row"><button class="btn primary" data-start="${p.id}">${ic("play")}Başla</button><span class="grow"></span>
        ${state.gcal.plan ? "" : `<button class="iconbtn" data-pcal="${p.id}" title="Google Takvim'e ekle">${ic("calendar-plus")}</button>`}<button class="iconbtn" data-pedit="${p.id}" title="Düzenle">${ic("pencil")}</button><button class="iconbtn" data-pcopy="${p.id}" title="Kopyala">${ic("copy")}</button><button class="iconbtn danger" data-pdel="${p.id}" title="Sil">${ic("trash-2")}</button></div>
    </div>`; }).join("") : `<div class="card">${emptyHTML("clipboard-list", "Henüz program yok", "Aşağıdan kendi programını oluştur ya da hazır bir şablon ekle.")}</div>`;
  const find = id => state.programs.find(p => p.id===id);
  $("#pList").querySelectorAll("[data-start]").forEach(b => b.onclick = () => startWorkout(b.dataset.start));
  $("#pList").querySelectorAll("[data-pcal]").forEach(b => b.onclick = () => openCalModal(find(b.dataset.pcal)));
  $("#pList").querySelectorAll("[data-pedit]").forEach(b => b.onclick = () => {
    const p = find(b.dataset.pedit); progEditId = p.id;
    $("#pTitle").textContent = "Programı düzenle"; $("#pName").value = p.name;
    $("#pRows").innerHTML = ""; p.items.forEach(i => pRow(i)); $("#pCancel").classList.remove("hidden");
    $("#pEditor").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#pList").querySelectorAll("[data-pcopy]").forEach(b => b.onclick = () => {
    const p = find(b.dataset.pcopy);
    state.programs.push({ id: uid(), name: p.name+" (kopya)", items: p.items.map(i => ({...i})) }); save(); renderProg(); toast("Kopyalandı", "copy");
  });
  $("#pList").querySelectorAll("[data-pdel]").forEach(b => b.onclick = () => {
    const i = state.programs.findIndex(x => x.id===b.dataset.pdel), p = state.programs[i];
    const days = JSON.parse(JSON.stringify(state.plan.days)), wasActive = state.active === p.id;
    state.programs.splice(i, 1);
    if (wasActive) state.active = null;
    for (const d in state.plan.days) if (state.plan.days[d].prog === p.id) delete state.plan.days[d];
    save(); renderProg(); buzz(15);
    undoable(`"${p.name}" silindi`, () => { state.programs.splice(i, 0, p); state.plan.days = days; if (wasActive) state.active = p.id; save(); renderProg(); });
  });
  renderPlan();
}
function defaultInc(ex){
  const eq = equipOf(ex);
  if (eq === "Dumbbell" || eq === "Kettlebell") return 2;
  if (/squat|deadlift|leg press|hip thrust|rack pull|romanian|calf/i.test(ex)) return 5;
  return 2.5;
}
const defaultStep = ex => ["Dumbbell", "Kettlebell"].includes(equipOf(ex)) ? 2 : 2.5;
const exPref = (ex, k) => (state.exPrefs[ex] || {})[k];
const overloadStep = ex => exPref(ex, "inc") || defaultInc(ex);
const stepFor = ex => exPref(ex, "step") || defaultStep(ex);
const restFor = ex => exPref(ex, "rest") || state.rest;

/* ---------- Google Calendar ---------- */
const WEEKDAYS = [["MO","Pzt",1],["TU","Sal",2],["WE","Çar",3],["TH","Per",4],["FR","Cum",5],["SA","Cmt",6],["SU","Paz",0]];
const dt = d => d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+"T"+pad(d.getHours())+pad(d.getMinutes())+"00";
const at = (dateStr, time) => { const d = parse(dateStr), [h,m] = (time||"19:00").split(":").map(Number); d.setHours(h, m, 0, 0); return d; };
function nextDateFor(jsDay){ const d = new Date(); d.setHours(0,0,0,0); while (d.getDay() !== jsDay) d.setDate(d.getDate()+1); return d; }
const progDetails = p => p.items.map(i => `• ${i.ex} — ${i.sets} × ${i.reps||"–"}`).join("\n") + "\n\nSpor Defteri";
function openUrl(u){ const a = document.createElement("a"); a.href = u; a.target = "_blank"; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove(); }
function gcal(title, details, dates){
  openUrl("https://calendar.google.com/calendar/render?" + new URLSearchParams({ action: "TEMPLATE", text: title, details, dates }).toString());
}
let calProg = null;
function openCalModal(p){
  calProg = p;
  // planda bu program bir güne atanmışsa o günün tarih ve saatini öner
  const planned = WEEKDAYS.map(([code,,js]) => ({ js, d: state.plan.days[code] })).filter(x => x.d && x.d.prog === p.id)
    .map(x => ({ date: nextDateFor(x.js), time: x.d.time })).sort((a,b) => a.date-b.date)[0];
  $("#calName").textContent = p.name + " · " + p.items.length + " hareket";
  $("#calDate").value = ymd(planned ? planned.date : new Date());
  $("#calTime").value = planned ? planned.time : "19:00";
  $("#calModal").classList.remove("hidden");
}
$("#calNo").onclick = () => $("#calModal").classList.add("hidden");
$("#calModal").onclick = e => { if (e.target.id === "calModal") $("#calModal").classList.add("hidden"); };
$("#calGo").onclick = () => {
  if (!$("#calDate").value) return toast("Tarih seç");
  const s = at($("#calDate").value, $("#calTime").value), e = new Date(s.getTime() + (state.plan.dur||60)*60000);
  gcal("Antrenman: " + calProg.name, progDetails(calProg), dt(s) + "/" + dt(e));
  $("#calModal").classList.add("hidden");
};
$("#dayCal").onclick = () => calDay($("#logDate").value);
// Takvim etkinliği başlığı ve açıklaması: hareketler, setler ve toplam hacim
function dayText(list){
  const groups = [...new Set(list.map(e => groupOf(e.ex)))];
  const lifts = list.filter(e => !isCardio(e.ex));
  const details = list.map(e => `• ${e.ex}: ${e.sets.map(s => setLabel(s, isCardio(e.ex))).join(", ")}`).join("\n") +
    (lifts.length ? `\n\nToplam: ${lifts.reduce((n,e)=>n+work(e.sets).length,0)} set · ${fmt(lifts.reduce((n,e)=>n+volume(e.sets),0))} kg hacim` : "") + "\n\nSpor Defteri";
  return { title: "Antrenman: " + groups.join(", "), details };
}
// o günün antrenmanı Google Takvim'e kendiliğinden yazıldı mı (ya da yazılacak mı)
const autoLogged = sessions => state.gcal.log && sessions.length > 0;
function calDay(date){
  const list = state.entries.filter(e => e.date===date).sort((a,b) => a.ts-b.ts);
  if (!list.length) return;
  const { title, details } = dayText(list);
  const next = parse(date); next.setDate(next.getDate()+1);
  gcal(title, details, date.replace(/-/g,"") + "/" + ymd(next).replace(/-/g,""));
}
// Bir antrenman oturumunun takvim metni: oturum süresince girilen kayıtlar (yoksa o günün hepsi)
function describeSession(s){
  const day = state.entries.filter(e => e.date === s.date);
  const inSession = day.filter(e => e.ts >= s.start - 5*60e3 && e.ts <= s.end + 5*60e3);
  const list = (inSession.length ? inSession : day).sort((a,b) => a.ts-b.ts);
  const p = s.prog && state.programs.find(x => x.id === s.prog);
  const t = dayText(list);
  return { title: p ? "Antrenman: " + p.name : t.title, details: `Süre: ${durText(s.end - s.start)}\n\n` + t.details };
}

function renderPlan(){
  const P = state.plan;
  $("#planDur").value = P.dur; $("#planRemind").value = P.remind;
  const opts = sel => `<option value="">— Dinlenme —</option>` + state.programs.map(p => `<option value="${p.id}"${p.id===sel?" selected":""}>${esc(p.name)}</option>`).join("");
  $("#planRows").innerHTML = WEEKDAYS.map(([code, name]) => {
    const d = P.days[code] || {};
    return `<div class="row" style="margin-top:6px;flex-wrap:nowrap"><span style="flex:0 0 34px;font-weight:600" class="small">${name}</span>
      <select class="grow" data-pd="${code}">${opts(d.prog)}</select>
      <input type="time" data-pt="${code}" value="${d.time||"19:00"}" style="flex:0 0 96px"${d.prog?"":" class=\"hidden\""}></div>`;
  }).join("");
  $("#planRows").querySelectorAll("[data-pd]").forEach(s => s.onchange = () => {
    const c = s.dataset.pd;
    if (s.value) P.days[c] = { prog: s.value, time: (P.days[c] && P.days[c].time) || "19:00" }; else delete P.days[c];
    save(); renderPlan();
  });
  $("#planRows").querySelectorAll("[data-pt]").forEach(t => t.onchange = () => { const d = P.days[t.dataset.pt]; if (d) { d.time = t.value || "19:00"; save(); } });
  const n = Object.keys(P.days).length;
  $("#planInfo").textContent = (state.programs.length ? (n ? `Haftada ${n} antrenman` : "Henüz gün seçilmedi") : "Önce bir program oluştur")
    + (state.gcal.plan && n ? " · Google Takvim'de kendiliğinden güncellenir" : "");
  // plan takvime kendiliğinden yazılırken .ics dosyası da eklenirse etkinlikler iki kez görünür
  $("#planIcs").classList.toggle("hidden", !!state.gcal.plan);
}
$("#planDur").onchange = () => { state.plan.dur = Math.max(10, parseInt($("#planDur").value)||60); save(); renderPlan(); };
$("#planRemind").onchange = () => { state.plan.remind = Math.max(0, parseInt($("#planRemind").value)||0); save(); renderPlan(); };
function icsText(s){ return String(s).replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\n/g,"\\n"); }
// iCalendar satırları en fazla 75 bayt olmalı (UTF-8), devam satırları boşlukla başlar
function fold(line){
  const enc = new TextEncoder(), out = []; let cur = "", bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (bytes + b > (out.length ? 74 : 75)) { out.push(cur); cur = ""; bytes = 0; }
    cur += ch; bytes += b;
  }
  out.push(cur); return out.join("\r\n ");
}
$("#planIcs").onclick = () => {
  const P = state.plan, now = new Date();
  const stamp = now.toISOString().replace(/[-:]/g,"").replace(/\.\d+/,"");
  const L = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Spor Defteri//TR","CALSCALE:GREGORIAN","METHOD:PUBLISH","X-WR-CALNAME:Antrenman Planı"];
  let n = 0;
  WEEKDAYS.forEach(([code,, js]) => {
    const d = P.days[code], p = d && state.programs.find(x => x.id===d.prog); if (!p) return;
    const s = at(ymd(nextDateFor(js)), d.time), e = new Date(s.getTime() + P.dur*60000); n++;
    L.push("BEGIN:VEVENT", `UID:sd-${code}-${p.id}@spor-defteri`, `DTSTAMP:${stamp}`, `DTSTART:${dt(s)}`, `DTEND:${dt(e)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${code}`, `SUMMARY:${icsText("Antrenman: " + p.name)}`, `DESCRIPTION:${icsText(progDetails(p))}`);
    if (P.remind > 0) L.push("BEGIN:VALARM","ACTION:DISPLAY",`DESCRIPTION:${icsText(p.name + " antrenmanı")}`,`TRIGGER:-PT${P.remind}M`,"END:VALARM");
    L.push("END:VEVENT");
  });
  if (!n) return toast("Önce en az bir güne program seç");
  L.push("END:VCALENDAR");
  const blob = new Blob([L.map(fold).join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "antrenman-plani.ics";
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(`Takvim dosyası indirildi (${n} haftalık antrenman)`, "calendar-days");
};

/* ---------- Live workout: tam ekran antrenman modu ----------
   Her "Seti tamamla" seti hemen kayda yazar; sayfa kapansa da hiçbir set kaybolmaz.
   state.live = { start, date, prog, items: [{ex, sets, reps, ss?}], idx } */
const fDraft = {};
let fType = "", fRir = null;
const liveItems = () => state.live ? (state.live.items ||= []) : [];
const parseNum = s => parseFloat(String(s).replace(",", ".")) || 0;
const fmtIn = v => v === "" || v == null ? "" : String(Math.round(v*100)/100).replace(".", ",");
function elapsedText(){
  const s = Math.floor((Date.now() - state.live.start)/1000);
  return (s >= 3600 ? Math.floor(s/3600) + ":" + pad(Math.floor(s/60)%60) : Math.floor(s/60)) + ":" + pad(s%60);
}
function startWorkout(progId){
  if (state.live) { openFocus(); return toast("Zaten süren bir antrenman var", "timer"); }
  const p = progId && state.programs.find(x => x.id===progId);
  state.live = { start: Date.now(), date: ymd(new Date()), prog: p ? p.id : null, items: p ? p.items.map(i => ({...i})) : [], idx: 0 };
  state.active = p ? p.id : null;
  // bugün zaten yapılmış hareketleri atla
  const firstOpen = liveItems().findIndex(it => workDone(it) < (it.sets || 3));
  state.live.idx = Math.max(0, firstOpen);
  save(); buzz(20); openFocus();
}
const doneSetsOf = ex => { const e = state.live && state.entries.find(x => x.date===state.live.date && x.ex===ex); return e ? e.sets : []; };
const workDone = it => work(doneSetsOf(it.ex)).length;
function openFocus(){
  if (!state.live) return;
  document.body.classList.add("focus-open"); $("#focus").classList.remove("hidden");
  renderFocus(); keepAwake(true); renderLiveBar();
}
function closeFocus(){ document.body.classList.remove("focus-open"); $("#focus").classList.add("hidden"); renderLiveBar(); refreshAll(); }
$("#fMin").onclick = closeFocus;
$("#liveBar").onclick = openFocus;
function suggestFor(it){
  // önceki seansa göre kilo/tekrar önerisi ve kademeli yüklenme
  const today = state.live ? state.live.date : ymd(new Date()), c = isCardio(it.ex);
  const prev = state.entries.filter(e => e.ex===it.ex && e.date < today).sort((a,b) => b.date.localeCompare(a.date))[0];
  const range = repRange(it.reps), { lo } = range, sets = it.sets || 3;
  const ws = prev ? work(prev.sets) : [];
  const { hitTop, easy, hard, increase } = overloadDecision(ws, sets, range, c);
  const inc = increase ? overloadStep(it.ex) : 0;
  const base = ws[0];
  if (isTimed(it.ex)) {
    // süreli: hedef süreyi bütün setlerde tutturduysa +5 sn öner
    const secs = ws.map(x => +x.sec || 0), tgt = lo || 30, hit = prev && secs.length >= sets && secs.slice(0, sets).every(x => x >= tgt);
    let tmsg = prev ? `Son kez ${shortDate(prev.date)}: <b>${ws.map(x => setLabel(x, c)).join(", ")}</b>` : "";
    if (hit) tmsg += `<br><span class="up">${ic("trending-up")} Hedefi tutturdun, bugün +5 sn</span>`;
    return { w: base && +base.w ? +base.w : "", r: hit ? Math.max(...secs.slice(0, sets)) + 5 : (lo || (base && base.sec) || 30), msg: tmsg };
  }
  let msg = prev ? `Son kez ${shortDate(prev.date)}: <b>${ws.map(s => setLabel(s, c)).join(", ")}</b>` : "";
  if (hitTop) msg += `<br><span class="up">${ic("trending-up")} Hedefi tutturdun, bugün +${fmt(inc)} kg</span>`;
  else if (easy) msg += `<br><span class="up">${ic("trending-up")} Rahat geçti (RIR 3+), bugün +${fmt(inc)} kg</span>`;
  else if (hard) msg += `<br>${ic("target")} Aynı kiloyla devam, önce tekrarları tamamla`;
  return { w: base && base.w ? Math.round((+base.w + inc)*100)/100 : "", r: lo || (base ? base.r : ""), msg };
}
// uzun değerlerde (92,5 / 102,5) yazı küçülür ki dar ekranda kesilmesin
const fitNum = inp => { const n = inp.value.length; inp.style.fontSize = n >= 6 ? "21px" : n >= 5 ? "25px" : n >= 4 ? "30px" : ""; };
const stepperHTML = (k, v, unit, label) => `<div class="stepper" data-k="${k}"><button type="button" data-d="-1" aria-label="${label} azalt">${ic("minus")}</button>
  <div class="val"><input id="f_${k}" inputmode="decimal" value="${fmtIn(v)}" placeholder="0" aria-label="${label}"><span class="unit">${unit}</span></div>
  <button type="button" data-d="1" aria-label="${label} artır">${ic("plus")}</button></div>`;
function renderFocus(){
  if (!state.live) return;
  const items = liveItems();
  const idx = state.live.idx = Math.min(Math.max(0, state.live.idx || 0), Math.max(0, items.length - 1));
  const L = ssLabels(items);
  $("#fList").innerHTML = items.map((it,k) => {
    const done = workDone(it) >= (it.sets || 3);
    return `<button class="${k===idx ? "on" : ""}${done ? " done" : ""}" data-k="${k}">${done ? ic("check") : ""}${L[k] ? `<span class="ssl">${L[k]}</span>` : ""}${esc(it.ex)}</button>`;
  }).join("") + `<button data-add="1">${ic("plus")}Ekle</button>`;
  $("#fList").querySelectorAll("[data-k]").forEach(b => b.onclick = () => gotoItem(+b.dataset.k));
  $("#fList [data-add]").onclick = addFocusExercise;
  const on = $("#fList .on"); if (on) on.scrollIntoView({ block: "nearest", inline: "center" });
  tickFocus();
  if (!items.length) {
    $("#fBody").innerHTML = `<div class="f-empty">${ic("dumbbell")}<h2>Boş antrenman</h2><p class="muted">İlk hareketini ekleyerek başla.</p><button class="btn primary" id="fAddFirst">${ic("plus")}Hareket ekle</button></div>`;
    $("#fAddFirst").onclick = addFocusExercise;
    $("#fComplete").classList.add("hidden"); $(".f-nav").classList.add("hidden");
    renderFocusRest(); return;
  }
  $("#fComplete").classList.remove("hidden"); $(".f-nav").classList.remove("hidden");
  const it = items[idx], c = isCardio(it.ex), tm = isTimed(it.ex), sug = suggestFor(it), done = doneSetsOf(it.ex), wd = work(done).length;
  const target = it.sets || 3, bar = !c && !tm ? barOf(it.ex) : 0;
  const d = fDraft[it.ex] ||= (() => { const last = work(done).slice(-1)[0]; return last ? { w: last.w, r: last.sec ?? last.r } : { w: sug.w, r: sug.r }; })();
  // ısınma rehberi: henüz çalışma seti yokken, çalışma kilosuna göre
  const warmDone = done.filter(x => x.t === "w").length, workW = d.work ? d.work.w : d.w;
  const warmPlan = !c && !tm && !wd && +workW > 0 ? warmupSets(+workW, bar) : [];
  const note = state.exNotes[it.ex], m = musclesOf(it.ex);
  const goal = it.reps ? `Hedef: <b>${target} × ${esc(it.reps)}</b>` : "";
  let k = 0;
  const doneChips = done.map((s,i) => { const warm = s.t === "w", lbl = warm ? "I" : (s.t ? TYPE_LETTER[s.t] : "") + (++k);
    return `<button class="chip${warm ? " warm" : ""}" data-i="${i}" title="Seti sil">${lbl}) ${setLabel(s,c)}</button>`; }).join("");
  $("#fBody").innerHTML = `
    <div class="eyebrow">${esc(groupOf(it.ex))}${L[idx] ? ` · Süperset ${L[idx]}` : ""}</div>
    <div class="f-title"><h2>${esc(it.ex)}</h2><button class="iconbtn" id="fPrefs" title="Hareket ayarları">${ic("sliders-horizontal")}</button></div>
    <button class="f-note ghost" id="fNote" style="padding:0">${ic("pin")}<span>${note ? esc(note) : "Not ekle: koltuk ayarı, tutuş…"}</span></button>
    <div class="f-hint">${[sug.msg, goal].filter(Boolean).join("<br>") || "İlk kez yapıyorsun; rahat bir kiloyla başla."}</div>
    <div class="f-prog" aria-hidden="true">${Array.from({ length: Math.max(target, wd) }, (_, j) => `<i class="${j < wd ? "on" : j === wd ? "cur" : ""}"></i>`).join("")}</div>
    <div class="f-setlabel"><span>${wd >= target ? `Ekstra set ${wd + 1}` : `Set ${wd + 1} / ${target}`}</span><span>${esc(m.p.join(", "))}</span></div>
    <div class="steppers">${tm ? stepperHTML("w", d.w, "ek kg", "Ek ağırlık") + stepperHTML("r", d.r, "saniye", "Süre")
      : stepperHTML("w", d.w, c ? "dk" : "kg", c ? "Süre" : "Ağırlık") + stepperHTML("r", d.r, c ? "km" : "tekrar", c ? "Mesafe" : "Tekrar")}</div>
    ${bar ? `<div id="fPlates">${platesHTML(d.w, bar)}</div>` : ""}
    ${warmPlan.length ? `<div class="f-warm"><div class="f-setlabel" style="margin:0"><span>Isınma önerisi</span><span>Dokun, yüklensin</span></div><div class="chips">${warmPlan.map((x, j) => `<button class="chip${j < warmDone ? " done" : ""}" data-wi="${j}">${fmt(x.w)} × ${x.r}</button>`).join("")}</div></div>` : ""}
    ${tm ? `<div class="f-manual"><button class="ghost" id="fManual">${ic("check")}Zamanlayıcısız kaydet</button></div>` : ""}
    ${c || tm ? "" : `<div class="f-chips" id="fRirChips"><span>RIR</span>${["",0,1,2,3,4].map(v => `<button type="button" data-v="${v}" class="${String(fRir ?? "") === String(v) ? "on" : ""}">${v === "" ? "–" : v === 4 ? "4+" : v}</button>`).join("")}</div>
    <div class="f-chips" id="fTypeChips"><span>Tür</span>${[["","Normal"],["w","Isınma"],["d","Drop"],["f","Tükeniş"]].map(([t,l]) => `<button type="button" data-t="${t}" class="${fType === t ? "on" : ""}">${l}</button>`).join("")}</div>`}
    ${done.length ? `<div class="f-done"><div class="f-setlabel" style="margin:0"><span>Tamamlanan</span><span>Silmek için dokun</span></div><div class="chips">${doneChips}</div></div>` : ""}`;
  $("#fPrefs").onclick = () => openExPrefs(it);
  $("#fNote").onclick = () => editExNote(it.ex);
  $("#fBody").querySelectorAll(".stepper").forEach(st => {
    const key = st.dataset.k, inp = st.querySelector("input");
    fitNum(inp);
    inp.oninput = () => { fitNum(inp); d[key] = inp.value === "" ? "" : parseNum(inp.value); if (key === "w" && bar) $("#fPlates").innerHTML = platesHTML(d.w, bar); if (key === "w") syncWarm(); };
    st.querySelectorAll("button").forEach(btn => {
      let t1, t2;
      const step = () => {
        const s = key === "w" ? (c ? 1 : stepFor(it.ex)) : (c ? 0.5 : tm ? 5 : 1);
        const nv = Math.max(0, Math.round((parseNum(inp.value) + (+btn.dataset.d) * s) * 100) / 100);
        inp.value = fmtIn(nv); fitNum(inp); d[key] = nv; buzz(5);
        if (key === "w" && bar) $("#fPlates").innerHTML = platesHTML(nv, bar);
        if (key === "w") syncWarm();
      };
      const stop = () => { clearTimeout(t1); clearInterval(t2); };
      // basılı tutunca hızlı artar
      btn.addEventListener("pointerdown", e => { e.preventDefault(); step(); t1 = setTimeout(() => t2 = setInterval(step, 80), 420); });
      ["pointerup", "pointerleave", "pointercancel"].forEach(ev => btn.addEventListener(ev, stop));
      btn.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); step(); } });
    });
  });
  $("#fBody").querySelectorAll("#fRirChips button").forEach(b => b.onclick = () => { fRir = b.dataset.v === "" ? null : +b.dataset.v; $("#fRirChips").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); buzz(5); });
  $("#fBody").querySelectorAll("#fTypeChips button").forEach(b => b.onclick = () => { fType = b.dataset.t; $("#fTypeChips").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); buzz(5); });
  $("#fBody").querySelectorAll(".f-done [data-i]").forEach(b => b.onclick = () => removeDoneSet(+b.dataset.i));
  bindWarm();
  // ısınma çipleri çalışma kilosu değiştikçe yeniden hesaplanır (bir ısınma seti yüklendiyse sabit kalır)
  function bindWarm(){
    $("#fBody").querySelectorAll("[data-wi]").forEach(b => b.onclick = () => {
      const x = warmupSets(+(d.work ? d.work.w : d.w), bar)[+b.dataset.wi]; if (!x) return;
      d.work ||= { w: d.w, r: d.r };
      d.w = x.w; d.r = x.r; fType = "w"; buzz(8); renderFocus();
    });
  }
  function syncWarm(){
    const box = $("#fBody .f-warm .chips"); if (!box || d.work) return;
    box.innerHTML = warmupSets(+d.w, bar).map((x, j) => `<button class="chip" data-wi="${j}">${fmt(x.w)} × ${x.r}</button>`).join("");
    bindWarm();
  }
  const fm = $("#fManual"); if (fm) fm.onclick = () => completeSet();
  const prev = items[idx-1], next = items[idx+1];
  $("#fPrev").disabled = !prev; $("#fPrev span").textContent = prev ? prev.ex : "";
  $("#fNext").disabled = !next; $("#fNext span").textContent = next ? next.ex : "";
  $("#fPrev").setAttribute("aria-label", prev ? `Önceki hareket: ${prev.ex}` : "Önceki hareket yok");
  $("#fNext").setAttribute("aria-label", next ? `Sonraki hareket: ${next.ex}` : "Sonraki hareket yok");
  $("#fComplete").innerHTML = tm ? ic("play") + "Süreyi başlat" : ic("check") + (wd >= target ? "Ekstra set" : "Seti tamamla");
  renderFocusRest(); renderHold();
}
const barOf = ex => { const b = exPref(ex, "bar"); return b != null ? b : barFor(ex); };
function platesHTML(w, bar){
  w = +w || 0;
  if (!bar || !w) return "";
  if (w < bar) return `<div class="f-plates"><div class="pl-txt"><b>Plakalar</b>Bar (${fmt(bar)} kg) bu kilodan ağır</div></div>`;
  const { used, rest } = platesFor((w - bar) / 2);
  const vis = used.map(x => { const pl = PLATES.find(y => y[0] === x); return `<i style="background:${pl[1]};height:${Math.round(pl[2] * .5)}px"></i>`; }).join("");
  return `<div class="f-plates" role="img" aria-label="${used.length ? "Her tarafa " + used.map(pfmt).join(", ") + " kilogram" : "Boş bar"}"><div class="pl-vis" aria-hidden="true"><span class="pl-bar"></span>${vis}</div>
    <div class="pl-txt"><b>Her tarafa · bar ${fmt(bar)} kg</b>${used.length ? plateText(used).replace(/×/g, "×") + " kg" : "Boş bar"}${rest > 0.01 ? ` <span class="muted">(${fmt(rest * 2)} kg eksik)</span>` : ""}</div></div>`;
}

/* ---------- Süreli set zamanlayıcısı ----------
   3 saniyelik hazırlık, sonra hedef süreden geri sayım. Süre dolunca set kendiliğinden kaydedilir; erken bitirilirse geçen süre kaydedilir. */
let hold = null;
function tone(f, dur){
  if (!audio) return;
  try { const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = f; o.connect(g); g.connect(audio.destination);
    g.gain.setValueAtTime(.22, audio.currentTime); g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + dur); o.start(); o.stop(audio.currentTime + dur + .02); } catch(e){}
}
function toggleHold(){
  if (hold) { if (hold.phase === "lead") cancelHold(); else finishHold(Math.round((Date.now() - hold.t0) / 1000)); return; }
  const target = parseNum($("#f_r").value);
  if (!target) return toast("Hedef süreyi gir");
  try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch(e){}
  stopTimer();
  hold = { phase: "lead", t0: Date.now() + 3000, target, last: null };
  hold.iv = setInterval(holdTick, 100); holdTick(); keepAwake(true);
}
function holdTick(){
  const now = Date.now();
  if (hold.phase === "lead") {
    const left = Math.ceil((hold.t0 - now) / 1000);
    if (left !== hold.last && left > 0) { hold.last = left; tone(660, .12); buzz(15); }
    if (now >= hold.t0) { hold.phase = "run"; hold.last = null; tone(990, .3); buzz(60); }
  }
  if (hold.phase === "run") {
    const el = (now - hold.t0) / 1000, left = Math.ceil(hold.target - el);
    if (left <= 3 && left > 0 && left !== hold.last) { hold.last = left; tone(660, .1); }
    if (el >= hold.target) { finishHold(hold.target, true); return; }
  }
  renderHold();
}
function renderHold(){
  const box = $("#fHold"); box.classList.toggle("hidden", !hold);
  if (!hold) return;
  const now = Date.now(), lead = hold.phase === "lead";
  box.classList.toggle("lead", lead);
  const left = lead ? Math.max(1, Math.ceil((hold.t0 - now) / 1000)) : Math.max(0, Math.ceil(hold.target - (now - hold.t0) / 1000));
  $("#fHoldLbl").textContent = lead ? "Hazır ol" : "Kalan süre";
  $("#fHoldBig").textContent = lead ? left : mmss(left);
  $("#fHoldBar").style.width = lead ? "0%" : Math.min(100, (now - hold.t0) / 10 / hold.target) + "%";
  $("#fComplete").innerHTML = lead ? ic("x") + "Vazgeç" : ic("square") + "Bitir ve kaydet";
}
function cancelHold(){ clearInterval(hold.iv); hold = null; renderFocus(); }
function finishHold(secs, full){
  clearInterval(hold.iv); hold = null;
  if (full) beep();
  $("#f_r").value = String(secs);
  if (secs > 0) completeSet(); else renderFocus();
}
function tickFocus(){ if (state.live) $("#fElapsed").textContent = elapsedText(); }
function gotoItem(k){
  const items = liveItems(); if (k < 0 || k >= items.length || k === state.live.idx) return;
  if (hold) return toast("Önce süreyi bitir", "timer");
  state.live.idx = k; fType = ""; fRir = null; save(); renderFocus(); buzz(8);
  $("#fBody").scrollTop = 0;
}
$("#fPrev").onclick = () => gotoItem(state.live.idx - 1);
$("#fNext").onclick = () => gotoItem(state.live.idx + 1);
// yana kaydırarak hareketler arasında geçiş
let swX = null, swY = 0;
$("#fBody").addEventListener("touchstart", e => {
  if (e.target.closest(".stepper, .f-chips, input, button")) { swX = null; return; }
  swX = e.touches[0].clientX; swY = e.touches[0].clientY;
}, { passive: true });
$("#fBody").addEventListener("touchend", e => {
  if (swX == null) return;
  const dx = e.changedTouches[0].clientX - swX, dy = e.changedTouches[0].clientY - swY; swX = null;
  if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) gotoItem(state.live.idx + (dx < 0 ? 1 : -1));
}, { passive: true });
function addFocusExercise(){
  openPicker("Hareket ekle", n => {
    const items = liveItems(), at = items.findIndex(x => x.ex === n);
    if (at >= 0) { gotoItem(at); return; }
    items.push({ ex: n, sets: 3, reps: "" }); state.live.idx = items.length - 1; save(); renderFocus();
  });
}
$("#fComplete").onclick = () => { const it = liveItems()[state.live.idx]; if (it && isTimed(it.ex)) toggleHold(); else completeSet(); };
function completeSet(){
  const items = liveItems(), k = state.live.idx, it = items[k]; if (!it) return;
  const done = () => doneSetsOf(it.ex);
  const c = isCardio(it.ex), d = fDraft[it.ex] ||= {};
  const w = parseNum($("#f_w").value), r = parseNum($("#f_r").value);
  const tm = isTimed(it.ex);
  if (tm && !r) return toast("Süreyi gir");
  if (!w && !r) return toast(c ? "Süre ya da mesafe gir" : "Kilo ve tekrar gir");
  const set = tm ? { w, sec: r, r: 0 } : { w, r };
  if (!c && !tm && fRir != null) set.rir = fRir;
  if (!c && fType) set.t = fType;
  const before = bestOf(it.ex), beforeSec = bestSecOf(it.ex);
  if (!allEx().some(e => e.name === it.ex)) state.custom.push({ name: it.ex, group: "Diğer" });
  const e = state.entries.find(x => x.date === state.live.date && x.ex === it.ex);
  if (e) e.sets.push(set); else state.entries.push({ id: uid(), ts: Date.now(), date: state.live.date, ex: it.ex, sets: [set] });
  d.w = w; d.r = r;
  let pr = false;
  if (tm) { if (before.n && r > beforeSec && set.t !== "w") { pr = true; toast(`Yeni süre rekoru: ${fmtSec(r)}!`, "trophy"); } }
  else if (!c && set.t !== "w" && before.n) {
    if (w > before.w) { pr = true; toast(`Yeni rekor: ${fmt(w)} kg!`, "trophy"); }
    else if (r <= 12 && e1rm(w, r) > before.e + 0.05) { pr = true; toast(`Yeni 1RM rekoru: ${fmt(e1rm(w, r))} kg!`, "trophy"); }
  }
  buzz(pr ? [30, 60, 30, 60, 90] : 25);
  const warm = set.t === "w";
  fType = ""; fRir = null;
  if (warm && d.work) {
    // ısınma: sıradaki ısınma setini yükle, bittiyse çalışma kilosuna dön
    const plan = warmupSets(+d.work.w, barOf(it.ex)), nextW = plan[done().filter(x => x.t === "w").length];
    if (nextW) { d.w = nextW.w; d.r = nextW.r; fType = "w"; } else { d.w = d.work.w; d.r = d.work.r; delete d.work; }
  }
  let rest = state.autoRest && !warm;
  const L = ssLabels(items), target = x => x.sets || 3;
  const advance = () => {
    const nxt = items.findIndex((x, j) => j > k && workDone(x) < target(x));
    const any = nxt >= 0 ? nxt : items.findIndex(x => workDone(x) < target(x));
    if (any >= 0 && any !== k) { state.live.idx = any; setTimeout(() => toast(`Sıradaki: ${items[any].ex}`, "arrow-right"), pr ? 2300 : 0); }
    else if (any < 0) setTimeout(() => toast("Bütün hareketler tamam! Bitir'e basabilirsin", "biceps-flexed"), pr ? 2300 : 0);
  };
  if (!warm && L[k]) {
    // süperset: grubun bir sonraki hareketine dinlenmeden geç; tur bitince dinlen
    const g = items.map((x, j) => j).filter(j => L[j] && L[j][0] === L[k][0]);
    const nextInGroup = g.slice(g.indexOf(k) + 1).find(j => workDone(items[j]) < target(items[j]));
    if (nextInGroup != null) { state.live.idx = nextInGroup; rest = false; }
    else { const open = g.find(j => workDone(items[j]) < target(items[j])); if (open != null) state.live.idx = open; else advance(); }
  } else if (!warm && workDone(it) >= target(it)) advance();
  save();
  if (rest) startTimer(restFor(it.ex));
  renderFocus();
}
function removeDoneSet(i){
  const it = liveItems()[state.live.idx], e = state.entries.find(x => x.date === state.live.date && x.ex === it.ex);
  if (!e) return;
  const [s] = e.sets.splice(i, 1); let pos = -1;
  if (!e.sets.length) { pos = state.entries.indexOf(e); state.entries.splice(pos, 1); }
  save(); renderFocus(); buzz(15);
  undoable("Set silindi", () => { e.sets.splice(i, 0, s); if (pos >= 0) state.entries.splice(pos, 0, e); save(); renderFocus(); });
}
function editExNote(ex){
  const body = openSheet(sheetHead("Hareket notu"), `<p class="muted small" style="margin-top:0">${esc(ex)} için kalıcı not; her seferinde görünür.</p>
    <textarea id="enText" rows="3" placeholder="Koltuk 4. kademe, geniş tutuş">${esc(state.exNotes[ex] || "")}</textarea>
    <button class="btn primary block" id="enSave" style="margin-top:12px">${ic("check")}Kaydet</button>`);
  $("#enSave").onclick = () => { const v = $("#enText").value.trim(); if (v) state.exNotes[ex] = v; else delete state.exNotes[ex]; save(); closeSheet(); renderFocus(); };
}
function openExPrefs(it){
  const p = state.exPrefs[it.ex] || {};
  const opts = (vals, cur, def, f) => `<option value="">${def}</option>` + vals.map(v => `<option value="${v}"${+cur === v ? " selected" : ""}>${f(v)}</option>`).join("");
  openSheet(sheetHead(it.ex), `<div class="grid2">
      <div><label for="xpSets">Hedef set</label><select id="xpSets">${[1,2,3,4,5,6,7,8].map(v => `<option${v === (it.sets || 3) ? " selected" : ""}>${v}</option>`).join("")}</select></div>
      <div><label for="xpReps">Hedef tekrar</label><input id="xpReps" value="${esc(it.reps || "")}" placeholder="8-12"></div>
      <div><label for="xpRest">Dinlenme</label><select id="xpRest">${opts([30,45,60,90,120,150,180,240,300], p.rest, `Varsayılan (${mmss(state.rest)})`, mmss)}</select></div>
      <div><label for="xpStep">Kilo adımı</label><select id="xpStep">${opts([1,1.25,2,2.5,5], p.step, `Otomatik (${fmt(defaultStep(it.ex))} kg)`, v => fmt(v) + " kg")}</select></div>
      <div><label for="xpBar">Bar ağırlığı</label><select id="xpBar"><option value="">Otomatik (${fmt(barFor(it.ex))} kg)</option>${[20,15,10,0].map(v => `<option value="${v}"${p.bar === v ? " selected" : ""}>${v ? fmt(v) + " kg" : "Bar yok"}</option>`).join("")}</select></div>
      <div><label for="xpTimed">Kayıt türü</label><select id="xpTimed"><option value="">Otomatik (${TIMED_RE.test(it.ex) ? "süreli" : "tekrar"})</option><option value="1"${p.timed === true ? " selected" : ""}>Süreli (saniye)</option><option value="0"${p.timed === false ? " selected" : ""}>Tekrar</option></select></div>
      <div style="grid-column:1/-1"><label for="xpInc">Kademeli artış</label><select id="xpInc">${opts([1,1.25,2,2.5,5,10], p.inc, `Otomatik (${fmt(defaultInc(it.ex))} kg)`, v => "+" + fmt(v) + " kg")}</select></div>
    </div>
    <p class="muted small">Dinlenme, kilo adımı ve artış bu hareket için kalıcıdır. Hedefler sadece bu antrenmanda geçerli.</p>
    <div class="row" style="margin-top:6px"><button class="btn quiet danger" id="xpRemove">${ic("trash-2")}Çıkar</button><span class="grow"></span><button class="btn primary" id="xpSave">${ic("check")}Kaydet</button></div>`);
  $("#xpSave").onclick = () => {
    it.sets = +$("#xpSets").value; it.reps = $("#xpReps").value.trim();
    const np = { rest: +$("#xpRest").value || undefined, step: +$("#xpStep").value || undefined, inc: +$("#xpInc").value || undefined,
      bar: $("#xpBar").value === "" ? undefined : +$("#xpBar").value, timed: $("#xpTimed").value === "" ? undefined : $("#xpTimed").value === "1" };
    delete fDraft[it.ex];
    Object.keys(np).forEach(k => np[k] === undefined && delete np[k]);
    if (Object.keys(np).length) state.exPrefs[it.ex] = np; else delete state.exPrefs[it.ex];
    save(); closeSheet(); renderFocus();
  };
  $("#xpRemove").onclick = () => {
    const items = liveItems(), i = items.indexOf(it);
    items.splice(i, 1); save(); closeSheet(); renderFocus();
    undoable(`${it.ex} antrenmandan çıkarıldı`, () => { items.splice(i, 0, it); state.live.idx = i; save(); renderFocus(); });
  };
}
$("#fEnd").onclick = finishWorkout;
async function finishWorkout(){
  const { start, date } = state.live;
  const lifts = () => state.entries.filter(e => e.date === date && !isCardio(e.ex));
  const n = lifts().reduce((a, e) => a + work(e.sets).length, 0);
  if (!(await ask(`Antrenmanı bitirmek istiyor musun?\n${durText(Date.now() - start)} · ${n} çalışma seti`, "Bitir"))) return;
  const end = Date.now();
  if (state.entries.some(e => e.date === date)) state.sessions.push({ id: uid(), date, start, end, prog: state.live.prog || null });
  const vol = lifts().reduce((a, e) => a + volume(e.sets), 0);
  state.live = null; state.active = null; save();
  stopTimer(); keepAwake(false); buzz([40, 60, 40]);
  closeFocus(); showTab("home");
  setTimeout(() => toast(n ? `Antrenman bitti · ${durText(end - start)} · ${n} set · ${fmt(vol)} kg` : "Antrenman kapatıldı", n ? "biceps-flexed" : "check"), 50);
  // toast'ın ardından, ekranı meşgul etmeden
  setTimeout(() => { runSync(false); runCal(false); }, 2500);
}
function renderLiveBar(){
  const show = !!state.live && $("#focus").classList.contains("hidden");
  $("#liveBar").classList.toggle("hidden", !show); document.body.classList.toggle("has-livebar", show);
  if (show) { const it = liveItems()[state.live.idx || 0]; $("#liveBarTxt").textContent = it ? it.ex : "Antrenman sürüyor"; $("#liveBarTime").textContent = elapsedText(); }
}
setInterval(() => {
  if (!state.live) return;
  const t = elapsedText();
  $("#fElapsed").textContent = t; $("#liveBarTime").textContent = t;
  const h = $("#homeLiveT"); if (h) h.textContent = t;
}, 1000);

/* ---------- Home: Bugün ---------- */
const MONTHS_LONG = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
function todayPlan(){
  const w = WEEKDAYS.find(x => x[2] === new Date().getDay()), d = w && state.plan.days[w[0]];
  return d ? state.programs.find(p => p.id === d.prog) : null;
}
function weekProgress(){
  const load = dayLoad(), mon = mondayOf(new Date());
  const daysIn = m => { let n = 0; for (let i = 0; i < 7; i++) { const d = new Date(m); d.setDate(d.getDate() + i); if (load[ymd(d)]) n++; } return n; };
  const thisN = daysIn(mon);
  let streak = thisN >= state.goal ? 1 : 0;
  for (const m = new Date(mon); ; ) { m.setDate(m.getDate() - 7); if (daysIn(m) >= state.goal) streak++; else break; }
  const a = ymd(mon), e = new Date(mon); e.setDate(e.getDate() + 6); const b = ymd(e);
  const lifts = state.entries.filter(x => x.date >= a && x.date <= b && !isCardio(x.ex));
  return { days: thisN, streak, sets: lifts.reduce((s, x) => s + work(x.sets).length, 0), vol: lifts.reduce((s, x) => s + volume(x.sets), 0) };
}
function renderHome(){
  const now = new Date(), today = ymd(now), p = todayPlan(), trainedToday = state.entries.some(e => e.date === today);
  $("#homeDate").textContent = `${DAYS[now.getDay()]} · ${now.getDate()} ${MONTHS_LONG[now.getMonth()]}`;
  let title, sub = "", main = "";
  if (state.live) {
    const items = liveItems(), it = items[state.live.idx || 0];
    const n = state.entries.filter(e => e.date === state.live.date).reduce((a, e) => a + work(e.sets).length, 0);
    title = "Antrenman sürüyor"; sub = it ? `Sıradaki: ${it.ex}` : "";
    main = `<div class="card accent"><h2>${ic("timer")}Süre</h2><div class="bignum" id="homeLiveT">${elapsedText()}</div>
      <p class="muted" style="margin:6px 0 16px">${n} çalışma seti kaydedildi</p><button class="btn xl" id="homeResume">${ic("play")}Devam et</button></div>`;
  } else if (p) {
    title = trainedToday ? "Bugün çalıştın" : p.name; sub = trainedToday ? "Harika iş. İstersen bir antrenman daha başlatabilirsin." : "Haftalık planındaki bugünün antrenmanı.";
    const L = ssLabels(p.items);
    main = `<div class="card accent"><h2>${ic("calendar-days")}Bugünün programı</h2>
      <div class="today-list">${p.items.map((i, k) => `<div>${L[k] ? `<span class="ssl" style="background:rgba(0,0,0,.12);color:inherit">${L[k]}</span>` : ""}${esc(i.ex)}<span>${i.sets} × ${esc(i.reps || "–")}</span></div>`).join("")}</div>
      <button class="btn xl" data-start="${p.id}">${ic("play")}${trainedToday ? "Tekrar başla" : "Başla"}</button></div>`;
  } else {
    title = trainedToday ? "Bugün çalıştın" : "Serbest gün";
    sub = !state.programs.length ? "İlk programını oluştur ya da boş bir antrenmanla başla." : "Haftalık planında bugün için program yok.";
  }
  $("#homeTitle").textContent = title; $("#homeSub").textContent = sub;
  const quick = `<div class="quick" style="margin-bottom:12px">
    <button id="qEmpty">${ic("play")}Boş antrenman</button>
    <button id="qProg">${ic("clipboard-list")}Programlar</button>
    <button id="qLog">${ic("pencil-line")}Elle kayıt</button></div>`;
  // plan yoksa programlardan hızlı başlat
  const progList = !state.live && !p && state.programs.length ? `<div class="card"><h2>${ic("zap")}Hızlı başlat</h2>${state.programs.slice(0, 4).map(x => `<div class="row" style="padding:6px 0;border-top:1px solid var(--line)"><div class="grow"><b>${esc(x.name)}</b><div class="muted small">${x.items.length} hareket</div></div><button class="btn sm primary" data-start="${x.id}">${ic("play")}Başla</button></div>`).join("")}</div>` : "";
  $("#homeMain").innerHTML = main + quick + progList;
  $("#homeMain").querySelectorAll("[data-start]").forEach(b => b.onclick = () => startWorkout(b.dataset.start));
  const r = $("#homeResume"); if (r) r.onclick = openFocus;
  $("#qEmpty").onclick = () => startWorkout(null);
  $("#qProg").onclick = () => { segState.train = "prog"; showTab("train"); };
  $("#qLog").onclick = () => { segState.train = "log"; showTab("train"); };
  // bu hafta
  const w = weekProgress();
  $("#homeWeek").innerHTML = `<div class="stat"><b>${w.days}<span style="font-size:15px;color:var(--muted);text-transform:none;letter-spacing:0">/${state.goal}</span></b><span>gün</span></div>
    <div class="stat"><b>${w.streak}</b><span>hafta seri</span></div><div class="stat"><b>${w.sets}</b><span>set</span></div>`;
  $("#homeGoal").innerHTML = `<div class="f-prog" style="margin:0" aria-label="Haftalık hedef: ${w.days}/${state.goal} gün">${Array.from({ length: state.goal }, (_, i) => `<i class="${i < w.days ? "on" : ""}"></i>`).join("")}</div>
    <div class="muted small" style="margin-top:8px">${w.days >= state.goal ? "Haftalık hedefini tamamladın." : `Hedefe ${state.goal - w.days} gün kaldı.`} Bu hafta ${fmt(w.vol)} kg hacim.</div>`;
  // toparlanma
  const R = recoveryMap();
  const score = x => { const ms = [...new Set(x.items.flatMap(i => musclesOf(i.ex).p))]; return ms.length ? ms.reduce((a, m) => a + (R[m] ? R[m].pct : 1), 0) / ms.length : 0; };
  const best = state.programs.map(x => ({ x, s: score(x) })).filter(o => o.s > 0).sort((a, b) => b.s - a.s)[0];
  const tired = Object.entries(R).filter(([, v]) => v.pct < .5).map(([m]) => m);
  $("#homeRecovery").innerHTML = Object.keys(R).length ? `<div class="section-title">Toparlanma<span class="grow"></span></div><div class="card">
    ${best ? `<div class="row"><div class="grow"><div class="eyebrow">En uygun program</div><div style="font-size:20px;font-weight:800;letter-spacing:-.02em">${esc(best.x.name)}</div><div class="muted small">Kasları %${Math.round(best.s * 100)} hazır</div></div>${state.live ? "" : `<button class="btn sm" data-start="${best.x.id}">${ic("play")}Başla</button>`}</div>` : ""}
    ${tired.length ? `<div class="hint">${ic("battery-low")} Dinlenmesi gereken: <b>${esc(tired.join(", "))}</b></div>` : `<div class="hint good">${ic("battery-full")} Bütün kasların hazır görünüyor.</div>`}</div>` : "";
  $("#homeRecovery").querySelectorAll("[data-start]").forEach(b => b.onclick = () => startWorkout(b.dataset.start));
  // son antrenman
  const lastDate = state.entries.reduce((m, e) => e.date > m ? e.date : m, "");
  if (lastDate) {
    const list = state.entries.filter(e => e.date === lastDate).sort((a, b) => a.ts - b.ts), lifts = list.filter(e => !isCardio(e.ex));
    const ss = state.sessions.filter(s => s.date === lastDate), dur = ss.reduce((a, s) => a + s.end - s.start, 0);
    $("#homeLast").innerHTML = `<div class="section-title">Son antrenman<span class="grow"></span></div><div class="card">
      <div class="row" style="margin-bottom:10px"><div class="grow"><div style="font-weight:800;font-size:17px;letter-spacing:-.02em">${lastDate === today ? "Bugün" : niceDate(lastDate)}</div>
      <div class="muted small">${lifts.reduce((a, e) => a + work(e.sets).length, 0)} set · ${fmt(lifts.reduce((a, e) => a + volume(e.sets), 0))} kg${dur ? " · " + durText(dur) : ""}</div></div>
      <button class="ghost" id="homeLastOpen">Ayrıntı${ic("chevron-right")}</button></div>
      <div class="chips">${list.map(e => `<span class="chip">${esc(e.ex)} · ${work(e.sets).length || e.sets.length}</span>`).join("")}</div></div>`;
    $("#homeLastOpen").onclick = () => { selDay = lastDate; const d = parse(lastDate); calMonth = new Date(d.getFullYear(), d.getMonth(), 1); showTab("history"); };
  } else $("#homeLast").innerHTML = "";
  renderBackupBanner();
}

/* ---------- History: aylık takvim ---------- */
let calMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selDay = ymd(new Date());
$("#calPrev").onclick = () => { calMonth.setMonth(calMonth.getMonth() - 1); renderHistory(); };
$("#calNext").onclick = () => { calMonth.setMonth(calMonth.getMonth() + 1); renderHistory(); };
function renderHistory(){
  const load = dayLoad(), y = calMonth.getFullYear(), m = calMonth.getMonth(), key = `${y}-${pad(m + 1)}`, today = ymd(new Date());
  const days = Object.keys(load).filter(k => k.startsWith(key)).length;
  const sets = state.entries.filter(e => e.date.startsWith(key) && !isCardio(e.ex)).reduce((a, e) => a + work(e.sets).length, 0);
  $("#calMonth").textContent = `${MONTHS_LONG[m]} ${y}`;
  $("#calTitle").textContent = `${days} antrenman`;
  $("#calSub").textContent = `${MONTHS_LONG[m]} ${y} · ${sets} çalışma seti`;
  const start = mondayOf(new Date(y, m, 1));
  let html = ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"].map(d => `<div class="wd">${d}</div>`).join("");
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    if (i % 7 === 0 && i >= 28 && d.getMonth() !== m) break;
    const k = ymd(d), v = load[k] || 0, lv = !v ? 0 : v < 10 ? 1 : v < 20 ? 2 : v < 30 ? 3 : 4;
    html += `<button class="${d.getMonth() !== m ? "out " : ""}${v ? `has l${lv} ` : ""}${k === today ? "today " : ""}${k === selDay ? "sel" : ""}" style="${v ? `--lv:${lv}` : ""}" data-d="${k}" aria-label="${niceDate(k)}${v ? `, ${v} set` : ""}" aria-pressed="${k === selDay}">${d.getDate()}</button>`;
  }
  $("#calGrid").innerHTML = html;
  $("#calGrid").querySelectorAll("[data-d]").forEach(b => b.onclick = () => { selDay = b.dataset.d; renderHistory(); });
  const list = state.entries.filter(e => e.date === selDay).sort((a, b) => a.ts - b.ts);
  $("#hdTitle").textContent = selDay === today ? "Bugün" : niceDate(selDay);
  const ss = state.sessions.filter(s => s.date === selDay);
  $("#hdSess").innerHTML = ss.length ? `${ic("timer")} Antrenman süresi: ${durText(ss.reduce((a, s) => a + s.end - s.start, 0))}` : "";
  $("#hdList").innerHTML = list.length ? list.map(e => entryHTML(e, true)).join("") : emptyHTML("calendar-days", "Bu gün kayıt yok", "Elle eklemek için + düğmesine dokun.");
  $("#hdCal").classList.toggle("hidden", !list.length || autoLogged(ss));
  bindEntryActions($("#hdList"), renderHistory);
}
$("#hdCal").onclick = () => calDay(selDay);
$("#hdAdd").onclick = () => { segState.train = "log"; showTab("train"); resetEditor(); $("#logDate").value = selDay; renderDay(); updateHint(); saveDraft(); };

/* ---------- Week ---------- */
let weekStart = mondayOf(new Date());
$("#wPrev").onclick = () => { weekStart.setDate(weekStart.getDate()-7); renderWeek(); };
$("#wNext").onclick = () => { weekStart.setDate(weekStart.getDate()+7); renderWeek(); };
$("#wToday").onclick = () => { weekStart = mondayOf(new Date()); renderWeek(); };
function renderWeek(){
  const end = new Date(weekStart); end.setDate(end.getDate()+6);
  const a = ymd(weekStart), b = ymd(end);
  $("#wLabel").textContent = `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()]} – ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
  const list = state.entries.filter(e => e.date >= a && e.date <= b);
  const lifts = list.filter(e => !isCardio(e.ex));
  $("#sDays").textContent = new Set(list.map(e => e.date)).size;
  $("#sSets").textContent = lifts.reduce((n,e) => n+work(e.sets).length, 0);
  $("#sVol").textContent = fmt(lifts.reduce((n,e) => n+volume(e.sets), 0));
  const ms_ = state.sessions.filter(s => s.date >= a && s.date <= b).reduce((t,s) => t + s.end - s.start, 0);
  $("#sTime").textContent = ms_ ? durText(ms_) : "–";
  renderConsistency();

  // kas analizi
  const ms = {};
  lifts.forEach(e => { const n = work(e.sets).length, m = musclesOf(e.ex); m.p.forEach(x => ms[x] = (ms[x]||0) + n); m.s.forEach(x => ms[x] = (ms[x]||0) + n/2); });
  const shown = MUSCLE_ORDER.filter(m => ms[m] || ["Göğüs","Lat","Ön Omuz","Yan Omuz","Arka Omuz","Biceps","Triceps","Quadriceps","Hamstring","Kalça","Baldır","Karın"].includes(m));
  const scale = Math.max(24, ...Object.values(ms));
  $("#wMuscles").innerHTML = lifts.length ? shown.map(m => {
    const v = ms[m] || 0, cls = v >= 10 && v <= 20 ? "ok" : "";
    return `<div class="mbar"><span>${m}</span><div class="track"><div class="zone" style="left:${10/scale*100}%;width:${10/scale*100}%"></div><i class="${cls}" style="width:${v/scale*100}%"></i></div><b>${fmt(v)}</b></div>`;
  }).join("") + muscleAdvice(ms) : `<div class="empty">Bu hafta kayıt yok</div>`;

  const byEx = {};
  list.forEach(e => {
    const o = byEx[e.ex] ||= { sets:0, reps:0, max:0, vol:0, mins:0, km:0, secs:0, cardio:isCardio(e.ex), timed:isTimed(e.ex) };
    (o.cardio ? e.sets : work(e.sets)).forEach(s => { o.sets++; o.reps += +s.r||0; o.max = Math.max(o.max, +s.w||0); o.vol += (+s.w||0)*(+s.r||0); o.mins += +s.w||0; o.km += +s.r||0; o.secs += +s.sec||0; });
  });
  const rows = Object.entries(byEx).sort((x,y) => groupOf(x[0]).localeCompare(groupOf(y[0]),"tr") || x[0].localeCompare(y[0],"tr"));
  $("#wTable").innerHTML = rows.length
    ? `<tr><th>Hareket</th><th>Set</th><th>Tekrar</th><th>Maks kg</th><th>Hacim</th></tr>` + rows.map(([n,o]) => o.cardio
        ? `<tr><td>${esc(n)}</td><td>${o.sets}</td><td colspan="3">${fmt(o.mins)} dk${o.km ? " · "+fmt(o.km)+" km" : ""}</td></tr>`
        : o.timed ? `<tr><td>${esc(n)}</td><td>${o.sets}</td><td colspan="3">${fmtSec(o.secs)} toplam${o.max ? ` · +${fmt(o.max)} kg` : ""}</td></tr>`
        : `<tr><td>${esc(n)}</td><td>${o.sets}</td><td>${o.reps}</td><td>${fmt(o.max)}</td><td>${fmt(o.vol)}</td></tr>`).join("")
    : `<tr><td class="empty">Bu hafta kayıt yok</td></tr>`;

  let html = "";
  for (let i=0;i<7;i++){
    const d = new Date(weekStart); d.setDate(d.getDate()+i); const k = ymd(d);
    const es = list.filter(e => e.date===k).sort((x,y) => x.ts-y.ts);
    if (es.length) html += `<h3 style="font-size:14px;margin:14px 0 2px">${niceDate(k)}</h3>` + es.map(e => entryHTML(e,false)).join("");
  }
  $("#wDays").innerHTML = html || `<div class="empty">Bu hafta antrenman yok</div>`;
}
/* ---------- Consistency (heatmap, goal, streak) ---------- */
const GOAL_WEEKS = 26;
$("#goalSel").innerHTML = [1,2,3,4,5,6,7].map(n => `<option value="${n}">${n} gün</option>`).join("");
$("#goalSel").onchange = () => { state.goal = +$("#goalSel").value; save(); renderConsistency(); };
function dayLoad(){
  const m = {};
  state.entries.forEach(e => { m[e.date] = (m[e.date]||0) + (isCardio(e.ex) ? 3 : work(e.sets).length); });
  return m;
}
function renderConsistency(){
  $("#goalSel").value = state.goal;
  const load = dayLoad(), today = new Date(); today.setHours(0,0,0,0);
  const thisMon = mondayOf(today), start = new Date(thisMon); start.setDate(start.getDate() - (GOAL_WEEKS-1)*7);
  let cells = "";
  for (let d = new Date(start); d <= new Date(thisMon.getTime() + 6*864e5); d.setDate(d.getDate()+1)) {
    const k = ymd(d), v = load[k] || 0, fut = d > today;
    const lv = !v ? "" : v < 10 ? "l1" : v < 20 ? "l2" : v < 30 ? "l3" : "l4";
    cells += `<i class="${lv}${k===ymd(today) ? " today" : ""}${fut ? " fut" : ""}" title="${shortDate(k)}: ${v ? v + " set" : "dinlenme"}"></i>`;
  }
  $("#heat").innerHTML = cells;
  $("#heat").scrollLeft = $("#heat").scrollWidth;
  // haftalık hedef serisi: bu hafta henüz tamamlanmadıysa seri bozulmuş sayılmaz
  const daysIn = mon => { let n = 0; for (let i=0;i<7;i++){ const d = new Date(mon); d.setDate(d.getDate()+i); if (load[ymd(d)]) n++; } return n; };
  const firstDate = state.entries.reduce((m,e) => e.date < m ? e.date : m, "9999");
  const thisN = daysIn(thisMon);
  $("#gWeek").textContent = `${thisN}/${state.goal}`;
  let streak = thisN >= state.goal ? 1 : 0;
  for (const mon = new Date(thisMon); ; ) { mon.setDate(mon.getDate()-7); if (daysIn(mon) >= state.goal) streak++; else break; }
  // en uzun seri: ilk kayıttan bu haftaya kadar tara
  let best = 0, run = 0;
  for (const mon = mondayOf(firstDate === "9999" ? today : parse(firstDate)); mon <= thisMon; mon.setDate(mon.getDate()+7)) {
    run = daysIn(mon) >= state.goal ? run+1 : 0; best = Math.max(best, run);
  }
  $("#gStreak").textContent = streak;
  $("#gBest").textContent = best;
}
function muscleAdvice(ms){
  const main = ["Göğüs","Lat","Yan Omuz","Arka Omuz","Biceps","Triceps","Quadriceps","Hamstring","Kalça","Baldır"];
  const low = main.filter(m => (ms[m]||0) < 10), high = main.filter(m => (ms[m]||0) > 20);
  let t = "";
  if (low.length) t += `<div class="hint">${ic("arrow-down")} 10 setin altında: <b>${low.join(", ")}</b></div>`;
  if (high.length) t += `<div class="hint">${ic("arrow-up")} 20 setin üstünde (toparlanmaya dikkat): <b>${high.join(", ")}</b></div>`;
  return t;
}

/* ---------- History ---------- */
function renderHistSelect(){
  const sel = $("#histEx"), cur = sel.value;
  const names = [...new Set(state.entries.map(e => e.ex))].sort((a,b) => a.localeCompare(b,"tr"));
  sel.innerHTML = names.length ? names.map(n => `<option>${esc(n)}</option>`).join("") : `<option value="">Henüz kayıt yok</option>`;
  if (names.includes(cur)) sel.value = cur;
  renderHist();
}
$("#histEx").onchange = renderHist;
document.querySelectorAll('input[name=hMetric]').forEach(r => r.onchange = renderHist);
function sessionValue(e, metric, c){
  if (c) return e.sets.reduce((a,s)=>a+(+s.w||0),0);
  const ws = work(e.sets);
  if (isTimed(e.ex)) return Math.max(0, ...ws.map(s => +s.sec||0));
  if (metric === "e") return Math.max(0, ...ws.filter(s => s.r<=12).map(s => e1rm(+s.w||0, +s.r||0)));
  if (metric === "v") return volume(e.sets);
  return Math.max(0, ...ws.map(s => +s.w||0));
}
function renderHist(){
  const ex = $("#histEx").value, c = isCardio(ex), tm = isTimed(ex);
  const metric = document.querySelector('input[name=hMetric]:checked').value;
  const list = state.entries.filter(e => e.ex===ex).sort((a,b) => a.date.localeCompare(b.date));
  const pts = list.map(e => ({ date:e.date, v: sessionValue(e, metric, c) })).filter(p => p.v > 0);
  $("#hChartTitle").textContent = c ? "Gelişim (seans süresi, dk)" : tm ? "Gelişim (en uzun set, sn)" : ({w:"Gelişim (seanstaki en ağır set, kg)", e:"Gelişim (tahmini 1RM, kg)", v:"Gelişim (seans hacmi, kg)"})[metric];
  $("#hMax").nextElementSibling.textContent = tm ? "rekor süre" : "rekor kg";

  // gelişim tahmini: son 8 seansın tahmini 1RM eğilimi
  let proj = null; const fc = $("#hForecast"); fc.classList.add("hidden");
  if (!c && !tm && ex) {
    const ep = list.map(e => ({ t: parse(e.date).getTime()/864e5, v: sessionValue(e, "e", false) })).filter(p => p.v > 0).slice(-8);
    if (ep.length >= 3 && ep[ep.length-1].t - ep[0].t >= 7) {
      const n = ep.length, mx = ep.reduce((a,p)=>a+p.t,0)/n, my = ep.reduce((a,p)=>a+p.v,0)/n;
      const slope = ep.reduce((a,p)=>a+(p.t-mx)*(p.v-my),0) / ep.reduce((a,p)=>a+(p.t-mx)**2,0);
      const last = ep[n-1].t, pred = my + slope*(last+28-mx);
      if (slope > 0.005) {
        fc.innerHTML = `${ic("trending-up")} Son ${n} seansa göre tahmini 1RM'in haftada ortalama <b>+${fmt(slope*7)} kg</b> artıyor. Bu hızla 4 hafta sonra tahmini 1RM: <b>${fmt(pred)} kg</b>.`;
        if (metric === "e") { const d = new Date(last*864e5); d.setDate(d.getDate()+28); proj = { date: ymd(new Date(d.getFullYear(), d.getMonth(), d.getDate())), v: pred }; }
      } else fc.innerHTML = `${ic("activity")} Son ${n} seansta tahmini 1RM artmıyor. Plato olabilir: tekrar aralığını, set sayısını ya da programı değiştirmeyi düşünebilirsin.`;
      fc.classList.remove("hidden");
    }
  }
  $("#histChart").innerHTML = chart(pts, proj);
  const allSets = list.flatMap(e => work(e.sets));
  $("#hMax").textContent = allSets.length && tm ? fmtSec(Math.max(...allSets.map(s => +s.sec||0))) : allSets.length && !c ? fmt(Math.max(...allSets.map(s => +s.w||0))) : "–";
  $("#h1rm").textContent = allSets.length && !c && !tm ? fmt(Math.max(0, ...allSets.filter(s => s.r<=12).map(s => e1rm(+s.w||0, +s.r||0)))) : "–";
  $("#hCount").textContent = list.length;
  // rekor setleri işaretle (ısınma setleri hariç)
  let best = 0; const prMap = {};
  if (!c) list.forEach(e => { const set = new Set(); e.sets.forEach((s,i) => { if (s.t !== "w" && (+s.w||0) > best) { if (best > 0) set.add(i); best = +s.w||0; } }); prMap[e.id] = set; });
  $("#histList").innerHTML = list.length ? list.slice().reverse().map(e => `<div style="margin-top:8px" class="muted small">${niceDate(e.date)}</div>` + entryHTML(e,false,prMap[e.id])).join("") : `<div class="empty">Kayıt yok</div>`;
}
function chart(pts, proj){
  if (pts.length < 2) return `<div class="empty">${pts.length ? "Grafik için en az 2 kayıt gerekir" : "Kayıt yok"}</div>`;
  const W=600,H=190,L=38,R=12,T=12,B=22;
  const ts = pts.map(p => parse(p.date).getTime()), t0 = ts[0], t1 = proj ? parse(proj.date).getTime() : ts[ts.length-1];
  const vs = pts.map(p => p.v).concat(proj ? [proj.v] : []);
  let lo = Math.min(...vs), hi = Math.max(...vs); if (lo===hi){ lo-=1; hi+=1; }
  const pad = (hi-lo)*0.08; lo -= pad; hi += pad;
  const x = t => L + (t1===t0 ? 0 : (t-t0)*(W-L-R)/(t1-t0)), y = v => T + (hi-v)*(H-T-B)/(hi-lo);
  const path = pts.map((p,i) => (i?"L":"M")+x(ts[i]).toFixed(1)+","+y(p.v).toFixed(1)).join("");
  const mid = (lo+hi)/2;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Gelişim grafiği">
    ${[hi,mid,lo].map(v => `<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L-6}" y="${y(v)+3}" text-anchor="end">${fmt(v)}</text>`).join("")}
    <path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>
    ${proj ? `<line x1="${x(ts[ts.length-1])}" y1="${y(pts[pts.length-1].v)}" x2="${x(t1)}" y2="${y(proj.v)}" stroke="var(--accent)" stroke-width="2" stroke-dasharray="5 5"/>
      <circle cx="${x(t1)}" cy="${y(proj.v)}" r="4.5" fill="var(--card)" stroke="var(--accent)" stroke-width="2"><title>Tahmin ${shortDate(proj.date)}: ${fmt(proj.v)}</title></circle>` : ""}
    ${pts.map((p,i) => `<circle cx="${x(ts[i])}" cy="${y(p.v)}" r="3.5" fill="var(--accent)"><title>${shortDate(p.date)}: ${fmt(p.v)}</title></circle>`).join("")}
    <text x="${L}" y="${H-5}">${shortDate(pts[0].date)}</text><text x="${W-R}" y="${H-5}" text-anchor="end">${proj ? "tahmin " + shortDate(proj.date) : shortDate(pts[pts.length-1].date)}</text></svg>`;
}

/* ---------- Records ---------- */
const REP_COLS = [1, 3, 5, 8, 10, 12];
function renderRecords(){
  const by = {};
  state.entries.filter(e => !isCardio(e.ex)).forEach(e => work(e.sets).forEach(s => {
    const o = by[e.ex] ||= { reps: {}, e1: 0 };
    const w = +s.w||0, r = +s.r||0; if (!w || !r) return;
    // r tekrar yapılan kilo, r'den az tekrar sayıları için de geçerli bir rekordur
    REP_COLS.forEach(n => { if (r >= n && w > (o.reps[n]||0)) o.reps[n] = w; });
    if (r <= 12) o.e1 = Math.max(o.e1, e1rm(w, r));
  }));
  const names = Object.keys(by).sort((a,b) => groupOf(a).localeCompare(groupOf(b),"tr") || a.localeCompare(b,"tr"));
  $("#recTable").innerHTML = names.length
    ? `<tr><th>Hareket</th>${REP_COLS.map(n => `<th>${n}T</th>`).join("")}<th>1RM≈</th></tr>` + names.map(n => `<tr class="click" data-ex="${esc(n)}"><td>${esc(n)}</td>${REP_COLS.map(c => `<td>${by[n].reps[c] ? fmt(by[n].reps[c]) : "–"}</td>`).join("")}<td><b>${by[n].e1 ? fmt(by[n].e1) : "–"}</b></td></tr>`).join("")
    : `<tr><td class="empty">Henüz kayıt yok</td></tr>`;
  $("#recTable").querySelectorAll("[data-ex]").forEach(tr => tr.onclick = () => {
    segState.stats = "hist"; renderSeg("stats"); $("#histEx").value = tr.dataset.ex; renderHist(); scrollTo(0,0);
  });
  // kronolojik tarama ile kırılan ağırlık rekorları
  const best = {}, events = [];
  state.entries.filter(e => !isCardio(e.ex)).sort((a,b) => a.date.localeCompare(b.date) || a.ts-b.ts).forEach(e => {
    const top = Math.max(0, ...work(e.sets).map(s => +s.w||0));
    if (top > (best[e.ex]||0)) { if (best[e.ex]) events.push({ date: e.date, ex: e.ex, w: top, prev: best[e.ex] }); best[e.ex] = top; }
  });
  $("#recRecent").innerHTML = events.length ? events.slice(-10).reverse().map(ev => `<div class="entry"><div class="row"><div class="grow"><div class="t">${ic("trophy", "acc")} ${esc(ev.ex)}</div><div class="g">${niceDate(ev.date)}</div></div>
    <div style="text-align:right"><b>${fmt(ev.w)} kg</b><div class="g">+${fmt(ev.w - ev.prev)} kg</div></div></div></div>`).join("")
    : `<div class="empty">Henüz kırılan rekor yok. İlk kayıttan sonraki her ağırlık rekoru burada görünür.</div>`;
}

/* ---------- Recovery ---------- */
const recoveryMap = () => recoveryMapCore({ entries: state.entries, sessions: state.sessions, isCardio, musclesOf });
function renderRecovery(){
  const R = recoveryMap();
  const shown = MUSCLE_ORDER.filter(m => R[m] || ["Göğüs","Lat","Ön Omuz","Yan Omuz","Arka Omuz","Biceps","Triceps","Quadriceps","Hamstring","Kalça","Baldır","Karın"].includes(m));
  $("#restList").innerHTML = shown.map(m => {
    const r = R[m];
    if (!r) return `<div class="rec"><span>${m}</span><div class="track"></div><span class="st muted">kayıt yok</span></div>`;
    const cls = r.pct >= 1 ? "st-ok" : r.pct >= .5 ? "st-mid" : "st-low";
    const color = r.pct >= 1 ? "var(--good)" : r.pct >= .5 ? "var(--warn)" : "var(--danger)";
    const ago = r.hrs < 24 ? `${Math.round(r.hrs)} sa önce` : `${Math.floor(r.hrs/24)} gün önce`;
    return `<div class="rec" title="Son: ${shortDate(r.date)} · ${fmt(r.sets)} etkili set"><span>${m}<br><span class="muted" style="font-size:11px">${ago} · ${fmt(r.sets)} set</span></span>
      <div class="track"><i style="width:${r.pct*100}%;background:${color}"></i></div><span class="st ${cls}">${r.pct >= 1 ? "Hazır" : r.pct >= .5 ? "Toparlanıyor" : "Yorgun"}</span></div>`;
  }).join("");
  // en hazır programı öner: ana kasların ortalama toparlanması
  const score = p => { const ms = [...new Set(p.items.flatMap(i => musclesOf(i.ex).p))]; return ms.length ? ms.reduce((a,m) => a + (R[m] ? R[m].pct : 1), 0) / ms.length : 0; };
  const ranked = state.programs.map(p => ({ p, s: score(p) })).filter(x => x.s > 0).sort((a,b) => b.s - a.s);
  const ready = shown.filter(m => !R[m] || R[m].pct >= 1);
  let html = "";
  if (ranked.length) html += `<div class="hint good">${ic("lightbulb")} Bugün en uygun program: <b>${esc(ranked[0].p.name)}</b> (kasları %${Math.round(ranked[0].s*100)} hazır)</div>`;
  if (ready.length) html += `<div class="hint">Hazır kaslar: ${ready.join(", ")}</div>`;
  $("#restSuggest").innerHTML = html + `<div style="height:8px"></div>`;
}

/* ---------- Power score ---------- */
const LIFTS = [
  { key:"squat", label:"Squat", names:["Back Squat","High-Bar Squat","Low-Bar Squat"] },
  { key:"bench", label:"Bench Press", names:["Bench Press (Barbell)"] },
  { key:"dead", label:"Deadlift", names:["Deadlift","Sumo Deadlift"] },
  { key:"ohp", label:"Overhead Press", names:["Overhead Press (Barbell)"] },
  { key:"row", label:"Barbell Row", names:["Barbell Row","Pendlay Row"] },
  { key:"pull", label:"Barfiks (vücut + ek ağırlık)", names:["Barfiks (Pull-up)","Ağırlıklı Barfiks","Chin-up"], bw:true },
];
// 1RM / vücut ağırlığı eşikleri: Başlangıç, Acemi, Orta, İleri, Elit (yaklaşık)
const STD = {
  m: { squat:[0.75,1.25,1.5,2.25,2.75], bench:[0.5,0.75,1.25,1.75,2.0], dead:[1.0,1.5,2.0,2.5,3.0], ohp:[0.35,0.55,0.8,1.05,1.35], row:[0.5,0.75,1.0,1.5,1.75], pull:[1.0,1.1,1.3,1.6,1.85] },
  f: { squat:[0.5,0.75,1.25,1.5,2.0], bench:[0.25,0.5,0.75,1.0,1.5], dead:[0.5,1.0,1.25,1.75,2.5], ohp:[0.2,0.35,0.5,0.75,1.0], row:[0.25,0.4,0.65,0.9,1.2], pull:[0.85,1.0,1.15,1.35,1.6] }
};
const LEVELS = ["Yeni başlayan","Başlangıç","Acemi","Orta","İleri","Elit"];
const latestWeight = () => { const b = state.body.filter(x => x.weight).sort((a,b) => b.date.localeCompare(a.date))[0]; return b ? b.weight : null; };
const bodyweight = () => latestWeight() || parseFloat(state.profile.bw) || 0;
$("#pfSex").onchange = () => { state.profile.sex = $("#pfSex").value; save(); renderPower(); };
$("#pfBw").oninput = () => { state.profile.bw = $("#pfBw").value; save(); renderPower(true); };
function renderPower(keepInput){
  $("#pfSex").value = state.profile.sex;
  const lw = latestWeight();
  if (!keepInput) $("#pfBw").value = lw || state.profile.bw || "";
  $("#pfBw").disabled = !!lw;
  $("#pfBwNote").textContent = lw ? `Vücut takibindeki son kilon kullanılıyor (${fmt(lw)} kg). Değiştirmek için Diğer → Vücut'a yeni ölçü gir.` : "İpucu: Diğer → Vücut'ta kilonu kaydedersen buradaki değer otomatik güncellenir.";
  const bw = bodyweight(), std = STD[state.profile.sex];
  if (!bw) { $("#pwScore").textContent = "–"; $("#pwLevel").textContent = "Güç skoru"; $("#pwSub").textContent = "Skor için vücut ağırlığını gir."; $("#pwLifts").innerHTML = ""; return; }
  const res = LIFTS.map(L => {
    let best = 0, date = "";
    state.entries.forEach(e => { if (L.names.includes(e.ex)) work(e.sets).forEach(s => {
      if (s.r < 1 || s.r > 10) return;
      const v = e1rm((+s.w||0) + (L.bw ? bw : 0), +s.r);
      if (v > best) { best = v; date = e.date; }
    }); });
    if (!best) return { L };
    const ratio = best / bw, sc = liftScore(ratio, std[L.key]);
    return { L, best, date, ratio, ...sc };
  });
  const done = res.filter(r => r.best);
  if (done.length) {
    const avg = done.reduce((a,r)=>a+r.s,0)/done.length;
    $("#pwScore").textContent = Math.round(avg);
    $("#pwLevel").textContent = LEVELS[Math.min(5, Math.floor(avg/20))];
    $("#pwSub").textContent = `${done.length}/${LIFTS.length} temel hareketten · ${fmt(bw)} kg vücut ağırlığı`;
  } else { $("#pwScore").textContent = "–"; $("#pwLevel").textContent = "Henüz veri yok"; $("#pwSub").textContent = "Aşağıdaki hareketlerden 1–10 tekrarlık set kaydet."; }
  $("#pwLifts").innerHTML = res.map(r => r.best ? `<div class="lift">
      <div class="row"><b class="grow">${r.L.label}</b><span class="lv">${LEVELS[r.lv]}</span><b style="font-variant-numeric:tabular-nums">${Math.round(r.s)}</b></div>
      <div class="muted small">Tahmini 1RM ${fmt(r.best)} kg · ${fmt(r.ratio)}× vücut ağırlığı · ${shortDate(r.date)}${r.lv<5 ? ` · sonraki seviye: ${fmt(std[r.L.key][r.lv]*bw)} kg` : ""}</div>
      <div class="pb"><i style="width:${r.s}%"></i></div></div>`
    : `<div class="lift"><div class="row"><b class="grow muted">${r.L.label}</b><span class="muted small">kayıt yok</span></div></div>`).join("");
}

/* ---------- Library ---------- */
function groups(){ return [...Object.keys(LIB), "Diğer"]; }
$("#cGroup").innerHTML = groups().map(g => `<option>${esc(g)}</option>`).join("");
$("#libEquip").innerHTML = `<option value="">Tüm ekipmanlar</option>` + EQUIPS.map(e => `<option>${e}</option>`).join("");
$("#libSearch").addEventListener("input", renderLib);
$("#libEquip").onchange = renderLib;
$("#libHome").onchange = renderLib;
function renderLib(){
  const q = $("#libSearch").value.trim().toLocaleLowerCase("tr"), eqf = $("#libEquip").value, home = $("#libHome").checked;
  const ex = allEx().map(e => ({ ...e, m: musclesOf(e.name), eq: equipOf(e.name) })).filter(e => {
    if (eqf && e.eq !== eqf) return false;
    if (home && !HOME.includes(e.eq)) return false;
    if (!q) return true;
    return [e.name, e.group, e.eq, ...e.m.p, ...e.m.s].join(" ").toLocaleLowerCase("tr").includes(q);
  });
  const counts = {}; state.entries.forEach(e => counts[e.ex] = (counts[e.ex]||0)+1);
  const open = q || eqf || home;
  $("#libList").innerHTML = groups().map(g => {
    const items = ex.filter(e => e.group===g); if (!items.length) return "";
    return `<details ${open ? "open" : ""}><summary>${esc(g)} <span>(${items.length})</span></summary>` + items.map(e =>
      `<div class="exitem"><div class="grow"><div>${esc(e.name)}${counts[e.name] ? ` <span class="muted small">· ${counts[e.name]} kayıt</span>` : ""}</div>
        <div class="ms"><span class="tag">${e.eq}</span>${e.m.p.length ? `<b>${e.m.p.join(", ")}</b>` : ""}${e.m.s.length ? ` · yardımcı: ${e.m.s.join(", ")}` : ""}</div></div>
       ${e.custom ? `<button class="iconbtn danger" data-rm="${esc(e.name)}" title="Listeden kaldır">${ic("trash-2")}</button>` : ""}
       <a class="iconbtn" title="Nasıl yapılır? (internet gerekir)" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(e.name + " exercise form")}">${ic("circle-play")}</a>
       <button class="iconbtn" data-use="${esc(e.name)}" title="${state.live ? "Antrenmana ekle" : "Bu hareketi kaydet"}">${ic("circle-plus")}</button></div>`).join("") + `</details>`;
  }).join("") || emptyHTML("search", "Sonuç yok", "Başka bir kelimeyle ara ya da filtreleri kaldır.");
  $("#libList").querySelectorAll("[data-use]").forEach(b => b.onclick = () => {
    const n = b.dataset.use;
    if (state.live) { const items = liveItems(); let i = items.findIndex(x => x.ex === n); if (i < 0) { items.push({ ex: n, sets: 3, reps: "" }); i = items.length - 1; } state.live.idx = i; save(); openFocus(); return; }
    segState.train = "log"; showTab("train"); resetEditor(); $("#logEx").value = n; $("#logEx").dispatchEvent(new Event("input"));
    $("#setRows .w").focus();
  });
  $("#libList").querySelectorAll("[data-rm]").forEach(b => b.onclick = () => {
    const n = b.dataset.rm, i = state.custom.findIndex(c => c.name === n), [c] = state.custom.splice(i, 1);
    save(); refreshDatalist(); renderLib();
    undoable(`"${n}" kaldırıldı`, () => { state.custom.splice(i, 0, c); save(); refreshDatalist(); renderLib(); });
  });
}
$("#cAdd").onclick = () => {
  const name = $("#cName").value.trim(); if (!name) return toast("Hareketin adını yaz");
  if (allEx().some(e => e.name.toLocaleLowerCase("tr")===name.toLocaleLowerCase("tr"))) return toast("Bu hareket zaten var");
  state.custom.push({ name, group: $("#cGroup").value }); save(); refreshDatalist();
  $("#cName").value = ""; toast("Eklendi", "check"); renderLib();
};

/* ---------- Body ---------- */
const BODY = [["weight","Kilo","kg"],["fat","Yağ oranı","%"],["waist","Bel","cm"],["chest","Göğüs","cm"],["arm","Kol","cm"],["thigh","Bacak","cm"],["hip","Kalça","cm"]];
$("#bMetric").innerHTML = BODY.map(([k,l,u]) => `<option value="${k}">${l} (${u})</option>`).join("");
$("#bMetric").onchange = renderBody;
$("#bSave").onclick = () => {
  const date = $("#bDate").value; if (!date) return toast("Tarih seç");
  const rec = { date }; let any = false;
  BODY.forEach(([k]) => { const v = parseFloat($("#b_"+k).value); if (v > 0) { rec[k] = v; any = true; } });
  if (!any) return toast("En az bir ölçü gir");
  const ex = state.body.find(b => b.date===date);
  if (ex) Object.assign(ex, rec); else state.body.push(rec);
  save(); BODY.forEach(([k]) => $("#b_"+k).value = ""); toast("Ölçü kaydedildi", "check"); renderBody();
};
function renderBody(){
  if (!$("#bDate").value) $("#bDate").value = ymd(new Date());
  const k = $("#bMetric").value, [ , label, unit] = BODY.find(b => b[0]===k);
  const list = state.body.slice().sort((a,b) => a.date.localeCompare(b.date));
  const pts = list.filter(b => b[k]).map(b => ({ date: b.date, v: b[k] }));
  $("#bChart").innerHTML = chart(pts);
  $("#bDelta").textContent = pts.length >= 2 ? `${label}: ilk kayıttan bu yana ${pts[pts.length-1].v - pts[0].v >= 0 ? "+" : ""}${fmt(pts[pts.length-1].v - pts[0].v)} ${unit} (${shortDate(pts[0].date)} → ${shortDate(pts[pts.length-1].date)})` : "";
  $("#bTable").innerHTML = list.length ? `<tr><th>Tarih</th>${BODY.map(([,l]) => `<th>${l}</th>`).join("")}<th></th></tr>` +
    list.slice().reverse().map(b => `<tr><td>${shortDate(b.date)}</td>${BODY.map(([k]) => `<td>${b[k] ? fmt(b[k]) : "–"}</td>`).join("")}<td><button class="iconbtn danger" data-bdel="${b.date}" title="Sil">${ic("trash-2")}</button></td></tr>`).join("")
    : `<tr><td>${emptyHTML("ruler", "Henüz ölçü yok", "Yukarıdan ilk ölçünü kaydet.")}</td></tr>`;
  $("#bTable").querySelectorAll("[data-bdel]").forEach(btn => btn.onclick = () => {
    const i = state.body.findIndex(b => b.date === btn.dataset.bdel), [rec] = state.body.splice(i, 1);
    save(); renderBody();
    undoable("Ölçü silindi", () => { state.body.splice(i, 0, rec); save(); renderBody(); });
  });
}

/* ---------- Tools ---------- */
["rmW","rmR"].forEach(id => $("#"+id).oninput = renderRM);
["plT","plBar"].forEach(id => $("#"+id).oninput = renderPlates);
["wuW","wuBar"].forEach(id => $("#"+id).oninput = renderWarmCalc);
function renderTools(){ renderRM(); renderPlates(); renderWarmCalc(); }
function renderRM(){
  const w = parseFloat($("#rmW").value)||0, r = parseInt($("#rmR").value)||0;
  if (!w || !r) { $("#rmTable").innerHTML = ""; return; }
  const one = e1rm(w, Math.min(r, 15));
  const reps = { 100:1, 95:2, 90:4, 85:6, 80:8, 75:10, 70:12, 65:15, 60:18, 50:25 };
  $("#rmTable").innerHTML = `<tr><th>Yüzde</th><th>Ağırlık</th><th>≈ Tekrar</th></tr>` +
    Object.keys(reps).map(Number).sort((a,b)=>b-a).map(p => `<tr${p===100?' style="font-weight:700"':""}><td>%${p}${p===100?" (1RM)":""}</td><td>${fmt(one*p/100)} kg</td><td>${reps[p]}</td></tr>`).join("") +
    (r > 12 ? `<tr><td colspan="3" class="muted small">12'den fazla tekrarda tahmin daha az güvenilirdir.</td></tr>` : "");
}
const PLATES = [[25,"#d93025",80],[20,"#1a73e8",76],[15,"#f2b632",70],[10,"#1f9d55",62],[5,"#6b7280",50],[2.5,"#374151",42],[1.25,"#9aa3ae",36]];
// bir tarafa takılacak plakalar (büyükten küçüğe) ve karşılanamayan kalan
const platesFor = side => platesForCore(side, state.plates);
// plakalar 1,25 gibi iki ondalıklı olabilir; fmt() tek ondalığa yuvarladığı için ayrı biçimlenir
const pfmt = w => String(+w).replace(".", ",");
const plateText = used => { const g = {}; used.forEach(w => g[w] = (g[w]||0)+1); return Object.entries(g).sort((a,b)=>b[0]-a[0]).map(([w,n]) => `${n}× ${pfmt(w)}`).join(" + "); };
function renderWarmCalc(){
  const w = parseFloat($("#wuW").value)||0, bar = parseFloat($("#wuBar").value);
  if (!w) { $("#wuTable").innerHTML = ""; return; }
  const rows = warmupSets(w, bar).map(s => ({ ...s, t: "Isınma" })).concat([{ w, r: "–", t: "Çalışma seti" }]);
  $("#wuTable").innerHTML = `<tr><th>Set</th><th>Kg</th><th>Tekrar</th>${bar ? "<th>Her tarafa</th>" : ""}</tr>` + rows.map(r => {
    const p = bar ? platesFor((r.w - bar)/2) : null;
    return `<tr${r.t==="Çalışma seti" ? ' style="font-weight:700"' : ""}><td>${r.t}</td><td>${fmt(r.w)}</td><td>${r.r}</td>${bar ? `<td>${p.used.length ? plateText(p.used) : "boş bar"}</td>` : ""}</tr>`;
  }).join("");
}
function renderPlates(){
  const t = parseFloat($("#plT").value)||0, bar = parseFloat($("#plBar").value);
  let side = (t - bar) / 2;
  if (t <= 0 || side < 0) { $("#plVis").innerHTML = ""; $("#plTxt").textContent = side < 0 ? "Hedef, bar ağırlığından az." : ""; return; }
  const { used, rest } = platesFor(side); side = rest;
  const vis = used.map(w => { const p = PLATES.find(x => x[0]===w); return `<div class="pl" style="background:${p[1]};height:${p[2]}px;width:${w>=10?16:12}px">${pfmt(w)}</div>`; });
  $("#plVis").innerHTML = (bar ? `<div class="bar"></div>` : "") + vis.join("");
  const grouped = {}; used.forEach(w => grouped[w] = (grouped[w]||0)+1);
  $("#plTxt").innerHTML = used.length ? `Her tarafa: <b>${Object.entries(grouped).sort((a,b)=>b[0]-a[0]).map(([w,n]) => `${n}× ${pfmt(w)} kg`).join(" + ")}</b>` + (side > 0.01 ? `<br><span class="muted small">${fmt(side*2)} kg tam karşılanamadı.</span>` : "") : "Sadece bar.";
}

/* ---------- Rest timer ---------- */
const PRESETS = [60, 90, 120, 180, 300];
let tEnd = 0, tTick = null, tDur = 90, tTotal = 90, audio = null;
const mmss = s => Math.floor(s/60) + ":" + pad(Math.max(0, Math.floor(s%60)));
function renderPresets(){
  $("#presets").innerHTML = PRESETS.map(s => `<button class="btn sm${s===tDur?" on":""}" data-s="${s}">${s<120 ? s+"sn" : (s/60)+"dk"}</button>`).join("");
  $("#presets").querySelectorAll("button").forEach(b => b.onclick = () => { tDur = +b.dataset.s; state.rest = tDur; save(); if (tEnd) startTimer(); else { renderPresets(); $("#clock").textContent = mmss(tDur); } });
}
$("#fab").onclick = () => { $("#sheet").classList.toggle("hidden"); if (!tEnd) $("#clock").textContent = mmss(tDur); renderPresets(); };
$("#shClose").onclick = () => $("#sheet").classList.add("hidden");
$("#tPlus").onclick = () => adjust(15);
$("#tMinus").onclick = () => adjust(-15);
$("#fRestPlus").onclick = () => adjust(15);
$("#fRestMinus").onclick = () => adjust(-15);
$("#fRestSkip").onclick = () => stopTimer();
function adjust(d){
  if (tEnd) { tEnd += d*1000; tTotal = Math.max(1, tTotal + d); tickTimer(); }
  else { tDur = Math.max(15, tDur + d); $("#clock").textContent = mmss(tDur); renderPresets(); }
}
$("#tStart").onclick = () => tEnd ? stopTimer() : startTimer();
function startTimer(sec){
  try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch(e){}
  tTotal = sec || tDur; tEnd = Date.now() + tTotal*1000; clearInterval(tTick); tTick = setInterval(tickTimer, 250);
  $("#tStart").innerHTML = ic("square") + "Durdur"; renderPresets(); tickTimer();
}
function stopTimer(){
  clearInterval(tTick); tEnd = 0; $("#fab").classList.remove("run"); $("#fabTxt").textContent = "";
  $("#tStart").innerHTML = ic("play") + "Başlat"; $("#clock").textContent = mmss(tDur);
  renderFocusRest();
}
function tickTimer(){
  const left = Math.ceil((tEnd - Date.now())/1000);
  if (left <= 0) { stopTimer(); beep(); toast("Dinlenme bitti, sıradaki set!", "timer"); return; }
  $("#clock").textContent = mmss(left); $("#fabTxt").textContent = mmss(left); $("#fab").classList.add("run");
  renderFocusRest(left);
}
function renderFocusRest(left){
  const on = !!tEnd; $("#fRest").classList.toggle("hidden", !on);
  if (!on) return;
  const l = left ?? Math.ceil((tEnd - Date.now())/1000);
  $("#fRestT").textContent = mmss(l);
  $("#fRestBar").style.width = Math.max(0, Math.min(100, l / tTotal * 100)) + "%";
}
function beep(){
  try { navigator.vibrate && navigator.vibrate([250,120,250,120,250]); } catch(e){}
  if (!audio) return;
  try { [0, .3, .6].forEach(off => { const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = 880; o.connect(g); g.connect(audio.destination);
    g.gain.setValueAtTime(.25, audio.currentTime+off); g.gain.exponentialRampToValueAtTime(.001, audio.currentTime+off+.25); o.start(audio.currentTime+off); o.stop(audio.currentTime+off+.26); }); } catch(e){}
}

/* ---------- Backup ---------- */
function renderBackup(){
  const last = state.lastBackup ? `Son yedek: ${Math.floor((Date.now()-state.lastBackup)/864e5) || "bugün"}${Math.floor((Date.now()-state.lastBackup)/864e5) ? " gün önce" : ""}` : "Henüz yedek alınmadı";
  $("#dataInfo").textContent = `${state.entries.length} kayıt · ${new Set(state.entries.map(e=>e.date)).size} antrenman günü · ${state.programs.length} program · ${state.body.length} ölçü · ${state.custom.length} özel hareket · ${last}`;
  renderCalStatus();
  // takvim onay kutusu ilk dokunuşta giriş penceresini açabilsin diye Google betiği şimdiden yüklenir
  if (syncCanRun()) preloadGoogle().catch(() => {});
}
function download(name, text, type){
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function exportBackup(){
  state.lastBackup = Date.now(); save();
  const { draft, live, ...data } = state;
  download(`spor-defteri-yedek-${ymd(new Date())}.json`, JSON.stringify(data, null, 1), "application/json");
  renderBackup(); renderBackupBanner();
}
$("#exportBtn").onclick = exportBackup;
// Türkçe Excel ";" ayırıcı ve ondalık virgül bekler; BOM, Türkçe karakterlerin doğru görünmesi için
$("#csvBtn").onclick = () => {
  const num = n => n === "" || n == null ? "" : String(n).replace(".", ",");
  const cell = v => { v = String(v ?? ""); return /[";\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const rows = [["Tarih","Hareket","Kas grubu","Set","Set türü","Kg / dk","Tekrar / km","RIR","Hacim (kg)","Not"]];
  state.entries.slice().sort((a,b) => a.date.localeCompare(b.date) || a.ts-b.ts).forEach(e => {
    const c = isCardio(e.ex); let k = 0;
    e.sets.forEach((s,i) => {
      const n = s.t === "w" ? "I" : ++k;
      rows.push([e.date, e.ex, groupOf(e.ex), n, s.t ? SET_TYPES[s.t] : (c ? "Kardiyo" : s.sec != null ? "Süreli (sn)" : "Normal"), num(+s.w||0), num(s.sec ?? (+s.r||0)), num(s.rir), c || s.t === "w" ? "" : num((+s.w||0)*(+s.r||0)), i === 0 ? (e.note||"") : ""]);
    });
  });
  download(`spor-defteri-${ymd(new Date())}.csv`, "\ufeff" + rows.map(r => r.map(cell).join(";")).join("\r\n"), "text/csv;charset=utf-8");
  toast(`${rows.length-1} set dışa aktarıldı`, "file-spreadsheet");
};
function renderBackupBanner(){
  const first = state.entries.reduce((m,e) => Math.min(m, e.ts||Infinity), Infinity);
  const since = state.lastBackup || first, days = Math.floor((Date.now() - since)/864e5);
  // Drive'a son 10 günde eşitlendiyse veriler zaten güvende; yedek hatırlatması gösterilmez
  const synced = sync.on && Date.now() - sync.last < 10*864e5;
  const show = !synced && state.entries.length >= 3 && isFinite(since) && days >= 10 && Date.now() > state.backupSnooze;
  $("#backupBanner").classList.toggle("hidden", !show);
  if (show) $("#backupMsg").innerHTML = state.lastBackup ? `${ic("save")} Son yedeğin <b>${days} gün</b> önce alındı. Verilerin sadece bu tarayıcıda; yedek almanı öneririm.` : `${ic("save")} Henüz hiç yedek almadın. Verilerin sadece bu tarayıcıda duruyor.`;
}
$("#backupNow").onclick = exportBackup;
$("#backupLater").onclick = () => { state.backupSnooze = Date.now() + 3*864e5; save(); renderBackupBanner(); };
$("#importBtn").onclick = () => $("#importFile").click();
$("#importFile").onchange = async ev => {
  const f = ev.target.files[0]; if (!f) return;
  try {
    const s = JSON.parse(await f.text());
    if (!Array.isArray(s.entries)) throw 0;
    const mode = await choose(`Yedekte ${s.entries.length} antrenman kaydı var.\n\nBirleştir: iki taraftaki kayıtlar birleşir (telefon + bilgisayar için). Aynı kayıt iki yerde değiştiyse en son değiştirilen kazanır.\nDeğiştir: buradaki tüm veriler silinir, yedektekiler yüklenir.`,
      [{ label: "Vazgeç", value: null }, { label: "Değiştir", value: "replace" }, { label: "Birleştir", value: "merge", primary: true }]);
    if (!mode) return;
    let msg = "Geri yüklendi";
    if (mode === "merge") {
      stampChanges();
      const r = mergeStates(state, s);
      state = r.state;
      msg = `Birleştirildi: ${r.stats.added} yeni, ${r.stats.updated} güncellenen, ${r.stats.removed} silinen kayıt`;
    } else {
      state = { ...withDefaults(s), deviceId: state.deviceId, active: null, live: null, draft: null };
    }
    state.lastBackup = Date.now();
    for (const k in _mCache) delete _mCache[k];
    takeSnapshot(); save();
    refreshDatalist(); resetEditor(); refreshAll(); renderBackup(); toast(msg, "check");
  } catch(e){ toast("Geçersiz yedek dosyası"); }
  finally { ev.target.value = ""; }
};

/* ---------- Google Drive senkronizasyonu ----------
   Birleştirme akışı core/sync.ts, Drive dosyası sync/drive.ts, giriş sync/google.ts içinde.
   Eşitleme durumu cihaza özeldir; state'e değil ayrı bir anahtara yazılır, böylece kendisi eşitlenmez.
   Ne zaman eşitlenir: açılışta, antrenman bitince, uygulamaya dönülünce ya da arka plana geçerken, "Şimdi eşitle"de. */
const SYNC_KEY = "sporDefteri.sync";
const syncCanRun = () => !!GOOGLE_CLIENT_ID && /^https?:$/.test(location.protocol);
let sync = { on: false, last: 0 };
try { sync = { ...sync, ...JSON.parse(localStorage.getItem(SYNC_KEY) || "{}") }; } catch(e){}
let syncBusy = false, syncNeedsAuth = false, syncErr = "";
const saveSync = () => { try { localStorage.setItem(SYNC_KEY, JSON.stringify(sync)); } catch(e){} };
const agoText = t => { const m = Math.round((Date.now()-t)/60000); return m < 1 ? "az önce" : m < 60 ? `${m} dk önce` : m < 1440 ? `${Math.floor(m/60)} sa önce` : `${Math.floor(m/1440)} gün önce`; };
// Drive ve Takvim işleri sırayla çalışır: Drive birleştirmesi state'i değiştirirken takvim aynı anda yazmasın
let cloudQueue = Promise.resolve();
const enqueue = job => (cloudQueue = cloudQueue.then(job, job));

// interactive: bir dokunuşla çağrıldı; giriş gerekiyorsa pencere açılabilir.
// Giriş penceresi engellenmesin diye requestToken sıraya girmeden, ilk await'ten önce çağrılır.
function runSync(interactive){
  if (!sync.on || syncBusy || !syncCanRun()) return Promise.resolve();
  let token = cachedToken(DRIVE_SCOPE), tokenP = null;
  if (!token) {
    if (!interactive || !gisReady()) { syncNeedsAuth = true; renderSyncStatus(); return Promise.resolve(); }
    tokenP = requestToken(GOOGLE_CLIENT_ID, false, [DRIVE_SCOPE]);
  }
  syncBusy = true; syncErr = ""; renderSyncStatus();
  return enqueue(async () => {
    try {
      if (tokenP) token = await tokenP;
      syncNeedsAuth = false;
      stampChanges();
      const r = await syncOnce(state, driveStore(token));
      if (r.localChanged) {
        // istek sürerken yapılan değişiklikler kaybolmasın: sonucu şimdiki veriyle bir kez daha birleştir
        stampChanges();
        state = mergeStates(state, r.state).state;
        for (const k in _mCache) delete _mCache[k];
        takeSnapshot(); save();
        refreshDatalist(); refreshAll();
        const n = r.stats.added + r.stats.updated + r.stats.removed;
        toast(n ? `Drive'dan ${n} değişiklik alındı` : "Drive ile eşitlendi", "check");
      }
      sync.last = Date.now(); saveSync();
    } catch(e){
      if (e instanceof AuthError) { dropScope(DRIVE_SCOPE); syncNeedsAuth = true; }
      else syncErr = (e && e.message) || "Eşitlenemedi";
    } finally {
      syncBusy = false; renderSyncStatus(); renderBackupBanner();
    }
  });
}

// Dokunuşla çağrılmalı (giriş penceresi). Google betiği yüklü değilse önce yükler ve tekrar dokunmayı ister.
function connectDrive(){
  if (!syncCanRun()) return;
  if (!gisReady()) { preloadGoogle().then(() => toast("Google hazır, tekrar dokun", "check"), e => toast(e.message)); return; }
  const tokenP = requestToken(GOOGLE_CLIENT_ID, true, [DRIVE_SCOPE]);
  syncBusy = true; syncErr = ""; renderSyncStatus();
  tokenP.then(() => { sync.on = true; saveSync(); syncBusy = false; return runSync(false); })
    .catch(e => { syncBusy = false; syncErr = e.message; renderSyncStatus(); });
}

function renderSyncStatus(){
  let sub = "Çevrimdışı · veriler bu cihazda";
  if (sync.on) sub = syncBusy ? "Drive ile eşitleniyor…" : syncNeedsAuth ? "Drive: eşitlemek için dokun" : syncErr ? "Drive: eşitlenemedi, dokun" : sync.last ? `Drive ile eşitlendi · ${agoText(sync.last)}` : "Google Drive'a bağlı";
  $("#brandSub").textContent = sub;
  $("#brandSub").classList.toggle("tap", sync.on && !syncBusy && (syncNeedsAuth || !!syncErr));
  const can = syncCanRun();
  let status = "";
  if (!GOOGLE_CLIENT_ID) status = "Kurulum bekleniyor: Google istemci kimliği henüz eklenmedi (YOL-HARITASI.md, Faz 4).";
  else if (!can) status = "Senkronizasyon için uygulamayı web adresinden aç (dosyadan açınca Google girişi çalışmaz).";
  else if (!sync.on) status = syncBusy ? "Google'a bağlanılıyor…" : syncErr ? `Bağlanılamadı: ${syncErr}` : "Bağlı değil.";
  else status = syncBusy ? "Eşitleniyor…" : syncNeedsAuth ? "Google oturumunun süresi doldu. Eşitlemek için \"Şimdi eşitle\"ye dokun." : syncErr ? `Son deneme başarısız: ${syncErr}` : sync.last ? `Son eşitleme: ${agoText(sync.last)}` : "Bağlı, henüz eşitlenmedi.";
  $("#syncStatus").textContent = status;
  $("#syncStatus").classList.toggle("muted", !syncErr);
  $("#syncConnect").classList.toggle("hidden", !can || sync.on);
  $("#syncNow").classList.toggle("hidden", !can || !sync.on);
  $("#syncOff").classList.toggle("hidden", !sync.on);
  $("#syncConnect").disabled = $("#syncNow").disabled = syncBusy;
}

$("#syncConnect").onclick = connectDrive;
$("#syncNow").onclick = () => runSync(true);
$("#brandSub").onclick = () => { if (sync.on && !syncBusy && (syncNeedsAuth || syncErr)) runSync(true); };
$("#syncOff").onclick = async () => {
  const ok = await choose("Google Drive bağlantısı kesilsin mi?\n\nBu cihazdaki kayıtlar yerinde kalır. Drive'daki kopya silinmez; tekrar bağlandığında yine birleştirilir.",
    [{ label: "Vazgeç", value: false }, { label: "Bağlantıyı kes", value: true, primary: true }]);
  if (!ok) return;
  // Google'daki izni geri almak Takvim iznini de kaldırır; takvim açıksa yalnız Drive izni bırakılır
  if (calOn()) dropScope(DRIVE_SCOPE); else revoke();
  sync = { on: false, last: 0 }; syncNeedsAuth = false; syncErr = ""; saveSync();
  renderSyncStatus(); renderBackupBanner(); toast("Drive bağlantısı kesildi", "check");
};
document.addEventListener("visibilitychange", () => {
  // geri dönünce (2 dk'dan uzun aradan sonra) güncelle; arka plana geçerken son değişiklikleri gönder
  if (document.visibilityState === "visible") {
    if (sync.on) { if (Date.now() - sync.last > 2*60e3) runSync(false); else renderSyncStatus(); }
    runCal(false);
  }
  else if (sync.on) runSync(false);
});
setInterval(() => { if (sync.on && !syncBusy) renderSyncStatus(); }, 60e3);

/* ---------- Google Takvim ----------
   Ne yazılacağına core/calendar.ts karar verir; istemci sync/calendar.ts. Ayarlar (state.gcal) Drive ile eşitlenir.
   Bu cihazda takvim izni yoksa sorun değil: yazılmamış antrenmanlar Drive ile diğer cihaza gider ve oradan yazılır. */
const calOn = () => state.gcal.log || state.gcal.plan;
let calBusy = false, calErr = "", calTimer = null;
const timeZone = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch(e){ return "UTC"; } };

function runCal(interactive){
  const g = state.gcal;
  if (!syncCanRun() || calBusy || (!g.log && !g.plan && !g.planSig)) return Promise.resolve();
  let token = cachedToken(CAL_SCOPE), tokenP = null;
  if (!token) {
    if (!interactive || !gisReady()) { renderCalStatus(); return Promise.resolve(); }
    tokenP = requestToken(GOOGLE_CLIENT_ID, false, [CAL_SCOPE]);
  }
  calBusy = true; calErr = ""; renderCalStatus();
  return enqueue(async () => {
    let r = null;
    try {
      if (tokenP) token = await tokenP;
      // sıra beklerken Drive birleştirmesi state'i değiştirmiş olabilir: güncel state kullanılır
      r = await runCalendar(state, calendarClient(token), { describeProgram: progDetails, describeSession, timeZone: timeZone() });
      sync.calLast = Date.now(); saveSync();
      if (interactive) toast(r.written || r.planUpdated ? "Takvim güncellendi" : "Takvim zaten güncel", "calendar-days");
    } catch(e){
      if (e instanceof AuthError) dropScope(CAL_SCOPE);
      else calErr = (e && e.message) || "Takvime yazılamadı";
    } finally {
      // yarıda kalsa da yazılanların işaretleri kaydedilir
      save(); calBusy = false; renderCalStatus(); renderPlan();
    }
    // takvim kimliği ve "yazıldı" işaretleri diğer cihazlara gitsin
    if (r && (r.written || r.created || r.planUpdated) && sync.on) runSync(false);
  });
}

// Plan değişikliklerini topla: son değişiklikten 4 sn sonra, yalnız takvimdeki plan gerçekten eskidiyse
function calSoon(){
  clearTimeout(calTimer);
  calTimer = setTimeout(() => {
    const g = state.gcal, target = g.plan ? planSignature(state.plan, state.programs) : "";
    if (target !== g.planSig) runCal(false);
  }, 4000);
}

// Onay kutusu dokunuşu: izin yoksa giriş penceresi bu dokunuşta açılır
function toggleCal(key, on){
  if (on && !cachedToken(CAL_SCOPE)) {
    if (!gisReady()) {
      $(key === "log" ? "#calLog" : "#calPlan").checked = false;
      preloadGoogle().then(() => toast("Google hazır, tekrar dokun", "check"), e => toast(e.message));
      return;
    }
    const tokenP = requestToken(GOOGLE_CLIENT_ID, false, [CAL_SCOPE]);
    state.gcal[key] = true; save(); calBusy = true; calErr = ""; renderCalStatus();
    tokenP.then(() => { calBusy = false; return runCal(false); })
      .catch(e => { calBusy = false; state.gcal[key] = false; save(); calErr = e.message; renderCalStatus(); });
    return;
  }
  state.gcal[key] = on; save(); renderCalStatus();
  // kapatırken takvimdeki planı silmek için izin gerekebilir; dokunuş içinde olduğumuz için pencere açılabilir
  runCal(true);
}

function renderCalStatus(){
  const g = state.gcal, can = syncCanRun(), on = g.log || g.plan, hasToken = !!cachedToken(CAL_SCOPE);
  $("#calCard").classList.toggle("hidden", !GOOGLE_CLIENT_ID);
  $("#calLog").checked = g.log; $("#calPlan").checked = g.plan;
  $("#calLog").disabled = $("#calPlan").disabled = !can || calBusy;
  let status = "";
  if (!can) status = "Google Takvim için uygulamayı web adresinden aç.";
  else if (calBusy) status = "Takvim güncelleniyor…";
  else if (calErr) status = `Son deneme başarısız: ${calErr}`;
  else if (!on) status = "Kapalı.";
  else if (!hasToken) status = "Bu cihazda takvim izni yok. Takvim, izin verdiğin diğer cihazdan güncellenir; bu cihazdan da yazmak için izin ver.";
  else status = sync.calLast ? `"Spor Defteri" takvimi · son güncelleme ${agoText(sync.calLast)}` : `"Spor Defteri" takvimine yazılıyor.`;
  $("#calStatus").textContent = status;
  $("#calStatus").classList.toggle("muted", !calErr);
  $("#calAuth").classList.toggle("hidden", !can || !on || hasToken || calBusy);
  $("#calOpen").classList.toggle("hidden", !g.id);
}

$("#calLog").onchange = e => toggleCal("log", e.target.checked);
$("#calPlan").onchange = e => toggleCal("plan", e.target.checked);
$("#calAuth").onclick = () => runCal(true);
$("#calOpen").onclick = () => openUrl("https://calendar.google.com/calendar/r");

/* ---------- Settings ---------- */
const ALL_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
function renderSettings(){
  $("#themeChips").innerHTML = [["dark","Koyu","moon"],["light","Açık","sun"],["system","Cihaz ayarı","monitor"]].map(([k,l,i]) => `<button class="fchip${theme===k?" on":""}" data-k="${k}" aria-pressed="${theme===k}">${ic(i)}${l}</button>`).join("");
  $("#themeChips").querySelectorAll("button").forEach(b => b.onclick = () => setTheme(b.dataset.k));
  $("#setRest").innerHTML = [30,45,60,90,120,150,180,240,300].map(v => `<option value="${v}"${v===state.rest?" selected":""}>${mmss(v)}</option>`).join("");
  $("#setGoal").innerHTML = [1,2,3,4,5,6,7].map(v => `<option value="${v}"${v===state.goal?" selected":""}>${v} gün</option>`).join("");
  $("#autoRest").checked = state.autoRest; $("#prefWake").checked = state.prefs.wake; $("#prefHaptic").checked = state.prefs.haptics;
  $("#plateChips").innerHTML = ALL_PLATES.map(p => { const on = state.plates.includes(p); return `<button class="fchip${on?" on":""}" data-p="${p}" aria-pressed="${on}">${fmt(p)} kg</button>`; }).join("");
  $("#plateChips").querySelectorAll("button").forEach(b => b.onclick = () => {
    const p = +b.dataset.p;
    state.plates = state.plates.includes(p) ? state.plates.filter(x => x !== p) : [...state.plates, p].sort((a,b) => b-a);
    save(); renderSettings();
  });
}
$("#setRest").onchange = () => { state.rest = tDur = +$("#setRest").value; save(); };
$("#setGoal").onchange = () => { state.goal = +$("#setGoal").value; save(); };
$("#autoRest").onchange = () => { state.autoRest = $("#autoRest").checked; save(); };
$("#prefWake").onchange = () => { state.prefs.wake = $("#prefWake").checked; save(); if (!state.prefs.wake) keepAwake(false); };
$("#prefHaptic").onchange = () => { state.prefs.haptics = $("#prefHaptic").checked; save(); buzz(30); };

/* ---------- Theme ----------
   Tema cihaza özeldir (senkronize edilmez); ana veriden ayrı bir anahtarda tutulur. Varsayılan: koyu. */
const THEME_KEY = "sporDefteri.theme";
const THEMES = { dark: ["moon", "Tema: koyu"], light: ["sun", "Tema: açık"], system: ["monitor", "Tema: cihaz ayarı"] };
const darkMq = matchMedia("(prefers-color-scheme: dark)");
let theme = "dark";
try { const t = localStorage.getItem(THEME_KEY); if (THEMES[t]) theme = t; } catch(e){}
function applyTheme(){
  if (theme === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = theme;
  $("#themeBtn").innerHTML = ic(THEMES[theme][0]); $("#themeBtn").title = THEMES[theme][1]; $("#themeBtn").setAttribute("aria-label", THEMES[theme][1]);
  const dark = theme === "dark" || (theme === "system" && darkMq.matches);
  document.querySelector('meta[name="theme-color"]').content = dark ? "#0a0a0b" : "#f3f3f4";
}
function setTheme(t){
  theme = t; try { localStorage.setItem(THEME_KEY, t); } catch(e){}
  applyTheme(); if (!$("#profile-settings").classList.contains("hidden")) renderSettings();
}
$("#themeBtn").onclick = () => { setTheme({ dark: "light", light: "system", system: "dark" }[theme]); toast(THEMES[theme][1], THEMES[theme][0]); };
darkMq.addEventListener("change", applyTheme);
applyTheme();

/* ---------- First run ---------- */
const STARTERS = { ppl: ["Push (İtiş)", "Pull (Çekiş)", "Legs (Bacak)"], ul: ["Upper (Üst Vücut)", "Lower (Alt Vücut)"], fb: ["Full Body A", "Full Body B"], s5: ["5x5 (A)", "5x5 (B)"], none: [] };
const PLAN_DAYS = { 2: ["MO","TH"], 3: ["MO","WE","FR"], 4: ["MO","TU","TH","FR"], 5: ["MO","TU","WE","FR","SA"], 6: ["MO","TU","WE","TH","FR","SA"] };
function maybeOnboard(){
  if (state.onboarded) return;
  if (state.entries.length || state.programs.length) { state.onboarded = true; save(); return; }
  let goal = 3, starter = "ppl";
  openSheet(`<div class="eyebrow" style="margin-top:6px">Hoş geldin</div><h3 style="font-size:28px;margin:4px 0 6px;letter-spacing:-.035em">Hadi başlayalım</h3>
      <p class="muted" style="margin:0 0 4px">İki soru, sonra ilk antrenmanına hazırsın.</p>`,
    `<div class="pk-head">Haftada kaç gün çalışacaksın?</div><div class="optgrid" id="obGoal">${[2,3,4,5,6].map(n => `<button class="fchip${n===goal?" on":""}" data-v="${n}">${n} gün</button>`).join("")}</div>
     <div class="pk-head">Başlangıç programı</div><div class="optgrid" id="obProg">${[["ppl","Push / Pull / Legs"],["ul","Üst / Alt vücut"],["fb","Tüm vücut"],["s5","5x5 güç"],["none","Kendim oluşturacağım"]].map(([k,l]) => `<button class="fchip${k===starter?" on":""}" data-v="${k}">${l}</button>`).join("")}</div>
     <p class="muted small" style="margin-top:16px">Seçtiğin program haftalık planına yerleşir; istediğin zaman değiştirebilirsin.</p>
     <button class="btn primary xl" id="obGo" style="margin-top:6px">Başla${ic("arrow-right")}</button>
     <button class="ghost" id="obSkip" style="width:100%;justify-content:center;margin-top:6px">Şimdilik atla</button>
     ${syncCanRun() ? `<button class="ghost" id="obDrive" style="width:100%;justify-content:center;margin-top:2px">${ic("cloud")}Başka cihazda kullanıyorum: Drive'dan getir</button>` : ""}`,
    () => { state.onboarded = true; save(); });
  const pick = (id, set) => $(id).querySelectorAll("button").forEach(b => b.onclick = () => { set(b.dataset.v); $(id).querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); buzz(5); });
  pick("#obGoal", v => goal = +v); pick("#obProg", v => starter = v);
  $("#obGo").onclick = () => {
    state.goal = goal;
    const ids = STARTERS[starter].map(n => { const p = fromTemplate(n); state.programs.push(p); return p.id; });
    if (ids.length) (PLAN_DAYS[goal] || []).forEach((code, i) => state.plan.days[code] = { prog: ids[i % ids.length], time: "19:00" });
    state.onboarded = true; save(); closeSheet(); refreshAll(); toast("Hazırsın! Bugün ekranından başla", "biceps-flexed");
  };
  $("#obSkip").onclick = closeSheet;
  // başlangıç programı oluşturmadan bağlanır; yoksa programlar iki cihazda farklı kimlikle iki kez oluşur
  if ($("#obDrive")) $("#obDrive").onclick = () => { closeSheet(); connectDrive(); };
}

/* ---------- Accessibility ----------
   İkon düğmelerinin title metni ekran okuyucular için aria-label olarak da verilir. */
function labelIcons(root){
  if (root.matches && root.matches("button[title]:not([aria-label]), a[title]:not([aria-label])")) root.setAttribute("aria-label", root.title);
  root.querySelectorAll && root.querySelectorAll("button[title]:not([aria-label]), a[title]:not([aria-label])").forEach(b => b.setAttribute("aria-label", b.title));
}
new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) labelIcons(n); }))).observe(document.body, { childList: true, subtree: true });
labelIcons(document);

/* ---------- PWA ----------
   Bir web adresinden (https veya localhost) açıldığında uygulama telefona/bilgisayara kurulabilir ve çevrimdışı açılır.
   Dosya doğrudan açıldığında (file://) bu kısım atlanır; uygulama yine tek dosya olarak çalışır. */
if (/^https?:$/.test(location.protocol)) {
  [["manifest", "manifest.webmanifest"], ["apple-touch-icon", "icons/apple-touch-icon.png"]].forEach(([rel, href]) => {
    const l = document.createElement("link"); l.rel = rel; l.href = href; document.head.appendChild(l);
  });
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
}

/* ---------- Init ---------- */
load(); tDur = state.rest || 90; refreshDatalist();
$("#logDate").value = ymd(new Date());
if (!restoreDraft()) resetEditor();
resetProgEditor();
if (state.live) { state.live.items ||= []; state.live.idx ||= 0; keepAwake(true); }
// v3.1: süreli hareketlerde eskiden "tekrar" alanına yazılan saniyeleri sec alanına taşı
{ let moved = 0; state.entries.forEach(e => { if (isTimed(e.ex)) e.sets.forEach(x => { if (x.sec == null && +x.r > 0) { x.sec = +x.r; x.r = 0; delete x.rir; moved++; } }); }); if (moved) save(); }
showTab("home"); renderLiveBar();
renderSyncStatus(); renderCalStatus();
// Google betiği önceden yüklenir ki "bağlan" dokunuşu giriş penceresini doğrudan açabilsin
if (syncCanRun() && (sync.on || calOn() || !state.onboarded)) preloadGoogle().catch(() => {});
maybeOnboard();
// önce Drive (başka cihazdan gelen antrenmanlar ve takvim ayarı), sonra takvim
runSync(false); runCal(false);
