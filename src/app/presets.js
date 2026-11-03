// Hazır programlar ve "Bana program öner". İçerik ve öneri kuralları core/programs.ts'te.
import { PROGRAMS, programById, recommend, weeklyPlan } from "../core/programs.ts";
import { $, esc, ic, save, state, toast, uid } from "./store.js";
import { buzz, closeSheet, openSheet, sheetHead, refreshAll } from "./ui.js";
import { renderProg, WEEKDAYS } from "./programs.js";
import { syncCanRun, connectDrive } from "./cloud.js";
import { openBaseline } from "./baseline.js";

const LEVEL = { yeni: "Yeni başlayan", orta: "Orta seviye", ileri: "İleri seviye" };
const GOAL = { genel: "Genel sağlık", kas: "Kas", guc: "Güç", esneklik: "Esneklik, yoga" };
const EQUIP = { salon: "Spor salonu", ev: "Evde dumbbell", yok: "Ekipmansız" };
const dayName = code => (WEEKDAYS.find(w => w[0] === code) || [code, code])[1];
const chips = p => `<div class="row" style="gap:6px;margin:8px 0 4px;flex-wrap:wrap">${[...p.levels.map(l => LEVEL[l]), EQUIP[p.equip], p.days.join(" / ") + " gün/hafta"].map(t => `<span class="chip">${esc(t)}</span>`).join("")}</div>`;
const list = arr => `<ul style="margin:6px 0 0;padding-left:20px;display:grid;gap:6px">${arr.map(t => `<li>${esc(t)}</li>`).join("")}</ul>`;

// Programın seanslarını kullanıcının programlarına ekler (aynısı varsa yeniden eklemez); istenirse haftalık plana yerleştirir.
export function applyProgram(p, days, placeInPlan){
  const ids = p.sessions.map(s => {
    const name = p.sessions.length > 1 ? `${p.name} · ${s.name}` : p.name;
    let prog = state.programs.find(x => x.lib === p.id && x.name === name);
    if (!prog) {
      prog = { id: uid(), name, lib: p.id, items: s.items.map(([ex, sets, reps]) => ({ ex, sets, reps })) };
      state.programs.push(prog);
    }
    return prog.id;
  });
  if (placeInPlan) {
    const old = state.plan.days, next = {};
    for (const [code, i] of weeklyPlan(p, days)) next[code] = { prog: ids[i], time: (old[code] && old[code].time) || "19:00" };
    state.plan.days = next; state.goal = days;
  }
  save(); renderProg(); refreshAll(); buzz(15);
  toast(placeInPlan ? `${p.name} haftalık planına yerleşti` : `${p.name} programlarına eklendi`, "check");
}

// Program ayrıntısı. onClose: ilk açılıştan gelindiyse kapanınca "ilk açılış tamam" işaretlemek için.
export function openProgramDetail(p, days, onClose){
  let d = p.days.includes(days) ? days : p.days[0], place = true;
  const planSummary = () => weeklyPlan(p, d).map(([c, i]) => `${dayName(c)}: ${p.sessions.length > 1 ? p.sessions[i].name : "antrenman"}`).join(" · ");
  const hasPlan = Object.keys(state.plan.days).length > 0;
  openSheet(sheetHead(p.name),
    `<p class="muted" style="margin:0">${esc(p.short)}</p>${chips(p)}
     <div class="pk-head">Kime uygun</div><p style="margin:4px 0 0">${esc(p.who)}</p>
     <div class="pk-head">Haftada kaç gün</div><div class="optgrid" id="pdDays">${p.days.map(n => `<button class="fchip${n === d ? " on" : ""}" data-v="${n}">${n} gün</button>`).join("")}</div>
     <p class="muted small" id="pdPlan" style="margin:8px 0 0"></p>
     ${p.sessions.map(s => `<div class="pk-head">${esc(p.sessions.length > 1 ? "Antrenman " + s.name : "Antrenman")}</div>
       <div style="display:grid;gap:4px;margin-top:4px">${s.items.map(([ex, sets, reps]) => `<div class="row" style="flex-wrap:nowrap"><span class="grow">${esc(ex)}</span><span class="chip">${sets} × ${esc(reps)}</span></div>`).join("")}</div>`).join("")}
     <div class="pk-head">Nasıl ilerlenir</div>${list(p.progression)}
     <div class="pk-head">Takılırsan</div><p style="margin:4px 0 0">${esc(p.stall)}</p>
     <div class="pk-head">Başlarken</div>${list(p.tips)}
     <p class="muted small" style="margin-top:14px">Kaynak: ${esc(p.source)}</p>
     <label class="check row" style="margin:14px 0 0;gap:10px;flex-wrap:nowrap"><input type="checkbox" id="pdPlace" checked><span>Haftalık plana yerleştir${hasPlan ? " (mevcut planın yerine geçer)" : ""}</span></label>
     <button class="btn primary xl" id="pdGo" style="margin-top:12px">${ic("play")}Bu programla başla</button>`,
    onClose);
  const renderPlan = () => { $("#pdPlan").textContent = planSummary(); };
  $("#pdDays").querySelectorAll("button").forEach(b => b.onclick = () => {
    d = +b.dataset.v; $("#pdDays").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); renderPlan(); buzz(5);
  });
  $("#pdPlace").onchange = e => { place = e.target.checked; };
  $("#pdGo").onclick = () => { applyProgram(p, d, place); closeSheet(); };
  renderPlan();
}

export function openLibrary(){
  openSheet(sheetHead("Hazır programlar"),
    `<p class="muted" style="margin:0 0 10px">Bir programa dokun: kime uygun olduğunu, haftalık düzenini ve nasıl ilerleneceğini gör.</p>
     ${PROGRAMS.map(p => `<button class="libitem" data-pid="${p.id}"><b>${esc(p.name)}</b><span class="muted small" style="display:block;margin-top:2px">${esc(p.short)}</span>${chips(p)}</button>`).join("")}
     <button class="btn" id="libRec" style="width:100%;justify-content:center;margin-top:4px">${ic("lightbulb")}Hangisi bana uygun?</button>`);
  $("#bsBody").querySelectorAll("[data-pid]").forEach(b => b.onclick = () => openProgramDetail(programById(b.dataset.pid), 3));
  $("#libRec").onclick = () => openRecommender();
}

// Dört soru, cevap değiştikçe öneri güncellenir. onboarding: ilk açılışta, üstte "Atla" ile.
export function openRecommender({ onboarding = false } = {}){
  const a = { level: "yeni", goal: "genel", equip: "salon", days: 3 };
  const markDone = onboarding ? () => { state.onboarded = true; save(); } : undefined;
  const q = (key, title, opts) => `<div class="pk-head">${title}</div><div class="optgrid" data-q="${key}">${opts.map(([v, l]) => `<button class="fchip${String(a[key]) === String(v) ? " on" : ""}" data-v="${v}">${l}</button>`).join("")}</div>`;
  const head = onboarding
    ? `<div class="row" style="align-items:flex-start;margin-top:6px"><div class="grow"><div class="eyebrow">Hoş geldin</div>
         <h3 style="font-size:26px;margin:4px 0 6px;letter-spacing:-.035em">Sana uygun programı bulalım</h3></div>
         <button class="btn quiet" id="obSkip" style="flex:none">Atla</button></div>
       <p class="muted" style="margin:0 0 4px">Dört soru; önerim hemen aşağıda çıkar. Ne yapacağını biliyorsan atla, programını kendin kur.</p>`
    : sheetHead("Bana program öner");
  openSheet(head,
    q("level", "Deneyimin", [["yeni", "Hiç / çok az"], ["orta", "6 ay – 2 yıl"], ["ileri", "2 yıldan fazla"]])
    + q("goal", "Önceliğin", [["genel", "Sağlık, kondisyon"], ["kas", "Kas kazanmak"], ["guc", "Güçlenmek"], ["esneklik", "Esneklik, yoga"]])
    + q("equip", "Nerede çalışacaksın", [["salon", "Spor salonu"], ["ev", "Evde, dumbbell var"], ["yok", "Ekipmansız"]])
    + q("days", "Haftada kaç gün", [2, 3, 4, 5, 6].map(n => [n, n + " gün"]))
    + `<div id="recOut" style="margin-top:16px"></div>`
    + (onboarding ? `<button class="ghost" id="obBase" style="width:100%;justify-content:center;margin-top:8px">${ic("trending-up")}Başka uygulamadan geliyorum: mevcut kilolarımı gir</button>` : "")
    + (onboarding && syncCanRun() ? `<button class="ghost" id="obDrive" style="width:100%;justify-content:center;margin-top:8px">${ic("cloud")}Başka cihazda kullanıyorum: Drive'dan getir</button>` : ""),
    markDone);

  const render = () => {
    const r = recommend(a), p = r.program;
    $("#recOut").innerHTML = `<div class="card" style="margin:0;background:var(--card2)">
        <div class="eyebrow">Önerim</div>
        <div style="font-size:22px;font-weight:800;letter-spacing:-.02em;margin:2px 0 4px">${esc(p.name)}</div>
        <div class="muted small">${esc(p.short)} · haftada ${r.days} gün</div>
        ${list(r.reasons)}
        <div class="row" style="margin-top:12px">
          <button class="btn primary" id="${onboarding ? "obGo" : "recGo"}">${ic("play")}Bu programla başla</button>
          <button class="btn" id="recMore">Ayrıntılar</button>
        </div>
        ${r.alternatives.length ? `<div class="pk-head">Alternatif</div>${r.alternatives.map(x => `<button class="libitem" data-alt="${x.program.id}" data-days="${x.days}" style="margin:6px 0 0"><b>${esc(x.program.name)}</b><span class="muted small" style="display:block">${esc(x.why)}</span></button>`).join("")}` : ""}
      </div>`;
    $("#recOut").querySelector(onboarding ? "#obGo" : "#recGo").onclick = () => {
      applyProgram(p, r.days, true); closeSheet();
      // ilk açılışta: programdaki hareketler için şu anki kilolar sorulur
      if (onboarding) openBaseline({ onboarding: true, exercises: [...new Set(p.sessions.flatMap(x => x.items.map(([ex]) => ex)))] });
    };
    $("#recMore").onclick = () => openProgramDetail(p, r.days, markDone);
    $("#recOut").querySelectorAll("[data-alt]").forEach(b => b.onclick = () => openProgramDetail(programById(b.dataset.alt), +b.dataset.days, markDone));
  };
  $("#bsBody").querySelectorAll("[data-q]").forEach(g => g.querySelectorAll("button").forEach(b => b.onclick = () => {
    const k = g.dataset.q; a[k] = k === "days" ? +b.dataset.v : b.dataset.v;
    g.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); buzz(5); render();
  }));
  if (onboarding) {
    $("#obSkip").onclick = closeSheet;
    $("#obBase").onclick = () => { closeSheet(); openBaseline({ onboarding: true }); };
    // başlangıç programı oluşturmadan bağlanır; yoksa programlar iki cihazda farklı kimlikle iki kez oluşur
    if ($("#obDrive")) $("#obDrive").onclick = () => { closeSheet(); connectDrive(); };
  }
  render();
}

export function setup(){
  $("#recOpen").onclick = () => openRecommender();
  $("#libOpen").onclick = openLibrary;
}
