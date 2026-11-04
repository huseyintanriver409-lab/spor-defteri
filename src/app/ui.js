import { $, esc, ic, save, state, toast } from "./store.js";
import { allEx, equipOf, groupOf, musclesOf, pickableEx } from "./exercises.js";
import { refreshDatalist, renderDay, updateHint } from "./log.js";
import { renderPlan, renderProg } from "./programs.js";
import { renderLiveBar } from "./live.js";
import { renderHome } from "./home.js";
import { renderHistory } from "./history.js";
import { renderHistSelect, renderPower, renderRecords, renderRecovery, renderWeek } from "./stats.js";
import { groups, renderBody, renderLib } from "./library.js";
import { renderTools } from "./tools.js";
import { renderBackup, renderBackupBanner } from "./backup.js";
import { renderSettings } from "./settings.js";
import { renderAccount } from "./cloud.js";
import { streakCardHTML, streakNow, streakOn } from "./streak.js";

/* ---------- Helpers: haptics, wake lock, undo, bottom sheet ---------- */
export function buzz(p){ if (state.prefs.haptics) try { navigator.vibrate && navigator.vibrate(p); } catch(e){} }
export let wakeLock = null;
// antrenman sürerken ekranın kararmaması için (destekleyen tarayıcılarda)
export async function keepAwake(on){
  try {
    if (on && state.prefs.wake && "wakeLock" in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => { wakeLock = null; });
    }
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch(e){}
}

// silme işleminden sonra birkaç saniye "Geri al" çubuğu sunulur
export let undoTimer = null;
export function undoable(msg, undo){
  const s = $("#snack");
  $("#snackMsg").textContent = msg; $("#toast").classList.remove("show"); s.classList.add("show");
  clearTimeout(undoTimer);
  $("#snackBtn").onclick = () => { clearTimeout(undoTimer); s.classList.remove("show"); undo(); toast("Geri alındı", "undo-2"); };
  undoTimer = setTimeout(() => s.classList.remove("show"), 5000);
}

export let sheetOnClose = null;
export function openSheet(head, body, onClose){
  $("#bsHead").innerHTML = head; $("#bsBody").innerHTML = body;
  $("#bs").classList.remove("hidden"); sheetOnClose = onClose || null;
  const c = $("#bsHead [data-close]"); if (c) c.onclick = closeSheet;
  return $("#bsBody");
}
export function closeSheet(){
  $("#bs").classList.add("hidden"); $("#bsBody").innerHTML = "";
  const f = sheetOnClose; sheetOnClose = null; if (f) f();
}
export const sheetHead = title => `<div class="row" style="margin-bottom:12px"><h3 class="grow">${esc(title)}</h3><button class="iconbtn" data-close title="Kapat">${ic("x")}</button></div>`;
export const emptyHTML = (icon, title, text) => `<div class="empty">${ic(icon)}<b>${esc(title)}</b>${esc(text)}</div>`;

/* ---------- Exercise picker ---------- */
export function recentExercises(){
  const seen = new Set(), out = [];
  state.entries.slice().sort((a,b) => (b.ts||0) - (a.ts||0)).forEach(e => { if (!seen.has(e.ex)) { seen.add(e.ex); out.push(e.ex); } });
  return out.slice(0, 15);
}
export function openPicker(title, onPick){
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
    if (q) list = pickableEx().filter(e => { const m = musclesOf(e.name); return [e.name, e.group, equipOf(e.name), ...m.p, ...m.s].join(" ").toLocaleLowerCase("tr").includes(q); });
    else if (filter === "recent") list = recentExercises().map(known);
    else if (filter === "fav") list = state.favs.map(known);
    else if (filter === "all") list = pickableEx();
    else list = pickableEx().filter(e => e.group === filter);
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
export const TABS = ["home", "train", "history", "progress", "profile"];
export let curTab = "home";
export function showTab(t){
  curTab = t;
  document.querySelectorAll("nav.tabs button").forEach(b => { const on = b.dataset.tab === t; b.classList.toggle("on", on); b.setAttribute("aria-current", on ? "page" : "false"); });
  TABS.forEach(x => $("#tab-" + x).classList.toggle("hidden", x !== t));
  renderTab(t); scrollTo(0, 0);
}
export function renderTab(t){
  if (t === "home") renderHome();
  if (t === "train") renderSeg("train");
  if (t === "history") { renderHistory(); renderStreakCard(); }
  if (t === "progress") renderSeg("stats");
  if (t === "profile") { renderAccount(); renderSeg("profile"); }
}
// Takvim'in üstündeki seri kartı: yalnız bilgi; türü Profil → Ayarlar'dan seçilir
function renderStreakCard(){
  $("#streakCard").classList.toggle("hidden", !streakOn());
  if (!streakOn()) return;
  $("#streakCard").innerHTML = streakCardHTML(streakNow());
}
export function refreshAll(){ renderTab(curTab); renderLiveBar(); renderBackupBanner(); }
export const segState = { stats: "week", train: "prog", profile: "settings" };
export function renderSeg(name){
  const v = segState[name], seg = document.querySelector(`.seg[data-seg="${name}"]`);
  seg.querySelectorAll("button").forEach(b => { const on = b.dataset.v === v; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); $(`#${name}-${b.dataset.v}`).classList.toggle("hidden", !on); });
  ({ week: renderWeek, hist: renderHistSelect, rec: renderRecords, rest: renderRecovery, power: renderPower, body: renderBody,
     prog: renderProg, log: () => { renderDay(); updateHint(); }, plan: renderPlan,
     settings: renderSettings, lib: renderLib, tools: renderTools, backup: renderBackup })[v]();
}

// Düğme bağlamaları ve ilk hazırlıklar: main.js'teki açılış sırasında çağrılır
export function setup(){
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && state.live) keepAwake(true); });
$("#bs").addEventListener("click", e => { if (e.target.id === "bs") closeSheet(); });
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (!$("#modal").classList.contains("hidden")) $("#modal").click();
  else if (!$("#bs").classList.contains("hidden")) closeSheet();
});
document.querySelectorAll("nav.tabs button").forEach(b => b.onclick = () => showTab(b.dataset.tab));
document.querySelectorAll(".seg").forEach(seg => seg.querySelectorAll("button").forEach(b => b.onclick = () => { segState[seg.dataset.seg] = b.dataset.v; renderSeg(seg.dataset.seg); }));
}
