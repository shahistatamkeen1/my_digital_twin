from __future__ import annotations

import argparse
import json
import os
import subprocess
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def read_env(path: Path) -> list[str]:
    return path.read_text(encoding="utf-8").splitlines()


def write_env(source: Path, target: Path, updates: dict[str, str]) -> None:
    seen: set[str] = set()
    output: list[str] = []
    for raw in read_env(source):
        if "=" in raw and not raw.lstrip().startswith("#"):
            key = raw.split("=", 1)[0].strip()
            if key in updates:
                output.append(f"{key}={updates[key]}")
                seen.add(key)
                continue
        output.append(raw)
    for key, value in updates.items():
        if key not in seen:
            output.append(f"{key}={value}")
    target.write_text("\n".join(output) + "\n", encoding="utf-8", newline="\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate the rollback Compose plan without starting containers.")
    parser.add_argument("--env-file", type=Path, required=True)
    parser.add_argument("--state-file", type=Path, required=True)
    parser.add_argument(
        "--compose-file",
        type=Path,
        default=ROOT / "deploy/docker-compose.release.yml",
    )
    parser.add_argument("--expected-version", required=True)
    parser.add_argument("--output", type=Path, default=None)
    args = parser.parse_args()

    state = json.loads(args.state_file.read_text(encoding="utf-8"))
    backend = state.get("backend_image")
    frontend = state.get("frontend_image")
    if not backend or not frontend:
        raise SystemExit("Rollback state must include backend_image and frontend_image")

    with tempfile.TemporaryDirectory(prefix="mdt-phase5e-rollback-") as directory:
        temp_env = Path(directory) / ".env.rollback"
        write_env(
            args.env_file,
            temp_env,
            {
                "BACKEND_IMAGE": str(backend),
                "FRONTEND_IMAGE": str(frontend),
                "APP_VERSION": args.expected_version,
                "CONTAINER_RUN_MIGRATIONS": "false",
            },
        )
        os.chmod(temp_env, 0o600)
        command = [
            "docker",
            "compose",
            "--env-file",
            str(temp_env),
            "-f",
            str(args.compose_file),
            "config",
            "--format",
            "json",
        ]
        result = subprocess.run(command, check=True, text=True, capture_output=True)
        payload = json.loads(result.stdout)

    services = payload.get("services", {})
    backend_service = services.get("backend", {})
    frontend_service = services.get("frontend", {})
    if backend_service.get("image") != backend:
        raise SystemExit("Rendered rollback backend image does not match previous state")
    if frontend_service.get("image") != frontend:
        raise SystemExit("Rendered rollback frontend image does not match previous state")
    migrations = str(backend_service.get("environment", {}).get("CONTAINER_RUN_MIGRATIONS", "")).lower()
    if migrations != "false":
        raise SystemExit("Rollback plan must disable automatic migrations")

    report = {
        "status": "validated",
        "expected_version": args.expected_version,
        "backend_image": backend,
        "frontend_image": frontend,
        "database_downgrade": False,
        "automatic_migrations": False,
    }
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    print("Phase 5E rollback dry run passed.")
    print(f"Backend image: {backend}")
    print(f"Frontend image: {frontend}")
    print("Automatic migrations: disabled")
    print("Database downgrade: not performed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
