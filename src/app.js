import { ymd } from "./core/dates.ts";
import { preload as preloadGoogle } from "./sync/google.ts";
import { $, load, save, setState, state } from "./app/store.js";
import { isTimed } from "./app/exercises.js";
import { keepAwake, showTab } from "./app/ui.js";
import { refreshDatalist, resetEditor, restoreDraft } from "./app/log.js";
import { resetProgEditor } from "./app/programs.js";
import { renderLiveBar } from "./app/live.js";
import { setTDur, tDur } from "./app/tools.js";
import { calOn, renderCalStatus, renderSyncStatus, runCal, runSync, sync, syncCanRun } from "./app/cloud.js";
import { maybeOnboard } from "./app/settings.js";
import { setup as setup_ui } from "./app/ui.js";
import { setup as setup_log } from "./app/log.js";
import { setup as setup_programs } from "./app/programs.js";
import { setup as setup_live } from "./app/live.js";
import { setup as setup_history } from "./app/history.js";
import { setup as setup_stats } from "./app/stats.js";
import { setup as setup_library } from "./app/library.js";
import { setup as setup_tools } from "./app/tools.js";
import { setup as setup_backup } from "./app/backup.js";
import { setup as setup_cloud } from "./app/cloud.js";
import { setup as setup_settings } from "./app/settings.js";
import { setup as setup_presets } from "./app/presets.js";
import { setup as setup_importer, handleImportLink } from "./app/importer.js";
import { setup as setup_baseline } from "./app/baseline.js";

// Modüllerin düğme bağlamaları ve ilk hazırlıkları, eskiden tek dosyadaki sırayla
setup_ui(); setup_log(); setup_programs(); setup_live(); setup_history(); setup_stats(); setup_library(); setup_tools(); setup_backup(); setup_cloud(); setup_settings(); setup_presets(); setup_importer(); setup_baseline();

/* ---------- Init ---------- */
load(); setTDur(state.rest || 90); refreshDatalist();
$("#logDate").value = ymd(new Date());
if (!restoreDraft()) resetEditor();
resetProgEditor();
if (state.live) { state.live.items ||= []; state.live.idx ||= 0; keepAwake(true); }
// v3.1: süreli hareketlerde eskiden "tekrar" alanına yazılan saniyeleri sec alanına taşı
{ let moved = 0; state.entries.forEach(e => { if (isTimed(e.ex)) e.sets.forEach(x => { if (x.sec == null && +x.r > 0) { x.sec = +x.r; x.r = 0; delete x.rir; moved++; } }); }); if (moved) save(); }
showTab("home"); renderLiveBar();
renderSyncStatus(); renderCalStatus();
// Google betiği önceden yüklenir ki "bağlan" dokunuşu giriş penceresini doğrudan açabilsin
if (syncCanRun() && (sync.on || calOn() || !state.onboarded)) preloadGoogle().catch(() => {});
maybeOnboard();
// #ekle=… bağlantısıyla açıldıysa programı önizle (ilk açılış ekranının yerine geçer)
handleImportLink();
// önce Drive (başka cihazdan gelen antrenmanlar ve takvim ayarı), sonra takvim
runSync(false); runCal(false);
