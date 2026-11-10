import { GOOGLE_CLIENT_ID } from "../config.ts";
import { CAL_SCOPE, DRIVE_SCOPE, PopupError, TASKS_SCOPE, cachedToken, dropScope, gisReady, preload as preloadGoogle, requestToken, revoke, tokenExpiry, tokenScopes } from "../sync/google.ts";
import { syncOnce } from "../core/sync.ts";
import { AuthError, driveAccount, driveStore } from "../sync/drive.ts";
import { TasksAuthError } from "../sync/tasks.ts";
import { mergeStates } from "../core/schema.ts";
import { currentSig, planSignature, runCalendar, taskPlan } from "../core/calendar.ts";
import { calendarClient } from "../sync/calendar.ts";
import { tasksClient } from "../sync/tasks.ts";
import { $, choose, esc, ic, save, setState, stampChanges, state, takeSnapshot, toast } from "./store.js";
import { _mCache, visiblePrograms } from "./exercises.js";
import { helpTip, openSheet, refreshAll, sheetHead } from "./ui.js";
import { refreshDatalist } from "./log.js";
import { describeSession, openUrl, progDetails, renderPlan } from "./programs.js";
import { renderBackupBanner } from "./backup.js";
import { locale, t } from "../core/i18n.ts";

/* ---------- Google Drive senkronizasyonu ----------
   Birleştirme akışı core/sync.ts, Drive dosyası sync/drive.ts, giriş sync/google.ts içinde.
   Eşitleme durumu cihaza özeldir; state'e değil ayrı bir anahtara yazılır, böylece kendisi eşitlenmez.
   Ne zaman eşitlenir: açılışta, antrenman bitince, uygulamaya dönülünce ya da arka plana geçerken, "Şimdi eşitle"de. */
export const SYNC_KEY = "sporDefteri.sync";
export const syncCanRun = () => !!GOOGLE_CLIENT_ID && /^https?:$/.test(location.protocol);
export let sync = { on: false, last: 0 };
export let syncBusy = false, syncNeedsAuth = false, syncErr = "";
export const saveSync = () => { try { localStorage.setItem(SYNC_KEY, JSON.stringify(sync)); } catch(e){} };
export const agoText = ts => { const m = Math.round((Date.now()-ts)/60000); return m < 1 ? t("cloud.ago_now") : m < 60 ? t("cloud.ago_min", { n: m }) : m < 1440 ? t("cloud.ago_hour", { n: Math.floor(m/60) }) : t("cloud.ago_day", { n: Math.floor(m/1440) }); };
// Drive ve Takvim işleri sırayla çalışır: Drive birleştirmesi state'i değiştirirken takvim aynı anda yazmasın
export let cloudQueue = Promise.resolve();
export const enqueue = job => (cloudQueue = cloudQueue.then(job, job));

// interactive: bir dokunuşla çağrıldı; giriş gerekiyorsa pencere açılabilir.
// Giriş penceresi engellenmesin diye requestToken sıraya girmeden, ilk await'ten önce çağrılır.
// extra: aynı pencerede istenecek ek kapsamlar (tek pencere, tek dokunuş)
const hintEmail = () => (sync.account && sync.account.email) || null;
export function runSync(interactive, extra = []){
  if (!sync.on || syncBusy || !syncCanRun()) return Promise.resolve();
  let token = cachedToken(DRIVE_SCOPE), tokenP = null;
  // oturum "doldu" işaretliyse (ön yenileme tutmadı) dokunuşta anahtar yenilenir
  if (!token || (interactive && syncNeedsAuth && gisReady())) {
    if (!interactive || !gisReady()) { syncNeedsAuth = true; renderSyncStatus(); armTap(); return Promise.resolve(); }
    tokenP = requestToken(GOOGLE_CLIENT_ID, false, [DRIVE_SCOPE, ...extra], hintEmail());
  }
  syncBusy = true; syncErr = ""; renderSyncStatus();
  return enqueue(async () => {
    try {
      if (tokenP) token = await tokenP;
      syncNeedsAuth = false; tapBlocked = false; scheduleRefresh();
      stampChanges();
      const firstSync = !sync.last;
      const r = await syncOnce(state, driveStore(token), Date.now(), { firstSync });
      if (r.localChanged) {
        // istek sürerken yapılan değişiklikler kaybolmasın: sonucu şimdiki veriyle bir kez daha birleştir
        stampChanges();
        // ilk eşitlemede buluttaki ayarlar kazandı; ikinci birleştirmede yereldekiler geri gelmesin
        if (firstSync) state.settingsU = 0;
        setState(mergeStates(state, r.state).state);
        for (const k in _mCache) delete _mCache[k];
        takeSnapshot(); save();
        refreshDatalist(); refreshAll();
        const n = r.stats.added + r.stats.updated + r.stats.removed;
        toast(n ? t("cloud.changes_received", { n }) : t("cloud.synced"), "check");
      }
      sync.last = Date.now();
      // hangi Google hesabı: Profil'de gösterilir (günde bir yenilenir; alınamazsa eşitleme yine başarılı)
      if (!sync.account || Date.now() - (sync.account.at || 0) > 864e5) {
        try { sync.account = { ...(await driveAccount(token)), at: Date.now() }; } catch(e){}
      }
      saveSync(); renderAccount();
    } catch(e){
      if (e instanceof PopupError) { syncNeedsAuth = true; tapBlocked = true; disarmTap(); }  // sessiz: hata gösterilmez, izin düşürülmez
      else if (e instanceof AuthError) { dropScope(DRIVE_SCOPE); syncNeedsAuth = true; }
      else syncErr = (e && e.message) || t("cloud.sync_failed");
    } finally {
      syncBusy = false; renderSyncStatus(); renderBackupBanner();
    }
  });
}

// Dokunuşla çağrılmalı (giriş penceresi). Google betiği yüklü değilse önce yükler ve tekrar dokunmayı ister.
export function connectDrive(){
  if (!syncCanRun()) return;
  if (!gisReady()) { preloadGoogle().then(() => toast(t("cloud.google_ready"), "check"), e => toast(e.message)); return; }
  const tokenP = requestToken(GOOGLE_CLIENT_ID, true, [DRIVE_SCOPE], hintEmail());
  syncBusy = true; syncErr = ""; renderSyncStatus();
  tokenP.then(() => { sync.on = true; saveSync(); syncBusy = false; return runSync(false); })
    .catch(e => { syncBusy = false; syncErr = e instanceof PopupError ? "" : e.message; renderSyncStatus(); });
}

// Üst çubuktaki bulut simgesi: durum biçimle anlatılır (renk tek başına taşımaz)
export function syncState(){
  if (!sync.on) return "off";
  if (syncBusy) return "busy";
  if (syncNeedsAuth) return "wait";
  if (syncErr) return "err";
  return sync.last ? "ok" : "wait";
}
const SYNC_ICON = { off: "cloud-off", busy: "refresh-cw", wait: "cloud-dot", err: "cloud-alert", ok: "cloud-check" };
function syncLabel(st){
  return st === "off" ? t("cloud.st_off") : st === "busy" ? t("cloud.st_busy") : st === "wait" ? (sync.last ? t("cloud.st_wait_pending") : t("cloud.st_wait_never")) : st === "err" ? t("cloud.sync_failed") : t("cloud.st_ok", { ago: agoText(sync.last) });
}

export function renderSyncStatus(){
  renderAccount();
  const st = syncState(), btn = $("#syncBtn");
  btn.dataset.s = st;
  btn.setAttribute("aria-label", syncLabel(st) + (st === "err" && syncErr ? `: ${syncErr}` : ""));
  btn.querySelector("use").setAttribute("href", "#i-" + SYNC_ICON[st]);
  $("#syncWord").textContent = st === "err" ? t("cloud.sync_failed") : "";
  const can = syncCanRun();
  $("#syncCard").classList.toggle("hidden", !GOOGLE_CLIENT_ID);
  let status = "";
  if (!can) status = GOOGLE_CLIENT_ID ? t("cloud.open_web_google") : "";
  else if (!sync.on) status = syncBusy ? t("cloud.connecting") : syncErr ? t("cloud.connect_failed", { err: syncErr }) : t("cloud.not_connected");
  else status = syncBusy ? t("cloud.syncing") : syncNeedsAuth ? t("cloud.session_expired_tap") : syncErr ? t("cloud.sync_failed_err", { err: syncErr }) : sync.last ? t("cloud.last_sync", { ago: agoText(sync.last) }) : t("cloud.never_synced");
  $("#syncStatus").textContent = status;
  $("#syncStatus").classList.toggle("muted", !syncErr);
  $("#syncConnect").classList.toggle("hidden", !can || sync.on);
  $("#syncNow").classList.toggle("hidden", !can || !sync.on);
  $("#syncOff").classList.toggle("hidden", !sync.on);
  $("#syncConnect").disabled = $("#syncNow").disabled = syncBusy;
  if (!$("#bs").classList.contains("hidden") && $("#bsBody").querySelector("[data-syncsheet]")) fillSyncSheet();
}

// Simgeye dokununca açılan küçük sayfa: son eşitleme, hata ayrıntısı, tek eylem
function fillSyncSheet(){
  const st = syncState(), can = syncCanRun();
  const line = st === "off" ? t("cloud.sheet_off") : st === "busy" ? t("cloud.syncing") : st === "wait" ? (sync.last ? t("cloud.sheet_expired") : t("cloud.st_wait_never")) : st === "err" ? t("cloud.sync_failed") : t("cloud.synced");
  const act = !can ? "" : sync.on ? `<button class="btn primary" id="shSyncNow" ${syncBusy ? "disabled" : ""}>${ic("refresh-cw")}${t("cloud.sync_now")}</button>` : `<button class="btn primary" id="shSyncConnect" ${syncBusy ? "disabled" : ""}>${ic("cloud")}${t("cloud.connect_google")}</button>`;
  const help = st === "off" ? helpTip(t("cloud.help_connect")) : "";
  $("#bsBody").innerHTML = `<div data-syncsheet><p style="margin:0 0 6px"><b>${line}</b>${help}</p>
    ${sync.on && sync.last ? `<p class="muted small" style="margin:0 0 6px">${t("cloud.last_sync", { ago: agoText(sync.last) })}</p>` : ""}
    ${syncErr && sync.on ? `<p class="small" style="margin:0 0 6px;color:var(--danger)">${esc(syncErr)}</p>` : ""}
    ${!can ? `<p class="muted small" style="margin:0 0 6px">${t("cloud.open_web_google")}</p>` : ""}
    <div class="row" style="margin-top:12px">${act}</div></div>`;
  const n = $("#shSyncNow"); if (n) n.onclick = () => { runSync(true); };
  const c = $("#shSyncConnect"); if (c) c.onclick = () => { connectDrive(); };
}
export function openSyncSheet(){
  openSheet(sheetHead(t("cloud.sheet_title")), "");
  fillSyncSheet();
}

// Profil'in üstü: bu cihazın bağlı olduğu Google hesabı. Telefonda ve bilgisayarda aynı hesap mı, buradan anlaşılır.
export function renderAccount(){
  const a = sync.on && sync.account, el = $("#acctCard");
  if (!el) return;
  let html;
  const syncBtn = () => syncCanRun() ? `<button class="btn" id="acctSync" style="margin-top:12px" ${syncBusy ? "disabled" : ""}>${ic("refresh-cw")}${t("cloud.sync_now")}</button>` : "";
  if (a && a.email) {
    const initial = esc((a.name || a.email).trim().charAt(0).toLocaleUpperCase(locale()));
    html = `<div class="row" style="gap:14px;align-items:center">
      <span class="avatar">${a.photo ? `<img src="${esc(a.photo)}" alt="" referrerpolicy="no-referrer">` : ""}${initial}</span>
      <div class="grow" style="min-width:0"><b style="font-size:18px">${esc(a.name || a.email)}</b><div class="muted small acct-mail">${esc(a.email)}</div></div>${helpTip(t("cloud.acct_help"))}</div>
      ${syncBtn()}`;
  } else if (sync.on) {
    html = `<div class="row" style="gap:14px;align-items:center"><span class="avatar">${ic("user")}</span>
      <div class="grow"><b>${t("cloud.acct_linked")}</b></div></div>${syncBtn()}`;
  } else {
    html = `<div class="row" style="gap:14px;align-items:center"><span class="avatar">${ic("user")}</span>
      <div class="grow"><b>${t("cloud.acct_none")}</b></div>${helpTip(t("cloud.acct_none_help"))}</div>
      ${syncCanRun() ? `<button class="btn" id="acctConnect" style="margin-top:12px">${ic("cloud")}${t("cloud.connect_google")}</button>` : ""}`;
  }
  el.innerHTML = html;
  // fotoğraf yüklenemezse baş harf görünür
  const img = el.querySelector(".avatar img"); if (img) img.onerror = () => img.remove();
  const b = $("#acctConnect"); if (b) b.onclick = connectDrive;
  const n = $("#acctSync"); if (n) n.onclick = () => runSync(true);
}

/* ---------- Google Takvim ----------
   Ne yazılacağına core/calendar.ts karar verir; istemci sync/calendar.ts. Ayarlar (state.gcal) Drive ile eşitlenir.
   Bu cihazda takvim izni yoksa sorun değil: yazılmamış antrenmanlar Drive ile diğer cihaza gider ve oradan yazılır. */
export const calOn = () => state.gcal.log || state.gcal.plan;
// Görev modunda (ya da görevlerde silinecek eski plan varsa) Görevler izni de gerekir
const needTasks = () => taskPlan(state.gcal) || !!state.gcal.taskSig;
const calScopes = () => needTasks() ? [CAL_SCOPE, TASKS_SCOPE] : [CAL_SCOPE];
// gereken bütün izinleri taşıyan anahtar (tek anahtar bütün izinleri taşır)
const calToken = () => { const t = cachedToken(CAL_SCOPE); return t && calScopes().every(x => cachedToken(x) === t) ? t : null; };
export let calBusy = false, calErr = "", calTimer = null;
export const timeZone = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch(e){ return "UTC"; } };

export function runCal(interactive){
  const g = state.gcal;
  if (!syncCanRun() || calBusy || (!g.log && !g.plan && !g.planSig && !g.taskSig)) return Promise.resolve();
  let token = calToken(), tokenP = null;
  if (!token) {
    if (!interactive || !gisReady()) { renderCalStatus(); return Promise.resolve(); }
    tokenP = requestToken(GOOGLE_CLIENT_ID, false, calScopes(), hintEmail());
  }
  calBusy = true; calErr = ""; renderCalStatus();
  return enqueue(async () => {
    let r = null;
    try {
      if (tokenP) token = await tokenP;
      // sıra beklerken Drive birleştirmesi state'i değiştirmiş olabilir: güncel state kullanılır
      r = await runCalendar({ ...state, programs: visiblePrograms() }, calendarClient(token), { describeProgram: progDetails, describeSession, timeZone: timeZone() }, needTasks() ? tasksClient(token) : undefined);
      sync.calLast = Date.now(); saveSync();
      if (interactive) toast(r.written || r.planUpdated || r.ticked ? t("cloud.cal_updated") : t("cloud.cal_current"), "calendar-days");
    } catch(e){
      if (e instanceof PopupError) { tapBlocked = true; disarmTap(); /* sessiz */ }
      else if (e instanceof AuthError) dropScope(e instanceof TasksAuthError ? TASKS_SCOPE : CAL_SCOPE);
      else if (interactive) calErr = (e && e.message) || t("cloud.cal_write_failed");
    } finally {
      // yarıda kalsa da yazılanların işaretleri kaydedilir
      save(); calBusy = false; renderCalStatus(); renderPlan();
    }
    // takvim kimliği ve "yazıldı" işaretleri diğer cihazlara gitsin
    if (r && (r.written || r.created || r.planUpdated || r.ticked) && sync.on) runSync(false);
  });
}

// Plan değişikliklerini topla: son değişiklikten 4 sn sonra, yalnız takvimdeki plan gerçekten eskidiyse
export function calSoon(){
  clearTimeout(calTimer);
  calTimer = setTimeout(() => {
    const g = state.gcal, target = g.plan ? planSignature(state.plan, visiblePrograms()) : "";
    if (target !== currentSig(g)) runCal(false);
  }, 4000);
}

// Onay kutusu ve plan türü dokunuşu: gereken izin yoksa giriş penceresi bu dokunuşta açılır
export function toggleCal(key, value){
  const prev = state.gcal[key];
  state.gcal[key] = value;
  if (value && !calToken()) {
    if (!gisReady()) {
      state.gcal[key] = prev; renderCalStatus();
      preloadGoogle().then(() => toast(t("cloud.google_ready"), "check"), e => toast(e.message));
      return;
    }
    const tokenP = requestToken(GOOGLE_CLIENT_ID, false, calScopes(), hintEmail());
    save(); calBusy = true; calErr = ""; renderCalStatus();
    tokenP.then(() => { calBusy = false; return runCal(false); })
      .catch(e => { calBusy = false; state.gcal[key] = prev; save(); calErr = e.message; renderCalStatus(); });
    return;
  }
  save(); renderCalStatus();
  // kapatırken takvimdeki planı silmek için izin gerekebilir; dokunuş içinde olduğumuz için pencere açılabilir
  runCal(true);
}

export function renderCalStatus(){
  const g = state.gcal, can = syncCanRun(), on = g.log || g.plan, hasToken = !!calToken();
  $("#calCard").classList.toggle("hidden", !GOOGLE_CLIENT_ID);
  $("#calLog").checked = g.log; $("#calPlan").checked = g.plan;
  $("#calLog").disabled = $("#calPlan").disabled = !can || calBusy;
  $("#calModeRow").classList.toggle("hidden", !g.plan);
  document.querySelectorAll('[name="calMode"]').forEach(r => { r.checked = r.value === (g.mode === "task" ? "task" : "event"); r.disabled = !can || calBusy; });
  $("#calModeNote").textContent = g.mode === "task" ? t("cloud.cal_task_note") : t("cloud.cal_event_note");
  let status = "";
  if (!can) status = t("cloud.cal_open_web");
  else if (calBusy) status = t("cloud.cal_updating");
  else if (calErr) status = t("cloud.cal_write_err", { err: calErr });
  else if (!on) status = t("cloud.cal_off");
  else if (!hasToken) status = t("cloud.cal_no_perm");
  else status = sync.calLast ? t("cloud.cal_status_last", { ago: agoText(sync.calLast) }) : t("cloud.cal_status_writing");
  $("#calStatus").textContent = status;
  $("#calStatus").classList.toggle("muted", !calErr);
  $("#calAuth").classList.toggle("hidden", !can || !on || hasToken || calBusy);
  $("#calOpen").classList.toggle("hidden", !g.id);
}

/* ---------- Sessiz oturum yenileme ve tek dokunuş ----------
   Anahtar ~1 saat yaşar. Bitmesine ~5 dk kala görünürken bir kez sessizce yenilenmeye çalışılır (her anahtar için en çok 1 deneme).
   Pencere engellenirse bulut simgesi "bekliyor" olur ve bir sonraki dokunuş (pencere açabilen tek yol) yeniler.
   tapBlocked: kullanıcı pencereyi kapattıysa ya da engellendiyse, görünürlük değişene/yeni anahtar gelene dek dokunuşla yeniden açılmaz. */
let refreshTimer = null, refreshTriedFor = 0, tapArmed = false, tapBlocked = false;
const TAP_SKIP = "#syncBtn,#syncConnect,#syncNow,#shSyncNow,#shSyncConnect,#acctSync,#acctConnect,#calAuth";

function scheduleRefresh(){
  clearTimeout(refreshTimer);
  if (!sync.on || !syncCanRun() || document.visibilityState !== "visible") return;
  const exp = tokenExpiry(DRIVE_SCOPE);
  if (!exp || exp <= Date.now() || refreshTriedFor === exp) return;
  refreshTimer = setTimeout(() => preRefresh(exp), Math.max(0, exp - 5*60e3 - Date.now()));
}
function preRefresh(exp){
  if (!sync.on || syncBusy || document.visibilityState !== "visible" || !gisReady() || tokenExpiry(DRIVE_SCOPE) !== exp) return;
  refreshTriedFor = exp;
  requestToken(GOOGLE_CLIENT_ID, false, [...new Set([...tokenScopes(), DRIVE_SCOPE])], hintEmail())
    .then(() => { tapBlocked = false; scheduleRefresh(); })
    .catch(() => { syncNeedsAuth = true; renderSyncStatus(); armTap(); });
}

function onTap(e){
  if (tapBlocked) return;
  if (state.live) return;  // süren antrenman varken (state.live) pencere açma; dinleyici kalır
  const t = e.target;
  if (t && t.closest && (t.closest(TAP_SKIP) || t.closest("input,textarea,select"))) return;
  if (sync.on && syncNeedsAuth && !syncBusy && gisReady()) { disarmTap(); oneTap(); }
}
function disarmTap(){ tapArmed = false; document.removeEventListener("click", onTap, true); }
function armTap(){
  if (tapArmed || tapBlocked || !sync.on || !syncNeedsAuth || !syncCanRun() || document.visibilityState !== "visible") return;
  tapArmed = true; document.addEventListener("click", onTap, true);
}

// Gerekirse Drive ve Takvim kapsamları tek pencerede istenir; eşzamanlı (dokunuş içinde) çağrılmalı
function oneTap(){
  const driveNeeds = !cachedToken(DRIVE_SCOPE) || syncNeedsAuth;
  const calNeeds = calOn() && !calToken();
  if (driveNeeds) { const p = runSync(true, calNeeds ? calScopes() : []); if (calNeeds) p.then(() => runCal(false)); }
  else { runSync(true); if (calNeeds) runCal(true); }
}
// Bulut simgesi: bağlı ve oturum/eşitleme sorunluysa panel açmadan doğrudan yenile
function syncTap(){
  const bad = syncNeedsAuth || !cachedToken(DRIVE_SCOPE) || !!syncErr;
  if (sync.on && syncCanRun() && !syncBusy && gisReady() && bad) { disarmTap(); oneTap(); }
  else openSyncSheet();
}

// Düğme bağlamaları ve ilk hazırlıklar: main.js'teki açılış sırasında çağrılır
export function setup(){
try { sync = { ...sync, ...JSON.parse(localStorage.getItem(SYNC_KEY) || "{}") }; } catch(e){}
$("#syncConnect").onclick = connectDrive;
$("#syncNow").onclick = () => runSync(true);
$("#syncBtn").onclick = syncTap;
scheduleRefresh();
$("#syncOff").onclick = async () => {
  const ok = await choose(t("cloud.disconnect_q"),
    [{ label: t("cloud.cancel"), value: false }, { label: t("cloud.disconnect_btn"), value: true, primary: true }]);
  if (!ok) return;
  // Google'daki izni geri almak Takvim iznini de kaldırır; takvim açıksa yalnız Drive izni bırakılır
  if (calOn()) dropScope(DRIVE_SCOPE); else revoke();
  sync = { on: false, last: 0 }; syncNeedsAuth = false; syncErr = ""; saveSync();
  renderSyncStatus(); renderAccount(); renderBackupBanner(); toast(t("cloud.disconnected"), "check");
};
document.addEventListener("visibilitychange", () => {
  // geri dönünce (2 dk'dan uzun aradan sonra) güncelle; arka plana geçerken son değişiklikleri gönder
  if (document.visibilityState === "visible") {
    tapBlocked = false; scheduleRefresh(); armTap();
    if (sync.on) { if (Date.now() - sync.last > 2*60e3) runSync(false); else renderSyncStatus(); }
    runCal(false);
  }
  else { clearTimeout(refreshTimer); disarmTap(); if (sync.on) runSync(false); }
});
setInterval(() => {
  if (!sync.on || syncBusy) return;
  // anahtar süresi dolduysa simge "bekliyor" olur ve ilk dokunuş yeniler
  if (sync.last && !syncNeedsAuth && document.visibilityState === "visible" && !cachedToken(DRIVE_SCOPE)) { syncNeedsAuth = true; armTap(); }
  renderSyncStatus();
}, 60e3);
$("#calLog").onchange = e => toggleCal("log", e.target.checked);
$("#calPlan").onchange = e => toggleCal("plan", e.target.checked);
document.querySelectorAll('[name="calMode"]').forEach(r => r.onchange = () => {
  if (!r.checked) return;
  // görevde tik yeterli: biten antrenman ayrıca etkinlik olarak yazılmaz (istenirse yeniden açılabilir)
  if (r.value === "task" && state.gcal.log) { state.gcal.log = false; toast(t("cloud.tasks_as_tasks"), "check"); }
  toggleCal("mode", r.value);
});
$("#calAuth").onclick = () => runCal(true);
$("#calOpen").onclick = () => openUrl("https://calendar.google.com/calendar/r");
}
