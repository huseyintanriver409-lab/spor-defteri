// Google Calendar REST istemcisi. Kapsam calendar.app.created: yalnız uygulamanın oluşturduğu takvim.
import { AuthError } from "./drive.ts";
import { CalendarMissing, type CalendarClient } from "../core/calendar.ts";
import { t } from "../core/i18n.ts";

const API = "https://www.googleapis.com/calendar/v3";

export function calendarClient(token: string, fetchFn: typeof fetch = fetch): CalendarClient {
  const call = async (url: string, method: string, body?: object) => {
    const res = await fetchFn(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) throw new AuthError(t("cloud.err_cal_no_access"));
    if (res.status === 403) {
      // 403 kota aşımı da olabilir; yalnız izin sorunu yeniden giriş ister
      const text = await res.text().catch(() => "");
      if (/rateLimitExceeded|quotaExceeded|usageLimits/i.test(text)) throw new Error(t("cloud.err_cal_busy"));
      throw new AuthError(t("cloud.err_cal_no_perm"));
    }
    return res;
  };
  const events = (cal: string) => `${API}/calendars/${encodeURIComponent(cal)}/events`;
  const fail = (key: string, res: Response) => new Error(t(key, { status: res.status }));

  return {
    async createCalendar(summary, description, timeZone) {
      const res = await call(`${API}/calendars`, "POST", { summary, description, timeZone });
      if (!res.ok) throw fail("cloud.err_cal_create_cal", res);
      return (await res.json()).id;
    },
    async upsertEvent(cal, id, body) {
      // önce güncelle (silinmiş etkinliği de geri getirir); yoksa oluştur
      let res = await call(`${events(cal)}/${id}`, "PUT", { ...body, id });
      if (res.ok) return;
      if (res.status !== 404 && res.status !== 410) throw fail("cloud.err_cal_update_event", res);
      res = await call(events(cal), "POST", { ...body, id });
      if (res.ok) return;
      // PUT de POST da 404 veriyorsa takvimin kendisi yok
      if (res.status === 404) throw new CalendarMissing(t("cloud.err_cal_missing"));
      // arada başka bir cihaz oluşturduysa güncellemeyi bir kez daha dene
      if (res.status === 409 && (await call(`${events(cal)}/${id}`, "PUT", { ...body, id })).ok) return;
      throw fail("cloud.err_cal_create_event", res);
    },
    async deleteEvent(cal, id) {
      const res = await call(`${events(cal)}/${id}`, "DELETE");
      if (res.ok || res.status === 404 || res.status === 410) return;
      throw fail("cloud.err_cal_delete_event", res);
    },
  };
}
