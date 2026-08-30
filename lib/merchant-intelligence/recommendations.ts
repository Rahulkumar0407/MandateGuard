import type {
  MerchantDiagnosis,
  MerchantRecommendation,
  MerchantAIReadiness,
  ReadinessDimension,
  MerchantSupplySnapshot,
  BuyerMissionEvaluation,
  EvidenceReference,
} from "./types";

/**
 * Validates that recommendations contain no generic or ungrounded commercial advice.
 */
export function isGenericOrUngroundedAdvice(recommendationText: string): boolean {
  const genericPatterns = [
    /\b(improve|optimize)\s+(your\s+)?(seo|search engine optimization)\b/i,
    /\b(use|post on|run)\s+(social media|influencer|ads|marketing campaign)\b/i,
    /\b(increase|boost)\s+(marketing|advertising|promotions)\b/i,
    /\b(offer|give)\s+(random|blanket)\s+(discounts|coupons)\b/i,
  ];

  return genericPatterns.some((pattern) => pattern.test(recommendationText));
}

/**
 * Deterministic Prioritization and Recommendation Engine for Merchant Intelligence.
 */
export class MerchantPrioritizationEngine {
  /**
   * Evaluates and prioritizes diagnoses based on severity, affected buyer missions,
   * hard constraint impact, and confidence.
   */
  prioritizeDiagnoses(
    diagnoses: MerchantDiagnosis[],
    evaluations: BuyerMissionEvaluation[] = [],
  ): MerchantDiagnosis[] {
    const totalEvals = Math.max(evaluations.length, 1);

    const scored = diagnoses.map((diag) => {
      let priorityScore = 0;

      // 1. Severity weight
      if (diag.severity === "CRITICAL") priorityScore += 50;
      else if (diag.severity === "WARNING") priorityScore += 25;
      else priorityScore += 10;

      // 2. Hard constraint / Blocking impact
      const blocksHardConstraint =
        diag.issueType === "DISCOVERABILITY" ||
        diag.issueType === "SUPPORT" ||
        diag.issueType === "OFFER_STRUCTURE" ||
        diag.issueType === "PRICING";
      if (blocksHardConstraint) priorityScore += 30;

      // 3. Affected buyer missions count
      const affectedCount = evaluations.filter(
        (e) => e.failedAt && diag.diagnosis.toLowerCase().includes(e.failedAt.toLowerCase()),
      ).length;
      priorityScore += Math.round((affectedCount / totalEvals) * 20);

      // 4. Confidence weight
      if (diag.confidence === "HIGH") priorityScore += 10;
      else if (diag.confidence === "MEDIUM") priorityScore += 5;
      else priorityScore += 1;

      return { diag, priorityScore };
    });

    // Sort descending by deterministic score
    scored.sort((a, b) => b.priorityScore - a.priorityScore);
    return scored.map((s) => s.diag);
  }

  /**
   * Generates actionable, structured recommendations from prioritized diagnoses.
   */
  generateRecommendations(
    prioritizedDiagnoses: MerchantDiagnosis[],
    snapshot: MerchantSupplySnapshot,
  ): MerchantRecommendation[] {
    const recommendations: MerchantRecommendation[] = [];
    let recIdx = 1;

    for (const diag of prioritizedDiagnoses) {
      if (isGenericOrUngroundedAdvice(diag.recommendedAction)) {
        continue;
      }

      let currentState = "Offer attributes require optimization.";
      let proposedChanges: MerchantRecommendation["proposedChanges"] = undefined;
      const targetOffer = snapshot.offers[0];

      if (diag.issueType === "DISCOVERABILITY") {
        currentState = `${snapshot.unconfirmedOffers} offer version(s) are unconfirmed.`;
      } else if (diag.issueType === "COMPREHENSION") {
        currentState = "Unstructured marketing text lacks machine-readable JSON schema.";
        proposedChanges = {
          support: { tier: "standard_email", slaHours: 24, hasDedicatedHuman: false },
          entitlements: { keys: targetOffer?.entitlementKeys || [] },
        };
      } else if (diag.issueType === "COMPARABILITY" || diag.issueType === "SUPPORT") {
        currentState = "Support SLA response time is unquantified or 0 monthly 1:1 sessions specified.";
        proposedChanges = {
          support: { tier: "dedicated_mentor", slaHours: 24, oneOnOneSessionsPerMonth: 4, hasDedicatedHuman: true },
        };
      } else if (diag.issueType === "PRICING") {
        currentState = `Active pricing (${targetOffer ? `₹${(targetOffer.price / 100).toLocaleString("en-IN")}` : "current"}) exceeds budget ceilings.`;
        proposedChanges = {
          pricePaise: 299900,
        };
      }

      recommendations.push({
        id: `rec_${diag.issueType.toLowerCase()}_${recIdx++}`,
        issueType: diag.issueType,
        title: diag.title,
        currentState,
        evidence: diag.evidence,
        recommendation: diag.recommendedAction,
        expectedMechanism:
          diag.expectedMechanism ||
          "Directly improves machine parsing, constraint validation, and buyer alignment in AI search.",
        confidence: diag.confidence,
        requiresMerchantApproval: true,
        affectedOfferId: targetOffer?.id,
        proposedChanges,
      });
    }

    return recommendations;
  }

  /**
   * Computes the 5-dimensional AI Buyer Readiness breakdown.
   */
  calculateReadiness(
    snapshot: MerchantSupplySnapshot,
    evidenceList: EvidenceReference[],
    diagnoses: MerchantDiagnosis[],
    evaluations: BuyerMissionEvaluation[] = [],
  ): MerchantAIReadiness {
    const prioritizedIssues = this.prioritizeDiagnoses(diagnoses, evaluations);
    const recommendations = this.generateRecommendations(prioritizedIssues, snapshot);

    // 1. Discoverability
    const discEvidence = evidenceList.filter((e) => e.category === "DISCOVERABILITY");
    const unconfirmed = snapshot.unconfirmedOffers;
    let discStatus: ReadinessDimension["status"] = "PASS";
    let discScore = 100;
    if (unconfirmed > 0) {
      discStatus = "CRITICAL";
      discScore = Math.max(10, 100 - unconfirmed * 30);
    }

    const discoverability: ReadinessDimension = {
      status: discStatus,
      score: discScore,
      summary:
        discStatus === "PASS"
          ? "All active catalog offers have cryptographic version hashes and are discoverable."
          : `${unconfirmed} offer version(s) lack merchant confirmation and cannot be discovered.`,
      evidence: discEvidence,
      diagnosis: discStatus === "CRITICAL" ? "Pending unconfirmed offers are invisible to AI buyer search." : undefined,
      recommendedAction: discStatus === "CRITICAL" ? "Confirm offer versions in Merchant Studio." : undefined,
      confidence: "HIGH",
    };

    // 2. Comprehension
    const compEvidence = evidenceList.filter((e) => e.category === "COMPREHENSION");
    const cov = snapshot.totalOffers > 0 ? (snapshot.offersWithStructuredCommitments / snapshot.totalOffers) * 100 : 100;
    let compStatus: ReadinessDimension["status"] = "PASS";
    const compScore = Math.round(cov);
    if (compScore < 50) compStatus = "CRITICAL";
    else if (compScore < 100) compStatus = "NEEDS_ATTENTION";


    const comprehension: ReadinessDimension = {
      status: compStatus,
      score: compScore,
      summary: `Structured commitments coverage is ${Math.round(cov)}% across catalog.`,
      evidence: compEvidence,
      diagnosis: compStatus !== "PASS" ? "Unstructured terms prevent machine verification of commercial deliverables." : undefined,
      recommendedAction: compStatus !== "PASS" ? "Define structured commitments schema for all offers." : undefined,
      confidence: "HIGH",
    };

    // 3. Comparability
    const compGaps = evidenceList.filter((e) => e.category === "COMPARABILITY" || e.category === "SUPPORT");
    let compStatus2: ReadinessDimension["status"] = "PASS";
    let compScore2 = 95;
    if (compGaps.length > 0) {
      compStatus2 = "NEEDS_ATTENTION";
      compScore2 = Math.max(30, 95 - compGaps.length * 20);
    }

    const comparability: ReadinessDimension = {
      status: compStatus2,
      score: compScore2,
      summary:
        compStatus2 === "PASS"
          ? "Offer support SLAs and refund windows are clearly quantified."
          : "SLA response turnaround or 1:1 mentor sessions are unquantified.",
      evidence: compGaps,
      diagnosis: compStatus2 !== "PASS" ? "Unclear support SLAs degrade ranking in machine trade-off comparisons." : undefined,
      recommendedAction: compStatus2 !== "PASS" ? "Specify explicit SLA hours (e.g. 24h) and monthly sessions." : undefined,
      confidence: "HIGH",
    };

    // 4. Conversion
    const totalEvals = evaluations.length;
    const recommendedCount = evaluations.filter((e) => e.recommended).length;
    const convRate = totalEvals > 0 ? Math.round((recommendedCount / totalEvals) * 100) : 100;
    let convStatus: ReadinessDimension["status"] = "PASS";
    if (totalEvals > 0 && convRate < 40) convStatus = "CRITICAL";
    else if (totalEvals > 0 && convRate < 75) convStatus = "NEEDS_ATTENTION";

    const conversion: ReadinessDimension = {
      status: convStatus,
      score: convRate,
      summary:
        totalEvals > 0
          ? `AI buyer selection rate is ${convRate}% (${recommendedCount}/${totalEvals} missions).`
          : "Catalog is eligible for buyer selection.",
      evidence: evidenceList.filter((e) => e.category === "CONVERSION"),
      diagnosis: convStatus !== "PASS" ? "Losing recommendations due to budget ceilings or competing offers." : undefined,
      confidence: totalEvals >= 3 ? "HIGH" : "MEDIUM",
    };

    // 5. Transaction Readiness
    const readinessEvidence = evidenceList.filter((e) => e.category === "TRANSACTION_READINESS");
    let txStatus: ReadinessDimension["status"] = "PASS";
    let txScore = 100;
    if (readinessEvidence.length > 0) {
      txStatus = "NEEDS_ATTENTION";
      txScore = 60;
    }

    const transactionReadiness: ReadinessDimension = {
      status: txStatus,
      score: txScore,
      summary:
        txStatus === "PASS"
          ? "Billing intervals and plan specifications are fully compatible with payment execution."
          : "Non-standard billing intervals detected.",
      evidence: readinessEvidence,
      confidence: "HIGH",
    };

    const overallScore = Math.round(
      discoverability.score * 0.25 +
        comprehension.score * 0.25 +
        comparability.score * 0.2 +
        conversion.score * 0.2 +
        transactionReadiness.score * 0.1,
    );

    return {
      merchantId: snapshot.merchantId,
      overallScore,
      dimensions: {
        discoverability,
        comprehension,
        comparability,
        conversion,
        transactionReadiness,
      },
      topIssues: prioritizedIssues,
      recommendations,
      analyzedAt: new Date().toISOString(),
    };
  }
}
