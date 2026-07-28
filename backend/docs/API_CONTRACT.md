# My Digital Twin API Contract

## Canonical API

The supported application contract is `/api/v1/...`. Existing `/api/...`
routes remain available as deprecated compatibility aliases until the configured
sunset date.

| Resource | Location |
|---|---|
| Full Swagger UI | `/docs` |
| Full ReDoc | `/redoc` |
| Full OpenAPI JSON | `/openapi.json` |
| Canonical v1 Swagger UI | `/api/v1/docs` |
| Canonical v1 ReDoc | `/api/v1/redoc` |
| Canonical v1 OpenAPI JSON | `/api/v1/openapi.json` |

The canonical documents exclude deprecated legacy paths. The full documents
retain them so older clients can be inspected and migrated safely.

## Authentication

Protected endpoints accept either of these alternatives:

1. `Authorization: Bearer <access-token>`
2. The HttpOnly access-token cookie issued by registration or login

The refresh endpoint uses only the HttpOnly refresh-token cookie. The auth
status endpoint supports anonymous requests and returns the current user when a
valid access token is available.

## Standard errors

Every handled failure follows the `ApiErrorResponse` schema:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted data is invalid.",
    "details": []
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "detail": "The submitted data is invalid.",
  "message": "The submitted data is invalid."
}
```

`detail` and `message` are temporary compatibility fields. New consumers should
use `error.code`, `error.message`, `error.details`, and `meta.request_id`.

## Request tracing

Every response documents and returns the configured request-ID header, which is
`X-Request-ID` by default. Supply a valid request ID to correlate a browser
request with backend logs, or allow the API to generate one.

## Pagination compatibility

Selected collection endpoints preserve array responses when `page` and
`page_size` are absent. Supplying either parameter enables the paginated body:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 0,
    "total_pages": 0,
    "has_next": false,
    "has_previous": false
  }
}
```

Pagination metadata is also exposed through `X-Total-Count`, `X-Page`,
`X-Page-Size`, `X-Total-Pages`, `X-Pagination-Mode`, and `Link` headers.

## Legacy lifecycle

Legacy operations are marked `deprecated: true` and include:

- `x-successor-version`
- `x-sunset`
- `Deprecation`, `Sunset`, and `Link` response headers

Runtime responses continue to include the Phase 4B deprecation headers.

## Exporting contracts

From the backend directory:

```powershell
python -m app.migrations.phase4e_export_contracts --output-dir docs/generated
```

The command writes:

- `openapi-full.json`
- `openapi-v1.json`
- `route-inventory.json`
- `API_ROUTE_INVENTORY.md`

Generated contracts are build artifacts. CI exports and uploads them for every
backend contract run. Regenerate them whenever an API route, schema, security
rule, version, or lifecycle setting changes.

## Contract verification

Run the focused Phase 4E verifier:

```powershell
python -m app.migrations.phase4e_smoke_test
```

Run the complete backend contract suite:

```powershell
pytest -q
```

With FastAPI running locally:

```powershell
python -m app.migrations.phase4e_runtime_verify
```
