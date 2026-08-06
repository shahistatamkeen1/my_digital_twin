import {
  apiFetch,
  buildCollectionUrl,
  readListResponse,
  requireApiSuccess,
  type ListResult,
} from "@/lib/api";
import type {
  AgentDefinition,
  AgentRunCancelResponse,
  AgentRunCreateInput,
  AgentRunDeleteResponse,
  AgentRunDetail,
  AgentRunExecuteInput,
  AgentRunStatus,
  AgentRunSummary,
  ExecutionMode,
} from "@/types/agent-runs";

export type AgentRunListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: AgentRunStatus | "";
  executionMode?: ExecutionMode | "";
  sortBy?: "id" | "status" | "execution_mode" | "created_at" | "updated_at";
  sortOrder?: "asc" | "desc";
};

export async function listAgents(): Promise<AgentDefinition[]> {
  const response = await apiFetch("/api/agents/", {
    cache: "no-store",
  });
  await requireApiSuccess(response, "The agent registry could not be loaded.");
  return (await response.json()) as AgentDefinition[];
}

export async function listAgentRuns(
  query: AgentRunListQuery = {}
): Promise<ListResult<AgentRunSummary>> {
  const url = buildCollectionUrl("/api/agent-runs/", {
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    status: query.status,
    execution_mode: query.executionMode,
    sortBy: query.sortBy ?? "created_at",
    sortOrder: query.sortOrder ?? "desc",
  });

  const response = await apiFetch(url, {
    cache: "no-store",
  });
  return readListResponse<AgentRunSummary>(response);
}

export async function getAgentRun(runId: number): Promise<AgentRunDetail> {
  const response = await apiFetch(`/api/agent-runs/${runId}`, {
    cache: "no-store",
  });
  await requireApiSuccess(response, "The agent workflow could not be loaded.");
  return (await response.json()) as AgentRunDetail;
}

export async function createAgentRun(
  input: AgentRunCreateInput
): Promise<AgentRunDetail> {
  const response = await apiFetch("/api/agent-runs/", {
    method: "POST",
    body: JSON.stringify(input),
  });
  await requireApiSuccess(response, "The workflow plan could not be created.");
  return (await response.json()) as AgentRunDetail;
}

export async function executeAgentRun(
  runId: number,
  input: AgentRunExecuteInput
): Promise<AgentRunDetail> {
  const response = await apiFetch(`/api/agent-runs/${runId}/execute`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  await requireApiSuccess(response, "The workflow could not be executed.");
  return (await response.json()) as AgentRunDetail;
}

export async function cancelAgentRun(
  runId: number
): Promise<AgentRunCancelResponse> {
  const response = await apiFetch(`/api/agent-runs/${runId}/cancel`, {
    method: "POST",
  });
  await requireApiSuccess(response, "The workflow could not be cancelled.");
  return (await response.json()) as AgentRunCancelResponse;
}

export async function retryAgentRun(runId: number): Promise<AgentRunDetail> {
  const response = await apiFetch(`/api/agent-runs/${runId}/retry`, {
    method: "POST",
  });
  await requireApiSuccess(response, "A retry workflow could not be created.");
  return (await response.json()) as AgentRunDetail;
}

export async function deleteAgentRun(
  runId: number
): Promise<AgentRunDeleteResponse> {
  const response = await apiFetch(`/api/agent-runs/${runId}`, {
    method: "DELETE",
  });
  await requireApiSuccess(response, "The workflow could not be deleted.");
  return (await response.json()) as AgentRunDeleteResponse;
}
