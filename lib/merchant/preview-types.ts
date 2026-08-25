import { z } from "zod";
import {
  StructuredCommitmentsSchema,
  type StructuredCommitments,
} from "@/lib/merchant/structured-commitments";
export type { StructuredCommitments };
import type {
  CompatibilityFinding,
  CompatibilityStatus,
} from "@/lib/compatibility/types";

// ============================================================================
// M9 Phase 5: Merchant Pre-Publish Impact Preview Types
// ============================================================================

export const ImpactPreviewInputSchema = z.object({
  productId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string(),
  price: z.number().int().min(0),
  currency: z.string().trim().toUpperCase().optional().default("INR"),
  billingInterval: z.string().trim().toLowerCase().optional().default("monthly"),
  duration: z.number().int().min(0),
  entitlementKeys: z.array(z.string().trim().min(1)),
  refundWindowDays: z.number().int().min(0),
  supportTerms: z.string(),
  semanticTerms: z.string(),
  structuredCommitments: StructuredCommitmentsSchema.nullable().optional(),
});

export type ImpactPreviewInput = z.input<typeof ImpactPreviewInputSchema>;
export type ParsedImpactPreviewInput = z.infer<typeof ImpactPreviewInputSchema>;

export interface SubscriberImpactEvaluation {
  envelopeId: string;
  subscriptionId: string | null;
  userId: string;
  authorizedOfferVersionId: string;
  authorizedPrice: number;
  compatibility: CompatibilityStatus;
  requiredAction: "NONE" | "REVIEW" | "REAUTHORIZATION";
  reasons: CompatibilityFinding[];
}

export interface CohortMetrics {
  count: number;
  percentage: number;
  mrrPaise: number;
  envelopeIds: string[];
}

export interface CohortBreakdown {
  compatible: CohortMetrics;
  review: CohortMetrics;
  breaking: CohortMetrics;
}

export interface FinancialImpact {
  currentTotalMRRPaise: number;
  projectedTotalMRRPaise: number;
  atRiskMRRPaise: number;
  reviewPendingMRRPaise: number;
  seamlessMRRPaise: number;
}

export interface MerchantImpactPreview {
  productId: string;
  productName: string;
  proposedVersion: number;
  proposedOfferHash: string;
  totalSubscribersAffected: number;
  summary: {
    compatibleCount: number;
    reviewCount: number;
    breakingCount: number;
    compatiblePercentage: number;
    reviewPercentage: number;
    breakingPercentage: number;
  };
  financialImpact: FinancialImpact;
  cohortBreakdown: CohortBreakdown;
  subscribers: SubscriberImpactEvaluation[];
  recommendations: string[];
  generatedAt: string;
}
