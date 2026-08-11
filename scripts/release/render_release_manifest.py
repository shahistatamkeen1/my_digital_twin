from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a release image manifest.")
    parser.add_argument("--version", required=True)
    parser.add_argument("--repository", required=True)
    parser.add_argument("--commit", required=True)
    parser.add_argument("--backend-image", required=True)
    parser.add_argument("--backend-digest", required=True)
    parser.add_argument("--frontend-image", required=True)
    parser.add_argument("--frontend-digest", required=True)
    parser.add_argument("--public-api-url", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "schema_version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "release": {
            "version": args.version,
            "tag": f"v{args.version}",
            "repository": args.repository,
            "commit": args.commit,
            "alembic_head": "20260806_0006",
        },
        "images": {
            "backend": {
                "name": args.backend_image,
                "digest": args.backend_digest,
                "reference": f"{args.backend_image}@{args.backend_digest}",
            },
            "frontend": {
                "name": args.frontend_image,
                "digest": args.frontend_digest,
                "reference": f"{args.frontend_image}@{args.frontend_digest}",
                "build_configuration": {
                    "NEXT_PUBLIC_API_URL": args.public_api_url,
                    "NEXT_PUBLIC_API_VERSION": "v1",
                    "NEXT_PUBLIC_API_USE_VERSIONED_ROUTES": "true",
                },
            },
        },
    }
    output.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Release manifest written to {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
