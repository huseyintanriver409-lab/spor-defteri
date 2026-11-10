import { t } from "./i18n.ts";
// Hazır hareket kütüphanesi (kas grubuna göre). Tarayıcıya bağlı değildir; program şablonları ve testler de kullanır.
export const LIB: Record<string, string[]> = {
  "Göğüs": ["Bench Press (Barbell)","Dumbbell Bench Press","Incline Bench Press","Incline Dumbbell Press","Decline Bench Press","Decline Dumbbell Press","Smith Machine Bench Press","Smith Machine Incline Press","Machine Chest Press","Machine Incline Chest Press","Dumbbell Fly","Incline Dumbbell Fly","Pec Deck (Butterfly)","Cable Crossover","Low-to-High Cable Fly","High-to-Low Cable Fly","Chest Dip","Push-up","Incline Push-up","Decline Push-up","Dumbbell Pullover","Landmine Press","Svend Press","Floor Press","Cable Chest Press","Reverse-Grip Bench Press","Deficit Push-up","Weighted Push-up","Squeeze Press (Dumbbell)"],
  "Sırt": ["Pull-up","Chin-up","Weighted Pull-up","Assisted Pull-up Machine","Wide-Grip Lat Pulldown","Close-Grip Lat Pulldown (V-Bar)","Single-Arm Lat Pulldown","Seated Cable Row","Barbell Row","Pendlay Row","Single-Arm Dumbbell Row","T-Bar Row","Chest-Supported Row","Seal Row","Machine Row","Meadows Row","Inverted Row","Straight-Arm Pulldown","Dumbbell Pullover (Lats)","Deadlift","Rack Pull","Back Extension","Good Morning","Barbell Shrug","Dumbbell Shrug","Superman","Reverse-Grip Lat Pulldown","Neutral-Grip Pull-up","Single-Arm Cable Row","Landmine Row","Reverse-Grip Barbell Row","Machine Pullover","Deficit Deadlift"],
  "Omuz": ["Overhead Press (Barbell)","Seated Dumbbell Shoulder Press","Standing Dumbbell Press","Arnold Press","Machine Shoulder Press","Smith Machine Shoulder Press","Push Press","Landmine Shoulder Press","Lateral Raise (Dumbbell)","Cable Lateral Raise","Machine Lateral Raise","Front Raise (Dumbbell)","Plate Front Raise","Cable Front Raise","Rear Delt Fly (Dumbbell)","Reverse Pec Deck","Cable Rear Delt Fly","Face Pull","Cable External Rotation","Side-Lying Dumbbell External Rotation","Cuban Press","Upright Row","Y-Raise","Handstand Push-up","Band Pull-Apart","Pike Push-up","Cable Internal Rotation","Chest-Supported Rear Delt Raise","Dumbbell Scaption"],
  "Biceps": ["Barbell Curl","EZ-Bar Curl","Dumbbell Curl","Alternating Dumbbell Curl","Hammer Curl","Cable Hammer Curl (Rope)","Incline Dumbbell Curl","Preacher Curl","Machine Preacher Curl","Concentration Curl","Cable Curl","Bayesian Cable Curl","Spider Curl","Drag Curl","Reverse Curl","Zottman Curl","21s","High Cable Curl"],
  "Triceps": ["Triceps Pushdown (Rope)","Triceps Pushdown (Bar)","Single-Arm Cable Pushdown","Overhead Cable Extension","Overhead Dumbbell Extension","Skull Crusher (EZ-Bar)","Dumbbell Skull Crusher","Close-Grip Bench Press","Triceps Dip","Bench Dips","Triceps Kickback","Cable Kickback (Triceps)","JM Press","Machine Triceps Extension","Diamond Push-up","Reverse-Grip Triceps Pushdown","Lying Cable Triceps Extension","Assisted Dip Machine","Machine Seated Dip"],
  "Önkol & Kavrama": ["Wrist Curl","Reverse Wrist Curl","Farmer's Walk","Dead Hang","Plate Pinch","Wrist Roller"],
  "Bacak (Ön)": ["Back Squat","Front Squat","High-Bar Squat","Low-Bar Squat","Goblet Squat","Hack Squat","Pendulum Squat","Belt Squat","Smith Machine Squat","Leg Press","Single-Leg Leg Press","Bulgarian Split Squat","Walking Lunge","Reverse Lunge","Forward Lunge","Lateral Lunge","Step-up","Leg Extension","Sissy Squat","Pistol Squat","Box Squat","Zercher Squat","Wall Sit","Air Squat","Split Squat","Jump Squat","Curtsy Lunge","Dumbbell Sumo Squat","Reverse Nordic","Overhead Squat","Safety Bar Squat","Cossack Squat"],
  "Arka Bacak & Kalça": ["Romanian Deadlift","Dumbbell Romanian Deadlift","Single-Leg RDL","Stiff-Leg Deadlift","Sumo Deadlift","Trap Bar Deadlift","Lying Leg Curl","Seated Leg Curl","Standing Leg Curl","Nordic Curl","Glute-Ham Raise","Hip Thrust (Barbell)","Machine Hip Thrust","Glute Bridge","Single-Leg Glute Bridge","Cable Glute Kickback","Cable Pull-through","Machine Hip Abduction","Machine Hip Adduction","Kettlebell Swing","Reverse Hyperextension","Frog Pump","Slider Leg Curl","Machine Glute Kickback","Cable Hip Abduction","Banded Clamshell","Banded Lateral Walk"],
  "Baldır": ["Standing Calf Raise","Seated Calf Raise","Leg Press Calf Raise","Smith Machine Calf Raise","Single-Leg Calf Raise","Donkey Calf Raise","Tibialis Raise"],
  "Karın & Core": ["Crunch","Sit-up","Decline Sit-up","Cable Crunch","Machine Crunch","Bicycle Crunch","Reverse Crunch","Hanging Leg Raise","Hanging Knee Raise","Lying Leg Raise","Captain's Chair Leg Raise","Plank","Side Plank","Ab Wheel Rollout","Russian Twist","Pallof Press","Cable Woodchopper","Dragon Flag","Dead Bug","Bird Dog","Mountain Climber","V-Up","Hollow Body Hold","L-Sit","Side Bend (Dumbbell)","Toes-to-Bar","Copenhagen Plank","Cable Side Bend","Landmine Twist","Suitcase Carry"],
  "Tüm Vücut & Olimpik": ["Power Clean","Hang Clean","Clean and Jerk","Snatch","Power Snatch","Thruster","Clean & Press","Burpee","Turkish Get-up","Kettlebell Goblet Clean","Sled Push","Sled Pull","Battle Rope","Box Jump","Wall Ball","Muscle-up","Man Maker","Medicine Ball Slam","Kettlebell Snatch","Dumbbell Snatch","Bear Crawl"],
  "Kardiyo": ["Treadmill Run","Outdoor Run","Walking / Incline Walk","Stationary Bike","Outdoor Cycling","Elliptical","Rowing Machine","Stair Climber","Jump Rope","Swimming","Assault Bike","HIIT","SkiErg"],
  "Yoga & Esneme": ["Mountain Pose","Sun Salutation","Downward Dog","Upward Dog","Cobra Pose","Chaturanga","Child's Pose","Cat-Cow","Warrior I","Warrior II","Reverse Warrior","Triangle Pose","Extended Side Angle","Half Moon","Tree Pose","Chair Pose","Standing Forward Fold","Seated Forward Fold","Low Lunge","Pigeon Pose","Butterfly Pose","Bridge Pose","Camel Pose","Boat Pose","Happy Baby","Supine Twist","Legs Up the Wall","Corpse Pose","Hamstring Stretch","Quad Stretch","Hip Flexor Stretch","Shoulder Stretch","Chest Stretch"]
};
export const CARDIO = "Kardiyo";
// yoga pozları ve esnemeler süreyle tutulur, kilo almaz; kas toparlanmasına ve kas analizine girmez
export const YOGA = "Yoga & Esneme";

// görünen grup adı (LIB anahtarı ve "Diğer" veri değeridir, çevrilmez; yalnız ekranda çevrilir)
const GROUP_KEYS: Record<string, string> = {
  "Göğüs": t("groups.gogus"),
  "Sırt": t("groups.sirt"),
  "Omuz": t("groups.omuz"),
  "Biceps": t("groups.biceps"),
  "Triceps": t("groups.triceps"),
  "Önkol & Kavrama": t("groups.onkol"),
  "Bacak (Ön)": t("groups.bacak_on"),
  "Arka Bacak & Kalça": t("groups.arka_bacak"),
  "Baldır": t("groups.baldir"),
  "Karın & Core": t("groups.karin"),
  "Tüm Vücut & Olimpik": t("groups.tum_vucut"),
  "Kardiyo": t("groups.kardiyo"),
  "Yoga & Esneme": t("groups.yoga"),
  "Diğer": t("groups.diger"),
};
export function groupLabel(g: string): string { return GROUP_KEYS[g] ?? g; }

// Separate left/right efforts; alternating movements already include both sides.
export const UNILATERAL = new Set([
  "Single-Arm Lat Pulldown", "Single-Arm Dumbbell Row", "Single-Arm Cable Row", "Meadows Row",
  "Landmine Press", "Landmine Shoulder Press", "Cable Lateral Raise", "Cable Front Raise",
  "Cable External Rotation", "Cable Internal Rotation", "Side-Lying Dumbbell External Rotation",
  "Concentration Curl", "Bayesian Cable Curl", "Single-Arm Cable Pushdown",
  "Triceps Kickback", "Cable Kickback (Triceps)", "Single-Leg Leg Press",
  "Bulgarian Split Squat", "Split Squat", "Walking Lunge", "Reverse Lunge", "Forward Lunge",
  "Lateral Lunge", "Curtsy Lunge", "Step-up", "Pistol Squat", "Cossack Squat",
  "Single-Leg RDL", "Standing Leg Curl", "Single-Leg Glute Bridge", "Cable Glute Kickback",
  "Machine Glute Kickback", "Cable Hip Abduction", "Banded Clamshell", "Single-Leg Calf Raise",
  "Side Plank", "Pallof Press", "Cable Woodchopper", "Side Bend (Dumbbell)",
  "Copenhagen Plank", "Cable Side Bend", "Suitcase Carry", "Turkish Get-up",
  "Kettlebell Snatch", "Dumbbell Snatch", "Warrior I", "Warrior II", "Reverse Warrior",
  "Triangle Pose", "Extended Side Angle", "Half Moon", "Tree Pose", "Low Lunge",
  "Pigeon Pose", "Supine Twist", "Hamstring Stretch", "Quad Stretch", "Hip Flexor Stretch", "Shoulder Stretch", "Chest Stretch",
]);
export const isUnilateral = (name: string): boolean => UNILATERAL.has(name) ||
  /single[- ](?:arm|leg)|split squat|woodchop|lunge/i.test(name);

export type YogaRegion = "all" | "hips" | "back" | "shoulders" | "legs";
export interface YogaPose { ex: string; region: YogaRegion; level: number; seconds: number; unilateral: boolean; phase?: "pre" | "post" }
// Compact pose metadata; exercise names remain stable persistence keys.
export const YOGA_POSES: YogaPose[] = LIB[YOGA].map(ex => ({
  ex, region: /Shoulder|Chest Stretch/.test(ex) ? "shoulders" :
    /Lunge|Pigeon|Butterfly|Happy Baby|Hip Flexor/.test(ex) ? "hips" :
    /Fold|Hamstring|Quad|Legs Up|Chair|Warrior|Triangle|Half Moon|Tree|Side Angle/.test(ex) ? "legs" :
    /Dog|Cobra|Cat-Cow|Child|Bridge|Camel|Twist/.test(ex) ? "back" : "all",
  level: /Chaturanga|Half Moon|Camel|Boat/.test(ex) ? 2 : 1,
  phase: ex === "Cat-Cow" || ex === "Sun Salutation" ? "pre" : ["Mountain Pose","Downward Dog","Cobra Pose","Child's Pose","Warrior I","Warrior II","Reverse Warrior","Triangle Pose","Extended Side Angle","Half Moon","Tree Pose","Chair Pose","Standing Forward Fold","Seated Forward Fold","Low Lunge","Pigeon Pose","Butterfly Pose","Bridge Pose","Camel Pose","Boat Pose","Happy Baby","Supine Twist","Legs Up the Wall","Corpse Pose","Hamstring Stretch","Quad Stretch","Hip Flexor Stretch","Shoulder Stretch","Chest Stretch"].includes(ex) ? "post" : undefined,
  seconds: ex === "Corpse Pose" ? 60 : 30, unilateral: isUnilateral(ex)
}));

export type PosePhaseFilter = "all" | "pre" | "post";
export const filterPosePhase = <T extends { phase?: "pre" | "post" }>(poses: T[], phase: PosePhaseFilter): T[] =>
  poses.filter(p => phase === "all" || p.phase === phase);
