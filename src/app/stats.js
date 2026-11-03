import { MONTHS, mondayOf, niceDate, parse, shortDate, ymd } from "../core/dates.ts";
import { e1rm, liftScore, volume, work } from "../core/training.ts";
import { recoveryMap as recoveryMapCore } from "../core/recovery.ts";
import { $, esc, fmt, ic, save, state } from "./store.js";
import { MUSCLE_ORDER, durText, fmtSec, groupOf, isCardio, isTimed, musclesOf } from "./exercises.js";
import { renderSeg, segState } from "./ui.js";
import { entryHTML } from "./log.js";
import { streakNow, streakOn } from "./streak.js";

/* ---------- Week ---------- */
export let weekStart = mondayOf(new Date());
export function renderWeek(){
  const end = new Date(weekStart); end.setDate(end.getDate()+6);
  const a = ymd(weekStart), b = ymd(end);
  $("#wLabel").textContent = `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()]} – ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
  const list = state.entries.filter(e => e.date >= a && e.date <= b);
  const lifts = list.filter(e => !isCardio(e.ex));
  $("#sDays").textContent = new Set(list.map(e => e.date)).size;
  $("#sSets").textContent = lifts.reduce((n,e) => n+work(e.sets).length, 0);
  $("#sVol").textContent = fmt(lifts.reduce((n,e) => n+volume(e.sets), 0));
  const ms_ = state.sessions.filter(s => s.date >= a && s.date <= b).reduce((t,s) => t + s.end - s.start, 0);
  $("#sTime").textContent = ms_ ? durText(ms_) : "–";
  renderConsistency();

  // kas analizi
  const ms = {};
  lifts.forEach(e => { const n = work(e.sets).length, m = musclesOf(e.ex); m.p.forEach(x => ms[x] = (ms[x]||0) + n); m.s.forEach(x => ms[x] = (ms[x]||0) + n/2); });
  const shown = MUSCLE_ORDER.filter(m => ms[m] || ["Göğüs","Lat","Ön Omuz","Yan Omuz","Arka Omuz","Biceps","Triceps","Quadriceps","Hamstring","Kalça","Baldır","Karın"].includes(m));
  const scale = Math.max(24, ...Object.values(ms));
  $("#wMuscles").innerHTML = lifts.length ? shown.map(m => {
    const v = ms[m] || 0, cls = v >= 10 && v <= 20 ? "ok" : "";
    return `<div class="mbar"><span>${m}</span><div class="track"><div class="zone" style="left:${10/scale*100}%;width:${10/scale*100}%"></div><i class="${cls}" style="width:${v/scale*100}%"></i></div><b>${fmt(v)}</b></div>`;
  }).join("") + muscleAdvice(ms) : `<div class="empty">Bu hafta kayıt yok</div>`;

  const byEx = {};
  list.forEach(e => {
    const o = byEx[e.ex] ||= { sets:0, reps:0, max:0, vol:0, mins:0, km:0, secs:0, cardio:isCardio(e.ex), timed:isTimed(e.ex) };
    (o.cardio ? e.sets : work(e.sets)).forEach(s => { o.sets++; o.reps += +s.r||0; o.max = Math.max(o.max, +s.w||0); o.vol += (+s.w||0)*(+s.r||0); o.mins += +s.w||0; o.km += +s.r||0; o.secs += +s.sec||0; });
  });
  const rows = Object.entries(byEx).sort((x,y) => groupOf(x[0]).localeCompare(groupOf(y[0]),"tr") || x[0].localeCompare(y[0],"tr"));
  $("#wTable").innerHTML = rows.length
    ? `<tr><th>Hareket</th><th>Set</th><th>Tekrar</th><th>Maks kg</th><th>Hacim</th></tr>` + rows.map(([n,o]) => o.cardio
        ? `<tr><td>${esc(n)}</td><td>${o.sets}</td><td colspan="3">${fmt(o.mins)} dk${o.km ? " · "+fmt(o.km)+" km" : ""}</td></tr>`
        : o.timed ? `<tr><td>${esc(n)}</td><td>${o.sets}</td><td colspan="3">${fmtSec(o.secs)} toplam${o.max ? ` · +${fmt(o.max)} kg` : ""}</td></tr>`
        : `<tr><td>${esc(n)}</td><td>${o.sets}</td><td>${o.reps}</td><td>${fmt(o.max)}</td><td>${fmt(o.vol)}</td></tr>`).join("")
    : `<tr><td class="empty">Bu hafta kayıt yok</td></tr>`;

  let html = "";
  for (let i=0;i<7;i++){
    const d = new Date(weekStart); d.setDate(d.getDate()+i); const k = ymd(d);
    const es = list.filter(e => e.date===k).sort((x,y) => x.ts-y.ts);
    if (es.length) html += `<h3 style="font-size:14px;margin:14px 0 2px">${niceDate(k)}</h3>` + es.map(e => entryHTML(e,false)).join("");
  }
  $("#wDays").innerHTML = html || `<div class="empty">Bu hafta antrenman yok</div>`;
}
/* ---------- Consistency (heatmap, goal, streak) ---------- */
export const GOAL_WEEKS = 26;
export function dayLoad(){
  const m = {};
  state.entries.forEach(e => { m[e.date] = (m[e.date]||0) + (isCardio(e.ex) ? 3 : work(e.sets).length); });
  return m;
}
export function renderConsistency(){
  $("#goalSel").value = state.goal;
  const load = dayLoad(), today = new Date(); today.setHours(0,0,0,0);
  const thisMon = mondayOf(today), start = new Date(thisMon); start.setDate(start.getDate() - (GOAL_WEEKS-1)*7);
  let cells = "";
  for (let d = new Date(start); d <= new Date(thisMon.getTime() + 6*864e5); d.setDate(d.getDate()+1)) {
    const k = ymd(d), v = load[k] || 0, fut = d > today;
    const lv = !v ? "" : v < 10 ? "l1" : v < 20 ? "l2" : v < 30 ? "l3" : "l4";
    cells += `<i class="${lv}${k===ymd(today) ? " today" : ""}${fut ? " fut" : ""}" title="${shortDate(k)}: ${v ? v + " set" : "dinlenme"}"></i>`;
  }
  $("#heat").innerHTML = cells;
  $("#heat").scrollLeft = $("#heat").scrollWidth;
  // haftalık hedef serisi: bu hafta henüz tamamlanmadıysa seri bozulmuş sayılmaz
  const daysIn = mon => { let n = 0; for (let i=0;i<7;i++){ const d = new Date(mon); d.setDate(d.getDate()+i); if (load[ymd(d)]) n++; } return n; };
  const thisN = daysIn(thisMon);
  $("#gWeek").textContent = `${thisN}/${state.goal}`;
  // seri kullanıcının seçtiği türe göre gün ya da hafta sayar (app/streak.js)
  const st = streakNow(), on = streakOn();
  $("#gStreakBox").classList.toggle("hidden", !on); $("#gBestBox").classList.toggle("hidden", !on);
  $("#gStreak").textContent = st.count; $("#gBest").textContent = st.best;
  $("#gStreakUnit").textContent = `seri (${st.unit})`; $("#gBestUnit").textContent = `en uzun (${st.unit})`;
}
export function muscleAdvice(ms){
  const main = ["Göğüs","Lat","Yan Omuz","Arka Omuz","Biceps","Triceps","Quadriceps","Hamstring","Kalça","Baldır"];
  const low = main.filter(m => (ms[m]||0) < 10), high = main.filter(m => (ms[m]||0) > 20);
  let t = "";
  if (low.length) t += `<div class="hint">${ic("arrow-down")} 10 setin altında: <b>${low.join(", ")}</b></div>`;
  if (high.length) t += `<div class="hint">${ic("arrow-up")} 20 setin üstünde (toparlanmaya dikkat): <b>${high.join(", ")}</b></div>`;
  return t;
}

/* ---------- History ---------- */
export function renderHistSelect(){
  const sel = $("#histEx"), cur = sel.value;
  const names = [...new Set(state.entries.map(e => e.ex))].sort((a,b) => a.localeCompare(b,"tr"));
  sel.innerHTML = names.length ? names.map(n => `<option>${esc(n)}</option>`).join("") : `<option value="">Henüz kayıt yok</option>`;
  if (names.includes(cur)) sel.value = cur;
  renderHist();
}
export function sessionValue(e, metric, c){
  if (c) return e.sets.reduce((a,s)=>a+(+s.w||0),0);
  const ws = work(e.sets);
  if (isTimed(e.ex)) return Math.max(0, ...ws.map(s => +s.sec||0));
  if (metric === "e") return Math.max(0, ...ws.filter(s => s.r<=12).map(s => e1rm(+s.w||0, +s.r||0)));
  if (metric === "v") return volume(e.sets);
  return Math.max(0, ...ws.map(s => +s.w||0));
}
export function renderHist(){
  const ex = $("#histEx").value, c = isCardio(ex), tm = isTimed(ex);
  const metric = document.querySelector('input[name=hMetric]:checked').value;
  const list = state.entries.filter(e => e.ex===ex).sort((a,b) => a.date.localeCompare(b.date));
  const pts = list.map(e => ({ date:e.date, v: sessionValue(e, metric, c) })).filter(p => p.v > 0);
  $("#hChartTitle").textContent = c ? "Gelişim (seans süresi, dk)" : tm ? "Gelişim (en uzun set, sn)" : ({w:"Gelişim (seanstaki en ağır set, kg)", e:"Gelişim (tahmini 1RM, kg)", v:"Gelişim (seans hacmi, kg)"})[metric];
  $("#hMax").nextElementSibling.textContent = tm ? "rekor süre" : "rekor kg";

  // gelişim tahmini: son 8 seansın tahmini 1RM eğilimi
  let proj = null; const fc = $("#hForecast"); fc.classList.add("hidden");
  if (!c && !tm && ex) {
    const ep = list.map(e => ({ t: parse(e.date).getTime()/864e5, v: sessionValue(e, "e", false) })).filter(p => p.v > 0).slice(-8);
    if (ep.length >= 3 && ep[ep.length-1].t - ep[0].t >= 7) {
      const n = ep.length, mx = ep.reduce((a,p)=>a+p.t,0)/n, my = ep.reduce((a,p)=>a+p.v,0)/n;
      const slope = ep.reduce((a,p)=>a+(p.t-mx)*(p.v-my),0) / ep.reduce((a,p)=>a+(p.t-mx)**2,0);
      const last = ep[n-1].t, pred = my + slope*(last+28-mx);
      if (slope > 0.005) {
        fc.innerHTML = `${ic("trending-up")} Son ${n} seansa göre tahmini 1RM'in haftada ortalama <b>+${fmt(slope*7)} kg</b> artıyor. Bu hızla 4 hafta sonra tahmini 1RM: <b>${fmt(pred)} kg</b>.`;
        if (metric === "e") { const d = new Date(last*864e5); d.setDate(d.getDate()+28); proj = { date: ymd(new Date(d.getFullYear(), d.getMonth(), d.getDate())), v: pred }; }
      } else fc.innerHTML = `${ic("activity")} Son ${n} seansta tahmini 1RM artmıyor. Plato olabilir: tekrar aralığını, set sayısını ya da programı değiştirmeyi düşünebilirsin.`;
      fc.classList.remove("hidden");
    }
  }
  $("#histChart").innerHTML = chart(pts, proj);
  const allSets = list.flatMap(e => work(e.sets));
  $("#hMax").textContent = allSets.length && tm ? fmtSec(Math.max(...allSets.map(s => +s.sec||0))) : allSets.length && !c ? fmt(Math.max(...allSets.map(s => +s.w||0))) : "–";
  $("#h1rm").textContent = allSets.length && !c && !tm ? fmt(Math.max(0, ...allSets.filter(s => s.r<=12).map(s => e1rm(+s.w||0, +s.r||0)))) : "–";
  $("#hCount").textContent = list.length;
  // rekor setleri işaretle (ısınma setleri hariç)
  let best = 0; const prMap = {};
  if (!c) list.forEach(e => { const set = new Set(); e.sets.forEach((s,i) => { if (s.t !== "w" && (+s.w||0) > best) { if (best > 0) set.add(i); best = +s.w||0; } }); prMap[e.id] = set; });
  $("#histList").innerHTML = list.length ? list.slice().reverse().map(e => `<div style="margin-top:8px" class="muted small">${niceDate(e.date)}</div>` + entryHTML(e,false,prMap[e.id])).join("") : `<div class="empty">Kayıt yok</div>`;
}
export function chart(pts, proj){
  if (pts.length < 2) return `<div class="empty">${pts.length ? "Grafik için en az 2 kayıt gerekir" : "Kayıt yok"}</div>`;
  const W=600,H=190,L=38,R=12,T=12,B=22;
  const ts = pts.map(p => parse(p.date).getTime()), t0 = ts[0], t1 = proj ? parse(proj.date).getTime() : ts[ts.length-1];
  const vs = pts.map(p => p.v).concat(proj ? [proj.v] : []);
  let lo = Math.min(...vs), hi = Math.max(...vs); if (lo===hi){ lo-=1; hi+=1; }
  const pad = (hi-lo)*0.08; lo -= pad; hi += pad;
  const x = t => L + (t1===t0 ? 0 : (t-t0)*(W-L-R)/(t1-t0)), y = v => T + (hi-v)*(H-T-B)/(hi-lo);
  const path = pts.map((p,i) => (i?"L":"M")+x(ts[i]).toFixed(1)+","+y(p.v).toFixed(1)).join("");
  const mid = (lo+hi)/2;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Gelişim grafiği">
    ${[hi,mid,lo].map(v => `<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L-6}" y="${y(v)+3}" text-anchor="end">${fmt(v)}</text>`).join("")}
    <path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>
    ${proj ? `<line x1="${x(ts[ts.length-1])}" y1="${y(pts[pts.length-1].v)}" x2="${x(t1)}" y2="${y(proj.v)}" stroke="var(--accent)" stroke-width="2" stroke-dasharray="5 5"/>
      <circle cx="${x(t1)}" cy="${y(proj.v)}" r="4.5" fill="var(--card)" stroke="var(--accent)" stroke-width="2"><title>Tahmin ${shortDate(proj.date)}: ${fmt(proj.v)}</title></circle>` : ""}
    ${pts.map((p,i) => `<circle cx="${x(ts[i])}" cy="${y(p.v)}" r="3.5" fill="var(--accent)"><title>${shortDate(p.date)}: ${fmt(p.v)}</title></circle>`).join("")}
    <text x="${L}" y="${H-5}">${shortDate(pts[0].date)}</text><text x="${W-R}" y="${H-5}" text-anchor="end">${proj ? "tahmin " + shortDate(proj.date) : shortDate(pts[pts.length-1].date)}</text></svg>`;
}

/* ---------- Records ---------- */
export const REP_COLS = [1, 3, 5, 8, 10, 12];
export function renderRecords(){
  const by = {};
  state.entries.filter(e => !isCardio(e.ex)).forEach(e => work(e.sets).forEach(s => {
    const o = by[e.ex] ||= { reps: {}, e1: 0 };
    const w = +s.w||0, r = +s.r||0; if (!w || !r) return;
    // r tekrar yapılan kilo, r'den az tekrar sayıları için de geçerli bir rekordur
    REP_COLS.forEach(n => { if (r >= n && w > (o.reps[n]||0)) o.reps[n] = w; });
    if (r <= 12) o.e1 = Math.max(o.e1, e1rm(w, r));
  }));
  const names = Object.keys(by).sort((a,b) => groupOf(a).localeCompare(groupOf(b),"tr") || a.localeCompare(b,"tr"));
  $("#recTable").innerHTML = names.length
    ? `<tr><th>Hareket</th>${REP_COLS.map(n => `<th>${n}T</th>`).join("")}<th>1RM≈</th></tr>` + names.map(n => `<tr class="click" data-ex="${esc(n)}"><td>${esc(n)}</td>${REP_COLS.map(c => `<td>${by[n].reps[c] ? fmt(by[n].reps[c]) : "–"}</td>`).join("")}<td><b>${by[n].e1 ? fmt(by[n].e1) : "–"}</b></td></tr>`).join("")
    : `<tr><td class="empty">Henüz kayıt yok</td></tr>`;
  $("#recTable").querySelectorAll("[data-ex]").forEach(tr => tr.onclick = () => {
    segState.stats = "hist"; renderSeg("stats"); $("#histEx").value = tr.dataset.ex; renderHist(); scrollTo(0,0);
  });
  // kronolojik tarama ile kırılan ağırlık rekorları
  const best = {}, events = [];
  state.entries.filter(e => !isCardio(e.ex)).sort((a,b) => a.date.localeCompare(b.date) || a.ts-b.ts).forEach(e => {
    const top = Math.max(0, ...work(e.sets).map(s => +s.w||0));
    if (top > (best[e.ex]||0)) { if (best[e.ex]) events.push({ date: e.date, ex: e.ex, w: top, prev: best[e.ex] }); best[e.ex] = top; }
  });
  $("#recRecent").innerHTML = events.length ? events.slice(-10).reverse().map(ev => `<div class="entry"><div class="row"><div class="grow"><div class="t">${ic("trophy", "acc")} ${esc(ev.ex)}</div><div class="g">${niceDate(ev.date)}</div></div>
    <div style="text-align:right"><b>${fmt(ev.w)} kg</b><div class="g">+${fmt(ev.w - ev.prev)} kg</div></div></div></div>`).join("")
    : `<div class="empty">Henüz kırılan rekor yok. İlk kayıttan sonraki her ağırlık rekoru burada görünür.</div>`;
}

/* ---------- Recovery ---------- */
export const recoveryMap = () => recoveryMapCore({ entries: state.entries, sessions: state.sessions, isCardio, musclesOf });
export function renderRecovery(){
  const R = recoveryMap();
  const shown = MUSCLE_ORDER.filter(m => R[m] || ["Göğüs","Lat","Ön Omuz","Yan Omuz","Arka Omuz","Biceps","Triceps","Quadriceps","Hamstring","Kalça","Baldır","Karın"].includes(m));
  $("#restList").innerHTML = shown.map(m => {
    const r = R[m];
    if (!r) return `<div class="rec"><span>${m}</span><div class="track"></div><span class="st muted">kayıt yok</span></div>`;
    const cls = r.pct >= 1 ? "st-ok" : r.pct >= .5 ? "st-mid" : "st-low";
    const color = r.pct >= 1 ? "var(--good)" : r.pct >= .5 ? "var(--warn)" : "var(--danger)";
    const ago = r.hrs < 24 ? `${Math.round(r.hrs)} sa önce` : `${Math.floor(r.hrs/24)} gün önce`;
    return `<div class="rec" title="Son: ${shortDate(r.date)} · ${fmt(r.sets)} etkili set"><span>${m}<br><span class="muted" style="font-size:11px">${ago} · ${fmt(r.sets)} set</span></span>
      <div class="track"><i style="width:${r.pct*100}%;background:${color}"></i></div><span class="st ${cls}">${r.pct >= 1 ? "Hazır" : r.pct >= .5 ? "Toparlanıyor" : "Yorgun"}</span></div>`;
  }).join("");
  // en hazır programı öner: ana kasların ortalama toparlanması
  const score = p => { const ms = [...new Set(p.items.flatMap(i => musclesOf(i.ex).p))]; return ms.length ? ms.reduce((a,m) => a + (R[m] ? R[m].pct : 1), 0) / ms.length : 0; };
  const ranked = state.programs.map(p => ({ p, s: score(p) })).filter(x => x.s > 0).sort((a,b) => b.s - a.s);
  const ready = shown.filter(m => !R[m] || R[m].pct >= 1);
  let html = "";
  if (ranked.length) html += `<div class="hint good">${ic("lightbulb")} Bugün en uygun program: <b>${esc(ranked[0].p.name)}</b> (kasları %${Math.round(ranked[0].s*100)} hazır)</div>`;
  if (ready.length) html += `<div class="hint">Hazır kaslar: ${ready.join(", ")}</div>`;
  $("#restSuggest").innerHTML = html + `<div style="height:8px"></div>`;
}

/* ---------- Power score ---------- */
export const LIFTS = [
  { key:"squat", label:"Squat", names:["Back Squat","High-Bar Squat","Low-Bar Squat"] },
  { key:"bench", label:"Bench Press", names:["Bench Press (Barbell)"] },
  { key:"dead", label:"Deadlift", names:["Deadlift","Sumo Deadlift"] },
  { key:"ohp", label:"Overhead Press", names:["Overhead Press (Barbell)"] },
  { key:"row", label:"Barbell Row", names:["Barbell Row","Pendlay Row"] },
  { key:"pull", label:"Barfiks (vücut + ek ağırlık)", names:["Barfiks (Pull-up)","Ağırlıklı Barfiks","Chin-up"], bw:true },
];
// 1RM / vücut ağırlığı eşikleri: Başlangıç, Acemi, Orta, İleri, Elit (yaklaşık)
export const STD = {
  m: { squat:[0.75,1.25,1.5,2.25,2.75], bench:[0.5,0.75,1.25,1.75,2.0], dead:[1.0,1.5,2.0,2.5,3.0], ohp:[0.35,0.55,0.8,1.05,1.35], row:[0.5,0.75,1.0,1.5,1.75], pull:[1.0,1.1,1.3,1.6,1.85] },
  f: { squat:[0.5,0.75,1.25,1.5,2.0], bench:[0.25,0.5,0.75,1.0,1.5], dead:[0.5,1.0,1.25,1.75,2.5], ohp:[0.2,0.35,0.5,0.75,1.0], row:[0.25,0.4,0.65,0.9,1.2], pull:[0.85,1.0,1.15,1.35,1.6] }
};
export const LEVELS = ["Yeni başlayan","Başlangıç","Acemi","Orta","İleri","Elit"];
export const latestWeight = () => { const b = state.body.filter(x => x.weight).sort((a,b) => b.date.localeCompare(a.date))[0]; return b ? b.weight : null; };
export const bodyweight = () => latestWeight() || parseFloat(state.profile.bw) || 0;
export function renderPower(keepInput){
  $("#pfSex").value = state.profile.sex;
  const lw = latestWeight();
  if (!keepInput) $("#pfBw").value = lw || state.profile.bw || "";
  $("#pfBw").disabled = !!lw;
  $("#pfBwNote").textContent = lw ? `Vücut takibindeki son kilon kullanılıyor (${fmt(lw)} kg). Değiştirmek için Diğer → Vücut'a yeni ölçü gir.` : "İpucu: Diğer → Vücut'ta kilonu kaydedersen buradaki değer otomatik güncellenir.";
  const bw = bodyweight(), std = STD[state.profile.sex];
  if (!bw) { $("#pwScore").textContent = "–"; $("#pwLevel").textContent = "Güç skoru"; $("#pwSub").textContent = "Skor için vücut ağırlığını gir."; $("#pwLifts").innerHTML = ""; return; }
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
    $("#pwSub").textContent = `${done.length}/${LIFTS.length} temel hareketten · ${fmt(bw)} kg vücut ağırlığı`;
  } else { $("#pwScore").textContent = "–"; $("#pwLevel").textContent = "Henüz veri yok"; $("#pwSub").textContent = "Aşağıdaki hareketlerden 1–10 tekrarlık set kaydet."; }
  $("#pwLifts").innerHTML = res.map(r => r.best ? `<div class="lift">
      <div class="row"><b class="grow">${r.L.label}</b><span class="lv">${LEVELS[r.lv]}</span><b style="font-variant-numeric:tabular-nums">${Math.round(r.s)}</b></div>
      <div class="muted small">Tahmini 1RM ${fmt(r.best)} kg · ${fmt(r.ratio)}× vücut ağırlığı · ${shortDate(r.date)}${r.lv<5 ? ` · sonraki seviye: ${fmt(std[r.L.key][r.lv]*bw)} kg` : ""}</div>
      <div class="pb"><i style="width:${r.s}%"></i></div></div>`
    : `<div class="lift"><div class="row"><b class="grow muted">${r.L.label}</b><span class="muted small">kayıt yok</span></div></div>`).join("");
}

// Düğme bağlamaları ve ilk hazırlıklar: main.js'teki açılış sırasında çağrılır
export function setup(){
$("#wPrev").onclick = () => { weekStart.setDate(weekStart.getDate()-7); renderWeek(); };
$("#wNext").onclick = () => { weekStart.setDate(weekStart.getDate()+7); renderWeek(); };
$("#wToday").onclick = () => { weekStart = mondayOf(new Date()); renderWeek(); };
$("#goalSel").innerHTML = [1,2,3,4,5,6,7].map(n => `<option value="${n}">${n} gün</option>`).join("");
$("#goalSel").onchange = () => { state.goal = +$("#goalSel").value; save(); renderConsistency(); };
$("#histEx").onchange = renderHist;
document.querySelectorAll('input[name=hMetric]').forEach(r => r.onchange = renderHist);
$("#pfSex").onchange = () => { state.profile.sex = $("#pfSex").value; save(); renderPower(); };
$("#pfBw").oninput = () => { state.profile.bw = $("#pfBw").value; save(); renderPower(true); };
}
