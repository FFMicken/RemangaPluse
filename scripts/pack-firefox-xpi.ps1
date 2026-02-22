$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$buildScript = Join-Path $PSScriptRoot "build-firefox.ps1"

& $buildScript

$dist = Join-Path $root "dist/firefox"
$out = Join-Path $root "dist/remanga-plus-firefox.xpi"
$tmpZip = Join-Path $root "dist/remanga-plus-firefox.zip"

if (Test-Path $tmpZip) { Remove-Item $tmpZip -Force }
if (Test-Path $out) { Remove-Item $out -Force }

Compress-Archive -Path (Join-Path $dist "*") -DestinationPath $tmpZip -CompressionLevel Optimal
Move-Item $tmpZip $out

Write-Host "Packed: dist/remanga-plus-firefox.xpi"
