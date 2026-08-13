"use client";

import Link from "next/link";

import { useApprovals } from "@/components/approvals/ApprovalProvider";

export default function ApprovalQuickAccess() {
  const { pendingCount, loading } = useApprovals();

  return (
    <Link
      href="/approvals"
      className="group block rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 transition hover:border-amber-300 hover:bg-amber-500/15"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-amber-200">Approval inbox</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Review sensitive agent actions before workflows continue.
          </p>
        </div>
        <span className="rounded-full bg-amber-400 px-3 py-1.5 text-sm font-bold text-slate-950">
          {loading && pendingCount === 0 ? "…" : pendingCount}
        </span>
      </div>
      <p className="mt-3 text-xs font-semibold text-amber-200 group-hover:text-white">
        {pendingCount === 0 ? "View decision history" : "Review pending actions"} →
      </p>
    </Link>
  );
}
