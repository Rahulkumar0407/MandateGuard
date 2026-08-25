// Canonical local subscription lifecycle states.
//
// These are the states OUR application owns and persists. They are intentionally
// a small, deterministic set distinct from (but mapped to) Razorpay's raw
// subscription status strings. Webhooks are the authoritative source for
// transitions; the pause/resume APIs guard against invalid client-driven calls.

export type LocalStatus =
  | "PENDING"
  | "ACTIVE"
  | "PAUSED"
  | "HALTED"
  | "CANCELLED";

export const LOCAL_STATUSES: readonly LocalStatus[] = [
  "PENDING",
  "ACTIVE",
  "PAUSED",
  "HALTED",
  "CANCELLED",
];

// Razorpay subscription lifecycle webhook events we actually handle.
export const SUBSCRIPTION_EVENTS = [
  "subscription.pending",
  "subscription.activated",
  "subscription.charged",
  "subscription.paused",
  "subscription.resumed",
  "subscription.halted",
  "subscription.cancelled",
] as const;

export type SubscriptionEvent = (typeof SUBSCRIPTION_EVENTS)[number];

// Map a Razorpay subscription lifecycle webhook event to the target local
// status. Returns null when the event does NOT change the local status
// (e.g. a successful charge keeps an ACTIVE subscription ACTIVE). Unknown
// events also return null so they are never applied as a state change.
export function statusForEvent(event: string): LocalStatus | null {
  switch (event) {
    case "subscription.pending":
      return "PENDING";
    case "subscription.activated":
    case "subscription.resumed":
      return "ACTIVE";
    case "subscription.paused":
      return "PAUSED";
    case "subscription.halted":
      return "HALTED";
    case "subscription.cancelled":
      return "CANCELLED";
    case "subscription.charged":
    default:
      return null;
  }
}

export function isKnownSubscriptionEvent(event: string): boolean {
  return (SUBSCRIPTION_EVENTS as readonly string[]).includes(event);
}

// Map a raw Razorpay subscription.status string (as returned by the SDK/fetch)
// to our canonical local status. Anything unrecognized defaults to PENDING,
// which is the safest starting assumption for a freshly created subscription.
export function localStatusFromRazorpay(status?: string | null): LocalStatus {
  switch ((status ?? "").toLowerCase()) {
    case "authenticated":
    case "active":
      return "ACTIVE";
    case "paused":
      return "PAUSED";
    case "halted":
      return "HALTED";
    case "cancelled":
      return "CANCELLED";
    case "created":
    default:
      return "PENDING";
  }
}

export type ChargeOutcome = "success" | "failed" | "none";

// Determine the payment charge outcome represented by a webhook payload.
// A captured `subscription.charged` is a success; an explicitly failed payment
// (Razorpay's `payment.failed` event, or a charged event whose payment entity
// is marked failed) is a failure. Anything else is not a charge event.
export function chargeOutcome(event: string, paymentStatus?: string): ChargeOutcome {
  if (event === "subscription.charged") {
    return paymentStatus === "failed" ? "failed" : "success";
  }
  if (event === "payment.failed") {
    return "failed";
  }
  return "none";
}
