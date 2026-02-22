$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$dest = Join-Path $root "dist/chromium"

if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
New-Item -ItemType Directory -Path $dest | Out-Null
New-Item -ItemType Directory -Path (Join-Path $dest "scripts") | Out-Null

Copy-Item (Join-Path $root "src/background.js") (Join-Path $dest "background.js") -Force
Copy-Item (Join-Path $root "src/scripts/*") (Join-Path $dest "scripts") -Force
Copy-Item (Join-Path $root "assets/icon48.png") (Join-Path $dest "icon48.png") -Force
Copy-Item (Join-Path $root "manifests/chromium/manifest.json") (Join-Path $dest "manifest.json") -Force

Write-Host "Chromium build created in dist/chromium"
