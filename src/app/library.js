import { shortDate, ymd } from "../core/dates.ts";
import { $, LIB, YOGA, ask, esc, fmt, ic, save, state, toast } from "./store.js";
import { EQUIPS, HOME, allEx, equipOf, groupShown, liftOn, musclesOf, yogaOn } from "./exercises.js";
import { emptyHTML, openPicker, renderSeg, segState, showTab, undoable } from "./ui.js";
import { matchExercise } from "../core/importer.ts";
import { mergeExercise } from "../core/merge.ts";
import { refreshDatalist, resetEditor } from "./log.js";
import { liveItems, openFocus } from "./live.js";
import { chart } from "./stats.js";

/* ---------- Library ---------- */
export function groups(){ return [...Object.keys(LIB), "Diğer"].filter(groupShown); }
export function renderLib(){
  const q = $("#libSearch").value.trim().toLocaleLowerCase("tr"), eqf = $("#libEquip").value, home = $("#libHome").checked;
  const ex = allEx().map(e => ({ ...e, m: musclesOf(e.name), eq: equipOf(e.name) })).filter(e => {
    if (eqf && e.eq !== eqf) return false;
    if (home && !HOME.includes(e.eq)) return false;
    if (!q) return true;
    return [e.name, e.group, e.eq, ...e.m.p, ...e.m.s].join(" ").toLocaleLowerCase("tr").includes(q);
  });
  const counts = {}; state.entries.forEach(e => counts[e.ex] = (counts[e.ex]||0)+1);
  // özel hareket kütüphanedekiyle aynı olabilir (ör. "Conventional Deadlift" → "Deadlift"): birleştirme önerilir
  const libNames = Object.values(LIB).flat(), twin = n => matchExercise(n, libNames);
  const open = q || eqf || home;
  // yoga pozları ağırlık hareketlerinden ayrı, kendi başlığıyla en altta
  const section = g => {
    const items = ex.filter(e => e.group===g); if (!items.length) return "";
    return `<details ${open ? "open" : ""}${g === YOGA ? ' id="libYoga"' : ""}><summary>${esc(g)} <span>(${items.length})</span></summary>` + items.map(e =>
      `<div class="exitem"><div class="grow"><div>${esc(e.name)}${counts[e.name] ? ` <span class="muted small">· ${counts[e.name]} kayıt</span>` : ""}</div>
        <div class="ms"><span class="tag">${e.eq}</span>${e.m.p.length ? `<b>${e.m.p.join(", ")}</b>` : ""}${e.m.s.length ? ` · yardımcı: ${e.m.s.join(", ")}` : ""}</div>
        ${e.custom && twin(e.name) ? `<button class="btn sm quiet" style="margin-top:6px" data-mg="${esc(e.name)}" data-to="${esc(twin(e.name))}">“${esc(twin(e.name))}” ile birleştir</button>` : ""}</div>
       ${e.custom ? `<button class="iconbtn" data-mg="${esc(e.name)}" title="Başka bir hareketle birleştir">${ic("arrow-left-right")}</button><button class="iconbtn danger" data-rm="${esc(e.name)}" title="Listeden kaldır">${ic("trash-2")}</button>` : ""}
       <a class="iconbtn" title="Nasıl yapılır? (internet gerekir)" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(e.name + (e.group === YOGA ? " yoga" : " exercise form"))}">${ic("circle-play")}</a>
       <button class="iconbtn" data-use="${esc(e.name)}" title="${state.live ? "Antrenmana ekle" : "Bu hareketi kaydet"}">${ic("circle-plus")}</button></div>`).join("") + `</details>`;
  };
  const main = groups().filter(g => g !== YOGA).map(section).join(""), yoga = yogaOn() ? section(YOGA) : "";
  $("#libList").innerHTML = (main && yoga ? `<div class="pk-head" style="margin:0 0 6px">${liftOn() ? "Ağırlık ve kondisyon" : "Kardiyo ve kendi hareketlerin"}</div>` : "") + main
    + (yoga ? `<div class="pk-head" style="margin:${main ? "18px" : "0"} 0 6px">Yoga ve esneme</div>${yoga}` : "") || emptyHTML("search", "Sonuç yok", "Başka bir kelimeyle ara ya da filtreleri kaldır.");
  $("#libList").querySelectorAll("[data-use]").forEach(b => b.onclick = () => {
    const n = b.dataset.use;
    if (state.live) { const items = liveItems(); let i = items.findIndex(x => x.ex === n); if (i < 0) { items.push({ ex: n, sets: 3, reps: "" }); i = items.length - 1; } state.live.idx = i; save(); openFocus(); return; }
    segState.train = "log"; showTab("train"); resetEditor(); $("#logEx").value = n; $("#logEx").dispatchEvent(new Event("input"));
    $("#setRows .w").focus();
  });
  $("#libList").querySelectorAll("[data-mg]").forEach(b => b.onclick = () => {
    const from = b.dataset.mg;
    if (b.dataset.to) mergeInto(from, b.dataset.to);
    else openPicker(`“${from}” hangi hareketle birleşsin?`, to => mergeInto(from, to));
  });
  $("#libList").querySelectorAll("[data-rm]").forEach(b => b.onclick = async () => {
    const n = b.dataset.rm;
    if (!(await ask(`"${n}" hareketi listeden kaldırılsın mı?\nBu hareketle girdiğin eski kayıtlar silinmez.`, "Kaldır"))) return;
    const i = state.custom.findIndex(c => c.name === n); if (i < 0) return;
    const [c] = state.custom.splice(i, 1);
    save(); refreshDatalist(); renderLib();
    undoable(`"${n}" kaldırıldı`, () => { state.custom.splice(i, 0, c); save(); refreshDatalist(); renderLib(); });
  });
}

// Eski adın bütün kayıtları, programları, başlangıç verisi ve notları yeni ada taşınır (core/merge.ts)
async function mergeInto(from, to){
  if (from === to) return toast("Aynı hareket seçildi");
  const n = state.entries.filter(e => e.ex === from).length;
  if (!(await ask(`“${from}” → “${to}”

${n ? `${n} kayıt, ` : ""}programlar, başlangıç verisi ve notlar “${to}” adına taşınır. “${from}” listeden kalkar.`, "Birleştir"))) return;
  const before = JSON.stringify(state);
  const r = mergeExercise(state, from, to);
  save(); refreshDatalist(); renderLib();
  undoable(`Birleştirildi: ${r.entries} kayıt, ${r.programs} program`, () => { Object.assign(state, JSON.parse(before)); save(); refreshDatalist(); renderLib(); });
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
  $("#bTable").querySelectorAll("[data-bdel]").forEach(btn => btn.onclick = async () => {
    if (!(await ask(`${shortDate(btn.dataset.bdel)} tarihli ölçü silinsin mi?`))) return;
    const i = state.body.findIndex(b => b.date === btn.dataset.bdel); if (i < 0) return;
    const [rec] = state.body.splice(i, 1);
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
// Programlar'daki yoga kartından: Hareketler'de yoga bölümü açık gelir
$("#yogaMoves").onclick = () => {
  $("#libSearch").value = ""; $("#libEquip").value = ""; $("#libHome").checked = false;
  segState.train = "lib"; renderSeg("train");
  const y = $("#libYoga"); y.open = true; y.scrollIntoView({ behavior: "smooth", block: "start" });
};
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
