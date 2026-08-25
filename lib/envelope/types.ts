import { z } from "zod";
import crypto from "crypto";
import {
  SupportTierSchema,
  StructuredCommitmentsSchema,
  normalizeStructuredCommitments,
} from "@/lib/merchant/structured-commitments";

// ============================================================================
// M9 Phase 2: Authorization Envelope Types & Validation
//
// The AuthorizationEnvelope represents:
// 1. WHAT the user/agent authorized (pinned to immutable OfferVersion baseline)
// 2. WHAT the user/agent is allowed to do autonomously (constraints & tolerances)
// ============================================================================

export type AuthorizationEnvelopeStatus =
  | "ACTIVE"
  | "MIGRATION_PENDING"
  | "REAUTHORIZED"
  | "DECLINED"
  | "EXPIRED"
  | "PAUSED"
  | "SUSPENDED"
  | "REVOKED";

export const AuthorizationEnvelopeStatusSchema = z.enum([
  "ACTIVE",
  "MIGRATION_PENDING",
  "REAUTHORIZED",
  "DECLINED",
  "EXPIRED",
  "PAUSED",
  "SUSPENDED",
  "REVOKED",
]);

// ----------------------------------------------------------------------------
// 1. Financial Constraints
// ----------------------------------------------------------------------------

export const FinancialConstraintsSchema = z.object({
  maxPricePaise: z.number().int().min(0),
  allowedCurrencies: z
    .array(z.string().trim().toUpperCase().min(1))
    .min(1),
  maxPriceIncreasePercent: z.number().min(0),
  allowedBillingIntervals: z
    .array(z.string().trim().toLowerCase().min(1))
    .min(1),
});

export type FinancialConstraints = z.infer<typeof FinancialConstraintsSchema>;

// ----------------------------------------------------------------------------
// 2. Agent Permissions
// ----------------------------------------------------------------------------

export const AgentPermissionsSchema = z.object({
  canAutoApproveMinorChanges: z.boolean(),
  canAutoPauseOnBreach: z.boolean(),
  canApproveRefundRequest: z.boolean(),
  canMigrateToNewVersion: z.boolean(),
});

export type AgentPermissions = z.infer<typeof AgentPermissionsSchema>;

// ----------------------------------------------------------------------------
// 3. Tolerance Policy
// ----------------------------------------------------------------------------

export const TolerancePolicySchema = z.object({
  priceIncreasePercentTolerance: z.number().min(0),
  allowedTierDowngrades: z.array(SupportTierSchema),
  allowedRemovedEntitlements: z.array(z.string().trim().toLowerCase()),
  refundWindowReductionDaysTolerance: z.number().int().min(0),
});

export type TolerancePolicy = z.infer<typeof TolerancePolicySchema>;

// ----------------------------------------------------------------------------
// 4. Baseline Commitments (Frozen at Authorization)
// ----------------------------------------------------------------------------

export const BaselineCommitmentsSchema = z.object({
  offerName: z.string().trim().min(1),
  description: z.string(),
  price: z.number().int().min(0),
  currency: z.string().trim().toUpperCase(),
  billingInterval: z.string().trim().toLowerCase(),
  duration: z.number().int().min(0),
  refundWindowDays: z.number().int().min(0),
  supportTerms: z.string(),
  semanticTerms: z.string(),
  structuredCommitments: StructuredCommitmentsSchema,
});

export type BaselineCommitments = z.infer<typeof BaselineCommitmentsSchema>;

// ----------------------------------------------------------------------------
// 5. Authorization Envelope Model & DTOs
// ----------------------------------------------------------------------------

export interface AuthorizationEnvelopeModel {
  id: string;
  userId: string;
  merchantId: string;
  subscriptionId: string | null;
  mandateId: string | null;
  authorizedOfferVersionId: string;
  authorizedOfferHash: string;
  baselineCommitments: BaselineCommitments;
  financialConstraints: FinancialConstraints;
  agentPermissions: AgentPermissions;
  tolerancePolicy: TolerancePolicy;
  authorizationPolicyHash: string;
  status: AuthorizationEnvelopeStatus;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
}

export interface AuthorizationEnvelopeDTO {
  id: string;
  userId: string;
  merchantId: string;
  subscriptionId: string | null;
  mandateId: string | null;
  authorizedOfferVersionId: string;
  authorizedOfferHash: string;
  baselineCommitments: BaselineCommitments;
  financialConstraints: FinancialConstraints;
  agentPermissions: AgentPermissions;
  tolerancePolicy: TolerancePolicy;
  authorizationPolicyHash: string;
  status: AuthorizationEnvelopeStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

export interface CreateEnvelopeInput {
  userId: string;
  offerId: string;
  mandateId?: string | null;
  subscriptionId?: string | null;
  financialConstraints?: Partial<FinancialConstraints>;
  agentPermissions?: Partial<AgentPermissions>;
  tolerancePolicy?: Partial<TolerancePolicy>;
  expiresAt?: Date | null;
}

// ----------------------------------------------------------------------------
// 6. Normalization & Policy Hashing (SHA-256)
// ----------------------------------------------------------------------------

function canonicalizeObject(val: unknown): unknown {
  if (val === null || typeof val !== "object") {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(canonicalizeObject);
  }
  const obj = val as Record<string, unknown>;
  const sortedKeys = Object.keys(obj).sort();
  const res: Record<string, unknown> = {};
  for (const k of sortedKeys) {
    if (obj[k] !== undefined) {
      res[k] = canonicalizeObject(obj[k]);
    }
  }
  return res;
}

export function normalizeFinancialConstraints(
  raw: FinancialConstraints,
): FinancialConstraints {
  const parsed = FinancialConstraintsSchema.parse(raw);
  return {
    maxPricePaise: Math.round(parsed.maxPricePaise),
    allowedCurrencies: Array.from(
      new Set(parsed.allowedCurrencies.map((c) => c.trim().toUpperCase())),
    ).sort(),
    maxPriceIncreasePercent: parsed.maxPriceIncreasePercent,
    allowedBillingIntervals: Array.from(
      new Set(parsed.allowedBillingIntervals.map((i) => i.trim().toLowerCase())),
    ).sort(),
  };
}

export function normalizeAgentPermissions(
  raw: AgentPermissions,
): AgentPermissions {
  const parsed = AgentPermissionsSchema.parse(raw);
  return {
    canAutoApproveMinorChanges: parsed.canAutoApproveMinorChanges,
    canAutoPauseOnBreach: parsed.canAutoPauseOnBreach,
    canApproveRefundRequest: parsed.canApproveRefundRequest,
    canMigrateToNewVersion: parsed.canMigrateToNewVersion,
  };
}

export function normalizeTolerancePolicy(
  raw: TolerancePolicy,
): TolerancePolicy {
  const parsed = TolerancePolicySchema.parse(raw);
  return {
    priceIncreasePercentTolerance: parsed.priceIncreasePercentTolerance,
    allowedTierDowngrades: Array.from(new Set(parsed.allowedTierDowngrades)).sort(),
    allowedRemovedEntitlements: Array.from(
      new Set(parsed.allowedRemovedEntitlements.map((e) => e.trim().toLowerCase())),
    ).sort(),
    refundWindowReductionDaysTolerance: Math.round(
      parsed.refundWindowReductionDaysTolerance,
    ),
  };
}

export function normalizeBaselineCommitments(
  raw: BaselineCommitments,
): BaselineCommitments {
  const parsed = BaselineCommitmentsSchema.parse(raw);
  return {
    offerName: parsed.offerName.trim(),
    description: parsed.description.trim(),
    price: Math.round(parsed.price),
    currency: parsed.currency.trim().toUpperCase(),
    billingInterval: parsed.billingInterval.trim().toLowerCase(),
    duration: Math.round(parsed.duration),
    refundWindowDays: Math.round(parsed.refundWindowDays),
    supportTerms: parsed.supportTerms.trim(),
    semanticTerms: parsed.semanticTerms.trim(),
    structuredCommitments: normalizeStructuredCommitments(
      parsed.structuredCommitments,
    ),
  };
}

/**
 * Computes a deterministic SHA-256 fingerprint for the authorization policy
 * (financial constraints + agent permissions + tolerance policy).
 */
export function computeAuthorizationPolicyHash(policy: {
  financialConstraints: FinancialConstraints;
  agentPermissions: AgentPermissions;
  tolerancePolicy: TolerancePolicy;
}): string {
  const normalizedFinancial = normalizeFinancialConstraints(
    policy.financialConstraints,
  );
  const normalizedPermissions = normalizeAgentPermissions(
    policy.agentPermissions,
  );
  const normalizedTolerance = normalizeTolerancePolicy(policy.tolerancePolicy);

  const payload = {
    agentPermissions: normalizedPermissions,
    financialConstraints: normalizedFinancial,
    tolerancePolicy: normalizedTolerance,
  };

  const canonical = canonicalizeObject(payload);
  const serialized = JSON.stringify(canonical);
  return crypto.createHash("sha256").update(serialized, "utf8").digest("hex");
}
