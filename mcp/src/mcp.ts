// MCP sunucusu (Streamable HTTP, durumsuz): Claude JSON-RPC isteğini POST eder, cevap tek JSON olarak döner.
// Araçlar kullanıcının Drive'daki Spor Defteri dosyasını okur ya da değiştirir; işin kendisi src/core/assistant.ts'te.
import { addProgram, deleteLog, deleteProgram, history, logWorkouts, overview, setBaseline, setPlan, updateProgram } from "../../src/core/assistant.ts";
import { stampChanges, takeSnapshot, withDefaults, type State } from "../../src/core/schema.ts";
import { toPayload } from "../../src/core/sync.ts";
import { AuthError, driveStore } from "../../src/sync/drive.ts";

const VERSIONS = ["2026-07-28", "2025-11-25", "2025-06-18", "2025-03-26"];
const INSTRUCTIONS = `Spor Defteri, kullanıcının antrenman defteri uygulaması. Bu araçlar kullanıcının Google Drive'daki verisini doğrudan okur ve değiştirir.
- Önce ozet aracıyla programlara, plana ve son antrenmanlara bak.
- Program eklerken hareket adlarını yaygın İngilizce adlarıyla yaz (Bench Press, Back Squat, Lat Pulldown…); uygulamanın listesine eşlenir. Sonuçtaki notes eşlemeleri gösterir; anlamı değişen ya da emin olmadığın bir eşleme görürsen kullanıcıya sor.
- Kullanıcı hareketlerde çalıştığı kiloları söylerse programdaki hareketlere kg olarak yaz ya da baslangic_kaydet kullan: bunlar "Mevcut verilerim" olur, uygulama ilk antrenmanda kiloyu oradan önerir. Antrenman kaydı değildir.
- Çok günlü program her gün için ayrı program olur ("Ad · Gün").
- plan_kur haftalık planı baştan kurar; "6 Ocak'a kadar" gibi bitiş tarihi verilirse plan Google Takvim'e o güne kadar yazılır.
- Kullanıcı yaptığı antrenmanları (başka uygulamadan geçerken eski kayıtlarını da) anlatırsa antrenman_kaydet ile deftere yaz. Uzun geçmişi parçalara bölüp birkaç çağrıda gönder; aynı setler iki kez yazılmaz.
- Değişiklikler telefondaki uygulamaya bir sonraki eşitlemede (uygulama açılınca) gelir; takvimi de telefon günceller.
- Kullanıcıyla Türkçe konuş.`;

export interface Ctx { token: () => Promise<string>; today: () => Date; uid: () => string }

const item = {
  type: "object", required: ["exercise"], additionalProperties: false,
  properties: {
    exercise: { type: "string", description: "Hareket adı, ör. \"Bench Press\"" },
    sets: { type: "integer", minimum: 1, maximum: 20, description: "Set sayısı (varsayılan 3)" },
    kg: { type: "number", minimum: 0, maximum: 1000, description: "Kullanıcının bu harekette şu an çalıştığı kilo (isteğe bağlı; başlangıç noktasına yazılır)" },
    reps: { type: "string", description: "Tekrar hedefi: \"8\" ya da aralık \"6-8\"; süreli harekette saniye (\"45\")" },
  },
};
const items = { type: "array", minItems: 1, maxItems: 30, items: item };

const TOOLS = [
  {
    name: "ozet", title: "Spor Defteri özeti",
    description: "Programları (kimlik, ad, hareketler), haftalık planı (gün, saat, program, bitiş tarihi), haftalık hedefi ve son antrenmanları getirir. Değişiklik yapmadan önce çağır.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    run: (s: State, _a: any, c: Ctx) => overview(s, c.today()),
  },
  {
    name: "gecmis", title: "Antrenman geçmişi",
    description: "Bir hareketin (ya da son günlerdeki bütün hareketlerin) çalışma setlerini, hacmini, en ağır setini ve tahmini 1RM'ini getirir. Setler \"kg x tekrar\"; süreli olanlar saniye; kardiyoda kg yerine dakika, tekrar yerine km.",
    inputSchema: {
      type: "object", additionalProperties: false,
      properties: {
        exercise: { type: "string", description: "Hareket adı (boşsa bütün hareketler)" },
        days: { type: "integer", minimum: 1, maximum: 3650, description: "Kaç gün geriye (varsayılan 30)" },
      },
    },
    annotations: { readOnlyHint: true },
    run: (s: State, a: any, c: Ctx) => history(s, a.exercise, a.days || 30, c.today()),
  },
  {
    name: "antrenman_kaydet", title: "Antrenman kaydet",
    description: "Yapılmış antrenmanları (geçmiş tarihli de olabilir) deftere yazar: başka uygulamadan geçen kullanıcının eski kayıtları ya da bugün yaptıkları. Her set için ağırlıklı harekette kg + reps; vücut ağırlığında yalnız reps; süreli harekette (plank) seconds; kardiyoda minutes ve km. Isınma setlerinde warmup: true. Aynı gün aynı hareketin aynı setleri zaten kayıtlıysa tekrar yazılmaz. Bir çağrıda en fazla 100 antrenman.",
    inputSchema: {
      type: "object", required: ["workouts"], additionalProperties: false,
      properties: {
        workouts: { type: "array", minItems: 1, maxItems: 100, items: {
          type: "object", required: ["date", "exercises"], additionalProperties: false,
          properties: {
            date: { type: "string", description: "Antrenman tarihi YYYY-AA-GG (bugün ya da geçmiş)" },
            exercises: { type: "array", minItems: 1, items: {
              type: "object", required: ["exercise", "sets"], additionalProperties: false,
              properties: {
                exercise: { type: "string", description: "Hareket adı, ör. \"Back Squat\"" },
                note: { type: "string" },
                sets: { type: "array", minItems: 1, maxItems: 50, items: {
                  type: "object", additionalProperties: false,
                  properties: {
                    kg: { type: "number", minimum: 0 }, reps: { type: "number", minimum: 0 },
                    seconds: { type: "number", minimum: 0 }, minutes: { type: "number", minimum: 0 }, km: { type: "number", minimum: 0 },
                    warmup: { type: "boolean" }, rir: { type: "number", minimum: 0, maximum: 10, description: "Yedekte kalan tekrar (isteğe bağlı)" },
                  },
                } },
              },
            } },
          },
        } },
      },
    },
    write: true,
    run: (s: State, a: any, c: Ctx) => logWorkouts(s, a.workouts, c.today(), c.uid),
  },
  {
    name: "kayit_sil", title: "Antrenman kaydını sil",
    description: "Bir günün antrenman kayıtlarını ya da o gün tek bir hareketin kaydını siler (yanlış girilen kaydı düzeltmek için; sonra antrenman_kaydet ile doğrusu yazılabilir). Kullanıcı açıkça istemedikçe kullanma.",
    inputSchema: {
      type: "object", required: ["date"], additionalProperties: false,
      properties: { date: { type: "string", description: "YYYY-AA-GG" }, exercise: { type: "string", description: "Yalnız bu hareket (boşsa günün bütün kayıtları)" } },
    },
    annotations: { destructiveHint: true },
    write: true,
    run: (s: State, a: any) => deleteLog(s, a.date, a.exercise),
  },
  {
    name: "program_ekle", title: "Program ekle",
    description: "Yeni program ekler. Birden çok gün verilirse her gün ayrı program olur. Haftaya yerleştirmek için ardından plan_kur'u çağır.",
    inputSchema: {
      type: "object", required: ["name", "days"], additionalProperties: false,
      properties: {
        name: { type: "string", description: "Program adı, ör. \"Üst Alt\"" },
        days: { type: "array", minItems: 1, maxItems: 7, description: "Antrenman günleri", items: {
          type: "object", required: ["items"], additionalProperties: false,
          properties: { name: { type: "string", description: "Gün adı, ör. \"Üst\" ya da \"A\"" }, items },
        } },
      },
    },
    write: true,
    run: (s: State, a: any, c: Ctx) => addProgram(s, a.name, a.days, c.uid, c.today()),
  },
  {
    name: "program_guncelle", title: "Programı değiştir",
    description: "Var olan bir programın adını ve/veya hareketlerini değiştirir. Hareketler verilirse listenin tamamı yenisiyle değişir.",
    inputSchema: {
      type: "object", required: ["program"], additionalProperties: false,
      properties: { program: { type: "string", description: "Programın kimliği ya da tam adı" }, name: { type: "string", description: "Yeni ad" }, items },
    },
    write: true,
    run: (s: State, a: any, c: Ctx) => updateProgram(s, a.program, { name: a.name, items: a.items }, c.today()),
  },
  {
    name: "program_sil", title: "Programı sil",
    description: "Programı siler; haftalık planda bu programa ayrılmış günler boşalır. Geçmiş antrenman kayıtları silinmez. Kullanıcı açıkça istemedikçe kullanma.",
    inputSchema: { type: "object", required: ["program"], additionalProperties: false, properties: { program: { type: "string", description: "Programın kimliği ya da tam adı" } } },
    annotations: { destructiveHint: true },
    write: true,
    run: (s: State, a: any) => deleteProgram(s, a.program),
  },
  {
    name: "baslangic_kaydet", title: "Mevcut verilerimi kaydet",
    description: "Kullanıcının hareketlerdeki şu anki kilosunu ve tekrarını başlangıç noktası (Mevcut verilerim) olarak kaydeder. Antrenman kaydı değildir: geçmişe ve istatistiklere girmez; kaydı olmayan harekette uygulama kiloyu buradan önerir, bunu geçmek rekor sayılır. Süreli harekette seconds.",
    inputSchema: {
      type: "object", required: ["items"], additionalProperties: false,
      properties: {
        items: { type: "array", minItems: 1, maxItems: 100, items: {
          type: "object", required: ["exercise"], additionalProperties: false,
          properties: {
            exercise: { type: "string", description: "Hareket adı" },
            kg: { type: "number", minimum: 0, maximum: 1000 },
            reps: { type: "number", minimum: 0, maximum: 1000 },
            seconds: { type: "number", minimum: 0, description: "Süreli harekette süre (saniye)" },
          },
        } },
        replace: { type: "boolean", description: "true: eski listeyi tamamen bununla değiştir (varsayılan: üzerine ekle)" },
      },
    },
    write: true,
    run: (s: State, a: any, c: Ctx) => setBaseline(s, a.items, !!a.replace, c.today()),
  },
  {
    name: "plan_kur", title: "Haftalık planı kur",
    description: "Haftalık antrenman planını baştan kurar (listede olmayan günler plandan çıkar). Her gün için program verilmezse o günün mevcut programı ya da plandaki programlar sırayla kullanılır. Google Takvim açıksa telefon planı takvime tarih tarih yazar. Boş days listesi planı temizler.",
    inputSchema: {
      type: "object", required: ["days"], additionalProperties: false,
      properties: {
        days: { type: "array", maxItems: 7, items: {
          type: "object", required: ["day"], additionalProperties: false,
          properties: {
            day: { type: "string", description: "Gün: MO/TU/WE/TH/FR/SA/SU ya da Türkçe adı (Pazartesi…)" },
            program: { type: "string", description: "Programın kimliği ya da tam adı" },
            time: { type: "string", description: "Başlangıç saati \"18:00\" (verilmezse eski saat ya da 19:00)" },
          },
        } },
        until: { type: "string", description: "Planın bitiş tarihi YYYY-AA-GG (en fazla bir yıl ileride). \"\" = süresiz; hiç verilmezse mevcut bitiş tarihi kalır." },
      },
    },
    write: true,
    run: (s: State, a: any, c: Ctx) => setPlan(s, a.days, a.until, c.today()),
  },
];

class UserError extends Error {}

async function callTool(name: string, args: any, c: Ctx) {
  const tool = TOOLS.find(t => t.name === name);
  if (!tool) throw new UserError(`Bilinmeyen araç: ${name}`);
  const store = driveStore(await c.token());
  const raw = await store.read();
  if (raw == null) throw new UserError("Drive'da Spor Defteri verisi yok. Telefonda uygulamayı aç: Profil → Google Drive ile eşitle'yi aynı Google hesabıyla aç, sonra tekrar dene.");
  const s = withDefaults(JSON.parse(raw));
  const snap = takeSnapshot(s);
  let result: unknown;
  try { result = tool.run(s, args || {}, c); }
  catch (e: any) { throw new UserError(e.message); }
  if ("write" in tool) {
    const now = Date.now();
    stampChanges(s, snap, now);
    await store.write(JSON.stringify({ ...toPayload(s), syncedAt: now, writer: "claude" }));
    result = { ...(result as object), saved: "Drive'a kaydedildi; telefondaki uygulama açılınca gelir." };
  }
  return result;
}

const rpc = (id: unknown, result: unknown) => ({ jsonrpc: "2.0", id, result });
const rpcError = (id: unknown, code: number, message: string) => ({ jsonrpc: "2.0", id, error: { code, message } });

async function handle(msg: any, c: Ctx) {
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") return rpcError(msg?.id ?? null, -32600, "Geçersiz istek");
  const { id, method, params } = msg;
  if (id === undefined) return null; // bildirim: cevap yok
  switch (method) {
    case "initialize": {
      const v = VERSIONS.includes(params?.protocolVersion) ? params.protocolVersion : VERSIONS[0];
      return rpc(id, { protocolVersion: v, capabilities: { tools: {} }, serverInfo: { name: "spor-defteri", title: "Spor Defteri", version: "1.0.0" }, instructions: INSTRUCTIONS });
    }
    case "ping": return rpc(id, {});
    case "tools/list": return rpc(id, { tools: TOOLS.map(({ run, write, ...t }: any) => t) });
    case "tools/call":
      try {
        const out = await callTool(params?.name, params?.arguments, c);
        return rpc(id, { content: [{ type: "text", text: JSON.stringify(out, null, 1) }] });
      } catch (e: any) {
        const text = e instanceof UserError ? e.message
          : e instanceof AuthError || e?.name === "GoogleRevoked" ? "Google izni geçersiz ya da geri alınmış. Claude ayarlarında Spor Defteri bağlayıcısının bağlantısını kesip yeniden bağlan."
          : `Beklenmeyen hata: ${e?.message || e}`;
        return rpc(id, { content: [{ type: "text", text }], isError: true });
      }
    default: return rpcError(id, -32601, `Desteklenmeyen yöntem: ${method}`);
  }
}

export async function mcpFetch(req: Request, c: Ctx): Promise<Response> {
  if (req.method !== "POST") return new Response("Yalnız POST", { status: 405, headers: { Allow: "POST" } });
  let body: any;
  try { body = await req.json(); } catch { return Response.json(rpcError(null, -32700, "JSON çözülemedi"), { status: 400 }); }
  const out = Array.isArray(body) ? (await Promise.all(body.map(m => handle(m, c)))).filter(Boolean) : await handle(body, c);
  if (!out || (Array.isArray(out) && !out.length)) return new Response(null, { status: 202 });
  return Response.json(out);
}
