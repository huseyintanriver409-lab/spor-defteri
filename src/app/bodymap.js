import { WEEKLY_TIERS, weeklyTier } from "../core/weekly-load.ts";
import { visibleSessionTiers, sessionTierRange } from "../core/session-legend.ts";
import { programItems } from "../core/program-data.ts";
import { discoverableEx } from "./exercises.js";
import { bindEquipmentEmpty, equipmentEmptyHTML, openEquipment } from "./equipment.js";
import { bodyModel } from "../core/body-model.ts";
import { sorenessPossible } from "../core/recovery.ts";
import { programName } from "../core/programs.ts";
// Vücut haritası: önden ve arkadan kaslar; renk kademesi core/musclemap.ts'ten. Kasa dokununca o kasın hareketleri açılır.
import { mondayOf, shortDate, ymd } from "../core/dates.ts";
import { fmtNum, locale, t } from "../core/i18n.ts";
import { work } from "../core/training.ts";
import { FATIGUE_TIERS, LOAD_TIERS, MUSCLES, SESSION_TIERS, sessionLoad, fatigueTier, loadTier, rankForMuscle, sessionBreakdown, sessionTier, setsByMuscle, weightsOf, EVIDENCE, SUMMARY, MAIN_SHARE, MUSCLE_COMMON, muscleLabel } from "../core/musclemap.ts";
import { $, YOGA, esc, fmt, ic, save, state } from "./store.js";
import { equipLabel, equipOf, equipTag, isCardio, isSport, musclesOf, pickableEx, unassignedExercises } from "./exercises.js";
import { assignmentButton, bindMuscleAssignments } from "./muscleassign.js";
import { closeSheet, openSheet, segState, sheetHead, showTab } from "./ui.js";
import { resetEditor } from "./log.js";
import { liveItems, openFocus, startWorkout } from "./live.js";
import { recoveryMap } from "./stats.js";
import { ART } from "./bodyart.js";

// Çizimdeki bölge → uygulamadaki kas(lar). Omuz çizimde tek parça: önden ön+yan, arkadan arka+yan omuz; en yoğun olanın rengini alır.
const REGION = {
  front: { chest: ["Göğüs"], abs: ["Karın"], obliques: ["Oblik"], biceps: ["Biceps"], triceps: ["Triceps"], trapezius: ["Trapez"], deltoids: ["Ön Omuz", "Yan Omuz"],
    adductors: ["İç Bacak"], quadriceps: ["Quadriceps"], calves: ["Baldır"], tibialis: ["Baldır"], forearm: ["Önkol"] },
  back: { trapezius: ["Trapez"], "upper-back": ["Lat"], "lower-back": ["Bel"], deltoids: ["Arka Omuz", "Yan Omuz"], triceps: ["Triceps"], forearm: ["Önkol"],
    gluteal: ["Kalça"], hamstring: ["Hamstring"], adductors: ["İç Bacak"], calves: ["Baldır"] },
};
// Çizimde ayrı bölgesi olmayan kaslar: bölgenin alt parçaları (çizimdeki sırasıyla) başka kasa verilir.
// Arkada kürek kemiğinin üst parçası (infraspinatus) rotator manşet; altındaki teres major Lat'ta kalır.
const SPLIT = {
  m: { back: { "upper-back": [[0, 3], ["Rotator Manşet"]] }, front: {} },
  f: { back: { "upper-back": [[0, 2], ["Rotator Manşet"]] }, front: {} },
};
// iç bacak arkadan arka bacağın altında kalmasın diye en son çizilir
const ON_TOP = ["adductors"];
const RANK = { yok: 0, hazir: 1, toparlaniyor: 2, yorgun: 3, asiri: 4, "y-yok": 0, "y-baslangic": 1, "y-verimli": 2, "y-orta": 3, "y-dusukverim": 4,
  "g-yok": 0, "g-dusuk": 1, "g-koruma": 2, "g-minimum": 3, "g-iyi": 4, "g-yuksek": 5, "g-maksimum": 6, "g-hasar": 7, sec: 1, "assign-main": 2, "assign-secondary": 1 };
// haftalık yük "y-", tek antrenman yükü "g-" önekiyle
Object.assign(RANK, { "g-w-yok": 0, "g-w-az": 1, "g-w-orta": 2, "g-w-yeterli": 3, "g-w-yuksek": 4 });
const KINDS = { fatigue: FATIGUE_TIERS, load: LOAD_TIERS.map(([k, l, d]) => ["y-" + k, l, d]), session: SESSION_TIERS.map(([k, l, d]) => ["g-" + k, l, d]) };
const LABEL = Object.fromEntries(Object.values(KINDS).flat().map(([k, l]) => [k, l]));
LABEL["assign-main"] = t("muscles.assign_primary");
LABEL["assign-secondary"] = t("muscles.assign_secondary");
LABEL["g-yok"] = t("muscles.session_yok");
// All drawings use the independent model preference.
export const bodySex = () => bodyModel(state.prefs, state.profile.sex);

// Çizimin bölgeleri çizim sırasıyla: [anahtar, yollar, kaslar]; bölünen bölgenin ayrılan parçası "slug-x" anahtarıyla
function regionParts(sex, side){
  const art = ART[sex][side][1];
  const parts = art.flatMap(([slug, ds]) => {
    const sp = SPLIT[sex][side] && SPLIT[sex][side][slug];
    if (!sp) return [[slug, ds, REGION[side][slug]]];
    return [[slug, ds.filter((_, i) => !sp[0].includes(i)), REGION[side][slug]], [slug + "-x", ds.filter((_, i) => sp[0].includes(i)), sp[1]]];
  });
  const top = ([k]) => ON_TOP.includes(k);
  return [...parts.filter(p => !top(p)), ...parts.filter(top)];
}
// Kadın ve erkek çizimlerinin viewBox oranı farklı: aynı boyda görünsünler diye genişlik orana göre daralır (model değişince ölçek kaymaz).
const vbRatio = vb => { const [, , w, h] = vb.split(/\s+/).map(Number); return w / h; };
const MAX_RATIO = Math.max(...Object.values(ART).flatMap(a => Object.values(a).map(([vb]) => vbRatio(vb))));
function figure(side, tiers, caption, paintedTiers){
  const [vb] = ART[bodySex()][side], order = regionParts(bodySex(), side), wPct = (vbRatio(vb) / MAX_RATIO * 100).toFixed(2);
  const paths = order.map(([, ds, ms]) => {
    if (!ms) return ds.map(d => `<path class="bm-base" d="${d}"/>`).join("");
    const tier = ms.map(m => tiers[m] || "yok").reduce((x, y) => RANK[y] > RANK[x] ? y : x);
    if (ds.length) paintedTiers?.add(tier);
    const title = ms.map(m => esc(muscleLabel(m)) + (LABEL[tiers[m]] ? " · " + LABEL[tiers[m]] : "")).join(", ");
    return ds.map(d => `<path d="${d}" aria-label="${title}" data-m="${esc(ms.join("|"))}" data-t="${tier}"><title>${title}</title></path>`).join("");
  }).join("");
  const R = Object.values(tiers).includes("toparlaniyor") ? recoveryMap() : {};
  const front = new Set(regionParts(bodySex(), "front").flatMap(([, , ms]) => ms || []));
  const icons = [...new Set(order.flatMap(([, , ms]) => ms || []))]
    .filter(m => (side === "front" || !front.has(m)) && (tiers[m] === "g-hasar" || tiers[m] === "toparlaniyor" && sorenessPossible(R[m])))
    .map(m => `<g class="bm-soreness ${tiers[m] === "g-hasar" ? "bm-risk" : ""}" data-soreness="${esc(m)}" role="img" aria-label="${esc(muscleLabel(m) + ": " + t(tiers[m] === "g-hasar" ? "muscles.session_hasar" : "bodymap.soreness"))}"><title>${esc(muscleLabel(m) + ": " + t(tiers[m] === "g-hasar" ? "muscles.session_hasar" : "bodymap.soreness"))}</title><path d="M12 2 23 22H1Z"/><path d="M12 8v7m0 3v1"/></g>`).join("");
  if (icons) queueMicrotask(placeSorenessIcons);
  return `<figure><svg viewBox="${vb}" style="width:${wPct}%;margin:0 auto" role="img" aria-label="${t("bodymap.view_aria", { side: caption })}"><g class="bm-m">${paths}</g>${icons}</svg><figcaption>${caption}</figcaption></figure>`;
}
function placeSorenessIcons(){
  document.querySelectorAll("[data-soreness]").forEach(icon => {
    const svg = icon.closest("svg"), size = svg.viewBox.baseVal.height * .035;
    const boxes = [...svg.querySelectorAll("path[data-m]")].filter(p => p.dataset.m.split("|").includes(icon.dataset.soreness)).map(p => p.getBBox()).sort((a, b) => b.width * b.height - a.width * a.height);
    if (!boxes.length) return;
    const b = boxes[0];
    icon.setAttribute("transform", `translate(${b.x + b.width / 2 - size / 2} ${b.y + b.height / 2 - size / 2}) scale(${size / 24})`);
    icon.dataset.placed = "";
  });
}
// tiers: kas → kademe (yorgunluk, "y-" haftalık ya da "g-" tek antrenman yükü)
// large: ekran genişliğinde (Hareketler); plain: dokununca açılan pencerede yorgunluk bilgisi yok, yalnız hareketler
// toggle: model düğmesi (sayfa/kart başına en çok bir; küçük/önizleme/plain haritalarda verilmez)
export const modelToggle = () => { const f = bodySex() === "f", cur = t(f ? "html.gender_female" : "html.gender_male"), label = `${t("html.body_model_toggle")} (${t("html.body_model_now", { model: cur })})`;
  return `<button type="button" class="iconbtn bm-toggle" data-body-toggle aria-pressed="${f}" title="${esc(label)}" aria-label="${esc(label)}"><svg viewBox="0 0 24 24" class="bm-swap" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/></svg></button>`; };
export const bodyMap = (tiers, { tap = true, small = false, large = false, plain = false, toggle = false, paintedTiers } = {}) =>
  `<div data-tiers="${esc(JSON.stringify(tiers))}" class="bodymap${tap ? " tap" : ""}${small ? " small" : ""}${large ? " large" : ""}"${plain ? " data-plain" : ""}>${toggle ? modelToggle() : ""}${figure("front", tiers, t("bodymap.front"), paintedTiers)}${figure("back", tiers, t("bodymap.back"), paintedTiers)}</div>`;
// Hareket listesindeki küçük kas resmi: çizim bir kez <defs> içinde <g> olarak eklenir, her resim yalnız renkleri CSS
// değişkeniyle verir; resmin viewBox'ı çizimin ilgili yarısını keser (--r-<bölge>). Ana kas koyu, yardımcı açık; ana kasların çoğu hangi yüzdeyse o yüz çizilir.
const miniDone = new Set();
function miniSymbol(sex, side){
  const id = `mini-${sex}-${side}`;
  if (!miniDone.has(id)) {
    miniDone.add(id);
    const paths = regionParts(sex, side).map(([k, ds, ms]) => ds.map(d => `<path d="${d}" vector-effect="non-scaling-stroke"${ms ? ` style="fill:var(--r-${k},var(--mz))"` : ` style="fill:var(--bm-base)"`}/>`).join("")).join("");
    let box = $("#miniSymbols");
    if (!box) { document.body.insertAdjacentHTML("beforeend", `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs id="miniSymbols"></defs></svg>`); box = $("#miniSymbols"); }
    box.insertAdjacentHTML("beforeend", `<g id="${id}">${paths}</g>`);
  }
  return id;
}
// Tek hareketin kaslara verdiği uyarı, programdaki ölçekle aynı: pay araştırma verisinden (muscledata.ts WEIGHTS); yalnız kütüphane dışı/kullanıcı hareketlerinde yedek ana 1, yardımcı 0,5.
// Hareket listesinde ve kartlarda varsayılan 9 set (ana kas maksimum, yardımcılar payına göre) (kartta değiştirilebilir).
export const EX_SETS = 9;
const RANKED = SESSION_TIERS.map(([k]) => k).reverse();  // hasar → dusuk
export function exerciseTiers(m, sets = EX_SETS){
  const ex = typeof m === "string" ? m : m.ex || "";
  const load = sessionLoad([{ ex, sets }], typeof m === "string" ? musclesOf : () => m);
  return Object.fromEntries(Object.entries(load).map(([muscle, value]) => [muscle, value.tier]));
}
// kademeye göre gruplu: [[kademe, ad, kaslar], …] en yüksek kademe önce
export const exerciseLevels = (m, sets = EX_SETS) => { const t = exerciseTiers(m, sets);
  return RANKED.map(k => [k, LABEL["g-" + k], Object.keys(t).filter(x => t[x] === k)]).filter(([, , ms]) => ms.length); };
// bir yüzün bölgelerine kademe rengi (CSS değişkeniyle, çizim <defs>'te bir kez); birden çok kaslı bölge en yükseğini alır
const paint = (sex, side, m, sets = EX_SETS) => { const t = exerciseTiers(m, sets);
  return regionParts(sex, side).filter(([, , ms]) => ms).map(([k, , ms]) => {
    const best = ms.map(x => t[x]).filter(Boolean).sort((a, b) => RANKED.indexOf(a) - RANKED.indexOf(b))[0];
    return best ? `--r-${k}:var(--g-${best})` : "";
  }).filter(Boolean).join(";"); };
// ekran okuyucu için kısa özet: kademe adı + kaslar (görünür metin eklemez)
const levelsLabel = (m, sets = EX_SETS) => exerciseLevels(m, sets).map(([, l, ms]) => `${l}: ${ms.map(muscleLabel).join(", ")}`).join("; ");
export function miniMap(name){
  const source = musclesOf(name); if (!Object.values(weightsOf(source)).some(w => w > 0)) return "";
  const m = { ...source, p: source.p.length ? source.p : source.s };
  const sex = bodySex(), hits = side => Object.values(REGION[side]).flat().filter(x => m.p.includes(x)).length
    + (m.p.includes("Rotator Manşet") && side === "back" ? 1 : 0);
  const hb = hits("back"), hf = hits("front"), firstBack = Object.values(REGION.back).flat().includes(m.p[0]) || m.p[0] === "Rotator Manşet";
  const side = hb > hf || (hb === hf && firstBack) ? "back" : "front";
  // yalnız üst ya da alt vücut çalışıyorsa o yarıya yakınlaştırılır
  const LEGS = ["Quadriceps", "Hamstring", "Kalça", "İç Bacak", "Baldır"], legs = m.p.filter(x => LEGS.includes(x)).length;
  const [x, y, w, h] = ART[sex][side][0].split(" ").map(Number);
  const vb = !legs ? [x, y, w, h * .5] : legs === m.p.length ? [x, y + h * .42, w, h * .58] : [x, y, w, h];
  return `<svg class="minimap" data-exercise="${esc(name)}" viewBox="${vb.join(" ")}" style="${paint(sex, side, m)}" role="img" aria-label="${esc(levelsLabel(m))}"><use href="#${miniSymbol(sex, side)}"/></svg>`;
}
// (i) düğmesi arkasında açılan açıklama (sayfa içeriği .card olmadığı için <details>)
const infoTip = inner => `<details class="ev-help i-help"><summary class="muted small" aria-label="${t("bodymap.help_aria")}">${ic("info")}</summary>${inner}</details>`;
const mt = k => t("muscles." + k);
export const legend = (kind, paintedTiers) => {
  if (kind === "weekly") {
    const tiers = WEEKLY_TIERS.filter(k => paintedTiers?.has("g-w-" + k));
    const ranges = { az: "<5", orta: "5–" + fmtNum(9.5), yeterli: "10–20", yuksek: ">20" };
    return tiers.length ? `<div class="bm-legend" data-legend-kind="weekly">${tiers.map(k => `<span><i data-t="g-w-${k}" aria-hidden="true"></i>${mt("weekly_" + k)}<small class="bm-range">${esc(ranges[k])}</small></span>`).join("")}</div>` : "";
  }
  const visible = kind === "session" ? new Set(visibleSessionTiers(paintedTiers).map(k => "g-" + k)) : null;
  const tiers = KINDS[kind].filter(([k]) => !visible || visible.has(k));
  if (!tiers.length) return "";
  if (kind === "session") return `<div class="bm-legend" data-legend-kind="session">${tiers.map(([k]) => `<span><i data-t="${k}" aria-hidden="true"></i>${esc(k === "g-hasar" ? mt("session_stretch") : sessionTierRange(k.slice(2)))}</span>`).join("")}</div>`;
  return `<div class="bm-legend">${tiers.map(([k, l]) => {
    return `<span aria-label="${esc(l)}"><i data-t="${k}" aria-hidden="true"></i>${l}</span>`;
  }).join("")}</div>` + infoTip(tiers.map(([, l, d]) => `<div class="small"><b>${l}:</b> ${d}</div>`).join(""));
};
export function weeklyLoadHTML(result, { tap = false, small = true } = {}) {
  if (!result) return "";
  const paintedTiers = new Set(), { load, averaged } = result;
  const tiers = Object.fromEntries(Object.entries(load).map(([m, sets]) => [m, "g-w-" + weeklyTier(sets)]));
  return `<div class="pk-head">${mt(averaged ? "weekly_average" : "weekly")}</div>`
    + bodyMap(tiers, { tap, small, paintedTiers }) + legend("weekly", paintedTiers);
}
// ilk cümle görünür, gerisi "Ayrıntı" arkasında ("vb.", "ör." gibi kısaltmalarda bölünmez)
const ABBR = /(?:vb|vs|ör|bkz|yak|sn|dk)\.$/i;
function firstSentence(text){
  const re = /[.!?](?=\s+[A-ZÇĞİÖŞÜ0-9])/g; let m;
  while ((m = re.exec(text))) { const head = text.slice(0, m.index + 1); if (!ABBR.test(head)) return [head, text.slice(m.index + 1).trim()]; }
  return [text, ""];
}
const summaryHTML = (m, cls) => { if (!SUMMARY[m]) return ""; const [a, b] = firstSentence(SUMMARY[m]);
  return `<p class="${cls}">${esc(a)}</p>` + (b ? `<details class="ev-help"><summary class="muted small">${t("bodymap.detail")}</summary><p class="${cls}">${esc(b)}</p></details>` : ""); };

export const fatigueTiers = (R = recoveryMap()) => Object.fromEntries(MUSCLES.map(m => [m, fatigueTier(R[m])]));
export const loadTiers = ms => Object.fromEntries(MUSCLES.map(m => [m, "y-" + loadTier(ms[m] || 0)]));
export const sessionTiers = ms => Object.fromEntries(MUSCLES.map(m => [m, "g-" + sessionTier(ms[m] || 0)]));
// bu haftanın etkili setleri (Pazartesiden bugüne)
export function weekSets(){
  const a = ymd(mondayOf(new Date()));
  return setsByMuscle(state.entries.filter(e => e.date >= a && isSport(e.ex)).map(e => ({ ex: e.ex, sets: work(e.sets).length })), musclesOf);
}
// Dokunulan yerdeki kaslar, yakından uzağa: önce tam üstüne basılan, sonra parmak ucu kadar çevredekiler.
// Telefonda küçük kalan bölgeler (rotator manşet gibi) parmakla tam tutturulamaz; yakındakiler pencerede düğme olur.
const FINGER_PX = 22;
function hitMuscles(svg, e){
  const out = [], add = el => el.dataset.m.split("|").forEach(m => { if (!out.includes(m)) out.push(m); });
  const own = e.target.closest("[data-m]"); if (own) add(own);
  const ctm = svg.getScreenCTM(), pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const p = pt.matrixTransform(ctm.inverse()), unit = 1 / Math.hypot(ctm.a, ctm.b), els = [...svg.querySelectorAll("[data-m]")];
  for (let px = 3; px <= FINGER_PX; px += 3)
    for (let k = 0; k < 16; k++) {
      const q = svg.createSVGPoint(); q.x = p.x + px * unit * Math.cos(k * Math.PI / 8); q.y = p.y + px * unit * Math.sin(k * Math.PI / 8);
      els.forEach(el => { if (el.isPointInFill(q)) add(el); });
    }
  // tam üstüne basılmadıysa en yakını açılır; yakında hiç kas yoksa daha geniş bakılır
  if (!out.length) for (let px = FINGER_PX; px <= FINGER_PX * 2 && !out.length; px += 4)
    for (let k = 0; k < 16; k++) {
      const q = svg.createSVGPoint(); q.x = p.x + px * unit * Math.cos(k * Math.PI / 8); q.y = p.y + px * unit * Math.sin(k * Math.PI / 8);
      const hit = els.find(el => el.isPointInFill(q)); if (hit) { add(hit); break; }
    }
  return out.slice(0, 5);
}
// onTap verilirse dokunulan kaslar ona gider (ana sayfa: toparlanma analizi)
export function redrawBodyMaps(){
  document.querySelectorAll(".minimap[data-exercise]").forEach(svg => { svg.outerHTML = miniMap(svg.dataset.exercise); });
  document.querySelectorAll(".bm-toggle").forEach(b => { b.outerHTML = modelToggle(); });
  document.querySelectorAll(".bodymap[data-tiers]").forEach(map => {
    const box = document.createElement("div"), tiers = JSON.parse(map.dataset.tiers), painted = new Set();
    box.innerHTML = figure("front", tiers, t("bodymap.front"), painted) + figure("back", tiers, t("bodymap.back"), painted);
    const scale = map.nextElementSibling;
    if (scale?.dataset.legendKind) scale.outerHTML = legend(scale.dataset.legendKind, painted);
    // Preserve SVG elements and their existing hit handlers.
    map.querySelectorAll("figure svg").forEach((svg, i) => {
      const next = box.querySelectorAll("svg")[i];
      svg.setAttribute("viewBox", next.getAttribute("viewBox"));
      svg.setAttribute("style", next.getAttribute("style"));
      svg.innerHTML = next.innerHTML;
    });
  });
}
export function bindBodyMap(root, onTap){
  bindMuscleAssignments(root, () => {
    root.querySelectorAll("[data-session-load]").forEach(box => {
      box.outerHTML = sessionLoadHTML(JSON.parse(box.dataset.sessionLoad), { tap: box.dataset.tap === "true", small: box.dataset.small === "true" });
    });
    bindBodyMap(root, onTap);
  });
  root.querySelectorAll(".bodymap.tap figure svg").forEach(svg => svg.onclick = e => {
    const ms = hitMuscles(svg, e); if (!ms.length) return;
    e.stopPropagation();
    if (onTap) onTap(ms); else if (svg.closest("[data-plain]")) openMuscleReel(ms[0], ms); else openMuscleSheet(ms[0], ms);
  });
}

// Genel yorgunluk: son 4 günde çalışan kasların ortalama kalan yorgunluğu (1 − toparlanma oranı), 5 kademe.
// Kas başına toparlanma core/recovery.ts'teki araştırmaya dayalı sürelerle; bu özet yalnız onların ortalaması.
export const FATIGUE_LEVELS = [t("bodymap.fl_0"), t("bodymap.fl_1"), t("bodymap.fl_2"), t("bodymap.fl_3"), t("bodymap.fl_4"), t("bodymap.fl_5")];
export function fatigueSummary(R = recoveryMap()){
  const recent = Object.values(R).filter(r => r.hrs < Math.max(96, r.need));
  const score = recent.length ? recent.reduce((a, r) => a + (1 - r.pct), 0) / recent.length : 0;
  const lvl = score <= 0 ? 0 : Math.min(5, 1 + Math.floor(score * 5));
  return { lvl, label: FATIGUE_LEVELS[lvl] };
}
export const levelBar = lvl => `<div class="lvlbar" data-l="${lvl}" aria-hidden="true">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= lvl ? "on" : ""}"></i>`).join("")}</div>`;

// Toparlanma analizi: genel seviye, harita ve kas kas ne zaman hazır olacağı (hareket listesi yok)
export function openRecoveryAnalysis(focus){
  const R = recoveryMap(), { lvl, label } = fatigueSummary(R);
  const rows = MUSCLES.filter(m => R[m]).map(m => ({ m, r: R[m], t: fatigueTier(R[m]) })).sort((a, b) => a.r.pct - b.r.pct || muscleLabel(a.m).localeCompare(muscleLabel(b.m), locale()));
  const left = r => r.pct >= 1 ? t("bodymap.ready") : (h => h < 1 ? t("bodymap.lt_1h") : h < 24 ? t("bodymap.hours", { n: h }) : t("bodymap.days_hours", { d: Math.floor(h / 24), h: h % 24 }))(Math.ceil(r.need - r.hrs));
  const body = openSheet(sheetHead(t("bodymap.analysis_title")),
    `<div class="row" style="align-items:flex-end;margin-bottom:6px"><div class="grow">
       <div style="font-size:26px;font-weight:800;letter-spacing:-.02em">${label}</div>${levelBar(lvl)}</div></div>
     ${infoTip(`<p class="muted small" style="margin:4px 0">${t("bodymap.analysis_avg")}</p>`)}
     ${bodyMap(fatigueTiers(R), { tap: false, toggle: true })}${legend("fatigue")}
     ${rows.length ? `<div style="margin-top:14px">` + rows.map(({ m, r, t: tier }) => `<div class="exitem rec-row${m === focus ? " hl" : ""}" data-rm="${esc(m)}">
       <i class="bm-dot" data-t="${tier}" role="img" aria-label="${LABEL[tier]}" title="${LABEL[tier]}" style="margin-right:6px"></i><div class="grow"><div>${esc(muscleLabel(m))}</div>
       <div class="ms">${t("bodymap.sets_n", { n: fmt(r.sets) })} · ${shortDate(r.date)}${r.fail ? " · " + t("bodymap.failure") : ""}</div></div><b>${left(r)}</b></div>`).join("") + `</div>`
     : `<p class="muted">${t("bodymap.no_records")}</p>`}`);
  const f = focus && [...body.querySelectorAll("[data-rm]")].find(x => x.dataset.rm === focus);
  if (f) setTimeout(() => f.scrollIntoView({ block: "center" }), 50);
}

// Tek antrenmanın kaslara verdiği uyarı: harita, renk açıklaması; tek günde fazla yüklenen kaslarda hangi hareketlerden geldiği
export function sessionLoadHTML(items, { tap = false, small = true } = {}){
  const list = items.filter(i => i.ex && isSport(i.ex)).map(i => ({ ex: i.ex, sets: i.sets ?? EX_SETS }));
  const load = sessionLoad(list, musclesOf), missing = unassignedExercises(list);
  const paintedTiers = new Set();
  if (!Object.keys(load).length && !missing.length) return "";
  const heavy = Object.entries(load).filter(([, r]) => r.tier === "hasar").map(([m]) => muscleLabel(m));
  return `<div data-session-load="${esc(JSON.stringify(list))}" data-tap="${tap}" data-small="${small}">`
    + (Object.keys(load).length ? bodyMap(Object.fromEntries(Object.entries(load).map(([m, r]) => [m, "g-" + r.tier])), { tap, small, paintedTiers }) + legend("session", paintedTiers) : "")
    + (heavy.length ? `<p class="muscle-risk" role="status">⚠ ${esc(t("muscles.session_risk", { muscles: heavy.join(", ") }))}</p>` : "")
    + (missing.length ? `<div class="muscle-unassigned row"><span class="grow">${esc(t(missing.length === 1 ? "muscles.unassigned_one" : "muscles.unassigned_count", { n: missing.length }))}</span>${assignmentButton(missing[0])}</div>` : "")
    + `</div>`;
}

// Kanıt etiketleri (araştırma: arastirma/ klasörü). Aynı gruptakiler arasında fark gösterilmedi: sıralama değil, eşit seçenekler.
const LEVEL = { "güçlü": [t("bodymap.lv_strong"), "good", t("bodymap.lv_strong_d")],
  "orta": [t("bodymap.lv_mid"), "", t("bodymap.lv_mid_d")],
  "zayıf": [t("bodymap.lv_weak"), "muted", t("bodymap.lv_weak_d")],
  "yok": [t("bodymap.lv_none"), "muted", t("bodymap.lv_none_d")] };
const share = w => fmtNum(Math.round(w * 100) / 100, { maximumFractionDigits: 2 });
const kindTag = ({ kind, level, w }, labeled = false) => kind === "kanit" ? `<span class="tag ${LEVEL[level][1]}">${labeled && level !== "yok" ? t("bodymap.evidence_prefix") : ""}${LEVEL[level][0]}</span>`
  : `<span class="tag ${kind === "ana" ? "" : "muted"}">${kind === "ana" ? t("bodymap.main_muscle") : t("bodymap.assist")}</span>`;
const shareText = w => w >= .999 ? "" : `<span class="muted small">${t("bodymap.share_this", { n: share(w) })}</span>`;
const groupNote = (m, g) => (EVIDENCE[m] || [])[g]?.note || "";
const evidenceHelp = `<details class="ev-help"><summary class="muted small">${t("bodymap.evidence_levels")}</summary>${Object.values(LEVEL).map(([l, , d]) => `<div class="small"><b>${l}:</b> ${d}</div>`).join("")}</details>`;

// Kasın hareketleri: önce kanıt grupları (eşit seçenekler), sonra ana, sonra yardımcı çalıştıranlar
// alts: aynı bölgedeki kaslar (omuz); üstte aralarında geçiş düğmeleri çıkar
// plain: yorgunluk ve haftalık yük gösterilmez (Hareketler'den kas seçerken)
export function openMuscleSheet(m, alts = [m], { plain = false } = {}){
  const R = recoveryMap(), r = R[m], ft = fatigueTier(r);
  const counts = {}; state.entries.forEach(e => counts[e.ex] = (counts[e.ex] || 0) + 1);
  const names = discoverableEx().filter(e => e.group !== YOGA).map(e => e.name);
  const list = rankForMuscle(m, names, musclesOf, counts);
  const ago = r ? (r.hrs < 1 ? t("bodymap.just_now") : r.hrs < 24 ? t("bodymap.hours_ago", { n: Math.round(r.hrs) }) : t("bodymap.days_ago", { n: Math.floor(r.hrs / 24) })) : "";
  // kullanıcının programlarından bu kası çalıştıranlar: bir antrenmanda kaç set (pay araştırma verisinden; kütüphane dışı hareketlerde yedek yardımcı 0,5)
  const progs = state.programs.map(p => ({ p, sets: (sessionBreakdown(programItems(p).filter(i => i.ex), musclesOf).find(x => x.muscle === m) || { sets: 0 }).sets }))
    .filter(x => x.sets > 0).sort((a, b) => b.sets - a.sets);
  const body = openSheet(sheetHead(muscleLabel(m)) + `<div class="muted small" style="margin:-8px 0 10px">${esc(MUSCLE_COMMON[m] || "")}</div>`,
    (alts.length > 1 ? `<div class="fchips" style="margin-bottom:10px">${alts.map(x => `<button class="fchip${x === m ? " on" : ""}" data-alt="${esc(x)}">${esc(muscleLabel(x))}</button>`).join("")}</div>` : "") +
    (plain ? "" : `<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:6px">
       <span class="chip"><i class="bm-dot" data-t="${ft}"></i>${r ? `${LABEL[ft]} · ${ago}` : t("bodymap.not_trained")}</span></div>
     ${ft === "yorgun" || ft === "asiri" ? `<div class="hint">${ic("battery-low")} ${t("bodymap.not_recovered", { n: Math.max(1, Math.ceil((r.need - r.hrs) / 24)) })}</div>` : ""}`) +
    (progs.length ? `<div class="pk-head" style="margin-top:4px">${t("bodymap.in_programs")}</div>
     ${progs.map(({ p, sets }) => `<div class="exitem"><div class="grow"><div>${esc(programName(p))}</div><div class="ms muted small">${t("bodymap.sets_this_muscle", { n: fmt(sets) })}</div></div>
       ${state.live ? "" : `<button class="btn sm" data-pstart="${p.id}">${ic("play")}${t("bodymap.start")}</button>`}</div>`).join("")}
     <div class="pk-head">${t("bodymap.moves")}</div>` : "") +
    `${summaryHTML(m, "small")}${evidenceHelp}${!list.length ? equipmentEmptyHTML() : ""}
     ${list.map((x, i) => { const { name, kind, group } = x, head = kind === "kanit" ? (i === 0 || list[i - 1].group !== group) : kind !== list[i - 1]?.kind;
       return (head ? `<div class="pk-head">${kind === "kanit" ? `${t("bodymap.equal_options")}${i === 0 ? `<span class="muted small" style="float:right;font-weight:400">${t("bodymap.evidence")}</span>` : ""}${groupNote(m, group) ? `<span class="muted small" style="display:block;font-weight:400;text-transform:none;letter-spacing:0">${esc(groupNote(m, group))}</span>` : ""}` : kind === "ana" ? t("bodymap.main_others") : t("bodymap.assist_others")}</div>` : "")
       + `<div class="exitem"><div class="grow"><div>${esc(name)}${counts[name] ? ` <span class="muted small">· ${t("bodymap.n_records", { n: counts[name] })}</span>` : ""}</div>
       <div class="ms">${kindTag(x)}${shareText(x.w)}</div></div>
       <a class="iconbtn" title="${t("bodymap.how_online")}" aria-label="${t("bodymap.how_online")}" data-i18n-aria="bodymap.how_online" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(name + " exercise form")}">${ic("circle-play")}</a>
       <button class="iconbtn" data-use="${esc(name)}" title="${t("bodymap.add")}" aria-label="${t("bodymap.add_named", { name: esc(name) })}">${ic("circle-plus")}</button></div>`; }).join("")}`);
  bindEquipmentEmpty(body, () => openMuscleSheet(m, alts, { plain }));
  body.querySelectorAll("[data-alt]").forEach(b => b.onclick = () => openMuscleSheet(b.dataset.alt, alts, { plain }));
  body.querySelectorAll("[data-pstart]").forEach(b => b.onclick = () => { closeSheet(); startWorkout(b.dataset.pstart); });
  body.querySelectorAll("[data-use]").forEach(b => b.onclick = () => { closeSheet(); useExercise(b.dataset.use); });
}
// antrenman sürüyorsa harekete ekler ve geçer; sürmüyorsa elle kayıt ekranında açar
function useExercise(n){
  if (state.live) { const items = liveItems(); let i = items.findIndex(x => x.ex === n); if (i < 0) { items.push({ ex: n, sets: 3, reps: "" }); i = items.length - 1; } state.live.idx = i; save(); openFocus(); return; }
  segState.train = "log"; showTab("train"); resetEditor(); $("#logEx").value = n; $("#logEx").dispatchEvent(new Event("input"));
  $("#setRows .w").focus();
}

// Hareketler'deki haritada kasa dokununca: o kasın hareketleri tam ekran, aşağı kaydırarak birer birer.
// Her kartta hareketin önden ve arkadan çalıştırdığı kaslar, kaç set yapıldığına göre kademe rengiyle boyalı;
// Renklerin anlamı yazılı (Minimum gelişim: Göğüs…). Set sayısı kartta değiştirilir, renkler hemen güncellenir.
let reelSets = EX_SETS;
const levelLegend = (mm, sets) => exerciseLevels(mm, sets).map(([k, l, ms]) =>
  `<span><i data-t="g-${k}" aria-hidden="true"></i><b>${k === "hasar" ? "⚠ " : ""}${l}</b><em>${esc(ms.map(muscleLabel).join(", "))}</em></span>`).join("");
const youtube = name => `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " exercise form")}`;
const reelCardHTML = (name, tags, hint = "") => { const mm = musclesOf(name), sex = bodySex(); return `<section class="reel-card" data-ex="${esc(name)}">
      <div class="reel-figs">${reelFigs(mm, sex)}</div>
      <div>
        <div class="row" style="gap:6px;margin-bottom:8px">${tags}</div>
        <h3 class="reel-name">${esc(name)}</h3>
        <div class="reel-sets"><span class="muted small">${t("bodymap.from_move")}</span><button class="iconbtn" data-sets="-1" title="${t("bodymap.set_less")}" aria-label="${t("bodymap.set_less")}" data-i18n-aria="bodymap.set_less">${ic("minus")}</button><b data-n>${t("bodymap.sets_n", { n: reelSets })}</b><button class="iconbtn" data-sets="1" title="${t("bodymap.set_more")}" aria-label="${t("bodymap.set_more")}" data-i18n-aria="bodymap.set_more">${ic("plus")}</button></div>
        <div class="reel-legend">${levelLegend(mm, reelSets)}</div>
        <div class="row reel-btns"><a class="btn" target="_blank" rel="noopener" href="${youtube(name)}">${ic("circle-play")}${t("bodymap.how_to")}</a>
          <button class="btn primary" data-use="${esc(name)}">${ic("circle-plus")}${state.live ? t("bodymap.add_to_workout") : t("bodymap.save")}</button></div>
        ${hint}
      </div></section>`; };
const reelFigs = (mm, sex) => ["front", "back"].map(side => `<svg class="reel-fig" data-side="${side}" viewBox="${ART[sex][side][0]}" style="${paint(sex, side, mm, reelSets)}" role="img" aria-label="${esc((side === "front" ? t("bodymap.front") : t("bodymap.back")) + ": " + levelsLabel(mm, reelSets))}"><use href="#${miniSymbol(sex, side)}"/></svg>`).join("");
export function openMuscleReel(m, alts = [m]){
  const counts = {}; state.entries.forEach(e => counts[e.ex] = (counts[e.ex] || 0) + 1);
  const names = discoverableEx().filter(e => e.group !== YOGA).map(e => e.name);
  const list = rankForMuscle(m, names, musclesOf, counts), sex = bodySex();
  const progs = state.programs.map(p => ({ p, sets: (sessionBreakdown(programItems(p).filter(i => i.ex), musclesOf).find(x => x.muscle === m) || { sets: 0 }).sets }))
    .filter(x => x.sets > 0).sort((a, b) => b.sets - a.sets);
  const cards = list.map((x, i) => reelCardHTML(x.name, `${kindTag(x, true)}${equipTag(x.name)}<span class="grow"></span><span class="muted small">${i + 1} / ${list.length}</span>`, i === 0 && list.length > 1 ? `<div class="reel-hint">${ic("chevron-down")}${t("bodymap.scroll")}</div>` : "")).join("")
    + (progs.length ? `<section class="reel-card reel-progs"><h3 class="reel-name">${t("bodymap.in_programs")}</h3>
      ${progs.map(({ p, sets }) => `<div class="exitem"><div class="grow"><div>${esc(programName(p))}</div><div class="ms muted small">${t("bodymap.sets_this_muscle", { n: fmt(sets) })}</div></div>
        ${state.live ? "" : `<button class="btn sm" data-pstart="${p.id}">${ic("play")}${t("bodymap.start")}</button>`}</div>`).join("")}</section>` : "");
  let el = $("#reel");
  if (!el) { document.body.insertAdjacentHTML("beforeend", `<div class="reel hidden" id="reel" role="dialog" aria-modal="true"></div>`); el = $("#reel"); }
  el.innerHTML = `<header class="reel-head"><button class="iconbtn" data-rclose title="${t("bodymap.close")}" aria-label="${t("bodymap.close")}" data-i18n-aria="bodymap.close">${ic("chevron-left")}</button><h2 class="grow">${esc(muscleLabel(m))}${MUSCLE_COMMON[m] ? ` <small class="muted">${esc(MUSCLE_COMMON[m])}</small>` : ""}</h2></header>
    ${alts.length > 1 ? `<div class="fchips reel-alts">${alts.map(x => `<button class="fchip${x === m ? " on" : ""}" data-alt="${esc(x)}">${esc(muscleLabel(x))}</button>`).join("")}</div>` : ""}
    <div class="reel-scroll">${!list.length ? equipmentEmptyHTML() : ""}${cards}</div>`;
  el.classList.remove("hidden"); document.documentElement.classList.add("reel-open");
  const close = () => { el.classList.add("hidden"); document.documentElement.classList.remove("reel-open"); removeEventListener("keydown", esc_); };
  const esc_ = e => { if (e.key === "Escape") close(); };
  addEventListener("keydown", esc_);
  el.querySelector("[data-rclose]").onclick = close;
  el.querySelectorAll("[data-equipment-change]").forEach(b => b.onclick = () => { close(); openEquipment(() => openMuscleReel(m, alts)); });
  el.querySelectorAll("[data-alt]").forEach(b => b.onclick = () => { close(); openMuscleReel(b.dataset.alt, alts); });
  el.querySelectorAll("[data-use]").forEach(b => b.onclick = () => { close(); useExercise(b.dataset.use); });
  el.querySelectorAll("[data-pstart]").forEach(b => b.onclick = () => { close(); startWorkout(b.dataset.pstart); });
  // set sayısı değişince o kartın resmi ve açıklaması yeniden boyanır (sonraki kartlar da aynı sayıyla açılır)
  el.querySelectorAll("[data-sets]").forEach(b => b.onclick = () => {
    reelSets = Math.min(15, Math.max(1, reelSets + +b.dataset.sets));
    const card = b.closest(".reel-card"), mm = musclesOf(card.dataset.ex);
    card.querySelector("[data-n]").textContent = t("bodymap.sets_n", { n: reelSets });
    card.querySelectorAll(".reel-fig").forEach(f => f.setAttribute("style", paint(sex, f.dataset.side, mm, reelSets)));
    card.querySelector(".reel-legend").innerHTML = levelLegend(mm, reelSets);
    card.querySelectorAll(".reel-fig").forEach(f => f.setAttribute("aria-label", (f.dataset.side === "front" ? t("bodymap.front") : t("bodymap.back")) + ": " + levelsLabel(mm, reelSets)));
  });
}

// Hareketler listesinde bir harekete dokununca: o hareketin tam ekran sayfası (resim, kademe renkleri, set sayısı, Kaydet)
export function openExercisePage(name){
  let el = $("#reel");
  if (!el) { document.body.insertAdjacentHTML("beforeend", `<div class="reel hidden" id="reel" role="dialog" aria-modal="true"></div>`); el = $("#reel"); }
  el.innerHTML = `<header class="reel-head"><button class="iconbtn" data-rclose title="${t("bodymap.close")}" aria-label="${t("bodymap.close")}" data-i18n-aria="bodymap.close">${ic("chevron-left")}</button><h2 class="grow">${esc(name)}</h2></header>
    <div class="reel-scroll">${reelCardHTML(name, equipTag(name))}</div>`;
  el.classList.remove("hidden"); document.documentElement.classList.add("reel-open");
  const close = () => { el.classList.add("hidden"); document.documentElement.classList.remove("reel-open"); removeEventListener("keydown", esc_); };
  const esc_ = e => { if (e.key === "Escape") close(); };
  addEventListener("keydown", esc_);
  el.querySelector("[data-rclose]").onclick = close;
  el.querySelectorAll("[data-use]").forEach(b => b.onclick = () => { close(); useExercise(b.dataset.use); });
  const sex = bodySex();
  el.querySelectorAll("[data-sets]").forEach(b => b.onclick = () => {
    reelSets = Math.min(15, Math.max(1, reelSets + +b.dataset.sets));
    const card = b.closest(".reel-card"), mm = musclesOf(card.dataset.ex);
    card.querySelector("[data-n]").textContent = t("bodymap.sets_n", { n: reelSets });
    card.querySelectorAll(".reel-fig").forEach(f => { f.setAttribute("style", paint(sex, f.dataset.side, mm, reelSets)); f.setAttribute("aria-label", (f.dataset.side === "front" ? t("bodymap.front") : t("bodymap.back")) + ": " + levelsLabel(mm, reelSets)); });
    card.querySelector(".reel-legend").innerHTML = levelLegend(mm, reelSets);
  });
}
