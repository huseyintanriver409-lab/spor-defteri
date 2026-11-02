import { $, fmt, ic, save, setState, state, toast } from "./store.js";
import { buzz, keepAwake } from "./ui.js";
import { openRecommender } from "./presets.js";
import { mmss, setTDur, tDur } from "./tools.js";

/* ---------- Settings ---------- */
export const ALL_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
export function renderSettings(){
  $("#themeChips").innerHTML = [["dark","Koyu","moon"],["light","Açık","sun"],["system","Cihaz ayarı","monitor"]].map(([k,l,i]) => `<button class="fchip${theme===k?" on":""}" data-k="${k}" aria-pressed="${theme===k}">${ic(i)}${l}</button>`).join("");
  $("#themeChips").querySelectorAll("button").forEach(b => b.onclick = () => setTheme(b.dataset.k));
  $("#setRest").innerHTML = [30,45,60,90,120,150,180,240,300].map(v => `<option value="${v}"${v===state.rest?" selected":""}>${mmss(v)}</option>`).join("");
  $("#setGoal").innerHTML = [1,2,3,4,5,6,7].map(v => `<option value="${v}"${v===state.goal?" selected":""}>${v} gün</option>`).join("");
  $("#autoRest").checked = state.autoRest; $("#prefWake").checked = state.prefs.wake; $("#prefHaptic").checked = state.prefs.haptics;
  $("#plateChips").innerHTML = ALL_PLATES.map(p => { const on = state.plates.includes(p); return `<button class="fchip${on?" on":""}" data-p="${p}" aria-pressed="${on}">${fmt(p)} kg</button>`; }).join("");
  $("#plateChips").querySelectorAll("button").forEach(b => b.onclick = () => {
    const p = +b.dataset.p;
    state.plates = state.plates.includes(p) ? state.plates.filter(x => x !== p) : [...state.plates, p].sort((a,b) => b-a);
    save(); renderSettings();
  });
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
$("#setGoal").onchange = () => { state.goal = +$("#setGoal").value; save(); };
$("#autoRest").onchange = () => { state.autoRest = $("#autoRest").checked; save(); };
$("#prefWake").onchange = () => { state.prefs.wake = $("#prefWake").checked; save(); if (!state.prefs.wake) keepAwake(false); };
$("#prefHaptic").onchange = () => { state.prefs.haptics = $("#prefHaptic").checked; save(); buzz(30); };
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
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
}
}
