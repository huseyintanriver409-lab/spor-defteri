import { isUnilateral } from "../core/library.ts";
import { completeSide, pendingSide } from "../core/unilateral.ts";
import { pad, shortDate, ymd } from "../core/dates.ts";
import { t } from "../core/i18n.ts";
import { e1rm, overloadDecision, repRange, warmupSets, work } from "../core/training.ts";
import { baseSet } from "../core/baseline.ts";
import { muscleLabel } from "../core/musclemap.ts";
import { $, ask, esc, fmt, ic, save, setState, state, toast, uid } from "./store.js";
import { TYPE_LETTER, allEx, durText, fmtSec, groupOf, isCardio, isTimed, isYoga, musclesOf, setLabel, timedByDefault } from "./exercises.js";
import { buzz, closeSheet, keepAwake, openPicker, openSheet, refreshAll, sheetHead, showTab, undoable } from "./ui.js";
import { barFor, bestOf, bestSecOf } from "./log.js";
import { at, defaultInc, defaultStep, exPref, overloadStep, restFor, ssLabels, stepFor } from "./programs.js";
import { PLATES, audio, beep, mmss, pfmt, plateText, platesFor, renderFocusRest, setAudio, startTimer, stopTimer } from "./tools.js";
import { runCal, runSync } from "./cloud.js";
import { celebrateStreak } from "./streak.js";

/* ---------- Live workout: tam ekran antrenman modu ----------
   Her "Seti tamamla" seti hemen kayda yazar; sayfa kapansa da hiçbir set kaybolmaz.
   state.live = { start, date, prog, items: [{ex, sets, reps, ss?}], idx, prs? } (prs: o antrenmandaki rekor sayısı) */
export const fDraft = {};
export let fType = "", fRir = null;
export const liveItems = () => state.live ? (state.live.items ||= []) : [];
export const parseNum = s => parseFloat(String(s).replace(",", ".")) || 0;
export const fmtIn = v => v === "" || v == null ? "" : String(Math.round(v*100)/100).replace(".", ",");
export function elapsedText(){
  const s = Math.floor((Date.now() - state.live.start)/1000);
  return (s >= 3600 ? Math.floor(s/3600) + ":" + pad(Math.floor(s/60)%60) : Math.floor(s/60)) + ":" + pad(s%60);
}
export function startWorkout(progId){
  if (state.live) { openFocus(); return toast(t("live.already_running"), "timer"); }
  const p = progId && state.programs.find(x => x.id===progId);
  state.live = { start: Date.now(), date: ymd(new Date()), prog: p ? p.id : null, items: p ? p.items.map(i => ({...i})) : [], idx: 0, prs: 0 };
  state.active = p ? p.id : null;
  // bugün zaten yapılmış hareketleri atla
  const firstOpen = liveItems().findIndex(it => workDone(it) < (it.sets || 3));
  state.live.idx = Math.max(0, firstOpen);
  save(); buzz(20); openFocus();
}
export const doneSetsOf = ex => { const e = state.live && state.entries.find(x => x.date===state.live.date && x.ex===ex); return e ? e.sets : []; };
export const workDone = it => work(doneSetsOf(it.ex)).length;
export function openFocus(){
  if (!state.live) return;
  document.body.classList.add("focus-open"); $("#focus").classList.remove("hidden");
  renderFocus(); keepAwake(true); renderLiveBar();
}
export function closeFocus(){ document.body.classList.remove("focus-open"); $("#focus").classList.add("hidden"); renderLiveBar(); refreshAll(); }
export function suggestFor(it){
  // önceki seansa göre kilo/tekrar önerisi ve kademeli yüklenme
  const today = state.live ? state.live.date : ymd(new Date()), c = isCardio(it.ex);
  let prev = state.entries.filter(e => e.ex===it.ex && e.date < today).sort((a,b) => b.date.localeCompare(a.date))[0];
  // hiç kaydı yoksa başlangıç verisi "son kez" yerine geçer (tek set: kilo artırma kararı verilmez)
  const b = !prev && state.baseline[it.ex], fromBase = !!b;
  if (b) prev = { date: b.date, sets: [baseSet(b)] };
  const last = fromBase ? t("live.base_label") : t("live.last_label");
  const range = repRange(it.reps), { lo } = range, sets = it.sets || 3;
  const ws = prev ? work(prev.sets) : [];
  const { hitTop, easy, hard, increase } = overloadDecision(ws, sets, range, c);
  const inc = increase ? overloadStep(it.ex) : 0;
  const base = ws[0];
  if (isTimed(it.ex)) {
    // süreli: hedef süreyi bütün setlerde tutturduysa +5 sn öner
    const secs = ws.map(x => +x.sec || 0), tgt = lo || 30, hit = prev && secs.length >= sets && secs.slice(0, sets).every(x => x >= tgt);
    let tmsg = prev ? `${last} ${shortDate(prev.date)}: <b>${ws.map(x => setLabel(x, c)).join(", ")}</b>` : "";
    if (hit) tmsg += `<br><span class="up">${ic("trending-up")} ${t("live.hit_plus_sec")}</span>`;
    return { w: base && +base.w ? +base.w : "", r: hit ? Math.max(...secs.slice(0, sets)) + 5 : (lo || (base && base.sec) || 30), msg: tmsg };
  }
  let msg = prev ? `${last} ${shortDate(prev.date)}: <b>${ws.map(s => setLabel(s, c)).join(", ")}</b>` : "";
  if (hitTop) msg += `<br><span class="up">${ic("trending-up")} ${t("live.hit_plus_kg", { inc: fmt(inc) })}</span>`;
  else if (easy) msg += `<br><span class="up">${ic("trending-up")} ${t("live.rir3_plus_kg", { inc: fmt(inc) })}</span>`;
  else if (hard) msg += `<br>${ic("target")} ${t("live.same_weight")}`;
  return { w: base && base.w ? Math.round((+base.w + inc)*100)/100 : "", r: lo || (base ? base.r : ""), msg };
}
// uzun değerlerde (92,5 / 102,5) yazı küçülür ki dar ekranda kesilmesin
export const fitNum = inp => { const n = inp.value.length; inp.style.fontSize = n >= 6 ? "21px" : n >= 5 ? "25px" : n >= 4 ? "30px" : ""; };
export const stepperHTML = (k, v, unit, label) => `<div class="stepper" data-k="${k}"><button type="button" data-d="-1" aria-label="${t("live.dec", { label })}">${ic("minus")}</button>
  <div class="val"><input id="f_${k}" inputmode="decimal" value="${fmtIn(v)}" placeholder="0" aria-label="${label}"><span class="unit">${unit}</span></div>
  <button type="button" data-d="1" aria-label="${t("live.inc", { label })}">${ic("plus")}</button></div>`;
export function renderFocus(){
  if (!state.live) return;
  const items = liveItems();
  const idx = state.live.idx = Math.min(Math.max(0, state.live.idx || 0), Math.max(0, items.length - 1));
  const L = ssLabels(items);
  $("#fList").innerHTML = items.map((it,k) => {
    const done = workDone(it) >= (it.sets || 3);
    return `<button class="${k===idx ? "on" : ""}${done ? " done" : ""}" data-k="${k}">${done ? ic("check") : ""}${L[k] ? `<span class="ssl">${L[k]}</span>` : ""}${esc(it.ex)}</button>`;
  }).join("") + `<button data-add="1">${ic("plus")}${t("live.add_ex")}</button>`;
  $("#fList").querySelectorAll("[data-k]").forEach(b => b.onclick = () => gotoItem(+b.dataset.k));
  $("#fList [data-add]").onclick = addFocusExercise;
  const on = $("#fList .on"); if (on) on.scrollIntoView({ block: "nearest", inline: "center" });
  tickFocus();
  if (!items.length) {
    $("#fBody").innerHTML = `<div class="f-empty">${ic("dumbbell")}<button class="btn primary" id="fAddFirst">${ic("plus")}${t("live.add_ex")}</button></div>`;
    $("#fAddFirst").onclick = addFocusExercise;
    $("#fComplete").classList.add("hidden"); $(".f-nav").classList.add("hidden");
    renderFocusRest(); return;
  }
  $("#fComplete").classList.remove("hidden"); $(".f-nav").classList.remove("hidden");
  const it = items[idx], c = isCardio(it.ex), tm = isTimed(it.ex), sug = suggestFor(it), done = doneSetsOf(it.ex), wd = work(done).length;
  const target = it.sets || 3, bar = !c && !tm ? barOf(it.ex) : 0;
  const d = fDraft[it.ex] ||= (() => { const last = pendingSide(state.live, it.ex, done.length)?.first || work(done).slice(-1)[0]; return last ? { w: last.w, r: last.sec ?? last.r } : { w: sug.w, r: sug.r }; })();
  // ısınma rehberi: henüz çalışma seti yokken, çalışma kilosuna göre
  const warmDone = done.filter(x => x.t === "w").length, workW = d.work ? d.work.w : d.w;
  const warmPlan = !c && !tm && !wd && +workW > 0 ? warmupSets(+workW, bar) : [];
  const note = state.exNotes[it.ex], m = musclesOf(it.ex);
  const goal = it.reps ? `<b>${target} × ${esc(it.reps)}${tm ? " " + t("live.u_sec") : ""}</b>` : "";
  let k = 0;
  const doneChips = done.map((s,i) => { const warm = s.t === "w", lbl = warm ? "I" : (s.t ? TYPE_LETTER[s.t] : "") + (++k);
    return `<button class="chip${warm ? " warm" : ""}" data-i="${i}" title="${t("live.delete_set")}">${lbl}) ${setLabel(s,c)}</button>`; }).join("");
  $("#fBody").innerHTML = `
    <div class="eyebrow">${esc(groupOf(it.ex))}${L[idx] ? ` · ${t("live.superset", { l: L[idx] })}` : ""}</div>
    <div class="f-title"><h2>${esc(it.ex)}</h2><button class="iconbtn" id="fPrefs" title="${t("live.ex_prefs")}">${ic("sliders-horizontal")}</button></div>
    <button class="f-note ghost" id="fNote" style="padding:0">${ic("pin")}<span>${note ? esc(note) : t("live.add_note")}</span></button>
    <div class="f-hint">${[sug.msg, goal].filter(Boolean).join("<br>") || t("live.first_time")}</div>
    <div class="f-prog" aria-hidden="true">${Array.from({ length: Math.max(target, wd) }, (_, j) => `<i class="${j < wd ? "on" : j === wd ? "cur" : ""}"></i>`).join("")}</div>
    <div class="f-setlabel"><span>${wd >= target ? t("live.extra_set", { n: wd + 1 }) : `${wd + 1}/${target}`}</span><span>${esc(m.p.map(muscleLabel).join(", "))}</span></div>
    ${isUnilateral(it.ex) ? `<div class="f-setlabel" role="status" aria-live="polite"><span>${t(pendingSide(state.live, it.ex, done.length) ? "live.side_right" : "live.side_left")}</span></div>` : ""}
    <div class="steppers${tm && isYoga(it.ex) ? " one" : ""}">${tm ? (isYoga(it.ex) ? `<div class="hidden">${stepperHTML("w", d.w, t("live.u_extra_kg"), t("live.l_extra_weight"))}</div>` : stepperHTML("w", d.w, t("live.u_extra_kg"), t("live.l_extra_weight"))) + stepperHTML("r", d.r, t("live.u_seconds"), t("live.l_time"))
      : stepperHTML("w", d.w, c ? t("live.u_min") : t("live.u_kg"), c ? t("live.l_time") : t("live.l_weight")) + stepperHTML("r", d.r, c ? t("live.u_km") : t("live.u_reps"), c ? t("live.l_distance") : t("live.l_reps"))}</div>
    ${bar ? `<div id="fPlates">${platesHTML(d.w, bar)}</div>` : ""}
    ${warmPlan.length ? `<div class="f-warm"><div class="f-setlabel" style="margin:0"><span>${t("live.warmup")}</span></div><div class="chips">${warmPlan.map((x, j) => `<button class="chip${j < warmDone ? " done" : ""}" data-wi="${j}">${fmt(x.w)} × ${x.r}</button>`).join("")}</div></div>` : ""}
    ${tm ? `<div class="f-manual"><button class="ghost" id="fManual">${ic("check")}${t("live.save_no_timer")}</button></div>` : ""}
    ${c || tm ? "" : `<div class="f-chips" id="fRirChips"><span>RIR</span>${["",0,1,2,3,4].map(v => `<button type="button" data-v="${v}" class="${String(fRir ?? "") === String(v) ? "on" : ""}">${v === "" ? "–" : v === 4 ? "4+" : v}</button>`).join("")}</div>
    <div class="f-chips" id="fTypeChips"><span>${t("live.type")}</span>${[["", t("live.type_normal")], ["w", t("live.warmup")], ["d", t("live.type_drop")], ["f", t("live.type_failure")]].map(([ty, l]) => `<button type="button" data-t="${ty}" class="${fType === ty ? "on" : ""}">${l}</button>`).join("")}</div>`}
    ${done.length ? `<div class="f-done" title="${t("live.tap_delete")}"><div class="f-setlabel" style="margin:0"><span>${t("live.completed")}</span></div><div class="chips">${doneChips}</div></div>` : ""}`;
  $("#fPrefs").onclick = () => openExPrefs(it);
  $("#fNote").onclick = () => editExNote(it.ex);
  $("#fBody").querySelectorAll(".stepper").forEach(st => {
    const key = st.dataset.k, inp = st.querySelector("input");
    fitNum(inp);
    inp.oninput = () => { fitNum(inp); d[key] = inp.value === "" ? "" : parseNum(inp.value); if (key === "w" && bar) $("#fPlates").innerHTML = platesHTML(d.w, bar); if (key === "w") syncWarm(); };
    st.querySelectorAll("button").forEach(btn => {
      let t1, t2;
      const step = () => {
        const s = key === "w" ? (c ? 1 : stepFor(it.ex)) : (c ? 0.5 : tm ? 5 : 1);
        const nv = Math.max(0, Math.round((parseNum(inp.value) + (+btn.dataset.d) * s) * 100) / 100);
        inp.value = fmtIn(nv); fitNum(inp); d[key] = nv; buzz(5);
        if (key === "w" && bar) $("#fPlates").innerHTML = platesHTML(nv, bar);
        if (key === "w") syncWarm();
      };
      const stop = () => { clearTimeout(t1); clearInterval(t2); };
      // basılı tutunca hızlı artar
      btn.addEventListener("pointerdown", e => { e.preventDefault(); step(); t1 = setTimeout(() => t2 = setInterval(step, 80), 420); });
      ["pointerup", "pointerleave", "pointercancel"].forEach(ev => btn.addEventListener(ev, stop));
      btn.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); step(); } });
    });
  });
  $("#fBody").querySelectorAll("#fRirChips button").forEach(b => b.onclick = () => { fRir = b.dataset.v === "" ? null : +b.dataset.v; $("#fRirChips").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); buzz(5); });
  $("#fBody").querySelectorAll("#fTypeChips button").forEach(b => b.onclick = () => { fType = b.dataset.t; $("#fTypeChips").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); buzz(5); });
  $("#fBody").querySelectorAll(".f-done [data-i]").forEach(b => b.onclick = () => removeDoneSet(+b.dataset.i));
  bindWarm();
  // ısınma çipleri çalışma kilosu değiştikçe yeniden hesaplanır (bir ısınma seti yüklendiyse sabit kalır)
  function bindWarm(){
    $("#fBody").querySelectorAll("[data-wi]").forEach(b => b.onclick = () => {
      const x = warmupSets(+(d.work ? d.work.w : d.w), bar)[+b.dataset.wi]; if (!x) return;
      d.work ||= { w: d.w, r: d.r };
      d.w = x.w; d.r = x.r; fType = "w"; buzz(8); renderFocus();
    });
  }
  function syncWarm(){
    const box = $("#fBody .f-warm .chips"); if (!box || d.work) return;
    box.innerHTML = warmupSets(+d.w, bar).map((x, j) => `<button class="chip" data-wi="${j}">${fmt(x.w)} × ${x.r}</button>`).join("");
    bindWarm();
  }
  const fm = $("#fManual"); if (fm) fm.onclick = () => completeSet();
  const prev = items[idx-1], next = items[idx+1];
  $("#fPrev").disabled = !prev; $("#fPrev span").textContent = prev ? prev.ex : "";
  $("#fNext").disabled = !next; $("#fNext span").textContent = next ? next.ex : "";
  $("#fPrev").setAttribute("aria-label", prev ? t("live.prev_aria", { ex: prev.ex }) : t("live.prev_none"));
  $("#fNext").setAttribute("aria-label", next ? t("live.next_aria", { ex: next.ex }) : t("live.next_none"));
  $("#fComplete").innerHTML = tm ? ic("play") + t("live.start") : ic("check") + (wd >= target ? t("live.extra_set_btn") : t("live.complete"));
  renderFocusRest(); renderHold();
}
export const barOf = ex => { const b = exPref(ex, "bar"); return b != null ? b : barFor(ex); };
export function platesHTML(w, bar){
  w = +w || 0;
  if (!bar || !w) return "";
  if (w < bar) return `<div class="f-plates"><div class="pl-txt"><b>${t("live.plates")}</b>${t("live.bar_heavier", { bar: fmt(bar) })}</div></div>`;
  const { used, rest } = platesFor((w - bar) / 2);
  const vis = used.map(x => { const pl = PLATES.find(y => y[0] === x); return `<i style="background:${pl[1]};height:${Math.round(pl[2] * .5)}px"></i>`; }).join("");
  return `<div class="f-plates" role="img" aria-label="${used.length ? t("live.plates_aria", { list: used.map(pfmt).join(", ") }) : t("live.empty_bar")}"><div class="pl-vis" aria-hidden="true"><span class="pl-bar"></span>${vis}</div>
    <div class="pl-txt"><b>${t("live.each_side_bar", { bar: fmt(bar) })}</b>${used.length ? plateText(used) + " " + t("live.u_kg") : t("live.empty_bar")}${rest > 0.01 ? ` <span class="muted">(${t("live.missing_kg", { kg: fmt(rest * 2) })})</span>` : ""}</div></div>`;
}

/* ---------- Süreli set zamanlayıcısı ----------
   3 saniyelik hazırlık, sonra hedef süreden geri sayım. Süre dolunca set kendiliğinden kaydedilir; erken bitirilirse geçen süre kaydedilir. */
export let hold = null;
export function tone(f, dur){
  if (!audio) return;
  try { const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = f; o.connect(g); g.connect(audio.destination);
    g.gain.setValueAtTime(.22, audio.currentTime); g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + dur); o.start(); o.stop(audio.currentTime + dur + .02); } catch(e){}
}
export function toggleHold(){
  if (hold) { if (hold.phase === "lead") cancelHold(); else finishHold(Math.round((Date.now() - hold.t0) / 1000)); return; }
  const target = parseNum($("#f_r").value);
  if (!target) return toast(t("live.enter_time"));
  try { setAudio(audio || new (window.AudioContext || window.webkitAudioContext)()); audio.resume(); } catch(e){}
  stopTimer();
  hold = { phase: "lead", t0: Date.now() + 3000, target, last: null };
  hold.iv = setInterval(holdTick, 100); holdTick(); keepAwake(true);
}
export function holdTick(){
  const now = Date.now();
  if (hold.phase === "lead") {
    const left = Math.ceil((hold.t0 - now) / 1000);
    if (left !== hold.last && left > 0) { hold.last = left; tone(660, .12); buzz(15); }
    if (now >= hold.t0) { hold.phase = "run"; hold.last = null; tone(990, .3); buzz(60); }
  }
  if (hold.phase === "run") {
    const el = (now - hold.t0) / 1000, left = Math.ceil(hold.target - el);
    if (left <= 3 && left > 0 && left !== hold.last) { hold.last = left; tone(660, .1); }
    if (el >= hold.target) { finishHold(hold.target, true); return; }
  }
  renderHold();
}
export function renderHold(){
  const box = $("#fHold"); box.classList.toggle("hidden", !hold);
  if (!hold) return;
  const now = Date.now(), lead = hold.phase === "lead";
  box.classList.toggle("lead", lead);
  const left = lead ? Math.max(1, Math.ceil((hold.t0 - now) / 1000)) : Math.max(0, Math.ceil(hold.target - (now - hold.t0) / 1000));
  $("#fHoldLbl").textContent = lead ? t("live.get_ready") : t("live.time_left");
  $("#fHoldBig").textContent = lead ? left : mmss(left);
  $("#fHoldBar").style.width = lead ? "0%" : Math.min(100, (now - hold.t0) / 10 / hold.target) + "%";
  $("#fComplete").innerHTML = lead ? ic("x") + t("live.cancel") : ic("square") + t("live.save");
}
export function cancelHold(){ clearInterval(hold.iv); hold = null; renderFocus(); }
export function finishHold(secs, full){
  clearInterval(hold.iv); hold = null;
  if (full) beep();
  $("#f_r").value = String(secs);
  if (secs > 0) completeSet(); else renderFocus();
}
export function tickFocus(){ if (state.live) $("#fElapsed").textContent = elapsedText(); }
export function gotoItem(k){
  const items = liveItems(); if (k < 0 || k >= items.length || k === state.live.idx) return;
  if (hold) return toast(t("live.finish_hold_first"), "timer");
  state.live.idx = k; fType = ""; fRir = null; save(); renderFocus(); buzz(8);
  $("#fBody").scrollTop = 0;
}
// yana kaydırarak hareketler arasında geçiş
export let swX = null, swY = 0;
export function addFocusExercise(){
  openPicker(t("live.add_ex"), n => {
    const items = liveItems(), at = items.findIndex(x => x.ex === n);
    if (at >= 0) { gotoItem(at); return; }
    items.push({ ex: n, sets: 3, reps: "" }); state.live.idx = items.length - 1; save(); renderFocus();
  });
}
export function completeSet(){
  const items = liveItems(), k = state.live.idx, it = items[k]; if (!it) return;
  const done = () => doneSetsOf(it.ex);
  const c = isCardio(it.ex), d = fDraft[it.ex] ||= {};
  let w = parseNum($("#f_w").value), r = parseNum($("#f_r").value);
  const tm = isTimed(it.ex);
  if (tm && !r) return toast(t("live.enter_time"));
  if (!w && !r) return toast(c ? t("live.enter_time_or_dist") : t("live.enter_weight_reps"));
  let set = tm ? { w, sec: r, r: 0 } : { w, r };
  if (!c && !tm && fRir != null) set.rir = fRir;
  if (!c && fType) set.t = fType;
  d.w = w; d.r = r;
  if (isUnilateral(it.ex)) {
    set = completeSide(state.live, it.ex, done().length, set);
    if (!set) { stopTimer(); save(); buzz(15); renderFocus(); return; }
  }
  w = +set.w || 0; r = +(set.sec ?? set.r) || 0;
  const before = bestOf(it.ex), beforeSec = bestSecOf(it.ex);
  if (!allEx().some(e => e.name === it.ex)) state.custom.push({ name: it.ex, group: "Diğer" });
  const e = state.entries.find(x => x.date === state.live.date && x.ex === it.ex);
  if (e) e.sets.push(set); else state.entries.push({ id: uid(), ts: Date.now(), date: state.live.date, ex: it.ex, sets: [set] });
  d.w = w; d.r = r;
  let pr = false;
  if (tm) { if (before.n && r > beforeSec && set.t !== "w") { pr = true; toast(t("live.time_record", { t: fmtSec(r) }), "trophy"); } }
  else if (!c && set.t !== "w" && before.n) {
    if (w > before.w) { pr = true; toast(t("live.record_kg", { w: fmt(w) }), "trophy"); }
    else if (r <= 12 && e1rm(w, r) > before.e + 0.05) { pr = true; toast(t("live.est_1rm", { w: fmt(e1rm(w, r)) }), "trophy"); }
  }
  if (pr) state.live.prs = (state.live.prs || 0) + 1;
  buzz(pr ? [30, 60, 30, 60, 90] : 25);
  const warm = set.t === "w";
  fType = ""; fRir = null;
  if (warm && d.work) {
    // ısınma: sıradaki ısınma setini yükle, bittiyse çalışma kilosuna dön
    const plan = warmupSets(+d.work.w, barOf(it.ex)), nextW = plan[done().filter(x => x.t === "w").length];
    if (nextW) { d.w = nextW.w; d.r = nextW.r; fType = "w"; } else { d.w = d.work.w; d.r = d.work.r; delete d.work; }
  }
  let rest = state.autoRest && !warm;
  const L = ssLabels(items), target = x => x.sets || 3;
  const advance = () => {
    const nxt = items.findIndex((x, j) => j > k && workDone(x) < target(x));
    const any = nxt >= 0 ? nxt : items.findIndex(x => workDone(x) < target(x));
    if (any >= 0 && any !== k) { state.live.idx = any; setTimeout(() => toast(t("live.next_up", { ex: items[any].ex }), "arrow-right"), pr ? 2300 : 0); }
    else if (any < 0) setTimeout(() => toast(t("live.all_done"), "biceps-flexed"), pr ? 2300 : 0);
  };
  if (!warm && L[k]) {
    // süperset: grubun bir sonraki hareketine dinlenmeden geç; tur bitince dinlen
    const g = items.map((x, j) => j).filter(j => L[j] && L[j][0] === L[k][0]);
    const nextInGroup = g.slice(g.indexOf(k) + 1).find(j => workDone(items[j]) < target(items[j]));
    if (nextInGroup != null) { state.live.idx = nextInGroup; rest = false; }
    else { const open = g.find(j => workDone(items[j]) < target(items[j])); if (open != null) state.live.idx = open; else advance(); }
  } else if (!warm && workDone(it) >= target(it)) advance();
  save();
  if (rest) startTimer(restFor(it.ex));
  renderFocus();
}
// Antrenman sırasında tamamlanan sete dokunmak onu siler; cepteyken yanlışlıkla olmasın diye önce sorar
export async function removeDoneSet(i){
  const it = liveItems()[state.live.idx], e0 = state.entries.find(x => x.date === state.live.date && x.ex === it.ex);
  if (!e0 || !e0.sets[i]) return;
  if (!(await ask(t("live.confirm_del_set", { n: i + 1, set: setLabel(e0.sets[i], isCardio(it.ex)) })))) return;
  const e = state.entries.find(x => x.date === state.live.date && x.ex === it.ex);
  if (!e || !e.sets[i]) return;
  const [s] = e.sets.splice(i, 1); let pos = -1;
  if (state.live.sides) delete state.live.sides[it.ex];
  if (!e.sets.length) { pos = state.entries.indexOf(e); state.entries.splice(pos, 1); }
  save(); renderFocus(); buzz(15);
  undoable(t("live.set_deleted"), () => { e.sets.splice(i, 0, s); if (pos >= 0) state.entries.splice(pos, 0, e); save(); renderFocus(); });
}
export function editExNote(ex){
  const body = openSheet(sheetHead(t("live.ex_note")), `<details class="small i-help" style="margin-top:0"><summary class="muted small" aria-label="${t("live.help_aria")}">${ic("info")}</summary>${t("live.note_help_html", { ex: esc(ex) })}</details>
    <textarea id="enText" rows="3" placeholder="${t("live.note_ph")}">${esc(state.exNotes[ex] || "")}</textarea>
    <button class="btn primary block" id="enSave" style="margin-top:12px">${ic("check")}${t("live.save")}</button>`);
  $("#enSave").onclick = () => { const v = $("#enText").value.trim(); if (v) state.exNotes[ex] = v; else delete state.exNotes[ex]; save(); closeSheet(); renderFocus(); };
}
export function openExPrefs(it){
  const p = state.exPrefs[it.ex] || {};
  const opts = (vals, cur, def, f) => `<option value="">${def}</option>` + vals.map(v => `<option value="${v}"${+cur === v ? " selected" : ""}>${f(v)}</option>`).join("");
  openSheet(sheetHead(it.ex), `<div class="grid2">
      <div><label for="xpSets">${t("live.f_sets")}</label><select id="xpSets">${[1,2,3,4,5,6,7,8].map(v => `<option${v === (it.sets || 3) ? " selected" : ""}>${v}</option>`).join("")}</select></div>
      <div><label for="xpReps">${t("live.f_target_reps")}</label><input id="xpReps" value="${esc(it.reps || "")}" placeholder="8-12"></div>
      <div><label for="xpRest">${t("live.f_rest")}</label><select id="xpRest">${opts([30,45,60,90,120,150,180,240,300], p.rest, t("live.default_val", { v: mmss(state.rest) }), mmss)}</select></div>
      <div><label for="xpStep">${t("live.f_step")}</label><select id="xpStep">${opts([1,1.25,2,2.5,5], p.step, t("live.auto_kg", { kg: fmt(defaultStep(it.ex)) }), v => fmt(v) + " " + t("live.u_kg"))}</select></div>
      <div><label for="xpBar">${t("live.f_bar")}</label><select id="xpBar"><option value="">${t("live.auto_kg", { kg: fmt(barFor(it.ex)) })}</option>${[20,15,10,0].map(v => `<option value="${v}"${p.bar === v ? " selected" : ""}>${v ? fmt(v) + " " + t("live.u_kg") : t("live.no_bar")}</option>`).join("")}</select></div>
      <div><label for="xpTimed">${t("live.f_kind")}</label><select id="xpTimed"><option value="">${t("live.auto_kind", { kind: timedByDefault(it.ex) ? t("live.kind_timed") : t("live.kind_reps") })}</option><option value="1"${p.timed === true ? " selected" : ""}>${t("live.kind_timed_opt")}</option><option value="0"${p.timed === false ? " selected" : ""}>${t("live.l_reps")}</option></select></div>
      <div style="grid-column:1/-1"><label for="xpInc">${t("live.f_inc")}</label><select id="xpInc">${opts([1,1.25,2,2.5,5,10], p.inc, t("live.auto_kg", { kg: fmt(defaultInc(it.ex)) }), v => "+" + fmt(v) + " " + t("live.u_kg"))}</select></div>
    </div>
    <details class="small i-help"><summary class="muted small" aria-label="${t("live.help_aria")}">${ic("info")}</summary>${t("live.prefs_help")}</details>
    <div class="row" style="margin-top:6px"><button class="btn quiet danger" id="xpRemove">${ic("trash-2")}${t("live.remove")}</button><span class="grow"></span><button class="btn primary" id="xpSave">${ic("check")}${t("live.save")}</button></div>`);
  $("#xpSave").onclick = () => {
    it.sets = +$("#xpSets").value; it.reps = $("#xpReps").value.trim();
    const np = { rest: +$("#xpRest").value || undefined, step: +$("#xpStep").value || undefined, inc: +$("#xpInc").value || undefined,
      bar: $("#xpBar").value === "" ? undefined : +$("#xpBar").value, timed: $("#xpTimed").value === "" ? undefined : $("#xpTimed").value === "1" };
    delete fDraft[it.ex];
    Object.keys(np).forEach(k => np[k] === undefined && delete np[k]);
    if (Object.keys(np).length) state.exPrefs[it.ex] = np; else delete state.exPrefs[it.ex];
    save(); closeSheet(); renderFocus();
  };
  $("#xpRemove").onclick = async () => {
    closeSheet();
    if (!(await ask(t("live.confirm_remove", { ex: it.ex }), t("live.remove")))) return;
    const items = liveItems(), i = items.indexOf(it); if (i < 0) return;
    items.splice(i, 1); if (state.live.sides) delete state.live.sides[it.ex]; save(); closeSheet(); renderFocus();
    undoable(t("live.removed", { ex: it.ex }), () => { items.splice(i, 0, it); state.live.idx = i; save(); renderFocus(); });
  };
}
export async function finishWorkout(){
  const { start, date, prs } = state.live;
  const lifts = () => state.entries.filter(e => e.date === date && !isCardio(e.ex));
  const n = lifts().reduce((a, e) => a + work(e.sets).length, 0);
  if (!(await ask(t("live.confirm_finish", { dur: durText(Date.now() - start), n }), t("live.finish")))) return;
  const end = Date.now();
  if (state.entries.some(e => e.date === date)) state.sessions.push({ id: uid(), date, start, end, prog: state.live.prog || null });
    state.live = null; state.active = null; save();
  stopTimer(); keepAwake(false); buzz([40, 60, 40]);
  closeFocus(); showTab("home");
  setTimeout(() => toast(n ? (prs ? t("live.done_toast_prs", { dur: durText(end - start), n, prs }) : t("live.done_toast", { dur: durText(end - start), n })) : t("live.closed"), n ? "biceps-flexed" : "check"), 50);
  // toast'ın ardından, ekranı meşgul etmeden
  setTimeout(() => { runSync(false); runCal(false); }, 2500);
  // seri arttıysa kutla (bitiş bildiriminden sonra)
  if (state.entries.some(e => e.date === date)) setTimeout(celebrateStreak, 1600);
}
export function renderLiveBar(){
  const show = !!state.live && $("#focus").classList.contains("hidden");
  $("#liveBar").classList.toggle("hidden", !show); document.body.classList.toggle("has-livebar", show);
  if (show) { const it = liveItems()[state.live.idx || 0]; $("#liveBarTxt").textContent = it ? it.ex : ""; $("#liveBarTime").textContent = elapsedText(); }
}

// Düğme bağlamaları ve ilk hazırlıklar: main.js'teki açılış sırasında çağrılır
export function setup(){
$("#startEmpty").onclick = () => startWorkout(null);
$("#fMin").onclick = closeFocus;
$("#liveBar").onclick = openFocus;
$("#fPrev").onclick = () => gotoItem(state.live.idx - 1);
$("#fNext").onclick = () => gotoItem(state.live.idx + 1);
$("#fBody").addEventListener("touchstart", e => {
  if (e.target.closest(".stepper, .f-chips, input, button")) { swX = null; return; }
  swX = e.touches[0].clientX; swY = e.touches[0].clientY;
}, { passive: true });
$("#fBody").addEventListener("touchend", e => {
  if (swX == null) return;
  const dx = e.changedTouches[0].clientX - swX, dy = e.changedTouches[0].clientY - swY; swX = null;
  if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) gotoItem(state.live.idx + (dx < 0 ? 1 : -1));
}, { passive: true });
$("#fComplete").onclick = () => { const it = liveItems()[state.live.idx]; if (it && isTimed(it.ex)) toggleHold(); else completeSet(); };
$("#fEnd").onclick = finishWorkout;
setInterval(() => {
  if (!state.live) return;
  const el = elapsedText();
  $("#fElapsed").textContent = el; $("#liveBarTime").textContent = el;
  const h = $("#homeLiveT"); if (h) h.textContent = el;
}, 1000);
}
