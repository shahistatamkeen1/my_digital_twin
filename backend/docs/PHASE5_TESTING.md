# Phase 5 testing foundation

## Local backend checks

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
python -m compileall -q .
python -m ruff check main.py app tests
python -m pytest --cov=app --cov-branch --cov-report=term-missing --cov-report=xml --cov-fail-under=20
```

The pytest bootstrap always overrides `DATABASE_URL` with a disposable SQLite
file under `backend/.test_artifacts`. It never reads or modifies the local
PostgreSQL database.

## Frontend checks

```powershell
cd frontend
npm ci
npm run quality
```

## PostgreSQL migration gate

GitHub Actions creates a temporary PostgreSQL service, upgrades to the Alembic
head, checks for model drift, verifies schema behaviour, downgrades to revision
`20260722_0002`, and upgrades to head again.
