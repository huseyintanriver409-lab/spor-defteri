/* ---------- Bağlantıyla program ekleme ----------
   Claude (ya da bir arkadaş) programı tek bir bağlantı olarak verir; uygulama açılınca önizleyip ekler.
   Biçim, elle ve dil modeliyle hatasız yazılabilsin diye okunabilir metindir (base64 değil):

     …/spor-defteri.html#ekle=p=Üst+Alt;g=Üst:Bench+Press/4/6-8,Barbell+Row/4/6-8;g=Alt:Back+Squat/4/6-8;w=MO:0,TH:1

   p = program adı · her gün ayrı bir g= ("Ad:" + "," ile ayrılmış hareketler; hareket/set/tekrar)
   w = isteğe bağlı haftalık plan (gün kodu:gün sırası; MO/TU/WE/TH/FR/SA/SU ya da Pzt/Sal/…)
   Boşluk yerine "+" ya da %20 kullanılabilir. Tarayıcıya bağlı değildir; testleri tests/importer.test.ts.
   Eski biçim (günler "|", hareket*set*tekrar) de okunur; ama yazılmaz: Claude'un telefon uygulaması "*4*"ü italik
   sanıp bağlantıyı ilk hareketten sonra kesiyor, Android'in bağlantı tanıyıcısı da "|" işaretinde duruyor. */

export const LINK_KEY = "ekle";

export interface ImportItem { ex: string; sets: number; reps: string; original: string; known: boolean }
export interface ImportDay { name: string; items: ImportItem[] }
export interface ImportedProgram { name: string; days: ImportDay[]; plan: [string, number][]; warnings: string[] }

const DAY_CODES: Record<string, string> = {
  mo: "MO", pzt: "MO", pazartesi: "MO", tu: "TU", sal: "TU", sali: "TU", we: "WE", car: "WE", carsamba: "WE",
  th: "TH", per: "TH", persembe: "TH", fr: "FR", cum: "FR", cuma: "FR", sa: "SA", cmt: "SA", cumartesi: "SA", su: "SU", paz: "SU", pazar: "SU",
};

// Karşılaştırma için: küçük harf, Türkçe harfler sadeleşir, harf/rakam dışı her şey boşluk
export function normalize(s: string): string {
  return s.toLocaleLowerCase("tr-TR")
    .replace(/ş/g, "s").replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c").replace(/â/g, "a").replace(/î/g, "i")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

// Hareket adını uygulamadaki listeyle eşleştirir: birebir → biri diğerini içeriyor → kelime örtüşmesi.
// Bulunamazsa null (yeni hareket olarak eklenir).
export function matchExercise(name: string, known: string[]): string | null {
  const n = normalize(name);
  if (!n) return null;
  const norm = known.map(k => [k, normalize(k)] as const);
  const exact = norm.find(([, k]) => k === n);
  if (exact) return exact[0];
  // "bench press" → "Bench Press (Barbell)": verilen ad listedekinin başında/içinde geçiyorsa en kısası
  const contains = norm.filter(([, k]) => (" " + k + " ").includes(" " + n + " ")).sort((a, b) => a[1].length - b[1].length);
  if (contains.length) return contains[0][0];
  const words = new Set(n.split(" "));
  let best: string | null = null, score = 0;
  for (const [k, kn] of norm) {
    const kw = kn.split(" "), common = kw.filter(w => words.has(w)).length;
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
  } else if (/^p=/.test(s)) {
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
  if (!dayTexts.length) return null;
  const warnings: string[] = [];
  const days: ImportDay[] = dayTexts.map((d, di) => {
    const c = d.indexOf(":");
    const name = clean(c >= 0 ? d.slice(0, c) : "") || String.fromCharCode(65 + di);
    const items = (c >= 0 ? d.slice(c + 1) : d).split(",").map(x => x.trim()).filter(Boolean).map(raw => {
      const [exRaw, setsRaw, repsRaw] = raw.split(/[/*]/).map(clean);
      const sets = Math.min(20, Math.max(1, parseInt(setsRaw) || 3));
      const reps = (repsRaw || "").match(/^\d+(-\d+)?$/) ? repsRaw : (repsRaw ? (repsRaw.match(/\d+(-\d+)?/) || [""])[0] : "");
      const m = matchExercise(exRaw, knownExercises);
      if (!m) warnings.push(`"${exRaw}" listede yok, yeni hareket olarak eklenecek.`);
      return { ex: m || exRaw, sets, reps, original: exRaw, known: !!m };
    }).filter(it => it.ex);
    return { name, items };
  }).filter(d => d.items.length);
  if (!days.length) return null;
  const plan: [string, number][] = [];
  if (parts.w) for (const pair of parts.w.split(",")) {
    const [d, n] = pair.split(":").map(x => x.trim());
    const code = DAY_CODES[normalize(d || "").replace(/ /g, "")];
    const idx = parseInt(n);
    if (code && idx >= 0 && idx < days.length && !plan.some(([c]) => c === code)) plan.push([code, idx]);
    else warnings.push(`Plan girdisi anlaşılamadı: "${pair.trim()}"`);
  }
  return { name: clean(parts.p || "") || "Claude'dan program", days, plan, warnings };
}

// Uygulamadaki bir programı paylaşılabilir bağlantıya çevirir (aynı biçim; boşluklar "+")
export function buildLink(base: string, name: string, days: { name: string; items: { ex: string; sets: number; reps?: string }[] }[], plan: [string, number][] = []): string {
  const enc = (s: string) => encodeURIComponent(s.replace(/[;|:,*/]/g, " ").trim()).replace(/%20/g, "+");
  const g = days.map(d => `;g=${enc(d.name)}:${d.items.map(i => `${enc(i.ex)}/${i.sets}/${encodeURIComponent(i.reps || "")}`).join(",")}`).join("");
  const w = plan.length ? `;w=${plan.map(([c, i]) => `${c}:${i}`).join(",")}` : "";
  return `${base}#${LINK_KEY}=p=${enc(name)}${g}${w}`;
}

// Claude'a verilecek hazır istek: biçimi ve kuralları anlatır
export function claudePrompt(base: string, wish: string): string {
  return [
    "Spor Defteri adlı antrenman uygulamam için bana bir ağırlık antrenmanı programı hazırla." + (wish ? " İsteğim: " + wish : ""),
    "Önce bana uygun olup olmadığını anlamak için gerekirse kısaca soru sor (deneyim, hedef, ekipman, haftada kaç gün).",
    "Programı kısaca açıkla (hangi gün ne çalışılır, nasıl ilerlenir). Sonra programı uygulamaya eklemem için TEK bir bağlantı ver. Bağlantı biçimi:",
    `${base}#ekle=p=Program+Adi;g=Gun1+Adi:Hareket+Adi/set/tekrar,Hareket+Adi/set/tekrar;g=Gun2+Adi:Hareket+Adi/set/tekrar;w=MO:0,WE:1,FR:0`,
    "Örnek: g=Ust+Vucut:Bench+Press/4/6-8,Barbell+Row/4/8-10,Plank/3/45",
    "Kurallar: boşluk yerine + kullan; her gün için ayrı bir ;g= yaz; hareketleri virgülle ayır; hareket/set/tekrar (tekrar 8 ya da 8-12 gibi; plank gibi süreli hareketlerde saniye).",
    "Bağlantıda yıldız (*), dikey çizgi (|), parantez, boşluk ve Türkçe harf kullanma; telefonda bağlantı yarıda kesiliyor.",
    "Hareket adlarını yaygın İngilizce adlarıyla yaz (Back Squat, Bench Press, Romanian Deadlift, Lat Pulldown, Seated Cable Row, Overhead Press, Leg Press, Plank…).",
    "w isteğe bağlı haftalık plandır: gün kodu (MO TU WE TH FR SA SU) : gün sırası (0'dan başlar).",
    "Bağlantıyı tıklanabilir olarak, kod bloğu içine koymadan yaz.",
  ].join("\n");
}
