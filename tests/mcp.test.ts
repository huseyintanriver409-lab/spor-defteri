import { describe, it, expect, vi, afterEach } from "vitest";
import { mcpFetch } from "../mcp/src/mcp.ts";
import { DEFAULTS } from "../src/core/schema.ts";
import { toPayload } from "../src/core/sync.ts";

// Drive'ın gizli klasöründe tek dosya tutan sahte sunucu
function fakeDrive(initial: string | null) {
  const drive = { content: initial, writes: 0 };
  vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => {
    if (url.includes("spaces=appDataFolder")) return Response.json({ files: drive.content == null ? [] : [{ id: "f1" }] });
    if (url.endsWith("/f1?alt=media")) return new Response(drive.content);
    if (url.includes("/upload/") && init.method === "PATCH") { drive.content = String(init.body); drive.writes++; return Response.json({ id: "f1" }); }
    return new Response("?", { status: 500 });
  });
  return drive;
}
afterEach(() => vi.unstubAllGlobals());

let n = 0;
const ctx = { token: async () => "t", today: () => new Date(2026, 10, 3), uid: () => "p" + ++n };
// notify: kimliksiz bildirim (cevap beklenmez)
const call = async (method: string, params?: any, notify = false) => {
  const msg = notify ? { jsonrpc: "2.0", method, params } : { jsonrpc: "2.0", id: 1, method, params };
  const res = await mcpFetch(new Request("https://x/mcp", { method: "POST", body: JSON.stringify(msg) }), ctx);
  return res.status === 202 ? null : (await res.json() as any);
};
const tool = async (name: string, args: object) => {
  const r = (await call("tools/call", { name, arguments: args })).result;
  return { error: !!r.isError, text: r.content[0].text as string, data: r.isError ? null : JSON.parse(r.content[0].text) };
};

describe("MCP sunucusu", () => {
  it("el sıkışma, araç listesi ve bildirim", async () => {
    const init = (await call("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } })).result;
    expect(init.protocolVersion).toBe("2025-06-18");
    expect(init.capabilities.tools).toBeDefined();
    expect(await call("notifications/initialized", undefined, true)).toBeNull();
    const tools = (await call("tools/list")).result.tools;
    expect(tools.map((t: any) => t.name)).toEqual(["ozet", "gecmis", "antrenman_kaydet", "kayit_sil", "program_ekle", "program_guncelle", "program_sil", "plan_kur"]);
    expect(tools.every((t: any) => t.inputSchema.type === "object" && !("run" in t))).toBe(true);
    expect((await call("nope")).error.code).toBe(-32601);
  });

  it("program ekler, planı kurar ve Drive dosyasına damgalı olarak yazar", async () => {
    const drive = fakeDrive(JSON.stringify(toPayload({ ...DEFAULTS(), settingsU: 5 })));
    const add = await tool("program_ekle", { name: "AB", days: [{ name: "A", items: [{ exercise: "Back Squat", sets: 3, reps: "5" }] }, { name: "B", items: [{ exercise: "deadlift", sets: 1, reps: "5" }] }] });
    expect(add.error).toBe(false);
    expect(add.data.created.map((c: any) => c.name)).toEqual(["AB · A", "AB · B"]);
    const plan = await tool("plan_kur", { days: [{ day: "Pazartesi", time: "18:00" }, { day: "Çarşamba", time: "18:00" }, { day: "Cumartesi", time: "10:00" }], until: "2027-01-06" });
    expect(plan.data.days.map((d: any) => d.program)).toEqual(["AB · A", "AB · B", "AB · A"]);
    expect(drive.writes).toBe(2);
    const saved = JSON.parse(drive.content!);
    expect(saved.writer).toBe("claude");
    expect(saved.plan.until).toBe("2027-01-06");
    expect(saved.settingsU).toBeGreaterThan(5);
    expect(saved.programs.every((p: any) => p.u > 0)).toBe(true);
    const o = await tool("ozet", {});
    expect(o.data.plan.days).toHaveLength(3);
    expect(drive.writes).toBe(2); // okuma yazmaz
  });

  it("hatalar araç hatası olarak döner, dosyaya yazılmaz", async () => {
    const drive = fakeDrive(JSON.stringify(toPayload(DEFAULTS())));
    const r = await tool("plan_kur", { days: [{ day: "MO" }] });
    expect(r.error).toBe(true);
    expect(r.text).toMatch(/Önce bir program/);
    expect(drive.writes).toBe(0);
    fakeDrive(null);
    expect((await tool("ozet", {})).text).toMatch(/Drive'da Spor Defteri verisi yok/);
  });
});
