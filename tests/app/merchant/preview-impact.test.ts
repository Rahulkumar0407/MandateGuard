import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  MerchantPreviewService,
  setMerchantPreviewService,
} from "@/lib/merchant/preview-service";
import {
  EnvelopeService,
  InMemoryEnvelopeRepository,
} from "@/lib/envelope/service";
import {
  MerchantOfferService,
  InMemoryMerchantOfferRepository,
} from "@/lib/merchant/service";
import {
  CompatibilityService,
  setCompatibilityServices,
} from "@/lib/compatibility/service";
import type { MerchantOfferData } from "@/lib/merchant/types";
import { POST } from "@/app/api/merchant/offers/preview-impact/route";

function setupData(): MerchantOfferData {
  return {
    merchants: [
      {
        id: "m_forge",
        name: "InterviewForge",
        slug: "interviewforge",
        description: "Fintech prep",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    products: [
      {
        id: "p_sysdesign",
        merchantId: "m_forge",
        name: "System Design Mastery",
        slug: "system-design-mastery",
        description: "Advanced prep",
        category: "coaching",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    offers: [
      {
        id: "o_sysdesign_v1",
        productId: "p_sysdesign",
        version: 1,
        name: "System Design Mentor Tier v1",
        description: "1:1 mentor",
        price: 349900,
        currency: "INR",
        billingInterval: "monthly",
        duration: 180,
        entitlementKeys: ["sysdesign_core", "sysdesign_mocks", "mentor_weekly"],
        refundWindowDays: 30,
        supportTerms: "Dedicated mentor 24-hour turnaround",
        semanticTerms: "Weekly 1:1 video review",
        isConfirmedByMerchant: true,
        versionHash: "h1".repeat(32),
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };
}

beforeEach(async () => {
  const data = setupData();
  const merchantRepo = new InMemoryMerchantOfferRepository(data);
  const merchantService = new MerchantOfferService(merchantRepo);
  const envelopeRepo = new InMemoryEnvelopeRepository();
  const envelopeService = new EnvelopeService(envelopeRepo, merchantService);
  const compatibilityService = new CompatibilityService(
    envelopeService,
    merchantService,
  );
  setCompatibilityServices(envelopeService, merchantService);
  const previewService = new MerchantPreviewService(
    envelopeService,
    merchantService,
    compatibilityService,
  );
  setMerchantPreviewService(previewService);

  // Create an active envelope for testing route response
  await envelopeService.createAuthorizationEnvelope({
    userId: "u_test",
    offerId: "o_sysdesign_v1",
    subscriptionId: "sub_test",
    financialConstraints: { maxPricePaise: 400000 },
    tolerancePolicy: { priceIncreasePercentTolerance: 5 },
  });
});

afterEach(() => {
  setCompatibilityServices(null, null);
  setMerchantPreviewService(null);
});

describe("POST /api/merchant/offers/preview-impact", () => {
  it("returns 200 with impact preview report for valid candidate", async () => {
    const res = await POST(
      new Request("http://localhost/api/merchant/offers/preview-impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: "p_sysdesign",
          name: "System Design v2 candidate",
          description: "Minor refresh",
          price: 359900,
          duration: 180,
          entitlementKeys: ["sysdesign_core", "sysdesign_mocks", "mentor_weekly"],
          refundWindowDays: 30,
          supportTerms: "Dedicated mentor 24-hour turnaround",
          semanticTerms: "Weekly 1:1 video review",
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.productId).toBe("p_sysdesign");
    expect(body.proposedVersion).toBe(2);
    expect(body.totalSubscribersAffected).toBe(1);
    expect(body.summary.compatibleCount).toBe(1);
    expect(body.financialImpact.seamlessMRRPaise).toBe(349900);
    expect(body.subscribers[0].compatibility).toBe("COMPATIBLE");
  });

  it("returns 400 when required payload fields are missing", async () => {
    const res = await POST(
      new Request("http://localhost/api/merchant/offers/preview-impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: "p_sysdesign",
          // missing name, price, duration, etc.
        }),
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid impact preview request payload");
  });

  it("returns 404 when product does not exist", async () => {
    const res = await POST(
      new Request("http://localhost/api/merchant/offers/preview-impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: "p_unknown_product",
          name: "Nonexistent product candidate",
          description: "N/A",
          price: 359900,
          duration: 180,
          entitlementKeys: ["sysdesign_core"],
          refundWindowDays: 30,
          supportTerms: "N/A",
          semanticTerms: "N/A",
        }),
      }),
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("not found");
  });
});
