/* ---------- Hazır programlar ve program önerisi ----------
   Programlar herkesçe bilinen, belgelenmiş düzenlerdir; adları marka değil, "… tarzı" diye anılır.
   Öneri kuralları şu yönergelere dayanır:
   - ACSM, "Progression models in resistance training for healthy adults" (2009, PMID 19204579):
     yeni başlayan için haftada 2-3 gün, 8-12 tekrarlık yük; hedefin 1-2 tekrar fazlası yapılınca yük %2-10 artar.
   - CDC / Dünya Sağlık Örgütü: haftada en az 2 gün bütün büyük kas gruplarına kuvvet antrenmanı,
     artı 150 dk orta ya da 75 dk yoğun kardiyo.
   Tarayıcıya bağlı değildir; testleri tests/programs.test.ts içinde. */

export type Level = "yeni" | "orta" | "ileri";
export type Goal = "genel" | "kas" | "guc";
export type Equip = "salon" | "ev" | "yok";

// [hareket, set, tekrar hedefi] — süreli hareketlerde tekrar hedefi saniyedir
export type Item = [string, number, string];
export interface Session { name: string; items: Item[] }

export interface ProgramDef {
  id: string;
  name: string;
  short: string;              // tek cümlelik özet
  levels: Level[];            // uygun deneyim seviyeleri
  goals: Goal[];
  equip: Equip;
  days: number[];             // desteklenen haftalık gün sayıları
  sessions: Session[];
  // gün sayısına göre haftadaki seansların sırası (seans adlarının indeksleri); yoksa sırayla döner
  rotation?: Record<number, number[]>;
  who: string;                // kime uygun, neden
  progression: string[];      // nasıl ilerlenir
  stall: string;              // takılınca ne yapılır
  tips: string[];             // yeni başlayana notlar
  source: string;
}

const COMMON_TIPS = [
  "İlk 2-3 hafta tekniği öğrenmeye ayır: hafif başla, her tekrarı kontrollü yap. Ağırlık sonra çok hızlı artar.",
  "Her ağır hareketten önce 2-3 hafif ısınma seti yap (uygulama bunları önerebilir).",
  "Setleri tükenmeden bitir: çoğu sette 1-3 tekrar daha yapabilecek gücün kalsın (RIR 1-3).",
  "Haftada en az 150 dk tempolu yürüyüş, bisiklet ya da benzeri kardiyo ekle; ağırlık antrenmanının yerini tutmaz, tamamlar.",
  "Ağrı (eklemde batma, keskin acı) ile yorgunluğu ayır; ağrı varsa o hareketi bırak, gerekirse bir uzmana danış.",
];

export const PROGRAMS: ProgramDef[] = [
  {
    id: "baslangic-tam",
    name: "Başlangıç Tam Vücut",
    short: "Makine ve dumbbell ağırlıklı, 8-12 tekrarlı, bütün vücudu her antrenmanda çalıştıran ilk program.",
    levels: ["yeni"], goals: ["genel", "kas"], equip: "salon", days: [2, 3],
    sessions: [
      { name: "A", items: [["Leg Press", 3, "10-12"], ["Chest Press Makinesi", 3, "10-12"], ["Lat Pulldown (Geniş)", 3, "10-12"], ["Dumbbell Romanian Deadlift", 3, "10-12"], ["Seated Dumbbell Shoulder Press", 2, "10-12"], ["Plank", 3, "30"]] },
      { name: "B", items: [["Goblet Squat", 3, "10-12"], ["Dumbbell Bench Press", 3, "10-12"], ["Seated Cable Row", 3, "10-12"], ["Lying Leg Curl", 2, "10-12"], ["Lateral Raise (Dumbbell)", 2, "12-15"], ["Dead Bug", 3, "10"]] },
    ],
    who: "Hiç ağırlık çalışmamış ya da uzun ara vermiş biri için. Makineler ve dumbbell'lar tekniği öğrenmeyi kolaylaştırır; 8-12 tekrar, ACSM'in yeni başlayanlar için önerdiği aralıktır.",
    progression: [
      "Çift ilerleme: bir hareketin bütün setlerinde üst sınıra (12) ulaşınca bir sonraki antrenmanda ağırlığı en küçük adımla artır (makinede bir kademe, dumbbell'da 1-2 kg).",
      "Ağırlığı artırınca tekrarlar alt sınıra (10) düşer; yeniden 12'ye çıkana kadar o ağırlıkta kal.",
      "A ve B'yi sırayla yap: A, B, A; bir sonraki hafta B, A, B.",
    ],
    stall: "Bir hareket 3 antrenman üst üste ilerlemiyorsa uykuna ve beslenmene bak; sonra ağırlığı %10 azaltıp yeniden çık.",
    tips: COMMON_TIPS,
    source: "ACSM 2009 (yeni başlayan: 2-3 gün, 8-12 RM); CDC/DSÖ haftalık kuvvet ve kardiyo önerileri.",
  },
  {
    id: "3x5",
    name: "3×5 Doğrusal Güç",
    short: "Squat her antrenmanda; az hareket, ağır set, her antrenmanda biraz daha ağır (Starting Strength tarzı).",
    levels: ["yeni"], goals: ["guc"], equip: "salon", days: [2, 3],
    sessions: [
      { name: "A", items: [["Back Squat", 3, "5"], ["Bench Press (Barbell)", 3, "5"], ["Deadlift", 1, "5"]] },
      { name: "B", items: [["Back Squat", 3, "5"], ["Overhead Press (Barbell)", 3, "5"], ["Deadlift", 1, "5"]] },
    ],
    who: "Güçlenmek isteyen, barbell ve squat sehpası olan yeni başlayan için. Yeni başlayan bir sonraki antrenmana kadar toparlanabildiği için ağırlık neredeyse her antrenmanda artar.",
    progression: [
      "Bütün setleri 5 tekrarla tamamladığın her antrenmanda ağırlığı artır: squat ve deadlift +2,5-5 kg, bench ve overhead press +1,25-2,5 kg.",
      "Boş barla (20 kg) ya da rahatça 5 tekrar yapabildiğin hafif bir ağırlıkla başla.",
      "Setler arası 3-5 dakika dinlen.",
    ],
    stall: "Aynı ağırlıkta 3 antrenman üst üste 5 tekrarı tamamlayamazsan ağırlığı %10 düşür ve yeniden çık. Bu birkaç kez tekrarlanırsa 5×5 yerine GZCLP gibi bir programa geçme zamanı.",
    tips: COMMON_TIPS,
    source: "Doğrusal ilerleme modeli (Rippetoe, Starting Strength); ACSM 2009 yük artışı ilkesi.",
  },
  {
    id: "5x5",
    name: "5×5 Güç",
    short: "Üç temel hareket, 5 set 5 tekrar, her antrenmanda +2,5 kg (StrongLifts tarzı).",
    levels: ["yeni"], goals: ["guc", "genel"], equip: "salon", days: [3],
    sessions: [
      { name: "A", items: [["Back Squat", 5, "5"], ["Bench Press (Barbell)", 5, "5"], ["Barbell Row", 5, "5"]] },
      { name: "B", items: [["Back Squat", 5, "5"], ["Overhead Press (Barbell)", 5, "5"], ["Deadlift", 1, "5"]] },
    ],
    who: "Güç ve genel kuvvet isteyen, haftada 3 gün gelebilen yeni başlayan için. Hareket sayısı az olduğu için öğrenmesi ve takip etmesi kolay.",
    progression: [
      "5 setin hepsini 5 tekrarla bitirdiğin her antrenmanda +2,5 kg (deadlift +5 kg).",
      "Boş barla (20 kg) başla; ilk haftalar kolay gelecek, bu bilerek böyle.",
      "A ve B'yi sırayla yap; setler arası 3-5 dakika dinlen.",
    ],
    stall: "Bir harekette 3 antrenman üst üste 5×5'i tamamlayamazsan o hareketin ağırlığını %10 düşür. Düşürmeler sıklaşınca GZCLP'ye geç.",
    tips: COMMON_TIPS,
    source: "5×5 doğrusal ilerleme düzeni (StrongLifts tarzı); ACSM 2009 yük artışı ilkesi.",
  },
  {
    id: "gzclp",
    name: "GZCLP",
    short: "Her gün bir ağır (T1), bir orta (T2), bir hafif (T3) hareket: güç ve kası birlikte geliştirir.",
    levels: ["yeni", "orta"], goals: ["guc", "kas"], equip: "salon", days: [3, 4],
    sessions: [
      { name: "1", items: [["Back Squat", 5, "3"], ["Bench Press (Barbell)", 3, "10"], ["Lat Pulldown (Geniş)", 3, "15"]] },
      { name: "2", items: [["Overhead Press (Barbell)", 5, "3"], ["Deadlift", 3, "10"], ["Dumbbell Row (Tek Kol)", 3, "15"]] },
      { name: "3", items: [["Bench Press (Barbell)", 5, "3"], ["Back Squat", 3, "10"], ["Lat Pulldown (Geniş)", 3, "15"]] },
      { name: "4", items: [["Deadlift", 5, "3"], ["Overhead Press (Barbell)", 3, "10"], ["Dumbbell Row (Tek Kol)", 3, "15"]] },
    ],
    who: "5×5 ya da 3×5'te takılmaya başlayan ya da güçle birlikte kas da isteyen biri için. Takılınca ne yapılacağı baştan belli olduğu için uzun süre ilerletir.",
    progression: [
      "T1 (ilk hareket, 5×3): son seti yapabildiğin kadar tekrarla bitir; tamamlarsan bir sonraki sefer +2,5 kg (squat/deadlift +5 kg).",
      "T2 (ikinci hareket, 3×10): tamamlarsan +2,5 kg.",
      "T3 (üçüncü hareket, 3×15): son sette 25 tekrar yapabiliyorsan ağırlığı artır.",
      "Günleri sırayla yap: 1, 2, 3, 4. Haftada 3 gün geliyorsan sıra haftalara kayar.",
    ],
    stall: "T1'de 5×3 tamamlanmazsa aynı ağırlıkla 6×2'ye, o da olmazsa 10×1'e geç; o da olmazsa ağırlığı %15 düşürüp 5×3'e dön. T2'de 3×10 olmazsa 3×8, sonra 3×6; sonra ağırlığı düşür.",
    tips: COMMON_TIPS,
    source: "GZCL yöntemi (Cody Lefever), GZCLP doğrusal sürümü; ACSM 2009.",
  },
  {
    id: "ust-alt",
    name: "Üst / Alt",
    short: "Haftada 4 gün: iki üst vücut, iki alt vücut; her kas grubu haftada iki kez.",
    levels: ["orta", "ileri"], goals: ["kas", "genel", "guc"], equip: "salon", days: [4],
    sessions: [
      { name: "Üst", items: [["Bench Press (Barbell)", 4, "6-8"], ["Barbell Row", 4, "6-8"], ["Overhead Press (Barbell)", 3, "8-10"], ["Lat Pulldown (Geniş)", 3, "8-12"], ["EZ-Bar Curl", 2, "10-12"], ["Skull Crusher (EZ-Bar)", 2, "10-12"]] },
      { name: "Alt", items: [["Back Squat", 4, "6-8"], ["Romanian Deadlift", 3, "8-10"], ["Bulgarian Split Squat", 3, "10"], ["Seated Leg Curl", 3, "10-12"], ["Seated Calf Raise", 4, "12-15"], ["Hanging Leg Raise", 3, "10-15"]] },
    ],
    rotation: { 4: [0, 1, 0, 1] },
    who: "En az 6 aydır düzenli çalışan, haftada 4 gün gelebilen ve kas kütlesi isteyen biri için. Her kas haftada iki kez, toparlanmaya yetecek aralıklarla çalışır.",
    progression: [
      "Çift ilerleme: bütün setlerde üst sınıra ulaşınca ağırlığı artır (büyük hareketlerde 2,5 kg, küçüklerde en küçük adım).",
      "Ağır hareketlerde setler arası 2-3 dk, küçüklerde 1-2 dk dinlen.",
    ],
    stall: "Bir hareket 2-3 hafta ilerlemiyorsa bir hafta setleri yarıya indir (deload), sonra devam et; yine olmazsa o hareketi benzeriyle değiştir.",
    tips: COMMON_TIPS.slice(1),
    source: "ACSM 2009 (orta seviye: 3-4 gün, kas grubu başına haftada iki çalışma).",
  },
  {
    id: "ppl",
    name: "Push / Pull / Legs",
    short: "İtiş, çekiş ve bacak günleri; 3 günde her kas haftada bir, 6 günde iki kez.",
    levels: ["orta", "ileri"], goals: ["kas"], equip: "salon", days: [3, 5, 6],
    sessions: [
      { name: "Push", items: [["Bench Press (Barbell)", 4, "6-8"], ["Incline Dumbbell Press", 3, "8-10"], ["Seated Dumbbell Shoulder Press", 3, "8-10"], ["Lateral Raise (Dumbbell)", 3, "12-15"], ["Triceps Pushdown (Halat)", 3, "10-12"], ["Overhead Cable Extension", 3, "10-12"]] },
      { name: "Pull", items: [["Deadlift", 3, "5"], ["Barfiks (Pull-up)", 3, "6-10"], ["Seated Cable Row", 3, "8-12"], ["Face Pull", 3, "12-15"], ["Barbell Curl", 3, "8-12"], ["Hammer Curl", 3, "10-12"]] },
      { name: "Legs", items: [["Back Squat", 4, "6-8"], ["Romanian Deadlift", 3, "8-10"], ["Leg Press", 3, "10-12"], ["Lying Leg Curl", 3, "10-12"], ["Leg Extension", 3, "12-15"], ["Standing Calf Raise", 4, "12-15"]] },
    ],
    who: "Deneyimli, kas kütlesi hedefleyen ve haftada 5-6 gün ayırabilen biri için. 3 günde de yapılır ama o zaman her kas haftada bir kez çalışır; 3 gün için Üst/Alt ya da tam vücut daha verimlidir.",
    progression: [
      "Çift ilerleme: bütün setlerde üst sınıra ulaşınca ağırlığı artır.",
      "6 günde sıra: Push, Pull, Legs, Push, Pull, Legs; 5 günde döngü haftalara kayar.",
    ],
    stall: "Bir hareket 2-3 hafta ilerlemiyorsa bir hafta hafiflet (deload); yorgunluk birikiyorsa gün sayısını azalt.",
    tips: COMMON_TIPS.slice(1),
    source: "ACSM 2009 (ileri seviye: 4-6 gün, bölünmüş programlar).",
  },
  {
    id: "ev-dumbbell",
    name: "Ev Dumbbell Tam Vücut",
    short: "Yalnız bir çift ayarlanabilir dumbbell ile evde bütün vücut.",
    levels: ["yeni", "orta"], goals: ["genel", "kas"], equip: "ev", days: [2, 3],
    sessions: [
      { name: "A", items: [["Goblet Squat", 3, "8-12"], ["Dumbbell Bench Press", 3, "8-12"], ["Dumbbell Row (Tek Kol)", 3, "8-12"], ["Dumbbell Romanian Deadlift", 3, "8-12"], ["Standing Dumbbell Press", 2, "8-12"], ["Plank", 3, "30"]] },
      { name: "B", items: [["Reverse Lunge", 3, "8-12"], ["Şınav (Push-up)", 3, "5-15"], ["Dumbbell Row (Tek Kol)", 3, "8-12"], ["Glute Bridge", 3, "12-15"], ["Lateral Raise (Dumbbell)", 2, "12-15"], ["Dumbbell Curl", 2, "10-12"], ["Dead Bug", 3, "10"]] },
    ],
    who: "Salona gidemeyen, evde bir çift dumbbell'ı olan biri için. Bench yoksa Dumbbell Bench Press'i yerde (floor press) yap.",
    progression: [
      "Çift ilerleme: bütün setlerde üst sınıra ulaşınca dumbbell'ı bir adım ağırlaştır.",
      "Ağırlık yetmeyince tekrarı değil yavaşlığı artır: 3 saniyede in, 1 saniye bekle, çık.",
      "A ve B'yi sırayla yap.",
    ],
    stall: "Dumbbell'lar hafif kalmaya başlarsa tek bacak/tek kol varyasyonlara geç (Bulgarian split squat, tek bacak RDL) ya da ağır bir çift edin.",
    tips: COMMON_TIPS,
    source: "ACSM 2009; CDC/DSÖ kuvvet önerisi (bütün büyük kas grupları, haftada en az 2 gün).",
  },
  {
    id: "vucut-agirligi",
    name: "Vücut Ağırlığı Başlangıç",
    short: "Ekipmansız, evde ya da parkta; zorluğu varyasyonla artan tam vücut.",
    levels: ["yeni"], goals: ["genel", "kas"], equip: "yok", days: [2, 3],
    sessions: [
      { name: "Tam vücut", items: [["Air Squat (Vücut Ağırlığı)", 3, "10-20"], ["Incline Şınav", 3, "5-12"], ["Inverted Row", 3, "5-12"], ["Glute Bridge", 3, "12-20"], ["Reverse Lunge", 2, "8-12"], ["Plank", 3, "30-60"]] },
    ],
    who: "Hiç ekipmanı olmayan ya da önce kendi vücut ağırlığıyla başlamak isteyen için. Inverted row için sağlam bir masa ya da alçak bir bar yeterli; yoksa yerine Superman yap.",
    progression: [
      "Bir hareketin bütün setlerinde üst sınıra ulaşınca daha zor varyasyona geç: Incline şınav → şınav → decline şınav; squat → reverse lunge → Bulgarian split squat; inverted row'da ayakları öne al.",
      "Varyasyon değişince tekrarlar yeniden alt sınırdan başlar. Programdaki hareketi düzenleyerek yenisini yazabilirsin.",
    ],
    stall: "Bir varyasyonda 3 antrenman ilerlemezsen tempoyu yavaşlat (3 sn in) ya da bir set ekle.",
    tips: COMMON_TIPS,
    source: "Varyasyonla ilerleme ilkesi; CDC/DSÖ kuvvet önerisi.",
  },
];

export const programById = (id: string) => PROGRAMS.find(p => p.id === id);

// Haftanın hangi günleri (WEEKDAYS kodları) — gün sayısına göre, araya dinlenme koyarak
export const PLAN_DAYS: Record<number, string[]> = { 2: ["MO", "TH"], 3: ["MO", "WE", "FR"], 4: ["MO", "TU", "TH", "FR"], 5: ["MO", "TU", "WE", "FR", "SA"], 6: ["MO", "TU", "WE", "TH", "FR", "SA"] };

// Seçilen gün sayısında haftalık plan: gün kodu → seans indeksi
export function weeklyPlan(p: ProgramDef, days: number): [string, number][] {
  const codes = PLAN_DAYS[days] || PLAN_DAYS[3];
  const order = p.rotation?.[days] ?? codes.map((_, i) => i % p.sessions.length);
  return codes.map((c, i) => [c, order[i]]);
}

export interface Answers { level: Level; goal: Goal; equip: Equip; days: number }
export interface Recommendation { program: ProgramDef; days: number; reasons: string[]; alternatives: { program: ProgramDef; days: number; why: string }[] }

// gün sayısını programın desteklediği en yakın değere çeker (eşitlikte az olanı seçer)
const fitDays = (p: ProgramDef, d: number) => p.days.reduce((best, x) => Math.abs(x - d) < Math.abs(best - d) ? x : best, p.days[0]);
const P = (id: string) => programById(id)!;

export function recommend(a: Answers): Recommendation {
  const reasons: string[] = [];
  let main: ProgramDef, alts: [string, string][] = [];

  if (a.equip === "yok") {
    main = P("vucut-agirligi");
    reasons.push("Ekipmanın olmadığı için vücut ağırlığıyla, zorluğu varyasyonla artan bir program.");
    alts = [["ev-dumbbell", "Bir çift dumbbell edinirsen daha hızlı ilerlersin."]];
  } else if (a.equip === "ev") {
    main = P("ev-dumbbell");
    reasons.push("Evde dumbbell'la bütün büyük kas gruplarını çalıştıran bir program.");
    alts = [["vucut-agirligi", "Dumbbell'lar yanında değilken ekipmansız gün."]];
  } else if (a.level === "yeni") {
    if (a.goal === "guc") {
      main = a.days >= 3 ? P("5x5") : P("3x5");
      reasons.push("Yeni başlayan güç hedefinde en hızlı ilerlemeyi, her antrenmanda biraz ağırlık eklenen doğrusal programlar sağlar.");
      alts = a.days >= 3 ? [["3x5", "Daha kısa antrenman isteyene: aynı mantık, daha az set."], ["gzclp", "Güçle birlikte kas da istersen."]] : [["baslangic-tam", "Ağır barbell yerine makinelerle başlamak istersen."]];
    } else if (a.goal === "kas" && a.days >= 4) {
      main = P("gzclp");
      reasons.push("Haftada 4 gün ayırabildiğin ve kas istediğin için ağır, orta ve hafif setleri birleştiren GZCLP.");
      alts = [["baslangic-tam", "Önce 2-3 ay tam vücutla tekniği oturtmak istersen."]];
    } else {
      main = P("baslangic-tam");
      reasons.push("Yeni başlayan için en güvenli ve verimli başlangıç: haftada 2-3 gün tam vücut, 8-12 tekrar (ACSM'in önerdiği aralık).");
      alts = [["5x5", "Barbell'la güç odaklı çalışmak istersen."]];
    }
    if (a.days >= 5) reasons.push("Yeni başlarken 5-6 gün gerekmez: kaslar dinlenirken büyür. Kalan günlerde yürüyüş ya da bisiklet gibi kardiyo yap.");
  } else {
    if (a.goal === "guc") {
      main = P("gzclp");
      reasons.push("Doğrusal programlarda takılmaya başlayan seviyede, takılınca ne yapılacağı belli olan GZCLP uzun süre ilerletir.");
      alts = [["ust-alt", "Güçle birlikte daha çok kas hacmi istersen, 4 gün."]];
    } else if (a.days >= 5 && a.goal === "kas") {
      main = P("ppl");
      reasons.push("5-6 gün ayırabildiğin ve kas istediğin için her kası haftada iki kez çalıştıran Push/Pull/Legs.");
      alts = [["ust-alt", "Daha az gün ve daha çok dinlenme istersen."]];
    } else if (a.days >= 4) {
      main = P("ust-alt");
      reasons.push("Haftada 4 günle her kas grubunu iki kez çalıştırmanın en dengeli yolu Üst/Alt.");
      alts = [["gzclp", "Güç tarafını öne çıkarmak istersen."]];
    } else {
      main = a.goal === "kas" ? P("gzclp") : P("baslangic-tam");
      reasons.push(a.goal === "kas"
        ? "Haftada 2-3 günle kas için her antrenmanda bütün vücudu çalıştırmak, bölünmüş programdan daha verimli."
        : "Genel sağlık için haftada 2-3 gün tam vücut yeterli ve sürdürülebilir.");
      alts = [["ppl", "İleride gün sayını artırırsan."]];
    }
  }

  const days = fitDays(main, a.days);
  if (days !== a.days) reasons.push(`${main.name} haftada ${main.days.join(" ya da ")} gün için tasarlandı; planını ${days} güne göre kurdum.`);
  reasons.push("Haftada en az 150 dk orta tempolu kardiyo da ekle (CDC/DSÖ önerisi).");
  return {
    program: main, days, reasons,
    alternatives: alts.filter(([id]) => id !== main.id).map(([id, why]) => ({ program: P(id), days: fitDays(P(id), a.days), why })),
  };
}
