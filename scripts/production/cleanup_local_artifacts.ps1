param(
    [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path $ProjectRoot).Path

$targets = @(
    (Join-Path $root "backend\.pytest_cache"),
    (Join-Path $root "backend\.ruff_cache"),
    (Join-Path $root "backend\.coverage"),
    (Join-Path $root "backend\coverage.xml"),
    (Join-Path $root "frontend\.next"),
    (Join-Path $root "frontend\tsconfig.tsbuildinfo"),
    (Join-Path $root "build\production-readiness")
)

foreach ($target in $targets) {
    if (Test-Path $target) {
        Remove-Item $target -Recurse -Force
        Write-Host "Removed: $target"
    }
}

Get-ChildItem -Path $root -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match "phase\w*.*backup" } |
    ForEach-Object {
        Remove-Item $_.FullName -Force
        Write-Host "Removed stale backup file: $($_.FullName)"
    }

Write-Host "Local generated artifacts cleaned. Private environment files were not touched." -ForegroundColor Green
