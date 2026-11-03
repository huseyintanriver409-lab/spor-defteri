# Spor Defteri Claude bağlayıcısı: kurulum

Bu klasör, Claude'un Spor Defteri'ne doğrudan bağlandığı küçük sunucudur (Cloudflare Workers üzerinde, ücretsiz).
Claude'a "pazartesi, çarşamba, cumartesi 18:00, 6 Ocak'a kadar" dediğinde plan bağlantıya gerek kalmadan uygulamana yazılır.
Bu bağlayıcı claude.ai'da, bilgisayardaki Claude uygulamasında ve telefondaki Claude uygulamasında çalışır.

**Nasıl çalışır?** Claude araçları çağırır, sunucu da senin Google hesabınla Drive'daki gizli Spor Defteri dosyasını okuyup değiştirir.
Telefondaki uygulama açılınca bu değişiklikleri Drive'dan alır ve Google Takvim'i kendisi günceller.
Uygulamada **Profil → Google Drive ile eşitle** açık olmalı.

Claude'un kullanabildiği araçlar:

| Araç | Ne yapar |
| --- | --- |
| `ozet` | Programlar, haftalık plan ve son antrenmanlar |
| `gecmis` | Bir hareketin setleri, en ağır seti ve tahmini 1RM'i |
| `antrenman_kaydet` | Yapılan antrenmanları (başka uygulamadan eski kayıtlar dahil) deftere yazar |
| `kayit_sil` | Yanlış girilen bir günün ya da hareketin kaydını siler |
| `program_ekle` | Program ekler |
| `program_guncelle` | Programın adını ya da hareketlerini değiştirir |
| `program_sil` | Program siler |
| `plan_kur` | Gün, saat ve bitiş tarihiyle haftalık plan kurar |

Kurulum bir kez yapılır, yaklaşık 15 dakika sürer. Gizli anahtarları ve girişleri sen yaparsın. Komutları `mcp` klasöründe bir terminalde çalıştır.

## 1. Cloudflare hesabı ve sunucuyu yükleme

1. https://dash.cloudflare.com/sign-up adresinden ücretsiz bir hesap aç.
2. Cloudflare'e giriş yap. Tarayıcı açılır, orada izin ver:

   ```bash
   npx wrangler login
   ```

3. Sunucuyu yükle. İlk seferde senden bir `workers.dev` alt alan adı seçmen istenebilir; istediğin bir adı yaz.

   ```bash
   npx wrangler deploy
   ```

   Komut bittiğinde bir adres yazar, örneğin `https://spor-defteri-mcp.ADIN.workers.dev`. Bu adresi not et; aşağıda **SUNUCU** diye geçiyor.

## 2. Google Cloud ayarları

Uygulamanın kullandığı Google projesindeyiz: **spor-defteri-513413**.

1. https://console.cloud.google.com/auth/clients?project=spor-defteri-513413 adresini aç ve **Spor Defteri web** istemcisine gir.
2. **Yetkili yönlendirme URI'leri** bölümüne `SUNUCU/callback` adresini ekle (örneğin `https://spor-defteri-mcp.ADIN.workers.dev/callback`), sonra **Kaydet**'e bas.
3. Aynı sayfada **İstemci gizli anahtarları** bölümünde **Gizli anahtar ekle**'ye bas ve yeni anahtarı kopyala.
4. Gizli anahtarı sunucuya ver. Komut anahtarı sorar; yapıştırıp Enter'a bas. Anahtar ekranda görünmez ve depoya yazılmaz.

   ```bash
   npx wrangler secret put GOOGLE_CLIENT_SECRET
   ```

5. https://console.cloud.google.com/auth/audience?project=spor-defteri-513413 sayfasını aç. Bağlayıcıyı kullanacak herkesin Google hesabı **Test kullanıcıları** listesinde olmalı.

### Haftada bir yeniden bağlanmak istemiyorsan

Google, uygulama **Test** modundayken verdiği izni 7 gün sonra iptal eder. Bu durumda Claude'da bağlayıcının bağlantısını haftada bir yenilemen gerekir.

Bundan kurtulmak için:

1. Aynı sayfada **Uygulamayı yayınla**'ya bas.
2. Google'ın incelemesi gerekmez. Girişte yalnız bir kez "Google bu uygulamayı doğrulamadı" uyarısı çıkar; **Gelişmiş → Spor Defteri'ne git** ile geçersin.
3. Yayınladıktan sonra herkes giriş yapabilir hale gelir. Yalnız sizin 3 kişinin kullanabilmesi için izinli e-postaları sunucuya gizli değer olarak gir. Komut sorunca e-postaları virgülle ayırıp yaz:

   ```bash
   npx wrangler secret put ALLOWED_EMAILS
   ```

## 3. Claude'a ekleme

1. claude.ai'da **Ayarlar → Bağlayıcılar → Özel bağlayıcı ekle**'yi aç.
2. Adı **Spor Defteri**, adresi `SUNUCU/mcp` yap (örneğin `https://spor-defteri-mcp.ADIN.workers.dev/mcp`).
3. **Bağlan**'a bas. Önce Spor Defteri izin sayfası açılır, **İzin ver**'e bas.
4. Ardından Google girişi gelir. Uygulamayı kullandığın Google hesabını seç ve Drive iznini işaretli bırak.
5. Telefondaki Claude uygulaması aynı hesabı kullandığı için bağlayıcı orada da görünür.

Denemek için Claude'a şunu yaz: "Spor Defteri'mdeki programlara bak."

## Diğer kullanıcılar

Her kişi için:

1. Google hesabı test kullanıcısı olarak eklenir; uygulama yayındaysa `ALLOWED_EMAILS` listesine eklenir.
2. Kişi kendi Claude hesabında 3. adımı aynı adresle yapar.
3. Kişi Spor Defteri'nde kendi Google hesabıyla Drive eşitlemesini açar.

Herkes yalnız kendi verisini görür.

## Güncelleme ve sorunlar

- **Kod değişince:** `mcp` klasöründe `npx wrangler deploy` komutunu yeniden çalıştır.
- **Hata kayıtlarına bakmak için:** `npx wrangler tail` komutunu çalıştır ya da Cloudflare panelinde Workers → spor-defteri-mcp → Logs'a bak.
- **"Google izni geçersiz" hatası:** Claude'da bağlayıcının bağlantısını kesip yeniden bağlan.
- **Değişiklik telefonda görünmüyorsa:** Uygulamayı kapatıp aç ya da Profil'de **Şimdi eşitle**'ye dokun.
