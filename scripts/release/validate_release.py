from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SEMVER = re.compile(
    r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)"
    r"(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?"
    r"(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$"
)


def _read(path: str) -> str:
    target = ROOT / path
    if not target.is_file():
        raise ValueError(f"Required release file is missing: {path}")
    return target.read_text(encoding="utf-8")


def _env_value(path: str, name: str) -> str:
    for raw_line in _read(path).splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        if key.strip() == name:
            return value.strip()
    raise ValueError(f"{name} is missing from {path}")


def validate(version: str, tag: str | None = None) -> list[str]:
    errors: list[str] = []

    if not SEMVER.fullmatch(version):
        errors.append(f"Version is not valid Semantic Versioning: {version}")

    version_file = _read("VERSION").strip()
    if version_file != version:
        errors.append(f"VERSION contains {version_file!r}, expected {version!r}")

    for env_file in ("backend/.env.example", ".env.docker.example"):
        try:
            actual = _env_value(env_file, "APP_VERSION")
        except ValueError as exc:
            errors.append(str(exc))
            continue
        if actual != version:
            errors.append(f"{env_file} APP_VERSION is {actual!r}, expected {version!r}")

    config = _read("backend/app/config.py")
    expected_config = f'app_version: str = os.getenv("APP_VERSION", "{version}")'
    if expected_config not in config:
        errors.append("backend/app/config.py default APP_VERSION is not synchronized")

    compose = _read("docker-compose.yml")
    if f"APP_VERSION: ${{APP_VERSION:-{version}}}" not in compose:
        errors.append("docker-compose.yml default APP_VERSION is not synchronized")

    release_compose = _read("deploy/docker-compose.release.yml")
    if "build:" in release_compose:
        errors.append("Release Compose must consume published images, not local builds")
    for token in (
        "${BACKEND_IMAGE:?BACKEND_IMAGE must be set}",
        "${FRONTEND_IMAGE:?FRONTEND_IMAGE must be set}",
        "CONTAINER_RUN_MIGRATIONS",
        "no-new-privileges:true",
    ):
        if token not in release_compose:
            errors.append(f"Release Compose is missing required token: {token}")

    if tag is not None and tag != f"v{version}":
        errors.append(f"Release tag {tag!r} must equal v{version}")

    release_workflow = _read(".github/workflows/release.yml")
    deploy_workflow = _read(".github/workflows/deploy.yml")
    combined_workflows = release_workflow + "\n" + deploy_workflow
    for floating_ref in ("@main", "@master", "@latest"):
        if floating_ref in combined_workflows:
            errors.append(f"Release workflows use forbidden floating ref {floating_ref}")

    for required_ref in (
        "actions/checkout@v6",
        "docker/setup-buildx-action@v4",
        "docker/login-action@v4",
        "docker/metadata-action@v6",
        "docker/build-push-action@v7",
        "actions/attest@v4",
    ):
        if required_ref not in release_workflow:
            errors.append(f"Release workflow is missing {required_ref}")

    if "environment:" not in deploy_workflow:
        errors.append("Deployment workflow must use GitHub Environments")
    if "self-hosted" not in deploy_workflow:
        errors.append("Deployment workflow must target an explicit self-hosted runner")
    if "packages: read" not in deploy_workflow:
        errors.append("Deployment workflow requires packages: read")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate Phase 5D release metadata.")
    parser.add_argument("--version", default=None)
    parser.add_argument("--tag", default=None)
    args = parser.parse_args()

    version = args.version or _read("VERSION").strip()
    errors = validate(version, args.tag)

    if errors:
        print("Phase 5D release validation failed:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    print("Phase 5D release validation passed.")
    print(f"Version: {version}")
    if args.tag:
        print(f"Tag: {args.tag}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
