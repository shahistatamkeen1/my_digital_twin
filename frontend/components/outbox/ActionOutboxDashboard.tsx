"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import ActionOutboxStatusBadge from "@/components/outbox/ActionOutboxStatusBadge";
import { ApiError, type PaginationMeta } from "@/lib/api";
import {
  cancelActionOutboxEntry,
  dispatchActionOutboxEntry,
  dispatchReadyActions,
  getActionOutboxEntry,
  listActionOutbox,
  retryActionOutboxEntry,
} from "@/lib/action-outbox";
import type { ApprovalActionType } from "@/types/approvals";
import type {
  ActionOutboxDetail,
  ActionOutboxStatus,
  ActionOutboxSummary,
} from "@/types/action-outbox";

const EMPTY_PAGINATION: PaginationMeta = {
  page: 1,
  page_size: 12,
  total_items: 0,
  total_pages: 0,
  has_next: false,
  has_previous: false,
};

const STATUS_FILTERS: Array<{ value: ActionOutboxStatus | ""; label: string }> = [
  { value: "", label: "All" },
  { value: "queued", label: "Queued" },
  { value: "dispatching", label: "Dispatching" },
  { value: "succeeded", label: "Succeeded" },
  { value: "failed", label: "Failed" },
  { value: "dead_lettered", label: "Dead letter" },
  { value: "cancelled", label: "Cancelled" },
];

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

export default function ActionOutboxDashboard() {
  const [items, setItems] = useState<ActionOutboxSummary[]>([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [selected, setSelected] = useState<ActionOutboxDetail | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ActionOutboxStatus | "">("");
  const [actionType, setActionType] = useState<ApprovalActionType | "">("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadEntries = useCallback(async (requestedPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const result = await listActionOutbox({
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
    const timer = window.setTimeout(() => void loadEntries(), search ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [loadEntries, search]);

  const openEntry = async (outboxId: number) => {
    setDetailLoading(true);
    setDetailError(null);
    setMessage(null);
    try {
      setSelected(await getActionOutboxEntry(outboxId));
    } catch (requestError) {
      setDetailError(errorMessage(requestError));
    } finally {
      setDetailLoading(false);
    }
  };

  const mutateSelected = async (action: "dispatch" | "retry" | "cancel") => {
    if (!selected) return;
    setBusy(true);
    setDetailError(null);
    setMessage(null);
    try {
      const updated = action === "dispatch"
        ? await dispatchActionOutboxEntry(selected.id)
        : action === "retry"
          ? await retryActionOutboxEntry(selected.id)
          : await cancelActionOutboxEntry(
              selected.id,
              "Cancelled from the Action Outbox workspace."
            );
      setSelected(updated);
      setMessage(actionMessage(action, updated.status));
      await loadEntries();
    } catch (requestError) {
      setDetailError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const dispatchBatch = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await dispatchReadyActions(10);
      setMessage(
        result.processed === 0
          ? "No queued actions were ready to dispatch."
          : `${result.processed} action${result.processed === 1 ? "" : "s"} processed in dry-run mode; ${result.succeeded} succeeded and ${result.failed} failed.`
      );
      await loadEntries();
      if (selected) {
        setSelected(await getActionOutboxEntry(selected.id));
      }
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const visibleCounts = useMemo(() => ({
    queued: items.filter((item) => item.status === "queued").length,
    succeeded: items.filter((item) => item.status === "succeeded").length,
    attention: items.filter((item) => ["failed", "dead_lettered"].includes(item.status)).length,
  }), [items]);

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <header className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-6 shadow-2xl shadow-black/20 sm:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-300">Controlled execution · Phase 6D4</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Action Outbox</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
              Track every approved action from durable queueing through idempotent dispatch, retries, cancellation, and its immutable execution history.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void loadEntries()} disabled={loading || busy} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:border-cyan-300 hover:text-white disabled:opacity-50">
              {loading ? "Refreshing…" : "Refresh"}
            </button>
            <button type="button" onClick={() => void dispatchBatch()} disabled={busy} className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-400 disabled:opacity-50">
              {busy ? "Processing…" : "Dispatch ready"}
            </button>
          </div>
        </div>
      </header>

      <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
        <strong>Dry-run safety is active.</strong> Dispatch creates a deterministic receipt and audit trail, but it does not send email, create calendar events, submit applications, change finances, or delete external data.
      </div>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Visible actions" value={pagination.total_items} />
        <Metric label="Queued here" value={visibleCounts.queued} accent="text-cyan-300" />
        <Metric label="Succeeded here" value={visibleCounts.succeeded} accent="text-emerald-300" />
        <Metric label="Needs attention" value={visibleCounts.attention} accent="text-rose-300" />
      </section>

      {(error || message) && (
        <div role={error ? "alert" : "status"} className={`mt-5 rounded-2xl border p-4 text-sm ${error ? "border-rose-500/30 bg-rose-500/10 text-rose-100" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"}`}>
          {error || message}
        </div>
      )}

      <section className="mt-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <label className="sr-only" htmlFor="outbox-search">Search action outbox</label>
          <input id="outbox-search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search action summaries, errors, or idempotency keys…" className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400" />
          <select aria-label="Filter by action type" value={actionType} onChange={(event) => { setActionType(event.target.value as ApprovalActionType | ""); setPage(1); }} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400">
            {ACTION_TYPES.map((option) => <option key={option.value || "all"} value={option.value}>{option.label}</option>)}
          </select>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Action outbox status filters">
          {STATUS_FILTERS.map((option) => <button key={option.value || "all"} type="button" onClick={() => { setStatus(option.value); setPage(1); }} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition ${status === option.value ? "border-cyan-400 bg-cyan-500/20 text-cyan-100" : "border-slate-700 text-slate-400 hover:text-white"}`}>{option.label}</button>)}
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)]">
          <div>
            <div className="grid gap-3 md:grid-cols-2">
              {loading && items.length === 0 && <Placeholder label="Loading approved actions…" />}
              {!loading && items.length === 0 && <Placeholder label="No approved actions match this view. Approve a workflow action to create the first outbox entry." />}
              {items.map((entry) => (
                <button key={entry.id} type="button" onClick={() => void openEntry(entry.id)} className={`rounded-2xl border bg-slate-950/60 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-500/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${selected?.id === entry.id ? "border-cyan-400/70" : "border-slate-800"}`}>
                  <div className="flex items-start justify-between gap-3"><span className="text-xs font-semibold text-slate-500">Action #{entry.id}</span><ActionOutboxStatusBadge status={entry.status} /></div>
                  <p className="mt-4 line-clamp-3 text-sm font-semibold leading-6 text-slate-100">{entry.action_summary}</p>
                  <p className="mt-3 text-xs font-medium text-cyan-300">{formatLabel(entry.action_type)}</p>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500"><span>Run #{entry.agent_run_id} · Approval #{entry.approval_id}</span><span>{entry.attempt_count}/{entry.max_attempts} attempts</span></div>
                </button>
              ))}
            </div>
            {pagination.total_pages > 1 && <div className="mt-6 flex items-center justify-between"><button type="button" disabled={!pagination.has_previous || loading} onClick={() => setPage(Math.max(1, page - 1))} className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300 disabled:opacity-40">Previous</button><span className="text-xs text-slate-500">Page {pagination.page} of {pagination.total_pages}</span><button type="button" disabled={!pagination.has_next || loading} onClick={() => setPage(page + 1)} className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300 disabled:opacity-40">Next</button></div>}
          </div>

          <div className="min-h-80 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 sm:p-5">
            {detailLoading && <Placeholder label="Loading action details…" />}
            {!detailLoading && !selected && <Placeholder label="Select an action to inspect its payload, receipt, controls, and audit history." />}
            {!detailLoading && selected && <ActionDetail entry={selected} busy={busy} error={detailError} onAction={mutateSelected} />}
          </div>
        </div>
      </section>
    </div>
  );
}

function ActionDetail({ entry, busy, error, onAction }: { entry: ActionOutboxDetail; busy: boolean; error: string | null; onAction: (action: "dispatch" | "retry" | "cancel") => Promise<void> }) {
  const canDispatch = entry.status === "queued";
  const canRetry = entry.status === "failed" && entry.attempt_count < entry.max_attempts;
  const canCancel = entry.status === "queued" || entry.status === "failed";

  return <div>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-slate-500">Action #{entry.id}</p><h2 className="mt-2 text-lg font-bold text-white">{entry.action_summary}</h2></div><ActionOutboxStatusBadge status={entry.status} /></div>
    {error && <div role="alert" className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs leading-5 text-rose-100">{error}</div>}
    <dl className="mt-5 grid grid-cols-2 gap-3 text-xs"><Detail label="Action type" value={formatLabel(entry.action_type)} /><Detail label="Mode" value="Dry run" /><Detail label="Workflow" value={`Run #${entry.agent_run_id}`} /><Detail label="Approval" value={`#${entry.approval_id}`} /><Detail label="Attempts" value={`${entry.attempt_count} of ${entry.max_attempts}`} /><Detail label="Created" value={formatDate(entry.created_at)} /></dl>
    <Payload title="Execution payload" value={entry.execution_payload} />
    {entry.result_payload && <Payload title="Dispatch receipt" value={entry.result_payload} />}
    {entry.last_error && <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs leading-5 text-rose-100"><p className="font-semibold">Last dispatch error</p><p className="mt-1">{entry.last_error}</p></div>}
    {(canDispatch || canRetry || canCancel) && <div className="mt-5 flex flex-wrap gap-2">{canDispatch && <button type="button" disabled={busy} onClick={() => void onAction("dispatch")} className="rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-400 disabled:opacity-50">{busy ? "Dispatching…" : "Dispatch dry run"}</button>}{canRetry && <button type="button" disabled={busy} onClick={() => void onAction("retry")} className="rounded-xl bg-violet-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-violet-400 disabled:opacity-50">Queue retry</button>}{canCancel && <button type="button" disabled={busy} onClick={() => void onAction("cancel")} className="rounded-xl border border-rose-500/40 px-4 py-2.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/10 disabled:opacity-50">Cancel action</button>}</div>}
    <div className="mt-6"><h3 className="text-sm font-semibold text-white">Execution history</h3><div className="mt-4 space-y-4">{entry.events.map((event) => <div key={event.id} className="relative border-l border-slate-700 pl-4"><span className="absolute -left-1 top-1 h-2 w-2 rounded-full bg-cyan-400" /><p className="text-sm font-medium text-slate-200">{formatLabel(event.event_type)}</p><p className="mt-1 text-[11px] text-slate-500">{event.attempt_number ? `Attempt ${event.attempt_number} · ` : ""}{formatDate(event.created_at)}</p>{event.note && <p className="mt-1 text-xs leading-5 text-slate-400">{event.note}</p>}</div>)}</div></div>
  </div>;
}

function Metric({ label, value, accent = "text-white" }: { label: string; value: number; accent?: string }) { return <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-xs text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p></div>; }
function Placeholder({ label }: { label: string }) { return <div className="col-span-full flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm leading-6 text-slate-500">{label}</div>; }
function Detail({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-900/70 p-3"><dt className="text-slate-500">{label}</dt><dd className="mt-1 break-words text-slate-200">{value}</dd></div>; }
function Payload({ title, value }: { title: string; value: Record<string, unknown> }) { return <section className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3"><h3 className="text-xs font-semibold text-slate-200">{title}</h3><pre className="mt-3 max-h-56 overflow-auto rounded-lg bg-slate-950 p-3 text-[11px] leading-5 text-cyan-100">{JSON.stringify(value, null, 2)}</pre></section>; }
function formatLabel(value: string): string { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function formatDate(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date); }
function errorMessage(error: unknown): string { if (error instanceof ApiError) return error.requestId ? `${error.message} Reference: ${error.requestId}` : error.message; return error instanceof Error ? error.message : "The request could not be completed."; }
function actionMessage(action: "dispatch" | "retry" | "cancel", status: ActionOutboxStatus): string { if (action === "dispatch") return status === "succeeded" ? "Dry-run dispatch completed and its receipt was recorded." : `Dispatch finished with status ${formatLabel(status)}.`; if (action === "retry") return "The failed action was queued for another controlled attempt."; return "The action was cancelled and will not be dispatched."; }
