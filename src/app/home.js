import { programName } from "../core/programs.ts";
import { DAYS, MONTHS_LONG, mondayOf, ymd } from "../core/dates.ts";
import { volume, work } from "../core/training.ts";
import { $, esc, ic, state } from "./store.js";
import { focus, isCardio, isYoga, liftOn, musclesOf } from "./exercises.js";
import { applyProgram } from "./presets.js";
import { bindBodyMap, bodyMap, fatigueSummary, fatigueTiers, levelBar, openRecoveryAnalysis } from "./bodymap.js";
import { programById } from "../core/programs.ts";
import { plannedOn } from "../core/calendar.ts";
import { segState, showTab } from "./ui.js";
import { elapsedText, liveItems, openFocus, startWorkout } from "./live.js";
import { openAddProgram } from "./programs.js";
import { dayLoad, recoveryMap } from "./stats.js";
import { renderBackupBanner } from "./backup.js";
import { flameHTML, streakNote, streakNow, streakOn } from "./streak.js";
import { t } from "../core/i18n.ts";

/* ---------- Ana sayfa ---------- */
export { MONTHS_LONG };
// sırayla planda da doğru program: core/plan.ts
export const todayPlan = () => plannedOn(state.plan, state.programs, ymd(new Date()));
export function weekProgress(){
  const load = dayLoad(), mon = mondayOf(new Date());
  let days = 0; for (let i = 0; i < 7; i++) { const d = new Date(mon); d.setDate(d.getDate() + i); if (load[ymd(d)]) days++; }
  const a = ymd(mon), e = new Date(mon); e.setDate(e.getDate() + 6); const b = ymd(e);
  const lifts = state.entries.filter(x => x.date >= a && x.date <= b && !isCardio(x.ex));
  return { days, sets: lifts.reduce((s, x) => s + work(x.sets).length, 0), vol: lifts.reduce((s, x) => s + volume(x.sets), 0) };
}
// ISO 8601 hafta numarası (haftanın Perşembe'si hangi yıldaysa o yıl)
export function isoWeek(d){
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  return Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
}
// Program süresi tahmini: set başına ~3,5 dk (çalışma + dinlenme), 5 dk'ya yuvarlanır, en az 5
export const planMinutes = sets => Math.max(5, Math.round(sets * 3.5 / 5) * 5);
// Ana sayfa özünde: bugünün (ya da en hazır) programı büyük Başla ile, haftanın özeti ve toparlanma haritası.
// Kısayollar Antrenman sekmesinde, son antrenman Takvim'de.
export function renderHome(){
  const now = new Date(), today = ymd(now), p = todayPlan(), trainedToday = state.entries.some(e => e.date === today);
  $("#homeDate").textContent = t("home.week_label", { day: DAYS[now.getDay()], w: isoWeek(now) });
  const R = recoveryMap();
  const score = x => { const ms = [...new Set(x.items.flatMap(i => musclesOf(i.ex).p))]; return ms.length ? ms.reduce((a, m) => a + (R[m] ? R[m].pct : 1), 0) / ms.length : 0; };
  const best = state.programs.map(x => ({ x, s: score(x) })).filter(o => o.s > 0).sort((a, b) => b.s - a.s)[0];
  let title, sub = "", main = "";
  if (state.live) {
    const items = liveItems(), it = items[state.live.idx || 0];
    const n = state.entries.filter(e => e.date === state.live.date).reduce((a, e) => a + work(e.sets).length, 0);
    title = it ? it.ex : t("home.workout");
    main = `<div class="card"><div class="bignum" id="homeLiveT">${elapsedText()}</div>
      <p class="muted" style="margin:6px 0 16px">${t("home.set_count", { n })}</p><div class="home-start"><button class="btn primary xl" id="homeResume">${ic("play")}${t("home.resume")}</button></div></div>`;
  } else if (p) {
    title = trainedToday ? t("home.trained_today") : programName(p);
    const totalSets = p.items.reduce((a, i) => a + (+i.sets || 0), 0);
    if (!trainedToday) sub = t("home.plan_summary", { n: p.items.length, s: totalSets, m: planMinutes(totalSets) });
    main = `<div class="card">${trainedToday ? `<h2>${esc(programName(p))}</h2>` : ""}
      <div class="today-list">${p.items.slice(0, 4).map(i => `<div>${esc(i.ex)}</div>`).join("")}${p.items.length > 4 ? `<div class="muted">+${p.items.length - 4}</div>` : ""}</div>
      <div class="home-start"><button class="btn primary xl" data-start="${p.id}">${trainedToday ? t("home.restart") : t("home.start")}</button></div></div>`;
  } else if (best) {
    // planlı gün değil: kasları en hazır program önerilir
    title = trainedToday ? t("home.trained_today") : t("home.free_day");
    main = `<div class="card">
      <div style="font-size:24px;font-weight:800;letter-spacing:-.02em">${esc(programName(best.x))}</div>
      <p class="muted" style="margin:4px 0 16px">${t("home.best_summary", { n: best.x.items.length, p: Math.round(best.s * 100) })}</p>
      <div class="home-start"><button class="btn primary xl" data-start="${best.x.id}">${t("home.start")}</button></div></div>`;
  } else {
    title = trainedToday ? t("home.trained_today") : t("home.free_day");
    main = `<div class="home-start"><button class="btn xl" id="qAdd">${ic("plus")}${t("home.add_program")}</button></div>`;
  }
  $("#homeTitle").textContent = title; $("#homeSub").textContent = sub;
  $("#homeSub").classList.toggle("hidden", !sub);
  const st = streakNow(), on = streakOn(), note = on && !trainedToday ? streakNote(st) : "";
  $("#homeStreak").innerHTML = on ? flameHTML(st) : "";
  $("#homeStreakNote").textContent = note;
  $("#homeStreakNote").classList.toggle("hidden", !note);
  $("#homeStreakNote").classList.toggle("risk", st.atRisk);
  const links = state.live ? "" : `<div class="row" style="justify-content:center;gap:4px;margin:-4px 0 12px">
    <button class="ghost" id="qEmpty">${ic("play")}${t("home.empty_workout")}</button></div>`;
  $("#homeMain").innerHTML = main + links;
  $("#homeMain").querySelectorAll("[data-start]").forEach(b => b.onclick = () => startWorkout(b.dataset.start));
  const r = $("#homeResume"); if (r) r.onclick = openFocus;
  if ($("#qEmpty")) $("#qEmpty").onclick = () => startWorkout(null);
  if ($("#qAdd")) $("#qAdd").onclick = () => { segState.train = "prog"; showTab("train"); openAddProgram(); };
  // bu hafta: sayılar ve hedef çubuğu
  const w = weekProgress();
  $("#homeWeek").innerHTML = `<div class="stat" role="group" aria-label="${t("home.week_aria", { d: w.days, g: state.goal })}"><b>${w.days}<span>/${state.goal}</span></b><span>${t("home.workouts_label")}</span></div>
    ${on ? `<div class="stat"><b>${st.count}</b><span>${t("home.streak_label", { unit: st.unit })}</span></div>` : ""}<div class="stat"><b>${w.sets}</b><span>${t("home.set_label")}</span></div>`;
  $("#homeGoal").innerHTML = `<div class="f-prog" style="margin:0" aria-label="${t("home.goal_aria", { d: w.days, g: state.goal })}">${Array.from({ length: state.goal }, (_, i) => `<i class="${i < w.days ? "on" : ""}"></i>`).join("")}</div>`;
  // toparlanma: harita ve dinlenmesi gereken kaslar
  const tired = Object.entries(R).filter(([, v]) => v.pct < .5).map(([m]) => m);
  // spor ve yogayı birlikte kullananlara: kaslar yorgunken hafif yoga önerisi (aktif toparlanma)
  const yogaProg = state.programs.filter(x => x.items.length && x.items.every(i => isYoga(i.ex))).sort((a, b) => (b.lib === "yoga-aksam") - (a.lib === "yoga-aksam"))[0];
  const activeRest = focus() === "both" && tired.length && !state.live;
  const fs = fatigueSummary(R);
  // karta ya da haritaya dokununca hareketler değil, toparlanma analizi açılır
  const rest = tired.length ? t("home.resting", { n: tired.length }) : t("home.all_ready");
  $("#homeRecovery").innerHTML = Object.keys(R).length && liftOn() ? `<div class="section-title">${t("home.recovery")}<span class="grow"></span></div><div class="card" id="recCard" role="button" tabindex="0" aria-label="${t("home.recovery_aria", { label: fs.label, rest })}">
    <div class="row" style="align-items:flex-start"><div class="grow"><div style="font-size:22px;font-weight:800;letter-spacing:-.02em">${fs.label}</div>${levelBar(fs.lvl)}</div>
      ${ic("chevron-right")}</div>
    ${bodyMap(fatigueTiers(R), { small: true })}
    ${tired.length ? `<div class="hint">${ic("battery-low")} <span>${rest}</span></div>` : `<div class="hint good">${ic("battery-full")} ${rest}</div>`}</div>
    ${activeRest ? `<button class="btn sm" id="homeYoga" style="margin-top:10px"${yogaProg ? ` title="${esc(programName(yogaProg))}"` : ""}>${ic("leaf")}${t("home.light_stretch")}</button>` : ""}` : "";
  bindBodyMap($("#homeRecovery"), ms => openRecoveryAnalysis(ms[0]));
  if ($("#recCard")) {
    $("#recCard").onclick = () => openRecoveryAnalysis();
    $("#recCard").onkeydown = e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openRecoveryAnalysis(); } };
  }
  if ($("#homeYoga")) $("#homeYoga").onclick = () => {
    // yoga programı yoksa "Akşam Esneme ve Rahatlama" programlara eklenir (plana dokunmadan) ve başlar
    if (!yogaProg) applyProgram(programById("yoga-aksam"), 3, false);
    startWorkout((yogaProg || state.programs.find(x => x.lib === "yoga-aksam")).id);
  };
  renderBackupBanner();
}
