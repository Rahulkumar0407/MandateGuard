/**
 * M10-C3 — Evidence-Based Revenue Opportunity Engine Types
 *
 * Core Principles:
 *   1. Detect opportunity from evidence first.
 *   2. Explain second.
 *   3. Estimate only when evidence supports estimation.
 *   4. Never invent revenue.
 */

import type { EvidenceReference } from "./types";

export type OpportunityType =
  | "UNSERVED_DEMAND"
  | "UNDER_SERVED_DEMAND"
  | "UPSELL"
  | "CROSS_SELL"
  | "OFFER_PACKAGING"
  | "PRICE_VALUE_MISMATCH"
  | "SUPPORT_DRIVEN_OPPORTUNITY"
  | "AI_BUYER_CONVERSION_GAP";

export const OPPORTUNITY_TYPES: readonly OpportunityType[] = [
  "UNSERVED_DEMAND",
  "UNDER_SERVED_DEMAND",
  "UPSELL",
  "CROSS_SELL",
  "OFFER_PACKAGING",
  "PRICE_VALUE_MISMATCH",
  "SUPPORT_DRIVEN_OPPORTUNITY",
  "AI_BUYER_CONVERSION_GAP",
] as const;

export type OpportunityConfidence = "HIGH" | "MEDIUM" | "LOW";

export type OpportunityActionType =
  | "CREATE_OFFER"
  | "CREATE_TIER"
  | "UPDATE_COMMITMENTS"
  | "ADJUST_PRICE"
  | "ADD_BUNDLE"
  | "ENRICH_METADATA";

export interface OpportunityEstimatedImpact {
  /** Monthly revenue potential in paise (computed deterministically from evidence) */
  monthlyRevenuePotentialPaise: number;
  /** Number of empirical buyer requests / missions backing this calculation */
  demandFrequency: number;
  /** Estimated percentage lift in AI buyer shortlist or recommendation rate */
  conversionRateLiftPercent?: number;
  /** Minimum and maximum bounds of the estimate */
  confidenceRangePaise?: {
    min: number;
    max: number;
  };
  /** Whether empirical evidence exists to justify estimation; false if speculative or unmeasured */
  isEstimated: boolean;
  /** Detailed deterministic formula explaining how the calculation was derived */
  estimationMethodology: string;
}

export interface OpportunityRecommendedAction {
  actionType: OpportunityActionType;
  description: string;
  suggestedParameters?: {
    suggestedPricePaise?: number;
    suggestedBillingInterval?: string;
    suggestedEntitlements?: string[];
    suggestedSupportTier?: string;
    suggestedSlaHours?: number;
    suggestedRefundPolicy?: {
      windowDays: number;
      type: "no_questions_asked" | "conditional" | "non_refundable";
    };
  };
  /** Invariant: All actions require human merchant authorization before execution */
  requiresMerchantApproval: true;
}

export interface RevenueOpportunity {
  id: string;
  type: OpportunityType;
  title: string;
  summary: string;
  targetCategory?: string;
  affectedOfferId?: string;
  affectedProductId?: string;
  evidence: EvidenceReference[];
  confidence: OpportunityConfidence;
  estimatedImpact?: OpportunityEstimatedImpact | null;
  recommendedAction: OpportunityRecommendedAction;
  detectedAt: string;
}

export interface OpportunityAnalysisReport {
  merchantId: string;
  merchantName: string;
  opportunities: RevenueOpportunity[];
  totalOpportunities: number;
  totalAddressableMonthlyRevenuePaise: number;
  evidenceGroundedCount: number;
  detectedAt: string;
}
