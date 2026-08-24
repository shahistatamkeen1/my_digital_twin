import type { ActionOutboxStatus } from "@/types/action-outbox";

const STYLES: Record<ActionOutboxStatus, string> = {
  queued: "border-cyan-500/40 bg-cyan-500/15 text-cyan-100",
  dispatching: "border-violet-500/40 bg-violet-500/15 text-violet-100",
  succeeded: "border-emerald-500/40 bg-emerald-500/15 text-emerald-100",
  failed: "border-rose-500/40 bg-rose-500/15 text-rose-100",
  cancelled: "border-slate-600 bg-slate-700/40 text-slate-300",
  dead_lettered: "border-orange-500/40 bg-orange-500/15 text-orange-100",
};

export default function ActionOutboxStatusBadge({
  status,
}: {
  status: ActionOutboxStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STYLES[status]}`}
    >
      {formatLabel(status)}
    </span>
  );
}

function formatLabel(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
