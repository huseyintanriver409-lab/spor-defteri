/* ---------- Veri modeli (şema v2) ----------
   Senkronizasyona hazır veri modeli:
   - Her kayıt koleksiyonunda kalıcı bir anahtar var (COLLECTIONS) ve her kayıt son değiştiği anı "u" alanında taşır.
   - Silinen kayıtlar "deleted" listesine mezar taşı olarak yazılır; böylece iki cihaz birleştirilirken silinen kayıt geri dirilmez.
   - Ayarlar tek parça olarak "settingsU" zamanıyla tutulur (son yazan kazanır).
   Bu dosya tarayıcıya ve global duruma bağımlı değildir; birim testleri tests/schema.test.ts içinde. */

export const SCHEMA = 2;
export const TOMBSTONE_DAYS = 365;

// Kayıtların içi uygulama genelinde serbest biçimli; burada yalnız birleştirmenin dayandığı alanlar tiplenir.
export interface Stamped { u?: number; ts?: number; [k: string]: any }
export interface Tombstone { c: string; k: string; at: number }
export type State = {
  v: number; deviceId: string; deleted: Tombstone[]; settingsU: number;
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
export const DEFAULTS = (): State => ({ v: SCHEMA, deviceId: "", entries: [], custom: [], programs: [], active: null, body: [], profile: { sex: "m", bw: "" }, rest: 90, plan: DEFAULT_PLAN(),
  exNotes: {}, sessions: [], live: null, goal: 3, autoRest: true, draft: null, lastBackup: 0, backupSnooze: 0, deleted: [], settingsU: 0,
  exPrefs: {}, plates: [25, 20, 15, 10, 5, 2.5, 1.25], prefs: { wake: true, haptics: true, yoga: true }, favs: [], onboarded: false, gcal: DEFAULT_GCAL(),
  // başlangıç noktası: hareket → şu anki kilo/tekrar (core/baseline.ts)
  baseline: {},
  // seri: "auto" plan varsa günlük yoksa haftalık, "week" haftalık, "off" kapalı (core/streak.ts)
  streakMode: "auto" });

export const COLLECTIONS: Record<"entries" | "programs" | "sessions" | "body" | "custom", (x: Stamped) => string> = {
  entries: x => x.id, programs: x => x.id, sessions: x => x.id, body: x => x.date, custom: x => x.name,
};
type Coll = keyof typeof COLLECTIONS;
const collNames = Object.keys(COLLECTIONS) as Coll[];
export const SETTINGS = ["profile", "plan", "goal", "exNotes", "rest", "autoRest", "exPrefs", "plates", "prefs", "favs", "gcal", "baseline", "streakMode"];

// eksik alanları varsayılanlarla tamamlar ve eski şemaları yükseltir (eski kayıtlar ve yedekler için)
export function withDefaults(s: any): State {
  const d = DEFAULTS();
  const out: State = { ...d, ...s, profile: { ...d.profile, ...(s.profile || {}) }, plan: { ...d.plan, ...(s.plan || {}) }, prefs: { ...d.prefs, ...(s.prefs || {}) }, gcal: { ...d.gcal, ...(s.gcal || {}) } };
  for (const c of collNames) if (!Array.isArray(out[c])) out[c] = [];
  if (!Array.isArray(out.deleted)) out.deleted = [];
  if (!(s.v >= 2)) {
    // v1 → v2: değişiklik zamanı bilinmeyen eski kayıtlar en eski sayılır, böylece birleştirmede yeni düzenlemeler kazanır
    for (const c of collNames) out[c].forEach(x => { if (!x.u) x.u = x.ts || 1; });
    out.settingsU = out.settingsU || 1; out.v = SCHEMA;
  }
  return out;
}

// "u" dışındaki içerik imzası: aynı imza = içerik değişmemiş
export const sig = (x: Stamped): string => { const { u, ...rest } = x; return JSON.stringify(rest); };
export const settingsSig = (s: State): string => JSON.stringify(SETTINGS.map(k => s[k]));

export type Snapshot = { settings: string } & Record<Coll, Map<string, string>>;

export function takeSnapshot(state: State): Snapshot {
  const snap = { settings: settingsSig(state) } as Snapshot;
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
  if (settingsSig(state) !== snapshot.settings) state.settingsU = now;
  const cutoff = now - TOMBSTONE_DAYS * 864e5;
  state.deleted = state.deleted.filter(t => t.at > cutoff);
  return takeSnapshot(state);
}

export interface MergeStats { added: number; updated: number; removed: number }

// İki veri setini birleştirir: her kayıt için en son değiştirilen sürüm kazanır, mezar taşları silmeleri taşır.
// Google Drive senkronizasyonu da ileride bu fonksiyonu kullanacak.
export function mergeStates(local: State, remoteRaw: any): { state: State; stats: MergeStats } {
  const remote = withDefaults(remoteRaw);
  const out: State = { ...local }, stats: MergeStats = { added: 0, updated: 0, removed: 0 };
  const tomb = new Map<string, Tombstone>();
  [...local.deleted, ...remote.deleted].forEach(t => { const k = t.c + "\u0000" + t.k; if (!tomb.has(k) || tomb.get(k)!.at < t.at) tomb.set(k, t); });
  for (const c of collNames) {
    const key = COLLECTIONS[c], map = new Map(local[c].map(x => [key(x), x])), added = new Set<string>(), updated = new Set<string>();
    remote[c].forEach(r => {
      const k = key(r), l = map.get(k);
      if (!l) { map.set(k, r); added.add(k); }
      else if ((r.u || 0) > (l.u || 0) && sig(r) !== sig(l)) { map.set(k, r); updated.add(k); }
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
    // eski sürümdeki bir cihaz başlangıç verisini bilmez; dosyada hiç yoksa yereldeki silinmesin
    if (remoteRaw && !("baseline" in remoteRaw)) out.baseline = local.baseline;
  }
  out.deleted = [...tomb.values()];
  // aktif program, canlı antrenman ve taslak bu cihaza özeldir
  out.active = local.active; out.live = local.live; out.draft = local.draft; out.deviceId = local.deviceId;
  return { state: out, stats };
}
