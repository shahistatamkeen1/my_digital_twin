from __future__ import annotations

from sqlalchemy import Column, Integer, JSON, String, text

from app.migrations.alembic_compare import compare_server_default


def _compare(
    inspected_type,
    metadata_type,
    inspected_default,
    metadata_default,
):
    return compare_server_default(
        None,
        Column("payload", inspected_type),
        Column("payload", metadata_type),
        inspected_default,
        text(metadata_default) if metadata_default is not None else None,
        metadata_default,
    )


def test_equivalent_json_array_defaults_do_not_report_drift() -> None:
    assert _compare(JSON(), JSON(), "'[]'::json", "'[]'") is False


def test_equivalent_json_object_defaults_ignore_casts_and_parentheses() -> None:
    assert _compare(JSON(), JSON(), "(('{}'::json))", "'{}'") is False


def test_different_json_defaults_report_drift() -> None:
    assert _compare(JSON(), JSON(), "'[]'::json", "'{}'") is True


def test_missing_json_default_reports_drift() -> None:
    assert _compare(JSON(), JSON(), None, "'{}'") is True


def test_non_json_defaults_delegate_to_alembic() -> None:
    assert _compare(String(), String(), "'planned'", "'planned'") is None
    assert _compare(Integer(), Integer(), "0", "0") is None
