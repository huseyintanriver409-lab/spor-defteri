import uiSrc from "../src/app/ui.js?raw";
import librarySrc from "../src/app/library.js?raw";
import { describe, expect, it } from "vitest";

const src = (f: string) => (f === "ui.js" ? uiSrc : librarySrc) as string;

describe("ekipman filtresini kaldırma kalıcı seçimi silmez", () => {
  it("hareket seçici yalnız yerel bayrakla filtreyi yok sayar", () => {
    const ui = src("ui.js");
    expect(ui).not.toMatch(/setOwnedEquipment/);
    expect(ui).toMatch(/ignoreEquip = true/);
    expect(ui).toMatch(/if \(!ignoreEquip\) list = list\.filter\(e => equipmentAllowed/);
  });
  it("kütüphane eylemleri prefs.equip'i sıfırlamaz", () => {
    expect(src("library.js")).not.toMatch(/setOwnedEquipment/);
  });
});
