import { setGender } from "../core/body-model.ts";
import { redrawBodyMaps } from "./bodymap.js";
import { $, esc, ic, save, state } from "./store.js";
import { buzz, closeSheet, keepAwake, openSheet, refreshAll, segState, sheetHead, showTab } from "./ui.js";
import { openRecommender } from "./presets.js";
import { focus } from "./exercises.js";
import { refreshDatalist } from "./log.js";
import { latestWeight } from "./stats.js";
import { mmss, setTDur } from "./tools.js";
import { getLangPref, setLangPref, t, locale } from "../core/i18n.ts";

/* ---------- Settings ---------- */
export function renderSettings(){
  $("#setGoal").innerHTML = [1,2,3,4,5,6,7].map(v => `<option value="${v}"${v===state.goal?" selected":""}>${t("settings.goal_days", { n: v })}</option>`).join("");
  $("#setStreak").value = state.streakMode || "auto";
  $("#streakHelp").textContent = { auto: t("settings.streak_auto"), week: t("settings.streak_week"), off: t("settings.streak_off") }[$("#setStreak").value];
  const weight = latestWeight();
  $("#profileHeight").value = state.profile.height;
  $("#profileAge").value = state.profile.age;
  $("#profileWeight").value = weight || state.profile.bw || "";
  $("#profileWeight").readOnly = !!weight;
  $("#profileBodyNote").textContent = t(weight ? "settings.profile_weight_history" : "settings.profile_autosave");
  $("#bSex").value = state.profile.sex || "";
  renderTrainPrefs();
  $("#goalSum").textContent = t("settings.goal_sum", { goal: state.goal, streak: $("#setStreak").selectedOptions[0].textContent.toLocaleLowerCase(locale()) });
}

// Ayarlar → "Antrenman ayarları"
export function renderTrainPrefs(){
  $("#setRest").innerHTML = [30,45,60,90,120,150,180,240,300].map(v => `<option value="${v}"${v===state.rest?" selected":""}>${mmss(v)}</option>`).join("");
  $("#autoRest").checked = state.autoRest; $("#prefWake").checked = state.prefs.wake; $("#prefHaptic").checked = state.prefs.haptics;
  // Gender controls only the secondary question, never the general selector.
  const sx = state.profile.sex || "", given = sx === "m" || sx === "f";
  $("#bBody").value = state.prefs.body === "f" ? "f" : "m";
  $("#bBodyWrap").classList.remove("hidden");
  $("#profileModelWrap").classList.toggle("hidden", given);
  $("#profileModel").value = $("#bBody").value;
  $("#prefFocus").value = focus();
  $("#focusHelp").textContent = { both: t("settings.focus_both"), lift: t("settings.focus_lift"), yoga: t("settings.focus_yoga") }[focus()];
}

/* ---------- Theme ----------
   Tema cihaza özeldir (senkronize edilmez); ana veriden ayrı bir anahtarda tutulur. Varsayılan: koyu. */
export const THEME_KEY = "sporDefteri.theme";
export const THEMES = { dark: ["moon", t("settings.theme_dark")], light: ["sun", t("settings.theme_light")], system: ["monitor", t("settings.theme_system")] };
export const darkMq = matchMedia("(prefers-color-scheme: dark)");
export let theme = "dark";
export function applyTheme(){
  if (theme === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = theme;
  $("#themeBtn").innerHTML = ic(THEMES[theme][0]); $("#themeBtn").title = THEMES[theme][1]; $("#themeBtn").setAttribute("aria-label", t("settings.theme_aria", { name: THEMES[theme][1].toLocaleLowerCase(locale()) }));
  const dark = theme === "dark" || (theme === "system" && darkMq.matches);
  document.querySelector('meta[name="theme-color"]').content = dark ? "#0B0B0B" : "#F4F1EA";
}
export function setTheme(t){
  theme = t; try { localStorage.setItem(THEME_KEY, t); } catch(e){}
  applyTheme();
}

/* ---------- First run ---------- */
// Tanıtımdan sonra kullanıcı program önerisini açabilir veya deftere geçebilir.
export function maybeOnboard(){
  if (state.onboarded) return;
  if (state.entries.length || state.programs.length) { state.onboarded = true; save(); return; }
  openSheet(`<div class="welcome-close"><button class="iconbtn" data-close type="button" aria-label="${esc(t("ui.close"))}">${ic("x")}</button></div>`, `
    <div class="welcome-content">
      <div class="welcome-brand" aria-hidden="true">${ic("dumbbell")}</div>
      <h3>${esc(t("settings.welcome_title"))}</h3>
      <p class="welcome-subtitle">${esc(t("settings.welcome_intro"))}</p>
      <div class="welcome-actions">
        <button class="btn primary" id="welcomeProgram" type="button">${esc(t("settings.welcome_program"))}</button>
        <button class="btn quiet" id="welcomeSkip" type="button">${esc(t("settings.welcome_skip"))}</button>
      </div>
    </div>`, () => { state.onboarded = true; save(); });
  $("#welcomeProgram").onclick = () => openRecommender({ onboarding: true });
  $("#welcomeSkip").onclick = closeSheet;
}

/* ---------- Accessibility ----------
   İkon düğmelerinin title metni ekran okuyucular için aria-label olarak da verilir. */
export function labelIcons(root){
  if (root.matches && root.matches("button[title]:not([aria-label]), a[title]:not([aria-label])")) root.setAttribute("aria-label", root.title);
  root.querySelectorAll && root.querySelectorAll("button[title]:not([aria-label]), a[title]:not([aria-label])").forEach(b => b.setAttribute("aria-label", b.title));
}

// Düğme bağlamaları ve ilk hazırlıklar: main.js'teki açılış sırasında çağrılır
export function setup(){
$("#setLang").value = getLangPref();
$("#setLang").onchange = () => { setLangPref($("#setLang").value); location.reload(); };
$("#setRest").onchange = () => { state.rest = setTDur(+$("#setRest").value); save(); };
$("#setGoal").onchange = () => { state.goal = +$("#setGoal").value; save(); renderSettings(); };
$("#setStreak").onchange = () => { state.streakMode = $("#setStreak").value; save(); refreshAll(); renderSettings(); };
$("#autoRest").onchange = () => { state.autoRest = $("#autoRest").checked; save(); };
$("#prefWake").onchange = () => { state.prefs.wake = $("#prefWake").checked; save(); if (!state.prefs.wake) keepAwake(false); };
$("#prefHaptic").onchange = () => { state.prefs.haptics = $("#prefHaptic").checked; save(); buzz(30); };
$("#prefFocus").onchange = () => { state.prefs.focus = $("#prefFocus").value; save(); refreshDatalist(); refreshAll(); renderSettings(); };
for (const [id, key] of [["profileHeight", "height"], ["profileAge", "age"], ["profileWeight", "bw"]]) {
  $(`#${id}`).onchange = e => {
    const input = e.currentTarget;
    if (input.readOnly || !input.reportValidity()) return;
    state.profile[key] = input.value;
    save();
  };
}
$("#profileMeasurements").onclick = () => {
  segState.stats = "body";
  showTab("progress");
};
$("#bSex").onchange = () => { setGender(state, $("#bSex").value); save(); redrawBodyMaps(); refreshAll(); renderSettings(); };
// redrawBodyMaps: yeniden çizilmeyen haritalar (kütüphane #libMap, açık pencereler, mini haritalar) için; refreshAll: aktif sekmeyi yeniler
const changeModel = value => {
  state.prefs.body = value;
  save(); redrawBodyMaps(); refreshAll(); renderSettings();
};
$("#bBody").onchange = () => changeModel($("#bBody").value);
$("#profileModel").onchange = () => changeModel($("#profileModel").value);
document.addEventListener("click", e => {
  if (e.target.closest("[data-body-toggle]")) changeModel(state.prefs.body === "f" ? "m" : "f");
});
try { const t = localStorage.getItem(THEME_KEY); if (THEMES[t]) theme = t; } catch(e){}
$("#themeBtn").onclick = () => setTheme({ dark: "light", light: "system", system: "dark" }[theme]);
darkMq.addEventListener("change", applyTheme);
applyTheme();
new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) labelIcons(n); }))).observe(document.body, { childList: true, subtree: true });
labelIcons(document);
/* ---------- PWA ----------
   Bir web adresinden (https veya localhost) açıldığında uygulama telefona/bilgisayara kurulabilir ve çevrimdışı açılır.
   Dosya doğrudan açıldığında (file://) bu kısım atlanır; uygulama yine tek dosya olarak çalışır. */
if (/^https?:$/.test(location.protocol)) {
  [["manifest", "manifest.webmanifest"], ["apple-touch-icon", "icons/apple-touch-icon.png"]].forEach(([rel, href]) => {
    const l = document.createElement("link"); l.rel = rel; l.href = href; document.head.appendChild(l);
  });
  if ("serviceWorker" in navigator) {
    // Telefonda uygulama çoğu zaman arka plandan geri gelir, sayfa yeniden yüklenmez; eski sürüm açık kalırdı.
    // Uygulama öne her geldiğinde yeni sürüm aranır; yeni sürüm devreye girince sayfa kendini yeniler
    // (bir alana yazılıyorsa yazma bitene ya da uygulama arka plana gidene kadar bekler; veriler zaten kayıtlı).
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register("sw.js").then(reg => {
      document.addEventListener("visibilitychange", () => { if (!document.hidden) reg.update().catch(() => {}); });
    }).catch(() => {});
    let reloading = false;
    const reload = () => { if (!reloading) { reloading = true; location.reload(); } };
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadController) return;  // ilk kurulum: zaten en yeni sürüm açık
      const busy = () => { const a = document.activeElement; return a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName); };
      if (document.hidden || !busy()) return reload();
      document.addEventListener("focusout", () => setTimeout(() => { if (!busy()) reload(); }, 300));
      document.addEventListener("visibilitychange", () => { if (document.hidden) reload(); });
    });
  }
}
}
