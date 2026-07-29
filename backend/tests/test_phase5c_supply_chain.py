from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def test_phase5c_security_files_exist() -> None:
    required = [
        ".gitleaks.toml",
        ".github/dependabot.yml",
        ".github/workflows/security-supply-chain.yml",
        "security/policy.json",
        "scripts/security/scan-local.ps1",
        "scripts/security/validate_supply_chain.py",
    ]
    assert all((ROOT / path).is_file() for path in required)


def test_security_policy_blocks_critical_findings() -> None:
    policy = json.loads((ROOT / "security/policy.json").read_text(encoding="utf-8"))
    assert policy["python"]["fail_on_unaccepted_vulnerability"] is True
    assert "critical" in {
        value.lower() for value in policy["npm"]["fail_severities"]
    }
    assert "CRITICAL" in policy["trivy"]["fail_severities"]


def test_security_workflow_has_least_privilege_and_pinned_versions() -> None:
    workflow = (ROOT / ".github/workflows/security-supply-chain.yml").read_text(
        encoding="utf-8"
    )
    assert re.search(r"(?m)^permissions:\s*\n\s+contents:\s+read\s*$", workflow)
    assert "@main" not in workflow
    assert "@master" not in workflow
    assert "@latest" not in workflow
    assert "actions/checkout@v6" in workflow
    assert "aquasecurity/trivy-action@v0.36.0" in workflow
    assert "ghcr.io/gitleaks/gitleaks:v8.30.1" in workflow


def test_dependabot_covers_each_dependency_ecosystem() -> None:
    config = (ROOT / ".github/dependabot.yml").read_text(encoding="utf-8")
    for ecosystem in ("pip", "npm", "docker", "github-actions"):
        assert f'package-ecosystem: "{ecosystem}"' in config


def test_private_and_generated_security_files_are_ignored() -> None:
    gitignore = (ROOT / ".gitignore").read_text(encoding="utf-8")
    for entry in (
        ".env.docker",
        "build/security/",
        ".phase5c-backup-*/",
    ):
        assert entry in gitignore


def test_python_runtime_requirements_are_exactly_pinned() -> None:
    unpinned = []
    requirements = (ROOT / "backend/requirements.txt").read_text(
        encoding="utf-8"
    )
    for raw_line in requirements.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or line.startswith("-r "):
            continue
        if "==" not in line:
            unpinned.append(line)
    assert not unpinned
