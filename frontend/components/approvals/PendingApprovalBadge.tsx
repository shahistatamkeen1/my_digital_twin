"use client";

import { useApprovals } from "@/components/approvals/ApprovalProvider";

export default function PendingApprovalBadge({ compact = false }: { compact?: boolean }) {
  const { pendingCount, loading } = useApprovals();

  if (loading && pendingCount === 0) {
    return <span className="sr-only">Checking pending approvals</span>;
  }
  if (pendingCount === 0) {
    return null;
  }

  const label = pendingCount > 99 ? "99+" : String(pendingCount);
  return (
    <span
      aria-label={`${pendingCount} pending approval${pendingCount === 1 ? "" : "s"}`}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-amber-400 font-bold text-slate-950 ${
        compact ? "min-w-5 px-1.5 py-0.5 text-[10px]" : "min-w-6 px-2 py-1 text-xs"
      }`}
    >
      {label}
    </span>
  );
}
