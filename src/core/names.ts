import { LIB } from "./library.ts";
import { EX_RENAMES } from "./renames.ts";

// Lookup only: this map never renames stored user data.
export const SEARCH_ALIASES: Record<string, string> = {
  "Barfiks": "Pull-up", "Şınav": "Push-up", "Mekik": "Crunch", "Tam mekik": "Sit-up",
  "Kelebek": "Pec Deck (Butterfly)", "Pec deck": "Pec Deck (Butterfly)",
  "Dambıl bench press": "Dumbbell Bench Press", "Eğik bench press": "Incline Bench Press",
  "Dambıl fly": "Dumbbell Fly", "Kablo crossover": "Cable Crossover", "Çekiç curl": "Hammer Curl",
  "French press": "Overhead Dumbbell Extension", "Alın sıkıştırma": "Skull Crusher (EZ-Bar)",
  "Lateral raise": "Lateral Raise (Dumbbell)", "Yan raise": "Lateral Raise (Dumbbell)",
  "Farmer yürüyüşü": "Farmer's Walk", "Farmers carry": "Farmer's Walk", "Ab wheel": "Ab Wheel Rollout",
  "Ters mekik": "Reverse Crunch", "Kalça köprüsü": "Glute Bridge", "Serbest squat": "Back Squat",
};
export const normalizeExerciseName = (name: string): string => String(name || "").trim().toLowerCase().replace(/̇/g, "").replace(/ı/g, "i").replace(/\s+/g, " ");
const canonical = new Map(Object.values(LIB).flat().map(name => [normalizeExerciseName(name), name]));
const aliases = new Map(Object.entries({ ...EX_RENAMES, ...SEARCH_ALIASES }).map(([alias, name]) => [normalizeExerciseName(alias), name]));
export function resolveExerciseName(name: string): string {
  const key = normalizeExerciseName(name);
  return canonical.get(key) ?? aliases.get(key) ?? name;
}
const simplify = (value: string) => normalizeExerciseName(value).replace(/ı/g, "i").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const search = new Map(Object.values(LIB).flat().map(name => [name, [name, ...[...aliases].filter(([, target]) => target === name).map(([alias]) => alias)].join(" ")]));
export const exerciseSearchText = (name: string): string => search.get(resolveExerciseName(name)) ?? name;
export const matchesExercise = (name: string, query: string): boolean => simplify(exerciseSearchText(name)).includes(simplify(query));
