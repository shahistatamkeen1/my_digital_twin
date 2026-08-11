# Agent approval foundation

Phase 6D1 adds durable, user-owned approval records for consequential agent
actions. It establishes the persistence and API layer that Phase 6D2 will use
to pause and resume workflows.

## Supported action types

- `send_email`
- `create_calendar_event`
- `submit_application`
- `delete_data`
- `change_financial_plan`
- `external_action`
- `other`

## Approval lifecycle

```text
pending
├── approved
├── rejected
├── cancelled
└── expired
```

Only a pending approval can receive a decision. Every transition creates an
immutable `agent_approval_events` audit record.

## Canonical APIs

```text
POST /api/v1/approvals/
GET  /api/v1/approvals/
GET  /api/v1/approvals/{approval_id}
POST /api/v1/approvals/{approval_id}/approve
POST /api/v1/approvals/{approval_id}/reject
POST /api/v1/approvals/{approval_id}/cancel
```

The list endpoint supports search, filtering by status, action type and run,
sorting, and page-based pagination.

## Ownership and privacy

Both approval requests and audit events inherit the platform's mandatory
user-ownership model. Cross-user reads and decisions return `404` rather than
revealing whether another user's approval exists.

## Payload preservation

`proposed_payload` remains unchanged after a decision. An edited approval is
stored separately as `decision_payload`, preserving the original proposal for
auditability.

## Phase boundary

Phase 6D1 does not pause or resume agent execution. Durable execution
checkpoints and `awaiting_approval` workflow states are introduced in Phase
6D2.
