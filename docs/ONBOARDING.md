# Developer Onboarding

## Prerequisites

- Git
- Python 3.11
- Node.js 22 and npm
- PostgreSQL 17 for direct local development
- Docker Desktop with the WSL 2 Linux engine for production simulation

## Clone and branch

```powershell
git clone <repository-url>
cd my_digital_twin
git switch -c feature/<short-name>
```

## Backend setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements-dev.txt
Copy-Item .env.example .env
```

Set a local PostgreSQL `DATABASE_URL`, generate a JWT secret, and optionally add OpenAI and Adzuna credentials. Never commit `backend/.env`.

Apply migrations and start FastAPI:

```powershell
alembic upgrade head
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## Frontend setup

```powershell
cd ..\frontend
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Docker setup

```powershell
cd ..
Copy-Item .env.docker.example .env.docker
# Replace every CHANGE_ME value.
docker compose --env-file .env.docker up --build -d
docker compose --env-file .env.docker ps
```

Do not run manual servers and Docker services simultaneously because both use ports 3000 and 8000.

## Quality checks

Backend:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m ruff check main.py app tests
pytest -q
```

Frontend:

```powershell
cd frontend
npm run typecheck
npm run lint
npm run build
```

Final repository checks:

```powershell
python scripts\production\validate_repository.py
python scripts\production\render_environment_inventory.py --check
```

## Database changes

1. Update SQLAlchemy models.
2. Generate an Alembic revision.
3. Review the generated SQL carefully.
4. Test upgrade, downgrade, and re-upgrade against disposable PostgreSQL.
5. Never use `Base.metadata.create_all()` for production migration management.

## Pull-request expectations

- No private environment files, local databases, caches, build output, or backups.
- Tests and documentation updated with behavior changes.
- Canonical `/api/v1` contracts remain compatible unless a reviewed breaking version is introduced.
- Security findings are fixed or documented through a narrow, reviewed policy exception.
