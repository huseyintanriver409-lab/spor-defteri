import { GOOGLE_CLIENT_ID } from "../config.ts";
import { CAL_SCOPE, DRIVE_SCOPE, TASKS_SCOPE, cachedToken, dropScope, gisReady, preload as preloadGoogle, requestToken, revoke } from "../sync/google.ts";
import { syncOnce } from "../core/sync.ts";
import { AuthError, driveAccount, driveStore } from "../sync/drive.ts";
import { mergeStates } from "../core/schema.ts";
import { currentSig, planSignature, runCalendar, taskPlan } from "../core/calendar.ts";
import { calendarClient } from "../sync/calendar.ts";
import { tasksClient } from "../sync/tasks.ts";
import { $, choose, esc, ic, save, setState, stampChanges, state, takeSnapshot, toast } from "./store.js";
import { _mCache } from "./exercises.js";
import { helpTip, openSheet, refreshAll, sheetHead } from "./ui.js";
import { refreshDatalist } from "./log.js";
import { describeSession, openUrl, progDetails, renderPlan } from "./programs.js";
import { renderBackupBanner } from "./backup.js";

/* ---------- Google Drive senkronizasyonu ----------
   Birleştirme akışı core/sync.ts, Drive dosyası sync/drive.ts, giriş sync/google.ts içinde.
   Eşitleme durumu cihaza özeldir; state'e değil ayrı bir anahtara yazılır, böylece kendisi eşitlenmez.
   Ne zaman eşitlenir: açılışta, antrenman bitince, uygulamaya dönülünce ya da arka plana geçerken, "Şimdi eşitle"de. */
export const SYNC_KEY = "sporDefteri.sync";
export const syncCanRun = () => !!GOOGLE_CLIENT_ID && /^https?:$/.test(location.protocol);
export let sync = { on: false, last: 0 };
export let syncBusy = false, syncNeedsAuth = false, syncErr = "";
export const saveSync = () => { try { localStorage.setItem(SYNC_KEY, JSON.stringify(sync)); } catch(e){} };
export const agoText = t => { const m = Math.round((Date.now()-t)/60000); return m < 1 ? "az önce" : m < 60 ? `${m} dk önce` : m < 1440 ? `${Math.floor(m/60)} sa önce` : `${Math.floor(m/1440)} gün önce`; };
// Drive ve Takvim işleri sırayla çalışır: Drive birleştirmesi state'i değiştirirken takvim aynı anda yazmasın
export let cloudQueue = Promise.resolve();
export const enqueue = job => (cloudQueue = cloudQueue.then(job, job));

// interactive: bir dokunuşla çağrıldı; giriş gerekiyorsa pencere açılabilir.
// Giriş penceresi engellenmesin diye requestToken sıraya girmeden, ilk await'ten önce çağrılır.
export function runSync(interactive){
  if (!sync.on || syncBusy || !syncCanRun()) return Promise.resolve();
  let token = cachedToken(DRIVE_SCOPE), tokenP = null;
  if (!token) {
    if (!interactive || !gisReady()) { syncNeedsAuth = true; renderSyncStatus(); return Promise.resolve(); }
    tokenP = requestToken(GOOGLE_CLIENT_ID, false, [DRIVE_SCOPE]);
  }
  syncBusy = true; syncErr = ""; renderSyncStatus();
  return enqueue(async () => {
    try {
      if (tokenP) token = await tokenP;
      syncNeedsAuth = false;
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
        toast(n ? `${n} değişiklik alındı` : "Eşitlendi", "check");
      }
      sync.last = Date.now();
      // hangi Google hesabı: Profil'de gösterilir (günde bir yenilenir; alınamazsa eşitleme yine başarılı)
      if (!sync.account || Date.now() - (sync.account.at || 0) > 864e5) {
        try { sync.account = { ...(await driveAccount(token)), at: Date.now() }; } catch(e){}
      }
      saveSync(); renderAccount();
    } catch(e){
      if (e instanceof AuthError) { dropScope(DRIVE_SCOPE); syncNeedsAuth = true; }
      else syncErr = (e && e.message) || "Eşitlenemedi";
    } finally {
      syncBusy = false; renderSyncStatus(); renderBackupBanner();
    }
  });
}

// Dokunuşla çağrılmalı (giriş penceresi). Google betiği yüklü değilse önce yükler ve tekrar dokunmayı ister.
export function connectDrive(){
  if (!syncCanRun()) return;
  if (!gisReady()) { preloadGoogle().then(() => toast("Google hazır, tekrar dene", "check"), e => toast(e.message)); return; }
  const tokenP = requestToken(GOOGLE_CLIENT_ID, true, [DRIVE_SCOPE]);
  syncBusy = true; syncErr = ""; renderSyncStatus();
  tokenP.then(() => { sync.on = true; saveSync(); syncBusy = false; return runSync(false); })
    .catch(e => { syncBusy = false; syncErr = e.message; renderSyncStatus(); });
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
  return st === "off" ? "Yalnız bu cihazda" : st === "busy" ? "Eşitleniyor" : st === "wait" ? (sync.last ? "Eşitleme bekliyor" : "Henüz eşitlenmedi") : st === "err" ? "Eşitlenemedi" : `Eşitlendi, ${agoText(sync.last)}`;
}

export function renderSyncStatus(){
  renderAccount();
  const st = syncState(), btn = $("#syncBtn");
  btn.dataset.s = st;
  btn.setAttribute("aria-label", syncLabel(st) + (st === "err" && syncErr ? `: ${syncErr}` : ""));
  btn.querySelector("use").setAttribute("href", "#i-" + SYNC_ICON[st]);
  $("#syncWord").textContent = st === "err" ? "Eşitlenemedi" : "";
  const can = syncCanRun();
  $("#syncCard").classList.toggle("hidden", !GOOGLE_CLIENT_ID);
  let status = "";
  if (!can) status = GOOGLE_CLIENT_ID ? "Google girişi için uygulamayı web adresinden aç." : "";
  else if (!sync.on) status = syncBusy ? "Google'a bağlanılıyor…" : syncErr ? `Bağlanılamadı: ${syncErr}` : "Bağlı değil.";
  else status = syncBusy ? "Eşitleniyor…" : syncNeedsAuth ? "Oturum doldu. \"Şimdi eşitle\"ye dokun." : syncErr ? `Eşitlenemedi: ${syncErr}` : sync.last ? `Son eşitleme: ${agoText(sync.last)}` : "Henüz eşitlenmedi.";
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
  const line = st === "off" ? "Veriler yalnız bu cihazda" : st === "busy" ? "Eşitleniyor…" : st === "wait" ? (sync.last ? "Oturum doldu" : "Henüz eşitlenmedi") : st === "err" ? "Eşitlenemedi" : "Eşitlendi";
  const act = !can ? "" : sync.on ? `<button class="btn primary" id="shSyncNow" ${syncBusy ? "disabled" : ""}>${ic("refresh-cw")}Şimdi eşitle</button>` : `<button class="btn primary" id="shSyncConnect" ${syncBusy ? "disabled" : ""}>${ic("cloud")}Google ile bağlan</button>`;
  const help = st === "off" ? helpTip("Google ile bağlanınca telefon ve bilgisayar aynı verileri görür.") : "";
  $("#bsBody").innerHTML = `<div data-syncsheet><p style="margin:0 0 6px"><b>${line}</b>${help}</p>
    ${sync.on && sync.last ? `<p class="muted small" style="margin:0 0 6px">Son eşitleme: ${agoText(sync.last)}</p>` : ""}
    ${syncErr && sync.on ? `<p class="small" style="margin:0 0 6px;color:var(--danger)">${esc(syncErr)}</p>` : ""}
    ${!can ? `<p class="muted small" style="margin:0 0 6px">Google girişi için uygulamayı web adresinden aç.</p>` : ""}
    <div class="row" style="margin-top:12px">${act}</div></div>`;
  const n = $("#shSyncNow"); if (n) n.onclick = () => { runSync(true); };
  const c = $("#shSyncConnect"); if (c) c.onclick = () => { connectDrive(); };
}
export function openSyncSheet(){
  openSheet(sheetHead("Eşitleme"), "");
  fillSyncSheet();
}

// Profil'in üstü: bu cihazın bağlı olduğu Google hesabı. Telefonda ve bilgisayarda aynı hesap mı, buradan anlaşılır.
export function renderAccount(){
  const a = sync.on && sync.account, el = $("#acctCard");
  if (!el) return;
  let html;
  const syncBtn = () => syncCanRun() ? `<button class="btn" id="acctSync" style="margin-top:12px" ${syncBusy ? "disabled" : ""}>${ic("refresh-cw")}Şimdi eşitle</button>` : "";
  if (a && a.email) {
    const initial = esc((a.name || a.email).trim().charAt(0).toLocaleUpperCase("tr"));
    html = `<div class="row" style="gap:14px;align-items:center">
      <span class="avatar">${a.photo ? `<img src="${esc(a.photo)}" alt="" referrerpolicy="no-referrer">` : ""}${initial}</span>
      <div class="grow" style="min-width:0"><b style="font-size:18px">${esc(a.name || a.email)}</b><div class="muted small acct-mail">${esc(a.email)}</div></div>${helpTip("Bu hesapla girdiğin bütün cihazlarda aynı veriler görünür.")}</div>
      ${syncBtn()}`;
  } else if (sync.on) {
    html = `<div class="row" style="gap:14px;align-items:center"><span class="avatar">${ic("user")}</span>
      <div class="grow"><b>Google hesabına bağlı</b></div></div>${syncBtn()}`;
  } else {
    html = `<div class="row" style="gap:14px;align-items:center"><span class="avatar">${ic("user")}</span>
      <div class="grow"><b>Hesap bağlı değil</b></div>${helpTip("Veriler yalnız bu cihazda. Google ile bağlanınca telefon ve bilgisayar aynı verileri görür.")}</div>
      ${syncCanRun() ? `<button class="btn" id="acctConnect" style="margin-top:12px">${ic("cloud")}Google ile bağlan</button>` : ""}`;
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
    tokenP = requestToken(GOOGLE_CLIENT_ID, false, calScopes());
  }
  calBusy = true; calErr = ""; renderCalStatus();
  return enqueue(async () => {
    let r = null;
    try {
      if (tokenP) token = await tokenP;
      // sıra beklerken Drive birleştirmesi state'i değiştirmiş olabilir: güncel state kullanılır
      r = await runCalendar(state, calendarClient(token), { describeProgram: progDetails, describeSession, timeZone: timeZone() }, needTasks() ? tasksClient(token) : undefined);
      sync.calLast = Date.now(); saveSync();
      if (interactive) toast(r.written || r.planUpdated || r.ticked ? "Takvim güncel" : "Güncel", "calendar-days");
    } catch(e){
      if (e instanceof AuthError) dropScope(/^Görev/.test(e.message) ? TASKS_SCOPE : CAL_SCOPE);
      else calErr = (e && e.message) || "Takvime yazılamadı";
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
    const g = state.gcal, target = g.plan ? planSignature(state.plan, state.programs) : "";
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
      preloadGoogle().then(() => toast("Google hazır, tekrar dene", "check"), e => toast(e.message));
      return;
    }
    const tokenP = requestToken(GOOGLE_CLIENT_ID, false, calScopes());
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
  $("#calModeNote").textContent = g.mode === "task" ? "Görevler saatsiz görünür. Antrenman bitince görev tiklenir." : "Planlı saatte, hatırlatmayla.";
  let status = "";
  if (!can) status = "Google Takvim için uygulamayı web adresinden aç.";
  else if (calBusy) status = "Takvim güncelleniyor…";
  else if (calErr) status = `Takvime yazılamadı: ${calErr}`;
  else if (!on) status = "Kapalı.";
  else if (!hasToken) status = "Bu cihazda takvim izni yok.";
  else status = sync.calLast ? `"Spor Defteri" takvimi · son güncelleme ${agoText(sync.calLast)}` : `"Spor Defteri" takvimine yazılıyor.`;
  $("#calStatus").textContent = status;
  $("#calStatus").classList.toggle("muted", !calErr);
  $("#calAuth").classList.toggle("hidden", !can || !on || hasToken || calBusy);
  $("#calOpen").classList.toggle("hidden", !g.id);
}

// Düğme bağlamaları ve ilk hazırlıklar: main.js'teki açılış sırasında çağrılır
export function setup(){
try { sync = { ...sync, ...JSON.parse(localStorage.getItem(SYNC_KEY) || "{}") }; } catch(e){}
$("#syncConnect").onclick = connectDrive;
$("#syncNow").onclick = () => runSync(true);
$("#syncBtn").onclick = openSyncSheet;
$("#syncOff").onclick = async () => {
  const ok = await choose("Bağlantı kesilsin mi?\n\nCihazdaki kayıtlar kalır.",
    [{ label: "Vazgeç", value: false }, { label: "Bağlantıyı kes", value: true, primary: true }]);
  if (!ok) return;
  // Google'daki izni geri almak Takvim iznini de kaldırır; takvim açıksa yalnız Drive izni bırakılır
  if (calOn()) dropScope(DRIVE_SCOPE); else revoke();
  sync = { on: false, last: 0 }; syncNeedsAuth = false; syncErr = ""; saveSync();
  renderSyncStatus(); renderAccount(); renderBackupBanner(); toast("Bağlantı kesildi", "check");
};
document.addEventListener("visibilitychange", () => {
  // geri dönünce (2 dk'dan uzun aradan sonra) güncelle; arka plana geçerken son değişiklikleri gönder
  if (document.visibilityState === "visible") {
    if (sync.on) { if (Date.now() - sync.last > 2*60e3) runSync(false); else renderSyncStatus(); }
    runCal(false);
  }
  else if (sync.on) runSync(false);
});
setInterval(() => { if (sync.on && !syncBusy) renderSyncStatus(); }, 60e3);
$("#calLog").onchange = e => toggleCal("log", e.target.checked);
$("#calPlan").onchange = e => toggleCal("plan", e.target.checked);
document.querySelectorAll('[name="calMode"]').forEach(r => r.onchange = () => {
  if (!r.checked) return;
  // görevde tik yeterli: biten antrenman ayrıca etkinlik olarak yazılmaz (istenirse yeniden açılabilir)
  if (r.value === "task" && state.gcal.log) { state.gcal.log = false; toast("Antrenmanlar görev olarak işlenir", "check"); }
  toggleCal("mode", r.value);
});
$("#calAuth").onclick = () => runCal(true);
$("#calOpen").onclick = () => openUrl("https://calendar.google.com/calendar/r");
}
