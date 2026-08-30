import type { OfferDetailDTO } from "@/lib/merchant/types";
import type { CanonicalBuyerIntent } from "@/lib/intent/types";
import type { TradeoffResolution } from "./tradeoff";

/**
 * Hard constraint evaluation result for a candidate offer.
 */
export interface HardConstraintEvaluation {
  isEligible: boolean;
  rejectionReasons: string[];
  matchedHardConstraints: string[];
}

/**
 * Detailed multi-attribute score breakdown.
 */
export interface BuyerFitScoreBreakdown {
  budgetScore: number; // 0..35
  niceToHaveScore: number; // 0..25
  supportScore: number; // 0..20
  qualityScore: number; // 0..15
  slaScore: number; // 0..5
  totalScore: number; // 0..100
}

/**
 * Scored candidate offer.
 */
export interface ScoredOffer {
  offer: OfferDetailDTO;
  score: number;
  breakdown: BuyerFitScoreBreakdown;
  matchedConstraints: string[];
  tradeoffs: string[];
}

/**
 * Alternative candidate with comparison rationale.
 */
export interface RankedAlternative {
  offerId: string;
  name: string;
  version: number;
  pricePaise: number;
  currency: string;
  score: number;
  comparisonWithTopOffer: string;
}

/**
 * Complete buyer ranking and recommendation result.
 */
export interface BuyerRecommendationResult {
  recommendedOffer: OfferDetailDTO | null;
  eligible: boolean;
  score: number;
  matchedConstraints: string[];
  tradeoffs: string[];
  rationale: string;
  rankedOffers: ScoredOffer[];
  alternatives: RankedAlternative[];
  refusalReason?: string;
  intent: CanonicalBuyerIntent;
  tradeoffResolution?: TradeoffResolution;
  usedTradeoffReasoner?: boolean;
}

