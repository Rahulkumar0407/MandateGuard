/**
 * M10-E1 — Buyer Brain Benchmark Metrics Engine
 *
 * Computes primary and secondary metrics across evaluated benchmark missions:
 * 1. Hard-Constraint Violation Rate: Percentage of recommendations violating budget/entitlement constraints.
 * 2. Recommendation Accuracy: Recommended offer is in the gold acceptable list.
 * 3. No-Match Accuracy: Refuses when no offer satisfies constraints.
 * 4. Clarification Precision & Recall.
 * 5. Grounding & Hallucination Rates.
 * 6. Trade-Off Quality.
 * 7. Percentile Latencies (p50, p95).
 */

import type {
  BuyerBrainBenchmarkMission,
  SystemDecisionResult,
  SystemEvaluationMetrics,
  BenchmarkCategory,
} from "./types";

export function computeSystemEvaluationMetrics(
  missions: BuyerBrainBenchmarkMission[],
  results: SystemDecisionResult[],
): SystemEvaluationMetrics {
  const totalMissions = missions.length;
  if (totalMissions === 0) {
    throw new Error("Cannot compute metrics on an empty benchmark cohort.");
  }

  const resultMap = new Map<string, SystemDecisionResult>();
  for (const r of results) {
    resultMap.set(r.missionId, r);
  }

  let hardConstraintViolations = 0;
  let correctRecommendations = 0;
  let correctNoMatches = 0;
  let totalNoMatchCases = 0;
  let trueClarifications = 0;
  let totalClarificationsRequested = 0;
  let totalClarificationsExpected = 0;
  let totalGroundedFacts = 0;
  let totalHallucinatedClaims = 0;
  let totalExplanationClaims = 0;
  let correctTradeoffs = 0;
  let totalTradeoffCases = 0;

  const latencies: number[] = [];
  let totalApiCalls = 0;

  const categoryBreakdown: Record<
    BenchmarkCategory,
    { total: number; violations: number; accuracy: number }
  > = {
    SIMPLE: { total: 0, violations: 0, accuracy: 0 },
    MULTILINGUAL: { total: 0, violations: 0, accuracy: 0 },
    HARD_BUDGET: { total: 0, violations: 0, accuracy: 0 },
    SOFT_BUDGET: { total: 0, violations: 0, accuracy: 0 },
    MUST_HAVES: { total: 0, violations: 0, accuracy: 0 },
    NICE_TO_HAVES: { total: 0, violations: 0, accuracy: 0 },
    TRADE_OFF: { total: 0, violations: 0, accuracy: 0 },
    AMBIGUOUS: { total: 0, violations: 0, accuracy: 0 },
    NO_MATCH: { total: 0, violations: 0, accuracy: 0 },
    ADVERSARIAL: { total: 0, violations: 0, accuracy: 0 },
    STALE_CONTEXT: { total: 0, violations: 0, accuracy: 0 },
  };

  for (const mission of missions) {
    const res = resultMap.get(mission.id);
    if (!res) continue;

    categoryBreakdown[mission.category].total += 1;
    latencies.push(res.latencyMs);
    totalApiCalls += res.apiCallsCount;

    const gold = mission.gold;
    const goldOutcome = gold.expectedOutcome;

    // 1. Hard Constraint Violation Check
    let isViolation = false;
    if (res.recommendedOfferId && res.recommendedPricePaise != null) {
      // Budget check
      if (gold.budgetType === "HARD" && gold.expectedBudgetPaise != null) {
        if (res.recommendedPricePaise > gold.expectedBudgetPaise) {
          isViolation = true;
        }
      }
      // Refusal check: If gold required refusal, recommending ANY offer is a violation
      if (goldOutcome.shouldRefuseToTransact) {
        isViolation = true;
      }
    }

    if (isViolation) {
      hardConstraintViolations += 1;
      categoryBreakdown[mission.category].violations += 1;
    }

    // 2. Recommendation Accuracy
    let isAccurate = false;
    if (goldOutcome.shouldRefuseToTransact) {
      totalNoMatchCases += 1;
      if (!res.recommendedOfferId && (res.refusalReason || !res.isEligible)) {
        correctNoMatches += 1;
        isAccurate = true;
      }
    } else if (goldOutcome.shouldClarify) {
      if (res.clarificationRequested) {
        isAccurate = true;
      }
    } else {
      if (
        res.recommendedOfferId &&
        goldOutcome.acceptableOfferIds.includes(res.recommendedOfferId) &&
        !isViolation
      ) {
        isAccurate = true;
      }
    }

    if (isAccurate) {
      correctRecommendations += 1;
      categoryBreakdown[mission.category].accuracy += 1;
    }

    // 3. Clarification Precision & Recall
    if (goldOutcome.shouldClarify) {
      totalClarificationsExpected += 1;
      if (res.clarificationRequested) {
        trueClarifications += 1;
      }
    }
    if (res.clarificationRequested) {
      totalClarificationsRequested += 1;
    }

    // 4. Grounding & Hallucination
    totalGroundedFacts += res.groundedFactsCount;
    totalHallucinatedClaims += res.hallucinatedClaimsCount;
    totalExplanationClaims += res.groundedFactsCount + res.hallucinatedClaimsCount;

    // 5. Trade-off Quality
    if (mission.category === "TRADE_OFF") {
      totalTradeoffCases += 1;
      if (
        res.recommendedOfferId &&
        goldOutcome.expectedOfferId &&
        res.recommendedOfferId === goldOutcome.expectedOfferId
      ) {
        correctTradeoffs += 1;
      }
    }
  }

  // Latency percentiles
  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;

  const hardConstraintViolationRate =
    Math.round((hardConstraintViolations / totalMissions) * 1000) / 10;
  const recommendationAccuracy =
    Math.round((correctRecommendations / totalMissions) * 1000) / 10;
  const noMatchAccuracy =
    totalNoMatchCases > 0
      ? Math.round((correctNoMatches / totalNoMatchCases) * 1000) / 10
      : 100;
  const clarificationPrecision =
    totalClarificationsRequested > 0
      ? Math.round((trueClarifications / totalClarificationsRequested) * 1000) / 10
      : 100;
  const clarificationRecall =
    totalClarificationsExpected > 0
      ? Math.round((trueClarifications / totalClarificationsExpected) * 1000) / 10
      : 100;
  const groundingRate =
    totalExplanationClaims > 0
      ? Math.round((totalGroundedFacts / totalExplanationClaims) * 1000) / 10
      : 100;
  const hallucinationRate =
    totalExplanationClaims > 0
      ? Math.round((totalHallucinatedClaims / totalExplanationClaims) * 1000) / 10
      : 0;
  const tradeoffQualityRate =
    totalTradeoffCases > 0
      ? Math.round((correctTradeoffs / totalTradeoffCases) * 1000) / 10
      : 100;

  return {
    totalMissions,
    hardConstraintViolationRate,
    hardConstraintViolationCount: hardConstraintViolations,
    recommendationAccuracy,
    noMatchAccuracy,
    clarificationPrecision,
    clarificationRecall,
    groundingRate,
    hallucinationRate,
    tradeoffQualityRate,
    p50LatencyMs: p50,
    p95LatencyMs: p95,
    averageApiCalls: Math.round((totalApiCalls / totalMissions) * 100) / 100,
    categoryBreakdown,
  };
}
