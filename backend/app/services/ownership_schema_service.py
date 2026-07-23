from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import Engine, inspect, text


OWNED_TABLES = (
    "agent_memory",
    "agent_plans",
    "agent_profiles",
    "agent_reflections",
    "applications",
    "career_memory",
    "career_roadmap",
    "finance_transactions",
    "finance_memory",
    "savings_goals",
    "health_memory",
    "health_habits",
    "learning_memory",
    "learning_progress",
    "personal_memory",
    "twin_progress_snapshots",
)


@dataclass(frozen=True)
class OwnershipSchemaStatus:
    ready: bool
    missing_tables: tuple[str, ...]
    missing_user_id_columns: tuple[str, ...]
    unowned_rows: dict[str, int]


def inspect_ownership_schema(engine: Engine) -> OwnershipSchemaStatus:
    inspector = inspect(engine)
    available_tables = set(inspector.get_table_names())

    missing_tables = tuple(
        table for table in OWNED_TABLES if table not in available_tables
    )

    missing_columns: list[str] = []
    unowned_rows: dict[str, int] = {}

    with engine.connect() as connection:
        for table in OWNED_TABLES:
            if table not in available_tables:
                continue

            columns = {
                column["name"] for column in inspector.get_columns(table)
            }

            if "user_id" not in columns:
                missing_columns.append(table)
                continue

            count = connection.execute(
                text(f'SELECT COUNT(*) FROM "{table}" WHERE user_id IS NULL')
            ).scalar_one()

            if count:
                unowned_rows[table] = int(count)

    ready = not missing_tables and not missing_columns and not unowned_rows

    return OwnershipSchemaStatus(
        ready=ready,
        missing_tables=missing_tables,
        missing_user_id_columns=tuple(missing_columns),
        unowned_rows=unowned_rows,
    )
