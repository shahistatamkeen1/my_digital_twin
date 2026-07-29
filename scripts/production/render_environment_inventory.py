from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


@dataclass(frozen=True)
class Variable:
    name: str
    sources: tuple[str, ...]
    sensitive: bool
    required_for: str
    description: str


SOURCE_FILES = (
    "backend/.env.example",
    "frontend/.env.example",
    ".env.docker.example",
    "deploy/.env.release.example",
)

SENSITIVE_TOKENS = (
    "PASSWORD",
    "SECRET",
    "API_KEY",
    "APP_KEY",
    "DATABASE_URL",
)

DESCRIPTIONS = {
    "APP_NAME": "Human-readable FastAPI application name.",
    "APP_VERSION": "Release version exposed by runtime metadata and health endpoints.",
    "ENVIRONMENT": "Runtime environment name such as development, test, staging, or production.",
    "DATABASE_URL": "SQLAlchemy database connection string used by the backend.",
    "BACKEND_DATABASE_URL": "Container-oriented PostgreSQL SQLAlchemy connection string.",
    "POSTGRES_DB": "PostgreSQL database name.",
    "POSTGRES_USER": "PostgreSQL application role.",
    "POSTGRES_PASSWORD": "PostgreSQL application-role password.",
    "JWT_SECRET_KEY": "Secret used to sign access and refresh tokens; use at least 32 random characters.",
    "OPENAI_API_KEY": "Optional OpenAI credential for AI-powered features.",
    "ADZUNA_APP_ID": "Optional Adzuna application identifier for job discovery.",
    "ADZUNA_APP_KEY": "Optional Adzuna credential for job discovery.",
    "NEXT_PUBLIC_API_URL": "Backend base URL compiled into the Next.js client bundle.",
    "PUBLIC_API_BASE_URL": "Public backend base URL used in OpenAPI metadata and release builds.",
    "PUBLIC_FRONTEND_URL": "Public HTTPS address of the deployed frontend.",
    "CORS_ORIGINS": "Comma-separated browser origins allowed to call the backend.",
    "AUTH_COOKIE_SECURE": "Require HTTPS-only authentication cookies in production.",
    "AUTH_COOKIE_SAMESITE": "SameSite policy for authentication cookies.",
    "AUTH_COOKIE_DOMAIN": "Optional shared cookie domain for deployed environments.",
    "ENABLE_LEGACY_API_ROUTES": "Keep deprecated /api aliases available while clients migrate to /api/v1.",
    "API_DOCS_ENABLED": "Enable Swagger, ReDoc, and OpenAPI endpoints.",
    "READINESS_REQUIRE_AUTH": "Make valid authentication configuration a readiness requirement.",
    "READINESS_REQUIRE_AI": "Make OpenAI configuration a readiness requirement.",
    "CONTAINER_RUN_MIGRATIONS": "Run Alembic upgrade before the backend starts in a container.",
    "BACKEND_IMAGE": "Published backend OCI image reference used by release Compose.",
    "FRONTEND_IMAGE": "Published frontend OCI image reference used by release Compose.",
    "DEPLOY_ENVIRONMENT": "Deployment environment label, usually staging or production.",
    "COMPOSE_PROJECT_NAME": "Compose project name used to isolate environment resources.",
}


def parse_env_file(path: Path) -> set[str]:
    names: set[str] = set()
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name = line.split("=", 1)[0].strip()
        if re.fullmatch(r"[A-Z][A-Z0-9_]*", name):
            names.add(name)
    return names


def classify_required_for(sources: set[str]) -> str:
    if "deploy/.env.release.example" in sources:
        return "Deployment"
    if ".env.docker.example" in sources:
        return "Docker/local production"
    if "frontend/.env.example" in sources and len(sources) == 1:
        return "Frontend"
    return "Backend/local development"


def collect() -> list[Variable]:
    mapping: dict[str, set[str]] = {}
    for rel in SOURCE_FILES:
        for name in parse_env_file(ROOT / rel):
            mapping.setdefault(name, set()).add(rel)

    variables: list[Variable] = []
    for name in sorted(mapping):
        sources = mapping[name]
        variables.append(
            Variable(
                name=name,
                sources=tuple(sorted(sources)),
                sensitive=any(token in name for token in SENSITIVE_TOKENS),
                required_for=classify_required_for(sources),
                description=DESCRIPTIONS.get(
                    name,
                    "Runtime configuration documented in the committed environment templates.",
                ),
            )
        )
    return variables


def render() -> str:
    rows = collect()
    lines = [
        "# Environment Variable Inventory",
        "",
        "This inventory is generated from the committed environment templates. Never commit real values.",
        "",
        "| Variable | Scope | Sensitive | Description | Template sources |",
        "|---|---|---:|---|---|",
    ]
    for item in rows:
        sources = "<br>".join(f"`{source}`" for source in item.sources)
        lines.append(
            f"| `{item.name}` | {item.required_for} | "
            f"{'Yes' if item.sensitive else 'No'} | {item.description} | {sources} |"
        )

    lines.extend(
        [
            "",
            "## Handling rules",
            "",
            "- Put passwords, tokens, API keys, and database URLs containing credentials in secret stores.",
            "- Repository variables are appropriate only for non-sensitive values such as public URLs.",
            "- Production browser URLs must use HTTPS; `localhost` values are for local validation only.",
            "- Rotate any credential that has appeared in a screenshot, terminal log, commit, or chat message.",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Render the environment-variable inventory.")
    parser.add_argument("--output", type=Path, default=ROOT / "docs/ENVIRONMENT_VARIABLES.md")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    content = render()
    if args.check:
        current = args.output.read_text(encoding="utf-8") if args.output.exists() else ""
        if current.replace("\r\n", "\n") != content:
            raise SystemExit(
                "Environment inventory is stale. Run "
                "python scripts/production/render_environment_inventory.py"
            )
        print("Environment variable inventory is current.")
        return 0

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(content, encoding="utf-8", newline="\n")
    print(f"Wrote {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
