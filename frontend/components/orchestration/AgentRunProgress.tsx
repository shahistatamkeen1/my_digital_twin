import AgentStatusBadge from "@/components/orchestration/AgentStatusBadge";
import { AGENT_VISUALS } from "@/components/orchestration/agent-visuals";
import type { AgentRunDetail } from "@/types/agent-runs";

export default function AgentRunProgress({ run }: { run: AgentRunDetail }) {
  const completed = run.steps.filter((step) => step.status === "completed").length;
  const progress =
    run.steps.length > 0 ? Math.round((completed / run.steps.length) * 100) : 0;

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-300">
            Run #{run.id} · {run.execution_mode.replaceAll("_", " ")}
          </p>
          <h2 className="mt-2 text-2xl font-bold leading-tight">{run.goal}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            {run.routing_reason}
          </p>
        </div>
        <AgentStatusBadge status={run.status} />
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            {completed} of {run.steps.length} twins completed
          </span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {run.steps.map((step) => {
          const visual = AGENT_VISUALS[step.agent_name];

          return (
            <article
              key={step.id}
              className={`rounded-2xl border p-4 ${visual.cardClass}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">
                    {visual.icon}
                  </span>
                  <div>
                    <h3 className="font-semibold text-white">{visual.label}</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Step {step.step_order} · {step.timeout_seconds}s timeout
                    </p>
                  </div>
                </div>
                <AgentStatusBadge status={step.status} />
              </div>

              {step.status === "running" && (
                <div className="mt-4 flex items-center gap-2 text-xs text-cyan-200">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
                  Analysing isolated {visual.shortLabel.toLowerCase()} context...
                </div>
              )}

              {step.error_message && (
                <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs leading-5 text-rose-200">
                  {step.error_message}
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <Metric label="Attempts" value={String(step.attempt_count)} />
                <Metric
                  label="Duration"
                  value={formatDuration(step.duration_ms)}
                />
                <Metric label="Provider" value={step.provider || "—"} />
                <Metric
                  label="Tokens"
                  value={step.total_tokens.toLocaleString()}
                />
              </div>

              {step.fallback_used && (
                <p className="mt-3 text-xs font-semibold text-amber-200">
                  Deterministic fallback used
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-950/45 p-2.5">
      <p className="text-slate-500">{label}</p>
      <p className="mt-1 truncate font-semibold text-slate-200" title={value}>
        {value}
      </p>
    </div>
  );
}

function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds} ms`;
  }
  return `${(milliseconds / 1000).toFixed(1)} s`;
}
