import { NEW_EXERCISES } from "./new-exercises.ts";
// Araştırma verisi + uygulama düzeltmeleri; kaynaklar arastirma/ klasöründe.
// 2026-11 düzeltmeleri mekanik ÇIKARIMDIR, EMG ölçümü değildir (INFERENCE).
// Pullover yönü: Marchetti & Uchida 2011, Journal of Applied Biomechanics 27:380-384
// (pektoralis > latissimus); sayısal paylar ve Lats varyantı yine çıkarımdır.
// WEIGHTS: hareket → kas → pay (1 = ana hedef). Bir set, kasa "pay" kadar etkili set sayılır.
// EVIDENCE: kas → büyütmede kanıtı en iyi olandan başlayarak eşit gruplar (aynı gruptakiler arasında fark gösterilmedi).
// INFERENCE: payı çalışmaya değil çıkarıma dayanan hareketler (kas başına).
import { t } from "./i18n.ts";
export type Level = "güçlü" | "orta" | "zayıf" | "yok";
export const WEIGHTS: Record<string, Record<string, number>> = {"Bench Press (Barbell)":{"Göğüs":1,"Ön Omuz":0.6,"Triceps":0.5,"Rotator Manşet":0.15},
  "Reverse-Grip Bench Press":{"Göğüs":1,"Ön Omuz":0.6,"Triceps":0.5,"Rotator Manşet":0.15},
  "Cable Chest Press":{"Göğüs":1,"Ön Omuz":0.6,"Triceps":0.5,"Rotator Manşet":0.15},
  "Dumbbell Bench Press":{"Göğüs":1,"Ön Omuz":0.6,"Triceps":0.4,"Rotator Manşet":0.15,"Biceps":0.1},
  "Squeeze Press (Dumbbell)":{"Göğüs":1,"Ön Omuz":0.6,"Triceps":0.4,"Rotator Manşet":0.15,"Biceps":0.1},
  "Incline Bench Press":{"Göğüs":1,"Ön Omuz":0.75,"Triceps":0.5},
  "Incline Dumbbell Press":{"Göğüs":1,"Ön Omuz":0.75,"Triceps":0.4},
  "Decline Bench Press":{"Göğüs":1,"Triceps":0.5,"Ön Omuz":0.35},
  "Decline Dumbbell Press":{"Göğüs":1,"Triceps":0.4,"Ön Omuz":0.35},
  "Smith Machine Bench Press":{"Göğüs":1,"Ön Omuz":0.6,"Triceps":0.5},
  "Smith Machine Incline Press":{"Göğüs":1,"Ön Omuz":0.75,"Triceps":0.5},
  "Machine Chest Press":{"Göğüs":1,"Ön Omuz":0.55,"Triceps":0.5},
  "Machine Incline Chest Press":{"Göğüs":1,"Ön Omuz":0.7,"Triceps":0.5},
  "Dumbbell Fly":{"Göğüs":1,"Ön Omuz":0.35,"Triceps":0.1},
  "Incline Dumbbell Fly":{"Göğüs":1,"Ön Omuz":0.45,"Biceps":0.15,"Triceps":0.1},
  "Pec Deck (Butterfly)":{"Göğüs":1,"Ön Omuz":0.35,"Triceps":0.05},
  "Cable Crossover":{"Göğüs":1,"Ön Omuz":0.35,"Triceps":0.1},
  "Low-to-High Cable Fly":{"Göğüs":1,"Ön Omuz":0.5,"Triceps":0.1},
  "High-to-Low Cable Fly":{"Göğüs":1,"Ön Omuz":0.2,"Triceps":0.1},
  "Chest Dip":{"Göğüs":1,"Triceps":0.6,"Ön Omuz":0.5},
  "Push-up":{"Göğüs":1,"Ön Omuz":0.6,"Triceps":0.5,"Karın":0.2,"Rotator Manşet":0.15},
  "Weighted Push-up":{"Göğüs":1,"Ön Omuz":0.6,"Triceps":0.5,"Karın":0.2,"Rotator Manşet":0.15},
  "Deficit Push-up":{"Göğüs":1,"Ön Omuz":0.6,"Triceps":0.5,"Karın":0.2,"Rotator Manşet":0.15},
  "Incline Push-up":{"Göğüs":1,"Ön Omuz":0.5,"Triceps":0.5,"Karın":0.2},
  "Decline Push-up":{"Göğüs":1,"Ön Omuz":0.7,"Triceps":0.5,"Karın":0.2},
  "Dumbbell Pullover":{"Göğüs":0.75,"Lat":0.7,"Triceps":0.3,"Ön Omuz":0.25,"Karın":0.15},
  "Landmine Press":{"Göğüs":0.8,"Ön Omuz":0.75,"Triceps":0.4,"Karın":0.3},
  "Svend Press":{"Göğüs":0.6,"Ön Omuz":0.4,"Triceps":0.2},
  "Floor Press":{"Göğüs":1,"Triceps":0.6,"Ön Omuz":0.5},
  "Pull-up":{"Lat":1,"Biceps":0.5,"Arka Omuz":0.4,"Trapez":0.3,"Önkol":0.25,"Göğüs":0.2,"Karın":0.2,"Rotator Manşet":0.15},
  "Neutral-Grip Pull-up":{"Lat":1,"Biceps":0.5,"Arka Omuz":0.4,"Trapez":0.3,"Önkol":0.25,"Göğüs":0.2,"Karın":0.2,"Rotator Manşet":0.15},
  "Chin-up":{"Lat":1,"Biceps":0.6,"Arka Omuz":0.35,"Göğüs":0.3,"Trapez":0.3,"Önkol":0.25,"Karın":0.2,"Rotator Manşet":0.15},
  "Weighted Pull-up":{"Lat":1,"Biceps":0.5,"Arka Omuz":0.4,"Rotator Manşet":0.35,"Trapez":0.3,"Önkol":0.25,"Göğüs":0.2,"Karın":0.2},
  "Assisted Pull-up Machine":{"Lat":1,"Biceps":0.5,"Trapez":0.4,"Arka Omuz":0.4,"Önkol":0.35,"Rotator Manşet":0.35,"Göğüs":0.2,"Karın":0.1},
  "Wide-Grip Lat Pulldown":{"Lat":1,"Biceps":0.5,"Arka Omuz":0.4,"Trapez":0.3,"Göğüs":0.2,"Triceps":0.2,"Önkol":0.2,"Rotator Manşet":0.2},
  "Reverse-Grip Lat Pulldown":{"Lat":1,"Biceps":0.5,"Arka Omuz":0.4,"Trapez":0.3,"Göğüs":0.2,"Triceps":0.2,"Önkol":0.2,"Rotator Manşet":0.2},
  "Close-Grip Lat Pulldown (V-Bar)":{"Lat":1,"Biceps":0.5,"Arka Omuz":0.4,"Trapez":0.3,"Göğüs":0.2,"Triceps":0.2,"Önkol":0.2,"Rotator Manşet":0.2},
  "Single-Arm Lat Pulldown":{"Lat":1,"Biceps":0.5,"Arka Omuz":0.35,"Trapez":0.3,"Önkol":0.3,"Göğüs":0.2,"Triceps":0.2,"Rotator Manşet":0.2,"Karın":0.1,"Oblik":0.1},
  "Seated Cable Row":{"Lat":0.8,"Trapez":0.7,"Arka Omuz":0.5,"Biceps":0.5,"Bel":0.2,"Yan Omuz":0.2,"Önkol":0.2,"Rotator Manşet":0.2},
  "Single-Arm Cable Row":{"Lat":0.8,"Trapez":0.7,"Arka Omuz":0.5,"Biceps":0.5,"Bel":0.2,"Yan Omuz":0.2,"Önkol":0.2,"Rotator Manşet":0.2},
  "Barbell Row":{"Lat":0.8,"Trapez":0.7,"Arka Omuz":0.5,"Biceps":0.5,"Bel":0.3,"Önkol":0.25,"Hamstring":0.2,"Kalça":0.2,"Rotator Manşet":0.2},
  "Reverse-Grip Barbell Row":{"Lat":0.8,"Trapez":0.7,"Arka Omuz":0.5,"Biceps":0.5,"Bel":0.3,"Önkol":0.25,"Hamstring":0.2,"Kalça":0.2,"Rotator Manşet":0.2},
  "Pendlay Row":{"Lat":0.8,"Trapez":0.7,"Arka Omuz":0.5,"Biceps":0.5,"Bel":0.3,"Önkol":0.25,"Hamstring":0.2,"Kalça":0.2,"Rotator Manşet":0.2},
  "Single-Arm Dumbbell Row":{"Lat":0.8,"Trapez":0.7,"Biceps":0.5,"Arka Omuz":0.4,"Önkol":0.25,"Rotator Manşet":0.2,"Bel":0.1,"Oblik":0.1},
  "T-Bar Row":{"Lat":0.8,"Trapez":0.7,"Arka Omuz":0.5,"Biceps":0.5,"Bel":0.3,"Önkol":0.25,"Hamstring":0.2,"Kalça":0.2,"Rotator Manşet":0.2},
  "Landmine Row":{"Lat":0.8,"Trapez":0.7,"Arka Omuz":0.5,"Biceps":0.5,"Bel":0.3,"Önkol":0.25,"Hamstring":0.2,"Kalça":0.2,"Rotator Manşet":0.2},
  "Chest-Supported Row":{"Lat":0.8,"Trapez":0.7,"Arka Omuz":0.5,"Biceps":0.5,"Önkol":0.3,"Rotator Manşet":0.2},
  "Seal Row":{"Lat":0.8,"Trapez":0.7,"Arka Omuz":0.5,"Biceps":0.5,"Önkol":0.3,"Rotator Manşet":0.2},
  "Machine Row":{"Lat":0.8,"Trapez":0.7,"Arka Omuz":0.5,"Biceps":0.5,"Önkol":0.3,"Rotator Manşet":0.2},
  "Meadows Row":{"Lat":0.8,"Trapez":0.6,"Arka Omuz":0.5,"Biceps":0.5,"Bel":0.3,"Önkol":0.3,"Rotator Manşet":0.2,"Oblik":0.1},
  "Inverted Row":{"Lat":0.8,"Trapez":0.7,"Arka Omuz":0.5,"Biceps":0.5,"Bel":0.2,"Önkol":0.2,"Kalça":0.2,"Karın":0.2},
  "Straight-Arm Pulldown":{"Lat":1,"Arka Omuz":0.3,"Göğüs":0.2,"Triceps":0.2,"Karın":0.2,"Biceps":0.1},
  "Machine Pullover":{"Lat":1,"Arka Omuz":0.3,"Göğüs":0.2,"Triceps":0.2,"Karın":0.2,"Biceps":0.1},
  "Dumbbell Pullover (Lats)":{"Lat":0.8,"Göğüs":0.6,"Triceps":0.3,"Ön Omuz":0.2,"Karın":0.15},
  "Deadlift":{"Bel":0.8,"Kalça":0.7,"Hamstring":0.5,"İç Bacak":0.45,"Trapez":0.4,"Quadriceps":0.4,"Lat":0.3,"Önkol":0.3,"Karın":0.2},
  "Deficit Deadlift":{"Bel":0.8,"Kalça":0.7,"Hamstring":0.5,"İç Bacak":0.45,"Trapez":0.4,"Quadriceps":0.4,"Lat":0.3,"Önkol":0.3,"Karın":0.2},
  "Rack Pull":{"Bel":0.7,"Kalça":0.5,"Trapez":0.4,"Önkol":0.3,"Hamstring":0.3,"Quadriceps":0.1},
  "Back Extension":{"Bel":1,"Kalça":0.6,"Hamstring":0.6},
  "Good Morning":{"Hamstring":0.8,"Bel":0.7,"Kalça":0.6,"İç Bacak":0.3},
  "Barbell Shrug":{"Trapez":1,"Önkol":0.3},
  "Dumbbell Shrug":{"Trapez":1,"Önkol":0.3},
  "Superman":{"Bel":0.4,"Kalça":0.3,"Hamstring":0.15,"Arka Omuz":0.1},
  "Overhead Press (Barbell)":{"Ön Omuz":1,"Yan Omuz":0.6,"Triceps":0.5,"Trapez":0.3,"Göğüs":0.2,"Arka Omuz":0.2,"Karın":0.2,"Rotator Manşet":0.2},
  "Pike Push-up":{"Ön Omuz":1,"Yan Omuz":0.6,"Triceps":0.5,"Trapez":0.3,"Göğüs":0.2,"Arka Omuz":0.2,"Karın":0.2,"Rotator Manşet":0.2},
  "Seated Dumbbell Shoulder Press":{"Ön Omuz":1,"Yan Omuz":0.6,"Triceps":0.4,"Trapez":0.3,"Göğüs":0.2,"Rotator Manşet":0.2,"Arka Omuz":0.15},
  "Standing Dumbbell Press":{"Ön Omuz":1,"Yan Omuz":0.6,"Triceps":0.4,"Trapez":0.3,"Göğüs":0.2,"Arka Omuz":0.2,"Karın":0.2,"Rotator Manşet":0.2},
  "Arnold Press":{"Ön Omuz":1,"Yan Omuz":0.6,"Triceps":0.4,"Trapez":0.3,"Göğüs":0.25,"Rotator Manşet":0.2},
  "Machine Shoulder Press":{"Ön Omuz":1,"Yan Omuz":0.5,"Triceps":0.5,"Trapez":0.3,"Göğüs":0.25,"Rotator Manşet":0.2},
  "Smith Machine Shoulder Press":{"Ön Omuz":1,"Yan Omuz":0.5,"Triceps":0.5,"Trapez":0.3,"Göğüs":0.25,"Rotator Manşet":0.2},
  "Push Press":{"Ön Omuz":0.8,"Yan Omuz":0.5,"Triceps":0.4,"Trapez":0.3,"Quadriceps":0.3,"Kalça":0.25,"Rotator Manşet":0.2,"Karın":0.15},
  "Landmine Shoulder Press":{"Ön Omuz":0.9,"Göğüs":0.4,"Triceps":0.4,"Trapez":0.3,"Yan Omuz":0.3,"Oblik":0.2,"Rotator Manşet":0.2,"Karın":0.15},
  "Lateral Raise (Dumbbell)":{"Yan Omuz":1,"Trapez":0.5,"Ön Omuz":0.3,"Rotator Manşet":0.3,"Arka Omuz":0.25},
  "Dumbbell Scaption":{"Yan Omuz":1,"Trapez":0.5,"Ön Omuz":0.3,"Rotator Manşet":0.3,"Arka Omuz":0.25},
  "Cable Lateral Raise":{"Yan Omuz":1,"Trapez":0.5,"Ön Omuz":0.3,"Rotator Manşet":0.3,"Arka Omuz":0.25},
  "Machine Lateral Raise":{"Yan Omuz":1,"Trapez":0.5,"Ön Omuz":0.3,"Rotator Manşet":0.3,"Arka Omuz":0.25},
  "Front Raise (Dumbbell)":{"Ön Omuz":1,"Göğüs":0.3,"Yan Omuz":0.3,"Trapez":0.25,"Karın":0.1},
  "Plate Front Raise":{"Ön Omuz":1,"Göğüs":0.3,"Yan Omuz":0.3,"Trapez":0.25,"Önkol":0.15},
  "Cable Front Raise":{"Ön Omuz":1,"Göğüs":0.3,"Yan Omuz":0.3,"Trapez":0.25},
  "Rear Delt Fly (Dumbbell)":{"Arka Omuz":1,"Trapez":0.5,"Yan Omuz":0.3,"Rotator Manşet":0.3},
  "Chest-Supported Rear Delt Raise":{"Arka Omuz":1,"Trapez":0.5,"Yan Omuz":0.3,"Rotator Manşet":0.3},
  "Reverse Pec Deck":{"Arka Omuz":1,"Trapez":0.5,"Yan Omuz":0.3,"Rotator Manşet":0.3},
  "Cable Rear Delt Fly":{"Arka Omuz":1,"Trapez":0.5,"Yan Omuz":0.3,"Rotator Manşet":0.3},
  "Band Pull-Apart":{"Arka Omuz":1,"Trapez":0.5,"Yan Omuz":0.3,"Rotator Manşet":0.3},
  "Face Pull":{"Arka Omuz":0.8,"Trapez":0.5,"Rotator Manşet":0.5,"Yan Omuz":0.3,"Biceps":0.2},
  "Cable External Rotation":{"Rotator Manşet":1,"Arka Omuz":0.15},
  "Cable Internal Rotation":{"Rotator Manşet":1,"Arka Omuz":0.15},
  "Side-Lying Dumbbell External Rotation":{"Rotator Manşet":1,"Arka Omuz":0.3},
  "Cuban Press":{"Rotator Manşet":0.7,"Yan Omuz":0.5,"Trapez":0.4,"Arka Omuz":0.3,"Ön Omuz":0.2},
  "Upright Row":{"Yan Omuz":0.8,"Trapez":0.7,"Ön Omuz":0.35,"Biceps":0.3,"Arka Omuz":0.2,"Önkol":0.2},
  "Y-Raise":{"Trapez":0.6,"Yan Omuz":0.5,"Arka Omuz":0.5,"Rotator Manşet":0.4,"Ön Omuz":0.35},
  "Handstand Push-up":{"Ön Omuz":1,"Triceps":0.6,"Yan Omuz":0.5,"Trapez":0.3,"Göğüs":0.2,"Karın":0.2},
  "Barbell Curl":{"Biceps":1,"Önkol":0.5},
  "EZ-Bar Curl":{"Biceps":1,"Önkol":0.5},
  "Dumbbell Curl":{"Biceps":1,"Önkol":0.5},
  "Alternating Dumbbell Curl":{"Biceps":1,"Önkol":0.5},
  "Hammer Curl":{"Biceps":0.8,"Önkol":0.6},
  "Cable Hammer Curl (Rope)":{"Biceps":0.8,"Önkol":0.6},
  "Incline Dumbbell Curl":{"Biceps":1,"Önkol":0.5},
  "Preacher Curl":{"Biceps":1,"Önkol":0.5},
  "Machine Preacher Curl":{"Biceps":1,"Önkol":0.5},
  "Concentration Curl":{"Biceps":1,"Önkol":0.5},
  "Cable Curl":{"Biceps":1,"Önkol":0.5},
  "High Cable Curl":{"Biceps":1,"Önkol":0.5},
  "Bayesian Cable Curl":{"Biceps":1,"Önkol":0.5},
  "Spider Curl":{"Biceps":1,"Önkol":0.5},
  "Drag Curl":{"Biceps":1,"Önkol":0.5},
  "Reverse Curl":{"Biceps":0.6,"Önkol":0.6},
  "Zottman Curl":{"Biceps":0.9,"Önkol":0.6},
  "21s":{"Biceps":1,"Önkol":0.5},
  "Triceps Pushdown (Rope)":{"Triceps":1},
  "Triceps Pushdown (Bar)":{"Triceps":1},
  "Reverse-Grip Triceps Pushdown":{"Triceps":1},
  "Single-Arm Cable Pushdown":{"Triceps":1},
  "Overhead Cable Extension":{"Triceps":1},
  "Overhead Dumbbell Extension":{"Triceps":1},
  "Skull Crusher (EZ-Bar)":{"Triceps":1},
  "Lying Cable Triceps Extension":{"Triceps":1},
  "Dumbbell Skull Crusher":{"Triceps":1},
  "Close-Grip Bench Press":{"Triceps":0.75,"Göğüs":0.65,"Ön Omuz":0.5},
  "Triceps Dip":{"Triceps":0.8,"Göğüs":0.5,"Ön Omuz":0.45},
  "Machine Seated Dip":{"Triceps":0.8,"Göğüs":0.5,"Ön Omuz":0.45},
  "Assisted Dip Machine":{"Triceps":0.8,"Göğüs":0.5,"Ön Omuz":0.45},
  "Bench Dips":{"Triceps":0.8,"Ön Omuz":0.35,"Göğüs":0.2},
  "Triceps Kickback":{"Triceps":1,"Arka Omuz":0.1},
  "Cable Kickback (Triceps)":{"Triceps":1},
  "JM Press":{"Triceps":0.85,"Göğüs":0.3,"Ön Omuz":0.25},
  "Machine Triceps Extension":{"Triceps":1},
  "Diamond Push-up":{"Triceps":0.7,"Göğüs":0.6,"Ön Omuz":0.5,"Karın":0.2},
  "Wrist Curl":{"Önkol":1},
  "Reverse Wrist Curl":{"Önkol":1},
  "Farmer's Walk":{"Önkol":0.75,"Oblik":0.5,"Trapez":0.4,"Karın":0.25,"Bel":0.2},
  "Suitcase Carry":{"Önkol":0.75,"Oblik":0.6,"Trapez":0.4,"Karın":0.25,"Bel":0.2},
  "Dead Hang":{"Önkol":0.75,"Lat":0.25,"Trapez":0.1},
  "Plate Pinch":{"Önkol":0.75,"Trapez":0.1},
  "Wrist Roller":{"Önkol":1,"Ön Omuz":0.1},
  "Back Squat":{"Quadriceps":1,"Kalça":1,"İç Bacak":0.6,"Bel":0.4,"Karın":0.2,"Hamstring":0.1},
  "Safety Bar Squat":{"Quadriceps":1,"Kalça":1,"İç Bacak":0.6,"Bel":0.4,"Karın":0.2,"Hamstring":0.1},
  "Front Squat":{"Quadriceps":1,"Kalça":0.8,"İç Bacak":0.55,"Bel":0.4,"Karın":0.2},
  "Overhead Squat":{"Quadriceps":1,"Kalça":0.8,"İç Bacak":0.55,"Bel":0.4,"Karın":0.2},
  "High-Bar Squat":{"Quadriceps":1,"Kalça":1,"İç Bacak":0.55,"Bel":0.4,"Karın":0.2,"Hamstring":0.1},
  "Low-Bar Squat":{"Quadriceps":1,"Kalça":1,"İç Bacak":0.55,"Bel":0.5,"Karın":0.2,"Hamstring":0.15},
  "Goblet Squat":{"Quadriceps":0.9,"Kalça":0.8,"İç Bacak":0.55,"Karın":0.2},
  "Dumbbell Sumo Squat":{"Quadriceps":0.9,"Kalça":0.8,"İç Bacak":0.55,"Karın":0.2},
  "Hack Squat":{"Quadriceps":1,"Kalça":0.7,"İç Bacak":0.55},
  "Pendulum Squat":{"Quadriceps":1,"Kalça":0.7,"İç Bacak":0.55},
  "Belt Squat":{"Quadriceps":1,"Kalça":0.8,"İç Bacak":0.55},
  "Smith Machine Squat":{"Quadriceps":1,"Kalça":0.8,"İç Bacak":0.55,"Bel":0.1,"Karın":0.1},
  "Leg Press":{"Quadriceps":1,"Kalça":0.8,"İç Bacak":0.6,"Hamstring":0.1},
  "Single-Leg Leg Press":{"Quadriceps":1,"Kalça":0.8,"İç Bacak":0.6,"Hamstring":0.1},
  "Bulgarian Split Squat":{"Quadriceps":1,"Kalça":0.9,"İç Bacak":0.4,"Hamstring":0.25,"Karın":0.1},
  "Split Squat":{"Quadriceps":1,"Kalça":0.9,"İç Bacak":0.4,"Hamstring":0.25,"Karın":0.1},
  "Walking Lunge":{"Quadriceps":0.9,"Kalça":0.9,"İç Bacak":0.4,"Hamstring":0.2},
  "Reverse Lunge":{"Quadriceps":0.9,"Kalça":0.9,"İç Bacak":0.4,"Hamstring":0.2},
  "Curtsy Lunge":{"Quadriceps":0.9,"Kalça":0.9,"İç Bacak":0.4,"Hamstring":0.2},
  "Forward Lunge":{"Quadriceps":0.9,"Kalça":0.9,"İç Bacak":0.4,"Hamstring":0.2},
  "Lateral Lunge":{"Quadriceps":0.8,"Kalça":0.7,"İç Bacak":0.6,"Hamstring":0.15},
  "Cossack Squat":{"Quadriceps":0.8,"Kalça":0.7,"İç Bacak":0.6,"Hamstring":0.15},
  "Step-up":{"Quadriceps":0.9,"Kalça":0.9,"İç Bacak":0.4,"Hamstring":0.2},
  "Leg Extension":{"Quadriceps":1},
  "Sissy Squat":{"Quadriceps":0.85},
  "Reverse Nordic":{"Quadriceps":0.85},
  "Pistol Squat":{"Quadriceps":0.9,"Kalça":0.8,"İç Bacak":0.4,"Hamstring":0.15},
  "Box Squat":{"Quadriceps":1,"Kalça":0.8,"Bel":0.4,"İç Bacak":0.4},
  "Zercher Squat":{"Quadriceps":1,"Kalça":0.8,"İç Bacak":0.55,"Bel":0.4,"Karın":0.3,"Biceps":0.2},
  "Wall Sit":{"Quadriceps":0.6,"Kalça":0.3,"İç Bacak":0.3},
  "Air Squat":{"Kalça":0.7,"Quadriceps":0.5,"İç Bacak":0.3},
  "Jump Squat":{"Kalça":0.7,"Quadriceps":0.5,"İç Bacak":0.3},
  "Romanian Deadlift":{"Hamstring":1,"Kalça":0.8,"Bel":0.6,"İç Bacak":0.3,"Trapez":0.25,"Önkol":0.25},
  "Dumbbell Romanian Deadlift":{"Hamstring":1,"Kalça":0.8,"Bel":0.5,"İç Bacak":0.3,"Önkol":0.25,"Trapez":0.2},
  "Single-Leg RDL":{"Hamstring":1,"Kalça":0.9,"Bel":0.4,"İç Bacak":0.3,"Önkol":0.25,"Oblik":0.2},
  "Stiff-Leg Deadlift":{"Hamstring":1,"Kalça":0.8,"Bel":0.6,"İç Bacak":0.3,"Önkol":0.25,"Trapez":0.2},
  "Sumo Deadlift":{"Bel":0.7,"Kalça":0.7,"Quadriceps":0.5,"İç Bacak":0.45,"Trapez":0.4,"Hamstring":0.4,"Önkol":0.3,"Karın":0.2},
  "Trap Bar Deadlift":{"Bel":0.7,"Kalça":0.7,"Quadriceps":0.5,"İç Bacak":0.45,"Trapez":0.4,"Hamstring":0.4,"Önkol":0.3,"Karın":0.2},
  "Lying Leg Curl":{"Hamstring":1,"Baldır":0.3},
  "Slider Leg Curl":{"Hamstring":1,"Baldır":0.3},
  "Seated Leg Curl":{"Hamstring":1,"Baldır":0.3},
  "Standing Leg Curl":{"Hamstring":1,"Baldır":0.3},
  "Nordic Curl":{"Hamstring":1,"Baldır":0.3,"Kalça":0.2},
  "Glute-Ham Raise":{"Hamstring":1,"Bel":0.3,"Kalça":0.3,"Baldır":0.3},
  "Hip Thrust (Barbell)":{"Kalça":1,"Bel":0.3,"Quadriceps":0.2,"Hamstring":0.2,"İç Bacak":0.2},
  "Machine Hip Thrust":{"Kalça":1,"Quadriceps":0.2,"Hamstring":0.2,"İç Bacak":0.2},
  "Glute Bridge":{"Kalça":0.9,"Hamstring":0.25,"Quadriceps":0.2,"İç Bacak":0.2},
  "Single-Leg Glute Bridge":{"Kalça":1,"Hamstring":0.35},
  "Cable Glute Kickback":{"Kalça":1,"Hamstring":0.3},
  "Machine Glute Kickback":{"Kalça":1,"Hamstring":0.3},
  "Cable Pull-through":{"Kalça":0.8,"Hamstring":0.5,"Bel":0.3,"İç Bacak":0.2},
  "Machine Hip Abduction":{"Kalça":0.5},
  "Banded Lateral Walk":{"Kalça":0.5},
  "Banded Clamshell":{"Kalça":0.5},
  "Cable Hip Abduction":{"Kalça":0.5},
  "Machine Hip Adduction":{"İç Bacak":1},
  "Kettlebell Swing":{"Kalça":0.6,"Bel":0.5,"Hamstring":0.5,"Önkol":0.25,"Quadriceps":0.2,"İç Bacak":0.2,"Ön Omuz":0.1},
  "Dumbbell Snatch":{"Kalça":0.6,"Bel":0.5,"Hamstring":0.5,"Önkol":0.25,"Quadriceps":0.2,"İç Bacak":0.2,"Ön Omuz":0.1},
  "Kettlebell Snatch":{"Kalça":0.6,"Bel":0.5,"Hamstring":0.5,"Önkol":0.25,"Quadriceps":0.2,"İç Bacak":0.2,"Ön Omuz":0.1},
  "Reverse Hyperextension":{"Kalça":0.9,"Hamstring":0.7,"Bel":0.6},
  "Frog Pump":{"Kalça":0.8,"İç Bacak":0.2,"Hamstring":0.1},
  "Standing Calf Raise":{"Baldır":1},
  "Seated Calf Raise":{"Baldır":0.5},
  "Leg Press Calf Raise":{"Baldır":1},
  "Smith Machine Calf Raise":{"Baldır":1},
  "Single-Leg Calf Raise":{"Baldır":1},
  "Donkey Calf Raise":{"Baldır":1},
  "Tibialis Raise":{},
  "Crunch":{"Karın":1,"Oblik":0.4},
  "Sit-up":{"Karın":1,"Oblik":0.4},
  "Decline Sit-up":{"Karın":1,"Oblik":0.4},
  "Cable Crunch":{"Karın":1,"Oblik":0.4},
  "Machine Crunch":{"Karın":1,"Oblik":0.4},
  "Bicycle Crunch":{"Karın":0.7,"Oblik":0.7},
  "Reverse Crunch":{"Karın":1,"Oblik":0.4},
  "Hanging Leg Raise":{"Karın":1,"Oblik":0.7,"Önkol":0.25,"Lat":0.2},
  "Toes-to-Bar":{"Karın":1,"Oblik":0.7,"Önkol":0.25,"Lat":0.2},
  "Hanging Knee Raise":{"Karın":1,"Oblik":0.6,"Önkol":0.25,"Lat":0.2},
  "Lying Leg Raise":{"Karın":0.8,"Oblik":0.3},
  "Captain's Chair Leg Raise":{"Karın":1,"Oblik":0.6,"Ön Omuz":0.1,"Triceps":0.1},
  "Plank":{"Karın":0.6,"Oblik":0.5,"Ön Omuz":0.2,"Göğüs":0.1},
  "Side Plank":{"Oblik":1,"Bel":0.4,"Kalça":0.3,"Karın":0.3},
  "Copenhagen Plank":{"Oblik":1,"İç Bacak":1,"Bel":0.4,"Kalça":0.3,"Karın":0.3},
  "Ab Wheel Rollout":{"Karın":1,"Oblik":0.6,"Lat":0.3,"Göğüs":0.2,"Triceps":0.2},
  "Russian Twist":{"Oblik":0.8,"Karın":0.4},
  "Landmine Twist":{"Oblik":0.8,"Karın":0.4},
  "Pallof Press":{"Oblik":0.8,"Karın":0.3,"Göğüs":0.15,"Ön Omuz":0.15},
  "Cable Woodchopper":{"Oblik":1,"Karın":0.4,"Bel":0.3,"Lat":0.2,"Ön Omuz":0.2},
  "Dragon Flag":{"Karın":1,"Oblik":0.5,"Lat":0.3},
  "Dead Bug":{"Karın":0.4,"Oblik":0.4},
  "Bird Dog":{"Kalça":0.4,"Bel":0.2,"Karın":0.1},
  "Mountain Climber":{"Karın":0.5,"Oblik":0.3,"Ön Omuz":0.2},
  "Bear Crawl":{"Karın":0.5,"Oblik":0.3,"Ön Omuz":0.2},
  "V-Up":{"Karın":1,"Oblik":0.5},
  "Hollow Body Hold":{"Karın":0.8,"Oblik":0.4},
  "L-Sit":{"Karın":0.7,"Triceps":0.3,"Quadriceps":0.2,"Önkol":0.1},
  "Side Bend (Dumbbell)":{"Oblik":1,"Bel":0.4,"Önkol":0.2,"Karın":0.2},
  "Cable Side Bend":{"Oblik":1,"Bel":0.4,"Önkol":0.2,"Karın":0.2},
  "Power Clean":{"Trapez":0.5,"Kalça":0.5,"Bel":0.4,"Quadriceps":0.4,"Önkol":0.25,"Hamstring":0.25,"Ön Omuz":0.15},
  "Hang Clean":{"Trapez":0.5,"Kalça":0.5,"Bel":0.4,"Quadriceps":0.3,"Önkol":0.25,"Hamstring":0.25,"Ön Omuz":0.15},
  "Clean and Jerk":{"Quadriceps":0.6,"Trapez":0.5,"Kalça":0.5,"Ön Omuz":0.45,"Bel":0.4,"Yan Omuz":0.3,"Triceps":0.3,"Hamstring":0.25},
  "Snatch":{"Quadriceps":0.6,"Trapez":0.5,"Kalça":0.5,"Bel":0.4,"Ön Omuz":0.35,"Yan Omuz":0.3,"Hamstring":0.25},
  "Power Snatch":{"Trapez":0.5,"Kalça":0.5,"Bel":0.4,"Quadriceps":0.4,"Ön Omuz":0.35,"Yan Omuz":0.3,"Hamstring":0.25},
  "Thruster":{"Quadriceps":0.8,"Ön Omuz":0.6,"Kalça":0.5,"Yan Omuz":0.3,"Triceps":0.3,"Trapez":0.2},
  "Clean & Press":{"Ön Omuz":0.6,"Trapez":0.5,"Triceps":0.4,"Quadriceps":0.4,"Kalça":0.4,"Yan Omuz":0.3,"Hamstring":0.2},
  "Burpee":{"Quadriceps":0.4,"Göğüs":0.25,"Triceps":0.25,"Karın":0.25,"Ön Omuz":0.2,"Kalça":0.2,"Baldır":0.2,"Hamstring":0.15},
  "Turkish Get-up":{"Karın":0.6,"Oblik":0.5,"Ön Omuz":0.5,"Rotator Manşet":0.4,"Yan Omuz":0.35,"Kalça":0.3,"Quadriceps":0.25,"Hamstring":0.2,"Önkol":0.2},
  "Kettlebell Goblet Clean":{"Kalça":0.4,"Trapez":0.3,"Quadriceps":0.3,"Hamstring":0.2,"Ön Omuz":0.15},
  "Sled Push":{"Quadriceps":0.7,"Kalça":0.5,"Baldır":0.35,"Hamstring":0.25,"Karın":0.2,"Ön Omuz":0.15},
  "Sled Pull":{"Trapez":0.3,"Önkol":0.25,"Bel":0.2},
  "Battle Rope":{"Ön Omuz":0.4,"Karın":0.35,"Yan Omuz":0.3,"Oblik":0.3,"Lat":0.25,"Quadriceps":0.2,"Kalça":0.2,"Önkol":0.2},
  "Medicine Ball Slam":{"Lat":0.5,"Karın":0.5,"Oblik":0.3,"Triceps":0.25,"Ön Omuz":0.25,"Kalça":0.25,"Yan Omuz":0.2,"Göğüs":0.2,"Quadriceps":0.2},
  "Box Jump":{"Quadriceps":0.3,"Baldır":0.2},
  "Wall Ball":{"Quadriceps":0.6,"Kalça":0.4,"Ön Omuz":0.35,"Triceps":0.2},
  "Muscle-up":{"Lat":0.8,"Triceps":0.5,"Göğüs":0.45,"Biceps":0.4,"Arka Omuz":0.35,"Trapez":0.3,"Ön Omuz":0.3,"Önkol":0.25,"Karın":0.2},
  "Man Maker":{"Ön Omuz":0.4,"Yan Omuz":0.3,"Triceps":0.3,"Trapez":0.2}};
export const EVIDENCE: Record<string, { level: Level; ex: string[]; note: string }[]> = {
 "Göğüs": [
  {
   "level": "güçlü",
   "ex": [
    "Bench Press (Barbell)"
   ],
   "note": t("muscles.ev_gogus_1")
  },
  {
   "level": "orta",
   "ex": [
    "Pec Deck (Butterfly)"
   ],
   "note": t("muscles.ev_gogus_2")
  },
  {
   "level": "orta",
   "ex": [
    "Dumbbell Bench Press",
    "Smith Machine Bench Press",
    "Machine Chest Press",
    "Push-up",
    "Floor Press"
   ],
   "note": t("muscles.ev_gogus_3")
  },
  {
   "level": "orta",
   "ex": [
    "Incline Bench Press",
    "Incline Dumbbell Press",
    "Smith Machine Incline Press",
    "Machine Incline Chest Press"
   ],
   "note": t("muscles.ev_gogus_4")
  },
  {
   "level": "zayıf",
   "ex": [
    "Decline Bench Press",
    "Dumbbell Fly",
    "Incline Dumbbell Fly",
    "Cable Crossover",
    "Chest Dip",
    "Dumbbell Pullover",
    "Cable Chest Press",
    "Reverse-Grip Bench Press"
   ],
   "note": t("muscles.ev_gogus_5")
  },
  {
   "level": "yok",
   "ex": [
    "Decline Dumbbell Press",
    "Low-to-High Cable Fly",
    "High-to-Low Cable Fly",
    "Incline Push-up",
    "Decline Push-up",
    "Landmine Press",
    "Svend Press",
    "Deficit Push-up",
    "Weighted Push-up",
    "Squeeze Press (Dumbbell)"
   ],
   "note": t("muscles.ev_gogus_6")
  }
 ],
 "Lat": [
  {
   "level": "zayıf",
   "ex": [
    "Pull-up",
    "Chin-up",
    "Weighted Pull-up",
    "Assisted Pull-up Machine",
    "Wide-Grip Lat Pulldown",
    "Close-Grip Lat Pulldown (V-Bar)",
    "Single-Arm Lat Pulldown",
    "Seated Cable Row",
    "Barbell Row",
    "Pendlay Row",
    "T-Bar Row",
    "Single-Arm Dumbbell Row",
    "Meadows Row",
    "Chest-Supported Row",
    "Seal Row",
    "Machine Row",
    "Inverted Row",
    "Reverse-Grip Lat Pulldown",
    "Neutral-Grip Pull-up"
   ],
   "note": t("muscles.ev_lat_1")
  },
  {
   "level": "zayıf",
   "ex": [
    "Straight-Arm Pulldown"
   ],
   "note": t("muscles.ev_lat_2")
  },
  {
   "level": "zayıf",
   "ex": [
    "Dumbbell Pullover (Lats)",
    "Dumbbell Pullover"
   ],
   "note": t("muscles.ev_lat_3")
  },
  {
   "level": "yok",
   "ex": [
    "Muscle-up",
    "Single-Arm Cable Row",
    "Landmine Row",
    "Reverse-Grip Barbell Row",
    "Machine Pullover"
   ],
   "note": t("muscles.ev_lat_4")
  }
 ],
 "Trapez": [
  {
   "level": "orta",
   "ex": [
    "Barbell Shrug",
    "Dumbbell Shrug",
    "Upright Row"
   ],
   "note": t("muscles.ev_trapez_1")
  },
  {
   "level": "zayıf",
   "ex": [
    "Single-Arm Dumbbell Row",
    "Seated Cable Row",
    "Barbell Row",
    "Chest-Supported Row",
    "Seal Row",
    "Lateral Raise (Dumbbell)",
    "Rear Delt Fly (Dumbbell)"
   ],
   "note": t("muscles.ev_trapez_2")
  },
  {
   "level": "zayıf",
   "ex": [
    "Y-Raise",
    "Power Clean",
    "Hang Clean",
    "Snatch",
    "Power Snatch"
   ],
   "note": t("muscles.ev_trapez_3")
  },
  {
   "level": "yok",
   "ex": [
    "Pendlay Row",
    "T-Bar Row",
    "Machine Row",
    "Meadows Row",
    "Inverted Row",
    "Cable Lateral Raise",
    "Machine Lateral Raise",
    "Reverse Pec Deck",
    "Cable Rear Delt Fly",
    "Face Pull",
    "Clean and Jerk",
    "Clean & Press"
   ],
   "note": t("muscles.ev_trapez_4")
  }
 ],
 "Bel": [
  {
   "level": "zayıf",
   "ex": [
    "Deadlift",
    "Back Extension",
    "Reverse Hyperextension",
    "Good Morning",
    "Trap Bar Deadlift",
    "Sumo Deadlift",
    "Rack Pull",
    "Deficit Deadlift"
   ],
   "note": t("muscles.ev_bel_1")
  },
  {
   "level": "zayıf",
   "ex": [
    "Romanian Deadlift",
    "Stiff-Leg Deadlift",
    "Dumbbell Romanian Deadlift",
    "Kettlebell Swing",
    "Low-Bar Squat"
   ],
   "note": t("muscles.ev_bel_2")
  }
 ],
 "Ön Omuz": [
  {
   "level": "orta",
   "ex": [
    "Bench Press (Barbell)"
   ],
   "note": t("muscles.ev_on_omuz_1")
  },
  {
   "level": "zayıf",
   "ex": [
    "Overhead Press (Barbell)",
    "Seated Dumbbell Shoulder Press",
    "Standing Dumbbell Press",
    "Machine Shoulder Press",
    "Smith Machine Shoulder Press"
   ],
   "note": t("muscles.ev_on_omuz_2")
  },
  {
   "level": "zayıf",
   "ex": [
    "Front Raise (Dumbbell)"
   ],
   "note": t("muscles.ev_on_omuz_3")
  },
  {
   "level": "zayıf",
   "ex": [
    "Dumbbell Bench Press",
    "Smith Machine Bench Press",
    "Machine Chest Press",
    "Incline Bench Press",
    "Incline Dumbbell Press"
   ],
   "note": t("muscles.ev_on_omuz_4")
  },
  {
   "level": "yok",
   "ex": [
    "Arnold Press",
    "Push Press",
    "Landmine Shoulder Press",
    "Plate Front Raise",
    "Cable Front Raise",
    "Handstand Push-up",
    "Landmine Press",
    "Smith Machine Incline Press",
    "Decline Push-up",
    "Machine Incline Chest Press",
    "Push-up",
    "Thruster",
    "Clean & Press",
    "Chest Dip",
    "Floor Press",
    "Close-Grip Bench Press",
    "Diamond Push-up",
    "Low-to-High Cable Fly",
    "Incline Push-up",
    "Pike Push-up"
   ],
   "note": t("muscles.ev_on_omuz_5")
  }
 ],
 "Yan Omuz": [
  {
   "level": "orta",
   "ex": [
    "Lateral Raise (Dumbbell)",
    "Cable Lateral Raise",
    "Machine Lateral Raise"
   ],
   "note": t("muscles.ev_yan_omuz_1")
  },
  {
   "level": "zayıf",
   "ex": [
    "Upright Row",
    "Overhead Press (Barbell)",
    "Seated Dumbbell Shoulder Press",
    "Standing Dumbbell Press",
    "Machine Shoulder Press",
    "Dumbbell Scaption"
   ],
   "note": t("muscles.ev_yan_omuz_2")
  },
  {
   "level": "yok",
   "ex": [
    "Arnold Press",
    "Smith Machine Shoulder Press",
    "Push Press",
    "Handstand Push-up",
    "Y-Raise",
    "Cuban Press"
   ],
   "note": t("muscles.ev_yan_omuz_3")
  }
 ],
 "Arka Omuz": [
  {
   "level": "zayıf",
   "ex": [
    "Reverse Pec Deck",
    "Rear Delt Fly (Dumbbell)",
    "Cable Rear Delt Fly",
    "Band Pull-Apart"
   ],
   "note": t("muscles.ev_arka_omuz_1")
  },
  {
   "level": "zayıf",
   "ex": [
    "Face Pull"
   ],
   "note": t("muscles.ev_arka_omuz_2")
  },
  {
   "level": "zayıf",
   "ex": [
    "Chest-Supported Row",
    "Seal Row",
    "Seated Cable Row",
    "Machine Row",
    "Barbell Row",
    "Pendlay Row",
    "T-Bar Row",
    "Inverted Row",
    "Meadows Row",
    "Y-Raise"
   ],
   "note": t("muscles.ev_arka_omuz_3")
  }
 ],
 "Biceps": [
  {
   "level": "orta",
   "ex": [
    "Incline Dumbbell Curl",
    "Preacher Curl",
    "Bayesian Cable Curl",
    "Dumbbell Curl",
    "Barbell Curl",
    "Alternating Dumbbell Curl",
    "Cable Curl",
    "Machine Preacher Curl",
    "21s"
   ],
   "note": t("muscles.ev_biceps_1")
  },
  {
   "level": "orta",
   "ex": [
    "Pull-up",
    "Weighted Pull-up",
    "Assisted Pull-up Machine",
    "Wide-Grip Lat Pulldown",
    "Close-Grip Lat Pulldown (V-Bar)",
    "Seated Cable Row",
    "Barbell Row",
    "Pendlay Row",
    "Single-Arm Dumbbell Row",
    "T-Bar Row",
    "Chest-Supported Row",
    "Seal Row",
    "Machine Row",
    "Meadows Row",
    "Inverted Row",
    "Single-Arm Lat Pulldown"
   ],
   "note": t("muscles.ev_biceps_2")
  },
  {
   "level": "zayıf",
   "ex": [
    "EZ-Bar Curl",
    "Chin-up",
    "Reverse Curl"
   ],
   "note": t("muscles.ev_biceps_3")
  },
  {
   "level": "yok",
   "ex": [
    "Zottman Curl",
    "Hammer Curl",
    "Cable Hammer Curl (Rope)",
    "Concentration Curl",
    "Spider Curl",
    "Drag Curl",
    "High Cable Curl"
   ],
   "note": t("muscles.ev_biceps_4")
  }
 ],
 "Triceps": [
  {
   "level": "orta",
   "ex": [
    "Overhead Cable Extension",
    "Overhead Dumbbell Extension"
   ],
   "note": t("muscles.ev_triceps_1")
  },
  {
   "level": "orta",
   "ex": [
    "Triceps Pushdown (Rope)",
    "Triceps Pushdown (Bar)"
   ],
   "note": t("muscles.ev_triceps_2")
  },
  {
   "level": "orta",
   "ex": [
    "Skull Crusher (EZ-Bar)",
    "Single-Arm Cable Pushdown",
    "Bench Press (Barbell)",
    "Push-up"
   ],
   "note": t("muscles.ev_triceps_3")
  },
  {
   "level": "zayıf",
   "ex": [
    "Machine Triceps Extension",
    "Close-Grip Bench Press",
    "Triceps Dip",
    "Bench Dips",
    "Diamond Push-up",
    "Dumbbell Skull Crusher"
   ],
   "note": t("muscles.ev_triceps_4")
  },
  {
   "level": "yok",
   "ex": [
    "JM Press",
    "Reverse-Grip Triceps Pushdown",
    "Lying Cable Triceps Extension",
    "Assisted Dip Machine",
    "Machine Seated Dip"
   ],
   "note": t("muscles.ev_triceps_5")
  }
 ],
 "Önkol": [
  {
   "level": "orta",
   "ex": [
    "Wrist Curl"
   ],
   "note": t("muscles.ev_onkol_1")
  },
  {
   "level": "orta",
   "ex": [
    "Incline Dumbbell Curl",
    "Preacher Curl"
   ],
   "note": t("muscles.ev_onkol_2")
  },
  {
   "level": "zayıf",
   "ex": [
    "Barbell Curl",
    "EZ-Bar Curl",
    "Dumbbell Curl",
    "Alternating Dumbbell Curl",
    "Machine Preacher Curl",
    "Concentration Curl",
    "Cable Curl",
    "Bayesian Cable Curl",
    "Spider Curl",
    "Drag Curl",
    "21s",
    "Hammer Curl",
    "Cable Hammer Curl (Rope)",
    "Reverse Curl",
    "Zottman Curl",
    "Farmer's Walk",
    "Suitcase Carry"
   ],
   "note": t("muscles.ev_onkol_3")
  },
  {
   "level": "yok",
   "ex": [
    "Reverse Wrist Curl",
    "Wrist Roller",
    "Dead Hang",
    "Plate Pinch"
   ],
   "note": t("muscles.ev_onkol_4")
  }
 ],
 "Quadriceps": [
  {
   "level": "güçlü",
   "ex": [
    "Leg Press",
    "Single-Leg Leg Press",
    "Leg Extension",
    "Back Squat",
    "High-Bar Squat"
   ],
   "note": t("muscles.ev_quadriceps_1")
  },
  {
   "level": "orta",
   "ex": [
    "Smith Machine Squat",
    "Front Squat",
    "Low-Bar Squat"
   ],
   "note": t("muscles.ev_quadriceps_2")
  },
  {
   "level": "zayıf",
   "ex": [
    "Bulgarian Split Squat",
    "Hack Squat",
    "Walking Lunge",
    "Forward Lunge",
    "Step-up",
    "Pistol Squat",
    "Dumbbell Sumo Squat",
    "Overhead Squat",
    "Safety Bar Squat"
   ],
   "note": t("muscles.ev_quadriceps_3")
  },
  {
   "level": "yok",
   "ex": [
    "Box Squat",
    "Goblet Squat",
    "Zercher Squat",
    "Pendulum Squat",
    "Belt Squat",
    "Reverse Lunge",
    "Sissy Squat",
    "Lateral Lunge",
    "Split Squat",
    "Curtsy Lunge",
    "Reverse Nordic",
    "Cossack Squat"
   ],
   "note": t("muscles.ev_quadriceps_4")
  }
 ],
 "Hamstring": [
  {
   "level": "güçlü",
   "ex": [
    "Nordic Curl"
   ],
   "note": t("muscles.ev_hamstring_1")
  },
  {
   "level": "orta",
   "ex": [
    "Seated Leg Curl"
   ],
   "note": t("muscles.ev_hamstring_2")
  },
  {
   "level": "orta",
   "ex": [
    "Lying Leg Curl",
    "Standing Leg Curl",
    "Romanian Deadlift",
    "Dumbbell Romanian Deadlift",
    "Single-Leg RDL",
    "Stiff-Leg Deadlift",
    "Back Extension"
   ],
   "note": t("muscles.ev_hamstring_3")
  },
  {
   "level": "zayıf",
   "ex": [
    "Glute-Ham Raise",
    "Good Morning",
    "Deadlift",
    "Kettlebell Swing",
    "Slider Leg Curl"
   ],
   "note": t("muscles.ev_hamstring_4")
  },
  {
   "level": "yok",
   "ex": [
    "Reverse Hyperextension",
    "Cable Pull-through"
   ],
   "note": t("muscles.ev_hamstring_5")
  }
 ],
 "Kalça": [
  {
   "level": "orta",
   "ex": [
    "Back Squat",
    "Hip Thrust (Barbell)"
   ],
   "note": t("muscles.ev_kalca_1")
  },
  {
   "level": "orta",
   "ex": [
    "High-Bar Squat",
    "Low-Bar Squat",
    "Machine Hip Thrust",
    "Cable Glute Kickback",
    "Leg Press",
    "Single-Leg Leg Press"
   ],
   "note": t("muscles.ev_kalca_2")
  },
  {
   "level": "orta",
   "ex": [
    "Machine Hip Abduction"
   ],
   "note": t("muscles.ev_kalca_3")
  },
  {
   "level": "zayıf",
   "ex": [
    "Glute Bridge",
    "Single-Leg Glute Bridge",
    "Bulgarian Split Squat",
    "Walking Lunge",
    "Reverse Lunge",
    "Forward Lunge",
    "Step-up",
    "Single-Leg RDL",
    "Romanian Deadlift",
    "Dumbbell Romanian Deadlift",
    "Stiff-Leg Deadlift",
    "Front Squat",
    "Goblet Squat",
    "Belt Squat",
    "Smith Machine Squat",
    "Box Squat",
    "Zercher Squat",
    "Pistol Squat",
    "Frog Pump",
    "Cable Pull-through",
    "Hack Squat",
    "Pendulum Squat",
    "Air Squat",
    "Lateral Lunge",
    "Deadlift",
    "Trap Bar Deadlift",
    "Sumo Deadlift",
    "Back Extension",
    "Reverse Hyperextension",
    "Good Morning",
    "Kettlebell Swing",
    "Rack Pull",
    "Power Clean",
    "Hang Clean",
    "Clean and Jerk",
    "Snatch",
    "Power Snatch",
    "Thruster",
    "Safety Bar Squat",
    "Cable Hip Abduction",
    "Banded Clamshell",
    "Banded Lateral Walk",
    "Kettlebell Snatch"
   ],
   "note": t("muscles.ev_kalca_4")
  }
 ],
 "İç Bacak": [
  {
   "level": "orta",
   "ex": [
    "Back Squat",
    "Leg Press"
   ],
   "note": t("muscles.ev_ic_bacak_1")
  },
  {
   "level": "zayıf",
   "ex": [
    "Lateral Lunge",
    "Single-Leg Leg Press",
    "High-Bar Squat",
    "Low-Bar Squat",
    "Front Squat",
    "Goblet Squat",
    "Zercher Squat",
    "Smith Machine Squat",
    "Hack Squat",
    "Pendulum Squat",
    "Belt Squat",
    "Machine Hip Adduction",
    "Copenhagen Plank"
   ],
   "note": t("muscles.ev_ic_bacak_2")
  }
 ],
 "Baldır": [
  {
   "level": "orta",
   "ex": [
    "Standing Calf Raise",
    "Leg Press Calf Raise",
    "Smith Machine Calf Raise",
    "Single-Leg Calf Raise"
   ],
   "note": t("muscles.ev_baldir_1")
  },
  {
   "level": "orta",
   "ex": [
    "Seated Calf Raise"
   ],
   "note": t("muscles.ev_baldir_2")
  },
  {
   "level": "zayıf",
   "ex": [
    "Donkey Calf Raise"
   ],
   "note": t("muscles.ev_baldir_3")
  }
 ],
 "Karın": [
  {
   "level": "orta",
   "ex": [
    "Crunch"
   ],
   "note": t("muscles.ev_karin_1")
  },
  {
   "level": "zayıf",
   "ex": [
    "Sit-up",
    "Cable Crunch",
    "Machine Crunch",
    "Reverse Crunch",
    "Hanging Leg Raise",
    "Hanging Knee Raise",
    "Ab Wheel Rollout",
    "Toes-to-Bar"
   ],
   "note": t("muscles.ev_karin_2")
  },
  {
   "level": "zayıf",
   "ex": [
    "Lying Leg Raise",
    "Plank"
   ],
   "note": t("muscles.ev_karin_3")
  },
  {
   "level": "yok",
   "ex": [
    "Decline Sit-up",
    "Captain's Chair Leg Raise",
    "Dragon Flag",
    "V-Up",
    "Bicycle Crunch",
    "Hollow Body Hold",
    "L-Sit",
    "Mountain Climber",
    "Bear Crawl"
   ],
   "note": t("muscles.ev_karin_4")
  }
 ],
 "Oblik": [
  {
   "level": "zayıf",
   "ex": [
    "Side Plank",
    "Side Bend (Dumbbell)",
    "Cable Woodchopper",
    "Hanging Leg Raise",
    "Hanging Knee Raise",
    "Ab Wheel Rollout",
    "Plank",
    "Farmer's Walk",
    "Copenhagen Plank",
    "Cable Side Bend",
    "Landmine Twist",
    "Suitcase Carry"
   ],
   "note": t("muscles.ev_oblik_1")
  },
  {
   "level": "yok",
   "ex": [
    "Pallof Press",
    "Russian Twist",
    "Bicycle Crunch",
    "Captain's Chair Leg Raise"
   ],
   "note": t("muscles.ev_oblik_2")
  }
 ],
 "Rotator Manşet": [
  {
   "level": "zayıf",
   "ex": [
    "Side-Lying Dumbbell External Rotation",
    "Cable External Rotation"
   ],
   "note": t("muscles.ev_rotator_1")
  },
  {
   "level": "yok",
   "ex": [
    "Cuban Press",
    "Face Pull",
    "Cable Internal Rotation"
   ],
   "note": t("muscles.ev_rotator_2")
  }
 ]
};
export const SUMMARY: Record<string, string> = {
 "Göğüs": t("muscles.summary_gogus"),
 "Lat": t("muscles.summary_lat"),
 "Trapez": t("muscles.summary_trapez"),
 "Bel": t("muscles.summary_bel"),
 "Ön Omuz": t("muscles.summary_on_omuz"),
 "Yan Omuz": t("muscles.summary_yan_omuz"),
 "Arka Omuz": t("muscles.summary_arka_omuz"),
 "Biceps": t("muscles.summary_biceps"),
 "Triceps": t("muscles.summary_triceps"),
 "Önkol": t("muscles.summary_onkol"),
 "Quadriceps": t("muscles.summary_quadriceps"),
 "Hamstring": t("muscles.summary_hamstring"),
 "Kalça": t("muscles.summary_kalca"),
 "İç Bacak": t("muscles.summary_ic_bacak"),
 "Baldır": t("muscles.summary_baldir"),
 "Karın": t("muscles.summary_karin"),
 "Oblik": t("muscles.summary_oblik"),
 "Rotator Manşet": t("muscles.summary_rotator")
};
export const INFERENCE: Record<string, string[]> = {"Göğüs":["Decline Dumbbell Press","Smith Machine Incline Press","Incline Dumbbell Press","Machine Incline Chest Press","Low-to-High Cable Fly","High-to-Low Cable Fly","Chest Dip","Incline Push-up","Decline Push-up","Dumbbell Pullover","Landmine Press","Svend Press","Floor Press","Cable Chest Press","Reverse-Grip Bench Press","Deficit Push-up","Weighted Push-up","Squeeze Press (Dumbbell)","Medicine Ball Slam","Burpee","Dumbbell Pullover (Lats)"],"Lat":["Weighted Pull-up","Assisted Pull-up Machine","Pendlay Row","T-Bar Row","Meadows Row","Seal Row","Machine Row","Muscle-up","Single-Arm Lat Pulldown","Barbell Row","Single-Arm Dumbbell Row","Seated Cable Row","Chest-Supported Row","Inverted Row","Reverse-Grip Lat Pulldown","Neutral-Grip Pull-up","Single-Arm Cable Row","Landmine Row","Reverse-Grip Barbell Row","Machine Pullover","Battle Rope","Medicine Ball Slam","Dumbbell Pullover","Dumbbell Pullover (Lats)"],"Trapez":["Pendlay Row","T-Bar Row","Machine Row","Inverted Row","Meadows Row","Cable Lateral Raise","Machine Lateral Raise","Reverse Pec Deck","Cable Rear Delt Fly","Face Pull","Clean and Jerk","Clean & Press","Rack Pull","Trap Bar Deadlift","Farmer's Walk","Cuban Press","Kettlebell Goblet Clean","Overhead Press (Barbell)","Seated Dumbbell Shoulder Press","Standing Dumbbell Press","Arnold Press","Machine Shoulder Press","Smith Machine Shoulder Press","Push Press","Landmine Shoulder Press","Handstand Push-up","Sled Pull","Thruster","Man Maker","Plate Pinch","Dead Hang","Landmine Row","Band Pull-Apart","Pike Push-up","Suitcase Carry"],"Bel":["Deadlift","Back Extension","Reverse Hyperextension","Rack Pull","Good Morning","Sumo Deadlift","Trap Bar Deadlift","Romanian Deadlift","Stiff-Leg Deadlift","Dumbbell Romanian Deadlift","Kettlebell Swing","Single-Leg RDL","Superman","Back Squat","High-Bar Squat","Low-Bar Squat","Box Squat","Front Squat","Zercher Squat","Power Clean","Hang Clean","Snatch","Power Snatch","Clean and Jerk","Hip Thrust (Barbell)","Cable Pull-through","Glute-Ham Raise","Barbell Row","Pendlay Row","T-Bar Row","Meadows Row","Bird Dog","Farmer's Walk","Sled Pull","Landmine Row","Reverse-Grip Barbell Row","Deficit Deadlift","Overhead Squat","Safety Bar Squat","Suitcase Carry","Kettlebell Snatch","Dumbbell Snatch"],"Ön Omuz":["Arnold Press","Push Press","Landmine Shoulder Press","Plate Front Raise","Cable Front Raise","Handstand Push-up","Smith Machine Incline Press","Machine Incline Chest Press","Incline Dumbbell Fly","Cable Crossover","Low-to-High Cable Fly","High-to-Low Cable Fly","Chest Dip","Push-up","Incline Push-up","Decline Push-up","Landmine Press","Svend Press","Floor Press","Close-Grip Bench Press","Triceps Dip","Bench Dips","JM Press","Diamond Push-up","Power Clean","Hang Clean","Clean and Jerk","Snatch","Power Snatch","Thruster","Clean & Press","Kettlebell Goblet Clean","Wall Ball","Cable Lateral Raise","Machine Lateral Raise","Y-Raise","Cuban Press","Man Maker","Burpee","Muscle-up","Deficit Push-up","Weighted Push-up","Pike Push-up","Assisted Dip Machine","Machine Seated Dip","Turkish Get-up","Battle Rope","Medicine Ball Slam","Sled Push","Wrist Roller","Dumbbell Pullover","Dumbbell Pullover (Lats)"],"Yan Omuz":["Upright Row","Overhead Press (Barbell)","Seated Dumbbell Shoulder Press","Standing Dumbbell Press","Arnold Press","Machine Shoulder Press","Smith Machine Shoulder Press","Push Press","Handstand Push-up","Y-Raise","Cuban Press","Landmine Shoulder Press","Reverse Pec Deck","Rear Delt Fly (Dumbbell)","Cable Rear Delt Fly","Face Pull","Front Raise (Dumbbell)","Plate Front Raise","Cable Front Raise","Clean & Press","Thruster","Man Maker","Clean and Jerk","Snatch","Power Snatch","Seated Cable Row","Single-Arm Cable Row","Band Pull-Apart","Pike Push-up","Chest-Supported Rear Delt Raise","Dumbbell Scaption","Turkish Get-up","Battle Rope","Medicine Ball Slam"],"Arka Omuz":["Reverse Pec Deck","Rear Delt Fly (Dumbbell)","Cable Rear Delt Fly","Face Pull","Chest-Supported Row","Seal Row","Seated Cable Row","Machine Row","Barbell Row","Pendlay Row","T-Bar Row","Inverted Row","Meadows Row","Y-Raise","Single-Arm Dumbbell Row","Pull-up","Weighted Pull-up","Assisted Pull-up Machine","Wide-Grip Lat Pulldown","Close-Grip Lat Pulldown (V-Bar)","Chin-up","Single-Arm Lat Pulldown","Muscle-up","Straight-Arm Pulldown","Side-Lying Dumbbell External Rotation","Cuban Press","Lateral Raise (Dumbbell)","Cable Lateral Raise","Machine Lateral Raise","Upright Row","Cable External Rotation","Reverse-Grip Lat Pulldown","Neutral-Grip Pull-up","Single-Arm Cable Row","Landmine Row","Reverse-Grip Barbell Row","Machine Pullover","Band Pull-Apart","Cable Internal Rotation","Chest-Supported Rear Delt Raise","Dumbbell Scaption"],"Biceps":["Machine Preacher Curl","Cable Curl","EZ-Bar Curl","Alternating Dumbbell Curl","Concentration Curl","Spider Curl","Drag Curl","21s","Zottman Curl","Hammer Curl","Cable Hammer Curl (Rope)","Reverse Curl","Chin-up","Weighted Pull-up","Assisted Pull-up Machine","Single-Arm Lat Pulldown","Seated Cable Row","Barbell Row","Pendlay Row","T-Bar Row","Chest-Supported Row","Seal Row","Machine Row","Meadows Row","Inverted Row","Muscle-up","Straight-Arm Pulldown","Single-Arm Cable Row","Landmine Row","Reverse-Grip Barbell Row","Machine Pullover","High Cable Curl"],"Triceps":["Triceps Pushdown (Bar)","Overhead Dumbbell Extension","Dumbbell Skull Crusher","Machine Triceps Extension","Triceps Kickback","Cable Kickback (Triceps)","Close-Grip Bench Press","JM Press","Triceps Dip","Bench Dips","Diamond Push-up","Incline Bench Press","Incline Dumbbell Press","Decline Bench Press","Decline Dumbbell Press","Smith Machine Incline Press","Machine Chest Press","Machine Incline Chest Press","Incline Push-up","Decline Push-up","Landmine Press","Svend Press","Floor Press","Overhead Press (Barbell)","Seated Dumbbell Shoulder Press","Standing Dumbbell Press","Arnold Press","Machine Shoulder Press","Smith Machine Shoulder Press","Push Press","Landmine Shoulder Press","Handstand Push-up","Thruster","Wall Ball","Clean & Press","Clean and Jerk","Man Maker","Muscle-up","Burpee","Dumbbell Pullover","Dumbbell Pullover (Lats)","Straight-Arm Pulldown","Machine Pullover","Pike Push-up","Reverse-Grip Triceps Pushdown","Lying Cable Triceps Extension","Assisted Dip Machine","Machine Seated Dip","Medicine Ball Slam"],"Önkol":["Reverse Wrist Curl","Wrist Roller","Farmer's Walk","Dead Hang","Plate Pinch","Barbell Curl","EZ-Bar Curl","Dumbbell Curl","Alternating Dumbbell Curl","Machine Preacher Curl","Concentration Curl","Cable Curl","Bayesian Cable Curl","Spider Curl","Drag Curl","21s","Hammer Curl","Cable Hammer Curl (Rope)","Reverse Curl","Zottman Curl","Deadlift","Sumo Deadlift","Trap Bar Deadlift","Rack Pull","Barbell Shrug","Dumbbell Shrug","Pull-up","Chin-up","Weighted Pull-up","Barbell Row","Pendlay Row","Single-Arm Dumbbell Row","T-Bar Row","Romanian Deadlift","Dumbbell Romanian Deadlift","Stiff-Leg Deadlift","Single-Leg RDL","Hanging Leg Raise","Hanging Knee Raise","Muscle-up","Power Clean","Hang Clean","Sled Pull","Kettlebell Swing","Inverted Row","Wide-Grip Lat Pulldown","Close-Grip Lat Pulldown (V-Bar)","Seated Cable Row","Reverse-Grip Lat Pulldown","Neutral-Grip Pull-up","Single-Arm Cable Row","Landmine Row","Reverse-Grip Barbell Row","Deficit Deadlift","High Cable Curl","Toes-to-Bar","Suitcase Carry","Kettlebell Snatch","Dumbbell Snatch","Turkish Get-up","Battle Rope"],"Quadriceps":["Low-Bar Squat","Box Squat","Goblet Squat","Zercher Squat","Pendulum Squat","Belt Squat","Reverse Lunge","Lateral Lunge","Sissy Squat","Pistol Squat","Step-up","Wall Sit","Bulgarian Split Squat","Hack Squat","Deadlift","Sumo Deadlift","Trap Bar Deadlift","Rack Pull","Power Clean","Hang Clean","Clean and Jerk","Snatch","Power Snatch","Thruster","Clean & Press","Kettlebell Goblet Clean","Wall Ball","Sled Push","Box Jump","Hip Thrust (Barbell)","Machine Hip Thrust","Kettlebell Swing","Deficit Deadlift","Split Squat","Curtsy Lunge","Dumbbell Sumo Squat","Reverse Nordic","Overhead Squat","Safety Bar Squat","Cossack Squat","Kettlebell Snatch","Dumbbell Snatch","Turkish Get-up","Battle Rope","Medicine Ball Slam","Burpee"],"Hamstring":["Standing Leg Curl","Dumbbell Romanian Deadlift","Single-Leg RDL","Glute-Ham Raise","Good Morning","Cable Pull-through","Reverse Hyperextension","Deadlift","Sumo Deadlift","Trap Bar Deadlift","Rack Pull","Machine Hip Thrust","Glute Bridge","Frog Pump","Cable Glute Kickback","Bulgarian Split Squat","Walking Lunge","Reverse Lunge","Forward Lunge","Lateral Lunge","Step-up","Pistol Squat","Superman","Power Clean","Hang Clean","Clean and Jerk","Snatch","Power Snatch","Clean & Press","Kettlebell Goblet Clean","Romanian Deadlift","Stiff-Leg Deadlift","Machine Hip Abduction","Single-Leg Glute Bridge","Deficit Deadlift","Split Squat","Curtsy Lunge","Cossack Squat","Slider Leg Curl","Machine Glute Kickback","Turkish Get-up","Burpee","Sled Push","Back Extension"],"Kalça":["High-Bar Squat","Low-Bar Squat","Machine Hip Thrust","Single-Leg Glute Bridge","Glute Bridge","Bulgarian Split Squat","Walking Lunge","Reverse Lunge","Forward Lunge","Step-up","Single-Leg RDL","Front Squat","Goblet Squat","Belt Squat","Smith Machine Squat","Box Squat","Zercher Squat","Pistol Squat","Romanian Deadlift","Dumbbell Romanian Deadlift","Stiff-Leg Deadlift","Frog Pump","Cable Pull-through","Single-Leg Leg Press","Hack Squat","Pendulum Squat","Air Squat","Lateral Lunge","Deadlift","Trap Bar Deadlift","Sumo Deadlift","Back Extension","Reverse Hyperextension","Good Morning","Kettlebell Swing","Rack Pull","Power Clean","Hang Clean","Clean and Jerk","Snatch","Power Snatch","Thruster","Clean & Press","Kettlebell Goblet Clean","Wall Ball","Wall Sit","Superman","Glute-Ham Raise","Nordic Curl","Deficit Deadlift","Split Squat","Jump Squat","Curtsy Lunge","Dumbbell Sumo Squat","Overhead Squat","Safety Bar Squat","Cossack Squat","Machine Glute Kickback","Cable Hip Abduction","Banded Clamshell","Banded Lateral Walk","Kettlebell Snatch","Dumbbell Snatch","Turkish Get-up","Battle Rope","Medicine Ball Slam","Burpee","Sled Push"],"İç Bacak":["High-Bar Squat","Low-Bar Squat","Front Squat","Goblet Squat","Zercher Squat","Smith Machine Squat","Hack Squat","Pendulum Squat","Belt Squat","Box Squat","Air Squat","Wall Sit","Single-Leg Leg Press","Lateral Lunge","Bulgarian Split Squat","Walking Lunge","Reverse Lunge","Forward Lunge","Step-up","Pistol Squat","Sumo Deadlift","Deadlift","Trap Bar Deadlift","Romanian Deadlift","Dumbbell Romanian Deadlift","Single-Leg RDL","Stiff-Leg Deadlift","Good Morning","Hip Thrust (Barbell)","Machine Hip Thrust","Glute Bridge","Kettlebell Swing","Cable Pull-through","Machine Hip Adduction","Machine Hip Abduction","Deficit Deadlift","Split Squat","Jump Squat","Curtsy Lunge","Dumbbell Sumo Squat","Overhead Squat","Cossack Squat","Copenhagen Plank","Kettlebell Snatch","Dumbbell Snatch"],"Baldır":["Single-Leg Calf Raise","Donkey Calf Raise","Seated Calf Raise","Lying Leg Curl","Standing Leg Curl","Seated Leg Curl","Nordic Curl","Glute-Ham Raise","Box Jump","Sled Push","Slider Leg Curl","Burpee"],"Karın":["Decline Sit-up","Captain's Chair Leg Raise","Dragon Flag","V-Up","Bicycle Crunch","Hollow Body Hold","L-Sit","Mountain Climber","Dead Bug","Russian Twist","Cable Woodchopper","Pallof Press","Side Bend (Dumbbell)","Back Squat","Front Squat","High-Bar Squat","Low-Bar Squat","Deadlift","Sumo Deadlift","Trap Bar Deadlift","Overhead Press (Barbell)","Standing Dumbbell Press","Cable Crunch","Machine Crunch","Sit-up","Deficit Deadlift","Pike Push-up","Overhead Squat","Safety Bar Squat","Toes-to-Bar","Cable Side Bend","Landmine Twist","Bear Crawl","Turkish Get-up","Battle Rope","Medicine Ball Slam","Burpee","Sled Push","Dumbbell Pullover","Dumbbell Pullover (Lats)"],"Oblik":["Side Bend (Dumbbell)","Cable Woodchopper","Pallof Press","Russian Twist","Bicycle Crunch","Captain's Chair Leg Raise","Decline Sit-up","Farmer's Walk","Copenhagen Plank","Cable Side Bend","Landmine Twist","Suitcase Carry","Turkish Get-up","Battle Rope","Medicine Ball Slam"],"Rotator Manşet":["Cuban Press","Face Pull","Y-Raise","Lateral Raise (Dumbbell)","Cable Lateral Raise","Machine Lateral Raise","Rear Delt Fly (Dumbbell)","Reverse Pec Deck","Cable Rear Delt Fly","Overhead Press (Barbell)","Seated Dumbbell Shoulder Press","Standing Dumbbell Press","Arnold Press","Machine Shoulder Press","Smith Machine Shoulder Press","Push Press","Landmine Shoulder Press","Seated Cable Row","Barbell Row","Pendlay Row","Single-Arm Dumbbell Row","T-Bar Row","Chest-Supported Row","Seal Row","Machine Row","Meadows Row","Bench Press (Barbell)","Dumbbell Bench Press","Push-up","Pull-up","Chin-up","Cable Chest Press","Reverse-Grip Bench Press","Deficit Push-up","Weighted Push-up","Squeeze Press (Dumbbell)","Neutral-Grip Pull-up","Single-Arm Cable Row","Landmine Row","Reverse-Grip Barbell Row","Band Pull-Apart","Pike Push-up","Cable Internal Rotation","Chest-Supported Rear Delt Raise","Dumbbell Scaption","Turkish Get-up"]};

// Dar, yüksek güvenli uzamış pozisyon / eksantrik vurgu tablosu.
export const STRETCH: Record<string, string[]> = {
  "Romanian Deadlift": [
    "Hamstring",
    "Kalça"
  ],
  "Dumbbell Romanian Deadlift": [
    "Hamstring",
    "Kalça"
  ],
  "Single-Leg RDL": [
    "Hamstring",
    "Kalça"
  ],
  "Stiff-Leg Deadlift": [
    "Hamstring",
    "Kalça"
  ],
  "Good Morning": [
    "Hamstring",
    "Kalça"
  ],
  "Nordic Curl": [
    "Hamstring"
  ],
  "Glute-Ham Raise": [
    "Hamstring"
  ],
  "Seated Leg Curl": [
    "Hamstring"
  ],
  "Slider Leg Curl": [
    "Hamstring"
  ],
  "Sissy Squat": [
    "Quadriceps"
  ],
  "Reverse Nordic": [
    "Quadriceps"
  ],
  "Incline Dumbbell Curl": [
    "Biceps"
  ],
  "Bayesian Cable Curl": [
    "Biceps"
  ],
  "Overhead Cable Extension": [
    "Triceps"
  ],
  "Overhead Dumbbell Extension": [
    "Triceps"
  ],
  "Dumbbell Fly": [
    "Göğüs"
  ],
  "Incline Dumbbell Fly": [
    "Göğüs"
  ],
  "Deficit Push-up": [
    "Göğüs"
  ],
  "Chest Dip": [
    "Göğüs"
  ],
  "Dumbbell Pullover": [
    "Lat",
    "Göğüs"
  ],
  "Dumbbell Pullover (Lats)": [
    "Lat",
    "Göğüs"
  ],
  "Cossack Squat": [
    "İç Bacak"
  ]
};

// Added variants are mechanical inference, never EVIDENCE.
for (const ex of NEW_EXERCISES) {
 WEIGHTS[ex.name] = ex.w;
 for (const muscle of Object.keys(ex.w)) (INFERENCE[muscle] ??= []).push(ex.name);
 if (ex.stretch.length) STRETCH[ex.name] = ex.stretch;
}
