import { e1rm, volume, warmupSets, work } from "../core/training.ts";
import { niceDate, ymd } from "../core/dates.ts";
import { t } from "../core/i18n.ts";
import { baseBest, baseSet } from "../core/baseline.ts";
import { $, ask, esc, fmt, ic, save, state, toast, uid } from "./store.js";
import { SET_TYPES, TYPE_LETTER, allEx, durText, equipOf, fmtSec, groupOf, isCardio, isTimed, isYoga, pickableEx, setLabel } from "./exercises.js";
import { buzz, emptyHTML, openPicker, segState, showTab, undoable } from "./ui.js";
import { autoLogged } from "./programs.js";

/* ---------- Manual log (geçmişe dönük ya da canlı mod olmadan kayıt) ---------- */
export let editingId = null;
export function refreshDatalist(){
  $("#exList").innerHTML = pickableEx().map(e => `<option value="${esc(e.name)}"></option>`).join("");
}
export function setRow(s = {}){
  const cardio = isCardio($("#logEx").value);
  const rir = s.rir == null ? "" : String(s.rir);
  const div = document.createElement("div");
  div.className = "setrow";
  div.innerHTML = `<button class="n" type="button" data-t="${s.t||""}"></button>
    <input type="number" inputmode="decimal" step="0.5" min="0" placeholder="${cardio?t("log.u_min"):t("log.u_kg")}" value="${s.w ?? ""}" class="w" aria-label="${cardio?t("log.l_time_min"):t("log.l_weight_kg")}">
    <input type="number" inputmode="${cardio?"decimal":"numeric"}" step="${cardio?"0.1":"1"}" min="0" placeholder="${cardio?t("log.u_km"):t("log.u_reps")}" value="${s.sec ?? s.r ?? ""}" class="r" aria-label="${cardio?t("log.l_distance_km"):t("log.l_reps")}">
    <select class="rir" aria-label="RIR"${cardio ? ' style="visibility:hidden"' : ""}><option value="">–</option>${[0,1,2,3,4,5].map(v => `<option value="${v}"${rir===String(v)?" selected":""}>${v===5?"5+":v}</option>`).join("")}</select>
    <button class="x" type="button" title="${t("log.delete_set")}">${ic("x")}</button>`;
  div.querySelector(".n").onclick = e => {
    const order = ["", "w", "d", "f"], b = e.currentTarget;
    b.dataset.t = order[(order.indexOf(b.dataset.t) + 1) % order.length];
    numberRows(); saveDraft();
  };
  div.querySelector(".x").onclick = () => { div.remove(); if (!$("#setRows").children.length) setRow(); numberRows(); saveDraft(); };
  $("#setRows").appendChild(div); numberRows();
  return div;
}
export function numberRows(){
  let k = 0;
  [...$("#setRows").children].forEach(d => {
    const b = d.querySelector(".n"), ty = b.dataset.t;
    b.textContent = ty === "w" ? TYPE_LETTER.w : (ty ? TYPE_LETTER[ty] : "") + (++k);
    const lbl = (ty ? SET_TYPES[ty] : t("log.normal_set")) + t("log.tap_to_change_type");
    b.title = lbl; b.setAttribute("aria-label", lbl);
  });
}
export function rowData(d){
  const o = { w: parseFloat(d.querySelector(".w").value)||0, r: parseFloat(d.querySelector(".r").value)||0 };
  const ty = d.querySelector(".n").dataset.t, rir = d.querySelector(".rir").value;
  const ex = $("#logEx").value;
  if (ty) o.t = ty;
  if (isTimed(ex)) { o.sec = o.r; o.r = 0; return o; }
  if (rir !== "" && !isCardio(ex)) o.rir = +rir;
  return o;
}
export const readRows = () => [...$("#setRows").children].map(rowData).filter(s => s.w || s.r || s.sec);
// yarım kalan girişler sayfa kapansa da kaybolmasın
export function saveDraft(){
  const ex = $("#logEx").value, timed = isTimed(ex);
  state.draft = { ex, date: $("#logDate").value, note: $("#logNote").value, editingId,
    rows: [...$("#setRows").children].map(d => {
      const o = { ...rowData(d), w: d.querySelector(".w").value, r: d.querySelector(".r").value };
      if (timed) o.sec = o.r;
      return o;
    }) };
  save();
}
export function restoreDraft(){
  const d = state.draft; if (!d) return false;
  $("#logEx").value = d.ex || ""; if (d.date) $("#logDate").value = d.date; $("#logNote").value = d.note || "";
  editingId = d.editingId && state.entries.some(e => e.id===d.editingId) ? d.editingId : null;
  if (editingId) { $("#editTitle").textContent = t("log.edit_entry"); $("#cancelEdit").classList.remove("hidden"); }
  $("#setRows").innerHTML = ""; (d.rows && d.rows.length ? d.rows : [{}]).forEach(r => setRow(r));
  relabel(); updateHint(); showExNote();
  return true;
}
export function resetEditor(keepEx){
  editingId = null;
  $("#editTitle").textContent = t("log.manual_entry");
  $("#cancelEdit").classList.add("hidden");
  $("#ovHint").classList.add("hidden");
  if (!keepEx) $("#logEx").value = "";
  $("#logNote").value = "";
  $("#setRows").innerHTML = ""; setRow(); relabel(); updateHint(); showExNote();
  state.draft = null; save();
}
export const barFor = ex => equipOf(ex) === "Barbell" ? 20 : 0;
export function relabel(){
  const ex = $("#logEx").value, cardio = isCardio(ex), timed = isTimed(ex);
  const [wl, rl] = cardio ? [t("log.u_min"), t("log.u_km")] : timed ? ["+" + t("log.u_kg"), t("log.u_sec")] : [t("log.u_kg"), t("log.u_reps")];
  $("#setRows").querySelectorAll(".w").forEach(i => { i.placeholder = wl; i.setAttribute("aria-label", cardio ? t("log.l_time_min") : timed ? t("log.l_extra_weight_kg") : t("log.l_weight_kg")); });
  $("#setRows").querySelectorAll(".r").forEach(i => { i.placeholder = rl; i.setAttribute("aria-label", cardio ? t("log.l_distance_km") : timed ? t("log.l_time_sec") : t("log.l_reps")); });
  $("#setRows").querySelectorAll(".rir").forEach(i => i.style.visibility = cardio || timed ? "hidden" : "");
  $("#hW").textContent = cardio ? t("log.u_min") : timed ? "+" + t("log.u_kg") : t("log.u_kg"); $("#hR").textContent = cardio ? t("log.u_km") : timed ? t("log.u_sec") : t("log.u_reps");
  $("#hRir").style.visibility = cardio || timed ? "hidden" : "";
  // yoga pozunda ek ağırlık olmaz
  const yoga = timed && isYoga(ex);
  $("#setRows").querySelectorAll(".w").forEach(i => i.style.visibility = yoga ? "hidden" : "");
  $("#hW").style.visibility = yoga ? "hidden" : "";
}
export function showExNote(){
  const ex = $("#logEx").value.trim(), ta = $("#exNote");
  const known = ex && allEx().some(e => e.name===ex);
  ta.classList.toggle("hidden", !known);
  if (known) ta.value = state.exNotes[ex] || "";
}
export function prevEntry(ex, beforeOrOn, excludeId){
  return state.entries.filter(e => e.ex===ex && e.id!==excludeId && e.date <= beforeOrOn)
    .sort((a,b) => b.date.localeCompare(a.date) || b.ts-a.ts)[0];
}
export function updateHint(){
  const ex = $("#logEx").value.trim(), h = $("#lastHint");
  const prev = prevEntry(ex, $("#logDate").value, editingId);
  const c = isCardio(ex), b = state.baseline[ex];
  if (!prev && b && b.date <= $("#logDate").value){
    h.innerHTML = t("log.base_hint_html", { date: niceDate(b.date) }) + " " + setLabel(baseSet(b), c);
    h.classList.remove("hidden"); return;
  }
  if (!prev){ h.classList.add("hidden"); return; }
  h.innerHTML = t("log.last_hint_html", { date: niceDate(prev.date) }) + " " + work(prev.sets).map(s => setLabel(s,c)).join(", ") + (prev.note ? `<br>${ic("notebook-pen")} ${esc(prev.note)}` : "");
  h.classList.remove("hidden");
}
export function bestOf(ex, excludeId){
  // başlangıç verisi de sayılır: ilk antrenmanda onu geçmek rekordur
  let { w, e } = baseBest(state.baseline[ex]), n = state.baseline[ex] ? 1 : 0;
  state.entries.forEach(x => { if (x.ex===ex && x.id!==excludeId) work(x.sets).forEach(s => { n++; w = Math.max(w, +s.w||0); if (s.r<=12) e = Math.max(e, e1rm(+s.w||0, +s.r||0)); }); });
  return { w, e, n };
}
export const bestSecOf = (ex, excludeId) => Math.max(+(state.baseline[ex] || {}).sec || 0, ...state.entries.filter(x => x.ex===ex && x.id!==excludeId).flatMap(x => work(x.sets)).map(s => +s.sec||0));
export function saveEditor(){
  const ex = $("#logEx").value.trim(), date = $("#logDate").value, sets = readRows(), note = $("#logNote").value.trim();
  if (!ex) { toast(t("log.pick_ex")); return false; }
  if (!date) { toast(t("log.pick_date")); return false; }
  if (!sets.length) { toast(t("log.enter_set")); return false; }
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
  let msg = t("log.saved"), icon = "check";
  const ws = work(sets);
  if (isTimed(ex)) {
    const ns = Math.max(0, ...ws.map(s => +s.sec||0));
    if (before.n && ns > beforeSec) { msg = t("log.time_record", { t: fmtSec(ns) }); icon = "trophy"; }
  } else if (!isCardio(ex) && before.n && ws.length) {
    const nw = Math.max(...ws.map(s => +s.w||0)), ne = Math.max(...ws.filter(s => s.r<=12).map(s => e1rm(+s.w||0, +s.r||0)), 0);
    if (nw > before.w) { msg = t("log.record_kg", { w: fmt(nw) }); icon = "trophy"; }
    else if (ne > before.e + 0.05) { msg = t("log.est_1rm", { w: fmt(ne) }); icon = "trophy"; }
  }
  toast(msg, icon); buzz(icon === "trophy" ? [30,60,30,60,80] : 20);
  resetEditor(true); renderDay();
  return true;
}

export function entryHTML(e, actions, prs){
  const c = isCardio(e.ex);
  const extra = c ? t("log.total_min", { n: fmt(e.sets.reduce((a,s)=>a+(+s.w||0),0)) })
    : isTimed(e.ex) ? t("log.sets_total_time", { n: work(e.sets).length, t: fmtSec(work(e.sets).reduce((a,s)=>a+(+s.sec||0),0)) })
    : t("log.sets_volume", { n: work(e.sets).length, v: fmt(volume(e.sets)) });
  let k = 0;
  const chips = e.sets.map((s,i) => {
    const warm = s.t === "w", pr = prs && prs.has(i);
    const lbl = warm ? TYPE_LETTER.w : (s.t ? TYPE_LETTER[s.t] : "") + (++k);
    return `<span class="chip${warm ? " warm" : ""}${pr ? " pr" : ""}" title="${s.t ? SET_TYPES[s.t] : t("log.normal_set")}">${pr ? ic("trophy") : ""}${lbl}) ${setLabel(s,c)}</span>`;
  }).join("");
  return `<div class="entry"><div class="row"><div class="grow"><div class="t">${esc(e.ex)}</div><div class="g">${esc(groupOf(e.ex))} · ${extra}</div></div>
    ${actions ? `<button class="iconbtn" data-edit="${e.id}" title="${t("log.edit")}">${ic("pencil")}</button><button class="iconbtn danger" data-del="${e.id}" title="${t("log.delete")}">${ic("trash-2")}</button>` : ""}</div>
    <div class="chips">${chips}</div>${e.note ? `<div class="note">${ic("notebook-pen")}${esc(e.note)}</div>` : ""}</div>`;
}
export function bindEntryActions(root, rerender){
  root.querySelectorAll("[data-del]").forEach(b => b.onclick = () => deleteEntry(b.dataset.del, rerender));
  root.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => editEntry(b.dataset.edit));
}
// Silmeden önce sorar: telefon cepteyken yanlışlıkla dokunulunca kayıt gitmesin. "Geri al" yine de kalır.
export async function deleteEntry(id, rerender){
  const found = state.entries.find(e => e.id===id); if (!found) return;
  if (!(await ask(t("log.confirm_delete", { n: found.sets.length, date: niceDate(found.date) })))) return;
  const i = state.entries.findIndex(e => e.id===id); if (i < 0) return;
  const [e] = state.entries.splice(i, 1); save(); rerender(); buzz(15);
  undoable(t("log.deleted", { ex: e.ex }), () => { state.entries.splice(Math.min(i, state.entries.length), 0, e); save(); rerender(); });
}
export function editEntry(id){
  const e = state.entries.find(x => x.id===id); if (!e) return;
  segState.train = "log"; showTab("train");
  editingId = e.id; $("#logEx").value = e.ex; $("#logDate").value = e.date; $("#logNote").value = e.note || "";
  $("#setRows").innerHTML = ""; e.sets.forEach(s => setRow(s));
  $("#editTitle").textContent = t("log.edit_entry"); $("#cancelEdit").classList.remove("hidden"); $("#ovHint").classList.add("hidden");
  relabel(); updateHint(); showExNote(); saveDraft(); renderDay(); scrollTo(0,0);
}
export function renderDay(){
  const date = $("#logDate").value;
  $("#dayTitle").textContent = date === ymd(new Date()) ? t("log.today") : niceDate(date);
  const list = state.entries.filter(e => e.date===date).sort((a,b) => a.ts-b.ts);
  $("#dayList").innerHTML = list.length ? list.map(e => entryHTML(e,true)).join("") : emptyHTML("calendar-days", t("log.no_entries"), "");
  const ss = state.sessions.filter(s => s.date===date);
  // antrenman Google Takvim'e kendiliğinden yazıldıysa elle eklemek kopya oluşturur
  $("#dayCal").classList.toggle("hidden", !list.length || autoLogged(ss));
  $("#daySess").innerHTML = ss.length ? `${ic("timer")} ${t("log.duration", { d: durText(ss.reduce((a,s) => a + s.end - s.start, 0)) })}` : "";
  bindEntryActions($("#dayList"), () => { renderDay(); updateHint(); });
}

// Düğme bağlamaları ve ilk hazırlıklar: main.js'teki açılış sırasında çağrılır
export function setup(){
$("#setRows").addEventListener("input", saveDraft);
$("#setRows").addEventListener("change", saveDraft);
$("#logNote").addEventListener("input", saveDraft);
$("#logEx").onclick = () => openPicker(t("log.pick_ex"), n => { $("#logEx").value = n; $("#logEx").dispatchEvent(new Event("input")); });
$("#logEx").addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("#logEx").click(); } });
$("#addSet").onclick = () => {
  const rows = $("#setRows").children, last = rows[rows.length-1];
  const s = last ? rowData(last) : {};
  setRow({ w: last ? last.querySelector(".w").value : "", r: last ? last.querySelector(".r").value : "", rir: s.rir });
  $("#setRows").lastChild.querySelector(".w").focus(); saveDraft();
};
$("#addWarm").onclick = () => {
  const ex = $("#logEx").value.trim();
  if (!ex) return toast(t("log.pick_ex"));
  if (isCardio(ex)) return toast(t("log.no_cardio_warm"));
  const rows = [...$("#setRows").children].filter(d => d.querySelector(".n").dataset.t !== "w");
  const first = rows.map(rowData).find(s => s.w > 0);
  if (!first) return toast(t("log.enter_weight_first"));
  const ws = warmupSets(first.w, barFor(ex));
  if (!ws.length) return toast(t("log.no_warm_needed"));
  const keep = rows.map(d => ({ ...rowData(d), w: d.querySelector(".w").value, r: d.querySelector(".r").value }));
  $("#setRows").innerHTML = "";
  ws.forEach(s => setRow({ ...s, t: "w" })); keep.forEach(s => setRow(s));
  saveDraft(); toast(t("log.warm_added", { n: ws.length }), "flame");
};
$("#logEx").addEventListener("input", () => { updateHint(); relabel(); $("#ovHint").classList.add("hidden"); showExNote(); saveDraft(); });
$("#logDate").addEventListener("change", () => { renderDay(); updateHint(); saveDraft(); });
$("#exNote").addEventListener("input", () => {
  const ex = $("#logEx").value.trim(), v = $("#exNote").value.trim(); if (!ex) return;
  if (v) state.exNotes[ex] = $("#exNote").value; else delete state.exNotes[ex];
  save();
});
$("#saveEntry").onclick = () => saveEditor();
$("#cancelEdit").onclick = () => { resetEditor(); renderDay(); };
}
