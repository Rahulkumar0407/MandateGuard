import { describe, it, expect, afterEach } from "vitest";
import { setSemanticProvider } from "@/lib/integrity/semantic-provider";
import { InMemoryActionRepository } from "@/lib/actions/repository";
import { buildActionKey } from "@/lib/actions/types";
import { advanceToV3, buildHarness, DEGRADED_SEMANTIC, eventTypes } from "./harness";

afterEach(() => setSemanticProvider(null));

// STEP 5 — repeated policy evaluations must not repeatedly pause the same
// subscription. The guarantee is a UNIQUE deterministic action key derived from
// (mandateId, policyVersion, baselineOfferVersion, currentOfferVersion, action);
// in Postgres it is enforced by MandateAction.actionKey @unique.
describe("M7-A — idempotency (STEP 5)", () => {
  it("a second evaluation of the same decision context does not pause again", async () => {
    const h = buildHarness();
    const auth = await h.mandates.createMandateAuthorization({
      userId: "u1",
      offerId: "o_demo_v2",
      razorpaySubscriptionId: "sub_demo_1",
    });
    advanceToV3(h.data);

    h.semantic.push(DEGRADED_SEMANTIC);
    const first = await h.executor.evaluateAndAct(auth.mandateId);
    expect(first.status).toBe("SUCCEEDED");
    expect(first.idempotent).toBe(false);
    expect(h.gateway.callCount).toBe(1);

    h.semantic.push(DEGRADED_SEMANTIC);
    const second = await h.executor.evaluateAndAct(auth.mandateId);

    // Same decision, same action key, but NO second provider mutation.
    expect(second.decision).toBe("PAUSE");
    expect(second.action).toBe("PAUSE_SUBSCRIPTION");
    expect(second.status).toBe("SUCCEEDED");
    expect(second.reason).toBe("ALREADY_EXECUTED");
    expect(second.idempotent).toBe(true);
    expect(second.actionKey).toBe(first.actionKey);
    expect(h.gateway.pauseCalls).toEqual(["sub_demo_1"]); // exactly once, ever

    // Exactly one action row exists for the key.
    const actions = await h.actionsRepo.listByMandate(auth.mandateId);
    expect(actions).toHaveLength(1);
    expect(actions[0].status).toBe("SUCCEEDED");

    // The duplicate attempt is still fully audited (transparency), and the
    // audit trail shows it did not call the provider.
    const events = await h.audit.listForMandate(auth.mandateId);
    expect(eventTypes(events)).toEqual([
      "INTEGRITY_EVALUATED",
      "POLICY_DECIDED",
      "ACTION_REQUESTED",
      "ACTION_SUCCEEDED",
      "INTEGRITY_EVALUATED",
      "POLICY_DECIDED",
      "ACTION_REQUESTED",
      "ACTION_SUCCEEDED",
    ]);
    expect(events.at(-1)!.reason).toBe("ALREADY_EXECUTED");
    expect(events.at(-1)!.metadata).toMatchObject({ providerCalled: false });
  });

  it("ten repeated evaluations still result in exactly one provider pause", async () => {
    const h = buildHarness();
    const auth = await h.mandates.createMandateAuthorization({
      userId: "u1",
      offerId: "o_demo_v2",
      razorpaySubscriptionId: "sub_demo_1",
    });
    advanceToV3(h.data);

    for (let i = 0; i < 10; i += 1) {
      h.semantic.push(DEGRADED_SEMANTIC);
      await h.executor.evaluateAndAct(auth.mandateId);
    }

    expect(h.gateway.callCount).toBe(1);
    expect(await h.actionsRepo.listByMandate(auth.mandateId)).toHaveLength(1);
  });

  it("a NEW current offer version is a NEW action key (not deduplicated away)", async () => {
    const h = buildHarness();
    const auth = await h.mandates.createMandateAuthorization({
      userId: "u1",
      offerId: "o_demo_v2",
      razorpaySubscriptionId: "sub_demo_1",
    });
    advanceToV3(h.data);
    h.semantic.push(DEGRADED_SEMANTIC);
    const first = await h.executor.evaluateAndAct(auth.mandateId);
    expect(first.status).toBe("SUCCEEDED");

    // Merchant publishes v4: a genuinely new decision context.
    const v3 = h.data.offers.find((o) => o.id === "o_demo_v3")!;
    v3.active = false;
    h.data.offers.push({ ...v3, id: "o_demo_v4", version: 4, price: 599900, active: true });

    h.semantic.push(DEGRADED_SEMANTIC);
    const second = await h.executor.evaluateAndAct(auth.mandateId);

    expect(second.currentOfferVersion).toBe(4);
    expect(second.actionKey).not.toBe(first.actionKey);
    expect(second.status).toBe("SUCCEEDED");
    expect(second.idempotent).toBe(false);
    expect(h.gateway.callCount).toBe(2);
    expect(await h.actionsRepo.listByMandate(auth.mandateId)).toHaveLength(2);
  });

  it("an in-flight PENDING reservation blocks a concurrent duplicate", async () => {
    const h = buildHarness();
    const auth = await h.mandates.createMandateAuthorization({
      userId: "u1",
      offerId: "o_demo_v2",
      razorpaySubscriptionId: "sub_demo_1",
    });
    advanceToV3(h.data);

    // Pre-reserve the exact key, mimicking a concurrent request that has not
    // finished yet (in Postgres the unique constraint produces the same state).
    const actionKey = buildActionKey({
      mandateId: auth.mandateId,
      policyVersion: "mvp-v1",
      baselineOfferVersion: 2,
      currentOfferVersion: 3,
      action: "PAUSE_SUBSCRIPTION",
    });
    await h.actionsRepo.reserve({
      mandateId: auth.mandateId,
      actionKey,
      action: "PAUSE_SUBSCRIPTION",
      decision: "PAUSE",
      policyVersion: "mvp-v1",
      baselineOfferVersion: 2,
      currentOfferVersion: 3,
      providerSubscriptionId: "sub_demo_1",
    });

    h.semantic.push(DEGRADED_SEMANTIC);
    const result = await h.executor.evaluateAndAct(auth.mandateId);

    expect(result.status).toBe("BLOCKED");
    expect(result.reason).toBe("ACTION_IN_PROGRESS");
    expect(result.action).toBe("NO_ACTION");
    expect(h.gateway.callCount).toBe(0);
  });
});

describe("M7-A — action repository reservation semantics", () => {
  it("reserve() creates once and reports duplicates thereafter", async () => {
    const repo = new InMemoryActionRepository();
    const input = {
      mandateId: "m1",
      actionKey: "m1|mvp-v1|b2|c3|PAUSE_SUBSCRIPTION",
      action: "PAUSE_SUBSCRIPTION" as const,
      decision: "PAUSE" as const,
      policyVersion: "mvp-v1",
      baselineOfferVersion: 2,
      currentOfferVersion: 3,
      providerSubscriptionId: "sub_1",
    };

    const a = await repo.reserve(input);
    expect(a.created).toBe(true);
    expect(a.record.status).toBe("PENDING");

    const b = await repo.reserve(input);
    expect(b.created).toBe(false);
    expect(b.record.id).toBe(a.record.id);

    await repo.markSucceeded(a.record.id, {
      providerSubscriptionId: "sub_1",
      reason: "PAUSE_EXECUTED",
    });
    const c = await repo.reserve(input);
    expect(c.created).toBe(false);
    expect(c.record.status).toBe("SUCCEEDED");
    expect(await repo.findByActionKey(input.actionKey)).toMatchObject({
      status: "SUCCEEDED",
    });
  });
});
