# Ağır Sağlam tasarım dili: Spor Defteri için ilke çıkarımı

Tarih: 2026-11-06

Amaç: Ağır Sağlam'ı kopyalamak değil. Onun "sade, anlaşılır, şık" bulunan dilinden ilke ve kalıp çıkarıp Spor Defteri'nin kendi kimliğine uyarlamak. Marka, birebir ekran düzeni, renk kodu ve içerik (fotoğraf, isim, skor adı) önerilmez.

Not: Bu belgede üç tür bilgi ayrıdır. "Kaynak" web kaynağıdır. "Gözlem (ekran N)" üç ekran görüntüsünden gelir. "Yorum" benim çıkarımımdır.

## 1. Uygulama hakkında kısa bilgi

- Adı Ağırsağlam Fitness. İngilizce adı "Lightweight". Geliştirici Furkan Kaya: fitness YouTuber'ı, yaklaşık 822 bin abone, powerlifting antrenörü. (Kaynak: ShiftDelete)
- App Store yayıncısı LIGHTWEIGHT LLC. (Kaynak: App Store)
- Webrazzi 2024: 10 bin üzeri ücretli üye, yatırım yok. Rakipler olarak Nike Training, MuscleWiki, Hevy, Caliber sayılmış. (Kaynak: Webrazzi)
- Freemium. Lightweight Pro aylık yaklaşık 4,99 sterlin, yıllık yaklaşık 19,99 sterlin (App Store UK).
- Kullanıcı sayısı: site hem 400 bin üzeri hem 1 milyon üzeri diyor. Tutarsız ve markanın kendi iddiası. DOĞRULANAMADI.
- Özellikler (App Store ve site): kasa dokununca o kas için en iyi egzersizler, bölgesel hipertrofi ısı haritası, günlük ve haftalık uyaran, kas hasarı, bitkinlik ve toparlanma takibi, bitkinlik skoru, videolu egzersiz kütüphanesi, kas ve ekipman filtresi, hazır programlar, set/tekrar/ağırlık kaydı, rekorlar, FFMI, güç sıralaması skoru.
- Puan: App Store UK 4,6 (58 değerlendirme). Google Play yaklaşık 4,87 (yaklaşık 13.500) ama bu üçüncü taraf (appgoblin) verisi. DOĞRULANAMADI.
- Yorumlar: ilerleme takibi övülmüş. Şikâyetler: oturumdan atma ve lider tablosunun takılması. Tasarım hakkında somut kullanıcı alıntısı BULUNAMADI. Tasarımcı veya ajans bilgisi BULUNAMADI.
- Hedef kitle açıkça yazılmamış. Yorum: Türkçe konuşan, hipertrofi ve güç odaklı sporcular.

Kaynaklar:
- https://shiftdelete.net/agirsaglam-fitness-uygulamasi?amp=1
- https://apps.apple.com/gb/app/id1580231861
- https://webrazzi.com/2024/11/04/kisisellestirilmis-fitness-programlari-sunan-yerli-uygulama-lightweight/
- https://www.agirsaglam.com/fitness-uygulama/

## 2. Ekranlarda gözlenen tasarım kararları

Hex değerleri ve piksel ölçüleri gözle tahmindir. Kesin değildir.

**Renk (gözlem, ekran 1-3)**
- Zemin saf siyaha yakın (~#000). Yüzey çok koyu gri (~#111-#1A1A1A). Metin beyaz, ikincil metin gri (~#8A8A8A).
- Tek vurgu rengi kırmızı (~#E53935). Kullanıldığı yerler: ana düğme, "Egzersizleri Ekle +" bağlantısı, aktif sekme, bitkinlik çubuğunun dolu parçaları, bildirim rozeti, "Detayları Gör", kas figüründe kas dolgusu (muhtemelen hedef kas).
- Kırmızı olmayan yerler: başlıklar, meta metin, pasif ikonlar, kenarlıklar.
- Yeşil, sarı, turkuaz yalnızca anatomi figüründe. Arayüz çerçevesinde yok. Puan yıldızı sarı.

**Yazı (gözlem)**
- Grotesk bir sans. Büyük harfli başlık yok. Kalın ile normal arasında güçlü ağırlık farkı.
- 4-5 seviye: ekran başlığı ~28-30px kalın, bölüm başlığı ~18-20px yarı kalın, egzersiz adı ~16px, meta ~12-13px gri, sekme etiketi ~11px.
- Gerçek yazı tipi adı belirsiz.

**Ekran 1: program günü (gözlem)**
- Üst çubukta geri, kalem, üç nokta. Altında başlık ve meta satırı.
- "Analiz" kartı: ince gri kenarlık, ~16-20px köşe, gölge yok. İçinde küçük ön ve arka figür.
- 5 parçalı bitkinlik çubuğu (4 kırmızı, 1 gri). Üstte küçük gri etiket, altta kalın beyaz sözel durum ("Zorlayıcı").
- "6 egzersiz · 18 set" özet şeridi.
- Egzersiz listesi kartsız düz satır: ~56px kare fotoğraf, ad, üç küçük meta (set, tekrar, RiR), düzenle ikonu.
- Altta sabit, geniş kırmızı "Antrenmana Başla" (köşe ~6-8px) ve yanında gri kare takvim düğmesi.
- Bu ekranda alt gezinme olup olmadığı belirsiz.

**Ekran 2: Egzersizler (gözlem)**
- Ekranın ~%75'i tek büyük, gri tonlu, gerçekçi anatomik figür. Renk yok.
- Başlık ve arama. Köşede cinsiyet, çevir ve favori düğmeleri.
- Alt gezinme 5 sekme (Gelişim, Programlar, Bugün, Egzersizler, Profil). Pasif ikonlar ince çizgili, aktif ikon dolu ve kalın. Küçük etiket. Pasif gri, aktif kırmızı. Hap veya arka plan yok.
- Dokununca kas vurgusu olup olmadığı belirsiz.

**Ekran 3: egzersiz detay (gözlem)**
- Tam ekran fotoğraf veya video karesi, altta koyu gradyan, üstünde büyük kalın beyaz başlık.
- Sol altta küçük kas figürü. Yorum: hedef kas muhtemelen kırmızı, yardımcı kas muhtemelen turkuaz (ekranda yazılı değil).
- Küçük "Detayları Gör" ve yarı saydam puan rozeti. Tek birincil eylem.

**Genel (gözlem)**
- Pasif ikonlar ince çizgili ve tek renk; aktif sekme ikonu dolu ve kalın (ekran 2). Kartlar yuvarlak (~16-20px), düğmeler daha keskin (~6-8px).
- Yorum: kırmızı = eylem ve hedef/yük. Fotoğraf = hareket nasıl yapılır. Çizim = hangi kas. Metin = bilgi.

## 3. Neyi doğru yapıyorlar

Her madde: Gözlem, Neden işe yarıyor (yorum), Spor Defteri'ne uyarlama. Kod referansları dosyayı açıp doğrulanmıştır.

**3.1 Tek vurgu rengi disiplini**
- Gözlem (ekran 1-3): vurgu rengi yalnızca eylem ve aktif durumda. Başlık, meta ve kenarlıkta yok.
- Neden: göz neye dokunulacağını tek bakışta bulur. Renk bir anlam taşır.
- Uyarlama: tek bir vurgu rengi seç, yalnızca eylem ve aktif durumda kullan. Şu an `--accent` (src/styles.css:13) hem düğmelerde (:125) hem tam dolu kartta (:104) hem aktif sekmede (:84) hem küçük etiketlerde (:312) var. Ayrıca kas ölçeğindeki "minimum" turuncuya (:18, `--g-minimum`) çok yakın. Vurguyu kas ölçeğinden farklı bir tonda seç. Tam dolu `.card.accent` kartı (:104) kaldır; ana sayfada `.card.accent` kartları (src/app/home.js:40, 45, 51) düz karta çevrilsin; düğmeler ayrı satırlarda (home.js:41, 47, 54, `.btn.xl`) ve tek düğme yeter.

**3.2 Ölçeği arayüz çerçevesinden ayırmak**
- Gözlem (ekran 1-3): ek renkler (yeşil, sarı, turkuaz) yalnızca anatomi figüründe. Çerçeve kırmızı ve gri.
- Neden: renk iki iş yapınca karışır. Burada çerçeve rengi "bas", figür rengi "ne kadar" der.
- Uyarlama: kas ölçeği (styles.css:18) tek başına kas resimlerine ait olsun. Şu an `--g-iyi` doğrudan `--danger` (:18) ve `--g-koruma` doğrudan `--good`. Yani "iyi gelişim" ile "tehlike" aynı kırmızı. Ölçek için ayrı değişkenler tanımla (`--g-*` kendi değerini taşısın), `--good/--warn/--danger` yalnız durum mesajlarında kalsın. Aynı ayrım açık temada da yapılmalı (:26-32, :37-43).

**3.3 Büyük harf yerine ağırlık kontrastıyla hiyerarşi**
- Gözlem (ekran 1): başlıklar normal cümle, kalın. Meta küçük ve gri.
- Neden: büyük harfli küçük başlık sesli bağırır ve her yerde aynı durunca sıralama kaybolur. Ağırlık ve boyut farkı sırayı kendiliğinden verir.
- Uyarlama: `text-transform:uppercase` src/styles.css içinde 20 satırda geçiyor (Grep ile sayıldı). Örnekler: kart başlığı 12px/700/büyük harf/aralıklı (:95), bölüm başlığı (:90), şekil altyazısı (:208), `label` (:112), `.stat span` (:157), `.tag` (:230), `th` (:239), `.cal .wd` (:270), `.f-setlabel` (:408), `.pk-head` (:487). Tam liste: 59, 90, 95, 112, 157, 166, 208, 230, 239, 255, 263, 270, 352, 408, 419, 422, 432, 447, 454, 487. Bunları normal harfe çevir; bölüm başlığı 17-18px yarı kalın, meta 12-13px gri olsun. Ekran başlığı (:88, 30px/800) kalsın. Hedef: dört seviye (ekran, bölüm, öğe, meta).

**3.4 Kartsız liste ile kartı ayırmak**
- Gözlem (ekran 1): egzersiz listesi düz satır; tek kart yalnızca "Analiz" özetinde.
- Neden: kart "bu bir özet/nesne" demektir. Her şey kart olunca vurgu kalmaz.
- Uyarlama: `.card` (styles.css:94) her şeye uygulanıyor. Listeleri (hareket listesi, geçmiş satırları; ör. src/app/library.js:34 `.exitem`) kartsız, ince ayırıcı çizgili satıra çevir. Kartı yalnızca özet/analiz bloklarına (kas haritası, bitkinlik özeti) sakla. Kalıp ilke olarak alınmalı, ekran 1'in düzeni birebir tekrarlanmamalı.

**3.5 Ekran başına tek birincil eylem, altta sabit**
- Gözlem (ekran 1): tek geniş düğme altta sabit; yanında sessiz ikincil düğme. Ekran 3'te "Detayları Gör" küçük bir eylem; sabit olup olmadığı görüntüden belirsiz. Yani tek birincil eylem gözlemi ekran 3'te de geçerli, altta sabit olması yalnız ekran 1 için gözlendi.
- Neden: "şimdi ne yapacağım" sorusunun cevabı hep aynı yerde.
- Uyarlama: Spor Defteri'nde birincil eylem zaten `.btn.xl` (styles.css:128; home.js:41/47/54) ve `.btn.primary` (styles.css:125; history.js:46). Eksik olan: sabit konum ve tutarlılık. Antrenman başlatma düğmesini alt gezinmenin üstünde sabit tut. Dikkat: sabit düğme ile canlı çubuk (:461) ve FAB (:510) üst üste binmemeli; sabit düğme görünürken ikisi gizlensin, listenin altına boşluk eklensin (bkz. 4.1).

**3.6 Sayı yerine sözel durum ve segment çubuk**
- Gözlem (ekran 1): bitkinlik, 5 parçalı çubuk ve "Zorlayıcı" yazısı.
- Neden: yüzde okunmaz, durum anlaşılır. Çubuk bir bakışta okunur.
- Uyarlama: ana sayfadaki "kasları %N hazır" (home.js:53) gibi yüzdeleri 5 kademeli çubuk ve kısa sözel durumla ver. Kademe adları mevcut kas ölçeğinden (düşük, koruma, minimum, iyi, maksimum) türesin; yeni kavram uydurma. Büyük sayı sınıfı (`.bignum`, :158) yalnız süre ve kilo gibi gerçek ölçümlerde kalsın.

**3.7 Görsel işlev ayrımı: fotoğraf, çizim, metin**
- Gözlem (ekran 1-3): fotoğraf hareketi, figür kası, metin bilgiyi anlatıyor.
- Neden: her görsel tek iş yapar; kullanıcı ne bakacağını bilir.
- Uyarlama: Spor Defteri'nde fotoğraf yok (egzersiz satırında yalnızca 48px mini kas haritası; library.js:34, styles.css:367). Hareketin nasıl yapıldığı şu an YouTube arama bağlantısı (bodymap.js:246 civarı). Fotoğraf yerine, kendi çizdiğin sade hareket ikonları ya da kısa metin ipucu düşünülebilir (bkz. bölüm 6). Mini kas haritası "hangi kas" işini görmeye devam etsin.

**3.8 Büyük figürü ana gezinme öğesi yapmak**
- Gözlem (ekran 2): ekranın ~%75'i tek figür.
- Neden: kullanıcı kasa göre düşünür; liste yerine gövde bir menüdür.
- Uyarlama: bodymap.js zaten dokunulabilir ön/arka figür sunuyor (`bodyMap`, :59; `.bodymap.large`, styles.css:205; kas kartı `openMuscleReel`, bodymap.js:247). Hareketler sekmesinde figürü ekranın ana öğesi yap, listeyi altına al. Dokunulabilirliğin belli olması şart (bkz. 4.2).

**3.9 Hap yerine sade aktif sekme**
- Gözlem (ekran 2): aktif sekme yalnız ikon ve etiket renginde; arka plan yok.
- Neden: sade ve hızlı okunur; hap vurgusu dikkat çalar.
- Uyarlama: alt menüde aktif ikon dolu bir hapa oturuyor (styles.css:81, 84; `nav.tabs`, :77). Hapı kaldır, aktif durumu vurgu rengiyle ikon ve etikette göster. Segment ve filtre çipleri de 999px hap (:144-146; ui.js:155 `renderSeg`); bunları alt çizgili metin sekmesine ya da küçük yarıçaplı düğmeye çevir.

**3.10 İnce ikon tutarlılığı**
- Gözlem (ekran 1-3): pasif ikonlar ince çizgili ve tek renk; aktif sekme ikonu dolu ve kalın.
- Neden: tutarlı ikon "tasarlanmış" hissi verir.
- Uyarlama: Spor Defteri'nde çizgi ikonlar `<use href="#i-...">` ile geliyor (spor-defteri.html:529-535). Çizgi kalınlığını ve boyutunu tek değere sabitle (alt menüde 22px, `.ic`, styles.css:82) ve ekranlar arasında farklı boyut kullanma.

**3.11 Köşe yarıçapını farklılaştırmak**
- Gözlem (ekran 1-3): kartlar yuvarlak (~16-20px), düğmeler daha keskin (~6-8px).
- Neden: kap ile eylem farklı görünür; düğme "basılır" duruşta kalır.
- Uyarlama: şu an kart 18px (styles.css:19, :94), ana düğme `.xl` de aynı 18px (:128), normal düğme 14px. Düğmeleri 8-10px'e indir, kartları 14-16px'te tut, hap yalnız gerçekten durum etiketlerinde kalsın.

**3.12 Boşlukla nefes**
- Gözlem (ekran 1-3): bölümler arası geniş boşluk, satırlar sıkı ama ayrık.
- Neden: kart ve çizgi yerine boşluk gruplar.
- Uyarlama: kart iç boşluğu 16px, kart arası 12px (styles.css:94). Kart sayısını azaltınca bölümler arası boşluğu (:90, 22px) 28-32px'e çıkar ve kart kenarlıklarını gruplamak için kullanma.

## 4. Neyi almamalıyız / zayıf yanlar

1. **Sabit düğme listeyi örtebilir.** Ekran 1'de altta sabit düğme son satırı kapatabilir. Alınacak ders: listenin altına düğme yüksekliği kadar boşluk bırak. Canlı çubuk ve FAB ile çakışmasın.
2. **Kas seçimi kolay keşfedilmeyebilir.** Ekran 2'de renksiz figürde neye dokunulacağı belli değil (dokunma davranışı da görüntüde belirsiz). Spor Defteri'nde dokunulabilir kaslar hafif ton farkı ve ilk açılışta kısa ipucuyla belli edilsin.
3. **Fotoğraf ve video bağımlılığı.** Kişisel PWA için üretim, lisans ve çevrimdışı boyut maliyeti var. Yorum: bu bedeli ödemeden aynı netliği çizim ve kısa metinle sağlamak daha gerçekçi.
4. **Ek renklerin anlamı açıklanmıyor.** Ekran 3'te turkuaz muhtemelen yardımcı kas (yorum, ekranda açıklama yok). Spor Defteri'nde renkler zaten yazıyla açıklanıyor (bodymap.js:243, `levelLegend`, `SCALE`). Bu avantaj korunmalı.
5. **Türkçe-İngilizce karışık adlar** (örn. "Weighted Dips", "Pectoralis Sternal"). Spor Defteri kas adlarını Türkçe ve tutarlı tutsun (örn. Quadriceps gibi yaygın terimler hariç, tek kural belirlensin).
6. **Puan ve sosyal skor öğeleri.** Puan rozeti, güç sıralaması ve lider tablosu kişisel deftere uymaz; kaynakta lider tablosunun takılması şikâyet olarak geçiyor. Alınmasın.
7. **Marka unsurları.** Kırmızı + siyah ikilisi, skor adı, sloganlar ve fotoğraflar kopyalanmamalı. Vurgu rengi ve zemin tonu Spor Defteri'ne özgü seçilsin.
8. **Kanıtsız genelleme.** Ekran görüntüleri yalnız üç ekran. Alt gezinme ekran 1'de var mı, kas vurgusu dokununca nasıl çalışıyor bilinmiyor. Bu noktalar tahmin üzerine kopyalanmasın.

## 5. Spor Defteri için tasarım ilkeleri

1. **Tek vurgu rengi.** Vurgu rengi yalnızca eylem ve aktif durumda kullanılır. Ölçüt: ekranda vurgu rengi olan her öğe dokunulabilir ya da seçili mi; kas ölçeği renkleriyle bir tonu paylaşmıyor mu.
2. **Ölçek ayrı, çerçeve ayrı.** Kas seviyesi renkleri yalnız kas resimlerinde ve açıklamalarında geçer. Ölçüt: `--g-*` değişkenleri `--accent`, `--good`, `--danger` değerlerine bağlı olmasın.
3. **Hiyerarşi ağırlıkla kurulur.** Büyük harf ve aralıklı mini başlık kullanılmaz. Ölçüt: bir ekranda en fazla dört yazı seviyesi vardır ve hiçbirinde `text-transform:uppercase` yoktur. Bugün styles.css'te 20 satır var; hedef, gerçekten kısaltma gereken birkaç istisna dışında hepsinin kalkmasıdır.
4. **Kart özeti taşır, liste düz kalır.** Kart yalnız özet bloklarında kullanılır. Ölçüt: bir ekranda en fazla iki kart vardır; listeler kartsız satırdır.
5. **Ekranda tek ana eylem.** Her ekranın bir birincil düğmesi vardır ve altta sabittir. Ölçüt: dolu vurgu rengindeki düğme sayısı ekran başına bir.
6. **Durumu söz ve çubukla göster.** Hazırlık ve yorgunluk kademeli çubuk ve kısa sözcükle verilir. Ölçüt: yüzde yalnız ayrıntı satırında geçer, başlıkta geçmez.
7. **Köşe ve boşluk rol bildirir.** Kartlar yumuşak, düğmeler daha keskin, hap yalnız etiketlerde. Ölçüt: düğme yarıçapı kart yarıçapından küçüktür; 999px yalnız etiket ve rozetlerde kalır.

## 6. Açık sorular ve sonraki adım

- Vurgu rengi hangisi olacak? Kas ölçeğindeki turuncu, kırmızı, mavi, yeşil, mor ve bordodan uzak bir ton gerekir. Figma'da 3-4 aday denenebilir.
- Fotoğraf yerine ne kullanılacak? Seçenekler: sade çizim ikonlar, kas figürü, kısa metin ipucu. Çevrimdışı boyut ve telif maliyeti hesaplanmalı.
- Yazı tipi: Inter (src/styles.css:2, gömülü) kalsın mı, yoksa daha karakterli bir grotesk mi seçilsin? Gömülü boyutu etkiler.
- Hareketler ekranında figür ana öğe olacaksa dokunulabilir kasların nasıl belli edileceği.
- Figma'da denenecek ekranlar: ana sayfa (tek eylem), program günü (kartsız liste + bitkinlik çubuğu), Hareketler (büyük figür). Bu kalıp ilke olarak alınmalı; Figma aşamasında yerleşim, oran ve etiketler bizim içeriğimize göre farklılaştırılmalı, ekran 1'in düzeni birebir tekrarlanmamalı.
- Sıradaki adım: vurgu rengi ve yazı tipi kararından sonra bu üç ekran Figma'da çizilip koda uygulanır. Kalça fleksörü haritaya bilerek eklenmedi; tasarım değişikliği bunu etkilemez.
