import { ymd } from "../core/dates.ts";
import { BADGES, FREEZES_PER_MONTH, computeStreak, earnedBadges, nextBadge } from "../core/streak.ts";
import { $, ic, state } from "./store.js";
import { dayLoad } from "./stats.js";
import { buzz, closeSheet, openSheet } from "./ui.js";

/* ---------- Seri (Duolingo tarzı) ----------
   Hesap core/streak.ts'te. Ana sayfada alev ve sayı, İlerleme'de seri ve en uzun seri, Profil'de rozetler;
   antrenman bitince seri arttıysa kutlama. */
const workoutDates = (skip = "") => Object.keys(dayLoad()).filter(d => d !== skip);
export const streakNow = () => computeStreak(workoutDates(), Object.keys(state.plan.days), state.goal, new Date());

export const flameHTML = (days, cls = "") => `<span class="streak${days ? "" : " off"}${cls ? " " + cls : ""}" title="Seri: ${days} gün">${ic("flame")}<b>${days}</b></span>`;

// Ana sayfadaki hatırlatma satırı
export function streakNote(r){
  if (r.doneToday) return r.days > 1 ? `Serin ${r.days} gün. Bugünü de kurtardın.` : "Serin başladı. Yarın da devam!";
  if (r.atRisk) return r.days ? `Bugün antrenman günü: ${r.days} günlük serini koru.` : "Bugün antrenman günü: yeni bir seri başlat.";
  return "";
}

// Profil: seri, en uzun, dondurma, rozetler
export function streakCardHTML(r){
  const got = new Set(earnedBadges(r.best)), next = nextBadge(r.days);
  const rule = r.mode === "plan" ? "Planlı günleri kaçırmadıkça seri sürer; dinlenme günleri bozmaz." : "Haftalık hedefini tutturdukça seri sürer. Haftalık plan kurarsan seri planlı günlerine göre işler.";
  return `<div class="row" style="gap:14px;align-items:center">${flameHTML(r.days, "lg")}
      <div class="grow"><b style="font-size:18px">${r.days} günlük seri</b><div class="muted small">En uzun: ${r.best} gün${next ? ` · sıradaki rozet ${next} gün` : ""}</div></div></div>
    <div class="muted small" style="margin-top:10px">${rule} Ayda ${FREEZES_PER_MONTH} kez kaçırılan gün seriyi bozmaz (dondurma): bu ay <b>${r.freezesLeft}</b> hakkın kaldı.</div>
    <div class="badges">${BADGES.map(b => `<span class="badge${got.has(b) ? " on" : ""}" title="${b} günlük seri">${ic("flame")}${b}</span>`).join("")}</div>`;
}

// Antrenman bitince: bugünkü antrenman seriyi artırdıysa kutla; bir rozet eşiği geçildiyse büyük kutlama
export function celebrateStreak(){
  const today = ymd(new Date()), r = streakNow();
  if (!r.doneToday) return;
  const before = computeStreak(workoutDates(today), Object.keys(state.plan.days), state.goal, new Date());
  if (r.days <= before.days) return;
  const badge = BADGES.find(b => before.best < b && r.best >= b);
  buzz([30, 50, 30]);
  openSheet(`<div style="text-align:center;margin-top:8px">${flameHTML(r.days, "xl")}</div>`,
    `<div style="text-align:center">
      <h3 style="font-size:24px;margin:8px 0 4px;letter-spacing:-.03em">${badge ? `Yeni rozet: ${badge} gün!` : `Serin ${r.days} gün!`}</h3>
      <p class="muted" style="margin:0 0 16px">${badge ? `${badge} günlük seriye ulaştın. Böyle devam.` : r.days === 1 ? "Yeni bir seri başladı." : `Dün ${before.days} gündü. ${nextBadge(r.days) ? `Sıradaki rozet ${nextBadge(r.days)} gün.` : ""}`}</p>
      <button class="btn primary" id="stOk" style="margin:0 auto">${ic("check")}Devam</button></div>`);
  $("#stOk").onclick = closeSheet;
}
