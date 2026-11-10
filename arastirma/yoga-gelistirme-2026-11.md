# Yoga & Esneme: geliştirme önerisi (2026-11)

Durum: öneri raporu. Kod değişmedi.
Yöntem: kod denetimi (salt okunur), rakip taraması (web), literatür (dil modeli taslağı, sonra her kaynak Crossref / PubMed / Europe PMC üzerinden ayrıca kontrol edildi).
Sınırlar: kaynaklar özet (abstract) düzeyinde kontrol edildi, tam metin okunmadı. Rakip bilgisinin çoğu inceleme siteleri ve mağaza sayfalarından; yalnız downdogapp.com doğrudan okundu. Kod bulguları tek bir denetimden geliyor; "teyit et" yazanlar uygulamadan önce koda bakılarak doğrulanmalı.

## 1. Şu an ne var, ne eksik

Var:
- 33 hareket, tek düz liste: 28 duruş + 5 esneme (`src/core/library.ts:16-20`). Kilo gizli, süre saniye ile girilir, 5 sn adım (`src/app/live.js:117,134`).
- Tutuş sayacı: 3 sn hazırlık, sesli/titreşimli geri sayım, süre dolunca otomatik kayıt, ekran açık kalır (`src/app/live.js:184-232`, `src/app/ui.js:21-29`).
- 4 hazır yoga programı: başlangıç, akış A/B, sabah, akşam; TR/EN (`src/core/programs.ts:216-278`).
- Haftalık yoga kartı: toplam dakika, farklı poz, en uzun tutuş, geçen haftaya fark (`src/app/stats.js:64-79`).
- Kullanım tercihi: spor+yoga / sadece spor / sadece yoga (`src/app/exercises.js:18-21`).

Eksik / zayıf:
1. Akış kesiliyor: her tutuştan sonra dinlenme sayacı başlıyor (varsayılan 90 sn), hareket başına en az 30 sn, "0" yok (`src/app/live.js:286,302,330`; `src/core/schema.ts:34-35`). Süre bitince sıradaki poz seçiliyor ama sayacı kendiliğinden başlamıyor. Dinlenme yalnız tüm antrenman için "otomatik dinlenme" ayarıyla kapanıyor (`src/app/settings.js:92`); yoga için ayrı seçenek yok. Program metnindeki "25 dakika" bu yüzden tutmuyor olabilir (`src/i18n/tr/core_programs.ts:83`, teyit et).
2. Sağ/sol taraf: yalnız Low Lunge taraf akışına giriyor (`src/core/library.ts:42-57`). Program ipucu ise "Savaşçı, Ağaç, Güvercin her taraf bir set" diyor (`src/i18n/tr/core_programs.ts:9`). Son commit'te bilinçli çıkarılmış olabilir; karar gerekiyor.
3. Poz bilgisi yok: Türkçe ad, tür (duruş/esneme), bölge, seviye, önerilen süre, çizim, nefes. Hepsi "arandı, bulunamadı".
4. "Sadece spor" modunda yoga programları listede kalıyor (`src/app/programs.js:87`). Yoga setleri spor sayılarına, seriye ve takvim yüküne karışıyor (`src/app/stats.js:20-23,83`; `history.js:22`; `home.js:26`; `streak.js:12`) (teyit et).
5. 7 hareket hiçbir programda yok: Upward Dog, Chaturanga ve 5 esnemenin tamamı.
6. Kuvvet antrenmanıyla bağ yok: ısınma/soğuma yerleşimi, çalışılan kasa göre esneme önerisi yok.
7. Rekor mantığı: "en uzun tutuş" rekor sayılıyor (`src/app/live.js:272`). Esnemede daha uzun tutmanın daha iyi olduğuna dair kanıt zayıf (bkz. 3. bölüm). Yorum.
8. Test yok: tutuş akışı, mod filtreleri, yoga kartı. Hatırlatma da yok.

## 2. Rakipler (kısa)

Neredeyse hepsinde: süre seçimi (5-30 dk), seviye, odak/bölge etiketi, seri ve dakika geçmişi, hatırlatma.
Ayırt ediciler: Down Dog her seferinde yeni akış üretir (süre + seviye + odak seçilir). Bend kısa (5 dk) rutin ve hedefe göre öneri verir. Stretch Timer pozdan poza kendiliğinden ilerler. Apple Fitness+ 2026 başında "4 haftada yoga alışkanlığı" programı çıkardı (haftada 2 x 10 dk). Pliability kamerayla mobilite ölçer (güvenilirliği tartışmalı).
Bize taşınmaz: video, canlı ders, sesli eğitmen, kamera ölçümü, müzik, topluluk.
Bize taşınır: süre + bölge seçip akış üretme, otomatik ilerleyen sayaç, taraf değişimi, nefes halkası, haftalık dakika hedefi, bölge simgeleri.

## 3. Kanıt ne diyor

Kanıt (özetlerden):
- Kuvvetten ÖNCE statik esneme: kas grubu başına 60 sn altı ortalama -%1,1; 60 sn ve üstü -%4,6 performans (Behm 2016). 30 sn altı -%1,1; 30-45 sn -%1,9, anlamlı değil; 60 sn ve üstünde anlamlı düşüş olası (Kay 2012). Tek başına ya da tam ısınma içinde 60 sn ve altı: %1-2, önemsiz (Chaabene 2019).
- Toparlanma: esneme kas ağrısını pratikte azaltmıyor. Ertesi gün fark 100 üzerinden yaklaşık 1 puan (Herbert 2011; tek büyük çalışmada bir haftada -3,8 puan, yazarlar "çok küçük" diyor). Egzersiz sonrası esneme kuvvet ve kas ağrısı toparlanmasında anlamlı fark yaratmadı; yazarlar kanıtı yetersiz buluyor (Afonso 2021a).
- Esneklik dozu: 30 sn tutuş 15 sn'den iyi; 60 sn 30 sn'den iyi değil (Bandy 1994; Bandy 1997). Haftada en az 5 gün ve toplam en az 5 dakika statik esneme (Thomas 2018). Esneme başına toplam 60 sn, haftada en az 2 gün (ACSM, Garber 2011). Ancak en yeni meta-analiz hacim, şiddet ve sıklığı anlamlı belirleyici bulmadı (Konrad 2024). Arntz 2023 ise oturum başına ve toplam esneme süresi arttıkça esneklik kazancının arttığını buldu (meta-regresyon). İki meta-analiz çelişiyor. Yani eşikler yön gösterir, kesin sınır değildir.
- Dış yüklü kuvvet antrenmanı da hareket açıklığını artırır (ES 0,73; yalnız vücut ağırlığıyla anlamlı artış yok); esnemeyle fark yok (Alizadeh 2023; Afonso 2021b).
- Uzun vadeli statik esneme kuvvete zarar vermez; etkisi önemsiz ile küçük arası olumlu (Arntz 2023).
- Bel ağrısı: yoga, egzersiz yapmamaya göre küçük ve klinik olarak önemsiz iyileşme sağlıyor; başka egzersizden farkı yok (Cochrane, Wieland 2022). Aynı derleme yoga grubunda yan etki riskinin (çoğunlukla bel ağrısında artış) yükseldiğini bildiriyor (RR 4,76; düşük kesinlik).
- Boyun ağrısı: büyük etki bildirilmiş (SMD -1,28) ama yalnız 3 çalışma, 188 kişi; özette güven aralığı tutarsız görünüyor. Temkinli okunmalı (Cramer 2017).
- Ruh hali ve uyku: depresif belirtiler SMD -0,69 (Cramer 2013b), kaygı SMD -0,43 (tedavisiz gruba karşı; Cramer 2018a). Uyku sorunu olan kadınlarda uyku kalitesi SMD -0,54, uykusuzluk şiddetinde anlamlı etki yok (Wang 2020). Çalışmalar küçük.
- 60 yaş üstü: denge 0,7; alt beden esnekliği 0,5; bacak kuvveti 0,45 (hareketsiz kontrole karşı; Sivaramakrishnan 2019). Denge g = 0,40 (Youkhana 2016).
- Güvenlik: yoga dersinde herhangi bir istenmeyen olay oranı %22,7 (yaralanma oranı değil; ciddi olay %1,9, çoğu hafif ve geçici; Cramer 2018b). Vaka raporlarında en büyük pay kas-iskelet (%35,5; Cramer 2013c).

Boşluk: sağlıklı genç yetişkinlerde yoganın esnekliğe etkisi için bu taramada sistematik derleme bulunamadı. Yaşlı ve hasta gruplarının sonuçları uygulamanın tipik kullanıcısına doğrudan taşınamaz.

Yorum (kanıt değil, çıkarım):
- Uzun statik tutuşların yeri antrenman sonu ya da ayrı seans. Antrenman öncesi kısa tutulmalı (kas başına 60 sn altı).
- Soğuma esnemesi "toparlanma" diye sunulmamalı; "rahatlama / hareket açıklığı" denmeli.
- Uygulama sağlık vaadi yazmamalı (ağrı, uyku, stres). Az yazı tercihiyle de uyumlu.
- Varsayılan tutuş 30 sn kalabilir; esnemede "en uzun tutuş rekoru" yerine haftalık dakika daha anlamlı olabilir (kanıt çelişkili).

## 4. Önerilen geliştirmeler (öncelik sırasıyla)

Efor: S = birkaç saat, M = 1-2 gün, L = daha uzun.

| # | Ne | Neden | Efor | Az yazı / simge uyumu |
|---|---|---|---|---|
| 1 | Akış modu: yogada dinlenme 0, süre bitince sonraki pozun sayacı kendiliğinden başlasın | Şu an her pozdan sonra 90 sn sayaç. Rakiplerde otomatik ilerleme standart (Stretch Timer, Down Dog) | S-M | Yazı yok; tek "oynat" simgesi |
| 2 | Sağ/sol: tek taraflı pozlarda taraf otomatik değişsin | İpucu metni bunu vaat ediyor, kod yalnız Low Lunge'da yapıyor | S-M | Yarım daire simgesi (sol/sağ) |
| 3 | Mod tutarlılığı: "sadece spor"da yoga programlarını gizle; yoga setlerini spor sayılarından ayır | Hata düzeltme (teyit et) | S | Görünür değişiklik yok |
| 4 | Poz verisi: TR ad, tür, bölge, seviye, önerilen süre, tek taraf bayrağı | 5, 6 ve 7'nin ön koşulu. Rakiplerin hepsinde bölge ve seviye var | M | Bölge ve seviye simge / nokta ile |
| 5 | Hızlı seans: süre (5 / 10 / 15 / 20 dk) ve bölge seç, akış kendiliğinden kurulsun | Down Dog ve Bend'in ana fikri; yogadan anlamayan kullanıcı için en büyük kazanç | M-L | İki sıra düğme, metin yok |
| 6 | Kuvvetle bağ: antrenman sonunda çalışılan bölgeye kısa soğuma önerisi; antrenman öncesi uzun statik tutuşta küçük uyarı (kas başına 60 sn) | Öncesi uyarı: Behm 2016, Kay 2012, Chaabene 2019 (eşik yaklaşık 60 sn, kesin değil). Sonrası soğuma önerisi kanıta dayanmaz, yorumdur; toparlanma vaadi yok (Herbert 2011, Afonso 2021a) | M | Tek simge + tek dokunuş |
| 7 | Haftalık hedef halkası: yoga kartında dakika ve gün hedefi (öneri: 5 gün, haftada toplam en az 5 dk; hedefin kendisi yorum) | Thomas 2018 (esneme çalışmaları, yoga değil); rakiplerde seri ve hedef standart. Eşik kesin değil (Konrad 2024) | S-M | Halka; sayı içinde |
| 8 | Poz çizimi: her poz için sade çizgi figür | Rakiplerin hepsinde görsel var; yazısız anlatımın tek yolu | L | Tasarım dilinin özü. Çizimler MANUEL üretilecek |
| 9 | Nefes halkası: büyüyüp küçülen daire | Rakip esini (Yoga for Beginners). Bu taramada kanıt aranmadı | S | Yazısız |
| 10 | Esnemede rekoru sadeleştir: "en uzun tutuş" yerine toplam dakika | Yorum. Bandy 1994 / 1997 (yalnız hamstring, 21-39 yaş): 60 sn, 30 sn'den iyi değil; rekor kovalamaya karşı doğrudan kanıt değil. Arntz 2023 toplam süreyle kazancın arttığını buluyor | S | Bir satır azalır |
| 11 | Hatırlatma | Rakiplerde standart. PWA'da (özellikle iOS) bildirim desteği ayrıca doğrulanmalı | M | Ayarlar'da tek anahtar |
| 12 | Testler: tutuş akışı, mod filtreleri, yoga kartı | Şu an yok | S | - |

Ek: programda olmayan 5 esneme, 6. maddeyle (soğuma önerisi) kullanıma girer.

## 5. Seçenek paketleri

- A. Hızlı kazanım (S): 1, 2, 3, 10, 12. Yeni ekran yok; mevcut yoga akışı kesintisiz çalışır, tutarsızlıklar kapanır.
- B. Orta (M): A + 4, 5, 7. Uygulama "poz listesi" olmaktan çıkar, "süre ve bölge seç, başla" olur.
- C. Kapsamlı (L): B + 6, 8, 9, 11. Kuvvetle bütünleşir, çizimler gelir. 8 için çizim üretimi kullanıcı tarafında (manuel).

Öneri: A ile başla, sonra B. C'nin 8. maddesi tasarım (Figma) işiyle birlikte ele alınabilir.

Karar bekleyenler:
- Tek taraflı yoga pozları neden listeden çıkarıldı? Geri gelsin mi (madde 2)?
- Yoga günü seriye sayılsın mı (madde 3)?
- Hedef eşiği: 5 gün / 5 dk mı, daha yumuşak mı (madde 7)?

## 6. Kaynaklar

Doğrulama: künye ve DOI Crossref / PubMed / Europe PMC üzerinden; bulgular yalnız özetten. Tam metin okunmadı.

Doğrulandı (künye + DOI + özet uyumlu):
- Wieland LS ve ark. Yoga for chronic non-specific low back pain. Cochrane Database Syst Rev. 2022. DOI 10.1002/14651858.CD010671.pub3. PMID 36398843. (2017 sürümünün güncellemesi.)
- [2013a] Cramer H ve ark. A systematic review and meta-analysis of yoga for low back pain. Clin J Pain. 2013;29(5):450-460. DOI 10.1097/AJP.0b013e31825e1492. PMID 23246998. (Bu raporda kullanılmadı; yerine Cochrane 2022 alındı.)
- Cramer H ve ark. Effects of yoga on chronic neck pain. Clin Rehabil. 2017;31(11):1457-1465. DOI 10.1177/0269215517698735. PMID 29050510.
- [2013b] Cramer H ve ark. Yoga for depression. Depress Anxiety. 2013;30(11):1068-1083. DOI 10.1002/da.22166. PMID 23922209.
- [2018a] Cramer H ve ark. Yoga for anxiety. Depress Anxiety. 2018;35(9):830-843. DOI 10.1002/da.22762. PMID 29697885.
- Wang WL ve ark. The effect of yoga on sleep quality and insomnia in women with sleep problems. BMC Psychiatry. 2020;20(1):195. DOI 10.1186/s12888-020-02566-4. PMID 32357858.
- Sivaramakrishnan D ve ark. The effects of yoga compared to active and inactive controls on physical function and health related quality of life in older adults. Int J Behav Nutr Phys Act. 2019;16(1):33. DOI 10.1186/s12966-019-0789-2. PMID 30953508.
- Herbert RD, de Noronha M, Kamper SJ. Stretching to prevent or reduce muscle soreness after exercise. Cochrane Database Syst Rev. 2011;(7):CD004577. DOI 10.1002/14651858.CD004577.pub3. PMID 21735398.
- [2021a] Afonso J ve ark. The Effectiveness of Post-exercise Stretching in Short-Term and Delayed Recovery of Strength, Range of Motion and Delayed Onset Muscle Soreness. Front Physiol. 2021;12:677581. DOI 10.3389/fphys.2021.677581. PMID 34025459. (Kuvvet ve kas ağrısı sonucu doğrulandı; hareket açıklığı sonucu özette görülemedi.)
- Kay AD, Blazevich AJ. Effect of acute static stretch on maximal muscle performance: a systematic review. Med Sci Sports Exerc. 2012;44(1):154-164. DOI 10.1249/MSS.0b013e318225cb27. PMID 21659901.
- Behm DG, Blazevich AJ, Kay AD, McHugh M. Acute effects of muscle stretching on physical performance, range of motion, and injury incidence in healthy active individuals. Appl Physiol Nutr Metab. 2016;41(1):1-11. DOI 10.1139/apnm-2015-0235. PMID 26642915.
- Chaabene H, Behm DG, Negra Y, Granacher U. Acute Effects of Static Stretching on Muscle Strength and Power: An Attempt to Clarify Previous Caveats. Front Physiol. 2019;10:1468. DOI 10.3389/fphys.2019.01468. PMID 31849713.
- Bandy WD, Irion JM. The effect of time on static stretch on the flexibility of the hamstring muscles. Phys Ther. 1994;74(9):845-850. DOI 10.1093/ptj/74.9.845. PMID 8066111.
- Bandy WD, Irion JM, Briggler M. The effect of time and frequency of static stretching on flexibility of the hamstring muscles. Phys Ther. 1997;77(10):1090-1096. DOI 10.1093/ptj/77.10.1090. PMID 9327823. (30 ve 60 sn karşılaştırması doğrulandı; günlük sıklık bulgusu özette görülemedi, kullanılmadı.)
- [2021b] Afonso J ve ark. Strength Training versus Stretching for Improving Range of Motion. Healthcare (Basel). 2021;9(4):427. DOI 10.3390/healthcare9040427. PMID 33917036.
- Alizadeh S ve ark. Resistance Training Induces Improvements in Range of Motion. Sports Med. 2023;53(3):707-722. DOI 10.1007/s40279-022-01804-x. PMID 36622555.
- Konrad A ve ark. Chronic effects of stretching on range of motion with consideration of potential moderating variables. J Sport Health Sci. 2024;13(2):186-194. DOI 10.1016/j.jshs.2023.06.002. PMID 37301370.

Doğrulandı, taslaktaki künye / DOI yanlıştı (düzeltildi):
- Youkhana S ve ark. Yoga-based exercise improves balance and mobility in people aged 60 and over. Age Ageing. 2016;45(1):21-29. DOI 10.1093/ageing/afv175. PMID 26707903. (Taslakta yıl 2009 ve DOI başka bir yazıya aitti.)
- Thomas E, Bianco A, Paoli A, Palma A. The Relation Between Stretching Typology and Stretching Duration: The Effects on Range of Motion. Int J Sports Med. 2018;39(4):243-254. DOI 10.1055/s-0044-101146. PMID 29506306. (Özette "5 gün" ve "haftada 5 dk" var; "kas grubu başına" ifadesi yok.)
- Arntz F ve ark. Chronic Effects of Static Stretching Exercises on Muscle Strength and Power in Healthy Individuals Across the Lifespan. Sports Med. 2023;53(3):723-745. DOI 10.1007/s40279-022-01806-9. PMID 36719536.
- [2018b] Cramer H, Ostermann T, Dobos G. Injuries and other adverse events associated with yoga practice: A systematic review of epidemiological studies. J Sci Med Sport. 2018;21(2):147-154. DOI 10.1016/j.jsams.2017.08.026. PMID 28958637. (Taslaktaki DOI başka bir makaleye gidiyordu.)

Kısmen doğrulandı (makale gerçek, taslaktaki iddia özette yok):
- Garber CE ve ark. ACSM position stand: Quantity and quality of exercise... Med Sci Sports Exerc. 2011;43(7):1334-1359. DOI 10.1249/MSS.0b013e318213fefb. PMID 21694556. Özette yalnız "esneme başına toplam 60 sn, haftada en az 2 gün" var. Taslaktaki "10-30 sn tutuş, 2-4 tekrar" özette yok; tam metin kontrol edilmedi, bu raporda kullanılmadı.
- [2013c] Cramer H, Krucoff C, Dobos G. Adverse events associated with yoga: a systematic review of published case reports and case series. PLoS One. 2013;8(10):e75515. DOI 10.1371/journal.pone.0075515. PMID 24146758. Taslak "çoğunlukla kas-iskelet" diyordu; özette %35,5 (en büyük pay). Ters duruşlarla ilgili iddia özette yok, kullanılmadı.
- Behm DG, Chaouachi A. A review of the acute effects of static and dynamic stretching on performance. Eur J Appl Physiol. 2011;111(11):2633-2651. DOI 10.1007/s00421-011-1879-2. PMID 21373870. Makale gerçek; saniye eşiği ham özetten teyit edilemedi, bu raporda sayı için kullanılmadı.

Doğrulanamadı / kullanılmadı:
- Taslaktaki "yoga çalışmalarında tipik doz: 60-90 dk, haftada 1-2, 6-12 hafta" ifadesi: kaynakta teyit edilmedi, rapora alınmadı.
- Cramer 2018a'da "yüksek heterojenlik" ifadesi: özette yok, rapora alınmadı.
- Uzun süreli esneme ve kas büyümesi (Panidi 2023; Warneke 2024, Sports Med Open): makalelerin varlığı arama sonuçlarında görüldü, DOI ve sayılar doğrulanamadı; rapora alınmadı.
- Shin S. Meta-Analysis of the Effect of Yoga Practice on Physical Fitness in the Elderly. Int J Environ Res Public Health. 2021;18(21):11663. DOI 10.3390/ijerph182111663. PMID 34770176. Künye doğrulandı; rapora sayı alınmadı.

Rakip kaynakları (çoğu ikincil; fiyat ve özellikler değişebilir):
- https://www.downdogapp.com/ (doğrudan okundu)
- https://www.garagegymreviews.com/equipment/down-dog
- https://www.bustle.com/wellness/bend-stretching-app-review-price-features-subscriptions
- https://apps.apple.com/ch/app/stretch-timer-flexibility/id6760383817
- https://www.techradar.com/health-fitness/apple-fitness-is-kicking-off-2026-with-new-workout-programs-and-theres-a-lot-to-like
- https://mwm.ai/apps/yoga-for-beginners-pilates/1575206600
- https://unstar.app/vi/blog/bend-stretchit-pliability-gowod-stretching-apps-ranked-2026
- https://wellfitinsider.com/peloton/peloton-yoga-classes-review-and-best-yoga-classes/
