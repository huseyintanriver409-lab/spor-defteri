/* ---------- Bağlantıyla program ekleme ----------
   Claude (ya da bir arkadaş) programı tek bir bağlantı olarak verir; uygulama açılınca önizleyip ekler.
   Biçim, elle ve dil modeliyle hatasız yazılabilsin diye okunabilir metindir (base64 değil):

     …/spor-defteri.html#ekle=p=Üst+Alt;g=Üst:Bench+Press/4/6-8,Barbell+Row/4/6-8;g=Alt:Back+Squat/4/6-8;w=MO:0,TH:1

   p = program adı · her gün ayrı bir g= ("Ad:" + "," ile ayrılmış hareketler; hareket/set/tekrar)
   w = isteğe bağlı haftalık plan: gün kodu:gün sırası@saat (MO/TU/WE/TH/FR/SA/SU ya da Pzt/Sal/…; sıra ve saat isteğe bağlı)
   u = isteğe bağlı bitiş tarihi (YYYY-AA-GG ya da GG.AA.YYYY); plan o güne kadar takvime yazılır
   Programsız bağlantı yalnız planı değiştirir, günlere mevcut programlar konur: …#ekle=w=MO@18:00,WE,SA;u=2027-01-06
   Boşluk yerine "+" ya da %20 kullanılabilir. Tarayıcıya bağlı değildir; testleri tests/importer.test.ts.
   Eski biçim (günler "|", hareket*set*tekrar) de okunur; ama yazılmaz: Claude'un telefon uygulaması "*4*"ü italik
   sanıp bağlantıyı ilk hareketten sonra kesiyor, Android'in bağlantı tanıyıcısı da "|" işaretinde duruyor. */
import { t } from "./i18n.ts";
import { canonicalEx, EX_RENAMES } from "./renames.ts";

export const LINK_KEY = "ekle";

export interface ImportItem { ex: string; sets: number; reps: string; original: string; known: boolean }
export interface ImportDay { name: string; items: ImportItem[] }
// plan: [gün kodu, gün sırası]; programsız bağlantıda (days boş) sıra -1. times: gün kodu → "SS:DD"
export interface ImportedProgram {
  name: string; days: ImportDay[]; plan: [string, number][]; times: Record<string, string>; until: string; warnings: string[];
  // kütüphanede bulunamayan hareketlerin ham adları (uyarı metni çevrildiği için filtreleme bu listeye göre yapılır)
  unknown: string[];
}

export const DAY_CODES: Record<string, string> = {
  mo: "MO", pzt: "MO", pazartesi: "MO", tu: "TU", sal: "TU", sali: "TU", we: "WE", car: "WE", carsamba: "WE",
  th: "TH", per: "TH", persembe: "TH", fr: "FR", cum: "FR", cuma: "FR", sa: "SA", cmt: "SA", cumartesi: "SA", su: "SU", paz: "SU", pazar: "SU",
};

// "Pazartesi", "pzt", "MO" → "MO"; tanınmazsa ""
export const dayCode = (s: string): string => DAY_CODES[normalize(s || "").replace(/ /g, "")] || "";

// Karşılaştırma için: küçük harf, Türkçe harfler sadeleşir, harf/rakam dışı her şey boşluk
export function normalize(s: string): string {
  return s.toLocaleLowerCase("tr-TR")
    .replace(/ş/g, "s").replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c").replace(/â/g, "a").replace(/î/g, "i")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

// Yaygın başka adlar (normalize edilmiş) → kütüphanedeki ad. Claude ve başka uygulamalar böyle yazabiliyor.
const ALIASES: Record<string, string> = {
  "conventional deadlift": "Deadlift", "barbell deadlift": "Deadlift",
  "dumbbell overhead press": "Standing Dumbbell Press", "standing dumbbell overhead press": "Standing Dumbbell Press",
  "dumbbell shoulder press": "Seated Dumbbell Shoulder Press", "seated dumbbell overhead press": "Seated Dumbbell Shoulder Press",
  "military press": "Overhead Press (Barbell)", "ohp": "Overhead Press (Barbell)", "barbell overhead press": "Overhead Press (Barbell)",
  "rdl": "Romanian Deadlift", "barbell romanian deadlift": "Romanian Deadlift",
  "wood chop": "Cable Woodchopper", "woodchop": "Cable Woodchopper", "cable wood chop": "Cable Woodchopper", "cable chop": "Cable Woodchopper",
  "cable high to low chop": "Cable Woodchopper", "cable low to high chop": "Cable Woodchopper", "high to low cable chop": "Cable Woodchopper",
  "pull up": "Pull-up", "pullup": "Pull-up", "push up": "Push-up", "pushup": "Push-up",
  // Türkçe günlük adlar (eski kütüphane adları matchExercise başında canonicalEx ile çözülür)
  "sinav": "Push-up", "barfiks": "Pull-up", "mekik": "Sit-up", "kosu": "Treadmill Run", "yuruyus": "Walking / Incline Walk",
  // Türkçe yoga adları
  "agac": "Tree Pose", "kobra": "Cobra Pose", "dag durusu": "Mountain Pose", "cocuk pozu": "Child's Pose", "kedi inek": "Cat-Cow", "kopru": "Bridge Pose",
  "guvercin": "Pigeon Pose", "kelebek": "Butterfly Pose", "deve": "Camel Pose", "sandalye": "Chair Pose", "kayik": "Boat Pose", "ucgen": "Triangle Pose",
  "yarim ay": "Half Moon", "alcak hamle": "Low Lunge", "mutlu bebek": "Happy Baby", "derin rahatlama": "Corpse Pose", "ters savasci": "Reverse Warrior",
  "savasci 1": "Warrior I", "savasci 2": "Warrior II", "asagi bakan kopek": "Downward Dog", "yukari bakan kopek": "Upward Dog", "gunese selam": "Sun Salutation",
  "yuzme": "Swimming", "eliptik": "Elliptical", "ip atlama": "Jump Rope", "sabit bisiklet": "Stationary Bike", "bisiklet": "Outdoor Cycling",
};
// Benzerlik puanında sayılmayan dolgu kelimeleri
const FILLER = new Set(["to", "the", "a", "with", "and", "conventional", "standard", "regular"]);
// Hareketin türünü belirleyen kelimeler: iki adda farklıysa (chop ↔ fly) benzer sayılmaz
const KINDS = ["press", "fly", "flye", "row", "curl", "chop", "woodchopper", "squat", "deadlift", "raise", "extension", "pulldown", "pushdown",
  "lunge", "dip", "dips", "crunch", "plank", "shrug", "thrust", "bridge", "pullover", "kickback", "carry", "walk", "twist", "rollout", "clean", "snatch", "jerk", "swing"];
const kindsOf = (words: string[]) => new Set(words.filter(w => KINDS.includes(w)));

// eski kütüphane adlarının normalize hâli → yeni ad ("Sinav (Push-up)" gibi yazımlar için)
const OLD_NORM = new Map(Object.entries(EX_RENAMES).map(([o, n]) => [normalize(o), n] as const));

// Hareket adını uygulamadaki listeyle eşleştirir: bilinen başka ad → birebir → biri diğerini içeriyor →
// kelime örtüşmesi (hareket türü aynıysa). Bulunamazsa null (yeni hareket olarak eklenir).
export function matchExercise(name: string, known: string[]): string | null {
  // eski (Türkçe karışık) kütüphane adları yeni adlara çözülür; eski adla özel hareket varsa (known içinde) o korunur
  if (!known.includes(name)) {
    const c = canonicalEx(String(name || "").trim());
    if (c !== name && known.includes(c)) return c;
    const old = OLD_NORM.get(normalize(name));
    if (old && known.includes(old)) return old;
  }
  const n = normalize(name);
  if (!n) return null;
  // bilinen başka ad birebir eşleşmeden önce gelir: eskiden aynı adla özel hareket eklenmiş olsa da kütüphanedeki kazanır
  const alias = ALIASES[n];
  if (alias && known.includes(alias)) return alias;
  const norm = known.map(k => [k, normalize(k)] as const);
  const exact = norm.find(([, k]) => k === n);
  if (exact) return exact[0];
  // "bench press" → "Bench Press (Barbell)": verilen ad listedekinin başında/içinde geçiyorsa en kısası
  const contains = norm.filter(([, k]) => (" " + k + " ").includes(" " + n + " ")).sort((a, b) => a[1].length - b[1].length);
  if (contains.length) return contains[0][0];
  const words = n.split(" ").filter(w => !FILLER.has(w)), wset = new Set(words), kinds = kindsOf(words);
  let best: string | null = null, score = 0;
  for (const [k, kn] of norm) {
    const kw = kn.split(" ").filter(w => !FILLER.has(w)), kk = kindsOf(kw);
    if (kinds.size && kk.size && ![...kinds].some(x => kk.has(x))) continue;
    const common = kw.filter(w => wset.has(w)).length;
    const s = common / new Set([...kw, ...words]).size;
    if (s > score) { score = s; best = k; }
  }
  return score >= 0.6 ? best : null;
}

const clean = (s: string) => s.replace(/\+/g, " ").replace(/\s+/g, " ").trim();

// Bağlantıdan ya da yapıştırılan metinden "#ekle=…" kısmını alıp çözer
export function extractPayload(input: string): string | null {
  let s = input.trim();
  const at = s.search(/[#?&]ekle=/);
  if (at >= 0) {
    s = s.slice(at + 1 + "ekle=".length);
    // bağlantı bir mesajın içindeyse ilk boşlukta/tırnakta biter; markdown'daki kapanış parantezi
    // (hareket adlarındaki parantezler dengeli olduğu için) yalnız parantezler dengesizse atılır
    s = s.split(/[\s"'<>\]]/)[0];
    const count = (c: string) => s.split(c).length - 1;
    while (s.endsWith(")") && count(")") > count("(")) s = s.slice(0, -1);
    s = s.replace(/[.,]+$/, "");
  } else if (/^[pw]=/.test(s)) {
    // bağlantısız, elle yazılmış metin: satır sonları ayraç sayılmaz
    s = s.replace(/\s*\n\s*/g, "");
  } else return null;
  try { s = decodeURIComponent(s.replace(/\+/g, "%20")); } catch { /* elle yazılmış, kodlanmamış metin */ }
  return s;
}

export function parseProgram(input: string, knownExercises: string[]): ImportedProgram | null {
  const payload = extractPayload(input);
  if (!payload) return null;
  const parts: Record<string, string> = {}, dayTexts: string[] = [];
  for (const seg of payload.split(";")) {
    const i = seg.indexOf("=");
    if (i <= 0) continue;
    const key = seg.slice(0, i).trim().toLowerCase(), val = seg.slice(i + 1);
    if (key === "g") dayTexts.push(...val.split("|"));
    else parts[key] = val;
  }
  if (!dayTexts.length && !parts.w) return null;
  const warnings: string[] = [], unknown: string[] = [];
  const days: ImportDay[] = dayTexts.map((d, di) => {
    const c = d.indexOf(":");
    const name = clean(c >= 0 ? d.slice(0, c) : "") || String.fromCharCode(65 + di);
    const items = (c >= 0 ? d.slice(c + 1) : d).split(",").map(x => x.trim()).filter(Boolean).map(raw => {
      const [exRaw, setsRaw, repsRaw] = raw.split(/[/*]/).map(clean);
      const sets = Math.min(20, Math.max(1, parseInt(setsRaw) || 3));
      const reps = (repsRaw || "").match(/^\d+(-\d+)?$/) ? repsRaw : (repsRaw ? (repsRaw.match(/\d+(-\d+)?/) || [""])[0] : "");
      const m = matchExercise(exRaw, knownExercises);
      if (!m) { unknown.push(exRaw); warnings.push(t("ai.warn_unknown", { name: exRaw })); }
      return { ex: m || exRaw, sets, reps, original: exRaw, known: !!m };
    }).filter(it => it.ex);
    return { name, items };
  }).filter(d => d.items.length);
  if (dayTexts.length && !days.length) return null;
  const plan: [string, number][] = [], times: Record<string, string> = {};
  if (parts.w) for (const pair of parts.w.split(",").map(x => x.trim()).filter(Boolean)) {
    const [dayPart, timePart] = pair.split("@");
    const [d, n] = dayPart.split(":").map(x => x.trim());
    const code = dayCode(d);
    // sıra yazılmamışsa günler programın günlerine sırayla dağıtılır; programsız bağlantıda sıra yok (-1)
    const idx = !days.length ? -1 : n ? parseInt(n) : plan.length % days.length;
    if (!code || plan.some(([c]) => c === code) || (days.length && !(idx >= 0 && idx < days.length))) {
      warnings.push(t("ai.warn_plan", { pair })); continue;
    }
    plan.push([code, idx]);
    if (timePart) {
      const tm = parseTime(timePart);
      if (tm) times[code] = tm; else warnings.push(t("ai.warn_time", { time: timePart }));
    }
  }
  if (!days.length && !plan.length) return null;
  let until = "";
  if (parts.u) { until = parseDate(parts.u); if (!until) warnings.push(t("ai.warn_until", { date: parts.u })); }
  return { name: clean(parts.p || "") || t("ai.default_name"), days, plan, times, until, warnings, unknown };
}

// "18:00", "18.30", "1830", "7" → "SS:DD"
export function parseTime(s: string): string {
  const m = s.trim().match(/^(\d{1,2})(?:[:.]?(\d{2}))?$/);
  if (!m || +m[1] > 23 || +(m[2] || 0) > 59) return "";
  return m[1].padStart(2, "0") + ":" + (m[2] || "00");
}

// "2027-01-06", "6.1.2027", "06/01/2027" → "YYYY-AA-GG" (geçersiz tarihse "")
export function parseDate(s: string): string {
  s = s.trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/), y: number, mo: number, d: number;
  if (m) [y, mo, d] = [+m[1], +m[2], +m[3]];
  else if ((m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/))) [d, mo, y] = [+m[1], +m[2], +m[3]];
  else return "";
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return "";
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// Uygulamadaki bir programı paylaşılabilir bağlantıya çevirir (aynı biçim; boşluklar "+")
export function buildLink(base: string, name: string, days: { name: string; items: { ex: string; sets: number; reps?: string }[] }[], plan: [string, number][] = []): string {
  const enc = (s: string) => encodeURIComponent(s.replace(/[;|:,*/]/g, " ").trim()).replace(/%20/g, "+");
  const g = days.map(d => `;g=${enc(d.name)}:${d.items.map(i => `${enc(i.ex)}/${i.sets}/${encodeURIComponent(i.reps || "")}`).join(",")}`).join("");
  const w = plan.length ? `;w=${plan.map(([c, i]) => `${c}:${i}`).join(",")}` : "";
  return `${base}#${LINK_KEY}=p=${enc(name)}${g}${w}`;
}

// Yapay zekâya (Claude, ChatGPT, Gemini…) verilecek hazır istek: biçimi ve kuralları anlatır. today: "YYYY-AA-GG" ("6 Ocak'a kadar" doğru yıla çözülsün)
export function aiPrompt(base: string, wish: string, today = ""): string {
  return [
    t("ai.prompt_intro") + (wish ? t("ai.prompt_wish", { wish }) : ""),
    (today ? t("ai.prompt_today", { today }) : "") + t("ai.prompt_ask"),
    t("ai.prompt_explain"),
    `${base}#ekle=p=Program+Adi;g=Gun1+Adi:Hareket+Adi/set/tekrar,Hareket+Adi/set/tekrar;g=Gun2+Adi:Hareket+Adi/set/tekrar;w=MO:0@18:00,WE:1@18:00,SA:0@10:00;u=2027-01-06`,
    t("ai.prompt_example"),
    t("ai.prompt_rules"),
    t("ai.prompt_w"),
    t("ai.prompt_u"),
    t("ai.prompt_planonly", { link: `${base}#ekle=w=MO@18:00,WE@18:00,SA@10:00;u=2027-01-06` }),
    t("ai.prompt_chars"),
    t("ai.prompt_names"),
    t("ai.prompt_clickable"),
  ].join("\n");
}
