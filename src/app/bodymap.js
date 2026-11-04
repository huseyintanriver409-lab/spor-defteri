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

// Sol yarı (x < 100) çizilir, sağ yarı aynası. Sıra önemli: sonra gelen üstte kalır.
const BODY = "M100 58L90 58C90 62 88 64 84 65C74 67 62 67 56 74C50 80 49 92 50 104C49 118 48 132 49 146C47 160 44 178 42 198C40 206 38 214 40 222C42 228 48 228 50 222C51 214 52 208 54 202C58 184 62 168 64 152C66 140 68 128 69 118C71 130 72 150 74 166C74 180 72 196 72 206C68 230 67 260 69 290C70 310 70 320 70 330C67 350 67 372 71 392C71 400 66 408 68 412L90 412C88 404 86 398 86 390C88 370 90 350 90 332C92 310 94 290 96 268C97 250 98 236 100 226Z";
const FOREARM = "M50 152C47 166 45 182 43 196C46 200 52 200 54 196C57 182 60 168 62 154C58 150 54 150 50 152Z";
const FRONT = [
  ["Trapez", "M90 58C90 62 88 64 84 65C80 66 76 67 72 68C80 70 88 70 94 68L94 60Z"],
  ["Yan Omuz", "M70 68C60 68 53 74 51 86C50 94 50 100 52 106C54 100 56 94 58 90C60 82 64 74 70 68Z"],
  ["Ön Omuz", "M72 69C64 74 60 84 58 92C57 98 58 104 60 108C64 100 70 92 78 86C80 80 79 72 72 69Z"],
  ["Göğüs", "M98 70C90 70 82 72 78 76C76 82 72 90 70 98C72 108 80 114 90 114C94 114 98 112 99 110Z"],
  ["Biceps", "M54 110C51 120 50 132 51 144C54 148 60 148 64 144C66 134 67 122 67 112C64 108 58 106 54 110Z"],
  ["Önkol", FOREARM],
  ["Karın", "M99 118L88 118C86 140 86 170 88 196C92 202 96 204 99 204Z"],
  ["Karın", "M86 120C80 124 76 134 75 150C75 168 78 184 86 196C84 170 84 140 86 120Z"],
  ["Quadriceps", "M76 214C70 238 69 264 72 292C76 302 86 304 92 298C95 276 96 252 94 230C88 222 82 214 76 214Z"],
  ["İç Bacak", "M99 228C99 244 98 260 95 276C94 260 93 246 92 234C94 230 97 228 99 228Z"],
  ["Baldır", "M71 336C68 352 68 370 71 386C74 386 76 384 76 380C75 366 75 350 77 338Z"],
];
const BACK = [
  ["Trapez", "M100 50L100 128C96 116 90 100 82 86C78 78 74 72 70 68C78 66 86 64 90 58C94 56 98 52 100 50Z"],
  ["Arka Omuz", "M70 68C60 68 53 74 51 86C50 92 51 98 52 102C56 94 62 86 72 80C76 76 74 70 70 68Z"],
  ["Triceps", "M53 106C50 118 49 132 51 146C55 150 61 150 65 146C67 134 67 120 66 110C62 104 56 102 53 106Z"],
  ["Önkol", FOREARM],
  ["Lat", "M78 92C74 104 73 120 75 138C78 152 86 164 96 172L98 150C92 136 88 118 84 100Z"],
  ["Bel", "M99 140L92 146C89 162 89 182 92 200L99 204Z"],
  ["Kalça", "M99 204C88 200 78 204 74 216C71 230 74 244 84 250C92 252 98 248 99 242Z"],
  ["Hamstring", "M75 254C71 274 71 292 74 310C80 316 88 316 93 310C95 290 95 270 93 256C86 250 80 250 75 254Z"],
  ["Baldır", "M72 330C67 344 67 362 72 376C78 382 86 380 90 370C92 356 91 340 88 330C84 324 76 324 72 330Z"],
];
const LABEL = Object.fromEntries([...FATIGUE_TIERS, ...LOAD_TIERS.map(([k, l]) => ["y-" + k, l])].map(([k, l]) => [k, l]));

function figure(parts, tiers, caption){
  const half = parts.map(([m, d]) => { const t = tiers[m] || "yok";
    return `<path d="${d}" data-m="${esc(m)}" data-t="${t}"><title>${esc(m)}${LABEL[t] ? " · " + LABEL[t] : ""}</title></path>`; }).join("");
  return `<figure><svg viewBox="34 8 132 408" role="img" aria-label="${caption} görünüm">
    <g class="bm-base"><ellipse cx="100" cy="30" rx="15" ry="19"/><rect x="91" y="44" width="18" height="18" rx="4"/><path d="${BODY}"/><path d="${BODY}" transform="matrix(-1 0 0 1 200 0)"/></g>
    <g class="bm-m">${half}</g><g class="bm-m" transform="matrix(-1 0 0 1 200 0)">${half}</g></svg><figcaption>${caption}</figcaption></figure>`;
}
// tiers: kas → kademe. Haftalık yük kademeleri "y-" önekiyle boyanır (ör. "y-gelisim").
export const bodyMap = (tiers, { tap = true, small = false } = {}) =>
  `<div class="bodymap${tap ? " tap" : ""}${small ? " small" : ""}">${figure(FRONT, tiers, "Ön")}${figure(BACK, tiers, "Arka")}</div>`;
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
  root.querySelectorAll(".bodymap.tap [data-m]").forEach(p => p.onclick = () => openMuscleSheet(p.dataset.m));
}

// Kasın hareketleri: en iyiler, sonra ana, sonra yardımcı çalıştıranlar
export function openMuscleSheet(m){
  const R = recoveryMap(), r = R[m], ft = fatigueTier(r), ws = weekSets()[m] || 0;
  const counts = {}; state.entries.forEach(e => counts[e.ex] = (counts[e.ex] || 0) + 1);
  const names = pickableEx().filter(e => e.group !== YOGA).map(e => e.name);
  const list = rankForMuscle(m, names, musclesOf, counts);
  const TAG = { best: ["En iyi", "good"], ana: ["Ana kas", ""], yardimci: ["Yardımcı", "muted"] };
  const ago = r ? (r.hrs < 1 ? "az önce" : r.hrs < 24 ? `${Math.round(r.hrs)} sa önce` : `${Math.floor(r.hrs / 24)} gün önce`) : "";
  const body = openSheet(sheetHead(m),
    `<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:6px">
       <span class="chip"><i class="bm-dot" data-t="${ft}"></i>${r ? `${LABEL[ft]} · son: ${ago} (${shortDate(r.date)}), ${fmt(r.sets)} set` : "Henüz çalıştırılmadı"}</span>
       <span class="chip"><i class="bm-dot" data-t="y-${loadTier(ws)}"></i>Bu hafta ${fmt(ws)} set${ws ? " · " + LABEL["y-" + loadTier(ws)] : ""}</span></div>
     ${ft === "yorgun" || ft === "asiri" ? `<div class="hint">${ic("battery-low")} Bu kas henüz toparlanmadı; ağır çalışmadan önce ${ft === "asiri" ? "en az bir gün daha" : "biraz daha"} dinlendir.</div>` : ""}
     <p class="muted small" style="margin:8px 0 4px">Üstte en etkili hareketler; sonra bu kası ana olarak, en altta yardımcı olarak çalıştıranlar.</p>
     ${list.map(({ name, kind }) => `<div class="exitem"><div class="grow"><div>${esc(name)}${counts[name] ? ` <span class="muted small">· ${counts[name]} kayıt</span>` : ""}</div>
       <div class="ms"><span class="tag ${TAG[kind][1]}">${TAG[kind][0]}</span></div></div>
       <a class="iconbtn" title="Nasıl yapılır? (internet gerekir)" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(name + " exercise form")}">${ic("circle-play")}</a>
       <button class="iconbtn" data-use="${esc(name)}" title="${state.live ? "Antrenmana ekle" : "Bu hareketi kaydet"}">${ic("circle-plus")}</button></div>`).join("")}`);
  body.querySelectorAll("[data-use]").forEach(b => b.onclick = () => {
    const n = b.dataset.use; closeSheet();
    if (state.live) { const items = liveItems(); let i = items.findIndex(x => x.ex === n); if (i < 0) { items.push({ ex: n, sets: 3, reps: "" }); i = items.length - 1; } state.live.idx = i; save(); openFocus(); return; }
    segState.train = "log"; showTab("train"); resetEditor(); $("#logEx").value = n; $("#logEx").dispatchEvent(new Event("input"));
    $("#setRows .w").focus();
  });
}
