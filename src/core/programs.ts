/* ---------- Hazır programlar ve program önerisi ----------
   Programlar herkesçe bilinen, belgelenmiş düzenlerdir; adları marka değil, "… tarzı" diye anılır.
   Öneri kuralları şu yönergelere dayanır:
   - ACSM, "Progression models in resistance training for healthy adults" (2009, PMID 19204579):
     yeni başlayan için haftada 2-3 gün, 8-12 tekrarlık yük; hedefin 1-2 tekrar fazlası yapılınca yük %2-10 artar.
   - CDC / Dünya Sağlık Örgütü: haftada en az 2 gün bütün büyük kas gruplarına kuvvet antrenmanı,
     artı 150 dk orta ya da 75 dk yoğun kardiyo.
   Tarayıcıya bağlı değildir; testleri tests/programs.test.ts içinde. */

import trPrograms from "../i18n/tr/core_programs.ts";
import enPrograms from "../i18n/en/core_programs.ts";
import { t, lang } from "./i18n.ts";

export type Level = "yeni" | "orta" | "ileri";
export type Goal = "genel" | "kas" | "guc" | "esneklik";
export type Equip = "salon" | "ev" | "yok";

// [hareket, set, tekrar hedefi] — süreli hareketlerde tekrar hedefi saniyedir
export type Item = [string, number, string];
export interface Session { name: string; items: Item[] }

export interface ProgramDef {
  id: string;
  name: string;
  short: string;              // tek cümlelik özet
  levels: Level[];            // uygun deneyim seviyeleri
  goals: Goal[];
  equip: Equip;
  days: number[];             // desteklenen haftalık gün sayıları
  sessions: Session[];
  // gün sayısına göre haftadaki seansların sırası (seans adlarının indeksleri); yoksa sırayla döner
  rotation?: Record<number, number[]>;
  who: string;                // kime uygun, neden
  progression: string[];      // nasıl ilerlenir
  stall: string;              // takılınca ne yapılır
  tips: string[];             // yeni başlayana notlar
  source: string;
}

function buildPrograms(language: "tr" | "en"): ProgramDef[] {
const dict: Record<string, string> = language === "tr" ? trPrograms : enPrograms;
const t = (key: string) => dict[key.slice(14)];
const COMMON_TIPS = [
  t("core_programs.tips_common_1"),
  t("core_programs.tips_common_2"),
  t("core_programs.tips_common_3"),
  t("core_programs.tips_common_4"),
  t("core_programs.tips_common_5"),
];

const YOGA_TIPS = [
  t("core_programs.tips_yoga_1"),
  t("core_programs.tips_yoga_2"),
  t("core_programs.tips_yoga_3"),
  t("core_programs.tips_yoga_4"),
  t("core_programs.tips_yoga_5"),
  t("core_programs.tips_yoga_6"),
];
const YOGA_SOURCE = t("core_programs.yoga_source");

return [
  {
    id: "baslangic-tam",
    name: t("core_programs.baslangic_tam_name"),
    short: t("core_programs.baslangic_tam_short"),
    levels: ["yeni"], goals: ["genel", "kas"], equip: "salon", days: [2, 3],
    sessions: [
      { name: "A", items: [["Leg Press", 3, "10-12"], ["Machine Chest Press", 3, "10-12"], ["Wide-Grip Lat Pulldown", 3, "10-12"], ["Dumbbell Romanian Deadlift", 3, "10-12"], ["Seated Dumbbell Shoulder Press", 2, "10-12"], ["Plank", 3, "30"]] },
      { name: "B", items: [["Goblet Squat", 3, "10-12"], ["Dumbbell Bench Press", 3, "10-12"], ["Seated Cable Row", 3, "10-12"], ["Lying Leg Curl", 2, "10-12"], ["Lateral Raise (Dumbbell)", 2, "12-15"], ["Dead Bug", 3, "10"]] },
    ],
    who: t("core_programs.baslangic_tam_who"),
    progression: [
      t("core_programs.baslangic_tam_prog1"),
      t("core_programs.baslangic_tam_prog2"),
      t("core_programs.baslangic_tam_prog3"),
    ],
    stall: t("core_programs.baslangic_tam_stall"),
    tips: COMMON_TIPS,
    source: t("core_programs.baslangic_tam_source"),
  },
  {
    id: "3x5",
    name: t("core_programs.3x5_name"),
    short: t("core_programs.3x5_short"),
    levels: ["yeni"], goals: ["guc"], equip: "salon", days: [2, 3],
    sessions: [
      { name: "A", items: [["Back Squat", 3, "5"], ["Bench Press (Barbell)", 3, "5"], ["Deadlift", 1, "5"]] },
      { name: "B", items: [["Back Squat", 3, "5"], ["Overhead Press (Barbell)", 3, "5"], ["Deadlift", 1, "5"]] },
    ],
    who: t("core_programs.3x5_who"),
    progression: [
      t("core_programs.3x5_prog1"),
      t("core_programs.3x5_prog2"),
      t("core_programs.3x5_prog3"),
    ],
    stall: t("core_programs.3x5_stall"),
    tips: COMMON_TIPS,
    source: t("core_programs.3x5_source"),
  },
  {
    id: "5x5",
    name: t("core_programs.5x5_name"),
    short: t("core_programs.5x5_short"),
    levels: ["yeni"], goals: ["guc", "genel"], equip: "salon", days: [3],
    sessions: [
      { name: "A", items: [["Back Squat", 5, "5"], ["Bench Press (Barbell)", 5, "5"], ["Barbell Row", 5, "5"]] },
      { name: "B", items: [["Back Squat", 5, "5"], ["Overhead Press (Barbell)", 5, "5"], ["Deadlift", 1, "5"]] },
    ],
    who: t("core_programs.5x5_who"),
    progression: [
      t("core_programs.5x5_prog1"),
      t("core_programs.5x5_prog2"),
      t("core_programs.5x5_prog3"),
    ],
    stall: t("core_programs.5x5_stall"),
    tips: COMMON_TIPS,
    source: t("core_programs.5x5_source"),
  },
  {
    id: "gzclp",
    name: t("core_programs.gzclp_name"),
    short: t("core_programs.gzclp_short"),
    levels: ["yeni", "orta"], goals: ["guc", "kas"], equip: "salon", days: [3, 4],
    sessions: [
      { name: "1", items: [["Back Squat", 5, "3"], ["Bench Press (Barbell)", 3, "10"], ["Wide-Grip Lat Pulldown", 3, "15"]] },
      { name: "2", items: [["Overhead Press (Barbell)", 5, "3"], ["Deadlift", 3, "10"], ["Single-Arm Dumbbell Row", 3, "15"]] },
      { name: "3", items: [["Bench Press (Barbell)", 5, "3"], ["Back Squat", 3, "10"], ["Wide-Grip Lat Pulldown", 3, "15"]] },
      { name: "4", items: [["Deadlift", 5, "3"], ["Overhead Press (Barbell)", 3, "10"], ["Single-Arm Dumbbell Row", 3, "15"]] },
    ],
    who: t("core_programs.gzclp_who"),
    progression: [
      t("core_programs.gzclp_prog1"),
      t("core_programs.gzclp_prog2"),
      t("core_programs.gzclp_prog3"),
      t("core_programs.gzclp_prog4"),
    ],
    stall: t("core_programs.gzclp_stall"),
    tips: COMMON_TIPS,
    source: t("core_programs.gzclp_source"),
  },
  {
    id: "ust-alt",
    name: t("core_programs.ust_alt_name"),
    short: t("core_programs.ust_alt_short"),
    levels: ["orta", "ileri"], goals: ["kas", "genel", "guc"], equip: "salon", days: [4],
    sessions: [
      { name: t("core_programs.ust_alt_s_ust"), items: [["Bench Press (Barbell)", 4, "6-8"], ["Barbell Row", 4, "6-8"], ["Overhead Press (Barbell)", 3, "8-10"], ["Wide-Grip Lat Pulldown", 3, "8-12"], ["EZ-Bar Curl", 2, "10-12"], ["Skull Crusher (EZ-Bar)", 2, "10-12"]] },
      { name: t("core_programs.ust_alt_s_alt"), items: [["Back Squat", 4, "6-8"], ["Romanian Deadlift", 3, "8-10"], ["Bulgarian Split Squat", 3, "10"], ["Seated Leg Curl", 3, "10-12"], ["Seated Calf Raise", 4, "12-15"], ["Hanging Leg Raise", 3, "10-15"]] },
    ],
    rotation: { 4: [0, 1, 0, 1] },
    who: t("core_programs.ust_alt_who"),
    progression: [
      t("core_programs.ust_alt_prog1"),
      t("core_programs.ust_alt_prog2"),
    ],
    stall: t("core_programs.ust_alt_stall"),
    tips: COMMON_TIPS.slice(1),
    source: t("core_programs.ust_alt_source"),
  },
  {
    id: "ppl",
    name: t("core_programs.ppl_name"),
    short: t("core_programs.ppl_short"),
    levels: ["orta", "ileri"], goals: ["kas"], equip: "salon", days: [3, 5, 6],
    sessions: [
      { name: t("core_programs.ppl_s_push"), items: [["Bench Press (Barbell)", 4, "6-8"], ["Incline Dumbbell Press", 3, "8-10"], ["Seated Dumbbell Shoulder Press", 3, "8-10"], ["Lateral Raise (Dumbbell)", 3, "12-15"], ["Triceps Pushdown (Rope)", 3, "10-12"], ["Overhead Cable Extension", 3, "10-12"]] },
      { name: t("core_programs.ppl_s_pull"), items: [["Deadlift", 3, "5"], ["Pull-up", 3, "6-10"], ["Seated Cable Row", 3, "8-12"], ["Face Pull", 3, "12-15"], ["Barbell Curl", 3, "8-12"], ["Hammer Curl", 3, "10-12"]] },
      { name: t("core_programs.ppl_s_legs"), items: [["Back Squat", 4, "6-8"], ["Romanian Deadlift", 3, "8-10"], ["Leg Press", 3, "10-12"], ["Lying Leg Curl", 3, "10-12"], ["Leg Extension", 3, "12-15"], ["Standing Calf Raise", 4, "12-15"]] },
    ],
    who: t("core_programs.ppl_who"),
    progression: [
      t("core_programs.ppl_prog1"),
      t("core_programs.ppl_prog2"),
    ],
    stall: t("core_programs.ppl_stall"),
    tips: COMMON_TIPS.slice(1),
    source: t("core_programs.ppl_source"),
  },
  {
    id: "ev-dumbbell",
    name: t("core_programs.ev_dumbbell_name"),
    short: t("core_programs.ev_dumbbell_short"),
    levels: ["yeni", "orta"], goals: ["genel", "kas"], equip: "ev", days: [2, 3],
    sessions: [
      { name: "A", items: [["Goblet Squat", 3, "8-12"], ["Dumbbell Bench Press", 3, "8-12"], ["Single-Arm Dumbbell Row", 3, "8-12"], ["Dumbbell Romanian Deadlift", 3, "8-12"], ["Standing Dumbbell Press", 2, "8-12"], ["Plank", 3, "30"]] },
      { name: "B", items: [["Reverse Lunge", 3, "8-12"], ["Push-up", 3, "5-15"], ["Single-Arm Dumbbell Row", 3, "8-12"], ["Glute Bridge", 3, "12-15"], ["Lateral Raise (Dumbbell)", 2, "12-15"], ["Dumbbell Curl", 2, "10-12"], ["Dead Bug", 3, "10"]] },
    ],
    who: t("core_programs.ev_dumbbell_who"),
    progression: [
      t("core_programs.ev_dumbbell_prog1"),
      t("core_programs.ev_dumbbell_prog2"),
      t("core_programs.ev_dumbbell_prog3"),
    ],
    stall: t("core_programs.ev_dumbbell_stall"),
    tips: COMMON_TIPS,
    source: t("core_programs.ev_dumbbell_source"),
  },
  {
    id: "vucut-agirligi",
    name: t("core_programs.vucut_agirligi_name"),
    short: t("core_programs.vucut_agirligi_short"),
    levels: ["yeni"], goals: ["genel", "kas"], equip: "yok", days: [2, 3],
    sessions: [
      { name: t("core_programs.vucut_agirligi_s_tam_vucut"), items: [["Air Squat", 3, "10-20"], ["Incline Push-up", 3, "5-12"], ["Inverted Row", 3, "5-12"], ["Glute Bridge", 3, "12-20"], ["Reverse Lunge", 2, "8-12"], ["Plank", 3, "30-60"]] },
    ],
    who: t("core_programs.vucut_agirligi_who"),
    progression: [
      t("core_programs.vucut_agirligi_prog1"),
      t("core_programs.vucut_agirligi_prog2"),
    ],
    stall: t("core_programs.vucut_agirligi_stall"),
    tips: COMMON_TIPS,
    source: t("core_programs.vucut_agirligi_source"),
  },
  {
    id: "yoga-baslangic",
    name: t("core_programs.yoga_baslangic_name"),
    short: t("core_programs.yoga_baslangic_short"),
    levels: ["yeni", "orta"], goals: ["esneklik"], equip: "yok", days: [2, 3],
    sessions: [
      { name: t("core_programs.yoga_baslangic_s_akis"), items: [["Cat-Cow", 1, "60"], ["Child's Pose", 1, "45"], ["Downward Dog", 3, "20-30"], ["Low Lunge", 2, "20-30"], ["Warrior II", 2, "20-30"], ["Tree Pose", 2, "15-30"], ["Cobra Pose", 3, "15-20"], ["Bridge Pose", 3, "20-30"], ["Supine Twist", 2, "30"], ["Corpse Pose", 1, "180"]] },
    ],
    who: t("core_programs.yoga_baslangic_who"),
    progression: [
      t("core_programs.yoga_baslangic_prog1"),
      t("core_programs.yoga_baslangic_prog2"),
    ],
    stall: t("core_programs.yoga_baslangic_stall"),
    tips: YOGA_TIPS,
    source: YOGA_SOURCE,
  },
  {
    id: "yoga-akis",
    name: t("core_programs.yoga_akis_name"),
    short: t("core_programs.yoga_akis_short"),
    levels: ["orta", "ileri"], goals: ["esneklik"], equip: "yok", days: [2, 3, 4],
    sessions: [
      { name: t("core_programs.yoga_akis_s_a_guc_denge"), items: [["Sun Salutation", 3, "60"], ["Chair Pose", 3, "20-30"], ["Warrior I", 2, "30"], ["Warrior II", 2, "30"], ["Reverse Warrior", 2, "20-30"], ["Extended Side Angle", 2, "30"], ["Half Moon", 2, "15-30"], ["Boat Pose", 3, "20-30"], ["Plank", 3, "30-60"], ["Corpse Pose", 1, "180"]] },
      { name: t("core_programs.yoga_akis_s_b_esneklik"), items: [["Sun Salutation", 3, "60"], ["Triangle Pose", 2, "30"], ["Standing Forward Fold", 2, "30-45"], ["Pigeon Pose", 2, "45-60"], ["Camel Pose", 2, "20-30"], ["Bridge Pose", 3, "30"], ["Seated Forward Fold", 2, "45-60"], ["Butterfly Pose", 2, "45-60"], ["Happy Baby", 1, "45-60"], ["Corpse Pose", 1, "180"]] },
    ],
    who: t("core_programs.yoga_akis_who"),
    progression: [
      t("core_programs.yoga_akis_prog1"),
      t("core_programs.yoga_akis_prog2"),
      t("core_programs.yoga_akis_prog3"),
    ],
    stall: t("core_programs.yoga_akis_stall"),
    tips: YOGA_TIPS.slice(1),
    source: YOGA_SOURCE,
  },
  {
    id: "yoga-sabah",
    name: t("core_programs.yoga_sabah_name"),
    short: t("core_programs.yoga_sabah_short"),
    levels: ["yeni", "orta", "ileri"], goals: ["esneklik", "genel"], equip: "yok", days: [3, 4, 5],
    sessions: [
      { name: t("core_programs.yoga_sabah_s_sabah"), items: [["Mountain Pose", 1, "30"], ["Sun Salutation", 3, "60"], ["Warrior II", 2, "20-30"], ["Tree Pose", 2, "20-30"], ["Downward Dog", 2, "30"], ["Child's Pose", 1, "45"]] },
    ],
    who: t("core_programs.yoga_sabah_who"),
    progression: [t("core_programs.yoga_sabah_prog1")],
    stall: t("core_programs.yoga_sabah_stall"),
    tips: YOGA_TIPS,
    source: YOGA_SOURCE,
  },
  {
    id: "yoga-aksam",
    name: t("core_programs.yoga_aksam_name"),
    short: t("core_programs.yoga_aksam_short"),
    levels: ["yeni", "orta", "ileri"], goals: ["esneklik", "genel"], equip: "yok", days: [2, 3, 4, 5],
    sessions: [
      { name: t("core_programs.yoga_aksam_s_aksam"), items: [["Cat-Cow", 1, "60"], ["Child's Pose", 1, "60"], ["Pigeon Pose", 2, "45-60"], ["Seated Forward Fold", 2, "45-60"], ["Butterfly Pose", 1, "60"], ["Supine Twist", 2, "45"], ["Legs Up the Wall", 1, "120-180"], ["Corpse Pose", 1, "180"]] },
    ],
    who: t("core_programs.yoga_aksam_who"),
    progression: [t("core_programs.yoga_aksam_prog1")],
    stall: t("core_programs.yoga_aksam_stall"),
    tips: YOGA_TIPS,
    source: YOGA_SOURCE,
  },
];

}
const catalogs = { tr: buildPrograms("tr"), en: buildPrograms("en") };
// Read the current language on access rather than capturing it at module import.
export const PROGRAMS: ProgramDef[] = new Proxy([] as ProgramDef[], {
  get: (_target, key) => Reflect.get(catalogs[lang()], key),
  has: (_target, key) => key in catalogs[lang()],
});
export const presetSessionName = (p: ProgramDef, index: number): string =>
  p.sessions.length > 1 ? p.name + " · " + p.sessions[index].name : p.name;
export interface NamedProgram { name: string; lib?: string; customName?: boolean }
// Recognize exact legacy defaults in both languages without changing stored data.
export function presetSessionIndex(p: NamedProgram): number | undefined {
  if (!p.lib || p.customName) return undefined;
  for (const language of ["tr", "en"] as const) {
    const def = catalogs[language].find(x => x.id === p.lib);
    const index = def?.sessions.findIndex((_, i) => presetSessionName(def, i) === p.name);
    if (index !== undefined && index >= 0) return index;
  }
  return undefined;
}
export function programName(p: NamedProgram): string {
  const index = presetSessionIndex(p), def = programById(p.lib || "");
  return def && index !== undefined ? presetSessionName(def, index) : p.name;
}
export const programById = (id: string) => PROGRAMS.find(p => p.id === id);

// Haftanın hangi günleri (WEEKDAYS kodları) — gün sayısına göre, araya dinlenme koyarak
export const PLAN_DAYS: Record<number, string[]> = { 2: ["MO", "TH"], 3: ["MO", "WE", "FR"], 4: ["MO", "TU", "TH", "FR"], 5: ["MO", "TU", "WE", "FR", "SA"], 6: ["MO", "TU", "WE", "TH", "FR", "SA"] };

// Seçilen gün sayısında haftalık plan: gün kodu → seans indeksi
export function weeklyPlan(p: ProgramDef, days: number): [string, number][] {
  const codes = PLAN_DAYS[days] || PLAN_DAYS[3];
  const order = p.rotation?.[days] ?? codes.map((_, i) => i % p.sessions.length);
  return codes.map((c, i) => [c, order[i]]);
}

export interface Answers { level: Level; goal: Goal; equip: Equip; days: number }
export interface Recommendation { program: ProgramDef; days: number; reasons: string[]; alternatives: { program: ProgramDef; days: number; why: string }[] }

// gün sayısını programın desteklediği en yakın değere çeker (eşitlikte az olanı seçer)
const fitDays = (p: ProgramDef, d: number) => p.days.reduce((best, x) => Math.abs(x - d) < Math.abs(best - d) ? x : best, p.days[0]);
const P = (id: string) => programById(id)!;

export function recommend(a: Answers): Recommendation {
  const reasons: string[] = [];
  let main: ProgramDef, alts: [string, string][] = [];

  if (a.goal === "esneklik") {
    // yoga için mat yeterli; ekipman sorusu önemsiz
    main = a.level === "yeni" ? P("yoga-baslangic") : P("yoga-akis");
    reasons.push(a.level === "yeni"
      ? t("core_programs.rec_1")
      : t("core_programs.rec_2"));
    reasons.push(t("core_programs.rec_3"));
    alts = [["yoga-sabah", t("core_programs.rec_4")], ["yoga-aksam", t("core_programs.rec_5")]];
  } else if (a.equip === "yok") {
    main = P("vucut-agirligi");
    reasons.push(t("core_programs.rec_6"));
    alts = [["ev-dumbbell", t("core_programs.rec_7")]];
  } else if (a.equip === "ev") {
    main = P("ev-dumbbell");
    reasons.push(t("core_programs.rec_8"));
    alts = [["vucut-agirligi", t("core_programs.rec_9")]];
  } else if (a.level === "yeni") {
    if (a.goal === "guc") {
      main = a.days >= 3 ? P("5x5") : P("3x5");
      reasons.push(t("core_programs.rec_10"));
      alts = a.days >= 3 ? [["3x5", t("core_programs.rec_11")], ["gzclp", t("core_programs.rec_12")]] : [["baslangic-tam", t("core_programs.rec_13")]];
    } else if (a.goal === "kas" && a.days >= 4) {
      main = P("gzclp");
      reasons.push(t("core_programs.rec_14"));
      alts = [["baslangic-tam", t("core_programs.rec_15")]];
    } else {
      main = P("baslangic-tam");
      reasons.push(t("core_programs.rec_16"));
      alts = [["5x5", t("core_programs.rec_17")]];
    }
    if (a.days >= 5) reasons.push(t("core_programs.rec_18"));
  } else {
    if (a.goal === "guc") {
      main = P("gzclp");
      reasons.push(t("core_programs.rec_19"));
      alts = [["ust-alt", t("core_programs.rec_20")]];
    } else if (a.days >= 5 && a.goal === "kas") {
      main = P("ppl");
      reasons.push(t("core_programs.rec_21"));
      alts = [["ust-alt", t("core_programs.rec_22")]];
    } else if (a.days >= 4) {
      main = P("ust-alt");
      reasons.push(t("core_programs.rec_23"));
      alts = [["gzclp", t("core_programs.rec_24")]];
    } else {
      main = a.goal === "kas" ? P("gzclp") : P("baslangic-tam");
      reasons.push(a.goal === "kas"
        ? t("core_programs.rec_25")
        : t("core_programs.rec_26"));
      alts = [["ppl", t("core_programs.rec_27")]];
    }
  }

  const days = fitDays(main, a.days);
  if (days !== a.days) reasons.push(t("core_programs.rec_days_fit", { name: main.name, days: main.days.join(lang() === "tr" ? " ya da " : " or "), fit: days }));
  reasons.push(a.goal === "esneklik"
    ? t("core_programs.rec_28")
    : t("core_programs.rec_29"));
  return {
    program: main, days, reasons,
    alternatives: alts.filter(([id]) => id !== main.id).map(([id, why]) => ({ program: P(id), days: fitDays(P(id), a.days), why })),
  };
}
