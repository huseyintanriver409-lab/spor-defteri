/* ---------- Bulut senkronizasyonu (depolamadan bağımsız) ----------
   Tek bir JSON dosyası tutan herhangi bir depoyla çalışır (Google Drive, test için sahte depo).
   Akış: uzaktaki dosyayı indir → mergeStates ile birleştir → içerik farklıysa geri yükle.
   İki cihaz aynı anda yüklerse biri diğerinin yüklemesini ezebilir; ezilen cihaz verisini yerelde
   tuttuğu için bir sonraki eşitlemede yeniden birleştirir (mergeStates sıradan bağımsızdır). */
import { COLLECTIONS, SETTINGS, withDefaults, mergeStates, type State, type MergeStats } from "./schema.ts";

export interface RemoteStore {
  // Dosyanın içeriği; dosya yoksa null
  read(): Promise<string | null>;
  write(content: string): Promise<void>;
}

// Buluta gönderilen alanlar: kayıt koleksiyonları, mezar taşları ve ayarlar.
// Cihaza özel olanlar (canlı antrenman, taslak, aktif program, cihaz kimliği, yedek hatırlatması) gönderilmez.
export function toPayload(s: State) {
  const out: Record<string, unknown> = { v: s.v, settingsU: s.settingsU, deleted: s.deleted };
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

export async function syncOnce(local: State, store: RemoteStore, now = Date.now()): Promise<SyncResult> {
  const raw = await store.read();
  let remote: State | null = null;
  if (raw != null) {
    try { remote = withDefaults(JSON.parse(raw)); }
    catch { throw new Error("Drive'daki eşitleme dosyası bozuk"); }
  }
  const { state, stats } = remote ? mergeStates(local, remote) : { state: local, stats: { added: 0, updated: 0, removed: 0 } };
  const localChanged = canon(state) !== canon(local);
  const uploaded = !remote || canon(state) !== canon(remote);
  if (uploaded) await store.write(JSON.stringify({ ...toPayload(state), syncedAt: now, writer: local.deviceId }));
  return { state, stats, localChanged, uploaded };
}
