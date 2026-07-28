# Phase 5B Docker environment

This stack is a local production simulation composed of:

- PostgreSQL 17
- FastAPI running as a non-root Linux user
- Next.js standalone server running as a non-root Linux user
- Automatic Alembic migration execution before the API starts
- Container health checks and restart policies
- A private internal network between PostgreSQL and the API

## Prerequisites

Install Docker Desktop and make sure Linux containers and Docker Compose are available.

## Configure

From the repository root:

```powershell
Copy-Item .env.docker.example .env.docker
python -c "import secrets; print(secrets.token_hex(32))"
```

Put the generated value in `JWT_SECRET_KEY`.

Replace `CHANGE_ME_USE_A_LONG_URL_SAFE_PASSWORD` in both:

- `POSTGRES_PASSWORD`
- `BACKEND_DATABASE_URL`

Use the same URL-safe password in both locations. Do not commit `.env.docker`.

## Start

```powershell
docker compose --env-file .env.docker config --quiet
docker compose --env-file .env.docker up --build -d
docker compose --env-file .env.docker ps
```

Open:

- Frontend: `http://localhost:3000`
- Backend readiness: `http://localhost:8000/ready`
- Canonical API docs: `http://localhost:8000/api/v1/docs`

## Verify

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m app.container.runtime_verify
cd ..
```

Confirm both application containers are non-root:

```powershell
docker compose --env-file .env.docker exec -T backend id -u
docker compose --env-file .env.docker exec -T frontend id -u
```

Both values must be nonzero.

Confirm Alembic is at the current head:

```powershell
docker compose --env-file .env.docker exec -T backend alembic current --check-heads
```

## Logs

```powershell
docker compose --env-file .env.docker logs -f backend
docker compose --env-file .env.docker logs -f frontend
docker compose --env-file .env.docker logs -f database
```

## Stop without deleting data

```powershell
docker compose --env-file .env.docker down
```

## Reset the local container database

This permanently deletes only the Docker-managed PostgreSQL volume:

```powershell
docker compose --env-file .env.docker down --volumes
```

It does not alter the PostgreSQL service installed directly on Windows.

## Production notes

This Compose file is for local production simulation. Before public deployment:

- Use a managed secret store instead of an environment file.
- Set `AUTH_COOKIE_SECURE=true` behind HTTPS.
- Replace localhost URLs with public frontend and API URLs.
- Disable legacy API routes after clients finish migrating.
- Consider a separate migration identity and restricted runtime database role.
- Use managed PostgreSQL backups and monitoring.
