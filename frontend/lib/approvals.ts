import {
  apiFetch,
  buildCollectionUrl,
  readListResponse,
  requireApiSuccess,
  type ListResult,
} from "@/lib/api";
import type {
  ApprovalActionType,
  ApprovalDecisionInput,
  ApprovalDetail,
  ApprovalStatus,
  ApprovalSummary,
} from "@/types/approvals";

export type ApprovalListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ApprovalStatus | "";
  actionType?: ApprovalActionType | "";
  agentRunId?: number;
  sortBy?: "id" | "status" | "action_type" | "requested_at" | "expires_at" | "updated_at";
  sortOrder?: "asc" | "desc";
};

export async function listApprovals(
  query: ApprovalListQuery = {}
): Promise<ListResult<ApprovalSummary>> {
  const url = buildCollectionUrl("/api/approvals/", {
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    status: query.status,
    action_type: query.actionType,
    agent_run_id: query.agentRunId,
    sortBy: query.sortBy ?? "requested_at",
    sortOrder: query.sortOrder ?? "desc",
  });

  return readListResponse<ApprovalSummary>(
    await apiFetch(url, { cache: "no-store" })
  );
}

export async function getApproval(approvalId: number): Promise<ApprovalDetail> {
  const response = await apiFetch(`/api/approvals/${approvalId}`, {
    cache: "no-store",
  });
  await requireApiSuccess(response, "The approval request could not be loaded.");
  return (await response.json()) as ApprovalDetail;
}

async function decideApproval(
  approvalId: number,
  decision: "approve" | "reject",
  input: ApprovalDecisionInput
): Promise<ApprovalDetail> {
  const response = await apiFetch(`/api/approvals/${approvalId}/${decision}`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  await requireApiSuccess(
    response,
    decision === "approve"
      ? "The approval could not be approved."
      : "The approval could not be rejected."
  );
  return (await response.json()) as ApprovalDetail;
}

export function approveApproval(
  approvalId: number,
  input: ApprovalDecisionInput
): Promise<ApprovalDetail> {
  return decideApproval(approvalId, "approve", input);
}

export function rejectApproval(
  approvalId: number,
  input: ApprovalDecisionInput
): Promise<ApprovalDetail> {
  return decideApproval(approvalId, "reject", input);
}
