// Google Tasks REST istemcisi. Kapsam tasks: Google görevler için uygulamaya özel dar kapsam sunmuyor;
// uygulama yine de yalnız kendi oluşturduğu "Spor Defteri" listesine dokunur (core/calendar.ts).
import { AuthError } from "./drive.ts";
import { TaskListMissing, type Task, type TasksClient } from "../core/calendar.ts";

const API = "https://tasks.googleapis.com/tasks/v1";

export function tasksClient(token: string, fetchFn: typeof fetch = fetch): TasksClient {
  const call = async (url: string, method: string, body?: object) => {
    const res = await fetchFn(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) throw new AuthError("Görev erişimi reddedildi (401)");
    if (res.status === 403) {
      const text = await res.text().catch(() => "");
      // Google Cloud projesinde Tasks API açılmamışsa yeniden giriş işe yaramaz
      if (/accessNotConfigured|SERVICE_DISABLED|has not been used/i.test(text)) throw new Error("Google Tasks API, Google Cloud projesinde açık değil");
      if (/rateLimitExceeded|quotaExceeded|usageLimits/i.test(text)) throw new Error("Google Görevler şu an meşgul, sonra yeniden denenecek");
      throw new AuthError("Görev izni yok (403)");
    }
    return res;
  };
  const tasks = (list: string) => `${API}/lists/${encodeURIComponent(list)}/tasks`;
  const fail = (what: string, res: Response) => new Error(`Görev hatası: ${what} (${res.status})`);
  const missing = (res: Response) => res.status === 404 || res.status === 400;

  return {
    async createList(title) {
      const res = await call(`${API}/users/@me/lists`, "POST", { title });
      if (!res.ok) throw fail("liste oluşturulamadı", res);
      return ((await res.json()) as any).id;
    },
    async listTasks(list, dueMin) {
      const out: Task[] = [];
      let page = "";
      do {
        const q = new URLSearchParams({ dueMin: `${dueMin}T00:00:00.000Z`, showCompleted: "true", showHidden: "true", maxResults: "100", ...(page ? { pageToken: page } : {}) });
        const res = await call(`${tasks(list)}?${q}`, "GET");
        if (missing(res)) throw new TaskListMissing("Spor Defteri görev listesi bulunamadı");
        if (!res.ok) throw fail("görevler okunamadı", res);
        const j = (await res.json()) as any;
        out.push(...(j.items || []));
        page = j.nextPageToken || "";
      } while (page);
      return out;
    },
    async insertTask(list, body) {
      const res = await call(tasks(list), "POST", body);
      if (missing(res)) throw new TaskListMissing("Spor Defteri görev listesi bulunamadı");
      if (!res.ok) throw fail("görev eklenemedi", res);
    },
    async patchTask(list, id, body) {
      const res = await call(`${tasks(list)}/${encodeURIComponent(id)}`, "PATCH", body);
      if (!res.ok && res.status !== 404) throw fail("görev güncellenemedi", res);
    },
    async deleteTask(list, id) {
      const res = await call(`${tasks(list)}/${encodeURIComponent(id)}`, "DELETE");
      if (res.ok || res.status === 404 || res.status === 410) return;
      throw fail("görev silinemedi", res);
    },
  };
}
