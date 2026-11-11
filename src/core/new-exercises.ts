// Mechanical inference; coefficients are not measured evidence.
export interface NewExercise { name: string; group: string; need: string[]; w: Record<string, number>; stretch: string[] }
export const NEW_EXERCISES: NewExercise[] = [
  {
    "name": "Banded Squat",
    "group": "Bacak (Ön)",
    "need": [
      "band"
    ],
    "w": {
      "Quadriceps": 1,
      "Kalça": 0.6,
      "Hamstring": 0.3,
      "Karın": 0.2,
      "İç Bacak": 0.2
    },
    "stretch": []
  },
  {
    "name": "Band Row",
    "group": "Sırt",
    "need": [
      "band"
    ],
    "w": {
      "Lat": 1,
      "Trapez": 0.7,
      "Biceps": 0.5,
      "Arka Omuz": 0.5,
      "Önkol": 0.2
    },
    "stretch": []
  },
  {
    "name": "Band Curl",
    "group": "Biceps",
    "need": [
      "band"
    ],
    "w": {
      "Biceps": 1,
      "Önkol": 0.3
    },
    "stretch": []
  },
  {
    "name": "Band Triceps Pushdown",
    "group": "Triceps",
    "need": [
      "band"
    ],
    "w": {
      "Triceps": 1,
      "Önkol": 0.2
    },
    "stretch": []
  },
  {
    "name": "Band Lateral Raise",
    "group": "Omuz",
    "need": [
      "band"
    ],
    "w": {
      "Yan Omuz": 1,
      "Trapez": 0.3,
      "Ön Omuz": 0.2
    },
    "stretch": []
  },
  {
    "name": "Band Face Pull",
    "group": "Omuz",
    "need": [
      "band"
    ],
    "w": {
      "Arka Omuz": 1,
      "Trapez": 0.5,
      "Rotator Manşet": 0.4,
      "Biceps": 0.2
    },
    "stretch": []
  },
  {
    "name": "Band Good Morning",
    "group": "Arka Bacak & Kalça",
    "need": [
      "band"
    ],
    "w": {
      "Hamstring": 1,
      "Kalça": 0.8,
      "Bel": 0.5
    },
    "stretch": [
      "Hamstring"
    ]
  },
  {
    "name": "Banded Push-up",
    "group": "Göğüs",
    "need": [
      "band"
    ],
    "w": {
      "Göğüs": 1,
      "Triceps": 0.6,
      "Ön Omuz": 0.5,
      "Karın": 0.3
    },
    "stretch": []
  },
  {
    "name": "Band Overhead Press",
    "group": "Omuz",
    "need": [
      "band"
    ],
    "w": {
      "Ön Omuz": 1,
      "Triceps": 0.5,
      "Yan Omuz": 0.4,
      "Karın": 0.2
    },
    "stretch": []
  },
  {
    "name": "Band Deadlift",
    "group": "Arka Bacak & Kalça",
    "need": [
      "band"
    ],
    "w": {
      "Kalça": 1,
      "Hamstring": 0.6,
      "Bel": 0.5,
      "Quadriceps": 0.5,
      "Trapez": 0.3
    },
    "stretch": []
  },
  {
    "name": "Band Monster Walk",
    "group": "Arka Bacak & Kalça",
    "need": [
      "band"
    ],
    "w": {
      "Kalça": 1,
      "Quadriceps": 0.3,
      "Baldır": 0.2,
      "İç Bacak": 0.2
    },
    "stretch": []
  },
  {
    "name": "Band Chest Fly",
    "group": "Göğüs",
    "need": [
      "band"
    ],
    "w": {
      "Göğüs": 1,
      "Ön Omuz": 0.4
    },
    "stretch": []
  },
  {
    "name": "Band-Assisted Pull-up",
    "group": "Sırt",
    "need": [
      "band",
      "pullup_bar"
    ],
    "w": {
      "Lat": 1,
      "Biceps": 0.6,
      "Trapez": 0.4,
      "Karın": 0.2,
      "Önkol": 0.2
    },
    "stretch": []
  },
  {
    "name": "Band Romanian Deadlift",
    "group": "Arka Bacak & Kalça",
    "need": [
      "band"
    ],
    "w": {
      "Hamstring": 1,
      "Kalça": 0.8,
      "Bel": 0.6
    },
    "stretch": [
      "Hamstring",
      "Kalça"
    ]
  },
  {
    "name": "Band Front Raise",
    "group": "Omuz",
    "need": [
      "band"
    ],
    "w": {
      "Ön Omuz": 1,
      "Yan Omuz": 0.3,
      "Trapez": 0.2
    },
    "stretch": []
  },
  {
    "name": "Band Rear Delt Fly",
    "group": "Omuz",
    "need": [
      "band"
    ],
    "w": {
      "Arka Omuz": 1,
      "Trapez": 0.4,
      "Rotator Manşet": 0.3
    },
    "stretch": []
  },
  {
    "name": "Band Overhead Triceps Extension",
    "group": "Triceps",
    "need": [
      "band"
    ],
    "w": {
      "Triceps": 1,
      "Ön Omuz": 0.2
    },
    "stretch": [
      "Triceps"
    ]
  },
  {
    "name": "TRX Row",
    "group": "Sırt",
    "need": [
      "rings_trx"
    ],
    "w": {
      "Lat": 0.8,
      "Trapez": 0.7,
      "Biceps": 0.5,
      "Arka Omuz": 0.5,
      "Önkol": 0.2,
      "Karın": 0.2
    },
    "stretch": []
  },
  {
    "name": "TRX Push-up",
    "group": "Göğüs",
    "need": [
      "rings_trx"
    ],
    "w": {
      "Göğüs": 1,
      "Triceps": 0.6,
      "Ön Omuz": 0.5,
      "Karın": 0.4
    },
    "stretch": []
  },
  {
    "name": "TRX Fallout",
    "group": "Karın & Core",
    "need": [
      "rings_trx"
    ],
    "w": {
      "Karın": 1,
      "Oblik": 0.4,
      "Lat": 0.4,
      "Ön Omuz": 0.3
    },
    "stretch": []
  },
  {
    "name": "TRX Pike",
    "group": "Karın & Core",
    "need": [
      "rings_trx"
    ],
    "w": {
      "Karın": 1,
      "Oblik": 0.4,
      "Ön Omuz": 0.3
    },
    "stretch": []
  },
  {
    "name": "TRX Hamstring Curl",
    "group": "Arka Bacak & Kalça",
    "need": [
      "rings_trx"
    ],
    "w": {
      "Hamstring": 1,
      "Kalça": 0.5,
      "Baldır": 0.3,
      "Karın": 0.3
    },
    "stretch": [
      "Hamstring"
    ]
  },
  {
    "name": "Ring Dip",
    "group": "Göğüs",
    "need": [
      "rings_trx"
    ],
    "w": {
      "Göğüs": 1,
      "Triceps": 0.8,
      "Ön Omuz": 0.5
    },
    "stretch": [
      "Göğüs"
    ]
  },
  {
    "name": "TRX Y-Raise",
    "group": "Omuz",
    "need": [
      "rings_trx"
    ],
    "w": {
      "Trapez": 1,
      "Yan Omuz": 0.6,
      "Arka Omuz": 0.5,
      "Rotator Manşet": 0.3
    },
    "stretch": []
  },
  {
    "name": "TRX Face Pull",
    "group": "Omuz",
    "need": [
      "rings_trx"
    ],
    "w": {
      "Arka Omuz": 1,
      "Trapez": 0.5,
      "Rotator Manşet": 0.4
    },
    "stretch": []
  },
  {
    "name": "TRX Knee Tuck",
    "group": "Karın & Core",
    "need": [
      "rings_trx"
    ],
    "w": {
      "Karın": 1,
      "Oblik": 0.4,
      "Kalça": 0.3
    },
    "stretch": []
  },
  {
    "name": "Band-Resisted Ab Wheel Rollout",
    "group": "Karın & Core",
    "need": [
      "ab_wheel",
      "band"
    ],
    "w": {
      "Karın": 1,
      "Oblik": 0.4,
      "Lat": 0.4,
      "Ön Omuz": 0.3
    },
    "stretch": []
  },
  {
    "name": "Stability Ball Leg Curl",
    "group": "Arka Bacak & Kalça",
    "need": [
      "ball"
    ],
    "w": {
      "Hamstring": 1,
      "Kalça": 0.5,
      "Baldır": 0.3,
      "Karın": 0.3
    },
    "stretch": [
      "Hamstring"
    ]
  },
  {
    "name": "Stability Ball Crunch",
    "group": "Karın & Core",
    "need": [
      "ball"
    ],
    "w": {
      "Karın": 1,
      "Oblik": 0.3
    },
    "stretch": []
  },
  {
    "name": "Stability Ball Pike",
    "group": "Karın & Core",
    "need": [
      "ball"
    ],
    "w": {
      "Karın": 1,
      "Oblik": 0.4,
      "Ön Omuz": 0.3
    },
    "stretch": []
  },
  {
    "name": "Stability Ball Pass",
    "group": "Karın & Core",
    "need": [
      "ball"
    ],
    "w": {
      "Karın": 1,
      "Oblik": 0.4,
      "Kalça": 0.2
    },
    "stretch": []
  },
  {
    "name": "Stability Ball Knee Tuck",
    "group": "Karın & Core",
    "need": [
      "ball"
    ],
    "w": {
      "Karın": 1,
      "Oblik": 0.4,
      "Kalça": 0.3
    },
    "stretch": []
  },
  {
    "name": "Box Step-down",
    "group": "Bacak (Ön)",
    "need": [
      "box"
    ],
    "w": {
      "Quadriceps": 1,
      "Kalça": 0.5,
      "Hamstring": 0.2,
      "Baldır": 0.2
    },
    "stretch": []
  },
  {
    "name": "Box Lateral Step-up",
    "group": "Bacak (Ön)",
    "need": [
      "box"
    ],
    "w": {
      "Quadriceps": 0.8,
      "Kalça": 0.8,
      "İç Bacak": 0.3,
      "Baldır": 0.2
    },
    "stretch": []
  },
  {
    "name": "Depth Jump",
    "group": "Tüm Vücut & Olimpik",
    "need": [
      "box"
    ],
    "w": {
      "Quadriceps": 1,
      "Kalça": 0.6,
      "Baldır": 0.6,
      "Hamstring": 0.3
    },
    "stretch": []
  },
  {
    "name": "Box Jump Over",
    "group": "Tüm Vücut & Olimpik",
    "need": [
      "box"
    ],
    "w": {
      "Quadriceps": 1,
      "Kalça": 0.6,
      "Baldır": 0.5,
      "Karın": 0.2
    },
    "stretch": []
  },
  {
    "name": "Negative Pull-up",
    "group": "Sırt",
    "need": [
      "pullup_bar"
    ],
    "w": {
      "Lat": 1,
      "Biceps": 0.6,
      "Trapez": 0.4,
      "Önkol": 0.2
    },
    "stretch": []
  },
  {
    "name": "Scapular Pull-up",
    "group": "Sırt",
    "need": [
      "pullup_bar"
    ],
    "w": {
      "Trapez": 1,
      "Lat": 0.8,
      "Arka Omuz": 0.3
    },
    "stretch": []
  },
  {
    "name": "Archer Pull-up",
    "group": "Sırt",
    "need": [
      "pullup_bar"
    ],
    "w": {
      "Lat": 1,
      "Biceps": 0.6,
      "Trapez": 0.4,
      "Karın": 0.2
    },
    "stretch": []
  },
  {
    "name": "Commando Pull-up",
    "group": "Sırt",
    "need": [
      "pullup_bar"
    ],
    "w": {
      "Lat": 1,
      "Biceps": 0.6,
      "Oblik": 0.4,
      "Trapez": 0.3
    },
    "stretch": []
  },
  {
    "name": "Dip Bar Support Hold",
    "group": "Triceps",
    "need": [
      "dip_bars"
    ],
    "w": {
      "Triceps": 0.8,
      "Ön Omuz": 0.5,
      "Göğüs": 0.3,
      "Karın": 0.3
    },
    "stretch": []
  },
  {
    "name": "Slider Plank Reach",
    "group": "Karın & Core",
    "need": [
      "slider"
    ],
    "w": {
      "Karın": 1,
      "Oblik": 0.5,
      "Lat": 0.3,
      "Ön Omuz": 0.3
    },
    "stretch": []
  },
  {
    "name": "Slider Bodysaw",
    "group": "Karın & Core",
    "need": [
      "slider"
    ],
    "w": {
      "Karın": 1,
      "Oblik": 0.4,
      "Lat": 0.3,
      "Ön Omuz": 0.3
    },
    "stretch": []
  },
  {
    "name": "Slider Knee Tuck",
    "group": "Karın & Core",
    "need": [
      "slider"
    ],
    "w": {
      "Karın": 1,
      "Oblik": 0.4,
      "Kalça": 0.3
    },
    "stretch": []
  },
  {
    "name": "Slider Reverse Lunge",
    "group": "Bacak (Ön)",
    "need": [
      "slider"
    ],
    "w": {
      "Quadriceps": 1,
      "Kalça": 0.6,
      "Hamstring": 0.2
    },
    "stretch": []
  },
  {
    "name": "Med Ball Chest Pass",
    "group": "Göğüs",
    "need": [
      "medball"
    ],
    "w": {
      "Göğüs": 1,
      "Triceps": 0.6,
      "Ön Omuz": 0.5,
      "Karın": 0.2
    },
    "stretch": []
  },
  {
    "name": "Med Ball Overhead Throw",
    "group": "Tüm Vücut & Olimpik",
    "need": [
      "medball"
    ],
    "w": {
      "Ön Omuz": 1,
      "Triceps": 0.6,
      "Karın": 0.5,
      "Quadriceps": 0.3
    },
    "stretch": []
  },
  {
    "name": "Med Ball Rotational Throw",
    "group": "Karın & Core",
    "need": [
      "medball"
    ],
    "w": {
      "Oblik": 1,
      "Karın": 0.6,
      "Lat": 0.4,
      "Ön Omuz": 0.3
    },
    "stretch": []
  },
  {
    "name": "Med Ball Side Slam",
    "group": "Tüm Vücut & Olimpik",
    "need": [
      "medball"
    ],
    "w": {
      "Oblik": 1,
      "Karın": 0.6,
      "Lat": 0.4
    },
    "stretch": []
  },
  {
    "name": "Plate Halo",
    "group": "Omuz",
    "need": [
      "plate"
    ],
    "w": {
      "Yan Omuz": 0.8,
      "Ön Omuz": 0.8,
      "Trapez": 0.4,
      "Rotator Manşet": 0.3
    },
    "stretch": []
  },
  {
    "name": "Plate Curl",
    "group": "Biceps",
    "need": [
      "plate"
    ],
    "w": {
      "Biceps": 1,
      "Önkol": 0.3
    },
    "stretch": []
  },
  {
    "name": "Plate Overhead Triceps Extension",
    "group": "Triceps",
    "need": [
      "plate"
    ],
    "w": {
      "Triceps": 1,
      "Ön Omuz": 0.2
    },
    "stretch": [
      "Triceps"
    ]
  },
  {
    "name": "Plate Lateral Raise",
    "group": "Omuz",
    "need": [
      "plate"
    ],
    "w": {
      "Yan Omuz": 1,
      "Trapez": 0.3,
      "Ön Omuz": 0.2
    },
    "stretch": []
  },
  {
    "name": "Plate Squat",
    "group": "Bacak (Ön)",
    "need": [
      "plate"
    ],
    "w": {
      "Quadriceps": 1,
      "Kalça": 0.5,
      "Karın": 0.2
    },
    "stretch": []
  },
  {
    "name": "Pause Squat",
    "group": "Bacak (Ön)",
    "need": [
      "barbell",
      "rack"
    ],
    "w": {
      "Quadriceps": 1,
      "Kalça": 0.8,
      "İç Bacak": 0.5,
      "Bel": 0.35,
      "Karın": 0.2,
      "Hamstring": 0.15
    },
    "stretch": []
  },
  {
    "name": "Tempo Squat",
    "group": "Bacak (Ön)",
    "need": [
      "barbell",
      "rack"
    ],
    "w": {
      "Quadriceps": 1,
      "Kalça": 0.8,
      "İç Bacak": 0.5,
      "Bel": 0.35,
      "Karın": 0.2,
      "Hamstring": 0.15
    },
    "stretch": []
  },
  {
    "name": "Spanish Squat",
    "group": "Bacak (Ön)",
    "need": [
      "band"
    ],
    "w": {
      "Quadriceps": 1,
      "Kalça": 0.3,
      "Baldır": 0.15,
      "Karın": 0.1
    },
    "stretch": []
  },
  {
    "name": "Landmine Squat",
    "group": "Bacak (Ön)",
    "need": [
      "landmine",
      "barbell"
    ],
    "w": {
      "Quadriceps": 1,
      "Kalça": 0.6,
      "İç Bacak": 0.3,
      "Karın": 0.2,
      "Ön Omuz": 0.2
    },
    "stretch": []
  },
  {
    "name": "V-Squat",
    "group": "Bacak (Ön)",
    "need": [
      "machine"
    ],
    "w": {
      "Quadriceps": 1,
      "Kalça": 0.7,
      "İç Bacak": 0.4,
      "Baldır": 0.2
    },
    "stretch": []
  },
  {
    "name": "B-Stance RDL",
    "group": "Arka Bacak & Kalça",
    "need": [
      "dumbbell"
    ],
    "w": {
      "Hamstring": 0.9,
      "Kalça": 0.8,
      "Bel": 0.4,
      "İç Bacak": 0.2,
      "Önkol": 0.2
    },
    "stretch": [
      "Hamstring",
      "Kalça"
    ]
  },
  {
    "name": "Cable Romanian Deadlift",
    "group": "Arka Bacak & Kalça",
    "need": [
      "cable"
    ],
    "w": {
      "Hamstring": 0.8,
      "Kalça": 0.7,
      "Bel": 0.4,
      "İç Bacak": 0.2
    },
    "stretch": [
      "Hamstring",
      "Kalça"
    ]
  },
  {
    "name": "Barbell Glute Bridge",
    "group": "Arka Bacak & Kalça",
    "need": [
      "barbell"
    ],
    "w": {
      "Kalça": 1,
      "Hamstring": 0.5,
      "Bel": 0.3,
      "İç Bacak": 0.2
    },
    "stretch": []
  },
  {
    "name": "Single-Leg Hip Thrust",
    "group": "Arka Bacak & Kalça",
    "need": [
      "bench"
    ],
    "w": {
      "Kalça": 1,
      "Hamstring": 0.5,
      "Bel": 0.2,
      "Karın": 0.2,
      "İç Bacak": 0.2
    },
    "stretch": []
  },
  {
    "name": "Banded Hip Thrust",
    "group": "Arka Bacak & Kalça",
    "need": [
      "band",
      "bench"
    ],
    "w": {
      "Kalça": 0.9,
      "Hamstring": 0.4,
      "İç Bacak": 0.2,
      "Bel": 0.2
    },
    "stretch": []
  },
  {
    "name": "Single-Leg Leg Curl",
    "group": "Arka Bacak & Kalça",
    "need": [
      "machine"
    ],
    "w": {
      "Hamstring": 1,
      "Baldır": 0.25,
      "Kalça": 0.2
    },
    "stretch": []
  },
  {
    "name": "Snatch-Grip RDL",
    "group": "Arka Bacak & Kalça",
    "need": [
      "barbell"
    ],
    "w": {
      "Hamstring": 1,
      "Kalça": 0.8,
      "Bel": 0.5,
      "Trapez": 0.3,
      "İç Bacak": 0.2,
      "Önkol": 0.2
    },
    "stretch": [
      "Hamstring",
      "Kalça"
    ]
  },
  {
    "name": "Neutral-Grip Lat Pulldown",
    "group": "Sırt",
    "need": [
      "cable"
    ],
    "w": {
      "Lat": 1,
      "Biceps": 0.5,
      "Arka Omuz": 0.3,
      "Trapez": 0.25,
      "Önkol": 0.2
    },
    "stretch": []
  },
  {
    "name": "Renegade Row",
    "group": "Sırt",
    "need": [
      "dumbbell"
    ],
    "w": {
      "Lat": 0.8,
      "Trapez": 0.4,
      "Biceps": 0.3,
      "Önkol": 0.3,
      "Karın": 0.4,
      "Oblik": 0.4,
      "Kalça": 0.2
    },
    "stretch": []
  },
  {
    "name": "Z Press",
    "group": "Omuz",
    "need": [
      "barbell"
    ],
    "w": {
      "Ön Omuz": 0.9,
      "Yan Omuz": 0.4,
      "Triceps": 0.4,
      "Trapez": 0.3,
      "Karın": 0.3,
      "Oblik": 0.2,
      "Rotator Manşet": 0.2
    },
    "stretch": []
  },
  {
    "name": "Leaning Cable Lateral Raise",
    "group": "Omuz",
    "need": [
      "cable"
    ],
    "w": {
      "Yan Omuz": 1,
      "Trapez": 0.2,
      "Ön Omuz": 0.2,
      "Rotator Manşet": 0.1
    },
    "stretch": []
  },
  {
    "name": "Incline Hammer Curl",
    "group": "Biceps",
    "need": [
      "dumbbell",
      "bench"
    ],
    "w": {
      "Biceps": 0.8,
      "Önkol": 0.5
    },
    "stretch": [
      "Biceps"
    ]
  },
  {
    "name": "Preacher Hammer Curl",
    "group": "Biceps",
    "need": [
      "dumbbell",
      "preacher"
    ],
    "w": {
      "Biceps": 0.8,
      "Önkol": 0.6
    },
    "stretch": []
  },
  {
    "name": "Cable Preacher Curl",
    "group": "Biceps",
    "need": [
      "cable",
      "preacher"
    ],
    "w": {
      "Biceps": 0.95,
      "Önkol": 0.4
    },
    "stretch": []
  },
  {
    "name": "Tate Press",
    "group": "Triceps",
    "need": [
      "dumbbell",
      "bench"
    ],
    "w": {
      "Triceps": 1,
      "Göğüs": 0.2,
      "Ön Omuz": 0.2
    },
    "stretch": []
  },
  {
    "name": "Weighted Plank",
    "group": "Karın & Core",
    "need": [
      "plate"
    ],
    "w": {
      "Karın": 0.8,
      "Oblik": 0.5,
      "Bel": 0.3,
      "Ön Omuz": 0.2,
      "Kalça": 0.2
    },
    "stretch": []
  },
  {
    "name": "Hollow Rock",
    "group": "Karın & Core",
    "need": [],
    "w": {
      "Karın": 0.9,
      "Oblik": 0.4,
      "Quadriceps": 0.2,
      "Lat": 0.1
    },
    "stretch": []
  },
  {
    "name": "Stir the Pot",
    "group": "Karın & Core",
    "need": [
      "ball"
    ],
    "w": {
      "Karın": 0.8,
      "Oblik": 0.7,
      "Lat": 0.3,
      "Ön Omuz": 0.2,
      "Bel": 0.3
    },
    "stretch": []
  },
  {
    "name": "Clean",
    "group": "Tüm Vücut & Olimpik",
    "need": [
      "barbell"
    ],
    "w": {
      "Quadriceps": 0.8,
      "Kalça": 0.8,
      "Hamstring": 0.5,
      "Bel": 0.5,
      "Trapez": 0.5,
      "Ön Omuz": 0.4,
      "Yan Omuz": 0.3,
      "Önkol": 0.3,
      "Karın": 0.2
    },
    "stretch": []
  },
  {
    "name": "Broad Jump",
    "group": "Tüm Vücut & Olimpik",
    "need": [],
    "w": {
      "Quadriceps": 0.8,
      "Kalça": 0.8,
      "Hamstring": 0.5,
      "Baldır": 0.5,
      "Karın": 0.3
    },
    "stretch": []
  },
  {
    "name": "Wall Walk",
    "group": "Tüm Vücut & Olimpik",
    "need": [],
    "w": {
      "Ön Omuz": 0.8,
      "Yan Omuz": 0.4,
      "Triceps": 0.3,
      "Karın": 0.5,
      "Rotator Manşet": 0.4,
      "Trapez": 0.2
    },
    "stretch": []
  },
  {
    "name": "Dumbbell Floor Press",
    "group": "Göğüs",
    "need": [
      "dumbbell"
    ],
    "w": {
      "Göğüs": 0.9,
      "Triceps": 0.6,
      "Ön Omuz": 0.4,
      "Rotator Manşet": 0.1
    },
    "stretch": []
  },
  {
    "name": "Band Chest Press",
    "group": "Göğüs",
    "need": [
      "band"
    ],
    "w": {
      "Göğüs": 0.8,
      "Triceps": 0.5,
      "Ön Omuz": 0.4,
      "Rotator Manşet": 0.2
    },
    "stretch": []
  }
];
