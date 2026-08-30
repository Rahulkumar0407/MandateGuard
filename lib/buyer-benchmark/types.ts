/**
 * M10-E1 — Buyer Brain Benchmark Types & Interfaces
 *
 * Defines the schema for gold benchmark missions, baseline/candidate system evaluations,
 * ablation variations, and multi-dimensional metrics.
 */

import type { CanonicalBuyerIntent } from "@/lib/intent/types";

export type BenchmarkDifficulty = "simple" | "medium" | "hard" | "adversarial";
export type BenchmarkSplit = "train" | "held_out";
export type BenchmarkLanguage = "en" | "hi" | "hinglish" | "code_switching";

export type BenchmarkCategory =
  | "SIMPLE"
  | "MULTILINGUAL"
  | "HARD_BUDGET"
  | "SOFT_BUDGET"
  | "MUST_HAVES"
  | "NICE_TO_HAVES"
  | "TRADE_OFF"
  | "AMBIGUOUS"
  | "NO_MATCH"
  | "ADVERSARIAL"
  | "STALE_CONTEXT";

export interface BenchmarkGoldLabel {
  expectedCategory: string;
  expectedBudgetPaise?: number;
  budgetType: "HARD" | "SOFT";
  expectedCadence: "monthly" | "yearly" | "any";
  mustHaveEntitlements: string[];
  niceToHaveEntitlements?: string[];
  requiresHumanMentor: boolean;
  maxSlaHours?: number;
  expectedOutcome: {
    expectedOfferId?: string;
    acceptableOfferIds: string[];
    shouldRefuseToTransact: boolean;
    shouldClarify: boolean;
    refusalReasonCode?: string;
    rejectionReasonDescription?: string;
  };
}

export interface BuyerBrainBenchmarkMission {
  id: string;
  name: string;
  rawQuery: string;
  language: BenchmarkLanguage;
  category: BenchmarkCategory;
  difficulty: BenchmarkDifficulty;
  split: BenchmarkSplit;
  adversarialPayload?: {
    type: "prompt_injection" | "misleading_terms" | "price_override_attempt" | "unsupported_sla";
    injectedPrompt?: string;
  };
  staleContextPayload?: {
    stalePricePaise: number;
    currentPricePaise: number;
    staleOfferVersion: number;
    currentOfferVersion: number;
  };
  gold: BenchmarkGoldLabel;
}

export interface BuyerBenchmarkCohort {
  benchmarkId: string;
  benchmarkVersion: string;
  createdAt: string;
  caseCount: number;
  trainCount: number;
  heldOutCount: number;
  datasetHash: string;
  missions: BuyerBrainBenchmarkMission[];
}

export interface SystemDecisionResult {
  missionId: string;
  systemId: string;
  recommendedOfferId: string | null;
  recommendedOfferName: string | null;
  recommendedPricePaise: number | null;
  isEligible: boolean;
  refusalReason: string | null;
  clarificationRequested: boolean;
  clarificationPrompt?: string;
  explanation: string;
  groundedFactsCount: number;
  hallucinatedClaimsCount: number;
  extractedIntent?: CanonicalBuyerIntent;
  latencyMs: number;
  apiCallsCount: number;
}

export interface SystemEvaluationMetrics {
  totalMissions: number;
  hardConstraintViolationRate: number; // Percentage (0 - 100)
  hardConstraintViolationCount: number;
  recommendationAccuracy: number; // Percentage (0 - 100)
  noMatchAccuracy: number; // Percentage (0 - 100)
  clarificationPrecision: number; // Percentage (0 - 100)
  clarificationRecall: number; // Percentage (0 - 100)
  groundingRate: number; // Percentage (0 - 100)
  hallucinationRate: number; // Percentage (0 - 100)
  tradeoffQualityRate: number; // Percentage (0 - 100)
  p50LatencyMs: number;
  p95LatencyMs: number;
  averageApiCalls: number;
  categoryBreakdown: Record<
    BenchmarkCategory,
    {
      total: number;
      violations: number;
      accuracy: number;
    }
  >;
}

export interface BuyerBrainBenchmarkReport {
  benchmarkId: string;
  benchmarkVersion: string;
  datasetHash: string;
  generatedAt: string;
  totalMissions: number;
  trainMissions: number;
  heldOutMissions: number;
  systems: {
    baselineA_Deterministic: SystemEvaluationMetrics;
    baselineB_LLMOnly: SystemEvaluationMetrics;
    systemC_MandateGuard: SystemEvaluationMetrics;
  };
  ablations: {
    noCanonicalIntent: SystemEvaluationMetrics;
    noHardFilter: SystemEvaluationMetrics;
    noTradeoffReasoner: SystemEvaluationMetrics;
    noStructuredCommitments: SystemEvaluationMetrics;
  };
  multilingualEquivalencePass: boolean;
  adversarialDefensePass: boolean;
  staleStateProtectionPass: boolean;
}
