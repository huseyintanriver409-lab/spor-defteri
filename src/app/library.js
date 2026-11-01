import { shortDate, ymd } from "../core/dates.ts";
import { $, LIB, esc, fmt, ic, save, setState, state, toast } from "./store.js";
import { EQUIPS, HOME, allEx, equipOf, musclesOf } from "./exercises.js";
import { emptyHTML, segState, showTab, undoable } from "./ui.js";
import { refreshDatalist, resetEditor } from "./log.js";
import { liveItems, openFocus } from "./live.js";
import { chart } from "./stats.js";

/* ---------- Library ---------- */
export function groups(){ return [...Object.keys(LIB), "Diğer"]; }
export function renderLib(){
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

/* ---------- Body ---------- */
export const BODY = [["weight","Kilo","kg"],["fat","Yağ oranı","%"],["waist","Bel","cm"],["chest","Göğüs","cm"],["arm","Kol","cm"],["thigh","Bacak","cm"],["hip","Kalça","cm"]];
export function renderBody(){
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

// Düğme bağlamaları ve ilk hazırlıklar: main.js'teki açılış sırasında çağrılır
export function setup(){
$("#cGroup").innerHTML = groups().map(g => `<option>${esc(g)}</option>`).join("");
$("#libEquip").innerHTML = `<option value="">Tüm ekipmanlar</option>` + EQUIPS.map(e => `<option>${e}</option>`).join("");
$("#libSearch").addEventListener("input", renderLib);
$("#libEquip").onchange = renderLib;
$("#libHome").onchange = renderLib;
$("#cAdd").onclick = () => {
  const name = $("#cName").value.trim(); if (!name) return toast("Hareketin adını yaz");
  if (allEx().some(e => e.name.toLocaleLowerCase("tr")===name.toLocaleLowerCase("tr"))) return toast("Bu hareket zaten var");
  state.custom.push({ name, group: $("#cGroup").value }); save(); refreshDatalist();
  $("#cName").value = ""; toast("Eklendi", "check"); renderLib();
};
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
}
