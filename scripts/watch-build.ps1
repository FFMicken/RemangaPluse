param(
    [ValidateSet("all", "chromium", "firefox")]
    [string]$Target = "all",
    [int]$DebounceMs = 400
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

$buildChromium = Join-Path $PSScriptRoot "build-chromium.ps1"
$buildFirefox = Join-Path $PSScriptRoot "build-firefox.ps1"

$watchPaths = @(
    (Join-Path $root "src"),
    (Join-Path $root "manifests"),
    (Join-Path $root "assets")
)

foreach ($path in $watchPaths) {
    if (-not (Test-Path $path)) {
        throw "Watch path not found: $path"
    }
}

function Invoke-SelectedBuild {
    param([string]$SelectedTarget)

    if ($SelectedTarget -eq "all" -or $SelectedTarget -eq "chromium") {
        & $buildChromium
    }

    if ($SelectedTarget -eq "all" -or $SelectedTarget -eq "firefox") {
        & $buildFirefox
    }
}

$script:pending = $false
$script:lastChange = Get-Date

$watchers = @()
$subscriptions = @()

try {
    foreach ($path in $watchPaths) {
        $watcher = New-Object System.IO.FileSystemWatcher
        $watcher.Path = $path
        $watcher.IncludeSubdirectories = $true
        $watcher.EnableRaisingEvents = $true

        $watchers += $watcher

        $action = {
            $script:pending = $true
            $script:lastChange = Get-Date
            $changed = $Event.SourceEventArgs.FullPath
            Write-Host "Change detected: $changed"
        }

        $subscriptions += Register-ObjectEvent -InputObject $watcher -EventName Changed -Action $action
        $subscriptions += Register-ObjectEvent -InputObject $watcher -EventName Created -Action $action
        $subscriptions += Register-ObjectEvent -InputObject $watcher -EventName Deleted -Action $action
        $subscriptions += Register-ObjectEvent -InputObject $watcher -EventName Renamed -Action $action
    }

    Write-Host "Initial build..."
    Invoke-SelectedBuild -SelectedTarget $Target
    Write-Host "Watching for changes (Target: $Target). Press Ctrl+C to stop."

    while ($true) {
        Start-Sleep -Milliseconds 150

        if ($script:pending) {
            $elapsed = (Get-Date) - $script:lastChange
            if ($elapsed.TotalMilliseconds -ge $DebounceMs) {
                $script:pending = $false
                try {
                    Write-Host "Rebuilding..."
                    Invoke-SelectedBuild -SelectedTarget $Target
                    Write-Host "Build complete."
                }
                catch {
                    Write-Host "Build failed: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
    }
}
finally {
    foreach ($sub in $subscriptions) {
        if ($null -ne $sub) {
            Unregister-Event -SourceIdentifier $sub.Name -ErrorAction SilentlyContinue
        }
    }

    foreach ($watcher in $watchers) {
        if ($null -ne $watcher) {
            $watcher.Dispose()
        }
    }
}
