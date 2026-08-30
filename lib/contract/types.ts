import type { StructuredCommitments } from "@/lib/merchant/structured-commitments";
import type { CanonicalBuyerIntent } from "@/lib/intent/types";

export type ProtocolCompatibilityStatus =
  | "SUPPORTED_BY_OUR_CONTRACT"
  | "PARTIALLY_COMPATIBLE"
  | "NOT_IMPLEMENTED"
  | "NOT_RELEVANT";

export interface ProtocolClaim {
  protocol: string;
  name: string;
  status: ProtocolCompatibilityStatus;
  summary: string;
  supportedCapabilities: string[];
  unsupportedCapabilities: string[];
  safePresentationClaim: string;
}

export type ContractReadinessStatus = "READY" | "NEEDS_ATTENTION" | "NOT_READY";

export interface ContractCheckResult {
  name: string;
  category: "PRICING" | "BILLING" | "SUPPORT" | "REFUND" | "INTEGRITY" | "STATUS";
  status: "PASS" | "FAIL" | "WARN";
  message: string;
}

export interface ContractReadiness {
  status: ContractReadinessStatus;
  summary: string;
  passedCount: number;
  totalCount: number;
  checks: ContractCheckResult[];
}

export interface CommercialTermsPayload {
  pricePaise: number;
  currency: string;
  billingInterval: string;
  duration: number;
  isRecurring: boolean;
  refundWindowDays: number;
}

export interface UntrustedContentPayload {
  title: string;
  description: string;
  supportTerms: string;
  semanticTerms: string;
  isUntrustedData: true;
  safetyNotice: string;
}

export interface IntegrityPayload {
  versionHash: string | null;
  isConfirmedByMerchant: boolean;
  fingerprintAlgorithm: "SHA-256";
}

export interface AgentCommerceContract {
  protocol: "agentic-commerce-contract/v1";
  generatedAt: string;
  merchant: {
    id: string;
    name: string;
    slug: string;
    description: string;
    status: "ACTIVE" | "INACTIVE";
  };
  product: {
    id: string;
    name: string;
    slug: string;
    category: string;
    description: string;
  };
  offer: {
    id: string;
    version: number;
    name: string;
    availability: "ACTIVE" | "INACTIVE";
  };
  commercialTerms: CommercialTermsPayload;
  structuredCommitments: StructuredCommitments;
  untrustedContent: UntrustedContentPayload;
  integrity: IntegrityPayload;
  readiness: ContractReadiness;
}

export interface ExternalAgentDecisionTrace {
  buyerQuery: string;
  canonicalIntent: CanonicalBuyerIntent;
  targetOffer: {
    id: string;
    name: string;
    version: number;
    pricePaise: number;
    currency: string;
  };
  untrustedContentObserved: {
    description: string;
    supportTerms: string;
    isInjectedOrAdversarial: boolean;
  };
  structuredCommitmentsApplied: StructuredCommitments;
  decision: "SAFE_MATCH" | "REJECTED_BUDGET" | "REJECTED_SUPPORT" | "REJECTED_ENTITLEMENT" | "REJECTED_STALE" | "REJECTED_CURRENCY" | "REFUSAL";
  reasons: string[];
  safetyExplanation: string;
}

export interface ExternalAgentEvaluationResponse {
  source: "EXTERNAL_AGENT_CONTRACT_ADAPTER";
  contractUsed: {
    offerId: string;
    version: number;
    versionHash: string | null;
    merchantName: string;
  };
  isEligible: boolean;
  recommendedOffer: AgentCommerceContract | null;
  decisionTrace: ExternalAgentDecisionTrace;
  internalEquivalenceVerified: boolean;
}
