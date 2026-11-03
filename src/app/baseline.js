import { ymd, shortDate } from "../core/dates.ts";
import { baseSet, buildBaseline, progressRows } from "../core/baseline.ts";
import { $, esc, fmt, ic, save, state, toast } from "./store.js";
import { allEx, fmtSec, isCardio, isTimed, setLabel } from "./exercises.js";
import { buzz, closeSheet, openSheet, refreshAll, sheetHead } from "./ui.js";
import { refreshDatalist } from "./log.js";

/* ---------- Mevcut verilerim (başlangıç noktası) ----------
   Hesap core/baseline.ts'te. İlk açılışta (program seçildikten sonra ya da "başka uygulamadan geliyorum")
   ve Profil → Ayarlar'dan açılır. exercises: başlangıçta boş satır olarak gösterilecek hareketler. */
const fmtV = v => v ? String(v).replace(".", ",") : "";
const units = ex => isCardio(ex) ? ["dk", "km"] : isTimed(ex) ? ["ek kg", "sn"] : ["kg", "tekrar"];

function rowHTML(ex, b){
  const [u1, u2] = units(ex), v2 = b ? (b.sec || b.r) : "";
  return `<div class="bl-row">
    <input class="bl-ex" list="exList" value="${esc(ex)}" placeholder="Hareket" aria-label="Hareket">
    <label class="bl-num"><input class="bl-w" inputmode="decimal" value="${b ? fmtV(b.w) : ""}" placeholder="0" aria-label="${u1}"><span>${u1}</span></label>
    <label class="bl-num"><input class="bl-r" inputmode="decimal" value="${fmtV(v2)}" placeholder="0" aria-label="${u2}"><span>${u2}</span></label>
    <button class="iconbtn bl-del" title="Satırı sil">${ic("x")}</button>
  </div>`;
}

// Başlangıç → şimdi satırları (yalnız kaydedilmiş başlangıçlar için)
function progressHTML(){
  const rows = progressRows(state.baseline, state.entries);
  if (!rows.length) return "";
  return `<div class="pk-head">Başlangıç → şimdi</div>` + rows.map(p => {
    const c = isCardio(p.ex), start = setLabel(baseSet(p.start), c);
    let now = `<span class="muted">henüz antrenman yok</span>`;
    if (p.now) {
      const d = p.start.sec ? (p.diffSec ? `${p.diffSec > 0 ? "+" : ""}${fmtSec(p.diffSec)}` : "")
        : c ? "" : p.diffKg ? `${p.diffKg > 0 ? "+" : ""}${fmt(p.diffKg)} kg` : p.diffReps ? `${p.diffReps > 0 ? "+" : ""}${p.diffReps} tekrar` : "";
      now = `<b>${setLabel(p.now, c)}</b> <span class="muted">· ${shortDate(p.nowDate)}</span>${d ? ` <span class="${d.startsWith("+") ? "up" : "muted"}">${d}</span>` : ""}`;
    }
    return `<div class="bl-prog"><b>${esc(p.ex)}</b><span>${start} <span class="muted">(${shortDate(p.start.date)})</span> ${ic("arrow-right")} ${now}</span></div>`;
  }).join("");
}

export function openBaseline({ onboarding = false, exercises = [] } = {}){
  const b = state.baseline, names = [...Object.keys(b), ...exercises.filter(x => !b[x])];
  const head = onboarding
    ? `<div class="row" style="align-items:flex-start;margin-top:6px"><div class="grow"><div class="eyebrow">Başlangıç noktan</div>
         <h3 style="font-size:24px;margin:4px 0 6px;letter-spacing:-.035em">Şu an hangi kilolarla çalışıyorsun?</h3></div>
         <button class="btn quiet" id="blSkip" style="flex:none">Atla</button></div>`
    : sheetHead("Mevcut verilerim");
  openSheet(head, `<p class="muted small" style="margin:0 0 12px">Başka uygulamadan geliyorsan ya da defter tutmadan çalıştıysan, her hareket için şu an rahatça yaptığın kiloyu ve tekrarı yaz. İlk antrenmanda öneriler buradan başlar, bu değerleri geçmek rekor sayılır. Antrenman yaptıkça "şimdi" değeri kendiliğinden güncellenir. Antrenman geçmişine, takvime ve istatistiklere girmez. Bilmediğin hareketi boş bırak.</p>
    <div id="blRows" style="display:grid;gap:8px">${(names.length ? names : [""]).map(n => rowHTML(n, b[n])).join("")}</div>
    <button class="ghost" id="blAdd" style="margin-top:8px">${ic("plus")}Hareket ekle</button>
    <div class="row" style="margin-top:14px"><button class="btn primary" id="blSave">${ic("check")}Kaydet</button></div>
    <div id="blProg" style="margin-top:8px">${progressHTML()}</div>`);
  const rows = $("#blRows");
  const bind = row => {
    row.querySelector(".bl-del").onclick = () => { row.remove(); if (!rows.children.length) addRow(); };
    // hareket değişince birimler (kg/tekrar, dk/km, sn) ona göre değişir
    row.querySelector(".bl-ex").onchange = e => { const [u1, u2] = units(e.target.value.trim()); const s = row.querySelectorAll(".bl-num span"); s[0].textContent = u1; s[1].textContent = u2; };
  };
  const addRow = () => { rows.insertAdjacentHTML("beforeend", rowHTML("", null)); bind(rows.lastElementChild); rows.lastElementChild.querySelector(".bl-ex").focus(); };
  [...rows.children].forEach(bind);
  $("#blAdd").onclick = addRow;
  if (onboarding) $("#blSkip").onclick = closeSheet;
  $("#blSave").onclick = () => {
    const data = [...rows.children].map(r => {
      const ex = r.querySelector(".bl-ex").value.trim(), w = r.querySelector(".bl-w").value, v = r.querySelector(".bl-r").value;
      return !isCardio(ex) && isTimed(ex) ? { ex, w, sec: v } : { ex, w, r: v };
    });
    const next = buildBaseline(data, state.baseline, ymd(new Date()));
    for (const ex of Object.keys(next)) if (!allEx().some(e => e.name === ex)) state.custom.push({ name: ex, group: "Diğer" });
    state.baseline = next; save(); refreshDatalist(); refreshAll(); buzz(15);
    const n = Object.keys(next).length;
    toast(n ? `Başlangıç noktan kaydedildi · ${n} hareket` : "Başlangıç verileri temizlendi", "check");
    if (onboarding) closeSheet(); else $("#blProg").innerHTML = progressHTML();
  };
}

export function setup(){
  $("#baseOpen").onclick = () => openBaseline();
}
