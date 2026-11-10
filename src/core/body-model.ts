import type { State } from "./schema.ts";

// Açıkça kaydedilmiş prefs.body kazanır; hiç kaydedilmemişse (eski kayıt) cinsiyet m/f ise model o olur, aksi halde "m".
export const bodyModel = (prefs: { body?: string }, sex?: string) =>
  prefs.body === undefined ? (sex === "f" ? "f" : "m") : prefs.body === "f" ? "f" : "m";
export function setGender(state: State, sex: string) {
  state.profile.sex = sex;
  if (sex === "m" || sex === "f") state.prefs.body = sex;
}
