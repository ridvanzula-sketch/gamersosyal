$ErrorActionPreference = 'Stop'

Write-Host 'GamerHub Android kurulumu basliyor...' -ForegroundColor Cyan

if (-not $env:GAMERHUB_URL) {
  Write-Host 'UYARI: GAMERHUB_URL tanimli degil. Asagidaki ornek komutla Vercel adresini ayarla:' -ForegroundColor Yellow
  Write-Host '$env:GAMERHUB_URL="https://gamerhub-xxxx.vercel.app"' -ForegroundColor Yellow
  exit 1
}

npx cap add android
npx cap sync android
npx cap open android
