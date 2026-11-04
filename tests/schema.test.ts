import { describe, it, expect } from "vitest";
import { DEFAULTS, withDefaults, takeSnapshot, stampChanges, mergeStates, TOMBSTONE_DAYS, type State } from "../src/core/schema.ts";

const entry = (id: string, extra: object = {}) => ({ id, ex: "Back Squat", date: "2026-10-01", sets: [{ w: 100, r: 5 }], ...extra });
const fresh = (over: Partial<State> = {}): State => ({ ...DEFAULTS(), deviceId: "d-test", ...over });

describe("withDefaults", () => {
  it("eksik alanları varsayılanlarla doldurur", () => {
    const s = withDefaults({ v: 2, entries: [entry("a")] });
    expect(s.programs).toEqual([]);
    expect(s.prefs).toEqual({ wake: true, haptics: true, focus: "both" });
    expect(s.plates).toEqual([25, 20, 15, 10, 5, 2.5, 1.25]);
  });

  it("iç içe ayarları birleştirir, kullanıcının değerini korur", () => {
    const s = withDefaults({ v: 2, prefs: { haptics: false }, profile: { bw: "80" } });
    expect(s.prefs).toEqual({ wake: true, haptics: false, focus: "both" });
    expect(s.profile).toEqual({ sex: "m", bw: "80" });
  });

  it("v1 verisini v2'ye yükseltir: zamanı olmayan kayıtlar ts ya da 1 alır", () => {
    const s = withDefaults({ entries: [entry("a", { ts: 500 }), entry("b")] });
    expect(s.v).toBe(2);
    expect(s.entries.map(e => e.u)).toEqual([500, 1]);
    expect(s.settingsU).toBe(1);
  });

  it("koleksiyon dizi değilse boş diziye çevirir", () => {
    const s = withDefaults({ v: 2, entries: null, deleted: "bozuk" });
    expect(s.entries).toEqual([]);
    expect(s.deleted).toEqual([]);
  });
});

describe("stampChanges", () => {
  it("ilk çağrıda damga basmaz, yalnızca anlık görüntü alır", () => {
    const s = fresh({ entries: [entry("a")] });
    stampChanges(s, null, 1000);
    expect(s.entries[0].u).toBeUndefined();
  });

  it("yeni ve değişen kayıtlara zaman basar, değişmeyene dokunmaz", () => {
    const s = fresh({ entries: [entry("a", { u: 10 }), entry("b", { u: 10 })] });
    let snap = takeSnapshot(s);
    s.entries[1].sets = [{ w: 105, r: 5 }];
    s.entries.push(entry("c"));
    snap = stampChanges(s, snap, 2000);
    expect(s.entries.map(e => e.u)).toEqual([10, 2000, 2000]);
    // ikinci kayıtta değişiklik yoksa yeni damga gelmez
    stampChanges(s, snap, 3000);
    expect(s.entries.map(e => e.u)).toEqual([10, 2000, 2000]);
  });

  it("silinen kayıt için mezar taşı yazar", () => {
    const s = fresh({ entries: [entry("a"), entry("b")] });
    const snap = takeSnapshot(s);
    s.entries = s.entries.filter(e => e.id !== "a");
    stampChanges(s, snap, 5000);
    expect(s.deleted).toEqual([{ c: "entries", k: "a", at: 5000 }]);
  });

  it("aynı anahtarla yeniden eklenen kayıt mezar taşını kaldırır", () => {
    const s = fresh({ body: [], deleted: [{ c: "body", k: "2026-10-01", at: 100 }] });
    const snap = takeSnapshot(s);
    s.body.push({ date: "2026-10-01", weight: 80 });
    stampChanges(s, snap, 200);
    expect(s.deleted).toEqual([]);
    expect(s.body[0].u).toBe(200);
  });

  it("ayar değişince settingsU güncellenir", () => {
    const s = fresh({ settingsU: 1 });
    const snap = takeSnapshot(s);
    s.rest = 120;
    stampChanges(s, snap, 7000);
    expect(s.settingsU).toBe(7000);
  });

  it(`${TOMBSTONE_DAYS} günden eski mezar taşlarını temizler`, () => {
    const now = 400 * 864e5;
    const s = fresh({ deleted: [{ c: "entries", k: "eski", at: now - 366 * 864e5 }, { c: "entries", k: "yeni", at: now - 10 * 864e5 }] });
    stampChanges(s, takeSnapshot(s), now);
    expect(s.deleted.map(t => t.k)).toEqual(["yeni"]);
  });
});

describe("mergeStates", () => {
  it("yalnız uzakta olan kaydı ekler", () => {
    const { state, stats } = mergeStates(fresh({ entries: [entry("a", { u: 1 })] }), fresh({ entries: [entry("b", { u: 1 })] }));
    expect(state.entries.map(e => e.id).sort()).toEqual(["a", "b"]);
    expect(stats).toEqual({ added: 1, updated: 0, removed: 0 });
  });

  it("aynı kayıtta daha yeni olan kazanır, iki yönde de", () => {
    const old = entry("a", { u: 1, sets: [{ w: 100, r: 5 }] });
    const neu = entry("a", { u: 2, sets: [{ w: 110, r: 5 }] });
    const ab = mergeStates(fresh({ entries: [old] }), fresh({ entries: [neu] }));
    const ba = mergeStates(fresh({ entries: [neu] }), fresh({ entries: [old] }));
    expect(ab.state.entries[0].sets[0].w).toBe(110);
    expect(ba.state.entries[0].sets[0].w).toBe(110);
    expect(ab.stats.updated).toBe(1);
    expect(ba.stats.updated).toBe(0);
  });

  it("silinen kayıt diğer cihazdan geri gelmez", () => {
    const local = fresh({ entries: [], deleted: [{ c: "entries", k: "a", at: 50 }] });
    const remote = fresh({ entries: [entry("a", { u: 10 })] });
    const { state, stats } = mergeStates(local, remote);
    expect(state.entries).toEqual([]);
    expect(stats.added).toBe(0);
  });

  it("silmeden sonra düzenlenen kayıt yaşar", () => {
    const local = fresh({ entries: [], deleted: [{ c: "entries", k: "a", at: 50 }] });
    const remote = fresh({ entries: [entry("a", { u: 60 })] });
    expect(mergeStates(local, remote).state.entries.map(e => e.id)).toEqual(["a"]);
  });

  it("uzaktaki silme yereldeki kaydı kaldırır ve sayar", () => {
    const local = fresh({ entries: [entry("a", { u: 10 })] });
    const remote = fresh({ deleted: [{ c: "entries", k: "a", at: 20 }] });
    const { state, stats } = mergeStates(local, remote);
    expect(state.entries).toEqual([]);
    expect(stats.removed).toBe(1);
    expect(state.deleted).toEqual([{ c: "entries", k: "a", at: 20 }]);
  });

  it("ayarlarda son yazan kazanır", () => {
    const local = fresh({ rest: 90, settingsU: 100 });
    const remote = fresh({ rest: 180, settingsU: 200 });
    expect(mergeStates(local, remote).state.rest).toBe(180);
    expect(mergeStates(remote, local).state.rest).toBe(180);
  });

  it("cihaza özel alanlar (canlı antrenman, taslak, cihaz kimliği) yerelden korunur", () => {
    const local = fresh({ deviceId: "yerel", live: { date: "x" }, draft: { ex: "y" }, active: "p1" });
    const remote = fresh({ deviceId: "uzak", live: null, draft: null, active: "p2", settingsU: 999 });
    const { state } = mergeStates(local, remote);
    expect([state.deviceId, state.live, state.draft, state.active]).toEqual(["yerel", { date: "x" }, { ex: "y" }, "p1"]);
  });

  it("birleştirme sırası sonucu değiştirmez (değişmeli)", () => {
    const a = fresh({
      entries: [entry("a", { u: 5 }), entry("b", { u: 1 })],
      deleted: [{ c: "entries", k: "c", at: 9 }],
      rest: 60, settingsU: 3,
    });
    const b = fresh({
      entries: [entry("b", { u: 7, sets: [{ w: 1, r: 1 }] }), entry("c", { u: 4 }), entry("d", { u: 2 })],
      rest: 120, settingsU: 8,
    });
    const norm = (s: State) => ({ ids: s.entries.map(e => e.id + "@" + e.u).sort(), rest: s.rest, deleted: s.deleted });
    expect(norm(mergeStates(a, b).state)).toEqual(norm(mergeStates(b, a).state));
  });

  it("eski (v1) yedeği birleştirirken yükseltir", () => {
    const local = fresh({ entries: [entry("a", { u: 100 })] });
    const v1 = { entries: [entry("a", { ts: 5, sets: [{ w: 1, r: 1 }] }), entry("z", { ts: 6 })] };
    const { state } = mergeStates(local, v1);
    expect(state.entries.find(e => e.id === "a")!.sets[0].w).toBe(100);
    expect(state.entries.map(e => e.id).sort()).toEqual(["a", "z"]);
  });
});
