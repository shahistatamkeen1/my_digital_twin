# Agent Execution Engine

## Phase 6B scope

Phase 6B turns persistent Phase 6A workflow plans into executable, user-owned
multi-agent runs. The HTTP request remains synchronous in this phase; a durable
background worker and resumable human approvals are reserved for Phase 7.

## Execution API

Plan a run first:

```http
POST /api/v1/agent-runs/
```

Execute the planned run:

```http
POST /api/v1/agent-runs/{run_id}/execute
Content-Type: application/json

{
  "provider": "configured",
  "allow_partial": true,
  "allow_fallback": false,
  "force_sequential": false
}
```

Cancel a planned or active run:

```http
POST /api/v1/agent-runs/{run_id}/cancel
```

`configured` uses the configured OpenAI model. `deterministic` is a no-model
provider for tests and local verification. It is rejected when
`AGENT_ALLOW_DETERMINISTIC_PROVIDER=false`, which is the production template
default.

## Execution lifecycle

```text
planned
  -> running
      -> synthesizing
          -> completed
          -> partially_completed
      -> failed
  -> cancelled
```

Step lifecycle:

```text
planned -> running -> completed
                   -> failed
planned/running -> cancelled
```

A completed run cannot be executed again. Retrying creates a new run and
preserves `retry_of_run_id` lineage.

## Context isolation

The execution service loads each domain independently:

- Career receives career memory, applications, and roadmap context.
- Finance receives finance memory, transactions, goals, and budget context.
- Health receives health memory and recent habit context.
- Learning receives learning goals and progress context.

Raw context is used in memory for the selected agent only. The persisted audit
payload stores a context manifest—section names, record counts, and serialized
size—not a copy of every private domain record.

## Parallel and sequential execution

`single_agent` and `sequential` plans execute in order. Multi-agent
`parallel_then_synthesize` plans execute with a bounded thread pool controlled
by `AGENT_MAX_PARALLEL_WORKERS`.

Each step records:

- provider and model
- attempts and configured retry limit
- latency
- prompt, completion, and total tokens
- operator-configured estimated cost
- fallback usage
- output or persisted error

The OpenAI client timeout remains the hard network timeout. Step timeout values
also bound orchestration waits.

## Partial failure and fallback

With `allow_partial=true`, successful agents are synthesized even when another
agent fails. The run ends as `partially_completed`, and failed agents are listed
under `result_payload.execution.failed_agents`.

With `allow_fallback=true`, a configured-provider failure may use the
deterministic local provider after retries. Fallback usage is explicit in step
and run metadata; it is never presented as an OpenAI result.

## Unified result

Successful contributions are normalized into:

```json
{
  "summary": "...",
  "priorities": [],
  "weekly_plan": [],
  "risks": [],
  "success_metrics": [],
  "next_checkpoint": "...",
  "agent_contributions": {
    "career": {},
    "finance": {},
    "health": {},
    "learning": {}
  }
}
```

The plan is stored at:

```text
result_payload.unified_plan
```

Execution metadata is stored at:

```text
result_payload.execution
```

## Cost configuration

Token counts come from the configured model response. Cost remains zero until
the operator supplies current rates:

```env
AGENT_INPUT_COST_PER_MILLION=0
AGENT_OUTPUT_COST_PER_MILLION=0
```

This avoids hard-coding provider prices that may change.

## Cancellation boundary

Cancellation is checked between agent execution and synthesis. It cannot
interrupt a model request already in progress; the configured OpenAI timeout
still applies to that request. A background job system with stronger
cooperative cancellation is planned for Phase 7.

## Verification

Local deterministic verification does not require an OpenAI key:

```powershell
python -m app.migrations.phase6b_runtime_verify
```

The migration smoke test validates upgrade, downgrade, and re-upgrade:

```powershell
python -m app.migrations.phase6b_smoke_test
```
