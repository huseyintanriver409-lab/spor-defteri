import { EQUIPMENT_IDS, sanitizeEquipment } from "../core/equipment.ts";
import { t } from "../core/i18n.ts";
import { esc, ic, save, state } from "./store.js";
import { openSheet, sheetHead } from "./ui.js";

const refreshListeners = new WeakMap();
export const equipmentLabel = id => t("equipment." + id);
export const ownedEquipment = () => sanitizeEquipment(state.prefs.equip);
export function setOwnedEquipment(ids){
  state.prefs.equip = sanitizeEquipment(ids); save();
  document.dispatchEvent(new Event("equipmentchange"));
}
export const equipmentEmptyHTML = () => `<div class="empty">${ic("dumbbell")}<button class="btn" type="button" data-equipment-change>${esc(t("equipment.change"))}</button></div>`;
export function bindEquipmentEmpty(root, after){
  root.querySelectorAll("[data-equipment-change]").forEach(b => b.onclick = () => openEquipment(after));
}
// One touch-sized chooser for discovery, profile preferences and custom requirements.
export function mountEquipment(root, { get = ownedEquipment, set = setOwnedEquipment, expanded = false, label = "equipment.title", all = true } = {}){
  if (!root) return;
  root.classList?.add("equipment-root");
  const draw = () => {
    const ids = sanitizeEquipment(get());
    root.innerHTML = `<button type="button" class="btn equipment-toggle" aria-expanded="${expanded}" aria-label="${esc(t(label))}" data-equipment-toggle>${ic("dumbbell")}${esc(t(label))}<span class="tag">${all && !ids.length ? esc(t("equipment.all")) : ids.length}</span>${ic("chevron-down")}</button>`
      + (expanded ? `<div class="equipment-grid">${all ? `<button type="button" class="equipment-chip${!ids.length || ids.length === EQUIPMENT_IDS.length ? " on" : ""}" data-equipment-all aria-pressed="${!ids.length || ids.length === EQUIPMENT_IDS.length}">${!ids.length || ids.length === EQUIPMENT_IDS.length ? ic("check") : ""}${esc(t("equipment.all"))}</button>` : ""}${EQUIPMENT_IDS.map(id => `<button type="button" class="equipment-chip${ids.includes(id) ? " on" : ""}" data-equipment="${id}" aria-pressed="${ids.includes(id)}">${ids.includes(id) ? ic("check") : ""}${esc(equipmentLabel(id))}</button>`).join("")}</div>${all ? "" : `<button type="button" class="btn quiet" data-equipment-clear>${ic("x")}${esc(t("equipment.clear"))}</button>`}` : "");
    root.querySelector("[data-equipment-toggle]").onclick = () => { expanded = !expanded; draw(); };
    root.querySelectorAll("[data-equipment]").forEach(b => b.onclick = () => { const id = b.dataset.equipment; set(ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]); draw(); });
    const allBtn = root.querySelector("[data-equipment-all]"); if (allBtn) allBtn.onclick = () => { set([]); draw(); };
    const clear = root.querySelector("[data-equipment-clear]"); if (clear) clear.onclick = () => { set([]); draw(); };
  };
  draw();
  const previous = refreshListeners.get(root);
  if (previous) document.removeEventListener?.("equipmentrefresh", previous);
  // Bileşenler modül yüklenirken (kayıtlı veri okunmadan) çizilir; veri yüklenince/eşitlenince yeniden çiz
  const onRefresh = () => { if (root.isConnected === false) document.removeEventListener?.("equipmentrefresh", onRefresh); else draw(); };
  refreshListeners.set(root, onRefresh);
  document.addEventListener?.("equipmentrefresh", onRefresh);
  return draw;
}
export const refreshEquipmentViews = () => document.dispatchEvent(new Event("equipmentrefresh"));
export function openEquipment(after){
  const body = openSheet(sheetHead(t("equipment.title")), `<div data-equipment-panel></div>`, after);
  mountEquipment(body.querySelector("[data-equipment-panel]"), { expanded: true });
}
