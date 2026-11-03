// Google girişi (Google Identity Services, yalnız tarayıcıda; sunucu yok).
// Erişim anahtarı ~1 saat geçerlidir. Uygulama yeniden açıldığında tekrar giriş istememek için
// süresi ve taşıdığı kapsamlarla birlikte bu cihazın localStorage'ında tutulur.
// Kapsamlar dar tutulur: Drive'da yalnız uygulamanın gizli klasörü, Takvim'de yalnız uygulamanın kendi takvimi.
//
// Tarayıcılar kullanıcı dokunuşuyla tetiklenmeyen açılır pencereleri engeller. Bu yüzden
// requestToken() bir tıklama işleyicisinin içinde, ondan önce hiçbir await olmadan çağrılmalı;
// Google betiği de önceden preload() ile yüklenmiş olmalı.

export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
export const CAL_SCOPE = "https://www.googleapis.com/auth/calendar.app.created";
export const TASKS_SCOPE = "https://www.googleapis.com/auth/tasks";
const TOKEN_KEY = "sporDefteri.gtoken";
const GIS_SRC = "https://accounts.google.com/gsi/client";
const NAMES: Record<string, string> = { [DRIVE_SCOPE]: "Drive", [CAL_SCOPE]: "Takvim", [TASKS_SCOPE]: "Görevler" };

// s: anahtarın taşıdığı kapsamlar (boşlukla ayrılmış); eski kayıtlarda yoksa yalnız Drive sayılır
type Stored = { t: string; exp: number; s?: string };
declare global { interface Window { google?: any } }

const read = (): Stored | null => { try { return JSON.parse(localStorage.getItem(TOKEN_KEY) || "null"); } catch { return null; } };
const write = (v: Stored | null) => { try { v ? localStorage.setItem(TOKEN_KEY, JSON.stringify(v)) : localStorage.removeItem(TOKEN_KEY); } catch {} };
const scopesOf = (s: Stored) => (s.s ?? DRIVE_SCOPE).split(" ");

// İstenen kapsamı taşıyan ve en az 1 dakika daha geçerli bir anahtar varsa onu döndürür
export function cachedToken(scope = DRIVE_SCOPE, now = Date.now()): string | null {
  const s = read();
  return s && s.exp - 60_000 > now && scopesOf(s).includes(scope) ? s.t : null;
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
// Daha önce verilmiş izinler de yeni anahtara eklenir (include_granted_scopes).
export function requestToken(clientId: string, firstTime: boolean, scopes: string[] = [DRIVE_SCOPE]): Promise<string> {
  return new Promise((res, rej) => {
    if (!gisReady()) return rej(new Error("Google girişi henüz yüklenmedi, birkaç saniye sonra tekrar dene"));
    const oauth = window.google.accounts.oauth2;
    const client = oauth.initTokenClient({
      client_id: clientId,
      scope: scopes.join(" "),
      include_granted_scopes: true,
      callback: (r: any) => {
        if (r.error) return rej(new Error(r.error_description || r.error));
        const granted = String(r.scope || scopes.join(" ")).split(" ").filter(x => oauth.hasGrantedAllScopes(r, x));
        write({ t: r.access_token, exp: Date.now() + (+r.expires_in || 3600) * 1000, s: granted.join(" ") });
        const missing = scopes.filter(x => !granted.includes(x));
        if (missing.length) return rej(new Error(`${missing.map(x => NAMES[x] || x).join(" ve ")} izni verilmedi. Onay ekranında ilgili kutuyu işaretle.`));
        res(r.access_token);
      },
      error_callback: (e: any) => rej(new Error(e && e.type === "popup_closed" ? "Giriş penceresi kapatıldı" : "Giriş penceresi açılamadı")),
    });
    client.requestAccessToken({ prompt: firstTime ? "consent" : "" });
  });
}

export function forgetToken() { write(null); }

// Anahtardan tek bir kapsamı düşürür (o özellik için bir sonraki kullanımda yeniden izin istenir)
export function dropScope(scope: string) {
  const s = read();
  if (s) write({ ...s, s: scopesOf(s).filter(x => x !== scope).join(" ") });
}

// Google'daki izni tümüyle geri alır (Drive ve Takvim birlikte); internet yoksa yalnız yereldeki anahtar silinir
export function revoke() {
  const s = read();
  write(null);
  if (s && gisReady()) try { window.google.accounts.oauth2.revoke(s.t, () => {}); } catch {}
}
