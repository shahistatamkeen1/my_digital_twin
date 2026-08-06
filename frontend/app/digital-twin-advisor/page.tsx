"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import AppShell from "@/components/AppShell";
import AgentGoalComposer, {
  type GoalComposerValues,
} from "@/components/orchestration/AgentGoalComposer";
import AgentRunHistory from "@/components/orchestration/AgentRunHistory";
import AgentRunProgress from "@/components/orchestration/AgentRunProgress";
import AgentRunResult from "@/components/orchestration/AgentRunResult";
import AgentRunTelemetry from "@/components/orchestration/AgentRunTelemetry";
import AgentStatusBadge from "@/components/orchestration/AgentStatusBadge";
import { AGENT_VISUALS } from "@/components/orchestration/agent-visuals";
import {
  cancelAgentRun,
  createAgentRun,
  deleteAgentRun,
  executeAgentRun,
  getAgentRun,
  listAgentRuns,
  listAgents,
  retryAgentRun,
} from "@/lib/agent-runs";
import { ApiError, type PaginationMeta } from "@/lib/api";
import type {
  AgentDefinition,
  AgentExecutionProvider,
  AgentRunDetail,
  AgentRunStatus,
  AgentRunSummary,
} from "@/types/agent-runs";

const EMPTY_PAGINATION: PaginationMeta = {
  page: 1,
  page_size: 8,
  total_items: 0,
  total_pages: 0,
  has_next: false,
  has_previous: false,
};

const TERMINAL_STATUSES = new Set<AgentRunStatus>([
  "completed",
  "partially_completed",
  "failed",
  "cancelled",
]);

const RETRYABLE_STATUSES = new Set<AgentRunStatus>([
  "partially_completed",
  "failed",
  "cancelled",
]);

export default function DigitalTwinAdvisorPage() {
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [runs, setRuns] = useState<AgentRunSummary[]>([]);
  const [selectedRun, setSelectedRun] = useState<AgentRunDetail | null>(null);
  const [pagination, setPagination] =
    useState<PaginationMeta>(EMPTY_PAGINATION);

  const [composer, setComposer] = useState<GoalComposerValues>({
    goal: "",
    preferredAgents: [],
    includeWeeklyPlan: true,
  });
  const [provider, setProvider] =
    useState<AgentExecutionProvider>("deterministic");
  const [allowPartial, setAllowPartial] = useState(true);
  const [allowFallback, setAllowFallback] = useState(false);
  const [forceSequential, setForceSequential] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AgentRunStatus | "">("");
  const [page, setPage] = useState(1);

  const [registryLoading, setRegistryLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [executingRunId, setExecutingRunId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeSelectedRun =
    selectedRun?.status === "running" ||
    selectedRun?.status === "synthesizing" ||
    selectedRun?.id === executingRunId;

  const selectedRunTerminal = selectedRun
    ? TERMINAL_STATUSES.has(selectedRun.status)
    : false;

  const loadRegistry = useCallback(async () => {
    setRegistryLoading(true);
    try {
      setAgents(await listAgents());
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setRegistryLoading(false);
    }
  }, []);

  const loadHistory = useCallback(
    async (requestedPage = page) => {
      setHistoryLoading(true);
      try {
        const result = await listAgentRuns({
          page: requestedPage,
          pageSize: 8,
          search: search.trim() || undefined,
          status: statusFilter,
          sortBy: "created_at",
          sortOrder: "desc",
        });
        setRuns(result.items);
        setPagination(result.pagination);

      } catch (requestError) {
        setError(errorMessage(requestError));
      } finally {
        setHistoryLoading(false);
      }
    },
    [page, search, statusFilter]
  );

  useEffect(() => {
    void loadRegistry();
  }, [loadRegistry]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadHistory();
    }, search ? 300 : 0);

    return () => window.clearTimeout(timer);
  }, [loadHistory, search]);

  useEffect(() => {
    if (!selectedRun || !activeSelectedRun) {
      return;
    }

    const runId = selectedRun.id;
    const timer = window.setInterval(() => {
      void getAgentRun(runId)
        .then((detail) => {
          setSelectedRun(detail);
          if (TERMINAL_STATUSES.has(detail.status)) {
            setExecutingRunId(null);
          }
        })
        .catch(() => {
          // The main execute request reports actionable errors.
        });
    }, 1200);

    return () => window.clearInterval(timer);
  }, [activeSelectedRun, selectedRun]);

  const dashboardMetrics = useMemo(() => {
    const completed = runs.filter((run) => run.status === "completed").length;
    const active = runs.filter(
      (run) => run.status === "running" || run.status === "synthesizing"
    ).length;

    return [
      {
        label: "Registered twins",
        value: registryLoading ? "—" : String(agents.length),
        note: "Available for routing",
      },
      {
        label: "Visible workflows",
        value: historyLoading ? "—" : String(pagination.total_items),
        note: "Current history view",
      },
      {
        label: "Completed here",
        value: historyLoading ? "—" : String(completed),
        note: "On this page",
      },
      {
        label: "Active here",
        value: historyLoading ? "—" : String(active),
        note: "Running or synthesizing",
      },
    ];
  }, [
    agents.length,
    historyLoading,
    pagination.total_items,
    registryLoading,
    runs,
  ]);

  const selectRun = async (runId: number) => {
    setDetailLoading(true);
    setError(null);
    try {
      setSelectedRun(await getAgentRun(runId));
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setDetailLoading(false);
    }
  };

  const createRun = async () => {
    if (composer.goal.trim().length < 5) {
      setError("Enter a goal with at least five meaningful characters.");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const run = await createAgentRun({
        goal: composer.goal.trim(),
        preferred_agents: composer.preferredAgents,
        include_weekly_plan: composer.includeWeeklyPlan,
        context: {
          source: "phase6c-agent-workspace",
          requested_provider: provider,
        },
      });
      setSelectedRun(run);
      setComposer((current) => ({ ...current, goal: "" }));
      setPage(1);
      await loadHistory(1);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setCreating(false);
    }
  };

  const executeRun = async () => {
    if (!selectedRun || selectedRun.status !== "planned") {
      return;
    }

    const runId = selectedRun.id;
    setExecutingRunId(runId);
    setError(null);
    setSelectedRun((current) =>
      current
        ? {
            ...current,
            status: "running",
            execution_provider: provider,
            steps: current.steps.map((step) => ({
              ...step,
              status: "running",
              provider,
            })),
          }
        : current
    );

    try {
      const result = await executeAgentRun(runId, {
        provider,
        allow_partial: allowPartial,
        allow_fallback: allowFallback,
        force_sequential: forceSequential,
      });
      setSelectedRun(result);
      await loadHistory();
    } catch (requestError) {
      setError(errorMessage(requestError));
      try {
        setSelectedRun(await getAgentRun(runId));
      } catch {
        // Preserve the optimistic run when the refresh also fails.
      }
    } finally {
      setExecutingRunId(null);
    }
  };

  const cancelRun = async () => {
    if (!selectedRun) {
      return;
    }

    setPendingAction("cancel");
    setError(null);
    try {
      const response = await cancelAgentRun(selectedRun.id);
      setSelectedRun(response.run);
      setExecutingRunId(null);
      await loadHistory();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setPendingAction(null);
    }
  };

  const retryRun = async () => {
    if (!selectedRun) {
      return;
    }

    setPendingAction("retry");
    setError(null);
    try {
      const retry = await retryAgentRun(selectedRun.id);
      setSelectedRun(retry);
      setPage(1);
      await loadHistory(1);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setPendingAction(null);
    }
  };

  const removeRun = async () => {
    if (!selectedRun) {
      return;
    }

    const confirmed = window.confirm(
      `Delete workflow #${selectedRun.id}? This removes its steps and results.`
    );
    if (!confirmed) {
      return;
    }

    setPendingAction("delete");
    setError(null);
    try {
      await deleteAgentRun(selectedRun.id);
      setSelectedRun(null);
      await loadHistory();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setPendingAction(null);
    }
  };

  const refreshSelectedRun = async () => {
    if (!selectedRun) {
      return;
    }

    setPendingAction("refresh");
    setError(null);
    try {
      setSelectedRun(await getAgentRun(selectedRun.id));
      await loadHistory();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1650px]">
        <header className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/40 p-6 shadow-2xl shadow-black/20 sm:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-cyan-300">
                Master Digital Twin · Phase 6C
              </p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                Multi-Agent Mission Workspace
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
                Plan a cross-domain goal, review the routed twins, execute them
                with isolated personal context, and receive one coordinated
                action plan.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {agents.map((agent) => (
                <span
                  key={agent.name}
                  className={`rounded-full px-3 py-2 text-xs font-semibold ${AGENT_VISUALS[agent.name].badgeClass}`}
                >
                  {AGENT_VISUALS[agent.name].icon} {agent.display_name}
                </span>
              ))}
            </div>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mt-5 flex flex-col gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100 sm:flex-row sm:items-start sm:justify-between"
          >
            <span className="leading-6">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="self-start font-semibold text-rose-200 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {dashboardMetrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
            >
              <p className="text-xs text-slate-500">{metric.label}</p>
              <p className="mt-2 text-2xl font-bold text-white">{metric.value}</p>
              <p className="mt-1 text-xs text-slate-500">{metric.note}</p>
            </div>
          ))}
        </section>

        <div className="mt-6 grid items-start gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
          <div className="space-y-6">
            <AgentGoalComposer
              agents={agents}
              values={composer}
              provider={provider}
              allowPartial={allowPartial}
              allowFallback={allowFallback}
              forceSequential={forceSequential}
              selectedAgents={selectedRun?.selected_agents}
              busy={creating || registryLoading}
              onChange={setComposer}
              onProviderChange={(value) => {
                setProvider(value);
                if (value === "deterministic") {
                  setAllowFallback(false);
                }
              }}
              onAllowPartialChange={setAllowPartial}
              onAllowFallbackChange={setAllowFallback}
              onForceSequentialChange={setForceSequential}
              onSubmit={createRun}
            />

            <AgentRunHistory
              runs={runs}
              pagination={pagination}
              selectedRunId={selectedRun?.id ?? null}
              search={search}
              statusFilter={statusFilter}
              loading={historyLoading}
              onSearchChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              onStatusFilterChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              onSelect={selectRun}
              onPageChange={setPage}
              onRefresh={() => void loadHistory()}
            />
          </div>

          <main className="min-w-0 space-y-6">
            {detailLoading ? (
              <LoadingRun />
            ) : selectedRun ? (
              <>
                <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <AgentStatusBadge status={selectedRun.status} />
                      <span className="text-xs text-slate-500">
                        Run #{selectedRun.id}
                      </span>
                      {selectedRun.retry_of_run_id && (
                        <span className="text-xs text-slate-500">
                          Retry of #{selectedRun.retry_of_run_id}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedRun.status === "planned" && (
                        <ActionButton
                          label={
                            executingRunId === selectedRun.id
                              ? "Executing..."
                              : "Execute workflow"
                          }
                          primary
                          disabled={
                            executingRunId !== null || pendingAction !== null
                          }
                          onClick={() => void executeRun()}
                        />
                      )}

                      {activeSelectedRun && (
                        <ActionButton
                          label={
                            pendingAction === "cancel"
                              ? "Cancelling..."
                              : "Cancel"
                          }
                          danger
                          disabled={pendingAction !== null}
                          onClick={() => void cancelRun()}
                        />
                      )}

                      {selectedRunTerminal &&
                        RETRYABLE_STATUSES.has(selectedRun.status) && (
                          <ActionButton
                            label={
                              pendingAction === "retry"
                                ? "Creating retry..."
                                : "Retry"
                            }
                            disabled={pendingAction !== null}
                            onClick={() => void retryRun()}
                          />
                        )}

                      <ActionButton
                        label={
                          pendingAction === "refresh"
                            ? "Refreshing..."
                            : "Refresh"
                        }
                        disabled={pendingAction !== null}
                        onClick={() => void refreshSelectedRun()}
                      />

                      {!activeSelectedRun && (
                        <ActionButton
                          label={
                            pendingAction === "delete"
                              ? "Deleting..."
                              : "Delete"
                          }
                          danger
                          disabled={pendingAction !== null}
                          onClick={() => void removeRun()}
                        />
                      )}
                    </div>
                  </div>

                  {selectedRun.status === "planned" && (
                    <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm leading-6 text-cyan-100">
                      This plan is ready. Review the routed twins below, choose
                      execution options in the composer, and select
                      <strong> Execute workflow</strong>.
                    </div>
                  )}
                </section>

                <AgentRunProgress run={selectedRun} />

                {selectedRun.error_message && (
                  <section className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5">
                    <p className="text-sm font-semibold text-amber-200">
                      Workflow notice
                    </p>
                    <p className="mt-2 text-sm leading-6 text-amber-100/80">
                      {selectedRun.error_message}
                    </p>
                  </section>
                )}

                <AgentRunResult run={selectedRun} />
                <AgentRunTelemetry run={selectedRun} />
              </>
            ) : (
              <EmptyWorkspace />
            )}
          </main>
        </div>
      </div>
    </AppShell>
  );
}

function ActionButton({
  label,
  primary = false,
  danger = false,
  disabled,
  onClick,
}: {
  label: string;
  primary?: boolean;
  danger?: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const style = primary
    ? "border-cyan-400 bg-cyan-500 text-white hover:bg-cyan-400"
    : danger
      ? "border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
      : "border-slate-700 bg-slate-950 text-slate-300 hover:border-cyan-400 hover:text-white";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${style}`}
    >
      {label}
    </button>
  );
}

function LoadingRun() {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 px-6 py-20 text-center">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/20 border-t-cyan-400" />
      <p className="mt-4 text-sm text-slate-400">Loading workflow detail...</p>
    </div>
  );
}

function EmptyWorkspace() {
  return (
    <section className="flex min-h-[640px] items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center">
      <div className="max-w-xl">
        <div className="text-6xl">🧬</div>
        <h2 className="mt-5 text-3xl font-bold">Coordinate your Digital Twins</h2>
        <p className="mt-4 text-sm leading-7 text-slate-400">
          Create a goal from the mission composer or select a previous workflow.
          The router will choose the right twins while preserving domain-level
          context isolation.
        </p>
      </div>
    </section>
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.requestId
      ? `${error.message} Reference: ${error.requestId}`
      : error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "The request could not be completed.";
}
