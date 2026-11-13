import { programItems } from "../core/program-data.ts";
import { programGroup } from "../core/weekly-load.ts";
import { programWeek, renderWeeklyMap } from "./weekly-map.js";
import { volumePlan } from "./beginner-volume.js";
import { shortHelp } from "./short-help.js";
import { buildQuickFlow } from "../core/yoga.ts";
import { YOGA_POSES } from "../core/library.ts";
import { yogaRegions, poseInfo, regionLabel } from "./yoga.js";
import { startQuickWorkout } from "./live.js";
import { exerciseRestSeconds } from "../core/rest.ts";
import { bestOf } from "./log.js";
import { programName } from "../core/programs.ts";
import { MONTHS, pad, parse, ymd } from "../core/dates.ts";
import { t } from "../core/i18n.ts";
import { groupLabel } from "../core/library.ts";
import { volume, work } from "../core/training.ts";
import { $, ask, esc, fmt, ic, save, state, toast, uid } from "./store.js";
import { allEx, durText, equipOf, groupOf, isCardio, isTimed, musclesOf, liftOn, setLabel, yogaOn, isYoga, isSport, visiblePrograms } from "./exercises.js";
import { buzz, closeSheet, openPicker, openSheet, sheetHead, undoable } from "./ui.js";
import { bindBodyMap, sessionLoadHTML } from "./bodymap.js";
import { refreshDatalist } from "./log.js";
import { startWorkout } from "./live.js";
import { shareProgram, openAiSheet } from "./importer.js";
import { openLibrary } from "./presets.js";
import { dropProgram, fillWeek, isRot, keepRotation } from "../core/plan.ts";
import { plannedDates, plannedOn } from "../core/calendar.ts";

/* ---------- Programs ---------- */
export let progEditId = null;
export function pRow(it = {ex:"", sets:3, reps:"10"}){
  const div = document.createElement("div");
  div.className = "prow";
  div.innerHTML = `<button class="pss${it.ss ? " on" : ""}" type="button" title="${t("programs.ss_title")}" aria-label="${t("programs.ss_title")}" data-i18n-aria="programs.ss_title" aria-pressed="${!!it.ss}">${ic("arrow-left-right")}</button>
    <div class="pickfield"><input class="pe" readonly placeholder="${t("programs.ex_placeholder")}" value="${esc(it.ex)}" aria-label="${t("programs.ex_aria")}"></div>
    <input class="ps" type="number" inputmode="numeric" min="1" value="${esc(it.sets ?? 0)}" aria-label="${t("programs.sets_aria")}">
    <input class="pr" placeholder="8-12" value="${esc(it.reps ?? "")}" aria-label="${t("programs.reps_aria")}">
    <button class="iconbtn danger" title="${t("programs.remove_ex")}" aria-label="${t("programs.remove_ex")}" data-i18n-aria="programs.remove_ex">${ic("x")}</button>`;
  const ss = div.querySelector(".pss");
  ss.onclick = () => { ss.classList.toggle("on"); ss.setAttribute("aria-pressed", ss.classList.contains("on")); };
  const pe = div.querySelector(".pe");
  pe.onclick = () => openPicker(t("programs.ex_placeholder"), n => { pe.value = n; renderEditorLoad(); });
  pe.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pe.click(); } };
  div.querySelector(".danger").onclick = () => { div.remove(); renderEditorLoad(); };
  $("#pRows").appendChild(div); renderEditorLoad();
  return div;
}
// program formu yalnız "Program ekle > Kendin kur" ya da Düzenle ile açılır
function showEditor(on){ $("#pEditor").classList.toggle("hidden", !on); $("#pList").classList.toggle("editing", on); syncPrimary(); }
// aynı görünümde tek kiraz: editör açıkken #pSave; kapalıyken yalnız bir "Başla" kiraz (bugün planlı program, yoksa ilk program), diğerleri sessiz
let primaryId = null;
function syncPrimary(){
  const editing = !$("#pEditor").classList.contains("hidden");
  $("#pList").querySelectorAll("[data-start]").forEach(b => {
    const hot = !editing && b.dataset.start === primaryId;
    b.classList.toggle("primary", hot);
    b.classList.toggle("quiet", !editing && !hot);
  });
}
// Yeni program formunu açar
function newProgram(){ resetProgEditor(); showEditor(true); $("#pEditor").scrollIntoView({ behavior: "smooth", block: "start" }); $("#pName").focus({ preventScroll: true }); }
// "Program ekle" sayfası: Hazır (kütüphane + "Hangisi bana uygun?" sihirbazı), Yapay zekâ ile, Kendin kur
export function openAddProgram(){
  const body = openSheet(sheetHead(t("programs.add_program")),
    `<div class="addopts"><button class="btn" id="apLib">${ic("list")}${t("programs.add_lib")}</button><button class="btn" id="apAi">${ic("sparkles")}${t("programs.add_ai")}</button><button class="btn" id="apOwn">${ic("pencil")}${t("programs.add_own")}</button></div>`);
  body.querySelector("#apLib").onclick = () => openLibrary();
  body.querySelector("#apAi").onclick = () => openAiSheet();
  body.querySelector("#apOwn").onclick = () => { closeSheet(); newProgram(); };
}
export function resetProgEditor(){
  progEditId = null; $("#pTitle").textContent = t("programs.new_program"); $("#pName").value = "";
  $("#pRows").innerHTML = ""; pRow(); showEditor(false);
}
// süperset grupları için A1/A2, B1/B2 etiketleri; tek başına hareketler etiketsiz
export function ssLabels(items){
  const groups = []; items.forEach((it, k) => { if (it.ss && k > 0) groups[groups.length-1].push(k); else groups.push([k]); });
  const out = items.map(() => ""); let g = 0;
  groups.forEach(gr => { if (gr.length > 1) { const L = String.fromCharCode(65 + g++); gr.forEach((k, j) => out[k] = L + (j+1)); } });
  return out;
}
export const ssTag = l => l ? `<span class="ssl">${l}</span>` : "";
// Programın bir antrenmanda kaslara yükü: aynı kası çalıştıran hareketler üst üste binerse uyarır
export function openProgramMap(p){
  const ids = programGroup(state.programs, p.id), names = shortNames(ids);
  const body = openSheet(sheetHead(programName(p)), "");
  let selected = -1;
  const render = () => renderWeeklyMap(body, programWeek(p.id), ids.map((id, i) => ({ name: names[i], items: volumePlan(state.programs.find(p => p.id === id)).items })), selected,
    value => { selected = value; render(); }, { tap: true, small: false });
  render();
}
// Program yazarken: o anki hareketlerin kas yükü
export function renderEditorLoad(){
  const items = [...$("#pRows").children].map(d => ({ ex: d.querySelector(".pe").value.trim(), sets: Math.max(1, parseInt(d.querySelector(".ps").value) || 1) }));
  const html = liftOn() ? sessionLoadHTML(items) : "";
  $("#pLoad").innerHTML = html ? `<div class="pk-head">${t("programs.editor_load")}</div>${html}` : "";
  bindBodyMap($("#pLoad"));
}
export function renderProg(){
  $("#yogaQuick").onclick = openQuickFlow;
  $("#yogaCard").classList.toggle("hidden", !yogaOn());
  // tek kiraz "Başla": bugün planlı program varsa o, yoksa listedeki ilk program
  const programs = visiblePrograms();
  primaryId = (plannedOn(state.plan, programs, ymd(new Date())) || programs[0] || {}).id ?? null;
  $("#pList").innerHTML = programs.length ? programs.map(p => {
    const L = ssLabels(programItems(p)), total = programItems(p).reduce((a,i) => a + i.sets, 0);
    return `<div class="card progcard">
      <div class="eyebrow">${t("programs.eyebrow", { n: programItems(p).length, sets: total })}</div>
      <div class="progtop"><h3>${esc(programName(p))}</h3><button class="iconbtn" data-pmap="${p.id}" aria-label="${t("programs.muscle_map")}" title="${t("programs.muscle_map")}">${ic("body")}</button></div>
      <ol>${programItems(p).map((i,k) => `<li>${ssTag(L[k])}${esc(i.ex)}${poseInfo(i.ex)}<span>${i.sets} × ${esc(i.reps||"–")}${i.reps && isTimed(i.ex) ? " " + t("programs.sec") : ""}</span></li>`).join("")}</ol>
      <div class="row"><button class="btn" data-start="${p.id}">${ic("play")}${t("programs.start")}</button><span class="grow"></span>
        ${state.gcal.plan ? "" : `<button class="iconbtn" data-pcal="${p.id}" title="${t("programs.cal_add")}" aria-label="${t("programs.cal_add")}" data-i18n-aria="programs.cal_add">${ic("calendar-plus")}</button>`}<button class="iconbtn" data-pedit="${p.id}" title="${t("programs.edit")}" aria-label="${t("programs.edit")}" data-i18n-aria="programs.edit">${ic("pencil")}</button><button class="iconbtn" data-pshare="${p.id}" title="${t("programs.share")}" aria-label="${t("programs.share")}" data-i18n-aria="programs.share">${ic("share-2")}</button><button class="iconbtn" data-pcopy="${p.id}" title="${t("programs.copy")}" aria-label="${t("programs.copy")}" data-i18n-aria="programs.copy">${ic("copy")}</button><button class="iconbtn danger" data-pdel="${p.id}" title="${t("programs.delete")}" aria-label="${t("programs.delete")}" data-i18n-aria="programs.delete">${ic("trash-2")}</button></div>
    </div>`; }).join("") + `<button class="btn quiet padd" data-padd>${ic("plus")}${t("programs.new_program")}</button>`
    : `<button class="btn primary addbox" data-padd aria-label="${t("programs.add_program")}">${ic("plus")}${t("programs.add_program")}</button>`;
  $("#pList").querySelectorAll("[data-padd]").forEach(b => b.onclick = openAddProgram);
  syncPrimary();
  const find = id => state.programs.find(p => p.id===id);
  $("#pList").querySelectorAll("[data-start]").forEach(b => b.onclick = () => startWorkout(b.dataset.start));
  $("#pList").querySelectorAll("[data-pmap]").forEach(b => b.onclick = () => openProgramMap(find(b.dataset.pmap)));
  $("#pList").querySelectorAll("[data-pcal]").forEach(b => b.onclick = () => openCalModal(find(b.dataset.pcal)));
  $("#pList").querySelectorAll("[data-pedit]").forEach(b => b.onclick = () => {
    const p = find(b.dataset.pedit); progEditId = p.id;
    $("#pTitle").textContent = t("programs.edit_program"); $("#pName").value = programName(p);
    $("#pRows").innerHTML = ""; programItems(p).forEach(i => pRow(i)); showEditor(true);
    $("#pEditor").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#pList").querySelectorAll("[data-pshare]").forEach(b => b.onclick = () => shareProgram(find(b.dataset.pshare)));
  $("#pList").querySelectorAll("[data-pcopy]").forEach(b => b.onclick = () => {
    const p = find(b.dataset.pcopy);
    state.programs.push({ id: uid(), selectedDate: ymd(new Date()), name: t("programs.copy_name", { name: programName(p) }), items: programItems(p).map(i => ({...i})) }); save(); renderProg(); toast(t("programs.copied"), "copy");
  });
  $("#pList").querySelectorAll("[data-pdel]").forEach(b => b.onclick = async () => {
    const target = state.programs.find(x => x.id===b.dataset.pdel); if (!target) return;
    const inPlan = Object.values(state.plan.days).some(d => d.prog === target.id) || (isRot(state.plan) && state.plan.rot.includes(target.id));
    if (!(await ask(t("programs.del_confirm", { name: programName(target) }) + (inPlan ? "\n" + t("programs.del_plan_note") : "")))) return;
    const i = state.programs.findIndex(x => x.id===target.id), p = state.programs[i]; if (i < 0) return;
    const plan = JSON.parse(JSON.stringify(state.plan)), wasActive = state.active === p.id;
    state.programs.splice(i, 1);
    if (wasActive) state.active = null;
    dropProgram(state.plan, p.id, new Date());
    save(); renderProg(); buzz(15);
    undoable(t("programs.deleted", { name: programName(p) }), () => { state.programs.splice(i, 0, p); state.plan = plan; if (wasActive) state.active = p.id; save(); renderProg(); });
  });
  renderPlan();
}
export function defaultInc(ex){
  const eq = equipOf(ex);
  if (eq === "Dumbbell" || eq === "Kettlebell") return 2;
  if (/squat|deadlift|leg press|hip thrust|rack pull|romanian|calf/i.test(ex)) return 5;
  return 2.5;
}
export const defaultStep = ex => ["Dumbbell", "Kettlebell"].includes(equipOf(ex)) ? 2 : 2.5;
export const exPref = (ex, k) => (state.exPrefs[ex] || {})[k];
export const overloadStep = ex => exPref(ex, "inc") || defaultInc(ex);
export const stepFor = ex => exPref(ex, "step") || defaultStep(ex);
export function restFor(ex, item = state.live?.items?.find(i => i.ex === ex)) {
  if (state.live?.quick && item?.rest === 0) return 0;
  let latest, lastSet;
  for (const e of state.entries) {
    if (e.ex !== ex || !work(e.sets).length) continue;
    if (!latest || e.date > latest.date || (e.date === latest.date && (e.ts || 0) >= (latest.ts || 0))) {
      latest = e; lastSet = work(e.sets).at(-1);
    }
  }
  return exerciseRestSeconds({ ex, yoga: isYoga(ex), targetReps: isTimed(ex) ? undefined : item?.reps,
    lastSet, estimated1RM: bestOf(ex).e }, state.rest, state.restAuto, exPref(ex, "rest"));
}

/* ---------- Google Calendar ---------- */
export const WEEKDAYS = [["MO",t("programs.wd_mo"),1],["TU",t("programs.wd_tu"),2],["WE",t("programs.wd_we"),3],["TH",t("programs.wd_th"),4],["FR",t("programs.wd_fr"),5],["SA",t("programs.wd_sa"),6],["SU",t("programs.wd_su"),0]];
export const dt = d => d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+"T"+pad(d.getHours())+pad(d.getMinutes())+"00";
export const at = (dateStr, time) => { const d = parse(dateStr), [h,m] = (time||"19:00").split(":").map(Number); d.setHours(h, m, 0, 0); return d; };
export function nextDateFor(jsDay){ const d = new Date(); d.setHours(0,0,0,0); while (d.getDay() !== jsDay) d.setDate(d.getDate()+1); return d; }
export const progDetails = p => programItems(p).map(i => `• ${i.ex} — ${i.sets} × ${i.reps||"–"}`).join("\n") + "\n\nSpor Defteri";
export function openUrl(u){ const a = document.createElement("a"); a.href = u; a.target = "_blank"; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove(); }
export function gcal(title, details, dates){
  openUrl("https://calendar.google.com/calendar/render?" + new URLSearchParams({ action: "TEMPLATE", text: title, details, dates }).toString());
}
export let calProg = null;
export function openCalModal(p){
  calProg = p;
  // planda bu program bir güne atanmışsa o günün tarih ve saatini öner
  const planned = plannedDates(state.plan, state.programs, new Date()).find(x => x.p.id === p.id);
  $("#calName").textContent = programName(p) + " · " + t("programs.cal_moves", { n: programItems(p).length });
  $("#calDate").value = planned ? planned.date : ymd(new Date());
  $("#calTime").value = planned ? planned.time : "19:00";
  $("#calModal").classList.remove("hidden");
}
// Takvim etkinliği başlığı ve açıklaması: hareketler, setler ve toplam hacim
export function dayText(list){
  const groups = [...new Set(list.map(e => groupOf(e.ex)))].map(groupLabel);
  const lifts = list.filter(e => isSport(e.ex));
  const details = list.map(e => `• ${e.ex}: ${e.sets.map(s => setLabel(s, isCardio(e.ex))).join(", ")}`).join("\n") +
    (lifts.length ? `\n\n` + t("programs.day_total", { sets: lifts.reduce((n,e)=>n+work(e.sets).length,0), vol: fmt(lifts.reduce((n,e)=>n+volume(e.sets),0)) }) : "") + "\n\nSpor Defteri";
  return { title: t("programs.workout_title", { name: groups.join(", ") }), details };
}
// o günün antrenmanı Google Takvim'e kendiliğinden yazıldı mı (ya da yazılacak mı)
export const autoLogged = sessions => state.gcal.log && sessions.length > 0;
export function calDay(date){
  const list = state.entries.filter(e => e.date===date).sort((a,b) => a.ts-b.ts);
  if (!list.length) return;
  const { title, details } = dayText(list);
  const next = parse(date); next.setDate(next.getDate()+1);
  gcal(title, details, date.replace(/-/g,"") + "/" + ymd(next).replace(/-/g,""));
}
// Bir antrenman oturumunun takvim metni: oturum süresince girilen kayıtlar (yoksa o günün hepsi)
export function describeSession(s){
  const day = state.entries.filter(e => e.date === s.date);
  const inSession = day.filter(e => e.ts >= s.start - 5*60e3 && e.ts <= s.end + 5*60e3);
  const list = (inSession.length ? inSession : day).sort((a,b) => a.ts-b.ts);
  const p = s.prog && state.programs.find(x => x.id === s.prog);
  const dt_ = dayText(list);
  return { title: p ? t("programs.workout_title", { name: programName(p) }) : dt_.title, details: t("programs.session_dur", { dur: durText(s.end - s.start) }) + "\n\n" + dt_.details };
}

// "bitiş 6 Oca 2027"
export const untilText = s => { const d = parse(s); return t("programs.until", { day: d.getDate(), month: MONTHS[d.getMonth()], year: d.getFullYear() }); };
// kısa program adları: "Full Body · A", "Full Body · B" → "A", "B" (ortak ön ek atılır)
function shortNames(ids){
  const names = ids.map(id => (state.programs.find(p => p.id === id) ? programName(state.programs.find(p => p.id === id)) : "?"));
  const parts = names.map(n => n.split(" · "));
  return names.length > 1 && parts.every(x => x.length > 1 && x[0] === parts[0][0]) ? parts.map(x => x.slice(1).join(" · ")) : names;
}
// sırayla planda bu hafta ve gelecek hafta hangi gün hangi program
function rotPreview(P){
  const mon = new Date(); mon.setHours(0,0,0,0); mon.setDate(mon.getDate() - (mon.getDay() + 6) % 7);
  const end = new Date(mon); end.setDate(mon.getDate() + 13);
  const short = Object.fromEntries(P.rot.map((id, i) => [id, shortNames(P.rot)[i]]));
  const all = plannedDates({ ...P, until: ymd(end) }, state.programs, mon);
  const week = off => all.filter(x => (parse(x.date) - mon) / 864e5 >= off * 7 && (parse(x.date) - mon) / 864e5 < off * 7 + 7)
    .map(x => `${WEEKDAYS.find(w => w[0] === x.code)[1]} <b>${esc(short[x.p.id] || programName(x.p))}</b>`).join(" · ");
  return `<div class="muted small" style="margin-top:10px;line-height:1.8">${t("programs.rot_preview_html", { this_week: week(0), next_week: week(1) })}</div>`;
}
export function renderPlan(){
  const P = state.plan, rot = P.mode === "rot";
  $("#planDur").value = P.dur; $("#planRemind").value = P.remind;
  $("#planUntil").value = P.until || ""; $("#planUntil").min = ymd(new Date());
  $("#planUntilClear").classList.toggle("hidden", !P.until);
  const opts = (sel, empty) => (empty ? `<option value="">${empty}</option>` : "") + state.programs.map(p => `<option value="${p.id}"${p.id===sel?" selected":""}>${esc(programName(p))}</option>`).join("");
  const time = (code, on) => `<input type="time" data-pt="${code}" value="${(P.days[code] && P.days[code].time) || "19:00"}" style="flex:0 0 96px"${on ? "" : ` class="hidden"`}>`;
  const mode = `<div class="fchips" id="planMode" style="margin-bottom:6px"><button class="fchip${rot ? "" : " on"}" data-mode="fixed">${t("programs.mode_fixed")}</button><button class="fchip${rot ? " on" : ""}" data-mode="rot">${t("programs.mode_rot")}</button></div>
    ${shortHelp("programs.plan_short", rot ? "programs.help_rot" : "programs.help_fixed")}`;
  if (rot) {
    const R = P.rot || [], n = Object.keys(P.days).length;
    $("#planRows").innerHTML = mode + WEEKDAYS.map(([code, name]) =>
      `<div class="row" style="margin-top:6px;flex-wrap:nowrap;min-height:44px"><label class="check row grow" style="gap:10px;flex-wrap:nowrap;margin:0"><input type="checkbox" data-pc="${code}"${P.days[code] ? " checked" : ""}><span class="small" style="font-weight:600">${name}</span></label>${time(code, !!P.days[code])}</div>`).join("")
      + `<div class="pk-head" style="margin-top:14px">${t("programs.order")}</div>`
      + R.map((id, i) => `<div class="row" style="margin-top:6px;flex-wrap:nowrap"><span class="small" style="flex:0 0 22px;font-weight:700">${i + 1}.</span>
          <select class="grow" data-pr="${i}">${opts(id)}</select>
          <button class="iconbtn danger" data-prx="${i}" title="${t("programs.order_remove")}" aria-label="${t("programs.order_remove")}" data-i18n-aria="programs.order_remove"${R.length < 2 ? " disabled" : ""}>${ic("x")}</button></div>`).join("")
      + `<div class="row" style="margin-top:8px;gap:8px"><button class="btn sm" id="planRotAdd">${ic("plus")}${t("programs.order_add")}</button>${R.length > 1 && n ? `<button class="btn sm quiet" id="planRotShift">${ic("arrow-left-right")}${t("programs.order_shift")}</button>` : ""}</div>`
      + (R.length && n ? rotPreview(P) : "");
  } else {
    $("#planRows").innerHTML = mode + WEEKDAYS.map(([code, name]) => {
      const d = P.days[code] || {};
      return `<div class="row" style="margin-top:6px;flex-wrap:nowrap"><span style="flex:0 0 34px;font-weight:600" class="small">${name}</span>
        <select class="grow" data-pd="${code}">${opts(d.prog, t("programs.rest_day"))}</select>${time(code, !!d.prog)}</div>`;
    }).join("");
  }
  const rows = $("#planRows");
  // sırayla planda değişiklik: sıradaki antrenman yine aynı program olsun (sıra kopmasın)
  const change = fn => { const prev = JSON.parse(JSON.stringify(P)); fn(); keepRotation(P, prev, new Date()); save(); renderPlan(); };
  rows.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => {
    if ((b.dataset.mode === "rot") === rot) return;
    if (b.dataset.mode === "rot") {
      // sabit plandaki programlar gün sırasıyla sıraya girer (A-B-A → A, B); sıradaki antrenman değişmez
      const prev = JSON.parse(JSON.stringify(P));
      const used = [...new Set(WEEKDAYS.map(([c]) => P.days[c] && P.days[c].prog).filter(id => id && state.programs.some(p => p.id === id)))];
      P.mode = "rot"; P.rot = used.length ? used : state.programs.slice(0, 2).map(p => p.id);
      keepRotation(P, prev, new Date());
    } else { fillWeek(P, new Date()); P.mode = "fixed"; }
    save(); buzz(5); renderPlan();
  });
  rows.querySelectorAll("[data-pd]").forEach(s => s.onchange = () => {
    const c = s.dataset.pd;
    if (s.value) P.days[c] = { prog: s.value, time: (P.days[c] && P.days[c].time) || "19:00" }; else delete P.days[c];
    save(); renderPlan();
  });
  rows.querySelectorAll("[data-pc]").forEach(cb => cb.onchange = () => change(() => {
    const c = cb.dataset.pc;
    if (cb.checked) P.days[c] = { prog: P.rot[0] || "", time: "19:00" }; else delete P.days[c];
  }));
  rows.querySelectorAll("[data-pr]").forEach(s => s.onchange = () => change(() => { P.rot[+s.dataset.pr] = s.value; }));
  rows.querySelectorAll("[data-prx]").forEach(b => b.onclick = () => change(() => { P.rot.splice(+b.dataset.prx, 1); }));
  if ($("#planRotAdd")) $("#planRotAdd").onclick = () => {
    const next = state.programs.find(p => !P.rot.includes(p.id)) || state.programs[0];
    if (next) change(() => P.rot.push(next.id));
  };
  if ($("#planRotShift")) $("#planRotShift").onclick = () => { P.shift = (P.shift || 0) + 1; fillWeek(P, new Date()); save(); buzz(5); renderPlan(); };
  rows.querySelectorAll("[data-pt]").forEach(t => t.onchange = () => { const d = P.days[t.dataset.pt]; if (d) { d.time = t.value || "19:00"; save(); } });
  const n = Object.keys(P.days).length;
  $("#planInfo").innerHTML = (state.programs.length ? (n ? t("programs.plan_count", { n }) + (P.until ? ` · ${esc(untilText(P.until))}` : "") : t("programs.no_days")) : t("programs.add_first"))
    + (state.gcal.plan && n ? ` <span title="${t("programs.cal_auto")}" aria-label="${t("programs.cal_auto")}">${ic("calendar-days")}</span>` : "");
  // plan takvime kendiliğinden yazılırken .ics dosyası da eklenirse etkinlikler iki kez görünür
  $("#planIcs").classList.toggle("hidden", !!state.gcal.plan);
}
export function icsText(s){ return String(s).replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\n/g,"\\n"); }
// iCalendar satırları en fazla 75 bayt olmalı (UTF-8), devam satırları boşlukla başlar
export function fold(line){
  const enc = new TextEncoder(), out = []; let cur = "", bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (bytes + b > (out.length ? 74 : 75)) { out.push(cur); cur = ""; bytes = 0; }
    cur += ch; bytes += b;
  }
  out.push(cur); return out.join("\r\n ");
}

// Düğme bağlamaları ve ilk hazırlıklar: main.js'teki açılış sırasında çağrılır
export function setup(){
$("#pAddRow").onclick = () => pRow().querySelector(".pe").click();
$("#pCancel").onclick = resetProgEditor;
$("#pRows").addEventListener("input", e => { if (e.target.classList.contains("ps")) renderEditorLoad(); });
$("#pSave").onclick = () => {
  const name = $("#pName").value.trim();
  const items = [...$("#pRows").children].map(d => ({ ex: d.querySelector(".pe").value.trim(), sets: Math.max(1, parseInt(d.querySelector(".ps").value)||1), reps: d.querySelector(".pr").value.trim(), ss: d.querySelector(".pss").classList.contains("on") }))
    .filter(i => i.ex).map((i, k) => { if (!i.ss || k === 0) delete i.ss; return i; });
  if (!name) return toast(t("programs.name_req"));
  if (!items.length) return toast(t("programs.ex_req"));
  items.forEach(i => { if (!allEx().some(e => e.name===i.ex)) state.custom.push({name:i.ex, group:"Diğer"}); });
  if (progEditId) { const p = state.programs.find(p => p.id===progEditId); Object.assign(p, {name, items, customName: !!p.customName || name !== programName(p)}); }
  else state.programs.push({ id: uid(), name, selectedDate: ymd(new Date()), items });
  save(); refreshDatalist(); resetProgEditor(); renderProg(); toast(t("programs.saved"), "check");
};
$("#calNo").onclick = () => $("#calModal").classList.add("hidden");
$("#calModal").onclick = e => { if (e.target.id === "calModal") $("#calModal").classList.add("hidden"); };
$("#calGo").onclick = () => {
  if (!$("#calDate").value) return toast(t("programs.date_req"));
  const s = at($("#calDate").value, $("#calTime").value), e = new Date(s.getTime() + (state.plan.dur||60)*60000);
  gcal(t("programs.workout_title", { name: programName(calProg) }), progDetails(calProg), dt(s) + "/" + dt(e));
  $("#calModal").classList.add("hidden");
};
$("#dayCal").onclick = () => calDay($("#logDate").value);
$("#planDur").onchange = () => { state.plan.dur = Math.max(10, parseInt($("#planDur").value)||60); save(); renderPlan(); };
$("#planRemind").onchange = () => { state.plan.remind = Math.max(0, parseInt($("#planRemind").value)||0); save(); renderPlan(); };
$("#planUntil").onchange = () => { state.plan.until = $("#planUntil").value || ""; save(); renderPlan(); };
$("#planUntilClear").onclick = () => { state.plan.until = ""; save(); renderPlan(); };
$("#planIcs").onclick = () => {
  const P = state.plan, now = new Date();
  const stamp = now.toISOString().replace(/[-:]/g,"").replace(/\.\d+/,"");
  const L = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Spor Defteri//TR","CALSCALE:GREGORIAN","METHOD:PUBLISH","X-WR-CALNAME:" + t("programs.ics_cal_name")];
  let n = 0;
  // sırayla planda her tarihin programı farklı: tekrarlayan etkinlik yerine tarih tarih etkinlik
  if (isRot(P)) plannedDates(P, state.programs, now).forEach(x => {
    const s = at(x.date, x.time), e = new Date(s.getTime() + P.dur*60000); n++;
    L.push("BEGIN:VEVENT", `UID:sd-${x.date}@spor-defteri`, `DTSTAMP:${stamp}`, `DTSTART:${dt(s)}`, `DTEND:${dt(e)}`, `SUMMARY:${icsText(t("programs.workout_title", { name: programName(x.p) }))}`, `DESCRIPTION:${icsText(progDetails(x.p))}`);
    if (P.remind > 0) L.push("BEGIN:VALARM","ACTION:DISPLAY",`DESCRIPTION:${icsText(t("programs.ics_alarm", { name: programName(x.p) }))}`,`TRIGGER:-PT${P.remind}M`,"END:VALARM");
    L.push("END:VEVENT");
  });
  else WEEKDAYS.forEach(([code,, js]) => {
    const d = P.days[code], p = d && state.programs.find(x => x.id===d.prog); if (!p) return;
    const s = at(ymd(nextDateFor(js)), d.time), e = new Date(s.getTime() + P.dur*60000); n++;
    L.push("BEGIN:VEVENT", `UID:sd-${code}-${p.id}@spor-defteri`, `DTSTAMP:${stamp}`, `DTSTART:${dt(s)}`, `DTEND:${dt(e)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${code}` + (P.until ? `;UNTIL=${P.until.replace(/-/g,"")}T235959` : ""), `SUMMARY:${icsText(t("programs.workout_title", { name: programName(p) }))}`, `DESCRIPTION:${icsText(progDetails(p))}`);
    if (P.remind > 0) L.push("BEGIN:VALARM","ACTION:DISPLAY",`DESCRIPTION:${icsText(t("programs.ics_alarm", { name: programName(p) }))}`,`TRIGGER:-PT${P.remind}M`,"END:VALARM");
    L.push("END:VEVENT");
  });
  if (!n) return toast(t("programs.days_req"));
  L.push("END:VCALENDAR");
  const blob = new Blob([L.map(fold).join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "antrenman-plani.ics";
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(isRot(P) ? t("programs.ics_done_rot", { n }) : t("programs.ics_done_weekly", { n }), "calendar-days");
};
}

export function openQuickFlow() {
 let minutes = 10;
 const body = openSheet(sheetHead(t("programs.quick_flow")),
  '<div class="quick-row">' + [5,10,15,20].map(n => '<button class="btn" data-min="' + n + '" aria-label="' + t("programs.flow_minutes", { n }) + '" aria-pressed="' + (n === minutes) + '">' + n + '</button>').join('') + '</div><div class="quick-row">' +
  yogaRegions.map(([region, icon]) => '<button class="btn" data-region="' + region + '" title="' + regionLabel(region) + '" aria-label="' + regionLabel(region) + '">' + ic(icon) + '</button>').join('') + '</div>');
 body.querySelectorAll('[data-min]').forEach(b => b.onclick = () => {
  minutes = +b.dataset.min;
  body.querySelectorAll('[data-min]').forEach(x => x.setAttribute('aria-pressed', x === b));
 });
 body.querySelectorAll('[data-region]').forEach(b => b.onclick = () => {
  const items = buildQuickFlow(minutes, b.dataset.region, YOGA_POSES);
  closeSheet(); startQuickWorkout(items);
 });
}
