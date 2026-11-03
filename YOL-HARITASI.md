# Spor Defteri — Mimari ve Yol Haritası

## Karar: Web teknolojisi (HTML/CSS/JavaScript) temel olarak kalıyor

Hedef platformlar: telefon (Android), Windows ve tarayıcı. Ayrıca Google ile senkronizasyon isteniyor.

Bu hedefler için en uygun yol, **tek bir web kod tabanından bütün platformlara çıkmak**:

| Platform | Nasıl | Ek kod |
|---|---|---|
| Tarayıcı | Doğrudan | Yok |
| Android (ana ekrana kurulum) | PWA: Chrome → "Uygulamayı yükle" | Yok (hazır) |
| Windows (masaüstü uygulaması gibi) | PWA: Edge/Chrome → "Uygulama olarak yükle" | Yok (hazır) |
| Google Play Store | PWA'yı TWA (Bubblewrap) veya Capacitor ile paketlemek | Çok az |
| Microsoft Store | PWABuilder ile paketlemek, ya da Tauri ile masaüstü uygulaması | Çok az |

Alternatif olarak Android için Kotlin ve Windows için C# ile ayrı yerel uygulamalar yazılabilirdi. Ama aynı uygulama üç kez yazılır, her özellik üç kez eklenir. Flutter ya da React Native gibi çapraz platform çatıları da mümkün, fakat mevcut kodun baştan yazılmasını gerektirir. Bu uygulamanın ihtiyaçları (form, liste, grafik, çevrimdışı veri, Google API) web teknolojisiyle eksiksiz karşılanıyor.

**Değişmesi gereken teknoloji değil, yapı.** "Her şey tek HTML dosyasında" düzeni başlangıç için idealdi, ancak büyüdükçe bakımı zorlaşıyordu (~1.800 satır JS). Faz 3 ile kaynak bölündü; kullanıcıya giden çıktı yine tek dosya.

## Şu anki durum (Faz 1, 2 tamamlandı; Faz 3 ilk adım tamamlandı)

```
spor-defteri.html        HTML iskeleti (Vite girişi)
src/app.js               Açılış: modüllerin setup()'larını sırayla çağırır, veriyi yükler, ilk ekranı açar
src/app/                 Arayüz, ekran ekran:
  store.js               state (setState ile değişir), load/save, $, ic, esc, toast, onay penceresi
  exercises.js           hareket kütüphanesi bilgileri, kas grupları, set biçimleri
  ui.js                  titreşim, ekran açık tutma, geri al, alttan panel, hareket seçici, sekmeler
  log.js / programs.js   elle kayıt; programlar, haftalık plan, elle takvim bağlantıları
  live.js                canlı antrenman ekranı ve süreli setler
  home.js / history.js   Bugün ekranı; aylık takvim
  stats.js               hafta, süreklilik, hareket grafiği, rekorlar, kaslar, güç skoru
  library.js / tools.js  hareketler, vücut ölçüleri; 1RM, plaka, ısınma, dinlenme sayacı
  backup.js / cloud.js   yedek ve CSV; Google Drive ve Google Takvim
  presets.js             hazır program listesi, program ayrıntısı, "Bana program öner" (ilk açılış da bu)
  importer.js            bağlantıyla gelen programın önizlemesi, paylaşma, "Claude ile program yap"
  settings.js            ayarlar, tema, ilk açılış, erişilebilirlik, PWA kaydı
src/styles.css           "Atletik" tasarım sistemi, gömülü Inter yazı tipi
src/core/                Tarayıcıya bağımlı olmayan, test edilen mantık (TypeScript)
  schema.ts              Veri modeli, damgalama, mergeStates
  training.ts            Hacim, 1RM, ısınma, plaka, güç puanı, kademeli yüklenme kararı
  recovery.ts            Kas toparlanması
  sync.ts                Bulut eşitleme akışı (depodan bağımsız)
  calendar.ts            Google Takvim: neyin yazılacağı, etkinlik içerikleri, kimlikler
  dates.ts               Tarih yardımcıları
  library.ts             Hareket kütüphanesi (kas grubuna göre)
  programs.ts            Hazır programlar ve "Bana program öner" kuralları (kaynakları dosyada)
  importer.ts            Bağlantıyla program ekleme biçimi (#ekle=…), hareket eşleştirme, Claude isteği
src/sync/                Google girişi (google.ts), Drive dosyası (drive.ts), Takvim istemcisi (calendar.ts)
src/config.ts            Google istemci kimliği (.env → VITE_GOOGLE_CLIENT_ID)
tests/                   Vitest birim testleri + smoke.browser.js (tarayıcıda elle çalıştırılan akış testi)
public/                  Derlemeye olduğu gibi kopyalananlar: sw.js, manifest, ikonlar, index.html yönlendirmesi
.github/workflows/       main'e gönderimde test → derleme → GitHub Pages yayını
YOL-HARITASI.md          Bu belge
```

**Komutlar** (Node.js gerekir):

| Komut | Ne yapar |
|---|---|
| `npm install` | Bağımlılıkları kurar (ilk seferde) |
| `npm run dev` | Geliştirme sunucusu: http://localhost:8765/spor-defteri.html, kaydedince sayfa yenilenir |
| `npm test` | Birim testleri |
| `npm run typecheck` | TypeScript tip kontrolü |
| `npm run build` | `dist/spor-defteri.html`: CSS ve JS gömülü tek dosya; çift tıklayınca da çalışır |

### Veri modeli (şema v2, senkronizasyona hazır)

Veriler tarayıcının `localStorage`'ında `sporDefteri.v1` anahtarı altında, tek bir JSON nesnesi olarak durur.

- **Koleksiyonlar ve anahtarları:** `entries` (id), `programs` (id), `sessions` (id), `body` (tarih), `custom` (hareket adı).
- **`u`:** Her kaydın en son değiştiği an (ms). `save()` her kaydı bir önceki kaydedilen haliyle karşılaştırıp merkezi olarak damgalar. Yeni bir özellik eklerken ayrıca bir şey yapmaya gerek yoktur.
- **`deleted`:** Silinen kayıtların mezar taşları (`{c, k, at}`), 365 gün tutulur. İki cihaz birleştirilirken silinen kaydın geri gelmesini önler.
- **`settingsU`:** Ayarların (profil, plan, hedef, hareket notları, dinlenme) son değişme anı. Ayarlar tek parça olarak "son yazan kazanır" mantığıyla birleşir.
- **`deviceId`:** Cihaz kimliği. `active`, `live` ve `draft` cihaza özeldir, senkronize edilmez.
- **`mergeStates(local, remote)`:** Her kayıt için en yeni sürüm kazanır, mezar taşları silmeleri uygular. Hangi yönde birleştirilirse birleştirilsin sonuç aynıdır. Bugün "Yedekten geri yükle → Birleştir" bunu kullanıyor; Google Drive senkronizasyonu da aynı fonksiyonu kullanacak.
- Eski (v1) veriler açılışta otomatik olarak v2'ye yükseltilir.

### Tasarım sistemi: "Atletik"

Platformdan bağımsız, kendi tasarım dilimiz. Material 3 ya da iOS dili kullanılmıyor.

- **Tema:** Koyu tema öncelikli, açık tema ve "cihaz ayarı" seçenekleri var. Renkler `:root` değişkenlerinde (`--bg`, `--card`, `--card2`, `--accent` #ff6a2b …), açık tema `html[data-theme="light"]` altında tanımlı.
- **Yazı tipi:** Inter (değişken) dosyaya gömülü, böylece her platformda aynı görünür. Rakamlar eşit genişlikte (`tabular-nums`). Etiketler küçük, büyük harf ve geniş aralıklı (`.eyebrow`); önemli sayılar büyük ve kalın (`.bignum`, `.stat b`).
- **İkonlar:** Lucide 1.50.0, SVG sprite olarak gömülü. Kullanım: `ic("isim")`.
- **Bileşenler:** `.card`, `.btn` (`.primary`, `.xl`, `.sm`, `.quiet`), `.iconbtn` (44 px dokunma alanı), `.seg` ve `.fchip` (kaydırılabilir çipler), `.stepper` (basılı tutunca hızlanır), alttan açılan panel (`openSheet`), geri al bildirimi (`undoable`), onay penceresi (`choose`/`ask`).
- **Ekranlar:** Bugün, Antrenman (Programlar / Elle kayıt / Haftalık plan), Geçmiş (aylık takvim), İlerleme (Hafta / Hareket / Rekorlar / Kaslar / Güç / Vücut), Profil (Ayarlar / Hareketler / Araçlar / Yedek). Canlı antrenman tam ekran açılır (`#focus`).
- **UX kuralları:** Silme işlemleri önce onay sorar (telefon cepteyken yanlışlıkla dokunma), sildikten sonra 5 saniye "Geri al" da sunar. Canlı antrenmanda her set anında kaydedilir. Ekran açık tutulur (Wake Lock). Dokunuşlar kısa titreşimle onaylanır (ayarlardan kapatılabilir).

## Faz 2 — Yayına alma ve cihazlara kurulum (tamamlandı)

Depo: `huseyintanriver409-lab/spor-defteri` (public). Yayın: https://huseyintanriver409-lab.github.io/spor-defteri/

1. Pages kaynağı **GitHub Actions** (Settings → Pages → Source). `main`'e gönderilen her değişiklik `.github/workflows/pages.yml` ile test edilip derlenir ve yayınlanır. Test başarısızsa yayın yapılmaz.
2. Android'de Chrome ile adresi aç, "Uygulamayı yükle"ye bas. Windows'ta Edge ile aç, "Uygulama olarak yükle"ye bas. İkisi de çevrimdışı çalışır.
3. Her güncellemede `public/sw.js` içindeki `CACHE` sürüm adını artır (`spor-defteri-v7` gibi).

**Dikkat:** Her kurulumun (telefon, bilgisayar, tarayıcı) verisi kendi içinde durur. Faz 4'e kadar cihazlar arası aktarım "Yedek → Birleştir" ile yapılır.

## Faz 3 — Kod tabanını büyümeye hazırlamak (devam ediyor)

**Yapıldı (2026-11-01):**
- **Vite** ile proje yapısı; derleme yine tek bir çevrimdışı HTML üretiyor (`vite-plugin-singlefile`). Kullanıcı açısından hiçbir şey değişmedi: adresler, veri anahtarı (`sporDefteri.v1`) ve davranış aynı.
- Saf mantık `src/core/` altında **TypeScript** modüllerine çıkarıldı (veri modeli, birleştirme, kademeli yüklenme, toparlanma, ısınma, plaka, güç puanı). Arayüz kodu bu fonksiyonları ince sarmalayıcılarla çağırıyor.
- **Testler (Vitest):** `mergeStates` (değişmelilik, mezar taşları, ayarlar, cihaza özel alanlar, v1 yedekleri), damgalama, kademeli yüklenme kararları, toparlanma, ısınma, plaka ve güç puanı için 41 test. Testlerin gerçekten hata yakaladığı, koda bilerek hata konarak denendi.

**Sıradaki adımlar:**
- ~~`src/app.js`'i ekranlara göre modüllere bölmek~~: yapıldı (2026-11-01, `src/app/`). Modüller birbirini döngüsel içe aktarır; bu yüzden modül yüklenirken çalışan kod yalnız tanımlardır, düğme bağlamaları her modülün `setup()`'ındadır ve `src/app.js` bunları eski sırayla çağırır. Başka modülün `let` değişkenine doğrudan atanamaz; `setState`, `setTDur` gibi ayarlayıcılar kullanılır.
- Rekor hesaplarını (`renderRecords` içindeki) `core/`'a çıkarıp test etmek.
- **IndexedDB**'ye geçiş (localStorage'ın ~5 MB sınırı yerine). Göç, şema sürümüyle (`v: 3`) otomatik yapılır; eski veri silinmeden önce IndexedDB'de doğrulanmalı. Veri kaybı riski taşıdığı için ayrı ve dikkatli bir adım.
- `app.js`'e kademeli olarak tip kontrolü (`// @ts-check`, sonra `.ts`).

## Faz 4 — Google entegrasyonu (Drive senkronizasyonu yazıldı; istemci kimliği bekleniyor)

**Yapıldı (2026-11-01):**
- **Giriş:** Google Identity Services, yalnızca tarayıcıda; sunucu yok (`src/sync/google.ts`). Kapsam yalnız `drive.appdata`. Erişim anahtarı ~1 saat geçerli; süresi dolunca başlıkta "eşitlemek için dokun" çıkar.
- **Drive senkronizasyonu:** Veriler Drive'daki gizli uygulama klasöründe (`appDataFolder`) tek bir `spor-defteri.json` dosyasında (`src/sync/drive.ts`). Akış `src/core/sync.ts`: indir → `mergeStates` → farklıysa yükle. Cihaza özel alanlar (canlı antrenman, taslak, aktif program, cihaz kimliği) gönderilmez.
- **Ne zaman:** açılışta, antrenman bitince, uygulamaya dönünce / arka plana geçerken, "Şimdi eşitle"de. Ağ isteği sürerken yapılan değişiklikler sonuç yeniden birleştirilerek korunur.
- **Yeni cihaz:** ilk açılışta "Başka cihazda kullanıyorum: Drive'dan getir" başlangıç programı oluşturmadan bağlanır (aksi halde programlar iki kez oluşurdu).
- Drive'a bağlı ve son 10 günde eşitlenmişse "yedek al" hatırlatması gösterilmez.
- Testler: `tests/sync.test.ts` (iki cihaz senaryoları, silme, cihaza özel alanlar, eşzamanlı değişiklik, bozuk dosya, Drive istek biçimi, 401/403). Arayüz akışı tarayıcıda sahte Google ve sahte Drive ile uçtan uca denendi.

**İstemci kimliği kurulumu (bir kez, ücretsiz):**
1. https://console.cloud.google.com → yeni proje (ör. "Spor Defteri").
2. **API'ler ve Hizmetler → Kitaplık → Google Drive API → Etkinleştir.**
3. **OAuth izin ekranı (Google Auth Platform):** Kullanıcı türü **Harici**; uygulama adı "Spor Defteri", destek e-postası. **Kitle → Test kullanıcıları**na kendi Gmail adresini ekle. Uygulama "Test" durumunda kalır, Google doğrulaması gerekmez (100 test kullanıcısına kadar).
4. **Kimlik bilgileri → Kimlik bilgisi oluştur → OAuth istemci kimliği → Web uygulaması.** **Yetkili JavaScript kaynakları:** `https://huseyintanriver409-lab.github.io` ve geliştirme için `http://localhost:8765`. Yönlendirme URI'si gerekmez.
5. Çıkan `....apps.googleusercontent.com` kimliğini `.env` dosyasına `VITE_GOOGLE_CLIENT_ID=` olarak yaz (`.env.example`'a bak), commit'le ve gönder. GitHub'daki derleme `.env`'i kendiliğinden okur.

Giriş ekranında "Google bu uygulamayı doğrulamadı" uyarısı çıkar; test modundaki kişisel uygulamalar için normaldir: **Devam**'a bas.

**Google Takvim (2026-11-01):**
- Kapsam `calendar.app.created`: uygulama kendi "Spor Defteri" takvimini oluşturur ve yalnız ona yazar; kullanıcının diğer takvimlerini ve etkinliklerini göremez.
- **Biten antrenmanlar:** gerçek başlangıç/bitiş saatiyle, set özeti ve toplam hacimle etkinlik olur. Yazılan oturuma `cal: 1` işareti konur ve Drive ile eşitlenir; takvim izni tek cihazda olsa da bütün cihazların antrenmanları o cihazdan yazılır. Açılınca son 30 gün geriye yazılır (çalıştırma başına en fazla 20).
- **Haftalık plan (2026-11-02'den beri tarihli):** her tarih ayrı, plandaki hatırlatma süresiyle bildirimli bir etkinlik. Bugünden planın bitiş tarihine (`plan.until`, Antrenman → Haftalık plan → Bitiş tarihi) kadar, bitiş yoksa 56 gün ilerisine kadar yazılır; her açılışta ileri kayar. Yazılan tarihler `gcal.dates`'te. Plan değişince 4 sn sonra plandan çıkan gelecek tarihler silinir, kalanlar yeniden yazılır; geçmişe dokunulmaz. Çalıştırma başına en fazla 60 etkinlik. Bu, PWA'nın kendisinde olmayan telefon bildirimini de sağlar.
- **✅ Tamamlandı:** o gün biten ilk antrenman, o tarihin plan etkinliğiyle aynı kimlikle (`sdgun`+tarih) "✅ Antrenman: …" olarak gerçek saatiyle yazılır; plandaki etkinlik tamamlandıya döner, ikinci etkinlik açılmaz. Aynı gün ikinci antrenman kendi kimliğiyle ayrı etkinlik olur.
- Eski sürümün tekrarlayan etkinlikleri (`sdplan`+gün) ilk açılışta silinir; eski sürümde kalmış bir cihaz onları geri yazarsa (imzası `d1:` önekisiz) yeniden silinir.
- Etkinlik kimlikleri kayıttan türetilir (base32hex): iki cihaz aynı oturumu yazsa da tek etkinlik olur. Önce güncellenir (PUT), yoksa oluşturulur; takvim Google'da silinmişse yeniden oluşturulur.
- Ayarlar `state.gcal` (log, plan, takvim kimliği, planSig, dates, dated) Drive ile eşitlenir. Drive ve Takvim işleri tek sırada çalışır.
- Kurulum: Cloud projesinde **Google Calendar API** etkin olmalı.
- Testler: `tests/calendar.test.ts`.

**Sıradaki (isteğe bağlı):** Takvimde elle taşınan/eklenen antrenmanları uygulamada göstermek (takvimden okuma).


## Hazır programlar ve program önerisi (2026-11-02)

- 8 hazır program (`src/core/programs.ts`): Başlangıç Tam Vücut, 3×5 Doğrusal Güç, 5×5 Güç, GZCLP, Üst/Alt, Push/Pull/Legs, Ev Dumbbell Tam Vücut, Vücut Ağırlığı Başlangıç. Her birinde kime uygun olduğu, haftalık düzen, nasıl ilerleneceği, takılınca ne yapılacağı, yeni başlayana ipuçları ve kaynak.
- **Bana program öner:** deneyim, öncelik, ekipman ve haftada kaç gün sorulur; öneri, gerekçesi ve alternatifiyle anında çıkar. Dayanak: ACSM 2009 (yeni başlayan 2-3 gün, 8-12 RM, hedefin 1-2 fazlasında %2-10 artış), CDC/DSÖ (haftada ≥2 gün kuvvet, 150 dk orta kardiyo).
- **İlk açılış** doğrudan bu öneri ekranıdır; bilen "Atla" ile geçer.
- Programdan eklenen günler `lib` alanıyla hazır programa bağlıdır; aynı program ikinci kez eklenirse kopya oluşmaz. "Haftalık plana yerleştir" mevcut planın yerine geçer.
- Testler: `tests/programs.test.ts` (her hareket kütüphanede var; 135 cevap birleşiminin hepsinde geçerli öneri; ekipman ve seviye uyumu).
- Kapsam dışı: yüzde hesabıyla çalışan programlar (5/3/1), hareket anlatım videoları.

## Claude ile program: bağlantı (2026-11-02)

Claude (ya da bir arkadaş) programı tek bir bağlantı olarak verir; dokununca uygulama "Bu programı ekleyeyim mi?" önizlemesini açar.

- Biçim (okunabilir, base64 değil): `…/spor-defteri.html#ekle=p=Ad;g=Gün1:Hareket/set/tekrar,…;g=Gün2:…;w=MO:0@18:00,WE:1;u=2027-01-06`. Boşluk yerine `+`. `@saat` ve `u` (bitiş tarihi) isteğe bağlı; sıra yazılmazsa günler sırayla dağılır.
- **Yalnız plan:** `#ekle=w=MO@18:00,WE,SA;u=2027-01-06` programsız gelir; önizlemede her güne mevcut programlardan biri seçilir (varsayılan: o gün plandaki, yoksa plandakiler sırayla) ve haftalık planın yerine geçer. Plan Google Takvim'e kendiliğinden yazılır. Haftalık plan ekranında "Claude ile planla" düğmesi var; Claude'a bugünün tarihi de verilir.
- Bağlantıda `*`, `|`, `_`, `~` kullanılmaz: Claude'un telefon uygulaması `*4*`'ü italik sanıp bağlantıyı ilk hareketten sonra kesiyordu (2026-11-02, v13'te düzeldi); Android'in bağlantı tanıyıcısı da `|` işaretinde duruyor. Eski biçim (`|`, `*`) hâlâ okunur.
- Hareket adları esnek eşleşir (Türkçe harfler, tire, kısmi ad); bulunamayan "yeni hareket" olarak eklenir.
- **Claude ile program yap** (Antrenman → Programlar): Claude'u biçimi anlatan hazır bir istekle açar (`claude.ai/new?q=…`, istek panoya da kopyalanır). Bağlantı açılmazsa Claude'un cevabı yapıştırılır.
- Program kartındaki paylaş düğmesi aynı biçimde bağlantı üretir.
- Android'de APK bu adresleri sahiplendiği için (autoVerify + assetlinks) bağlantı doğrudan uygulamayı açar.
- Testler: `tests/importer.test.ts`.

**Yol 2: Claude bağlayıcısı (kuruldu, `mcp/`).** Uzak MCP sunucusu (Cloudflare Workers + Google girişi, `@cloudflare/workers-oauth-provider`). Claude araçları (`ozet`, `gecmis`, `program_ekle`, `program_guncelle`, `program_sil`, `plan_kur`) Drive'daki eşitleme dosyasını okur/değiştirir; değişiklik `stampChanges` ile damgalanır, telefon bir sonraki eşitlemede `mergeStates` ile alır ve takvimi kendisi günceller. İşlemler `src/core/assistant.ts`te (testler `tests/assistant.test.ts`, `tests/mcp.test.ts`). Sunucu uygulamanın kendi web istemcisini kullanır: Drive appDataFolder istemciye bağlı olduğundan aynı dosyayı ancak böyle görür. Kurulum adımları `mcp/KURULUM.md`. Google uygulaması Test modundayken yenileme anahtarı 7 günde düşer; kalıcı bağlantı için uygulama yayınlanır ve `ALLOWED_EMAILS` gizli değeriyle kullanıcılar sınırlanır.

## Faz 5 — Mağazalar (isteğe bağlı)

- **Google Play:** Bubblewrap/TWA ile PWA paketlenir. Geliştirici hesabı bir kerelik 25 dolar.
- **Microsoft Store:** PWABuilder ile paketlenir. Ya da daha "yerel" bir his gerekirse Tauri kullanılır.
- Bildirimler (dinlenme sayacı, antrenman hatırlatması) için Capacitor'a geçiş değerlendirilir.

## Kurallar (yeni özellik eklerken)

- Veri yapısında geriye uyumsuz bir değişiklik yapılırsa `SCHEMA` artırılır ve `withDefaults` içine göç adımı eklenir.
- Yeni bir kayıt türü eklenirse `COLLECTIONS` içine kalıcı bir anahtarla eklenir. Damgalama ve birleştirme otomatik çalışır.
- Cihaza özel geçici durum (açık ekran, taslak) `mergeStates` sonunda yerelden korunur.
- Kullanıcı metni HTML'e her zaman `esc()` ile basılır.
- Tarayıcıya ve `state`'e bağlı olmayan yeni hesaplar `src/core/` altına yazılır ve `tests/` altında test edilir.
- `src/app/` modüllerinde üst seviyede yalnız tanım (function/const/let) olur; DOM'a dokunan ya da başka modülü çağıran kod `setup()` içine yazılır.
- Göndermeden önce: `npm test`, `npm run typecheck`, `npm run build`; arayüz değiştiyse `tests/smoke.browser.js`.
