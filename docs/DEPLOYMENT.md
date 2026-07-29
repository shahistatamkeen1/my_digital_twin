# Phase 5D deployment runbook

The deployment workflow is provider-neutral. It uses a Linux self-hosted GitHub
Actions runner on the target host and GitHub Environments for approvals and
environment-scoped secrets.

## Target host prerequisites

Install:

- Docker Engine
- Docker Compose v2
- Python 3
- A GitHub Actions self-hosted runner

Assign these runner labels:

```text
self-hosted
linux
x64
my-digital-twin
```

Place an HTTPS reverse proxy or managed load balancer in front of the local
frontend and backend ports. The release Compose file binds both services to
`127.0.0.1` by default.

## GitHub Environments

Create two environments:

```text
staging
production
```

For production, enable required reviewers and prevent self-approval where
available.

Add these environment secrets:

```text
POSTGRES_PASSWORD
JWT_SECRET_KEY
OPENAI_API_KEY       # optional
ADZUNA_APP_ID        # optional
ADZUNA_APP_KEY       # optional
```

`POSTGRES_PASSWORD` must contain at least 24 URL-safe characters. Generate one
with:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Add these environment variables:

```text
PUBLIC_FRONTEND_URL
PUBLIC_API_BASE_URL
COMPOSE_PROJECT_NAME
POSTGRES_DB
POSTGRES_USER
CORS_ORIGINS
AUTH_COOKIE_DOMAIN
BACKEND_BIND_ADDRESS
BACKEND_PORT
FRONTEND_BIND_ADDRESS
FRONTEND_PORT
OPENAI_MODEL
ENABLE_LEGACY_API_ROUTES
API_DOCS_ENABLED
DEPLOY_STATE_DIR
DEPLOY_BACKUP_DIR
```

Recommended production values:

```text
BACKEND_BIND_ADDRESS=127.0.0.1
FRONTEND_BIND_ADDRESS=127.0.0.1
AUTH_COOKIE_DOMAIN=.example.com
ENABLE_LEGACY_API_ROUTES=true
API_DOCS_ENABLED=false
```

## Deploy

Open **Actions → Deploy or roll back release → Run workflow**.

Choose:

```text
environment: staging
operation: deploy
version: 0.5.4
```

After staging validation, repeat with `production`.

The deployment script:

1. Validates the release Compose configuration.
2. Pulls versioned images from GHCR.
3. Starts PostgreSQL.
4. Waits for database health.
5. Creates a pre-deployment custom-format `pg_dump`.
6. Starts the backend, which applies Alembic migrations.
7. Starts the frontend.
8. Runs readiness, version, migration, and non-root checks.
9. Stores current and previous image state outside the repository.

Default state and backup locations:

```text
~/.my-digital-twin/releases
~/.my-digital-twin/backups/<compose-project>
```

Set `DEPLOY_STATE_DIR` and `DEPLOY_BACKUP_DIR` to persistent protected
locations on the runner host when needed.

## Manual deployment on a Linux host

Copy `deploy/.env.release.example` to `deploy/.env.release`, replace all
placeholders, and run:

```bash
docker login ghcr.io
sh scripts/deploy/deploy.sh \
  --env-file deploy/.env.release \
  --backend-url https://api.example.com \
  --frontend-url https://example.com \
  --expected-version 0.5.4
```

The private environment file is ignored by Git.

## Operational checks

```bash
docker compose \
  --env-file deploy/.env.release \
  -f deploy/docker-compose.release.yml \
  ps
```

```bash
python3 scripts/release/smoke_test.py \
  --backend-url https://api.example.com \
  --frontend-url https://example.com \
  --expected-version 0.5.4
```

## PostgreSQL backups

The deployment script creates a backup before the new backend can run
migrations. Test restoration procedures separately. A backup that has never
been restored in a test environment is not a verified recovery plan.
