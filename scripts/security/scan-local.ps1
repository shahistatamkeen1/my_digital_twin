# Phase 5C Trivy timeout and scan-scope hotfix
param(
    [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
    [switch]$InstallDependencies,
    [switch]$SkipImageBuild
)

$ErrorActionPreference = "Stop"

function Invoke-Step {
    param(
        [string]$Name,
        [scriptblock]$Action
    )

    Write-Host ""
    Write-Host "== $Name ==" -ForegroundColor Cyan
    & $Action
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE."
    }
}

$ProjectRoot = (Resolve-Path $ProjectRoot).Path
$BackendPython = Join-Path $ProjectRoot "backend\venv\Scripts\python.exe"
$ReportDir = Join-Path $ProjectRoot "build\security"
$PolicyPath = Join-Path $ProjectRoot "security\policy.json"
$Mount = "${ProjectRoot}:/workspace"

if (-not (Test-Path $BackendPython)) {
    throw "Backend virtual environment not found at $BackendPython."
}

if (-not (Test-Path (Join-Path $ProjectRoot ".env.docker"))) {
    throw ".env.docker was not found in the project root. Phase 5B must be configured first."
}

New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null

Invoke-Step "Validate security configuration" {
    & $BackendPython (Join-Path $ProjectRoot "scripts\security\validate_supply_chain.py")
}

if ($InstallDependencies) {
    Invoke-Step "Install backend development and audit dependencies" {
        & $BackendPython -m pip install -r (Join-Path $ProjectRoot "backend\requirements-dev.txt")
    }
}

Invoke-Step "Run Phase 5C static contract test" {
    Push-Location (Join-Path $ProjectRoot "backend")
    try {
        & $BackendPython -m pytest tests\test_phase5c_supply_chain.py -q
    }
    finally {
        Pop-Location
    }
}

Invoke-Step "Check Docker availability" {
    & docker version | Out-Null
}

$GitleaksReport = Join-Path $ReportDir "gitleaks.json"
$GitleaksScanRoot = Join-Path $ReportDir "gitleaks-worktree"
"[]" | Set-Content -Path $GitleaksReport -Encoding UTF8

# Scan only files that Git considers committable: tracked files plus untracked,
# non-ignored files. This keeps local private files such as .env.docker and
# backend/.env out of the scan while still detecting a secret if such a file
# is ever tracked or otherwise becomes eligible for commit.
Invoke-Step "Prepare committable working tree for Gitleaks" {
    Remove-Item $GitleaksScanRoot -Recurse -Force -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Path $GitleaksScanRoot -Force | Out-Null

    Push-Location $ProjectRoot
    try {
        $CandidateFiles = @(& git ls-files --cached --others --exclude-standard)
        if ($LASTEXITCODE -ne 0) {
            throw "git ls-files failed while preparing the Gitleaks scan set."
        }

        $CopiedCount = 0
        foreach ($RelativePath in $CandidateFiles) {
            if ([string]::IsNullOrWhiteSpace($RelativePath)) {
                continue
            }

            $NativeRelativePath = $RelativePath -replace '/', [System.IO.Path]::DirectorySeparatorChar
            $SourcePath = Join-Path $ProjectRoot $NativeRelativePath

            if (-not (Test-Path -LiteralPath $SourcePath -PathType Leaf)) {
                continue
            }

            $DestinationPath = Join-Path $GitleaksScanRoot $NativeRelativePath
            $DestinationParent = Split-Path -Parent $DestinationPath
            New-Item -ItemType Directory -Path $DestinationParent -Force | Out-Null
            Copy-Item -LiteralPath $SourcePath -Destination $DestinationPath -Force
            $CopiedCount += 1
        }

        if ($CopiedCount -eq 0) {
            throw "No committable files were found for the Gitleaks scan."
        }

        Write-Host "Prepared $CopiedCount tracked or non-ignored files for secret scanning."
    }
    finally {
        Pop-Location
    }
}

$GitleaksScanMount = "${GitleaksScanRoot}:/scan:ro"
$GitleaksReportMount = "${ReportDir}:/reports"

try {
    Invoke-Step "Scan committable working tree for secrets with Gitleaks" {
        & docker run --rm `
            -v $GitleaksScanMount `
            -v $GitleaksReportMount `
            ghcr.io/gitleaks/gitleaks:v8.30.1 `
            dir /scan `
            --config /scan/.gitleaks.toml `
            --redact `
            --report-format json `
            --report-path /reports/gitleaks.json `
            --exit-code 1
    }
}
finally {
    Remove-Item $GitleaksScanRoot -Recurse -Force -ErrorAction SilentlyContinue
}

$PipReport = Join-Path $ReportDir "pip-audit.json"
Write-Host ""
Write-Host "== Audit Python dependencies ==" -ForegroundColor Cyan
Push-Location (Join-Path $ProjectRoot "backend")
try {
    & $BackendPython -m pip_audit `
        -r requirements.txt `
        --format json `
        --output $PipReport
    $PipAuditExit = $LASTEXITCODE
}
finally {
    Pop-Location
}

& $BackendPython `
    (Join-Path $ProjectRoot "scripts\security\enforce_pip_audit.py") `
    --report $PipReport `
    --policy $PolicyPath

if ($LASTEXITCODE -ne 0) {
    throw "Python dependency audit violated security policy."
}
if ($PipAuditExit -ne 0) {
    Write-Host "pip-audit found vulnerabilities, but all were explicitly accepted by policy." -ForegroundColor Yellow
}

$NpmReport = Join-Path $ReportDir "npm-audit.json"
$NpmError = Join-Path $ReportDir "npm-audit.stderr.txt"
Write-Host ""
Write-Host "== Audit npm dependencies ==" -ForegroundColor Cyan
Push-Location (Join-Path $ProjectRoot "frontend")
try {
    $Process = Start-Process `
        -FilePath "npm.cmd" `
        -ArgumentList @("audit", "--json") `
        -NoNewWindow `
        -Wait `
        -PassThru `
        -RedirectStandardOutput $NpmReport `
        -RedirectStandardError $NpmError
    $NpmAuditExit = $Process.ExitCode
}
finally {
    Pop-Location
}

& $BackendPython `
    (Join-Path $ProjectRoot "scripts\security\enforce_npm_audit.py") `
    --report $NpmReport `
    --policy $PolicyPath

if ($LASTEXITCODE -ne 0) {
    throw "npm dependency audit violated security policy."
}
if ($NpmAuditExit -ne 0) {
    Write-Host "npm audit reported non-blocking findings. Review $NpmReport." -ForegroundColor Yellow
}

Invoke-Step "Generate repository vulnerability report" {
    & docker run --rm `
        -v $Mount `
        -v my-digital-twin-trivy-cache:/root/.cache/trivy `
        aquasec/trivy:0.70.0 `
        --timeout 20m `
        fs `
        --skip-dirs /workspace/.git `
        --skip-dirs /workspace/backend/venv `
        --skip-dirs /workspace/frontend/node_modules `
        --skip-dirs /workspace/frontend/.next `
        --skip-dirs /workspace/build `
        --skip-dirs /workspace/backend/build `
        --skip-dirs /workspace/backend/.test_artifacts `
        --skip-dirs /workspace/backend/.pytest_cache `
        --skip-dirs /workspace/backend/.ruff_cache `
        --skip-dirs '/workspace/.phase4d-backup-*' `
        --skip-dirs '/workspace/.phase4e-backup-*' `
        --skip-dirs '/workspace/.phase5a-backup-*' `
        --skip-dirs '/workspace/.phase5b-backup-*' `
        --skip-dirs '/workspace/.phase5c-backup-*' `
        --scanners vuln `
        --severity HIGH,CRITICAL `
        --ignore-unfixed `
        --format json `
        --output /workspace/build/security/trivy-filesystem.json `
        /workspace
}

Invoke-Step "Block critical repository vulnerabilities" {
    & docker run --rm `
        -v $Mount `
        -v my-digital-twin-trivy-cache:/root/.cache/trivy `
        aquasec/trivy:0.70.0 `
        --timeout 20m `
        fs `
        --skip-dirs /workspace/.git `
        --skip-dirs /workspace/backend/venv `
        --skip-dirs /workspace/frontend/node_modules `
        --skip-dirs /workspace/frontend/.next `
        --skip-dirs /workspace/build `
        --skip-dirs /workspace/backend/build `
        --skip-dirs /workspace/backend/.test_artifacts `
        --skip-dirs /workspace/backend/.pytest_cache `
        --skip-dirs /workspace/backend/.ruff_cache `
        --skip-dirs '/workspace/.phase4d-backup-*' `
        --skip-dirs '/workspace/.phase4e-backup-*' `
        --skip-dirs '/workspace/.phase5a-backup-*' `
        --skip-dirs '/workspace/.phase5b-backup-*' `
        --skip-dirs '/workspace/.phase5c-backup-*' `
        --scanners vuln `
        --severity CRITICAL `
        --ignore-unfixed `
        --exit-code 1 `
        /workspace
}

Invoke-Step "Generate container-configuration report" {
    & docker run --rm `
        -v $Mount `
        -v my-digital-twin-trivy-cache:/root/.cache/trivy `
        aquasec/trivy:0.70.0 `
        --timeout 20m `
        config `
        --skip-dirs /workspace/.git `
        --skip-dirs /workspace/backend/venv `
        --skip-dirs /workspace/frontend/node_modules `
        --skip-dirs /workspace/frontend/.next `
        --skip-dirs /workspace/build `
        --skip-dirs /workspace/backend/build `
        --skip-dirs /workspace/backend/.test_artifacts `
        --skip-dirs /workspace/backend/.pytest_cache `
        --skip-dirs /workspace/backend/.ruff_cache `
        --skip-dirs '/workspace/.phase4d-backup-*' `
        --skip-dirs '/workspace/.phase4e-backup-*' `
        --skip-dirs '/workspace/.phase5a-backup-*' `
        --skip-dirs '/workspace/.phase5b-backup-*' `
        --skip-dirs '/workspace/.phase5c-backup-*' `
        --severity HIGH,CRITICAL `
        --format json `
        --output /workspace/build/security/trivy-config.json `
        /workspace
}

Invoke-Step "Block critical container misconfigurations" {
    & docker run --rm `
        -v $Mount `
        -v my-digital-twin-trivy-cache:/root/.cache/trivy `
        aquasec/trivy:0.70.0 `
        --timeout 20m `
        config `
        --skip-dirs /workspace/.git `
        --skip-dirs /workspace/backend/venv `
        --skip-dirs /workspace/frontend/node_modules `
        --skip-dirs /workspace/frontend/.next `
        --skip-dirs /workspace/build `
        --skip-dirs /workspace/backend/build `
        --skip-dirs /workspace/backend/.test_artifacts `
        --skip-dirs /workspace/backend/.pytest_cache `
        --skip-dirs /workspace/backend/.ruff_cache `
        --skip-dirs '/workspace/.phase4d-backup-*' `
        --skip-dirs '/workspace/.phase4e-backup-*' `
        --skip-dirs '/workspace/.phase5a-backup-*' `
        --skip-dirs '/workspace/.phase5b-backup-*' `
        --skip-dirs '/workspace/.phase5c-backup-*' `
        --severity CRITICAL `
        --exit-code 1 `
        /workspace
}

if (-not $SkipImageBuild) {
    Invoke-Step "Build current application images" {
        Push-Location $ProjectRoot
        try {
            & docker compose --env-file .env.docker build backend frontend
        }
        finally {
            Pop-Location
        }
    }
}

Invoke-Step "Generate backend image report" {
    & docker run --rm `
        -v /var/run/docker.sock:/var/run/docker.sock `
        -v $Mount `
        -v my-digital-twin-trivy-cache:/root/.cache/trivy `
        aquasec/trivy:0.70.0 `
        --timeout 20m `
        image `
        --scanners vuln `
        --vuln-type os,library `
        --severity HIGH,CRITICAL `
        --ignore-unfixed `
        --format json `
        --output /workspace/build/security/backend-image.json `
        my-digital-twin-backend
}

Invoke-Step "Block critical backend image findings" {
    & docker run --rm `
        -v /var/run/docker.sock:/var/run/docker.sock `
        -v my-digital-twin-trivy-cache:/root/.cache/trivy `
        aquasec/trivy:0.70.0 `
        --timeout 20m `
        image `
        --scanners vuln `
        --vuln-type os,library `
        --severity CRITICAL `
        --ignore-unfixed `
        --exit-code 1 `
        my-digital-twin-backend
}

Invoke-Step "Generate frontend image report" {
    & docker run --rm `
        -v /var/run/docker.sock:/var/run/docker.sock `
        -v $Mount `
        -v my-digital-twin-trivy-cache:/root/.cache/trivy `
        aquasec/trivy:0.70.0 `
        --timeout 20m `
        image `
        --scanners vuln `
        --vuln-type os,library `
        --severity HIGH,CRITICAL `
        --ignore-unfixed `
        --format json `
        --output /workspace/build/security/frontend-image.json `
        my-digital-twin-frontend
}

Invoke-Step "Block critical frontend image findings" {
    & docker run --rm `
        -v /var/run/docker.sock:/var/run/docker.sock `
        -v my-digital-twin-trivy-cache:/root/.cache/trivy `
        aquasec/trivy:0.70.0 `
        --timeout 20m `
        image `
        --scanners vuln `
        --vuln-type os,library `
        --severity CRITICAL `
        --ignore-unfixed `
        --exit-code 1 `
        my-digital-twin-frontend
}

Invoke-Step "Generate repository CycloneDX SBOM" {
    & docker run --rm `
        -v $Mount `
        -v my-digital-twin-trivy-cache:/root/.cache/trivy `
        aquasec/trivy:0.70.0 `
        --timeout 20m `
        fs `
        --skip-dirs /workspace/.git `
        --skip-dirs /workspace/backend/venv `
        --skip-dirs /workspace/frontend/node_modules `
        --skip-dirs /workspace/frontend/.next `
        --skip-dirs /workspace/build `
        --skip-dirs /workspace/backend/build `
        --skip-dirs /workspace/backend/.test_artifacts `
        --skip-dirs /workspace/backend/.pytest_cache `
        --skip-dirs /workspace/backend/.ruff_cache `
        --skip-dirs '/workspace/.phase4d-backup-*' `
        --skip-dirs '/workspace/.phase4e-backup-*' `
        --skip-dirs '/workspace/.phase5a-backup-*' `
        --skip-dirs '/workspace/.phase5b-backup-*' `
        --skip-dirs '/workspace/.phase5c-backup-*' `
        --format cyclonedx `
        --output /workspace/build/security/repository.cdx.json `
        /workspace
}

Invoke-Step "Generate backend image CycloneDX SBOM" {
    & docker run --rm `
        -v /var/run/docker.sock:/var/run/docker.sock `
        -v $Mount `
        -v my-digital-twin-trivy-cache:/root/.cache/trivy `
        aquasec/trivy:0.70.0 `
        --timeout 20m `
        image `
        --format cyclonedx `
        --output /workspace/build/security/backend-image.cdx.json `
        my-digital-twin-backend
}

Invoke-Step "Generate frontend image CycloneDX SBOM" {
    & docker run --rm `
        -v /var/run/docker.sock:/var/run/docker.sock `
        -v $Mount `
        -v my-digital-twin-trivy-cache:/root/.cache/trivy `
        aquasec/trivy:0.70.0 `
        --timeout 20m `
        image `
        --format cyclonedx `
        --output /workspace/build/security/frontend-image.cdx.json `
        my-digital-twin-frontend
}

Write-Host ""
Write-Host "Phase 5C local security verification passed." -ForegroundColor Green
Write-Host "Reports: $ReportDir"
