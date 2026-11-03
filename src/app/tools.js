import { e1rm, platesFor as platesForCore, warmupSets } from "../core/training.ts";
import { pad } from "../core/dates.ts";
import { $, fmt, ic, save, state, toast } from "./store.js";

export function renderTools(){ renderRM(); renderPlates(); renderWarmCalc(); }
export function renderRM(){
  const w = parseFloat($("#rmW").value)||0, r = parseInt($("#rmR").value)||0;
  if (!w || !r) { $("#rmTable").innerHTML = ""; return; }
  const one = e1rm(w, Math.min(r, 15));
  const reps = { 100:1, 95:2, 90:4, 85:6, 80:8, 75:10, 70:12, 65:15, 60:18, 50:25 };
  $("#rmTable").innerHTML = `<tr><th>Yüzde</th><th>Ağırlık</th><th>≈ Tekrar</th></tr>` +
    Object.keys(reps).map(Number).sort((a,b)=>b-a).map(p => `<tr${p===100?' style="font-weight:700"':""}><td>%${p}${p===100?" (1RM)":""}</td><td>${fmt(one*p/100)} kg</td><td>${reps[p]}</td></tr>`).join("") +
    (r > 12 ? `<tr><td colspan="3" class="muted small">12'den fazla tekrarda tahmin daha az güvenilirdir.</td></tr>` : "");
}
export const PLATES = [[25,"#d93025",80],[20,"#1a73e8",76],[15,"#f2b632",70],[10,"#1f9d55",62],[5,"#6b7280",50],[2.5,"#374151",42],[1.25,"#9aa3ae",36]];
// bir tarafa takılacak plakalar (büyükten küçüğe) ve karşılanamayan kalan
export const platesFor = side => platesForCore(side, state.plates);
// plakalar 1,25 gibi iki ondalıklı olabilir; fmt() tek ondalığa yuvarladığı için ayrı biçimlenir
export const pfmt = w => String(+w).replace(".", ",");
export const plateText = used => { const g = {}; used.forEach(w => g[w] = (g[w]||0)+1); return Object.entries(g).sort((a,b)=>b[0]-a[0]).map(([w,n]) => `${n}× ${pfmt(w)}`).join(" + "); };
export function renderWarmCalc(){
  const w = parseFloat($("#wuW").value)||0, bar = parseFloat($("#wuBar").value);
  if (!w) { $("#wuTable").innerHTML = ""; return; }
  const rows = warmupSets(w, bar).map(s => ({ ...s, t: "Isınma" })).concat([{ w, r: "–", t: "Çalışma seti" }]);
  $("#wuTable").innerHTML = `<tr><th>Set</th><th>Kg</th><th>Tekrar</th>${bar ? "<th>Her tarafa</th>" : ""}</tr>` + rows.map(r => {
    const p = bar ? platesFor((r.w - bar)/2) : null;
    return `<tr${r.t==="Çalışma seti" ? ' style="font-weight:700"' : ""}><td>${r.t}</td><td>${fmt(r.w)}</td><td>${r.r}</td>${bar ? `<td>${p.used.length ? plateText(p.used) : "boş bar"}</td>` : ""}</tr>`;
  }).join("");
}
export function renderPlates(){
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
export const PRESETS = [60, 90, 120, 180, 300];
export let tEnd = 0, tTick = null, tDur = 90, tTotal = 90, audio = null;
export const mmss = s => Math.floor(s/60) + ":" + pad(Math.max(0, Math.floor(s%60)));
export function renderPresets(){
  $("#presets").innerHTML = PRESETS.map(s => `<button class="btn sm${s===tDur?" on":""}" data-s="${s}">${s<120 ? s+"sn" : (s/60)+"dk"}</button>`).join("");
  $("#presets").querySelectorAll("button").forEach(b => b.onclick = () => { tDur = +b.dataset.s; state.rest = tDur; save(); if (tEnd) startTimer(); else { renderPresets(); $("#clock").textContent = mmss(tDur); } });
}
export function adjust(d){
  if (tEnd) { tEnd += d*1000; tTotal = Math.max(1, tTotal + d); tickTimer(); }
  else { tDur = Math.max(15, tDur + d); $("#clock").textContent = mmss(tDur); renderPresets(); }
}
export function startTimer(sec){
  try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch(e){}
  tTotal = sec || tDur; tEnd = Date.now() + tTotal*1000; clearInterval(tTick); tTick = setInterval(tickTimer, 250);
  $("#tStart").innerHTML = ic("square") + "Durdur"; renderPresets(); tickTimer();
}
export function stopTimer(){
  clearInterval(tTick); tEnd = 0; $("#fab").classList.remove("run"); $("#fabTxt").textContent = "";
  $("#tStart").innerHTML = ic("play") + "Başlat"; $("#clock").textContent = mmss(tDur);
  renderFocusRest();
}
export function tickTimer(){
  const left = Math.ceil((tEnd - Date.now())/1000);
  if (left <= 0) { stopTimer(); beep(); toast("Dinlenme bitti, sıradaki set!", "timer"); return; }
  $("#clock").textContent = mmss(left); $("#fabTxt").textContent = mmss(left); $("#fab").classList.add("run");
  renderFocusRest(left);
}
export function renderFocusRest(left){
  const on = !!tEnd; $("#fRest").classList.toggle("hidden", !on);
  if (!on) return;
  const l = left ?? Math.ceil((tEnd - Date.now())/1000);
  $("#fRestT").textContent = mmss(l);
  $("#fRestBar").style.width = Math.max(0, Math.min(100, l / tTotal * 100)) + "%";
}
export function beep(){
  try { navigator.vibrate && navigator.vibrate([250,120,250,120,250]); } catch(e){}
  if (!audio) return;
  try { [0, .3, .6].forEach(off => { const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = 880; o.connect(g); g.connect(audio.destination);
    g.gain.setValueAtTime(.25, audio.currentTime+off); g.gain.exponentialRampToValueAtTime(.001, audio.currentTime+off+.25); o.start(audio.currentTime+off); o.stop(audio.currentTime+off+.26); }); } catch(e){}
}

// başka modüllerden atanabilmesi için
export function setAudio(v){ return audio = v; }
export function setTDur(v){ return tDur = v; }

// Düğme bağlamaları ve ilk hazırlıklar: main.js'teki açılış sırasında çağrılır
export function setup(){
/* ---------- Tools ---------- */
["rmW","rmR"].forEach(id => $("#"+id).oninput = renderRM);
["plT","plBar"].forEach(id => $("#"+id).oninput = renderPlates);
["wuW","wuBar"].forEach(id => $("#"+id).oninput = renderWarmCalc);
$("#fab").onclick = () => { $("#sheet").classList.toggle("hidden"); if (!tEnd) $("#clock").textContent = mmss(tDur); renderPresets(); };
$("#shClose").onclick = () => $("#sheet").classList.add("hidden");
$("#tPlus").onclick = () => adjust(15);
$("#tMinus").onclick = () => adjust(-15);
$("#fRestPlus").onclick = () => adjust(15);
$("#fRestMinus").onclick = () => adjust(-15);
$("#fRestSkip").onclick = () => stopTimer();
$("#tStart").onclick = () => tEnd ? stopTimer() : startTimer();
}
