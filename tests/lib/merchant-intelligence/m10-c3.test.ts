import { describe, it, expect, beforeEach } from "vitest";
import {
  MerchantIntelligenceService,
  MerchantRevenueOpportunityEngine,
  OPPORTUNITY_TYPES,
  type OpportunityType,
  type MerchantSupplySnapshot,
  type BuyerMissionEvaluation,
} from "@/lib/merchant-intelligence";

import { InMemoryMerchantOfferRepository } from "@/lib/merchant/repository";
import { MerchantOfferService } from "@/lib/merchant/service";
import { buildInterviewForgeData } from "@/lib/merchant/seed-data";
import { normalizeBuyerIntent } from "@/lib/intent";

describe("M10-C3 — Evidence-Based Revenue Opportunity Engine Comprehensive Benchmark Suite", () => {
  let merchantRepo: InMemoryMerchantOfferRepository;
  let merchantService: MerchantOfferService;
  let intelligenceService: MerchantIntelligenceService;
  let opportunityEngine: MerchantRevenueOpportunityEngine;
  let baselineSnapshot: MerchantSupplySnapshot;

  beforeEach(async () => {
    const rawData = buildInterviewForgeData();
    const baselineOffer = rawData.offers.find((o) => o.id === "o_sysdesign_v1");
    if (baselineOffer) {
      baselineOffer.active = true;
      baselineOffer.isConfirmedByMerchant = true;
      baselineOffer.versionHash = "hash_sysdesign_v1";
      baselineOffer.structuredCommitments = {
        support: {
          tier: "dedicated_mentor",
          slaHours: 24,
          oneOnOneSessionsPerMonth: 4,
          hasDedicatedHuman: true,
        },
        entitlements: {
          keys: ["system_design_course", "mock_interviews", "mentor_feedback"],
          criticalKeys: ["mentor_feedback"],
        },
        usageLimits: {
          apiRequestsPerMonth: 10000,
          concurrentSeats: 1,
          computeCredits: 500,
        },
        delivery: {
          type: "continuous_saas",
          commitmentSLA: "24h Turnaround",
        },
        refundPolicy: {
          windowDays: 30,
          type: "conditional",
        },
      };
    }

    merchantRepo = new InMemoryMerchantOfferRepository(rawData);
    merchantService = new MerchantOfferService(merchantRepo);
    opportunityEngine = new MerchantRevenueOpportunityEngine();
    intelligenceService = new MerchantIntelligenceService(
      merchantService,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      opportunityEngine,
    );

    const products = await merchantService.listProducts();
    const offers = await merchantService.listOffers();
    baselineSnapshot = {
      merchantId: "m_interviewforge",
      merchantName: "InterviewForge",
      products,
      offers,
      totalProducts: products.length,
      totalOffers: offers.length,
      activeConfirmedOffers: 1,
      unconfirmedOffers: 0,
      offersWithStructuredCommitments: 1,
    };
  });

  // 1. Taxonomy completeness
  it("Case 1: verifies all 8 explicit opportunity types are defined in taxonomy", () => {
    expect(OPPORTUNITY_TYPES.length).toBe(8);
    const expectedTypes: OpportunityType[] = [
      "UNSERVED_DEMAND",
      "UNDER_SERVED_DEMAND",
      "UPSELL",
      "CROSS_SELL",
      "OFFER_PACKAGING",
      "PRICE_VALUE_MISMATCH",
      "SUPPORT_DRIVEN_OPPORTUNITY",
      "AI_BUYER_CONVERSION_GAP",
    ];

    for (const type of expectedTypes) {
      expect(OPPORTUNITY_TYPES).toContain(type);
    }
  });

  // 2. Unserved Demand Detection
  it("Case 2: detects UNSERVED_DEMAND when buyer intents demand categories missing from catalog", () => {
    const historicalIntents = [
      normalizeBuyerIntent({
        category: "dsa",
        budget: { amountPaise: 200000, currency: "INR", type: "HARD" },
        billing: { cadence: "monthly", isRecurring: true },
        mustHave: ["leetcode_patterns", "live_code_reviews"],
      }),
      normalizeBuyerIntent({
        category: "dsa",
        budget: { amountPaise: 200000, currency: "INR", type: "HARD" },
        billing: { cadence: "monthly", isRecurring: true },
        mustHave: ["leetcode_patterns"],
      }),
    ];

    const missingDemand = [
      {
        id: "dsa_cluster",
        category: "dsa",
        targetBudgetPaise: 200000,
        mustHaveEntitlements: ["leetcode_patterns", "live_code_reviews"],
        demandFrequency: 2,
        unmetReason: "2 requests received for DSA under ₹2,000 with 0 active catalog offers.",
        merchantOpportunity: "Create an active DSA offer.",
      },
    ];

    const report = opportunityEngine.analyzeOpportunities(
      baselineSnapshot,
      [],
      [],
      historicalIntents,
      missingDemand,
    );

    const unserved = report.opportunities.find((o) => o.type === "UNSERVED_DEMAND");
    expect(unserved).toBeDefined();
    expect(unserved?.title).toContain("Unserved Market Demand for 'dsa'");
    expect(unserved?.estimatedImpact?.isEstimated).toBe(true);
    expect(unserved?.estimatedImpact?.monthlyRevenuePotentialPaise).toBe(400000); // 2 * ₹2,000
    expect(unserved?.recommendedAction.actionType).toBe("CREATE_OFFER");
    expect(unserved?.recommendedAction.requiresMerchantApproval).toBe(true);
  });

  // 3. Under-Served Demand (Budget Ceiling Blocking)
  it("Case 3: detects UNDER_SERVED_DEMAND when price-sensitive buyers drop due to lowest plan ceiling", () => {
    const historicalIntents = [
      normalizeBuyerIntent({
        category: "system_design",
        budget: { amountPaise: 200000, currency: "INR", type: "HARD" },
        billing: { cadence: "monthly", isRecurring: true },
        mustHave: ["system_design_course"],
      }),
      normalizeBuyerIntent({
        category: "system_design",
        budget: { amountPaise: 240000, currency: "INR", type: "HARD" },
        billing: { cadence: "monthly", isRecurring: true },
        mustHave: ["system_design_course"],
      }),
    ];

    const report = opportunityEngine.analyzeOpportunities(
      baselineSnapshot,
      [],
      [],
      historicalIntents,
      [],
    );

    const underServed = report.opportunities.find((o) => o.type === "UNDER_SERVED_DEMAND");
    expect(underServed).toBeDefined();
    expect(underServed?.type).toBe("UNDER_SERVED_DEMAND");
    expect(underServed?.estimatedImpact?.demandFrequency).toBe(2);
    expect(underServed?.recommendedAction.actionType).toBe("CREATE_TIER");
    expect(underServed?.recommendedAction.requiresMerchantApproval).toBe(true);
  });

  // 4. Upsell Opportunities for High Willingness-to-Pay
  it("Case 4: detects UPSELL opportunity when buyers exhibit willingness to pay above max tier", () => {
    const historicalIntents = [
      normalizeBuyerIntent({
        category: "system_design",
        budget: { amountPaise: 700000, currency: "INR", type: "SOFT" },
        billing: { cadence: "monthly", isRecurring: true },
        mustHave: ["dedicated_mentor", "human_mentor", "daily_reviews"],
      }),
      normalizeBuyerIntent({
        category: "system_design",
        budget: { amountPaise: 800000, currency: "INR", type: "SOFT" },
        billing: { cadence: "monthly", isRecurring: true },
        mustHave: ["dedicated_mentor", "human_mentor", "mock_interviews"],
      }),
    ];

    const report = opportunityEngine.analyzeOpportunities(
      baselineSnapshot,
      [],
      [],
      historicalIntents,
      [],
    );

    const upsell = report.opportunities.find((o) => o.type === "UPSELL");
    expect(upsell).toBeDefined();
    expect(upsell?.type).toBe("UPSELL");
    expect(upsell?.title).toContain("Executive");
    expect(upsell?.estimatedImpact?.isEstimated).toBe(true);
    expect(upsell?.estimatedImpact?.monthlyRevenuePotentialPaise).toBeGreaterThan(0);
    expect(upsell?.recommendedAction.actionType).toBe("CREATE_TIER");
  });

  // 5. Cross-Sell Opportunities
  it("Case 5: detects CROSS_SELL opportunity for multi-service buyer demand patterns", () => {
    const historicalIntents = [
      normalizeBuyerIntent({
        category: "system_design",
        budget: { amountPaise: 500000, currency: "INR", type: "SOFT" },
        billing: { cadence: "monthly", isRecurring: true },
        mustHave: ["system_design_course", "mock_interviews", "resume_review"],
      }),
      normalizeBuyerIntent({
        category: "system_design",
        budget: { amountPaise: 550000, currency: "INR", type: "SOFT" },
        billing: { cadence: "monthly", isRecurring: true },
        mustHave: ["system_design_course", "mock_interviews", "mentor_feedback"],
      }),
    ];

    const report = opportunityEngine.analyzeOpportunities(
      baselineSnapshot,
      [],
      [],
      historicalIntents,
      [],
    );

    const crossSell = report.opportunities.find((o) => o.type === "CROSS_SELL");
    expect(crossSell).toBeDefined();
    expect(crossSell?.type).toBe("CROSS_SELL");
    expect(crossSell?.recommendedAction.actionType).toBe("ADD_BUNDLE");
  });

  // 6. Offer Packaging & Unstructured Entitlements
  it("Case 6: detects OFFER_PACKAGING when offers lack machine-readable entitlement keys", () => {
    const uncommittedSnapshot: MerchantSupplySnapshot = {
      ...baselineSnapshot,
      offers: [
        {
          ...baselineSnapshot.offers[0],
          structuredCommitments: {
            ...baselineSnapshot.offers[0].structuredCommitments!,
            entitlements: { keys: [], criticalKeys: [] },
          },
        },
      ],
    };

    const report = opportunityEngine.analyzeOpportunities(
      uncommittedSnapshot,
      [],
      [],
      [],
      [],
    );

    const packaging = report.opportunities.find((o) => o.type === "OFFER_PACKAGING");
    expect(packaging).toBeDefined();
    expect(packaging?.type).toBe("OFFER_PACKAGING");
    expect(packaging?.recommendedAction.actionType).toBe("UPDATE_COMMITMENTS");
  });

  // 7. Price-Value Mismatch (Underpriced Human Mentorship)
  it("Case 7: detects PRICE_VALUE_MISMATCH when high-touch human mentoring is severely underpriced", () => {
    const underpricedSnapshot: MerchantSupplySnapshot = {
      ...baselineSnapshot,
      offers: [
        {
          ...baselineSnapshot.offers[0],
          price: 99900, // ₹999/mo for dedicated human mentor
        },
      ],
    };

    const report = opportunityEngine.analyzeOpportunities(
      underpricedSnapshot,
      [],
      [],
      [],
      [],
    );

    const mismatch = report.opportunities.find((o) => o.type === "PRICE_VALUE_MISMATCH");
    expect(mismatch).toBeDefined();
    expect(mismatch?.type).toBe("PRICE_VALUE_MISMATCH");
    expect(mismatch?.recommendedAction.actionType).toBe("ADJUST_PRICE");
  });

  // 8. Support-Driven Opportunity (SLA Gaps)
  it("Case 8: detects SUPPORT_DRIVEN_OPPORTUNITY when buyers fail due to missing SLA response guarantees", () => {
    const failedEvaluations: BuyerMissionEvaluation[] = [
      {
        discovered: true,
        understandable: true,
        comparable: false,
        shortlisted: false,
        recommended: false,
        failedAt: "COMPARISON",
        evidence: [
          {
            id: "ev_supp_drop_1",
            category: "SUPPORT",
            source: "DECISION_RESULT",
            fact: "Offer lacked guaranteed SLA turnaround hours.",
          },
        ],
      },
    ];

    const report = opportunityEngine.analyzeOpportunities(
      baselineSnapshot,
      [],
      failedEvaluations,
      [],
      [],
    );

    const supportOpp = report.opportunities.find((o) => o.type === "SUPPORT_DRIVEN_OPPORTUNITY");
    expect(supportOpp).toBeDefined();
    expect(supportOpp?.type).toBe("SUPPORT_DRIVEN_OPPORTUNITY");
    expect(supportOpp?.recommendedAction.actionType).toBe("UPDATE_COMMITMENTS");
  });

  // 9. AI Buyer Conversion Gap (Unconfirmed Offers)
  it("Case 9: detects AI_BUYER_CONVERSION_GAP when catalog contains unconfirmed offers", () => {
    const unconfirmedSnapshot: MerchantSupplySnapshot = {
      ...baselineSnapshot,
      unconfirmedOffers: 2,
      offers: [
        {
          ...baselineSnapshot.offers[0],
          isConfirmedByMerchant: false,
          versionHash: "",
        },
      ],
    };

    const report = opportunityEngine.analyzeOpportunities(
      unconfirmedSnapshot,
      [],
      [],
      [],
      [],
    );

    const gap = report.opportunities.find((o) => o.type === "AI_BUYER_CONVERSION_GAP");
    expect(gap).toBeDefined();
    expect(gap?.type).toBe("AI_BUYER_CONVERSION_GAP");
    expect(gap?.recommendedAction.actionType).toBe("ENRICH_METADATA");
  });

  // 10. Safety Invariants & Zero Hallucination
  it("Case 10: enforces safety invariants (all actions require merchant approval, zero invented revenue without evidence)", () => {
    const emptySnapshot: MerchantSupplySnapshot = {
      merchantId: "m_empty",
      merchantName: "Empty Merchant",
      products: [],
      offers: [],
      totalProducts: 0,
      totalOffers: 0,
      activeConfirmedOffers: 0,
      unconfirmedOffers: 0,
      offersWithStructuredCommitments: 0,
    };

    const emptyReport = opportunityEngine.analyzeOpportunities(
      emptySnapshot,
      [],
      [],
      [],
      [],
    );

    expect(emptyReport.opportunities.length).toBe(0);
    expect(emptyReport.totalAddressableMonthlyRevenuePaise).toBe(0);

    // Also test with historical intents that have missing budget data
    const noBudgetIntents = [
      normalizeBuyerIntent({
        category: "unpriced_category",
        billing: { cadence: "monthly", isRecurring: true },
        mustHave: ["generic_skill"],
      }),
    ];

    const unpricedCluster = [
      {
        id: "unpriced_cluster",
        category: "unpriced_category",
        mustHaveEntitlements: ["generic_skill"],
        demandFrequency: 1,
        unmetReason: "Unmet demand with unstated budget.",
        merchantOpportunity: "Create an offer.",
      },
    ];

    const unpricedReport = opportunityEngine.analyzeOpportunities(
      emptySnapshot,
      [],
      [],
      noBudgetIntents,
      unpricedCluster,
    );

    const opp = unpricedReport.opportunities[0];
    expect(opp).toBeDefined();
    expect(opp.estimatedImpact?.isEstimated).toBe(false);
    expect(opp.estimatedImpact?.monthlyRevenuePotentialPaise).toBe(0);
    expect(opp.recommendedAction.requiresMerchantApproval).toBe(true);
  });

  // 11. End-to-End Service Integration
  it("Case 11: verifies MerchantIntelligenceService.getRevenueOpportunities() facade integration", async () => {
    const report = await intelligenceService.getRevenueOpportunities();

    expect(report.merchantId).toBe("m_interviewforge");
    expect(typeof report.totalAddressableMonthlyRevenuePaise).toBe("number");
    expect(Array.isArray(report.opportunities)).toBe(true);

    for (const opp of report.opportunities) {
      expect(opp.evidence.length).toBeGreaterThan(0);
      expect(opp.recommendedAction.requiresMerchantApproval).toBe(true);
    }
  });
});
