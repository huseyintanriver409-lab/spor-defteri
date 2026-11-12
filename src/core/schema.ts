import { sanitizeEquipment } from "./equipment.ts";
import { MUSCLES } from "./musclemap.ts";
import { bodyModel } from "./body-model.ts";
/* ---------- Veri modeli (şema v2) ----------
   Senkronizasyona hazır veri modeli:
   - Her kayıt koleksiyonunda kalıcı bir anahtar var (COLLECTIONS) ve her kayıt son değiştiği anı "u" alanında taşır.
   - Silinen kayıtlar "deleted" listesine mezar taşı olarak yazılır; böylece iki cihaz birleştirilirken silinen kayıt geri dirilmez.
   - Ayarlar tek parça olarak "settingsU" zamanıyla tutulur (son yazan kazanır).
   Bu dosya tarayıcıya ve global duruma bağımlı değildir; birim testleri tests/schema.test.ts içinde. */

import { migrateExNames } from "./renames.ts";

// Runtime-only presence marker: a defaulted [] is not an older client's explicit clear.
// Symbols are ignored by JSON exports and settings signatures. Replacing the array
// through the chooser makes the preference explicit immediately.
const implicitEquipment = Symbol("implicitEquipment");
const hasEquipment = (prefs: any): boolean => Array.isArray(prefs?.equip) && prefs[implicitEquipment] !== prefs.equip;
export const SCHEMA = 2;
export const TOMBSTONE_DAYS = 365;

// Kayıtların içi uygulama genelinde serbest biçimli; burada yalnız birleştirmenin dayandığı alanlar tiplenir.
export interface Stamped { u?: number; ts?: number; [k: string]: any }
export interface Tombstone { c: string; k: string; at: number }
export type State = {
  v: number; deviceId: string; deleted: Tombstone[]; settingsU: number;
  // Program records may carry lib (preset id) and customName (explicit user rename).
  // Names remain persisted verbatim; programName resolves built-in defaults for display.
  entries: Stamped[]; programs: Stamped[]; sessions: Stamped[]; body: Stamped[]; custom: Stamped[];
  [k: string]: any;
};

// until = planın bitiş tarihi ("YYYY-MM-DD", boşsa süresiz)
export const DEFAULT_PLAN = () => ({ days: {}, dur: 60, remind: 30, until: "" });
// Google Takvim: log = biten antrenmanları yaz, plan = haftalık planı tarih tarih etkinlik olarak koy,
// id = uygulamanın oluşturduğu "Spor Defteri" takviminin kimliği, planSig = takvimdeki planın imzası,
// dates = takvime yazılmış plan tarihleri, dated = eski sürümün tekrarlayan plan etkinlikleri silindi.
// mode = plan nasıl konur: "event" saatli etkinlik, "task" tikli Google görevi (taskList = görev listesi, taskSig = görevlerdeki planın imzası).
// Ayarlarla birlikte eşitlenir; böylece cihazlar aynı takvimi kullanır ve plan bir kez yazılır.
export const DEFAULT_GCAL = () => ({ log: false, plan: false, id: "", planSig: "", dates: [] as string[], dated: 0, mode: "event", taskList: "", taskSig: "" });
// profile.sex: "m" | "f" | "o" (diğer) | "" (belirtilmedi); prefs.body: cinsiyet m/f değilse vücut haritasında hangi çizim
export const DEFAULTS = (): State => ({ v: SCHEMA, deviceId: "", entries: [], custom: [], programs: [], active: null, body: [], profile: { sex: "", bw: "", height: "", age: "" }, rest: 90, plan: DEFAULT_PLAN(),
  exNotes: {}, exMuscles: {}, exMusclesU: {}, sessions: [], live: null, goal: 3, autoRest: true, restAuto: true, restAutoMig: true, draft: null, lastBackup: 0, backupSnooze: 0, deleted: [], settingsU: 0,
  exPrefs: {}, plates: [25, 20, 15, 10, 5, 2.5, 1.25], prefs: { wake: true, haptics: true, focus: "both", body: "m", equip: [] as string[] }, favs: [], onboarded: false, gcal: DEFAULT_GCAL(),
  // başlangıç noktası: hareket → şu anki kilo/tekrar (core/baseline.ts)
  baseline: {},
  // seri: "auto" plan varsa günlük yoksa haftalık, "week" haftalık, "off" kapalı (core/streak.ts)
  streakMode: "auto" });

export const COLLECTIONS: Record<"entries" | "programs" | "sessions" | "body" | "custom", (x: Stamped) => string> = {
  entries: x => x.id, programs: x => x.id, sessions: x => x.id, body: x => x.date, custom: x => x.name,
};
type Coll = keyof typeof COLLECTIONS;
const collNames = Object.keys(COLLECTIONS) as Coll[];
export const SETTINGS = ["profile", "plan", "goal", "exNotes", "rest", "restAuto", "restAutoMig", "autoRest", "exPrefs", "plates", "prefs", "favs", "gcal", "baseline", "streakMode"];

// eksik alanları varsayılanlarla tamamlar ve eski şemaları yükseltir (eski kayıtlar ve yedekler için)
export function withDefaults(s: any, migrateNames = true, migrateRest = true): State {
  const d = DEFAULTS();
  const out: State = { ...d, ...s, profile: { ...d.profile, ...(s.profile || {}) }, plan: { ...d.plan, ...(s.plan || {}) }, prefs: { ...d.prefs, ...(s.prefs || {}) }, gcal: { ...d.gcal, ...(s.gcal || {}) } };
  if (migrateRest && s.restAutoMig === undefined) {
    out.restAuto = out.rest === 90;
  }
  if (migrateRest) out.restAutoMig = true;
  // eski kayıtlarda prefs.body yoktu: harita cinsiyetten türetiliyordu; açık seçim varsa dokunulmaz
  if (!s.prefs || s.prefs.body === undefined) out.prefs.body = bodyModel({}, out.profile.sex);
  for (const c of collNames) if (!Array.isArray(out[c])) out[c] = [];
  if (!Array.isArray(out.deleted)) out.deleted = [];
  out.prefs.equip = sanitizeEquipment(out.prefs.equip);
  if (!hasEquipment(s.prefs)) Object.defineProperty(out.prefs, implicitEquipment, { value: out.prefs.equip });
  out.custom = out.custom.map(c => Object.hasOwn(c, "need") ? { ...c, need: sanitizeEquipment(c.need) } : c);
  // Imported dictionaries and their values are untrusted.
  const safeKey = (k: string) => !["__proto__", "constructor", "prototype"].includes(k);
  const weights: Record<string, Record<string, number>> = Object.create(null);
  const clocks: Record<string, number> = Object.create(null);
  if (out.exMuscles && typeof out.exMuscles === "object" && !Array.isArray(out.exMuscles)) {
    for (const [ex, raw] of Object.entries(out.exMuscles)) {
      if (!safeKey(ex) || !raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const clean = Object.fromEntries(Object.entries(raw).filter(([m, w]) => MUSCLES.includes(m) && typeof w === "number" && Number.isFinite(w) && w > 0 && w <= 1));
      if (Object.keys(clean).length) weights[ex] = clean;
    }
  }
  if (out.exMusclesU && typeof out.exMusclesU === "object" && !Array.isArray(out.exMusclesU)) {
    for (const [ex, stamp] of Object.entries(out.exMusclesU)) if (safeKey(ex) && typeof stamp === "number" && Number.isFinite(stamp) && stamp >= 0) clocks[ex] = stamp;
  }
  out.exMuscles = weights; out.exMusclesU = clocks;
  if (!(s.v >= 2)) {
    // v1 → v2: değişiklik zamanı bilinmeyen eski kayıtlar en eski sayılır, böylece birleştirmede yeni düzenlemeler kazanır
    for (const c of collNames) out[c].forEach(x => { if (!x.u) x.u = x.ts || 1; });
    out.settingsU = out.settingsU || 1; out.v = SCHEMA;
  }
  // kütüphane adları İngilizceye çevrildi: eski adlı yerel veri, Drive dosyası ve yedekler burada yeni ada taşınır (core/renames.ts)
  return migrateNames ? migrateExNames(out) : out;
}

// "u" dışındaki içerik imzası: aynı imza = içerik değişmemiş
export const sig = (x: Stamped): string => { const { u, ...rest } = x; return JSON.stringify(rest); };
export const settingsSig = (s: State): string => JSON.stringify(SETTINGS.map(k => s[k]));

export type Snapshot = { settings: string; muscles: Record<string, string> } & Record<Coll, Map<string, string>>;

export function takeSnapshot(state: State): Snapshot {
  const snap = { settings: settingsSig(state), muscles: Object.fromEntries(Object.entries(state.exMuscles || {}).map(([k, v]) => [k, JSON.stringify(v)])) } as Snapshot;
  for (const c of collNames) snap[c] = new Map(state[c].map(x => [COLLECTIONS[c](x), sig(x)]));
  return snap;
}

// Son kaydedilen halle karşılaştırıp değişen kayıtlara "u" basar, silinenler için mezar taşı yazar.
// state'i yerinde değiştirir ve bir sonraki karşılaştırma için yeni anlık görüntüyü döndürür.
// İlk çağrıda (snapshot yokken) yalnızca anlık görüntü alır, damga basmaz.
export function stampChanges(state: State, snapshot: Snapshot | null, now = Date.now()): Snapshot {
  if (!snapshot) return takeSnapshot(state);
  for (const c of collNames) {
    const key = COLLECTIONS[c], prev = snapshot[c], seen = new Set<string>();
    state[c].forEach(x => {
      const k = key(x); seen.add(k);
      if (prev.get(k) !== sig(x)) {
        x.u = now;
        // aynı anahtarla yeniden eklenen kayıt (örn. aynı güne yeni ölçü) eski mezar taşını geçersiz kılar
        if (!prev.has(k)) state.deleted = state.deleted.filter(t => !(t.c === c && t.k === k));
      }
    });
    prev.forEach((_, k) => { if (!seen.has(k)) state.deleted.push({ c, k, at: now }); });
  }
  // Per-exercise clocks include resets, so stale devices cannot revive assignments.
  state.exMusclesU ||= {};
  for (const k of new Set([...Object.keys(snapshot.muscles || {}), ...Object.keys(state.exMuscles || {})])) {
    if (snapshot.muscles?.[k] !== JSON.stringify(state.exMuscles?.[k])) state.exMusclesU[k] = now;
  }
  if (settingsSig(state) !== snapshot.settings) state.settingsU = now;
  const cutoff = now - TOMBSTONE_DAYS * 864e5;
  state.deleted = state.deleted.filter(t => t.at > cutoff);
  return takeSnapshot(state);
}

export interface MergeStats { added: number; updated: number; removed: number }

// İki veri setini birleştirir: her kayıt için en son değiştirilen sürüm kazanır, mezar taşları silmeleri taşır.
// Google Drive senkronizasyonu da ileride bu fonksiyonu kullanacak.
export function mergeStates(local: State, remoteRaw: any): { state: State; stats: MergeStats } {
  local = withDefaults(local);
  const remote = migrateExNames(withDefaults(remoteRaw, false, false));
  const out: State = { ...local }, stats: MergeStats = { added: 0, updated: 0, removed: 0 };
  const tomb = new Map<string, Tombstone>();
  [...local.deleted, ...remote.deleted].forEach(t => { const k = t.c + "\u0000" + t.k; if (!tomb.has(k) || tomb.get(k)!.at < t.at) tomb.set(k, t); });
  for (const c of collNames) {
    const key = COLLECTIONS[c], map = new Map(local[c].map(x => [key(x), x])), added = new Set<string>(), updated = new Set<string>();
    remote[c].forEach(r => {
      const k = key(r), l = map.get(k);
      if (!l) { map.set(k, r); added.add(k); }
      else if (c === "custom" && l.need === undefined && r.need !== undefined && (r.u || 0) <= (l.u || 0)) { map.set(k, { ...l, need: r.need }); }
      else if ((r.u || 0) > (l.u || 0) && sig(r) !== sig(l)) { map.set(k, c === "custom" && r.need === undefined && l.need !== undefined ? { ...r, need: l.need } : r); updated.add(k); }
    });
    out[c] = [...map.values()].filter(x => {
      const k = key(x), t = tomb.get(c + "\u0000" + k);
      const dead = !!t && t.at >= (x.u || 0);
      if (dead) { if (!added.has(k)) stats.removed++; }
      else { if (added.has(k)) stats.added++; if (updated.has(k)) stats.updated++; }
      return !dead;
    });
  }
  if ((remote.settingsU || 0) > (local.settingsU || 0)) {
    SETTINGS.forEach(k => out[k] = remote[k]); out.settingsU = remote.settingsU;
    if (remoteRaw.restAutoMig === undefined) {
      out.restAuto = local.restAuto && remote.rest === 90;
      out.restAutoMig = local.restAutoMig;
    }
    // eski sürümdeki bir cihaz başlangıç verisini bilmez; dosyada hiç yoksa yereldeki silinmesin
    if (remoteRaw?.prefs?.body === undefined) out.prefs = { ...out.prefs, body: local.prefs.body };
    if (!hasEquipment(remoteRaw?.prefs)) out.prefs = { ...out.prefs, equip: local.prefs.equip };
    if (remoteRaw && !("baseline" in remoteRaw)) out.baseline = local.baseline;
    // Older clients may save a profile without the optional experience fields.
    if (remoteRaw?.profile?.exp === undefined && local.profile.exp !== undefined) {
      out.profile = { ...out.profile, exp: local.profile.exp, expAt: local.profile.expAt };
    }
  }
  if ((remote.settingsU || 0) <= (local.settingsU || 0) && !hasEquipment(local.prefs) && hasEquipment(remote.prefs)) out.prefs = { ...out.prefs, equip: remote.prefs.equip };
  // Assignment clocks are independent of unrelated settings; old clients have no vote.
  out.exMuscles = Object.create(null); out.exMusclesU = Object.create(null);
  for (const k of new Set([...Object.keys(local.exMuscles || {}), ...Object.keys(remote.exMuscles || {}), ...Object.keys(local.exMusclesU || {}), ...Object.keys(remote.exMusclesU || {})])) {
    const lu = local.exMusclesU?.[k] ?? (Object.hasOwn(local.exMuscles || {}, k) ? local.settingsU || 1 : 0);
    const ru = remote.exMusclesU?.[k] ?? (Object.hasOwn(remote.exMuscles || {}, k) ? remote.settingsU || 1 : 0);
    const winner = ru > lu ? remote : local;
    if (Object.hasOwn(winner.exMuscles || {}, k)) out.exMuscles[k] = winner.exMuscles[k];
    out.exMusclesU[k] = Math.max(lu, ru);
  }
  out.deleted = [...tomb.values()];
  // aktif program, canlı antrenman ve taslak bu cihaza özeldir
  out.active = local.active; out.live = local.live; out.draft = local.draft; out.deviceId = local.deviceId;
  return { state: migrateExNames(out), stats };
}
