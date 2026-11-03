import { describe, it, expect } from "vitest";
import { normalize, matchExercise, extractPayload, parseProgram, buildLink, claudePrompt } from "../src/core/importer.ts";
import { LIB } from "../src/core/library.ts";

const known = Object.values(LIB).flat();
const BASE = "https://huseyintanriver409-lab.github.io/spor-defteri/spor-defteri.html";

describe("hareket eşleştirme", () => {
  it("Türkçe harfleri ve noktalamayı sadeleştirir", () => {
    expect(normalize("Şınav (Push-up)")).toBe("sinav push up");
    expect(normalize("  Bench-Press  ")).toBe("bench press");
  });

  it("birebir, kısmi ve farklı yazımları bulur", () => {
    expect(matchExercise("Bench Press (Barbell)", known)).toBe("Bench Press (Barbell)");
    expect(matchExercise("bench press", known)).toBe("Bench Press (Barbell)");
    expect(matchExercise("BACK-SQUAT", known)).toBe("Back Squat");
    expect(matchExercise("Sinav", known)).toBe("Şınav (Push-up)");
    expect(matchExercise("Romanian Deadlift", known)).toBe("Romanian Deadlift");
    expect(matchExercise("Lat Pulldown", known)).toMatch(/^Lat Pulldown/);
    expect(matchExercise("Overhead Press", known)).toBe("Overhead Press (Barbell)");
  });

  it("yaygın başka adları tanır, hareket türü farklıysa (chop ↔ fly) eşleştirmez", () => {
    expect(matchExercise("Conventional Deadlift", known)).toBe("Deadlift");
    expect(matchExercise("Dumbbell Overhead Press", known)).toBe("Standing Dumbbell Press");
    expect(matchExercise("Cable High to Low Chop", known)).toBe("Cable Woodchopper");
    expect(String(matchExercise("Cable Low to High Twist", known))).not.toMatch(/Fly/);
    expect(matchExercise("Barbell Back Squat", known)).toBe("Back Squat");
  });

  it("bilinmeyen hareketi uydurmaz", () => {
    expect(matchExercise("Zercher Good Morning Deluxe", known)).toBeNull();
    expect(matchExercise("", known)).toBeNull();
  });
});

describe("bağlantıyı ayıklama", () => {
  const link = `${BASE}#ekle=p=Test;g=A:Back+Squat*5*5`;
  it("tam bağlantıdan, mesajın içinden ve markdown bağlantısından ayıklar", () => {
    expect(extractPayload(link)).toBe("p=Test;g=A:Back Squat*5*5");
    expect(extractPayload(`İşte programın: ${link} iyi çalışmalar!`)).toBe("p=Test;g=A:Back Squat*5*5");
    expect(extractPayload(`[Programı ekle](${link})`)).toBe("p=Test;g=A:Back Squat*5*5");
  });
  it("hareket adındaki parantezleri korur", () => {
    expect(extractPayload(`(${BASE}#ekle=p=X;g=A:Bench+Press+(Barbell)*5*5)`)).toBe("p=X;g=A:Bench Press (Barbell)*5*5");
  });
  it("yüzde kodlu Türkçe karakterleri ve elle yazılmış metni çözer", () => {
    expect(extractPayload(`${BASE}#ekle=p=%C3%9Cst;g=%C3%9Cst:%C5%9E%C4%B1nav*3*10`)).toBe("p=Üst;g=Üst:Şınav*3*10");
    expect(extractPayload("p=Ev;g=A:Goblet Squat*3*10")).toBe("p=Ev;g=A:Goblet Squat*3*10");
  });
  it("ilgisiz metinde null", () => {
    expect(extractPayload("merhaba nasılsın")).toBeNull();
    expect(extractPayload(BASE)).toBeNull();
  });
});

describe("programı çözme", () => {
  it("günleri, hareketleri, setleri, tekrarları ve planı okur", () => {
    const r = parseProgram(`${BASE}#ekle=p=Üst+Alt;g=Üst:Bench+Press*4*6-8,Barbell+Row*4*6-8|Alt:Back+Squat*4*6-8,Plank*3*45;w=MO:0,TU:1,TH:0,FR:1`, known)!;
    expect(r.name).toBe("Üst Alt");
    expect(r.days.map(d => d.name)).toEqual(["Üst", "Alt"]);
    expect(r.days[0].items).toEqual([
      { ex: "Bench Press (Barbell)", sets: 4, reps: "6-8", original: "Bench Press", known: true },
      { ex: "Barbell Row", sets: 4, reps: "6-8", original: "Barbell Row", known: true },
    ]);
    expect(r.days[1].items[1]).toMatchObject({ ex: "Plank", sets: 3, reps: "45" });
    expect(r.plan).toEqual([["MO", 0], ["TU", 1], ["TH", 0], ["FR", 1]]);
    expect(r.warnings).toEqual([]);
  });

  it("yeni biçim: her gün ayrı g=, hareket/set/tekrar", () => {
    const r = parseProgram(`${BASE}#ekle=p=Ust+Alt;g=Ust:Bench+Press/4/6-8,Barbell+Row/4/8-10,Overhead+Press/3/8;g=Alt:Back+Squat/4/6-8,Plank/3/45;w=MO:0,TH:1`, known)!;
    expect(r.days.map(d => [d.name, d.items.map(i => [i.ex, i.sets, i.reps])])).toEqual([
      ["Ust", [["Bench Press (Barbell)", 4, "6-8"], ["Barbell Row", 4, "8-10"], ["Overhead Press (Barbell)", 3, "8"]]],
      ["Alt", [["Back Squat", 4, "6-8"], ["Plank", 3, "45"]]],
    ]);
    expect(r.plan).toEqual([["MO", 0], ["TH", 1]]);
    expect(r.warnings).toEqual([]);
  });

  it("plan saatleri ve bitiş tarihi; sırasız günler programın günlerine sırayla dağılır", () => {
    const r = parseProgram(`${BASE}#ekle=p=AB;g=A:Back+Squat/3/5;g=B:Deadlift/1/5;w=MO@18:00,WE@7,SA:0@10.30;u=2027-01-06`, known)!;
    expect(r.plan).toEqual([["MO", 0], ["WE", 1], ["SA", 0]]);
    expect(r.times).toEqual({ MO: "18:00", WE: "07:00", SA: "10:30" });
    expect(r.until).toBe("2027-01-06");
    expect(r.warnings).toEqual([]);
  });

  it("programsız bağlantı yalnız planı taşır (pazartesi, çarşamba, cumartesi; 6 Ocak'a kadar)", () => {
    const r = parseProgram(`Planın hazır: ${BASE}#ekle=w=MO@18:00,WE@18:00,SA@10:00;u=6.1.2027`, known)!;
    expect(r.days).toEqual([]);
    expect(r.plan).toEqual([["MO", -1], ["WE", -1], ["SA", -1]]);
    expect(r.times).toEqual({ MO: "18:00", WE: "18:00", SA: "10:00" });
    expect(r.until).toBe("2027-01-06");
    expect(parseProgram(`${BASE}#ekle=w=Zz`, known)).toBeNull();
  });

  it("geçersiz saat ve tarih uyarıyla atlanır", () => {
    const r = parseProgram("w=MO@25:00,TU;u=2027-02-30", known)!;
    expect(r.plan).toEqual([["MO", -1], ["TU", -1]]);
    expect(r.times).toEqual({});
    expect(r.until).toBe("");
    expect(r.warnings).toHaveLength(2);
  });

  it("Türkçe gün adlarını kabul eder, geçersiz plan girdisini uyarıyla atlar", () => {
    const r = parseProgram("p=X;g=A:Back Squat*3*5;w=Pzt:0,Çarşamba:0,Zz:0,Cum:5", known)!;
    expect(r.plan).toEqual([["MO", 0], ["WE", 0]]);
    expect(r.warnings).toHaveLength(2);
  });

  it("bilinmeyen hareketi yeni hareket olarak işaretler", () => {
    const r = parseProgram("p=X;g=A:Sandbag Carry*3*20", known)!;
    expect(r.days[0].items[0]).toMatchObject({ ex: "Sandbag Carry", known: false });
    expect(r.warnings[0]).toMatch(/Sandbag Carry/);
  });

  it("eksik değerlere makul varsayılanlar; aşırı set sayısını sınırlar", () => {
    const r = parseProgram("p=;g=Back Squat|:Deadlift*99*5 tekrar", known)!;
    expect(r.name).toBe("Claude'dan program");
    expect(r.days[0]).toMatchObject({ name: "A", items: [{ ex: "Back Squat", sets: 3, reps: "" }] });
    expect(r.days[1].items[0]).toMatchObject({ sets: 20, reps: "5" });
  });

  it("gün yoksa ya da biçim tanınmıyorsa null", () => {
    expect(parseProgram("p=Boş", known)).toBeNull();
    expect(parseProgram("selam", known)).toBeNull();
  });
});

describe("paylaşım bağlantısı", () => {
  it("buildLink → parseProgram aynı programı geri verir (Türkçe karakterler ve parantezler dahil)", () => {
    const days = [
      { name: "Gün A", items: [{ ex: "Bench Press (Barbell)", sets: 4, reps: "6-8" }, { ex: "Şınav (Push-up)", sets: 3, reps: "10" }] },
      { name: "Gün B", items: [{ ex: "Back Squat", sets: 5, reps: "5" }] },
    ];
    const link = buildLink(BASE, "Güç; Programı", days, [["MO", 0], ["TH", 1]]);
    expect(link.startsWith(BASE + "#ekle=")).toBe(true);
    expect(link).not.toMatch(/\s/);
    // telefondaki markdown ve Android bağlantı tanıyıcısı bunlarda bağlantıyı kesiyor
    expect(link).not.toMatch(/[*|_~]/);
    const r = parseProgram(link, known)!;
    expect(r.name).toBe("Güç Programı");
    expect(r.days.map(d => [d.name, d.items.map(i => [i.ex, i.sets, i.reps])])).toEqual(days.map(d => [d.name, d.items.map(i => [i.ex, i.sets, i.reps])]));
    expect(r.plan).toEqual([["MO", 0], ["TH", 1]]);
  });

  it("Claude isteği biçimi ve adresi içerir", () => {
    const p = claudePrompt(BASE, "evde 3 gün", "2026-11-02");
    expect(p).toContain(BASE + "#ekle=");
    expect(p).toContain("evde 3 gün");
    expect(p).toContain("2026-11-02");
    // yalnız plan örneği de çözülebilir olmalı
    const planOnly = p.slice(p.indexOf(BASE + "#ekle=w="));
    expect(parseProgram(planOnly, known)!.until).toBe("2027-01-06");
    const example = p.split("\n").find(l => l.startsWith(BASE))!;
    expect(example).not.toMatch(/[*|_~()]/);
    expect(parseProgram(example, known)!.days).toHaveLength(2);
  });
});
