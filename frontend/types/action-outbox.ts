import type { ApprovalActionType } from "@/types/approvals";

export type ActionOutboxStatus =
  | "queued"
  | "dispatching"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "dead_lettered";

export type ActionOutboxEventType =
  | "queued"
  | "dispatch_started"
  | "dispatch_succeeded"
  | "dispatch_failed"
  | "retry_scheduled"
  | "cancelled"
  | "dead_lettered"
  | "stale_requeued";

export type ActionOutboxEvent = {
  id: number;
  outbox_id: number;
  event_type: ActionOutboxEventType;
  previous_status: ActionOutboxStatus | null;
  new_status: ActionOutboxStatus;
  attempt_number: number | null;
  note: string | null;
  event_payload: Record<string, unknown>;
  created_at: string;
};

export type ActionOutboxSummary = {
  id: number;
  approval_id: number;
  agent_run_id: number;
  agent_step_id: number | null;
  idempotency_key: string;
  action_type: ApprovalActionType;
  action_summary: string;
  execution_payload: Record<string, unknown>;
  execution_mode: "dry_run";
  status: ActionOutboxStatus;
  attempt_count: number;
  max_attempts: number;
  last_error: string | null;
  result_payload: Record<string, unknown> | null;
  next_attempt_at: string | null;
  claimed_at: string | null;
  dispatched_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ActionOutboxDetail = ActionOutboxSummary & {
  events: ActionOutboxEvent[];
};

export type ActionOutboxBatchResult = {
  processed: number;
  succeeded: number;
  failed: number;
  items: ActionOutboxDetail[];
};
