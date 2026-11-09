import { describe, expect, it } from "vitest";
import { MUSCLES, MUSCLE_COMMON, MUSCLE_LABEL, muscleLabel, muscleSearchText } from "../src/core/musclemap.ts";

describe("kas görünen adları", () => {
  it("18 kasın hepsinin anatomik ve yaygın adı var", () => {
    expect(MUSCLES.length).toBe(18);
    expect(MUSCLE_LABEL[MUSCLES[MUSCLES.length - 1]]).toBe("Rotator cuff");
    for (const m of MUSCLES) { expect(MUSCLE_LABEL[m], m).toBeTruthy(); expect(MUSCLE_COMMON[m], m).toBeTruthy(); }
  });
  it("Anatomik adlar benzersiz", () => {
    const l = MUSCLES.map(m => MUSCLE_LABEL[m]);
    expect(new Set(l).size).toBe(l.length);
  });
  it("bilinmeyen kimlikte kimliği döndürür", () => {
    expect(muscleLabel("Yok")).toBe("Yok");
    expect(muscleLabel("Göğüs")).toBe("Pectoralis major");
  });
  it("arama metni kimlik, Latince ve yaygın adı içerir", () => {
    const t = muscleSearchText("Quadriceps");
    expect(t).toContain("Quadriceps femoris"); expect(t).toContain("ön bacak"); expect(t).toContain("Quadriceps");
  });
});
