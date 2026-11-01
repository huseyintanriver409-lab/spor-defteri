import { $, fmt, ic, save, setState, state, toast } from "./store.js";
import { buzz, closeSheet, keepAwake, openSheet, refreshAll } from "./ui.js";
import { fromTemplate } from "./programs.js";
import { mmss, setTDur, tDur } from "./tools.js";
import { connectDrive, syncCanRun } from "./cloud.js";

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
export const STARTERS = { ppl: ["Push (İtiş)", "Pull (Çekiş)", "Legs (Bacak)"], ul: ["Upper (Üst Vücut)", "Lower (Alt Vücut)"], fb: ["Full Body A", "Full Body B"], s5: ["5x5 (A)", "5x5 (B)"], none: [] };
export const PLAN_DAYS = { 2: ["MO","TH"], 3: ["MO","WE","FR"], 4: ["MO","TU","TH","FR"], 5: ["MO","TU","WE","FR","SA"], 6: ["MO","TU","WE","TH","FR","SA"] };
export function maybeOnboard(){
  if (state.onboarded) return;
  if (state.entries.length || state.programs.length) { state.onboarded = true; save(); return; }
  let goal = 3, starter = "ppl";
  openSheet(`<div class="eyebrow" style="margin-top:6px">Hoş geldin</div><h3 style="font-size:28px;margin:4px 0 6px;letter-spacing:-.035em">Hadi başlayalım</h3>
      <p class="muted" style="margin:0 0 4px">İki soru, sonra ilk antrenmanına hazırsın.</p>`,
    `<div class="pk-head">Haftada kaç gün çalışacaksın?</div><div class="optgrid" id="obGoal">${[2,3,4,5,6].map(n => `<button class="fchip${n===goal?" on":""}" data-v="${n}">${n} gün</button>`).join("")}</div>
     <div class="pk-head">Başlangıç programı</div><div class="optgrid" id="obProg">${[["ppl","Push / Pull / Legs"],["ul","Üst / Alt vücut"],["fb","Tüm vücut"],["s5","5x5 güç"],["none","Kendim oluşturacağım"]].map(([k,l]) => `<button class="fchip${k===starter?" on":""}" data-v="${k}">${l}</button>`).join("")}</div>
     <p class="muted small" style="margin-top:16px">Seçtiğin program haftalık planına yerleşir; istediğin zaman değiştirebilirsin.</p>
     <button class="btn primary xl" id="obGo" style="margin-top:6px">Başla${ic("arrow-right")}</button>
     <button class="ghost" id="obSkip" style="width:100%;justify-content:center;margin-top:6px">Şimdilik atla</button>
     ${syncCanRun() ? `<button class="ghost" id="obDrive" style="width:100%;justify-content:center;margin-top:2px">${ic("cloud")}Başka cihazda kullanıyorum: Drive'dan getir</button>` : ""}`,
    () => { state.onboarded = true; save(); });
  const pick = (id, set) => $(id).querySelectorAll("button").forEach(b => b.onclick = () => { set(b.dataset.v); $(id).querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); buzz(5); });
  pick("#obGoal", v => goal = +v); pick("#obProg", v => starter = v);
  $("#obGo").onclick = () => {
    state.goal = goal;
    const ids = STARTERS[starter].map(n => { const p = fromTemplate(n); state.programs.push(p); return p.id; });
    if (ids.length) (PLAN_DAYS[goal] || []).forEach((code, i) => state.plan.days[code] = { prog: ids[i % ids.length], time: "19:00" });
    state.onboarded = true; save(); closeSheet(); refreshAll(); toast("Hazırsın! Bugün ekranından başla", "biceps-flexed");
  };
  $("#obSkip").onclick = closeSheet;
  // başlangıç programı oluşturmadan bağlanır; yoksa programlar iki cihazda farklı kimlikle iki kez oluşur
  if ($("#obDrive")) $("#obDrive").onclick = () => { closeSheet(); connectDrive(); };
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
