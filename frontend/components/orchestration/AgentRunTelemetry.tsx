import type { AgentRunDetail } from "@/types/agent-runs";

export default function AgentRunTelemetry({
  run,
}: {
  run: AgentRunDetail;
}) {
  const execution = run.result_payload?.execution;

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6">
      <div>
        <p className="text-sm font-semibold text-emerald-300">
          Execution telemetry
        </p>
        <h2 className="mt-1 text-xl font-bold">Run audit and usage</h2>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <TelemetryCard label="Provider" value={run.execution_provider || "—"} />
        <TelemetryCard
          label="Duration"
          value={formatDuration(run.duration_ms)}
        />
        <TelemetryCard
          label="Prompt tokens"
          value={run.prompt_tokens.toLocaleString()}
        />
        <TelemetryCard
          label="Output tokens"
          value={run.completion_tokens.toLocaleString()}
        />
        <TelemetryCard
          label="Estimated cost"
          value={formatCost(run.estimated_cost)}
        />
        <TelemetryCard
          label="Fallbacks"
          value={run.fallback_count.toLocaleString()}
        />
      </div>

      {execution && (
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TelemetryLine
              label="Synthesis provider"
              value={String(execution.synthesis_provider || "—")}
            />
            <TelemetryLine
              label="Synthesis model"
              value={String(execution.synthesis_model || "—")}
            />
            <TelemetryLine
              label="Synthesis tokens"
              value={Number(execution.synthesis_tokens || 0).toLocaleString()}
            />
            <TelemetryLine
              label="Failed agents"
              value={
                Array.isArray(execution.failed_agents) &&
                execution.failed_agents.length > 0
                  ? execution.failed_agents.join(", ")
                  : "None"
              }
            />
          </div>
        </div>
      )}
    </section>
  );
}

function TelemetryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 truncate text-sm font-semibold text-white" title={value}>
        {value}
      </p>
    </div>
  );
}

function TelemetryLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-slate-600">{label}</p>
      <p className="mt-1 break-words font-medium text-slate-300">{value}</p>
    </div>
  );
}

function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds} ms`;
  }
  if (milliseconds < 60_000) {
    return `${(milliseconds / 1000).toFixed(1)} s`;
  }
  return `${(milliseconds / 60_000).toFixed(1)} min`;
}

function formatCost(value: number): string {
  if (value <= 0) {
    return "$0.00";
  }
  if (value < 0.01) {
    return `$${value.toFixed(4)}`;
  }
  return `$${value.toFixed(2)}`;
}
