# Spor Defteri: Tasarım Fikirleri Raporu

Tarih: 2026-11-06. Bu belge bir fikir raporudur; kod değişmeyecek. Tasarım Figma'da yapılacak, buradaki maddeler oraya girdi olarak kullanılacak.

## 1. Giriş ve yöntem

Bu rapor iki kaynaktan beslendi:

1. Koddan denetim: `src/styles.css`, `spor-defteri.html`, `src/app/*.js` ve `src/core/musclemap.ts` okundu. Dosya:satır referansları verildi; bunlar yazım anında yeniden okunarak doğrulandı (düzeltmeler 6. bölümün sonunda).
2. Web araştırması: rakip uygulamalar (Hevy, Alpha Progression, Fitbod), Apple HIG, WCAG 2.2 ve renk skalası kaynakları.

Sınırlar (açıkça):

- Çalışan uygulama görsel olarak görülmedi. Aşağıdaki "kontrast", "okunabilirlik", "renk körlüğü" yargıları kod değerlerinden yapılan hesaptır; ekranda doğrulanmamıştır. Bu tür yargılar "tahmin" diye etiketlendi.
- Bazı web kaynakları ikincil (blog, özet, mağaza sayfası). Her birinin yanında belirtildi.
- Kontrast oranları elle/yaklaşık hesaplandı; kesin sayı için bir kontrast aracıyla (Chrome DevTools, WebAIM) ölçülmeli.

Değişmeyecek olan: kas çalıştırma düzeyinin anlam sistemi. 6 seviye (düşük, koruma, minimum, iyi, maksimum, hasar) ve haftalık set eşikleri (`src/core/musclemap.ts:46`: <1 düşük, <2 koruma, <3 minimum, <6 iyi, ≤11 maksimum, >11 hasar) araştırmaya dayalı ve korunmalıdır. Bu rapordaki öneriler seviyeleri ve eşikleri DEĞİL, yalnızca görsel kodlamayı (renk, desen, simge, yerleşim) ele alır. Kalça fleksörü haritaya bilerek eklenmediği için hiçbir öneri ona değinmez.

## 2. Mevcut durum özeti

### Ekranlar

- Alt gezinme 5 sekme (`spor-defteri.html:529-535`): Ana sayfa (`#tab-home` :24), Antrenman (`#tab-train` :37; Programlar / Elle kayıt / Haftalık plan), Takvim (`#tab-history` :165), İlerleme (`#tab-progress` :187; Hafta / Hareket / Rekorlar / Kaslar / Güç / Vücut), Profil (`#tab-profile` :346).
- Canlı antrenman tam ekran `#focus` (`src/app/live.js:37` openFocus, :74 renderFocus), canlı çubuk `#liveBar` (:514), dinlenme sayacı için yüzen düğme (FAB) ve panel (:516-527).
- Alttan açılan paneller `openSheet` (`ui.js:41`): kas analizi (`bodymap.js:158,202`), kas "reel" (:247), hazır programlar (`presets.js`), içe aktarma (`importer.js`), seri kutlaması (`streak.js:66`). Modallar: `#calModal` :540, `#modal` :552.

### Görsel dil

- Koyu tema varsayılan; açık tema hem `prefers-color-scheme` (`styles.css:24`) hem `data-theme="light"` (:36) ile var.
- Koyu renkler: zemin `#0a0a0b`, kart `#141416`, vurgu `#ff6a2b`, iyi `#3ddc84`, uyarı `#ffc53d`, hata `#ff5d5d` (`styles.css:11-21`). Açık temada vurgu `#f2561a`, zemin `#f3f3f4`.
- Yazı tipi Inter, gövde 15px/1.5 (:50). Köşe yarıçapı 18/14/10 (:19), modal 22px (:507). Boşluk ölçeği için değişken yok.
- Kas ölçeği (:18, açık tema :32): düşük `#4c8dff`, koruma = `--good` `#3ddc84`, minimum `#ff8a3d`, iyi = `--danger` `#ff5d5d`, maksimum `#a8203f`, hasar `#a78bfa`. SVG dolguları :219-224 (`data-t="g-*"`). Lejant hem etiketli hem set aralıklı (`musclemap.ts:41`, `bodymap.js:105`). Kas üzerinde desen/doku yok.
- Mevcut iyi yanlar: stepper düğmeleri `aria-label`'lı; odaktayken Önceki/Sonraki altta; açık/koyu tema var; canlı modda değerler önceki seansa göre önceden doluyor (`live.js:63-67`) ve `#fComplete` düğmesi tek dokunuşla seti kaydediyor (`live.js:244,381`; kilo/tekrar boşsa uyarı verir); `YOL-HARITASI.md:80-89` "Atletik" tasarım sistemini mevcut sistem olarak tanımlıyor (belge "tamamlandı" ifadesini yalnız Faz 1-2 için kullanıyor, tasarım sistemi için değil); Faz başlıklarında tasarıma ayrılmış planlı bir madde görmedim, ancak belgenin tamamını bu amaçla satır satır okumadım (doğrulanamadı: planlı madde olmadığı kesin değil).

## 3. Hızlı kazanımlar (öncelik sırasıyla)

Zorluk: küçük = birkaç CSS/HTML satırı; orta = bir ekranın yeniden düzeni; büyük = birden çok ekran / veri akışı.

### H1. Kas haritasında renk tek başına bilgi taşımasın: hasar için desen + simge

- Ekran: İlerleme > Kaslar, kas analizi paneli, kas reel'i, lejant.
- Sorun: Hasar düzeyi yalnızca `#a78bfa` renkle ayrılıyor (`styles.css:224`). Kasın üzerinde desen yok. Reel skalası `aria-hidden` (`bodymap.js:245`), yani ekran okuyucuya hiçbir şey vermiyor.
- Öneri: SVG `<pattern>` ile çapraz tarama (hasar için), lejantta bu deseni de göster, panelde metin: "Aşırı: kas hasarı riski, ek gelişim yok". Reel skalasındaki renk kutularının yanına metin zaten var; `aria-hidden` kalkarsa metinler okunur.
- Neden: WCAG 1.4.1 rengin tek başına bilgi taşımasını istemiyor; desen/metin ek ipucu sayılır. https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
- Zorluk: küçük-orta. (Eşiklere dokunmaz.)

### H2. "İyi" seviyesi hata kırmızısını paylaşıyor: anlam çakışmasını ayır

- Ekran: Kas haritası, her yerde `--g-iyi`.
- Sorun: `--g-iyi: var(--danger)` (`styles.css:18`). "İyi gelişim" ile "hata/silme" aynı kırmızı; kullanıcı "iyi" bölgeyi uyarı gibi okuyabilir (yorum).
- Öneri: Kas ölçeği için ayrı değişkenler tanımla (hata rengine bağlama). Hangi renk olacağı bölüm 5'teki yönlere bağlı.
- Neden: Kodda doğrudan görülen bir bağımlılık; sıralı veri için ıraksak/anlam yüklü renk yerine tek yönlü skala önerisi: https://datavizf25.classes.andrewheiss.com/resource/colors.html
- Zorluk: küçük.

### H3. 44px altı dokunma hedefleri

- Ekran: Set satırı, stepper, canlı mod gezinmesi, reel, snackbar.
- Sorun (dosya:satır): `.setrow` silme düğmesi sütunu 32px (`styles.css:163`, :171 iç yükseklik 46px ama sütun 32), `.stepper button` 40px genişlik (:413), `.f-nav` min-height 40 (:437), `.reel-sets .iconbtn` 32px (:343), `.btn.sm` 36px (:127), `.seg/.fchip` 36-38px (:145,149), `.snack button` 40px (:504), `.f-chips button` 36px (:423).
- Önemli not: Bunlar WCAG 2.2 AA'nın (2.5.8, en az 24x24 CSS px) altında DEĞİL; yani "WCAG ihlali" değil. Sorun, Apple (44pt) ve Material (48dp) önerilerinin altında kalmaları (ikincil kaynak). Spor salonunda terli/aceleli tek elle kullanımda yanlış dokunma riski artar (yorum).
- Öneri: Görsel boyutu küçük tutup dokunma alanını büyüt (padding veya görünmez `::after` ile 44x44). Özellikle set silme ve stepper −/+ için.
- Neden: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html (asgari 24px), https://blog.openreplay.com/improving-tap-targets-mobile-ux/ (44pt/48dp, ikincil).
- Zorluk: küçük.

### H4. Soluk ikincil metinlerin kontrastı (tahmin)

- Ekran: Pasif sekme etiketi, reel skalası, figcaption, set satırındaki silme ikonu.
- Sorun: `--faint #5e5e66` koyu zeminde `#0a0a0b` üzerinde yaklaşık 3:1; açık temada `#a1a1a9` beyaz üstünde yaklaşık 2.5:1 (elle hesap, tahmin). Kullanıldığı yerler: pasif sekme (`styles.css:79`), `.reel-scale` (:344), figcaption (:208), `.setrow .x` (:171). Ayrıca açık temada beyaz yazı / `#f2561a` yaklaşık 3.4:1 (tahmin, elle hesap): büyük/kalın yazıda sınırda, küçük yazıda zayıf.
- Öneri: `--faint`'i metin için bir kademe açın (koyu) ya da koyulaştırın (açık); bilgi taşıyan metinde `--muted` kullanın, `--faint`'i yalnızca süs için bırakın. Kontrast aracıyla ölç.
- Neden: WCAG 1.4.3 metin kontrastı (normal metin 4.5:1) ve 1.4.11 grafik nesneler 3:1: https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- Zorluk: küçük.

### H5. Erişilebilirlik işaretleri: modal, FAB ve kapat düğmesi

- Ekran: Takvim'e ekle penceresi (`#calModal`), genel `#modal`, dinlenme paneli (`#fab`, `#shClose`).
- Sorun: `role="dialog"` alt panelde (`#bs` :539), canlı ekranda (`#focus` :496) ve reel'de var; yalnız `#calModal` (:540) ve `#modal` (:552) pencerelerinde yok. `#fab` ve `#shClose` yalnızca `title` ile etiketli (:516, :518), `aria-label` yok (title bazı yardımcı teknolojilerde ad olarak okunur ama güvenilir değil). Alt sekmelerdeki `aria-current` HTML'de yok ama çalışma anında ekleniyor (`ui.js:134`), yani sorun değil.
- Öneri: İki modala `role="dialog" aria-modal="true"` ve başlığa bağlı `aria-labelledby`; `#fab` ve `#shClose`'a `aria-label`. Sekmeler için ek iş gerekmiyor.
- Neden/Kaynak: Ekran okuyucu ve klavye gezinmesi; tasarım kararı değil, tamamlayıcı. WCAG 4.1.2 (Name, Role, Value) genel ilkesi; bu maddeye özel ikincil kaynak taranmadı.
- Zorluk: küçük.

### H6. Küçük yazıları azalt ve ölçeğe oturt

- Ekran: Tüm uygulama (özellikle alt gezinme etiketi, kas haritası metinleri, canlı mod).
- Sorun: `styles.css`'te `font-size: Npx` ile 27 farklı değer var (sayım: 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 16, 17, 18, 19, 20, 22, 24, 26, 28, 30, 34, 38, 44, 56, 60, 84px). 11.5px ve altında çok sayıda yerde yazı var (nav etiketi 10.5 `styles.css:80`, SVG metin 10 :266, `.bl-num` 10 :536).
- Öneri: 5-6 basamaklı bir ölçek (örn. 12 / 14 / 16 / 20 / 28 / 40) ve CSS değişkeni; alt sınır 12px. Nav etiketi 12px'e çıkabilir (5 sekme 110px max genişlikle sığar, tahmin).
- Neden: Tutarlılık ve okunabilirlik; bu madde kod gözlemine dayanır, harici kaynak yok.
- Zorluk: orta (çok yerde dokunuyor).

### H7. Sabit renkleri değişkene bağla

- Ekran: Plaka hesaplayıcı, ayarlar (tema rengi), içe aktarma, hazır programlar, kas analizi panelleri.
- Sorun: `src/app/tools.js:25` plaka renkleri (`PLATES`), `src/app/settings.js:46` theme-color `#0a0a0b`/`#f3f3f4`, `styles.css:494` sabit renk. Satır içi `style=` yoğun: `importer.js` 22, `presets.js` 26, `bodymap.js` 18 satır (grep ile satır sayısı, öğe sayısı daha yüksek olabilir).
- Öneri: Satır içi stilleri sınıflara taşı, Figma'daki değişken adlarıyla eşle. Bu yapılmadan Figma'dan koda uygulama (kayma) zorlaşır.
- Neden: Figma token'larını koda geçirirken tek kaynak gerekir (yorum).
- Zorluk: orta.

### H8. "Son kez" satırının görsel hiyerarşisi

- Ekran: Canlı mod (`#focus`) ve Elle kayıt.
- Sorun: Önceki performans zaten gösteriliyor: canlı modda "Son kez <tarih>: 60 kg x 8, ..." (`live.js:50,59,63`), elle kayıtta "Son kez" satırı (`log.js:115`), değerler de önceden dolu. Eksik olan özellik değil; bu satırın ekranda ne kadar görünür olduğu bilinmiyor (görsel doğrulanmadı). Satır set başına değil, tüm setleri tek metinde veriyor.
- Öneri: Figma'da bu satırı hiyerarşi açısından dene: "Son kez" etiketi soluk, değerler vurgulu (eşit genişlikli rakam zaten mevcut: `styles.css:58` `.num`, :156, :158, :164, :167, :236; Figma'da korunmalı ya da kapsamı genişletilmeli); "artış öner" mesajı (`.up`) ayrı renk/simgeyle. Set satırı başına ayrı sütun yalnızca ekranda gerçekten okunmuyorsa düşünülsün.
- Neden/Kaynak: Hevy önceki değeri set satırında gösteriyor, kaynak seçilebiliyor (karşılaştırma için): https://www.hevyapp.com/features/track-exercises/ , https://www.hevyapp.com/features/workout-settings/
- Zorluk: küçük.

### H9. Antrenman sonu: kırılan rekorlar listesi

- Ekran: Antrenman bitişi. Şu an ayrı bir bitiş ekranı yok: bitişte canlı mod kapanır, ana sayfaya dönülür ve yalnızca bir toast çıkar (`live.js:353`: süre, set, hacim). Seri kutlaması paneli (`streak.js:66`) yalnızca seri arttığında açılır (`live.js:357`), her bitişte değil.
- Sorun: Canlı modda rekor anında toast çıkıyor (`live.js:261-265`); bitişte o seansta kırılan rekorların toplu listesini gösteren bir yer yok (yalnız ilgili dosyalara bakıldı, tam tarama yapılmadı). Kutlama paneli de bu iş için uygun bir zemin değil, çünkü koşullu açılıyor.
- Öneri: Yeni bir bitiş özeti paneli ekle (kod değişikliği gerektirir; mevcut bir ekranın düzeltmesi değil). Panelde süre, set, hacim ve o antrenmanda kırılan rekorlar liste olarak yer alsın; ana metrik (1RM / 10RM / hacim) kullanıcı seçsin ve her ekranda aynı kullanılsın.
- Neden: Alpha Progression bu davranışı ve tutarlı metrik seçimini sunuyor: https://apps.apple.com/us/app/gym-workout-alpha-progression/id1462277793 , https://alphaprogression.com/en/glossary/1rm (mağaza sayfası: ikincil).
- Zorluk: orta-büyük (yeni panel + bitiş akışının değişmesi + rekor verisinin seansa bağlanması; Figma'da yeni ekran tasarımı da gerekir).

(Not: Önceki taslakta burada "FAB, canlı çubuk ve alt gezinme üst üste biniyor" maddesi (H10) vardı; kaldırıldı. `styles.css:514` `body.focus-open .fab, body.has-livebar .fab {display:none}` ile FAB, canlı çubuk veya canlı mod açıkken zaten gizleniyor; çakışma kodda yok. Canlı çubuk alt gezinmenin 76px üstüne oturuyor (:461). Toast/snack canlı modda yukarı kayıyor (:505).)

## 4. Büyük yenileme fikirleri

Her madde aynı alanları taşır: Ekran, Sorun, Öneri, Neden/Kaynak, Zorluk.

### B1. Kas haritası için "tek anlatım" iki katmanlı kodlama

- Ekran: İlerleme > Kaslar (kas analizi paneli, reel, lejant); yalnızca set düzeyi haritaları. Ana sayfadaki küçük harita yorgunluk/toparlanma gösterir (`fatigueTiers`), bu skalaya dahil değil; onun için B2'ye bak.
- Sorun: Mevcut skala (mavi > yeşil > turuncu > kırmızı > bordo > mor) parlaklıkta monoton değil, sırayı sezgisel okumak zor olabilir (yorum). Yeşil (koruma) ile kırmızı (iyi) yan yana; renk körlüğünde ayrışmayabilir (simüle edilmedi). Hasar yalnız renkle ayrılıyor (bkz. H1).
- Öneri: Renk = seviye (sıralı skala); desen/simge = özel durum (hasar). Lejant üç parça: 5 basamaklı renk şeridi + hasar deseni + set aralığı metni. Kas dokununca: haftalık set, seviye adı, bir cümlelik anlam. Aday paletler bölüm 5'te tanımlı (A, B, C).
- Neden/Kaynak: Sıralı veri için tek ton açık→koyu ya da viridis/cividis önerilir: https://datavizf25.classes.andrewheiss.com/resource/colors.html . Iraksak palet yalnızca anlamlı bir orta noktada kullanılmalı: https://malfaro2.github.io/STAT80B/2026/weeks/week02/slides2.html .
- Renk körlüğü notu: RdYlGn/Spectral renk körlüğüne uygun değil; RdBu/BrBG/PuOr daha güvenli: https://apexcharts.com/apexmaps/docs/palettes/ . Simülasyon yapılmadı; Coblis veya Chrome DevTools "Emulate vision deficiencies" ile test edilmeli.
- Zorluk: büyük (Figma'da 3 yön denenip seçilmeli, bkz. bölüm 5).

### B2. Ana sayfadaki toparlanma haritası ile haftalık set haritasını ayır ve tutarlı yap

- Ekran: Ana sayfa "Toparlanma" kartı (`#homeRecovery`, `home.js:85-91`) ve İlerleme > Kaslar.
- Sorun: Ana sayfada zaten küçük bir vücut haritası var; yorgunluk/toparlanma düzeyini gösteriyor (`bodyMap(fatigueTiers(R), {small:true})`, kasa dokununca toparlanma analizi açılıyor). İlerleme > Kaslar ise haftalık set düzeyini (6 seviye) gösteriyor. Aynı çizim iki farklı anlam taşıyor; ikisinin renk/lejant dili ayrışmıyorsa kullanıcı yanlış okuyabilir (yorum; iki haritanın renklerini ekranda karşılaştırmadım).
- Öneri: Yeni bir harita ekleme. Figma'da iki haritanın başlık, lejant ve renk ailesini net ayır (örn. toparlanma = durum/simge, haftalık set = sıralı skala) ve ana sayfa kartına "bu hafta" kısayolu düşün. Mevcut eşik ve renk sistemi değişmez.
- Neden/Kaynak: Hevy son 7 gün kas dağılımı sunuyor (karşılaştırma): https://www.hevyapp.com/features/muscle-group-workout-chart/ , https://help.hevyapp.com/hc/en-us/articles/35702030346903
- Zorluk: orta.
- Not: Fitbod'un %0-100 toparlanma haritası da benzer, ancak o toparlanma tahminidir ve Spor Defteri'nin set-bazlı ölçeğiyle aynı şey değil. Fitbod bilgisi ikincil bir blogdan (https://fitbod.me/blog/muscle-recovery/), efsane doğrulanmadı; bu yüzden birebir kopya önerilmiyor.

### B3. Dinlenme bitişinde kilit ekranı / arka plan bildirimi

- Ekran: Canlı mod dinlenme sayacı (`startTimer`, `tools.js`), canlı çubuk.
- Sorun: Otomatik dinlenme sayacı (`state.autoRest`, `live.js:274,290`) ve hareket başına süre (`restFor`, `programs.js:112`; `live.js:317` hareket ayarları) zaten var. Bitişte uygulama içinde bip ve "Dinlenme bitti" toast'ı var (`tools.js:75`). `src/` ve `public/sw.js` içinde Notification / showNotification araması sonuç vermedi: telefon cepteyken veya uygulama arka plandayken süre bittiğini haber veren bildirim kodda yok (ekran uyurken bipin duyulup duyulmayacağı cihaza bağlı, test edilmedi).
- Öneri: Dinlenme bitişinde, kullanıcı izin verirse, bildirim (ve süre göstergesi) fikri. Figma'da izin isteme akışı ve bildirim metni tasarlanır. PWA'da zamanlanmış bildirimin güvenilirliği platforma göre değişir (tahmin; uygulanabilirlik önce küçük bir denemeyle test edilmeli).
- Neden/Kaynak: Hevy kilit ekranı / Live Activity karşılığı sunuyor, PWA'da birebir yok: https://www.hevyapp.com/features/live-activity/ , https://www.hevyapp.com/features/workout-rest-timer/
- Zorluk: orta-büyük (izin akışı + service worker).

### B4. Serinin kuralını ve dondurma hakkını görünür kıl

- Ekran: Profil seri kartı (`streakCardHTML`), Ana sayfa seri notu, seri kutlaması.
- Sorun: Dinlenme günü payı zaten var: haftalık seri modu (`streak.js:12-19`), planlı günlere göre günlük seri, "dinlenme günleri bozmaz" ve ayda dondurma hakkı (`streak.js:45-50`). Eksik olan mantık değil, anlatım: kural ve kalan dondurma hakkı Profil kartında küçük gri yardım metni (`muted small help`, :50) olarak duruyor; ana sayfada ve takvimde görünür olup olmadığı görsel doğrulanmadı.
- Öneri: Figma'da seri kartında dondurma hakkını simge/rozetle (örn. kalan hak sayısı), haftalık modda "bu hafta x/y gün" ilerlemesini halka veya çubukla göster; planlı dinlenme günü takvimde farklı işaretlensin. Yeni seri mantığı gerekmez.
- Neden/Kaynak: Apple halkaları yalnızca ilerleme bilgisi için önerir (https://developer.apple.com/design/human-interface-guidelines/activity-rings); dinlenme günü olmayan serilerin eleştirildiği ikincil kaynak: https://www.macworld.com/article/3179972/i-closed-my-rings-for-500-days-by-cracking-the-apple-watch-code.html
- Zorluk: küçük-orta.

### B5. Tasarım token sistemi (renk, yazı, boşluk, köşe, yükseklik)

- Ekran: Tüm uygulama (tasarım altyapısı).
- Sorun: Bugün boşluk ölçeği yok, `styles.css`'te 27 farklı font-size var, satır içi stil çok (bölüm 2 ve H6-H7).
- Öneri: Figma Variables ile 4 koleksiyon: renk (semantik: yüzey, metin, vurgu, durum, kas-seviye), tip ölçeği, boşluk ölçeği (4/8/12/16/24), köşe (10/14/18/22). CSS değişkenleriyle bire bir eşleşsin.
- Neden/Kaynak: Ortak sözlük Figma → kod geçişini ucuzlatır (yorum, harici kaynak yok).
- Zorluk: büyük.

### B6. Alt gezinme sayısı: şimdilik koru

- Ekran: Alt gezinme ve İlerleme içindeki alt sekmeler.
- Sorun: 5 sekme Material 3 / SAP Fiori özetindeki 2-5 hedef sınırında; İlerleme içindeki 6 alt sekme (Hafta/Hareket/Rekorlar/Kaslar/Güç/Vücut) yoğun (ekranda doğrulanmadı).
- Öneri: Yeni özellikler için 6. sekme AÇMA; Figma'da iç gezinmenin yatay kaydırmalı segment mi, üstte seçici mi olacağı denenebilir.
- Neden/Kaynak: https://www.sap.com/design-system/fiori-design-android/v26-1/components/m3-standard-components/navigation-bar/usage (ikincil)
- Zorluk: orta.

## 5. Figma'da denenecek 3 alternatif görsel yön

Not: Aşağıdaki hex değerleri öneri/aday; simüle edilmedi, kontrast ve renk körlüğü Figma'da ve DevTools'ta ölçülmeli. Hepsinde 6 seviyenin adı, sırası ve eşikleri aynıdır.

### Kas skalası aday paletleri (A, B, C)

Her palet 5 basamaklıdır (düşükten maksimuma) ve rapordaki yönler bu adlara atıf yapar. Hasar seviyesi paletin dışında, desen + simge ile gösterilir (H1). Hiçbiri renk körlüğü simülasyonundan geçirilmedi; Coblis veya Chrome DevTools > Rendering > "Emulate vision deficiencies" ile test edilmeli.

- A, tek ton mavi (sıralı): `#EFF3FF` `#BDD7E7` `#6BAED6` `#3182BD` `#08519C`
- B, viridis: `#440154` `#3B528B` `#21918C` `#5EC962` `#FDE725`
- C, sıcak sıralı: `#FFF3B0` `#FDBF6F` `#F46D43` `#C62828` `#7F0000`

Eşleşme: Yön 1 = C, Yön 2 = B, Yön 3 = A.

Koyu temada ortak ilke: Saf siyah yerine koyu gri (yaklaşık `#121212`) yükseklik ayrımını kolaylaştırır, doygun renkler biraz soldurulur, metin kırık beyaz olur (https://uxcel.com/blog/12-principles-of-dark-mode-design-627 , https://uxplanet.org/8-tips-for-dark-theme-design-8dfc2f8f7ab6; ikincil). Çelişki: Apple kendi arayüzünde `#000` kullanır; yani bu bir kural değil tercihtir. Mevcut zemin `#0a0a0b` zaten neredeyse siyahtır; Yön 1 ve 2'de `#121212` ile karşılaştırmalı deneyin.

Açık uçlu skala koyu temada ters çevrilebilir: az = zemine yakın koyu, çok = parlak. Bu bir yorumdur ve Figma'da iki biçim yan yana denenmeli.

### Yön 1: "Atletik koyu, tek ton vurgu" (mevcut dilin sadeleştirilmiş hali)

- Palet: zemin `#121214`, kart `#1A1A1D`, kart2 `#232327`, çizgi `#2E2E34`, metin `#F2F2F3`, ikincil metin `#A0A0A8`, vurgu `#FF6A2B` (mevcut), başarı `#3DDC84`, hata `#FF5D5D`.
- Tipografi: Inter korunur; ölçek 12 / 14 / 16 / 20 / 28 / 40; sayılarda mevcut eşit genişlikli (tabular) rakam korunur (`styles.css:58` ve çoğu sayı sınıfında zaten var); başlıklarda 700, gövdede 500.
- Yüzey/köşe: kart 14px, sheet 22px üst köşe, gölge yok, 1px ince çizgi ile yükseklik; boşluk 8'in katları.
- Kas skalası: Yukarıda tanımlı C paleti (sıcak sıralı): `#FFF3B0` `#FDBF6F` `#F46D43` `#C62828` `#7F0000` düşükten maksimuma; koyu zeminde ters çevirip "az = zemine yakın, çok = parlak turuncu-sarı" varyantı da denenir. Hasar: mor yerine desen (çapraz tarama) + uyarı simgesi, rengi skaladan ayrı.
- Beklenen görünüm: Harita tek bir sıcak ailede okunur, sıra sezgisel olur; renk körlüğünde parlaklık farkı sırayı taşır. Dezavantaj: "koruma" ve "minimum" arası sarı-turuncu yakın olabilir (tahmin).
- Neden bu yön: Vurgu rengi ve marka devam eder, değişiklik en az olur.

### Yön 2: "Gece mavisi, viridis kas skalası"

- Palet: zemin `#0E1117`, kart `#161B22`, kart2 `#1F2630`, çizgi `#2B3340`, metin `#E6EDF3`, ikincil `#9AA7B5`, vurgu `#5EC962` (yeşil, "ilerleme" çağrışımı) veya mevcut turuncuyu CTA olarak koru; hata `#FF6B6B`, uyarı `#FFC53D`.
- Tipografi: Inter başlıklarda 600; sayılarda mevcut eşit genişlikli rakam korunur; alternatif olarak Figma'da "DM Sans" ya da "Manrope" denenebilir (yalnızca görsel tercih; kaynaksız).
- Yüzey/köşe: kart 16px, sheet 24px, katmanlı yükseklik (açık tonlu yüzeyler), hafif iç parlama yerine çizgi.
- Kas skalası: Viridis ailesi (yukarıda tanımlı B paleti): `#440154` `#3B528B` `#21918C` `#5EC962` `#FDE725`; viridis sıralıdır ve renk körlüğüne dayanıklıdır (kaynak: https://datavizf25.classes.andrewheiss.com/resource/colors.html). Koyu zeminde en düşük uç `#440154` zemine çok yakın olabilir; en az 3:1 için ya ters çevrilir ya da düşük seviyeye ince açık kontur eklenir (WCAG 1.4.11, 3:1). Hasar: desen + simge.
- Beklenen görünüm: Bilimsel/analitik, serinden sıcağa net bir sıra; "iyi" ve "maksimum" parlak yeşil-sarıda, hasar desenle ayrışır. Dezavantaj: Yeşil-sarı "iyi" hissini verirken sarı kullanıcıya uyarı çağrıştırabilir (yorum).
- Neden bu yön: Sıralı veriye en uygun, renk körlüğüne en dayanıklı aday.

### Yön 3: "Açık ve sıcak, tek ton mavi" (açık temayı öne çıkaran sade yüzey)

- Palet (açık): zemin `#F6F5F2`, kart `#FFFFFF`, çizgi `#E3E1DC`, metin `#17171A`, ikincil `#5C5C66`, vurgu `#D94A0F` (mevcut `#f2561a`'dan koyu; beyaz yazı kontrastı için), başarı `#15803D`, hata `#C62828`.
- Koyu eşleniği: zemin `#121212`, kart `#1B1B1B`, vurgu `#FF7A3D`.
- Tipografi: Inter; gövde 16px (15 yerine, okunabilirlik); büyük sayı vitrinleri 40px+ 700; satır yüksekliği 1.45.
- Yüzey/köşe: kart 12px, çok hafif gölge (açık temada), butonlar tam yuvarlak değil 12px; 44px minimum dokunma alanı sistemde standart.
- Kas skalası: Yukarıda tanımlı A paleti (tek ton mavi): `#EFF3FF` `#BDD7E7` `#6BAED6` `#3182BD` `#08519C` düşükten maksimuma. Tek ton olduğu için sıra parlaklıkla okunur, renk körlüğünde en güvenlisi (kaynak yukarıdaki skala makalesi). Hasar: desen + simge, mavi skalanın dışında sıcak bir işaret (örn. turuncu çapraz tarama) olabilir. Dezavantaj: Tek ton mavi "koruma" gibi iyi/yeterli seviyeyi vurgulamaz; ayrışma sayı/etiketle desteklenmeli; açık uçta `#EFF3FF` açık zeminde 3:1'i geçmeyebilir (tahmin), ince kontur gerekebilir.
- Beklenen görünüm: Sakin, ciddi, güneşli ortamda (salon dışı) okunaklı.
- Neden bu yön: Açık temada en iyi kontrast ve en güvenli sıra okuması.

### Karşılaştırma tablosu

| Ölçüt | Yön 1 (sıcak) | Yön 2 (viridis) | Yön 3 (mavi tek ton) |
|---|---|---|---|
| Marka sürekliliği | yüksek | orta | orta-düşük |
| Sıra okunurluğu | iyi | çok iyi | çok iyi |
| Renk körlüğü (beklenti, test edilmeli) | iyi | çok iyi | çok iyi |
| Koyu zeminde düşük uç riski | orta | yüksek | düşük |
| Açık zeminde düşük uç riski | düşük | düşük | yüksek (`#EFF3FF` açık zeminde kaybolabilir) |
| Uygulama maliyeti | küçük | orta | orta |

## 6. Kaynaklar ve doğrulanamayanlar

### Kaynaklar

Rakipler ve sektör:

- Hevy: https://www.hevyapp.com/features/track-exercises/ , https://www.hevyapp.com/features/workout-settings/ , https://www.hevyapp.com/features/workout-rest-timer/ , https://www.hevyapp.com/features/live-activity/ , https://www.hevyapp.com/features/muscle-group-workout-chart/ , https://help.hevyapp.com/hc/en-us/articles/35702030346903
- Alpha Progression (mağaza sayfası ikincil): https://apps.apple.com/us/app/gym-workout-alpha-progression/id1462277793 , https://alphaprogression.com/en/glossary/1rm
- Apple HIG, halkalar: https://developer.apple.com/design/human-interface-guidelines/activity-rings
- Macworld (ikincil): https://www.macworld.com/article/3179972/i-closed-my-rings-for-500-days-by-cracking-the-apple-watch-code.html
- Fitbod blog (ikincil): https://fitbod.me/blog/muscle-recovery/

Erişilebilirlik ve arayüz:

- WCAG 2.2: https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html , https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html , https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Dokunma hedefi önerileri (ikincil): https://blog.openreplay.com/improving-tap-targets-mobile-ux/
- Alt gezinme (M3, SAP Fiori özeti, ikincil): https://www.sap.com/design-system/fiori-design-android/v26-1/components/m3-standard-components/navigation-bar/usage
- Karanlık mod (ikincil): https://uxcel.com/blog/12-principles-of-dark-mode-design-627 , https://uxplanet.org/8-tips-for-dark-theme-design-8dfc2f8f7ab6

Renk skalaları:

- https://datavizf25.classes.andrewheiss.com/resource/colors.html
- https://malfaro2.github.io/STAT80B/2026/weeks/week02/slides2.html
- https://apexcharts.com/apexmaps/docs/palettes/

### Doğrulanamayanlar ve sınırlar

- Çalışan uygulama görülmedi; tüm "okunabilir/yakın/kalabalık" yargıları koddan çıkarılmış tahmindir.
- Kontrast oranları (`--faint`, açık tema vurgusu) elle hesaplandı; kesin ölçüm yapılmadı.
- Üç palet adayı (A, B, C; bölüm 5'te tanımlı) ve hex değerleri renk körlüğü simülasyonundan geçirilmedi. Test: Coblis veya Chrome DevTools "Emulate vision deficiencies".
- Fitbod'un %0-100 toparlanma haritası ikincil bir blogdan; "efsane" (renk anahtarı) doğrulanamadı.
- Apple'ın kendi arayüzünde `#000` kullanması ile "koyu gri öner" kaynaklarının çelişmesi gerçek bir görüş ayrılığıdır; kural olarak sunulmadı.
- Açık uçlu skalanın koyu temada ters çevrilmesi bir yorumdur, kaynağa bağlanmadı.
- B3 (bildirim yokluğu) yalnız `src/` ve `public/sw.js` aramasına dayanır; tarayıcıda bildirimin gerçekte çalışıp çalışmayacağı denenmedi.
- H8 ve B4'te mevcut davranış kodla doğrulandı (`live.js:50-63`, `streak.js:12-50`); bu öğelerin ekrandaki görünürlüğü doğrulanmadı.
- H9: bitişte rekor özeti olmadığı sınırlı kod aramasına dayanır.
- YOL-HARITASI'nda planlı tasarım maddesi olmadığı belgenin tamamı okunarak doğrulanmadı (bölüm 2).
- H5 (aria rolleri) için bu rapora özel bir kaynak taranmadı; genel WCAG ilkesine dayanır.
- Yazı boyutu sayısı (27) `styles.css`'teki `font-size: Npx` tanımlarından sayıldı; em/rem veya `font:` kısayolu ile verilenler dahil değil.
- Eşikler (<1, <2, <3, <6, ≤11) bu raporda değerlendirilmedi, araştırma dosyalarında kalır.

### Doğrulama sırasında yapılan düzeltmeler

- Satır içi `style=` sayısı: ilk bulguda "~92" ve importer 18 / presets 23 / bodymap 12 olarak geçiyordu; doğrulamada satır bazlı sayım importer.js 22, presets.js 26, bodymap.js 18 çıktı (toplam 66 satır; aynı satırda birden çok olabilir). Rapor bu sayıları kullandı.
- `.setrow` silme satırı: sütun 32px (`styles.css:163`), içindeki düğmenin yüksekliği 46px (:171); H3'te ayrı belirtildi.

## 7. Figma için uygulama sırası önerisi

Bu bölüm bir yorumdur; sıra kullanıcının tercihine göre değişebilir.

1. Önce tasarım token'larını kur (B5): renk, yazı ölçeği, boşluk, köşe. Mevcut CSS değişkenlerinden (`styles.css:11-21`) başla ve adları koruyarak Figma Variables'a taşı.
2. Kas haritası ekranını üç yönde (bölüm 5) yan yana çiz. Her yönde şu altı durumu göster: düşük, koruma, minimum, iyi, maksimum, hasar. Aynı çerçevede açık ve koyu tema bulunsun.
3. Kararı vermeden önce her yönü Figma eklentisi ya da DevTools ile renk körlüğü simülasyonundan geçir ve sonucu not et. Bu raporun hiçbir palet iddiası simülasyonla doğrulanmadı.
4. Seçilen yönle hızlı kazanımları (H1-H9) ekran ekran çiz; özellikle canlı mod (`#focus`) ve set satırı: dokunma hedefleri 44px, soluk metinler yeni kontrastla.
5. Kodlamaya geçmeden önce Figma'daki ölçüleri CSS değişkenlerine eşle; satır içi stilleri (H7) bu aşamada sınıflara çevir.

### Kapsam dışı bırakılanlar

- Yeni sekme açmak (B6'daki gözlem nedeniyle).
- Kas seviyesi adlarını, sırasını ya da set eşiklerini değiştirmek.
- Haritaya yeni kas eklemek (kalça fleksörü bilerek dışarıda).
- Kod değişikliği: bu belge yalnızca fikir ve tasarım girdisidir.
