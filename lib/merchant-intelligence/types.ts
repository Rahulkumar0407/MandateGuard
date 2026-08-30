/**
 * M10-C1 — Merchant AI Evidence & Diagnosis Layer Types
 *
 * Core Principle:
 *   AI may interpret evidence.
 *   AI may not invent evidence.
 */

import type { CanonicalBuyerIntent } from "@/lib/intent/types";
import type { OfferDetailDTO, ProductDTO } from "@/lib/merchant/types";

export type EvidenceCategory =
  | "DISCOVERABILITY"
  | "COMPREHENSION"
  | "COMPARABILITY"
  | "CONVERSION"
  | "PRICING"
  | "OFFER_STRUCTURE"
  | "SUPPORT"
  | "TRUST"
  | "MISSING_DEMAND"
  | "TRANSACTION_READINESS";

export const EVIDENCE_CATEGORIES: readonly EvidenceCategory[] = [
  "DISCOVERABILITY",
  "COMPREHENSION",
  "COMPARABILITY",
  "CONVERSION",
  "PRICING",
  "OFFER_STRUCTURE",
  "SUPPORT",
  "TRUST",
  "MISSING_DEMAND",
  "TRANSACTION_READINESS",
] as const;

export type EvidenceSeverity = "INFO" | "WARNING" | "CRITICAL";

export type EvidenceSource =
  | "MERCHANT_SUPPLY"
  | "BUYER_DEMAND"
  | "DECISION_RESULT"
  | "TRANSACTION_OUTCOME";

export interface EvidenceReference {
  id: string;
  category: EvidenceCategory;
  source: EvidenceSource;
  fact: string;
  metric?: {
    label: string;
    value: number | string | boolean;
    unit?: string;
    benchmark?: number | string | boolean;
  };
  entityId?: string;
  entityType?: "merchant" | "product" | "offer" | "intent" | "mandate";
}

export interface BuyerMissionEvaluation {
  discovered: boolean;
  understandable: boolean;
  comparable: boolean;
  shortlisted: boolean;
  recommended: boolean;

  failedAt?:
    | "DISCOVERY"
    | "UNDERSTANDING"
    | "COMPARISON"
    | "SHORTLIST"
    | "RECOMMENDATION";

  evidence: EvidenceReference[];
  diagnosis?: string;
  candidateOffer?: {
    id: string;
    name: string;
    version: number;
    pricePaise: number;
  };
  winningOffer?: {
    id: string;
    name: string;
    pricePaise: number;
    merchantName: string;
  };
}

export interface LostBuyerFunnel {
  totalBuyerRequests: number;
  discoveredCount: number | "NOT_MEASURED";
  understoodCount: number | "NOT_MEASURED";
  shortlistedCount: number | "NOT_MEASURED";
  recommendedCount: number | "NOT_MEASURED";
  checkoutCount: number | "NOT_MEASURED";
  purchasedCount: number | "NOT_MEASURED";
}

export interface MissingDemandCluster {
  id: string;
  category: string;
  targetBudgetPaise?: number;
  mustHaveEntitlements: string[];
  supportRequirement?: string;
  demandFrequency: number;
  unmetReason: string;
  merchantOpportunity: string;
}

export interface MerchantDiagnosis {
  merchantId: string;
  issueType: EvidenceCategory;
  severity: EvidenceSeverity;
  title: string;
  diagnosis: string;
  evidence: EvidenceReference[];
  recommendedAction: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  expectedMechanism?: string;
}

export interface MerchantDiagnosisContext {
  merchantId: string;
  issueType: EvidenceCategory;
  title: string;
  evidence: EvidenceReference[];
  rawWordingSnippet?: string;
}

export interface MerchantExplanation {
  explanation: string;
  groundedInEvidence: boolean;
  citedEvidenceIds: string[];
  isInsufficientEvidence?: boolean;
}

export interface MerchantReasoningProvider {
  explainDiagnosis(input: MerchantDiagnosisContext): Promise<MerchantExplanation>;
}

export interface MerchantSupplySnapshot {
  merchantId: string;
  merchantName: string;
  products: ProductDTO[];
  offers: OfferDetailDTO[];
  totalProducts: number;
  totalOffers: number;
  activeConfirmedOffers: number;
  unconfirmedOffers: number;
  offersWithStructuredCommitments: number;
}

export interface BuyerDecisionTrace {
  id: string;
  buyerQuery: string;
  intent: CanonicalBuyerIntent;
  recommendation: {
    eligible: boolean;
    refusalReason?: string;
    candidateCount: number;
    recommendedOfferId?: string;
  };
  selectedOfferId?: string;
  rejectedOffers: Array<{
    offerId: string;
    offerName: string;
    rejectionReason: string;
  }>;
  evaluatedAt: string;
}

export interface LostBuyerAnalysis {
  id: string;
  buyerQuery: string;
  parsedIntent: CanonicalBuyerIntent;
  failureStage:
    | "DISCOVERY"
    | "RETRIEVAL_FILTER"
    | "HARD_CONSTRAINT_FAIL"
    | "SUPPORT_MISMATCH"
    | "BUDGET_CEILING_EXCEEDED"
    | "RANKING_LOSS";
  rejectionReason: string;
  candidateOfferEvaluated?: {
    offerId: string;
    offerName: string;
    pricePaise: number;
  };
  merchantRemedy: string;
}

export interface DemandGapAnalysis {
  id: string;
  demandedCategoryOrFeature: string;
  targetBudgetPaise?: number;
  demandFrequency: number;
  currentCatalogCoverage: boolean;
  gapSummary: string;
  suggestedAction: string;
}

export type ReadinessDimensionStatus = "PASS" | "NEEDS_ATTENTION" | "CRITICAL";

export interface ReadinessDimension {
  status: ReadinessDimensionStatus;
  score: number; // 0..100
  summary: string;
  evidence: EvidenceReference[];
  diagnosis?: string;
  recommendedAction?: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export interface MerchantRecommendation {
  id: string;
  issueType: string;
  title: string;
  currentState: string;
  evidence: EvidenceReference[];
  recommendation: string;
  expectedMechanism: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  requiresMerchantApproval: true;
  affectedOfferId?: string;
  proposedChanges?: {
    support?: {
      tier?: string;
      slaHours?: number;
      oneOnOneSessionsPerMonth?: number;
      hasDedicatedHuman?: boolean;
    };
    entitlements?: {
      keys?: string[];
      criticalKeys?: string[];
    };
    refundPolicy?: {
      windowDays?: number;
      type?: "no_questions_asked" | "conditional" | "non_refundable";
    };
    pricePaise?: number;
    billingInterval?: string;
  };
}

export interface MerchantAIReadiness {
  merchantId: string;
  overallScore: number;
  dimensions: {
    discoverability: ReadinessDimension;
    comprehension: ReadinessDimension;
    comparability: ReadinessDimension;
    conversion: ReadinessDimension;
    transactionReadiness: ReadinessDimension;
  };
  topIssues: MerchantDiagnosis[];
  recommendations: MerchantRecommendation[];
  analyzedAt: string;
}

export interface ImprovementPreviewInput {
  merchantId: string;
  targetOfferId: string;
  proposedOffer: Partial<OfferDetailDTO>;
  testMissions?: CanonicalBuyerIntent[];
}

export interface ImprovementPreviewResult {
  merchantId: string;
  targetOfferId: string;
  evaluatedMissionsCount: number;
  before: {
    shortlistedCount: number;
    recommendedCount: number;
    averageScore: number;
    evaluations: BuyerMissionEvaluation[];
  };
  after: {
    shortlistedCount: number;
    recommendedCount: number;
    averageScore: number;
    evaluations: BuyerMissionEvaluation[];
  };
  delta: {
    eligibilityImproved: boolean;
    shortlistDelta: number;
    recommendationDelta: number;
    scoreDelta: number;
    eliminatedBlockers: string[];
    unlockedMissions: string[];
  };
  evidence: EvidenceReference[];
  requiresMerchantApproval: true;
}

export interface PredefinedMissionPreset {
  id: string;
  name: string;
  description: string;
  intent: CanonicalBuyerIntent;
}

export interface ShopMyBusinessResult {
  merchantId: string;
  totalMissions: number;
  passedMissions: number;
  failedMissions: number;
  missionResults: Array<{
    missionId: string;
    missionName: string;
    description: string;
    evaluation: BuyerMissionEvaluation;
  }>;
  aggregateReadiness: MerchantAIReadiness;
  analyzedAt: string;
}

export interface MerchantDiagnosticReport {
  merchantId: string;
  merchantName: string;
  generatedAt: string;
  catalogSummary: {
    totalProducts: number;
    totalOffers: number;
    activeConfirmedOffers: number;
    unconfirmedOffers: number;
    structuredCommitmentCoveragePercentage: number;
  };
  funnel: LostBuyerFunnel;
  diagnoses: MerchantDiagnosis[];
  missingDemand: MissingDemandCluster[];
  evidenceList: EvidenceReference[];
}

export * from "./opportunity-types";

