import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setMerchantOfferRepository,
  InMemoryMerchantOfferRepository,
} from "@/lib/merchant/service";
import {
  setMandateRepository,
  InMemoryMandateRepository,
} from "@/lib/mandate/service";
import {
  MockSemanticIntegrityProvider,
  setSemanticProvider,
} from "@/lib/integrity/semantic-provider";
import { setAuditRepository, InMemoryAuditRepository } from "@/lib/audit/service";
import { setActionRepository } from "@/lib/actions/executor";
import { InMemoryActionRepository } from "@/lib/actions/repository";
import {
  MockRazorpayActionGateway,
  resetActionGateway,
  setActionGateway,
} from "@/lib/actions/gateway";
import type { MerchantOfferData } from "@/lib/merchant/types";
import * as mandateRoute from "@/app/api/mandates/route";
import * as actRoute from "@/app/api/mandates/[id]/evaluate-and-act/route";
import * as auditRoute from "@/app/api/mandates/[id]/audit/route";
import { buildDemoData, DEGRADED_SEMANTIC } from "../../lib/actions/harness";

const BASE = "http://localhost/api";

let data: MerchantOfferData;
let semantic: MockSemanticIntegrityProvider;
let gateway: MockRazorpayActionGateway;
let auditRepo: InMemoryAuditRepository;

beforeEach(() => {
  data = buildDemoData();
  semantic = new MockSemanticIntegrityProvider();
  gateway = new MockRazorpayActionGateway("SUCCESS");
  auditRepo = new InMemoryAuditRepository();

  setMerchantOfferRepository(new InMemoryMerchantOfferRepository(data));
  setMandateRepository(new InMemoryMandateRepository());
  setSemanticProvider(semantic);
  setAuditRepository(auditRepo);
  setActionRepository(new InMemoryActionRepository());
  setActionGateway(gateway);
});

afterEach(() => {
  setMerchantOfferRepository(null);
  setMandateRepository(null);
  setSemanticProvider(null);
  setAuditRepository(null);
  setActionRepository(null);
  resetActionGateway();
});

async function authorize(subscriptionId?: string): Promise<string> {
  const res = await mandateRoute.POST(
    new Request(`${BASE}/mandates`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId: "u1",
        offerId: "o_demo_v2",
        ...(subscriptionId ? { razorpaySubscriptionId: subscriptionId } : {}),
      }),
    }),
  );
  expect(res.status).toBe(201);
  return (await res.json()).mandateId as string;
}

function advanceToV3(): void {
  const v2 = data.offers.find((o) => o.id === "o_demo_v2")!;
  v2.active = false;
  data.offers.push({
    ...v2,
    id: "o_demo_v3",
    version: 3,
    name: "System Design Pro v3",
    price: 499900,
    entitlementKeys: ["mock_interviews"],
    refundWindowDays: 7,
    supportTerms: "Community discussions and monthly group Q&A.",
    semanticTerms: "AI-generated automated feedback.",
    active: true,
  });
}

function act(mandateId: string, body?: unknown) {
  return actRoute.POST(
    new Request(`${BASE}/mandates/${mandateId}/evaluate-and-act`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    { params: Promise.resolve({ id: mandateId }) },
  );
}

function audit(mandateId: string) {
  return auditRoute.GET(new Request(`${BASE}/mandates/${mandateId}/audit`), {
    params: Promise.resolve({ id: mandateId }),
  });
}

describe("POST /api/mandates/:id/evaluate-and-act (STEP 19)", () => {
  it("evaluates, decides, acts through the mock gateway and audits", async () => {
    const mandateId = await authorize("sub_api_1");
    advanceToV3();
    semantic.push(DEGRADED_SEMANTIC);

    const res = await act(mandateId);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.decision).toBe("PAUSE");
    expect(body.action).toBe("PAUSE_SUBSCRIPTION");
    expect(body.status).toBe("SUCCEEDED");
    expect(body.reason).toBe("PAUSE_EXECUTED");
    expect(gateway.pauseCalls).toEqual(["sub_api_1"]);
    expect(body.auditEventIds).toHaveLength(4);
  });

  it("rejects a client-supplied action instead of obeying it (no forced pause)", async () => {
    const mandateId = await authorize("sub_api_1");
    // A benign lineage change -> the server would decide ALLOW.
    const v2 = data.offers.find((o) => o.id === "o_demo_v2")!;
    v2.active = false;
    data.offers.push({ ...v2, id: "o_demo_v3", version: 3, price: 407900, active: true });

    const res = await act(mandateId, { action: "PAUSE" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/server determines the action/i);
    expect(gateway.callCount).toBe(0);
  });

  it("ignores any other client payload and derives the action from the decision", async () => {
    const mandateId = await authorize("sub_api_1");
    const v2 = data.offers.find((o) => o.id === "o_demo_v2")!;
    v2.active = false;
    data.offers.push({ ...v2, id: "o_demo_v3", version: 3, price: 407900, active: true });

    const res = await act(mandateId, { note: "please pause", force: true });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.decision).toBe("ALLOW");
    expect(body.action).toBe("NO_ACTION");
    expect(body.status).toBe("NOT_REQUIRED");
    expect(gateway.callCount).toBe(0);
  });

  it("returns 404 for an unknown mandate and performs no action", async () => {
    const res = await act("does_not_exist");
    expect(res.status).toBe(404);
    expect(gateway.callCount).toBe(0);
    expect(auditRepo.size).toBe(0);
  });

  it("is idempotent across repeated calls", async () => {
    const mandateId = await authorize("sub_api_1");
    advanceToV3();

    semantic.push(DEGRADED_SEMANTIC);
    const first = await (await act(mandateId)).json();
    semantic.push(DEGRADED_SEMANTIC);
    const second = await (await act(mandateId)).json();

    expect(first.status).toBe("SUCCEEDED");
    expect(first.idempotent).toBe(false);
    expect(second.status).toBe("SUCCEEDED");
    expect(second.reason).toBe("ALREADY_EXECUTED");
    expect(second.idempotent).toBe(true);
    expect(gateway.callCount).toBe(1);
  });

  it("blocks a pause when the mandate has no provider subscription id", async () => {
    const mandateId = await authorize(); // no razorpaySubscriptionId
    advanceToV3();
    semantic.push(DEGRADED_SEMANTIC);

    const body = await (await act(mandateId)).json();
    expect(body.decision).toBe("PAUSE");
    expect(body.action).toBe("NO_ACTION");
    expect(body.status).toBe("BLOCKED");
    expect(body.reason).toBe("MISSING_PROVIDER_SUBSCRIPTION_ID");
    expect(gateway.callCount).toBe(0);
  });

  it("never leaks a stack trace on failure", async () => {
    const mandateId = await authorize("sub_api_1");
    advanceToV3();
    setActionGateway(new MockRazorpayActionGateway("FAILURE"));
    semantic.push(DEGRADED_SEMANTIC);

    const res = await act(mandateId);
    const text = JSON.stringify(await res.json());
    expect(res.status).toBe(200);
    expect(text).toContain("PROVIDER_REJECTED");
    expect(text).not.toMatch(/\.ts:\d+|at Object\.|stack/i);
  });
});

describe("GET /api/mandates/:id/audit (STEP 18)", () => {
  it("returns the chronological audit trail for a mandate", async () => {
    const mandateId = await authorize("sub_api_1");
    advanceToV3();
    semantic.push(DEGRADED_SEMANTIC);
    await act(mandateId);

    const res = await audit(mandateId);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.mandateId).toBe(mandateId);
    expect(body.count).toBe(4);
    expect(body.events.map((e: { eventType: string }) => e.eventType)).toEqual([
      "INTEGRITY_EVALUATED",
      "POLICY_DECIDED",
      "ACTION_REQUESTED",
      "ACTION_SUCCEEDED",
    ]);
    const decided = body.events[1];
    expect(decided.decision).toBe("PAUSE");
    expect(decided.policyVersion).toBe("mvp-v1");
    expect(decided.baselineOfferVersion).toBe(2);
    expect(decided.currentOfferVersion).toBe(3);
  });

  it("is read-only: calling it performs no evaluation and no action", async () => {
    const mandateId = await authorize("sub_api_1");
    advanceToV3();

    const res = await audit(mandateId);
    expect(res.status).toBe(200);
    expect((await res.json()).count).toBe(0);
    expect(gateway.callCount).toBe(0);
    expect(auditRepo.size).toBe(0);
  });

  it("exposes no secrets", async () => {
    const mandateId = await authorize("sub_api_1");
    advanceToV3();
    semantic.push(DEGRADED_SEMANTIC);
    await act(mandateId);

    const dump = JSON.stringify(await (await audit(mandateId)).json());
    for (const forbidden of [
      "key_secret",
      "keySecret",
      "RAZORPAY_KEY_SECRET",
      "webhook_secret",
      "authorization",
      "Bearer ",
    ]) {
      expect(dump).not.toContain(forbidden);
    }
  });

  it("returns 404 for an unknown mandate", async () => {
    const res = await audit("nope");
    expect(res.status).toBe(404);
  });
});
