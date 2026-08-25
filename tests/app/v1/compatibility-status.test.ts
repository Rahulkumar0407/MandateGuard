import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setCompatibilityServices } from "@/lib/compatibility/service";
import type { CompatibilityFinding } from "@/lib/compatibility/types";
import {
  EnvelopeService,
  InMemoryEnvelopeRepository,
} from "@/lib/envelope/service";
import {
  MerchantOfferService,
  InMemoryMerchantOfferRepository,
} from "@/lib/merchant/service";
import type { MerchantOfferData } from "@/lib/merchant/types";
import type { StructuredCommitments } from "@/lib/merchant/structured-commitments";
import { GET } from "@/app/v1/subscriptions/[id]/compatibility-status/route";

function sampleCommitments(): StructuredCommitments {
  return {
    support: {
      tier: "dedicated_mentor",
      slaHours: 24,
      oneOnOneSessionsPerMonth: 4,
      hasDedicatedHuman: true,
    },
    entitlements: {
      keys: ["sysdesign_core", "sysdesign_mocks", "mentor_weekly"],
      criticalKeys: ["mentor_weekly"],
    },
    usageLimits: {
      apiRequestsPerMonth: 10000,
      concurrentSeats: 1,
      computeCredits: 500,
    },
    delivery: {
      type: "continuous_saas",
      commitmentSLA: "Weekly 1:1 sessions",
    },
    refundPolicy: {
      windowDays: 30,
      type: "conditional",
    },
  };
}

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
        description: "1:1 mentor with mock interviews",
        price: 349900,
        currency: "INR",
        billingInterval: "monthly",
        duration: 180,
        entitlementKeys: ["sysdesign_core", "sysdesign_mocks", "mentor_weekly"],
        refundWindowDays: 30,
        supportTerms: "Dedicated mentor 24-hour turnaround",
        semanticTerms: "Weekly 1:1 video review",
        structuredCommitments: sampleCommitments(),
        isConfirmedByMerchant: true,
        versionHash: "h1".repeat(32),
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };
}

let merchantService: MerchantOfferService;
let envelopeService: EnvelopeService;

beforeEach(async () => {
  const data = setupData();
  const merchantRepo = new InMemoryMerchantOfferRepository(data);
  merchantService = new MerchantOfferService(merchantRepo);
  const envelopeRepo = new InMemoryEnvelopeRepository();
  envelopeService = new EnvelopeService(envelopeRepo, merchantService);
  setCompatibilityServices(envelopeService, merchantService);
});

afterEach(() => {
  setCompatibilityServices(null, null);
});

describe("GET /v1/subscriptions/:id/compatibility-status", () => {
  it("returns COMPATIBLE when current offer conforms to authorized baseline", async () => {
    // 1. Authorize v1
    await envelopeService.createAuthorizationEnvelope({
      userId: "u_alice",
      offerId: "o_sysdesign_v1",
      subscriptionId: "sub_alice_123",
      financialConstraints: { maxPricePaise: 400000 },
    });

    const res = await GET(
      new Request("http://localhost/v1/subscriptions/sub_alice_123/compatibility-status"),
      { params: Promise.resolve({ id: "sub_alice_123" }) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.compatibility).toBe("COMPATIBLE");
    expect(body.authorization.canProceedAutonomously).toBe(true);
    expect(body.authorization.delegatedBudgetLimit).toBe(400000);
    expect(body.authorization.authorizedMonthlySpend).toBe(349900);
    expect(body.requiredAction).toBe("NONE");
    expect(body.subscriptionId).toBe("sub_alice_123");
    expect(body.authorizedBaseline.offerVersionId).toBe("o_sysdesign_v1");
    expect(body.authorizedBaseline.version).toBe(1);
    expect(body.currentOffer.offerVersionId).toBe("o_sysdesign_v1");
    expect(body.currentOffer.version).toBe(1);
    expect(Array.isArray(body.reasons)).toBe(true);
    expect(body.evaluatedAt).toBeDefined();
  });

  it("returns REVIEW when current offer exceeds tolerance (+8% price increase)", async () => {
    // 1. Authorize v1 with ₹4000 ceiling
    await envelopeService.createAuthorizationEnvelope({
      userId: "u_alice",
      offerId: "o_sysdesign_v1",
      subscriptionId: "sub_alice_review",
      financialConstraints: { maxPricePaise: 400000, maxPriceIncreasePercent: 15 },
      tolerancePolicy: { priceIncreasePercentTolerance: 5 },
    });

    // 2. Merchant creates v2 (+8% price)
    await merchantService.createOfferVersion("p_sysdesign", {
      name: "System Design v2",
      description: "v2",
      price: 377800, // +7.97%
      duration: 180,
      entitlementKeys: ["sysdesign_core", "sysdesign_mocks", "mentor_weekly"],
      refundWindowDays: 30,
      supportTerms: "1:1 mentor with 24h SLA",
      semanticTerms: "Weekly video review",
      structuredCommitments: sampleCommitments(),
      confirmImmediately: true,
    });

    const res = await GET(
      new Request("http://localhost/v1/subscriptions/sub_alice_review/compatibility-status"),
      { params: Promise.resolve({ id: "sub_alice_review" }) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.compatibility).toBe("REVIEW");
    expect(body.authorization.canProceedAutonomously).toBe(false);
    expect(body.requiredAction).toBe("REVIEW");
    expect(body.authorizedBaseline.version).toBe(1);
    expect(body.currentOffer.version).toBe(2);
    expect(body.reasons.some((r: CompatibilityFinding) => r.code === "PRICE_INCREASE_EXCEEDS_TOLERANCE")).toBe(true);
  });

  it("returns BREAKING and REAUTHORIZATION when current offer breaches constraints (dedicated human lost)", async () => {
    // 1. Authorize v1
    await envelopeService.createAuthorizationEnvelope({
      userId: "u_bob",
      offerId: "o_sysdesign_v1",
      subscriptionId: "sub_bob_breaking",
    });

    // 2. Merchant creates degraded v2
    const degradedCommitments = sampleCommitments();
    degradedCommitments.support.tier = "community";
    degradedCommitments.support.hasDedicatedHuman = false;
    degradedCommitments.support.oneOnOneSessionsPerMonth = 0;

    await merchantService.createOfferVersion("p_sysdesign", {
      name: "System Design Community v2",
      description: "Community tier",
      price: 412882, // +18%
      duration: 180,
      entitlementKeys: ["sysdesign_core"],
      refundWindowDays: 30,
      supportTerms: "Discord only",
      semanticTerms: "Community peer support",
      structuredCommitments: degradedCommitments,
      confirmImmediately: true,
    });

    const res = await GET(
      new Request("http://localhost/v1/subscriptions/sub_bob_breaking/compatibility-status"),
      { params: Promise.resolve({ id: "sub_bob_breaking" }) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.compatibility).toBe("BREAKING");
    expect(body.authorization.canProceedAutonomously).toBe(false);
    expect(body.requiredAction).toBe("REAUTHORIZATION");
    expect(body.authorizedBaseline.version).toBe(1);
    expect(body.currentOffer.version).toBe(2);
    expect(body.reasons.some((r: CompatibilityFinding) => r.code === "DEDICATED_HUMAN_LOST")).toBe(true);
  });

  it("returns 404 for unknown subscription identifier", async () => {
    const res = await GET(
      new Request("http://localhost/v1/subscriptions/unknown_sub/compatibility-status"),
      { params: Promise.resolve({ id: "unknown_sub" }) },
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("not found");
  });
});
