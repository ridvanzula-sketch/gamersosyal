# GamerHub 2.3 - Android + Windows

Bu sürüm mevcut GamerHub arayüzünü koruyarak canlı GamerHub adresini Android ve Windows uygulaması olarak açacak şekilde hazırlanmıştır.

## 1) Önce canlı adresi belirle

Vercel'deki gerçek GamerHub adresini kullan:

```powershell
$env:GAMERHUB_URL="https://gamerhub-xxxx.vercel.app"
```

## 2) Windows uygulaması

PowerShell:

```powershell
npm install
$env:GAMERHUB_URL="https://gamerhub-xxxx.vercel.app"
npm run dist:win
```

Sonuç `dist/` klasöründe `.exe` kurulum dosyasıdır.

## 3) Android APK

Android Studio + Android SDK + JDK kurulmuş olmalı.

PowerShell:

```powershell
npm install
$env:GAMERHUB_URL="https://gamerhub-xxxx.vercel.app"
npm run android:add
npm run android:sync
npx cap open android
```

Android Studio içinde Build > Build Bundle(s) / APK(s) > Build APK(s) ile APK üret.

## Not

Uygulamalar canlı Vercel adresini yükler. Bu nedenle giriş, profil, arkadaşlar, mesajlar ve davetler gibi sunucu özelliklerinin çalışması için Vercel tarafındaki backend/veritabanı da erişilebilir ve kalıcı olmalıdır.
