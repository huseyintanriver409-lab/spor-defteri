import { DAYS, mondayOf, ymd } from "../core/dates.ts";
import { volume, work } from "../core/training.ts";
import { $, esc, ic, state } from "./store.js";
import { focus, isCardio, isYoga, liftOn, musclesOf } from "./exercises.js";
import { applyProgram } from "./presets.js";
import { bindBodyMap, bodyMap, fatigueTiers } from "./bodymap.js";
import { programById } from "../core/programs.ts";
import { plannedOn } from "../core/calendar.ts";
import { segState, showTab } from "./ui.js";
import { ssLabels } from "./programs.js";
import { elapsedText, liveItems, openFocus, startWorkout } from "./live.js";
import { dayLoad, recoveryMap } from "./stats.js";
import { renderBackupBanner } from "./backup.js";
import { flameHTML, streakNote, streakNow, streakOn } from "./streak.js";

/* ---------- Ana sayfa ---------- */
export const MONTHS_LONG = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
// sırayla planda da doğru program: core/plan.ts
export const todayPlan = () => plannedOn(state.plan, state.programs, ymd(new Date()));
export function weekProgress(){
  const load = dayLoad(), mon = mondayOf(new Date());
  let days = 0; for (let i = 0; i < 7; i++) { const d = new Date(mon); d.setDate(d.getDate() + i); if (load[ymd(d)]) days++; }
  const a = ymd(mon), e = new Date(mon); e.setDate(e.getDate() + 6); const b = ymd(e);
  const lifts = state.entries.filter(x => x.date >= a && x.date <= b && !isCardio(x.ex));
  return { days, sets: lifts.reduce((s, x) => s + work(x.sets).length, 0), vol: lifts.reduce((s, x) => s + volume(x.sets), 0) };
}
// Ana sayfa özünde: bugünün (ya da en hazır) programı büyük Başla ile, haftanın özeti ve toparlanma haritası.
// Kısayollar Antrenman sekmesinde, son antrenman Takvim'de.
export function renderHome(){
  const now = new Date(), today = ymd(now), p = todayPlan(), trainedToday = state.entries.some(e => e.date === today);
  $("#homeDate").textContent = `${DAYS[now.getDay()]} · ${now.getDate()} ${MONTHS_LONG[now.getMonth()]}`;
  const R = recoveryMap();
  const score = x => { const ms = [...new Set(x.items.flatMap(i => musclesOf(i.ex).p))]; return ms.length ? ms.reduce((a, m) => a + (R[m] ? R[m].pct : 1), 0) / ms.length : 0; };
  const best = state.programs.map(x => ({ x, s: score(x) })).filter(o => o.s > 0).sort((a, b) => b.s - a.s)[0];
  let title, sub = "", main = "";
  if (state.live) {
    const items = liveItems(), it = items[state.live.idx || 0];
    const n = state.entries.filter(e => e.date === state.live.date).reduce((a, e) => a + work(e.sets).length, 0);
    title = "Antrenman sürüyor"; sub = it ? `Sıradaki: ${it.ex}` : "";
    main = `<div class="card accent"><h2>${ic("timer")}Süre</h2><div class="bignum" id="homeLiveT">${elapsedText()}</div>
      <p class="muted" style="margin:6px 0 16px">${n} set</p><button class="btn xl" id="homeResume">${ic("play")}Devam et</button></div>`;
  } else if (p) {
    title = trainedToday ? "Bugün çalıştın" : p.name;
    const L = ssLabels(p.items);
    main = `<div class="card accent"><h2>${ic("calendar-days")}${trainedToday ? esc(p.name) : "Bugünün programı"}</h2>
      <div class="today-list">${p.items.map((i, k) => `<div>${L[k] ? `<span class="ssl" style="background:rgba(0,0,0,.12);color:inherit">${L[k]}</span>` : ""}${esc(i.ex)}<span>${i.sets} × ${esc(i.reps || "–")}</span></div>`).join("")}</div>
      <button class="btn xl" data-start="${p.id}">${ic("play")}${trainedToday ? "Tekrar başla" : "Başla"}</button></div>`;
  } else if (best) {
    // planlı gün değil: kasları en hazır program önerilir
    title = trainedToday ? "Bugün çalıştın" : "Serbest gün";
    main = `<div class="card accent"><h2>${ic("zap")}Önerilen</h2>
      <div style="font-size:24px;font-weight:800;letter-spacing:-.02em">${esc(best.x.name)}</div>
      <p class="muted" style="margin:4px 0 16px">${best.x.items.length} hareket · kasları %${Math.round(best.s * 100)} hazır</p>
      <button class="btn xl" data-start="${best.x.id}">${ic("play")}Başla</button></div>`;
  } else {
    title = trainedToday ? "Bugün çalıştın" : "Serbest gün";
    if (!state.programs.length) sub = "İlk programını oluştur ya da boş bir antrenmanla başla.";
  }
  $("#homeTitle").textContent = title; $("#homeSub").textContent = sub;
  $("#homeSub").classList.toggle("hidden", !sub);
  const st = streakNow(), on = streakOn(), note = on ? streakNote(st) : "";
  $("#homeStreak").innerHTML = on ? flameHTML(st) : "";
  $("#homeStreakNote").textContent = note;
  $("#homeStreakNote").classList.toggle("hidden", !note);
  $("#homeStreakNote").classList.toggle("risk", st.atRisk);
  const links = state.live ? "" : `<div class="row" style="justify-content:center;gap:4px;margin:-4px 0 12px">
    <button class="ghost" id="qEmpty">${ic("play")}Boş antrenman</button><button class="ghost" id="qProg">${ic("clipboard-list")}Başka program</button></div>`;
  $("#homeMain").innerHTML = main + links;
  $("#homeMain").querySelectorAll("[data-start]").forEach(b => b.onclick = () => startWorkout(b.dataset.start));
  const r = $("#homeResume"); if (r) r.onclick = openFocus;
  if ($("#qEmpty")) $("#qEmpty").onclick = () => startWorkout(null);
  if ($("#qProg")) $("#qProg").onclick = () => { segState.train = "prog"; showTab("train"); };
  // bu hafta: sayılar ve hedef çubuğu
  const w = weekProgress();
  $("#homeWeek").innerHTML = `<div class="stat"><b>${w.days}<span style="font-size:15px;color:var(--muted);text-transform:none;letter-spacing:0">/${state.goal}</span></b><span>gün</span></div>
    ${on ? `<div class="stat"><b>${st.count}</b><span>${st.unit} seri</span></div>` : ""}<div class="stat"><b>${w.sets}</b><span>set</span></div>`;
  $("#homeGoal").innerHTML = `<div class="f-prog" style="margin:0" aria-label="Haftalık hedef: ${w.days}/${state.goal} gün">${Array.from({ length: state.goal }, (_, i) => `<i class="${i < w.days ? "on" : ""}"></i>`).join("")}</div>`;
  // toparlanma: harita ve dinlenmesi gereken kaslar
  const tired = Object.entries(R).filter(([, v]) => v.pct < .5).map(([m]) => m);
  // spor ve yogayı birlikte kullananlara: kaslar yorgunken hafif yoga önerisi (aktif toparlanma)
  const yogaProg = state.programs.filter(x => x.items.length && x.items.every(i => isYoga(i.ex))).sort((a, b) => (b.lib === "yoga-aksam") - (a.lib === "yoga-aksam"))[0];
  const activeRest = focus() === "both" && tired.length && !state.live;
  $("#homeRecovery").innerHTML = Object.keys(R).length && liftOn() ? `<div class="section-title">Toparlanma<span class="grow"></span></div><div class="card">
    ${bodyMap(fatigueTiers(R), { small: true })}
    ${tired.length ? `<div class="hint">${ic("battery-low")} <span>Dinlenmeli: <b>${esc(tired.join(", "))}</b></span></div>` : `<div class="hint good">${ic("battery-full")} Bütün kasların hazır.</div>`}
    ${activeRest ? `<button class="btn sm" id="homeYoga" style="margin-top:10px">${ic("leaf")}Hafif esneme: ${yogaProg ? esc(yogaProg.name) : "20 dk"}</button>` : ""}</div>` : "";
  bindBodyMap($("#homeRecovery"));
  if ($("#homeYoga")) $("#homeYoga").onclick = () => {
    // yoga programı yoksa "Akşam Esneme ve Rahatlama" programlara eklenir (plana dokunmadan) ve başlar
    if (!yogaProg) applyProgram(programById("yoga-aksam"), 3, false);
    startWorkout((yogaProg || state.programs.find(x => x.lib === "yoga-aksam")).id);
  };
  renderBackupBanner();
}
