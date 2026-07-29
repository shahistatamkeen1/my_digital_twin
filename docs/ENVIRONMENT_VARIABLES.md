# Environment Variable Inventory

This inventory is generated from the committed environment templates. Never commit real values.

| Variable | Scope | Sensitive | Description | Template sources |
|---|---|---:|---|---|
| `ACCESS_COOKIE_NAME` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `ADZUNA_APP_ID` | Deployment | No | Optional Adzuna application identifier for job discovery. | `.env.docker.example`<br>`backend/.env.example`<br>`deploy/.env.release.example` |
| `ADZUNA_APP_KEY` | Deployment | Yes | Optional Adzuna credential for job discovery. | `.env.docker.example`<br>`backend/.env.example`<br>`deploy/.env.release.example` |
| `API_CURRENT_VERSION` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `API_DEFAULT_PAGE_SIZE` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `API_DOCS_ENABLED` | Deployment | No | Enable Swagger, ReDoc, and OpenAPI endpoints. | `.env.docker.example`<br>`backend/.env.example`<br>`deploy/.env.release.example` |
| `API_DOCS_PATH` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `API_MAX_PAGE_SIZE` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `API_OPENAPI_PATH` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `API_REDOC_PATH` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `API_V1_PREFIX` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `API_VERSION_HEADER` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `APP_NAME` | Backend/local development | No | Human-readable FastAPI application name. | `backend/.env.example` |
| `APP_VERSION` | Deployment | No | Release version exposed by runtime metadata and health endpoints. | `.env.docker.example`<br>`backend/.env.example`<br>`deploy/.env.release.example` |
| `AUTH_COOKIE_DOMAIN` | Deployment | No | Optional shared cookie domain for deployed environments. | `.env.docker.example`<br>`backend/.env.example`<br>`deploy/.env.release.example` |
| `AUTH_COOKIE_SAMESITE` | Deployment | No | SameSite policy for authentication cookies. | `.env.docker.example`<br>`backend/.env.example`<br>`deploy/.env.release.example` |
| `AUTH_COOKIE_SECURE` | Deployment | No | Require HTTPS-only authentication cookies in production. | `.env.docker.example`<br>`backend/.env.example`<br>`deploy/.env.release.example` |
| `AUTO_CREATE_TABLES` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `BACKEND_BIND_ADDRESS` | Deployment | No | Runtime configuration documented in the committed environment templates. | `deploy/.env.release.example` |
| `BACKEND_DATABASE_URL` | Deployment | Yes | Container-oriented PostgreSQL SQLAlchemy connection string. | `.env.docker.example`<br>`deploy/.env.release.example` |
| `BACKEND_IMAGE` | Deployment | No | Published backend OCI image reference used by release Compose. | `deploy/.env.release.example` |
| `BACKEND_PORT` | Deployment | No | Runtime configuration documented in the committed environment templates. | `.env.docker.example`<br>`deploy/.env.release.example` |
| `COMPOSE_PROJECT_NAME` | Deployment | No | Compose project name used to isolate environment resources. | `deploy/.env.release.example` |
| `CONTAINER_DB_WAIT_INTERVAL_SECONDS` | Deployment | No | Runtime configuration documented in the committed environment templates. | `.env.docker.example`<br>`backend/.env.example`<br>`deploy/.env.release.example` |
| `CONTAINER_DB_WAIT_TIMEOUT_SECONDS` | Deployment | No | Runtime configuration documented in the committed environment templates. | `.env.docker.example`<br>`backend/.env.example`<br>`deploy/.env.release.example` |
| `CONTAINER_RUN_MIGRATIONS` | Deployment | No | Run Alembic upgrade before the backend starts in a container. | `.env.docker.example`<br>`backend/.env.example`<br>`deploy/.env.release.example` |
| `CORS_ORIGINS` | Deployment | No | Comma-separated browser origins allowed to call the backend. | `.env.docker.example`<br>`backend/.env.example`<br>`deploy/.env.release.example` |
| `DATABASE_MAX_OVERFLOW` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `DATABASE_POOL_RECYCLE_SECONDS` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `DATABASE_POOL_SIZE` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `DATABASE_POOL_TIMEOUT_SECONDS` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `DATABASE_URL` | Backend/local development | Yes | SQLAlchemy database connection string used by the backend. | `backend/.env.example` |
| `DATA_NETWORK_NAME` | Deployment | No | Runtime configuration documented in the committed environment templates. | `deploy/.env.release.example` |
| `DEPLOY_ENVIRONMENT` | Deployment | No | Deployment environment label, usually staging or production. | `deploy/.env.release.example` |
| `DEPLOY_STATE_DIR` | Deployment | No | Runtime configuration documented in the committed environment templates. | `deploy/.env.release.example` |
| `EDGE_NETWORK_NAME` | Deployment | No | Runtime configuration documented in the committed environment templates. | `deploy/.env.release.example` |
| `ENABLE_LEGACY_API_ROUTES` | Deployment | No | Keep deprecated /api aliases available while clients migrate to /api/v1. | `.env.docker.example`<br>`backend/.env.example`<br>`deploy/.env.release.example` |
| `ENVIRONMENT` | Backend/local development | No | Runtime environment name such as development, test, staging, or production. | `backend/.env.example` |
| `EXPOSE_INTERNAL_ERROR_DETAILS` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `FRONTEND_BIND_ADDRESS` | Deployment | No | Runtime configuration documented in the committed environment templates. | `deploy/.env.release.example` |
| `FRONTEND_IMAGE` | Deployment | No | Published frontend OCI image reference used by release Compose. | `deploy/.env.release.example` |
| `FRONTEND_PORT` | Deployment | No | Runtime configuration documented in the committed environment templates. | `.env.docker.example`<br>`deploy/.env.release.example` |
| `JWT_ALGORITHM` | Deployment | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example`<br>`deploy/.env.release.example` |
| `JWT_SECRET_KEY` | Deployment | Yes | Secret used to sign access and refresh tokens; use at least 32 random characters. | `.env.docker.example`<br>`backend/.env.example`<br>`deploy/.env.release.example` |
| `LEGACY_API_SUNSET` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `LOG_FORMAT` | Deployment | No | Runtime configuration documented in the committed environment templates. | `.env.docker.example`<br>`backend/.env.example`<br>`deploy/.env.release.example` |
| `LOG_LEVEL` | Deployment | No | Runtime configuration documented in the committed environment templates. | `.env.docker.example`<br>`backend/.env.example`<br>`deploy/.env.release.example` |
| `MONITORING_CACHE_TTL_SECONDS` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `MONITORING_DISK_CRITICAL_PERCENT` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `MONITORING_DISK_WARNING_PERCENT` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `MONITORING_INCLUDE_PROCESS_METRICS` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `MONITORING_MEMORY_WARNING_PERCENT` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `NEXT_PUBLIC_API_URL` | Docker/local production | No | Backend base URL compiled into the Next.js client bundle. | `.env.docker.example`<br>`frontend/.env.example` |
| `NEXT_PUBLIC_API_USE_VERSIONED_ROUTES` | Docker/local production | No | Runtime configuration documented in the committed environment templates. | `.env.docker.example`<br>`frontend/.env.example` |
| `NEXT_PUBLIC_API_VERSION` | Docker/local production | No | Runtime configuration documented in the committed environment templates. | `.env.docker.example`<br>`frontend/.env.example` |
| `OPENAI_API_KEY` | Deployment | Yes | Optional OpenAI credential for AI-powered features. | `.env.docker.example`<br>`backend/.env.example`<br>`deploy/.env.release.example` |
| `OPENAI_MODEL` | Deployment | No | Runtime configuration documented in the committed environment templates. | `.env.docker.example`<br>`backend/.env.example`<br>`deploy/.env.release.example` |
| `OPENAI_TIMEOUT_SECONDS` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `OPENAPI_CONTACT_EMAIL` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `OPENAPI_CONTACT_NAME` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `OPENAPI_LICENSE_NAME` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `POSTGRES_DB` | Deployment | No | PostgreSQL database name. | `.env.docker.example`<br>`deploy/.env.release.example` |
| `POSTGRES_PASSWORD` | Deployment | Yes | PostgreSQL application-role password. | `.env.docker.example`<br>`deploy/.env.release.example` |
| `POSTGRES_USER` | Deployment | No | PostgreSQL application role. | `.env.docker.example`<br>`deploy/.env.release.example` |
| `POSTGRES_VOLUME_NAME` | Deployment | No | Runtime configuration documented in the committed environment templates. | `deploy/.env.release.example` |
| `PUBLIC_API_BASE_URL` | Deployment | No | Public backend base URL used in OpenAPI metadata and release builds. | `.env.docker.example`<br>`backend/.env.example`<br>`deploy/.env.release.example` |
| `PUBLIC_FRONTEND_URL` | Deployment | No | Public HTTPS address of the deployed frontend. | `deploy/.env.release.example` |
| `READINESS_REQUIRE_AI` | Deployment | No | Make OpenAI configuration a readiness requirement. | `.env.docker.example`<br>`backend/.env.example`<br>`deploy/.env.release.example` |
| `READINESS_REQUIRE_AUTH` | Deployment | No | Make valid authentication configuration a readiness requirement. | `.env.docker.example`<br>`backend/.env.example`<br>`deploy/.env.release.example` |
| `REFRESH_COOKIE_NAME` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `REFRESH_COOKIE_PATH` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |
| `REQUEST_ID_HEADER` | Backend/local development | No | Runtime configuration documented in the committed environment templates. | `backend/.env.example` |

## Handling rules

- Put passwords, tokens, API keys, and database URLs containing credentials in secret stores.
- Repository variables are appropriate only for non-sensitive values such as public URLs.
- Production browser URLs must use HTTPS; `localhost` values are for local validation only.
- Rotate any credential that has appeared in a screenshot, terminal log, commit, or chat message.
