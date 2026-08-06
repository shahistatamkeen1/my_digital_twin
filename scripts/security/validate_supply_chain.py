from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

REQUIRED_FILES = [
    ".gitleaks.toml",
    ".github/dependabot.yml",
    ".github/workflows/security-supply-chain.yml",
    "security/policy.json",
    "security/README.md",
    "scripts/security/enforce_pip_audit.py",
    "scripts/security/enforce_npm_audit.py",
]

PROHIBITED_TRACKED_NAMES = {
    ".env",
    ".env.local",
    ".env.docker",
    ".phase3b-postgres.env",
}


def fail(message: str) -> None:
    raise SystemExit(f"Phase 5C validation failed: {message}")


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def validate_required_files() -> None:
    missing = [path for path in REQUIRED_FILES if not (ROOT / path).is_file()]
    if missing:
        fail("missing files: " + ", ".join(missing))


def validate_policy() -> None:
    policy = json.loads(read("security/policy.json"))
    if "critical" not in {
        value.lower() for value in policy["npm"]["fail_severities"]
    }:
        fail("npm policy must block critical findings")
    if "CRITICAL" not in policy["trivy"]["fail_severities"]:
        fail("Trivy policy must block CRITICAL findings")
    if not policy["python"]["fail_on_unaccepted_vulnerability"]:
        fail("Python vulnerability enforcement must remain enabled")


def validate_actions() -> None:
    workflows = list((ROOT / ".github" / "workflows").glob("*.y*ml"))
    if not workflows:
        fail("no GitHub Actions workflows found")

    unsafe_refs: list[str] = []
    for workflow in workflows:
        text = workflow.read_text(encoding="utf-8")
        if not re.search(r"(?m)^permissions:\s*$", text):
            fail(f"{workflow.name} has no top-level permissions block")
        for match in re.finditer(r"(?m)^\s*uses:\s*([^\s#]+)", text):
            reference = match.group(1)
            if reference.endswith(("@main", "@master", "@latest")):
                unsafe_refs.append(f"{workflow.name}: {reference}")
    if unsafe_refs:
        fail("mutable action references found: " + "; ".join(unsafe_refs))


def validate_dependabot() -> None:
    text = read(".github/dependabot.yml")
    required = [
        'package-ecosystem: "pip"',
        'package-ecosystem: "npm"',
        'package-ecosystem: "docker"',
        'package-ecosystem: "github-actions"',
    ]
    for item in required:
        if item not in text:
            fail(f"Dependabot is missing {item}")


def validate_container_controls() -> None:
    for dockerfile in ("backend/Dockerfile", "frontend/Dockerfile"):
        text = read(dockerfile)
        users = re.findall(r"(?m)^USER\s+(\S+)", text)
        if not users or users[-1].lower() in {"root", "0"}:
            fail(f"{dockerfile} does not end with a non-root USER")


def validate_ignored_files() -> None:
    gitignore = read(".gitignore")
    for entry in ("build/security/", ".env.docker", ".phase5c-backup-*/"):
        if entry not in gitignore:
            fail(f".gitignore is missing {entry}")

    try:
        result = subprocess.run(
            ["git", "-C", str(ROOT), "ls-files"],
            check=True,
            capture_output=True,
            text=True,
        )
    except (FileNotFoundError, subprocess.CalledProcessError):
        return

    tracked = [Path(line) for line in result.stdout.splitlines() if line.strip()]
    violations = []
    for path in tracked:
        if path.name in PROHIBITED_TRACKED_NAMES:
            violations.append(path.as_posix())
    if violations:
        fail("private environment files are tracked: " + ", ".join(violations))



def validate_runtime_dependency_pins() -> None:
    unpinned: list[str] = []
    for raw_line in read("backend/requirements.txt").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or line.startswith("-r "):
            continue
        if "==" not in line:
            unpinned.append(line)
    if unpinned:
        fail("unpinned Python runtime dependencies: " + ", ".join(unpinned))


def validate_versions() -> None:
    expected = read("VERSION").strip()
    checks = {
        ".env.docker.example": f"APP_VERSION={expected}",
        "backend/.env.example": f"APP_VERSION={expected}",
        "docker-compose.yml": f"APP_VERSION: ${{APP_VERSION:-{expected}}}",
    }
    for path, token in checks.items():
        if token not in read(path):
            fail(f"{path} version is not synchronized with VERSION ({expected})")


def main() -> None:
    validate_required_files()
    validate_policy()
    validate_actions()
    validate_dependabot()
    validate_container_controls()
    validate_ignored_files()
    validate_runtime_dependency_pins()
    validate_versions()
    print("Phase 5C supply-chain configuration validation passed.")


if __name__ == "__main__":
    main()
