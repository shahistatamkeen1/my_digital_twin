# Phase 6C — Multi-Agent Workspace UI

Phase 6C connects the authenticated Next.js frontend to the Phase 6A and 6B
agent-orchestration APIs.

## User workflow

1. Enter a cross-domain goal.
2. Optionally mark twins that must be included.
3. Create a persistent workflow plan.
4. Review automatic routing and ordered steps.
5. Choose deterministic or configured-AI execution.
6. Execute, monitor, cancel, retry, or delete the workflow.
7. Review unified synthesis, domain contributions, risks, weekly actions,
   success metrics, and telemetry.
8. Search and paginate user-owned workflow history.

## Frontend modules

- `frontend/types/agent-runs.ts`
- `frontend/lib/agent-runs.ts`
- `frontend/components/orchestration/`
- `frontend/app/digital-twin-advisor/page.tsx`

## Security and privacy

The browser never receives raw cross-domain context. Context loading and
isolation remain server-side. The UI displays only the persisted run contract,
non-sensitive context manifests, results, errors, and usage telemetry returned
for the authenticated user.

The API client uses the existing secure cookie session, automatic refresh flow,
versioned API routing, request IDs, and standard error contract.

## Execution modes

- **Deterministic:** local, repeatable, and token-free; intended for testing.
- **Configured AI:** uses the backend's configured AI provider.
- **Parallel:** the default for multi-agent workflows.
- **Sequential:** explicitly selectable when ordered execution is desired.

The backend remains the authority for provider availability, retry limits,
timeouts, ownership, cancellation, and allowed status transitions.
