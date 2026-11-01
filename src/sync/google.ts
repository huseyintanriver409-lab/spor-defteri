// Google girişi (Google Identity Services, yalnız tarayıcıda; sunucu yok).
// Erişim anahtarı ~1 saat geçerlidir ve yalnız drive.appdata kapsamını taşır. Uygulama yeniden
// açıldığında tekrar giriş istememek için süresiyle birlikte bu cihazın localStorage'ında tutulur.
//
// Tarayıcılar kullanıcı dokunuşuyla tetiklenmeyen açılır pencereleri engeller. Bu yüzden
// requestToken() bir tıklama işleyicisinin içinde, ondan önce hiçbir await olmadan çağrılmalı;
// Google betiği de önceden preload() ile yüklenmiş olmalı.

export const SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const TOKEN_KEY = "sporDefteri.gtoken";
const GIS_SRC = "https://accounts.google.com/gsi/client";

type Stored = { t: string; exp: number };
declare global { interface Window { google?: any } }

const read = (): Stored | null => { try { return JSON.parse(localStorage.getItem(TOKEN_KEY) || "null"); } catch { return null; } };
const write = (v: Stored | null) => { try { v ? localStorage.setItem(TOKEN_KEY, JSON.stringify(v)) : localStorage.removeItem(TOKEN_KEY); } catch {} };

// Süresi en az 1 dakika daha geçerli bir anahtar varsa onu döndürür
export function cachedToken(now = Date.now()): string | null {
  const s = read();
  return s && s.exp - 60_000 > now ? s.t : null;
}

let gisLoading: Promise<void> | null = null;
export const gisReady = () => !!window.google?.accounts?.oauth2;
export function preload(): Promise<void> {
  if (gisReady()) return Promise.resolve();
  return gisLoading ||= new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = GIS_SRC; s.async = true;
    s.onload = () => res();
    s.onerror = () => { gisLoading = null; rej(new Error("Google girişi yüklenemedi (internet bağlantısını kontrol et)")); };
    document.head.appendChild(s);
  });
}

// Kullanıcıdan izin ister (ilk seferde onay ekranı, sonra çoğunlukla tek dokunuş).
export function requestToken(clientId: string, firstTime: boolean): Promise<string> {
  return new Promise((res, rej) => {
    if (!gisReady()) return rej(new Error("Google girişi henüz yüklenmedi, birkaç saniye sonra tekrar dene"));
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (r: any) => {
        if (r.error) return rej(new Error(r.error_description || r.error));
        if (!window.google.accounts.oauth2.hasGrantedAllScopes(r, SCOPE)) return rej(new Error("Drive izni verilmedi. Onay ekranında Drive kutusunu işaretle."));
        write({ t: r.access_token, exp: Date.now() + (+r.expires_in || 3600) * 1000 });
        res(r.access_token);
      },
      error_callback: (e: any) => rej(new Error(e && e.type === "popup_closed" ? "Giriş penceresi kapatıldı" : "Giriş penceresi açılamadı")),
    });
    client.requestAccessToken({ prompt: firstTime ? "consent" : "" });
  });
}

export function forgetToken() { write(null); }

// Bağlantıyı keserken Google'daki izni de geri alır (internet yoksa yalnız yereldeki anahtar silinir)
export function revoke() {
  const s = read();
  write(null);
  if (s && gisReady()) try { window.google.accounts.oauth2.revoke(s.t, () => {}); } catch {}
}
