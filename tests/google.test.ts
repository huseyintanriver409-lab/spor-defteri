import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DRIVE_SCOPE, CAL_SCOPE, PopupError, TOKEN_TIMEOUT_MS, requestToken, tokenScopes } from "../src/sync/google.ts";
import { tokenRequestOptions } from "../src/sync/google.ts";

const store: Record<string, string> = {};
function setup(gis: any) {
  vi.stubGlobal("localStorage", { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; } });
  vi.stubGlobal("window", { google: { accounts: { oauth2: gis } } });
}
beforeEach(() => { vi.useFakeTimers(); for (const k in store) delete store[k]; });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("requestToken zaman aşımı ve tokenScopes", () => {
  it("anahtar yokken tokenScopes boş, varken kapsamları verir", () => {
    setup({});
    expect(tokenScopes()).toEqual([]);
    store["sporDefteri.gtoken"] = JSON.stringify({ t: "x", exp: 1, s: `${DRIVE_SCOPE} ${CAL_SCOPE}` });
    expect(tokenScopes()).toEqual([DRIVE_SCOPE, CAL_SCOPE]);
  });
  it("geri çağrı gelmezse 120 sn sonra timeout PopupError ile reddeder; geç gelen anahtar saklanır", async () => {
    let cfg: any;
    setup({ initTokenClient: (c: any) => { cfg = c; return { requestAccessToken() {} }; }, hasGrantedAllScopes: () => true });
    const p = requestToken("id", false);
    const out = p.catch(e => e);
    await vi.advanceTimersByTimeAsync(TOKEN_TIMEOUT_MS);
    const e: any = await out;
    expect(e).toBeInstanceOf(PopupError);
    expect(e.type).toBe("timeout");
    cfg.callback({ access_token: "late", expires_in: 3600, scope: DRIVE_SCOPE });
    expect(tokenScopes()).toEqual([DRIVE_SCOPE]);
  });
  it("zamanında gelen geri çağrı zamanlayıcıyı temizler", async () => {
    setup({ initTokenClient: (c: any) => ({ requestAccessToken: () => c.callback({ access_token: "tk", expires_in: 3600, scope: DRIVE_SCOPE }) }), hasGrantedAllScopes: () => true });
    await expect(requestToken("id", false)).resolves.toBe("tk");
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("tokenRequestOptions", () => {
  it("ilk izinde onay ister, ipucu yok", () => {
    expect(tokenRequestOptions(true, "a@b.com")).toEqual({ prompt: "consent" });
  });
  it("sonraki istekte e-posta login_hint olur", () => {
    expect(tokenRequestOptions(false, "a@b.com")).toEqual({ prompt: "", login_hint: "a@b.com" });
  });
  it("e-posta yoksa ipucu yok", () => {
    expect(tokenRequestOptions(false)).toEqual({ prompt: "" });
    expect(tokenRequestOptions(false, null)).toEqual({ prompt: "" });
    expect(tokenRequestOptions(false, "")).toEqual({ prompt: "" });
  });
});
