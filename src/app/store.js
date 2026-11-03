import { DEFAULTS, stampChanges as stampState, takeSnapshot as snapshotOf, withDefaults } from "../core/schema.ts";
import { calSoon } from "./cloud.js";

export { LIB, CARDIO } from "../core/library.ts";
export const KEY = "sporDefteri.v1";
export const $ = s => document.querySelector(s);
export const ic = (n, cls = "") => `<svg class="ic${cls ? " " + cls : ""}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
export const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const fmt = n => (Math.round(n*10)/10).toLocaleString("tr-TR");
export const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,6);

/* ---------- Data layer ----------
   Veri modeli, damgalama ve birleştirme core/schema.ts içinde (bkz. YOL-HARITASI.md "Veri modeli").
   Damgalama save() içinde merkezi olarak yapılır: her kayıt bir önceki kaydedilen haliyle karşılaştırılır. */
export let state = DEFAULTS();
export let snapshot = null;
export function takeSnapshot(){ snapshot = snapshotOf(state); }
export function stampChanges(){ snapshot = stampState(state, snapshot); }
export function load(){
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = withDefaults(JSON.parse(raw));
  } catch(e){ toast("Kayıtlar okunamadı"); }
  if (!state.deviceId) state.deviceId = "d-" + uid();
  takeSnapshot();
}
export function save(){
  stampChanges();
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch(e){ toast("Kaydedilemedi! Yedek al."); }
  // plan ya da programlar değiştiyse takvimdeki planı birkaç saniye sonra güncelle (art arda değişiklikler tek seferde)
  if (state.gcal.plan || state.gcal.planSig || state.gcal.taskSig) calSoon();
}
// Tarayıcının confirm() penceresi bazı uygulama içi görüntüleyicilerde engellenir; bu yüzden kendi onay penceremiz
// choices: [{ label, value, primary? }]; dışarı tıklamak null döndürür
export function choose(msg, choices){
  return new Promise(res => {
    $("#modalMsg").textContent = msg;
    $("#modalBtns").innerHTML = `<span class="grow"></span>` + choices.map((c,i) => `<button class="btn${c.primary ? " primary" : ""}" data-i="${i}">${esc(c.label)}</button>`).join("");
    $("#modal").classList.remove("hidden");
    const done = v => { $("#modal").classList.add("hidden"); res(v); };
    $("#modalBtns").querySelectorAll("button").forEach(b => b.onclick = () => done(choices[+b.dataset.i].value));
    $("#modal").onclick = e => { if (e.target.id === "modal") done(null); };
  });
}
export const ask = (msg, yes = "Evet, sil") => choose(msg, [{ label: "Vazgeç", value: false }, { label: yes, value: true, primary: true }]).then(v => !!v);
export function toast(msg, icon = "info"){ const t=$("#toast"); t.innerHTML = ic(icon) + "<span>" + esc(msg) + "</span>"; t.classList.add("show"); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove("show"),2200); }

// başka modüllerden atanabilmesi için
export function setState(v){ return state = v; }

