import { DAYS, mondayOf, niceDate, parse, ymd } from "../core/dates.ts";
import { volume, work } from "../core/training.ts";
import { $, esc, fmt, ic, state } from "./store.js";
import { durText, isCardio, musclesOf } from "./exercises.js";
import { segState, showTab } from "./ui.js";
import { WEEKDAYS, ssLabels } from "./programs.js";
import { elapsedText, liveItems, openFocus, startWorkout } from "./live.js";
import { setCalMonth, setSelDay } from "./history.js";
import { dayLoad, recoveryMap } from "./stats.js";
import { renderBackupBanner } from "./backup.js";
import { flameHTML, streakNote, streakNow } from "./streak.js";

/* ---------- Home: Bugün ---------- */
export const MONTHS_LONG = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
export function todayPlan(){
  const w = WEEKDAYS.find(x => x[2] === new Date().getDay()), d = w && state.plan.days[w[0]];
  return d ? state.programs.find(p => p.id === d.prog) : null;
}
export function weekProgress(){
  const load = dayLoad(), mon = mondayOf(new Date());
  let days = 0; for (let i = 0; i < 7; i++) { const d = new Date(mon); d.setDate(d.getDate() + i); if (load[ymd(d)]) days++; }
  const a = ymd(mon), e = new Date(mon); e.setDate(e.getDate() + 6); const b = ymd(e);
  const lifts = state.entries.filter(x => x.date >= a && x.date <= b && !isCardio(x.ex));
  return { days, sets: lifts.reduce((s, x) => s + work(x.sets).length, 0), vol: lifts.reduce((s, x) => s + volume(x.sets), 0) };
}
export function renderHome(){
  const now = new Date(), today = ymd(now), p = todayPlan(), trainedToday = state.entries.some(e => e.date === today);
  $("#homeDate").textContent = `${DAYS[now.getDay()]} · ${now.getDate()} ${MONTHS_LONG[now.getMonth()]}`;
  let title, sub = "", main = "";
  if (state.live) {
    const items = liveItems(), it = items[state.live.idx || 0];
    const n = state.entries.filter(e => e.date === state.live.date).reduce((a, e) => a + work(e.sets).length, 0);
    title = "Antrenman sürüyor"; sub = it ? `Sıradaki: ${it.ex}` : "";
    main = `<div class="card accent"><h2>${ic("timer")}Süre</h2><div class="bignum" id="homeLiveT">${elapsedText()}</div>
      <p class="muted" style="margin:6px 0 16px">${n} çalışma seti kaydedildi</p><button class="btn xl" id="homeResume">${ic("play")}Devam et</button></div>`;
  } else if (p) {
    title = trainedToday ? "Bugün çalıştın" : p.name; sub = trainedToday ? "Harika iş. İstersen bir antrenman daha başlatabilirsin." : "Haftalık planındaki bugünün antrenmanı.";
    const L = ssLabels(p.items);
    main = `<div class="card accent"><h2>${ic("calendar-days")}Bugünün programı</h2>
      <div class="today-list">${p.items.map((i, k) => `<div>${L[k] ? `<span class="ssl" style="background:rgba(0,0,0,.12);color:inherit">${L[k]}</span>` : ""}${esc(i.ex)}<span>${i.sets} × ${esc(i.reps || "–")}</span></div>`).join("")}</div>
      <button class="btn xl" data-start="${p.id}">${ic("play")}${trainedToday ? "Tekrar başla" : "Başla"}</button></div>`;
  } else {
    title = trainedToday ? "Bugün çalıştın" : "Serbest gün";
    sub = !state.programs.length ? "İlk programını oluştur ya da boş bir antrenmanla başla." : "Haftalık planında bugün için program yok.";
  }
  $("#homeTitle").textContent = title; $("#homeSub").textContent = sub;
  const st = streakNow(), note = streakNote(st);
  $("#homeStreak").innerHTML = flameHTML(st.days);
  $("#homeStreakNote").textContent = note;
  $("#homeStreakNote").classList.toggle("hidden", !note);
  $("#homeStreakNote").classList.toggle("risk", st.atRisk);
  const quick = `<div class="quick" style="margin-bottom:12px">
    <button id="qEmpty">${ic("play")}Boş antrenman</button>
    <button id="qProg">${ic("clipboard-list")}Programlar</button>
    <button id="qLog">${ic("pencil-line")}Elle kayıt</button></div>`;
  // plan yoksa programlardan hızlı başlat
  const progList = !state.live && !p && state.programs.length ? `<div class="card"><h2>${ic("zap")}Hızlı başlat</h2>${state.programs.slice(0, 4).map(x => `<div class="row" style="padding:6px 0;border-top:1px solid var(--line)"><div class="grow"><b>${esc(x.name)}</b><div class="muted small">${x.items.length} hareket</div></div><button class="btn sm primary" data-start="${x.id}">${ic("play")}Başla</button></div>`).join("")}</div>` : "";
  $("#homeMain").innerHTML = main + quick + progList;
  $("#homeMain").querySelectorAll("[data-start]").forEach(b => b.onclick = () => startWorkout(b.dataset.start));
  const r = $("#homeResume"); if (r) r.onclick = openFocus;
  $("#qEmpty").onclick = () => startWorkout(null);
  $("#qProg").onclick = () => { segState.train = "prog"; showTab("train"); };
  $("#qLog").onclick = () => { segState.train = "log"; showTab("train"); };
  // bu hafta
  const w = weekProgress();
  $("#homeWeek").innerHTML = `<div class="stat"><b>${w.days}<span style="font-size:15px;color:var(--muted);text-transform:none;letter-spacing:0">/${state.goal}</span></b><span>gün</span></div>
    <div class="stat"><b>${st.days}</b><span>gün seri</span></div><div class="stat"><b>${w.sets}</b><span>set</span></div>`;
  $("#homeGoal").innerHTML = `<div class="f-prog" style="margin:0" aria-label="Haftalık hedef: ${w.days}/${state.goal} gün">${Array.from({ length: state.goal }, (_, i) => `<i class="${i < w.days ? "on" : ""}"></i>`).join("")}</div>
    <div class="muted small" style="margin-top:8px">${w.days >= state.goal ? "Haftalık hedefini tamamladın." : `Hedefe ${state.goal - w.days} gün kaldı.`} Bu hafta ${fmt(w.vol)} kg hacim.</div>`;
  // toparlanma
  const R = recoveryMap();
  const score = x => { const ms = [...new Set(x.items.flatMap(i => musclesOf(i.ex).p))]; return ms.length ? ms.reduce((a, m) => a + (R[m] ? R[m].pct : 1), 0) / ms.length : 0; };
  const best = state.programs.map(x => ({ x, s: score(x) })).filter(o => o.s > 0).sort((a, b) => b.s - a.s)[0];
  const tired = Object.entries(R).filter(([, v]) => v.pct < .5).map(([m]) => m);
  $("#homeRecovery").innerHTML = Object.keys(R).length ? `<div class="section-title">Toparlanma<span class="grow"></span></div><div class="card">
    ${best ? `<div class="row"><div class="grow"><div class="eyebrow">En uygun program</div><div style="font-size:20px;font-weight:800;letter-spacing:-.02em">${esc(best.x.name)}</div><div class="muted small">Kasları %${Math.round(best.s * 100)} hazır</div></div>${state.live ? "" : `<button class="btn sm" data-start="${best.x.id}">${ic("play")}Başla</button>`}</div>` : ""}
    ${tired.length ? `<div class="hint">${ic("battery-low")} Dinlenmesi gereken: <b>${esc(tired.join(", "))}</b></div>` : `<div class="hint good">${ic("battery-full")} Bütün kasların hazır görünüyor.</div>`}</div>` : "";
  $("#homeRecovery").querySelectorAll("[data-start]").forEach(b => b.onclick = () => startWorkout(b.dataset.start));
  // son antrenman
  const lastDate = state.entries.reduce((m, e) => e.date > m ? e.date : m, "");
  if (lastDate) {
    const list = state.entries.filter(e => e.date === lastDate).sort((a, b) => a.ts - b.ts), lifts = list.filter(e => !isCardio(e.ex));
    const ss = state.sessions.filter(s => s.date === lastDate), dur = ss.reduce((a, s) => a + s.end - s.start, 0);
    $("#homeLast").innerHTML = `<div class="section-title">Son antrenman<span class="grow"></span></div><div class="card">
      <div class="row" style="margin-bottom:10px"><div class="grow"><div style="font-weight:800;font-size:17px;letter-spacing:-.02em">${lastDate === today ? "Bugün" : niceDate(lastDate)}</div>
      <div class="muted small">${lifts.reduce((a, e) => a + work(e.sets).length, 0)} set · ${fmt(lifts.reduce((a, e) => a + volume(e.sets), 0))} kg${dur ? " · " + durText(dur) : ""}</div></div>
      <button class="ghost" id="homeLastOpen">Ayrıntı${ic("chevron-right")}</button></div>
      <div class="chips">${list.map(e => `<span class="chip">${esc(e.ex)} · ${work(e.sets).length || e.sets.length}</span>`).join("")}</div></div>`;
    $("#homeLastOpen").onclick = () => { setSelDay(lastDate); const d = parse(lastDate); setCalMonth(new Date(d.getFullYear(), d.getMonth(), 1)); showTab("history"); };
  } else $("#homeLast").innerHTML = "";
  renderBackupBanner();
}
