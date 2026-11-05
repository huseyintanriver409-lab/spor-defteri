// Vücut haritası: önden ve arkadan kaslar; renk kademesi core/musclemap.ts'ten. Kasa dokununca o kasın hareketleri açılır.
import { mondayOf, shortDate, ymd } from "../core/dates.ts";
import { work } from "../core/training.ts";
import { FATIGUE_TIERS, LOAD_TIERS, MUSCLES, SESSION_TIERS, fatigueTier, loadTier, rankForMuscle, sessionBreakdown, sessionTier, setsByMuscle } from "../core/musclemap.ts";
import { $, YOGA, esc, fmt, ic, save, state } from "./store.js";
import { isCardio, musclesOf, pickableEx } from "./exercises.js";
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
const RANK = { yok: 0, hazir: 1, toparlaniyor: 2, yorgun: 3, asiri: 4, "y-yok": 0, "y-dusuk": 1, "y-koruma": 2, "y-gelisim": 3, "y-asiri": 4,
  "g-yok": 0, "g-hafif": 1, "g-ideal": 2, "g-yuksek": 3, "g-asiri": 4, sec: 1 };
// haftalık yük "y-", tek antrenman yükü "g-" önekiyle
const KINDS = { fatigue: FATIGUE_TIERS, load: LOAD_TIERS.map(([k, l, d]) => ["y-" + k, l, d]), session: SESSION_TIERS.map(([k, l, d]) => ["g-" + k, l, d]) };
const LABEL = Object.fromEntries(Object.values(KINDS).flat().map(([k, l]) => [k, l]));
// erkek ya da kadın çizimi: profilde cinsiyet belirtildiyse o, değilse Ayarlar'daki seçim
export const bodySex = () => ["m", "f"].includes(state.profile.sex) ? state.profile.sex : state.prefs.body === "f" ? "f" : "m";

function figure(side, tiers, caption){
  const sex = bodySex(), [vb, art] = ART[sex][side];
  // bölünen bölgeler: parçalar kendi kaslarıyla ayrı bölge olur
  const parts = art.flatMap(([slug, ds]) => {
    const sp = SPLIT[sex][side] && SPLIT[sex][side][slug];
    if (!sp) return [[slug, ds, REGION[side][slug]]];
    return [[slug, ds.filter((_, i) => !sp[0].includes(i)), REGION[side][slug]], [slug, ds.filter((_, i) => sp[0].includes(i)), sp[1]]];
  });
  const order = [...parts.filter(([s]) => !ON_TOP.includes(s)), ...parts.filter(([s]) => ON_TOP.includes(s))];
  const paths = order.map(([, ds, ms]) => {
    if (!ms) return ds.map(d => `<path class="bm-base" d="${d}"/>`).join("");
    const t = ms.map(m => tiers[m] || "yok").reduce((x, y) => RANK[y] > RANK[x] ? y : x);
    const title = ms.map(m => esc(m) + (LABEL[tiers[m]] ? " · " + LABEL[tiers[m]] : "")).join(", ");
    return ds.map(d => `<path d="${d}" data-m="${esc(ms.join("|"))}" data-t="${t}"><title>${title}</title></path>`).join("");
  }).join("");
  return `<figure><svg viewBox="${vb}" role="img" aria-label="${caption} görünüm"><g class="bm-m">${paths}</g></svg><figcaption>${caption}</figcaption></figure>`;
}
// tiers: kas → kademe (yorgunluk, "y-" haftalık ya da "g-" tek antrenman yükü)
// large: ekran genişliğinde (Hareketler); plain: dokununca açılan pencerede yorgunluk bilgisi yok, yalnız hareketler
export const bodyMap = (tiers, { tap = true, small = false, large = false, plain = false } = {}) =>
  `<div class="bodymap${tap ? " tap" : ""}${small ? " small" : ""}${large ? " large" : ""}"${plain ? " data-plain" : ""}>${figure("front", tiers, "Ön")}${figure("back", tiers, "Arka")}</div>`;
export const legend = kind => `<div class="bm-legend">${KINDS[kind]
  .map(([k, l, d]) => `<span><i data-t="${k}"></i>${l}<small>${d}</small></span>`).join("")}</div>`;

export const fatigueTiers = (R = recoveryMap()) => Object.fromEntries(MUSCLES.map(m => [m, fatigueTier(R[m])]));
export const loadTiers = ms => Object.fromEntries(MUSCLES.map(m => [m, "y-" + loadTier(ms[m] || 0)]));
export const sessionTiers = ms => Object.fromEntries(MUSCLES.map(m => [m, "g-" + sessionTier(ms[m] || 0)]));
// bu haftanın etkili setleri (Pazartesiden bugüne)
export function weekSets(){
  const a = ymd(mondayOf(new Date()));
  return setsByMuscle(state.entries.filter(e => e.date >= a && !isCardio(e.ex)).map(e => ({ ex: e.ex, sets: work(e.sets).length })), musclesOf);
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
export function bindBodyMap(root){
  root.querySelectorAll(".bodymap.tap svg").forEach(svg => svg.onclick = e => {
    const ms = hitMuscles(svg, e); if (!ms.length) return;
    openMuscleSheet(ms[0], ms, { plain: svg.closest("[data-plain]") != null });
  });
}

// Tek antrenmanın kas yükü: harita, renk açıklaması ve fazla yüklenen kaslarda hangi hareketlerden geldiği
export function sessionLoadHTML(items, { tap = false, small = true } = {}){
  const list = items.filter(i => i.ex), rows = sessionBreakdown(list, musclesOf);
  if (!rows.length) return "";
  const ms = Object.fromEntries(rows.map(r => [r.muscle, r.sets]));
  const heavy = rows.filter(r => r.sets >= 9);
  return bodyMap(sessionTiers(ms), { tap, small }) + legend("session")
    + heavy.map(r => `<div class="hint" style="margin-top:10px">${ic("battery-low")} <span><b>${esc(r.muscle)}: ${fmt(r.sets)} set</b> (${LABEL["g-" + sessionTier(r.sets)].toLocaleLowerCase("tr")})
        <span class="muted small" style="display:block">${r.from.map(f => `${esc(f.ex)} ${fmt(f.sets)}`).join(" · ")}${r.sets >= 12 ? " · Bir hareketi çıkar ya da başka güne al." : ""}</span></span></div>`).join("")
    + `<div class="chips" style="margin-top:10px">${rows.filter(r => r.sets < 9).map(r => `<span class="chip">${esc(r.muscle)} · ${fmt(r.sets)}</span>`).join("")}</div>`;
}

// Kasın hareketleri: en iyiler, sonra ana, sonra yardımcı çalıştıranlar
// alts: aynı bölgedeki kaslar (omuz); üstte aralarında geçiş düğmeleri çıkar
// plain: yorgunluk ve haftalık yük gösterilmez (Hareketler'den kas seçerken)
export function openMuscleSheet(m, alts = [m], { plain = false } = {}){
  const R = recoveryMap(), r = R[m], ft = fatigueTier(r), ws = weekSets()[m] || 0;
  const counts = {}; state.entries.forEach(e => counts[e.ex] = (counts[e.ex] || 0) + 1);
  const names = pickableEx().filter(e => e.group !== YOGA).map(e => e.name);
  const list = rankForMuscle(m, names, musclesOf, counts);
  const TAG = { best: ["En iyi", "good"], ana: ["Ana kas", ""], yardimci: ["Yardımcı", "muted"] };
  const ago = r ? (r.hrs < 1 ? "az önce" : r.hrs < 24 ? `${Math.round(r.hrs)} sa önce` : `${Math.floor(r.hrs / 24)} gün önce`) : "";
  // kullanıcının programlarından bu kası çalıştıranlar: bir antrenmanda kaç set (yardımcı kas yarım set)
  const progs = state.programs.map(p => ({ p, sets: (sessionBreakdown(p.items.filter(i => i.ex), musclesOf).find(x => x.muscle === m) || { sets: 0 }).sets }))
    .filter(x => x.sets > 0).sort((a, b) => b.sets - a.sets);
  const body = openSheet(sheetHead(m),
    (alts.length > 1 ? `<div class="fchips" style="margin-bottom:10px">${alts.map(x => `<button class="fchip${x === m ? " on" : ""}" data-alt="${esc(x)}">${esc(x)}</button>`).join("")}</div>` : "") +
    (plain ? "" : `<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:6px">
       <span class="chip"><i class="bm-dot" data-t="${ft}"></i>${r ? `${LABEL[ft]} · son: ${ago} (${shortDate(r.date)}), ${fmt(r.sets)} set` : "Henüz çalıştırılmadı"}</span>
       <span class="chip"><i class="bm-dot" data-t="y-${loadTier(ws)}"></i>Bu hafta ${fmt(ws)} set${ws ? " · " + LABEL["y-" + loadTier(ws)] : ""}</span></div>
     ${ft === "yorgun" || ft === "asiri" ? `<div class="hint">${ic("battery-low")} Bu kas henüz toparlanmadı; ağır çalışmadan önce ${ft === "asiri" ? "en az bir gün daha" : "biraz daha"} dinlendir.</div>` : ""}`) +
    (progs.length ? `<div class="pk-head" style="margin-top:4px">Programlarında</div>
     ${progs.map(({ p, sets }) => `<div class="exitem"><div class="grow"><div>${esc(p.name)}</div><div class="ms muted small">${fmt(sets)} set bu kasa</div></div>
       ${state.live ? "" : `<button class="btn sm" data-pstart="${p.id}">${ic("play")}Başla</button>`}</div>`).join("")}
     <div class="pk-head">Hareketler</div>` : "") +
    `<p class="muted small" style="margin:8px 0 4px">Üstte en etkili hareketler; sonra bu kası ana olarak, en altta yardımcı olarak çalıştıranlar.</p>
     ${list.map(({ name, kind }) => `<div class="exitem"><div class="grow"><div>${esc(name)}${counts[name] ? ` <span class="muted small">· ${counts[name]} kayıt</span>` : ""}</div>
       <div class="ms"><span class="tag ${TAG[kind][1]}">${TAG[kind][0]}</span></div></div>
       <a class="iconbtn" title="Nasıl yapılır? (internet gerekir)" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(name + " exercise form")}">${ic("circle-play")}</a>
       <button class="iconbtn" data-use="${esc(name)}" title="${state.live ? "Antrenmana ekle" : "Bu hareketi kaydet"}">${ic("circle-plus")}</button></div>`).join("")}`);
  body.querySelectorAll("[data-alt]").forEach(b => b.onclick = () => openMuscleSheet(b.dataset.alt, alts, { plain }));
  body.querySelectorAll("[data-pstart]").forEach(b => b.onclick = () => { closeSheet(); startWorkout(b.dataset.pstart); });
  body.querySelectorAll("[data-use]").forEach(b => b.onclick = () => {
    const n = b.dataset.use; closeSheet();
    if (state.live) { const items = liveItems(); let i = items.findIndex(x => x.ex === n); if (i < 0) { items.push({ ex: n, sets: 3, reps: "" }); i = items.length - 1; } state.live.idx = i; save(); openFocus(); return; }
    segState.train = "log"; showTab("train"); resetEditor(); $("#logEx").value = n; $("#logEx").dispatchEvent(new Event("input"));
    $("#setRows .w").focus();
  });
}
