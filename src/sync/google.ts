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
    s.onerror = () => { gisLoading = null; rej(new Error("Google girişi yüklenemedi, bağlantını kontrol et")); };
    document.head.appendChild(s);
  });
}

// Pencere açılamadı ya da kapatıldı: gerçek bir hata değil, kullanıcı hareketi gerekiyor demek
export class PopupError extends Error { type: string; constructor(msg: string, type: string) { super(msg); this.name = "PopupError"; this.type = type; } }

// Saklı anahtarın taşıdığı kapsamlar (anahtar yoksa boş)
export function tokenScopes(): string[] { const s = read(); return s ? scopesOf(s).filter(Boolean) : []; }
export const TOKEN_TIMEOUT_MS = 120_000;

// Anahtarın bitiş zamanı (ms); o kapsamı taşıyan anahtar yoksa 0
export function tokenExpiry(scope = DRIVE_SCOPE): number { const s = read(); return s && scopesOf(s).includes(scope) ? s.exp : 0; }

// GIS istek ayarları: ilk izinde onay ekranı; sonra e-posta varsa login_hint ile hesap seçimi atlanır
// (alan adı: resmi GIS JS başvurusu, TokenClientConfig / OverridableTokenClientConfig.login_hint)
export function tokenRequestOptions(firstTime: boolean, email?: string | null): { prompt: string; login_hint?: string } {
  if (firstTime) return { prompt: "consent" };
  return email ? { prompt: "", login_hint: email } : { prompt: "" };
}

// Kullanıcıdan izin ister (ilk seferde onay ekranı, sonra çoğunlukla tek dokunuş).
// Daha önce verilmiş izinler de yeni anahtara eklenir (include_granted_scopes).
export function requestToken(clientId: string, firstTime: boolean, scopes: string[] = [DRIVE_SCOPE], email?: string | null): Promise<string> {
  return new Promise((res, rej0) => {
    if (!gisReady()) return rej0(new Error("Google hazır değil, tekrar dene"));
    // GIS hiçbir geri çağrı vermezse söz asılı kalmasın
    let settled = false;
    const timer = setTimeout(() => { settled = true; rej0(new PopupError("Giriş penceresi açılamadı", "timeout")); }, TOKEN_TIMEOUT_MS);
    const rej = (e: any) => { if (settled) return; settled = true; clearTimeout(timer); rej0(e); };
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
        if (missing.length) return rej(new Error(`${missing.map(x => NAMES[x] || x).join(" ve ")} izni verilmedi`));
        if (settled) return;  // zaman aşımından sonra gelen geçerli anahtar saklandı, söz zaten sonuçlandı
        settled = true; clearTimeout(timer); res(r.access_token);
      },
      error_callback: (e: any) => rej(new PopupError(e && e.type === "popup_closed" ? "Giriş penceresi kapatıldı" : "Giriş penceresi açılamadı", String((e && e.type) || "unknown"))),
    });
    client.requestAccessToken(tokenRequestOptions(firstTime, email));
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
