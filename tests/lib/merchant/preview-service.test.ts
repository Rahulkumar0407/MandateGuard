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
import type { StructuredCommitments } from "@/lib/merchant/structured-commitments";

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
let compatibilityService: CompatibilityService;
let previewService: MerchantPreviewService;

beforeEach(async () => {
  const data = setupData();
  const merchantRepo = new InMemoryMerchantOfferRepository(data);
  merchantService = new MerchantOfferService(merchantRepo);
  const envelopeRepo = new InMemoryEnvelopeRepository();
  envelopeService = new EnvelopeService(envelopeRepo, merchantService);
  compatibilityService = new CompatibilityService(
    envelopeService,
    merchantService,
  );
  setCompatibilityServices(envelopeService, merchantService);
  previewService = new MerchantPreviewService(
    envelopeService,
    merchantService,
    compatibilityService,
  );
  setMerchantPreviewService(previewService);
});

afterEach(() => {
  setCompatibilityServices(null, null);
  setMerchantPreviewService(null);
});

describe("MerchantPreviewService — Pre-Publish Impact Preview", () => {
  it("predicts 100% COMPATIBLE and zero at-risk MRR for a candidate within standard tolerances", async () => {
    // 3 active subscribers authorized on v1
    for (let i = 1; i <= 3; i++) {
      await envelopeService.createAuthorizationEnvelope({
        userId: `u_${i}`,
        offerId: "o_sysdesign_v1",
        subscriptionId: `sub_${i}`,
        financialConstraints: { maxPricePaise: 400000 },
        tolerancePolicy: { priceIncreasePercentTolerance: 5 },
      });
    }

    // Merchant simulates candidate v2 (+2.8% price increase: ₹3599 vs ₹3499)
    const preview = await previewService.generateImpactPreview({
      productId: "p_sysdesign",
      name: "System Design v2 candidate",
      description: "Minor refresh",
      price: 359900,
      duration: 180,
      entitlementKeys: ["sysdesign_core", "sysdesign_mocks", "mentor_weekly"],
      refundWindowDays: 30,
      supportTerms: "Dedicated mentor 24-hour turnaround",
      semanticTerms: "Weekly 1:1 video review",
      structuredCommitments: sampleCommitments(),
    });

    expect(preview.productId).toBe("p_sysdesign");
    expect(preview.proposedVersion).toBe(2);
    expect(preview.totalSubscribersAffected).toBe(3);
    expect(preview.summary.compatibleCount).toBe(3);
    expect(preview.summary.reviewCount).toBe(0);
    expect(preview.summary.breakingCount).toBe(0);
    expect(preview.summary.compatiblePercentage).toBe(100);

    expect(preview.financialImpact.currentTotalMRRPaise).toBe(3 * 349900);
    expect(preview.financialImpact.atRiskMRRPaise).toBe(0);
    expect(preview.financialImpact.seamlessMRRPaise).toBe(3 * 349900);

    expect(preview.subscribers).toHaveLength(3);
    for (const sub of preview.subscribers) {
      expect(sub.compatibility).toBe("COMPATIBLE");
      expect(sub.requiredAction).toBe("NONE");
    }
  });

  it("identifies REVIEW cohort when candidate exceeds tolerance (+8% price increase)", async () => {
    for (let i = 1; i <= 2; i++) {
      await envelopeService.createAuthorizationEnvelope({
        userId: `u_${i}`,
        offerId: "o_sysdesign_v1",
        subscriptionId: `sub_${i}`,
        financialConstraints: { maxPricePaise: 450000, maxPriceIncreasePercent: 15 },
        tolerancePolicy: { priceIncreasePercentTolerance: 5 },
      });
    }

    // Candidate with +8% price increase (₹3778)
    const preview = await previewService.generateImpactPreview({
      productId: "p_sysdesign",
      name: "System Design v2 review candidate",
      description: "Moderate price increase",
      price: 377800,
      duration: 180,
      entitlementKeys: ["sysdesign_core", "sysdesign_mocks", "mentor_weekly"],
      refundWindowDays: 30,
      supportTerms: "Dedicated mentor 24-hour turnaround",
      semanticTerms: "Weekly 1:1 video review",
      structuredCommitments: sampleCommitments(),
    });

    expect(preview.totalSubscribersAffected).toBe(2);
    expect(preview.summary.compatibleCount).toBe(0);
    expect(preview.summary.reviewCount).toBe(2);
    expect(preview.summary.breakingCount).toBe(0);
    expect(preview.financialImpact.reviewPendingMRRPaise).toBe(2 * 349900);
    expect(preview.financialImpact.atRiskMRRPaise).toBe(0);

    for (const sub of preview.subscribers) {
      expect(sub.compatibility).toBe("REVIEW");
      expect(sub.requiredAction).toBe("REVIEW");
    }
  });

  it("identifies BREAKING cohort and calculates at-risk MRR when candidate removes human mentor", async () => {
    for (let i = 1; i <= 4; i++) {
      await envelopeService.createAuthorizationEnvelope({
        userId: `u_${i}`,
        offerId: "o_sysdesign_v1",
        subscriptionId: `sub_${i}`,
      });
    }

    const degradedCommitments = sampleCommitments();
    degradedCommitments.support.hasDedicatedHuman = false;
    degradedCommitments.support.tier = "community";
    degradedCommitments.support.oneOnOneSessionsPerMonth = 0;

    const preview = await previewService.generateImpactPreview({
      productId: "p_sysdesign",
      name: "System Design AI/Community Tier",
      description: "AI tutor replaces human mentor",
      price: 349900,
      duration: 180,
      entitlementKeys: ["sysdesign_core", "sysdesign_mocks"],
      refundWindowDays: 30,
      supportTerms: "Community forum support",
      semanticTerms: "AI review bot",
      structuredCommitments: degradedCommitments,
    });

    expect(preview.totalSubscribersAffected).toBe(4);
    expect(preview.summary.breakingCount).toBe(4);
    expect(preview.summary.breakingPercentage).toBe(100);
    expect(preview.financialImpact.atRiskMRRPaise).toBe(4 * 349900);

    for (const sub of preview.subscribers) {
      expect(sub.compatibility).toBe("BREAKING");
      expect(sub.requiredAction).toBe("REAUTHORIZATION");
      expect(sub.reasons.some((r) => r.code === "DEDICATED_HUMAN_LOST")).toBe(true);
    }
  });

  it("correctly handles heterogeneous cohorts and exercises tuple caching", async () => {
    // User 1: 10% price tolerance (tolerant) -> COMPATIBLE for +7%
    await envelopeService.createAuthorizationEnvelope({
      userId: "u_tolerant",
      offerId: "o_sysdesign_v1",
      subscriptionId: "sub_tolerant",
      financialConstraints: { maxPricePaise: 400000, maxPriceIncreasePercent: 20 },
      tolerancePolicy: { priceIncreasePercentTolerance: 10 },
    });

    // User 2: 5% price tolerance -> REVIEW for +7%
    await envelopeService.createAuthorizationEnvelope({
      userId: "u_standard",
      offerId: "o_sysdesign_v1",
      subscriptionId: "sub_standard",
      financialConstraints: { maxPricePaise: 400000, maxPriceIncreasePercent: 15 },
      tolerancePolicy: { priceIncreasePercentTolerance: 5 },
    });

    // User 3: hard ceiling ₹3600 (strict) -> BREAKING for ₹3743 (+7%)
    await envelopeService.createAuthorizationEnvelope({
      userId: "u_strict",
      offerId: "o_sysdesign_v1",
      subscriptionId: "sub_strict",
      financialConstraints: { maxPricePaise: 360000 },
      tolerancePolicy: { priceIncreasePercentTolerance: 5 },
    });

    const preview = await previewService.generateImpactPreview({
      productId: "p_sysdesign",
      name: "System Design +7%",
      description: "Candidate",
      price: 374393, // +7%
      duration: 180,
      entitlementKeys: ["sysdesign_core", "sysdesign_mocks", "mentor_weekly"],
      refundWindowDays: 30,
      supportTerms: "Dedicated mentor 24-hour turnaround",
      semanticTerms: "Weekly 1:1 video review",
      structuredCommitments: sampleCommitments(),
    });

    expect(preview.totalSubscribersAffected).toBe(3);
    expect(preview.summary.compatibleCount).toBe(1);
    expect(preview.summary.reviewCount).toBe(1);
    expect(preview.summary.breakingCount).toBe(1);

    expect(preview.cohortBreakdown.compatible.count).toBe(1);
    expect(preview.cohortBreakdown.review.count).toBe(1);
    expect(preview.cohortBreakdown.breaking.count).toBe(1);

    expect(preview.financialImpact.seamlessMRRPaise).toBe(349900);
    expect(preview.financialImpact.reviewPendingMRRPaise).toBe(349900);
    expect(preview.financialImpact.atRiskMRRPaise).toBe(349900);
  });

  it("guarantees ANALYSIS ONLY (zero mutations to database/services)", async () => {
    await envelopeService.createAuthorizationEnvelope({
      userId: "u_check",
      offerId: "o_sysdesign_v1",
      subscriptionId: "sub_check",
    });

    const initialOffers = await merchantService.listOffers();
    const initialEnvelopes = await envelopeService.listEnvelopesByUserId("u_check");

    await previewService.generateImpactPreview({
      productId: "p_sysdesign",
      name: "System Design Simulated v2",
      description: "Simulation only",
      price: 399900,
      duration: 180,
      entitlementKeys: ["sysdesign_core"],
      refundWindowDays: 30,
      supportTerms: "Simulated",
      semanticTerms: "Simulated",
      structuredCommitments: sampleCommitments(),
    });

    // Check nothing was created/altered
    const afterOffers = await merchantService.listOffers();
    const afterEnvelopes = await envelopeService.listEnvelopesByUserId("u_check");

    expect(afterOffers).toHaveLength(initialOffers.length);
    expect(afterEnvelopes).toHaveLength(initialEnvelopes.length);
    expect(afterEnvelopes[0].status).toBe("ACTIVE");
  });
});
