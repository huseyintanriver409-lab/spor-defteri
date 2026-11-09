import { programName } from "../core/programs.ts";
import { mondayOf, niceDate, pad, ymd } from "../core/dates.ts";
import { work } from "../core/training.ts";
import { plannedOn } from "../core/calendar.ts";
import { $, esc, ic, state } from "./store.js";
import { durText, isCardio } from "./exercises.js";
import { segState, showTab } from "./ui.js";
import { bindEntryActions, entryHTML, renderDay, resetEditor, saveDraft, updateHint } from "./log.js";
import { autoLogged, calDay } from "./programs.js";
import { MONTHS_LONG } from "./home.js";
import { startWorkout } from "./live.js";
import { dayLoad } from "./stats.js";
import { t, fmtDate } from "../core/i18n.ts";

/* ---------- Takvim: geçmiş antrenmanlar ve planlı günler ----------
   Yapılan günler yoğunluğa göre dolu, bugünden sonraki planlı günler çerçeveli görünür; Google Takvim gerekmez. */
export let calMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
export let selDay = ymd(new Date());
export function renderHistory(){
  const load = dayLoad(), y = calMonth.getFullYear(), m = calMonth.getMonth(), key = `${y}-${pad(m + 1)}`, today = ymd(new Date());
  const days = Object.keys(load).filter(k => k.startsWith(key)).length;
  const sets = state.entries.filter(e => e.date.startsWith(key) && !isCardio(e.ex)).reduce((a, e) => a + work(e.sets).length, 0);
  $("#calMonth").textContent = `${MONTHS_LONG[m]} ${y}`;
  const plannedFor = k => k >= today && !load[k] ? plannedOn(state.plan, state.programs, k) : null;
  let planned = 0;
  for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) if (plannedFor(`${key}-${pad(d)}`)) planned++;
  $("#calTitle").textContent = `${t("history.count_workouts", { n: days })}${planned ? ` · ${t("history.count_planned", { n: planned })}` : ""}`;
  $("#calSub").textContent = t("history.sets_count", { n: sets });
  const start = mondayOf(new Date(y, m, 1));
  let html = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return `<div class="wd">${fmtDate(d, { weekday: "short" })}</div>`; }).join("");
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    if (i % 7 === 0 && i >= 28 && d.getMonth() !== m) break;
    const k = ymd(d), v = load[k] || 0, lv = !v ? 0 : v < 10 ? 1 : v < 20 ? 2 : v < 30 ? 3 : 4;
    const pl = plannedFor(k);
    html += `<button class="${d.getMonth() !== m ? "out " : ""}${v ? `has l${lv} ` : ""}${pl ? "plan " : ""}${k === today ? "today " : ""}${k === selDay ? "sel" : ""}" style="${v ? `--lv:${lv}` : ""}" data-d="${k}" aria-label="${niceDate(k)}${v ? `, ${t("history.sets_count", { n: v })}` : ""}${pl ? t("history.aria_planned", { name: esc(programName(pl)) }) : ""}" aria-pressed="${k === selDay}">${d.getDate()}</button>`;
  }
  $("#calGrid").innerHTML = html;
  $("#calGrid").querySelectorAll("[data-d]").forEach(b => b.onclick = () => { selDay = b.dataset.d; renderHistory(); });
  const list = state.entries.filter(e => e.date === selDay).sort((a, b) => a.ts - b.ts);
  $("#hdTitle").textContent = selDay === today ? t("history.today") : niceDate(selDay);
  const ss = state.sessions.filter(s => s.date === selDay);
  $("#hdSess").innerHTML = ss.length ? `<span role="img" aria-label="${t("history.duration")}">${ic("timer")}</span> ${durText(ss.reduce((a, s) => a + s.end - s.start, 0))}` : "";
  const pl = !list.length && plannedFor(selDay);
  $("#hdList").innerHTML = list.length ? list.map(e => entryHTML(e, true)).join("")
    : pl ? `<div class="planday"><div class="eyebrow">${t("history.planned_workout")}</div><b>${esc(programName(pl))}</b>
        <div class="muted small">${pl.items.map(i => `${esc(i.ex)} ${i.sets}×${esc(i.reps || "")}`.trim()).join(" · ")}</div>
        ${selDay === today && !state.live ? `<button class="btn primary" id="hdStart" style="margin-top:12px">${ic("play")}${t("history.start")}</button>` : ""}</div>`
    : selDay > today ? `<div class="empty">${ic("calendar-days")}<button class="btn sm" id="hdEmptyPlan">${t("history.make_plan")}</button></div>`
    : `<div class="empty">${ic("calendar-days")}<button class="btn sm" id="hdEmptyAdd">${t("history.add_record")}</button></div>`;
  if ($("#hdStart")) $("#hdStart").onclick = () => startWorkout(pl.id);
  if ($("#hdEmptyPlan")) $("#hdEmptyPlan").onclick = () => { segState.train = "plan"; showTab("train"); };
  if ($("#hdEmptyAdd")) $("#hdEmptyAdd").onclick = () => $("#hdAdd").click();
  $("#hdCal").classList.toggle("hidden", !list.length || autoLogged(ss));
  bindEntryActions($("#hdList"), renderHistory);
}

// başka modüllerden atanabilmesi için
export function setSelDay(v){ return selDay = v; }
export function setCalMonth(v){ return calMonth = v; }

// Düğme bağlamaları ve ilk hazırlıklar: main.js'teki açılış sırasında çağrılır
export function setup(){
$("#calPrev").onclick = () => { calMonth.setMonth(calMonth.getMonth() - 1); renderHistory(); };
$("#calNext").onclick = () => { calMonth.setMonth(calMonth.getMonth() + 1); renderHistory(); };
$("#hdCal").onclick = () => calDay(selDay);
$("#hdAdd").onclick = () => { segState.train = "log"; showTab("train"); resetEditor(); $("#logDate").value = selDay; renderDay(); updateHint(); saveDraft(); };
}
