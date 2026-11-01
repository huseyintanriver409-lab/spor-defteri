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

**Değişmesi gereken teknoloji değil, yapı.** Bugünkü "her şey tek HTML dosyasında" düzeni başlangıç için ideal, ancak büyüdükçe bakımı zorlaşır (şu an ~1.800 satır). Aşağıdaki fazlar bunu adım adım çözüyor.

## Şu anki durum (Faz 1 — tamamlandı)

```
spor-defteri.html      Uygulamanın tamamı (tek dosya, çevrimdışı; dosyaya çift tıklayınca da çalışır)
index.html             Web sitesinin giriş sayfası → spor-defteri.html'e yönlendirir
manifest.webmanifest   PWA tanımı (ad, ikon, renkler)
sw.js                  Service worker: çevrimdışı önbellek
icons/                 Uygulama ikonları (192, 512, maskable, Apple)
YOL-HARITASI.md        Bu belge
```

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
- **UX kuralları:** Silme işlemleri onay sormaz, 5 saniye "Geri al" sunar. Canlı antrenmanda her set anında kaydedilir. Ekran açık tutulur (Wake Lock). Dokunuşlar kısa titreşimle onaylanır (ayarlardan kapatılabilir).

## Faz 2 — Yayına alma ve cihazlara kurulum

**Gereken:** GitHub hesabı (ücretsiz).

1. Bu klasörü bir GitHub deposuna koy.
2. GitHub Pages'i aç. Uygulama `https://<kullanıcı>.github.io/spor-defteri/` adresinde yayınlanır.
3. Android'de Chrome ile bu adresi aç, "Uygulamayı yükle"ye bas. Windows'ta Edge ile aç, "Uygulama olarak yükle"ye bas. İkisi de çevrimdışı çalışır.
4. Her güncellemeden sonra `sw.js` içindeki `CACHE` sürüm adını artır (`spor-defteri-v2` gibi).

**Dikkat:** Her kurulumun (telefon, bilgisayar, tarayıcı) verisi kendi içinde durur. Faz 4'e kadar cihazlar arası aktarım "Yedek → Birleştir" ile yapılır.

## Faz 3 — Kod tabanını büyümeye hazırlamak

**Gereken:** Bilgisayara Node.js kurulumu.

- **Vite** ile proje yapısı: `src/` altında modüller (`data/`, `log/`, `programs/`, `stats/`, `tools/`, `sync/`).
- **TypeScript**'e kademeli geçiş. Veri modeli tiplerle tanımlanır, hatalar derleme sırasında yakalanır.
- **IndexedDB**'ye geçiş (localStorage'ın ~5 MB sınırı yerine). Yıllarca kayıt için güvenli alan sağlar. Göç, şema sürümüyle (`v: 3`) otomatik yapılır.
- **Testler:** Önce `mergeStates`, kademeli yüklenme, rekor ve toparlanma hesapları için birim testleri (Vitest).
- Derleme yine tek bir çevrimdışı çıktı (veya PWA) üretir. Kullanıcı açısından hiçbir şey değişmez.

## Faz 4 — Google entegrasyonu

**Gereken:** Google Cloud projesi ve OAuth istemci kimliği (adım adım yapılacak, ücretsiz). Uygulama Faz 2'deki https adresinden çalışmalı.

- **Giriş:** Google Identity Services, yalnızca tarayıcıda; sunucu gerekmez.
- **Drive senkronizasyonu:** Veriler Drive'daki gizli uygulama klasöründe (`appDataFolder`) tutulur. Açılışta ve kayıttan sonra `mergeStates` ile birleştirilir. Çevrimdışıyken yerelde çalışır, internet gelince eşitlenir.
- **Takvim:** Antrenman bitince takvime otomatik etkinlik yazılır. Takvimdeki planlı antrenmanlar uygulamada görünür.
- Uygulama kişisel kullanımda "test" modunda kalır. Google doğrulamasına gerek yoktur (100 test kullanıcısına kadar).

## Faz 5 — Mağazalar (isteğe bağlı)

- **Google Play:** Bubblewrap/TWA ile PWA paketlenir. Geliştirici hesabı bir kerelik 25 dolar.
- **Microsoft Store:** PWABuilder ile paketlenir. Ya da daha "yerel" bir his gerekirse Tauri kullanılır.
- Bildirimler (dinlenme sayacı, antrenman hatırlatması) için Capacitor'a geçiş değerlendirilir.

## Kurallar (yeni özellik eklerken)

- Veri yapısında geriye uyumsuz bir değişiklik yapılırsa `SCHEMA` artırılır ve `withDefaults` içine göç adımı eklenir.
- Yeni bir kayıt türü eklenirse `COLLECTIONS` içine kalıcı bir anahtarla eklenir. Damgalama ve birleştirme otomatik çalışır.
- Cihaza özel geçici durum (açık ekran, taslak) `mergeStates` sonunda yerelden korunur.
- Kullanıcı metni HTML'e her zaman `esc()` ile basılır.
