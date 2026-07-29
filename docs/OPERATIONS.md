# Operations Runbook

## Start and stop the local production stack

```powershell
docker compose --env-file .env.docker up -d
docker compose --env-file .env.docker ps
```

Stop while preserving PostgreSQL data:

```powershell
docker compose --env-file .env.docker down
```

Do not add `--volumes` unless deleting the Docker database is intentional.

## Service checks

```text
Frontend:  http://localhost:3000
Liveness:  http://localhost:8000/live
Readiness: http://localhost:8000/ready
API docs:  http://localhost:8000/api/v1/docs
```

All three Compose services should be `healthy`.

## Logs

```powershell
docker compose --env-file .env.docker logs --tail 200 backend
docker compose --env-file .env.docker logs --tail 200 frontend
docker compose --env-file .env.docker logs --tail 200 database
```

Add `-f` to follow logs. `Ctrl+C` stops log viewing without stopping containers.

## Migrations

```powershell
docker compose --env-file .env.docker exec -T backend alembic current --check-heads
```

Expected head:

```text
20260729_0005
```

## Backup and restore verification

The Phase 5E test creates a custom-format PostgreSQL dump, restores it into a temporary database, compares table inventories and row counts, verifies the Alembic revision, then deletes the temporary database.

```powershell
python scripts\production\backup_restore_test.py
```

The source database is not modified.

## End-to-end verification

```powershell
python scripts\production\end_to_end_verify.py `
  --expected-version (Get-Content VERSION).Trim()
```

## Resource monitoring

Use authenticated `/api/v1/system/diagnostics` for database latency, connection pool status, memory, disk, uptime, migration state, and configuration readiness. Do not expose detailed diagnostics publicly without authentication.

## Routine maintenance

- Review Dependabot pull requests weekly.
- Review Gitleaks, pip-audit, npm audit, and Trivy results on every dependency change.
- Test PostgreSQL restore procedures periodically.
- Rotate JWT, database, OpenAI, and Adzuna credentials according to organizational policy.
- Keep `PUBLIC_API_BASE_URL`, CORS origins, and cookie settings aligned with the deployed domains.
