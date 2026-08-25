// M7-A — Audit Trail
//
// The audit trail is the forensic record of what MandateGuard did and WHY. A
// later auditor must be able to answer, from these rows alone:
//
//   WHO/WHAT           -> mandateId (+ actor: SYSTEM in M7-A)
//   WHAT CHANGED       -> baselineOfferVersion vs currentOfferVersion + findings
//   WHAT POLICY RAN    -> policyVersion
//   WHAT WAS DECIDED   -> decision (ALLOW | REVIEW | PAUSE) + reasons
//   WHAT WAS ATTEMPTED -> action (NO_ACTION | REVIEW_REQUIRED | PAUSE_SUBSCRIPTION)
//   WHAT HAPPENED      -> status (NOT_REQUIRED | PENDING | SUCCEEDED | FAILED | BLOCKED)
//
// Two hard rules:
//   1. Append-only. There is no update/delete in the repository interface, so a
//      historical record can never be rewritten when the merchant publishes a
//      new Offer version.
//   2. No secrets. Razorpay key ids/secrets, webhook secrets, LLM credentials,
//      tokens and raw provider payloads must never reach an audit row.

// STEP 7 — deliberately small, fixed taxonomy.
export type AuditEventType =
  | "INTEGRITY_EVALUATED"
  | "POLICY_DECIDED"
  | "ACTION_REQUESTED"
  | "ACTION_SUCCEEDED"
  | "ACTION_FAILED";

export const AUDIT_EVENT_TYPES: readonly AuditEventType[] = [
  "INTEGRITY_EVALUATED",
  "POLICY_DECIDED",
  "ACTION_REQUESTED",
  "ACTION_SUCCEEDED",
  "ACTION_FAILED",
];

// Write-side payload. Everything is server-derived; nothing here is ever
// client-supplied.
export interface AuditEventInput {
  mandateId: string;
  eventType: AuditEventType;
  policyVersion?: string | null;
  baselineOfferVersion?: number | null;
  currentOfferVersion?: number | null;
  decision?: string | null;
  action?: string | null;
  status?: string | null;
  reason?: string | null;
  providerSubscriptionId?: string | null;
  actionKey?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface AuditEventRecord {
  id: string;
  mandateId: string;
  eventType: AuditEventType;
  policyVersion: string | null;
  baselineOfferVersion: number | null;
  currentOfferVersion: number | null;
  decision: string | null;
  action: string | null;
  status: string | null;
  reason: string | null;
  providerSubscriptionId: string | null;
  actionKey: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
