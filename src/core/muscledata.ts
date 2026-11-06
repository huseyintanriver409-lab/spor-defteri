// OTOMATİK ÜRETİLDİ (arastirma/ klasöründeki kas araştırmaları + doğrulama düzeltmeleri). Elle düzenleme; kaynaklar o dosyalarda.
// WEIGHTS: hareket → kas → pay (1 = ana hedef). Bir set, kasa "pay" kadar etkili set sayılır.
// EVIDENCE: kas → büyütmede kanıtı en iyi olandan başlayarak eşit gruplar (aynı gruptakiler arasında fark gösterilmedi).
// INFERENCE: payı çalışmaya değil çıkarıma dayanan hareketler (kas başına).
export type Level = "güçlü" | "orta" | "zayıf" | "yok";
export const WEIGHTS: Record<string, Record<string, number>> = {"Bench Press (Barbell)":{"Göğüs":1,"Ön Omuz":0.6,"Triceps":0.5,"Rotator Manşet":0.15},
  "Dumbbell Bench Press":{"Göğüs":1,"Ön Omuz":0.6,"Triceps":0.4,"Rotator Manşet":0.15,"Biceps":0.1},
  "Incline Bench Press":{"Göğüs":1,"Ön Omuz":0.75,"Triceps":0.5},
  "Incline Dumbbell Press":{"Göğüs":1,"Ön Omuz":0.75,"Triceps":0.4,"Biceps":0.1},
  "Decline Bench Press":{"Göğüs":1,"Triceps":0.5,"Ön Omuz":0.35},
  "Decline Dumbbell Press":{"Göğüs":1,"Triceps":0.4,"Ön Omuz":0.35},
  "Smith Machine Bench Press":{"Göğüs":1,"Ön Omuz":0.6,"Triceps":0.5},
  "Smith Machine Incline Press":{"Göğüs":1,"Ön Omuz":0.75,"Triceps":0.5},
  "Chest Press Makinesi":{"Göğüs":1,"Ön Omuz":0.55,"Triceps":0.5},
  "Incline Chest Press Makinesi":{"Göğüs":1,"Ön Omuz":0.7,"Triceps":0.5},
  "Dumbbell Fly":{"Göğüs":1,"Ön Omuz":0.35,"Biceps":0.15,"Triceps":0.1},
  "Incline Dumbbell Fly":{"Göğüs":1,"Ön Omuz":0.45,"Biceps":0.15,"Triceps":0.1},
  "Pec Deck (Butterfly)":{"Göğüs":1,"Ön Omuz":0.35,"Triceps":0.05},
  "Cable Crossover":{"Göğüs":1,"Ön Omuz":0.35,"Triceps":0.1},
  "Low-to-High Cable Fly":{"Göğüs":1,"Ön Omuz":0.5,"Triceps":0.1},
  "High-to-Low Cable Fly":{"Göğüs":1,"Ön Omuz":0.2,"Triceps":0.1},
  "Dips (Göğüs)":{"Göğüs":1,"Triceps":0.6,"Ön Omuz":0.5},
  "Şınav (Push-up)":{"Göğüs":1,"Ön Omuz":0.6,"Triceps":0.5,"Karın":0.2,"Rotator Manşet":0.15},
  "Incline Şınav":{"Göğüs":1,"Ön Omuz":0.5,"Triceps":0.5,"Karın":0.2},
  "Decline Şınav":{"Göğüs":1,"Ön Omuz":0.7,"Triceps":0.5,"Karın":0.2},
  "Dumbbell Pullover":{"Göğüs":0.7,"Lat":0.6,"Triceps":0.3,"Ön Omuz":0.25,"Karın":0.2},
  "Landmine Press":{"Göğüs":0.8,"Ön Omuz":0.75,"Triceps":0.4,"Karın":0.3},
  "Svend Press":{"Göğüs":0.6,"Ön Omuz":0.4,"Triceps":0.2},
  "Floor Press":{"Göğüs":1,"Triceps":0.6,"Ön Omuz":0.5},
  "Barfiks (Pull-up)":{"Lat":1,"Biceps":0.5,"Arka Omuz":0.4,"Trapez":0.3,"Önkol":0.25,"Göğüs":0.2,"Karın":0.2,"Rotator Manşet":0.15},
  "Chin-up":{"Lat":1,"Biceps":0.6,"Arka Omuz":0.35,"Göğüs":0.3,"Trapez":0.3,"Önkol":0.25,"Karın":0.2,"Rotator Manşet":0.15},
  "Ağırlıklı Barfiks":{"Lat":1,"Biceps":0.5,"Arka Omuz":0.4,"Rotator Manşet":0.35,"Trapez":0.3,"Önkol":0.25,"Göğüs":0.2,"Karın":0.2},
  "Asistanlı Barfiks Makinesi":{"Lat":1,"Biceps":0.5,"Trapez":0.4,"Arka Omuz":0.4,"Önkol":0.35,"Rotator Manşet":0.35,"Göğüs":0.2,"Karın":0.1},
  "Lat Pulldown (Geniş)":{"Lat":1,"Biceps":0.5,"Arka Omuz":0.4,"Trapez":0.3,"Göğüs":0.2,"Triceps":0.2,"Önkol":0.2,"Rotator Manşet":0.2},
  "Lat Pulldown (Dar / V-Bar)":{"Lat":1,"Biceps":0.5,"Arka Omuz":0.4,"Trapez":0.3,"Göğüs":0.2,"Triceps":0.2,"Önkol":0.2,"Rotator Manşet":0.2},
  "Tek Kol Lat Pulldown":{"Lat":1,"Biceps":0.5,"Arka Omuz":0.35,"Trapez":0.3,"Önkol":0.3,"Göğüs":0.2,"Triceps":0.2,"Rotator Manşet":0.2,"Karın":0.1,"Oblik":0.1},
  "Seated Cable Row":{"Lat":0.8,"Trapez":0.7,"Arka Omuz":0.5,"Biceps":0.5,"Bel":0.2,"Yan Omuz":0.2,"Önkol":0.2,"Rotator Manşet":0.2},
  "Barbell Row":{"Lat":0.8,"Trapez":0.7,"Arka Omuz":0.5,"Biceps":0.5,"Bel":0.3,"Önkol":0.25,"Hamstring":0.2,"Kalça":0.2,"Rotator Manşet":0.2},
  "Pendlay Row":{"Lat":0.8,"Trapez":0.7,"Arka Omuz":0.5,"Biceps":0.5,"Bel":0.3,"Önkol":0.25,"Hamstring":0.2,"Kalça":0.2,"Rotator Manşet":0.2},
  "Dumbbell Row (Tek Kol)":{"Lat":0.8,"Trapez":0.7,"Biceps":0.5,"Arka Omuz":0.4,"Önkol":0.25,"Rotator Manşet":0.2,"Bel":0.1,"Oblik":0.1},
  "T-Bar Row":{"Lat":0.8,"Trapez":0.7,"Arka Omuz":0.5,"Biceps":0.5,"Bel":0.3,"Önkol":0.25,"Hamstring":0.2,"Kalça":0.2,"Rotator Manşet":0.2},
  "Chest-Supported Row":{"Lat":0.8,"Trapez":0.7,"Arka Omuz":0.5,"Biceps":0.5,"Önkol":0.3,"Rotator Manşet":0.2},
  "Seal Row":{"Lat":0.8,"Trapez":0.7,"Arka Omuz":0.5,"Biceps":0.5,"Önkol":0.3,"Rotator Manşet":0.2},
  "Machine Row":{"Lat":0.8,"Trapez":0.7,"Arka Omuz":0.5,"Biceps":0.5,"Önkol":0.3,"Rotator Manşet":0.2},
  "Meadows Row":{"Lat":0.8,"Trapez":0.6,"Arka Omuz":0.5,"Biceps":0.5,"Bel":0.3,"Önkol":0.3,"Rotator Manşet":0.2,"Oblik":0.1},
  "Inverted Row":{"Lat":0.8,"Trapez":0.7,"Arka Omuz":0.5,"Biceps":0.5,"Bel":0.2,"Önkol":0.2,"Kalça":0.2,"Karın":0.2},
  "Straight-Arm Pulldown":{"Lat":1,"Arka Omuz":0.3,"Göğüs":0.2,"Triceps":0.2,"Karın":0.2,"Biceps":0.1},
  "Dumbbell Pullover (Sırt)":{"Göğüs":0.8,"Lat":0.6,"Ön Omuz":0.3,"Triceps":0.3,"Karın":0.2},
  "Deadlift":{"Bel":0.8,"Kalça":0.7,"Hamstring":0.5,"İç Bacak":0.45,"Trapez":0.4,"Quadriceps":0.4,"Lat":0.3,"Önkol":0.3,"Karın":0.2},
  "Rack Pull":{"Bel":0.7,"Kalça":0.5,"Trapez":0.4,"Önkol":0.3,"Hamstring":0.3,"Quadriceps":0.1},
  "Back Extension (Hiperekstansiyon)":{"Hamstring":1,"Bel":0.8,"Kalça":0.7},
  "Good Morning":{"Hamstring":0.8,"Bel":0.7,"Kalça":0.6,"İç Bacak":0.3},
  "Barbell Shrug":{"Trapez":1,"Önkol":0.3},
  "Dumbbell Shrug":{"Trapez":1,"Önkol":0.3},
  "Superman":{"Bel":0.4,"Kalça":0.3,"Hamstring":0.15,"Arka Omuz":0.1},
  "Overhead Press (Barbell)":{"Ön Omuz":1,"Yan Omuz":0.6,"Triceps":0.5,"Trapez":0.3,"Göğüs":0.2,"Arka Omuz":0.2,"Karın":0.2,"Rotator Manşet":0.2},
  "Seated Dumbbell Shoulder Press":{"Ön Omuz":1,"Yan Omuz":0.6,"Triceps":0.4,"Trapez":0.3,"Göğüs":0.2,"Rotator Manşet":0.2,"Arka Omuz":0.15},
  "Standing Dumbbell Press":{"Ön Omuz":1,"Yan Omuz":0.6,"Triceps":0.4,"Trapez":0.3,"Göğüs":0.2,"Arka Omuz":0.2,"Karın":0.2,"Rotator Manşet":0.2},
  "Arnold Press":{"Ön Omuz":1,"Yan Omuz":0.6,"Triceps":0.4,"Trapez":0.3,"Göğüs":0.25,"Rotator Manşet":0.2},
  "Machine Shoulder Press":{"Ön Omuz":1,"Yan Omuz":0.5,"Triceps":0.5,"Trapez":0.3,"Göğüs":0.25,"Rotator Manşet":0.2},
  "Smith Machine Shoulder Press":{"Ön Omuz":1,"Yan Omuz":0.5,"Triceps":0.5,"Trapez":0.3,"Göğüs":0.25,"Rotator Manşet":0.2},
  "Push Press":{"Ön Omuz":0.8,"Yan Omuz":0.5,"Triceps":0.4,"Trapez":0.3,"Quadriceps":0.3,"Kalça":0.25,"Rotator Manşet":0.2,"Karın":0.15},
  "Landmine Shoulder Press":{"Ön Omuz":0.9,"Göğüs":0.4,"Triceps":0.4,"Trapez":0.3,"Yan Omuz":0.3,"Oblik":0.2,"Rotator Manşet":0.2,"Karın":0.15},
  "Lateral Raise (Dumbbell)":{"Yan Omuz":1,"Trapez":0.5,"Ön Omuz":0.3,"Rotator Manşet":0.3,"Arka Omuz":0.25},
  "Cable Lateral Raise":{"Yan Omuz":1,"Trapez":0.5,"Ön Omuz":0.3,"Rotator Manşet":0.3,"Arka Omuz":0.25},
  "Machine Lateral Raise":{"Yan Omuz":1,"Trapez":0.5,"Ön Omuz":0.3,"Rotator Manşet":0.3,"Arka Omuz":0.25},
  "Front Raise (Dumbbell)":{"Ön Omuz":1,"Göğüs":0.3,"Yan Omuz":0.3,"Trapez":0.25,"Karın":0.1},
  "Plate Front Raise":{"Ön Omuz":1,"Göğüs":0.3,"Yan Omuz":0.3,"Trapez":0.25,"Önkol":0.15},
  "Cable Front Raise":{"Ön Omuz":1,"Göğüs":0.3,"Yan Omuz":0.3,"Trapez":0.25},
  "Rear Delt Fly (Dumbbell)":{"Arka Omuz":1,"Trapez":0.5,"Yan Omuz":0.3,"Rotator Manşet":0.3},
  "Reverse Pec Deck":{"Arka Omuz":1,"Trapez":0.5,"Yan Omuz":0.3,"Rotator Manşet":0.3},
  "Cable Rear Delt Fly":{"Arka Omuz":1,"Trapez":0.5,"Yan Omuz":0.3,"Rotator Manşet":0.3},
  "Face Pull":{"Arka Omuz":0.8,"Trapez":0.5,"Rotator Manşet":0.5,"Yan Omuz":0.3,"Biceps":0.2},
  "Cable External Rotation":{"Rotator Manşet":1,"Arka Omuz":0.15},
  "Dumbbell External Rotation (Yan Yatarak)":{"Rotator Manşet":1,"Arka Omuz":0.3},
  "Cuban Press":{"Rotator Manşet":0.7,"Yan Omuz":0.5,"Trapez":0.4,"Arka Omuz":0.3,"Ön Omuz":0.2},
  "Upright Row":{"Yan Omuz":0.8,"Trapez":0.7,"Ön Omuz":0.35,"Biceps":0.3,"Arka Omuz":0.2,"Önkol":0.2},
  "Y-Raise":{"Trapez":0.6,"Yan Omuz":0.5,"Arka Omuz":0.5,"Rotator Manşet":0.4,"Ön Omuz":0.35},
  "Handstand Push-up":{"Ön Omuz":1,"Triceps":0.6,"Yan Omuz":0.5,"Trapez":0.3,"Göğüs":0.2,"Karın":0.2},
  "Barbell Curl":{"Biceps":1,"Önkol":0.5},
  "EZ-Bar Curl":{"Biceps":1,"Önkol":0.5},
  "Dumbbell Curl":{"Biceps":1,"Önkol":0.5},
  "Alternating Dumbbell Curl":{"Biceps":1,"Önkol":0.5},
  "Hammer Curl":{"Biceps":0.8,"Önkol":0.6},
  "Cable Hammer Curl (Halat)":{"Biceps":0.8,"Önkol":0.6},
  "Incline Dumbbell Curl":{"Biceps":1,"Önkol":0.5},
  "Preacher Curl":{"Biceps":1,"Önkol":0.5},
  "Machine Preacher Curl":{"Biceps":1,"Önkol":0.5},
  "Concentration Curl":{"Biceps":1,"Önkol":0.5},
  "Cable Curl":{"Biceps":1,"Önkol":0.5},
  "Bayesian Cable Curl":{"Biceps":1,"Önkol":0.5},
  "Spider Curl":{"Biceps":1,"Önkol":0.5},
  "Drag Curl":{"Biceps":1,"Önkol":0.5},
  "Reverse Curl":{"Biceps":0.6,"Önkol":0.6},
  "Zottman Curl":{"Biceps":0.9,"Önkol":0.6},
  "21'ler":{"Biceps":1,"Önkol":0.5},
  "Triceps Pushdown (Halat)":{"Triceps":1},
  "Triceps Pushdown (Bar)":{"Triceps":1},
  "Tek Kol Cable Pushdown":{"Triceps":1},
  "Overhead Cable Extension":{"Triceps":1},
  "Overhead Dumbbell Extension":{"Triceps":1},
  "Skull Crusher (EZ-Bar)":{"Triceps":1},
  "Dumbbell Skull Crusher":{"Triceps":1},
  "Close-Grip Bench Press":{"Triceps":0.75,"Göğüs":0.65,"Ön Omuz":0.5},
  "Dips (Triceps)":{"Triceps":0.8,"Göğüs":0.5,"Ön Omuz":0.45},
  "Bench Dips":{"Triceps":0.8,"Ön Omuz":0.35,"Göğüs":0.2},
  "Triceps Kickback":{"Triceps":1,"Arka Omuz":0.1},
  "Cable Kickback (Triceps)":{"Triceps":1},
  "JM Press":{"Triceps":0.85,"Göğüs":0.3,"Ön Omuz":0.25},
  "Machine Triceps Extension":{"Triceps":1},
  "Diamond Şınav":{"Triceps":0.7,"Göğüs":0.6,"Ön Omuz":0.5,"Karın":0.2},
  "Wrist Curl":{"Önkol":1},
  "Reverse Wrist Curl":{"Önkol":1},
  "Farmer's Walk":{"Önkol":0.75,"Oblik":0.5,"Trapez":0.4,"Karın":0.25,"Bel":0.2},
  "Dead Hang":{"Önkol":0.75,"Lat":0.25,"Trapez":0.1},
  "Plate Pinch":{"Önkol":0.75,"Trapez":0.1},
  "Wrist Roller":{"Önkol":1,"Ön Omuz":0.3,"Trapez":0.1},
  "Back Squat":{"Quadriceps":1,"Kalça":1,"İç Bacak":0.6,"Bel":0.4,"Karın":0.2,"Hamstring":0.1},
  "Front Squat":{"Quadriceps":1,"Kalça":0.8,"İç Bacak":0.55,"Bel":0.4,"Karın":0.2},
  "High-Bar Squat":{"Quadriceps":1,"Kalça":1,"İç Bacak":0.55,"Bel":0.4,"Karın":0.2,"Hamstring":0.1},
  "Low-Bar Squat":{"Quadriceps":1,"Kalça":1,"İç Bacak":0.55,"Bel":0.5,"Karın":0.2,"Hamstring":0.15},
  "Goblet Squat":{"Quadriceps":0.9,"Kalça":0.8,"İç Bacak":0.55,"Karın":0.2},
  "Hack Squat":{"Quadriceps":1,"Kalça":0.7,"İç Bacak":0.55},
  "Pendulum Squat":{"Quadriceps":1,"Kalça":0.7,"İç Bacak":0.55},
  "Belt Squat":{"Quadriceps":1,"Kalça":0.8,"İç Bacak":0.55},
  "Smith Machine Squat":{"Quadriceps":1,"Kalça":0.8,"İç Bacak":0.55,"Bel":0.1,"Karın":0.1},
  "Leg Press":{"Quadriceps":1,"Kalça":0.8,"İç Bacak":0.6,"Hamstring":0.1},
  "Tek Bacak Leg Press":{"Quadriceps":1,"Kalça":0.8,"İç Bacak":0.6,"Hamstring":0.1},
  "Bulgarian Split Squat":{"Quadriceps":1,"Kalça":0.9,"İç Bacak":0.4,"Hamstring":0.25,"Karın":0.1},
  "Walking Lunge":{"Quadriceps":0.9,"Kalça":0.9,"İç Bacak":0.4,"Hamstring":0.2},
  "Reverse Lunge":{"Quadriceps":0.9,"Kalça":0.9,"İç Bacak":0.4,"Hamstring":0.2},
  "Forward Lunge":{"Quadriceps":0.9,"Kalça":0.9,"İç Bacak":0.4,"Hamstring":0.2},
  "Lateral Lunge":{"Quadriceps":0.8,"Kalça":0.7,"İç Bacak":0.6,"Hamstring":0.15},
  "Step-up":{"Quadriceps":0.9,"Kalça":0.9,"İç Bacak":0.4,"Hamstring":0.2},
  "Leg Extension":{"Quadriceps":1},
  "Sissy Squat":{"Quadriceps":0.85},
  "Pistol Squat":{"Quadriceps":0.9,"Kalça":0.8,"İç Bacak":0.4,"Hamstring":0.15},
  "Box Squat":{"Quadriceps":1,"Kalça":0.8,"Bel":0.4,"İç Bacak":0.4},
  "Zercher Squat":{"Quadriceps":1,"Kalça":0.8,"İç Bacak":0.55,"Bel":0.4,"Karın":0.3,"Biceps":0.2},
  "Wall Sit":{"Quadriceps":0.6,"Kalça":0.3,"İç Bacak":0.3},
  "Air Squat (Vücut Ağırlığı)":{"Kalça":0.7,"Quadriceps":0.5,"İç Bacak":0.3},
  "Romanian Deadlift":{"Hamstring":1,"Kalça":0.8,"Bel":0.6,"İç Bacak":0.3,"Trapez":0.25,"Önkol":0.25},
  "Dumbbell Romanian Deadlift":{"Hamstring":1,"Kalça":0.8,"Bel":0.5,"İç Bacak":0.3,"Önkol":0.25,"Trapez":0.2},
  "Tek Bacak RDL":{"Hamstring":1,"Kalça":0.9,"Bel":0.4,"İç Bacak":0.3,"Önkol":0.25,"Oblik":0.2},
  "Stiff-Leg Deadlift":{"Hamstring":1,"Kalça":0.8,"Bel":0.6,"İç Bacak":0.3,"Önkol":0.25,"Trapez":0.2},
  "Sumo Deadlift":{"Bel":0.7,"Kalça":0.7,"Quadriceps":0.5,"İç Bacak":0.45,"Trapez":0.4,"Hamstring":0.4,"Önkol":0.3,"Karın":0.2},
  "Trap Bar Deadlift":{"Bel":0.7,"Kalça":0.7,"Quadriceps":0.5,"İç Bacak":0.45,"Trapez":0.4,"Hamstring":0.4,"Önkol":0.3,"Karın":0.2},
  "Lying Leg Curl":{"Hamstring":1,"Baldır":0.3},
  "Seated Leg Curl":{"Hamstring":1,"Baldır":0.3},
  "Standing Leg Curl":{"Hamstring":1,"Baldır":0.3},
  "Nordic Curl":{"Hamstring":1,"Baldır":0.3,"Kalça":0.2},
  "Glute-Ham Raise":{"Hamstring":1,"Bel":0.3,"Kalça":0.3,"Baldır":0.3},
  "Hip Thrust (Barbell)":{"Kalça":1,"Bel":0.3,"Quadriceps":0.2,"Hamstring":0.2,"İç Bacak":0.2},
  "Hip Thrust Makinesi":{"Kalça":1,"Quadriceps":0.2,"Hamstring":0.2,"İç Bacak":0.2},
  "Glute Bridge":{"Kalça":0.9,"Hamstring":0.25,"Quadriceps":0.2,"İç Bacak":0.2},
  "Tek Bacak Glute Bridge":{"Kalça":1,"Hamstring":0.35},
  "Cable Kickback (Kalça)":{"Kalça":1,"Hamstring":0.3},
  "Cable Pull-through":{"Kalça":0.8,"Hamstring":0.5,"Bel":0.3,"İç Bacak":0.2},
  "Hip Abduction Makinesi":{"Kalça":0.5},
  "Hip Adduction Makinesi":{"İç Bacak":1},
  "Kettlebell Swing":{"Kalça":0.6,"Bel":0.5,"Hamstring":0.5,"Önkol":0.25,"Quadriceps":0.2,"İç Bacak":0.2,"Ön Omuz":0.1},
  "Reverse Hyperextension":{"Bel":0.8,"Kalça":0.7,"Hamstring":0.6},
  "Frog Pump":{"Kalça":0.8,"İç Bacak":0.2,"Hamstring":0.1},
  "Standing Calf Raise":{"Baldır":1},
  "Seated Calf Raise":{"Baldır":0.5},
  "Leg Press Calf Raise":{"Baldır":1},
  "Smith Machine Calf Raise":{"Baldır":1},
  "Tek Bacak Calf Raise":{"Baldır":1},
  "Donkey Calf Raise":{"Baldır":1},
  "Tibialis Raise":{},
  "Crunch":{"Karın":1,"Oblik":0.4},
  "Mekik (Sit-up)":{"Karın":1,"Oblik":0.4},
  "Decline Sit-up":{"Karın":1,"Oblik":0.4},
  "Cable Crunch":{"Karın":1,"Oblik":0.4},
  "Machine Crunch":{"Karın":1,"Oblik":0.4},
  "Bicycle Crunch":{"Karın":0.7,"Oblik":0.7},
  "Reverse Crunch":{"Karın":1,"Oblik":0.4},
  "Hanging Leg Raise":{"Karın":1,"Oblik":0.7,"Önkol":0.25,"Lat":0.2},
  "Hanging Knee Raise":{"Karın":1,"Oblik":0.6,"Önkol":0.25,"Lat":0.2},
  "Lying Leg Raise":{"Karın":0.8,"Oblik":0.3},
  "Captain's Chair Leg Raise":{"Karın":1,"Oblik":0.6,"Ön Omuz":0.1,"Triceps":0.1},
  "Plank":{"Karın":0.6,"Oblik":0.5,"Ön Omuz":0.2,"Göğüs":0.1},
  "Side Plank":{"Oblik":1,"Bel":0.4,"Kalça":0.3,"Karın":0.3},
  "Ab Wheel Rollout":{"Karın":1,"Oblik":0.6,"Lat":0.3,"Göğüs":0.2,"Triceps":0.2},
  "Russian Twist":{"Oblik":0.8,"Karın":0.4},
  "Pallof Press":{"Oblik":0.8,"Karın":0.3,"Göğüs":0.15,"Ön Omuz":0.15},
  "Cable Woodchopper":{"Oblik":1,"Karın":0.4,"Bel":0.3,"Lat":0.2,"Ön Omuz":0.2},
  "Dragon Flag":{"Karın":1,"Oblik":0.5,"Lat":0.3},
  "Dead Bug":{"Karın":0.4,"Oblik":0.4},
  "Bird Dog":{"Kalça":0.4,"Bel":0.2,"Karın":0.1},
  "Mountain Climber":{"Karın":0.5,"Oblik":0.3,"Ön Omuz":0.2},
  "V-Up":{"Karın":1,"Oblik":0.5},
  "Hollow Body Hold":{"Karın":0.8,"Oblik":0.4},
  "L-Sit":{"Karın":0.7,"Triceps":0.3,"Quadriceps":0.2,"Önkol":0.1},
  "Side Bend (Dumbbell)":{"Oblik":1,"Bel":0.4,"Önkol":0.2,"Karın":0.2},
  "Power Clean":{"Trapez":0.5,"Kalça":0.5,"Bel":0.4,"Quadriceps":0.4,"Önkol":0.25,"Hamstring":0.25,"Ön Omuz":0.15},
  "Hang Clean":{"Trapez":0.5,"Kalça":0.5,"Bel":0.4,"Quadriceps":0.3,"Önkol":0.25,"Hamstring":0.25,"Ön Omuz":0.15},
  "Clean and Jerk":{"Quadriceps":0.6,"Trapez":0.5,"Kalça":0.5,"Ön Omuz":0.45,"Bel":0.4,"Yan Omuz":0.3,"Triceps":0.3,"Hamstring":0.25},
  "Snatch":{"Quadriceps":0.6,"Trapez":0.5,"Kalça":0.5,"Bel":0.4,"Ön Omuz":0.35,"Yan Omuz":0.3,"Hamstring":0.25},
  "Power Snatch":{"Trapez":0.5,"Kalça":0.5,"Bel":0.4,"Quadriceps":0.4,"Ön Omuz":0.35,"Yan Omuz":0.3,"Hamstring":0.25},
  "Thruster":{"Quadriceps":0.8,"Ön Omuz":0.6,"Kalça":0.5,"Yan Omuz":0.3,"Triceps":0.3,"Trapez":0.2},
  "Clean & Press":{"Ön Omuz":0.6,"Trapez":0.5,"Triceps":0.4,"Quadriceps":0.4,"Kalça":0.4,"Yan Omuz":0.3,"Hamstring":0.2},
  "Burpee":{"Ön Omuz":0.2,"Triceps":0.2},
  "Turkish Get-up":{},
  "Kettlebell Goblet Clean":{"Kalça":0.4,"Trapez":0.3,"Quadriceps":0.3,"Hamstring":0.2,"Ön Omuz":0.15},
  "Sled Push":{"Quadriceps":0.7,"Bel":0.2,"Baldır":0.2},
  "Sled Pull":{"Trapez":0.3,"Önkol":0.25,"Bel":0.2},
  "Battle Rope":{},
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
   "note": "Göğüs kalınlaşmasını doğrudan ölçen birkaç çalışma var; şınav ve makinelerle fark çıkmadı"
  },
  {
   "level": "orta",
   "ex": [
    "Pec Deck (Butterfly)"
   ],
   "note": "12 haftalık çalışmada göğüsün iki başını da belirgin büyüttü; presle karşılaştırılmadı"
  },
  {
   "level": "orta",
   "ex": [
    "Dumbbell Bench Press",
    "Smith Machine Bench Press",
    "Chest Press Makinesi",
    "Şınav (Push-up)",
    "Floor Press"
   ],
   "note": "Dolaylı kanıt: serbest ağırlık, makine ve şınav yük eşitse benzer sonuç veriyor"
  },
  {
   "level": "orta",
   "ex": [
    "Incline Bench Press",
    "Incline Dumbbell Press",
    "Smith Machine Incline Press",
    "Incline Chest Press Makinesi"
   ],
   "note": "Eğimli itişler üst göğüste biraz önde olabilir; tek küçük çalışma, toplam göğüste fark yok"
  },
  {
   "level": "zayıf",
   "ex": [
    "Decline Bench Press",
    "Dumbbell Fly",
    "Incline Dumbbell Fly",
    "Cable Crossover",
    "Dips (Göğüs)",
    "Dumbbell Pullover"
   ],
   "note": "Yalnızca kas aktivasyonu ölçümü var; büyüme çalışması yok"
  },
  {
   "level": "yok",
   "ex": [
    "Decline Dumbbell Press",
    "Low-to-High Cable Fly",
    "High-to-Low Cable Fly",
    "Incline Şınav",
    "Decline Şınav",
    "Landmine Press",
    "Svend Press"
   ],
   "note": "Veri yok; yalnızca harekete bakılarak tahmin edildi"
  }
 ],
 "Lat": [
  {
   "level": "zayıf",
   "ex": [
    "Barfiks (Pull-up)",
    "Chin-up",
    "Ağırlıklı Barfiks",
    "Asistanlı Barfiks Makinesi",
    "Lat Pulldown (Geniş)",
    "Lat Pulldown (Dar / V-Bar)",
    "Tek Kol Lat Pulldown",
    "Seated Cable Row",
    "Barbell Row",
    "Pendlay Row",
    "T-Bar Row",
    "Dumbbell Row (Tek Kol)",
    "Meadows Row",
    "Chest-Supported Row",
    "Seal Row",
    "Machine Row",
    "Inverted Row"
   ],
   "note": "Dikey çekişler ve row'lar: hiçbiri diğerinden üstün bulunmadı; kanıt zayıf, kavrama fark yaratmıyor."
  },
  {
   "level": "zayıf",
   "ex": [
    "Straight-Arm Pulldown"
   ],
   "note": "Lat'ı en çok izole eden hareket (kas ölçümüyle), ama büyüme çalışması yok."
  },
  {
   "level": "zayıf",
   "ex": [
    "Dumbbell Pullover (Sırt)",
    "Dumbbell Pullover"
   ],
   "note": "Pullover'da göğüs baskın, lat ikincil çalışır."
  },
  {
   "level": "yok",
   "ex": [
    "Muscle-up"
   ],
   "note": "Lat için hiç çalışma yok; ağırlık barfiksten tahmin edildi."
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
   "note": "Üst trapezde en yüksek kas aktivitesi; bu hareketleri içeren programda lifler büyüdü"
  },
  {
   "level": "zayıf",
   "ex": [
    "Dumbbell Row (Tek Kol)",
    "Seated Cable Row",
    "Barbell Row",
    "Chest-Supported Row",
    "Seal Row",
    "Lateral Raise (Dumbbell)",
    "Rear Delt Fly (Dumbbell)"
   ],
   "note": "Orta/alt trapezi çalıştırdıkları ölçüldü ama büyüme kıyaslaması yok"
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
   "note": "Trapez çalışıyor ama büyümeyi gösteren çalışma yok; yük düşük ya da hareket kısa"
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
   "note": "Doğrudan veri yok; benzer harekete bakılarak tahmin edildi"
  }
 ],
 "Bel": [
  {
   "level": "zayıf",
   "ex": [
    "Deadlift",
    "Back Extension (Hiperekstansiyon)",
    "Reverse Hyperextension",
    "Good Morning",
    "Trap Bar Deadlift",
    "Sumo Deadlift",
    "Rack Pull"
   ],
   "note": "Beli en çok yükleyen hareketler; aralarında fark gösteren çalışma yok, hepsi eşit sayılır"
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
   "note": "Beli orta düzeyde çalıştırır; asıl hedef bacak arkası ve kalça"
  }
 ],
 "Ön Omuz": [
  {
   "level": "orta",
   "ex": [
    "Bench Press (Barbell)"
   ],
   "note": "Tek doğrudan ölçüm: sadece bench yapınca ön omuz kası büyüdü (küçük bir çalışma)"
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
   "note": "Sadece kas aktivitesi ölçümü var, büyüme ölçülmemiş; aralarında fark gösterilmedi"
  },
  {
   "level": "zayıf",
   "ex": [
    "Front Raise (Dumbbell)"
   ],
   "note": "Ön omuzu en çok çalıştıran kaldırışlardan; büyüme verisi yok, yalnızca kas aktivitesi ölçümü"
  },
  {
   "level": "zayıf",
   "ex": [
    "Dumbbell Bench Press",
    "Smith Machine Bench Press",
    "Chest Press Makinesi",
    "Incline Bench Press",
    "Incline Dumbbell Press"
   ],
   "note": "Eğim arttıkça ön omuz aktivitesi artıyor; büyüme değil, sadece aktivite ölçüldü"
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
    "Decline Şınav",
    "Incline Chest Press Makinesi",
    "Şınav (Push-up)",
    "Thruster",
    "Clean & Press",
    "Dips (Göğüs)",
    "Floor Press",
    "Close-Grip Bench Press",
    "Diamond Şınav",
    "Low-to-High Cable Fly",
    "Incline Şınav"
   ],
   "note": "Çalışma yok; benzer hareketlere bakılarak tahmin edildi"
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
   "note": "Tek çalışmada dambıl ve kablo eşit çıktı; makine için kanıt daha zayıf, sıralanacak fark yok"
  },
  {
   "level": "zayıf",
   "ex": [
    "Upright Row",
    "Overhead Press (Barbell)",
    "Seated Dumbbell Shoulder Press",
    "Standing Dumbbell Press",
    "Machine Shoulder Press"
   ],
   "note": "Yan omuzu çalıştırdıkları ölçüldü ama büyüttükleri hiç ölçülmedi"
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
   "note": "Benzer hareketlerden tahmin; bu hareketlere özgü veri yok"
  }
 ],
 "Arka Omuz": [
  {
   "level": "zayıf",
   "ex": [
    "Reverse Pec Deck",
    "Rear Delt Fly (Dumbbell)",
    "Cable Rear Delt Fly"
   ],
   "note": "Arka omzu doğrudan çalıştırır; aralarında fark ölçülmedi, hepsi eşit iyi"
  },
  {
   "level": "zayıf",
   "ex": [
    "Face Pull"
   ],
   "note": "Muhtemelen iyi ama face pull doğrudan ölçülmedi; benzer hareketlerden çıkarım"
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
   "note": "Yardımcı olarak çalıştırır; dirsek açık çekilirse arka omuz payı artar"
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
    "21'ler"
   ],
   "note": "Curl çeşitleri arasında toplam kol büyümesi farkı bulunmadı; küçük çalışmalar"
  },
  {
   "level": "orta",
   "ex": [
    "Barfiks (Pull-up)",
    "Ağırlıklı Barfiks",
    "Asistanlı Barfiks Makinesi",
    "Lat Pulldown (Geniş)",
    "Lat Pulldown (Dar / V-Bar)",
    "Seated Cable Row",
    "Barbell Row",
    "Pendlay Row",
    "Dumbbell Row (Tek Kol)",
    "T-Bar Row",
    "Chest-Supported Row",
    "Seal Row",
    "Machine Row",
    "Meadows Row",
    "Inverted Row",
    "Tek Kol Lat Pulldown"
   ],
   "note": "Çekişler biceps'i büyütür ama curl'den yarı etkili sayılır"
  },
  {
   "level": "zayıf",
   "ex": [
    "EZ-Bar Curl",
    "Chin-up",
    "Reverse Curl"
   ],
   "note": "Çoğunlukla kas aktivitesi ölçümüne ve çıkarıma dayanıyor"
  },
  {
   "level": "yok",
   "ex": [
    "Zottman Curl",
    "Hammer Curl",
    "Cable Hammer Curl (Halat)",
    "Concentration Curl",
    "Spider Curl",
    "Drag Curl"
   ],
   "note": "Büyüme çalışması yok; benzer curl'lerden çıkarım"
  }
 ],
 "Triceps": [
  {
   "level": "orta",
   "ex": [
    "Overhead Cable Extension",
    "Overhead Dumbbell Extension"
   ],
   "note": "Kol yukarıdayken yapılan hareket, pushdown'dan daha çok kas büyüttü; tek büyük çalışma var."
  },
  {
   "level": "orta",
   "ex": [
    "Triceps Pushdown (Halat)",
    "Triceps Pushdown (Bar)"
   ],
   "note": "Pushdown'un triceps'i büyüttüğü birden fazla çalışmada görüldü; overhead kadar iyi olmayabilir."
  },
  {
   "level": "orta",
   "ex": [
    "Skull Crusher (EZ-Bar)",
    "Tek Kol Cable Pushdown",
    "Bench Press (Barbell)",
    "Şınav (Push-up)"
   ],
   "note": "Triceps'i büyüttükleri gösterildi; bench ve şınav uzun başı izoleden az büyütüyor."
  },
  {
   "level": "zayıf",
   "ex": [
    "Machine Triceps Extension",
    "Close-Grip Bench Press",
    "Dips (Triceps)",
    "Bench Dips",
    "Diamond Şınav",
    "Dumbbell Skull Crusher"
   ],
   "note": "Doğrudan büyüme çalışması yok; kas aktivasyonu ve benzer hareketlerden çıkarıldı."
  },
  {
   "level": "yok",
   "ex": [
    "JM Press"
   ],
   "note": "Bu hareket için hiç çalışma yok; ağırlığı benzer hareketlerden tahmin edildi."
  }
 ],
 "Önkol": [
  {
   "level": "orta",
   "ex": [
    "Wrist Curl"
   ],
   "note": "Bilek bükenleri büyüten iki küçük eğitim çalışması var."
  },
  {
   "level": "orta",
   "ex": [
    "Incline Dumbbell Curl",
    "Preacher Curl"
   ],
   "note": "12 haftalık MRI çalışmasında önkolun üst-dış kasını büyüttü."
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
    "21'ler",
    "Hammer Curl",
    "Cable Hammer Curl (Halat)",
    "Reverse Curl",
    "Zottman Curl",
    "Farmer's Walk"
   ],
   "note": "Doğrudan büyüme verisi yok; diğer curl ve kavrama çalışmalarından çıkarım."
  },
  {
   "level": "yok",
   "ex": [
    "Reverse Wrist Curl",
    "Wrist Roller",
    "Dead Hang",
    "Plate Pinch"
   ],
   "note": "Bu hareketler için büyüme çalışması yok; yalnızca mantıklı bir tahmin."
  }
 ],
 "Quadriceps": [
  {
   "level": "güçlü",
   "ex": [
    "Leg Press",
    "Tek Bacak Leg Press",
    "Leg Extension",
    "Back Squat",
    "High-Bar Squat"
   ],
   "note": "Düzgün ölçümlü çalışmalarda ön uyluğu benzer büyüttüler; leg extension ayrıca rectus femoris'te en iyisi."
  },
  {
   "level": "orta",
   "ex": [
    "Smith Machine Squat",
    "Front Squat",
    "Low-Bar Squat"
   ],
   "note": "Doğrudan çalışma az; back squat sonuçlarından ve benzer kas aktivasyonundan çıkarılıyor."
  },
  {
   "level": "zayıf",
   "ex": [
    "Bulgarian Split Squat",
    "Hack Squat",
    "Walking Lunge",
    "Forward Lunge",
    "Step-up",
    "Pistol Squat"
   ],
   "note": "Tek başına büyütme çalışması yok veya çok küçük; kas aktivasyonu ve modellemeye dayanıyor."
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
    "Lateral Lunge"
   ],
   "note": "Hiç çalışma yok; benzer hareketlere bakılarak tahmin edildi."
  }
 ],
 "Hamstring": [
  {
   "level": "güçlü",
   "ex": [
    "Nordic Curl"
   ],
   "note": "Birden fazla bağımsız çalışmada tüm arka uyluğu büyüttü"
  },
  {
   "level": "orta",
   "ex": [
    "Seated Leg Curl"
   ],
   "note": "Diğer curl ve Nordic'ten fazla büyüttü; ama çalışma sayısı az ve küçük"
  },
  {
   "level": "orta",
   "ex": [
    "Lying Leg Curl",
    "Standing Leg Curl",
    "Romanian Deadlift",
    "Dumbbell Romanian Deadlift",
    "Tek Bacak RDL",
    "Stiff-Leg Deadlift",
    "Back Extension (Hiperekstansiyon)"
   ],
   "note": "Arka uyluğu büyüttüğü ölçüldü; birbirine üstünlük gösterilmedi (bir kısmı benzer harekete dayalı çıkarım)"
  },
  {
   "level": "zayıf",
   "ex": [
    "Glute-Ham Raise",
    "Good Morning",
    "Deadlift",
    "Kettlebell Swing"
   ],
   "note": "Sadece kas aktivitesi ölçümü var; büyüme çalışması yok"
  },
  {
   "level": "yok",
   "ex": [
    "Reverse Hyperextension",
    "Cable Pull-through"
   ],
   "note": "Doğrudan veri yok; benzer harekete bakılarak tahmin edildi"
  }
 ],
 "Kalça": [
  {
   "level": "orta",
   "ex": [
    "Back Squat",
    "Hip Thrust (Barbell)"
   ],
   "note": "İkisi de kalçayı kanıtlı büyütür; paralel squat ile hip thrust bir çalışmada eşit çıktı."
  },
  {
   "level": "orta",
   "ex": [
    "High-Bar Squat",
    "Low-Bar Squat",
    "Hip Thrust Makinesi",
    "Cable Kickback (Kalça)",
    "Leg Press",
    "Tek Bacak Leg Press"
   ],
   "note": "Doğrudan ölçüm var ama tek çalışma ya da squat/hip thrust'tan çıkarım; çok iyi ama daha az kanıtlı."
  },
  {
   "level": "orta",
   "ex": [
    "Hip Abduction Makinesi"
   ],
   "note": "Üst kalçayı ve yan kalçayı biraz büyütür; genel kalça için ekstansiyondan az."
  },
  {
   "level": "zayıf",
   "ex": [
    "Glute Bridge",
    "Tek Bacak Glute Bridge",
    "Bulgarian Split Squat",
    "Walking Lunge",
    "Reverse Lunge",
    "Forward Lunge",
    "Step-up",
    "Tek Bacak RDL",
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
    "Air Squat (Vücut Ağırlığı)",
    "Lateral Lunge",
    "Deadlift",
    "Trap Bar Deadlift",
    "Sumo Deadlift",
    "Back Extension (Hiperekstansiyon)",
    "Reverse Hyperextension",
    "Good Morning",
    "Kettlebell Swing",
    "Rack Pull",
    "Power Clean",
    "Hang Clean",
    "Clean and Jerk",
    "Snatch",
    "Power Snatch",
    "Thruster"
   ],
   "note": "Kalçayı çalıştırdığı kas ölçümlerinden biliniyor; büyüme çalışması yok, gerisi çıkarım."
  }
 ],
 "İç Bacak": [
  {
   "level": "orta",
   "ex": [
    "Back Squat",
    "Leg Press"
   ],
   "note": "İki küçük MRI çalışmasında iç bacak hacmi arttı; tam derinlikte çömelmek önemli"
  },
  {
   "level": "zayıf",
   "ex": [
    "Lateral Lunge",
    "Tek Bacak Leg Press",
    "High-Bar Squat",
    "Low-Bar Squat",
    "Front Squat",
    "Goblet Squat",
    "Zercher Squat",
    "Smith Machine Squat",
    "Hack Squat",
    "Pendulum Squat",
    "Belt Squat",
    "Hip Adduction Makinesi"
   ],
   "note": "Tek çalışma veya benzer harekete bakarak çıkarım; aralarında üstünlük gösterilmedi"
  }
 ],
 "Baldır": [
  {
   "level": "orta",
   "ex": [
    "Standing Calf Raise",
    "Leg Press Calf Raise",
    "Smith Machine Calf Raise",
    "Tek Bacak Calf Raise"
   ],
   "note": "Dizi düz yapılan calf raise'ler tüm baldırı büyütür; kendi aralarında karşılaştırma yok"
  },
  {
   "level": "orta",
   "ex": [
    "Seated Calf Raise"
   ],
   "note": "Yalnız alttaki soleus kasını büyütür; üst baldırı (gastrocnemius) neredeyse hiç"
  },
  {
   "level": "zayıf",
   "ex": [
    "Donkey Calf Raise"
   ],
   "note": "Diz düz olduğu için aynı etki beklenir ama doğrudan çalışma yok"
  }
 ],
 "Karın": [
  {
   "level": "orta",
   "ex": [
    "Crunch"
   ],
   "note": "Crunch/curl-up tipi programlarda karın kalınlığı arttı; tek kontrollü çalışma, etki küçük"
  },
  {
   "level": "zayıf",
   "ex": [
    "Mekik (Sit-up)",
    "Cable Crunch",
    "Machine Crunch",
    "Reverse Crunch",
    "Hanging Leg Raise",
    "Hanging Knee Raise",
    "Ab Wheel Rollout"
   ],
   "note": "Kas aktivitesi yüksek ama büyüme ölçen çalışma yok; aralarında fark gösterilmedi"
  },
  {
   "level": "zayıf",
   "ex": [
    "Lying Leg Raise",
    "Plank"
   ],
   "note": "Daha düşük destekli; plank programları kontrole üstünlük sağlamadı"
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
    "Mountain Climber"
   ],
   "note": "Doğrudan veri yok; benzer hareketlerden tahmin edildi"
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
    "Farmer's Walk"
   ],
   "note": "Ölçümlerde obliği yüksek çalıştırıyor ama büyüme karşılaştırması yok; birbirinden ayrılamaz"
  },
  {
   "level": "yok",
   "ex": [
    "Pallof Press",
    "Russian Twist",
    "Bicycle Crunch",
    "Captain's Chair Leg Raise"
   ],
   "note": "Doğrudan ölçüm yok; mantıkla obliği çalıştırdığı düşünülüyor"
  }
 ],
 "Rotator Manşet": [
  {
   "level": "zayıf",
   "ex": [
    "Dumbbell External Rotation (Yan Yatarak)",
    "Cable External Rotation"
   ],
   "note": "İki dış rotasyon hareketi arasında fark gösterilmedi; büyüme verisi küçük ve koşula bağlı."
  },
  {
   "level": "yok",
   "ex": [
    "Cuban Press",
    "Face Pull"
   ],
   "note": "Bu hareketler için çalışma yok; değerler dış rotasyon benzerliğinden tahmin edildi."
  }
 ]
};
export const SUMMARY: Record<string, string> = {
 "Göğüs": "Tek bir en iyi göğüs egzersizi yok: bench, şınav ve makineler benzer sonuç veriyor. Eğim üst göğüse hafif katkı verebilir; fly ve kablo hareketleri için büyüme verisi yok.",
 "Lat": "Lat için tek bir en iyi hareket yok: egzersizleri karşılaştıran büyüme çalışması bulunmadı. Barfiks, pulldown ve row eşit sayılır; kavrama genişliği önemli değil.",
 "Trapez": "Trapez büyümesini hareketler arasında kıyaslayan çalışma yok. Shrug ve upright row üst trapez için en iyi destekli; row'lar orta-alt trapezi çalıştırır. Hepsi kas aktivitesi ve çıkarıma dayanıyor.",
 "Bel": "Bel kasının büyümesini hareketler arasında kıyaslayan çalışma yok. Ağırlıklar EMG ve mekaniğe dayanan çıkarımdır; deadlift ve back extension türleri eşit iyi sayılır.",
 "Ön Omuz": "Ön omuz için en iyi tek hareket belli değil. Tek doğrudan veri bench press; omuz presleri ve front raise'in büyümesi ölçülmedi. Presler ve eğimli itişler makul seçim; bench yapıyorsan ek pres azalan getiri verir.",
 "Yan Omuz": "Yan omuz büyümesi için veri yalnızca lateral raise ailesinde var (dambıl, kablo, makine); aralarında sıralanacak fark yok. Presler yan omuzu çalıştırır ama büyüttüğü ölçülmedi.",
 "Arka Omuz": "Arka omuz için büyüme çalışması yok; kanıt EMG'ye dayanıyor. Reverse pec deck ve arka omuz fly hareketleri ana seçenek; kürekler yardımcı. Aralarında tek en iyi yok.",
 "Biceps": "Tek bir en iyi biceps hareketi yok: incline, preacher, kablo ve dumbbell curl'ler eşit büyütüyor. Çekişler yarım set sayılır. Hammer ve ters curl'de pay önkola kayar.",
 "Triceps": "Kolu yukarıda yapılan overhead extension en iyi desteklenen seçenek; pushdown ve skull crusher da iyi. Bench ve şınav triceps'i büyütür ama izole hareketlerden az. En iyi: bir itme hareketi + bir overhead.",
 "Önkol": "Önkol üç bölge: bilek bükenler (en net kanıt Wrist Curl), üst-dış kas (tüm curl'ler büyütür; Hammer'ın üstünlüğü gösterilmedi), ekstansörler (veri yok). Tek en iyi hareket yok.",
 "Quadriceps": "Tek bir en iyi hareket yok: leg press, squat ve leg extension ön uyluğu benzer büyütür. Rectus femoris için leg extension şart; tam gelişim için bir çok eklemli hareket ve leg extension birlikte seçilmeli.",
 "Hamstring": "Tek bir kesin en iyi yok. Nordic en sağlam kanıtlı; oturarak leg curl umut verici. Tam arka uyluk için bir diz bükme (curl) ve bir kalça menteşesi (RDL, back extension) birlikte mantıklı.",
 "Kalça": "Tek bir en iyi kalça hareketi yok: paralel squat ve hip thrust kalçayı benzer büyüttü. Squat'ta derine inmek önemli. Ekstansiyon alt, abdüksiyon üst kalçayı daha çok çalıştırır.",
 "İç Bacak": "Tek bir en iyi hareket yok: tam derinlik squat ve leg press iç bacağı büyüttü. İç bacak makinesi için büyüme çalışması yok. Ağırlıkların çoğu çıkarımdır.",
 "Baldır": "Tek bir en iyi hareket yok: dizi düz yapılan calf raise'ler eşit derecede iyi. Oturarak yapılan yalnız soleus'u çalıştırır; leg curl'ler yardımcıdır. Tibialis Raise baldır değildir.",
 "Karın": "Karın hareketlerini kıyaslayan büyüme çalışması yok, tek bir en iyi hareket denemez. En iyi destek crunch tipi hareketlerde; yük eklenebilen seçenekler ilerlemeyi kolaylaştırır.",
 "Oblik": "Oblik büyümesini karşılaştıran çalışma yok; tek bir en iyi hareket belli değil. Side plank, yan eğilme, kablo rotasyonu ve asılı bacak kaldırma kas ölçümlerinde yüksek, ama kanıt zayıf.",
 "Rotator Manşet": "Rotator manşet için tek en iyi hareket yok: yan yatarak dambıl ve kablo dış rotasyon eşit. Büyüme kanıtı küçük ve zayıf; diğer hareketler yalnızca tahmini yardımcıdır."
};
export const INFERENCE: Record<string, string[]> = {"Göğüs":["Decline Dumbbell Press","Smith Machine Incline Press","Incline Dumbbell Press","Incline Chest Press Makinesi","Low-to-High Cable Fly","High-to-Low Cable Fly","Dips (Göğüs)","Incline Şınav","Decline Şınav","Dumbbell Pullover","Landmine Press","Svend Press","Floor Press"],"Lat":["Ağırlıklı Barfiks","Asistanlı Barfiks Makinesi","Pendlay Row","T-Bar Row","Meadows Row","Seal Row","Machine Row","Muscle-up","Tek Kol Lat Pulldown","Barbell Row","Dumbbell Row (Tek Kol)","Seated Cable Row","Chest-Supported Row","Inverted Row"],"Trapez":["Pendlay Row","T-Bar Row","Machine Row","Inverted Row","Meadows Row","Cable Lateral Raise","Machine Lateral Raise","Reverse Pec Deck","Cable Rear Delt Fly","Face Pull","Clean and Jerk","Clean & Press","Rack Pull","Trap Bar Deadlift","Farmer's Walk","Cuban Press","Kettlebell Goblet Clean","Overhead Press (Barbell)","Seated Dumbbell Shoulder Press","Standing Dumbbell Press","Arnold Press","Machine Shoulder Press","Smith Machine Shoulder Press","Push Press","Landmine Shoulder Press","Handstand Push-up","Sled Pull","Thruster","Man Maker","Plate Pinch","Wrist Roller","Dead Hang"],"Bel":["Deadlift","Back Extension (Hiperekstansiyon)","Reverse Hyperextension","Rack Pull","Good Morning","Sumo Deadlift","Trap Bar Deadlift","Romanian Deadlift","Stiff-Leg Deadlift","Dumbbell Romanian Deadlift","Kettlebell Swing","Tek Bacak RDL","Superman","Back Squat","High-Bar Squat","Low-Bar Squat","Box Squat","Front Squat","Zercher Squat","Power Clean","Hang Clean","Snatch","Power Snatch","Clean and Jerk","Hip Thrust (Barbell)","Cable Pull-through","Glute-Ham Raise","Barbell Row","Pendlay Row","T-Bar Row","Meadows Row","Bird Dog","Farmer's Walk","Sled Pull","Sled Push"],"Ön Omuz":["Arnold Press","Push Press","Landmine Shoulder Press","Plate Front Raise","Cable Front Raise","Handstand Push-up","Smith Machine Incline Press","Incline Chest Press Makinesi","Incline Dumbbell Fly","Cable Crossover","Low-to-High Cable Fly","High-to-Low Cable Fly","Dips (Göğüs)","Şınav (Push-up)","Incline Şınav","Decline Şınav","Landmine Press","Svend Press","Floor Press","Close-Grip Bench Press","Dips (Triceps)","Bench Dips","JM Press","Diamond Şınav","Power Clean","Hang Clean","Clean and Jerk","Snatch","Power Snatch","Thruster","Clean & Press","Kettlebell Goblet Clean","Wall Ball","Cable Lateral Raise","Machine Lateral Raise","Y-Raise","Cuban Press","Man Maker","Burpee","Muscle-up"],"Yan Omuz":["Upright Row","Overhead Press (Barbell)","Seated Dumbbell Shoulder Press","Standing Dumbbell Press","Arnold Press","Machine Shoulder Press","Smith Machine Shoulder Press","Push Press","Handstand Push-up","Y-Raise","Cuban Press","Landmine Shoulder Press","Reverse Pec Deck","Rear Delt Fly (Dumbbell)","Cable Rear Delt Fly","Face Pull","Front Raise (Dumbbell)","Plate Front Raise","Cable Front Raise","Clean & Press","Thruster","Man Maker","Clean and Jerk","Snatch","Power Snatch","Seated Cable Row"],"Arka Omuz":["Reverse Pec Deck","Rear Delt Fly (Dumbbell)","Cable Rear Delt Fly","Face Pull","Chest-Supported Row","Seal Row","Seated Cable Row","Machine Row","Barbell Row","Pendlay Row","T-Bar Row","Inverted Row","Meadows Row","Y-Raise","Dumbbell Row (Tek Kol)","Barfiks (Pull-up)","Ağırlıklı Barfiks","Asistanlı Barfiks Makinesi","Lat Pulldown (Geniş)","Lat Pulldown (Dar / V-Bar)","Chin-up","Tek Kol Lat Pulldown","Muscle-up","Straight-Arm Pulldown","Dumbbell External Rotation (Yan Yatarak)","Cuban Press","Lateral Raise (Dumbbell)","Cable Lateral Raise","Machine Lateral Raise","Upright Row","Cable External Rotation"],"Biceps":["Machine Preacher Curl","Cable Curl","EZ-Bar Curl","Alternating Dumbbell Curl","Concentration Curl","Spider Curl","Drag Curl","21'ler","Zottman Curl","Hammer Curl","Cable Hammer Curl (Halat)","Reverse Curl","Chin-up","Ağırlıklı Barfiks","Asistanlı Barfiks Makinesi","Tek Kol Lat Pulldown","Seated Cable Row","Barbell Row","Pendlay Row","T-Bar Row","Chest-Supported Row","Seal Row","Machine Row","Meadows Row","Inverted Row","Muscle-up","Straight-Arm Pulldown"],"Triceps":["Triceps Pushdown (Bar)","Overhead Dumbbell Extension","Dumbbell Skull Crusher","Machine Triceps Extension","Triceps Kickback","Cable Kickback (Triceps)","Close-Grip Bench Press","JM Press","Dips (Triceps)","Bench Dips","Diamond Şınav","Incline Bench Press","Incline Dumbbell Press","Decline Bench Press","Decline Dumbbell Press","Smith Machine Incline Press","Chest Press Makinesi","Incline Chest Press Makinesi","Incline Şınav","Decline Şınav","Landmine Press","Svend Press","Floor Press","Overhead Press (Barbell)","Seated Dumbbell Shoulder Press","Standing Dumbbell Press","Arnold Press","Machine Shoulder Press","Smith Machine Shoulder Press","Push Press","Landmine Shoulder Press","Handstand Push-up","Thruster","Wall Ball","Clean & Press","Clean and Jerk","Man Maker","Muscle-up","Burpee","Dumbbell Pullover","Dumbbell Pullover (Sırt)","Straight-Arm Pulldown"],"Önkol":["Reverse Wrist Curl","Wrist Roller","Farmer's Walk","Dead Hang","Plate Pinch","Barbell Curl","EZ-Bar Curl","Dumbbell Curl","Alternating Dumbbell Curl","Machine Preacher Curl","Concentration Curl","Cable Curl","Bayesian Cable Curl","Spider Curl","Drag Curl","21'ler","Hammer Curl","Cable Hammer Curl (Halat)","Reverse Curl","Zottman Curl","Deadlift","Sumo Deadlift","Trap Bar Deadlift","Rack Pull","Barbell Shrug","Dumbbell Shrug","Barfiks (Pull-up)","Chin-up","Ağırlıklı Barfiks","Barbell Row","Pendlay Row","Dumbbell Row (Tek Kol)","T-Bar Row","Romanian Deadlift","Dumbbell Romanian Deadlift","Stiff-Leg Deadlift","Tek Bacak RDL","Hanging Leg Raise","Hanging Knee Raise","Muscle-up","Power Clean","Hang Clean","Sled Pull","Kettlebell Swing","Inverted Row","Lat Pulldown (Geniş)","Lat Pulldown (Dar / V-Bar)","Seated Cable Row"],"Quadriceps":["Low-Bar Squat","Box Squat","Goblet Squat","Zercher Squat","Pendulum Squat","Belt Squat","Reverse Lunge","Lateral Lunge","Sissy Squat","Pistol Squat","Step-up","Wall Sit","Bulgarian Split Squat","Hack Squat","Deadlift","Sumo Deadlift","Trap Bar Deadlift","Rack Pull","Power Clean","Hang Clean","Clean and Jerk","Snatch","Power Snatch","Thruster","Clean & Press","Kettlebell Goblet Clean","Wall Ball","Sled Push","Box Jump","Hip Thrust (Barbell)","Hip Thrust Makinesi","Kettlebell Swing"],"Hamstring":["Standing Leg Curl","Dumbbell Romanian Deadlift","Tek Bacak RDL","Glute-Ham Raise","Good Morning","Cable Pull-through","Reverse Hyperextension","Deadlift","Sumo Deadlift","Trap Bar Deadlift","Rack Pull","Hip Thrust Makinesi","Glute Bridge","Frog Pump","Cable Kickback (Kalça)","Bulgarian Split Squat","Walking Lunge","Reverse Lunge","Forward Lunge","Lateral Lunge","Step-up","Pistol Squat","Superman","Power Clean","Hang Clean","Clean and Jerk","Snatch","Power Snatch","Clean & Press","Kettlebell Goblet Clean","Romanian Deadlift","Stiff-Leg Deadlift","Hip Abduction Makinesi","Tek Bacak Glute Bridge"],"Kalça":["High-Bar Squat","Low-Bar Squat","Hip Thrust Makinesi","Tek Bacak Glute Bridge","Glute Bridge","Bulgarian Split Squat","Walking Lunge","Reverse Lunge","Forward Lunge","Step-up","Tek Bacak RDL","Front Squat","Goblet Squat","Belt Squat","Smith Machine Squat","Box Squat","Zercher Squat","Pistol Squat","Romanian Deadlift","Dumbbell Romanian Deadlift","Stiff-Leg Deadlift","Frog Pump","Cable Pull-through","Tek Bacak Leg Press","Hack Squat","Pendulum Squat","Air Squat (Vücut Ağırlığı)","Lateral Lunge","Deadlift","Trap Bar Deadlift","Sumo Deadlift","Back Extension (Hiperekstansiyon)","Reverse Hyperextension","Good Morning","Kettlebell Swing","Rack Pull","Power Clean","Hang Clean","Clean and Jerk","Snatch","Power Snatch","Thruster","Clean & Press","Kettlebell Goblet Clean","Wall Ball","Wall Sit","Superman","Glute-Ham Raise","Nordic Curl"],"İç Bacak":["High-Bar Squat","Low-Bar Squat","Front Squat","Goblet Squat","Zercher Squat","Smith Machine Squat","Hack Squat","Pendulum Squat","Belt Squat","Box Squat","Air Squat (Vücut Ağırlığı)","Wall Sit","Tek Bacak Leg Press","Lateral Lunge","Bulgarian Split Squat","Walking Lunge","Reverse Lunge","Forward Lunge","Step-up","Pistol Squat","Sumo Deadlift","Deadlift","Trap Bar Deadlift","Romanian Deadlift","Dumbbell Romanian Deadlift","Tek Bacak RDL","Stiff-Leg Deadlift","Good Morning","Hip Thrust (Barbell)","Hip Thrust Makinesi","Glute Bridge","Kettlebell Swing","Cable Pull-through","Hip Adduction Makinesi","Hip Abduction Makinesi"],"Baldır":["Tek Bacak Calf Raise","Donkey Calf Raise","Seated Calf Raise","Lying Leg Curl","Standing Leg Curl","Seated Leg Curl","Nordic Curl","Glute-Ham Raise","Box Jump","Sled Push"],"Karın":["Decline Sit-up","Captain's Chair Leg Raise","Dragon Flag","V-Up","Bicycle Crunch","Hollow Body Hold","L-Sit","Mountain Climber","Dead Bug","Russian Twist","Cable Woodchopper","Pallof Press","Side Bend (Dumbbell)","Back Squat","Front Squat","High-Bar Squat","Low-Bar Squat","Deadlift","Sumo Deadlift","Trap Bar Deadlift","Overhead Press (Barbell)","Standing Dumbbell Press","Cable Crunch","Machine Crunch","Mekik (Sit-up)"],"Oblik":["Side Bend (Dumbbell)","Cable Woodchopper","Pallof Press","Russian Twist","Bicycle Crunch","Captain's Chair Leg Raise","Decline Sit-up","Farmer's Walk"],"Rotator Manşet":["Cuban Press","Face Pull","Y-Raise","Lateral Raise (Dumbbell)","Cable Lateral Raise","Machine Lateral Raise","Rear Delt Fly (Dumbbell)","Reverse Pec Deck","Cable Rear Delt Fly","Overhead Press (Barbell)","Seated Dumbbell Shoulder Press","Standing Dumbbell Press","Arnold Press","Machine Shoulder Press","Smith Machine Shoulder Press","Push Press","Landmine Shoulder Press","Seated Cable Row","Barbell Row","Pendlay Row","Dumbbell Row (Tek Kol)","T-Bar Row","Chest-Supported Row","Seal Row","Machine Row","Meadows Row","Bench Press (Barbell)","Dumbbell Bench Press","Şınav (Push-up)","Barfiks (Pull-up)","Chin-up"]};
