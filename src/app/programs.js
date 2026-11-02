import { pad, parse, ymd } from "../core/dates.ts";
import { volume, work } from "../core/training.ts";
import { $, esc, fmt, ic, save, setState, state, toast, uid } from "./store.js";
import { allEx, durText, equipOf, groupOf, isCardio, musclesOf, setLabel } from "./exercises.js";
import { buzz, emptyHTML, openPicker, undoable } from "./ui.js";
import { refreshDatalist } from "./log.js";
import { startWorkout } from "./live.js";
import { groups } from "./library.js";

/* ---------- Programs ---------- */
export let progEditId = null;
export function pRow(it = {ex:"", sets:3, reps:"10"}){
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
export function resetProgEditor(){
  progEditId = null; $("#pTitle").textContent = "Yeni program"; $("#pName").value = "";
  $("#pRows").innerHTML = ""; pRow(); $("#pCancel").classList.add("hidden");
}
// süperset grupları için A1/A2, B1/B2 etiketleri; tek başına hareketler etiketsiz
export function ssLabels(items){
  const groups = []; items.forEach((it, k) => { if (it.ss && k > 0) groups[groups.length-1].push(k); else groups.push([k]); });
  const out = items.map(() => ""); let g = 0;
  groups.forEach(gr => { if (gr.length > 1) { const L = String.fromCharCode(65 + g++); gr.forEach((k, j) => out[k] = L + (j+1)); } });
  return out;
}
export const ssTag = l => l ? `<span class="ssl">${l}</span>` : "";
export function renderProg(){
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
export const restFor = ex => exPref(ex, "rest") || state.rest;

/* ---------- Google Calendar ---------- */
export const WEEKDAYS = [["MO","Pzt",1],["TU","Sal",2],["WE","Çar",3],["TH","Per",4],["FR","Cum",5],["SA","Cmt",6],["SU","Paz",0]];
export const dt = d => d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+"T"+pad(d.getHours())+pad(d.getMinutes())+"00";
export const at = (dateStr, time) => { const d = parse(dateStr), [h,m] = (time||"19:00").split(":").map(Number); d.setHours(h, m, 0, 0); return d; };
export function nextDateFor(jsDay){ const d = new Date(); d.setHours(0,0,0,0); while (d.getDay() !== jsDay) d.setDate(d.getDate()+1); return d; }
export const progDetails = p => p.items.map(i => `• ${i.ex} — ${i.sets} × ${i.reps||"–"}`).join("\n") + "\n\nSpor Defteri";
export function openUrl(u){ const a = document.createElement("a"); a.href = u; a.target = "_blank"; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove(); }
export function gcal(title, details, dates){
  openUrl("https://calendar.google.com/calendar/render?" + new URLSearchParams({ action: "TEMPLATE", text: title, details, dates }).toString());
}
export let calProg = null;
export function openCalModal(p){
  calProg = p;
  // planda bu program bir güne atanmışsa o günün tarih ve saatini öner
  const planned = WEEKDAYS.map(([code,,js]) => ({ js, d: state.plan.days[code] })).filter(x => x.d && x.d.prog === p.id)
    .map(x => ({ date: nextDateFor(x.js), time: x.d.time })).sort((a,b) => a.date-b.date)[0];
  $("#calName").textContent = p.name + " · " + p.items.length + " hareket";
  $("#calDate").value = ymd(planned ? planned.date : new Date());
  $("#calTime").value = planned ? planned.time : "19:00";
  $("#calModal").classList.remove("hidden");
}
// Takvim etkinliği başlığı ve açıklaması: hareketler, setler ve toplam hacim
export function dayText(list){
  const groups = [...new Set(list.map(e => groupOf(e.ex)))];
  const lifts = list.filter(e => !isCardio(e.ex));
  const details = list.map(e => `• ${e.ex}: ${e.sets.map(s => setLabel(s, isCardio(e.ex))).join(", ")}`).join("\n") +
    (lifts.length ? `\n\nToplam: ${lifts.reduce((n,e)=>n+work(e.sets).length,0)} set · ${fmt(lifts.reduce((n,e)=>n+volume(e.sets),0))} kg hacim` : "") + "\n\nSpor Defteri";
  return { title: "Antrenman: " + groups.join(", "), details };
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
  const t = dayText(list);
  return { title: p ? "Antrenman: " + p.name : t.title, details: `Süre: ${durText(s.end - s.start)}\n\n` + t.details };
}

export function renderPlan(){
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
$("#calNo").onclick = () => $("#calModal").classList.add("hidden");
$("#calModal").onclick = e => { if (e.target.id === "calModal") $("#calModal").classList.add("hidden"); };
$("#calGo").onclick = () => {
  if (!$("#calDate").value) return toast("Tarih seç");
  const s = at($("#calDate").value, $("#calTime").value), e = new Date(s.getTime() + (state.plan.dur||60)*60000);
  gcal("Antrenman: " + calProg.name, progDetails(calProg), dt(s) + "/" + dt(e));
  $("#calModal").classList.add("hidden");
};
$("#dayCal").onclick = () => calDay($("#logDate").value);
$("#planDur").onchange = () => { state.plan.dur = Math.max(10, parseInt($("#planDur").value)||60); save(); renderPlan(); };
$("#planRemind").onchange = () => { state.plan.remind = Math.max(0, parseInt($("#planRemind").value)||0); save(); renderPlan(); };
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
}
