param(
    [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
    [switch]$Runtime,
    [switch]$CleanupLocalArtifacts
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path $ProjectRoot).Path
$backend = Join-Path $root "backend"
$python = Join-Path $backend "venv\Scripts\python.exe"
$version = (Get-Content (Join-Path $root "VERSION") -Raw).Trim()
$reportDir = Join-Path $root "build\production-readiness"

function Invoke-Checked {
    param(
        [string]$Name,
        [scriptblock]$Command
    )

    Write-Host "`n== $Name ==" -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE."
    }
}

if (-not (Test-Path $python)) {
    throw "Backend virtual environment Python not found: $python"
}

if ($CleanupLocalArtifacts) {
    & powershell -ExecutionPolicy Bypass `
        -File (Join-Path $root "scripts\production\cleanup_local_artifacts.ps1") `
        -ProjectRoot $root
    if ($LASTEXITCODE -ne 0) {
        throw "Local artifact cleanup failed."
    }
}

New-Item -ItemType Directory -Path $reportDir -Force | Out-Null

Invoke-Checked "Compile production-readiness scripts" {
    & $python -m compileall -q (Join-Path $root "scripts\production")
}

Invoke-Checked "Validate repository and version synchronization" {
    & $python (Join-Path $root "scripts\production\validate_repository.py")
}

Invoke-Checked "Validate generated environment inventory" {
    & $python (Join-Path $root "scripts\production\render_environment_inventory.py") --check
}

Invoke-Checked "Validate local dry-run URL policy" {
    & $python (Join-Path $root "scripts\production\validate_public_url.py") `
        --url "http://localhost:8000"
}

Invoke-Checked "Validate release metadata" {
    & $python (Join-Path $root "scripts\release\validate_release.py") `
        --version $version `
        --tag "v$version"
}

Invoke-Checked "Run Phase 5E contract tests" {
    Push-Location $backend
    try {
        & $python -m pytest tests\test_phase5e_production_readiness.py -q
    }
    finally {
        Pop-Location
    }
}

Invoke-Checked "Validate Linux deployment shell syntax" {
    docker version | Out-Null
    $mount = "type=bind,source=$root,target=/workspace,readonly"
    docker run --rm `
        --mount $mount `
        alpine:3.22 `
        sh -c "sh -n /workspace/scripts/deploy/deploy.sh && sh -n /workspace/scripts/deploy/rollback.sh"
}

if ($Runtime) {
    $dockerEnv = Join-Path $root ".env.docker"
    if (-not (Test-Path $dockerEnv)) {
        throw "Docker environment file not found: $dockerEnv"
    }

    $configuredVersion = Get-Content $dockerEnv |
        Where-Object { $_ -match '^\s*APP_VERSION\s*=' } |
        Select-Object -Last 1
    if ($configuredVersion) {
        $configuredVersion = ($configuredVersion -split '=', 2)[1].Trim()
        if ($configuredVersion -ne $version) {
            throw ".env.docker APP_VERSION is $configuredVersion; expected $version."
        }
    }

    Invoke-Checked "Build and start the production-like Docker stack" {
        docker compose --env-file $dockerEnv -f (Join-Path $root "docker-compose.yml") up --build -d
    }

    Invoke-Checked "Run end-to-end runtime verification" {
        & $python (Join-Path $root "scripts\production\end_to_end_verify.py") `
            --backend-url "http://localhost:8000" `
            --frontend-url "http://localhost:3000" `
            --expected-version $version `
            --timeout-seconds 420
    }

    Invoke-Checked "Run PostgreSQL backup and restore verification" {
        & $python (Join-Path $root "scripts\production\backup_restore_test.py") `
            --env-file $dockerEnv `
            --compose-file (Join-Path $root "docker-compose.yml")
    }

    $rollbackEnv = Join-Path $reportDir ".env.release"
    $rollbackState = Join-Path $reportDir "previous.json"
    $rollbackReport = Join-Path $reportDir "rollback-plan.json"

    $releaseTemplate = Get-Content (Join-Path $root "deploy\.env.release.example") -Raw
    $releaseTemplate = $releaseTemplate.Replace("OWNER/REPOSITORY", "owner/repository")
    $releaseTemplate = $releaseTemplate.Replace(
        "CHANGE_ME_LONG_URL_SAFE_PASSWORD",
        "phase5e_local_url_safe_password"
    )
    $releaseTemplate = $releaseTemplate.Replace(
        "CHANGE_ME_GENERATE_AT_LEAST_32_CHARACTERS",
        "phase5e-local-secret-0123456789abcdef-0123456789abcdef"
    )
    [System.IO.File]::WriteAllText(
        $rollbackEnv,
        $releaseTemplate,
        [System.Text.UTF8Encoding]::new($false)
    )

    $previousVersion = "0.5.3"
    $statePayload = @{
        backend_image = "ghcr.io/owner/repository-backend:$previousVersion"
        frontend_image = "ghcr.io/owner/repository-frontend:$previousVersion"
    } | ConvertTo-Json
    [System.IO.File]::WriteAllText(
        $rollbackState,
        $statePayload + [Environment]::NewLine,
        [System.Text.UTF8Encoding]::new($false)
    )

    Invoke-Checked "Run rollback configuration dry run" {
        & $python (Join-Path $root "scripts\production\rollback_dry_run.py") `
            --env-file $rollbackEnv `
            --state-file $rollbackState `
            --expected-version $previousVersion `
            --output $rollbackReport
    }

    docker compose --env-file $dockerEnv -f (Join-Path $root "docker-compose.yml") ps |
        Out-File (Join-Path $reportDir "compose-ps.txt") -Encoding utf8
}

$summary = @(
    "Phase 5E local production-readiness verification passed.",
    "Version: $version",
    "Runtime checks: $([bool]$Runtime)",
    "Report directory: $reportDir"
) -join [Environment]::NewLine
$summary | Tee-Object -FilePath (Join-Path $reportDir "summary.txt")
