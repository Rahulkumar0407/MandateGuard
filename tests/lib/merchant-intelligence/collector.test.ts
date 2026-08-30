import { describe, it, expect, beforeEach } from "vitest";
import { MerchantEvidenceCollector } from "@/lib/merchant-intelligence/collector";
import { InMemoryMerchantOfferRepository } from "@/lib/merchant/repository";
import { MerchantOfferService } from "@/lib/merchant/service";
import { buildInterviewForgeData } from "@/lib/merchant/seed-data";
import { normalizeBuyerIntent } from "@/lib/intent";
import type { BuyerDecisionTrace } from "@/lib/merchant-intelligence/types";


describe("M10-C1 — MerchantEvidenceCollector", () => {
  let merchantRepo: InMemoryMerchantOfferRepository;
  let merchantService: MerchantOfferService;
  let collector: MerchantEvidenceCollector;

  beforeEach(() => {
    const data = buildInterviewForgeData();
    merchantRepo = new InMemoryMerchantOfferRepository(data);
    merchantService = new MerchantOfferService(merchantRepo);
    collector = new MerchantEvidenceCollector(merchantService);
  });

  describe("Supply Evidence Collection", () => {
    it("captures supply snapshot with counts and structured commitment coverage", async () => {
      const snapshot = await collector.captureSupplySnapshot();

      expect(snapshot.merchantId).toBe("m_interviewforge");
      expect(snapshot.merchantName).toBe("InterviewForge");
      expect(snapshot.totalProducts).toBe(5);
      expect(snapshot.totalOffers).toBeGreaterThan(0);
      expect(snapshot.offers).toBeDefined();
    });

    it("identifies unconfirmed and unstructured offers as factual evidence items", async () => {
      const snapshot = await collector.captureSupplySnapshot();
      const evidence = collector.collectSupplyEvidence(snapshot);

      expect(evidence.length).toBeGreaterThan(0);
      const categories = evidence.map((e) => e.category);
      expect(categories).toContain("DISCOVERABILITY");
    });
  });

  describe("Decision Result Evidence Collection", () => {
    it("diagnoses lost buyers and aggregates demand gaps from decision traces", async () => {
      const snapshot = await collector.captureSupplySnapshot();

      const intent1 = normalizeBuyerIntent({
        category: "data_structures",
        budget: { amountPaise: 200000, currency: "INR", type: "HARD" },
        billing: { cadence: "monthly", isRecurring: true },
        mustHave: ["live_mentor"],
      });

      const intent2 = normalizeBuyerIntent({
        category: "system_design",
        budget: { amountPaise: 400000, currency: "INR", type: "HARD" },
        billing: { cadence: "monthly", isRecurring: true },
        mustHave: ["human_mentor"],
      });

      const traces: BuyerDecisionTrace[] = [
        {
          id: "tr_1",
          buyerQuery: "DSA course under 2k with live mentor",
          intent: intent1,
          recommendation: {
            eligible: false,
            candidateCount: 1,
            refusalReason: "Price ₹2,999 exceeds hard budget ceiling of ₹2,000.",
          },
          rejectedOffers: [
            {
              offerId: "o_dsa_v1",
              offerName: "DSA Interview Track",
              rejectionReason: "Price ₹2,999 exceeds budget ceiling of ₹2,000.",
            },
          ],
          evaluatedAt: new Date().toISOString(),
        },
        {
          id: "tr_2",
          buyerQuery: "System design with human mentor",
          intent: intent2,
          recommendation: {
            eligible: true,
            candidateCount: 1,
            recommendedOfferId: snapshot.offers[0].id,
          },
          selectedOfferId: snapshot.offers[0].id,
          rejectedOffers: [],
          evaluatedAt: new Date().toISOString(),
        },
      ];



      const result = collector.collectDecisionEvidence(traces);

      expect(result.evidenceItems.length).toBeGreaterThan(0);

      expect(result.lostBuyerAnalyses.length).toBe(1);
      expect(result.lostBuyerAnalyses[0].failureStage).toBe("BUDGET_CEILING_EXCEEDED");
      expect(result.lostBuyerAnalyses[0].merchantRemedy).toContain("₹2,000");

      expect(result.demandGaps.length).toBe(1);
      expect(result.demandGaps[0].demandedCategoryOrFeature).toBe("data_structures");
    });
  });
});
