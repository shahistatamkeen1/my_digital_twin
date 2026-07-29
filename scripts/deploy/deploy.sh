#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
COMPOSE_FILE="$ROOT_DIR/deploy/docker-compose.release.yml"
ENV_FILE="$ROOT_DIR/deploy/.env.release"
BACKEND_URL=""
FRONTEND_URL=""
EXPECTED_VERSION=""
TIMEOUT_SECONDS=420

usage() {
  cat <<'EOF'
Usage:
  deploy.sh --env-file PATH --backend-url URL --frontend-url URL \
    --expected-version VERSION [--compose-file PATH] [--timeout-seconds N]
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --env-file) ENV_FILE=$2; shift 2 ;;
    --compose-file) COMPOSE_FILE=$2; shift 2 ;;
    --backend-url) BACKEND_URL=$2; shift 2 ;;
    --frontend-url) FRONTEND_URL=$2; shift 2 ;;
    --expected-version) EXPECTED_VERSION=$2; shift 2 ;;
    --timeout-seconds) TIMEOUT_SECONDS=$2; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

[ -f "$ENV_FILE" ] || { echo "Environment file not found: $ENV_FILE" >&2; exit 1; }
[ -f "$COMPOSE_FILE" ] || { echo "Compose file not found: $COMPOSE_FILE" >&2; exit 1; }
[ -n "$BACKEND_URL" ] || { echo "--backend-url is required" >&2; exit 2; }
[ -n "$FRONTEND_URL" ] || { echo "--frontend-url is required" >&2; exit 2; }
[ -n "$EXPECTED_VERSION" ] || { echo "--expected-version is required" >&2; exit 2; }

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

docker version >/dev/null
docker compose version >/dev/null
compose config --quiet

env_value() {
  python3 - "$ENV_FILE" "$1" <<'PY'
import sys
path, key = sys.argv[1:]
value = ""
with open(path, encoding="utf-8") as handle:
    for raw in handle:
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, candidate = line.split("=", 1)
        if name.strip() == key:
            value = candidate.strip()
            break
print(value)
PY
}

file_state_dir=$(env_value DEPLOY_STATE_DIR)
STATE_DIR=${DEPLOY_STATE_DIR:-${file_state_dir:-"$HOME/.my-digital-twin/releases"}}
mkdir -p "$STATE_DIR"
chmod 700 "$STATE_DIR" 2>/dev/null || true

PROJECT_NAME=$(compose config --format json | python3 -c \
  'import json,sys; print(json.load(sys.stdin).get("name","my-digital-twin-release"))')
CURRENT_STATE="$STATE_DIR/${PROJECT_NAME}-current.json"
PREVIOUS_STATE="$STATE_DIR/${PROJECT_NAME}-previous.json"

existing_backend=$(compose ps -q backend 2>/dev/null || true)
existing_frontend=$(compose ps -q frontend 2>/dev/null || true)
previous_backend=""
previous_frontend=""
if [ -n "$existing_backend" ]; then
  previous_backend=$(docker inspect --format '{{.Config.Image}}' "$existing_backend" 2>/dev/null || true)
fi
if [ -n "$existing_frontend" ]; then
  previous_frontend=$(docker inspect --format '{{.Config.Image}}' "$existing_frontend" 2>/dev/null || true)
fi

if [ -n "$previous_backend" ] && [ -n "$previous_frontend" ]; then
  python3 - "$PREVIOUS_STATE" "$previous_backend" "$previous_frontend" <<'PY'
import json, sys
from datetime import datetime, timezone
path, backend, frontend = sys.argv[1:]
with open(path, "w", encoding="utf-8") as handle:
    json.dump(
        {
            "captured_at": datetime.now(timezone.utc).isoformat(),
            "backend_image": backend,
            "frontend_image": frontend,
        },
        handle,
        indent=2,
    )
    handle.write("\n")
PY
fi

compose pull
compose up -d database

deadline=$(( $(date +%s) + TIMEOUT_SECONDS ))
while :; do
  database_id=$(compose ps -q database)
  status=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$database_id")
  [ "$status" = "healthy" ] && break
  [ "$(date +%s)" -lt "$deadline" ] || {
    compose logs --no-color database >&2
    echo "Database did not become healthy." >&2
    exit 1
  }
  sleep 5
done

file_backup_dir=$(env_value DEPLOY_BACKUP_DIR)
BACKUP_DIR=${DEPLOY_BACKUP_DIR:-${file_backup_dir:-"$HOME/.my-digital-twin/backups/$PROJECT_NAME"}}
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR" 2>/dev/null || true
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
backup_file="$BACKUP_DIR/predeploy-$timestamp.dump"

# A custom-format PostgreSQL backup is taken before the new backend can run migrations.
compose exec -T database sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$backup_file"
chmod 600 "$backup_file" 2>/dev/null || true
echo "Pre-deployment database backup: $backup_file"

compose up -d --remove-orphans

if ! python3 "$ROOT_DIR/scripts/release/smoke_test.py" \
  --backend-url "$BACKEND_URL" \
  --frontend-url "$FRONTEND_URL" \
  --expected-version "$EXPECTED_VERSION" \
  --timeout-seconds "$TIMEOUT_SECONDS"; then
  compose ps >&2 || true
  compose logs --no-color --tail 200 backend frontend database >&2 || true
  echo "Deployment failed. Review logs before using rollback.sh." >&2
  exit 1
fi

compose exec -T backend alembic current --check-heads
test "$(compose exec -T backend id -u | tr -d '\r')" != "0"
test "$(compose exec -T frontend id -u | tr -d '\r')" != "0"

backend_id=$(compose ps -q backend)
frontend_id=$(compose ps -q frontend)
backend_image=$(docker inspect --format '{{.Config.Image}}' "$backend_id")
frontend_image=$(docker inspect --format '{{.Config.Image}}' "$frontend_id")

python3 - "$CURRENT_STATE" "$EXPECTED_VERSION" "$backend_image" "$frontend_image" "$backup_file" <<'PY'
import json, sys
from datetime import datetime, timezone
path, version, backend, frontend, backup = sys.argv[1:]
with open(path, "w", encoding="utf-8") as handle:
    json.dump(
        {
            "deployed_at": datetime.now(timezone.utc).isoformat(),
            "version": version,
            "backend_image": backend,
            "frontend_image": frontend,
            "predeploy_backup": backup,
        },
        handle,
        indent=2,
    )
    handle.write("\n")
PY

echo "Phase 5D deployment completed successfully."
echo "State file: $CURRENT_STATE"
