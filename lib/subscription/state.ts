import type { LocalStatus } from "@/lib/razorpay/status";
import { LOCAL_STATUSES } from "@/lib/razorpay/status";

// Deterministic client-driven state transitions. Webhooks remain authoritative
// and are applied directly via event mapping (see lib/razorpay/status.ts).
// These rules guard the explicit pause/resume API endpoints so we never issue a
// Razorpay pause/resume call in an invalid local state.
// The supported client-driven transitions (webhooks are applied directly by
// event mapping and are not constrained by this table):
//   PENDING  -> ACTIVE
//   ACTIVE   -> PAUSED | HALTED | CANCELLED
//   PAUSED   -> ACTIVE
//   (HALTED and CANCELLED are terminal)
const TRANSITIONS: Record<LocalStatus, readonly LocalStatus[]> = {
  PENDING: ["ACTIVE"],
  ACTIVE: ["PAUSED", "HALTED", "CANCELLED"],
  PAUSED: ["ACTIVE"],
  HALTED: [],
  CANCELLED: [],
};

export function isValidTransition(from: LocalStatus, to: LocalStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export type PauseEvaluation =
  | { allowed: true }
  | { allowed: false; reason: string };

export type ResumeEvaluation =
  | { allowed: true }
  | { allowed: false; reason: string };

// Normalize an arbitrary status value (string from DB, null, undefined) into a
// known LocalStatus, or null when it cannot be interpreted.
export function normalizeStatus(
  status: LocalStatus | string | null | undefined,
): LocalStatus | null {
  if (!status) return null;
  const value = String(status).toUpperCase();
  return (LOCAL_STATUSES as readonly string[]).includes(value)
    ? (value as LocalStatus)
    : null;
}

// Pause is only valid from ACTIVE. Every other state must be handled safely by
// the caller (e.g. wait for authentication, avoid a redundant pause, etc.).
export function evaluatePause(
  current: LocalStatus | string | null | undefined,
): PauseEvaluation {
  const status = normalizeStatus(current);
  if (!status) {
    return { allowed: false, reason: "Subscription not found" };
  }
  if (status === "ACTIVE") {
    return { allowed: true };
  }
  switch (status) {
    case "PENDING":
      return {
        allowed: false,
        reason: "Subscription is pending authentication; pause is not allowed yet.",
      };
    case "PAUSED":
      return { allowed: false, reason: "Subscription is already paused." };
    case "HALTED":
      return { allowed: false, reason: "Subscription is halted; cannot pause." };
    case "CANCELLED":
      return { allowed: false, reason: "Subscription is cancelled; cannot pause." };
    default:
      return {
        allowed: false,
        reason: `Cannot pause subscription in state '${status}'.`,
      };
  }
}

// Resume is only valid from PAUSED.
export function evaluateResume(
  current: LocalStatus | string | null | undefined,
): ResumeEvaluation {
  const status = normalizeStatus(current);
  if (!status) {
    return { allowed: false, reason: "Subscription not found" };
  }
  if (status === "PAUSED") {
    return { allowed: true };
  }
  switch (status) {
    case "ACTIVE":
      return { allowed: false, reason: "Subscription is already active." };
    case "PENDING":
      return { allowed: false, reason: "Subscription is pending; cannot resume." };
    case "HALTED":
      return { allowed: false, reason: "Subscription is halted; cannot resume." };
    case "CANCELLED":
      return { allowed: false, reason: "Subscription is cancelled; cannot resume." };
    default:
      return {
        allowed: false,
        reason: `Cannot resume subscription in state '${status}'.`,
      };
  }
}
