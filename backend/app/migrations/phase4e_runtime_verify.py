from __future__ import annotations

import argparse
import json
from collections import Counter
from typing import Any

import requests

from app.config import settings


HTTP_METHODS = {"get", "post", "put", "patch", "delete", "head", "options"}


def _operations(schema: dict[str, Any]):
    for path, path_item in schema.get("paths", {}).items():
        for method, operation in path_item.items():
            if method in HTTP_METHODS:
                yield path, method, operation


def verify(base_url: str) -> None:
    root = base_url.rstrip("/")
    timeout = 20

    full_response = requests.get(f"{root}/openapi.json", timeout=timeout)
    full_response.raise_for_status()
    full_schema = full_response.json()

    canonical_response = requests.get(
        f"{root}{settings.api_openapi_path}",
        timeout=timeout,
    )
    canonical_response.raise_for_status()
    canonical_schema = canonical_response.json()

    assert canonical_schema["x-contract-scope"] == "canonical"
    assert canonical_response.headers[settings.api_version_header] == settings.api_current_version
    assert "/api/v1/applications/" in canonical_schema["paths"]
    assert "/api/applications/" not in canonical_schema["paths"]

    operations = list(_operations(full_schema))
    operation_ids = [operation.get("operationId") for _, _, operation in operations]
    duplicates = [value for value, count in Counter(operation_ids).items() if count > 1]
    assert not duplicates, f"Duplicate operation IDs: {duplicates}"
    assert all(operation.get("summary") for _, _, operation in operations)
    assert all(operation.get("description") for _, _, operation in operations)

    protected = full_schema["paths"]["/api/v1/applications/"]["get"]
    assert {"HTTPBearer": []} in protected["security"]
    assert {"AccessCookieAuth": []} in protected["security"]

    legacy = full_schema["paths"]["/api/applications/"]["get"]
    assert legacy["deprecated"] is True
    assert legacy["x-successor-version"] == "/api/v1/applications/"

    serialized = json.dumps(full_schema)
    for secret in (settings.jwt_secret_key, settings.openai_api_key):
        if secret and len(secret) >= 8:
            assert secret not in serialized

    if settings.api_docs_enabled:
        docs = requests.get(f"{root}{settings.api_docs_path}", timeout=timeout)
        docs.raise_for_status()
        assert settings.api_openapi_path in docs.text

        redoc = requests.get(f"{root}{settings.api_redoc_path}", timeout=timeout)
        redoc.raise_for_status()
        assert settings.api_openapi_path in redoc.text

    print("Phase 4E live API documentation verification passed.")
    print("Full and canonical schemas, docs UIs, security, and legacy metadata passed.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    args = parser.parse_args()
    verify(args.base_url)


if __name__ == "__main__":
    main()
