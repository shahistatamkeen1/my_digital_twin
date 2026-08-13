# Durable Workflow Pause and Resume

Phase 6D2 connects Phase 6D1 approvals to agent execution.

## Execution states

Agent runs may now move through:

- `planned`
- `running`
- `awaiting_approval`
- `resuming`
- `synthesizing`
- terminal states such as `completed`, `partially_completed`, `failed`, or `cancelled`

Approval-aware steps may use `awaiting_approval`, `approved`, `rejected`, and
`resuming` in addition to the existing step states.

## Requesting an approval gate

Approval gates are declared in the existing `AgentRunCreate.context` payload.
This keeps action intent explicit and prevents normal analysis from being
mistaken for an external side effect.

Example:

```json
{
  "goal": "Prepare a recruiter follow-up and interview plan",
  "preferred_agents": ["career", "learning"],
  "context": {
    "approval_actions": {
      "career": {
        "action_type": "send_email",
        "action_summary": "Send the prepared recruiter follow-up email",
        "proposed_payload": {
          "recipient": "recruiter@example.com",
          "subject": "Application follow-up"
        },
        "rejection_policy": "skip_and_continue",
        "expires_in_minutes": 60
      }
    }
  }
}
```

The first unresolved sensitive action creates an `AgentApproval` and an
`AgentCheckpoint`, then moves the workflow to `awaiting_approval`.

## Resume

After the approval is approved or rejected:

`POST /api/v1/agent-runs/{run_id}/resume`

The execution request used before the pause is reconstructed from the durable
checkpoint. No browser session or in-memory worker state is required.

A second resume request after the checkpoint is consumed is rejected.

## Rejection policies

- `skip_and_continue`: the gated step is recorded as skipped and remaining
  executable steps continue.
- `stop_workflow`: the workflow ends as cancelled.

## Timeline

`GET /api/v1/agent-runs/{run_id}/timeline`

returns the user-owned workflow audit timeline, including approval request,
pause, decision, resume, synthesis, completion, failure, and cancellation
events.

## Restart durability

Checkpoint state, approval state, execution parameters, rejection policy, and
audit events are stored in PostgreSQL. Restarting FastAPI, Docker, or the
browser does not erase the pending approval.
