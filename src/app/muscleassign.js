import { t } from "../core/i18n.ts";
import { MUSCLES, muscleLabel, weightsOf } from "../core/musclemap.ts";
import { $, esc, ic, save, state } from "./store.js";
import { isSport, musclesOf, unassignedMuscles } from "./exercises.js";
import { bodyMap, bindBodyMap, redrawBodyMaps } from "./bodymap.js";
import { openSheet, closeSheet, sheetHead, sheetOnClose } from "./ui.js";

export const assignmentButton = ex => !isSport(ex) ? "" : `<button type="button" class="${unassignedMuscles(ex) ? "btn sm quiet muscle-unassigned" : "iconbtn"}" style="min-height:44px;min-width:44px" data-assign-muscles="${esc(ex)}" aria-label="${esc(t("muscles.assign") + ": " + ex)}">${unassignedMuscles(ex) ? '<span aria-hidden="true">⚠</span>' : ic("pencil")}${unassignedMuscles(ex) ? t("muscles.unassigned") : ""}</button>`;

export function bindMuscleAssignments(root, onSave){
  root.querySelectorAll("[data-assign-muscles]").forEach(b => b.onclick = e => {
    e.stopPropagation();
    // Sheets share one container. Keep the original nodes (and their handlers), not just their HTML.
    const inSheet = root === $("#bsBody");
    const headNodes = inSheet ? [...$("#bsHead").childNodes] : [], bodyNodes = inSheet ? [...root.childNodes] : [];
    const previousClose = sheetOnClose;
    openMuscleAssignment(b.dataset.assignMuscles, () => {
      if (inSheet) {
        openSheet("", "", previousClose);
        $("#bsHead").append(...headNodes); root.append(...bodyNodes);
      }
      onSave?.();
    });
  });
}

export function openMuscleAssignment(ex, onSave){
  const current = weightsOf(musclesOf(ex));
  let selected = Object.fromEntries(MUSCLES.filter(m => current[m] > 0).map(m => [m, current[m] >= .75 ? 1 : .5]));
  // Return to the caller's view on save, reset and cancellation alike.
  const body = openSheet(sheetHead(ex), `<div id="muscleAssignment"></div>`, onSave);
  const finish = () => { save(); closeSheet(); redrawBodyMaps(); };
  function render(){
    const focused = document.activeElement?.dataset?.cycleMuscle;
    const tiers = Object.fromEntries(Object.entries(selected).map(([m, w]) => [m, w === 1 ? "assign-main" : "assign-secondary"]));
    $("#muscleAssignment").innerHTML = `<div class="small muted">${t("muscles.assign_title")}</div>${bodyMap(tiers, { tap: true })}
      <div class="bm-legend"><span><i data-t="assign-main"></i>${t("muscles.assign_primary")}</span><span><i data-t="assign-secondary"></i>${t("muscles.assign_secondary")}</span></div>
      <div class="grid2">${MUSCLES.map(m => { const label = t(selected[m] === 1 ? "muscles.assign_primary" : selected[m] === .5 ? "muscles.assign_secondary" : "muscles.assign_none");
        return `<button type="button" class="btn quiet" style="min-height:44px;justify-content:space-between" data-cycle-muscle="${esc(m)}" aria-label="${esc(muscleLabel(m) + ": " + label)}" aria-pressed="${!!selected[m]}"><span>${esc(muscleLabel(m))}</span><b>${selected[m] === 1 ? "●" : selected[m] === .5 ? "◐" : "○"}</b></button>`; }).join("")}</div>
      <div class="row" style="margin-top:12px"><button type="button" class="btn quiet" id="muscleReset">${t("muscles.assign_reset")}</button><span class="grow"></span><button type="button" class="btn primary" id="muscleSave">${ic("check")}${t("muscles.assign_save")}</button></div>`;
    const cycle = m => { if (selected[m] === 1) selected[m] = .5; else if (selected[m] === .5) delete selected[m]; else selected[m] = 1; render(); };
    bindBodyMap(body, ms => cycle(ms[0]));
    body.querySelectorAll("[data-cycle-muscle]").forEach(b => b.onclick = () => cycle(b.dataset.cycleMuscle));
    if (focused) [...body.querySelectorAll("[data-cycle-muscle]")].find(b => b.dataset.cycleMuscle === focused)?.focus();
    $("#muscleSave").onclick = () => { if (Object.keys(selected).length) (state.exMuscles ||= {})[ex] = { ...selected }; else { delete (state.exMuscles ||= {})[ex]; (state.exMusclesU ||= {})[ex] = Date.now(); } finish(); };
    $("#muscleReset").onclick = () => { delete (state.exMuscles ||= {})[ex]; (state.exMusclesU ||= {})[ex] = Date.now(); finish(); };
  }
  render();
}
