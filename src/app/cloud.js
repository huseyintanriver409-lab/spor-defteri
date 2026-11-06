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
import { refreshAll } from "./ui.js";
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
        toast(n ? `Drive'dan ${n} değişiklik alındı` : "Drive ile eşitlendi", "check");
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
  if (!gisReady()) { preloadGoogle().then(() => toast("Google hazır, tekrar dokun", "check"), e => toast(e.message)); return; }
  const tokenP = requestToken(GOOGLE_CLIENT_ID, true, [DRIVE_SCOPE]);
  syncBusy = true; syncErr = ""; renderSyncStatus();
  tokenP.then(() => { sync.on = true; saveSync(); syncBusy = false; return runSync(false); })
    .catch(e => { syncBusy = false; syncErr = e.message; renderSyncStatus(); });
}

export function renderSyncStatus(){
  renderAccount();
  let sub = "Çevrimdışı · veriler bu cihazda";
  if (sync.on) sub = syncBusy ? "Drive ile eşitleniyor…" : syncNeedsAuth ? "Drive: eşitlemek için dokun" : syncErr ? "Drive: eşitlenemedi, dokun" : sync.last ? `Drive ile eşitlendi · ${agoText(sync.last)}` : "Google Drive'a bağlı";
  $("#brandSub").textContent = sub;
  $("#brandSub").classList.toggle("tap", sync.on && !syncBusy && (syncNeedsAuth || !!syncErr));
  const can = syncCanRun();
  let status = "";
  if (!GOOGLE_CLIENT_ID) status = "Kurulum bekleniyor: Google istemci kimliği henüz eklenmedi (YOL-HARITASI.md, Faz 4).";
  else if (!can) status = "Senkronizasyon için uygulamayı web adresinden aç (dosyadan açınca Google girişi çalışmaz).";
  else if (!sync.on) status = syncBusy ? "Google'a bağlanılıyor…" : syncErr ? `Bağlanılamadı: ${syncErr}` : "Bağlı değil.";
  else status = syncBusy ? "Eşitleniyor…" : syncNeedsAuth ? "Google oturumunun süresi doldu. Eşitlemek için \"Şimdi eşitle\"ye dokun." : syncErr ? `Son deneme başarısız: ${syncErr}` : sync.last ? `Son eşitleme: ${agoText(sync.last)}` : "Bağlı, henüz eşitlenmedi.";
  $("#syncStatus").textContent = status;
  $("#syncStatus").classList.toggle("muted", !syncErr);
  $("#syncConnect").classList.toggle("hidden", !can || sync.on);
  $("#syncNow").classList.toggle("hidden", !can || !sync.on);
  $("#syncOff").classList.toggle("hidden", !sync.on);
  $("#syncConnect").disabled = $("#syncNow").disabled = syncBusy;
}

// Profil'in üstü: bu cihazın bağlı olduğu Google hesabı. Telefonda ve bilgisayarda aynı hesap mı, buradan anlaşılır.
export function renderAccount(){
  const a = sync.on && sync.account, el = $("#acctCard");
  if (!el) return;
  let html;
  if (a && a.email) {
    const initial = esc((a.name || a.email).trim().charAt(0).toLocaleUpperCase("tr"));
    html = `<div class="row" style="gap:14px;align-items:center">
      <span class="avatar">${a.photo ? `<img src="${esc(a.photo)}" alt="" referrerpolicy="no-referrer">` : ""}${initial}</span>
      <div class="grow" style="min-width:0"><b style="font-size:18px">${esc(a.name || a.email)}</b><div class="muted small acct-mail">${esc(a.email)}</div>
      <div class="small" style="margin-top:2px">${ic("cloud")} ${syncBusy ? "Eşitleniyor…" : syncNeedsAuth ? "Oturum süresi doldu: eşitlemek için üstteki yazıya dokun" : syncErr ? "Son eşitleme başarısız" : sync.last ? `Drive ile eşitlendi · ${agoText(sync.last)}` : "Drive'a bağlı"}</div></div></div>
      <p class="muted small" style="margin:10px 0 0">Bu hesapla girdiğin bütün cihazlarda aynı veriler görünür.</p>`;
  } else if (sync.on) {
    html = `<div class="row" style="gap:14px;align-items:center"><span class="avatar">${ic("user")}</span>
      <div class="grow"><b>Google Drive'a bağlı</b><div class="muted small">Hesap bilgisi bir sonraki eşitlemede görünecek.</div></div></div>`;
  } else {
    html = `<div class="row" style="gap:14px;align-items:center"><span class="avatar">${ic("user")}</span>
      <div class="grow"><b>Hesap bağlı değil</b><div class="muted small">Veriler yalnız bu cihazda. Google ile bağlanınca telefon ve bilgisayar aynı verileri görür.</div></div></div>
      ${syncCanRun() ? `<button class="btn" id="acctConnect" style="margin-top:12px">${ic("cloud")}Google ile bağlan</button>` : ""}`;
  }
  el.innerHTML = html;
  // fotoğraf yüklenemezse baş harf görünür
  const img = el.querySelector(".avatar img"); if (img) img.onerror = () => img.remove();
  const b = $("#acctConnect"); if (b) b.onclick = connectDrive;
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
      if (interactive) toast(r.written || r.planUpdated || r.ticked ? "Takvim güncellendi" : "Takvim zaten güncel", "calendar-days");
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
      preloadGoogle().then(() => toast("Google hazır, tekrar dokun", "check"), e => toast(e.message));
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
  $("#calModeNote").textContent = g.mode === "task" ? "Görevler takvimde saatsiz görünür (Google görevlere saat koydurmuyor). Antrenmanı bitirince görev kendiliğinden tiklenir." : "Planlı saatte, hatırlatmayla.";
  let status = "";
  if (!can) status = "Google Takvim için uygulamayı web adresinden aç.";
  else if (calBusy) status = "Takvim güncelleniyor…";
  else if (calErr) status = `Son deneme başarısız: ${calErr}`;
  else if (!on) status = "Kapalı.";
  else if (!hasToken) status = "Bu cihazda takvim izni yok. Takvim, izin verdiğin diğer cihazdan güncellenir; bu cihazdan da yazmak için izin ver.";
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
$("#brandSub").onclick = () => { if (sync.on && !syncBusy && (syncNeedsAuth || syncErr)) runSync(true); };
$("#syncOff").onclick = async () => {
  const ok = await choose("Google Drive bağlantısı kesilsin mi?\n\nBu cihazdaki kayıtlar yerinde kalır. Drive'daki kopya silinmez; tekrar bağlandığında yine birleştirilir.",
    [{ label: "Vazgeç", value: false }, { label: "Bağlantıyı kes", value: true, primary: true }]);
  if (!ok) return;
  // Google'daki izni geri almak Takvim iznini de kaldırır; takvim açıksa yalnız Drive izni bırakılır
  if (calOn()) dropScope(DRIVE_SCOPE); else revoke();
  sync = { on: false, last: 0 }; syncNeedsAuth = false; syncErr = ""; saveSync();
  renderSyncStatus(); renderAccount(); renderBackupBanner(); toast("Drive bağlantısı kesildi", "check");
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
  if (r.value === "task" && state.gcal.log) { state.gcal.log = false; toast("Biten antrenmanlar artık görevin tikiyle görünür", "check"); }
  toggleCal("mode", r.value);
});
$("#calAuth").onclick = () => runCal(true);
$("#calOpen").onclick = () => openUrl("https://calendar.google.com/calendar/r");
}
