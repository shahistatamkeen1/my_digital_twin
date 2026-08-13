export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired";

export type ApprovalActionType =
  | "send_email"
  | "create_calendar_event"
  | "submit_application"
  | "delete_data"
  | "change_financial_plan"
  | "external_action"
  | "other";

export type ApprovalEventType =
  | "requested"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired";

export type ApprovalEvent = {
  id: number;
  approval_id: number;
  event_type: ApprovalEventType;
  previous_status: ApprovalStatus | null;
  new_status: ApprovalStatus;
  note: string | null;
  event_payload: Record<string, unknown>;
  created_at: string;
};

export type ApprovalSummary = {
  id: number;
  agent_run_id: number;
  agent_step_id: number | null;
  action_type: ApprovalActionType;
  action_summary: string;
  proposed_payload: Record<string, unknown>;
  decision_payload: Record<string, unknown> | null;
  status: ApprovalStatus;
  decision_note: string | null;
  requested_at: string;
  decided_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ApprovalDetail = ApprovalSummary & {
  events: ApprovalEvent[];
};

export type ApprovalDecisionInput = {
  decision_note?: string;
  decision_payload?: Record<string, unknown>;
};

export type WorkflowTimelineItem = {
  id: number;
  agent_run_id: number;
  agent_step_id: number | null;
  approval_id: number | null;
  event_type: string;
  event_payload: Record<string, unknown>;
  note: string | null;
  created_at: string;
};
