from __future__ import annotations

import json
import re
from typing import Any

from sqlalchemy import JSON


_JSON_CAST_RE = re.compile(
    r"::\s*(?:(?:pg_catalog\.)?jsonb?)\s*$",
    flags=re.IGNORECASE,
)


def _strip_balanced_outer_parentheses(value: str) -> str:
    """Remove redundant balanced outer parentheses from a SQL expression."""
    result = value.strip()
    while result.startswith("(") and result.endswith(")"):
        depth = 0
        wraps_entire_value = True
        for index, character in enumerate(result):
            if character == "(":
                depth += 1
            elif character == ")":
                depth -= 1
                if depth == 0 and index != len(result) - 1:
                    wraps_entire_value = False
                    break
            if depth < 0:
                wraps_entire_value = False
                break
        if not wraps_entire_value or depth != 0:
            break
        result = result[1:-1].strip()
    return result


def _normalise_json_default(value: Any) -> str | None:
    """Normalise rendered JSON defaults without asking PostgreSQL to compare JSON."""
    if value is None:
        return None

    rendered = _strip_balanced_outer_parentheses(str(value).strip())
    rendered = _JSON_CAST_RE.sub("", rendered).strip()
    rendered = _strip_balanced_outer_parentheses(rendered)

    if len(rendered) >= 3 and rendered[0] in {"E", "e"} and rendered[1] == "'":
        rendered = rendered[1:]

    if len(rendered) >= 2 and rendered[0] == "'" and rendered[-1] == "'":
        rendered = rendered[1:-1].replace("''", "'")

    try:
        parsed = json.loads(rendered)
    except (TypeError, ValueError, json.JSONDecodeError):
        return "sql:" + " ".join(rendered.split()).lower()

    return "json:" + json.dumps(
        parsed,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    )


def compare_server_default(
    context: Any,
    inspected_column: Any,
    metadata_column: Any,
    rendered_inspected_default: str | None,
    metadata_default: Any,
    rendered_metadata_default: str | None,
) -> bool | None:
    """Compare JSON defaults textually and delegate every other type to Alembic.

    PostgreSQL's ``json`` type has no equality operator. Alembic's PostgreSQL
    default implementation may execute the reflected and model defaults in a
    SQL equality expression, which fails for JSON columns. Returning a Boolean
    here keeps server-default drift checking enabled while avoiding that query.
    """
    del context

    is_json_column = isinstance(inspected_column.type, JSON) or isinstance(
        metadata_column.type,
        JSON,
    )
    if not is_json_column:
        return None

    metadata_rendered = rendered_metadata_default
    if metadata_rendered is None and metadata_default is not None:
        metadata_rendered = str(getattr(metadata_default, "arg", metadata_default))

    return _normalise_json_default(
        rendered_inspected_default
    ) != _normalise_json_default(metadata_rendered)
