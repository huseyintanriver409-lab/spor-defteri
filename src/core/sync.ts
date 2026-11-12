/* ---------- Bulut senkronizasyonu (depolamadan bağımsız) ----------
   Tek bir JSON dosyası tutan herhangi bir depoyla çalışır (Google Drive, test için sahte depo).
   Akış: uzaktaki dosyayı indir → mergeStates ile birleştir → içerik farklıysa geri yükle.
   İki cihaz aynı anda yüklerse biri diğerinin yüklemesini ezebilir; ezilen cihaz verisini yerelde
   tuttuğu için bir sonraki eşitlemede yeniden birleştirir (mergeStates sıradan bağımsızdır). */
import { COLLECTIONS, SETTINGS, withDefaults, mergeStates, type State, type MergeStats } from "./schema.ts";
import { t } from "./i18n.ts";

export interface RemoteStore {
  // Dosyanın içeriği; dosya yoksa null
  read(): Promise<string | null>;
  write(content: string): Promise<void>;
}

// Buluta gönderilen alanlar: kayıt koleksiyonları, mezar taşları ve ayarlar.
// Cihaza özel olanlar (canlı antrenman, taslak, aktif program, cihaz kimliği, yedek hatırlatması) gönderilmez.
export function toPayload(s: State) {
  const out: Record<string, unknown> = { v: s.v, settingsU: s.settingsU, deleted: s.deleted, exMuscles: s.exMuscles, exMusclesU: s.exMusclesU };
  for (const c of Object.keys(COLLECTIONS)) out[c] = s[c];
  for (const k of SETTINGS) out[k] = s[k];
  return out;
}

const canon = (s: State) => JSON.stringify(toPayload(s));

export interface SyncResult {
  state: State;
  stats: MergeStats;
  // birleştirme yerel veride bir şey değiştirdi mi (ekran yenilenmeli mi)
  localChanged: boolean;
  // buluta yazıldı mı
  uploaded: boolean;
}

// firstSync: bu cihaz Drive ile hiç eşitlenmedi. O zaman buluttaki ayarlar kazanır; yoksa yeni kurulan
// cihazın ilk açılış ayarları (cinsiyet sorusu gibi) daha yeni sayılır ve diğer cihazın planını, başlangıç
// kilolarını, takvim ayarını ezer. Yalnız bu cihazda girilmiş cinsiyet bulutta boşsa korunur.
export async function syncOnce(local: State, store: RemoteStore, now = Date.now(), { firstSync = false } = {}): Promise<SyncResult> {
  const raw = await store.read();
  let remote: State | null = null;
  let rawPayload: State | null = null;
  if (raw != null) {
    try { rawPayload = JSON.parse(raw); remote = withDefaults(rawPayload); }
    catch { throw new Error(t("cloud.err_sync_file_corrupt")); }
  }
  const base = remote && firstSync ? { ...local, settingsU: 0 } : local;
  const { state, stats } = remote ? mergeStates(base, rawPayload) : { state: local, stats: { added: 0, updated: 0, removed: 0 } };
  if (base !== local && !state.profile?.sex && local.profile?.sex) {
    state.profile = { ...state.profile, sex: local.profile.sex }; state.settingsU = now;
  }
  const localChanged = canon(state) !== canon(local);
  const uploaded = !remote || canon(state) !== canon(rawPayload!);
  if (uploaded) await store.write(JSON.stringify({ ...toPayload(state), syncedAt: now, writer: local.deviceId }));
  return { state, stats, localChanged, uploaded };
}
