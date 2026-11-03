/* ---------- Spor Defteri yapay zekâ bağlayıcısı (uzak MCP sunucusu) ----------
   MCP destekleyen yapay zekâ uygulamaları (Claude, ChatGPT, Gemini CLI, Antigravity…) bu sunucuya OAuth ile bağlanır: /authorize sayfası izin ister, kullanıcıyı Google girişine gönderir,
   Google /callback'e döner ve yapay zekâ uygulamasına bu sunucunun kendi erişim anahtarı verilir. Google'ın yenileme anahtarı
   o anahtara bağlı, şifreli olarak (props) saklanır; her araç çağrısında Drive için kısa ömürlü anahtar alınır.
   OAuth uç noktaları, istemci kaydı ve anahtar saklama @cloudflare/workers-oauth-provider'da. */
import { OAuthProvider, AuthorizationError, authorizationErrorRedirect, type OAuthHelpers } from "@cloudflare/workers-oauth-provider";
import { accessToken, authorizeUrl, DRIVE_SCOPE, exchangeCode } from "./google.ts";
import { mcpFetch } from "./mcp.ts";

interface Env {
  OAUTH_KV: KVNamespace;
  OAUTH_PROVIDER: OAuthHelpers;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  TIME_ZONE: string;
  ALLOWED_EMAILS?: string;
}
interface Props { email: string; sub: string; refresh: string }

const esc = (v: string) => v.replace(/[&<>"']/g, ch => `&#${ch.charCodeAt(0)};`);
const page = (title: string, body: string, status = 200, headers = new Headers()) => {
  headers.set("Content-Type", "text/html; charset=utf-8");
  return new Response(`<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><style>body{font:16px/1.5 system-ui,sans-serif;max-width:30rem;margin:3rem auto;padding:0 1rem;color:#1f2328;background:#fff}
@media (prefers-color-scheme:dark){body{color:#e6edf3;background:#0d1117}}
h1{font-size:1.4rem}.muted{opacity:.75;font-size:.9rem}button{font:inherit;padding:.6rem 1.2rem;border-radius:.6rem;border:1px solid #8884;margin-right:.5rem;cursor:pointer}
.primary{background:#2f81f7;color:#fff;border-color:#2f81f7}</style>
<h1>${esc(title)}</h1>${body}</html>`, { status, headers });
};

// Takvimdeki "bugün": sunucu UTC'de çalışır, kullanıcı TIME_ZONE'da
function today(tz: string): Date {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz || "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(new Date()).map(x => [x.type, x.value]));
  return new Date(+p.year, +p.month - 1, +p.day);
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const apiHandler = {
  async fetch(req: Request, env: Env, ctx: ExecutionContext & { props: Props }) {
    const { refresh } = ctx.props;
    return mcpFetch(req, { token: () => accessToken(env, refresh), today: () => today(env.TIME_ZONE), uid });
  },
};

const defaultHandler = {
  async fetch(req: Request, env: Env) {
    const url = new URL(req.url), oauth = env.OAUTH_PROVIDER, callback = `${url.origin}/callback`;
    try {
      if (url.pathname === "/authorize" && req.method === "GET") {
        const request = await oauth.parseAuthRequest(req);
        const d = await oauth.describeConsent(request);
        const consent = await oauth.beginConsent(request);
        const from = d.clientDomain ? `<b>${esc(d.clientDomain)}</b> yayınlıyor.` : "Uygulama kendini kaydetti; adı doğrulanmadı.";
        return page("Spor Defteri'ne erişim", `<p><b>${esc(d.clientName)}</b> Spor Defteri'ndeki programlarını, planını ve antrenman geçmişini okumak ve değiştirmek istiyor.</p>
<p class="muted">${from} Erişim <b>${esc(d.redirectHost)}</b> adresine gönderilecek.${d.redirectIsLoopback ? " Bu, bilgisayarındaki bir uygulama; girişi az önce kendin başlattıysan devam et." : ""}</p>
<p class="muted">İzin verince Google girişine geçeceksin. Spor Defteri yalnız kendi gizli Drive klasörünü görür.</p>
<form method="post" action="/authorize"><input type="hidden" name="handle" value="${esc(consent.handle)}">
<button class="primary" name="decision" value="approve">İzin ver</button><button name="decision" value="deny">Reddet</button></form>`, 200, consent.headers);
      }
      if (url.pathname === "/authorize" && req.method === "POST") {
        const form = await req.formData(), handle = String(form.get("handle") || "");
        if (form.get("decision") !== "approve") {
          const denied = await oauth.denyConsent(req, handle);
          return new Response(null, { status: 302, headers: denied.headers });
        }
        const approved = await oauth.approveConsent(req, handle);
        const verifier = crypto.randomUUID() + crypto.randomUUID();
        const { state, headers } = await oauth.beginUpstream(approved.request, { data: { verifier }, headers: approved.headers });
        headers.set("Location", await authorizeUrl(env, callback, state, verifier));
        return new Response(null, { status: 302, headers });
      }
      if (url.pathname === "/callback") {
        const { request, data, headers } = await oauth.finishUpstream<{ verifier: string }>(req);
        const code = url.searchParams.get("code");
        if (!code) {
          headers.set("Location", authorizationErrorRedirect(request, "access_denied"));
          return new Response(null, { status: 302, headers });
        }
        const g = await exchangeCode(env, code, callback, data.verifier);
        if (!g.scopes.includes(DRIVE_SCOPE) || !g.refresh)
          return page("Drive izni gerekli", `<p>Google girişinde "Spor Defteri verilerini görme ve yönetme" (Drive) izni işaretlenmedi. Yapay zekâ uygulamana dönüp yeniden bağlan ve bu izni de ver.</p>`, 400, headers);
        const allowed = (env.ALLOWED_EMAILS || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
        if (allowed.length && !allowed.includes(g.email.toLowerCase()))
          return page("Bu hesap izinli değil", `<p>${esc(g.email)} bu bağlayıcıyı kullanamaz.</p>`, 403, headers);
        const props: Props = { email: g.email, sub: g.sub, refresh: g.refresh };
        const { redirectTo } = await oauth.completeAuthorization({ request, userId: g.sub || g.email, metadata: { email: g.email }, scope: request.scope, props });
        headers.set("Location", redirectTo);
        return new Response(null, { status: 302, headers });
      }
      if (url.pathname === "/") return page("Spor Defteri bağlayıcısı", `<p>Bu adres yapay zekâ uygulamaları içindir (Claude, ChatGPT, Gemini CLI…). Uygulamanın bağlayıcı ya da MCP sunucusu ekleme ayarına şunu yaz:</p><p><code>${esc(url.origin)}/mcp</code></p><p class="muted">Adımlar Spor Defteri'nde: Profil → Ayarlar → Yapay zekâ bağlantısı.</p>`);
      return new Response("Bulunamadı", { status: 404 });
    } catch (e) {
      if (e instanceof AuthorizationError) {
        if (e.redirectTo) return Response.redirect(e.redirectTo, 302);
        return page("Giriş tamamlanamadı", `<p>${esc(e.description || e.message)}</p><p class="muted">Yapay zekâ uygulamana dönüp bağlanmayı yeniden başlat.</p>`, 400);
      }
      throw e;
    }
  },
};

// Sunucunun adresi yüklenince belli olur (…workers.dev); sağlayıcı ilk istekte o adresle kurulur
let provider: OAuthProvider<Env> | null = null;
const make = (origin: string) => new OAuthProvider<Env>({
  apiRoute: "/mcp",
  apiHandler: apiHandler as any,
  defaultHandler: defaultHandler as any,
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/oauth/token",
  clientRegistrationEndpoint: "/oauth/register",
  scopesSupported: ["spor"],
  resourceMetadata: { resource: `${origin}/mcp`, authorization_servers: [origin] },
  accessTokenTTL: 3600,
  // Yapay zekâ kullandıkça bağlantı açık kalır; 90 gün hiç kullanılmazsa yeniden bağlanmak gerekir
  refreshTokenIdleTTL: 90 * 86400,
});

export default {
  fetch(req: Request, env: Env, ctx: ExecutionContext) {
    provider ||= make(new URL(req.url).origin);
    return provider.fetch(req, env, ctx);
  },
};
