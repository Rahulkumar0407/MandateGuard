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

function setup(data = buildDemoData()) {
  const merchantRepo = new InMemoryMerchantOfferRepository(data);
  const merchant = new MerchantOfferService(merchantRepo);
  const mandateRepo = new InMemoryMandateRepository();
  const mandate = new MandateService(mandateRepo, merchant);
  const integrity = new IntegrityService(mandate, merchant);
  return { data, merchant, mandate, integrity };
}

function supportDowngradeEvaluation(): SemanticEvaluation {
  return {
    changed: true,
    findings: [
      {
        type: "SUPPORT_QUALITY_CHANGED",
        severity: "WARNING",
        direction: "DEGRADED",
        baseline: "Dedicated weekly 1:1 mentor feedback.",
        current: "Community discussions and monthly group Q&A.",
        explanation:
          "Personalized weekly 1:1 mentorship replaced by community + monthly group Q&A.",
        confidence: 0.95,
      },
    ],
  };
}

describe("M5 integration — combined M4 + M5 report", () => {
  afterEach(() => setSemanticProvider(null));

  it("appends semantic findings to deterministic findings without duplicates or payment action (STEP 14/17)", async () => {
    const { data, integrity, mandate } = setup();
    const result = await mandate.createMandateAuthorization({
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
    mock.push(supportDowngradeEvaluation());
    setSemanticProvider(mock);

    const report = await integrity.evaluateMandate(result.mandateId);

    // Deterministic M4 findings are intact.
    const detTypes = report.findings.map((f) => f.type);
    expect(detTypes).toContain("PRICE_INCREASED");
    expect(detTypes).toContain("ENTITLEMENT_REMOVED");
    expect(detTypes).toContain("REFUND_WINDOW_REDUCED");
    expect(report.overall).toBe("CHANGED");

    // Semantic M5 findings are appended, never merged into deterministic.
    expect(report.semanticStatus).toBe("AVAILABLE");
    expect(report.semanticFindings).toHaveLength(1);
    expect(report.semanticFindings[0].type).toBe("SUPPORT_QUALITY_CHANGED");
    expect(report.semanticFindings[0].direction).toBe("DEGRADED");
    expect(report.semanticFindings[0].confidence).toBeCloseTo(0.95, 2);

    // No duplicate / no removal of deterministic findings, and no semantic
    // finding ever leaks into the deterministic array.
    expect(detTypes).toContain("DURATION_UNCHANGED");
    expect(detTypes).not.toContain("SUPPORT_QUALITY_CHANGED");
    expect(report.findings).toHaveLength(4);

    // No payment action: the authorized snapshot and current offer are untouched.
    const stored = await mandate.getMandate(result.mandateId);
    expect(stored!.snapshot.price).toBe(399900);
    expect(data.offers.find((o) => o.id === "o_demo_v2")!.price).toBe(399900);
  });

  it("degrades gracefully when the semantic provider is unavailable (STEP 16)", async () => {
    const { data, integrity, mandate } = setup();
    const result = await mandate.createMandateAuthorization({
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

    // Provider returns invalid output -> runner marks UNAVAILABLE.
    const mock = new MockSemanticIntegrityProvider();
    mock.push({
      changed: true,
      findings: [
        {
          type: "SUPPORT_QUALITY_CHANGED",
          severity: "WARNING",
          direction: "DEGRADED",
          baseline: "a",
          current: "b",
          explanation: "x",
          confidence: 5, // out of range -> schema rejects
        },
      ],
    });
    setSemanticProvider(mock);

    const report = await integrity.evaluateMandate(result.mandateId);

    // Deterministic findings remain fully intact.
    const detTypes = report.findings.map((f) => f.type);
    expect(detTypes).toContain("PRICE_INCREASED");
    expect(detTypes).toContain("ENTITLEMENT_REMOVED");
    expect(detTypes).toContain("REFUND_WINDOW_REDUCED");

    // Semantic gracefully unavailable — no fabricated findings.
    expect(report.semanticStatus).toBe("UNAVAILABLE");
    expect(report.semanticFindings).toEqual([]);
  });

  it("does not call the semantic evaluator when no current offer exists", async () => {
    const { data, integrity, mandate } = setup();
    const result = await mandate.createMandateAuthorization({
      userId: "u1",
      offerId: "o_demo_v2",
    });
    data.offers.find((o) => o.id === "o_demo_v2")!.active = false;

    const mock = new MockSemanticIntegrityProvider();
    setSemanticProvider(mock);

    const report = await integrity.evaluateMandate(result.mandateId);
    expect(report.overall).toBe("CURRENT_OFFER_UNAVAILABLE");
    expect(report.semanticStatus).toBe("UNAVAILABLE");
    expect(report.semanticFindings).toEqual([]);
  });
});
