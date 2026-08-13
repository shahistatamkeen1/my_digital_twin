"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import ApprovalDetailDrawer, {
  type ApprovalDecisionMode,
} from "@/components/approvals/ApprovalDetailDrawer";
import ApprovalStatusBadge from "@/components/approvals/ApprovalStatusBadge";
import { useApprovals } from "@/components/approvals/ApprovalProvider";
import { ApiError, type PaginationMeta } from "@/lib/api";
import {
  approveApproval,
  getApproval,
  listApprovals,
  rejectApproval,
} from "@/lib/approvals";
import {
  getAgentRun,
  getAgentRunTimeline,
  resumeAgentRun,
} from "@/lib/agent-runs";
import type { AgentRunDetail } from "@/types/agent-runs";
import type {
  ApprovalActionType,
  ApprovalDetail,
  ApprovalStatus,
  ApprovalSummary,
  WorkflowTimelineItem,
} from "@/types/approvals";

const EMPTY_PAGINATION: PaginationMeta = {
  page: 1,
  page_size: 12,
  total_items: 0,
  total_pages: 0,
  has_next: false,
  has_previous: false,
};

const ACTION_TYPES: Array<{ value: ApprovalActionType | ""; label: string }> = [
  { value: "", label: "All action types" },
  { value: "send_email", label: "Send email" },
  { value: "create_calendar_event", label: "Calendar event" },
  { value: "submit_application", label: "Submit application" },
  { value: "delete_data", label: "Delete data" },
  { value: "change_financial_plan", label: "Financial plan" },
  { value: "external_action", label: "External action" },
  { value: "other", label: "Other" },
];

const STATUS_FILTERS: Array<{ value: ApprovalStatus | ""; label: string }> = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
];

export default function ApprovalInbox() {
  const { pendingCount, refreshPendingCount } = useApprovals();
  const [items, setItems] = useState<ApprovalSummary[]>([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ApprovalStatus | "">("pending");
  const [actionType, setActionType] = useState<ApprovalActionType | "">("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ApprovalDetail | null>(null);
  const [selectedRun, setSelectedRun] = useState<AgentRunDetail | null>(null);
  const [timeline, setTimeline] = useState<WorkflowTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadInbox = useCallback(async (requestedPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const result = await listApprovals({
        page: requestedPage,
        pageSize: 12,
        search: search.trim() || undefined,
        status,
        actionType,
      });
      setItems(result.items);
      setPagination(result.pagination);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [actionType, page, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadInbox(), search ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [loadInbox, search]);

  const openApproval = async (approvalId: number) => {
    setDetailLoading(true);
    setDrawerError(null);
    setMessage(null);
    try {
      const detail = await getApproval(approvalId);
      setSelected(detail);
      const [run, events] = await Promise.all([
        getAgentRun(detail.agent_run_id),
        getAgentRunTimeline(detail.agent_run_id),
      ]);
      setSelectedRun(run);
      setTimeline(events);
    } catch (requestError) {
      setSelected(null);
      setError(errorMessage(requestError));
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshSelected = async (approval: ApprovalDetail) => {
    const [detail, run, events] = await Promise.all([
      getApproval(approval.id),
      getAgentRun(approval.agent_run_id),
      getAgentRunTimeline(approval.agent_run_id),
    ]);
    setSelected(detail);
    setSelectedRun(run);
    setTimeline(events);
  };

  const resume = async () => {
    if (!selected) return;
    setBusy(true);
    setDrawerError(null);
    try {
      const run = await resumeAgentRun(selected.agent_run_id);
      setSelectedRun(run);
      setTimeline(await getAgentRunTimeline(selected.agent_run_id));
      setMessage(`Workflow #${run.id} resumed and is now ${formatLabel(run.status).toLowerCase()}.`);
      await Promise.all([loadInbox(), refreshPendingCount()]);
    } catch (requestError) {
      setDrawerError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const decide = async (
    mode: ApprovalDecisionMode,
    note: string,
    payload?: Record<string, unknown>
  ) => {
    if (!selected) return;
    setBusy(true);
    setDrawerError(null);
    setMessage(null);

    let decided: ApprovalDetail;
    try {
      decided = mode === "reject"
        ? await rejectApproval(selected.id, { decision_note: note })
        : await approveApproval(selected.id, {
            decision_note: note || undefined,
            decision_payload: mode === "edit" ? payload : undefined,
          });
      setSelected(decided);
      setMessage(`${formatLabel(decided.status)} decision saved. Resuming workflow…`);
      await Promise.all([loadInbox(), refreshPendingCount()]);
    } catch (requestError) {
      setDrawerError(errorMessage(requestError));
      setBusy(false);
      return;
    }

    try {
      const run = await resumeAgentRun(decided.agent_run_id);
      setSelectedRun(run);
      setTimeline(await getAgentRunTimeline(decided.agent_run_id));
      setMessage(`Decision saved and workflow #${run.id} resumed successfully.`);
      await Promise.all([loadInbox(), refreshPendingCount()]);
    } catch (requestError) {
      setDrawerError(
        `The decision was saved, but the workflow did not resume: ${errorMessage(requestError)} Use “Resume workflow” to retry safely.`
      );
      try {
        await refreshSelected(decided);
      } catch {
        // Keep the confirmed decision visible if the follow-up refresh fails.
      }
    } finally {
      setBusy(false);
    }
  };

  const visibleCounts = useMemo(() => ({
    approved: items.filter((item) => item.status === "approved").length,
    rejected: items.filter((item) => item.status === "rejected").length,
  }), [items]);

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <header className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 p-6 shadow-2xl shadow-black/20 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-300">Human-in-the-loop · Phase 6D3</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Approval Inbox</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
              Review sensitive actions, refine proposed payloads, record an auditable decision, and safely resume paused workflows.
            </p>
          </div>
          <button type="button" onClick={() => void Promise.all([loadInbox(), refreshPendingCount()])} disabled={loading} className="self-start rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:border-amber-300 hover:text-white disabled:opacity-50">
            {loading ? "Refreshing…" : "Refresh inbox"}
          </button>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Pending now" value={pendingCount} accent="text-amber-300" />
        <Metric label="Visible requests" value={pagination.total_items} />
        <Metric label="Approved here" value={visibleCounts.approved} accent="text-emerald-300" />
        <Metric label="Rejected here" value={visibleCounts.rejected} accent="text-rose-300" />
      </section>

      {error && <div role="alert" className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div>}

      <section className="mt-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <label className="sr-only" htmlFor="approval-search">Search approvals</label>
          <input id="approval-search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search action summaries and decision notes…" className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400" />
          <select aria-label="Filter by action type" value={actionType} onChange={(event) => { setActionType(event.target.value as ApprovalActionType | ""); setPage(1); }} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400">
            {ACTION_TYPES.map((option) => <option key={option.value || "all"} value={option.value}>{option.label}</option>)}
          </select>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Approval status filters">
          {STATUS_FILTERS.map((option) => <button key={option.value || "all"} type="button" onClick={() => { setStatus(option.value); setPage(1); }} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition ${status === option.value ? "border-cyan-400 bg-cyan-500/20 text-cyan-100" : "border-slate-700 text-slate-400 hover:text-white"}`}>{option.label}</button>)}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {loading && items.length === 0 && <Placeholder label="Loading approval requests…" />}
          {!loading && items.length === 0 && <Placeholder label="No approval requests match this view." />}
          {items.map((approval) => (
            <button key={approval.id} type="button" onClick={() => void openApproval(approval.id)} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-500/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400">
              <div className="flex items-start justify-between gap-3"><span className="text-xs font-semibold text-slate-500">Approval #{approval.id}</span><ApprovalStatusBadge status={approval.status} /></div>
              <p className="mt-4 line-clamp-3 text-sm font-semibold leading-6 text-slate-100">{approval.action_summary}</p>
              <p className="mt-3 text-xs font-medium text-cyan-300">{formatLabel(approval.action_type)}</p>
              <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500"><span>Run #{approval.agent_run_id}</span><span>{formatDate(approval.requested_at)}</span></div>
            </button>
          ))}
        </div>

        {detailLoading && <p role="status" className="mt-4 text-center text-sm text-cyan-200">Loading approval details…</p>}

        {pagination.total_pages > 1 && <div className="mt-6 flex items-center justify-between"><button type="button" disabled={!pagination.has_previous || loading} onClick={() => setPage(Math.max(1, page - 1))} className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300 disabled:opacity-40">Previous</button><span className="text-xs text-slate-500">Page {pagination.page} of {pagination.total_pages}</span><button type="button" disabled={!pagination.has_next || loading} onClick={() => setPage(page + 1)} className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300 disabled:opacity-40">Next</button></div>}
      </section>

      {selected && <ApprovalDetailDrawer key={selected.id} approval={selected} run={selectedRun} timeline={timeline} busy={busy} message={message} error={drawerError} onClose={() => { setSelected(null); setSelectedRun(null); setTimeline([]); setMessage(null); setDrawerError(null); }} onDecision={decide} onResume={resume} />}
    </div>
  );
}

function Metric({ label, value, accent = "text-white" }: { label: string; value: number; accent?: string }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-xs text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p></div>;
}

function Placeholder({ label }: { label: string }) {
  return <div className="col-span-full rounded-2xl border border-dashed border-slate-700 px-4 py-14 text-center text-sm text-slate-500">{label}</div>;
}

function formatLabel(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.requestId ? `${error.message} Reference: ${error.requestId}` : error.message;
  }
  return error instanceof Error ? error.message : "The request could not be completed.";
}
