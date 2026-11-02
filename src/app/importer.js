// Bağlantıyla program ekleme ve paylaşma; "Claude ile program yap". Biçim ve ayrıştırma core/importer.ts'te.
import { LINK_KEY, parseProgram, buildLink, claudePrompt } from "../core/importer.ts";
import { PLAN_DAYS } from "../core/programs.ts";
import { $, esc, ic, save, state, toast, uid } from "./store.js";
import { allEx } from "./exercises.js";
import { buzz, closeSheet, openSheet, sheetHead, refreshAll } from "./ui.js";
import { renderProg, WEEKDAYS, openUrl } from "./programs.js";
import { refreshDatalist } from "./log.js";

const LIVE = "https://huseyintanriver409-lab.github.io/spor-defteri/spor-defteri.html";
// Bağlantılar her zaman yayındaki adrese gider; geliştirirken (localhost) kendi adresimiz
const base = () => /^https?:$/.test(location.protocol) && !location.hostname.endsWith("github.io") ? location.origin + location.pathname : LIVE;
const dayName = code => (WEEKDAYS.find(w => w[0] === code) || [code, code])[1];
const knownNames = () => allEx().map(e => e.name);

// İçe aktarılan programı ekler; bilinmeyen hareketler özel hareket olur. plan: [gün kodu, gün sırası][]
function addImported(r, plan){
  const ids = r.days.map(d => {
    let name = r.days.length > 1 ? `${r.name} · ${d.name}` : r.name;
    if (state.programs.some(p => p.name === name)) { let n = 2; while (state.programs.some(p => p.name === `${name} (${n})`)) n++; name = `${name} (${n})`; }
    for (const it of d.items) if (!allEx().some(e => e.name === it.ex)) state.custom.push({ name: it.ex, group: "Diğer" });
    const prog = { id: uid(), name, items: d.items.map(i => ({ ex: i.ex, sets: i.sets, reps: i.reps })) };
    state.programs.push(prog);
    return prog.id;
  });
  if (plan && plan.length) {
    const old = state.plan.days, next = {};
    for (const [code, i] of plan) next[code] = { prog: ids[i], time: (old[code] && old[code].time) || "19:00" };
    state.plan.days = next; state.goal = plan.length;
  }
  state.onboarded = true;
  save(); refreshDatalist(); renderProg(); refreshAll(); buzz(15);
  toast(plan && plan.length ? `${r.name} eklendi ve haftalık plana yerleşti` : `${r.name} programlarına eklendi`, "check");
}

// Bağlantıda plan yoksa: seçilen gün sayısına göre günleri sırayla dağıt
const autoPlan = (r, n) => (PLAN_DAYS[n] || PLAN_DAYS[3]).map((c, i) => [c, i % r.days.length]);

export function openImportPreview(r){
  const hasPlan = r.plan.length > 0;
  let n = hasPlan ? r.plan.length : Math.min(6, Math.max(2, r.days.length === 1 ? 3 : r.days.length)), place = true;
  const planText = () => (hasPlan ? r.plan : autoPlan(r, n)).map(([c, i]) => `${dayName(c)}: ${r.days[i].name}`).join(" · ");
  const unknown = r.days.flatMap(d => d.items).filter(i => !i.known).length;
  openSheet(sheetHead("Bağlantıyla gelen program"),
    `<div class="eyebrow">Eklemeden önce kontrol et</div>
     <div style="font-size:22px;font-weight:800;letter-spacing:-.02em;margin:2px 0 6px">${esc(r.name)}</div>
     ${r.days.map(d => `<div class="pk-head">${esc(r.days.length > 1 ? d.name : "Antrenman")}</div>
       <div style="display:grid;gap:4px;margin-top:4px">${d.items.map(i => `<div class="row" style="flex-wrap:nowrap"><span class="grow">${esc(i.ex)}${i.known ? (i.original && i.original !== i.ex ? ` <span class="muted small">(${esc(i.original)})</span>` : "") : ` <span class="tag">yeni hareket</span>`}</span><span class="chip">${i.sets} × ${esc(i.reps || "–")}</span></div>`).join("")}</div>`).join("")}
     ${unknown ? `<p class="muted small" style="margin-top:10px">${ic("lightbulb")} "Yeni hareket" işaretliler listede bulunamadı; özel hareket olarak eklenir, sonra düzenleyebilirsin.</p>` : ""}
     ${r.warnings.filter(w => !/listede yok/.test(w)).map(w => `<p class="muted small" style="margin:6px 0 0">${esc(w)}</p>`).join("")}
     ${hasPlan ? "" : `<div class="pk-head">Haftada kaç gün</div><div class="optgrid" id="imDays">${[2, 3, 4, 5, 6].map(x => `<button class="fchip${x === n ? " on" : ""}" data-v="${x}">${x} gün</button>`).join("")}</div>`}
     <label class="check row" style="margin:14px 0 0;gap:10px;flex-wrap:nowrap"><input type="checkbox" id="imPlace" checked><span>Haftalık plana yerleştir${Object.keys(state.plan.days).length ? " (mevcut planın yerine geçer)" : ""}</span></label>
     <p class="muted small" id="imPlan" style="margin:6px 0 0"></p>
     <button class="btn primary xl" id="imGo" style="margin-top:12px">${ic("plus")}Programı ekle</button>`);
  const render = () => { $("#imPlan").textContent = place ? planText() : ""; };
  if ($("#imDays")) $("#imDays").querySelectorAll("button").forEach(b => b.onclick = () => {
    n = +b.dataset.v; $("#imDays").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); render(); buzz(5);
  });
  $("#imPlace").onchange = e => { place = e.target.checked; render(); };
  $("#imGo").onclick = () => { addImported(r, place ? (hasPlan ? r.plan : autoPlan(r, n)) : null); closeSheet(); };
  render();
}

// Adres çubuğunda #ekle=… varsa önizlemeyi açar ve adresi temizler (yenileyince tekrar sormasın)
export function handleImportLink(){
  if (!location.hash.includes(LINK_KEY + "=")) return;
  const url = location.href;
  history.replaceState(null, "", location.pathname + location.search);
  const r = parseProgram(url, knownNames());
  if (!r) return toast("Bu bağlantıdaki program okunamadı");
  openImportPreview(r);
}

export async function shareProgram(p){
  if (!p) return;
  const link = buildLink(base(), p.name, [{ name: "A", items: p.items }]);
  try { if (navigator.share) { await navigator.share({ title: p.name, text: `${p.name} (Spor Defteri)`, url: link }); return; } } catch(e){ if (e && e.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(link); toast("Bağlantı kopyalandı", "copy"); }
  catch(e){ openSheet(sheetHead("Paylaşım bağlantısı"), `<p class="muted">Kopyalayıp gönder:</p><textarea readonly style="width:100%;min-height:120px">${esc(link)}</textarea>`); }
}

// "Claude ile program yap": Claude'u hazır istekle açar; dönen bağlantı dokununca açılır, açılmazsa buraya yapıştırılır
export function openClaudeSheet(){
  openSheet(sheetHead("Claude ile program yap"),
    `<p class="muted" style="margin:0">Claude'a ne istediğini anlat; sana bir program ve uygulamaya ekleme bağlantısı versin.</p>
     <div class="pk-head">1 · İsteğin (isteğe bağlı)</div>
     <input id="clWish" placeholder="ör. evde dumbbell ile haftada 3 gün, kas kazanmak">
     <button class="btn primary" id="clOpen" style="margin-top:10px;width:100%;justify-content:center">${ic("sparkles")}Claude'u aç</button>
     <p class="muted small" style="margin:6px 0 0">İstek panoya da kopyalanır; Claude boş açılırsa yapıştırıp gönder.</p>
     <div class="pk-head">2 · Claude'un verdiği bağlantı</div>
     <p class="muted small" style="margin:4px 0 6px">Bağlantıya dokununca uygulama açılır. Açılmazsa bağlantıyı (ya da Claude'un cevabının tamamını) kopyalayıp buraya yapıştır.</p>
     <textarea id="clPaste" placeholder="https://…#ekle=p=…" style="width:100%;min-height:90px"></textarea>
     <div class="row" style="margin-top:8px">
       <button class="btn" id="clClip">${ic("clipboard-list")}Panodan yapıştır</button><span class="grow"></span>
       <button class="btn primary" id="clAdd">${ic("plus")}Ekle</button>
     </div>`);
  $("#clOpen").onclick = async () => {
    const prompt = claudePrompt(base(), $("#clWish").value.trim());
    try { await navigator.clipboard.writeText(prompt); } catch(e){}
    openUrl("https://claude.ai/new?q=" + encodeURIComponent(prompt));
  };
  $("#clClip").onclick = async () => {
    try { $("#clPaste").value = await navigator.clipboard.readText(); }
    catch(e){ toast("Panoya erişilemedi; uzun basıp yapıştır"); }
  };
  $("#clAdd").onclick = () => {
    const r = parseProgram($("#clPaste").value, knownNames());
    if (!r) return toast("Metinde Spor Defteri bağlantısı bulunamadı");
    openImportPreview(r);
  };
}

export function setup(){
  $("#claudeOpen").onclick = openClaudeSheet;
  // uygulama açıkken başka bir bağlantıyla gelinirse
  window.addEventListener("hashchange", handleImportLink);
}
