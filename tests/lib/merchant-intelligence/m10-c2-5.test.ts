import { describe, it, expect } from "vitest";
import {
  getGoldBuyabilityCohort,
  GOLD_BUYABILITY_COHORT_V1,
} from "@/lib/merchant-intelligence/buyability-benchmark-dataset";
import { MerchantBuyabilityEngine } from "@/lib/merchant-intelligence/buyability-engine";
import type { MerchantSupplySnapshot } from "@/lib/merchant-intelligence/types";
import { createHash } from "crypto";

function buildMockSupplySnapshot(overrides?: Partial<MerchantSupplySnapshot>): MerchantSupplySnapshot {
  return {
    merchantId: "merch_interview_forge",
    merchantName: "InterviewForge AI",
    products: [
      {
        id: "prod_sys_design",
        name: "System Design Mastery",
        slug: "system-design",
        category: "system_design",
        description: "Comprehensive system design prep",
        offers: [],
      },
      {
        id: "prod_dsa",
        name: "DSA Intensive Track",
        slug: "dsa",
        category: "dsa",
        description: "Data structures and algorithms curriculum",
        offers: [],
      },
    ],
    offers: [
      {
        id: "offer_sys_design_pro",
        name: "System Design Pro",
        description: "System design with curriculum and mentor feedback",
        price: 349900,
        currency: "INR",
        billingInterval: "monthly",
        duration: 1,
        entitlementKeys: ["system_design_curriculum", "mock_interviews", "mentor_feedback"],
        refundPolicy: { windowDays: 14 },
        version: 1,
        isConfirmedByMerchant: true,

        availability: "ACTIVE",
        versionHash: "hash_sd_pro_v1",
        supportTerms: "Mentor feedback within 24h",
        semanticTerms: "Curriculum access and mock interviews",
        product: {
          id: "prod_sys_design",
          merchantId: "merch_interview_forge",
          name: "System Design Mastery",
          slug: "system-design",
          category: "system_design",
        },
        structuredCommitments: {
          entitlements: {
            keys: ["system_design_curriculum", "mock_interviews", "mentor_feedback"],
            criticalKeys: ["system_design_curriculum"],
          },
          support: {
            tier: "dedicated_mentor",
            hasDedicatedHuman: true,
            slaHours: 24,
            oneOnOneSessionsPerMonth: 2,
          },
          refundPolicy: {
            windowDays: 14,
            type: "conditional",
          },
          usageLimits: {
            apiRequestsPerMonth: null,
            concurrentSeats: 1,
            computeCredits: null,
          },
          delivery: {
            type: "instant_access",
            commitmentSLA: null,
          },
        },
      },
    ],

    totalProducts: 2,
    totalOffers: 1,
    activeConfirmedOffers: 1,
    unconfirmedOffers: 0,
    offersWithStructuredCommitments: 1,
    ...overrides,
  };
}



describe("M10-C2.5 — AI Buyability Benchmark & Closed-Loop Experiment", () => {
  const engine = new MerchantBuyabilityEngine();

  it("M10-C2.5-001: Versioned Benchmark Cohort has exactly 100 missions and valid SHA-256 datasetHash", () => {
    const cohort = getGoldBuyabilityCohort();
    expect(cohort.caseCount).toBe(100);
    expect(cohort.missions.length).toBe(100);
    expect(cohort.benchmarkId).toBe("buyability_gold_cohort_v1");
    expect(cohort.benchmarkVersion).toBe("1.0.0");
    expect(cohort.datasetHash).toBeDefined();
    expect(cohort.datasetHash.length).toBe(64); // SHA-256 length

    // Verify datasetHash determinism
    const canonicalJSON = JSON.stringify(
      cohort.missions.map((m) => ({
        id: m.id,
        q: m.rawQuery,
        c: m.category,
        b: m.hardBudgetPaise,
      })),
    );
    const expectedHash = createHash("sha256").update(canonicalJSON).digest("hex");
    expect(cohort.datasetHash).toBe(expectedHash);
  });

  it("M10-C2.5-002: Multilingual coverage includes English, Hindi, Hinglish, and Code-Switching", () => {
    const cohort = getGoldBuyabilityCohort();
    const languages = cohort.missions.map((m) => m.language);
    expect(languages.includes("en")).toBe(true);
    expect(languages.includes("hi")).toBe(true);
    expect(languages.includes("hinglish")).toBe(true);
    expect(languages.includes("code_switching")).toBe(true);

    // Verify presence of realistic Indian commerce phrasing
    const queries = cohort.missions.map((m) => m.rawQuery);
    expect(queries.some((q) => q.includes("4k ke andar") || q.includes("human mentor"))).toBe(true);
    expect(queries.some((q) => q.includes("4 hazaar ke aas paas") || q.includes("stretch"))).toBe(true);
    expect(queries.some((q) => q.includes("refund easy hona chahiye") || q.includes("money back"))).toBe(true);
  });

  it("M10-C2.5-003: Evaluates 6-stage funnel deterministically without fabricated rates", () => {
    const snapshot = buildMockSupplySnapshot();
    const report = engine.evaluateBuyability(snapshot);

    expect(report.totalMissions).toBe(100);
    expect(report.benchmarkId).toBe("buyability_gold_cohort_v1");
    expect(report.datasetHash).toBe(GOLD_BUYABILITY_COHORT_V1.datasetHash);

    // Verify 6-stage funnel measurements
    const { funnel } = report;
    expect(funnel.discovered.status).toBe("MEASURED");
    expect(funnel.understood.status).toBe("MEASURED");
    expect(funnel.comparable.status).toBe("MEASURED");
    expect(funnel.shortlisted.status).toBe("MEASURED");
    expect(funnel.recommended.status).toBe("MEASURED");
    expect(funnel.transactionReady.status).toBe("MEASURED");

    // Funnel monotonic sanity check: discovered >= understood >= comparable >= shortlisted
    expect(funnel.discovered.count).toBeGreaterThanOrEqual(funnel.understood.count);
    expect(funnel.understood.count).toBeGreaterThanOrEqual(funnel.comparable.count);
    expect(funnel.comparable.count).toBeGreaterThanOrEqual(funnel.shortlisted.count);
    expect(funnel.shortlisted.count).toBeGreaterThanOrEqual(funnel.recommended.count);
    expect(funnel.recommended.count).toBeGreaterThanOrEqual(funnel.transactionReady.count);

    // Check ratePercent math
    expect(funnel.discovered.ratePercent).toBe(funnel.discovered.count);
    expect(funnel.transactionReady.ratePercent).toBe(funnel.transactionReady.count);
  });

  it("M10-C2.5-004: Measures Simple Baseline vs Commerce Brain objectively", () => {
    const snapshot = buildMockSupplySnapshot();
    const report = engine.evaluateBuyability(snapshot);

    expect(report.baselineComparison).toBeDefined();
    expect(report.baselineComparison!.baseline.status).toBe("MEASURED");
    expect(report.baselineComparison!.commerceBrain.status).toBe("MEASURED");
    expect(typeof report.baselineComparison!.difference).toBe("number");
    expect(report.baselineComparison!.difference).toBe(
      report.baselineComparison!.commerceBrain.count - report.baselineComparison!.baseline.count,
    );
  });

  it("M10-C2.5-005: Failure distribution categorizes losses accurately without hallucination", () => {
    const snapshot = buildMockSupplySnapshot();
    const report = engine.evaluateBuyability(snapshot);

    expect(report.failureDistribution.length).toBeGreaterThan(0);
    const totalFailuresInReport = report.totalMissions - report.funnel.transactionReady.count;

    const sumOfFailureCounts = report.failureDistribution.reduce(
      (sum, item) => sum + item.affectedMissionCount,
      0,
    );
    expect(sumOfFailureCounts).toBe(totalFailuresInReport);

    // Each failure item has sample queries and reason
    for (const item of report.failureDistribution) {
      expect(item.affectedMissionCount).toBeGreaterThan(0);
      expect(item.percentageOfFails).toBeGreaterThan(0);
      expect(item.percentageOfFails).toBeLessThanOrEqual(100);
      expect(item.reason.length).toBeGreaterThan(0);
    }
  });

  it("M10-C2.5-006: Deterministic Prioritization of Top Failures", () => {
    const snapshot = buildMockSupplySnapshot();
    const report = engine.evaluateBuyability(snapshot);

    expect(report.topFailures.length).toBeLessThanOrEqual(3);
    for (const failure of report.topFailures) {
      expect(failure.issueType).toBeDefined();
      expect(failure.severity).toMatch(/CRITICAL|WARNING|INFO/);
      expect(failure.title.length).toBeGreaterThan(0);
      expect(failure.evidence.length).toBeGreaterThan(0);
      expect(failure.recommendedAction).toBeDefined();
    }
  });

  it("M10-C2.5-007: Closed-Loop Experiment executes over the EXACT same 100 missions before and after", () => {
    // Start with catalog having unconfirmed offer and missing SLA
    const initialSnapshot = buildMockSupplySnapshot({
      offers: [
        {
          id: "offer_unconfirmed",
          name: "Unconfirmed Plan",
          description: "No commitments",
          price: 500000,
          currency: "INR",
          billingInterval: "monthly",
          duration: 1,
          entitlementKeys: [],
          refundPolicy: { windowDays: 0 },
          version: 1,
          isConfirmedByMerchant: false,

          availability: "ACTIVE",
          supportTerms: "None",
          semanticTerms: "None",
          product: {
            id: "prod_sys_design",
            merchantId: "merch_interview_forge",
            name: "System Design Mastery",
            slug: "system-design",
            category: "system_design",
          },
        },
      ],
    });

    const experiment = engine.runBuyabilityExperiment(
      initialSnapshot,
      "offer_unconfirmed",
      {
        price: 350000,
        structuredCommitments: {
          entitlements: {
            keys: ["system_design_curriculum", "mock_interviews", "mentor_feedback"],
            criticalKeys: ["system_design_curriculum"],
          },
          support: {
            tier: "dedicated_mentor",
            hasDedicatedHuman: true,
            slaHours: 24,
            oneOnOneSessionsPerMonth: 4,
          },
          refundPolicy: {
            windowDays: 14,
            type: "conditional",
          },
          usageLimits: {
            apiRequestsPerMonth: null,
            concurrentSeats: 1,
            computeCredits: null,
          },
          delivery: {
            type: "instant_access",
            commitmentSLA: null,
          },
        },
      },
    );



    // Check same cohort invariant
    expect(experiment.benchmarkId).toBe("buyability_gold_cohort_v1");
    expect(experiment.benchmarkVersion).toBe("1.0.0");
    expect(experiment.datasetHash).toBe(GOLD_BUYABILITY_COHORT_V1.datasetHash);
    expect(experiment.before.totalMissions).toBe(100);
    expect(experiment.after.totalMissions).toBe(100);

    // Invariant: Requires merchant approval
    expect(experiment.requiresMerchantApproval).toBe(true);

    // Delta math validation
    expect(experiment.changes.missionsRecovered).toBeGreaterThan(0);


    expect(experiment.interpretation.status).toBe("IMPROVED");
    expect(experiment.after.funnel.transactionReady.count).toBeGreaterThan(
      experiment.before.funnel.transactionReady.count,
    );
    expect(experiment.changes.stageDeltas.transactionReady).toBe(
      experiment.after.funnel.transactionReady.count - experiment.before.funnel.transactionReady.count,
    );
  });

  it("M10-C2.5-008: Non-mutation invariant — simulation does not mutate original snapshot", () => {
    const originalSnapshot = buildMockSupplySnapshot();
    const originalVersion = originalSnapshot.offers[0].version;
    const originalPrice = originalSnapshot.offers[0].price;

    engine.runBuyabilityExperiment(
      originalSnapshot,
      originalSnapshot.offers[0].id,
      { price: 999900 },
    );

    // Original snapshot must remain strictly untouched
    expect(originalSnapshot.offers[0].version).toBe(originalVersion);
    expect(originalSnapshot.offers[0].price).toBe(originalPrice);
  });

  it("M10-C2.5-009: Detects regressions when proposed change degrades buyability (e.g. 5x price hike)", () => {
    const snapshot = buildMockSupplySnapshot();
    const experiment = engine.runBuyabilityExperiment(
      snapshot,
      snapshot.offers[0].id,
      {
        price: 2500000, // ₹25,000/mo (exceeds all buyer budgets)
      },
    );

    expect(experiment.after.funnel.transactionReady.count).toBeLessThan(
      experiment.before.funnel.transactionReady.count,
    );
    expect(experiment.interpretation.status).toBe("WORSE");
  });
});
