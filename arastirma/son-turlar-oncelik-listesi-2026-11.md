# Son turlar: öncelik listesi (2026-11-10)

Yalnız denetim; kod değişmedi. Testler: 24 dosya, 297 test geçti. Cihazda çalıştırılmadı; "tahmin" yazanlar cihazda doğrulanmalı.
Efor: S (saatler), M (1 gün), L (birkaç gün). Kanıt: D = doğrulanmış (kod okuma/iki ayrı denetçi), Ş = şüphe.

## 1) Kullanışlılık (A)

| # | Madde | Neden / kanıt | Öneri | Efor | Risk |
|---|---|---|---|---|---|
| U1 | Dokunma hedefleri 44 px altında | stepper genişliği 40, yüksekliği 44 (styles.css:450), .btn.sm 36 (:151; dinlenme -15/+15/Atla, Bitir html:493,501), RIR/tür çipleri 36 (:460), .fchip 36 (:173), .seg 38 (:169), önceki/sonraki 40 (:474), .infobtn/.i-help 30 (:112,:78), .reel-sets 32 (:379), program ikonları 40 (:341-342), düzenleme sil 32 (:332), takvim hücresi ~39 (tahmin, :299-301) | Tek CSS turu: min 44 px veya görünmez ::after alanı | S | Düşük (yerleşim kayması, ekran görüntüsüyle bak) |
| U2 | "Bitir" sağ üstte | Başparmak erişimi zor; diğer kritik düğmeler altta (html:493, live.js:402) | Alt bara taşı | M | Düşük |
| U3 | Set silme 2 adım + küçük çip | "Sil?" onayı + 5 sn geri al; çipte min-height yok (live.js:150,317,324; styles.css:218) | Onayı kaldır, yalnız geri al; çip 44 px | M | Orta (yanlış silme, geri al var) |
| U4 | Geri al çubuğu "Seti tamamla"ya binebilir | snack bottom:160px (styles.css:564) dinlenme açıkken (html:498-503) (tahmin) | Konumu alt alan yüksekliğine göre ayarla | M | Düşük |
| U5 | İlk program seçiminde "Başla" en altta | 5-6 soru, yarım ekran sheet, kaydırma gerekir (presets.js:118-136) | Başla üstte/sabit, sorular varsayılan dolu | M | Düşük |
| U6 | Takvimde gün seçince liste ekran dışında | history.js:39, html:167-172 (tahmin) | Seçimde listeye kaydır | S | Düşük |
| U7 | Etiket tutarsızlığı | "Seti tamamla" (html:503) / "Tamamla" (live.js:171); "RIR" çevrilmemiş (live.js:123) | Tek etiket, i18n | S | Düşük |
| U8 | Vücut modeli tercihi 3 yerde | profil, Genel, harita düğmesi (html:342,363; bodymap.js:67; settings.js:110-117) | Harita düğmesi + tek ayar | S | Düşük |
| U9 | Boş durumlarda eylem yok | kas analizi/ilerleme boş metinleri (stats.js:42,64,149); geçmişte var (history.js:49-50) | Tek "+" eylem düğmesi | S | Düşük |
| U10 | Profil kaydetme tutarsız | boy/yaş/kilo otomatik, ölçüde ayrı "Kaydet" (html:316,338-340; settings.js:96-103) | Tek davranış (otomatik) | S | Düşük |
| U11 | Az yazı ihlalleri | plan yardım metni, 4 adımlı Takvim açıklaması, AI paragrafı + 4 açılır kutu (programs.js:215; html:105,118-125,381,385-398) | Tek satır + "?" açılır | M | Düşük |
| U12 | İlerleme 6 sekme yatay kayıyor | ipucu yok; EN "Strength score" uzun (html:179; styles.css:166-169; i18n/en/html.ts:76) | Simge + kısa etiket, 2 satır | M | Düşük |
| U13 | Erişilebilirlik | çiplerde aria-pressed yok (live.js:123-124), dinlenme düğmelerinde aria-label yok (html:501), kas haritası svg klavye/role yok (bodymap.js:61,175) | aria ekle; harita altına kas çipleri | M | Düşük |
| U14 | Takvim eylemleri sağ üstte yalnız ikon | html:169-170 | Listenin altına | S | Düşük |
| U15 | Kas etiketi taşma riski | f-setlabel (live.js:116; styles.css:445) (tahmin) | nowrap + ellipsis | S | Düşük |

## 2) Bug (B)

| # | Bug | Kanıt / yeniden üretme | Olasılık/etki | Efor | Durum |
|---|---|---|---|---|---|
| B1 | Antrenman bitince yoga poz sayacı (hold.iv) durmuyor | finishWorkout state.live=null yapar, hold temizlenmez (live.js:370; hold tanımı live.js:187-200; stopTimer tools.js:69 hold'a dokunmaz). Poz sayacı açıkken Bitir; süre dolunca completeSet null idx okur (live.js:251) → hata; arada yeni antrenman başladıysa ona set yazar | O / Y | S | D |
| B2 | Poz sayacı açıkken hareket eklenince süre başka harekete yazılır | addFocusExercise idx'i değiştirir, hold koruması yok (live.js:247); gotoItem korumalı (:237); silme splice ile kaydırır (:359) | O / O | S | D |
| B3 | Service worker yenilemesi aktif antrenmanı/poz sayacını bozar | busy() yalnız input odağına bakar (settings.js:144-145); hold ve fDraft yalnız bellekte (live.js:187). Antrenman sırasında yeni sürüm gelince sayfa yenilenir | O / O | S | D |
| B4 | Ad göçünde setler çoğalabilir (çok cihaz) | migrateExNames eski kaydın setlerini yeni kayda ekler (renames.ts:105-112); eski cihaz daha yeni u ile gönderirse mergeStates canlı sayar (schema.ts:119), göç tekrar ekler. Codex örneği: 3 yerine 4 set | D-O / Y (hacim, istatistik, PR şişer) | M | D (koşullu) |
| B5 | Takvim silme hatası tüm eşitlemeyi düşürür | :206 yakalar ama :218 deleteEvent try/catch'siz; imza değişince aynı tarih yeniden silinir, :218 yeni plan yazımından önce çalıştığı için yeni plan yazılmaz (core/calendar.ts) | O / O | S | D |
| B6 | Kullanıcının kendi görevi silinebilir | isWorkoutTask yalnız başlık önekine bakar ("Antrenman: "/"Workout: ") (core/calendar.ts:242), :280 tamamlanmamış geçmiş görevi siler; :280 hatası işlemi durdurur | D / Y (kullanıcı verisi) | S-M | D |
| B7 | Gizli yoga programları takvime yine yazılır | runCalendar tüm state.programs ile (core/calendar.ts:211,255; cloud.js:197); visiblePrograms (exercises.js:9) uygulanmıyor | O / O | S | D |
| B8 | Bip titreşimi titreşim tercihine bakmaz | beep koşulsuz titreşir (tools.js:88), buzz prefs.haptics'e bakar (ui.js:20) | Y / D | S | D |
| B9 | Sayaç ön ayarı genel dinlenmeyi sessizce değiştirir | tools.js:58 state.rest'i yazar | O / D | S | D |
| B10 | Plan imzası saat dilimini içermez | planSignature (core/calendar.ts:80); saat dilimi değişince Google saatleri ayrışır | D / O | S | D |
| B11 | Her eşitlemede tüm takvim ve 1970'ten beri görevler çekilir | listDayEvents timeMin yok (src/sync/calendar.ts); listTasks(…,"1970-01-01") (core/calendar.ts:252); hata sessiz yutulur (:199-200) | O / D (kota, yavaşlık) | S | D |
| B12 | İki cihazda tamamlanmış etkinlik silinebilir | tamamlanma okuma anında, silme koşulsuz (core/calendar.ts:200-209; sync/calendar.ts:66) | D / O | M | Ş |
| B13 | Normal harekette rest:0 genele düşer | `pref \|\| general` (yoga.ts:4); hareket grubu Yoga↔diğer değişirse tercih farklı yorumlanır | D / D | S | Ş |
| B14 | Poz elle bitirilince sonraki poz başlamaz | finishHold(secs, full) yalnız tam sürede zincirler (live.js:228,254-260) | - / D | S | Ş (tasarım olabilir, karar gerekli) |
| B15 | "Kaldırma" odağında yalnız yoga yapılan gün ana sayfada "yapılmadı" | goalDates/dayLoad ayrımı (home.js, history.js; satırlar tahmin) | D / D | S | Ş |

Temiz çıkanlar: spor-defteri.html'de çift id yok; yoga.ts/live.js'de CRLF yok; sw.js önbellek v71 uyumlu; Takvim/Görevler sayfalaması (nextPageToken) doğru.

## 3) Yoga ek önerileri (Paket B'nin üstüne)

Paket B (poz bilgisi, hızlı seans, haftalık hedef halkası) aynen geçerli. Ekler:

| # | Öneri | Neden / kanıt | Efor | Risk |
|---|---|---|---|---|
| Y1 | Poz ve taraf değişiminde ayrı titreşim deseni | Matta ekrana bakmadan akış (Down Dog, Apple Fitness+'ta var; doğrulanmadı). B8 ile birlikte yapılmalı (haptics tercihi) | S | Düşük |
| Y2 | Akışta ekran açık kalsın (Wake Lock) | Poz sayacında ekran kararması akışı keser; kodda var mı kontrol edilmeli | S | Düşük |
| Y3 | Önce/sonra simge filtresi (dinamik: antrenman öncesi, statik: sonrası) | Uzun statik esneme güç öncesi performansı düşürebilir (kaynak bu turda doğrulanmadı; uygulamadan önce doğrula) | S | Düşük |
| Y4 | Pozda tek dokunuş kolaylaştır/zorlaştır | Down Dog/Daily Yoga'da var (doğrulanmadı); Paket B seviye verisine bağlı | M | Orta (varyant verisi) |

Elenenler: nefes halkası (Paket C'de zaten var), "bel/uyku" kısayolu (sağlık vaadi; rapor bel ağrısı etkisini küçük buluyor), ortam sesi (paket boyutu, düşük değer).

## 4) Deneyime göre toparlanma (ciddiyet: YÜKSEK, sağlık/güvenlik)

Olay: hiç spor yapmamış kişi 5x5'e başladı, 2 gün sonra uygulama "kaslar dinlendi" dedi, kişi yürüyemiyordu (DOMS).

**Mevcut model.** recovery.ts:26-28: alt vücut 48 sa, üst 24 sa; 8+ etkili set (:11) ve tükeniş ayrı ayrı +24 sa; seans bitişi yoksa 18:00 varsayılır (:49-50). "Hazır" kararı musclemap.ts:41-46 (pct ≥ 1). Deneyime HİÇ bakmıyor. Testler: tests/recovery.test.ts.
Deneyim çıkarmaya elverişli veri: entries tarihleri (ilk, son, aralar, toplam gün; assistant.ts:199-200 totalWorkouts/firstWorkout), sessions. Profil (boy/yaş/cinsiyet/kilo) ve baseline elverişsiz; program seviyesi (programs.ts:14,26) profilde saklanmıyor.

**Literatür (kaynaklar ayrı doğrulayıcıyla kontrol edildi).**
- Damas ve ark. 2016, J Physiol 594(18):5209-22: antrenmansızda kas hasarı ilk seanslarda en yüksek, 3. haftada düşük, 10. haftada minimal. (Tek çalışma, uyumlu.)
- Nosaka ve ark. 2001, MSSE 33(9):1490-5: tekrarlı idman koruması en az 6 ay sürer, 9 ayda kısmi, 12 ayda kaybolur. (Tek çalışma, uyumlu.)
- Proske & Morgan 2001, J Physiol 537(2):333-45: DOMS ~48 sa zirve; tekrar eden eksantrik idmanda hasar azalır. (Derleme, uyumlu.)
- Nosaka ve ark. 2002, Scand J Med Sci Sports 12(6):337-46: DOMS hasarın büyüklüğünü yansıtmaz; ağrı geçmesi hazır olmak demek değil. (Tek çalışma, kısmen.)
- Morán-Navarro ve ark. 2017, Eur J Appl Physiol 117(12):2387-99: tükenişe giden setlerde toparlanma daha yavaş (mevcut +24 sa'nın dayanağı).
- ACSM 2009 (MSSE 41(3):687-708): yeni başlayan 2-3 gün/hafta, 8-12 RM (kısmen doğrulandı; "1-3 set" ve "%2-10 artış" doğrulanamadı). ACSM 2026 derlemeler derlemesi (MSSE, Mart 2026) var; ayrıntısı doğrulanmadı.
- Doğrulanamayan: Cheung 2003'ün "5-7 gün" süresi, Seaborne 2018'in "hızlı geri kazanım" iddiası.

**Tasarım önerisi (YORUM, eşikler kaynaktan türetildi).**
1. Kas bazında "yenilik": koruma kasa/harekete özgü olduğu için, kullanıcı düzeyi yerine her kas için son çalışmadan beri geçen süreye bak. Kas hiç çalışılmamış veya ilk 3 haftası (Damas 2016) → toparlanma x2 (alt 96 sa, üst 48 sa). Ara ≥ 6 ay (Nosaka 2001) → yeniden "yeni". Ara 1-6 ay → x1.5 (yorum, kanıtı zayıf). Aktif → mevcut model. Efor M.
2. Profil'de tek seçici: Oto / Yeni / Döndüm / Aktif (varsayılan Oto). Efor S.
3. Yeni/dönen kasta ilk 2-3 seans sonrası haritada tek simge (ağrı olabilir), metin yok. "Hazır" yerine "toparlanıyor" gösterilir. Efor S.
4. Yüksek hacimli ilk programda (5x5 gibi) ilk 2 hafta set sayısını azaltma önerisi (ör. 3x5), tek dokunuşla kabul/ret. Efor M. (Yorum; ACSM yeni başlayana düşük hacim önerir.)
5. Saf fonksiyon core/recovery.ts içinde, testlerle; eski veri göçü gerekmez (geçmişten hesaplanır).

## 5) Akıllı dinlenme süresi

**Mevcut durum.** Varsayılan 90 sn (schema.ts:34; app.js:32; tools.js:54). Genel ayar "Varsayılan dinlenme" (html:372; settings.js:30,89), "Otomatik dinlenme" anahtarı (settings.js:92). Hareket başına elle seçim exPrefs[ad].rest (live.js:332-354; seçenekler 30-300 sn; yogada 0 da var), eşitlenir (schema.ts:47). Çözüm: restFor (programs.js:140) → restSeconds (yoga.ts:4): yoga ? (pref ?? 0) : (pref || genel). Yani deadlift de curl de 90 sn. Bileşik/izolasyon alanı yok; kullanılabilir veri: equipOf (exercises.js:87-101), kas payları WEIGHTS (muscledata.ts:7; ana kas eşiği .75, musclemap.ts:84), repRange (training.ts:39), e1RM Epley (training.ts:11). Süperset var (item.ss, live.js:301-305). Bitişte bip + titreşim (tools.js:76-92).

**Literatür (ayrı doğrulayıcıyla kontrol edildi).**
- Schoenfeld ve ark. 2016, JSCR 30(7):1805-12 (RCT, antrenmanlı erkek): 3 dk, 1 dk'ya göre kuvvet ve hipertrofide üstün.
- Singer ve ark. 2024, Front Sports Act Living (Bayesci meta-analiz, 9 çalışma): >60 sn küçük avantaj; 90 sn üstünde anlamlı ek fark yok.
- Grgic ve ark. 2018, Sports Med 48(1):137-51: kuvvette antrenmanlılarda >2 dk üstün. Grgic 2017 (EJSS): hipertrofide kanıt karışık.
- Henselmans & Schoenfeld 2014, Sports Med 44(12):1635-43: hipertrofi için kısa dinlenme gerekmez.
- ACSM 2009 özeti: ağır (1-6 RM) çok setli çalışmada 3-5 dk. "Bileşik 2-3 dk, izolasyon 1-2 dk" yalnız ikincil kaynaklarda (yorum sayılmalı).
- De Salles 2016 (EJSS): kendi seçilen dinlenme toplam süreyi kısaltıyor; bulgu tam doğrulanmadı.

**Tasarım (YORUM).**
| Sınıf | Nasıl tanınır | Varsayılan |
|---|---|---|
| Ağır | hedef/son tekrar ≤ 5 veya yük ≥ %85 e1RM (ör. 130 kg deadlift) | 180 sn (ACSM 3-5 dk alt sınırı) |
| Bileşik | WEIGHTS'te pay ≥ .5 olan ≥ 2 kas | 120 sn (Grgic 2018 >2 dk) |
| İzolasyon | tek ana kas | 75 sn (Singer 2024 >60 sn) |
| Yoga | mevcut | 0 |
Kurallar: elle seçim (exPrefs) her zaman önce gelir, kayıtlara dokunulmaz. Genel ayara "Oto" seçeneği eklenir, yeni ekran yok. Süpersette grup içi 0, grup sonunda grubun en uzun süresi. Bitişte mevcut bip/titreşim (B8 düzeltmesiyle). Saf fonksiyon + test. Efor M.

## Önerilen sıra

**1. dalga (ciddi bug + yüksek etki, düşük efor):** B1, B2, B3, B5, B6, B7, B8, B9; U1 (44 px), U6, U7, U8, U9; Bölüm 4 madde 1-3 (yeni kasta x2 toparlanma + simge + Profil seçici; sağlık etkisi).
**2. dalga:** B4 (göçte set çoğalması), B10, B11; Bölüm 5 (akıllı dinlenme); U2, U3, U5, U10; Yoga Paket B + Y1, Y2.
**3. dalga:** B12 (cihazlar arası yarış), B13-B15 kararlara göre; U4, U11-U15; Y3, Y4; Bölüm 4 madde 4 (5x5 yumuşatma).

## arch'tan beklenen kararlar

1. Toparlanma: kas bazlı yenilik (önerilen) mi, kullanıcı düzeyi mi? x2 / x1.5 çarpanları ve "6 ay ara = yeni" eşiği uygun mu?
2. Akıllı dinlenme: genel ayarı 90 sn olan mevcut kullanıcılar otomatik "Oto"ya geçsin mi?
3. "Bitir" alta taşınsın mı? Set silmede onay kalksın, yalnız geri al mı kalsın?
4. Vücut modeli tercihi tek yerde: harita düğmesi + Profil mi?
5. Görev tanıma: başlık öneki yerine gizli işaret (görev notunda kimlik) kullanılsın mı? Eski görevler önekle tanınmaya devam eder.
6. Yoga: poz elle bitirilince sonraki poz yine kendiliğinden başlasın mı (B14)?
7. "Kaldırma" odağında yalnız yoga yapılan gün ana sayfada sayılsın mı (B15)?
