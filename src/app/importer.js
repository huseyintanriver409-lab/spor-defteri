// Bağlantıyla program ekleme ve paylaşma; "Yapay zekâ ile program yap". Biçim ve ayrıştırma core/importer.ts'te.
import { LINK_KEY, parseProgram, buildLink, aiPrompt } from "../core/importer.ts";
import { PLAN_DAYS } from "../core/programs.ts";
import { $, esc, ic, save, state, toast, uid } from "./store.js";
import { allEx } from "./exercises.js";
import { buzz, closeSheet, helpTip, openSheet, sheetHead, refreshAll } from "./ui.js";
import { renderProg, renderPlan, WEEKDAYS, openUrl, untilText } from "./programs.js";
import { ymd } from "../core/dates.ts";
import { MCP_URL } from "../config.ts";
import { refreshDatalist } from "./log.js";
import { t } from "../core/i18n.ts";

const LIVE = "https://huseyintanriver409-lab.github.io/spor-defteri/spor-defteri.html";
// Bağlantılar her zaman yayındaki adrese gider; geliştirirken (localhost) kendi adresimiz
const base = () => /^https?:$/.test(location.protocol) && !location.hostname.endsWith("github.io") ? location.origin + location.pathname : LIVE;
const dayName = code => (WEEKDAYS.find(w => w[0] === code) || [code, code])[1];
const knownNames = () => allEx().map(e => e.name);

// Haftalık planın yerine koyar. days: [gün kodu, program kimliği][]; saat bağlantıdan, yoksa eskisi, yoksa 19:00
function applyPlan(days, times, until){
  const old = state.plan.days, next = {};
  for (const [code, prog] of days) next[code] = { prog, time: times[code] || (old[code] && old[code].time) || "19:00" };
  state.plan.days = next; state.plan.mode = "fixed"; state.goal = days.length; state.plan.until = until || "";
}
const calNote = () => state.gcal.plan ? t("importer.cal_auto") : t("importer.cal_enable");
const untilLine = r => r.until ? ` · ${untilText(r.until)}` : "";

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
  if (plan && plan.length) applyPlan(plan.map(([code, i]) => [code, ids[i]]), r.times, r.until);
  state.onboarded = true;
  save(); refreshDatalist(); renderProg(); refreshAll(); buzz(15);
  toast(plan && plan.length ? t("importer.added_planned") : t("importer.added"), "check");
}

// Bağlantıda plan yoksa: seçilen gün sayısına göre günleri sırayla dağıt
const autoPlan = (r, n) => (PLAN_DAYS[n] || PLAN_DAYS[3]).map((c, i) => [c, i % r.days.length]);

// Programsız bağlantı: yalnız günler, saatler ve bitiş tarihi. Her güne mevcut programlardan biri seçilir.
function openPlanPreview(r){
  if (!state.programs.length) return toast(t("importer.add_program_first"));
  // varsayılan: o gün zaten plandaki program, yoksa plandaki programlar sırayla, plan boşsa bütün programlar
  const inPlan = [...new Set(Object.values(state.plan.days).map(d => d.prog))].filter(id => state.programs.some(p => p.id === id));
  const pool = inPlan.length ? inPlan : state.programs.map(p => p.id);
  const pick = r.plan.map(([code], i) => [code, (state.plan.days[code] && pool.includes(state.plan.days[code].prog)) ? state.plan.days[code].prog : pool[i % pool.length]]);
  const opts = sel => state.programs.map(p => `<option value="${p.id}"${p.id === sel ? " selected" : ""}>${esc(p.name)}</option>`).join("");
  openSheet(sheetHead(t("importer.plan_title")),
    `<div style="font-size:22px;font-weight:800;letter-spacing:-.02em;margin:2px 0 6px">${t("importer.week_days", { n: r.plan.length })}${esc(untilLine(r))}</div>
     ${pick.map(([code, prog]) => `<div class="row" style="margin-top:6px;flex-wrap:nowrap"><span style="flex:0 0 74px;font-weight:600" class="small">${dayName(code)}</span>
       <select class="grow" data-ip="${code}">${opts(prog)}</select>
       <span class="chip" style="flex:none">${esc(r.times[code] || (state.plan.days[code] && state.plan.days[code].time) || "19:00")}</span></div>`).join("")}
     ${r.warnings.map(w => `<p class="muted small" style="margin:6px 0 0">${esc(w)}</p>`).join("")}
     <p class="muted small" style="margin:10px 0 0">${t("importer.plan_replaces")} ${calNote()}</p>
     <button class="btn primary xl" id="ipGo" style="margin-top:12px">${ic("calendar-days")}${t("importer.apply_plan")}</button>`);
  $("#ipGo").onclick = () => {
    applyPlan(pick.map(([code]) => [code, $(`[data-ip="${code}"]`).value]), r.times, r.until);
    state.onboarded = true;
    save(); renderPlan(); refreshAll(); buzz(15); closeSheet();
    toast(t("importer.plan_updated"), "check");
  };
}

export function openImportPreview(r){
  if (!r.days.length) return openPlanPreview(r);
  const hasPlan = r.plan.length > 0;
  let n = hasPlan ? r.plan.length : Math.min(6, Math.max(2, r.days.length === 1 ? 3 : r.days.length)), place = true;
  const planText = () => (hasPlan ? r.plan : autoPlan(r, n)).map(([c, i]) => `${dayName(c)}${r.times[c] ? " " + r.times[c] : ""}: ${r.days[i].name}`).join(" · ") + untilLine(r);
  const unknown = r.days.flatMap(d => d.items).filter(i => !i.known).length;
  // "yeni hareket" uyarıları zaten yukarıdaki nota yazılıyor; ayrı bir metin listesi olarak gösterilmez
  const unknownWarn = new Set(r.unknown.map(n => t("ai.warn_unknown", { name: n })));
  openSheet(sheetHead(t("importer.link_title")),
    `<div style="font-size:22px;font-weight:800;letter-spacing:-.02em;margin:2px 0 6px">${esc(r.name)}</div>
     ${r.days.map(d => `<div class="pk-head">${esc(r.days.length > 1 ? d.name : t("importer.workout"))}</div>
       <div style="display:grid;gap:4px;margin-top:4px">${d.items.map(i => `<div class="row" style="flex-wrap:nowrap"><span class="grow">${esc(i.ex)}${i.known ? (i.original && i.original !== i.ex ? ` <span class="muted small">(${esc(i.original)})</span>` : "") : ` <span class="tag">${t("importer.new_move")}</span>`}</span><span class="chip">${i.sets} × ${esc(i.reps || "–")}</span></div>`).join("")}</div>`).join("")}
     ${unknown ? `<p class="muted small" style="margin-top:10px">${ic("lightbulb")} ${t("importer.new_note")}</p>` : ""}
     ${r.warnings.filter(w => !unknownWarn.has(w)).map(w => `<p class="muted small" style="margin:6px 0 0">${esc(w)}</p>`).join("")}
     ${hasPlan ? "" : `<div class="pk-head">${t("importer.week_how_many")}</div><div class="optgrid" id="imDays">${[2, 3, 4, 5, 6].map(x => `<button class="fchip${x === n ? " on" : ""}" data-v="${x}">${t("importer.days_count", { n: x })}</button>`).join("")}</div>`}
     <label class="check row" style="margin:14px 0 0;gap:10px;flex-wrap:nowrap"><input type="checkbox" id="imPlace" checked><span>${t("importer.place")}${Object.keys(state.plan.days).length ? ` ${t("importer.place_replace")}` : ""}</span></label>
     <p class="muted small" id="imPlan" style="margin:6px 0 0"></p>
     <button class="btn primary xl" id="imGo" style="margin-top:12px">${ic("plus")}${t("importer.add_btn")}</button>`);
  const render = () => { $("#imPlan").textContent = place ? planText() + ". " + calNote() : ""; };
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
  if (!r) return toast(t("importer.read_failed"));
  openImportPreview(r);
}

export async function shareProgram(p){
  if (!p) return;
  const link = buildLink(base(), p.name, [{ name: "A", items: p.items }]);
  try { if (navigator.share) { await navigator.share({ title: p.name, text: `${p.name} (Spor Defteri)`, url: link }); return; } } catch(e){ if (e && e.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(link); toast(t("importer.copied"), "copy"); }
  catch(e){ openSheet(sheetHead(t("importer.share_title")), `<p class="muted">${t("importer.copy_send")}</p><textarea readonly style="width:100%;min-height:120px">${esc(link)}</textarea>`); }
}

// Yapay zekâlar: istek adreste taşınabiliyorsa (q=) doğrudan yazılı açılır, taşınamıyorsa panoya kopyalanıp açılır
const AIS = [
  ["Claude", q => "https://claude.ai/new?q=" + encodeURIComponent(q)],
  ["ChatGPT", q => "https://chatgpt.com/?q=" + encodeURIComponent(q)],
  ["Gemini", () => "https://gemini.google.com/app"],
];

// "Yapay zekâ ile program yap": hazır isteği telefondaki yapay zekâya gönderir (paylaş menüsü ya da seçilen site);
// dönen bağlantı dokununca açılır, açılmazsa buraya yapıştırılır
export function openAiSheet(){
  const canShare = !!navigator.share;
  openSheet(sheetHead(t("importer.ai_title")),
    `<div class="pk-head" style="margin-top:0">${t("importer.step_1")}${helpTip(t("importer.ai_help") + (canShare ? " " + t("importer.ai_help_share") : "") + " " + t("importer.ai_help_copy"))}</div>
     <input id="clWish" placeholder="${t("importer.wish_ph")}">
     ${canShare ? `<button class="btn" id="clShare" style="margin-top:10px;width:100%;justify-content:center">${ic("share-2")}${t("importer.ai_send")}</button>` : ""}
     <div class="row" style="margin-top:10px;gap:8px;flex-wrap:wrap">${AIS.map(([n], i) => `<button class="btn sm" data-ai="${i}">${ic("sparkles")}${n}</button>`).join("")}
       <button class="btn sm quiet" id="clCopy">${ic("copy")}${t("importer.copy_btn")}</button></div>
     <div class="pk-head">${t("importer.step_2")}${helpTip(t("importer.link_help"))}</div>
     <textarea id="clPaste" placeholder="https://…#ekle=p=…" style="width:100%;min-height:90px"></textarea>
     <div class="row" style="margin-top:8px">
       <button class="btn" id="clClip">${ic("clipboard-list")}${t("importer.paste_btn")}</button><span class="grow"></span>
       <button class="btn primary" id="clAdd">${ic("plus")}${t("importer.add_btn")}</button>
     </div>`);
  const prompt = () => aiPrompt(base(), $("#clWish").value.trim(), ymd(new Date()));
  const copy = async () => { try { await navigator.clipboard.writeText(prompt()); return true; } catch(e){ return false; } };
  if (canShare) $("#clShare").onclick = async () => {
    try { await navigator.share({ text: prompt() }); }
    catch(e){ if (!e || e.name !== "AbortError") { await copy(); toast(t("importer.copied_ai")); } }
  };
  document.querySelectorAll("[data-ai]").forEach(b => b.onclick = async () => {
    const [name, url] = AIS[+b.dataset.ai], ok = await copy();
    // Gemini adresle istek almıyor: yapıştırmak gerekir
    if (name === "Gemini") toast(ok ? t("importer.copied_gemini") : t("importer.copy_failed"), "copy");
    openUrl(url(prompt()));
  });
  $("#clCopy").onclick = async () => toast(await copy() ? t("importer.copied") : t("importer.copy_failed"), "copy");
  $("#clClip").onclick = async () => {
    try { $("#clPaste").value = await navigator.clipboard.readText(); }
    catch(e){ toast(t("importer.clip_failed")); }
  };
  $("#clAdd").onclick = () => {
    const r = parseProgram($("#clPaste").value, knownNames());
    if (!r) return toast(t("importer.link_not_found"));
    openImportPreview(r);
  };
}

export function setup(){
  // Profil → Yapay zekâ bağlantısı: bağlayıcı adresi ve Gemini CLI ayarı
  $("#mcpUrl").value = MCP_URL;
  $("#mcpGemini").textContent = JSON.stringify({ mcpServers: { "spor-defteri": { httpUrl: MCP_URL } } }, null, 2);
  $("#mcpCopy").onclick = async () => { try { await navigator.clipboard.writeText(MCP_URL); toast(t("importer.copied"), "copy"); } catch(e){ $("#mcpUrl").select(); toast(t("importer.copy_select")); } };
  // uygulama açıkken başka bir bağlantıyla gelinirse
  window.addEventListener("hashchange", handleImportLink);
}
