// Google Drive REST istemcisi: uygulamanın gizli klasöründe (appDataFolder) tek bir dosya okur/yazar.
// Kapsam drive.appdata: uygulama kullanıcının Drive'daki diğer dosyalarını göremez.
import type { RemoteStore } from "../core/sync.ts";

export const FILE_NAME = "spor-defteri.json";
const API = "https://www.googleapis.com/drive/v3/files";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";

// Erişim süresi dolmuş ya da izin geri alınmış: yeniden giriş gerekir
export class AuthError extends Error {}

// 403 kota/oran sınırı da olabilir; yalnız izin sorunu yeniden giriş ister (calendar.ts ile aynı ayrım)
const QUOTA_REASON = /rateLimitExceeded|userRateLimitExceeded|quotaExceeded|dailyLimitExceeded|usageLimits|RESOURCE_EXHAUSTED/i;
async function checkStatus(res: Response) {
  if (res.status !== 401 && res.status !== 403) return;
  if (res.status === 403) {
    const text = await res.text().catch(() => "");
    if (QUOTA_REASON.test(text)) throw new Error("Drive meşgul");
  }
  throw new AuthError(`Drive erişimi yok (${res.status})`);
}

export function driveStore(token: string, fetchFn: typeof fetch = fetch): RemoteStore {
  let fileId: string | null = null;
  const call = async (url: string, init: RequestInit = {}) => {
    const res = await fetchFn(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) } });
    await checkStatus(res);
    if (!res.ok) throw new Error(`Drive hatası (${res.status})`);
    return res;
  };
  const find = async (): Promise<string | null> => {
    const q = encodeURIComponent(`name='${FILE_NAME}' and trashed=false`);
    const res = await call(`${API}?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime)&orderBy=modifiedTime desc`);
    const { files }: any = await res.json();
    return files && files.length ? files[0].id : null;
  };
  return {
    async read() {
      fileId = await find();
      if (!fileId) return null;
      return (await call(`${API}/${fileId}?alt=media`)).text();
    },
    async write(content) {
      if (fileId) {
        await call(`${UPLOAD}/${fileId}?uploadType=media`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: content });
        return;
      }
      const boundary = "spor-defteri-" + Math.random().toString(36).slice(2);
      const meta = JSON.stringify({ name: FILE_NAME, parents: ["appDataFolder"], mimeType: "application/json" });
      const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${content}\r\n--${boundary}--`;
      const res = await call(`${UPLOAD}?uploadType=multipart&fields=id`, { method: "POST", headers: { "Content-Type": `multipart/related; boundary=${boundary}` }, body });
      fileId = ((await res.json()) as any).id;
    },
  };
}

// Drive'a bağlı Google hesabı (ad, e-posta, fotoğraf). Yeni izin istemez: drive.appdata kapsamı about'u okuyabilir.
export interface Account { name: string; email: string; photo: string }
export async function driveAccount(token: string, fetchFn: typeof fetch = fetch): Promise<Account> {
  const res = await fetchFn(`https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress,photoLink)`, { headers: { Authorization: `Bearer ${token}` } });
  await checkStatus(res);
  if (!res.ok) throw new Error(`Drive hatası (${res.status})`);
  const u = ((await res.json()) as any).user || {};
  return { name: String(u.displayName || ""), email: String(u.emailAddress || ""), photo: String(u.photoLink || "") };
}
