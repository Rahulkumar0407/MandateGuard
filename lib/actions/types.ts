import type { MandateDecision } from "@/lib/policy/types";

// M7-A — Action Boundary
//
// The action layer is the ONLY layer that is ever allowed to invoke a provider
// mutation. It sits strictly downstream of the policy layer:
//
//   Integrity -> Policy -> PolicyDecision -> ActionExecutor -> ActionResult
//
// The action is derived DETERMINISTICALLY from the policy decision. No LLM, no
// client, and no merchant text can select an action.

// STEP 2 — explicit action vocabulary.
export type ActionType = "NO_ACTION" | "REVIEW_REQUIRED" | "PAUSE_SUBSCRIPTION";

// STEP 10 — explicit action states. Execution is synchronous in M7-A; there is
// no queue. BLOCKED means "a prerequisite failed, so nothing was attempted" —
// it is never silently converted into NO_ACTION/NOT_REQUIRED (i.e. never an
// implicit ALLOW).
export type ActionStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "BLOCKED";

// STEP 2 — the ONLY decision -> action mapping in the system.
export const ACTION_BY_DECISION: Record<MandateDecision, ActionType> = {
  ALLOW: "NO_ACTION",
  REVIEW: "REVIEW_REQUIRED",
  PAUSE: "PAUSE_SUBSCRIPTION",
};

export function actionForDecision(decision: MandateDecision): ActionType {
  return ACTION_BY_DECISION[decision];
}

// Machine-readable reason codes. The API and audit trail expose these codes
// (plus a server-generated human sentence) and never a provider error body or
// an internal stack trace.
export type ActionReasonCode =
  // Non-action outcomes
  | "NO_DEGRADATION_DETECTED"
  | "MANUAL_REVIEW_REQUIRED"
  // Successful / duplicate execution
  | "PAUSE_EXECUTED"
  | "ALREADY_EXECUTED"
  // Blocked prerequisites (STEP 4) — nothing was attempted at the provider
  | "MANDATE_NOT_AUTHORIZED"
  | "MISSING_PROVIDER_SUBSCRIPTION_ID"
  | "EVALUATION_INCOMPLETE"
  | "INTEGRITY_EVALUATION_UNAVAILABLE"
  | "ACTION_IN_PROGRESS"
  // Provider outcomes
  | "PROVIDER_REJECTED"
  | "PROVIDER_UNAVAILABLE";

export interface ActionResult {
  mandateId: string;
  // null only when integrity evaluation itself was unavailable, i.e. no policy
  // decision could be produced. Never coerced to ALLOW.
  decision: MandateDecision | null;
  // Deterministically mapped from `decision` (null when there is no decision).
  intendedAction: ActionType | null;
  // What was actually carried out. NO_ACTION when a prerequisite blocked the
  // intended action (STEP 4: "no action, with an explicit failure reason").
  action: ActionType;
  status: ActionStatus;
  reason: ActionReasonCode;
  // Server-generated explanation built from structured facts only.
  detail: string;
  // true whenever a human must look at this mandate: REVIEW decisions, blocked
  // prerequisites and failed provider attempts.
  requiresManualReview: boolean;
  // true when a previously SUCCEEDED action satisfied this evaluation and no
  // new provider call was made.
  idempotent: boolean;
  // Frozen decision context (STEP 8/9).
  policyVersion: string | null;
  baselineOfferVersion: number | null;
  currentOfferVersion: number | null;
  reasons: string[]; // finding types that produced the decision
  providerSubscriptionId: string | null;
  actionKey: string | null;
  evaluatedAt: string;
  auditEventIds: string[];
}

// --- Idempotency ------------------------------------------------------------

// STEP 5 — the deterministic action key. The same mandate, evaluated by the
// same policy version against the same baseline/current offer versions, always
// produces the same key, and the key is UNIQUE in the database. That is what
// makes a repeated evaluation unable to pause the same subscription twice.
export function buildActionKey(input: {
  mandateId: string;
  policyVersion: string;
  baselineOfferVersion: number;
  currentOfferVersion: number | null;
  action: ActionType;
}): string {
  return [
    input.mandateId,
    input.policyVersion,
    `b${input.baselineOfferVersion}`,
    `c${input.currentOfferVersion ?? "none"}`,
    input.action,
  ].join("|");
}

export interface ActionRecord {
  id: string;
  mandateId: string;
  actionKey: string;
  action: ActionType;
  status: Extract<ActionStatus, "PENDING" | "SUCCEEDED" | "FAILED">;
  decision: MandateDecision;
  policyVersion: string;
  baselineOfferVersion: number;
  currentOfferVersion: number | null;
  providerSubscriptionId: string | null;
  reason: string | null;
  attemptCount: number;
  executedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReserveActionInput {
  mandateId: string;
  actionKey: string;
  action: ActionType;
  decision: MandateDecision;
  policyVersion: string;
  baselineOfferVersion: number;
  currentOfferVersion: number | null;
  providerSubscriptionId: string | null;
}

// `created: false` means the unique action key already existed — the caller
// MUST NOT perform the provider mutation again.
export interface ReserveActionResult {
  record: ActionRecord;
  created: boolean;
}

// Controlled action failure surfaced to the API (never leaks internals).
export class ActionError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}
