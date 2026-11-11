import { equipmentAllowed } from "./exercises.js";
import { exerciseSearchText } from "../core/names.ts";
import { bindEquipmentEmpty, equipmentEmptyHTML, mountEquipment, refreshEquipmentViews } from "./equipment.js";
import { setupShortHelp } from "./short-help.js";
import { $, esc, ic, save, state, toast } from "./store.js";
import { groupLabel } from "../core/library.ts";
import { searchFold, t } from "../core/i18n.ts";
import { muscleLabel, muscleSearchText } from "../core/musclemap.ts";
import { allEx, equipLabel, equipOf, equipTag, groupOf, groupShown, liftOn, musclesOf, pickableEx } from "./exercises.js";
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
import { miniMap } from "./bodymap.js";
import { assignmentButton, bindMuscleAssignments, openMuscleAssignment } from "./muscleassign.js";

/* ---------- Helpers: haptics, wake lock, undo, bottom sheet ---------- */
export function buzz(p){ if (state.prefs.haptics) try { navigator.vibrate && navigator.vibrate(p); } catch(e){} }
export let wakeLock = null;
let wakeWanted = false, wakePending = null;
export async function keepAwake(on){
  wakeWanted = !!on;
  let requested = false;
  try {
    if (!on) { const lock = wakeLock; wakeLock = null; if (lock) await lock.release(); return; }
    if (!state.prefs.wake || !("wakeLock" in navigator) || wakeLock || wakePending) return;
    requested = true;
    wakePending = navigator.wakeLock.request("screen");
    const lock = await wakePending;
    if (!wakeWanted || !state.prefs.wake) { await lock.release(); return; }
    wakeLock = lock;
    lock.addEventListener("release", () => { if (wakeLock === lock) wakeLock = null; });
  } catch(e){} finally { if (requested) wakePending = null; }
}

export let undoTimer = null;
export function undoable(msg, undo){
  const s = $("#snack");
  $("#snackMsg").textContent = msg; $("#toast").classList.remove("show"); s.classList.add("show"); document.body.classList.add("snack-on");
  clearTimeout(undoTimer);
  $("#snackBtn").onclick = () => { clearTimeout(undoTimer); s.classList.remove("show"); document.body.classList.remove("snack-on"); undo(); toast(t("ui.undo_done"), "undo-2"); };
  undoTimer = setTimeout(() => { s.classList.remove("show"); document.body.classList.remove("snack-on"); }, 5000);
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
export const sheetHead = title => `<div class="row" style="margin-bottom:12px"><h3 class="grow">${esc(title)}</h3><button class="iconbtn" data-close title="${t("ui.close")}" aria-label="${t("ui.close")}" data-i18n-aria="ui.close">${ic("x")}</button></div>`;
// Açıklamalar ⓘ düğmesinin arkasında: kartın başlığındaki düğme o karttaki .help yazılarını açar/kapatır
export const infoBtn = () => `<button class="infobtn" type="button" data-info aria-label="${t("ui.info_aria")}" aria-expanded="false">${ic("info")}</button>`;
// Sayfa (sheet) içeriği için aynı fikir: ⓘ'ye dokununca açılan açıklama (initHelp yalnız açılışta, statik karta çalışır)
export const helpTip = text => `<details class="shhelp"><summary aria-label="${t("ui.info_aria")}">${ic("info")}</summary><p class="muted">${text}</p></details>`;
function initHelp(){
  setupShortHelp();
  document.querySelectorAll(".help").forEach(p => {
    const card = p.closest(".card"), h = card && card.querySelector("h2");
    if (h && !h.querySelector("[data-info]")) h.insertAdjacentHTML("beforeend", infoBtn());
  });
  // yakalama aşamasında: başlık bir <summary> içindeyse katlanır kart açılıp kapanmasın
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-info]"); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const card = b.closest(".card"), on = !card.classList.contains("help-open");
    card.classList.toggle("help-open", on); b.setAttribute("aria-expanded", on);
  }, true);
}
export const emptyHTML = (icon, title, text) => `<div class="empty">${ic(icon)}<b>${esc(title)}</b>${esc(text)}</div>`;

/* ---------- Exercise picker ---------- */
export function recentExercises(){
  const seen = new Set(), out = [];
  state.entries.slice().sort((a,b) => (b.ts||0) - (a.ts||0)).forEach(e => { if (!seen.has(e.ex)) { seen.add(e.ex); out.push(e.ex); } });
  return out.filter(n => groupShown(groupOf(n))).slice(0, 15);
}
export function openPicker(title, onPick){
  openSheet(sheetHead(title) + `<div class="search">${ic("search")}<input id="pkQ" placeholder="${t("ui.ex_search")}" autocomplete="off" aria-label="${t("ui.ex_search")}"></div>
    <div class="fchips" id="pkChips" style="margin:10px 0 4px"></div>`, `<div class="pk-list" id="pkList"></div>`);
  const favs = () => state.favs.filter(n => groupShown(groupOf(n)));
  let ignoreEquip = false; // yalnız bu açılış için geçici; kalıcı seçime dokunmaz
  let filter = recentExercises().length ? "recent" : favs().length ? "fav" : "all";
  const chips = [["recent", t("ui.recent_lbl"), "history"], ["fav", t("ui.favs_lbl"), "star"], ["all", t("ui.all_lbl"), "list"], ...groups().map(g => [g, groupLabel(g), ""])];
  const renderChips = () => {
    $("#pkChips").innerHTML = chips.map(([k,l,i]) => `<button class="fchip${filter===k ? " on" : ""}" data-k="${esc(k)}">${i ? ic(i) : ""}${esc(l)}</button>`).join("");
    $("#pkChips").querySelectorAll("button").forEach(b => b.onclick = () => { filter = b.dataset.k; renderChips(); renderList(); });
  };
  const known = n => allEx().find(e => e.name===n) || { name: n, group: groupOf(n) };
  const renderList = () => {
    const raw = $("#pkQ").value.trim(), q = searchFold(raw);
    let list;
    if (q) list = pickableEx().filter(e => { const m = musclesOf(e.name); return [exerciseSearchText(e.name), e.group, groupLabel(e.group), equipOf(e.name), equipLabel(equipOf(e.name)), ...m.p.map(muscleSearchText), ...m.s.map(muscleSearchText)].map(searchFold).join(" ").includes(q); });
    else if (filter === "recent") list = recentExercises().map(known);
    else if (filter === "fav") list = favs().map(known);
    else if (filter === "all") list = pickableEx();
    else list = pickableEx().filter(e => e.group === filter);
    const unfiltered = list;
    if (!ignoreEquip) list = list.filter(e => equipmentAllowed(e.name));
    const hiddenMatches = q && list.length < unfiltered.length;
    const exact = q && allEx().some(e => searchFold(exerciseSearchText(e.name)).includes(q));
    let html = q && !exact ? `<div class="pk-item"><button class="pk-main" data-new="1"><b>${ic("circle-plus", "acc")} ${t("ui.new_ex", { raw: esc(raw) })}</b><small>${t("ui.new_ex_sub")}</small></button></div>` : "";
    html += list.map(e => {
      const m = musclesOf(e.name), fav = state.favs.includes(e.name);
      return `<div class="pk-item">${miniMap(e.name)}<button class="pk-main" data-ex="${esc(e.name)}"><b>${esc(e.name)}</b><small>${equipTag(e.name)}${esc(m.p.map(muscleLabel).join(", ") || groupLabel(e.group))}</small></button>${assignmentButton(e.name)}
        <button class="iconbtn star${fav ? " on" : ""}" data-fav="${esc(e.name)}" title="${fav ? t("ui.fav_remove") : t("ui.fav_add")}" aria-pressed="${fav}">${ic("star")}</button></div>`;
    }).join("");
    if (!html) html = filter === "fav" ? emptyHTML("star", t("ui.no_favs"), "")
      : emptyHTML("history", t("ui.no_records"), "");
    if (hiddenMatches) html = `<button class="btn quiet" data-remove-equipment>${ic("x")}${esc(t("equipment.remove_filter"))}</button>` + html;
    if (!list.length && !hiddenMatches && (state.prefs.equip || []).length) html = equipmentEmptyHTML() + html;
    $("#pkList").innerHTML = html;
    const removeFilter = $("#pkList [data-remove-equipment]");
    if (removeFilter) removeFilter.onclick = () => { ignoreEquip = true; renderList(); };
    bindEquipmentEmpty($("#pkList"), () => openPicker(title, onPick));
    bindMuscleAssignments($("#pkList"), () => openPicker(title, onPick));
    $("#pkList").querySelectorAll("[data-ex]").forEach(b => b.onclick = () => { closeSheet(); onPick(b.dataset.ex); });
    $("#pkList").querySelectorAll("[data-fav]").forEach(b => b.onclick = () => {
      const n = b.dataset.fav;
      state.favs = state.favs.includes(n) ? state.favs.filter(x => x !== n) : [...state.favs, n];
      save(); renderList(); buzz(8);
    });
    const nb = $("#pkList [data-new]");
    if (nb) nb.onclick = () => {
      let need = [];
      const body = openSheet(sheetHead(raw), '<div data-custom-equipment></div><button class="btn primary" data-create-ex>' + ic("plus") + esc(t("library.add")) + '</button>');
      mountEquipment(body.querySelector("[data-custom-equipment]"), { get: () => need, set: ids => { need = ids; }, label: "equipment.requirement" });
      body.querySelector("[data-create-ex]").onclick = () => { state.custom.push({ name: raw, group: "Diğer", ...(need.length ? { need } : {}) }); save(); refreshDatalist(); closeSheet(); toast(t("ui.ex_added", { raw }), "check"); onPick(raw); openMuscleAssignment(raw); };
    };
  };
  $("#pkQ").oninput = renderList;
  renderChips(); renderList();
  if (matchMedia("(pointer: fine)").matches) setTimeout(() => $("#pkQ") && $("#pkQ").focus(), 60);
}

/* ---------- Navigation ---------- */
export const TABS = ["home", "train", "history", "progress", "profile"];
export let curTab = "home";
// Sayfa yenilenince aynı sekme, bölüm ve kaydırma yerinde açılır. sessionStorage: uygulama yeniden açılınca ana sayfadan başlar.
const NAV_KEY = "sporDefteri.nav";
export const saveNav = () => { try { sessionStorage.setItem(NAV_KEY, JSON.stringify({ tab: curTab, seg: segState, y: scrollY })); } catch(e){} };
export function restoreNav(){
  let n = null; try { n = JSON.parse(sessionStorage.getItem(NAV_KEY) || "null"); } catch(e){}
  if (!n || !TABS.includes(n.tab)) return showTab("home");
  for (const k in segState) if (n.seg && typeof n.seg[k] === "string") segState[k] = n.seg[k];
  showTab(n.tab);
  // içerik çizildikten sonra
  if (n.y > 0) requestAnimationFrame(() => scrollTo(0, n.y));
}
export function showTab(t){
  curTab = t;
  document.querySelectorAll("nav.tabs button").forEach(b => { const on = b.dataset.tab === t; b.classList.toggle("on", on); b.setAttribute("aria-current", on ? "page" : "false"); });
  TABS.forEach(x => $("#tab-" + x).classList.toggle("hidden", x !== t));
  renderTab(t); scrollTo(0, 0); saveNav();
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
export function refreshAll(){ refreshEquipmentViews(); renderTab(curTab); renderLiveBar(); renderBackupBanner(); }
export const segState = { stats: "rest", train: "lib", profile: "settings", bm: "now" };
// "Sadece yoga"da ağırlığa özel bölümler gizlenir: rekorlar, kas toparlanması, güç skoru, hesap araçları
const LIFT_ONLY = { stats: ["rec", "rest", "power"], profile: ["tools"] };
export function renderSeg(name){
  const hide = liftOn() ? [] : LIFT_ONLY[name] || [];
  const seg = document.querySelector(`.seg[data-seg="${name}"]`);
  const available = [...seg.querySelectorAll("button")].map(b => b.dataset.v).filter(v => !hide.includes(v));
  if (!available.includes(segState[name])) segState[name] = available[0];
  const v = segState[name];
  seg.querySelectorAll("button").forEach(b => { b.classList.toggle("hidden", hide.includes(b.dataset.v)); const on = b.dataset.v === v; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); $(`#${name}-${b.dataset.v}`).classList.toggle("hidden", !on); });
  ({ week: renderWeek, hist: renderHistSelect, rec: renderRecords, rest: renderRecovery, power: renderPower, body: renderBody,
     prog: renderProg, log: () => { renderDay(); updateHint(); }, plan: renderPlan,
     settings: renderSettings, lib: renderLib, tools: renderTools, backup: renderBackup })[v]();
  saveNav();
}

// Düğme bağlamaları ve ilk hazırlıklar: main.js'teki açılış sırasında çağrılır
export function setup(){
initHelp();
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && wakeWanted) keepAwake(true); });
// kaydırma yeri yenilemeden hemen önce yazılır
addEventListener("pagehide", saveNav);
$("#bs").addEventListener("click", e => { if (e.target.id === "bs") closeSheet(); });
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (!$("#modal").classList.contains("hidden")) $("#modal").click();
  else if (!$("#bs").classList.contains("hidden")) closeSheet();
});
document.querySelectorAll("nav.tabs button").forEach(b => b.onclick = () => showTab(b.dataset.tab));
document.querySelectorAll(".seg").forEach(seg => seg.querySelectorAll("button").forEach(b => b.onclick = () => { segState[seg.dataset.seg] = b.dataset.v; renderSeg(seg.dataset.seg); }));
}
