from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
VERSION_RE = re.compile(r"^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$")

REQUIRED_FILES = (
    "README.md",
    "VERSION",
    "docs/ARCHITECTURE.md",
    "docs/ENVIRONMENT_VARIABLES.md",
    "docs/ONBOARDING.md",
    "docs/OPERATIONS.md",
    "docs/INCIDENT_RESPONSE.md",
    "docs/PRODUCTION_READINESS.md",
    "docs/FINAL_RELEASE_CHECKLIST.md",
    "docs/PORTFOLIO_SUMMARY.md",
    "scripts/production/render_environment_inventory.py",
    "scripts/production/validate_public_url.py",
    "scripts/production/validate_repository.py",
    "scripts/production/end_to_end_verify.py",
    "scripts/production/backup_restore_test.py",
    "scripts/production/rollback_dry_run.py",
    "scripts/production/verify-local.ps1",
    ".github/workflows/final-production-readiness.yml",
)

FORBIDDEN_TRACKED_PATTERNS = (
    re.compile(r"(^|/)\.env$"),
    re.compile(r"(^|/)\.env\.local$"),
    re.compile(r"(^|/)\.env\.docker$"),
    re.compile(r"(^|/)\.env\.release(?:\.runtime)?$"),
    re.compile(r"(^|/)\.pytest_cache/"),
    re.compile(r"(^|/)\.ruff_cache/"),
    re.compile(r"(^|/)node_modules/"),
    re.compile(r"(^|/)\.next/"),
    re.compile(r"(^|/)build/security/"),
    re.compile(r"(^|/)build/production-readiness/"),
    re.compile(r"\.db(?:-wal|-shm)?$"),
    re.compile(r"phase\w*-backup", re.IGNORECASE),
)


def read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8").replace("\r\n", "\n")


def tracked_files() -> list[str]:
    try:
        result = subprocess.run(
            ["git", "ls-files", "-z"],
            cwd=ROOT,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
        )
    except (OSError, subprocess.CalledProcessError):
        return []
    return [item.decode("utf-8") for item in result.stdout.split(b"\0") if item]


def validate() -> list[str]:
    errors: list[str] = []
    version = read("VERSION").strip()
    if not VERSION_RE.fullmatch(version):
        errors.append(f"VERSION is not semantic versioning: {version!r}")

    for rel in REQUIRED_FILES:
        if not (ROOT / rel).is_file():
            errors.append(f"Missing required Phase 5E file: {rel}")

    sync_checks = {
        "backend/app/config.py": f'"{version}"',
        "backend/.env.example": f"APP_VERSION={version}",
        ".env.docker.example": f"APP_VERSION={version}",
        "deploy/.env.release.example": f"APP_VERSION={version}",
        "docker-compose.yml": f"APP_VERSION: ${{APP_VERSION:-{version}}}",
    }
    for rel, token in sync_checks.items():
        if token not in read(rel):
            errors.append(f"Version {version} is not synchronized in {rel}")

    release_example = read("deploy/.env.release.example")
    if f"-backend:{version}" not in release_example or f"-frontend:{version}" not in release_example:
        errors.append("Release environment image tags are not synchronized with VERSION")

    readme = read("README.md")
    stale_claims = (
        "Health Twin and Learning Twin placeholders",
        "Health Twin and Learning Twin are planned future modules",
    )
    for claim in stale_claims:
        if claim in readme:
            errors.append(f"README contains stale feature status: {claim}")

    gitignore = read(".gitignore")
    for entry in (
        "build/production-readiness/",
        ".phase5e-backup-*/",
        "deploy/.rollback-dry-run/",
    ):
        if entry not in gitignore:
            errors.append(f".gitignore is missing {entry}")

    if "*.sh text eol=lf" not in read(".gitattributes"):
        errors.append(".gitattributes must enforce LF line endings for shell scripts")

    for rel in tracked_files():
        normalized = rel.replace("\\", "/")
        if any(pattern.search(normalized) for pattern in FORBIDDEN_TRACKED_PATTERNS):
            errors.append(f"Private/generated artifact is tracked by Git: {normalized}")

    return errors


def main() -> int:
    errors = validate()
    if errors:
        print("Phase 5E repository validation failed:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    print("Phase 5E repository validation passed.")
    print(f"Version: {read('VERSION').strip()}")
    print(f"Tracked files checked: {len(tracked_files())}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
