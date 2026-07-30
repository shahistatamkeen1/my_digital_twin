export type AgentName = "career" | "finance" | "health" | "learning";

export type AgentRunStatus =
  | "planned"
  | "running"
  | "synthesizing"
  | "completed"
  | "partially_completed"
  | "failed"
  | "cancelled";

export type AgentStepStatus =
  | "planned"
  | "running"
  | "completed"
  | "failed"
  | "skipped"
  | "cancelled";

export type ExecutionMode =
  | "single_agent"
  | "parallel_then_synthesize"
  | "sequential";

export type AgentExecutionProvider = "configured" | "deterministic";

export type AgentDefinition = {
  name: AgentName;
  display_name: string;
  description: string;
  supported_tasks: string[];
  required_context: string[];
  timeout_seconds: number;
  max_retries: number;
  estimated_cost_category: string;
  requires_approval: boolean;
  enabled: boolean;
};

export type AgentContribution = {
  summary: string;
  key_data_points: string[];
  recommendations: string[];
  risks: string[];
  score: number;
  confidence: number;
};

export type UnifiedAgentPlan = {
  summary: string;
  priorities: string[];
  weekly_plan: Array<Record<string, unknown>>;
  risks: string[];
  success_metrics: string[];
  next_checkpoint: string;
  agent_contributions: Partial<Record<AgentName, AgentContribution>>;
};

export type AgentRunResultPayload = {
  unified_plan?: UnifiedAgentPlan;
  agent_contributions?: Partial<Record<AgentName, AgentContribution>>;
  execution?: {
    provider?: string | null;
    synthesis_provider?: string | null;
    synthesis_model?: string | null;
    synthesis_duration_ms?: number;
    synthesis_tokens?: number;
    failed_agents?: string[];
    fallback_count?: number;
    synthesis_error?: string | null;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type AgentStep = {
  id: number;
  agent_run_id: number;
  agent_name: AgentName;
  step_order: number;
  status: AgentStepStatus;
  input_payload: Record<string, unknown>;
  output_payload: AgentContribution | null;
  error_message: string | null;
  attempt_count: number;
  timeout_seconds: number;
  max_retries: number;
  requires_approval: boolean;
  provider: string | null;
  model: string | null;
  fallback_used: boolean;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost: number;
  duration_ms: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AgentRunSummary = {
  id: number;
  retry_of_run_id: number | null;
  goal: string;
  status: AgentRunStatus;
  execution_mode: ExecutionMode;
  execution_provider: string | null;
  selected_agents: AgentName[];
  preferred_agents: AgentName[];
  include_weekly_plan: boolean;
  routing_reason: string;
  request_payload: Record<string, unknown>;
  result_payload: AgentRunResultPayload | null;
  error_message: string | null;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost: number;
  duration_ms: number;
  fallback_count: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AgentRunDetail = AgentRunSummary & {
  steps: AgentStep[];
};

export type AgentRunCreateInput = {
  goal: string;
  preferred_agents: AgentName[];
  include_weekly_plan: boolean;
  context?: Record<string, unknown>;
};

export type AgentRunExecuteInput = {
  provider: AgentExecutionProvider;
  allow_partial: boolean;
  allow_fallback: boolean;
  force_sequential: boolean;
};

export type AgentRunCancelResponse = {
  message: string;
  run: AgentRunDetail;
};

export type AgentRunDeleteResponse = {
  message: string;
  deleted_run_id: number;
};
