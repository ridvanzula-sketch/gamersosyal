$ErrorActionPreference = 'Stop'

Write-Host 'GamerHub Windows paketleme...' -ForegroundColor Cyan

if (-not $env:GAMERHUB_URL) {
  Write-Host 'UYARI: GAMERHUB_URL tanimli degil. Ornek:' -ForegroundColor Yellow
  Write-Host '$env:GAMERHUB_URL="https://gamerhub-xxxx.vercel.app"' -ForegroundColor Yellow
  exit 1
}

npm run dist:win
