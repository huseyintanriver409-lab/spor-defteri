import { preload as preloadGoogle } from "../sync/google.ts";
import { ymd } from "../core/dates.ts";
import { mergeStates, withDefaults } from "../core/schema.ts";
import { $, choose, ic, save, setState, stampChanges, state, takeSnapshot, toast } from "./store.js";
import { SET_TYPES, _mCache, groupOf, isCardio } from "./exercises.js";
import { refreshAll } from "./ui.js";
import { refreshDatalist, resetEditor } from "./log.js";
import { renderCalStatus, sync, syncCanRun } from "./cloud.js";

/* ---------- Backup ---------- */
export function renderBackup(){
  const last = state.lastBackup ? `Son yedek: ${Math.floor((Date.now()-state.lastBackup)/864e5) || "bugün"}${Math.floor((Date.now()-state.lastBackup)/864e5) ? " gün önce" : ""}` : "Henüz yedek alınmadı";
  $("#dataInfo").textContent = `${state.entries.length} kayıt · ${new Set(state.entries.map(e=>e.date)).size} antrenman günü · ${state.programs.length} program · ${state.body.length} ölçü · ${state.custom.length} özel hareket · ${last}`;
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
  if (show) $("#backupMsg").innerHTML = state.lastBackup ? `${ic("save")} Son yedeğin <b>${days} gün</b> önce alındı. Verilerin sadece bu tarayıcıda; yedek almanı öneririm.` : `${ic("save")} Henüz hiç yedek almadın. Verilerin sadece bu tarayıcıda duruyor.`;
}

// Düğme bağlamaları ve ilk hazırlıklar: main.js'teki açılış sırasında çağrılır
export function setup(){
$("#exportBtn").onclick = exportBackup;
// Türkçe Excel ";" ayırıcı ve ondalık virgül bekler; BOM, Türkçe karakterlerin doğru görünmesi için
$("#csvBtn").onclick = () => {
  const num = n => n === "" || n == null ? "" : String(n).replace(".", ",");
  const cell = v => { v = String(v ?? ""); return /[";\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const rows = [["Tarih","Hareket","Kas grubu","Set","Set türü","Kg / dk","Tekrar / km","RIR","Hacim (kg)","Not"]];
  state.entries.slice().sort((a,b) => a.date.localeCompare(b.date) || a.ts-b.ts).forEach(e => {
    const c = isCardio(e.ex); let k = 0;
    e.sets.forEach((s,i) => {
      const n = s.t === "w" ? "I" : ++k;
      rows.push([e.date, e.ex, groupOf(e.ex), n, s.t ? SET_TYPES[s.t] : (c ? "Kardiyo" : s.sec != null ? "Süreli (sn)" : "Normal"), num(+s.w||0), num(s.sec ?? (+s.r||0)), num(s.rir), c || s.t === "w" ? "" : num((+s.w||0)*(+s.r||0)), i === 0 ? (e.note||"") : ""]);
    });
  });
  download(`spor-defteri-${ymd(new Date())}.csv`, "\ufeff" + rows.map(r => r.map(cell).join(";")).join("\r\n"), "text/csv;charset=utf-8");
  toast(`${rows.length-1} set dışa aktarıldı`, "file-spreadsheet");
};
$("#backupNow").onclick = exportBackup;
$("#backupLater").onclick = () => { state.backupSnooze = Date.now() + 3*864e5; save(); renderBackupBanner(); };
$("#importBtn").onclick = () => $("#importFile").click();
$("#importFile").onchange = async ev => {
  const f = ev.target.files[0]; if (!f) return;
  try {
    const s = JSON.parse(await f.text());
    if (!Array.isArray(s.entries)) throw 0;
    const mode = await choose(`Yedekte ${s.entries.length} antrenman kaydı var.\n\nBirleştir: iki taraftaki kayıtlar birleşir (telefon + bilgisayar için). Aynı kayıt iki yerde değiştiyse en son değiştirilen kazanır.\nDeğiştir: buradaki tüm veriler silinir, yedektekiler yüklenir.`,
      [{ label: "Vazgeç", value: null }, { label: "Değiştir", value: "replace" }, { label: "Birleştir", value: "merge", primary: true }]);
    if (!mode) return;
    let msg = "Geri yüklendi";
    if (mode === "merge") {
      stampChanges();
      const r = mergeStates(state, s);
      setState(r.state);
      msg = `Birleştirildi: ${r.stats.added} yeni, ${r.stats.updated} güncellenen, ${r.stats.removed} silinen kayıt`;
    } else {
      setState({ ...withDefaults(s), deviceId: state.deviceId, active: null, live: null, draft: null });
    }
    state.lastBackup = Date.now();
    for (const k in _mCache) delete _mCache[k];
    takeSnapshot(); save();
    refreshDatalist(); resetEditor(); refreshAll(); renderBackup(); toast(msg, "check");
  } catch(e){ toast("Geçersiz yedek dosyası"); }
  finally { ev.target.value = ""; }
};
}
