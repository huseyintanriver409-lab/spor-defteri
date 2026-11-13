// UI changes are immediate; history traversals are asynchronous and serialized.
// Keep desired layers separate from the entries the browser has reached.
const KEY = "sporDefteri.layers";
export function createLayers(win){
  const owner = `${Date.now()}-${Math.random()}`;
  let layers = [], path = [], pending = false, serial = 0;
  const marker = state => state?.[KEY];
  const clean = state => { const copy = { ...state }; delete copy[KEY]; return copy; };
  // A reload restores no overlays. Old entries are inert and skipped on Back.
  const restored = marker(win.history.state);
  const common = (a, b) => { let i = 0; while (i < a.length && a[i] === b[i]) i++; return i; };
  function reconcile(){
    if (pending) return;
    const wanted = layers.map(l => l.token), n = common(path, wanted);
    // A synchronous close -> open transition reuses the current entry. Besides
    // avoiding a traversal race, this preserves Chrome's user-activation history
    // eligibility (a push after popstate could be skipped by Android Back).
    if (path.length && path.length === wanted.length && n === path.length - 1) {
      path = wanted;
      win.history.replaceState({ ...clean(win.history.state), [KEY]: { owner, path } }, "");
      return;
    }
    if (path.length > n) {
      pending = true;
      win.history.back();
      return;
    }
    while (path.length < wanted.length) {
      path = wanted.slice(0, path.length + 1);
      win.history.pushState({ ...clean(win.history.state), [KEY]: { owner, path } }, "");
    }
  }
  function pop(e){
    const m = marker(e.state), wasPending = pending;
    pending = false;
    path = m?.owner === owner ? m.path : [];
    if (!wasPending) {
      const n = common(layers.map(l => l.token), path);
      const removed = layers.splice(n);
      removed.reverse().forEach(l => l.dismiss());
    }
    // Entries from an earlier document must never resurrect a phantom overlay.
    if (m && m.owner !== owner) { pending = true; win.history.back(); return; }
    reconcile();
  }
  function close(id){
    const i = layers.findIndex(l => l.id === id);
    if (i < 0) return;
    const [layer] = layers.splice(i, 1);
    // Remove first: callbacks may close another layer or open a replacement.
    layer.dismiss();
    // Give synchronous actions and resolved modal promises a chance to replace
    // the layer before starting a browser traversal.
    queueMicrotask(reconcile);
  }
  function keydown(e){
    if (e.key === "Escape" && layers.length) { e.preventDefault(); close(layers.at(-1).id); }
  }
  win.addEventListener("popstate", pop);
  win.addEventListener("keydown", keydown);
  // Yalnız işareti temizle: geri gitmek uygulamayı tek girdili oturumda dışarı çıkarabilir.
  if (restored) win.history.replaceState(clean(win.history.state), "");
  return {
    open(id, dismiss){
      const existing = layers.find(l => l.id === id);
      if (existing) existing.dismiss = dismiss;
      else layers.push({ id, dismiss, token: ++serial });
      reconcile();
    },
    close,
    destroy(){ win.removeEventListener("popstate", pop); win.removeEventListener("keydown", keydown); },
  };
}

let manager;
export function setupLayers(){
  if (!manager && typeof window !== "undefined" && window.history && window.addEventListener) manager = createLayers(window);
  return manager;
}
export const openLayer = (id, dismiss) => setupLayers()?.open(id, dismiss);
export const closeLayer = id => setupLayers()?.close(id);
