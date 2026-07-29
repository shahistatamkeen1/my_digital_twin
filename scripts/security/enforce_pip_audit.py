from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def _load_json(path: Path) -> Any:
    text = path.read_text(encoding="utf-8-sig").strip()
    if not text:
        return []
    return json.loads(text)


def _dependency_records(report: Any) -> list[dict[str, Any]]:
    """Return dependency records from supported pip-audit JSON schemas.

    pip-audit JSON has existed in two shapes:
    1. A top-level list of dependency objects.
    2. A top-level object containing a ``dependencies`` list.

    Supporting both keeps local and CI scans compatible across pip-audit
    releases while still rejecting malformed reports.
    """

    if isinstance(report, list):
        dependencies = report
    elif isinstance(report, dict):
        dependencies = report.get("dependencies", [])
    else:
        raise ValueError(
            "Unsupported pip-audit report: expected a JSON list or object."
        )

    if not isinstance(dependencies, list):
        raise ValueError(
            "Unsupported pip-audit report: 'dependencies' must be a JSON list."
        )

    records: list[dict[str, Any]] = []
    for index, dependency in enumerate(dependencies):
        if not isinstance(dependency, dict):
            raise ValueError(
                "Unsupported pip-audit report: dependency entry "
                f"{index} must be a JSON object."
            )
        records.append(dependency)

    return records


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", type=Path, required=True)
    parser.add_argument("--policy", type=Path, required=True)
    args = parser.parse_args()

    try:
        report = _load_json(args.report)
        policy = _load_json(args.policy)
        dependencies = _dependency_records(report)
    except (OSError, json.JSONDecodeError, KeyError, TypeError, ValueError) as exc:
        print(f"Could not process pip-audit report: {exc}")
        return 2

    ignored = set(policy["python"].get("ignored_vulnerability_ids", []))

    findings: list[tuple[str, str, str, list[str]]] = []
    for dependency in dependencies:
        package = str(dependency.get("name", "unknown"))
        version = str(dependency.get("version", "unknown"))
        vulns = dependency.get("vulns", [])
        if not isinstance(vulns, list):
            print(
                "Could not process pip-audit report: "
                f"'vulns' for {package} must be a JSON list."
            )
            return 2

        for vuln in vulns:
            if not isinstance(vuln, dict):
                print(
                    "Could not process pip-audit report: "
                    f"vulnerability entry for {package} must be a JSON object."
                )
                return 2

            vuln_id = str(vuln.get("id", "UNKNOWN"))
            aliases = {
                str(alias) for alias in vuln.get("aliases", []) if alias is not None
            }
            if vuln_id in ignored or aliases.intersection(ignored):
                continue

            fixes = [str(item) for item in vuln.get("fix_versions", [])]
            findings.append((package, version, vuln_id, fixes))

    if findings:
        print("Unaccepted Python dependency vulnerabilities:")
        for package, version, vuln_id, fixes in findings:
            fixed = ", ".join(fixes) if fixes else "no fixed version reported"
            print(f"  - {package} {version}: {vuln_id} ({fixed})")
        return 1

    print("Python dependency audit policy passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
