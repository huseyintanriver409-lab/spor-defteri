import { preload as preloadGoogle } from "../sync/google.ts";
import { ymd } from "../core/dates.ts";
import { mergeStates, withDefaults } from "../core/schema.ts";
import { $, choose, ic, save, setState, stampChanges, state, takeSnapshot, toast } from "./store.js";
import { SET_TYPES, _mCache, groupOf, isCardio } from "./exercises.js";
import { refreshAll } from "./ui.js";
import { refreshDatalist, resetEditor } from "./log.js";
import { renderCalStatus, sync, syncCanRun } from "./cloud.js";
import { t } from "../core/i18n.ts";

/* ---------- Backup ---------- */
export function renderBackup(){
  $("#dataInfo").textContent = t("backup.info", { n: state.entries.length, p: state.programs.length });
  renderCalStatus();
  // takvim onay kutusu ilk dokunuşta giriş penceresini açabilsin diye Google betiği şimdiden yüklenir
  if (syncCanRun()) preloadGoogle().catch(() => {});
}
export function download(name, text, type){
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export function exportBackup(){
  state.lastBackup = Date.now(); save();
  const { draft, live, ...data } = state;
  download(`spor-defteri-yedek-${ymd(new Date())}.json`, JSON.stringify(data, null, 1), "application/json");
  renderBackup(); renderBackupBanner();
}
export function renderBackupBanner(){
  const first = state.entries.reduce((m,e) => Math.min(m, e.ts||Infinity), Infinity);
  const since = state.lastBackup || first, days = Math.floor((Date.now() - since)/864e5);
  // Drive'a son 10 günde eşitlendiyse veriler zaten güvende; yedek hatırlatması gösterilmez
  const synced = sync.on && Date.now() - sync.last < 10*864e5;
  const show = !synced && state.entries.length >= 3 && isFinite(since) && days >= 10 && Date.now() > state.backupSnooze;
  $("#backupBanner").classList.toggle("hidden", !show);
  if (show) $("#backupMsg").innerHTML = state.lastBackup ? `${ic("save")} ${t("backup.banner_days_html", { n: days })}` : `${ic("save")} ${t("backup.banner_none")}`;
}

// Düğme bağlamaları ve ilk hazırlıklar: main.js'teki açılış sırasında çağrılır
export function setup(){
$("#exportBtn").onclick = exportBackup;
// Türkçe Excel ";" ayırıcı ve ondalık virgül bekler; BOM, Türkçe karakterlerin doğru görünmesi için
$("#csvBtn").onclick = () => {
  const num = n => n === "" || n == null ? "" : String(n).replace(".", ",");
  const cell = v => { v = String(v ?? ""); return /[";\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const rows = [[t("backup.csv_date"),t("backup.csv_move"),t("backup.csv_group"),t("backup.csv_set"),t("backup.csv_set_type"),t("backup.csv_kg_min"),t("backup.csv_reps_km"),"RIR",t("backup.csv_volume"),t("backup.csv_note")]];
  state.entries.slice().sort((a,b) => a.date.localeCompare(b.date) || a.ts-b.ts).forEach(e => {
    const c = isCardio(e.ex); let k = 0;
    e.sets.forEach((s,i) => {
      const n = s.t === "w" ? "I" : ++k;
      rows.push([e.date, e.ex, groupOf(e.ex), n, s.t ? SET_TYPES[s.t] : (c ? t("backup.csv_cardio") : s.sec != null ? t("backup.csv_timed") : t("backup.csv_normal")), num(+s.w||0), num(s.sec ?? (+s.r||0)), num(s.rir), c || s.t === "w" ? "" : num((+s.w||0)*(+s.r||0)), i === 0 ? (e.note||"") : ""]);
    });
  });
  download(`spor-defteri-${ymd(new Date())}.csv`, "﻿" + rows.map(r => r.map(cell).join(";")).join("\r\n"), "text/csv;charset=utf-8");
  toast(t("backup.csv_done"), "file-spreadsheet");
};
$("#backupNow").onclick = exportBackup;
$("#backupLater").onclick = () => { state.backupSnooze = Date.now() + 3*864e5; save(); renderBackupBanner(); };
$("#importBtn").onclick = () => $("#importFile").click();
$("#importFile").onchange = async ev => {
  const f = ev.target.files[0]; if (!f) return;
  try {
    const s = JSON.parse(await f.text());
    if (!Array.isArray(s.entries)) throw 0;
    const mode = await choose(t("backup.import_q", { n: s.entries.length }),
      [{ label: t("backup.cancel"), value: null }, { label: t("backup.replace"), value: "replace" }, { label: t("backup.merge"), value: "merge", primary: true }]);
    if (!mode) return;
    let msg = t("backup.restored");
    if (mode === "merge") {
      stampChanges();
      const r = mergeStates(state, s);
      setState(r.state);
      msg = t("backup.merged");
    } else {
      setState({ ...withDefaults(s), deviceId: state.deviceId, active: null, live: null, draft: null });
    }
    state.lastBackup = Date.now();
    for (const k in _mCache) delete _mCache[k];
    takeSnapshot(); save();
    refreshDatalist(); resetEditor(); refreshAll(); renderBackup(); toast(msg, "check");
  } catch(e){ toast(t("backup.invalid")); }
  finally { ev.target.value = ""; }
};
}
