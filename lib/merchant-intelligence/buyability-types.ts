/**
 * M10-C2.5 — AI Buyability Benchmark & Closed-Loop Merchant Experiment Types
 *
 * Core Concept:
 *   AI Buyability: How easily can an AI buyer discover, understand, compare,
 *   choose, and become transaction-ready with this merchant?
 */

import type { CanonicalBuyerIntent } from "@/lib/intent/types";
import type { BuyerMissionEvaluation, EvidenceReference, MerchantDiagnosis } from "./types";
import type { OfferDetailDTO } from "@/lib/merchant/types";

export type BenchmarkLanguage = "en" | "hi" | "hinglish" | "code_switching";

export type MerchantAnalysisState =
  | "NOT_CONFIGURED"
  | "READY_TO_ANALYZE"
  | "ANALYZING"
  | "ANALYZED"
  | "STALE"
  | "INSUFFICIENT_DATA";

export type FailureCategory =
  | "MISSING_HARD_REQUIREMENT"
  | "SUPPORT_AMBIGUITY"
  | "PRICING_MISMATCH"
  | "OFFER_PACKAGING"
  | "REFUND_AMBIGUITY"
  | "BILLING_MISMATCH"
  | "INSUFFICIENT_STRUCTURED_DATA"
  | "COMPETITOR_FIT"
  | "NO_MATCHING_OFFER"
  | "INSUFFICIENT_EVIDENCE";

export interface BenchmarkBuyerMission {
  id: string;
  name: string;
  rawQuery: string;
  language: BenchmarkLanguage;
  category: string;
  intent: CanonicalBuyerIntent;
  mustHaveEntitlements: string[];
  hardBudgetPaise?: number;
  isHardCeiling: boolean;
  requiresHumanMentor: boolean;
  minRefundDays?: number;
  maxSlaHours?: number;
  expectedAcceptableOutcome: {
    expectedWinnerCategory: string;
    shouldRefuseToTransact: boolean;
    acceptableOfferIds?: string[];
    rejectionReason?: string;
  };
}

export interface BuyabilityBenchmarkCohort {
  benchmarkId: string;
  benchmarkVersion: string;
  createdAt: string;
  caseCount: number;
  datasetHash: string;
  missions: BenchmarkBuyerMission[];
}

export interface Measurement {
  count: number;
  ratePercent: number;
  measured: boolean;
  status: "MEASURED" | "NOT_MEASURED";
}

export interface BuyabilityFunnel {
  discovered: Measurement;
  understood: Measurement;
  comparable: Measurement;
  shortlisted: Measurement;
  recommended: Measurement;
  transactionReady: Measurement;
}

export interface FailureDistributionItem {
  category: FailureCategory;
  reason: string;
  affectedMissionCount: number;
  percentageOfFails: number;
  sampleQueries: string[];
}

export interface BuyabilityMissionResult {
  missionId: string;
  rawQuery: string;
  language: BenchmarkLanguage;
  category: string;
  evaluation: BuyerMissionEvaluation;
  status: "PASSED" | "FAILED";
  failureCategory?: FailureCategory;
  primaryBlocker?: string;
}

export interface AIBuyabilityReport {
  merchantId: string;
  merchantName: string;
  benchmarkId: string;
  benchmarkVersion: string;
  datasetHash: string;
  totalMissions: number;

  funnel: BuyabilityFunnel;

  failureDistribution: FailureDistributionItem[];

  topFailures: MerchantDiagnosis[];

  baselineComparison?: {
    baseline: Measurement;
    commerceBrain: Measurement;
    difference: number;
  };

  missionResults: BuyabilityMissionResult[];
  generatedAt: string;
}

export interface BuyabilityExperiment {
  benchmarkId: string;
  benchmarkVersion: string;
  datasetHash: string;
  merchantId: string;
  targetOfferId: string;

  before: AIBuyabilityReport;
  after: AIBuyabilityReport;

  changes: {
    missionsRecovered: number;
    missionsStillBlocked: number;
    stageDeltas: Record<string, number>;
  };

  interpretation: {
    status: "IMPROVED" | "UNCHANGED" | "WORSE";
    evidence: EvidenceReference[];
  };

  /** Invariant: Experiment is analysis-only and requires explicit merchant approval before publishing */
  requiresMerchantApproval: true;
}

export interface BuyabilityExperimentInput {
  merchantId: string;
  targetOfferId: string;
  proposedOffer: Partial<OfferDetailDTO>;
  benchmarkCohort?: BuyabilityBenchmarkCohort;
}
