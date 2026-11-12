# Google doğrulaması

Google girişinde "Bu uygulama doğrulanmadı" uyarısını kaldırmak için yapılacaklar. Google Cloud projesi: `spor-defteri-513413`.

Adresler:
- Tanıtım sayfası: https://huseyintanriver409-lab.github.io/spor-defteri/hakkinda.html
- Gizlilik politikası: https://huseyintanriver409-lab.github.io/spor-defteri/gizlilik.html
- Bağlayıcı dönüş sayfası: https://huseyintanriver409-lab.github.io/spor-defteri/baglayici.html

## 1. Uygulamayı yayınla (hemen, doğrulama beklemeden)

Google Cloud Console → Google Auth Platform → **Audience** (Hedef kitle) → **Publish app** (Uygulamayı yayınla) → onayla.

Bundan sonra herkes giriş yapabilir. Doğrulama bitene kadar ilk girişte "Google bu uygulamayı doğrulamadı" ekranı çıkar: **Gelişmiş** → **Spor Defteri'ne git** ile devam edilir. Test modunun 7 günlük oturum sınırı da kalkar.

## 2. Bağlayıcının dönüş adresi (sırası önemli)

1. Bu sürüm GitHub'a push'lanıp yayına çıksın (`baglayici.html` canlı olmalı).
2. Google Cloud → Google Auth Platform → **Clients** → "Spor Defteri web" → **Yetkili yönlendirme URI'leri**'ne `https://huseyintanriver409-lab.github.io/spor-defteri/baglayici.html` ekle → Kaydet. Eski `…workers.dev/callback` adresini şimdilik silme.
3. Bağlayıcıyı yeniden yükle:
   ```
   cd "C:\Users\Hüseyin\Documents\GitHub\spor-defteri\mcp"
   npx wrangler deploy
   ```
4. Claude'da bağlayıcıyı bir kez yeniden bağlayıp dene. Çalışıyorsa eski `…workers.dev/callback` adresini sil.

## 3. Site sahipliği (Search Console)

1. https://search.google.com/search-console → **Mülk ekle** → **URL ön eki** → `https://huseyintanriver409-lab.github.io/`
2. Yöntem: **HTML dosyası**. Dosyayı indir (adı `google….html` gibi).
3. Dosyayı `Belgeler\GitHub\huseyintanriver409-lab.github.io` klasörüne koy, o depoyu GitHub Desktop'tan push'la (ya da dosyanın adını Claude'a söyle, o oluştursun).
4. 1-2 dakika sonra Search Console'da **Doğrula**'ya bas.

Google Cloud'u ve Search Console'u **aynı Google hesabıyla** kullan.

## 4. Markalama (Branding)

Google Auth Platform → **Branding**:
- Uygulama adı: `Spor Defteri`
- Kullanıcı destek e-postası: kendi Gmail adresin
- Uygulama logosu: boş bırak (logo eklemek ayrı bir marka incelemesi açar, şart değil)
- Uygulama ana sayfası: `https://huseyintanriver409-lab.github.io/spor-defteri/hakkinda.html`
- Gizlilik politikası: `https://huseyintanriver409-lab.github.io/spor-defteri/gizlilik.html`
- Hizmet şartları: boş
- Yetkili alan adları: `huseyintanriver409-lab.github.io` (eskiden `workers.dev` adresi eklendiyse 2. adım bittikten sonra kaldır)
- Geliştirici iletişim e-postası: kendi Gmail adresin

## 5. Veri erişimi (Data access)

Google Auth Platform → **Data access** → **Add or remove scopes**. Şu kapsamlar listede olsun:
- `openid`, `.../auth/userinfo.email` (bağlayıcı için)
- `.../auth/drive.appdata`
- `.../auth/calendar.app.created`
- `.../auth/tasks`

Hassas kapsamlar için Google gerekçe ister. Aşağıdakileri olduğu gibi yapıştır.

**drive.appdata**
> Spor Defteri is a workout log that stores all data locally. When the user turns on sync, the app saves one JSON file with the user's own workout records in the hidden application data folder, so the same records are available on the user's phone and computer. The app never accesses any other Drive file. The optional AI connector uses the same scope to read and update only this file when the user's AI assistant logs a workout for them.

**calendar.app.created**
> When the user turns on the calendar feature, Spor Defteri creates a secondary calendar named "Spor Defteri" and writes the user's weekly training plan and finished workouts as events in that calendar only. This is the narrowest calendar scope that supports the feature; the app cannot see the user's other calendars or events.

**tasks**
> When the user chooses to place their training plan as tasks instead of events, Spor Defteri creates a task list named "Spor Defteri", adds each planned training day as a task with its date, and marks it completed when the workout is finished. The app only creates and edits tasks in the list it created. Google Tasks has no narrower scope that allows creating and completing tasks.

**Uygulamanın Google verisini nasıl kullandığı (genel soru çıkarsa)**
> Google user data is used only to provide the user-facing features above: device sync, calendar events and plan tasks. It is not sold, not used for advertising, not shared with third parties (except the AI assistant the user chooses to connect), and not used to train AI models. Our use complies with the Google API Services User Data Policy, including the Limited Use requirements.

## 6. Tanıtım videosu (YouTube, "Liste dışı")

Google, her kapsamın uygulamada nasıl kullanıldığını gösteren bir ekran kaydı ister. Bilgisayarda Chrome ile, **arayüz ve Google izin ekranı İngilizce** olacak şekilde çek (Google hesabının dili İngilizce olsun ya da adres çubuğundaki Google adresinin sonuna `&hl=en` ekle). 2-4 dakika yeter, ses gerekmez.

1. https://huseyintanriver409-lab.github.io/spor-defteri/hakkinda.html sayfasını göster, aşağı kaydır, Gizlilik Politikası bağlantısına tıkla.
2. Uygulamayı aç → Profil → Yedek → **Google ile bağlan**.
3. Google izin ekranı açılınca **adres çubuğuna tıkla ve URL'yi göster** (içinde `client_id=680474357315-…` görünmeli). Uygulama adı "Spor Defteri" ve istenen izin ekranda görünsün → İzin ver.
4. Drive: bir antrenman kaydet, **Şimdi eşitle**'ye bas. Sonra drive.google.com → Ayarlar (dişli) → Uygulamaları yönet → Spor Defteri'nin "gizli uygulama verileri" olduğunu göster.
5. Takvim: Yedek → Google Takvim → "Haftalık planı takvime koy" → **Bu cihazda izin ver**, izin ekranını göster → calendar.google.com'da "Spor Defteri" takvimini ve plan etkinliklerini göster.
6. Görevler: aynı kartta "Görev (tikli)" seç, izin ekranını göster → Google Takvim'in yan panelinde (Tasks) "Spor Defteri" listesindeki plan görevlerini göster.
7. İzni geri alma: myaccount.google.com/permissions sayfasında Spor Defteri'ni göster.

Videoyu YouTube'a **Liste dışı** yükle, bağlantısını forma yapıştır.

## 7. Başvuru

Google Auth Platform → **Verification Center** → **Prepare for verification** → formu doldur (yukarıdaki metinler, video bağlantısı) → **Submit**.

Google genelde birkaç gün içinde e-postayla döner. Ek bilgi isterse aynı e-postaya yanıt verilir. Onaylanınca uyarı ekranı kalkar.
