from __future__ import annotations

import tempfile
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import create_engine, text

from app.migrations.phase3b_transfer_sqlite_to_postgres import transfer
from app.services.database_portability_service import (
    table_counts,
    table_fingerprints,
    upgrade_database_to_head,
)


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="mdt-phase3b-") as temp_dir:
        root = Path(temp_dir)
        source_url = f"sqlite:///{(root / 'source.db').as_posix()}"
        target_url = f"sqlite:///{(root / 'target.db').as_posix()}"

        upgrade_database_to_head(source_url)

        engine = create_engine(
            source_url,
            connect_args={"check_same_thread": False},
        )
        try:
            now = datetime.now(timezone.utc)
            with engine.begin() as connection:
                connection.execute(
                    text(
                        "INSERT INTO users "
                        "(id, email, full_name, hashed_password, role, is_active, "
                        "is_verified, created_at, updated_at, last_login_at) "
                        "VALUES (1, 'phase3b@example.com', 'Phase 3B User', "
                        "'hash', 'user', 1, 0, :now, :now, NULL)"
                    ),
                    {"now": now},
                )
                connection.execute(
                    text(
                        "INSERT INTO applications "
                        "(id, company, role, location, status, date_applied, "
                        "notes, created_at, user_id) VALUES "
                        "(1, 'Phase 3B Co', 'AI Engineer', 'Chicago', 'Saved', "
                        "'2026-07-22', 'transfer test', :now, 1)"
                    ),
                    {"now": now.replace(tzinfo=None)},
                )
                connection.execute(
                    text(
                        "INSERT INTO finance_transactions "
                        "(id, type, title, amount, category, date, user_id) "
                        "VALUES (1, 'expense', 'Test', 42.5, 'Other', "
                        "'2026-07-22', 1)"
                    )
                )
                connection.execute(
                    text(
                        "INSERT INTO health_habits "
                        "(id, date, water_cups, sleep_hours, workout_minutes, "
                        "mood, notes, user_id) VALUES "
                        "(1, '2026-07-22', 8, 7.5, 30, 'Good', 'test', 1)"
                    )
                )
                connection.execute(
                    text(
                        "INSERT INTO learning_memory "
                        "(id, topic, category, current_level, target_level, "
                        "resource, resource_link, status, notes, user_id) VALUES "
                        "(1, 'PostgreSQL', 'Database', 'Beginner', "
                        "'Intermediate', 'Docs', 'https://example.com', "
                        "'In Progress', 'test', 1)"
                    )
                )
                connection.execute(
                    text(
                        "INSERT INTO agent_profiles "
                        "(id, agent_name, learned_preferences, behavior_patterns, "
                        "recurring_goals, recurring_risks, decision_style, "
                        "confidence_score, created_at, updated_at, user_id) VALUES "
                        "(1, 'Career', '{}', '{}', '[]', '[]', 'Structured', "
                        "50, :now, :now, 1)"
                    ),
                    {"now": now.replace(tzinfo=None)},
                )
        finally:
            engine.dispose()

        transfer(
            source_database_url=source_url,
            target_database_url=target_url,
            truncate_target=False,
            batch_size=2,
            create_source_backup=True,
            allow_non_sqlite_source=False,
            allow_non_postgres_target=True,
        )

        source_engine = create_engine(source_url)
        target_engine = create_engine(target_url)
        try:
            if table_counts(source_engine) != table_counts(target_engine):
                raise RuntimeError("Smoke-test table counts differ.")
            if table_fingerprints(source_engine) != table_fingerprints(target_engine):
                raise RuntimeError("Smoke-test fingerprints differ.")
        finally:
            source_engine.dispose()
            target_engine.dispose()

    print("Phase 3B portable transfer smoke test passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
