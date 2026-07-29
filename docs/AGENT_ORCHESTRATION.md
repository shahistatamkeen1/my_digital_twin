# Agent Orchestration

## Phase 6A scope

Phase 6A establishes the persistent, typed foundation for coordinated Digital
Twin workflows. It does not execute OpenAI calls or replace the existing
Digital Twin Advisor.

## Registered agents

The central registry exposes four enabled definitions:

- `career` — jobs, resumes, interviews, applications, and career growth.
- `finance` — budgets, expenses, savings, affordability, and trade-offs.
- `health` — sleep, hydration, workouts, wellness, and sustainable routines.
- `learning` — skills, certifications, courses, study plans, and roadmaps.

Each definition declares supported tasks, required context, timeout, retry
limit, estimated cost category, and whether approval is required.

## Deterministic routing

Phase 6A routing uses explicit domain keywords plus optional user-selected
agents. It is deterministic, testable, and free of model cost.

- One selected agent uses `single_agent` mode.
- Multiple selected agents use `parallel_then_synthesize` mode.
- When no domain signal is detected, all enabled agents are selected as a safe
  cross-domain fallback.

AI-assisted routing and confidence scoring are deferred until a deterministic
baseline and evaluation dataset exist.

## Persistence model

### `agent_runs`

Stores the user goal, lifecycle status, execution mode, selected and preferred
agents, routing reason, request and result payloads, token/cost totals,
retry lineage, and timestamps.

### `agent_steps`

Stores the ordered work planned for each agent, including input/output payloads,
status, attempts, timeout, retry limit, approval policy, errors, and timestamps.

Both tables have mandatory `user_id` ownership, database foreign keys,
`ON DELETE CASCADE`, automatic ORM scoping, indexes, check constraints, and UTC
timestamps.

## Lifecycle

```text
planned -> running -> completed
                  \-> failed -> retry creates a new planned run
planned/running -> cancelled -> retry creates a new planned run
```

Phase 6A creates `planned` runs and steps. Execution transitions are introduced
in Phase 6B.

## API examples

Create a workflow plan:

```http
POST /api/v1/agent-runs/
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "goal": "Prepare for an AI Engineer role while saving for relocation",
  "preferred_agents": [],
  "include_weekly_plan": true,
  "context": {
    "target_horizon_months": 6
  }
}
```

List with pagination:

```http
GET /api/v1/agent-runs/?page=1&page_size=20&status=planned
```

Legacy `/api/...` aliases remain available while API compatibility mode is
enabled.

## Security and privacy

- Registry and workflow endpoints require authentication.
- Runs and steps are automatically scoped to the authenticated user.
- Another user receives `404` for a run they do not own.
- Secrets must never be placed in the free-form request `context` object.
- Running workflows cannot be deleted.
- Retry is limited to failed or cancelled workflows.

## Next increments

- Phase 6B: execution engine and context adapters.
- Phase 6C: parallel execution and final synthesis.
- Phase 6D: streaming progress, cancellation, and retries.
- Phase 7: durable human approval and external actions.
