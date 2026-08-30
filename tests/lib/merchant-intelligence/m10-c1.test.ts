import { describe, it, expect, beforeEach } from "vitest";
import {
  MerchantIntelligenceService,
  MerchantEvidenceCollector,
  MerchantDiagnosticEngine,
  MerchantBuyerSimulationService,
  DeterministicMerchantReasoningProvider,
  validateExplanationGrounding,
} from "@/lib/merchant-intelligence";
import { InMemoryMerchantOfferRepository } from "@/lib/merchant/repository";
import { MerchantOfferService } from "@/lib/merchant/service";
import { buildInterviewForgeData } from "@/lib/merchant/seed-data";
import { normalizeBuyerIntent } from "@/lib/intent";
import type { OfferDetailDTO } from "@/lib/merchant/types";

describe("M10-C1 — Merchant AI Evidence & Diagnosis Comprehensive Benchmark Suite", () => {
  let merchantRepo: InMemoryMerchantOfferRepository;
  let merchantService: MerchantOfferService;
  let intelligenceService: MerchantIntelligenceService;
  let simulationService: MerchantBuyerSimulationService;
  let reasoningProvider: DeterministicMerchantReasoningProvider;

  beforeEach(() => {
    const rawData = buildInterviewForgeData();
    // Add structured commitments to baseline offer
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
    simulationService = new MerchantBuyerSimulationService(merchantService);
    reasoningProvider = new DeterministicMerchantReasoningProvider();
    intelligenceService = new MerchantIntelligenceService(
      merchantService,
      undefined,
      undefined,
      simulationService,
      reasoningProvider,
    );
  });

  // 1. Buyer mission discovers merchant
  it("Case 1: buyer mission discovers merchant offer successfully", async () => {
    const intent = normalizeBuyerIntent({
      category: "system_design",
      budget: { amountPaise: 400000, currency: "INR", type: "HARD" },
      billing: { cadence: "monthly", isRecurring: true },
      mustHave: ["mentor_feedback"],
    });

    const evaluation = await simulationService.simulateMerchantForBuyer(
      "m_interviewforge",
      intent,
    );

    expect(evaluation.discovered).toBe(true);
    expect(evaluation.understandable).toBe(true);
    expect(evaluation.shortlisted).toBe(true);
    expect(evaluation.recommended).toBe(true);
    expect(evaluation.evidence.length).toBeGreaterThan(0);
  });

  // 2. Buyer mission fails due to missing must-have
  it("Case 2: buyer mission fails due to missing must-have entitlement", async () => {
    const intent = normalizeBuyerIntent({
      category: "system_design",
      budget: { amountPaise: 400000, currency: "INR", type: "HARD" },
      billing: { cadence: "monthly", isRecurring: true },
      mustHave: ["non_existent_specialty_certificate"],
    });

    const evaluation = await simulationService.simulateMerchantForBuyer(
      "m_interviewforge",
      intent,
    );

    expect(evaluation.discovered).toBe(true);
    expect(evaluation.shortlisted).toBe(false);
    expect(evaluation.failedAt).toBe("SHORTLIST");
    expect(evaluation.diagnosis).toContain("non_existent_specialty_certificate");
  });

  // 3. Buyer mission fails due to unclear / missing support
  it("Case 3: buyer mission fails due to missing mentor support requirements", async () => {
    const intent = normalizeBuyerIntent({
      category: "system_design",
      budget: { amountPaise: 400000, currency: "INR", type: "HARD" },
      billing: { cadence: "monthly", isRecurring: true },
      mustHave: [],
      supportPreference: {
        tier: "dedicated_mentor",
        hasDedicatedHuman: true,
        minSessionsPerMonth: 10, // Demands 10, offer has 4
      },
    });

    const evaluation = await simulationService.simulateMerchantForBuyer(
      "m_interviewforge",
      intent,
    );

    expect(evaluation.shortlisted).toBe(false);
    expect(evaluation.failedAt).toBe("SHORTLIST");
    expect(evaluation.diagnosis).toContain("sessions");
  });

  // 4. Comparability issue detection
  it("Case 4: detects comparability gap when SLA hours or refund days are unquantified", async () => {
    const data = buildInterviewForgeData();
    const offer = data.offers[0];
    offer.active = true;
    offer.structuredCommitments = {
      support: {
        tier: "community",
        slaHours: 0,
        oneOnOneSessionsPerMonth: 0,
        hasDedicatedHuman: false,
      },
      entitlements: { keys: ["course"], criticalKeys: [] },
      usageLimits: {
        apiRequestsPerMonth: 1000,
        concurrentSeats: 1,
        computeCredits: 100,
      },
      delivery: { type: "continuous_saas", commitmentSLA: null },
      refundPolicy: { windowDays: 0, type: "non_refundable" },
    };




    const repo = new InMemoryMerchantOfferRepository(data);
    const service = new MerchantOfferService(repo);
    const collector = new MerchantEvidenceCollector(service);

    const snapshot = await collector.captureSupplySnapshot();
    const evidence = collector.collectSupplyEvidence(snapshot);

    const compEvidence = evidence.filter((e) => e.category === "COMPARABILITY");
    expect(compEvidence.length).toBeGreaterThan(0);
    expect(compEvidence[0].fact).toContain("response SLA");
  });

  // 5. Missing-demand detection
  it("Case 5: detects missing-demand clusters from repeated unsatisfied buyer queries", async () => {
    const snapshot = await intelligenceService["collector"].captureSupplySnapshot();
    const engine = new MerchantDiagnosticEngine();

    const intents = [
      normalizeBuyerIntent({
        category: "devops_interview_prep",
        budget: { amountPaise: 250000, currency: "INR", type: "HARD" },
        billing: { cadence: "monthly", isRecurring: true },
        mustHave: ["kubernetes_lab"],
      }),
      normalizeBuyerIntent({
        category: "devops_interview_prep",
        budget: { amountPaise: 250000, currency: "INR", type: "HARD" },
        billing: { cadence: "monthly", isRecurring: true },
        mustHave: ["kubernetes_lab"],
      }),
    ];


    const missingDemand = engine.detectMissingDemand(snapshot, intents);
    expect(missingDemand.length).toBe(1);
    expect(missingDemand[0].category).toBe("devops_interview_prep");
    expect(missingDemand[0].demandFrequency).toBe(2);
    expect(missingDemand[0].unmetReason).toContain("2 buyer request(s)");
  });

  // 6. No fabricated metrics (Zero Hallucination)
  it("Case 6: returns NOT_MEASURED for unobserved funnel stages rather than fabricated numbers", async () => {
    const report = await intelligenceService.generateDiagnosticReport();

    expect(report.funnel.checkoutCount).toBe("NOT_MEASURED");
    expect(report.funnel.purchasedCount).toBe("NOT_MEASURED");
  });

  // 7. Evidence references required on every diagnosis
  it("Case 7: verifies every generated diagnosis contains at least one evidence reference", async () => {
    const report = await intelligenceService.generateDiagnosticReport();

    for (const diag of report.diagnoses) {
      expect(diag.evidence).toBeDefined();
      expect(diag.evidence.length).toBeGreaterThan(0);
      expect(diag.title).toBeDefined();
      expect(diag.diagnosis).toBeDefined();
      expect(diag.recommendedAction).toBeDefined();
    }
  });

  // 8. Unsupported AI claim rejected
  it("Case 8: rejects unsupported or invented revenue/conversion uplift claims", async () => {
    const context = {
      merchantId: "m_interviewforge",
      issueType: "SUPPORT" as const,
      title: "Support Ambiguity",
      evidence: [
        {
          id: "ev_1",
          category: "SUPPORT" as const,
          source: "MERCHANT_SUPPLY" as const,
          fact: "Offer specifies 0 monthly 1:1 sessions.",
        },
      ],
    };

    const invalidExplanation = "Changing this will lead to a 50% revenue boost across all channels.";
    const validation = validateExplanationGrounding(invalidExplanation, context);

    expect(validation.isGrounded).toBe(false);
    expect(validation.missingEvidenceReason).toContain("unverified revenue/conversion uplift");
  });

  // 9. Deterministic counts
  it("Case 9: preserves deterministic counts for products, offers, and evaluations", async () => {
    const snapshot = await intelligenceService["collector"].captureSupplySnapshot();

    expect(snapshot.totalProducts).toBe(5);
    expect(snapshot.totalOffers).toBe(6);
    expect(typeof snapshot.activeConfirmedOffers).toBe("number");
  });

  // 10. Semantic explanation provider boundary
  it("Case 10: provider boundary produces grounded explanations from bounded evidence context", async () => {
    const context = {
      merchantId: "m_interviewforge",
      issueType: "SUPPORT" as const,
      title: "Mentor Support Gap",
      evidence: [
        {
          id: "ev_supp_1",
          category: "SUPPORT" as const,
          source: "MERCHANT_SUPPLY" as const,
          fact: "Offer provides email support with no guaranteed turnaround time.",
        },
      ],
    };

    const explanation = await reasoningProvider.explainDiagnosis(context);

    expect(explanation.groundedInEvidence).toBe(true);
    expect(explanation.citedEvidenceIds).toContain("ev_supp_1");
    expect(explanation.explanation).toContain("email support");
  });

  // 11. Merchant simulation is read-only
  it("Case 11: simulation execution produces zero side-effects or state mutations", async () => {
    const offersBefore = await merchantService.listOffers();
    const intent = normalizeBuyerIntent({
      category: "system_design",
      budget: { amountPaise: 400000, currency: "INR", type: "HARD" },
      billing: { cadence: "monthly", isRecurring: true },
      mustHave: [],
    });

    await simulationService.simulateMerchantForBuyer("m_interviewforge", intent);
    const offersAfter = await merchantService.listOffers();

    expect(offersAfter.length).toBe(offersBefore.length);
  });

  // 12. Multilingual buyer mission preserved
  it("Case 12: handles Hinglish and vernacular buyer mission simulation cleanly", async () => {
    const intent = normalizeBuyerIntent({
      category: "system_design",
      budget: { amountPaise: 400000, currency: "INR", type: "HARD" },
      billing: { cadence: "monthly", isRecurring: true },
      mustHave: ["mentor_feedback"],
      context: {
        language: "hi-latn",
        locale: "en-IN",
        rawQuery: "4k ke andar monthly system design mentor chahiye",
      },
    });

    const evalResult = await simulationService.simulateMerchantForBuyer(
      "m_interviewforge",
      intent,
    );

    expect(evalResult.discovered).toBe(true);
    expect(evalResult.recommended).toBe(true);
  });

  // 13. Competing offer comparison
  it("Case 13: accurately diagnoses ranking loss when a competitor scores higher", async () => {
    const intent = normalizeBuyerIntent({
      category: "system_design",
      budget: { amountPaise: 500000, currency: "INR", type: "HARD" },
      billing: { cadence: "monthly", isRecurring: true },
      mustHave: ["system_design_course"],
      niceToHave: ["capstone_review", "contest_practice"],
    });

    const superiorCompetitor: OfferDetailDTO = {
      id: "o_comp_elite",
      version: 1,
      name: "Elite System Design",
      description: "Top tier with capstone review and contest practice",
      price: 199900,
      currency: "INR",
      billingInterval: "monthly",
      duration: 180,
      entitlementKeys: ["system_design_course", "mentor_feedback", "mock_interviews", "capstone_review", "contest_practice"],
      refundPolicy: { windowDays: 30 },
      supportTerms: "1:1 Mentor",
      semanticTerms: "Live coaching",
      availability: "ACTIVE",
      versionHash: "hash_elite",
      isConfirmedByMerchant: true,
      product: {
        id: "p_comp",
        name: "Elite",
        slug: "elite",
        category: "system_design",
        merchantId: "m_competitor",
      },
      structuredCommitments: {
        support: { tier: "dedicated_mentor", slaHours: 6, oneOnOneSessionsPerMonth: 8, hasDedicatedHuman: true },
        entitlements: { keys: ["system_design_course", "mentor_feedback", "mock_interviews", "capstone_review", "contest_practice"], criticalKeys: [] },
        usageLimits: { apiRequestsPerMonth: 5000, concurrentSeats: 1, computeCredits: 200 },
        delivery: { type: "continuous_saas", commitmentSLA: "6h" },
        refundPolicy: { windowDays: 30, type: "conditional" },
      },
    };


    const evalResult = await simulationService.simulateMerchantForBuyer(
      "m_interviewforge",
      intent,
      { competingOffers: [superiorCompetitor] },
    );

    expect(evalResult.shortlisted).toBe(true);
    expect(evalResult.recommended).toBe(false);
    expect(evalResult.failedAt).toBe("RECOMMENDATION");
    expect(evalResult.winningOffer?.name).toBe("Elite System Design");
  });

  // 14. Transaction readiness analysis
  it("Case 14: flags non-standard billing intervals under TRANSACTION_READINESS", async () => {
    const data = buildInterviewForgeData();
    data.offers.forEach((o) => {
      o.active = true;
      o.billingInterval = "bi-weekly"; // Non-standard
    });
    const repo = new InMemoryMerchantOfferRepository(data);
    const service = new MerchantOfferService(repo);
    const collector = new MerchantEvidenceCollector(service);

    const snapshot = await collector.captureSupplySnapshot();
    const evidence = collector.collectSupplyEvidence(snapshot);

    const readinessEvidence = evidence.filter((e) => e.category === "TRANSACTION_READINESS");
    expect(readinessEvidence.length).toBeGreaterThan(0);
    expect(readinessEvidence[0].fact).toContain("non-standard billing interval");
  });



  // 15. Insufficient evidence path
  it("Case 15: returns INSUFFICIENT_EVIDENCE when context lacks factual proof", async () => {
    const emptyContext = {
      merchantId: "m_test",
      issueType: "SUPPORT" as const,
      title: "Unknown",
      evidence: [],
    };

    const explanation = await reasoningProvider.explainDiagnosis(emptyContext);

    expect(explanation.isInsufficientEvidence).toBe(true);
    expect(explanation.explanation).toBe("INSUFFICIENT_EVIDENCE");
    expect(explanation.groundedInEvidence).toBe(false);
  });
});
