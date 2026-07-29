# Architecture

## System overview

My Digital Twin is a user-scoped multi-agent personal operating system. Four specialist twins—Career, Finance, Health, and Learning—write domain data to PostgreSQL and contribute context to shared orchestration, memory, planning, reflection, progress, and notification services.

```text
Browser / Chrome extension
          |
          v
Next.js frontend (port 3000)
          |
          v
FastAPI /api/v1 (port 8000)
  |       |        |        |
Career  Finance  Health  Learning
  \       |        |       /
   Shared context, memory, reasoning,
   plans, reflections, progress, brief
                    |
                    v
             PostgreSQL 17
```

## Frontend

The Next.js App Router application contains:

- Public landing, registration, and login pages.
- Twin Hub and Personal HQ navigation.
- Career workflows for jobs, applications, resumes, interviews, roadmaps, intelligence, and chat.
- Finance workflows for transactions, savings, investments, analytics, insights, memory, and chat.
- Health workflows for habits, diet planning, memory, insights, dashboard, and chat.
- Learning workflows for goals, roadmap, resources, progress, next task, memory, insights, and chat.
- Cross-twin pages for Digital Twin Advisor, Personal Memory, Daily Brief, Journal, Notifications, Agent Memory, Agent Plans, Agent Reflections, Predictive Insights, and Progress Center.

The shared API client sends credentials, supports token refresh, and migrates `/api/...` calls to canonical `/api/v1/...` routes.

## Backend

FastAPI registers authenticated domain routers twice during the API migration period:

- Canonical routes under `/api/v1/...`.
- Deprecated compatibility aliases under `/api/...` when enabled.

Infrastructure endpoints are registered separately:

- `/live` confirms that the process can respond.
- `/health` returns service-health metadata.
- `/ready` verifies database, migrations, ownership constraints, optimized schema, and required configuration.
- `/api/v1/system/diagnostics` provides authenticated operational detail.

## Data and ownership

SQLAlchemy models use PostgreSQL in production and Alembic for schema evolution. Persistent user-owned records include a non-null `user_id` foreign key with cascade behavior. Authentication dependencies and query scoping prevent one user from accessing another user's domain data.

Current Alembic head:

```text
20260723_0003
```

## Authentication

- Passwords are hashed with Argon2 through `pwdlib`.
- Short-lived access tokens and longer-lived refresh tokens use JWT.
- Browser tokens are delivered through HttpOnly cookies.
- Production cookies require HTTPS when `AUTH_COOKIE_SECURE=true`.
- The refresh-cookie path is `/api`, covering canonical and compatibility authentication routes.

## AI boundary

AI features call OpenAI through a lazy client so non-AI features can start when no API key is configured. Tests mock external AI calls. Readiness can treat AI as optional or required through `READINESS_REQUIRE_AI`.

## Container topology

Local production simulation uses Docker Compose:

```text
frontend -> backend -> database
```

The database network is internal. Application containers run as non-root users with health checks. Release deployment uses prebuilt GHCR images and takes a PostgreSQL backup before the backend can run migrations.

## Delivery pipeline

- Quality workflow: tests, coverage, typecheck, lint, build, PostgreSQL migrations, extension validation, and Docker Compose smoke test.
- Security workflow: Gitleaks, pip-audit, npm audit, Trivy scans, image scans, and SBOMs.
- Release workflow: version validation, multi-platform image publication, attestations, manifest, and deployment bundle.
- Deployment workflow: GitHub Environment approval, self-hosted runner, backup, migration-safe deployment, smoke tests, and rollback state.
- Final readiness workflow: repository policy, documentation, runtime end-to-end checks, backup/restore, and rollback-plan validation.
