import { groupWeek, planWeek, programGroup } from "../core/weekly-load.ts";
import { isRot } from "../core/plan.ts";
import { t } from "../core/i18n.ts";
import { state, esc } from "./store.js";
import { musclesOf } from "./exercises.js";
import { bindBodyMap, sessionLoadHTML, weeklyLoadHTML } from "./bodymap.js";

export function programWeek(id) {
  const ids = programGroup(state.programs, id);
  const planned = isRot(state.plan) ? state.plan.rot : Object.values(state.plan.days).map(d => d.prog);
  return planned.some(id => ids.includes(id))
    ? planWeek(state.plan, state.programs, new Date(), musclesOf, ids)
    : groupWeek(state.programs, ids, musclesOf);
}

// Keep selection in the caller so changing frequency or muscle assignments redraws fresh data.
export function renderWeeklyMap(root, weekly, sessions, selected = -1, onSelect = () => {}, options = {}) {
  root.innerHTML = (selected < 0 ? weeklyLoadHTML(weekly, options) : sessionLoadHTML(sessions[selected].items, options))
    + `<div class="fchips" style="margin:6px 0 4px">${[t("muscles.week"), ...sessions.map(s => s.name)].map((name, i) => `<button class="fchip${i - 1 === selected ? " on" : ""}" data-week-view="${i - 1}" aria-pressed="${i - 1 === selected}">${esc(name)}</button>`).join("")}</div>`;
  root.querySelectorAll("[data-week-view]").forEach(b => b.onclick = () => onSelect(+b.dataset.weekView));
  bindBodyMap(root);
}
