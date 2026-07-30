import type {
  AgentRunStatus,
  AgentStepStatus,
} from "@/types/agent-runs";

type Status = AgentRunStatus | AgentStepStatus;

const STATUS_STYLES: Record<Status, string> = {
  planned: "border-slate-600 bg-slate-700/40 text-slate-200",
  running: "border-cyan-500/40 bg-cyan-500/15 text-cyan-200",
  synthesizing: "border-violet-500/40 bg-violet-500/15 text-violet-200",
  completed: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
  partially_completed:
    "border-amber-500/40 bg-amber-500/15 text-amber-200",
  failed: "border-rose-500/40 bg-rose-500/15 text-rose-200",
  skipped: "border-slate-600 bg-slate-700/40 text-slate-300",
  cancelled: "border-orange-500/40 bg-orange-500/15 text-orange-200",
};

export default function AgentStatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[status]}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
