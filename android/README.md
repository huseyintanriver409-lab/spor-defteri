# Android uygulaması (TWA)

Spor Defteri'nin Android paketi, canlı siteyi Chrome'un motoruyla tam ekran açan bir
Trusted Web Activity'dir (Google'ın Bubblewrap aracıyla üretilir). Uygulamanın kodu sitedir:
siteye gönderilen her güncelleme APK'yı yeniden kurmadan telefona gelir. Google girişi
(Drive, Takvim) Chrome'da çalıştığı için engellenmez.

- Paket: `io.github.huseyintanriver409lab.spordefteri`
- Yapılandırma: `twa-manifest.json` (bu klasör; Bubblewrap'ın girdisi)
- Tam ekran için doğrulama: https://huseyintanriver409-lab.github.io/.well-known/assetlinks.json
  (ayrı depo `huseyintanriver409-lab.github.io`; parmak izi imza anahtarınınki olmalı)

## İmza anahtarı

`C:\Android\anahtar\spor-defteri.keystore` ve şifresi `C:\Android\anahtar\anahtar-sifresi.txt`.
**Depoya girmez, yedeklenmelidir** (ör. parola yöneticisi). Anahtar kaybolursa aynı uygulamaya
güncelleme imzalanamaz; telefondaki uygulama silinip yenisi kurulmak zorunda kalır.

## Yeniden derleme (yalnız APK'nın kendisi değişecekse: simge, ad, renk, sürüm)

Bu bilgisayarda kullanıcı klasörünün adında "ü" olduğu için Android araçları `C:\Android` altında:
JDK bağlantısı `C:\Android\jdk`, SDK `C:\Android\sdk`, proje `C:\Android\spor-defteri-twa`.

1. `twa-manifest.json`'u `C:\Android\spor-defteri-twa`'ya kopyala, `appVersionCode`'u bir artır.
2. PowerShell'de:

```powershell
$env:Path="C:\Android\spor-defteri-twa;C:\Android\jdk\bin;C:\Program Files\nodejs;$env:APPDATA\npm;$env:Path"
$env:TEMP="C:\Android\tmp"; $env:TMP="C:\Android\tmp"; $env:GRADLE_USER_HOME="C:\Android\gradle"; $env:ANDROID_USER_HOME="C:\Android\user"
$env:JAVA_TOOL_OPTIONS="-Djava.io.tmpdir=C:\Android\tmp -Djdk.net.unixdomain.tmpdir=C:\Android\tmp"
$pw = Get-Content C:\Android\anahtar\anahtar-sifresi.txt -Raw; $env:BUBBLEWRAP_KEYSTORE_PASSWORD=$pw; $env:BUBBLEWRAP_KEY_PASSWORD=$pw
cmd /c "cd /d C:\Android\spor-defteri-twa && bubblewrap update --skipVersionUpgrade && bubblewrap build --skipPwaValidation"
```

Bilinen tuzaklar: geçici klasör ASCII olmalı (Java'nın yerel soketi aksi halde açılmaz);
proje klasörü PATH'te olmalı (bu ortamda `NoDefaultCurrentDirectoryInExePath` açık);
JDK yolu boşluksuz olmalı (Bubblewrap imzalarken yolu tırnaklamıyor); `minSdkVersion` en az 24.
