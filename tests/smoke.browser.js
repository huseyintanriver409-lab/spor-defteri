// Tarayıcıda elle çalıştırılan duman testi: temiz verilerle ana akışı baştan sona dener.
// Kullanım: uygulamayı aç, localStorage'ı temizleyip sayfayı yenile, sonra bu dosyanın içeriğini konsola yapıştır.
// Sonuç: { ok, steps, errors } — errors boş ve ok true olmalı.
(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const q = s => document.querySelector(s);
  const errors = [];
  const onErr = e => errors.push(String(e.message || e.reason || e));
  window.addEventListener("error", onErr);
  window.addEventListener("unhandledrejection", onErr);
  const steps = [];
  const step = async (name, fn) => {
    try { const r = await fn(); steps.push([name, r === undefined ? "ok" : r]); }
    catch (e) { steps.push([name, "HATA: " + e.message]); }
    await wait(250);
  };

  await step("ilk açılış", () => { q("#obGo").click(); });
  await step("hızlı başlat", () => { q("#homeMain [data-start]").click(); return q("#focus").classList.contains("hidden") ? "odak açılmadı" : undefined; });
  // stepper basılı tutmayı desteklemek için click değil pointerdown dinler
  await step("kilo +3", () => {
    const b = q('#fBody .stepper[data-k="w"] [data-d="1"]');
    for (let i = 0; i < 3; i++) { b.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); b.dispatchEvent(new PointerEvent("pointerup", { bubbles: true })); }
  });
  await step("set tamamla", () => { q("#fComplete").click(); });
  await step("ikinci set", () => { q("#fComplete").click(); });
  await step("antrenmanı bitir", async () => { q("#fEnd").click(); await wait(200); q("#modalBtns .primary").click(); });
  const data = JSON.parse(localStorage.getItem("sporDefteri.v1") || "{}");
  await step("kayıt", () => {
    const e = (data.entries || [])[0];
    if (!e) return "kayıt yok";
    if (!(+e.sets[0].w > 0)) return "HATA: kilo kaydedilmedi";
    return `${e.ex}: ${e.sets.length} set, ilk ${e.sets[0].w} kg × ${e.sets[0].r}`;
  });
  for (const t of ["train", "history", "progress", "profile", "home"]) {
    await step("sekme " + t, () => { q(`nav.tabs [data-tab="${t}"]`).click(); });
  }
  window.removeEventListener("error", onErr);
  window.removeEventListener("unhandledrejection", onErr);
  const ok = !errors.length && steps.every(([, r]) => !String(r).startsWith("HATA") && r !== "kayıt yok" && r !== "odak açılmadı");
  return { ok, steps, errors, sessions: (data.sessions || []).length };
})();
