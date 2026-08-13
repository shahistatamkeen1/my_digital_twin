"use client";

import { useEffect, useState } from "react";

import ApprovalStatusBadge from "@/components/approvals/ApprovalStatusBadge";
import AgentStatusBadge from "@/components/orchestration/AgentStatusBadge";
import type { AgentRunDetail } from "@/types/agent-runs";
import type { ApprovalDetail, WorkflowTimelineItem } from "@/types/approvals";

export type ApprovalDecisionMode = "approve" | "edit" | "reject";

type Props = {
  approval: ApprovalDetail;
  run: AgentRunDetail | null;
  timeline: WorkflowTimelineItem[];
  busy: boolean;
  message: string | null;
  error: string | null;
  onClose: () => void;
  onDecision: (
    mode: ApprovalDecisionMode,
    note: string,
    payload?: Record<string, unknown>
  ) => Promise<void>;
  onResume: () => Promise<void>;
};

export default function ApprovalDetailDrawer({
  approval,
  run,
  timeline,
  busy,
  message,
  error,
  onClose,
  onDecision,
  onResume,
}: Props) {
  const [mode, setMode] = useState<ApprovalDecisionMode>("approve");
  const [note, setNote] = useState("");
  const [editedPayload, setEditedPayload] = useState(
    JSON.stringify(approval.proposed_payload, null, 2)
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [busy, onClose]);

  const submit = async () => {
    setValidationError(null);
    if (mode === "reject" && !note.trim()) {
      setValidationError("Add a short reason so the rejection is auditable.");
      return;
    }

    if (mode === "edit") {
      try {
        const parsed = JSON.parse(editedPayload) as unknown;
        if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
          throw new Error("The edited payload must be a JSON object.");
        }
        await onDecision(mode, note.trim(), parsed as Record<string, unknown>);
      } catch (parseError) {
        setValidationError(
          parseError instanceof SyntaxError
            ? `Invalid JSON: ${parseError.message}`
            : parseError instanceof Error
              ? parseError.message
              : "The edited payload is invalid."
        );
      }
      return;
    }

    await onDecision(mode, note.trim());
  };

  const canResume =
    approval.status !== "pending" && run?.status === "awaiting_approval";

  return (
    <div className="fixed inset-0 z-[70]" role="presentation">
      <button
        type="button"
        aria-label="Close approval details"
        onClick={onClose}
        disabled={busy}
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="approval-drawer-title"
        className="absolute inset-y-0 right-0 flex w-full flex-col border-l border-slate-700 bg-slate-950 shadow-2xl shadow-black sm:max-w-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <ApprovalStatusBadge status={approval.status} />
              <span className="text-xs text-slate-500">Approval #{approval.id}</span>
            </div>
            <h2 id="approval-drawer-title" className="mt-3 text-xl font-bold text-white">
              {approval.action_summary}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-white disabled:opacity-50"
          >
            Close
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          {(message || error || validationError) && (
            <div
              role={error || validationError ? "alert" : "status"}
              className={`rounded-2xl border p-4 text-sm leading-6 ${
                error || validationError
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-100"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
              }`}
            >
              {error || validationError || message}
            </div>
          )}

          <section className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
            <Detail label="Action" value={formatLabel(approval.action_type)} />
            <Detail label="Workflow" value={`Run #${approval.agent_run_id}`} />
            <Detail label="Requested" value={formatDate(approval.requested_at)} />
            <Detail label="Expires" value={formatDate(approval.expires_at)} />
            {run && (
              <div className="col-span-2 flex items-center justify-between gap-3 rounded-xl bg-slate-950/60 p-3">
                <span className="text-slate-500">Workflow state</span>
                <AgentStatusBadge status={run.status} />
              </div>
            )}
          </section>

          <PayloadCard
            title="Proposed action"
            subtitle="This is exactly what the agent requested permission to do."
            payload={approval.proposed_payload}
          />

          {approval.decision_payload && (
            <PayloadCard
              title="Approved payload"
              subtitle="The final payload recorded with the decision."
              payload={approval.decision_payload}
            />
          )}

          {approval.status === "pending" ? (
            <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5">
              <p className="text-sm font-semibold text-amber-200">Make a decision</p>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <ModeButton active={mode === "approve"} label="Approve" onClick={() => setMode("approve")} />
                <ModeButton active={mode === "edit"} label="Edit & approve" onClick={() => setMode("edit")} />
                <ModeButton active={mode === "reject"} label="Reject" danger onClick={() => setMode("reject")} />
              </div>

              {mode === "edit" && (
                <label className="mt-4 block text-xs font-semibold text-slate-300">
                  Edited action payload
                  <textarea
                    value={editedPayload}
                    onChange={(event) => setEditedPayload(event.target.value)}
                    rows={10}
                    spellCheck={false}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-200 outline-none focus:border-cyan-400"
                  />
                </label>
              )}

              <label className="mt-4 block text-xs font-semibold text-slate-300">
                Decision note {mode === "reject" ? "(required)" : "(optional)"}
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder={mode === "reject" ? "Why should this action not proceed?" : "Add context for the audit trail..."}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
                />
              </label>

              <button
                type="button"
                onClick={() => void submit()}
                disabled={busy}
                className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  mode === "reject"
                    ? "bg-rose-500 text-white hover:bg-rose-400"
                    : "bg-cyan-500 text-white hover:bg-cyan-400"
                }`}
              >
                {busy ? "Saving decision…" : mode === "edit" ? "Save edits, approve, and resume" : mode === "reject" ? "Reject and resume workflow" : "Approve and resume workflow"}
              </button>
            </section>
          ) : (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-sm font-semibold text-white">Decision recorded</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {approval.decision_note || "No decision note was added."}
              </p>
              {canResume && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onResume()}
                  className="mt-4 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-400 disabled:opacity-50"
                >
                  {busy ? "Resuming…" : "Resume workflow"}
                </button>
              )}
            </section>
          )}

          <Timeline title="Decision history" items={approval.events.map((event) => ({
            id: event.id,
            label: formatLabel(event.event_type),
            note: event.note,
            date: event.created_at,
          }))} />

          <Timeline title="Workflow timeline" items={timeline.map((event) => ({
            id: event.id,
            label: formatLabel(event.event_type),
            note: event.note,
            date: event.created_at,
          }))} emptyLabel="No workflow events have been recorded yet." />
        </div>
      </aside>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 break-words text-slate-200">{value}</p></div>;
}

function ModeButton({ active, label, danger = false, onClick }: { active: boolean; label: string; danger?: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${active ? danger ? "border-rose-400 bg-rose-500/20 text-rose-100" : "border-cyan-400 bg-cyan-500/20 text-cyan-100" : "border-slate-700 bg-slate-950 text-slate-400 hover:text-white"}`}>{label}</button>;
}

function PayloadCard({ title, subtitle, payload }: { title: string; subtitle: string; payload: Record<string, unknown> }) {
  return <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><h3 className="text-sm font-semibold text-white">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p><pre className="mt-4 max-h-72 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-cyan-100">{JSON.stringify(payload, null, 2)}</pre></section>;
}

function Timeline({ title, items, emptyLabel = "No events have been recorded." }: { title: string; items: Array<{ id: number; label: string; note: string | null; date: string }>; emptyLabel?: string }) {
  return <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><h3 className="text-sm font-semibold text-white">{title}</h3><div className="mt-4 space-y-4">{items.length === 0 ? <p className="text-sm text-slate-500">{emptyLabel}</p> : items.map((item) => <div key={item.id} className="relative border-l border-slate-700 pl-4"><span className="absolute -left-1 top-1 h-2 w-2 rounded-full bg-cyan-400" /><p className="text-sm font-medium text-slate-200">{item.label}</p>{item.note && <p className="mt-1 text-xs leading-5 text-slate-400">{item.note}</p>}<p className="mt-1 text-[11px] text-slate-600">{formatDate(item.date)}</p></div>)}</div></section>;
}

function formatLabel(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}
