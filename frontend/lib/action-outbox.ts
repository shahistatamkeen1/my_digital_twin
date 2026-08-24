import {
  apiFetch,
  buildCollectionUrl,
  readListResponse,
  requireApiSuccess,
  type ListResult,
} from "@/lib/api";
import type { ApprovalActionType } from "@/types/approvals";
import type {
  ActionOutboxBatchResult,
  ActionOutboxDetail,
  ActionOutboxStatus,
  ActionOutboxSummary,
} from "@/types/action-outbox";

export type ActionOutboxListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ActionOutboxStatus | "";
  actionType?: ApprovalActionType | "";
  agentRunId?: number;
  sortBy?: "id" | "status" | "action_type" | "attempt_count" | "created_at" | "updated_at";
  sortOrder?: "asc" | "desc";
};

export async function listActionOutbox(
  query: ActionOutboxListQuery = {}
): Promise<ListResult<ActionOutboxSummary>> {
  const url = buildCollectionUrl("/api/action-outbox/", {
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    status: query.status,
    action_type: query.actionType,
    agent_run_id: query.agentRunId,
    sortBy: query.sortBy ?? "created_at",
    sortOrder: query.sortOrder ?? "desc",
  });
  return readListResponse<ActionOutboxSummary>(
    await apiFetch(url, { cache: "no-store" })
  );
}

export async function getActionOutboxEntry(
  outboxId: number
): Promise<ActionOutboxDetail> {
  const response = await apiFetch(`/api/action-outbox/${outboxId}`, {
    cache: "no-store",
  });
  await requireApiSuccess(response, "The action outbox entry could not be loaded.");
  return (await response.json()) as ActionOutboxDetail;
}

async function mutateActionOutboxEntry(
  outboxId: number,
  action: "dispatch" | "retry" | "cancel",
  body?: Record<string, unknown>
): Promise<ActionOutboxDetail> {
  const response = await apiFetch(`/api/action-outbox/${outboxId}/${action}`, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });
  const fallback = {
    dispatch: "The action could not be dispatched.",
    retry: "The action could not be queued for retry.",
    cancel: "The action could not be cancelled.",
  }[action];
  await requireApiSuccess(response, fallback);
  return (await response.json()) as ActionOutboxDetail;
}

export function dispatchActionOutboxEntry(
  outboxId: number
): Promise<ActionOutboxDetail> {
  return mutateActionOutboxEntry(outboxId, "dispatch");
}

export function retryActionOutboxEntry(
  outboxId: number
): Promise<ActionOutboxDetail> {
  return mutateActionOutboxEntry(outboxId, "retry");
}

export function cancelActionOutboxEntry(
  outboxId: number,
  reason?: string
): Promise<ActionOutboxDetail> {
  return mutateActionOutboxEntry(outboxId, "cancel", { reason });
}

export async function dispatchReadyActions(
  limit = 10
): Promise<ActionOutboxBatchResult> {
  const response = await apiFetch("/api/action-outbox/dispatch-ready", {
    method: "POST",
    body: JSON.stringify({ limit }),
  });
  await requireApiSuccess(response, "Ready actions could not be dispatched.");
  return (await response.json()) as ActionOutboxBatchResult;
}
