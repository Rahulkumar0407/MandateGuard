import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/merchant/optimization/route";
import { POST as approveRoute } from "@/app/api/merchant/optimization/approve/route";
import {
  setMerchantOfferRepository,
  InMemoryMerchantOfferRepository,
} from "@/lib/merchant/service";
import { normalizeStructuredCommitments } from "@/lib/merchant/structured-commitments";

const TS = new Date("2026-01-01T00:00:00.000Z");

describe("API Route: /api/merchant/optimization", () => {
  beforeEach(() => {
    const commitments = normalizeStructuredCommitments({
      support: {
        tier: "standard_email",
        slaHours: 48,
        oneOnOneSessionsPerMonth: 0,
        hasDedicatedHuman: false,
      },
      entitlements: {
        keys: ["system_design_curriculum"],
        criticalKeys: ["system_design_curriculum"],
      },
      usageLimits: {
        apiRequestsPerMonth: null,
        concurrentSeats: 1,
        computeCredits: null,
      },
      delivery: {
        type: "continuous_saas",
        commitmentSLA: "48h SLA",
      },
      refundPolicy: {
        windowDays: 30,
        type: "conditional",
      },
    });

    const repo = new InMemoryMerchantOfferRepository({
      merchants: [
        {
          id: "merch_acme",
          name: "Acme Prep",
          slug: "acme-prep",
          description: "Top Prep",
          status: "ACTIVE",
          createdAt: TS,
          updatedAt: TS,
        },
      ],
      products: [
        {
          id: "prod_sys_design",
          merchantId: "merch_acme",
          name: "System Design Pro",
          slug: "system-design-pro",
          category: "system_design",
          description: "System design prep",
          active: true,
          createdAt: TS,
          updatedAt: TS,
        },
      ],
      offers: [
        {
          id: "offer_sys_design_pro",
          productId: "prod_sys_design",
          version: 1,
          name: "System Design Pro v1",
          description: "System architecture curriculum.",
          price: 349900,
          currency: "INR",
          billingInterval: "monthly",
          duration: 1,
          entitlementKeys: ["system_design_curriculum"],
          refundWindowDays: 30,
          supportTerms: "Email support within 48h.",
          semanticTerms: "system design",
          structuredCommitments: commitments,
          isConfirmedByMerchant: true,
          versionHash: "hash_sys_design_pro_v1",
          active: true,
          createdAt: TS,
          updatedAt: TS,
        },
      ],
    });

    setMerchantOfferRepository(repo);
  });

  afterEach(() => {
    setMerchantOfferRepository(null);
  });

  it("GET returns 200 with complete grounded OfferOptimizationPlan", async () => {
    const req = new Request("http://localhost/api/merchant/optimization?offerId=offer_sys_design_pro");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.offer.id).toBe("offer_sys_design_pro");
    expect(body.diagnosis).toBeDefined();
    expect(body.diagnosis.buyerNeeds).toContain("Human mentor (1:1 guidance)");
    expect(body.recommendation.proposedTerms.hasDedicatedHuman).toBe(true);
    expect(body.simulation.missionsRecovered).toBeGreaterThan(0);
    expect(body.simulation.claimNotice).toContain("Not a financial revenue forecast");
  });

  it("POST /approve creates and publishes new OfferVersion (v2)", async () => {
    const req = new Request("http://localhost/api/merchant/optimization/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offerId: "offer_sys_design_pro",
        expectedVersion: 1,
        expectedVersionHash: "hash_sys_design_pro_v1",
        proposedChanges: {
          name: "System Design Pro v2",
        },
      }),
    });

    const res = await approveRoute(req);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.status).toBe("APPROVED_AND_PUBLISHED");
    expect(body.newOffer.version).toBe(2);
    expect(body.newOffer.versionHash).toBeDefined();
  });

  it("POST /approve returns 409 when expectedVersion is stale", async () => {
    const req = new Request("http://localhost/api/merchant/optimization/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offerId: "offer_sys_design_pro",
        expectedVersion: 99, // Stale version mismatch
      }),
    });

    const res = await approveRoute(req);
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.code).toBe("STALE_VERSION");
  });
});
