// Google Calendar REST istemcisi. Kapsam calendar.app.created: yalnız uygulamanın oluşturduğu takvim.
import { AuthError } from "./drive.ts";
import { CalendarMissing, type CalendarClient } from "../core/calendar.ts";

const API = "https://www.googleapis.com/calendar/v3";

export function calendarClient(token: string, fetchFn: typeof fetch = fetch): CalendarClient {
  const call = async (url: string, method: string, body?: object) => {
    const res = await fetchFn(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) throw new AuthError("Takvim erişimi reddedildi (401)");
    if (res.status === 403) {
      // 403 kota aşımı da olabilir; yalnız izin sorunu yeniden giriş ister
      const text = await res.text().catch(() => "");
      if (/rateLimitExceeded|quotaExceeded|usageLimits/i.test(text)) throw new Error("Takvim şu an meşgul, sonra yeniden denenecek");
      throw new AuthError("Takvim izni yok (403)");
    }
    return res;
  };
  const events = (cal: string) => `${API}/calendars/${encodeURIComponent(cal)}/events`;
  const fail = (what: string, res: Response) => new Error(`Takvim hatası: ${what} (${res.status})`);

  return {
    async createCalendar(summary, description, timeZone) {
      const res = await call(`${API}/calendars`, "POST", { summary, description, timeZone });
      if (!res.ok) throw fail("takvim oluşturulamadı", res);
      return (await res.json()).id;
    },
    async upsertEvent(cal, id, body) {
      // önce güncelle (silinmiş etkinliği de geri getirir); yoksa oluştur
      let res = await call(`${events(cal)}/${id}`, "PUT", { ...body, id });
      if (res.ok) return;
      if (res.status !== 404 && res.status !== 410) throw fail("etkinlik güncellenemedi", res);
      res = await call(events(cal), "POST", { ...body, id });
      if (res.ok) return;
      // PUT de POST da 404 veriyorsa takvimin kendisi yok
      if (res.status === 404) throw new CalendarMissing("Spor Defteri takvimi bulunamadı");
      // arada başka bir cihaz oluşturduysa güncellemeyi bir kez daha dene
      if (res.status === 409 && (await call(`${events(cal)}/${id}`, "PUT", { ...body, id })).ok) return;
      throw fail("etkinlik oluşturulamadı", res);
    },
    async deleteEvent(cal, id) {
      const res = await call(`${events(cal)}/${id}`, "DELETE");
      if (res.ok || res.status === 404 || res.status === 410) return;
      throw fail("etkinlik silinemedi", res);
    },
  };
}
