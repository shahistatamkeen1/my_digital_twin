import type { ChangeEvent } from "react";

import AgentStatusBadge from "@/components/orchestration/AgentStatusBadge";
import { AGENT_VISUALS } from "@/components/orchestration/agent-visuals";
import type { PaginationMeta } from "@/lib/api";
import type {
  AgentRunStatus,
  AgentRunSummary,
} from "@/types/agent-runs";

type Props = {
  runs: AgentRunSummary[];
  pagination: PaginationMeta;
  selectedRunId: number | null;
  search: string;
  statusFilter: AgentRunStatus | "";
  loading: boolean;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: AgentRunStatus | "") => void;
  onSelect: (runId: number) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
};

const STATUS_OPTIONS: Array<{ value: AgentRunStatus | ""; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "planned", label: "Planned" },
  { value: "running", label: "Running" },
  { value: "synthesizing", label: "Synthesizing" },
  { value: "completed", label: "Completed" },
  { value: "partially_completed", label: "Partial" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AgentRunHistory({
  runs,
  pagination,
  selectedRunId,
  search,
  statusFilter,
  loading,
  onSearchChange,
  onStatusFilterChange,
  onSelect,
  onPageChange,
  onRefresh,
}: Props) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-violet-300">Workflow history</p>
          <h2 className="mt-1 text-xl font-bold">Your recent missions</h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-cyan-400 hover:text-white disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 grid gap-2">
        <input
          value={search}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onSearchChange(event.target.value)
          }
          placeholder="Search goals..."
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
        />
        <select
          value={statusFilter}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            onStatusFilterChange(event.target.value as AgentRunStatus | "")
          }
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 space-y-3">
        {loading && runs.length === 0 && (
          <HistoryPlaceholder label="Loading workflows..." />
        )}

        {!loading && runs.length === 0 && (
          <HistoryPlaceholder label="No workflows match this view." />
        )}

        {runs.map((run) => (
          <button
            type="button"
            key={run.id}
            onClick={() => onSelect(run.id)}
            className={`w-full rounded-2xl border p-4 text-left transition ${
              selectedRunId === run.id
                ? "border-cyan-400 bg-cyan-500/10"
                : "border-slate-800 bg-slate-950/60 hover:border-slate-600"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-semibold text-slate-500">
                Run #{run.id}
              </span>
              <AgentStatusBadge status={run.status} />
            </div>

            <p className="mt-3 line-clamp-3 text-sm font-medium leading-5 text-slate-100">
              {run.goal}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {run.selected_agents.map((agent) => (
                <span
                  key={agent}
                  className={`rounded-full px-2 py-1 text-[10px] font-semibold ${AGENT_VISUALS[agent].badgeClass}`}
                >
                  {AGENT_VISUALS[agent].icon} {AGENT_VISUALS[agent].shortLabel}
                </span>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span>{formatDate(run.created_at)}</span>
              <span>{run.total_tokens.toLocaleString()} tokens</span>
            </div>
          </button>
        ))}
      </div>

      {pagination.total_pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            disabled={!pagination.has_previous || loading}
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-slate-500">
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <button
            type="button"
            disabled={!pagination.has_next || loading}
            onClick={() => onPageChange(pagination.page + 1)}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-slate-600">
        {pagination.total_items} total workflow
        {pagination.total_items === 1 ? "" : "s"}
      </p>
    </section>
  );
}

function HistoryPlaceholder({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 px-4 py-10 text-center text-sm text-slate-500">
      {label}
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(date);
}
