import type { ApprovalStatus } from "@/types/approvals";

const STYLES: Record<ApprovalStatus, string> = {
  pending: "border-amber-500/40 bg-amber-500/15 text-amber-200",
  approved: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
  rejected: "border-rose-500/40 bg-rose-500/15 text-rose-200",
  cancelled: "border-orange-500/40 bg-orange-500/15 text-orange-200",
  expired: "border-slate-600 bg-slate-700/40 text-slate-300",
};

export default function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${STYLES[status]}`}>
      {status}
    </span>
  );
}
