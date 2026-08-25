import { describe, it, expect } from "vitest";
import {
  MandateService,
  InMemoryMandateRepository,
} from "@/lib/mandate/service";
import {
  MerchantOfferService,
  InMemoryMerchantOfferRepository,
} from "@/lib/merchant/service";
import type { MerchantOfferData } from "@/lib/merchant/types";
import { IntegrityService, IntegrityError } from "@/lib/integrity/service";
import { buildInterviewForgeData } from "@/lib/merchant/seed-data";

function setup(data = buildInterviewForgeData()) {
  const merchantRepo = new InMemoryMerchantOfferRepository(data);
  const merchant = new MerchantOfferService(merchantRepo);
  const mandateRepo = new InMemoryMandateRepository();
  const mandate = new MandateService(mandateRepo, merchant);
  const integrity = new IntegrityService(mandate, merchant);
  return { data, merchant, mandateRepo, mandate, integrity };
}

describe("IntegrityService — version selection & baseline identity", () => {
  it("compares snapshot v2 against current v3 (v2 stays baseline)", async () => {
    const { data, integrity, mandate } = setup();
    const result = await mandate.createMandateAuthorization({
      userId: "u1",
      offerId: "o_sysdesign_v2",
    });

    // Merchant introduces v3 and retires v2.
    data.offers.find((o) => o.id === "o_sysdesign_v2")!.active = false;
    data.offers.push({
      ...data.offers.find((o) => o.id === "o_sysdesign_v2")!,
      id: "o_sysdesign_v3",
      version: 3,
      name: "System Design Pro v3",
      price: 449900,
      active: true,
    });

    const report = await integrity.evaluateMandate(result.mandateId);
    expect(report.baselineOfferVersion).toBe(2);
    expect(report.currentOfferVersion).toBe(3);
    expect(report.overall).toBe("CHANGED");
    const types = report.findings.map((f) => f.type);
    expect(types).toContain("PRICE_INCREASED");
  });

  it("returns CURRENT_OFFER_UNAVAILABLE when the product has no active offer", async () => {
    const { data, integrity, mandate } = setup();
    const result = await mandate.createMandateAuthorization({
      userId: "u1",
      offerId: "o_dsa_v1",
    });
    // The only active offer of this product is retired.
    data.offers.find((o) => o.id === "o_dsa_v1")!.active = false;

    const report = await integrity.evaluateMandate(result.mandateId);
    expect(report.overall).toBe("CURRENT_OFFER_UNAVAILABLE");
    expect(report.currentOfferVersion).toBeNull();
  });

  it("throws 404 for an unknown mandate", async () => {
    const { integrity } = setup();
    await expect(integrity.evaluateMandate("nope")).rejects.toMatchObject({
      status: 404,
    });
    await expect(integrity.evaluateMandate("nope")).rejects.toBeInstanceOf(
      IntegrityError,
    );
  });
});

// ---------------------------------------------------------------------------
// STEP 20 — Offline demo scenario.
//   Authorized baseline: System Design Pro v2
//     ₹3,999/year, 365 days, [weekly_mentor_feedback, mock_interviews,
//     capstone_review], 30-day refund
//   Current v3:
//     ₹4,999/year, 365 days, [mock_interviews], 7-day refund
// ---------------------------------------------------------------------------

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
        description: "Authorized baseline.",
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
        supportTerms: "Weekly mentor support.",
        semanticTerms: "Weekly mentor support.",
        active: true,
        createdAt: TS,
        updatedAt: TS,
      },
    ],
  };
}

describe("IntegrityService — demo scenario (v2 -> v3)", () => {
  it("identifies PRICE increase, two removed entitlements, and refund reduction — and never claims semantic degradation", async () => {
    const { data, integrity, mandate } = setup(buildDemoData());
    const result = await mandate.createMandateAuthorization({
      userId: "u1",
      offerId: "o_demo_v2",
    });

    // Advance the lineage to v3.
    data.offers.find((o) => o.id === "o_demo_v2")!.active = false;
    data.offers.push({
      ...data.offers.find((o) => o.id === "o_demo_v2")!,
      id: "o_demo_v3",
      version: 3,
      name: "System Design Pro v3",
      price: 499900, // ₹4,999/year
      duration: 365,
      entitlementKeys: ["mock_interviews"],
      refundWindowDays: 7,
      active: true,
    });

    const report = await integrity.evaluateMandate(result.mandateId);
    expect(report.baselineOfferVersion).toBe(2);
    expect(report.currentOfferVersion).toBe(3);
    expect(report.overall).toBe("CHANGED");

    const types = report.findings.map((f) => f.type);
    expect(types).toContain("PRICE_INCREASED");
    expect(types).toContain("ENTITLEMENT_REMOVED");
    expect(types).toContain("REFUND_WINDOW_REDUCED");

    const removed = report.findings.find(
      (f) => f.type === "ENTITLEMENT_REMOVED",
    )!.meta!.removed as string[];
    expect(removed.sort()).toEqual([
      "capstone_review",
      "weekly_mentor_feedback",
    ]);

    // Price delta: ₹3,999/year -> ₹4,999/year = +25.01%.
    const price = report.findings.find((f) => f.type === "PRICE_INCREASED")!;
    expect((price.meta!.percentageChange as number)).toBeCloseTo(25.01, 1);

    // M4-A must NOT emit any semantic/service-quality opinion.
    expect(
      report.findings.some((f) => /semantic|quality|service quality/i.test(f.evidence)),
    ).toBe(false);
    expect(types).not.toContain("SEMANTIC");
  });
});
