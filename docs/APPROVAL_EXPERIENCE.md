# Phase 6D3 — Approval Inbox

Phase 6D3 turns the durable approval and checkpoint APIs into a complete
human-in-the-loop experience. Authenticated users can review every sensitive
agent action before it runs, preserve or edit the proposed payload, record an
auditable decision, and resume the paused workflow from its stored checkpoint.

## User flow

1. A workflow reaches an approval-gated step and changes to
   `awaiting_approval`.
2. The global Approvals navigation badge polls the user-owned pending count.
3. The Approval Inbox lists and filters pending and historical requests.
4. The detail drawer shows the exact proposal, workflow state, decision events,
   and durable workflow timeline.
5. The user approves, edits and approves, or rejects the request.
6. The frontend records the decision first, then calls the idempotent resume
   endpoint. If resume fails, the saved decision remains visible and a safe
   retry action is offered.

## Routes and clients

The authenticated UI is available at `/approvals`. It uses the existing
versioned API contracts:

```text
GET  /api/v1/approvals/
GET  /api/v1/approvals/{approval_id}
POST /api/v1/approvals/{approval_id}/approve
POST /api/v1/approvals/{approval_id}/reject
POST /api/v1/agent-runs/{run_id}/resume
GET  /api/v1/agent-runs/{run_id}/timeline
```

`frontend/lib/approvals.ts` and `frontend/lib/agent-runs.ts` own network access.
Shared TypeScript contracts live in `frontend/types/approvals.ts` and
`frontend/types/agent-runs.ts`.

## Safety and audit behavior

- The proposed payload is rendered verbatim as formatted JSON.
- Edit-and-approve validates that the replacement is a JSON object before it is
  sent as `decision_payload`.
- Rejection requires a user-facing note even though the API remains compatible
  with older clients where the note is optional.
- Decision persistence and resume are separate operations. The UI never implies
  that execution resumed when only the decision succeeded.
- Existing backend ownership checks, expiry handling, transition rules,
  checkpoint isolation, and resume idempotency remain authoritative.
- No database migration is required for Phase 6D3; it consumes the Phase 6D1
  and 6D2 schema at Alembic head `20260813_0007`.

## Responsive and accessible behavior

The inbox uses a multi-column desktop list and a single-column mobile layout.
The detail view is a right drawer on larger screens and a full-screen dialog on
mobile. It has a labelled dialog, Escape-to-close behavior, focus-visible
controls, status announcements, horizontally scrollable filter/navigation
strips, and safe-area padding for the mobile navigation.

## Verification

Run:

```bash
cd frontend
npm run verify:phase6d3
npm run typecheck
npm run lint
npm run build
```

The Phase 6D3 contract verifier checks required files, endpoint wiring,
decision modes, global provider integration, navigation badge, durable statuses,
and the current repository version.
