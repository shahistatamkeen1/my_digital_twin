# My Digital Twin

My Digital Twin is a multi-agent AI personal operating system that helps users manage career growth, finances, health, and learning through four specialist digital twins and a shared intelligence layer.

## Platform capabilities

### Career Twin

- Job discovery and matching
- Resume upload, analysis, tailoring, and ATS optimization
- Cover-letter generation
- Interview preparation
- Application tracking and Kanban pipeline
- Career memory, roadmap, profile, intelligence, and chat
- Browser-extension application autofill

### Finance Twin

- Income and expense tracking
- Category and expenditure analytics
- Savings goals and investment planning
- Financial memory, insights, dashboard, and chat

### Health Twin

- Habit, hydration, sleep, and workout tracking
- Personalized diet planning
- Health memory, wellness insights, dashboard, and chat

### Learning Twin

- Learning goals, roadmap, resources, and next-task planning
- Progress tracking and recommendations
- Learning memory, insights, dashboard, and chat

### Shared intelligence

- Digital Twin Advisor with cross-domain context
- Personal HQ and Personal Memory
- Daily brief and notifications
- Agent memory, profiles, plans, and reflections
- Progress Center, predictive insights, and Twin Journal
- Context-aware recommendations across all four twins
- Typed agent registry and deterministic cross-domain routing
- Persistent user-owned agent runs and per-agent execution steps

## Architecture

```text
Next.js + TypeScript frontend
            |
            v
FastAPI canonical /api/v1
            |
            v
Career | Finance | Health | Learning
            |
            v
Shared registry, persistent agent runs, routing,
context, reasoning, planning, reflection, progress,
brief, and notifications
            |
            v
PostgreSQL 17 + SQLAlchemy + Alembic
```

See [Architecture](docs/ARCHITECTURE.md) for system boundaries, authentication, ownership, API versioning, AI integration, and delivery architecture. See [Agent orchestration](docs/AGENT_ORCHESTRATION.md) for the Phase 6 workflow contract.

## Technology stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, React Markdown, Recharts
- **Backend:** FastAPI, Python, SQLAlchemy, Pydantic
- **Database:** PostgreSQL 17, Alembic
- **AI and integrations:** OpenAI API, Adzuna Jobs API
- **Delivery:** Docker, Docker Compose, GitHub Actions, GHCR
- **Security:** Argon2, JWT, HttpOnly cookies, Gitleaks, pip-audit, npm audit, Trivy, Dependabot, SBOMs

## Local development

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
Copy-Item .env.example .env
alembic upgrade head
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```powershell
cd frontend
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Docker production simulation

```powershell
Copy-Item .env.docker.example .env.docker
# Replace every CHANGE_ME value.
docker compose --env-file .env.docker up --build -d
docker compose --env-file .env.docker ps
```

Open:

- Frontend: `http://localhost:3000`
- Readiness: `http://localhost:8000/ready`
- Canonical API docs: `http://localhost:8000/api/v1/docs`

Stop while preserving PostgreSQL data:

```powershell
docker compose --env-file .env.docker down
```

See [Docker guide](docs/DOCKER.md) and [Operations runbook](docs/OPERATIONS.md).

## Testing and validation

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
npm run quality
```

Final readiness:

```powershell
python scripts\production\validate_repository.py
python scripts\production\render_environment_inventory.py --check
python scripts\production\end_to_end_verify.py --expected-version (Get-Content VERSION).Trim()
python scripts\production\backup_restore_test.py
```

## API and operations

- Canonical API: `/api/v1/...`
- Temporary deprecated compatibility routes: `/api/...`
- Liveness: `/live`
- Health: `/health`
- Readiness: `/ready`
- Canonical OpenAPI: `/api/v1/openapi.json`
- Canonical Swagger: `/api/v1/docs`
- Authenticated diagnostics: `/api/v1/system/diagnostics`

## CI/CD and security

The repository includes workflows for:

- Backend tests, coverage, API contracts, PostgreSQL migrations, frontend build, extension validation, and Docker Compose smoke testing
- Secret, dependency, repository, configuration, container-image, and SBOM security validation
- Versioned GHCR images, provenance attestations, release manifests, and deployment bundles
- GitHub Environment-controlled staging and production deployment
- End-to-end, backup/restore, rollback-plan, and final production-readiness validation

See:

- [Testing](backend/docs/PHASE5_TESTING.md)
- [Security](docs/SECURITY.md)
- [Release](docs/RELEASE.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Rollback](docs/ROLLBACK.md)
- [Production readiness](docs/PRODUCTION_READINESS.md)

## Environment configuration

Copy committed templates and keep real values private:

```text
backend/.env.example        -> backend/.env
frontend/.env.example       -> frontend/.env.local
.env.docker.example         -> .env.docker
deploy/.env.release.example -> deploy/.env.release
```

See the generated [environment variable inventory](docs/ENVIRONMENT_VARIABLES.md).

A published frontend image must use a real public HTTPS backend URL. `localhost` and example hostnames are valid only for local testing or dry runs.

## Release status

Current repository version: **0.6.1**

The project is production-ready at the repository and local production-simulation level. A real public deployment still requires owned HTTPS domains, production infrastructure, secret stores, backups, monitoring, and environment approvals.

## Portfolio summary

See [Portfolio and Recruiter Summary](docs/PORTFOLIO_SUMMARY.md) for concise technical highlights and interview discussion points.

## Phase 6B multi-agent execution

The persistent agent workflow API now supports bounded parallel or sequential
execution, per-agent context isolation, retries, partial completion,
cancellation checkpoints, token/latency telemetry, and unified synthesis.

Canonical endpoints:

```text
POST /api/v1/agent-runs/{run_id}/execute
POST /api/v1/agent-runs/{run_id}/cancel
```

See [Agent Execution Engine](docs/AGENT_EXECUTION.md).

## Phase 6C — Multi-Agent Mission Workspace

The authenticated Digital Twin Advisor now provides a complete orchestration
workspace for planning and executing Career, Finance, Health, and Learning
workflows. Users can review deterministic routing, monitor per-agent status,
cancel or retry runs, search workflow history, inspect unified synthesis, and
audit token, latency, provider, fallback, and estimated-cost telemetry.

See `docs/AGENT_ORCHESTRATION_UI.md` for the frontend architecture and workflow.
