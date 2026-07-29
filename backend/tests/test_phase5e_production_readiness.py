from __future__ import annotations

import importlib.util
import json
import shutil
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def load_module(rel: str, name: str):
    path = ROOT / rel
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def test_phase5e_required_files_exist() -> None:
    required = [
        "docs/ARCHITECTURE.md",
        "docs/ENVIRONMENT_VARIABLES.md",
        "docs/ONBOARDING.md",
        "docs/OPERATIONS.md",
        "docs/INCIDENT_RESPONSE.md",
        "docs/PRODUCTION_READINESS.md",
        "docs/FINAL_RELEASE_CHECKLIST.md",
        "docs/PORTFOLIO_SUMMARY.md",
        "scripts/production/validate_repository.py",
        "scripts/production/validate_public_url.py",
        "scripts/production/end_to_end_verify.py",
        "scripts/production/backup_restore_test.py",
        "scripts/production/rollback_dry_run.py",
        ".github/workflows/final-production-readiness.yml",
    ]
    assert all((ROOT / rel).is_file() for rel in required)


def test_repository_readiness_validator_passes() -> None:
    validator = load_module(
        "scripts/production/validate_repository.py",
        "phase5e_repository_validator",
    )
    assert validator.validate() == []


def test_environment_inventory_is_current() -> None:
    renderer = load_module(
        "scripts/production/render_environment_inventory.py",
        "phase5e_environment_renderer",
    )
    expected = renderer.render()
    current = (ROOT / "docs/ENVIRONMENT_VARIABLES.md").read_text(encoding="utf-8")
    assert current.replace("\r\n", "\n") == expected


def test_public_url_policy() -> None:
    validator = load_module(
        "scripts/production/validate_public_url.py",
        "phase5e_public_url_validator",
    )
    assert validator.validate("http://localhost:8000", production=False) == []
    assert validator.validate("https://api.example.com", production=True)
    assert validator.validate("http://api.real-domain.test", production=True)
    assert validator.validate("https://api.real-domain.test", production=True) == []
    assert validator.validate("https://api.real-domain.test/api/v1", production=True)


def test_version_is_synchronized() -> None:
    version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
    assert version == "0.6.1"
    assert f'"{version}"' in (ROOT / "backend/app/config.py").read_text(encoding="utf-8")
    assert f"APP_VERSION={version}" in (ROOT / ".env.docker.example").read_text(
        encoding="utf-8"
    )
    assert f"-backend:{version}" in (ROOT / "deploy/.env.release.example").read_text(
        encoding="utf-8"
    )


def test_readme_has_current_twin_scope() -> None:
    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    for heading in ("Career Twin", "Finance Twin", "Health Twin", "Learning Twin"):
        assert heading in readme
    assert "Health Twin and Learning Twin are planned future modules" not in readme
    assert "Health Twin and Learning Twin placeholders" not in readme


def test_release_workflow_enforces_production_url_policy() -> None:
    workflow = (ROOT / ".github/workflows/release.yml").read_text(encoding="utf-8")
    assert "scripts/production/validate_public_url.py" in workflow
    assert "args+=(--production)" in workflow
    assert "tests/test_phase5e_production_readiness.py" in workflow


def test_final_readiness_workflow_covers_runtime_recovery_checks() -> None:
    workflow = (ROOT / ".github/workflows/final-production-readiness.yml").read_text(
        encoding="utf-8"
    )
    for token in (
        "validate_repository.py",
        "render_environment_inventory.py --check",
        "end_to_end_verify.py",
        "backup_restore_test.py",
        "rollback_dry_run.py",
        "actions/upload-artifact@v6",
    ):
        assert token in workflow


def test_rollback_dry_run_renders_previous_images(tmp_path: Path) -> None:
    if shutil.which("docker") is None:
        return
    if subprocess.run(["docker", "compose", "version"], capture_output=True).returncode != 0:
        return

    env_source = ROOT / "deploy/.env.release.example"
    env_file = tmp_path / ".env.release"
    text = env_source.read_text(encoding="utf-8")
    replacements = {
        "OWNER/REPOSITORY": "owner/repository",
        "CHANGE_ME_LONG_URL_SAFE_PASSWORD": "phase5e_test_password",
        "CHANGE_ME_GENERATE_AT_LEAST_32_CHARACTERS": "phase5e-test-secret-0123456789abcdef-0123456789abcdef",
        "https://staging.example.com": "https://staging.test.invalid",
        "https://api-staging.example.com": "https://api-staging.test.invalid",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    env_file.write_text(text, encoding="utf-8")

    state = tmp_path / "previous.json"
    state.write_text(
        json.dumps(
            {
                "backend_image": "ghcr.io/owner/repository-backend:0.5.3",
                "frontend_image": "ghcr.io/owner/repository-frontend:0.5.3",
            }
        ),
        encoding="utf-8",
    )
    output = tmp_path / "rollback.json"
    subprocess.run(
        [
            sys.executable,
            str(ROOT / "scripts/production/rollback_dry_run.py"),
            "--env-file",
            str(env_file),
            "--state-file",
            str(state),
            "--expected-version",
            "0.5.3",
            "--output",
            str(output),
        ],
        check=True,
        cwd=ROOT,
    )
    payload = json.loads(output.read_text(encoding="utf-8"))
    assert payload["automatic_migrations"] is False
    assert payload["database_downgrade"] is False
