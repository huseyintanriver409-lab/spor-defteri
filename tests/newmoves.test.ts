import { describe, it, expect } from "vitest";
import { LIB } from "../src/core/library.ts";
import { WEIGHTS } from "../src/core/muscledata.ts";

// yeni hareket → temel hareket (payları birebir kopyalanır)
const BASE: Record<string, string | null> = {
  "Cable Chest Press": "Bench Press (Barbell)", "Reverse-Grip Bench Press": "Bench Press (Barbell)", "Deficit Push-up": "Push-up", "Weighted Push-up": "Push-up", "Squeeze Press (Dumbbell)": "Dumbbell Bench Press",
  "Reverse-Grip Lat Pulldown": "Wide-Grip Lat Pulldown", "Neutral-Grip Pull-up": "Pull-up", "Single-Arm Cable Row": "Seated Cable Row", "Landmine Row": "T-Bar Row", "Reverse-Grip Barbell Row": "Barbell Row", "Machine Pullover": "Straight-Arm Pulldown", "Deficit Deadlift": "Deadlift",
  "Band Pull-Apart": "Cable Rear Delt Fly", "Pike Push-up": "Overhead Press (Barbell)", "Cable Internal Rotation": "Cable External Rotation", "Chest-Supported Rear Delt Raise": "Rear Delt Fly (Dumbbell)", "Dumbbell Scaption": "Lateral Raise (Dumbbell)",
  "High Cable Curl": "Cable Curl", "Reverse-Grip Triceps Pushdown": "Triceps Pushdown (Bar)", "Lying Cable Triceps Extension": "Skull Crusher (EZ-Bar)", "Assisted Dip Machine": "Triceps Dip", "Machine Seated Dip": "Triceps Dip",
  "Split Squat": "Bulgarian Split Squat", "Jump Squat": "Air Squat", "Curtsy Lunge": "Reverse Lunge", "Dumbbell Sumo Squat": "Goblet Squat", "Reverse Nordic": "Sissy Squat", "Overhead Squat": "Front Squat", "Safety Bar Squat": "Back Squat", "Cossack Squat": "Lateral Lunge",
  "Slider Leg Curl": "Lying Leg Curl", "Machine Glute Kickback": "Cable Glute Kickback", "Cable Hip Abduction": "Machine Hip Abduction", "Banded Clamshell": "Machine Hip Abduction", "Banded Lateral Walk": "Machine Hip Abduction",
  "Toes-to-Bar": "Hanging Leg Raise", "Copenhagen Plank": "Side Plank", "Cable Side Bend": "Side Bend (Dumbbell)", "Landmine Twist": "Russian Twist", "Suitcase Carry": "Farmer's Walk",
  "Medicine Ball Slam": null, "Kettlebell Snatch": "Kettlebell Swing", "Dumbbell Snatch": "Kettlebell Swing", "Bear Crawl": "Mountain Climber", "SkiErg": null,
};
const names = Object.keys(BASE);
const all = Object.values(LIB).flat();

describe("yeni hareketler (2026-11)", () => {
  it("45 hareket, her biri kütüphanede tam bir kez", () => {
    expect(names.length).toBe(45);
    for (const n of names) expect(all.filter(x => x === n), n).toHaveLength(1);
  });
  it("ad çakışması yok (büyük-küçük harf duyarsız)", () => {
    const low = all.map(x => x.toLowerCase());
    expect(low.length).toBe(new Set(low).size);
  });
  it("SkiErg kardiyoda ve kas payı yok; Medicine Ball Slam mekanik kas payları taşır", () => {
    expect(LIB["Kardiyo"]).toContain("SkiErg");
    expect(WEIGHTS["SkiErg"]).toBeUndefined();
    expect(WEIGHTS["Medicine Ball Slam"]).toEqual({ Lat: .5, "Karın": .5, "Oblik": .3, Triceps: .25, "Ön Omuz": .25, "Kalça": .25, "Yan Omuz": .2, "Göğüs": .2, Quadriceps: .2 });
  });
  it("paylar temel hareketin birebir kopyasıdır (Copenhagen ve Suitcase istisnası hariç)", () => {
    for (const n of names) {
      const b = BASE[n];
      if (n === "SkiErg" || b === null) continue;
      expect(WEIGHTS[b], "temel " + b).toBeDefined();
      if (n === "Copenhagen Plank") expect(WEIGHTS[n]).toEqual({ ...WEIGHTS[b], "İç Bacak": 1 });
      else if (n === "Suitcase Carry") expect(WEIGHTS[n]).toEqual({ ...WEIGHTS[b], "Oblik": Math.max(WEIGHTS[b]["Oblik"], 0.6) });
      else expect(WEIGHTS[n], n).toEqual(WEIGHTS[b]);
    }
  });
});
