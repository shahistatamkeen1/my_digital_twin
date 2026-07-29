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
  rollback.sh --env-file PATH --backend-url URL --frontend-url URL \
    --expected-version VERSION [--compose-file PATH] [--timeout-seconds N]

Rollback changes application images only. It never downgrades PostgreSQL.
Confirm schema compatibility or restore a database backup before continuing.
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
[ -n "$BACKEND_URL" ] || { echo "--backend-url is required" >&2; exit 2; }
[ -n "$FRONTEND_URL" ] || { echo "--frontend-url is required" >&2; exit 2; }
[ -n "$EXPECTED_VERSION" ] || { echo "--expected-version is required" >&2; exit 2; }

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

PROJECT_NAME=$(compose config --format json | python3 -c \
  'import json,sys; print(json.load(sys.stdin).get("name","my-digital-twin-release"))')
file_state_dir=$(python3 - "$ENV_FILE" <<'PY'
import sys
value = ""
with open(sys.argv[1], encoding="utf-8") as handle:
    for raw in handle:
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, candidate = line.split("=", 1)
        if key.strip() == "DEPLOY_STATE_DIR":
            value = candidate.strip()
            break
print(value)
PY
)
STATE_DIR=${DEPLOY_STATE_DIR:-${file_state_dir:-"$HOME/.my-digital-twin/releases"}}
PREVIOUS_STATE="$STATE_DIR/${PROJECT_NAME}-previous.json"
[ -f "$PREVIOUS_STATE" ] || {
  echo "Previous deployment state not found: $PREVIOUS_STATE" >&2
  exit 1
}

previous_backend=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["backend_image"])' "$PREVIOUS_STATE")
previous_frontend=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["frontend_image"])' "$PREVIOUS_STATE")

temp_env=$(mktemp)
trap 'rm -f "$temp_env"' EXIT
python3 - "$ENV_FILE" "$temp_env" "$previous_backend" "$previous_frontend" "$EXPECTED_VERSION" <<'PY'
import sys
source, target, backend, frontend, version = sys.argv[1:]
updates = {
    "BACKEND_IMAGE": backend,
    "FRONTEND_IMAGE": frontend,
    "APP_VERSION": version,
    "CONTAINER_RUN_MIGRATIONS": "false",
}
seen = set()
lines = []
with open(source, encoding="utf-8") as handle:
    for raw in handle:
        if "=" in raw and not raw.lstrip().startswith("#"):
            key = raw.split("=", 1)[0].strip()
            if key in updates:
                lines.append(f"{key}={updates[key]}\n")
                seen.add(key)
                continue
        lines.append(raw)
for key, value in updates.items():
    if key not in seen:
        lines.append(f"{key}={value}\n")
with open(target, "w", encoding="utf-8") as handle:
    handle.writelines(lines)
PY
chmod 600 "$temp_env"

docker compose --env-file "$temp_env" -f "$COMPOSE_FILE" pull backend frontend
docker compose --env-file "$temp_env" -f "$COMPOSE_FILE" up -d --no-deps backend
docker compose --env-file "$temp_env" -f "$COMPOSE_FILE" up -d --no-deps frontend

python3 "$ROOT_DIR/scripts/release/smoke_test.py" \
  --backend-url "$BACKEND_URL" \
  --frontend-url "$FRONTEND_URL" \
  --expected-version "$EXPECTED_VERSION" \
  --timeout-seconds "$TIMEOUT_SECONDS"

echo "Application-image rollback completed."
echo "PostgreSQL was not downgraded."
