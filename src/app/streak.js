import { ymd } from "../core/dates.ts";
import { t } from "../core/i18n.ts";
import { BADGES, FREEZES_PER_MONTH, WEEK_BADGES, WEEK_FREEZES_PER_MONTH, computeStreak, computeWeekStreak, earnedBadges, nextBadge } from "../core/streak.ts";
import { $, ic, state } from "./store.js";
import { dayLoad } from "./stats.js";
import { buzz, closeSheet, infoBtn, openSheet } from "./ui.js";

/* ---------- Seri (Duolingo tarzı) ----------
   Hesap core/streak.ts'te. Kullanıcı seçer (Profil → Ayarlar → Seri): plan varsa günlük, haftalık ya da kapalı.
   Ana sayfada alev ve sayı, Takvim'de seri, en uzun seri ve rozetler; antrenman bitince seri arttıysa kutlama.
   streakNow() iki türü tek biçimde verir: count/best/unit ("gün" | "hafta"), done (bugün ya da bu hafta tamam). */
const workoutDates = (skip = "") => Object.keys(dayLoad()).filter(d => d !== skip);
export const streakMode = () => ["week", "off"].includes(state.streakMode) ? state.streakMode : "auto";
const weekly = () => streakMode() === "week" || !Object.keys(state.plan.days).length;

function calc(skip = ""){
  const now = new Date();
  if (weekly()) {
    const r = computeWeekStreak(workoutDates(skip), state.goal, now);
    return { ...r, kind: "week", count: r.weeks, unit: t("streak.unit_week"), adj: t("streak.adj_week"), was: t("streak.was_week"), done: r.goalMet, badges: WEEK_BADGES, freezes: WEEK_FREEZES_PER_MONTH };
  }
  const r = computeStreak(workoutDates(skip), Object.keys(state.plan.days), state.goal, now);
  return { ...r, kind: "day", count: r.days, unit: t("streak.unit_day"), adj: t("streak.adj_day"), was: t("streak.was_day"), done: r.doneToday, badges: BADGES, freezes: FREEZES_PER_MONTH };
}
export const streakOn = () => streakMode() !== "off";
export const streakNow = () => calc();

export const flameHTML = (r, cls = "") => `<span class="streak${r.count ? "" : " off"}${cls ? " " + cls : ""}" title="${t("streak.title", { n: r.count, unit: r.unit })}">${ic("flame")}<b>${r.count}</b>${r.kind === "week" ? `<small>${t("streak.wk_abbr")}</small>` : ""}</span>`;

// Ana sayfadaki hatırlatma satırı
export function streakNote(r){
  if (r.kind === "week") {
    if (r.goalMet) return r.weeks > 1 ? t("streak.goal_done_weeks", { n: r.weeks }) : t("streak.goal_done");
    if (r.atRisk) return t("streak.train_today_progress", { a: r.thisWeek, b: state.goal });
    return "";
  }
  if (r.doneToday) return "";
  if (r.atRisk) return r.days ? t("streak.keep") : t("streak.start");
  return "";
}

// Profil: seri, en uzun, dondurma, rozetler
export function streakCardHTML(r){
  const got = new Set(earnedBadges(r.best, r.badges)), u = r.unit;
  const rule = r.kind === "week"
    ? t("streak.rule_week", { goal: state.goal }) + (streakMode() === "auto" ? " " + t("streak.rule_week_auto") : "")
    : t("streak.rule_day");
  const freeze = r.kind === "week" ? t("streak.freeze_week") : t("streak.freeze_day");
  return `<div class="row" style="gap:14px;align-items:center">${flameHTML(r, "lg")}
      <div class="grow"><b style="font-size:18px">${t("streak.count_streak", { n: r.count, adj: r.adj })}</b>${infoBtn()}<div class="muted small">${t("streak.longest", { n: r.best, unit: u })}</div></div></div>
    <div class="muted small help" style="margin-top:10px">${rule} ${t("streak.freeze_html", { n: r.freezes, what: freeze, left: r.freezesLeft })}</div>
    <div class="badges">${r.badges.map(b => `<span class="badge${got.has(b) ? " on" : ""}" title="${t("streak.badge_title", { b, adj: r.adj })}">${ic("flame")}${b}</span>`).join("")}</div>`;
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
  const sub = badge ? t("streak.reached", { b: badge, adj: r.adj })
    : r.count === 1 ? (r.kind === "week" ? t("streak.new_week") : t("streak.new_day"))
    : t(r.kind === "week" ? "streak.prev_week" : "streak.prev_day", { n: before.count, was: r.was }) + (next ? " " + t("streak.next_badge", { b: next, unit: u }) : "");
  openSheet(`<div style="text-align:center;margin-top:8px">${flameHTML(r, "xl")}</div>`,
    `<div style="text-align:center">
      <h3 style="font-size:24px;margin:8px 0 4px;letter-spacing:-.03em">${badge ? t("streak.new_badge", { b: badge, unit: u }) : t("streak.your_streak", { n: r.count, unit: u })}</h3>
      <p class="muted" style="margin:0 0 16px">${sub}</p>
      <button class="btn primary" id="stOk" style="margin:0 auto">${ic("check")}${t("streak.continue")}</button></div>`);
  $("#stOk").onclick = closeSheet;
}
