// Google Tasks REST istemcisi. Kapsam tasks: Google görevler için uygulamaya özel dar kapsam sunmuyor;
// uygulama yine de yalnız kendi oluşturduğu "Spor Defteri" listesine dokunur (core/calendar.ts).
import { AuthError } from "./drive.ts";
import { TaskListMissing, type Task, type TasksClient } from "../core/calendar.ts";
import { t } from "../core/i18n.ts";

// Görevler kapsamı için yetki hatası (cloud.js hangi izni düşüreceğini ileti metninden değil sınıftan anlar)
export class TasksAuthError extends AuthError {}

const API = "https://tasks.googleapis.com/tasks/v1";

export function tasksClient(token: string, fetchFn: typeof fetch = fetch): TasksClient {
  const call = async (url: string, method: string, body?: object) => {
    const res = await fetchFn(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) throw new TasksAuthError(t("cloud.err_task_no_access"));
    if (res.status === 403) {
      const text = await res.text().catch(() => "");
      // Google Cloud projesinde Tasks API açılmamışsa yeniden giriş işe yaramaz
      if (/accessNotConfigured|SERVICE_DISABLED|has not been used/i.test(text)) throw new Error(t("cloud.err_tasks_api_off"));
      if (/rateLimitExceeded|quotaExceeded|usageLimits/i.test(text)) throw new Error(t("cloud.err_tasks_busy"));
      throw new TasksAuthError(t("cloud.err_task_no_perm"));
    }
    return res;
  };
  const tasks = (list: string) => `${API}/lists/${encodeURIComponent(list)}/tasks`;
  const fail = (key: string, res: Response) => new Error(t(key, { status: res.status }));
  const missing = (res: Response) => res.status === 404 || res.status === 400;

  return {
    async getTask(list, id) {
      const res = await call(`${tasks(list)}/${encodeURIComponent(id)}`, "GET");
      if (res.status === 404 || res.status === 410) return null;
      if (!res.ok) throw fail("cloud.err_task_read", res);
      return await res.json() as Task;
    },
    async createList(title) {
      const res = await call(`${API}/users/@me/lists`, "POST", { title });
      if (!res.ok) throw fail("cloud.err_task_create_list", res);
      return ((await res.json()) as any).id;
    },
    async listTasks(list, dueMin) {
      const out: Task[] = [];
      let page = "";
      do {
        const q = new URLSearchParams({ dueMin: `${dueMin}T00:00:00.000Z`, showCompleted: "true", showHidden: "true", maxResults: "100", ...(page ? { pageToken: page } : {}) });
        const res = await call(`${tasks(list)}?${q}`, "GET");
        if (missing(res)) throw new TaskListMissing(t("cloud.err_tasklist_missing"));
        if (!res.ok) throw fail("cloud.err_task_read", res);
        const j = (await res.json()) as any;
        out.push(...(j.items || []));
        page = j.nextPageToken || "";
      } while (page);
      return out;
    },
    async insertTask(list, body) {
      const res = await call(tasks(list), "POST", body);
      if (missing(res)) throw new TaskListMissing(t("cloud.err_tasklist_missing"));
      if (!res.ok) throw fail("cloud.err_task_insert", res);
    },
    async patchTask(list, id, body) {
      const res = await call(`${tasks(list)}/${encodeURIComponent(id)}`, "PATCH", body);
      if (!res.ok && res.status !== 404) throw fail("cloud.err_task_update", res);
    },
    async deleteTask(list, id) {
      const res = await call(`${tasks(list)}/${encodeURIComponent(id)}`, "DELETE");
      if (res.ok || res.status === 404 || res.status === 410) return;
      throw fail("cloud.err_task_delete", res);
    },
  };
}
