import { getGateway } from "@/lib/razorpay/gateway";

// M7-A — Provider seam for ACTIONS.
//
//   ActionExecutor
//         |
//         v
//   RazorpayActionGateway
//         |-- MockRazorpayActionGateway     (tests / offline demo)
//         |-- DisabledRazorpayActionGateway (default in M7-A: refuses to act)
//         '-- RealRazorpayActionGateway     (production seam, wired in M7-B)
//
// This interface is intentionally MINIMAL: the only provider mutation the
// policy layer can ever cause is a subscription pause. Nothing here can charge,
// cancel, re-baseline or create anything.

export type ActionGatewayErrorCode = "PROVIDER_REJECTED" | "PROVIDER_UNAVAILABLE";

// Controlled provider failure. The message is a short, safe summary — provider
// response bodies and stack traces are never propagated to the audit trail.
export class ActionGatewayError extends Error {
  constructor(
    message: string,
    public readonly code: ActionGatewayErrorCode,
  ) {
    super(message);
    this.name = "ActionGatewayError";
  }
}

export interface PauseSubscriptionResult {
  providerSubscriptionId: string;
  providerStatus: string;
}

export interface RazorpayActionGateway {
  pauseSubscription(subscriptionId: string): Promise<PauseSubscriptionResult>;
}

// ---------------------------------------------------------------------------
// MockRazorpayActionGateway — deterministic, in-process, NO network at all.
//
// Supports the three outcomes M7-A must be able to test:
//   mode = "SUCCESS"     -> pause succeeds
//   mode = "FAILURE"     -> provider rejects the pause (PROVIDER_REJECTED)
//   mode = "UNAVAILABLE" -> provider cannot be reached (PROVIDER_UNAVAILABLE)
// ---------------------------------------------------------------------------
export type MockActionGatewayMode = "SUCCESS" | "FAILURE" | "UNAVAILABLE";

export class MockRazorpayActionGateway implements RazorpayActionGateway {
  // Every subscription id this gateway was asked to pause, in order. Tests
  // assert "called exactly once" / "never called" against this.
  readonly pauseCalls: string[] = [];

  constructor(public mode: MockActionGatewayMode = "SUCCESS") {}

  get callCount(): number {
    return this.pauseCalls.length;
  }

  async pauseSubscription(subscriptionId: string): Promise<PauseSubscriptionResult> {
    this.pauseCalls.push(subscriptionId);
    if (this.mode === "UNAVAILABLE") {
      throw new ActionGatewayError(
        "Provider unavailable.",
        "PROVIDER_UNAVAILABLE",
      );
    }
    if (this.mode === "FAILURE") {
      throw new ActionGatewayError(
        "Provider rejected the pause request.",
        "PROVIDER_REJECTED",
      );
    }
    return { providerSubscriptionId: subscriptionId, providerStatus: "paused" };
  }
}

// ---------------------------------------------------------------------------
// DisabledRazorpayActionGateway — the DEFAULT in M7-A.
//
// M7-A is an offline milestone: no real Razorpay mutation may happen. Rather
// than silently defaulting to the real adapter, the default gateway refuses,
// loudly and safely, with PROVIDER_UNAVAILABLE. The executor records
// ACTION_FAILED and never invents a success.
// ---------------------------------------------------------------------------
export class DisabledRazorpayActionGateway implements RazorpayActionGateway {
  async pauseSubscription(): Promise<PauseSubscriptionResult> {
    throw new ActionGatewayError(
      "Live provider actions are disabled in this milestone (M7-A is offline).",
      "PROVIDER_UNAVAILABLE",
    );
  }
}

// ---------------------------------------------------------------------------
// RealRazorpayActionGateway — production seam only.
//
// It delegates to the EXISTING M0 Razorpay adapter (lib/razorpay/gateway). It
// is exported so M7-B is a wiring change rather than a rewrite, but it is NEVER
// selected by `getActionGateway()` while LIVE_ACTIONS_ENABLED is false.
// ---------------------------------------------------------------------------
export class RealRazorpayActionGateway implements RazorpayActionGateway {
  async pauseSubscription(subscriptionId: string): Promise<PauseSubscriptionResult> {
    try {
      const sub = await getGateway().pauseSubscription(subscriptionId);
      return { providerSubscriptionId: sub.id, providerStatus: sub.status };
    } catch {
      // Provider internals (HTTP body, SDK stack) are intentionally dropped.
      throw new ActionGatewayError(
        "Provider pause request failed.",
        "PROVIDER_REJECTED",
      );
    }
  }
}

// M7-A: hard-off. M7-B flips this seam (behind credentials + explicit config).
// Typed as boolean (not the literal `false`) so the production branch below is
// real, reviewable code rather than something the compiler erases.
export const LIVE_ACTIONS_ENABLED: boolean = false;

let override: RazorpayActionGateway | null = null;
let disabled: DisabledRazorpayActionGateway | null = null;

// Test/demo seam: inject a gateway (e.g. MockRazorpayActionGateway), or null to
// restore the default.
export function setActionGateway(gateway: RazorpayActionGateway | null): void {
  override = gateway;
}

export function getActionGateway(): RazorpayActionGateway {
  if (override) return override;
  // LIVE_ACTIONS_ENABLED is false in M7-A, so the real gateway is unreachable
  // from here by construction.
  if (LIVE_ACTIONS_ENABLED) return new RealRazorpayActionGateway();
  if (!disabled) disabled = new DisabledRazorpayActionGateway();
  return disabled;
}

export function resetActionGateway(): void {
  override = null;
  disabled = null;
}
