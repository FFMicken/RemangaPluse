$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$dest = Join-Path $root "dist/firefox"

if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
New-Item -ItemType Directory -Path $dest | Out-Null
New-Item -ItemType Directory -Path (Join-Path $dest "scripts") | Out-Null

Copy-Item (Join-Path $root "src/background.js") (Join-Path $dest "background.js") -Force
Copy-Item (Join-Path $root "src/scripts/*") (Join-Path $dest "scripts") -Force
Copy-Item (Join-Path $root "assets/icon48.png") (Join-Path $dest "icon48.png") -Force
Copy-Item (Join-Path $root "manifests/firefox/manifest.json") (Join-Path $dest "manifest.json") -Force

Write-Host "Firefox build created in dist/firefox"
