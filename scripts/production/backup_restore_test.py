from __future__ import annotations

import argparse
import subprocess
import uuid
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def compose_command(env_file: Path, compose_file: Path, *args: str) -> list[str]:
    return [
        "docker",
        "compose",
        "--env-file",
        str(env_file),
        "-f",
        str(compose_file),
        *args,
    ]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Perform a non-destructive PostgreSQL backup and restore test."
    )
    parser.add_argument("--env-file", type=Path, default=ROOT / ".env.docker")
    parser.add_argument("--compose-file", type=Path, default=ROOT / "docker-compose.yml")
    parser.add_argument("--service", default="database")
    args = parser.parse_args()

    env_file = args.env_file.resolve()
    compose_file = args.compose_file.resolve()
    if not env_file.is_file():
        raise SystemExit(f"Environment file not found: {env_file}")
    if not compose_file.is_file():
        raise SystemExit(f"Compose file not found: {compose_file}")

    subprocess.run(["docker", "version"], check=True, stdout=subprocess.DEVNULL)
    running = subprocess.run(
        compose_command(env_file, compose_file, "ps", "--status", "running", args.service),
        check=True,
        text=True,
        capture_output=True,
    )
    if not running.stdout.strip():
        raise SystemExit(
            f"Compose service {args.service!r} is not running. Start the Docker stack first."
        )

    suffix = uuid.uuid4().hex[:10]
    restore_db = f"mdt_phase5e_restore_{suffix}"
    dump_file = f"/tmp/mdt-phase5e-{suffix}.dump"
    script = f'''set -eu
restore_db={restore_db!r}
dump_file={dump_file!r}
cleanup() {{
  dropdb -U "$POSTGRES_USER" --if-exists "$restore_db" >/dev/null 2>&1 || true
  rm -f "$dump_file"
}}
trap cleanup EXIT INT TERM

pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f "$dump_file"
createdb -U "$POSTGRES_USER" "$restore_db"
pg_restore -U "$POSTGRES_USER" -d "$restore_db" --no-owner --no-privileges "$dump_file"

source_tables=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "select table_name from information_schema.tables where table_schema='public' order by table_name")
restore_tables=$(psql -U "$POSTGRES_USER" -d "$restore_db" -Atc "select table_name from information_schema.tables where table_schema='public' order by table_name")
[ "$source_tables" = "$restore_tables" ] || {{ echo "Restored table inventory differs from source" >&2; exit 1; }}

source_signature=""
restore_signature=""
for table in $source_tables; do
  source_count=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "select count(*) from public.\\\"$table\\\"")
  restore_count=$(psql -U "$POSTGRES_USER" -d "$restore_db" -Atc "select count(*) from public.\\\"$table\\\"")
  source_signature="$source_signature$table=$source_count;"
  restore_signature="$restore_signature$table=$restore_count;"
done
[ "$source_signature" = "$restore_signature" ] || {{ echo "Restored row counts differ from source" >&2; exit 1; }}

source_revision=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "select version_num from alembic_version")
restore_revision=$(psql -U "$POSTGRES_USER" -d "$restore_db" -Atc "select version_num from alembic_version")
[ "$source_revision" = "$restore_revision" ] || {{ echo "Restored Alembic revision differs" >&2; exit 1; }}

echo "tables=$(printf '%s\\n' "$source_tables" | sed '/^$/d' | wc -l | tr -d ' ')"
echo "alembic_revision=$source_revision"
'''

    result = subprocess.run(
        compose_command(
            env_file,
            compose_file,
            "exec",
            "-T",
            args.service,
            "sh",
            "-lc",
            script,
        ),
        check=True,
        text=True,
        capture_output=True,
    )
    print("Phase 5E PostgreSQL backup/restore verification passed.")
    print(result.stdout.strip())
    print("The source database was not modified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
