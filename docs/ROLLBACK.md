# Phase 5D rollback runbook

Rollback is a controlled operational action, not a substitute for a tested
database recovery plan.

## Important migration rule

`scripts/deploy/rollback.sh` changes the backend and frontend images only. It
sets `CONTAINER_RUN_MIGRATIONS=false` and never runs `alembic downgrade`.

Before rolling back, determine whether the previous application version is
compatible with the current database schema.

When the release included a backward-incompatible database migration:

1. Stop application traffic.
2. Restore the pre-deployment PostgreSQL backup into a recovery database.
3. Validate the restored database.
4. Point the application at the restored database or complete the approved
   production restore procedure.
5. Deploy the previous application images.

Do not blindly downgrade a live production database.

## GitHub rollback

Open **Actions → Deploy or roll back release → Run workflow**.

Choose:

```text
environment: production
operation: rollback
version: <version expected after rollback>
```

The workflow uses the previous image references recorded by the last
deployment on that self-hosted runner.

## Manual rollback

```bash
sh scripts/deploy/rollback.sh \
  --env-file deploy/.env.release \
  --backend-url https://api.example.com \
  --frontend-url https://example.com \
  --expected-version 0.5.2
```

The script fails when no previous deployment state exists.

## Post-rollback validation

Confirm:

```bash
python3 scripts/release/smoke_test.py \
  --backend-url https://api.example.com \
  --frontend-url https://example.com \
  --expected-version 0.5.2
```

Then check:

```bash
docker compose \
  --env-file deploy/.env.release \
  -f deploy/docker-compose.release.yml \
  ps
```

Record the incident, release version, image references, database state,
operator, timestamps, and reason for rollback.
