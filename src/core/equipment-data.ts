// Reviewed minimum requirements; household supports are not purchases.
import type { EquipmentRequirement } from "./equipment.ts";
export const EQUIPMENT: Record<string, EquipmentRequirement> = {
  "Bench Press (Barbell)": {
    "need": [
      "barbell",
      "bench"
    ],
    "alt": []
  },
  "Dumbbell Bench Press": {
    "need": [
      "dumbbell",
      "bench"
    ],
    "alt": []
  },
  "Incline Bench Press": {
    "need": [
      "barbell",
      "bench"
    ],
    "alt": []
  },
  "Incline Dumbbell Press": {
    "need": [
      "dumbbell",
      "bench"
    ],
    "alt": []
  },
  "Decline Bench Press": {
    "need": [
      "barbell",
      "bench"
    ],
    "alt": []
  },
  "Decline Dumbbell Press": {
    "need": [
      "dumbbell",
      "bench"
    ],
    "alt": []
  },
  "Smith Machine Bench Press": {
    "need": [
      "smith",
      "bench"
    ],
    "alt": []
  },
  "Smith Machine Incline Press": {
    "need": [
      "smith",
      "bench"
    ],
    "alt": []
  },
  "Machine Chest Press": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Machine Incline Chest Press": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Dumbbell Fly": {
    "need": [
      "dumbbell",
      "bench"
    ],
    "alt": []
  },
  "Incline Dumbbell Fly": {
    "need": [
      "dumbbell",
      "bench"
    ],
    "alt": []
  },
  "Pec Deck (Butterfly)": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Cable Crossover": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Low-to-High Cable Fly": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "High-to-Low Cable Fly": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Chest Dip": {
    "need": [
      "dip_bars"
    ],
    "alt": [
      [
        "rings_trx"
      ]
    ]
  },
  "Push-up": {
    "need": [],
    "alt": []
  },
  "Incline Push-up": {
    "need": [],
    "alt": []
  },
  "Decline Push-up": {
    "need": [],
    "alt": []
  },
  "Dumbbell Pullover": {
    "need": [
      "dumbbell",
      "bench"
    ],
    "alt": []
  },
  "Landmine Press": {
    "need": [
      "landmine",
      "barbell"
    ],
    "alt": []
  },
  "Svend Press": {
    "need": [
      "plate"
    ],
    "alt": []
  },
  "Floor Press": {
    "need": [
      "barbell"
    ],
    "alt": [
      [
        "dumbbell"
      ]
    ]
  },
  "Cable Chest Press": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Reverse-Grip Bench Press": {
    "need": [
      "barbell",
      "bench"
    ],
    "alt": []
  },
  "Deficit Push-up": {
    "need": [],
    "alt": []
  },
  "Weighted Push-up": {
    "need": [
      "plate"
    ],
    "alt": [
      [
        "sandbag"
      ]
    ]
  },
  "Squeeze Press (Dumbbell)": {
    "need": [
      "dumbbell",
      "bench"
    ],
    "alt": []
  },
  "Pull-up": {
    "need": [
      "pullup_bar"
    ],
    "alt": [
      [
        "rings_trx"
      ]
    ]
  },
  "Chin-up": {
    "need": [
      "pullup_bar"
    ],
    "alt": [
      [
        "rings_trx"
      ]
    ]
  },
  "Weighted Pull-up": {
    "need": [
      "pullup_bar",
      "plate"
    ],
    "alt": [
      [
        "pullup_bar",
        "dumbbell"
      ],
      [
        "rings_trx",
        "plate"
      ],
      [
        "rings_trx",
        "dumbbell"
      ]
    ]
  },
  "Assisted Pull-up Machine": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Wide-Grip Lat Pulldown": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Close-Grip Lat Pulldown (V-Bar)": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Single-Arm Lat Pulldown": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Seated Cable Row": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Barbell Row": {
    "need": [
      "barbell"
    ],
    "alt": []
  },
  "Pendlay Row": {
    "need": [
      "barbell"
    ],
    "alt": []
  },
  "Single-Arm Dumbbell Row": {
    "need": [
      "dumbbell"
    ],
    "alt": []
  },
  "T-Bar Row": {
    "need": [
      "landmine",
      "barbell"
    ],
    "alt": [
      [
        "machine"
      ]
    ]
  },
  "Chest-Supported Row": {
    "need": [
      "dumbbell",
      "bench"
    ],
    "alt": [
      [
        "machine"
      ]
    ]
  },
  "Seal Row": {
    "need": [
      "barbell",
      "bench"
    ],
    "alt": [
      [
        "dumbbell",
        "bench"
      ]
    ]
  },
  "Machine Row": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Meadows Row": {
    "need": [
      "landmine",
      "barbell"
    ],
    "alt": []
  },
  "Inverted Row": {
    "need": [
      "pullup_bar"
    ],
    "alt": [
      [
        "rings_trx"
      ],
      [
        "smith"
      ],
      [
        "rack",
        "barbell"
      ]
    ]
  },
  "Straight-Arm Pulldown": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Dumbbell Pullover (Lats)": {
    "need": [
      "dumbbell",
      "bench"
    ],
    "alt": []
  },
  "Deadlift": {
    "need": [
      "barbell"
    ],
    "alt": []
  },
  "Rack Pull": {
    "need": [
      "barbell",
      "rack"
    ],
    "alt": [
      [
        "smith"
      ]
    ]
  },
  "Back Extension": {
    "need": [
      "roman_chair"
    ],
    "alt": [
      [
        "ball"
      ]
    ]
  },
  "Good Morning": {
    "need": [
      "barbell",
      "rack"
    ],
    "alt": []
  },
  "Barbell Shrug": {
    "need": [
      "barbell"
    ],
    "alt": []
  },
  "Dumbbell Shrug": {
    "need": [
      "dumbbell"
    ],
    "alt": []
  },
  "Superman": {
    "need": [],
    "alt": []
  },
  "Reverse-Grip Lat Pulldown": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Neutral-Grip Pull-up": {
    "need": [
      "pullup_bar"
    ],
    "alt": [
      [
        "rings_trx"
      ]
    ]
  },
  "Single-Arm Cable Row": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Landmine Row": {
    "need": [
      "landmine",
      "barbell"
    ],
    "alt": []
  },
  "Reverse-Grip Barbell Row": {
    "need": [
      "barbell"
    ],
    "alt": []
  },
  "Machine Pullover": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Deficit Deadlift": {
    "need": [
      "barbell",
      "plate"
    ],
    "alt": [
      [
        "barbell",
        "box"
      ]
    ]
  },
  "Overhead Press (Barbell)": {
    "need": [
      "barbell"
    ],
    "alt": []
  },
  "Seated Dumbbell Shoulder Press": {
    "need": [
      "dumbbell",
      "bench"
    ],
    "alt": []
  },
  "Standing Dumbbell Press": {
    "need": [
      "dumbbell"
    ],
    "alt": []
  },
  "Arnold Press": {
    "need": [
      "dumbbell"
    ],
    "alt": []
  },
  "Machine Shoulder Press": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Smith Machine Shoulder Press": {
    "need": [
      "smith",
      "bench"
    ],
    "alt": [
      [
        "smith"
      ]
    ]
  },
  "Push Press": {
    "need": [
      "barbell"
    ],
    "alt": [
      [
        "dumbbell"
      ]
    ]
  },
  "Landmine Shoulder Press": {
    "need": [
      "landmine",
      "barbell"
    ],
    "alt": []
  },
  "Lateral Raise (Dumbbell)": {
    "need": [
      "dumbbell"
    ],
    "alt": []
  },
  "Cable Lateral Raise": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Machine Lateral Raise": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Front Raise (Dumbbell)": {
    "need": [
      "dumbbell"
    ],
    "alt": []
  },
  "Plate Front Raise": {
    "need": [
      "plate"
    ],
    "alt": []
  },
  "Cable Front Raise": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Rear Delt Fly (Dumbbell)": {
    "need": [
      "dumbbell"
    ],
    "alt": []
  },
  "Reverse Pec Deck": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Cable Rear Delt Fly": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Face Pull": {
    "need": [
      "cable"
    ],
    "alt": [
      [
        "band"
      ]
    ]
  },
  "Cable External Rotation": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Side-Lying Dumbbell External Rotation": {
    "need": [
      "dumbbell"
    ],
    "alt": []
  },
  "Cuban Press": {
    "need": [
      "dumbbell"
    ],
    "alt": [
      [
        "barbell"
      ],
      [
        "ezbar"
      ]
    ]
  },
  "Upright Row": {
    "need": [
      "barbell"
    ],
    "alt": [
      [
        "ezbar"
      ],
      [
        "dumbbell"
      ],
      [
        "cable"
      ]
    ]
  },
  "Y-Raise": {
    "need": [
      "dumbbell"
    ],
    "alt": [
      [
        "cable"
      ],
      [
        "band"
      ]
    ]
  },
  "Handstand Push-up": {
    "need": [],
    "alt": []
  },
  "Band Pull-Apart": {
    "need": [
      "band"
    ],
    "alt": []
  },
  "Pike Push-up": {
    "need": [],
    "alt": []
  },
  "Cable Internal Rotation": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Chest-Supported Rear Delt Raise": {
    "need": [
      "dumbbell",
      "bench"
    ],
    "alt": []
  },
  "Dumbbell Scaption": {
    "need": [
      "dumbbell"
    ],
    "alt": []
  },
  "Barbell Curl": {
    "need": [
      "barbell"
    ],
    "alt": []
  },
  "EZ-Bar Curl": {
    "need": [
      "ezbar"
    ],
    "alt": []
  },
  "Dumbbell Curl": {
    "need": [
      "dumbbell"
    ],
    "alt": []
  },
  "Alternating Dumbbell Curl": {
    "need": [
      "dumbbell"
    ],
    "alt": []
  },
  "Hammer Curl": {
    "need": [
      "dumbbell"
    ],
    "alt": []
  },
  "Cable Hammer Curl (Rope)": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Incline Dumbbell Curl": {
    "need": [
      "dumbbell",
      "bench"
    ],
    "alt": []
  },
  "Preacher Curl": {
    "need": [
      "ezbar",
      "preacher"
    ],
    "alt": [
      [
        "barbell",
        "preacher"
      ],
      [
        "dumbbell",
        "preacher"
      ]
    ]
  },
  "Machine Preacher Curl": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Concentration Curl": {
    "need": [
      "dumbbell"
    ],
    "alt": []
  },
  "Cable Curl": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Bayesian Cable Curl": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Spider Curl": {
    "need": [
      "ezbar",
      "bench"
    ],
    "alt": [
      [
        "dumbbell",
        "bench"
      ]
    ]
  },
  "Drag Curl": {
    "need": [
      "barbell"
    ],
    "alt": [
      [
        "ezbar"
      ]
    ]
  },
  "Reverse Curl": {
    "need": [
      "ezbar"
    ],
    "alt": [
      [
        "barbell"
      ],
      [
        "dumbbell"
      ]
    ]
  },
  "Zottman Curl": {
    "need": [
      "dumbbell"
    ],
    "alt": []
  },
  "21s": {
    "need": [
      "barbell"
    ],
    "alt": [
      [
        "ezbar"
      ]
    ]
  },
  "High Cable Curl": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Triceps Pushdown (Rope)": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Triceps Pushdown (Bar)": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Single-Arm Cable Pushdown": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Overhead Cable Extension": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Overhead Dumbbell Extension": {
    "need": [
      "dumbbell"
    ],
    "alt": []
  },
  "Skull Crusher (EZ-Bar)": {
    "need": [
      "ezbar",
      "bench"
    ],
    "alt": []
  },
  "Dumbbell Skull Crusher": {
    "need": [
      "dumbbell",
      "bench"
    ],
    "alt": []
  },
  "Close-Grip Bench Press": {
    "need": [
      "barbell",
      "bench"
    ],
    "alt": []
  },
  "Triceps Dip": {
    "need": [
      "dip_bars"
    ],
    "alt": [
      [
        "rings_trx"
      ]
    ]
  },
  "Bench Dips": {
    "need": [
      "bench"
    ],
    "alt": [
      [
        "box"
      ]
    ]
  },
  "Triceps Kickback": {
    "need": [
      "dumbbell"
    ],
    "alt": []
  },
  "Cable Kickback (Triceps)": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "JM Press": {
    "need": [
      "barbell",
      "bench"
    ],
    "alt": [
      [
        "ezbar",
        "bench"
      ],
      [
        "smith",
        "bench"
      ]
    ]
  },
  "Machine Triceps Extension": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Diamond Push-up": {
    "need": [],
    "alt": []
  },
  "Reverse-Grip Triceps Pushdown": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Lying Cable Triceps Extension": {
    "need": [
      "cable",
      "bench"
    ],
    "alt": [
      [
        "cable"
      ]
    ]
  },
  "Assisted Dip Machine": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Machine Seated Dip": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Wrist Curl": {
    "need": [
      "dumbbell"
    ],
    "alt": [
      [
        "barbell"
      ],
      [
        "ezbar"
      ]
    ]
  },
  "Reverse Wrist Curl": {
    "need": [
      "dumbbell"
    ],
    "alt": [
      [
        "barbell"
      ],
      [
        "ezbar"
      ]
    ]
  },
  "Farmer's Walk": {
    "need": [
      "dumbbell"
    ],
    "alt": [
      [
        "kettlebell"
      ],
      [
        "trap_bar"
      ],
      [
        "sandbag"
      ]
    ]
  },
  "Dead Hang": {
    "need": [
      "pullup_bar"
    ],
    "alt": [
      [
        "rings_trx"
      ]
    ]
  },
  "Plate Pinch": {
    "need": [
      "plate"
    ],
    "alt": []
  },
  "Wrist Roller": {
    "need": [
      "rope",
      "plate"
    ],
    "alt": []
  },
  "Back Squat": {
    "need": [
      "barbell",
      "rack"
    ],
    "alt": []
  },
  "Front Squat": {
    "need": [
      "barbell",
      "rack"
    ],
    "alt": []
  },
  "High-Bar Squat": {
    "need": [
      "barbell",
      "rack"
    ],
    "alt": []
  },
  "Low-Bar Squat": {
    "need": [
      "barbell",
      "rack"
    ],
    "alt": []
  },
  "Goblet Squat": {
    "need": [
      "dumbbell"
    ],
    "alt": [
      [
        "kettlebell"
      ],
      [
        "sandbag"
      ]
    ]
  },
  "Hack Squat": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Pendulum Squat": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Belt Squat": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Smith Machine Squat": {
    "need": [
      "smith"
    ],
    "alt": []
  },
  "Leg Press": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Single-Leg Leg Press": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Bulgarian Split Squat": {
    "need": [
      "bench"
    ],
    "alt": [
      [
        "box"
      ]
    ]
  },
  "Walking Lunge": {
    "need": [],
    "alt": []
  },
  "Reverse Lunge": {
    "need": [],
    "alt": []
  },
  "Forward Lunge": {
    "need": [],
    "alt": []
  },
  "Lateral Lunge": {
    "need": [],
    "alt": []
  },
  "Step-up": {
    "need": [
      "box"
    ],
    "alt": [
      [
        "bench"
      ]
    ]
  },
  "Leg Extension": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Sissy Squat": {
    "need": [],
    "alt": []
  },
  "Pistol Squat": {
    "need": [],
    "alt": []
  },
  "Box Squat": {
    "need": [
      "barbell",
      "rack",
      "box"
    ],
    "alt": [
      [
        "smith",
        "box"
      ]
    ]
  },
  "Zercher Squat": {
    "need": [
      "barbell"
    ],
    "alt": []
  },
  "Wall Sit": {
    "need": [],
    "alt": []
  },
  "Air Squat": {
    "need": [],
    "alt": []
  },
  "Split Squat": {
    "need": [],
    "alt": []
  },
  "Jump Squat": {
    "need": [],
    "alt": []
  },
  "Curtsy Lunge": {
    "need": [],
    "alt": []
  },
  "Dumbbell Sumo Squat": {
    "need": [
      "dumbbell"
    ],
    "alt": []
  },
  "Reverse Nordic": {
    "need": [],
    "alt": []
  },
  "Overhead Squat": {
    "need": [
      "barbell"
    ],
    "alt": []
  },
  "Safety Bar Squat": {
    "need": [
      "barbell",
      "rack"
    ],
    "alt": []
  },
  "Cossack Squat": {
    "need": [],
    "alt": []
  },
  "Romanian Deadlift": {
    "need": [
      "barbell"
    ],
    "alt": []
  },
  "Dumbbell Romanian Deadlift": {
    "need": [
      "dumbbell"
    ],
    "alt": []
  },
  "Single-Leg RDL": {
    "need": [],
    "alt": []
  },
  "Stiff-Leg Deadlift": {
    "need": [
      "barbell"
    ],
    "alt": []
  },
  "Sumo Deadlift": {
    "need": [
      "barbell"
    ],
    "alt": []
  },
  "Trap Bar Deadlift": {
    "need": [
      "trap_bar"
    ],
    "alt": []
  },
  "Lying Leg Curl": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Seated Leg Curl": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Standing Leg Curl": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Nordic Curl": {
    "need": [],
    "alt": []
  },
  "Glute-Ham Raise": {
    "need": [
      "roman_chair"
    ],
    "alt": []
  },
  "Hip Thrust (Barbell)": {
    "need": [
      "barbell",
      "bench"
    ],
    "alt": []
  },
  "Machine Hip Thrust": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Glute Bridge": {
    "need": [],
    "alt": []
  },
  "Single-Leg Glute Bridge": {
    "need": [],
    "alt": []
  },
  "Cable Glute Kickback": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Cable Pull-through": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Machine Hip Abduction": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Machine Hip Adduction": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Kettlebell Swing": {
    "need": [
      "kettlebell"
    ],
    "alt": []
  },
  "Reverse Hyperextension": {
    "need": [
      "machine"
    ],
    "alt": [
      [
        "roman_chair"
      ]
    ]
  },
  "Frog Pump": {
    "need": [],
    "alt": []
  },
  "Slider Leg Curl": {
    "need": [
      "slider"
    ],
    "alt": []
  },
  "Machine Glute Kickback": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Cable Hip Abduction": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Banded Clamshell": {
    "need": [
      "band"
    ],
    "alt": []
  },
  "Banded Lateral Walk": {
    "need": [
      "band"
    ],
    "alt": []
  },
  "Standing Calf Raise": {
    "need": [],
    "alt": []
  },
  "Seated Calf Raise": {
    "need": [
      "machine"
    ],
    "alt": [
      [
        "dumbbell",
        "bench"
      ],
      [
        "barbell",
        "bench"
      ]
    ]
  },
  "Leg Press Calf Raise": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Smith Machine Calf Raise": {
    "need": [
      "smith"
    ],
    "alt": []
  },
  "Single-Leg Calf Raise": {
    "need": [],
    "alt": []
  },
  "Donkey Calf Raise": {
    "need": [],
    "alt": []
  },
  "Tibialis Raise": {
    "need": [],
    "alt": []
  },
  "Crunch": {
    "need": [],
    "alt": []
  },
  "Sit-up": {
    "need": [],
    "alt": []
  },
  "Decline Sit-up": {
    "need": [
      "bench"
    ],
    "alt": []
  },
  "Cable Crunch": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Machine Crunch": {
    "need": [
      "machine"
    ],
    "alt": []
  },
  "Bicycle Crunch": {
    "need": [],
    "alt": []
  },
  "Reverse Crunch": {
    "need": [],
    "alt": []
  },
  "Hanging Leg Raise": {
    "need": [
      "pullup_bar"
    ],
    "alt": [
      [
        "rings_trx"
      ]
    ]
  },
  "Hanging Knee Raise": {
    "need": [
      "pullup_bar"
    ],
    "alt": [
      [
        "rings_trx"
      ]
    ]
  },
  "Lying Leg Raise": {
    "need": [],
    "alt": []
  },
  "Captain's Chair Leg Raise": {
    "need": [
      "dip_bars"
    ],
    "alt": [
      [
        "machine"
      ]
    ]
  },
  "Plank": {
    "need": [],
    "alt": []
  },
  "Side Plank": {
    "need": [],
    "alt": []
  },
  "Ab Wheel Rollout": {
    "need": [
      "ab_wheel"
    ],
    "alt": []
  },
  "Russian Twist": {
    "need": [],
    "alt": []
  },
  "Pallof Press": {
    "need": [
      "cable"
    ],
    "alt": [
      [
        "band"
      ]
    ]
  },
  "Cable Woodchopper": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Dragon Flag": {
    "need": [
      "bench"
    ],
    "alt": [
      [
        "rack"
      ],
      [
        "pullup_bar"
      ]
    ]
  },
  "Dead Bug": {
    "need": [],
    "alt": []
  },
  "Bird Dog": {
    "need": [],
    "alt": []
  },
  "Mountain Climber": {
    "need": [],
    "alt": []
  },
  "V-Up": {
    "need": [],
    "alt": []
  },
  "Hollow Body Hold": {
    "need": [],
    "alt": []
  },
  "L-Sit": {
    "need": [],
    "alt": []
  },
  "Side Bend (Dumbbell)": {
    "need": [
      "dumbbell"
    ],
    "alt": []
  },
  "Toes-to-Bar": {
    "need": [
      "pullup_bar"
    ],
    "alt": [
      [
        "rings_trx"
      ]
    ]
  },
  "Copenhagen Plank": {
    "need": [
      "bench"
    ],
    "alt": [
      [
        "box"
      ]
    ]
  },
  "Cable Side Bend": {
    "need": [
      "cable"
    ],
    "alt": []
  },
  "Landmine Twist": {
    "need": [
      "landmine",
      "barbell"
    ],
    "alt": []
  },
  "Suitcase Carry": {
    "need": [
      "dumbbell"
    ],
    "alt": [
      [
        "kettlebell"
      ],
      [
        "sandbag"
      ]
    ]
  },
  "Power Clean": {
    "need": [
      "barbell"
    ],
    "alt": []
  },
  "Hang Clean": {
    "need": [
      "barbell"
    ],
    "alt": []
  },
  "Clean and Jerk": {
    "need": [
      "barbell"
    ],
    "alt": []
  },
  "Snatch": {
    "need": [
      "barbell"
    ],
    "alt": []
  },
  "Power Snatch": {
    "need": [
      "barbell"
    ],
    "alt": []
  },
  "Thruster": {
    "need": [
      "barbell"
    ],
    "alt": [
      [
        "dumbbell"
      ],
      [
        "kettlebell"
      ]
    ]
  },
  "Clean & Press": {
    "need": [
      "barbell"
    ],
    "alt": [
      [
        "dumbbell"
      ]
    ]
  },
  "Burpee": {
    "need": [],
    "alt": []
  },
  "Turkish Get-up": {
    "need": [
      "kettlebell"
    ],
    "alt": [
      [
        "dumbbell"
      ],
      [
        "sandbag"
      ]
    ]
  },
  "Kettlebell Goblet Clean": {
    "need": [
      "kettlebell"
    ],
    "alt": []
  },
  "Sled Push": {
    "need": [
      "sled"
    ],
    "alt": []
  },
  "Sled Pull": {
    "need": [
      "sled"
    ],
    "alt": []
  },
  "Battle Rope": {
    "need": [
      "rope"
    ],
    "alt": []
  },
  "Box Jump": {
    "need": [
      "box"
    ],
    "alt": []
  },
  "Wall Ball": {
    "need": [
      "medball"
    ],
    "alt": []
  },
  "Muscle-up": {
    "need": [
      "pullup_bar"
    ],
    "alt": [
      [
        "rings_trx"
      ]
    ]
  },
  "Man Maker": {
    "need": [
      "dumbbell"
    ],
    "alt": [
      [
        "kettlebell"
      ]
    ]
  },
  "Medicine Ball Slam": {
    "need": [
      "medball"
    ],
    "alt": []
  },
  "Kettlebell Snatch": {
    "need": [
      "kettlebell"
    ],
    "alt": []
  },
  "Dumbbell Snatch": {
    "need": [
      "dumbbell"
    ],
    "alt": []
  },
  "Bear Crawl": {
    "need": [],
    "alt": []
  }
};
