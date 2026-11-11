import { LIB, CARDIO, YOGA } from "./library.ts";
import { NEW_EXERCISES } from "./new-exercises.ts";
import { EQUIPMENT } from "./equipment-data.ts";
import { resolveExerciseName } from "./names.ts";

export const EQUIPMENT_IDS = ["dumbbell", "barbell", "bench", "pullup_bar", "band", "kettlebell", "cable", "machine", "ab_wheel", "rings_trx", "ezbar", "smith", "dip_bars", "rack", "box", "ball", "medball", "plate", "trap_bar", "landmine", "sled", "rope", "slider", "roman_chair", "preacher", "sandbag"] as const;
export type EquipmentId = typeof EQUIPMENT_IDS[number];
export interface EquipmentRequirement { need: string[]; alt?: string[][] }
export interface CustomEquipment { name: string; need?: string[] }
const ids = new Set<string>(EQUIPMENT_IDS);
export function sanitizeEquipment(value: unknown): EquipmentId[] {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is EquipmentId => typeof id === "string" && ids.has(id)))] : [];
}
for (const ex of NEW_EXERCISES) EQUIPMENT[ex.name] = { need: ex.need };
export { EQUIPMENT };
const unfiltered = new Set([...LIB[CARDIO], ...LIB[YOGA]]);
export function requirementOf(name: string, custom: CustomEquipment[] = []): EquipmentRequirement | undefined {
  const resolved = resolveExerciseName(name);
  if (unfiltered.has(resolved)) return { need: [] };
  const user = custom.find(ex => ex.name === name && Array.isArray(ex.need));
  if (user) return { need: sanitizeEquipment(user.need) };
  if (Object.hasOwn(EQUIPMENT, resolved)) return EQUIPMENT[resolved];
  // Match the legacy equipOf vocabulary for free-form exercise names.
  const n = name.toLowerCase();
  if (/smith/.test(n)) return { need: ["smith"] };
  if (/kettlebell|turkish/.test(n)) return { need: ["kettlebell"] };
  if (/cable|kablo|pulldown|pushdown|face pull|crossover|pull-through|woodchop|pallof/.test(n)) return { need: ["cable"] };
  if (/machine|makine|leg press|hack squat|pec deck|pendulum|belt squat|leg extension|leg curl|standing calf|seated calf|donkey|chest-supported|reverse pec|t-bar|glute-ham|reverse hyper/.test(n)) return { need: ["machine"] };
  if (/dumbbell|damb[ıi]l/.test(n)) return { need: ["dumbbell"] };
  if (/barbell/.test(n)) return { need: ["barbell"] };
  if (/ez.?bar/.test(n)) return { need: ["ezbar"] };
  if (/kettlebell/.test(n)) return { need: ["kettlebell"] };
  if (/cable|kablo/.test(n)) return { need: ["cable"] };
  if (/band|bant/.test(n)) return { need: ["band"] };
  if (/slider|medicine ball|slam|plate|sled|battle|wall ball|man maker|ab wheel/.test(n)) return undefined;
  if (/curtsy/.test(n) && !/dumbbell/.test(n)) return { need: [] };
  if (/goblet|arnold|hammer curl|concentration|kickback|farmer|bulgarian|split squat|suitcase|lunge|step-up|spider|zottman|side bend|seal row|y-raise|lateral raise|front raise|rear delt|svend|pullover|wrist/.test(n)) return { need: ["dumbbell"] };
  if (/vücut ağırlığı|bodyweight|push-up|pull-up|chin-up|plank|crunch|sit-up|burpee/.test(n)) return { need: [] };
  return undefined;
}
export function canDo(name: string, owned: readonly string[] = [], custom: CustomEquipment[] = []): boolean {
  const selected = sanitizeEquipment(owned);
  if (!selected.length) return true;
  const r = requirementOf(name, custom);
  if (!r || !r.need.length) return true;
  const have = new Set(selected);
  return [r.need, ...(r.alt ?? [])].some(need => need.every(id => have.has(id as EquipmentId)));
}
export function filterByEquipment(names: string[], owned: readonly string[] = [], custom: CustomEquipment[] = []): string[] {
  return names.filter(name => canDo(name, owned, custom));
}
