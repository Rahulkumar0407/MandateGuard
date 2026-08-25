import { describe, it, expect, afterEach } from "vitest";
import { setSemanticProvider } from "@/lib/integrity/semantic-provider";
import { evaluatePolicy } from "@/lib/policy/engine";
import { advanceToV3, buildHarness, DEGRADED_SEMANTIC, eventTypes } from "./harness";

afterEach(() => setSemanticProvider(null));

// STEP 22 — the full demo chain, offline:
//
//   authorized v2  ₹3,999/year, weekly mentor feedback + mock interviews +
//                  capstone review, 30-day refund
//   current   v3  ₹4,999/year, mock interviews, 7-day refund,
//                  community + monthly Q&A
//
//   M4  -> PRICE_INCREASED, ENTITLEMENT_REMOVED, REFUND_WINDOW_REDUCED
//   M5  -> SUPPORT_QUALITY_CHANGED / DEGRADED / confidence 0.95
//   M6  -> PAUSE
//   M7  -> PAUSE_SUBSCRIPTION -> MockRazorpayActionGateway -> SUCCESS
//   Audit -> INTEGRITY_EVALUATED, POLICY_DECIDED, ACTION_REQUESTED,
//            ACTION_SUCCEEDED
describe("M7-A demo — v2 -> v3 end to end (STEP 22)", () => {
  it("walks integrity -> policy -> action -> audit deterministically", async () => {
    const h = buildHarness();
    const auth = await h.mandates.createMandateAuthorization({
      userId: "u_demo",
      offerId: "o_demo_v2",
      razorpaySubscriptionId: "sub_demo_1",
    });
    expect(auth.snapshot.offerVersion).toBe(2);
    expect(auth.snapshot.price).toBe(399900);
    expect(auth.snapshot.refundWindowDays).toBe(30);

    advanceToV3(h.data);
    h.semantic.push(DEGRADED_SEMANTIC);

    // --- M4 + M5 -----------------------------------------------------------
    const report = await h.integrity.evaluateMandate(auth.mandateId);
    const deterministic = report.findings.map((f) => f.type);
    expect(deterministic).toContain("PRICE_INCREASED");
    expect(deterministic).toContain("ENTITLEMENT_REMOVED");
    expect(deterministic).toContain("REFUND_WINDOW_REDUCED");
    expect(report.semanticStatus).toBe("AVAILABLE");
    expect(report.semanticFindings[0]).toMatchObject({
      type: "SUPPORT_QUALITY_CHANGED",
      direction: "DEGRADED",
      confidence: 0.95,
    });

    // --- M6 ----------------------------------------------------------------
    expect(evaluatePolicy(report).decision).toBe("PAUSE");

    // --- M7 (fresh evaluation through the action boundary) -----------------
    h.semantic.push(DEGRADED_SEMANTIC);
    const result = await h.executor.evaluateAndAct(auth.mandateId);

    expect(result.decision).toBe("PAUSE");
    expect(result.intendedAction).toBe("PAUSE_SUBSCRIPTION");
    expect(result.action).toBe("PAUSE_SUBSCRIPTION");
    expect(result.status).toBe("SUCCEEDED");
    expect(result.reason).toBe("PAUSE_EXECUTED");
    expect(result.baselineOfferVersion).toBe(2);
    expect(result.currentOfferVersion).toBe(3);
    expect(result.policyVersion).toBe("mvp-v1");
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "PRICE_INCREASED",
        "ENTITLEMENT_REMOVED",
        "REFUND_WINDOW_REDUCED",
        "SUPPORT_QUALITY_CHANGED",
      ]),
    );

    // --- Mock gateway ------------------------------------------------------
    expect(h.gateway.pauseCalls).toEqual(["sub_demo_1"]);

    // --- Audit -------------------------------------------------------------
    const events = await h.audit.listForMandate(auth.mandateId);
    expect(eventTypes(events)).toEqual([
      "INTEGRITY_EVALUATED",
      "POLICY_DECIDED",
      "ACTION_REQUESTED",
      "ACTION_SUCCEEDED",
    ]);
    expect(events[0].metadata).toMatchObject({
      overall: "CHANGED",
      semanticStatus: "AVAILABLE",
      evaluationComplete: true,
    });
    expect(events[1]).toMatchObject({
      decision: "PAUSE",
      action: "PAUSE_SUBSCRIPTION",
      policyVersion: "mvp-v1",
      baselineOfferVersion: 2,
      currentOfferVersion: 3,
    });
    expect(events[2]).toMatchObject({
      action: "PAUSE_SUBSCRIPTION",
      status: "PENDING",
      providerSubscriptionId: "sub_demo_1",
    });
    expect(events[3]).toMatchObject({
      action: "PAUSE_SUBSCRIPTION",
      status: "SUCCEEDED",
      reason: "PAUSE_EXECUTED",
    });
    // Every action event carries the same idempotency key.
    expect(events[2].actionKey).toBe(events[3].actionKey);
    expect(events[3].actionKey).toBe(result.actionKey);
  });

  it("is deterministic: the same inputs always produce the same decision + action", async () => {
    const outcomes: string[] = [];
    for (let run = 0; run < 3; run += 1) {
      const h = buildHarness();
      const auth = await h.mandates.createMandateAuthorization({
        userId: "u_demo",
        offerId: "o_demo_v2",
        razorpaySubscriptionId: "sub_demo_1",
      });
      advanceToV3(h.data);
      h.semantic.push(DEGRADED_SEMANTIC);
      const r = await h.executor.evaluateAndAct(auth.mandateId);
      outcomes.push(`${r.decision}/${r.action}/${r.status}/${r.reason}`);
    }
    expect(new Set(outcomes).size).toBe(1);
    expect(outcomes[0]).toBe("PAUSE/PAUSE_SUBSCRIPTION/SUCCEEDED/PAUSE_EXECUTED");
  });

  it("never touches the merchant offer, snapshot, or mandate rows", async () => {
    const h = buildHarness();
    const auth = await h.mandates.createMandateAuthorization({
      userId: "u_demo",
      offerId: "o_demo_v2",
      razorpaySubscriptionId: "sub_demo_1",
    });
    advanceToV3(h.data);
    h.semantic.push(DEGRADED_SEMANTIC);
    await h.executor.evaluateAndAct(auth.mandateId);

    expect(h.data.offers.find((o) => o.id === "o_demo_v3")!.price).toBe(499900);
    expect(h.data.offers.find((o) => o.id === "o_demo_v2")!.price).toBe(399900);
    const stored = await h.mandates.getMandate(auth.mandateId);
    expect(stored!.status).toBe("AUTHORIZED");
    expect(stored!.razorpaySubscriptionId).toBe("sub_demo_1");
    expect(stored!.snapshot.entitlementKeys).toEqual([
      "weekly_mentor_feedback",
      "mock_interviews",
      "capstone_review",
    ]);
  });
});
