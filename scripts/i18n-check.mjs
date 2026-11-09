// Çeviri raporu: eksik anahtarlar ve en değeri tr ile aynı olan (çevrilmemiş olabilecek) anahtarlar. Hata kodu vermez.
import { readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
const load = async l => (await import(pathToFileURL(resolve("src/i18n", l, "index.ts")).href)).default;
let tr, en;
try { [tr, en] = [await load("tr"), await load("en")]; }
catch (e) { console.error("TS dosyaları doğrudan yüklenemedi (Node 22.6+ gerekir, --experimental-strip-types):", e.message); process.exit(1); }
const flat = d => Object.fromEntries(Object.entries(d).flatMap(([ns, o]) => Object.entries(o).map(([k, v]) => [ns + "." + k, v])));
const T = flat(tr), E = flat(en);
const missEn = Object.keys(T).filter(k => !(k in E)), missTr = Object.keys(E).filter(k => !(k in T));
const same = Object.keys(T).filter(k => k in E && E[k] === T[k]);
console.log(`tr: ${Object.keys(T).length} anahtar, en: ${Object.keys(E).length} anahtar`);
console.log(`en'de eksik (${missEn.length}):`, missEn.join(", ") || "-");
console.log(`tr'de eksik (${missTr.length}):`, missTr.join(", ") || "-");
console.log(`en = tr (çevrilmemiş olabilir) (${same.length}):`, same.join(", ") || "-");
