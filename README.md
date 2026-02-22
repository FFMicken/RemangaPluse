# remanga-plus

Unofficial extension for remanga.org with two builds: Chromium and Firefox.

## Repository Layout

- src/: shared source files used by all builds
- manifests/chromium/manifest.json: Chromium manifest
- manifests/firefox/manifest.json: Firefox manifest
- assets/icon48.png: shared icon asset
- dist/: generated build outputs (ignored by git)
- scripts/: build and packaging scripts

## Build

Run from repository root in PowerShell:

```powershell
./scripts/build-chromium.ps1
./scripts/build-firefox.ps1
```

Build outputs:

- dist/chromium/
- dist/firefox/

## Auto Build (Watch Mode)

```powershell
./scripts/watch-build.ps1
```

Options:

- `-Target all|chromium|firefox` (default: `all`)
- `-DebounceMs 400` to control rebuild delay

Examples:

```powershell
./scripts/watch-build.ps1 -Target chromium
./scripts/watch-build.ps1 -Target firefox -DebounceMs 700
```
## Package Firefox XPI

```powershell
./scripts/pack-firefox-xpi.ps1
```

Output file:

- dist/remanga-plus-firefox.xpi

## Load Unpacked

Chromium browsers:

- Open chrome://extensions
- Enable Developer mode
- Load unpacked from dist/chromium

Firefox (desktop temporary):

- Open about:debugging#/runtime/this-firefox
- Load Temporary Add-on and choose dist/firefox/manifest.json

