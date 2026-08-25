import { z } from "zod";
import type {
  AuthorizationEnvelopeModel,
  AuthorizationEnvelopeDTO,
} from "@/lib/envelope/types";
import type { StructuredCommitments } from "@/lib/merchant/structured-commitments";

// ============================================================================
// M9 Phase 3: Compatibility Evaluation Engine Types
// ============================================================================

export type CompatibilityStatus = "COMPATIBLE" | "REVIEW" | "BREAKING";

export const CompatibilityStatusSchema = z.enum([
  "COMPATIBLE",
  "REVIEW",
  "BREAKING",
]);

export type CompatibilityDimension =
  | "FINANCIAL"
  | "ENTITLEMENTS"
  | "SUPPORT"
  | "USAGE_LIMITS"
  | "DELIVERY"
  | "REFUND"
  | "SEMANTIC";

export type FindingSeverity = "CRITICAL" | "WARNING" | "INFO";

export interface CompatibilityFinding {
  dimension: CompatibilityDimension;
  severity: FindingSeverity;
  code: string;
  message: string;
  baselineValue?: unknown;
  proposedValue?: unknown;
  isPermittedByTolerance?: boolean;
}

export interface ProposedOfferInput {
  id?: string;
  productId: string;
  version: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingInterval: string;
  duration: number;
  entitlementKeys: string[];
  refundWindowDays: number;
  supportTerms: string;
  semanticTerms: string;
  structuredCommitments?: StructuredCommitments | null;
  versionHash?: string | null;
}

export interface CompatibilityEvaluationResult {
  envelopeId: string;
  authorizedOfferVersionId: string;
  authorizedOfferHash: string;
  proposedOfferVersionId?: string;
  proposedOfferVersion: number;
  proposedOfferHash?: string | null;
  status: CompatibilityStatus;
  authorizationPolicyHash: string;
  findings: CompatibilityFinding[];
  summary: string;
  evaluatedAt: string;
}

export interface AgentCompatibilityStatus {
  compatibility: "COMPATIBLE" | "REVIEW" | "BREAKING";

  authorization: {
    canProceedAutonomously: boolean;
    delegatedBudgetLimit: number;
    authorizedMonthlySpend: number;
  };

  requiredAction: "NONE" | "REVIEW" | "REAUTHORIZATION";

  subscriptionId: string;

  authorizedBaseline: {
    offerVersionId: string;
    version: number;
    versionHash: string;
  };

  currentOffer: {
    offerVersionId: string;
    version: number;
    versionHash: string;
  };

  reasons: CompatibilityFinding[];

  evaluatedAt: string;
}

export type EnvelopeTarget =
  | AuthorizationEnvelopeModel
  | AuthorizationEnvelopeDTO;
