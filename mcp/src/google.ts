// Google girişi (sunucu tarafı, yetki kodu + PKCE). Uygulamanın kendi web istemcisi kullanılır:
// Drive'ın gizli uygulama klasörü (appDataFolder) istemciye bağlı olduğu için aynı dosyayı ancak böyle görürüz.
// Kapsamlar: kimlik (e-posta) ve yalnız uygulamanın Drive klasörü. Takvime telefon yazar.

export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const SCOPES = ["openid", "email", DRIVE_SCOPE];
const AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN = "https://oauth2.googleapis.com/token";

export interface GoogleEnv { GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string }

const b64url = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const challenge = async (verifier: string) => b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));

export async function authorizeUrl(env: GoogleEnv, redirectUri: string, state: string, verifier: string) {
  const q = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID, redirect_uri: redirectUri, response_type: "code", scope: SCOPES.join(" "), state,
    code_challenge: await challenge(verifier), code_challenge_method: "S256",
    // yenileme anahtarı (refresh token) her girişte verilsin
    access_type: "offline", prompt: "consent",
  });
  return `${AUTH}?${q}`;
}

// Google'ın cevabı: invalid_grant = izin geri alınmış ya da anahtar geçersiz (yeniden bağlanmak gerekir)
export class GoogleRevoked extends Error { name = "GoogleRevoked" }

async function token(body: Record<string, string>) {
  const res = await fetch(TOKEN, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(body) });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (data.error === "invalid_grant") throw new GoogleRevoked(data.error_description || "Google izni geçersiz");
    throw new Error(`Google girişi başarısız (${res.status} ${data.error || ""})`);
  }
  return data as { access_token: string; expires_in: number; refresh_token?: string; id_token?: string; scope: string };
}

export async function exchangeCode(env: GoogleEnv, code: string, redirectUri: string, verifier: string) {
  const t = await token({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri, grant_type: "authorization_code", code_verifier: verifier });
  // kimlik anahtarı doğrudan Google'dan (TLS üzerinden) geldi; içeriğini okumak yeterli
  const claims = t.id_token ? JSON.parse(atob(t.id_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) : {};
  return { refresh: t.refresh_token || "", access: t.access_token, expires: Date.now() + t.expires_in * 1000, scopes: t.scope.split(" "), email: String(claims.email || ""), sub: String(claims.sub || "") };
}

// Erişim anahtarı ~1 saat geçerli; aynı sunucu örneğinde tekrar kullanılır
const cache = new Map<string, { t: string; exp: number }>();
export async function accessToken(env: GoogleEnv, refresh: string): Promise<string> {
  const c = cache.get(refresh);
  if (c && c.exp - 60_000 > Date.now()) return c.t;
  const t = await token({ client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, refresh_token: refresh, grant_type: "refresh_token" });
  cache.set(refresh, { t: t.access_token, exp: Date.now() + t.expires_in * 1000 });
  return t.access_token;
}
