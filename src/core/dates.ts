import { lang } from "./i18n.ts";

// Tarih yardımcıları. Uygulama tarihleri yerel saatte "YYYY-MM-DD" metni olarak saklar.

// Dile göre adlar; dil değişince sayfa yeniden yüklendiği için modül yüklenirken seçilir
const NAMES = {
  tr: { months: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
    monthsLong: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
    days: ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"] },
  en: { months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    monthsLong: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] },
}[lang()];
export const MONTHS = NAMES.months;
export const MONTHS_LONG = NAMES.monthsLong;
export const DAYS = NAMES.days;

export const pad = (n: number | string): string => String(n).padStart(2, "0");
export const ymd = (d: Date): string => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
export const parse = (s: string): Date => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const niceDate = (s: string): string => { const d = parse(s); return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear() + ", " + DAYS[d.getDay()]; };
export const shortDate = (s: string): string => { const d = parse(s); return d.getDate() + " " + MONTHS[d.getMonth()]; };

// haftanın pazartesisi (00:00)
export function mondayOf(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
