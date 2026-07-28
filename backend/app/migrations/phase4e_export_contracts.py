from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from app.api.contract_inventory import (
    route_inventory_markdown,
    route_inventory_payload,
)
from app.api.openapi import canonical_openapi_schema


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(
        json.dumps(payload, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def export_contracts(output_dir: Path) -> dict[str, Path]:
    from main import app

    output_dir.mkdir(parents=True, exist_ok=True)
    full_schema = app.openapi()
    canonical_schema = canonical_openapi_schema(full_schema)

    paths = {
        "full_openapi": output_dir / "openapi-full.json",
        "canonical_openapi": output_dir / "openapi-v1.json",
        "inventory_json": output_dir / "route-inventory.json",
        "inventory_markdown": output_dir / "API_ROUTE_INVENTORY.md",
    }

    _write_json(paths["full_openapi"], full_schema)
    _write_json(paths["canonical_openapi"], canonical_schema)
    _write_json(paths["inventory_json"], route_inventory_payload(full_schema))
    paths["inventory_markdown"].write_text(
        route_inventory_markdown(full_schema),
        encoding="utf-8",
    )

    return paths


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Export full and canonical OpenAPI contracts plus route inventory.",
    )
    parser.add_argument(
        "--output-dir",
        default="docs/generated",
        help="Directory for generated contract artifacts.",
    )
    args = parser.parse_args()

    generated = export_contracts(Path(args.output_dir).resolve())
    print("Phase 4E contract export passed.")
    for name, path in generated.items():
        print(f"{name}: {path}")


if __name__ == "__main__":
    main()
