import { poseInfo } from "./yoga.js";
import { shortDate, ymd } from "../core/dates.ts";
import { searchFold, t } from "../core/i18n.ts";
import { YOGA_POSES, filterPosePhase } from "../core/library.ts";
import { groupLabel } from "../core/library.ts";
import { $, LIB, YOGA, ask, esc, fmt, ic, save, state, toast } from "./store.js";
import { EQUIPS, HOME, allEx, equipLabel, equipOf, groupShown, liftOn, musclesOf, yogaOn } from "./exercises.js";
import { emptyHTML, openPicker, renderSeg, segState, showTab, undoable } from "./ui.js";
import { matchExercise } from "../core/importer.ts";
import { mergeExercise } from "../core/merge.ts";
import { refreshDatalist, resetEditor } from "./log.js";
import { liveItems, openFocus } from "./live.js";
import { chart } from "./stats.js";
import { EX_SETS, bindBodyMap, bodyMap, exerciseLevels, miniMap } from "./bodymap.js";
import { MUSCLES, muscleLabel, muscleSearchText } from "../core/musclemap.ts";

/* ---------- Library ---------- */
export function groups(){ return [...Object.keys(LIB), "Diğer"].filter(groupShown); }
let phase = "all";
export function renderLib(){
  $("#libMapCard").classList.toggle("hidden", !liftOn());
  if (liftOn() && !$("#libMap").innerHTML) { $("#libMap").innerHTML = bodyMap(Object.fromEntries(MUSCLES.map(m => [m, "sec"])), { large: true, plain: true, toggle: true }); bindBodyMap($("#libMap")); }
  const q = searchFold($("#libSearch").value.trim()), eqf = $("#libEquip").value, home = $("#libHome").checked;
  const ex = allEx().map(e => ({ ...e, m: musclesOf(e.name), eq: equipOf(e.name) })).filter(e => {
    if (eqf && e.eq !== eqf) return false;
    if (home && !HOME.includes(e.eq)) return false;
    if (!q) return true;
    return [e.name, e.group, groupLabel(e.group), e.eq, equipLabel(e.eq), ...e.m.p.map(muscleSearchText), ...e.m.s.map(muscleSearchText)].map(searchFold).join(" ").includes(q);
  });
  const counts = {}; state.entries.forEach(e => counts[e.ex] = (counts[e.ex]||0)+1);
  // özel hareket kütüphanedekiyle aynı olabilir (ör. "Conventional Deadlift" → "Deadlift"): birleştirme önerilir
  const libNames = Object.values(LIB).flat(), twin = n => matchExercise(n, libNames);
  // yalnız aramada gruplar açık gelir; ekipman ve "Evde yapılabilir" filtresinde kapalı kalır, sayılar görünür
  const open = !!q;
  // yoga pozları ağırlık hareketlerinden ayrı, kendi başlığıyla en altta
  const section = g => {
    const phaseNames = new Set(filterPosePhase(YOGA_POSES, phase).map(p => p.ex));
    const items = ex.filter(e => e.group===g && (g !== YOGA || phase === "all" || phaseNames.has(e.name))); if (!items.length) return "";
    return `<details ${open ? "open" : ""}${g === YOGA ? ' id="libYoga"' : ""}><summary>${esc(groupLabel(g))} <span>(${items.length})</span></summary>` + items.map(e =>
      `<div class="exitem">${miniMap(e.name)}<div class="grow" data-more><div>${esc(e.name)}${poseInfo(e.name)}${counts[e.name] ? ` <span class="muted small">· ${t("library.records", { n: counts[e.name] })}</span>` : ""}</div>
        <div class="ms"><span class="tag">${esc(equipLabel(e.eq))}</span><span class="more">${t("library.in_sets", { n: EX_SETS })} ${exerciseLevels(e.m).map(([k, l, ms]) => `<span class="lv"><i class="bm-dot" data-t="g-${k}"></i><b>${l}</b> ${esc(ms.map(muscleLabel).join(", "))}</span>`).join("")}</span></div>
        ${e.custom && twin(e.name) ? `<button class="btn sm quiet" style="margin-top:6px" data-mg="${esc(e.name)}" data-to="${esc(twin(e.name))}">${t("library.merge_with", { name: esc(twin(e.name)) })}</button>` : ""}</div>
       ${e.custom ? `<button class="iconbtn" data-mg="${esc(e.name)}" title="${t("library.merge_other")}" aria-label="${t("library.merge_other")}" data-i18n-aria="library.merge_other">${ic("arrow-left-right")}</button><button class="iconbtn danger" data-rm="${esc(e.name)}" title="${t("library.remove")}" aria-label="${t("library.remove")}" data-i18n-aria="library.remove">${ic("trash-2")}</button>` : ""}
       <a class="iconbtn" title="${t("library.how_to")}" aria-label="${t("library.how_to")}" data-i18n-aria="library.how_to" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(e.name + (e.group === YOGA ? " yoga" : " exercise form"))}">${ic("circle-play")}</a>
       <button class="iconbtn" data-use="${esc(e.name)}" title="${t("library.add")}" aria-label="${t("library.add_named", { name: esc(e.name) })}">${ic("circle-plus")}</button></div>`).join("") + `</details>`;
  };
  const main = groups().filter(g => g !== YOGA).map(section).join(""), yoga = yogaOn() ? section(YOGA) : "";
  const phaseChips = yogaOn() ? `<div class="fchips phase-filters">${["all", "pre", "post"].map(k => `<button class="fchip${phase === k ? " on" : ""}" data-phase="${k}" aria-pressed="${phase === k}">${t({ all: "programs.filter_all", pre: "programs.filter_pre", post: "programs.filter_post" }[k])}</button>`).join("")}</div>` : "";
  $("#libList").innerHTML = phaseChips + ((main && yoga ? `<div class="pk-head" style="margin:0 0 6px">${liftOn() ? t("library.part_lift") : t("library.part_cardio")}</div>` : "") + main
    + (yoga ? `<div class="pk-head" style="margin:${main ? "18px" : "0"} 0 6px">${t("library.part_yoga")}</div>${yoga}` : "") || emptyHTML("search", t("library.no_results"), "") + `<button class="btn sm quiet" data-clear style="margin-top:8px">${t("library.clear_filters")}</button>`);
  $("#libList").querySelectorAll("[data-phase]").forEach(b => b.onclick = () => { phase = b.dataset.phase; renderLib(); });
  // filtreleri temizle: arama, ekipman ve "Evde" filtresini sıfırlar (yogaMoves ile aynı sıfırlama)
  const clearBtn = $("#libList").querySelector("[data-clear]");
  if (clearBtn) clearBtn.onclick = () => { phase = "all"; $("#libSearch").value = ""; $("#libEquip").value = ""; $("#libHome").checked = false; renderLib(); };
  // kas adları resmin yerine geçmez: harekete dokununca açılır
  $("#libList").querySelectorAll("[data-more]").forEach(g => g.onclick = e => { if (!e.target.closest("button")) g.parentElement.classList.toggle("open"); });
  $("#libList").querySelectorAll("[data-use]").forEach(b => b.onclick = () => {
    const n = b.dataset.use;
    if (state.live) { const items = liveItems(); let i = items.findIndex(x => x.ex === n); if (i < 0) { items.push({ ex: n, sets: 3, reps: "" }); i = items.length - 1; } state.live.idx = i; save(); openFocus(); return; }
    segState.train = "log"; showTab("train"); resetEditor(); $("#logEx").value = n; $("#logEx").dispatchEvent(new Event("input"));
    $("#setRows .w").focus();
  });
  $("#libList").querySelectorAll("[data-mg]").forEach(b => b.onclick = () => {
    const from = b.dataset.mg;
    if (b.dataset.to) mergeInto(from, b.dataset.to);
    else openPicker(t("library.merge_pick", { name: from }), to => mergeInto(from, to));
  });
  $("#libList").querySelectorAll("[data-rm]").forEach(b => b.onclick = async () => {
    const n = b.dataset.rm;
    if (!(await ask(t("library.remove_confirm", { name: n }), t("library.remove_yes")))) return;
    const i = state.custom.findIndex(c => c.name === n); if (i < 0) return;
    const [c] = state.custom.splice(i, 1);
    save(); refreshDatalist(); renderLib();
    undoable(t("library.removed", { name: n }), () => { state.custom.splice(i, 0, c); save(); refreshDatalist(); renderLib(); });
  });
}

// Eski adın bütün kayıtları, programları, başlangıç verisi ve notları yeni ada taşınır (core/merge.ts)
async function mergeInto(from, to){
  if (from === to) return toast(t("library.same_ex"));
  if (!(await ask(t("library.merge_confirm", { from, to }), t("library.merge_yes")))) return;
  const before = JSON.stringify(state);
  const r = mergeExercise(state, from, to);
  save(); refreshDatalist(); renderLib();
  undoable(t("library.merged", { entries: r.entries, programs: r.programs }), () => { Object.assign(state, JSON.parse(before)); save(); refreshDatalist(); renderLib(); });
}

/* ---------- Body ---------- */
export const BODY = [["weight",t("library.m_weight"),t("library.u_kg")],["fat",t("library.m_fat"),"%"],["waist",t("library.m_waist"),t("library.u_cm")],["chest",t("library.m_chest"),t("library.u_cm")],["arm",t("library.m_arm"),t("library.u_cm")],["thigh",t("library.m_thigh"),t("library.u_cm")],["hip",t("library.m_hip"),t("library.u_cm")],["reach",t("library.m_reach"),t("library.u_cm")],["balance",t("library.m_balance"),t("library.u_sec")]];
// esneklik ve denge (yoga açıkken görünür); otur-uzan eksi olabilir
const FLEX = ["reach", "balance"];
const bodyKeys = () => BODY.filter(([k]) => yogaOn() || !FLEX.includes(k));
const has = v => v != null && v !== "";
export function renderBody(){
  if (!$("#bDate").value) $("#bDate").value = ymd(new Date());
  BODY.forEach(([k]) => { $("#b_"+k).value = state.body.find(b => b.date === $("#bDate").value)?.[k] ?? ""; });
  $("#flexFields").classList.toggle("hidden", !yogaOn());
  const cur = $("#bMetric").value;
  $("#bMetric").innerHTML = bodyKeys().map(([k,l,u]) => `<option value="${k}">${l} (${u})</option>`).join("");
  $("#bMetric").value = bodyKeys().some(([k]) => k === cur) ? cur : "weight";
  const k = $("#bMetric").value, [ , label, unit] = BODY.find(b => b[0]===k);
  const list = state.body.slice().sort((a,b) => a.date.localeCompare(b.date));
  const pts = list.filter(b => has(b[k])).map(b => ({ date: b.date, v: b[k] }));
  $("#bChart").innerHTML = chart(pts);
  $("#bDelta").textContent = pts.length >= 2 ? t("library.delta", { label, change: (pts[pts.length-1].v - pts[0].v >= 0 ? "+" : "") + fmt(pts[pts.length-1].v - pts[0].v), unit, from: shortDate(pts[0].date), to: shortDate(pts[pts.length-1].date) }) : "";
  // yalnız en az bir kaydı olan ölçüler sütun olur
  const cols = bodyKeys().filter(([k]) => list.some(b => has(b[k])));
  $("#bTable").innerHTML = list.length ? `<tr><th>${t("library.date")}</th>${cols.map(([,l]) => `<th>${l}</th>`).join("")}<th></th></tr>` +
    list.slice().reverse().map(b => `<tr><td>${shortDate(b.date)}</td>${cols.map(([k]) => `<td>${has(b[k]) ? fmt(b[k]) : "–"}</td>`).join("")}<td><button class="iconbtn danger" data-bdel="${b.date}" title="${t("library.delete")}" aria-label="${t("library.delete")}" data-i18n-aria="library.delete">${ic("trash-2")}</button></td></tr>`).join("")
    : `<tr><td>${emptyHTML("ruler", t("library.no_records"), "")}</td></tr>`;
  $("#bTable").querySelectorAll("[data-bdel]").forEach(btn => btn.onclick = async () => {
    if (!(await ask(t("library.body_del_confirm", { date: shortDate(btn.dataset.bdel) })))) return;
    const i = state.body.findIndex(b => b.date === btn.dataset.bdel); if (i < 0) return;
    const [rec] = state.body.splice(i, 1);
    save(); renderBody();
    undoable(t("library.body_deleted"), () => { state.body.splice(i, 0, rec); save(); renderBody(); });
  });
}

// Düğme bağlamaları ve ilk hazırlıklar: main.js'teki açılış sırasında çağrılır
export function setup(){
$("#cGroup").innerHTML = groups().map(g => `<option value="${esc(g)}">${esc(groupLabel(g))}</option>`).join("");
$("#libEquip").innerHTML = `<option value="">${t("library.all_equip")}</option>` + EQUIPS.map(e => `<option value="${esc(e)}">${esc(equipLabel(e))}</option>`).join("");
$("#libSearch").addEventListener("input", renderLib);
$("#libEquip").onchange = renderLib;
$("#libHome").onchange = renderLib;
// Programlar'daki yoga kartından: Hareketler'de yoga bölümü açık gelir
$("#yogaMoves").onclick = () => {
  phase = "all"; $("#libSearch").value = ""; $("#libEquip").value = ""; $("#libHome").checked = false;
  segState.train = "lib"; renderSeg("train");
  const y = $("#libYoga"); y.open = true; y.scrollIntoView({ behavior: "smooth", block: "start" });
};
$("#cAdd").onclick = () => {
  const name = $("#cName").value.trim(); if (!name) return toast(t("library.name_req"));
  if (allEx().some(e => searchFold(e.name)===searchFold(name))) return toast(t("library.exists"));
  state.custom.push({ name, group: $("#cGroup").value }); save(); refreshDatalist();
  $("#cName").value = ""; toast(t("library.added"), "check"); renderLib();
};
$("#bMetric").onchange = renderBody;
$("#bDate").onchange = renderBody;
BODY.forEach(([k]) => { $("#b_"+k).onchange = () => {
  const input = $("#b_"+k), date = $("#bDate").value, v = parseFloat(input.value);
  if (!date || !input.reportValidity() || !(k === "reach" ? Number.isFinite(v) : v > 0)) return;
  const rec = state.body.find(b => b.date === date);
  if (rec) rec[k] = v; else state.body.push({ date, [k]: v });
  save(); renderBody();
}; });
}
