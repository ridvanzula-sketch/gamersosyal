# GamerHub 2.0 — gerçek çalışan yerel MVP

Bu sürüm önceki demodan farklıdır: kayıt/giriş, cookie session, oyuncu arama, arkadaş ekleme, mesajlaşma API'si, oyun daveti API'si, profil düzenleme ve fotoğraf yükleme vardır.

## Kurulum

PowerShell'de proje kökünde:

```powershell
npm install
npm run dev
```

Tarayıcı:
http://localhost:3000

## Önemli
Veriler `data/db.json` dosyasına kaydedilir. Bu, yerel geliştirme/MVP içindir. İnternete gerçek ürün olarak açmadan önce PostgreSQL gibi gerçek bir veritabanına, güvenli session/JWT altyapısına, rate limit, CSRF/XSS korumalarına, moderasyon ve gerçek zamanlı WebSocket katmanına geçilmelidir.

## Dosya yapısı

- `app/api/auth/*` kayıt/giriş/çıkış
- `app/api/players` oyuncu arama
- `app/api/profile` profil güncelleme
- `app/api/friends` arkadaş ekleme
- `app/api/messages` mesajlar
- `app/api/invites` oyun davetleri
- `app/api/upload` profil fotoğrafı
- `lib/db.ts` yerel JSON veri deposu
- `lib/auth.ts` şifre hash + cookie session
- `components/GamerHub.tsx` arayüz

Demo kullanıcılar listelenir ama demo hesapların şifresi yoktur; gerçek test için kayıt ekranından yeni hesap aç.
