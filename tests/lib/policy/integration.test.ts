import { describe, it, expect, afterEach } from "vitest";
import {
  MandateService,
  InMemoryMandateRepository,
} from "@/lib/mandate/service";
import {
  MerchantOfferService,
  InMemoryMerchantOfferRepository,
} from "@/lib/merchant/service";
import type { MerchantOfferData } from "@/lib/merchant/types";
import { IntegrityService } from "@/lib/integrity/service";
import {
  MockSemanticIntegrityProvider,
  setSemanticProvider,
} from "@/lib/integrity/semantic-provider";
import { PolicyService } from "@/lib/policy/service";
import type { SemanticEvaluation } from "@/lib/integrity/semantic";

function buildDemoData(): MerchantOfferData {
  const TS = new Date("2026-01-01T00:00:00.000Z");
  return {
    merchants: [
      {
        id: "m_demo",
        name: "InterviewForge",
        slug: "interviewforge",
        description: "demo",
        status: "ACTIVE",
        createdAt: TS,
        updatedAt: TS,
      },
    ],
    products: [
      {
        id: "p_demo",
        merchantId: "m_demo",
        name: "System Design Pro",
        slug: "system-design-pro",
        description: "demo",
        category: "system-design",
        active: true,
        createdAt: TS,
        updatedAt: TS,
      },
    ],
    offers: [
      {
        id: "o_demo_v2",
        productId: "p_demo",
        version: 2,
        name: "System Design Pro",
        description: "Expanded system design program with capstone review.",
        price: 399900, // ₹3,999/year
        currency: "INR",
        billingInterval: "yearly",
        duration: 365,
        entitlementKeys: [
          "weekly_mentor_feedback",
          "mock_interviews",
          "capstone_review",
        ],
        refundWindowDays: 30,
        supportTerms: "Dedicated weekly 1:1 mentor feedback.",
        semanticTerms: "Human mentor reviews your capstone.",
        active: true,
        createdAt: TS,
        updatedAt: TS,
      },
    ],
  };
}

describe("M6 integration — demo v2 -> v3 (STEP 19)", () => {
  afterEach(() => setSemanticProvider(null));

  const mockSemantic: SemanticEvaluation = {
    changed: true,
    findings: [
      {
        type: "SUPPORT_QUALITY_CHANGED",
        severity: "WARNING",
        direction: "DEGRADED",
        baseline: "Dedicated weekly 1:1 mentor feedback.",
        current: "Community discussions and monthly group Q&A.",
        explanation: "Model free-form text (must be ignored by policy).",
        confidence: 0.95,
      },
    ],
  };

  it("deterministically returns PAUSE with structured reasons", async () => {
    const data = buildDemoData();
    const merchant = new MerchantOfferService(
      new InMemoryMerchantOfferRepository(data),
    );
    const mandate = new MandateService(
      new InMemoryMandateRepository(),
      merchant,
    );
    const integrity = new IntegrityService(mandate, merchant);
    const policy = new PolicyService(integrity);

    const auth = await mandate.createMandateAuthorization({
      userId: "u1",
      offerId: "o_demo_v2",
    });

    // Advance lineage to v3.
    data.offers.find((o) => o.id === "o_demo_v2")!.active = false;
    data.offers.push({
      ...data.offers.find((o) => o.id === "o_demo_v2")!,
      id: "o_demo_v3",
      version: 3,
      name: "System Design Pro v3",
      description: "Community-driven system design program.",
      price: 499900, // ₹4,999/year
      duration: 365,
      entitlementKeys: ["mock_interviews"],
      refundWindowDays: 7,
      supportTerms: "Community discussions and monthly group Q&A.",
      semanticTerms: "AI-generated automated feedback.",
      active: true,
    });

    const mock = new MockSemanticIntegrityProvider();
    mock.push(mockSemantic);
    setSemanticProvider(mock);

    const result = await policy.evaluateMandate(auth.mandateId);

    expect(result.decision).toBe("PAUSE");
    expect(result.policyVersion).toBe("mvp-v1");

    const types = result.reasons.map((r) => r.findingType);
    expect(types).toContain("PRICE_INCREASED");
    expect(types).toContain("ENTITLEMENT_REMOVED");
    expect(types).toContain("REFUND_WINDOW_REDUCED");
    expect(types).toContain("SUPPORT_QUALITY_CHANGED");

    // Critical-entitlement removal reason names the specific key.
    const critical = result.reasons.find((r) => r.findingType === "ENTITLEMENT_REMOVED")!;
    expect(critical.explanation).toMatch(/weekly_mentor_feedback/);
    expect(critical.explanation).toMatch(/PAUSE|critical/i);

    // The policy never relied on the model's free-form explanation text.
    expect(
      result.reasons.some((r) => /must be ignored by policy/.test(r.explanation)),
    ).toBe(false);
  });

  it("is pure: no Razorpay action and the mandate/snapshot are untouched", async () => {
    const data = buildDemoData();
    const merchant = new MerchantOfferService(
      new InMemoryMerchantOfferRepository(data),
    );
    const mandate = new MandateService(
      new InMemoryMandateRepository(),
      merchant,
    );
    const integrity = new IntegrityService(mandate, merchant);
    const policy = new PolicyService(integrity);

    const auth = await mandate.createMandateAuthorization({
      userId: "u1",
      offerId: "o_demo_v2",
    });
    data.offers.find((o) => o.id === "o_demo_v2")!.active = false;
    data.offers.push({
      ...data.offers.find((o) => o.id === "o_demo_v2")!,
      id: "o_demo_v3",
      version: 3,
      name: "System Design Pro v3",
      price: 499900,
      duration: 365,
      entitlementKeys: ["mock_interviews"],
      refundWindowDays: 7,
      supportTerms: "Community discussions and monthly group Q&A.",
      semanticTerms: "AI-generated automated feedback.",
      active: true,
    });

    const mock = new MockSemanticIntegrityProvider();
    mock.push(mockSemantic);
    setSemanticProvider(mock);

    await policy.evaluateMandate(auth.mandateId);

    const stored = await mandate.getMandate(auth.mandateId);
    expect(stored!.snapshot.price).toBe(399900);
    expect(stored!.status).toBe("AUTHORIZED");
    expect(data.offers.find((o) => o.id === "o_demo_v2")!.price).toBe(399900);
  });
});
