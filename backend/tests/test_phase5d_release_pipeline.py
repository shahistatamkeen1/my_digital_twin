from __future__ import annotations

import importlib.util
import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def load_validator():
    path = ROOT / "scripts/release/validate_release.py"
    spec = importlib.util.spec_from_file_location("phase5d_validator", path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_phase5d_release_files_exist() -> None:
    required = [
        "VERSION",
        ".github/workflows/release.yml",
        ".github/workflows/deploy.yml",
        "deploy/docker-compose.release.yml",
        "deploy/.env.release.example",
        "scripts/release/validate_release.py",
        "scripts/release/render_release_manifest.py",
        "scripts/release/smoke_test.py",
        "scripts/deploy/deploy.sh",
        "scripts/deploy/rollback.sh",
        "docs/RELEASE.md",
        "docs/DEPLOYMENT.md",
        "docs/ROLLBACK.md",
    ]
    assert all((ROOT / path).is_file() for path in required)


def test_release_version_is_synchronized() -> None:
    validator = load_validator()
    version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
    assert validator.validate(version, f"v{version}") == []


def test_release_compose_uses_published_images_and_security_controls() -> None:
    compose = (ROOT / "deploy/docker-compose.release.yml").read_text(
        encoding="utf-8"
    )
    assert "build:" not in compose
    assert "${BACKEND_IMAGE:?BACKEND_IMAGE must be set}" in compose
    assert "${FRONTEND_IMAGE:?FRONTEND_IMAGE must be set}" in compose
    assert compose.count("no-new-privileges:true") == 2
    assert "cap_drop:" in compose
    assert "CONTAINER_RUN_MIGRATIONS" in compose


def test_release_workflow_publishes_and_attests_both_images() -> None:
    workflow = (ROOT / ".github/workflows/release.yml").read_text(
        encoding="utf-8"
    )
    for reference in (
        "actions/checkout@v6",
        "docker/setup-qemu-action@v4",
        "docker/setup-buildx-action@v4",
        "docker/login-action@v4",
        "docker/metadata-action@v6",
        "docker/build-push-action@v7",
        "actions/attest@v4",
    ):
        assert reference in workflow
    assert workflow.count("actions/attest@v4") == 2
    assert "packages: write" in workflow
    assert "attestations: write" in workflow
    assert "id-token: write" in workflow
    assert workflow.count("sbom: ${{ needs.validate.outputs.publish == 'true' }}") == 2
    assert "@main" not in workflow
    assert "@master" not in workflow
    assert "@latest" not in workflow


def test_deployment_requires_environment_and_self_hosted_runner() -> None:
    workflow = (ROOT / ".github/workflows/deploy.yml").read_text(
        encoding="utf-8"
    )
    assert "environment:" in workflow
    assert "self-hosted" in workflow
    assert "packages: read" in workflow
    assert "POSTGRES_PASSWORD" in workflow
    assert "JWT_SECRET_KEY" in workflow
    assert "deploy/.env.release.runtime" in workflow


def test_private_release_files_are_ignored() -> None:
    gitignore = (ROOT / ".gitignore").read_text(encoding="utf-8")
    for entry in (
        "build/release/",
        "deploy/.env.release",
        "deploy/.deployment-state/",
        ".phase5d-backup-*/",
    ):
        assert entry in gitignore


def test_release_manifest_renderer_writes_expected_shape(tmp_path: Path) -> None:
    path = ROOT / "scripts/release/render_release_manifest.py"
    spec = importlib.util.spec_from_file_location("phase5d_manifest", path)
    assert spec and spec.loader

    output = tmp_path / "manifest.json"
    import subprocess
    subprocess.run(
        [
            sys.executable,
            str(path),
            "--version",
            "0.5.4",
            "--repository",
            "owner/repo",
            "--commit",
            "a" * 40,
            "--backend-image",
            "ghcr.io/owner/repo-backend",
            "--backend-digest",
            "sha256:" + "b" * 64,
            "--frontend-image",
            "ghcr.io/owner/repo-frontend",
            "--frontend-digest",
            "sha256:" + "c" * 64,
            "--public-api-url",
            "https://api.example.com",
            "--output",
            str(output),
        ],
        check=True,
    )
    payload = json.loads(output.read_text(encoding="utf-8"))
    assert payload["release"]["version"] == "0.5.4"
    assert payload["release"]["alembic_head"] == "20260723_0003"
    assert payload["images"]["backend"]["reference"].startswith(
        "ghcr.io/owner/repo-backend@sha256:"
    )
