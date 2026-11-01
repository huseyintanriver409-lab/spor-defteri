// Tarih yardımcıları. Uygulama tarihleri yerel saatte "YYYY-MM-DD" metni olarak saklar.

export const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
export const DAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

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
