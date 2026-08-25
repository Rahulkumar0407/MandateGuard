import { describe, it, expect, afterEach } from "vitest";
import { setSemanticProvider } from "@/lib/integrity/semantic-provider";
import {
  AuditService,
  InMemoryAuditRepository,
} from "@/lib/audit/service";
import { AUDIT_EVENT_TYPES, redactMetadata, REDACTED } from "@/lib/audit";
import {
  advanceToV3,
  buildHarness,
  DEGRADED_SEMANTIC,
  eventTypes,
} from "../actions/harness";

afterEach(() => setSemanticProvider(null));

// STEP 7 — the taxonomy stays small and fixed.
describe("M7-A — audit taxonomy (STEP 7)", () => {
  it("has exactly the five documented event types", () => {
    expect([...AUDIT_EVENT_TYPES]).toEqual([
      "INTEGRITY_EVALUATED",
      "POLICY_DECIDED",
      "ACTION_REQUESTED",
      "ACTION_SUCCEEDED",
      "ACTION_FAILED",
    ]);
  });

  it("the repository exposes no update or delete operation (append-only)", () => {
    const repo = new InMemoryAuditRepository();
    const surface = Object.getOwnPropertyNames(
      Object.getPrototypeOf(repo),
    ).filter((k) => k !== "constructor" && k !== "size"); // `size` is a test helper
    expect(surface.sort()).toEqual([
      "append",
      "listByActionKey",
      "listByMandate",
    ]);
    expect(surface.join(" ")).not.toMatch(/update|delete|remove|patch/i);
  });
});

// STEP 8 / 9 — the stored decision context must be sufficient to reconstruct
// the decision, and it must be frozen.
describe("M7-A — stored decision context (STEP 8 / 9)", () => {
  it("captures mandate, versions, policy version, decision, reasons and action", async () => {
    const h = buildHarness();
    const auth = await h.mandates.createMandateAuthorization({
      userId: "u1",
      offerId: "o_demo_v2",
      razorpaySubscriptionId: "sub_demo_1",
    });
    advanceToV3(h.data);
    h.semantic.push(DEGRADED_SEMANTIC);

    await h.executor.evaluateAndAct(auth.mandateId);
    const events = await h.audit.listForMandate(auth.mandateId);

    const decided = events.find((e) => e.eventType === "POLICY_DECIDED")!;
    expect(decided.mandateId).toBe(auth.mandateId);
    expect(decided.policyVersion).toBe("mvp-v1");
    expect(decided.baselineOfferVersion).toBe(2);
    expect(decided.currentOfferVersion).toBe(3);
    expect(decided.decision).toBe("PAUSE");
    expect(decided.action).toBe("PAUSE_SUBSCRIPTION");

    const reasonTypes = (
      decided.metadata!.reasons as Array<{ findingType: string }>
    ).map((r) => r.findingType);
    expect(reasonTypes).toContain("PRICE_INCREASED");
    expect(reasonTypes).toContain("ENTITLEMENT_REMOVED");
    expect(reasonTypes).toContain("REFUND_WINDOW_REDUCED");
    expect(reasonTypes).toContain("SUPPORT_QUALITY_CHANGED");

    const succeeded = events.find((e) => e.eventType === "ACTION_SUCCEEDED")!;
    expect(succeeded.action).toBe("PAUSE_SUBSCRIPTION");
    expect(succeeded.status).toBe("SUCCEEDED");
    expect(succeeded.providerSubscriptionId).toBe("sub_demo_1");
  });

  it("historical audit records do NOT change when the Offer changes later", async () => {
    const h = buildHarness();
    const auth = await h.mandates.createMandateAuthorization({
      userId: "u1",
      offerId: "o_demo_v2",
      razorpaySubscriptionId: "sub_demo_1",
    });
    advanceToV3(h.data);
    h.semantic.push(DEGRADED_SEMANTIC);

    await h.executor.evaluateAndAct(auth.mandateId);
    const before = await h.audit.listForMandate(auth.mandateId);
    const snapshot = JSON.stringify(before);

    // The merchant now publishes v4 at a different price and mutates the row
    // objects the evaluation originally read.
    const v3 = h.data.offers.find((o) => o.id === "o_demo_v3")!;
    v3.price = 999900;
    v3.entitlementKeys = ["everything"];
    v3.active = false;
    h.data.offers.push({ ...v3, id: "o_demo_v4", version: 4, active: true });

    const after = await h.audit.listForMandate(auth.mandateId);
    expect(JSON.stringify(after)).toBe(snapshot);
    const decided = after.find((e) => e.eventType === "POLICY_DECIDED")!;
    expect(decided.currentOfferVersion).toBe(3);
    expect(decided.decision).toBe("PAUSE");
  });

  it("a reader cannot mutate stored history through returned records", async () => {
    const repo = new InMemoryAuditRepository();
    const audit = new AuditService(repo);
    await audit.record({
      mandateId: "m1",
      eventType: "POLICY_DECIDED",
      decision: "PAUSE",
      metadata: { reasons: ["PRICE_INCREASED"] },
    });

    const first = await audit.listForMandate("m1");
    first[0].decision = "ALLOW";
    (first[0].metadata as { reasons: string[] }).reasons.push("TAMPERED");

    const second = await audit.listForMandate("m1");
    expect(second[0].decision).toBe("PAUSE");
    expect(second[0].metadata).toEqual({ reasons: ["PRICE_INCREASED"] });
  });

  it("a writer cannot mutate stored history through the input object", async () => {
    const repo = new InMemoryAuditRepository();
    const audit = new AuditService(repo);
    const metadata: Record<string, unknown> = { reasons: ["PRICE_INCREASED"] };
    await audit.record({
      mandateId: "m1",
      eventType: "POLICY_DECIDED",
      metadata,
    });
    (metadata.reasons as string[]).push("TAMPERED");

    const events = await audit.listForMandate("m1");
    expect(events[0].metadata).toEqual({ reasons: ["PRICE_INCREASED"] });
  });

  it("returns events in chronological order for a mandate", async () => {
    const h = buildHarness();
    const auth = await h.mandates.createMandateAuthorization({
      userId: "u1",
      offerId: "o_demo_v2",
      razorpaySubscriptionId: "sub_demo_1",
    });
    advanceToV3(h.data);
    h.semantic.push(DEGRADED_SEMANTIC);
    await h.executor.evaluateAndAct(auth.mandateId);

    const events = await h.audit.listForMandate(auth.mandateId);
    expect(eventTypes(events)).toEqual([
      "INTEGRITY_EVALUATED",
      "POLICY_DECIDED",
      "ACTION_REQUESTED",
      "ACTION_SUCCEEDED",
    ]);
    const times = events.map((e) => e.createdAt.getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it("scopes events per mandate", async () => {
    const repo = new InMemoryAuditRepository();
    const audit = new AuditService(repo);
    await audit.record({ mandateId: "m1", eventType: "POLICY_DECIDED" });
    await audit.record({ mandateId: "m2", eventType: "POLICY_DECIDED" });
    expect(await audit.listForMandate("m1")).toHaveLength(1);
    expect(await audit.listForMandate("m2")).toHaveLength(1);
    expect(await audit.listForMandate("m3")).toHaveLength(0);
  });
});

// STEP 6 / 8 — never store secrets.
describe("M7-A — audit stores no secrets", () => {
  it("redacts credential-shaped keys and drops Error objects", () => {
    const out = redactMetadata({
      razorpayKeySecret: "rzp_secret_value",
      key_secret: "abc",
      webhook_signature: "sig",
      authorization: "Bearer xyz",
      apiKey: "k",
      providerSubscriptionId: "sub_1",
      nested: { password: "p", providerStatus: "paused" },
      err: new Error("boom"),
    })!;

    expect(out.key_secret).toBe(REDACTED);
    expect(out.webhook_signature).toBe(REDACTED);
    expect(out.authorization).toBe(REDACTED);
    expect(out.apiKey).toBe(REDACTED);
    expect(out.razorpayKeySecret).toBe(REDACTED);
    expect(out.err).toBe(REDACTED);
    expect((out.nested as Record<string, unknown>).password).toBe(REDACTED);
    // Non-secret provider facts survive.
    expect(out.providerSubscriptionId).toBe("sub_1");
    expect((out.nested as Record<string, unknown>).providerStatus).toBe("paused");
    expect(JSON.stringify(out)).not.toContain("rzp_secret_value");
  });

  it("truncates long free-form strings so a stack trace cannot be stored", () => {
    const long = "x".repeat(5000);
    const out = redactMetadata({ detail: long })!;
    expect((out.detail as string).length).toBeLessThan(600);
  });

  it("an executed pause writes no secret material", async () => {
    const h = buildHarness();
    const auth = await h.mandates.createMandateAuthorization({
      userId: "u1",
      offerId: "o_demo_v2",
      razorpaySubscriptionId: "sub_demo_1",
    });
    advanceToV3(h.data);
    h.semantic.push(DEGRADED_SEMANTIC);
    await h.executor.evaluateAndAct(auth.mandateId);

    const dump = JSON.stringify(await h.audit.listForMandate(auth.mandateId));
    for (const forbidden of [
      "key_secret",
      "keySecret",
      "RAZORPAY_KEY_SECRET",
      "webhook_secret",
      "Bearer ",
      "rzp_test",
      "rzp_live",
    ]) {
      expect(dump).not.toContain(forbidden);
    }
  });
});
