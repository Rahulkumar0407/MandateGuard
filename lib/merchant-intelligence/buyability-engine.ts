/**
 * M10-C2.5 — AI Buyability Engine & Closed-Loop Merchant Experiment Service
 *
 * Core Concept:
 *   AI Buyability: How easily can an AI buyer discover, understand, compare,
 *   choose, and become transaction-ready with this merchant?
 *
 * ALL OPERATIONS ARE ANALYSIS-ONLY (ZERO PERSISTENCE MUTATIONS).
 */

import type {
  BuyabilityBenchmarkCohort,
  AIBuyabilityReport,
  BuyabilityExperiment,
  BuyabilityFunnel,
  Measurement,
  FailureCategory,
  FailureDistributionItem,
  BuyabilityMissionResult,
} from "./buyability-types";
import type { MerchantSupplySnapshot, EvidenceReference, BuyerMissionEvaluation, MerchantDiagnosis } from "./types";
import type { OfferDetailDTO } from "@/lib/merchant/types";
import type { CanonicalBuyerIntent } from "@/lib/intent/types";
import { getGoldBuyabilityCohort } from "./buyability-benchmark-dataset";

import { evaluateHardConstraints } from "@/lib/retrieval/filter";
import { scoreEligibleOffer } from "@/lib/retrieval/scorer";


export class MerchantBuyabilityEngine {
  /**
   * Evaluates a merchant supply snapshot against the fixed benchmark cohort.
   * Runs both Simple Baseline and Commerce Brain, measuring the 6-stage funnel.
   */
  evaluateBuyability(
    snapshot: MerchantSupplySnapshot,
    cohort: BuyabilityBenchmarkCohort = getGoldBuyabilityCohort(),
  ): AIBuyabilityReport {
    const generatedAt = new Date().toISOString();
    const missionResults: BuyabilityMissionResult[] = [];

    let discoveredCount = 0;
    let understoodCount = 0;
    let comparableCount = 0;
    let shortlistedCount = 0;
    let recommendedCount = 0;
    let transactionReadyCount = 0;

    let baselineRecommendedCount = 0;

    // Tracking failure breakdown by category
    const failureBuckets: Record<
      FailureCategory,
      { count: number; sampleQueries: string[]; primaryReasons: string[] }
    > = {
      MISSING_HARD_REQUIREMENT: { count: 0, sampleQueries: [], primaryReasons: [] },
      SUPPORT_AMBIGUITY: { count: 0, sampleQueries: [], primaryReasons: [] },
      PRICING_MISMATCH: { count: 0, sampleQueries: [], primaryReasons: [] },
      OFFER_PACKAGING: { count: 0, sampleQueries: [], primaryReasons: [] },
      REFUND_AMBIGUITY: { count: 0, sampleQueries: [], primaryReasons: [] },
      BILLING_MISMATCH: { count: 0, sampleQueries: [], primaryReasons: [] },
      INSUFFICIENT_STRUCTURED_DATA: { count: 0, sampleQueries: [], primaryReasons: [] },
      COMPETITOR_FIT: { count: 0, sampleQueries: [], primaryReasons: [] },
      NO_MATCHING_OFFER: { count: 0, sampleQueries: [], primaryReasons: [] },
      INSUFFICIENT_EVIDENCE: { count: 0, sampleQueries: [], primaryReasons: [] },
    };

    for (const mission of cohort.missions) {
      // 1. Simple Baseline Strategy (filter hard constraints -> choose cheapest)
      const baselineEligible = snapshot.offers.filter(
        (o) => evaluateHardConstraints(o, mission.intent).isEligible,
      );
      if (baselineEligible.length > 0) {
        baselineRecommendedCount++;
      }


      // 2. Commerce Brain Strategy (5-stage evaluation + transaction readiness)
      const evaluation = this.evaluateCommerceBrain(snapshot, mission.intent);

      if (evaluation.discovered) discoveredCount++;
      if (evaluation.understandable) understoodCount++;
      if (evaluation.comparable) comparableCount++;
      if (evaluation.shortlisted) shortlistedCount++;
      if (evaluation.recommended) recommendedCount++;

      // Stage 6: Transaction Ready (Recommended + valid candidate with positive price)
      const candidate = evaluation.candidateOffer;
      const isTxReady =
        evaluation.recommended === true &&
        Boolean(candidate && candidate.pricePaise > 0);


      if (isTxReady) {
        transactionReadyCount++;
      }

      const isWon = isTxReady;
      let failureCategory: FailureCategory | undefined;

      if (!isWon) {
        failureCategory = this.classifyFailure(evaluation);
        const bucket = failureBuckets[failureCategory];
        bucket.count++;
        if (bucket.sampleQueries.length < 3) {
          bucket.sampleQueries.push(mission.rawQuery);
        }
        if (evaluation.diagnosis && !bucket.primaryReasons.includes(evaluation.diagnosis)) {
          bucket.primaryReasons.push(evaluation.diagnosis);
        }
      }


      missionResults.push({
        missionId: mission.id,
        rawQuery: mission.rawQuery,
        language: mission.language,
        category: mission.category,
        evaluation,
        status: isWon ? "PASSED" : "FAILED",
        failureCategory,
        primaryBlocker: isWon ? undefined : evaluation.diagnosis,
      });
    }

    const totalMissions = cohort.missions.length;
    const failedMissions = totalMissions - transactionReadyCount;

    const makeMeasurement = (count: number): Measurement => ({
      count,
      ratePercent: totalMissions > 0 ? Math.round((count / totalMissions) * 1000) / 10 : 0,
      measured: true,
      status: "MEASURED",
    });

    const funnel: BuyabilityFunnel = {
      discovered: makeMeasurement(discoveredCount),
      understood: makeMeasurement(understoodCount),
      comparable: makeMeasurement(comparableCount),
      shortlisted: makeMeasurement(shortlistedCount),
      recommended: makeMeasurement(recommendedCount),
      transactionReady: makeMeasurement(transactionReadyCount),
    };

    // Build failure distribution list
    const failureDistribution: FailureDistributionItem[] = (
      Object.keys(failureBuckets) as FailureCategory[]
    )
      .filter((cat) => failureBuckets[cat].count > 0)
      .map((cat) => {
        const bucket = failureBuckets[cat];
        return {
          category: cat,
          reason: this.describeFailureCategory(cat),
          affectedMissionCount: bucket.count,
          percentageOfFails: failedMissions > 0 ? Math.round((bucket.count / failedMissions) * 100) : 0,
          sampleQueries: bucket.sampleQueries,
        };

      })
      .sort((a, b) => b.affectedMissionCount - a.affectedMissionCount);

    // Build deterministic top diagnoses
    const topFailures: MerchantDiagnosis[] = failureDistribution.slice(0, 3).map((item, idx) => ({
      merchantId: snapshot.merchantId,
      issueType: this.mapFailureToDiagnosticCategory(item.category),
      severity: item.percentageOfFails >= 25 ? "CRITICAL" : "WARNING",
      title: item.reason,
      diagnosis: `${item.affectedMissionCount} of ${totalMissions} buyer missions failed at this gate (${item.percentageOfFails}% of all losses).`,
      evidence: [
        {
          id: `ev_diag_${idx}_${Date.now()}`,
          category: this.mapFailureToDiagnosticCategory(item.category),
          source: "DECISION_RESULT",
          fact: `${item.affectedMissionCount} missions failed: ${item.reason}. Sample query: "${item.sampleQueries[0] || ""}"`,
          metric: {
            label: "Failed Missions",
            value: item.affectedMissionCount,
            benchmark: 0,
          },
        },
      ],
      recommendedAction: this.deriveSuggestedFix(item.category),
      confidence: "HIGH",
    }));


    return {
      merchantId: snapshot.merchantId,
      merchantName: snapshot.merchantName,
      benchmarkId: cohort.benchmarkId,
      benchmarkVersion: cohort.benchmarkVersion,
      datasetHash: cohort.datasetHash,
      totalMissions,
      funnel,
      failureDistribution,
      topFailures,
      baselineComparison: {
        baseline: makeMeasurement(baselineRecommendedCount),
        commerceBrain: makeMeasurement(recommendedCount),
        difference: recommendedCount - baselineRecommendedCount,
      },
      missionResults,
      generatedAt,
    };
  }

  /**
   * Runs the exact same benchmark before and after a proposed candidate offer change.
   * ALL OPERATIONS ARE ANALYSIS-ONLY (ZERO PERSISTENCE MUTATIONS).
   */
  runBuyabilityExperiment(
    snapshot: MerchantSupplySnapshot,
    targetOfferId: string,
    proposedOfferUpdates: Partial<OfferDetailDTO>,
    cohort: BuyabilityBenchmarkCohort = getGoldBuyabilityCohort(),
  ): BuyabilityExperiment {
    // 1. Before Run
    const before = this.evaluateBuyability(snapshot, cohort);

    // 2. Synthesize Candidate Snapshot (non-persisted simulation)
    const candidateOffers = snapshot.offers.map((offer) => {
      if (offer.id === targetOfferId) {
        return {
          ...offer,
          ...proposedOfferUpdates,
          version: offer.version + 1,
          isConfirmedByMerchant: true,
          versionHash: offer.versionHash || "simulated_version_hash",
        } as OfferDetailDTO;
      }
      return offer;
    });

    const candidateSnapshot: MerchantSupplySnapshot = {
      ...snapshot,
      offers: candidateOffers,
    };

    // 3. After Run (using exact same benchmark cohort)
    const after = this.evaluateBuyability(candidateSnapshot, cohort);

    // 4. Compute exact delta
    const beforePassMap = new Map(before.missionResults.map((m) => [m.missionId, m.status === "PASSED"]));
    const afterPassMap = new Map(after.missionResults.map((m) => [m.missionId, m.status === "PASSED"]));

    let missionsRecovered = 0;
    let missionsStillBlocked = 0;

    for (const [id, afterPassed] of afterPassMap.entries()) {
      const beforePassed = beforePassMap.get(id) || false;
      if (!beforePassed && afterPassed) {
        missionsRecovered++;
      } else if (!afterPassed) {
        missionsStillBlocked++;
      }
    }

    const stageDeltas: Record<string, number> = {
      discovered: after.funnel.discovered.count - before.funnel.discovered.count,
      understood: after.funnel.understood.count - before.funnel.understood.count,
      comparable: after.funnel.comparable.count - before.funnel.comparable.count,
      shortlisted: after.funnel.shortlisted.count - before.funnel.shortlisted.count,
      recommended: after.funnel.recommended.count - before.funnel.recommended.count,
      transactionReady: after.funnel.transactionReady.count - before.funnel.transactionReady.count,
    };

    const status: "IMPROVED" | "UNCHANGED" | "WORSE" =
      missionsRecovered > 0 && stageDeltas.transactionReady >= 0
        ? "IMPROVED"
        : stageDeltas.transactionReady < 0
          ? "WORSE"
          : "UNCHANGED";

    const evidence: EvidenceReference[] = [
      {
        id: `ev_exp_${Date.now()}`,
        category: "COMPREHENSION",
        source: "DECISION_RESULT",
        fact: `Closed-loop simulation on cohort ${cohort.benchmarkId} (v${cohort.benchmarkVersion}): Transaction-ready missions increased from ${before.funnel.transactionReady.count}/${cohort.caseCount} to ${after.funnel.transactionReady.count}/${cohort.caseCount} (+${stageDeltas.transactionReady}).`,
        metric: {
          label: "Recovered Missions",
          value: missionsRecovered,
        },
      },
    ];

    return {
      benchmarkId: cohort.benchmarkId,
      benchmarkVersion: cohort.benchmarkVersion,
      datasetHash: cohort.datasetHash,
      merchantId: snapshot.merchantId,
      targetOfferId,
      before,
      after,
      changes: {
        missionsRecovered,
        missionsStillBlocked,
        stageDeltas,
      },
      interpretation: {
        status,
        evidence,
      },
      requiresMerchantApproval: true,
    };
  }

  // ============================================================================
  // Deterministic Commerce Brain Evaluator
  // ============================================================================
  private evaluateCommerceBrain(
    snapshot: MerchantSupplySnapshot,
    intent: CanonicalBuyerIntent,
  ): BuyerMissionEvaluation {

    const evidence: EvidenceReference[] = [];


    // Resolve candidate offer matching intent category
    const matchingOffers = snapshot.offers.filter((o) => {
      const prod = o.product;
      const prodCat = (prod?.category || "").toLowerCase().replace(/[\s-]+/g, "_");
      const intentCat = (intent.category || "").toLowerCase().replace(/[\s-]+/g, "_");
      return (
        intentCat === "unspecified" ||
        intentCat === "interview_prep" ||
        prodCat.includes(intentCat) ||
        intentCat.includes(prodCat)
      );
    });

    const requiresHuman = Boolean(
      intent.supportPreference?.hasDedicatedHuman ||
        intent.mustHave?.includes("human_mentor"),
    );
    const budget = intent.budget?.amountPaise;

    const candidateOffer =
      matchingOffers.find((o) => {
        const matchesBudget = !budget || o.price <= budget;
        const matchesMentor =
          !requiresHuman || Boolean(o.structuredCommitments?.support?.hasDedicatedHuman);
        return matchesBudget && matchesMentor;
      }) ||
      matchingOffers.find((o) => !budget || o.price <= budget) ||
      matchingOffers[0] ||
      snapshot.offers[0];

    const candidateSummary = candidateOffer
      ? {
          id: candidateOffer.id,
          name: candidateOffer.name,
          version: candidateOffer.version,
          pricePaise: candidateOffer.price,
        }
      : undefined;

    if (!candidateOffer) {
      return {
        discovered: false,
        understandable: false,
        comparable: false,
        shortlisted: false,
        recommended: false,
        failedAt: "DISCOVERY",
        evidence,
        diagnosis: "No matching products or active offers found in catalog.",
      };
    }

    // Stage 1: Discovery (Active, Confirmed, VersionHash, Category Match)
    const isConfirmed = candidateOffer.isConfirmedByMerchant === true;
    const hasHash = Boolean(candidateOffer.versionHash);
    const isActive = candidateOffer.availability === "ACTIVE";
    const prodCat = (candidateOffer.product?.category || "").toLowerCase().replace(/[\s-]+/g, "_");
    const intentCat = (intent.category || "").toLowerCase().replace(/[\s-]+/g, "_");
    const categoryMatches =
      intentCat === "unspecified" ||
      intentCat === "interview_prep" ||
      prodCat.includes(intentCat) ||
      intentCat.includes(prodCat);

    const discovered = isConfirmed && hasHash && isActive && categoryMatches;
    if (!discovered) {
      const reasons: string[] = [];
      if (!isConfirmed) reasons.push("offer is unconfirmed");
      if (!hasHash) reasons.push("missing version hash");
      if (!isActive) reasons.push("offer is marked inactive");
      if (!categoryMatches) reasons.push(`category mismatch ('${prodCat}' vs '${intentCat}')`);
      return {
        candidateOffer: candidateSummary,
        discovered: false,
        understandable: false,
        comparable: false,
        shortlisted: false,
        recommended: false,
        failedAt: "DISCOVERY",
        evidence,
        diagnosis: `Discovery failed: ${reasons.join(", ")}.`,
      };
    }

    // Stage 2: Comprehension (Structured commitments schema exists)
    const structured = candidateOffer.structuredCommitments;
    const hasSchema = Boolean(structured && typeof structured === "object");
    const hasEntitlements = Boolean(structured?.entitlements?.keys && structured.entitlements.keys.length > 0);
    const hasSupportDef = Boolean(structured?.support && typeof structured.support.tier === "string");

    const understandable = hasSchema && hasEntitlements && hasSupportDef;
    if (!understandable) {
      return {
        candidateOffer: candidateSummary,
        discovered: true,
        understandable: false,
        comparable: false,
        shortlisted: false,
        recommended: false,
        failedAt: "UNDERSTANDING",
        evidence,
        diagnosis: "Missing machine-readable JSON commitments schema or entitlement keys.",
      };
    }

    // Stage 3: Comparability (SLA and refund transparency)
    const hasSla = typeof structured?.support?.slaHours === "number" && structured.support.slaHours > 0;
    const hasRefund = typeof structured?.refundPolicy?.windowDays === "number";

    const comparable = hasSla && hasRefund;
    if (!comparable) {
      return {
        candidateOffer: candidateSummary,
        discovered: true,
        understandable: true,
        comparable: false,
        shortlisted: false,
        recommended: false,
        failedAt: "COMPARISON",
        evidence,
        diagnosis: "Missing quantitative response SLA hours or refund policy window.",
      };
    }

    // Stage 4: Shortlist (Hard constraints filter)
    const filterResult = evaluateHardConstraints(candidateOffer, intent);
    const shortlisted = filterResult.isEligible;
    if (!shortlisted) {
      return {
        candidateOffer: candidateSummary,
        discovered: true,
        understandable: true,
        comparable: true,
        shortlisted: false,
        recommended: false,
        failedAt: "SHORTLIST",
        evidence,
        diagnosis: `Hard constraint blocking: ${(filterResult.rejectionReasons || []).join(", ")}.`,
      };
    }


    // Stage 5: Recommendation / Scoring (Score >= 60)
    const scoreResult = scoreEligibleOffer(
      candidateOffer,
      intent,
      filterResult.matchedHardConstraints || [],
    );
    const recommended = scoreResult.score >= 60;

    return {
      candidateOffer: candidateSummary,
      discovered: true,
      understandable: true,
      comparable: true,
      shortlisted: true,
      recommended,
      failedAt: recommended ? undefined : "RECOMMENDATION",
      evidence,
      diagnosis: recommended
        ? undefined
        : `Offer score (${scoreResult.score}/100) fell below competitive threshold.`,
    };
  }

  // ============================================================================
  // Deterministic Failure Classification
  // ============================================================================
  private classifyFailure(evalResult: BuyerMissionEvaluation): FailureCategory {
    const diag = (evalResult.diagnosis || "").toLowerCase();

    if (evalResult.failedAt === "DISCOVERY" || diag.includes("no matching") || diag.includes("category mismatch")) {
      return "NO_MATCHING_OFFER";
    }
    if (evalResult.failedAt === "UNDERSTANDING" || diag.includes("schema") || diag.includes("commitments")) {
      return "INSUFFICIENT_STRUCTURED_DATA";
    }

    if (diag.includes("sla") || diag.includes("support") || diag.includes("mentor")) {
      return "SUPPORT_AMBIGUITY";
    }
    if (diag.includes("budget") || diag.includes("price") || diag.includes("exceed")) {
      return "PRICING_MISMATCH";
    }
    if (diag.includes("refund")) {
      return "REFUND_AMBIGUITY";
    }
    if (diag.includes("billing") || diag.includes("cadence")) {
      return "BILLING_MISMATCH";
    }
    if (evalResult.failedAt === "SHORTLIST") {
      return "MISSING_HARD_REQUIREMENT";
    }
    if (evalResult.failedAt === "RECOMMENDATION") {
      return "COMPETITOR_FIT";
    }
    return "OFFER_PACKAGING";
  }

  private describeFailureCategory(cat: FailureCategory): string {
    switch (cat) {
      case "SUPPORT_AMBIGUITY":
        return "Human support commitments or turnaround SLAs are ambiguous/unstated";
      case "PRICING_MISMATCH":
        return "Plan pricing exceeds buyer hard budget ceiling";
      case "MISSING_HARD_REQUIREMENT":
        return "Offer is missing buyer mandatory requirements";
      case "INSUFFICIENT_STRUCTURED_DATA":
        return "Offer lacks machine-readable JSON entitlement schema";
      case "REFUND_AMBIGUITY":
        return "Refund policy window is unquantified or missing";
      case "NO_MATCHING_OFFER":
        return "Catalog lacks active confirmed offers in requested category";
      case "COMPETITOR_FIT":
        return "Offer fell behind in competitive value scoring";
      case "BILLING_MISMATCH":
        return "Billing cadence mismatch";
      case "OFFER_PACKAGING":
        return "Offer packaging requires alignment";
      case "INSUFFICIENT_EVIDENCE":
        return "Insufficient evidence to verify buyer compatibility";
    }
  }


  private mapFailureToDiagnosticCategory(
    cat: FailureCategory,
  ):
    | "DISCOVERABILITY"
    | "COMPREHENSION"
    | "SUPPORT"
    | "PRICING"
    | "OFFER_STRUCTURE"
    | "TRUST" {
    switch (cat) {
      case "NO_MATCHING_OFFER":
        return "DISCOVERABILITY";
      case "INSUFFICIENT_STRUCTURED_DATA":
      case "OFFER_PACKAGING":
        return "COMPREHENSION";
      case "SUPPORT_AMBIGUITY":
        return "SUPPORT";
      case "PRICING_MISMATCH":
        return "PRICING";
      case "REFUND_AMBIGUITY":
        return "TRUST";
      default:
        return "OFFER_STRUCTURE";
    }
  }


  private deriveSuggestedFix(cat: FailureCategory): string {
    switch (cat) {
      case "SUPPORT_AMBIGUITY":
        return "Add a dedicated human mentor commitment with explicit sessions/month and a 24h SLA.";
      case "PRICING_MISMATCH":
        return "Introduce an affordable entry tier or adjust price to match buyer willingness to pay.";
      case "INSUFFICIENT_STRUCTURED_DATA":
        return "Publish machine-readable entitlement keys in structured commitments schema.";
      case "REFUND_AMBIGUITY":
        return "Specify an explicit refund window (e.g. 14 days) in the refund commitments.";
      case "NO_MATCHING_OFFER":
        return "Confirm and publish active offers for unserved categories.";
      default:
        return "Update and enrich offer commitments in Merchant Studio.";
    }
  }
}
