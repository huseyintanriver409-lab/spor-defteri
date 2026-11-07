# Yazı sadeleştirme analizi

Tarih: 2026-11-07. Durum: öneri belgesi. Kod dosyalarına dokunulmadı, hiçbir şey uygulanmadı.
Kullanıcının sözü: "Uygulamamda bu kadar yazı istemiyorum, lütfen güzelce analiz edin."

## 1. Özet ve ilkeler

**Özet**
- Uygulamada görünen metnin çoğu, ekranın zaten söylediği şeyi tekrar ediyor: sekme adı üstte başlık olarak, durum hem simge hem cümle olarak, bir eylem üç düğmede.
- Beş ana ekranda (Ana sayfa, Programlar, Canlı antrenman, İlerleme/Hafta, Profil/Ayarlar) görünen sabit metin yaklaşık 244 kelimeden 122 kelimeye iner (%50; yöntem bölüm 6).
- En büyük kazanç tekrar eden yapıları kaldırmaktan gelir (üst bar durum yazısı, Hazır programlar kartı, üç yapay zekâ girişi, Görünüm kartı), tek tek kelime kırpmaktan değil.
- Araştırmaya dayalı açıklamalar (kas payları, set eşikleri, kanıt düzeyleri) silinmez; kısa başlık görünür, ayrıntı (i) arkasında kalır.
- Önemli bulgu: `.help` sınıflı açıklamalar zaten (i) arkasında gizli (styles.css:100, ui.js:55). Envanter bunları görünür saymış; DeepSeek'in "(i) arkasına al" önerilerinin 21'i bu yüzden boşa çıktı (bölüm 8).

**İlkeler**
1. Başlık yerine bağlam: sekme adı alt çubukta zaten yazıyorsa ekranda eyebrow ve başlık tekrar etmez.
2. Boş durumda tek eylem: açıklama cümlesi yok; büyük bir "+" kutusu ve tek kelime etiket.
3. Durum metni yerine simge: bulut, nokta, tik. Metin yalnız hata durumunda çıkar.
4. Liste yerine özet, ayrıntı dokununca: "3 kas dinleniyor", dokununca liste.
5. Açıklamalar (i) arkasında: uzun cümle ekranda durmaz; kaybolmaz.
6. Tekrar eden kontroller kalkar: aynı işi yapan ikinci ve üçüncü düğme, aynı bilgiyi veren ikinci satır.
7. Snack ve onaylar en çok 5 kelime. Veri kaybı olan onayda geri alınamaz sonuç cümlesi kalır.
8. Düğme 1-2 kelime. Her ekranda tek kiraz ana düğme; geri kalanlar sessiz.

**Ağır Sağlam analizi (agir-saglam-tasarim-analizi.md) ile uyum**
- Uyumlu: tek birincil eylem (3.5), büyük harf yok (3.3), kartsız düz liste (3.4), metin = bilgi / fotoğraf = nasıl / çizim = hangi kas (3.7).
- Dikkat (3.2, ölçek rengi çerçeveden ayrı): Drive durum simgeleri yeşil, sarı, mavi nokta olmayacak; durum biçimle (bulut, tik, ünlem) anlatılır, yalnız hata `--danger` alır. DeepSeek'in renkli nokta önerileri bu yüzden değiştirildi.
- Gerilim 1: Ağır Sağlam ekran 3'te "Detayları Gör" gibi küçük bir metin bağlantısı tutuyor. Biz ana sayfada "Analiz" düğmesini kaldırıp kartın tamamını dokunulur yapıyoruz (sağ ok kalır).
- Gerilim 2: Ağır Sağlam sözel durumu ("Zorlayıcı") ve segment çubuğunu koruyor (3.6). Biz de yorgunluk seviye sözcüğünü ve çubuğu tutuyoruz; kalkan şey "Yorgunluk" etiketi ve "Dinlenmeli: ..." listesi.
- Çelişki yok.

## 2. Kullanıcının beş örneği (lider kararları)

### 2.1 "Ne çalışıyoruz?" başlığı
- Konum: spor-defteri.html:41; biçim styles.css:86-88 (`.hero`, 40px başlık).
- Şu an: "Antrenman" eyebrow + "Ne çalışıyoruz?" başlık (3 kelime, ekranın en büyük yazısı).
- Çözüm: eyebrow ve başlık kalkar. Alt sekme çubuğu zaten "Antrenman" diyor. Ekran doğrudan bölüm sekmeleriyle (Programlar / Elle kayıt / Plan / Hareketler) başlar.
- İşlev kaybı: yok. Etki: yüksek (en büyük yazı gider, dikey yer kazanılır).
- Uzantı (DeepSeek dışı, analiz eklemesi, kullanıcı onayı gerek): aynı kalıp İlerleme (html:191, ui.js:142 "Ne kadar güçlendin?") ve Profil (html:350 "Profil / Profilin") için de geçerli. Takvim ve Ana sayfa başlıkları bilgi taşıdığı için (ör. "12 antrenman", "Cuma · hafta 45") kalır.
- Kod notu: ui.js:142 yalnız başlık yazmıyor, `renderSeg("stats")` de çağırıyor; satırın yalnız başlık kısmı çıkarılmalı.

### 2.2 Boş program durumu
- Konum: programs.js:79 ("Henüz program yok" + 11 kelime), spor-defteri.html:48-53 (Hazır programlar kartı), :64 ("Kendi programını oluştur"), :53/:118/:409 (üç yapay zekâ düğmesi).
- Şu an: boş durumda 14 kelimelik boş kart + 12 kelimelik Hazır programlar kartı (3 düğme) + "Kendi programını oluştur" + "Boş antrenman başlat" = yaklaşık 40 kelime, dört farklı düğme. Not: Hazır programlar kartının 26-27 kelimelik açıklaması (html:49) zaten (i) arkasında gizli; görünen yük düğmeler ve başlıklar.
- Çözüm: program yokken listede tek kiraz pahlı kutu: büyük "+" simgesi ve tek etiket "Program ekle" (alternatif: "Program"). Dokununca küçük sayfa, üç seçenek: Hazır programlar / Yapay zekâ ile / Kendin kur. Alttaki "Kendi programını oluştur" ve Hazır programlar kartı kalkar. Program varken listenin sonunda sessiz (kirazsız) "+ Yeni program" satırı aynı sayfayı açar. Tek kiraz kuralı gereği boş durumda "Boş antrenman" kiraz olmaz (sessiz düğme, "Boş antrenman").
- Yapay zekâ girişi: üç düğme (html:53, :118, :409) tek giriş noktasına iner (importer.js:168 zaten üçünü aynı `openAiSheet`'e bağlıyor). Plan sekmesindeki "Yapay zekâ ile planla" kalsın mı: kullanıcı kararı (bölüm 5).
- İşlev kaybı: yok. Hazır programlar, "Bana program öner" sihirbazı ve yapay zekâ aynı sayfadan erişilir. Etki: yüksek (~40 → 9 kelime, 4 düğme → 2).
- Kod notu: programs.js:34-39 (`pNew` gizleme, `recOpen` primary geçişi) ve importer.js:168 bağlamaları uyarlanır.

### 2.3 Üst bar durum yazısı
- Konum: spor-defteri.html:21 (başlangıç değeri), cloud.js:84-89 (`renderSyncStatus`).
- Şu an: "Spor Defteri" altında 6 olası durum cümlesi: "Çevrimdışı · veriler bu cihazda", "Drive ile eşitleniyor…", "Drive: eşitlemek için dokun", "Drive: eşitlenemedi, dokun", "Drive ile eşitlendi · 5 dk önce", "Google Drive'a bağlı". Aynı bilgi Yedek sekmesinde (cloud.js:95) ve hesap kartında (cloud.js:114) iki kez daha yazılı; hesap kartı "üstteki yazıya dokun" diyerek bu altyazıya gönderme yapıyor.
- Çözüm: altyazı kalkar. Logonun yanında küçük bir bulut simgesi durumu gösterir: eşitlendi (bulut + tik), eşitleniyor (dönen bulut), bekliyor / oturum doldu (bulut + nokta), hata (bulut + ünlem, `--danger`), yalnız cihaz (çizgili bulut). Dokununca küçük sayfa: son eşitleme zamanı, hata ayrıntısı, "Şimdi eşitle". Hata durumu dışında ekranda metin yok; hatada tek kelime ("Eşitlenemedi").
- İşlev kaybı: yok (ayrıntı dokununca). Etki: yüksek (6 durum metni → 0; üç yerdeki tekrar tek yere iner).
- Kod notu: cloud.js:114'teki "üstteki yazıya dokun" ifadesi ve cloud.js:89 (`.tap` sınıfı) güncellenir.

### 2.4 Ana sayfa kas yorgunluk listesi
- Konum: home.js:99 (`Dinlenmeli: ${tired.join(", ")}`), home.js:89 (eşik: toparlanma oranı <%50).
- Şu an, doğru anlatım: kas başına "yorgun" yazmıyor. Tek satırda virgülle ayrılmış uzun liste: "Dinlenmeli: Quadriceps, Hamstring, Göğüs, ..." (en çok 18 kas adı, musclemap.ts:6; "20 kas" değil). "Yorgun" kelimesi kas başına yalnız masaüstü fare üstü açıklamasında geçer (bodymap.js:52). Kullanıcının "tek tek yorgun yazıyor" izlenimi büyük olasılıkla iki yerden gelir: bu uzun satır ve Analiz sayfasındaki "Kas kas" listesi (bodymap.js:167-170), orada her kas için ayrı satır var ("Yorgun · 6 Ağu · 9 set · tükeniş").
- Çözüm: tek özet, "3 kas dinleniyor" (hepsi hazırsa "Kaslar hazır", 2 kelime). Vücut haritası zaten kası renkle gösteriyor. Dokununca Toparlanma analizi sayfası (zaten var, bodymap.js:158) listeyi gösterir. Kartın üç adı ("Toparlanma", "Yorgunluk", "Analiz") tek başlığa ("Toparlanma") iner; "Analiz" düğmesi kalkar, kartın tamamı dokunulur olur. Analiz sayfasındaki satırlar "9 set · 6 Ağu" + seviye için nokta/çubuk olarak kısalır.
- İşlev kaybı: yok (kas adları bir dokunuş ötede; analiz sayfası değişmiyor). Etki: yüksek (ana sayfanın en uzun satırı gider).

### 2.5 Ayarlar "Görünüm" bölümü
- Konum: spor-defteri.html:356-362, settings.js:10-16, :71-72, :80.
- Şu an: Görünüm kartında tema çipleri (Koyu / Açık / Cihaz ayarı), cinsiyet seçici, "Vücut haritası çizimi" seçici (cinsiyet boş ya da Diğer ise), yardım metni (gizli). Üst bardaki tema düğmesi zaten koyu → açık → cihaz ayarı döngüsü yapıyor (settings.js:80) ve basınca "Tema: koyu" toast'ı çıkarıyor.
- Çözüm (tema): Görünüm kartındaki üç çip kalkar. Üst bar düğmesi tek kontrol olur; simgesi (ay / güneş / monitör) durumu gösterir, toast kalkar, `title` (tooltip) kalır. İşlev kaybı yok (aynı üç değer döngüyle erişilir; "doğrudan Cihaz ayarına atla" kısayolu gider, küçük).
- Kod notu: `renderSettings()` ilk satırı (settings.js:10-11) `#themeChips` öğesine başvuruyor; öğe kaldırılırsa TypeError verir ve Ayarlar sekmesi tamamen açılmaz. Kod uyarlaması şart: iki satır silinmeli (settings.js:37-44 tema mantığı kalır).
- Çözüm (cinsiyet ve vücut çizimi): Görünüm'den çıkar. Cinsiyet şu an üç yerde soruluyor: ilk açılış formu (presets.js:116), Güç skoru > Profil kartı (html:298) ve bu kart (html:359). Kullanıcı kararı, iki seçenek:
  - A) Vücut haritasının yanında küçük ayar: kas sayfasında (İlerleme > Kaslar, Toparlanma analizi) harita altında tek çip "Erkek / Kadın çizimi". Cinsiyet sorusu Güç skoru profil kartında kalır (orası güç standardı için gerekli). Not: Profil'de "Vücut" bölümü yok; Profil sekmeleri Ayarlar / Araçlar / Yedek, ölçüler İlerleme > Vücut'ta (html:312).
  - B) İlerleme > Vücut alt sekmesinde, ölçülerin üstünde "Cinsiyet" + "Çizim" satırı; Güç skoru profil kartıyla birleşir (tek yerde cinsiyet).
- Etki: orta-yüksek (Görünüm kartı ve ~9 sabit kelime gider; Ayarlar'ın ilk bölümü olan kart kalkınca sayfa daha kısa açılır). İşlev kaybı: yok, ayar yerinden oynar.

## 3. Ekran ekran öneriler

Sütunlar: konum (dosya:satır) | şu anki metin | öneri | etki. Yalnız yüksek ve orta etki tabloda (altı düşük satır da tabloda kaldı); düşük etkililer her bölümün sonunda tek satır. "İşlev kaybı" yalnız gerçekten bir şey kaybolan öneride yazılı. Satır numaraları envanterdendir; doğrulama notu bölüm 8'de. Yeni metinler büyük/küçük harf kuralına göre cümle başı büyük yazılmıştır (DeepSeek'in tamamen küçük harfli önerileri düzeltildi).

### 3.1 Ana sayfa

| konum | şu anki metin | öneri | etki |
|---|---|---|---|
| home.js:47 (envanterde 43) | "Antrenman sürüyor" + "Sıradaki: Squat" | birleştir → başlık yalnız hareket adı; iki ön ek kalkar (Süre + Devam et kartı durumu zaten söylüyor) | orta |
| home.js:51, 57, streak.js:36 | "Bugün çalıştın" başlık + "Tekrar başla" düğme + seri notu "Serin 4 gün. Bugünü de kurtardın." | kaldır → bugün yapıldıysa seri notu çıkmaz (aynı durum 3 kez anlatılıyor); başlık ve düğme kalır | orta |
| home.js:56 | plan listesi: her hareket + süperset etiketi + "3 × 8-12" (5 hareket ≈ 25 kelime) | kısalt → yalnız hareket adları, en çok 4 + "+N"; set x tekrar kalkar (üst satırda toplam set zaten var). İŞLEV KAYBI (küçük): hareket başına hedef tekrar ana sayfada görünmez | yüksek |
| home.js:67 | "İlk programını oluştur ya da boş bir antrenmanla başla." | kaldır (boş durum bkz. 2.2, 3.9) | yüksek |
| home.js:76-77 | "Boş antrenman" + "Başka program" kısayolları (home.js:77, iki ghost düğme) | "Boş antrenman" kalır (qEmpty); "Başka program" (qProg) kaldır: Antrenman sekmesi aynı yere gider. Bu kullanıcı kararı (bölüm 5, madde 8). İşlev kaybı yok, bir dokunuş fazla | orta |
| streak.js:32-37 | seri notları 5-9 kelime ("Haftalık hedefe yetişmek için bugün antrenman gerek (2/3).") | kısalt → "Hedef tamam · 3 hafta" / "Bugün antrenman · seriyi koru" | orta |
| home.js:95-97 | "Toparlanma" bölüm başlığı + "Yorgunluk" etiketi + "Analiz" düğmesi (aynı kart, üç ad) | birleştir → tek başlık "Toparlanma"; "Yorgunluk" ve "Analiz" kalkar, kart dokunulur (bkz. 2.4) | orta |
| home.js:99 | "Dinlenmeli: Quadriceps, Hamstring, ..." | yer değiştir → "3 kas dinleniyor" (bkz. 2.4) | yüksek |
| home.js:100 | "Hafif esneme: Akşam Esneme ve Rahatlama" | kısalt → "Hafif esneme" (program adı dokununca görünür, zaten açılıyor); sessiz düğme | orta |
| bodymap.js:165, musclemap.ts:23 + bodymap.js:105 | Analiz sayfası: "Son 4 günde çalışan kasların ortalaması." + lejant açıklamaları ("Toparlanıyor · hafif çalışılabilir", "Aşırı yorgun · kas hasarı riski") | (i) arkasına al → lejantta yalnız seviye adı + renk; açıklamalar (i) içinde silinmez (araştırma eşiği) | orta |
| bodymap.js:163, 167, 169 | "Genel yorgunluk" eyebrow, "Kas kas" başlığı, satır "Yorgun · 6 Ağu · 9 set · tükeniş" | kısalt → eyebrow ve "Kas kas" kalkar; satır "9 set · 6 Ağu" + seviye için nokta | orta |
| backup.js:35 | "Son yedeğin 10 gün önce alındı. Verilerin sadece bu tarayıcıda; yedek almanı öneririm." (16) / "Henüz hiç yedek almadın. ..." (11) | kısalt → "10 gündür yedek yok" / "Hiç yedek yok"; "Yedek al" düğmesi sessiz, kiraz değil | yüksek |

Düşük etkili: 14 madde (ör. "Süre" kart başlığı, "Önerilen" etiketi, "yaklaşık" sözcüğü, "kasları %80 hazır" → "%80 hazır", hero altbaşlıklarında "5 hareket, 18 set" noktalaması, "Devam et" → "Devam").
Reddedildi: bodymap.js:52 harita ipucundan seviye adını kaldırma (DeepSeek, "orta"): ipucu rengin tek yazılı karşılığı, renk körü / ekran okuyucu için kalır. home.js:85, 87 görünmez erişilebilirlik etiketleri sadeleştirme kapsamı dışı.

### 3.2 Üst bar

| konum | şu anki metin | öneri | etki |
|---|---|---|---|
| spor-defteri.html:21, cloud.js:86-87 | altyazı: 6 durum cümlesi | simgeye çevir (bkz. 2.3). Renkli nokta yerine biçim farkı (Ağır Sağlam 3.2) | yüksek |
| settings.js:39, :80 | tema toast'ı "Tema: koyu / açık / cihaz ayarı" | kaldır (simge değişiyor); `title` kalır | orta |
| spor-defteri.html:21 | "Spor Defteri" başlığı | KALIR (marka). DeepSeek'in "kaldır" önerisi reddedildi | - |

Düşük etkili: 3 madde (ör. tema `title` biçimi "Tema: koyu" → "Koyu"; aria-label ve tooltip kapsam dışı).

### 3.3 Antrenman

**Programlar**

| konum | şu anki metin | öneri | etki |
|---|---|---|---|
| spor-defteri.html:41 | "Antrenman" + "Ne çalışıyoruz?" | kaldır (bkz. 2.1) | yüksek |
| spor-defteri.html:45 | "Boş antrenman başlat" | kısalt → "Boş antrenman"; program yokken sessiz, program varken de kiraz değil (kiraz her program kartındaki "Başla") | orta |
| spor-defteri.html:48-53 | Hazır programlar kartı: başlık, "Bana program öner", "Bütün programlar", "Yapay zekâ ile program yap" | kaldır → içerik "Program ekle" sayfasına taşınır (bkz. 2.2) | yüksek |
| spor-defteri.html:57-60 | Yoga kartı: "Yoga ve esneme", "Yoga programları / Yoga hareketleri" | kısalt → başlık "Yoga", düğmeler "Programlar / Hareketler" (bağlam yoga); açıklama zaten (i) arkasında | orta |
| spor-defteri.html:64 | "Kendi programını oluştur" | kaldır → "+ Yeni program" satırı (bkz. 2.2) | yüksek |
| programs.js:79 | "Henüz program yok" + "Hazır programlardan birini seç, ..." | birleştir → tek "+ Program ekle" kutusu | yüksek |
| programs.js:74 | program kartı altyazı "5 hareket · 18 set · Göğüs · Triceps ..." | kısalt → "5 hareket · 18 set"; kas adları kalkar (küçük harita düğmesi duruyor). İŞLEV KAYBI (küçük): kas adları liste üzerinde görünmez | orta |
| programs.js:98 | "X programı silinsin mi?" + "Haftalık plandaki günleri de boşalır." + "Eski antrenman kayıtların silinmez." | kısalt → "X silinsin mi?" + (plandaysa) "Plan günleri boşalır."; üçüncü cümle kalkar (silme geri alınabilir) | orta |
| programs.js:194 | mod açıklamaları (8 ve 24 kelime) | (i) arkasına al (Plan kartı başlığına bağlı) | yüksek |
| programs.js:244-245 | "Henüz gün seçilmedi", "Haftada 3 antrenman, bitiş 6 Oca 2027", "· Google Takvim'de kendiliğinden güncellenir" | kısalt → "3 antrenman · bitiş 6 Oca"; takvim cümlesi takvim tik simgesi | orta |

Düşük etkili: 18 madde (ör. "Henüz program yok" gibi başlık tekrarları, "Programa bir ad ver" → "Ad gir", ikon `title` metinleri, "Kas haritasında gör").

**Elle kayıt**

| konum | şu anki metin | öneri | etki |
|---|---|---|---|
| spor-defteri.html:96 | "Set numarasına dokun: I ısınma, D drop set, T tükeniş. RIR: kaç tekrar daha yapabilirdin." (15, görünür) | (i) arkasına al (kartın başlığına (i) eklenmeli) | yüksek |
| spor-defteri.html:89 | placeholder "Kalıcı not: koltuk 4. kademe, geniş tutuş" (örnek üç yerde üç farklı yazım) | kısalt → "Kalıcı not" | orta |
| log.js:195 | "Bu gün kayıt yok" + "Yukarıdan hareket seçip setlerini gir." | kısalt → "Kayıt yok"; ikinci satır kalkar | orta |
| log.js:20-21, :85 | placeholder + tablo başlığı çiftleri ("dk" ve "Süre (dk)", "+kg / sn / süre (sn) / ek kg ...") | birleştir → hareket türüne göre tek kısa etiket seti | orta |
| spor-defteri.html:97 | "Seans notu (isteğe bağlı)" | kısalt → "Not" | orta |

Düşük etkili: 9 madde (ör. "Hareket seç" placeholder, "Son kez (12 Eki): ..." → "Son: ...", "Antrenman süresi:" → "Süre:").

**Plan**

| konum | şu anki metin | öneri | etki |
|---|---|---|---|
| spor-defteri.html:118 | "Yapay zekâ ile planla" | kaldır → tek giriş noktası (kullanıcı kararı, bölüm 5) | yüksek |
| spor-defteri.html:122, :137 | "Google Takvim bağlıysa plan kendiliğinden eklenir (Profil → Yedek). ..." + Apple/Outlook notu | (:122 zaten (i) arkasında); :137 kısalt. Yol tarifi çelişkisi: importer.js:25 "Profil → Google Takvim'de" diyor, doğrusu Profil > Yedek (düzeltilmeli) | orta |
| spor-defteri.html:130-135 | Takvim kılavuzu (adım 1-4, toplam ≈ 50 kelime) | DEĞİŞMEZ: zaten "Takvim seçenekleri" açılır bölümünün içinde. DeepSeek'in adım adım (i) önerisi reddedildi (mevcut gizleme yeterli) | - |

Düşük etkili: 7 madde (ör. "Hatırlatma (dk önce)" → "Hatırlatma", "Bitiş tarihi (boşsa süresiz)" → "Bitiş").

**Hareketler**

| konum | şu anki metin | öneri | etki |
|---|---|---|---|
| spor-defteri.html:144 | "Kasa göre bul" | kısalt → "Kasa göre"; açıklama (html:145) zaten (i) arkasında | orta |
| library.js:43 | "Sonuç yok" + "Başka bir kelimeyle ara ya da filtreleri kaldır." | birleştir → "Filtreleri temizle" tek eylem | orta |
| library.js:39, bodymap.js:227 | ikon `title`: "Antrenmana ekle" / "Bu hareketi kaydet" | birleştir → tek ikon etiketi "Ekle" (yalnız tooltip; düşük görünür etki, tekrar eden kontrol bölümüne bkz.) | düşük |

Düşük etkili: 8 madde (ör. "Hareket veya kas ara (örn. arka omuz)" → "Hareket veya kas ara", "{n} kayıt").

### 3.4 Canlı antrenman

Işlevsel ipuçları (kilo önerisi, son kayıt, hedef) kısalır ama kalır.

| konum | şu anki metin | öneri | etki |
|---|---|---|---|
| live.js:88 | "Boş antrenman" başlık + "İlk hareketini ekleyerek başla." + "Hareket ekle" | kaldır → başlık ve cümle gider; tek kiraz "Hareket ekle" | yüksek |
| live.js:82 | "Ekle" (liste sonu) ve "Hareket ekle" (boş durum): aynı iş | birleştir → ikisi de "Hareket ekle" (liste sonunda sessiz "+") | orta |
| live.js:60-66 | "Hedefi tutturdun, bugün +5 kg", "Rahat geçti (RIR 3+), bugün +2,5 kg", "Aynı kiloyla devam, önce tekrarları tamamla" | kısalt → "Hedef tuttu: +5 kg", "RIR 3+: +2,5 kg", "Aynı kilo, önce tekrar". Neden yarım kalır, öneri tam (DeepSeek'in yalnız "+5 kg" önerisi gerekçeyi siliyordu, reddedildi) | orta |
| live.js:101 | "Hedef: 3 × 8-12 sn" | kısalt → "3 × 8-12" | orta |
| live.js:109 | "İlk kez yapıyorsun; rahat bir kiloyla başla." | kısalt → "İlk kez: rahat kilo" | orta |
| live.js:115 | "Isınma önerisi" + "Dokun, yüklensin" | kısalt → "Isınma" (dokununca yüklenir) | orta |
| live.js:119 | "Tamamlanan" + "Silmek için dokun" | kısalt → "Tamamlanan"; ikinci cümle kalkar. İŞLEV KAYBI (küçük): silme keşfedilebilirliği azalır; ilk kullanımda ipucu ya da (i) ile telafi edilebilir | orta |
| live.js:165 | "Süreyi başlat / Seti tamamla / Ekstra set" | kısalt → "Başlat / Tamamla / Ekstra set" (kiraz düğme) | orta |
| live.js:306, :323 | "{hareket} için kalıcı not; her seferinde görünür." (7) ve ayar sayfası açıklaması "Dinlenme, kilo adımı ve artış bu hareket için kalıcıdır. Hedefler sadece bu antrenmanda geçerli." (14) | (i) arkasına al | yüksek |
| live.js:297, 336, 346 | onaylar | kısalt, bkz. 3.8 | orta |
| live.js:353 | "Antrenman bitti · 48 dk · 14 set · 3.210 kg" (9) | kısalt → "Bitti · 48 dk · 14 set". İŞLEV KAYBI (küçük): toplam kg snack'ten çıkar; DeepSeek tüm özeti silmeyi önermişti (tam kayıp), özet korundu. Kullanıcı kararı | yüksek |
| live.js:362 | alt bar "Antrenman sürüyor" | kaldır (süre sayacı yeter) | orta |

Düşük etkili: 16 madde (ör. "Son kez {tarih}: ..." → "Son: ...", not placeholder örnekleri → "Not ekle", "Set 2 / 3" → "2/3", ayar etiketleri "Hedef set" → "Set", süreli set "Bitir ve kaydet" → "Kaydet").

### 3.5 Takvim

| konum | şu anki metin | öneri | etki |
|---|---|---|---|
| spor-defteri.html:169 | eyebrow "Takvim" | kaldır (başlık zaten dinamik: "12 antrenman · 3 planlı") | orta |
| history.js:26 | alt başlık "Kasım 2026 · 40 çalışma seti" (ay adı ızgara üstünde de var, history.js:21) | kısalt → "40 set" | orta |
| history.js:47 | boş gün: "Bu gün plan yok" + "Haftalık planı Antrenman → Plan'dan kurabilirsin." | birleştir → ikon + "Plan kur" (tek eylem); sessiz | yüksek |
| history.js:47 | boş gün: "Bu gün kayıt yok" + "Elle eklemek için + düğmesine dokun." | birleştir → ikon + "Kayıt ekle"; tek eylem | yüksek |
| history.js:41 | "Antrenman süresi: 48 dk" | simgeye çevir → saat simgesi + "48 dk" | orta |
| streak.js:49 | "3 günlük seri" + "En uzun: 5 gün · sıradaki rozet 7 gün" | kısalt → "En uzun 5 gün" (sıradaki rozet zaten rozet satırında görünür) | orta |

Düşük etkili: 8 madde (ör. "Planlı antrenman" etiketi, `title` metinleri, "Yapıldı · Planlı" gösterge).

### 3.6 İlerleme (alt sekmeler)

| konum | şu anki metin | öneri | etki |
|---|---|---|---|
| spor-defteri.html:191, ui.js:142 | "İlerleme" + "Ne kadar güçlendin?" / "Ne kadar ilerledin?" | kaldır (bkz. 2.1 uzantısı) | orta |
| spor-defteri.html:224, :268, :228, :312, :337, :342 | tek kartlı alt sekmelerde kart başlıkları: "Hareket bazında", "Rekor tablosu", "Günler", "Ölçü kaydet", "Gelişim", "Kayıtlar" | kaldır (alt sekme adı ve tablo başlığı yeter) | orta |
| stats.js:120 | grafik başlığı "Gelişim (seanstaki en ağır set, kg)" (20 kelime) / "Gelişim (seanstaki toplam süre, sn)" | kısalt → "En ağır set (kg)" yani yalnız seçili ölçü adı | yüksek |
| stats.js:132-134 | tahmin notu "Son 4 seansa göre tahmini 1RM'in haftada ortalama +1,2 kg artıyor. Bu hızla 4 hafta sonra ..." (20) ve plato uyarısı (17) | kısalt → "Haftada +1,2 kg · 4 haftada 105 kg" ve "Plato: 3 seanstır artış yok"; "tekrar aralığını değiştir" önerisi (i) içine | yüksek |
| stats.js:194 | "Henüz kırılan rekor yok. İlk kayıttan sonraki her ağırlık rekoru burada görünür." | kısalt → "Rekor yok" | orta |
| stats.js:39, 52, 60, 100, 147, 150, 182 | boş durumlar dört kalıpta ("Bu hafta kayıt yok", "Bu hafta antrenman yok", "Kayıt yok", "Henüz kayıt yok") | birleştir → tek kalıp "Kayıt yok" | orta |
| stats.js:204-205 | Kaslar notları (35 ve 33 kelime; `#bmNote` .help, zaten (i) arkasında) | kısalt → (i) içinde ilk cümle + eşik; Pelland 2025 vb. gerekçe SİLİNMEZ | düşük |
| musclemap.ts:12, 23, 40, 41 | kademe etiketleri ve açıklamaları ("Orta verim: 11–18 set: daha fazla gelişim, set başına daha az") | DEĞİŞMEZ (araştırma eşiği). DeepSeek'in "11–18: orta" biçimi reddedildi; yalnız lejantta etiket + aralık, açıklama (i) | - |
| muscledata.ts:1001-1018 | kas özetleri (her biri 20-45 kelime; araştırma sonucu) | (i) arkasına al → görünen yalnız ilk cümle ("Tek bir en iyi göğüs egzersizi yok"), devamı "Ayrıntı" (i). DeepSeek'in yeniden yazımları (ör. Triseps "bir itme + bir overhead en iyi") orijinal bulguyu bozduğu için reddedildi | yüksek |
| bodymap.js:188-193 | "Kanıt güçlü / Kanıt orta / Kanıt zayıf / Çalışma yok" etiketleri, her satırda "Kanıt" tekrar | kısalt → başlıkta bir kez "Kanıt", etiketler "Güçlü / Orta / Zayıf / Çalışma yok"; tanımlar (i) içinde | orta |
| bodymap.js:214-216 | durum çipi + haftalık çip + toparlanma uyarısı ("Orta · son: Yorgun, (6 Ağu), 9 set", "Bu hafta 8 set · En verimli", "Bu kas henüz toparlanmadı; ağır çalışmadan önce ...") | birleştir → tek çip "Orta · 2 gün önce"; uyarı "Toparlanmadı · 1 gün dinlen" | orta |
| stats.js:240, 257, 258, 261 | Güç skoru: "Skor için vücut ağırlığını gir.", "Henüz veri yok" + cümle, satır "Tahmini 1RM 120 kg · 1,5× vücut ağırlığı · 12 Eki · sonraki seviye: 130 kg" (15) | kısalt → "Vücut ağırlığını gir"; "1–10 tekrar set kaydet"; satır "120 kg · 1,5× · sonraki 130 kg" | yüksek |

Düşük etkili: 24 madde (ör. "Hafta · Hareket · Rekorlar · Kaslar · Güç skoru · Vücut" → "Güç", "gün · çalışma seti · hacim (kg) · süre" → "gün · set · hacim · süre", "Bu haftaya dön" → "Bu hafta", ölçü alanı birimleri).
Not: "Başlangıç" kelimesi üç ayrı anlamda (kademe, güç seviyesi, kas) kullanılıyor (envanter-3 gözlem 2); sadeleştirmede karışıklık yaratmaması için güç seviyesi "Yeni başlayan" olarak kalsın.

### 3.7 Profil, Ayarlar, Araçlar, Yedek

| konum | şu anki metin | öneri | etki |
|---|---|---|---|
| spor-defteri.html:350 | "Profil" + "Profilin" | kaldır (bkz. 2.1 uzantısı) | orta |
| cloud.js:114-115, 118, 120-121 | hesap kartı: "Hesap bağlı değil" + "Veriler yalnız bu cihazda. Google ile bağlanınca telefon ve bilgisayar aynı verileri görür." (13) + "Google ile bağlan" | kısalt → bulut simgesi + "Google ile bağlan"; açıklama (i) arkasına; bağlıyken e-posta + "Şimdi eşitle" | yüksek |
| cloud.js:95, 114 | Drive durumu Yedek sekmesinde ve hesap kartında ayrı ayrı yazılı | birleştir → durum yalnız bir yerde (Yedek satırı); hesap kartında yalnız e-posta | orta |
| cloud.js:92 | "Kurulum bekleniyor: Google istemci kimliği henüz eklenmedi (YOL-HARITASI.md, Faz 4)." | kaldır (geliştirici notu kullanıcıya sızıyor; istemci kimliği yoksa Drive bölümü gizlensin) | yüksek |
| spor-defteri.html:356-360 | Görünüm kartı | kaldır (bkz. 2.5) | orta |
| spor-defteri.html:369-371 | seri seçenekleri "Plana göre günlük / Haftalık / Kapalı"; açıklamalar (gizli) | kısalt → "Günlük / Haftalık / Kapalı" (Günlük: plana göre, (i) içinde) | orta |
| spor-defteri.html:376-380 | özet "Spor ya da yoga, dinlenme süresi, ekran, titreşim" ve "Spor ve yoga / Sadece spor (ağırlık, kardiyo) / Sadece yoga ve esneme" | kaldır (özet alt satır) ve kısalt → "Hepsi / Spor / Yoga" | orta |
| spor-defteri.html:384-386 | "Set bitince dinlenme sayacı başlasın" (5), "Antrenmanda ekran açık kalsın" (4), "Titreşimli geri bildirim" | kısalt → "Otomatik dinlenme", "Ekran açık kalsın", "Titreşim" | orta |
| spor-defteri.html:389-390 | "Yapay zekâ bağlantısı" + özet "Claude, ChatGPT, Gemini… bağla" | kısalt → "Yapay zekâ"; özet kalkar | orta |
| spor-defteri.html:395-406 | Claude / ChatGPT / Gemini CLI adımları (≈ 70 kelime, kapalı kart içinde) | DEĞİŞMEZ (teknik kılavuz, kapalı bölümde, kapsam dışı). DeepSeek'in adım kısaltmaları adımları belirsiz bıraktığı için reddedildi | - |
| spor-defteri.html:408, :391 | yazım hataları: "verine" (→ "verilerine"), "verini" (→ "verilerini") | düzelt (yazım, sadeleştirme değil) | düşük |
| backup.js:13 | "20 kayıt · 8 antrenman günü · 3 program · 2 ölçü · 1 özel hareket · son yedek ..." (14) | kısalt → "20 kayıt · 3 program" | orta |
| spor-defteri.html:476-482 | "Yedekleme" başlığı + 14 kelimelik açıklama (:478, gizli) + "Yedeği indir / Geri yükle / birleştir" | kaldır (başlık, kart bağlamı yeter) ve kısalt → "İndir / Yükle" | orta |

Düşük etkili: 22 madde (ör. Araçlar tablo başlıkları "Yüzde / Ağırlık / ≈ Tekrar", plaka "Salonundaki plakalar" → "Plakalar", "Olimpik · 20 kg" → "20 kg", Drive hata cümleleri google.ts/drive.ts).

### 3.8 Açılır pencereler ve onaylar

Kural: geri alınamaz sonucu söyleyen cümle kalır, ad ve bağlam kısalır.

| konum | şu anki metin | öneri | etki |
|---|---|---|---|
| backup.js:64-65 | yedek geri yükleme: "Yedekte N antrenman kaydı var. Birleştir: ... Değiştir: buradaki tüm veriler silinir ..." (~45) | kısalt → "Değiştir: buradaki veriler silinir." (kalır, geri alınamaz) + "Birleştir: iki taraf birleşir, en yeni kazanır." (~20 kelime) | yüksek |
| cloud.js:229-230 | "Google Drive bağlantısı kesilsin mi?" + 2 cümle (≈ 25) | kısalt → "Bağlantı kesilsin mi?" + "Cihazdaki kayıtlar kalır." | yüksek |
| live.js:346 | "Antrenmanı bitirmek istiyor musun?" + "48 dk · 14 çalışma seti" | kısalt → "Antrenman bitsin mi?" + özet satırı kalır | orta |
| live.js:336 | "X bu antrenmandan çıkarılsın mı?" + "Yaptığın setler kayıtlı kalır." | kısalt → "X çıkarılsın mı?" (geri al snack'i var) | orta |
| live.js:297 | "Squat: 2. set silinsin mi?" + set özeti | kısalt → "2. set silinsin mi?" + özet kalır | orta |
| library.js:59 | "X hareketi listeden kaldırılsın mı?" + "Bu hareketle girdiğin eski kayıtlar silinmez." | kısalt → "X kaldırılsın mı? Kayıtların kalır." | orta |
| library.js:71-72 | "X → Y" + "N kayıt, programlar, başlangıç verisi ve notlar Y adına taşınır. X listeden kalkar." (15) | kısalt → "X → Y birleştirilsin mi?" + "Kayıtlar Y adına taşınır." | orta |
| log.js:178 | "Squat kaydı silinsin mi?" + "5 set · 12 Eki" | kısalt → "Kayıt silinsin mi?" + özet kalır | orta |
| spor-defteri.html:555-560 | onay düğmeleri "Vazgeç / Evet, sil" | kısalt → "Vazgeç / Sil" | orta |
| importer.js:127-139 | Yapay zekâ sayfası: başlık, 3 açıklama (13+18+13), "1 · İsteğin (isteğe bağlı)", "2 · Yapay zekânın verdiği bağlantı", Claude / ChatGPT / Gemini üç düğme, "Panodan yapıştır / Ekle" (≈ 90 kelime) | kısalt → açıklamalar (i) arkasına; adımlar "1 İstek", "2 Bağlantı"; "Panodan yapıştır / Ekle" → "Yapıştır". Üç düğme birleşmez (hangi siteyi seçtiğin bilgi), ama etiketler tek satıra iner | yüksek |
| importer.js:55-63, :78-88 | plan ve program önizlemesi: "Haftalık planı ayarla / Eklemeden önce kontrol et / Haftada 3 gün / Mevcut haftalık planın yerine geçer." | kısalt → "Planı ayarla · Haftada 3 gün"; "Eklemeden önce kontrol et" iki yerde kalkar; "plan yerine geçer" kalır (veri değiştiriyor) | orta |
| presets.js:97, :67, importer.js:86 | "Bir programa dokun: ..." (12), "Haftalık plana yerleştir (mevcut planın yerine geçer)" | (i) arkasına al ve kısalt → "Plana yerleştir (yerini alır)" | orta |

Düşük etkili: 15 madde (ör. "Programı ekle" → "Ekle", paylaşım penceresi "Paylaşım bağlantısı / Kopyalayıp gönder:", tarih seçici "Etkinlik dolu olarak açılır ..." (i)).

### 3.9 Boş durumlar

Kalıp: ikon + en çok iki kelime etiket veya tek eylem. Açıklama cümlesi yok.

| konum | şu anki metin | öneri | etki |
|---|---|---|---|
| programs.js:79 | "Henüz program yok" + açıklama | "+ Program ekle" kutusu (bkz. 2.2) | yüksek |
| home.js:66-67 | "Serbest gün" + "İlk programını oluştur ya da boş bir antrenmanla başla." | "Serbest gün" kalır (durum); açıklama kalkar; kiraz yok, sessiz "Program ekle" | yüksek |
| live.js:88 | "Boş antrenman / İlk hareketini ekleyerek başla. / Hareket ekle" | yalnız "Hareket ekle" | yüksek |
| log.js:195, history.js:47 | "Bu gün kayıt yok" + yönerge (2 yer) | "Kayıt ekle" / "Plan kur" tek eylem | yüksek |
| ui.js:101-102 | "Henüz favori yok / Yıldıza dokunarak ..." ve "Henüz kayıt yok / Tümü sekmesinden ..." (10-11) | kısalt → "Favori yok" ve "Kayıt yok" (yıldız ipucu kalkar; İŞLEV KAYBI küçük: yıldızın favoriye ekleme işlevi sezdirilmez) | orta |
| library.js:101, bodymap.js:170, stats.js:194, :258 | "Henüz ölçü yok / Yukarıdan ilk ölçünü kaydet.", "Henüz kayıt yok.", rekor ve güç skoru boş cümleleri | birleştir → "Kayıt yok" | orta |
| library.js:43 | "Sonuç yok / Başka bir kelimeyle ara ..." | "Filtreleri temizle" | orta |

Düşük etkili: 5 madde.

### 3.10 İlk açılış

| konum | şu anki metin | öneri | etki |
|---|---|---|---|
| presets.js:110-113 | "Hoş geldin" + "Sana uygun programı bulalım" + "Birkaç soru; önerim hemen aşağıda çıkar. Ne yapacağını biliyorsan atla, programını kendin kur." (17) | kısalt → başlık "Programını bulalım"; açıklama kalkar ("Atla" düğmesi zaten çıkış) | yüksek |
| baseline.js:47 | "Başka uygulamadan geliyorsan ..." 45 kelimelik paragraf | kısalt → ilk cümle görünür ("Şu an rahat yaptığın kiloyu ve tekrarı yaz."), geri kalanı (i) arkasına; "antrenman geçmişine girmez" gibi kural cümleleri silinmez | yüksek |
| presets.js:122-123 | "Başka uygulamadan geliyorum: mevcut kilolarımı gir" (8) / "Başka cihazda kullanıyorum: Drive'dan getir" (6) | kısalt → "Kilolarımı gireyim" ve "Drive'dan getir". Sessiz düğmeler | orta |
| presets.js:128-137 | "Önerim" eyebrow, "Bu programla başla", "Ayrıntılar", "Alternatif" | kısalt → "Önerim" kalkar, "Başla" (kiraz), "Ayrıntı" sessiz | orta |
| presets.js:116-120 | soru etiketleri ("Cinsiyetin", "Deneyimin", "Nerede çalışacaksın" ...) | DEĞİŞMEZ (zaten kısa). DeepSeek'in "yer", "gün" gibi tek sözcük etiketleri reddedildi (belirsiz). Kullanıcı kararı: cinsiyet sorusu bu formda kalsın mı (2.5) | - |
| baseline.js:43-44 | "Başlangıç noktan" + "Şu an hangi kilolarla çalışıyorsun?" | kısalt → yalnız soru | düşük |

Düşük etkili: 4 madde.

### 3.11 Snack ve bildirimler

Kural: en çok 5 kelime, ünlem yok, "Geri al" taşıyanlarda ad yok.

| konum | şu anki metin | öneri | etki |
|---|---|---|---|
| live.js:263-264, log.js:145-149 | "Yeni rekor: 100 kg!", "Yeni 1RM rekoru: 120 kg!" (live), "Yeni tahmini 1RM rekoru: ..." (log): üç farklı yazım | birleştir → tek sabit: "Rekor: 100 kg" ve "Tahmini 1RM: 120 kg" (tek kaynak) | orta |
| live.js:353 | "Antrenman bitti · 48 dk · 14 set · 3.210 kg" | kısalt, bkz. 3.4 | yüksek |
| live.js:279-280 | "Sıradaki: X" ve "Bütün hareketler tamam! Bitir'e basabilirsin" | kısalt → "Sıradaki: X" kalır; ikincisi "Hepsi tamam" | orta |
| store.js:30 | "Kaydedilemedi! Yedek al." | kısalt → "Kaydedilemedi · yedek al" (veri riski, eylem kalır; DeepSeek'in "kaydedilemedi" önerisi eylemi siliyordu, reddedildi) | yüksek |
| store.js:23 | "Kayıtlar okunamadı" | kalır; "yedekten geri yükle" eylemi eklenmesi tavsiye (envanter gözlem 7) | orta |
| cloud.js:57, 235, 77/187, 158 | "Drive'dan 3 değişiklik alındı", "Drive ile eşitlendi", "Drive bağlantısı kesildi", "Google hazır, tekrar dokun", "Takvim güncellendi / zaten güncel" | kısalt → "Eşitlendi", "Bağlantı kesildi", "Tekrar dene", "Güncel" | orta |
| cloud.js:251 | "Biten antrenmanlar artık görevin tikiyle görünür" | kısalt → "Antrenmanlar görev olarak işlenir" (anlatım; kullanıcı kararı gerekmez) | orta |
| importer.js:41, presets.js:42 | "X eklendi ve haftalık plana yerleşti" (6-9) / "X programlarına eklendi" | kısalt → "Program eklendi" / "Eklendi · plana yerleşti" | orta |
| importer.js:147, 152, 155, 158, 162, 172 | pano ve paylaşım mesajları (5-11 kelime) | kısalt → "Kopyalandı" ve "Kopyalanamadı" iki kalıp | orta |
| backup.js:54, 72, 79, 80 | "N set dışa aktarıldı", "Birleştirildi: 3 yeni, 2 güncellenen, 1 silinen kayıt" (7), "Geçersiz yedek dosyası" | kısalt → "Aktarıldı", "Birleştirildi", "Geçersiz yedek" | düşük |
| log.js:127-129, 218-228; programs.js:271-272, :311; live.js:190, 250-251; library.js:125-135 | uyarı emirleri ("Önce bir hareket seç", "En az bir set gir", "Önce ilk çalışma setinin kilosunu gir" ...) | kısalt → "Hareket seç", "Set gir", "Önce kilo gir" | düşük |
| settings.js:80 | tema toast'ı | kaldır (bkz. 3.2) | orta |

Düşük etkili: 33 madde (yukarıdaki son iki satırın kapsadığı kısa uyarılar ve "Silindi / Kopyalandı" türü adsız snack'ler).

### 3.12 (i) bilgi metinleri

Bulgu: `.help` sınıfı taşıyan 20'den fazla paragraf zaten (i) arkasında (styles.css:100; ui.js:55 kartın `h2`'sine ⓘ ekliyor): html:49, 58, 116, 122, 145, 220, 257, 269, 306, 391, 408, 411, 432, 448, 458, 478, 479, 489 ve JS'ten yazılan settings.js:16-21, 31-33, streak.js:50, stats.js:204-205, 238. Bunlar için "(i) arkasına al" önerisi geçersiz; yalnız metin uzunluğu kısalabilir (düşük).

Henüz ekranda görünür olan ve (i)'ye alınması gerekenler:

| konum | şu anki metin | öneri | etki |
|---|---|---|---|
| spor-defteri.html:96 | set türü / RIR açıklaması (15) | (i) arkasına al | yüksek |
| spor-defteri.html:71 | "hareketi bir öncekiyle süperset yapar: art arda, aralarında dinlenmeden." | (i) arkasına al | orta |
| cloud.js:115, 121 | hesap kartı açıklamaları (8 ve 13) | (i) arkasına al | yüksek |
| cloud.js:208, 214 | takvim modu notu (13) ve "Bu cihazda takvim izni yok ..." (18) | (i) arkasına al (durum simgesiyle) | orta |
| importer.js:128, 135, 137 | yapay zekâ sayfası açıklamaları | (i) arkasına al | yüksek |
| live.js:306, 323 | not ve ayar açıklamaları | (i) arkasına al | yüksek |
| baseline.js:47 | 45 kelimelik paragraf | ilk cümle görünür, devamı (i) | yüksek |
| bodymap.js:197 | "Kanıt düzeyleri ne demek?" (zaten `details`) | DEĞİŞMEZ | - |

Kod notu: ui.js `initHelp()` yalnız sayfa açılışında statik HTML'deki `.help`'lere ⓘ ekliyor görünüyor; JS ile üretilen sayfa (sheet) içeriği için ayrıca çağrılmalı ya da `<details>` kullanılmalı. Uygulamada doğrulanmalı.

Düşük etkili: 6 madde.

### 3.13 Tekrar eden kontroller (ayrı alt bölüm)

| tekrar | konumlar | öneri | etki |
|---|---|---|---|
| Yapay zekâ ile program yapma ×3 | html:53, :118 ("... planla"), :409 | tek giriş "Program ekle > Yapay zekâ ile"; Plan'daki kalsın mı: kullanıcı kararı | yüksek |
| Drive durumu ×3 | üst bar cloud.js:87, Yedek cloud.js:95, hesap kartı cloud.js:114 | üst barda simge, Yedek'te tek satır, hesap kartında yalnız hesap | yüksek |
| Tema değiştirme ×2 | üst bar düğmesi + Görünüm çipleri (settings.js:10, :80) | yalnız üst bar düğmesi | orta |
| Cinsiyet ×3 | presets.js:116, html:298, html:359 | tek yerde (2.5) | orta |
| Yorgunluk bilgisi ×5 | "Yorgunluk" etiketi, seviye, "Dinlenmeli" satırı, Analiz sayfası, harita ipucu (home.js:96-99, bodymap.js:52) | özet + analiz sayfası (2.4) | yüksek |
| Hareket ekleme etiketleri | live.js:82 "Ekle", :88 "Hareket ekle", live.js:238, ui `title`: "Antrenmana ekle / Bu hareketi kaydet", "Hareket seç" | tek fiil "Hareket ekle" | orta |
| Çıkarma fiilleri | "Çıkar" (live.js:324), "Kaldır" (library.js:59), "Sil" (programs.js:78), "Sıradan çıkar" (programs.js:202) | anlamı ayır: "Sil" = veri gider, "Çıkar" = listeden çıkar | orta |
| Rekor metni ×2 biçim | live.js:264 / log.js:149 | tek sabit (3.11) | orta |
| Google Takvim yolu ×2 | html:122 "Profil → Yedek", importer.js:25 "Profil → Google Takvim'de" (yanlış) | doğrusunu tek yerde tut | orta |
| Yedek durumu | üst bar "veriler bu cihazda" + yedek uyarısı "verilerin sadece bu tarayıcıda" | üst bar yazısı kalkınca ikinci tekrar da gider | orta |

## 4. Kaldırılması önerilen ayarlar ve gerekçesi

| ayar | konum | gerekçe | işlev kaybı | kod etkisi |
|---|---|---|---|---|
| Tema çipleri (Koyu / Açık / Cihaz ayarı) | html:356-358, settings.js:10-11 | üst bar düğmesi aynı üç değeri döndürüyor | Yok (doğrudan "Cihaz ayarı"na atlama gider, küçük) | `renderSettings()` TypeError verir; settings.js:10-11 silinmeli |
| Görünüm kartı başlığı | html:356 | kartta tek kalan iş cinsiyet olur; taşınır | Yok | kart ve `#sexHelp` taşınmalı |
| Cinsiyet seçici (Ayarlar) | html:359, settings.js:14, :71 | üç yerde soruluyor (ilk açılış, Güç skoru profil kartı, Ayarlar) | Yok, yeri değişir (2.5 A veya B) | settings.js:14, :71 ve `#setSex` bağlamaları |
| "Vücut haritası çizimi" (prefs.body) | html:360, settings.js:15, :72 | yalnız cinsiyet boş/Diğer iken görünüyor; harita ayarı harita yanında olmalı | Yok, yeri değişir | `#setBody`, `#setBodyWrap` taşınır |
| "Antrenman ayarları" özet alt satırı | html:376 | kart kapalıyken ekrana ek 8 kelime | Yok | yalnız HTML |
| "Yapay zekâ bağlantısı" özet alt satırı | html:390 | başlık yeter | Yok | yalnız HTML |
| "Hedef ve seri" özeti | settings.js:23 | kısalır ("Haftada 4 gün · günlük"), kalkmaz | Yok | küçük |

Kaldırılması önerilmeyenler: "Seri" (kapalı seçeneği kalır), odak ("Spor ve yoga / Spor / Yoga"), dinlenme, ekran, titreşim (davranış ayarı).

## 5. Kullanıcı kararı gereken noktalar

1. **Yapay zekâ girişleri:** Plan sekmesindeki "Yapay zekâ ile planla" (html:118) kalsın mı? Üç düğme tek "Program ekle" sayfasına iner; plan istekleri de aynı sayfadan kurulabilir (importer.js:168 zaten aynı sayfa).
2. **Cinsiyet ve vücut çizimi:** A) kas haritası sayfasında küçük çip, B) İlerleme > Vücut sekmesinde (ve Güç skoru profil kartıyla birleşik). Profil'de "Vücut" bölümü yok.
3. **Boş durum etiketi:** "Program ekle" mi, yalnız "Program" mı.
4. **Ana sayfa plan listesi:** yalnız hareket adları (öneri), ilk 3 + "+N", ya da tamamen kalksın (işlev kaybı küçük).
5. **Program kartında kas adları** kalksın mı (kas haritası düğmesi kalır; küçük işlev kaybı).
6. **Antrenman bitti snack'i:** "Bitti · 48 dk · 14 set" (öneri), toplam kg de kalsın, ya da yalnız "Kaydedildi".
7. **Eyebrow + başlık kalkması:** Antrenman karar verildi; İlerleme ve Profil için de uygulansın mı (bkz. 2.1 uzantısı).
8. **Ana sayfadaki "Başka program" kısayolu** kalksın mı (Antrenman sekmesi aynı yer).
9. **Drive hata simgesi** `--danger` renginde mi, nötr mü olsun (Ağır Sağlam 3.2: durum rengi serbest ama ölçek renginden ayrı).
10. **Kas özetleri (muscledata.ts:1001-1018):** ilk cümle görünür + "Ayrıntı" (i) mi (öneri), yoksa tamamen (i) mi.

## 6. Sayılar

Yöntem: envanterlerin kelime sütunlarından her ekranın ilk açılışta görünen sabit etiket, başlık, düğme ve açıklama metinleri toplandı; veri (hareket, kas, program adı, rakam) ve koşullu metinler (uyarı, seri notu, yoga, yedek) ayrı tutuldu; (i) arkasında gizli `.help` metinleri sayılmadı; "sonra" değerleri bu belgedeki önerilerin uygulanmış hâli için elle sayıldı (±%15 hata payı).

- Belgedeki tablolar: 118 satır (yüksek 39, orta 73, düşük 6); düşük etkili özetlerde 192 madde; eylem dağılımı: kaldır 21, kısalt 61, simge 2, (i) 14, birleştir 17, yer değiştir 1 (+ diğer 2: düzelt, eylem ekle).
- Ham DeepSeek önerisi ~613, süzme sonrası ~460; tablolar bunların yüksek/orta etkili olanlarını kapsar (tablolardaki 6 düşük satır da sayıldı).

**Görünen sabit kelime sayısı (önce → sonra)**

| ekran | önce | sonra | koşullu metinler önce → sonra |
|---|---|---|---|
| Ana sayfa (planlı gün) | 58 (sabit 33 + plan listesi 25) | 34 (24 + 10) | seri notu, yoga düğmesi, yedek uyarısı: 26 → 13 |
| Antrenman > Programlar (3 program) | 47 | 24 | yoga kartı 7 → 3 |
| Antrenman > Programlar (boş) | 40 | 9 | yoga kartı 7 → 3 |
| Canlı antrenman (bir hareket, 3 set) | 48 | 28 | dinlenme, plaka, öneri satırları dahil |
| İlerleme > Hafta | 30 | 18 | kas analizi uyarıları 18 → 9 |
| Profil > Ayarlar | 61 | 18 | cinsiyet / vücut çizimi 5 → 0 |
| **Toplam (boş hâl hariç beş ekran)** | **244** | **122** | **≈ %50 azalma** |

## 7. En etkili 10 öneri (sıralı)

1. Üst bar durum altyazısı → bulut simgesi (6 metin → 0; Drive durumu üç yerden bire).
2. Programlar boş durumu + Hazır programlar kartı + "Kendi programını oluştur" → tek "Program ekle" kutusu (40 → 9 kelime).
3. Ana sayfa "Dinlenmeli: ..." listesi + Toparlanma kartının üç adı → "3 kas dinleniyor", kart dokunulur.
4. Antrenman "Ne çalışıyoruz?" ve eyebrow'ları (İlerleme, Profil uzantısıyla): en büyük yazılar kalkar.
5. Üç yapay zekâ girişi tek giriş; yapay zekâ sayfası açıklamaları (≈ 90 kelime) (i) arkasına.
6. Ayarlar Görünüm kartı kalkar (tema üst bardaki düğmede; cinsiyet ve çizim haritaya yakın).
7. Onay pencereleri ≤5 kelime; yedek geri yükleme ve Drive kesme gibi uzun onaylar (45 ve 25 kelime) sade (geri alınamaz cümle kalır).
8. Boş durumlar tek kalıp: "Kayıt yok" ve tek eylem (3.9 tablosunda 7 satır).
9. Snack ve uyarılar ≤5 kelime; rekor metni tek sabit; "Antrenman bitti" özeti kısalır.
10. Canlı antrenman: boş ekran tek düğme, kilo önerisi ipuçları kısalır, grafik ve güç skoru satırları (20 → 4 kelime) kısalır.

## 8. Kaynak notu

- Envanterler Haiku ile çıkarıldı (dört dosya, dosya:satır'lı); satır önerileri DeepSeek ile üretildi (613 öneri); öneriler lider kurallarıyla bu belgede süzüldü.
- **Doğrulama:** 5 örnek ve DeepSeek'in ilk 10 satırı kaynak kodla (Grep/sed) kontrol edildi, ayrıca ≈ 45 ek satır (home.js, cloud.js, settings.js, programs.js, live.js, stats.js, importer.js, backup.js ve ilgili html satırları) açılıp metin eşleşmesine bakıldı. Tamamı eşleşti, tek sapma: "Antrenman sürüyor" gerçekte home.js:47 (envanter ve DeepSeek 43 yazmış; 43. satır `let title...`). home.js:48-66 aralığı ±1-4 satır kayık olabilir. sync/google.ts:39, sync/calendar.ts:18, musclemap.ts:12, :23, :40, muscledata.ts:1001 var ve metinler uyuyor.
- **Doğrulanamayanlar:** düşük etkili satırların büyük kısmı tek tek açılmadı; streak.js:27-72, log.js:20-38, live.js:106-119, bodymap.js:195-268, tools.js:21-48, sync/drive.ts:16-51 satır numaraları yalnız envantere dayanıyor. Uygulamadan önce Grep ile yeniden doğrulanmalı.
- **Süzme (yaklaşık sayılar):** 613 öneriden ≈ 150 atıldı: 49 satır iki envanterde yinelenmiş (birleştirildi); 21 "(i) arkasına al" önerisi zaten uygulanmış (`.help`); 36 araştırma metni yeniden yazımı reddedildi (muscledata.ts 18, musclemap.ts 11, kanıt düzeyi 7: eşikler ve gerekçeler silinmez); ≈ 14 görünmez aria/title önerisi kapsam dışı; ≈ 30 öneri belirsiz ya da fazla kısa ("oto", "ad gerekli", "uygulama seç", "yer", "gün"). 7 renkli nokta önerisi renksiz biçime çevrildi (Ağır Sağlam 3.2); `home.js:56`, `live.js:353`, `ui.js:101-102` önerileri "işlev kaybı" notuyla tutuldu. Kalan ≈ 460 öneriden tablolara 118 satır girdi (6'sı düşük etkili), düşük etkili özetlerde 192 madde sayıldı (bölüm 6).
- Bu belgedeki iki öneri DeepSeek'ten değil analizden gelir: ana sayfada "Başka program" kısayolunun kalkması ve İlerleme / Profil eyebrow'larının kalkması. Kullanıcı onayı gerekir (bölüm 5).
- Gizlilik, hakkında ve yasal sayfalar kapsam dışı bırakıldı; araştırmaya dayalı eşik ve kanıt metinleri (Pelland 2025, Sousa 2024 vb.) değiştirilmedi.
