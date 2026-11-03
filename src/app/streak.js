import { ymd } from "../core/dates.ts";
import { BADGES, FREEZES_PER_MONTH, WEEK_BADGES, WEEK_FREEZES_PER_MONTH, computeStreak, computeWeekStreak, earnedBadges, nextBadge } from "../core/streak.ts";
import { $, ic, state } from "./store.js";
import { dayLoad } from "./stats.js";
import { buzz, closeSheet, openSheet } from "./ui.js";

/* ---------- Seri (Duolingo tarzı) ----------
   Hesap core/streak.ts'te. Kullanıcı seçer (Profil → Ayarlar → Seri): plan varsa günlük, haftalık ya da kapalı.
   Ana sayfada alev ve sayı, İlerleme'de seri ve en uzun seri, Profil'de rozetler; antrenman bitince seri arttıysa kutlama.
   streakNow() iki türü tek biçimde verir: count/best/unit ("gün" | "hafta"), done (bugün ya da bu hafta tamam). */
const workoutDates = (skip = "") => Object.keys(dayLoad()).filter(d => d !== skip);
export const streakMode = () => ["week", "off"].includes(state.streakMode) ? state.streakMode : "auto";
const weekly = () => streakMode() === "week" || !Object.keys(state.plan.days).length;

function calc(skip = ""){
  const now = new Date();
  if (weekly()) {
    const r = computeWeekStreak(workoutDates(skip), state.goal, now);
    return { ...r, kind: "week", count: r.weeks, unit: "hafta", adj: "haftalık", was: "haftaydı", done: r.goalMet, badges: WEEK_BADGES, freezes: WEEK_FREEZES_PER_MONTH };
  }
  const r = computeStreak(workoutDates(skip), Object.keys(state.plan.days), state.goal, now);
  return { ...r, kind: "day", count: r.days, unit: "gün", adj: "günlük", was: "gündü", done: r.doneToday, badges: BADGES, freezes: FREEZES_PER_MONTH };
}
export const streakOn = () => streakMode() !== "off";
export const streakNow = () => calc();

export const flameHTML = (r, cls = "") => `<span class="streak${r.count ? "" : " off"}${cls ? " " + cls : ""}" title="Seri: ${r.count} ${r.unit}">${ic("flame")}<b>${r.count}</b>${r.kind === "week" ? `<small>hf</small>` : ""}</span>`;

// Ana sayfadaki hatırlatma satırı
export function streakNote(r){
  if (r.kind === "week") {
    if (r.goalMet) return r.weeks > 1 ? `Bu haftanın hedefi tamam. Serin ${r.weeks} hafta.` : "Bu haftanın hedefi tamam. Serin başladı!";
    if (r.atRisk) return `Haftalık hedefe yetişmek için bugün antrenman gerek (${r.thisWeek}/${state.goal}).`;
    return "";
  }
  if (r.doneToday) return r.days > 1 ? `Serin ${r.days} gün. Bugünü de kurtardın.` : "Serin başladı. Yarın da devam!";
  if (r.atRisk) return r.days ? `Bugün antrenman günü: ${r.days} günlük serini koru.` : "Bugün antrenman günü: yeni bir seri başlat.";
  return "";
}

// Profil: seri, en uzun, dondurma, rozetler
export function streakCardHTML(r){
  const got = new Set(earnedBadges(r.best, r.badges)), next = nextBadge(r.count, r.badges), u = r.unit;
  const rule = r.kind === "week"
    ? `Haftalık hedefini (${state.goal} gün) tutturduğun her hafta seri 1 artar; hangi gün yaptığın önemli değil.${streakMode() === "auto" ? " Haftalık plan kurarsan seri planlı günlerine göre günlük işler." : ""}`
    : "Planlı günleri kaçırmadıkça seri sürer; dinlenme günleri bozmaz.";
  const freeze = r.kind === "week" ? "eksik kalan hafta" : "kaçırılan gün";
  return `<div class="row" style="gap:14px;align-items:center">${flameHTML(r, "lg")}
      <div class="grow"><b style="font-size:18px">${r.count} ${r.adj} seri</b><div class="muted small">En uzun: ${r.best} ${u}${next ? ` · sıradaki rozet ${next} ${u}` : ""}</div></div></div>
    <div class="muted small" style="margin-top:10px">${rule} Ayda ${r.freezes} kez ${freeze} seriyi bozmaz (dondurma): bu ay <b>${r.freezesLeft}</b> hakkın kaldı. Seri türünü Ayarlar'dan değiştirebilir ya da kapatabilirsin.</div>
    <div class="badges">${r.badges.map(b => `<span class="badge${got.has(b) ? " on" : ""}" title="${b} ${r.adj} seri">${ic("flame")}${b}</span>`).join("")}</div>`;
}

// Antrenman bitince: bugünkü antrenman seriyi artırdıysa kutla; bir rozet eşiği geçildiyse büyük kutlama
export function celebrateStreak(){
  if (!streakOn()) return;
  const r = calc();
  if (!r.done) return;
  const before = calc(ymd(new Date()));
  if (r.count <= before.count) return;
  const u = r.unit, badge = r.badges.find(b => before.best < b && r.best >= b), next = nextBadge(r.count, r.badges);
  buzz([30, 50, 30]);
  const sub = badge ? `${badge} ${r.adj} seriye ulaştın. Böyle devam.`
    : r.count === 1 ? (r.kind === "week" ? "Bu haftanın hedefi tamam: yeni bir seri başladı." : "Yeni bir seri başladı.")
    : `${r.kind === "week" ? "Geçen hafta" : "Dün"} ${before.count} ${r.was}. ${next ? `Sıradaki rozet ${next} ${u}.` : ""}`;
  openSheet(`<div style="text-align:center;margin-top:8px">${flameHTML(r, "xl")}</div>`,
    `<div style="text-align:center">
      <h3 style="font-size:24px;margin:8px 0 4px;letter-spacing:-.03em">${badge ? `Yeni rozet: ${badge} ${u}!` : `Serin ${r.count} ${u}!`}</h3>
      <p class="muted" style="margin:0 0 16px">${sub}</p>
      <button class="btn primary" id="stOk" style="margin:0 auto">${ic("check")}Devam</button></div>`);
  $("#stOk").onclick = closeSheet;
}
