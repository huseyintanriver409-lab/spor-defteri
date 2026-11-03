import { mondayOf, niceDate, pad, ymd } from "../core/dates.ts";
import { work } from "../core/training.ts";
import { $, ic, state } from "./store.js";
import { durText, isCardio } from "./exercises.js";
import { emptyHTML, segState, showTab } from "./ui.js";
import { bindEntryActions, entryHTML, renderDay, resetEditor, saveDraft, updateHint } from "./log.js";
import { autoLogged, calDay } from "./programs.js";
import { MONTHS_LONG } from "./home.js";
import { dayLoad } from "./stats.js";

/* ---------- History: aylık takvim ---------- */
export let calMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
export let selDay = ymd(new Date());
export function renderHistory(){
  const load = dayLoad(), y = calMonth.getFullYear(), m = calMonth.getMonth(), key = `${y}-${pad(m + 1)}`, today = ymd(new Date());
  const days = Object.keys(load).filter(k => k.startsWith(key)).length;
  const sets = state.entries.filter(e => e.date.startsWith(key) && !isCardio(e.ex)).reduce((a, e) => a + work(e.sets).length, 0);
  $("#calMonth").textContent = `${MONTHS_LONG[m]} ${y}`;
  $("#calTitle").textContent = `${days} antrenman`;
  $("#calSub").textContent = `${MONTHS_LONG[m]} ${y} · ${sets} çalışma seti`;
  const start = mondayOf(new Date(y, m, 1));
  let html = ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"].map(d => `<div class="wd">${d}</div>`).join("");
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    if (i % 7 === 0 && i >= 28 && d.getMonth() !== m) break;
    const k = ymd(d), v = load[k] || 0, lv = !v ? 0 : v < 10 ? 1 : v < 20 ? 2 : v < 30 ? 3 : 4;
    html += `<button class="${d.getMonth() !== m ? "out " : ""}${v ? `has l${lv} ` : ""}${k === today ? "today " : ""}${k === selDay ? "sel" : ""}" style="${v ? `--lv:${lv}` : ""}" data-d="${k}" aria-label="${niceDate(k)}${v ? `, ${v} set` : ""}" aria-pressed="${k === selDay}">${d.getDate()}</button>`;
  }
  $("#calGrid").innerHTML = html;
  $("#calGrid").querySelectorAll("[data-d]").forEach(b => b.onclick = () => { selDay = b.dataset.d; renderHistory(); });
  const list = state.entries.filter(e => e.date === selDay).sort((a, b) => a.ts - b.ts);
  $("#hdTitle").textContent = selDay === today ? "Bugün" : niceDate(selDay);
  const ss = state.sessions.filter(s => s.date === selDay);
  $("#hdSess").innerHTML = ss.length ? `${ic("timer")} Antrenman süresi: ${durText(ss.reduce((a, s) => a + s.end - s.start, 0))}` : "";
  $("#hdList").innerHTML = list.length ? list.map(e => entryHTML(e, true)).join("") : emptyHTML("calendar-days", "Bu gün kayıt yok", "Elle eklemek için + düğmesine dokun.");
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
