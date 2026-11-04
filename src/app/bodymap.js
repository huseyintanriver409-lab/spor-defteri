// Vücut haritası: önden ve arkadan kaslar; renk kademesi core/musclemap.ts'ten. Kasa dokununca o kasın hareketleri açılır.
import { mondayOf, shortDate, ymd } from "../core/dates.ts";
import { work } from "../core/training.ts";
import { FATIGUE_TIERS, LOAD_TIERS, MUSCLES, fatigueTier, loadTier, rankForMuscle, setsByMuscle } from "../core/musclemap.ts";
import { $, YOGA, esc, fmt, ic, save, state } from "./store.js";
import { isCardio, musclesOf, pickableEx } from "./exercises.js";
import { closeSheet, openSheet, segState, sheetHead, showTab } from "./ui.js";
import { resetEditor } from "./log.js";
import { liveItems, openFocus } from "./live.js";
import { recoveryMap } from "./stats.js";
import { ART } from "./bodyart.js";

// Çizimdeki bölge → uygulamadaki kas(lar). Omuz çizimde tek parça: önden ön+yan, arkadan arka+yan omuz; en yoğun olanın rengini alır.
const REGION = {
  front: { chest: ["Göğüs"], abs: ["Karın"], obliques: ["Karın"], biceps: ["Biceps"], triceps: ["Triceps"], trapezius: ["Trapez"], deltoids: ["Ön Omuz", "Yan Omuz"],
    adductors: ["İç Bacak"], quadriceps: ["Quadriceps"], calves: ["Baldır"], tibialis: ["Baldır"], forearm: ["Önkol"] },
  back: { trapezius: ["Trapez"], "upper-back": ["Lat"], "lower-back": ["Bel"], deltoids: ["Arka Omuz", "Yan Omuz"], triceps: ["Triceps"], forearm: ["Önkol"],
    gluteal: ["Kalça"], hamstring: ["Hamstring"], adductors: ["İç Bacak"], calves: ["Baldır"] },
};
const RANK = { yok: 0, hazir: 1, toparlaniyor: 2, yorgun: 3, asiri: 4, "y-yok": 0, "y-dusuk": 1, "y-koruma": 2, "y-gelisim": 3, "y-asiri": 4, sec: 1 };
const LABEL = Object.fromEntries([...FATIGUE_TIERS, ...LOAD_TIERS.map(([k, l]) => ["y-" + k, l])].map(([k, l]) => [k, l]));
// erkek ya da kadın çizimi: profilde cinsiyet belirtildiyse o, değilse Ayarlar'daki seçim
export const bodySex = () => ["m", "f"].includes(state.profile.sex) ? state.profile.sex : state.prefs.body === "f" ? "f" : "m";

function figure(side, tiers, caption){
  const [vb, parts] = ART[bodySex()][side];
  const paths = parts.map(([slug, ds]) => {
    const ms = REGION[side][slug];
    if (!ms) return ds.map(d => `<path class="bm-base" d="${d}"/>`).join("");
    const t = ms.map(m => tiers[m] || "yok").reduce((x, y) => RANK[y] > RANK[x] ? y : x);
    const title = ms.map(m => esc(m) + (LABEL[tiers[m]] ? " · " + LABEL[tiers[m]] : "")).join(", ");
    return ds.map(d => `<path d="${d}" data-m="${esc(ms.join("|"))}" data-t="${t}"><title>${title}</title></path>`).join("");
  }).join("");
  return `<figure><svg viewBox="${vb}" role="img" aria-label="${caption} görünüm"><g class="bm-m">${paths}</g></svg><figcaption>${caption}</figcaption></figure>`;
}
// tiers: kas → kademe. Haftalık yük kademeleri "y-" önekiyle boyanır (ör. "y-gelisim").
export const bodyMap = (tiers, { tap = true, small = false } = {}) =>
  `<div class="bodymap${tap ? " tap" : ""}${small ? " small" : ""}">${figure("front", tiers, "Ön")}${figure("back", tiers, "Arka")}</div>`;
export const legend = kind => `<div class="bm-legend">${(kind === "load" ? LOAD_TIERS.map(([k, l, d]) => ["y-" + k, l, d]) : FATIGUE_TIERS)
  .map(([k, l, d]) => `<span><i data-t="${k}"></i>${l}<small>${d}</small></span>`).join("")}</div>`;

export const fatigueTiers = (R = recoveryMap()) => Object.fromEntries(MUSCLES.map(m => [m, fatigueTier(R[m])]));
export const loadTiers = ms => Object.fromEntries(MUSCLES.map(m => [m, "y-" + loadTier(ms[m] || 0)]));
// bu haftanın etkili setleri (Pazartesiden bugüne)
export function weekSets(){
  const a = ymd(mondayOf(new Date()));
  return setsByMuscle(state.entries.filter(e => e.date >= a && !isCardio(e.ex)).map(e => ({ ex: e.ex, sets: work(e.sets).length })), musclesOf);
}
export function bindBodyMap(root){
  root.querySelectorAll(".bodymap.tap [data-m]").forEach(p => p.onclick = () => { const ms = p.dataset.m.split("|"); openMuscleSheet(ms[0], ms); });
}

// Kasın hareketleri: en iyiler, sonra ana, sonra yardımcı çalıştıranlar
// alts: aynı bölgedeki kaslar (omuz); üstte aralarında geçiş düğmeleri çıkar
export function openMuscleSheet(m, alts = [m]){
  const R = recoveryMap(), r = R[m], ft = fatigueTier(r), ws = weekSets()[m] || 0;
  const counts = {}; state.entries.forEach(e => counts[e.ex] = (counts[e.ex] || 0) + 1);
  const names = pickableEx().filter(e => e.group !== YOGA).map(e => e.name);
  const list = rankForMuscle(m, names, musclesOf, counts);
  const TAG = { best: ["En iyi", "good"], ana: ["Ana kas", ""], yardimci: ["Yardımcı", "muted"] };
  const ago = r ? (r.hrs < 1 ? "az önce" : r.hrs < 24 ? `${Math.round(r.hrs)} sa önce` : `${Math.floor(r.hrs / 24)} gün önce`) : "";
  const body = openSheet(sheetHead(m),
    (alts.length > 1 ? `<div class="fchips" style="margin-bottom:10px">${alts.map(x => `<button class="fchip${x === m ? " on" : ""}" data-alt="${esc(x)}">${esc(x)}</button>`).join("")}</div>` : "") +
    `<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:6px">
       <span class="chip"><i class="bm-dot" data-t="${ft}"></i>${r ? `${LABEL[ft]} · son: ${ago} (${shortDate(r.date)}), ${fmt(r.sets)} set` : "Henüz çalıştırılmadı"}</span>
       <span class="chip"><i class="bm-dot" data-t="y-${loadTier(ws)}"></i>Bu hafta ${fmt(ws)} set${ws ? " · " + LABEL["y-" + loadTier(ws)] : ""}</span></div>
     ${ft === "yorgun" || ft === "asiri" ? `<div class="hint">${ic("battery-low")} Bu kas henüz toparlanmadı; ağır çalışmadan önce ${ft === "asiri" ? "en az bir gün daha" : "biraz daha"} dinlendir.</div>` : ""}
     <p class="muted small" style="margin:8px 0 4px">Üstte en etkili hareketler; sonra bu kası ana olarak, en altta yardımcı olarak çalıştıranlar.</p>
     ${list.map(({ name, kind }) => `<div class="exitem"><div class="grow"><div>${esc(name)}${counts[name] ? ` <span class="muted small">· ${counts[name]} kayıt</span>` : ""}</div>
       <div class="ms"><span class="tag ${TAG[kind][1]}">${TAG[kind][0]}</span></div></div>
       <a class="iconbtn" title="Nasıl yapılır? (internet gerekir)" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(name + " exercise form")}">${ic("circle-play")}</a>
       <button class="iconbtn" data-use="${esc(name)}" title="${state.live ? "Antrenmana ekle" : "Bu hareketi kaydet"}">${ic("circle-plus")}</button></div>`).join("")}`);
  body.querySelectorAll("[data-alt]").forEach(b => b.onclick = () => openMuscleSheet(b.dataset.alt, alts));
  body.querySelectorAll("[data-use]").forEach(b => b.onclick = () => {
    const n = b.dataset.use; closeSheet();
    if (state.live) { const items = liveItems(); let i = items.findIndex(x => x.ex === n); if (i < 0) { items.push({ ex: n, sets: 3, reps: "" }); i = items.length - 1; } state.live.idx = i; save(); openFocus(); return; }
    segState.train = "log"; showTab("train"); resetEditor(); $("#logEx").value = n; $("#logEx").dispatchEvent(new Event("input"));
    $("#setRows .w").focus();
  });
}
