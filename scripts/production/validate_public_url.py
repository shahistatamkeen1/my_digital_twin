from __future__ import annotations

import argparse
from urllib.parse import urlparse


PLACEHOLDER_HOSTS = {
    "example.com",
    "api.example.com",
    "api-staging.example.com",
    "staging.example.com",
}


def validate(url: str, production: bool) -> list[str]:
    errors: list[str] = []
    parsed = urlparse(url.strip())
    host = (parsed.hostname or "").lower()

    if parsed.scheme not in {"http", "https"}:
        errors.append("URL must start with http:// or https://")
    if not host:
        errors.append("URL must include a hostname")
    if parsed.path not in {"", "/"} or parsed.query or parsed.fragment:
        errors.append("Use only the backend base URL; do not append /api, /docs, queries, or fragments")

    if production:
        if parsed.scheme != "https":
            errors.append("Published releases require an HTTPS backend URL")
        if host in {"localhost", "127.0.0.1", "::1"}:
            errors.append("Published releases cannot use a localhost backend URL")
        if host in PLACEHOLDER_HOSTS or host.endswith(".example.com"):
            errors.append("Replace the example hostname with a backend you control")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate a frontend/backend public base URL.")
    parser.add_argument("--url", required=True)
    parser.add_argument("--production", action="store_true")
    args = parser.parse_args()

    errors = validate(args.url, args.production)
    if errors:
        print("Public URL validation failed:")
        for error in errors:
            print(f"  - {error}")
        return 1

    print("Public URL validation passed.")
    print(f"URL: {args.url.rstrip('/')}")
    print(f"Mode: {'production' if args.production else 'development/dry-run'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
