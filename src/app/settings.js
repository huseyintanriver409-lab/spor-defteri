import { $, fmt, ic, save, state, toast } from "./store.js";
import { buzz, keepAwake, refreshAll } from "./ui.js";
import { openRecommender } from "./presets.js";
import { focus } from "./exercises.js";
import { refreshDatalist } from "./log.js";
import { mmss, setTDur } from "./tools.js";

/* ---------- Settings ---------- */
export function renderSettings(){
  $("#themeChips").innerHTML = [["dark","Koyu","moon"],["light","Açık","sun"],["system","Cihaz ayarı","monitor"]].map(([k,l,i]) => `<button class="fchip${theme===k?" on":""}" data-k="${k}" aria-pressed="${theme===k}">${ic(i)}${l}</button>`).join("");
  $("#themeChips").querySelectorAll("button").forEach(b => b.onclick = () => setTheme(b.dataset.k));
  // cinsiyet erkek/kadınsa vücut haritası ona göre; değilse çizim burada seçilir
  const sx = state.profile.sex || "", given = sx === "m" || sx === "f";
  $("#setSex").value = sx; $("#setBody").value = state.prefs.body === "f" ? "f" : "m";
  $("#setBodyWrap").classList.toggle("hidden", given);
  $("#sexHelp").textContent = given ? "Kas haritası ve güç skoru buna göre." : "Kas haritasında ve güç skorunda hangi vücut kullanılsın?";
  $("#setGoal").innerHTML = [1,2,3,4,5,6,7].map(v => `<option value="${v}"${v===state.goal?" selected":""}>${v} gün</option>`).join("");
  $("#setStreak").value = state.streakMode || "auto";
  $("#streakHelp").textContent = { auto: "Haftalık planın varsa planlı günleri kaçırmadıkça seri gün gün artar; plan yoksa haftalık sayılır.",
    week: "Haftalık hedefini tutturduğun her hafta seri 1 artar; hangi gün yaptığın önemli değil.",
    off: "Seri ve rozetler hiçbir yerde görünmez." }[$("#setStreak").value];
  renderTrainPrefs();
  $("#goalSum").textContent = `Haftada ${state.goal} gün · seri: ${$("#setStreak").selectedOptions[0].textContent.toLocaleLowerCase("tr")}`;
}

// Ayarlar → "Antrenman ayarları"
export function renderTrainPrefs(){
  $("#setRest").innerHTML = [30,45,60,90,120,150,180,240,300].map(v => `<option value="${v}"${v===state.rest?" selected":""}>${mmss(v)}</option>`).join("");
  $("#autoRest").checked = state.autoRest; $("#prefWake").checked = state.prefs.wake; $("#prefHaptic").checked = state.prefs.haptics;
  $("#prefFocus").value = focus();
  $("#focusHelp").textContent = { both: "Ağırlık, kardiyo ve yoga birlikte görünür.",
    lift: "Yoga pozları ve programları listelerde görünmez.",
    yoga: "Ağırlık hareketleri, rekorlar, güç skoru ve hesap araçları gizlenir; yoga, kardiyo ve kendi hareketlerin kalır." }[focus()];
}

/* ---------- Theme ----------
   Tema cihaza özeldir (senkronize edilmez); ana veriden ayrı bir anahtarda tutulur. Varsayılan: koyu. */
export const THEME_KEY = "sporDefteri.theme";
export const THEMES = { dark: ["moon", "Tema: koyu"], light: ["sun", "Tema: açık"], system: ["monitor", "Tema: cihaz ayarı"] };
export const darkMq = matchMedia("(prefers-color-scheme: dark)");
export let theme = "dark";
export function applyTheme(){
  if (theme === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = theme;
  $("#themeBtn").innerHTML = ic(THEMES[theme][0]); $("#themeBtn").title = THEMES[theme][1]; $("#themeBtn").setAttribute("aria-label", THEMES[theme][1]);
  const dark = theme === "dark" || (theme === "system" && darkMq.matches);
  document.querySelector('meta[name="theme-color"]').content = dark ? "#0a0a0b" : "#f3f3f4";
}
export function setTheme(t){
  theme = t; try { localStorage.setItem(THEME_KEY, t); } catch(e){}
  applyTheme(); if (!$("#profile-settings").classList.contains("hidden")) renderSettings();
}

/* ---------- First run ---------- */
// Yeni kullanıcıya program önerisi ekranı açılır; bilen "Atla" ile geçer.
export function maybeOnboard(){
  if (state.onboarded) return;
  if (state.entries.length || state.programs.length) { state.onboarded = true; save(); return; }
  openRecommender({ onboarding: true });
}

/* ---------- Accessibility ----------
   İkon düğmelerinin title metni ekran okuyucular için aria-label olarak da verilir. */
export function labelIcons(root){
  if (root.matches && root.matches("button[title]:not([aria-label]), a[title]:not([aria-label])")) root.setAttribute("aria-label", root.title);
  root.querySelectorAll && root.querySelectorAll("button[title]:not([aria-label]), a[title]:not([aria-label])").forEach(b => b.setAttribute("aria-label", b.title));
}

// Düğme bağlamaları ve ilk hazırlıklar: main.js'teki açılış sırasında çağrılır
export function setup(){
$("#setRest").onchange = () => { state.rest = setTDur(+$("#setRest").value); save(); };
$("#setSex").onchange = () => { state.profile.sex = $("#setSex").value; save(); refreshAll(); renderSettings(); };
$("#setBody").onchange = () => { state.prefs.body = $("#setBody").value; save(); refreshAll(); };
$("#setGoal").onchange = () => { state.goal = +$("#setGoal").value; save(); renderSettings(); };
$("#setStreak").onchange = () => { state.streakMode = $("#setStreak").value; save(); refreshAll(); renderSettings(); };
$("#autoRest").onchange = () => { state.autoRest = $("#autoRest").checked; save(); };
$("#prefWake").onchange = () => { state.prefs.wake = $("#prefWake").checked; save(); if (!state.prefs.wake) keepAwake(false); };
$("#prefHaptic").onchange = () => { state.prefs.haptics = $("#prefHaptic").checked; save(); buzz(30); };
$("#prefFocus").onchange = () => { state.prefs.focus = $("#prefFocus").value; save(); refreshDatalist(); refreshAll(); renderSettings(); };
try { const t = localStorage.getItem(THEME_KEY); if (THEMES[t]) theme = t; } catch(e){}
$("#themeBtn").onclick = () => { setTheme({ dark: "light", light: "system", system: "dark" }[theme]); toast(THEMES[theme][1], THEMES[theme][0]); };
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
