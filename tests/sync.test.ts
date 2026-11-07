import { describe, it, expect, vi } from "vitest";
import { syncOnce, toPayload, type RemoteStore } from "../src/core/sync.ts";
import { DEFAULTS, mergeStates, type State } from "../src/core/schema.ts";
import { driveStore, driveAccount, AuthError, FILE_NAME } from "../src/sync/drive.ts";

const entry = (id: string, u = 1, w = 100) => ({ id, ex: "Back Squat", date: "2026-10-01", sets: [{ w, r: 5 }], u });
const device = (id: string, over: Partial<State> = {}): State => ({ ...DEFAULTS(), deviceId: id, settingsU: 1, ...over });

// Bellekte tek dosya tutan sahte bulut
function memStore(initial: string | null = null) {
  let content = initial;
  const store: RemoteStore & { content: () => string | null; writes: number } = {
    writes: 0,
    content: () => content,
    async read() { return content; },
    async write(c) { content = c; store.writes++; },
  };
  return store;
}

describe("toPayload", () => {
  it("cihaza özel alanları buluta göndermez", () => {
    const p = toPayload(device("d1", { live: { date: "x" }, draft: { ex: "y" }, active: "p1", lastBackup: 5, backupSnooze: 9 }));
    for (const k of ["live", "draft", "active", "deviceId", "lastBackup", "backupSnooze"]) expect(p).not.toHaveProperty(k);
    for (const k of ["entries", "programs", "sessions", "body", "custom", "deleted", "settingsU", "rest", "plates"]) expect(p).toHaveProperty(k);
  });
});

describe("syncOnce", () => {
  it("bulutta dosya yoksa yerel veriyi yükler, yereli değiştirmez", async () => {
    const store = memStore();
    const local = device("telefon", { entries: [entry("a")] });
    const r = await syncOnce(local, store, 1234);
    expect(r).toMatchObject({ uploaded: true, localChanged: false });
    const saved = JSON.parse(store.content()!);
    expect(saved.entries.map((e: any) => e.id)).toEqual(["a"]);
    expect(saved).toMatchObject({ syncedAt: 1234, writer: "telefon" });
    expect(saved).not.toHaveProperty("live");
  });

  it("iki cihaz sırayla eşitlenince ikisi de bütün kayıtlara sahip olur", async () => {
    const store = memStore();
    let phone = device("telefon", { entries: [entry("p1")] });
    let pc = device("bilgisayar", { entries: [entry("b1"), entry("b2")] });
    phone = (await syncOnce(phone, store)).state;
    const r = await syncOnce(pc, store);
    pc = r.state;
    expect(r).toMatchObject({ localChanged: true, uploaded: true, stats: { added: 1 } });
    phone = (await syncOnce(phone, store)).state;
    const ids = (s: State) => s.entries.map(e => e.id).sort();
    expect(ids(phone)).toEqual(["b1", "b2", "p1"]);
    expect(ids(pc)).toEqual(["b1", "b2", "p1"]);
  });

  it("değişiklik yoksa yeniden yüklemez", async () => {
    const store = memStore();
    const local = device("d", { entries: [entry("a")] });
    await syncOnce(local, store);
    const r = await syncOnce(local, store);
    expect(r).toMatchObject({ uploaded: false, localChanged: false });
    expect(store.writes).toBe(1);
  });

  it("bir cihazda silinen kayıt diğerinden de silinir", async () => {
    const store = memStore();
    let a = device("a", { entries: [entry("x"), entry("y")] });
    let b = device("b");
    a = (await syncOnce(a, store)).state;
    b = (await syncOnce(b, store)).state;
    a = { ...a, entries: a.entries.filter(e => e.id !== "x"), deleted: [{ c: "entries", k: "x", at: 50 }] };
    await syncOnce(a, store);
    const r = await syncOnce(b, store);
    expect(r.state.entries.map(e => e.id)).toEqual(["y"]);
    expect(r.stats.removed).toBe(1);
  });

  it("cihaza özel alanlar eşitlemede korunur", async () => {
    const store = memStore();
    await syncOnce(device("a", { entries: [entry("x")] }), store);
    const r = await syncOnce(device("b", { live: { date: "bugün" }, active: "p9" }), store);
    expect(r.state).toMatchObject({ deviceId: "b", live: { date: "bugün" }, active: "p9" });
  });

  it("ağ isteği sürerken yapılan yerel değişiklik, sonuç yeniden birleştirilince kaybolmaz", async () => {
    // uygulama: sync sürerken kullanıcı set ekler; dönüşte mergeStates(şimdiki, sonuç) yapılır
    const store = memStore();
    await syncOnce(device("pc", { entries: [entry("uzak")] }), store);
    const before = device("tel", { entries: [entry("eski")] });
    const pending = syncOnce(before, store);
    const during = { ...before, entries: [...before.entries, entry("yeni", 99)] };
    const merged = mergeStates(during, (await pending).state).state;
    expect(merged.entries.map(e => e.id).sort()).toEqual(["eski", "uzak", "yeni"]);
  });

  it("hiç eşitlenmemiş yeni cihaz buluttaki ayarları ezmez, programları alır; girdiği cinsiyet korunur", async () => {
    const store = memStore();
    const prog = { id: "p1", name: "Full Body · A", u: 5 };
    await syncOnce(device("eski", { programs: [prog], baseline: { Deadlift: { kg: 125 } }, goal: 4, settingsU: 100 }), store);
    // yeni telefon: ilk açılışta cinsiyet seçildi, ayar zamanı buluttakinden yeni
    const fresh = device("yeni", { profile: { sex: "m", bw: "" }, settingsU: 999 });
    const r = await syncOnce(fresh, store, 1000, { firstSync: true });
    expect(r.state.programs.map(p => p.id)).toEqual(["p1"]);
    expect(r.state).toMatchObject({ goal: 4, baseline: { Deadlift: { kg: 125 } }, profile: { sex: "m" } });
    expect(JSON.parse(store.content()!)).toMatchObject({ goal: 4, baseline: { Deadlift: { kg: 125 } }, profile: { sex: "m" } });
    // ilk eşitleme değilse son yazan kazanır (eski davranış)
    const later = await syncOnce(device("yeni", { goal: 2, settingsU: 5000 }), store);
    expect(later.state.goal).toBe(2);
  });

  it("bozuk bulut dosyasında yereli ezmeden hata verir", async () => {
    const store = memStore("{bozuk");
    await expect(syncOnce(device("d", { entries: [entry("a")] }), store)).rejects.toThrow(/bozuk/);
    expect(store.writes).toBe(0);
  });
});

describe("driveStore", () => {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

  it("dosya yoksa null okur, ilk yazımda appDataFolder'da oluşturur, sonra günceller", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const fetchFn = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      // yükleme adresi de "/drive/v3/files?" içerdiği için önce o kontrol edilir
      if (url.includes("uploadType=multipart")) return json({ id: "F1" });
      if (url.includes("/drive/v3/files?")) return json({ files: [] });
      if (url.includes("/upload/drive/v3/files/F1")) return json({ id: "F1" });
      return json({}, 404);
    }) as unknown as typeof fetch;
    const store = driveStore("TOKEN", fetchFn);
    expect(await store.read()).toBeNull();
    await store.write('{"a":1}');
    await store.write('{"a":2}');
    expect(calls[0].url).toContain("spaces=appDataFolder");
    expect(decodeURIComponent(calls[0].url)).toContain(`name='${FILE_NAME}'`);
    expect((calls[0].init!.headers as any).Authorization).toBe("Bearer TOKEN");
    expect(calls[1].init!.method).toBe("POST");
    expect(String(calls[1].init!.body)).toContain('"parents":["appDataFolder"]');
    expect(String(calls[1].init!.body)).toContain('{"a":1}');
    expect(calls[2]).toMatchObject({ url: expect.stringContaining("/files/F1?uploadType=media"), init: { method: "PATCH", body: '{"a":2}' } });
  });

  it("dosya varsa içeriğini indirir ve yerinde günceller", async () => {
    const fetchFn = vi.fn(async (url: string) => {
      if (url.includes("?spaces=")) return json({ files: [{ id: "F9" }] });
      if (url.endsWith("/F9?alt=media")) return new Response('{"entries":[]}');
      return json({ id: "F9" });
    }) as unknown as typeof fetch;
    const store = driveStore("T", fetchFn);
    expect(await store.read()).toBe('{"entries":[]}');
    await store.write("{}");
    expect((fetchFn as any).mock.calls.at(-1)[0]).toContain("/upload/drive/v3/files/F9?uploadType=media");
  });

  it("401 ve 403 yeniden giriş gerektiren AuthError, diğerleri normal hata", async () => {
    const st = (status: number) => driveStore("T", (async () => json({}, status)) as unknown as typeof fetch);
    await expect(st(401).read()).rejects.toBeInstanceOf(AuthError);
    await expect(st(403).read()).rejects.toBeInstanceOf(AuthError);
    const e = await st(500).read().catch(x => x);
    expect(e).not.toBeInstanceOf(AuthError);
    expect(e.message).toContain("500");
  });

  it("403 kota/oran sınırı AuthError değil, geçici hata (izin 403 ve 401 yine AuthError)", async () => {
    const err = (status: number, reason: string) => new Response(JSON.stringify({ error: { code: status, errors: [{ reason }], status: "PERMISSION_DENIED" } }), { status });
    const st = (res: Response) => driveStore("T", (async () => res.clone()) as unknown as typeof fetch);
    for (const reason of ["rateLimitExceeded", "userRateLimitExceeded", "quotaExceeded", "dailyLimitExceeded"]) {
      const e = await st(err(403, reason)).read().catch(x => x);
      expect(e).toBeInstanceOf(Error);
      expect(e).not.toBeInstanceOf(AuthError);
      expect(e.message).toContain("Drive meşgul");
    }
    const denied = await st(err(403, "insufficientPermissions")).read().catch(x => x);
    expect(denied).toBeInstanceOf(AuthError);
    const unauth = await st(err(401, "authError")).read().catch(x => x);
    expect(unauth).toBeInstanceOf(AuthError);
  });

  it("driveAccount da aynı ayrımı yapar: kota 403 AuthError değil, izin 403 AuthError", async () => {
    const acc = (res: Response) => driveAccount("T", (async () => res) as unknown as typeof fetch);
    const quota = await acc(new Response(JSON.stringify({ error: { errors: [{ reason: "quotaExceeded" }] } }), { status: 403 })).catch(x => x);
    expect(quota).not.toBeInstanceOf(AuthError);
    const perm = await acc(new Response(JSON.stringify({ error: { errors: [{ reason: "insufficientPermissions" }] } }), { status: 403 })).catch(x => x);
    expect(perm).toBeInstanceOf(AuthError);
  });
});
