import { describe, it, expect, afterEach } from "vitest";
import { setSemanticProvider } from "@/lib/integrity/semantic-provider";
import { MockRazorpayActionGateway } from "@/lib/actions/gateway";
import {
  ACTION_BY_DECISION,
  actionForDecision,
  buildActionKey,
} from "@/lib/actions/types";
import { evaluatePausePrerequisites } from "@/lib/actions/executor";
import {
  advanceToBenignV3,
  advanceToReviewV3,
  advanceToV3,
  buildHarness,
  DEGRADED_SEMANTIC,
  eventTypes,
} from "./harness";
import type { MandateWithSnapshot } from "@/lib/mandate/types";

afterEach(() => setSemanticProvider(null));

// ---------------------------------------------------------------------------
// STEP 2 — deterministic decision -> action mapping
// ---------------------------------------------------------------------------
describe("M7-A — decision to action mapping (STEP 2)", () => {
  it("maps ALLOW/REVIEW/PAUSE deterministically and exhaustively", () => {
    expect(ACTION_BY_DECISION).toEqual({
      ALLOW: "NO_ACTION",
      REVIEW: "REVIEW_REQUIRED",
      PAUSE: "PAUSE_SUBSCRIPTION",
    });
    expect(actionForDecision("ALLOW")).toBe("NO_ACTION");
    expect(actionForDecision("REVIEW")).toBe("REVIEW_REQUIRED");
    expect(actionForDecision("PAUSE")).toBe("PAUSE_SUBSCRIPTION");
  });

  it("action keys are deterministic and version-scoped (STEP 5)", () => {
    const base = {
      mandateId: "m_1",
      policyVersion: "mvp-v1",
      baselineOfferVersion: 2,
      currentOfferVersion: 3,
      action: "PAUSE_SUBSCRIPTION" as const,
    };
    expect(buildActionKey(base)).toBe(buildActionKey({ ...base }));
    expect(buildActionKey({ ...base, currentOfferVersion: 4 })).not.toBe(
      buildActionKey(base),
    );
    expect(buildActionKey({ ...base, currentOfferVersion: null })).toContain(
      "cnone",
    );
  });
});

// ---------------------------------------------------------------------------
// STEP 14 — ALLOW
// ---------------------------------------------------------------------------
describe("M7-A — ALLOW", () => {
  it("produces NO_ACTION, makes no provider call, and is audited", async () => {
    const h = buildHarness();
    const auth = await h.mandates.createMandateAuthorization({
      userId: "u1",
      offerId: "o_demo_v2",
      razorpaySubscriptionId: "sub_live_1",
    });
    advanceToBenignV3(h.data);

    const result = await h.executor.evaluateAndAct(auth.mandateId);

    expect(result.decision).toBe("ALLOW");
    expect(result.intendedAction).toBe("NO_ACTION");
    expect(result.action).toBe("NO_ACTION");
    expect(result.status).toBe("NOT_REQUIRED");
    expect(result.reason).toBe("NO_DEGRADATION_DETECTED");
    expect(result.requiresManualReview).toBe(false);

    // No provider call whatsoever.
    expect(h.gateway.callCount).toBe(0);
    // No action row is created for a non-provider action.
    expect(await h.actionsRepo.listByMandate(auth.mandateId)).toHaveLength(0);

    const events = await h.audit.listForMandate(auth.mandateId);
    expect(eventTypes(events)).toEqual(["INTEGRITY_EVALUATED", "POLICY_DECIDED"]);
    const decided = events[1];
    expect(decided.decision).toBe("ALLOW");
    expect(decided.action).toBe("NO_ACTION");
    expect(decided.policyVersion).toBe("mvp-v1");
  });
});

// ---------------------------------------------------------------------------
// STEP 13 — REVIEW
// ---------------------------------------------------------------------------
describe("M7-A — REVIEW", () => {
  it("produces REVIEW_REQUIRED, never pauses, and is audited", async () => {
    const h = buildHarness();
    const auth = await h.mandates.createMandateAuthorization({
      userId: "u1",
      offerId: "o_demo_v2",
      razorpaySubscriptionId: "sub_live_1",
    });
    advanceToReviewV3(h.data);

    const result = await h.executor.evaluateAndAct(auth.mandateId);

    expect(result.decision).toBe("REVIEW");
    expect(result.intendedAction).toBe("REVIEW_REQUIRED");
    expect(result.action).toBe("REVIEW_REQUIRED");
    expect(result.status).toBe("PENDING");
    expect(result.reason).toBe("MANUAL_REVIEW_REQUIRED");
    expect(result.requiresManualReview).toBe(true);

    // STEP 13 — no payment mutation.
    expect(h.gateway.pauseCalls).toEqual([]);
    expect(await h.actionsRepo.listByMandate(auth.mandateId)).toHaveLength(0);

    const events = await h.audit.listForMandate(auth.mandateId);
    expect(eventTypes(events)).toEqual(["INTEGRITY_EVALUATED", "POLICY_DECIDED"]);
    expect(events[1].action).toBe("REVIEW_REQUIRED");
    expect(events[1].status).toBe("PENDING");
    // Nothing in the trail claims an action succeeded.
    expect(eventTypes(events)).not.toContain("ACTION_SUCCEEDED");
  });
});

// ---------------------------------------------------------------------------
// STEP 15 — PAUSE (happy path)
// ---------------------------------------------------------------------------
describe("M7-A — PAUSE", () => {
  it("pauses through the mock gateway exactly once and records success", async () => {
    const h = buildHarness();
    const auth = await h.mandates.createMandateAuthorization({
      userId: "u1",
      offerId: "o_demo_v2",
      razorpaySubscriptionId: "sub_demo_1",
    });
    advanceToV3(h.data);
    h.semantic.push(DEGRADED_SEMANTIC);

    const result = await h.executor.evaluateAndAct(auth.mandateId);

    expect(result.decision).toBe("PAUSE");
    expect(result.intendedAction).toBe("PAUSE_SUBSCRIPTION");
    expect(result.action).toBe("PAUSE_SUBSCRIPTION");
    expect(result.status).toBe("SUCCEEDED");
    expect(result.reason).toBe("PAUSE_EXECUTED");
    expect(result.idempotent).toBe(false);
    expect(result.providerSubscriptionId).toBe("sub_demo_1");

    // Provider called exactly once, with the mandate's own subscription id.
    expect(h.gateway.pauseCalls).toEqual(["sub_demo_1"]);

    const actions = await h.actionsRepo.listByMandate(auth.mandateId);
    expect(actions).toHaveLength(1);
    expect(actions[0].status).toBe("SUCCEEDED");
    expect(actions[0].action).toBe("PAUSE_SUBSCRIPTION");
    expect(actions[0].actionKey).toBe(result.actionKey);

    const events = await h.audit.listForMandate(auth.mandateId);
    expect(eventTypes(events)).toEqual([
      "INTEGRITY_EVALUATED",
      "POLICY_DECIDED",
      "ACTION_REQUESTED",
      "ACTION_SUCCEEDED",
    ]);
    expect(events[3].providerSubscriptionId).toBe("sub_demo_1");
    expect(events[3].reason).toBe("PAUSE_EXECUTED");
  });

  it("does not silently transition the Mandate to PAUSED (STEP 17)", async () => {
    const h = buildHarness();
    const auth = await h.mandates.createMandateAuthorization({
      userId: "u1",
      offerId: "o_demo_v2",
      razorpaySubscriptionId: "sub_demo_1",
    });
    advanceToV3(h.data);
    h.semantic.push(DEGRADED_SEMANTIC);

    await h.executor.evaluateAndAct(auth.mandateId);

    const stored = await h.mandates.getMandate(auth.mandateId);
    // Mandate state transitions stay explicit; M3 semantics are untouched.
    expect(stored!.status).toBe("AUTHORIZED");
    // The authorized snapshot is still the frozen v2 baseline.
    expect(stored!.snapshot.offerVersion).toBe(2);
    expect(stored!.snapshot.price).toBe(399900);
  });
});

// ---------------------------------------------------------------------------
// Provider failure / unavailability
// ---------------------------------------------------------------------------
describe("M7-A — provider failure", () => {
  it("records ACTION_FAILED when the provider rejects the pause", async () => {
    const h = buildHarness({ gateway: new MockRazorpayActionGateway("FAILURE") });
    const auth = await h.mandates.createMandateAuthorization({
      userId: "u1",
      offerId: "o_demo_v2",
      razorpaySubscriptionId: "sub_demo_1",
    });
    advanceToV3(h.data);
    h.semantic.push(DEGRADED_SEMANTIC);

    const result = await h.executor.evaluateAndAct(auth.mandateId);

    expect(result.decision).toBe("PAUSE");
    expect(result.action).toBe("PAUSE_SUBSCRIPTION");
    expect(result.status).toBe("FAILED");
    expect(result.reason).toBe("PROVIDER_REJECTED");
    expect(result.requiresManualReview).toBe(true);
    expect(h.gateway.callCount).toBe(1);

    const actions = await h.actionsRepo.listByMandate(auth.mandateId);
    expect(actions[0].status).toBe("FAILED");

    const events = await h.audit.listForMandate(auth.mandateId);
    expect(eventTypes(events)).toEqual([
      "INTEGRITY_EVALUATED",
      "POLICY_DECIDED",
      "ACTION_REQUESTED",
      "ACTION_FAILED",
    ]);
    expect(events[3].status).toBe("FAILED");
    expect(events[3].reason).toBe("PROVIDER_REJECTED");
    // Only a reason code + a generated sentence: no stack traces, no provider body.
    expect(JSON.stringify(events[3])).not.toMatch(/at Object|\.ts:\d+|stack/i);
  });

  it("records PROVIDER_UNAVAILABLE when the provider cannot be reached", async () => {
    const h = buildHarness({
      gateway: new MockRazorpayActionGateway("UNAVAILABLE"),
    });
    const auth = await h.mandates.createMandateAuthorization({
      userId: "u1",
      offerId: "o_demo_v2",
      razorpaySubscriptionId: "sub_demo_1",
    });
    advanceToV3(h.data);
    h.semantic.push(DEGRADED_SEMANTIC);

    const result = await h.executor.evaluateAndAct(auth.mandateId);
    expect(result.status).toBe("FAILED");
    expect(result.reason).toBe("PROVIDER_UNAVAILABLE");

    const events = await h.audit.listForMandate(auth.mandateId);
    expect(events.at(-1)!.eventType).toBe("ACTION_FAILED");
    expect(events.at(-1)!.reason).toBe("PROVIDER_UNAVAILABLE");
  });

  it("allows a retry after a FAILED attempt (no successful pause was recorded)", async () => {
    const gateway = new MockRazorpayActionGateway("FAILURE");
    const h = buildHarness({ gateway });
    const auth = await h.mandates.createMandateAuthorization({
      userId: "u1",
      offerId: "o_demo_v2",
      razorpaySubscriptionId: "sub_demo_1",
    });
    advanceToV3(h.data);
    h.semantic.push(DEGRADED_SEMANTIC);
    const first = await h.executor.evaluateAndAct(auth.mandateId);
    expect(first.status).toBe("FAILED");

    gateway.mode = "SUCCESS";
    h.semantic.push(DEGRADED_SEMANTIC);
    const second = await h.executor.evaluateAndAct(auth.mandateId);

    expect(second.status).toBe("SUCCEEDED");
    expect(second.idempotent).toBe(false);
    expect(gateway.callCount).toBe(2);
    // Same deterministic action key was reused, not duplicated.
    expect(second.actionKey).toBe(first.actionKey);
    expect(await h.actionsRepo.listByMandate(auth.mandateId)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// STEP 4 — safety prerequisites
// ---------------------------------------------------------------------------
describe("M7-A — safety: missing provider subscription id", () => {
  it("blocks the pause with an explicit reason and calls no provider", async () => {
    const h = buildHarness();
    // No razorpaySubscriptionId on the mandate.
    const auth = await h.mandates.createMandateAuthorization({
      userId: "u1",
      offerId: "o_demo_v2",
    });
    advanceToV3(h.data);
    h.semantic.push(DEGRADED_SEMANTIC);

    const result = await h.executor.evaluateAndAct(auth.mandateId);

    expect(result.decision).toBe("PAUSE");
    expect(result.intendedAction).toBe("PAUSE_SUBSCRIPTION");
    // STEP 4 — no action taken, explicit failure reason.
    expect(result.action).toBe("NO_ACTION");
    expect(result.status).toBe("BLOCKED");
    expect(result.reason).toBe("MISSING_PROVIDER_SUBSCRIPTION_ID");
    expect(result.requiresManualReview).toBe(true);

    expect(h.gateway.callCount).toBe(0);
    expect(await h.actionsRepo.listByMandate(auth.mandateId)).toHaveLength(0);

    const events = await h.audit.listForMandate(auth.mandateId);
    expect(eventTypes(events)).toEqual([
      "INTEGRITY_EVALUATED",
      "POLICY_DECIDED",
      "ACTION_FAILED",
    ]);
    expect(events[2].reason).toBe("MISSING_PROVIDER_SUBSCRIPTION_ID");
    expect(events[2].status).toBe("BLOCKED");
  });
});

describe("M7-A — safety: mandate not authorized", () => {
  it("never calls the provider for a non-authorized mandate", async () => {
    const h = buildHarness();
    const auth = await h.mandates.createMandateAuthorization({
      userId: "u1",
      offerId: "o_demo_v2",
      razorpaySubscriptionId: "sub_demo_1",
    });
    advanceToV3(h.data);
    h.semantic.push(DEGRADED_SEMANTIC);

    // Simulate a cancelled mandate: the executor must refuse to act on it.
    const original = h.mandates.getMandate.bind(h.mandates);
    h.mandates.getMandate = async (id: string) => {
      const m = await original(id);
      return m ? ({ ...m, status: "CANCELLED" } as MandateWithSnapshot) : null;
    };

    const result = await h.executor.evaluateAndAct(auth.mandateId);

    expect(result.decision).toBe("PAUSE");
    expect(result.action).toBe("NO_ACTION");
    expect(result.status).toBe("BLOCKED");
    expect(result.reason).toBe("MANDATE_NOT_AUTHORIZED");
    expect(h.gateway.callCount).toBe(0);

    const events = await h.audit.listForMandate(auth.mandateId);
    expect(events.at(-1)!.reason).toBe("MANDATE_NOT_AUTHORIZED");
  });

  it("prerequisite helper enumerates every documented failure", () => {
    const mandate = {
      id: "m1",
      userId: "u1",
      merchantId: "mer1",
      offerId: "o1",
      razorpaySubscriptionId: "sub_1",
      status: "AUTHORIZED",
      idempotencyKey: null,
      authorizedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      snapshot: { offerVersion: 2 },
    } as unknown as MandateWithSnapshot;

    expect(
      evaluatePausePrerequisites({
        mandate,
        decision: "PAUSE",
        evaluationComplete: true,
      }),
    ).toBeNull();

    expect(
      evaluatePausePrerequisites({
        mandate,
        decision: "REVIEW",
        evaluationComplete: true,
      })?.reason,
    ).toBe("MANUAL_REVIEW_REQUIRED");

    expect(
      evaluatePausePrerequisites({
        mandate: { ...mandate, status: "CANCELLED" } as MandateWithSnapshot,
        decision: "PAUSE",
        evaluationComplete: true,
      })?.reason,
    ).toBe("MANDATE_NOT_AUTHORIZED");

    expect(
      evaluatePausePrerequisites({
        mandate: {
          ...mandate,
          razorpaySubscriptionId: "   ",
        } as MandateWithSnapshot,
        decision: "PAUSE",
        evaluationComplete: true,
      })?.reason,
    ).toBe("MISSING_PROVIDER_SUBSCRIPTION_ID");

    expect(
      evaluatePausePrerequisites({
        mandate,
        decision: "PAUSE",
        evaluationComplete: false,
      })?.reason,
    ).toBe("EVALUATION_INCOMPLETE");
  });
});

// ---------------------------------------------------------------------------
// STEP 16 — incomplete / unavailable evaluation
// ---------------------------------------------------------------------------
describe("M7-A — incomplete or unavailable evaluation (STEP 16)", () => {
  it("does not ALLOW and does not pause when the semantic evaluation is unavailable", async () => {
    const h = buildHarness();
    const auth = await h.mandates.createMandateAuthorization({
      userId: "u1",
      offerId: "o_demo_v2",
      razorpaySubscriptionId: "sub_demo_1",
    });
    advanceToV3(h.data);
    // Semantic provider fails -> semanticStatus UNAVAILABLE -> incomplete.
    h.semantic.push(new Error("semantic provider down"));

    const result = await h.executor.evaluateAndAct(auth.mandateId);

    // Deterministic evidence still forces PAUSE, but an incomplete evaluation
    // must never be executed automatically...
    expect(result.decision).toBe("PAUSE");
    expect(result.status).toBe("BLOCKED");
    expect(result.reason).toBe("EVALUATION_INCOMPLETE");
    // ...and it is never converted into ALLOW / NOT_REQUIRED.
    expect(result.action).not.toBe("REVIEW_REQUIRED");
    expect(result.status).not.toBe("NOT_REQUIRED");
    expect(result.requiresManualReview).toBe(true);
    expect(h.gateway.callCount).toBe(0);
  });

  it("returns a blocked result (never ALLOW) when integrity evaluation throws", async () => {
    const h = buildHarness();
    const auth = await h.mandates.createMandateAuthorization({
      userId: "u1",
      offerId: "o_demo_v2",
      razorpaySubscriptionId: "sub_demo_1",
    });
    h.integrity.evaluateMandate = async () => {
      throw new Error("integrity unavailable");
    };

    const result = await h.executor.evaluateAndAct(auth.mandateId);

    expect(result.decision).toBeNull();
    expect(result.intendedAction).toBeNull();
    expect(result.action).toBe("NO_ACTION");
    expect(result.status).toBe("BLOCKED");
    expect(result.reason).toBe("INTEGRITY_EVALUATION_UNAVAILABLE");
    expect(result.requiresManualReview).toBe(true);
    expect(h.gateway.callCount).toBe(0);

    const events = await h.audit.listForMandate(auth.mandateId);
    expect(eventTypes(events)).toEqual([
      "INTEGRITY_EVALUATED",
      "ACTION_FAILED",
    ]);
    // No POLICY_DECIDED event was fabricated, and no decision was invented.
    expect(events.every((e) => e.decision === null)).toBe(true);
  });

  it("throws a controlled 404 for an unknown mandate (no ALLOW, no action)", async () => {
    const h = buildHarness();
    await expect(h.executor.evaluateAndAct("does_not_exist")).rejects.toMatchObject(
      { status: 404 },
    );
    expect(h.gateway.callCount).toBe(0);
    expect(h.auditRepo.size).toBe(0);
  });
});
