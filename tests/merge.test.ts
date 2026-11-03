import { describe, it, expect } from "vitest";
import { mergeExercise } from "../src/core/merge.ts";
import { DEFAULTS, stampChanges, takeSnapshot, withDefaults } from "../src/core/schema.ts";

const make = () => withDefaults({
  ...DEFAULTS(), v: 2,
  custom: [{ name: "Conventional Deadlift", group: "Diğer" }],
  entries: [
    { id: "a", date: "2026-11-01", ex: "Conventional Deadlift", sets: [{ w: 120, r: 5 }] },
    { id: "b", date: "2026-11-02", ex: "Conventional Deadlift", sets: [{ w: 125, r: 5 }], note: "iyi" },
    { id: "c", date: "2026-11-02", ex: "Deadlift", sets: [{ w: 100, r: 8 }] },
    { id: "d", date: "2026-11-02", ex: "Bench Press (Barbell)", sets: [{ w: 70, r: 8 }] },
  ],
  programs: [
    { id: "p1", name: "B", items: [{ ex: "Conventional Deadlift", sets: 2, reps: "5" }, { ex: "Lat Pulldown", sets: 3, reps: "8" }] },
    { id: "p2", name: "C", items: [{ ex: "Deadlift", sets: 3, reps: "5" }, { ex: "Conventional Deadlift", sets: 2, reps: "5" }] },
  ],
  baseline: { "Conventional Deadlift": { w: 125, r: 5, date: "2026-11-03" } },
  exNotes: { "Conventional Deadlift": "kemer tak" },
  favs: ["Conventional Deadlift", "Deadlift"],
});

describe("hareket birleştirme", () => {
  it("kayıtlar, programlar, başlangıç verisi, notlar ve favoriler tek ada toplanır; özel hareket kalkar", () => {
    const s = make(), snap = takeSnapshot(s);
    expect(mergeExercise(s, "Conventional Deadlift", "Deadlift")).toEqual({ entries: 2, programs: 2 });
    expect(s.entries.map(e => [e.id, e.ex])).toEqual([["a", "Deadlift"], ["c", "Deadlift"], ["d", "Bench Press (Barbell)"]]);
    // aynı gündeki iki kayıt tek kayıtta
    expect(s.entries.find(e => e.id === "c")).toMatchObject({ sets: [{ w: 100, r: 8 }, { w: 125, r: 5 }], note: "iyi" });
    expect(s.programs[0].items.map((i: any) => i.ex)).toEqual(["Deadlift", "Lat Pulldown"]);
    expect(s.programs[1].items).toEqual([{ ex: "Deadlift", sets: 3, reps: "5" }]);
    expect(s.baseline).toEqual({ Deadlift: { w: 125, r: 5, date: "2026-11-03" } });
    expect(s.exNotes).toEqual({ Deadlift: "kemer tak" });
    expect(s.favs).toEqual(["Deadlift"]);
    expect(s.custom).toEqual([]);
    // eşitleme için: silinen kayıt ve özel hareket mezar taşı alır, değişenler damgalanır
    stampChanges(s, snap, 5);
    expect(s.deleted.map(t => t.c + ":" + t.k).sort()).toEqual(["custom:Conventional Deadlift", "entries:b"]);
    expect(s.entries.find(e => e.id === "a")!.u).toBe(5);
    expect(s.settingsU).toBe(5);
  });

  it("aynı ya da boş hareket seçilemez", () => {
    expect(() => mergeExercise(make(), "Deadlift", "Deadlift")).toThrow();
    expect(() => mergeExercise(make(), "", "Deadlift")).toThrow();
  });
});
