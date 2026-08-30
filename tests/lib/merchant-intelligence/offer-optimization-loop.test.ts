import { describe, it, expect, beforeEach } from "vitest";
import {
  MerchantOfferOptimizationService,
  StaleOfferVersionError,
} from "@/lib/merchant-intelligence/optimization-service";
import {
  InMemoryMerchantOfferRepository,
  MerchantOfferService,
} from "@/lib/merchant/service";
import { normalizeStructuredCommitments } from "@/lib/merchant/structured-commitments";
import { getGoldBuyabilityCohort } from "@/lib/merchant-intelligence/buyability-benchmark-dataset";

const TS = new Date("2026-01-01T00:00:00.000Z");

describe("M10-E5 — AI Offer Optimization Loop", () => {
  let repo: InMemoryMerchantOfferRepository;
  let service: MerchantOfferService;
  let optimizationService: MerchantOfferOptimizationService;

  beforeEach(async () => {
    const commitmentsV1 = normalizeStructuredCommitments({
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
        commitmentSLA: "48h Turnaround",
      },
      refundPolicy: {
        windowDays: 30,
        type: "conditional",
      },
    });

    repo = new InMemoryMerchantOfferRepository({
      merchants: [
        {
          id: "merch_interviewforge",
          name: "InterviewForge",
          slug: "interviewforge",
          description: "Top Tech Prep",
          status: "ACTIVE",
          createdAt: TS,
          updatedAt: TS,
        },
      ],
      products: [
        {
          id: "prod_sys_design",
          merchantId: "merch_interviewforge",
          name: "System Design Mastery",
          slug: "system-design-mastery",
          category: "system_design",
          description: "Production system design prep",
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
          description: "Production system architecture curriculum.",
          price: 349900,
          currency: "INR",
          billingInterval: "monthly",
          duration: 1,
          entitlementKeys: ["system_design_curriculum"],
          refundWindowDays: 30,
          supportTerms: "Premium expert guidance via email within 48h.",
          semanticTerms: "system design, architecture",
          structuredCommitments: commitmentsV1,
          isConfirmedByMerchant: true,
          versionHash: "hash_sys_design_pro_v1_0000000000000000000000000000000000000000",
          active: true,
          createdAt: TS,
          updatedAt: TS,
        },
      ],
    });

    service = new MerchantOfferService(repo);
    optimizationService = new MerchantOfferOptimizationService(service);
  });

  // ==========================================================================
  // 1. Grounded Diagnosis
  // ==========================================================================
  describe("1. Grounded Diagnosis", () => {
    it("generates diagnosis linking buyer needs to current offer terms and evidence", async () => {
      const plan = await optimizationService.getOfferOptimizationPlan("offer_sys_design_pro");

      expect(plan.offer.id).toBe("offer_sys_design_pro");
      expect(plan.offer.version).toBe(1);
      expect(plan.diagnosis.buyerNeeds).toContain("Human mentor (1:1 guidance)");
      expect(plan.diagnosis.buyerNeeds).toContain("Under ₹4,000 monthly budget");

      // Verify AI verification checks
      const humanCheck = plan.diagnosis.verificationChecks.find(
        (c) => c.item === "Dedicated Human Support",
      );
      expect(humanCheck).toBeDefined();
      expect(humanCheck?.status).toBe("AMBIGUOUS");

      const budgetCheck = plan.diagnosis.verificationChecks.find(
        (c) => c.item === "Budget Ceiling",
      );
      expect(budgetCheck).toBeDefined();
      expect(budgetCheck?.status).toBe("VERIFIED");

      expect(plan.diagnosis.whyExplanation).toContain("dedicated human mentorship");
    });
  });

  // ==========================================================================
  // 2. Structured Recommendation with Changed vs Unchanged Terms
  // ==========================================================================
  describe("2. Structured Recommendation & Change Breakdown", () => {
    it("clearly separates proposed improvements from unchanged commercial baselines", async () => {
      const plan = await optimizationService.getOfferOptimizationPlan("offer_sys_design_pro");

      // Changed terms
      expect(plan.recommendation.currentTerms.hasDedicatedHuman).toBe(false);
      expect(plan.recommendation.proposedTerms.hasDedicatedHuman).toBe(true);
      expect(plan.recommendation.proposedTerms.supportTier).toBe("dedicated_mentor");
      expect(plan.recommendation.proposedTerms.sessionsPerMonth).toBe(4);
      expect(plan.recommendation.proposedTerms.slaHours).toBe(24);

      // Unchanged terms
      expect(plan.recommendation.proposedTerms.pricePaise).toBe(plan.recommendation.currentTerms.pricePaise);
      expect(plan.recommendation.proposedTerms.billingInterval).toBe(plan.recommendation.currentTerms.billingInterval);
      expect(plan.recommendation.proposedTerms.refundDays).toBe(plan.recommendation.currentTerms.refundDays);

      expect(plan.recommendation.changedFields.some((f) => f.includes("Dedicated Human"))).toBe(true);
      expect(plan.recommendation.unchangedFields.some((f) => f.includes("Price: ₹3,499/mo (Unchanged)"))).toBe(true);
    });
  });

  // ==========================================================================
  // 3. Closed-Loop Simulation on Gold Benchmark
  // ==========================================================================
  describe("3. Closed-Loop Simulation & Revenue Claim Discipline", () => {
    it("runs simulation against the verified gold benchmark cohort and hash", async () => {
      const cohort = getGoldBuyabilityCohort();
      const plan = await optimizationService.getOfferOptimizationPlan("offer_sys_design_pro");

      expect(plan.simulation.benchmarkId).toBe(cohort.benchmarkId);
      expect(plan.simulation.benchmarkVersion).toBe(cohort.benchmarkVersion);
      expect(plan.simulation.datasetHash).toBe(cohort.datasetHash);
      expect(plan.simulation.missionsTested).toBe(cohort.caseCount);

      // Strict revenue claim discipline
      expect(plan.simulation.missionsRecovered).toBeGreaterThan(0);
      expect(plan.simulation.claimNotice).toBe(
        "Simulation on gold benchmark cohort. Not a financial revenue forecast.",
      );
    });
  });

  // ==========================================================================
  // 4. Merchant Approval & New OfferVersion Publishing
  // ==========================================================================
  describe("4. Merchant Approval & Immutability", () => {
    it("creates a new OfferVersion (v2) with new hash on explicit merchant approval", async () => {
      const plan = await optimizationService.getOfferOptimizationPlan("offer_sys_design_pro");

      const newOffer = await optimizationService.approveAndPublishOfferVersion({
        offerId: plan.offer.id,
        expectedVersion: plan.offer.version,
        expectedVersionHash: plan.offer.versionHash,
        proposedChanges: {
          name: "System Design Pro v2",
          structuredCommitments: plan.recommendation.proposedStructuredCommitments,
        },
      });

      expect(newOffer.version).toBe(2);
      expect(newOffer.name).toBe("System Design Pro v2");
      expect(newOffer.isConfirmedByMerchant).toBe(true);
      expect(newOffer.versionHash).toBeDefined();
      expect(newOffer.versionHash).not.toBe(plan.offer.versionHash);

      // Assert historical version v1 is still immutable and intact
      const v1Offers = await repo.listAllOffersForProduct("prod_sys_design");
      const v1 = v1Offers.find((o) => o.version === 1);
      expect(v1).toBeDefined();
      expect(v1?.version).toBe(1);
      expect(v1?.structuredCommitments?.support.hasDedicatedHuman).toBe(false);
    });

    it("rejects approval with StaleOfferVersionError if offer changed while reviewing", async () => {
      const plan = await optimizationService.getOfferOptimizationPlan("offer_sys_design_pro");

      // Simulate a concurrent modification that bumped the version to 2
      await service.createOfferVersion("prod_sys_design", {
        name: "Concurrent Version",
        description: "Concurrent update",
        price: 349900,
        currency: "INR",
        billingInterval: "monthly",
        duration: 1,
        entitlementKeys: ["system_design_curriculum"],
        refundWindowDays: 30,
        supportTerms: "Concurrent support",
        semanticTerms: "system design",
        confirmImmediately: true,
      });

      // Attempting to approve based on old expectedVersion 1 must fail
      await expect(
        optimizationService.approveAndPublishOfferVersion({
          offerId: plan.offer.id,
          expectedVersion: 1,
          expectedVersionHash: plan.offer.versionHash,
        }),
      ).rejects.toThrow(StaleOfferVersionError);
    });
  });

  // ==========================================================================
  // 5. Version History Retrieval
  // ==========================================================================
  describe("5. Version History", () => {
    it("retrieves the full version history timeline", async () => {
      // Create v2
      await service.createOfferVersion("prod_sys_design", {
        name: "System Design Pro v2",
        description: "v2 description",
        price: 349900,
        currency: "INR",
        billingInterval: "monthly",
        duration: 1,
        entitlementKeys: ["system_design_curriculum", "human_mentor"],
        refundWindowDays: 30,
        supportTerms: "v2 support",
        semanticTerms: "system design",
        confirmImmediately: true,
      });

      const history = await optimizationService.getOfferVersionHistory("prod_sys_design");

      expect(history).toHaveLength(2);
      expect(history[0].version).toBe(2);
      expect(history[1].version).toBe(1);
    });
  });
});
