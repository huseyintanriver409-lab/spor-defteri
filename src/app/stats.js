import { tCount } from "../core/i18n.ts";
import { yogaWeekGoal, calendarLoad, practiceSeconds } from "../core/yoga.ts";
import { programName } from "../core/programs.ts";
import { locale, t } from "../core/i18n.ts";
import { MONTHS, mondayOf, niceDate, parse, shortDate, ymd } from "../core/dates.ts";
import { e1rm, liftScore, volume, work } from "../core/training.ts";
import { recoveryMap as recoveryMapCore } from "../core/recovery.ts";
import { muscleLabel, setsByMuscle } from "../core/musclemap.ts";
import { $, esc, fmt, ic, save, state } from "./store.js";
import { MUSCLE_ORDER, durText, fmtSec, focus, groupOf, groupShown, isCardio, isSport, goalDates, visiblePrograms, isTimed, isYoga, liftOn, musclesOf, yogaOn } from "./exercises.js";
import { renderSeg, saveNav, segState, showTab } from "./ui.js";
import { entryHTML } from "./log.js";
import { bindBodyMap, bodyMap, fatigueTiers, legend, loadTiers, weekSets } from "./bodymap.js";

const emptyAdd = () => `<button type="button" class="iconbtn empty-add" data-stats-add aria-label="${t("stats.add_workout")}">${ic("plus")}</button>`;
/* ---------- Week ---------- */
export let weekStart = mondayOf(new Date());
export function renderWeek(){
  const end = new Date(weekStart); end.setDate(end.getDate()+6);
  const a = ymd(weekStart), b = ymd(end);
  $("#wLabel").textContent = `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()]} – ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
  const list = state.entries.filter(e => e.date >= a && e.date <= b);
  const lifts = list.filter(e => isSport(e.ex));
  $("#sDays").textContent = goalDates().filter(d => d >= a && d <= b).length;
  $("#sSets").textContent = lifts.reduce((n,e) => n+work(e.sets).length, 0);
  $("#sDays").parentElement.querySelector("[data-i18n]").textContent = tCount("html.stat_days", +$("#sDays").textContent);
  $("#sSets").parentElement.querySelector("[data-i18n]").textContent = tCount("html.stat_sets", +$("#sSets").textContent);
  $("#sVol").textContent = fmt(lifts.reduce((n,e) => n+volume(e.sets), 0));
  const ms_ = state.sessions.filter(s => s.date >= a && s.date <= b).reduce((t,s) => t + s.end - s.start, 0);
  $("#sTime").textContent = ms_ ? durText(ms_) : "–";
  // sadece yogada set ve kg hacim kutuları yerine yoga özeti
  document.querySelectorAll("#weekStats .lift-only").forEach(x => x.classList.toggle("hidden", !liftOn()));
  $("#weekStats").classList.toggle("two", !liftOn());
  renderYogaWeek(list, a);

  // kas analizi
  const ms = {};
  Object.assign(ms, setsByMuscle(lifts.map(e => ({ ex: e.ex, sets: work(e.sets).length })), musclesOf));
  const shown = MUSCLE_ORDER.filter(m => ms[m] || ["Göğüs","Lat","Ön Omuz","Yan Omuz","Arka Omuz","Biceps","Triceps","Quadriceps","Hamstring","Kalça","Baldır","Karın"].includes(m));
  const scale = Math.max(24, ...Object.values(ms));
  $("#musclesCard").classList.toggle("hidden", !liftOn());
  $("#wMuscles").innerHTML = lifts.length ? shown.map(m => {
    // yeşil bölge: en verimli aralık (4–10 set)
    const v = ms[m] || 0, cls = v >= 4 ? "ok" : "";
    return `<div class="mbar"><span>${muscleLabel(m)}</span><div class="track"><div class="zone" style="left:${4/scale*100}%;width:${6/scale*100}%"></div><i class="${cls}" style="width:${v/scale*100}%"></i></div><b>${fmt(v)}</b></div>`;
  }).join("") + muscleAdvice(ms) : `<div class="empty">${t("stats.no_records")}${emptyAdd()}</div>`;

  const byEx = {};
  list.forEach(e => {
    const o = byEx[e.ex] ||= { sets:0, reps:0, max:0, vol:0, mins:0, km:0, secs:0, cardio:isCardio(e.ex), timed:isTimed(e.ex) };
    (o.cardio ? e.sets : work(e.sets)).forEach(s => { o.sets++; o.reps += +s.r||0; o.max = Math.max(o.max, +s.w||0); o.vol += (+s.w||0)*(+s.r||0); o.mins += +s.w||0; o.km += +s.r||0; o.secs += +s.sec||0; });
    if (isYoga(e.ex)) o.secs += practiceSeconds(e.sets) - work(e.sets).reduce((n, s) => n + (+s.sec || 0), 0);
  });
  const rows = Object.entries(byEx).sort((x,y) => groupOf(x[0]).localeCompare(groupOf(y[0]),locale()) || x[0].localeCompare(y[0],locale()));
  $("#wTable").innerHTML = rows.length
    ? (rows.every(([, o]) => o.cardio || o.timed) ? `<tr><th>${t("stats.th_exercise")}</th><th>${t("stats.th_set")}</th><th colspan="3">${t("stats.th_duration")}</th></tr>` : `<tr><th>${t("stats.th_exercise")}</th><th>${t("stats.th_set")}</th><th>${t("stats.th_reps")}</th><th>${t("stats.th_max_kg")}</th><th>${t("stats.th_volume")}</th></tr>`) + rows.map(([n,o]) => o.cardio
        ? `<tr><td>${esc(n)}</td><td>${o.sets}</td><td colspan="3">${t("stats.min_val", { n: fmt(o.mins) })}${o.km ? " · "+t("stats.km_val", { n: fmt(o.km) }) : ""}</td></tr>`
        : o.timed ? `<tr><td>${esc(n)}</td><td>${o.sets}</td><td colspan="3">${t("stats.total_time", { t: fmtSec(o.secs) })}${o.max ? ` · +${t("stats.kg_val", { n: fmt(o.max) })}` : ""}</td></tr>`
        : `<tr><td>${esc(n)}</td><td>${o.sets}</td><td>${o.reps}</td><td>${fmt(o.max)}</td><td>${fmt(o.vol)}</td></tr>`).join("")
    : `<tr><td class="empty">${t("stats.no_records")}${emptyAdd()}</td></tr>`;

  let html = "";
  for (let i=0;i<7;i++){
    const d = new Date(weekStart); d.setDate(d.getDate()+i); const k = ymd(d);
    const es = list.filter(e => e.date===k).sort((x,y) => x.ts-y.ts);
    if (es.length) html += `<h3 style="font-size:14px;margin:14px 0 2px">${niceDate(k)}</h3>` + es.map(e => entryHTML(e,false)).join("");
  }
  $("#wDays").innerHTML = html || `<div class="empty">${t("stats.no_records")}${emptyAdd()}</div>`;
}
// Yoga özeti: toplam tutuş süresi, farklı poz ve geçen haftayla fark
const yogaSecs = es => es.reduce((t, e) => t + practiceSeconds(e.sets), 0);
function renderYogaWeek(list, a){
  const ys = list.filter(e => isYoga(e.ex)), prevA = new Date(weekStart); prevA.setDate(prevA.getDate() - 7);
  const prev = state.entries.filter(e => e.date >= ymd(prevA) && e.date < a && isYoga(e.ex));
  $("#yogaWeek").classList.toggle("hidden", !yogaOn() || (liftOn() && !ys.length && !prev.length));
  if ($("#yogaWeek").classList.contains("hidden")) return;
  const goal = yogaWeekGoal(state.entries, groupOf, a);
  $("#yGoal").innerHTML = '<svg class="yoga-ring" viewBox="0 0 100 100" role="img" aria-label="' + t("stats.yoga_goal", { n: goal.days }) + '"><circle class="track" cx="50" cy="50" r="42"/><circle class="fill" cx="50" cy="50" r="42" pathLength="100" stroke-dasharray="' + (goal.progress * 100) + ' 100"/><text x="50" y="51">' + goal.days + '</text></svg>';
  const secs = yogaSecs(ys), mins = n => Math.round(n / 60);
  $("#yMin").textContent = mins(secs);
  $("#yPoses").textContent = new Set(ys.map(e => e.ex)).size;
  const diff = mins(secs) - mins(yogaSecs(prev));
  $("#yNote").innerHTML = !ys.length ? t("stats.no_yoga")
    : [prev.length ? t("stats.vs_last", { d: (diff >= 0 ? "+" : "") + diff }) : ""].filter(Boolean).join(" · ");
}
/* ---------- Günlük yük (Takvim ve seri bunu kullanır) ---------- */
export function dayLoad(){
  return calendarLoad(state.entries, groupOf, focus());
}
export function muscleAdvice(ms){
  const main = ["Göğüs","Lat","Yan Omuz","Arka Omuz","Biceps","Triceps","Quadriceps","Hamstring","Kalça","Baldır"];
  // Pelland ve ark. 2025: haftada 4 set gelişim için en az etkili doz; 19 setten sonra her ek setin getirisi küçük
  const low = main.filter(m => (ms[m]||0) < 4), high = main.filter(m => (ms[m]||0) > 18);
  let hints = "";
  if (low.length) hints += `<div class="hint">${ic("arrow-down")} ${t("stats.low_html", { list: esc(low.map(muscleLabel).join(", ")) })}</div>`;
  if (high.length) hints += `<div class="hint">${ic("arrow-up")} ${t("stats.high_html", { list: esc(high.map(muscleLabel).join(", ")) })}</div>`;
  return hints;
}

/* ---------- History ---------- */
export function renderHistSelect(){
  $("#baseCard").classList.toggle("hidden", !liftOn());
  const sel = $("#histEx"), cur = sel.value;
  // seçilen kullanım türünde gizli gruplar (ör. sadece yogada ağırlık hareketleri) listede çıkmaz
  const names = [...new Set(state.entries.map(e => e.ex))].filter(n => groupShown(groupOf(n))).sort((a,b) => a.localeCompare(b,locale()));
  sel.innerHTML = names.length ? names.map(n => `<option>${esc(n)}</option>`).join("") : `<option value="">${t("stats.no_records")}</option>`;
  if (names.includes(cur)) sel.value = cur;
  renderHist();
}
export function sessionValue(e, metric, c){
  if (c) return e.sets.reduce((a,s)=>a+(+s.w||0),0);
  const ws = work(e.sets);
  if (isYoga(e.ex)) return practiceSeconds(ws);
  if (isTimed(e.ex)) return metric === "sum" ? ws.reduce((t, s) => t + (+s.sec||0), 0) : Math.max(0, ...ws.map(s => +s.sec||0));
  if (metric === "e") return Math.max(0, ...ws.filter(s => s.r<=12).map(s => e1rm(+s.w||0, +s.r||0)));
  if (metric === "v") return volume(e.sets);
  return Math.max(0, ...ws.map(s => +s.w||0));
}
export function renderHist(){
  const ex = $("#histEx").value, c = isCardio(ex), tm = isTimed(ex);
  // süreli hareketlerde (yoga pozu, plank…) kg yerine süre ölçüleri
  document.querySelectorAll(".lift-metric").forEach(x => x.classList.toggle("hidden", tm || c));
  document.querySelectorAll(".time-metric").forEach(x => x.classList.toggle("hidden", !tm || isYoga(ex)));
  const metric = isYoga(ex) ? "sum" : tm ? document.querySelector('input[name=hMetricT]:checked').value : document.querySelector('input[name=hMetric]:checked').value;
  const list = state.entries.filter(e => e.ex===ex).sort((a,b) => a.date.localeCompare(b.date));
  const pts = list.map(e => ({ date:e.date, v: sessionValue(e, metric, c) })).filter(p => p.v > 0);
  $("#hChartTitle").textContent = c ? t("stats.t_session_min") : tm ? (metric === "sum" ? t("stats.t_total_sec") : t("stats.t_longest_sec")) : ({w:t("stats.t_heaviest"), e:t("stats.t_e1rm"), v:t("stats.t_volume")})[metric];
  $("#hMax").parentElement.classList.toggle("hidden", isYoga(ex));
  $("#hMax").nextElementSibling.textContent = tm ? t("stats.rec_time") : t("stats.rec_kg");

  // gelişim tahmini: son 8 seansın tahmini 1RM eğilimi
  let proj = null; const fc = $("#hForecast"); fc.classList.add("hidden");
  if (!c && !tm && ex) {
    const ep = list.map(e => ({ t: parse(e.date).getTime()/864e5, v: sessionValue(e, "e", false) })).filter(p => p.v > 0).slice(-8);
    if (ep.length >= 3 && ep[ep.length-1].t - ep[0].t >= 7) {
      const n = ep.length, mx = ep.reduce((a,p)=>a+p.t,0)/n, my = ep.reduce((a,p)=>a+p.v,0)/n;
      const slope = ep.reduce((a,p)=>a+(p.t-mx)*(p.v-my),0) / ep.reduce((a,p)=>a+(p.t-mx)**2,0);
      const last = ep[n-1].t, pred = my + slope*(last+28-mx);
      if (slope > 0.005) {
        fc.innerHTML = `${ic("trending-up")} ${t("stats.forecast_html", { a: fmt(slope*7), b: fmt(pred) })}<details class="small i-help"><summary class="muted small" aria-label="${t("stats.help_aria")}">${ic("info")}</summary>${t("stats.forecast_help", { n })}</details>`;
        if (metric === "e") { const d = new Date(last*864e5); d.setDate(d.getDate()+28); proj = { date: ymd(new Date(d.getFullYear(), d.getMonth(), d.getDate())), v: pred }; }
      } else fc.innerHTML = `${ic("activity")} ${t("stats.plateau", { n })}<details class="small i-help"><summary class="muted small" aria-label="${t("stats.help_aria")}">${ic("info")}</summary>${t("stats.plateau_help")}</details>`;
      fc.classList.remove("hidden");
    }
  }
  $("#histChart").innerHTML = chart(pts, proj);
  const allSets = list.flatMap(e => work(e.sets));
  $("#hMax").textContent = allSets.length && tm ? fmtSec(Math.max(...allSets.map(s => +s.sec||0))) : allSets.length && !c ? fmt(Math.max(...allSets.map(s => +s.w||0))) : "–";
  $("#h1rm").nextElementSibling.textContent = tm ? t("stats.total_time_lbl") : t("stats.e1rm_lbl");
  $("#h1rm").textContent = allSets.length && tm ? fmtSec(isYoga(ex) ? practiceSeconds(allSets) : allSets.reduce((t, s) => t + (+s.sec||0), 0)) : allSets.length && !c ? fmt(Math.max(0, ...allSets.filter(s => s.r<=12).map(s => e1rm(+s.w||0, +s.r||0)))) : "–";
  $("#hCount").textContent = list.length;
  // rekor setleri işaretle (ısınma setleri hariç)
  let best = 0; const prMap = {};
  if (!c && !isYoga(ex)) list.forEach(e => { const set = new Set(); e.sets.forEach((s,i) => { if (s.t !== "w" && (+s.w||0) > best) { if (best > 0) set.add(i); best = +s.w||0; } }); prMap[e.id] = set; });
  $("#histList").innerHTML = list.length ? list.slice().reverse().map(e => `<div style="margin-top:8px" class="muted small">${niceDate(e.date)}</div>` + entryHTML(e,false,prMap[e.id])).join("") : `<div class="empty">${t("stats.no_records")}${emptyAdd()}</div>`;
}
export function chart(pts, proj){
  if (pts.length < 2) return `<div class="empty">${pts.length ? t("stats.chart_need") : t("stats.no_records")}</div>`;
  const W=600,H=190,L=38,R=12,T=12,B=22;
  const ts = pts.map(p => parse(p.date).getTime()), t0 = ts[0], t1 = proj ? parse(proj.date).getTime() : ts[ts.length-1];
  const vs = pts.map(p => p.v).concat(proj ? [proj.v] : []);
  let lo = Math.min(...vs), hi = Math.max(...vs); if (lo===hi){ lo-=1; hi+=1; }
  const pad = (hi-lo)*0.08; lo -= pad; hi += pad;
  const x = t => L + (t1===t0 ? 0 : (t-t0)*(W-L-R)/(t1-t0)), y = v => T + (hi-v)*(H-T-B)/(hi-lo);
  const path = pts.map((p,i) => (i?"L":"M")+x(ts[i]).toFixed(1)+","+y(p.v).toFixed(1)).join("");
  const mid = (lo+hi)/2;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${t("stats.chart_aria")}">
    ${[hi,mid,lo].map(v => `<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L-6}" y="${y(v)+3}" text-anchor="end">${fmt(v)}</text>`).join("")}
    <path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>
    ${proj ? `<line x1="${x(ts[ts.length-1])}" y1="${y(pts[pts.length-1].v)}" x2="${x(t1)}" y2="${y(proj.v)}" stroke="var(--accent)" stroke-width="2" stroke-dasharray="5 5"/>
      <circle cx="${x(t1)}" cy="${y(proj.v)}" r="4.5" fill="var(--card)" stroke="var(--accent)" stroke-width="2"><title>${t("stats.forecast_title", { date: shortDate(proj.date), v: fmt(proj.v) })}</title></circle>` : ""}
    ${pts.map((p,i) => `<circle cx="${x(ts[i])}" cy="${y(p.v)}" r="3.5" fill="var(--accent)"><title>${shortDate(p.date)}: ${fmt(p.v)}</title></circle>`).join("")}
    <text x="${L}" y="${H-5}">${shortDate(pts[0].date)}</text><text x="${W-R}" y="${H-5}" text-anchor="end">${proj ? t("stats.forecast_lbl", { date: shortDate(proj.date) }) : shortDate(pts[pts.length-1].date)}</text></svg>`;
}

/* ---------- Records ---------- */
export const REP_COLS = [1, 3, 5, 8, 10, 12];
export function renderRecords(){
  const by = {};
  state.entries.filter(e => isSport(e.ex)).forEach(e => work(e.sets).forEach(s => {
    const o = by[e.ex] ||= { reps: {}, e1: 0 };
    const w = +s.w||0, r = +s.r||0; if (!w || !r) return;
    // r tekrar yapılan kilo, r'den az tekrar sayıları için de geçerli bir rekordur
    REP_COLS.forEach(n => { if (r >= n && w > (o.reps[n]||0)) o.reps[n] = w; });
    if (r <= 12) o.e1 = Math.max(o.e1, e1rm(w, r));
  }));
  const names = Object.keys(by).sort((a,b) => groupOf(a).localeCompare(groupOf(b),locale()) || a.localeCompare(b,locale()));
  $("#recTable").innerHTML = names.length
    ? `<tr><th>${t("stats.th_exercise")}</th>${REP_COLS.map(n => `<th>${t("stats.rep_col", { n })}</th>`).join("")}<th>${t("stats.th_1rm")}</th></tr>` + names.map(n => `<tr class="click" data-ex="${esc(n)}"><td>${esc(n)}</td>${REP_COLS.map(c => `<td>${by[n].reps[c] ? fmt(by[n].reps[c]) : "–"}</td>`).join("")}<td><b>${by[n].e1 ? fmt(by[n].e1) : "–"}</b></td></tr>`).join("")
    : `<tr><td class="empty">${t("stats.no_records")}${emptyAdd()}</td></tr>`;
  $("#recTable").querySelectorAll("[data-ex]").forEach(tr => tr.onclick = () => {
    segState.stats = "hist"; renderSeg("stats"); $("#histEx").value = tr.dataset.ex; renderHist(); scrollTo(0,0);
  });
  // kronolojik tarama ile kırılan ağırlık rekorları
  const best = {}, events = [];
  state.entries.filter(e => isSport(e.ex)).sort((a,b) => a.date.localeCompare(b.date) || a.ts-b.ts).forEach(e => {
    const top = Math.max(0, ...work(e.sets).map(s => +s.w||0));
    if (top > (best[e.ex]||0)) { if (best[e.ex]) events.push({ date: e.date, ex: e.ex, w: top, prev: best[e.ex] }); best[e.ex] = top; }
  });
  $("#recRecent").innerHTML = events.length ? events.slice(-10).reverse().map(ev => `<div class="entry"><div class="row"><div class="grow"><div class="t">${ic("trophy", "acc")} ${esc(ev.ex)}</div><div class="g">${niceDate(ev.date)}</div></div>
    <div style="text-align:right"><b>${t("stats.kg_val", { n: fmt(ev.w) })}</b><div class="g">+${t("stats.kg_val", { n: fmt(ev.w - ev.prev) })}</div></div></div></div>`).join("")
    : `<div class="empty">${t("stats.no_pr")}</div>`;
}

/* ---------- Recovery ---------- */
export const recoveryMap = () => recoveryMapCore({ entries: state.entries.filter(e => isSport(e.ex)), sessions: state.sessions, isCardio, musclesOf, profile: state.profile });
export function renderRecovery(){
  const R = recoveryMap();
  // vücut haritası: şu anki yorgunluk ya da bu haftanın set yükü
  const week = segState.bm === "week", ws = week ? weekSets() : null;
  $("#bmView").querySelectorAll("button").forEach(x => { const on = (x.dataset.v === "week") === week; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on); });
  $("#bmNote").textContent = week ? t("stats.bm_week_note")
    : t("stats.bm_fatigue_note");
  $("#restMap").innerHTML = bodyMap(week ? loadTiers(ws) : fatigueTiers(R), { toggle: true }) + legend(week ? "load" : "fatigue");
  bindBodyMap($("#restMap"));
  // en hazır programı öner: ana kasların ortalama toparlanması
  const score = p => { const ms = [...new Set(p.items.flatMap(i => musclesOf(i.ex).p))]; return ms.length ? ms.reduce((a,m) => a + (R[m] ? R[m].pct : 1), 0) / ms.length : 0; };
  const ranked = visiblePrograms().map(p => ({ p, s: score(p) })).filter(x => x.s > 0).sort((a,b) => b.s - a.s);
  let html = "";
  if (ranked.length) html += `<div class="hint good">${ic("lightbulb")} ${t("stats.suggest_html", { name: esc(programName(ranked[0].p)), p: Math.round(ranked[0].s*100) })}</div>`;
  $("#restSuggest").innerHTML = html + `<div style="height:8px"></div>`;
}

/* ---------- Power score ---------- */
export const LIFTS = [
  { key:"squat", label:"Squat", names:["Back Squat","High-Bar Squat","Low-Bar Squat"] },
  { key:"bench", label:"Bench Press", names:["Bench Press (Barbell)"] },
  { key:"dead", label:"Deadlift", names:["Deadlift","Sumo Deadlift"] },
  { key:"ohp", label:"Overhead Press", names:["Overhead Press (Barbell)"] },
  { key:"row", label:"Barbell Row", names:["Barbell Row","Pendlay Row"] },
  { key:"pull", label:t("stats.lift_pull"), names:["Pull-up","Weighted Pull-up","Chin-up"], bw:true },
];
// 1RM / vücut ağırlığı eşikleri: Başlangıç, Acemi, Orta, İleri, Elit (yaklaşık)
export const STD = {
  m: { squat:[0.75,1.25,1.5,2.25,2.75], bench:[0.5,0.75,1.25,1.75,2.0], dead:[1.0,1.5,2.0,2.5,3.0], ohp:[0.35,0.55,0.8,1.05,1.35], row:[0.5,0.75,1.0,1.5,1.75], pull:[1.0,1.1,1.3,1.6,1.85] },
  f: { squat:[0.5,0.75,1.25,1.5,2.0], bench:[0.25,0.5,0.75,1.0,1.5], dead:[0.5,1.0,1.25,1.75,2.5], ohp:[0.2,0.35,0.5,0.75,1.0], row:[0.25,0.4,0.65,0.9,1.2], pull:[0.85,1.0,1.15,1.35,1.6] }
};
export const LEVELS = [t("stats.lv_0"), t("stats.lv_1"), t("stats.lv_2"), t("stats.lv_3"), t("stats.lv_4"), t("stats.lv_5")];
export const latestWeight = () => { const b = state.body.filter(x => x.weight).sort((a,b) => b.date.localeCompare(a.date))[0]; return b ? b.weight : null; };
export const bodyweight = () => latestWeight() || parseFloat(state.profile.bw) || 0;
export function renderPower(keepInput){
  // cinsiyet tek yerden (Profil > Ayarlar, #bSex) seçilir; güç skoru state.profile.sex'i okur
  const sexNote = state.profile.sex ? "" : " · " + t("stats.pick_sex");
  const lw = latestWeight();
  if (!keepInput) $("#pfBw").value = lw || state.profile.bw || "";
  $("#pfBw").disabled = !!lw;
  $("#pfBwNote").textContent = lw ? t("stats.bw_auto", { n: fmt(lw) }) : t("stats.bw_tip");
  const bw = bodyweight(), std = STD[state.profile.sex === "f" ? "f" : "m"]  /* m/f dışında sabit nötr "m"; harita modeli güç standardını değiştirmez */;
  if (!bw) { $("#pwScore").textContent = "–"; $("#pwLevel").textContent = t("stats.power_score"); $("#pwSub").textContent = t("stats.enter_bw") + sexNote; $("#pwLifts").innerHTML = ""; return; }
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
    $("#pwSub").textContent = t("stats.sub_done", { done: done.length, total: LIFTS.length, bw: fmt(bw) }) + sexNote;
  } else { $("#pwScore").textContent = "–"; $("#pwLevel").textContent = t("stats.no_records"); $("#pwSub").textContent = t("stats.log_1_10"); }
  $("#pwLifts").innerHTML = res.map(r => r.best ? `<div class="lift">
      <div class="row"><b class="grow">${r.L.label}</b><span class="lv">${LEVELS[r.lv]}</span><b style="font-variant-numeric:tabular-nums">${Math.round(r.s)}</b></div>
      <div class="muted small">${t("stats.kg_val", { n: fmt(r.best) })} · ${fmt(r.ratio)}×${r.lv<5 ? ` · ${t("stats.next", { n: fmt(std[r.L.key][r.lv]*bw) })}` : ""}</div>
      <div class="pb"><i style="width:${r.s}%"></i></div></div>`
    : `<div class="lift"><div class="row"><b class="grow muted">${r.L.label}</b><span class="muted small">${t("stats.none_lc")}</span></div></div>`).join("");
}

// Düğme bağlamaları ve ilk hazırlıklar: main.js'teki açılış sırasında çağrılır
export function setup(){
document.addEventListener("click", e => {
  if (e.target.closest("[data-stats-add]")) { segState.train = "log"; showTab("train"); }
});
$("#wPrev").onclick = () => { weekStart.setDate(weekStart.getDate()-7); renderWeek(); };
$("#wNext").onclick = () => { weekStart.setDate(weekStart.getDate()+7); renderWeek(); };
$("#wToday").onclick = () => { weekStart = mondayOf(new Date()); renderWeek(); };
$("#histEx").onchange = renderHist;
$("#bmView").querySelectorAll("button").forEach(b => b.onclick = () => { segState.bm = b.dataset.v; renderRecovery(); saveNav(); });
document.querySelectorAll('input[name=hMetric], input[name=hMetricT]').forEach(r => r.onchange = renderHist);
$("#pfBw").oninput = () => { state.profile.bw = $("#pfBw").value; save(); renderPower(true); };
}
