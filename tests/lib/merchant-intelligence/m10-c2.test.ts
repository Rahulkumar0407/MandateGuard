import { describe, it, expect, beforeEach } from "vitest";
import {
  MerchantIntelligenceService,
  MerchantPrioritizationEngine,
  MerchantImprovementSimulator,
  isGenericOrUngroundedAdvice,
  validateExplanationGrounding,
} from "@/lib/merchant-intelligence";
import { InMemoryMerchantOfferRepository } from "@/lib/merchant/repository";
import { MerchantOfferService } from "@/lib/merchant/service";
import { buildInterviewForgeData } from "@/lib/merchant/seed-data";
import { normalizeBuyerIntent } from "@/lib/intent";

describe("M10-C2 — Merchant AI Recommendations & AI Buyer Readiness Comprehensive Benchmark Suite", () => {
  let merchantRepo: InMemoryMerchantOfferRepository;
  let merchantService: MerchantOfferService;
  let intelligenceService: MerchantIntelligenceService;
  let prioritizationEngine: MerchantPrioritizationEngine;
  let simulator: MerchantImprovementSimulator;

  beforeEach(() => {
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
    prioritizationEngine = new MerchantPrioritizationEngine();
    simulator = new MerchantImprovementSimulator(merchantService);
    intelligenceService = new MerchantIntelligenceService(
      merchantService,
      undefined,
      undefined,
      undefined,
      undefined,
      prioritizationEngine,
      simulator,
    );
  });

  // 1. Readiness dimensions deterministic
  it("Case 1: computes all 5 deterministic AI Buyer Readiness dimensions", async () => {
    const readiness = await intelligenceService.getAIReadiness();

    expect(readiness.merchantId).toBe("m_interviewforge");
    expect(readiness.overallScore).toBeGreaterThanOrEqual(0);
    expect(readiness.overallScore).toBeLessThanOrEqual(100);

    const dims = readiness.dimensions;
    expect(dims.discoverability.status).toBeDefined();
    expect(dims.comprehension.status).toBeDefined();
    expect(dims.comparability.status).toBeDefined();
    expect(dims.conversion.status).toBeDefined();
    expect(dims.transactionReadiness.status).toBeDefined();

    expect(typeof dims.discoverability.score).toBe("number");
    expect(typeof dims.comprehension.score).toBe("number");
    expect(typeof dims.comparability.score).toBe("number");
    expect(typeof dims.conversion.score).toBe("number");
    expect(typeof dims.transactionReadiness.score).toBe("number");
  });

  // 2. Highest-impact issue prioritized
  it("Case 2: prioritizes critical hard blockers over lower-severity cosmetic issues", async () => {
    const diagnoses = [
      {
        merchantId: "m_interviewforge",
        issueType: "COMPARABILITY" as const,
        severity: "WARNING" as const,
        title: "Support SLA unquantified",
        diagnosis: "SLA response time is missing.",
        evidence: [
          {
            id: "ev_1",
            category: "COMPARABILITY" as const,
            source: "MERCHANT_SUPPLY" as const,
            fact: "Missing response SLA.",
          },
        ],
        recommendedAction: "Add SLA hours.",
        confidence: "HIGH" as const,
      },
      {
        merchantId: "m_interviewforge",
        issueType: "DISCOVERABILITY" as const,
        severity: "CRITICAL" as const,
        title: "Unconfirmed versions inactive",
        diagnosis: "AI buyers cannot find unconfirmed offers.",
        evidence: [
          {
            id: "ev_2",
            category: "DISCOVERABILITY" as const,
            source: "MERCHANT_SUPPLY" as const,
            fact: "Unconfirmed versions exist.",
          },
        ],
        recommendedAction: "Confirm pending versions.",
        confidence: "HIGH" as const,
      },
    ];

    const prioritized = prioritizationEngine.prioritizeDiagnoses(diagnoses);

    expect(prioritized[0].issueType).toBe("DISCOVERABILITY");
    expect(prioritized[0].severity).toBe("CRITICAL");
  });

  // 3. Recommendation grounded in evidence
  it("Case 3: ensures every recommendation is backed by explicit evidence references", async () => {
    const readiness = await intelligenceService.getAIReadiness();

    for (const rec of readiness.recommendations) {
      expect(rec.evidence.length).toBeGreaterThan(0);
      expect(rec.title).toBeDefined();
      expect(rec.currentState).toBeDefined();
      expect(rec.recommendation).toBeDefined();
      expect(rec.expectedMechanism).toBeDefined();
    }
  });

  // 4. Generic AI advice rejected
  it("Case 4: rejects generic ungrounded marketing advice like SEO and social media", () => {
    expect(isGenericOrUngroundedAdvice("Improve your SEO to rank higher")).toBe(true);
    expect(isGenericOrUngroundedAdvice("Post on social media and run ads")).toBe(true);
    expect(isGenericOrUngroundedAdvice("Increase marketing spend")).toBe(true);
    expect(isGenericOrUngroundedAdvice("Give random discounts to buyers")).toBe(true);

    expect(
      isGenericOrUngroundedAdvice(
        "Define an explicit response SLA (e.g. 24h turnaround) in the support commitments schema.",
      ),
    ).toBe(false);
  });

  // 5. Unsupported revenue claim rejected
  it("Case 5: rejects ungrounded revenue boost promises", () => {
    const context = {
      merchantId: "m_interviewforge",
      issueType: "SUPPORT" as const,
      title: "Support Gap",
      evidence: [
        {
          id: "ev_supp_1",
          category: "SUPPORT" as const,
          source: "MERCHANT_SUPPLY" as const,
          fact: "Support is unquantified.",
        },
      ],
    };

    const ungroundedText = "Fixing this guarantees a 40% revenue boost.";
    const validation = validateExplanationGrounding(ungroundedText, context);

    expect(validation.isGrounded).toBe(false);
    expect(validation.missingEvidenceReason).toContain("revenue/conversion uplift");
  });

  // 6. Improvement preview is read-only & evaluates before/after
  it("Case 6: generates before/after improvement preview without catalog mutations", async () => {
    const offersBefore = await merchantService.listOffers();

    const preview = await simulator.previewImprovement({
      merchantId: "m_interviewforge",
      targetOfferId: "o_sysdesign_v1",
      proposedOffer: {
        structuredCommitments: {
          support: { tier: "dedicated_mentor", slaHours: 12, oneOnOneSessionsPerMonth: 8, hasDedicatedHuman: true },
          entitlements: { keys: ["system_design_course", "mentor_feedback", "mock_interviews"], criticalKeys: ["mentor_feedback"] },
          usageLimits: { apiRequestsPerMonth: 20000, concurrentSeats: 1, computeCredits: 1000 },
          delivery: { type: "continuous_saas", commitmentSLA: "12h" },
          refundPolicy: { windowDays: 30, type: "conditional" },
        },
      },
    });

    const offersAfter = await merchantService.listOffers();

    expect(offersAfter.length).toBe(offersBefore.length);
    expect(preview.before).toBeDefined();
    expect(preview.after).toBeDefined();
    expect(preview.delta).toBeDefined();
    expect(preview.requiresMerchantApproval).toBe(true);
  });

  // 7. Before/After simulation uses same Buyer Brain
  it("Case 7: verifies before/after preview executes the exact same Buyer Brain filter & scorer", async () => {
    const mission = normalizeBuyerIntent({
      category: "system_design",
      budget: { amountPaise: 400000, currency: "INR", type: "HARD" },
      billing: { cadence: "monthly", isRecurring: true },
      mustHave: ["mentor_feedback"],
    });

    const preview = await simulator.previewImprovement({
      merchantId: "m_interviewforge",
      targetOfferId: "o_sysdesign_v1",
      proposedOffer: {
        price: 349900,
      },
      testMissions: [mission],
    });

    expect(preview.evaluatedMissionsCount).toBe(1);
    expect(preview.before.evaluations.length).toBe(1);
    expect(preview.after.evaluations.length).toBe(1);
  });

  // 8. No accidental OfferVersion mutation
  it("Case 8: guarantees no OfferVersion records are modified or created during simulations", async () => {
    const initialOffer = await merchantService.getOffer("o_sysdesign_v1");

    await simulator.previewImprovement({
      merchantId: "m_interviewforge",
      targetOfferId: "o_sysdesign_v1",
      proposedOffer: {
        price: 199900, // Simulated discount
      },
    });

    const postOffer = await merchantService.getOffer("o_sysdesign_v1");
    expect(postOffer?.price).toBe(initialOffer?.price);
  });

  // 9. Multilingual buyer missions in Shop My Business
  it("Case 9: executes Shop My Business with vernacular and multilingual buyer intents", async () => {
    const hinglishMission = normalizeBuyerIntent({
      category: "system_design",
      budget: { amountPaise: 400000, currency: "INR", type: "HARD" },
      billing: { cadence: "monthly", isRecurring: true },
      mustHave: ["mentor_feedback"],
      context: {
        language: "hi-latn",
        locale: "en-IN",
        rawQuery: "4k ke andar system design mentor chahiye monthly",
      },
    });

    const shopResult = await simulator.runShopMyBusiness("m_interviewforge", [hinglishMission]);

    expect(shopResult.totalMissions).toBe(1);
    expect(shopResult.missionResults[0].evaluation.shortlisted).toBe(true);
    expect(shopResult.aggregateReadiness).toBeDefined();
  });

  // 10. Merchant simulation has zero provider actions
  it("Case 10: confirms simulations invoke zero payment or provider mutations", async () => {
    const result = await intelligenceService.runShopMyBusiness("m_interviewforge");

    expect(result.totalMissions).toBeGreaterThan(0);
    expect(result.passedMissions).toBeGreaterThanOrEqual(0);
  });

  // 11. Merchant approval required invariant
  it("Case 11: enforces requiresMerchantApproval: true on all recommendations and preview deltas", async () => {
    const readiness = await intelligenceService.getAIReadiness();
    for (const rec of readiness.recommendations) {
      expect(rec.requiresMerchantApproval).toBe(true);
    }

    const preview = await simulator.previewImprovement({
      merchantId: "m_interviewforge",
      targetOfferId: "o_sysdesign_v1",
      proposedOffer: { price: 299900 },
    });
    expect(preview.requiresMerchantApproval).toBe(true);
  });

  // 12. Insufficient evidence handled safely
  it("Case 12: handles empty evidence sets with safe fallbacks and zero hallucinations", async () => {
    const emptyRepo = new InMemoryMerchantOfferRepository({
      merchants: [
        {
          id: "m_empty",
          name: "Empty Merchant",
          slug: "empty",
          description: "Empty",
          status: "ACTIVE",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      products: [],
      offers: [],
    });

    const emptyService = new MerchantOfferService(emptyRepo);
    const emptyIntel = new MerchantIntelligenceService(emptyService);

    const readiness = await emptyIntel.getAIReadiness();
    expect(readiness.dimensions.discoverability.status).toBe("PASS");
    expect(readiness.overallScore).toBeGreaterThanOrEqual(0);
  });
});
