from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def _load_json(path: Path) -> Any:
    text = path.read_text(encoding="utf-8-sig", errors="replace").strip()
    if not text:
        raise ValueError("npm audit report is empty")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start < 0 or end <= start:
            raise
        return json.loads(text[start : end + 1])


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", type=Path, required=True)
    parser.add_argument("--policy", type=Path, required=True)
    args = parser.parse_args()

    report = _load_json(args.report)
    policy = _load_json(args.policy)
    fail_severities = {
        str(value).lower() for value in policy["npm"].get("fail_severities", [])
    }
    allowed = set(policy["npm"].get("allowed_packages", []))

    findings: list[tuple[str, str, bool]] = []
    for package, item in report.get("vulnerabilities", {}).items():
        severity = str(item.get("severity", "unknown")).lower()
        if package in allowed or severity not in fail_severities:
            continue
        findings.append((package, severity, bool(item.get("isDirect", False))))

    if findings:
        print("npm dependency findings that violate policy:")
        for package, severity, direct in findings:
            dependency_type = "direct" if direct else "transitive"
            print(f"  - {package}: {severity} ({dependency_type})")
        return 1

    metadata = report.get("metadata", {}).get("vulnerabilities", {})
    summary = ", ".join(
        f"{name}={metadata.get(name, 0)}"
        for name in ("low", "moderate", "high", "critical")
    )
    print(f"npm dependency audit policy passed ({summary}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
