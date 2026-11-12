/* Çeviri altyapısı (bağımlılıksız; node/MCP'de de import edilebilir).
   Sözlükler: src/i18n/<tr|en>/<ad_alani>.ts, her biri `export default { anahtar: "metin" }`; ad alanları
   src/i18n/<dil>/index.ts içinde toplanır. Yeni ad alanı: iki dilde dosya aç + iki index'e birer satır ekle.
   Anahtar "ad_alani.anahtar" biçimindedir; küçük harf ve alt çizgi. HTML içeren metnin anahtarı "_html" ile biter
   (data-i18n-html / innerHTML). Çoğul için ayrı anahtar (ör. set_one, set_many). Yer tutucu: {ad}, t(k, {ad: 3}).
   Geri düşüş: etkin dil -> tr -> anahtarın kendisi. Dil tercihi cihaza özeldir (Drive'a eşitlenmez); değişince sayfa
   yeniden yüklenir, bu yüzden dile bağlı sabitler (dates.ts MONTHS gibi) modül yüklenirken hesaplanabilir. */
import trDict from "../i18n/tr/index.ts";
import enDict from "../i18n/en/index.ts";

export type Lang = "tr" | "en";
export type LangPref = "system" | "tr" | "en";
export const LANG_KEY = "sporDefteri.lang";

const DICTS: Record<Lang, Record<string, Record<string, string>>> = { tr: trDict, en: enDict };

export const detectLang = (navLang?: string): Lang => (navLang || "").toLowerCase().startsWith("tr") ? "tr" : "en";

const hasWindow = () => typeof document !== "undefined" && typeof localStorage !== "undefined" && typeof navigator !== "undefined";

export function getLangPref(): LangPref {
  try { const v = localStorage.getItem(LANG_KEY); if (v === "tr" || v === "en" || v === "system") return v; } catch { /* node/MCP */ }
  return hasWindow() ? "system" : "tr";
}
export function setLangPref(p: LangPref): void { try { localStorage.setItem(LANG_KEY, p); } catch { /* yok say */ } }

export function lang(): Lang {
  const p = getLangPref();
  if (p === "tr" || p === "en") return p;
  return hasWindow() ? detectLang(navigator.language) : "tr";
}
export const locale = (): string => lang() === "tr" ? "tr-TR" : "en-US";

export function t(key: string, vars?: Record<string, string | number>): string {
  const i = key.indexOf("."), ns = key.slice(0, i), k = key.slice(i + 1);
  let s = i < 0 ? undefined : DICTS[lang()][ns]?.[k] ?? DICTS.tr[ns]?.[k];
  if (s === undefined) s = key;
  return vars ? s.replace(/\{(\w+)\}/g, (m, n) => n in vars ? String(vars[n]) : m) : s;
}

export const fmtNum = (n: number, opts?: Intl.NumberFormatOptions): string => new Intl.NumberFormat(locale(), opts).format(n);
export const fmtDate = (d: Date | number, opts?: Intl.DateTimeFormatOptions): string => new Intl.DateTimeFormat(locale(), opts).format(d);

// Arama için: dile duyarlı küçültme (görünen metin için de kullanılabilir)
export const lower = (s: string): string => s.toLocaleLowerCase(lang());
// Arama karşılaştırması: küçült, ı -> i, aksanları sadeleştir (Incline = incline = İncline, şınav = sinav)
export const searchFold = (s: string): string =>
  lower(s).replace(/ı/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, "");

// [data-i18n] textContent, [data-i18n-html] innerHTML, [data-i18n-title], [data-i18n-aria] (aria-label), [data-i18n-placeholder]
export function applyI18n(root: ParentNode = document): void {
  const each = (attr: string, fn: (el: HTMLElement, v: string) => void) =>
    root.querySelectorAll<HTMLElement>(`[${attr}]`).forEach(el => fn(el, t(el.getAttribute(attr)!)));
  each("data-i18n", (el, v) => { el.textContent = v; });
  each("data-i18n-html", (el, v) => { el.innerHTML = v; });
  each("data-i18n-title", (el, v) => { el.title = v; });
  each("data-i18n-aria", (el, v) => { el.setAttribute("aria-label", v); });
  each("data-i18n-placeholder", (el, v) => { (el as HTMLInputElement).placeholder = v; });
  document.documentElement.lang = lang();
}

export const tCount = (key: string, n: number): string => t(n === 1 ? key + "_one" : key, { n });
