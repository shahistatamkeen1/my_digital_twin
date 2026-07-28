#!/bin/sh
set -eu

is_true() {
  case "${1:-}" in
    1|true|TRUE|yes|YES|on|ON) return 0 ;;
    *) return 1 ;;
  esac
}

echo "Validating container environment..."
python -m app.container.validate_environment

echo "Waiting for the database..."
python -m app.container.wait_for_database

if is_true "${CONTAINER_RUN_MIGRATIONS:-true}"; then
  echo "Applying Alembic migrations..."
  alembic upgrade head
  alembic current --check-heads
else
  echo "Skipping Alembic migrations because CONTAINER_RUN_MIGRATIONS is false."
fi

echo "Starting My Digital Twin API..."
exec "$@"
