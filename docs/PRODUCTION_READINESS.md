# Production Readiness

## Release gates

A production release is eligible only when all applicable gates pass:

- Backend tests, coverage threshold, Ruff correctness checks, and OpenAPI contract export.
- PostgreSQL upgrade, model-drift check, downgrade, re-upgrade, and ownership/schema verification.
- Frontend TypeScript check, ESLint, and production build.
- Chrome extension manifest and JavaScript validation.
- Docker Compose production simulation with healthy non-root services.
- Gitleaks, pip-audit, npm audit, Trivy repository/config/image scans, and SBOM generation.
- Phase 5D release dry run.
- Phase 5E repository, environment inventory, end-to-end, backup/restore, and rollback-plan checks.

## Production-only requirements

- A real public HTTPS backend URL that resolves to the deployed FastAPI service.
- A real public HTTPS frontend URL.
- `PUBLIC_API_BASE_URL` set to the real backend base URL, without `/api` or `/docs` suffixes.
- Production PostgreSQL with persistent storage and tested backups.
- `AUTH_COOKIE_SECURE=true` and correct `AUTH_COOKIE_DOMAIN`/SameSite policy.
- CORS limited to known production frontend origins.
- Strong JWT and database secrets stored outside Git.
- OpenAI and Adzuna credentials stored as secrets when those integrations are enabled.
- Reverse proxy or load balancer with TLS, request-size limits, and access logging.
- Monitoring and alerting for readiness failures, error rate, latency, disk, memory, and backup failures.

## Current local status

The repository supports production-like local operation and release-pipeline validation. A successful dry run does not mean the application is publicly deployed. Publication and deployment remain separate, approval-controlled actions.

## Evidence

Store CI artifacts for:

- Coverage and API contracts.
- Security reports and SBOMs.
- Release manifests and deployment bundles.
- Final production-readiness reports.
