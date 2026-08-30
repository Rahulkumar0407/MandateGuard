import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  MerchantGrowthOpportunityService,
} from "@/lib/merchant-intelligence/growth-opportunity-service";
import {
  setMerchantOfferRepository,
  InMemoryMerchantOfferRepository,
  MerchantOfferService,
} from "@/lib/merchant/service";
import { normalizeStructuredCommitments } from "@/lib/merchant/structured-commitments";
import { getGoldBuyabilityCohort } from "@/lib/merchant-intelligence/buyability-benchmark-dataset";
import { GET as getOpportunityRoute } from "@/app/api/merchant/growth-opportunity/route";
import { POST as approveOpportunityRoute } from "@/app/api/merchant/growth-opportunity/approve/route";
import { ExternalAgentClient } from "@/lib/contract/external-agent-client";

const TS = new Date("2026-01-01T00:00:00.000Z");

describe("M10-E7 — Agentic Revenue Opportunity Engine", () => {
  let repo: InMemoryMerchantOfferRepository;
  let merchantService: MerchantOfferService;
  let opportunityService: MerchantGrowthOpportunityService;

  beforeEach(() => {
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
          id: "offer_sys_design_base",
          productId: "prod_sys_design",
          version: 1,
          name: "System Design Core",
          description: "Production system architecture curriculum.",
          price: 299900,
          currency: "INR",
          billingInterval: "monthly",
          duration: 1,
          entitlementKeys: ["system_design_curriculum"],
          refundWindowDays: 30,
          supportTerms: "Email support within 48 hours.",
          semanticTerms: "system design, architecture",
          structuredCommitments: commitmentsV1,
          isConfirmedByMerchant: true,
          versionHash: "hash_sys_design_base_v1_0000000000000000000000000000000000000000",
          active: true,
          createdAt: TS,
          updatedAt: TS,
        },
      ],
    });

    merchantService = new MerchantOfferService(repo);
    setMerchantOfferRepository(repo);
    opportunityService = new MerchantGrowthOpportunityService(merchantService);
  });

  afterEach(() => {
    setMerchantOfferRepository(null);
  });

  // ==========================================================================
  // 1. Evidence-Backed Opportunity Detection
  // ==========================================================================
  describe("1. Evidence-Backed Opportunity Detection", () => {
    it("detects top growth opportunity grounded in buyer missions from Gold Benchmark", async () => {
      const report = await opportunityService.getTopGrowthOpportunity();

      expect(report.status).toBe("OPPORTUNITY_FOUND");
      expect(report.topOpportunity).toBeDefined();
      expect(report.topOpportunity?.type).toBe("PACKAGING_GAP");
      expect(report.topOpportunity?.affectedMissionsCount).toBeGreaterThan(0);
      expect(report.topOpportunity?.evidence.buyerDemandQuery).toContain("Human mentor");
      expect(report.topOpportunity?.evidence.observedFacts.length).toBeGreaterThan(0);
    });

    it("returns INSUFFICIENT_EVIDENCE when merchant catalog has no products or offers", async () => {
      const emptyRepo = new InMemoryMerchantOfferRepository({
        merchants: [],
        products: [],
        offers: [],
      });
      const emptyService = new MerchantOfferService(emptyRepo);
      const emptyOppService = new MerchantGrowthOpportunityService(emptyService);

      const report = await emptyOppService.getTopGrowthOpportunity();
      expect(report.status).toBe("INSUFFICIENT_EVIDENCE");
      expect(report.topOpportunity).toBeNull();
    });
  });

  // ==========================================================================
  // 2. Closed-Loop Simulation on Gold Benchmark
  // ==========================================================================
  describe("2. Closed-Loop Benchmark Simulation & Revenue Claim Discipline", () => {
    it("runs closed-loop simulation on buyability_gold_cohort_v1 and verifies dataset hash", async () => {
      const cohort = getGoldBuyabilityCohort();
      const report = await opportunityService.getTopGrowthOpportunity();
      const opp = report.topOpportunity!;

      expect(opp.simulation.benchmarkId).toBe(cohort.benchmarkId);
      expect(opp.simulation.benchmarkVersion).toBe(cohort.benchmarkVersion);
      expect(opp.simulation.datasetHash).toBe(cohort.datasetHash);
      expect(opp.simulation.missionsTested).toBe(cohort.caseCount);

      // Quantified mission recovery without speculative revenue claims
      expect(opp.simulation.missionsRecovered).toBeGreaterThan(0);
      expect(opp.simulation.missionsAfter).toBeGreaterThan(opp.simulation.missionsBefore);
      expect(opp.simulation.claimNotice).toBe(
        "Simulation on gold benchmark cohort. Not a financial revenue forecast.",
      );
    });
  });

  // ==========================================================================
  // 3. Merchant Approval & Immutable OfferVersion Publishing
  // ==========================================================================
  describe("3. Merchant Approval & Offer Publishing", () => {
    it("publishes proposed package as an authoritative new OfferVersion upon explicit merchant approval", async () => {
      const report = await opportunityService.getTopGrowthOpportunity();
      const opp = report.topOpportunity!;

      const newOffer = await opportunityService.approveOpportunityAndPublish({
        productId: opp.proposedAction.targetProductId,
        customPricePaise: 449900,
        proposedChanges: {
          name: opp.proposedAction.proposedOfferName,
          description: opp.proposedAction.proposedDescription,
          supportTerms: opp.proposedAction.proposedSupportTerms,
          structuredCommitments: opp.proposedAction.proposedStructuredCommitments,
        },
      });

      expect(newOffer.version).toBe(2);
      expect(newOffer.name).toBe("System Design Mastery Plus");
      expect(newOffer.price).toBe(449900);
      expect(newOffer.structuredCommitments?.support.hasDedicatedHuman).toBe(true);
      expect(newOffer.versionHash).toBeDefined();

      // Verify v1 historical record remains immutable
      const allOffers = await repo.listAllOffersForProduct("prod_sys_design");
      const v1 = allOffers.find((o) => o.version === 1);
      expect(v1).toBeDefined();
      expect(v1?.price).toBe(299900);
      expect(v1?.structuredCommitments?.support.hasDedicatedHuman).toBe(false);
    });
  });

  // ==========================================================================
  // 4. External Agent Loop Closure (GROW -> CONTRACT -> EXTERNAL BUYER -> BUY)
  // ==========================================================================
  describe("4. External Agent Loop Closure", () => {
    it("enables external reference agent to discover and select the newly published opportunity offer", async () => {
      const report = await opportunityService.getTopGrowthOpportunity();
      const opp = report.topOpportunity!;

      // 1. External agent before: evaluates current v1 contract
      const externalClient = new ExternalAgentClient();
      const beforeContract = opp.contractPreview.beforeContract!;
      const beforeTrace = await externalClient.evaluateSemantic(
        [beforeContract],
        "I need a monthly human mentor for system design under ₹5,000",
      );
      // Fails because v1 lacks dedicated human mentor
      expect(beforeTrace.selectionDecision).toBe("REJECT_TERMS");

      // 2. Merchant approves and publishes new offer
      await opportunityService.approveOpportunityAndPublish({
        productId: opp.proposedAction.targetProductId,
        customPricePaise: 449900,
        proposedChanges: {
          name: opp.proposedAction.proposedOfferName,
          structuredCommitments: opp.proposedAction.proposedStructuredCommitments,
        },
      });

      // 3. External agent after: evaluates newly published contract
      const proposedContract = opp.contractPreview.proposedContract;
      const afterTrace = await externalClient.evaluateSemantic(
        [proposedContract],
        "I need a monthly human mentor for system design under ₹5,000",
      );

      // Now successfully selects the newly published offer!
      expect(afterTrace.selectionDecision).toBe("SELECT_OFFER");
      expect(afterTrace.handoffPayload).toBeDefined();
      expect(afterTrace.handoffPayload?.offerId).toBe(proposedContract.offer.id);
    });
  });

  // ==========================================================================
  // 5. API Routes: GET and POST /approve
  // ==========================================================================
  describe("5. Growth Opportunity API Routes", () => {
    it("GET /api/merchant/growth-opportunity returns 200 with opportunity and simulation", async () => {
      const res = await getOpportunityRoute();
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.status).toBe("OPPORTUNITY_FOUND");
      expect(body.topOpportunity.type).toBe("PACKAGING_GAP");
      expect(body.totalRecoverableMissions).toBeGreaterThan(0);
    });

    it("POST /api/merchant/growth-opportunity/approve creates new OfferVersion", async () => {
      const req = new Request("http://localhost/api/merchant/growth-opportunity/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: "prod_sys_design",
          customPricePaise: 449900,
        }),
      });

      const res = await approveOpportunityRoute(req);
      expect(res.status).toBe(201);

      const body = await res.json();
      expect(body.status).toBe("OPPORTUNITY_APPROVED_AND_PUBLISHED");
      expect(body.newOffer.version).toBe(2);
    });

    it("POST /api/merchant/growth-opportunity/approve returns 400 when productId is missing", async () => {
      const req = new Request("http://localhost/api/merchant/growth-opportunity/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const res = await approveOpportunityRoute(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("productId is required");
    });
  });
});
