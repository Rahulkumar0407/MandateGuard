import { z } from "zod";
import crypto from "crypto";

// ============================================================================
// M9 Phase 1: Structured Commercial Commitments & Content Fingerprinting
//
// Core Invariant:
// Merchant commitments become machine-readable and merchant-confirmed BEFORE
// they are treated as authoritative deterministic truth.
// AI suggestions are non-authoritative candidates until explicit merchant confirmation.
// ============================================================================

export type SupportTier =
  | "community"
  | "standard_email"
  | "priority_email"
  | "dedicated_mentor"
  | "dedicated_engineer";

export type DeliveryType =
  | "instant_access"
  | "scheduled_cohort"
  | "continuous_saas";

export type RefundType =
  | "no_questions_asked"
  | "conditional"
  | "non_refundable";

export interface SupportCommitment {
  tier: SupportTier;
  slaHours: number | null;
  oneOnOneSessionsPerMonth: number;
  hasDedicatedHuman: boolean;
}

export interface EntitlementCommitment {
  keys: string[];
  criticalKeys: string[];
}

export interface UsageLimitCommitment {
  apiRequestsPerMonth: number | null;
  concurrentSeats: number;
  computeCredits: number | null;
}

export interface DeliveryCommitment {
  type: DeliveryType;
  commitmentSLA: string | null;
}

export interface RefundPolicyCommitment {
  windowDays: number;
  type: RefundType;
}

export interface StructuredCommitments {
  support: SupportCommitment;
  entitlements: EntitlementCommitment;
  usageLimits: UsageLimitCommitment;
  delivery: DeliveryCommitment;
  refundPolicy: RefundPolicyCommitment;
}

// ----------------------------------------------------------------------------
// Zod Validation Schemas
// ----------------------------------------------------------------------------

export const SupportTierSchema = z.enum([
  "community",
  "standard_email",
  "priority_email",
  "dedicated_mentor",
  "dedicated_engineer",
]);

export const DeliveryTypeSchema = z.enum([
  "instant_access",
  "scheduled_cohort",
  "continuous_saas",
]);

export const RefundTypeSchema = z.enum([
  "no_questions_asked",
  "conditional",
  "non_refundable",
]);

export const SupportCommitmentSchema = z.object({
  tier: SupportTierSchema,
  slaHours: z.number().int().min(0).nullable(),
  oneOnOneSessionsPerMonth: z.number().int().min(0),
  hasDedicatedHuman: z.boolean(),
});

export const EntitlementCommitmentSchema = z
  .object({
    keys: z.array(z.string().trim().min(1)),
    criticalKeys: z.array(z.string().trim().min(1)),
  })
  .superRefine((data, ctx) => {
    // 1. Check for duplicate keys
    const lowerKeys = data.keys.map((k) => k.toLowerCase());
    const uniqueKeys = new Set(lowerKeys);
    if (uniqueKeys.size !== lowerKeys.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Duplicate entitlement keys found.",
        path: ["keys"],
      });
    }

    // 2. Check that every criticalKey exists in keys
    for (let i = 0; i < data.criticalKeys.length; i++) {
      const crit = data.criticalKeys[i].toLowerCase();
      if (!uniqueKeys.has(crit)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Critical entitlement '${data.criticalKeys[i]}' must be present in entitlement keys.`,
          path: ["criticalKeys", i],
        });
      }
    }
  });

export const UsageLimitCommitmentSchema = z.object({
  apiRequestsPerMonth: z.number().int().min(0).nullable(),
  concurrentSeats: z.number().int().min(1),
  computeCredits: z.number().int().min(0).nullable(),
});

export const DeliveryCommitmentSchema = z.object({
  type: DeliveryTypeSchema,
  commitmentSLA: z.string().trim().nullable(),
});

export const RefundPolicyCommitmentSchema = z.object({
  windowDays: z.number().int().min(0),
  type: RefundTypeSchema,
});

export const StructuredCommitmentsSchema = z.object({
  support: SupportCommitmentSchema,
  entitlements: EntitlementCommitmentSchema,
  usageLimits: UsageLimitCommitmentSchema,
  delivery: DeliveryCommitmentSchema,
  refundPolicy: RefundPolicyCommitmentSchema,
});

// ----------------------------------------------------------------------------
// Normalization & Canonicalization
// ----------------------------------------------------------------------------

/**
 * Normalizes StructuredCommitments into a deterministic canonical form:
 * - Entitlement and critical keys are trimmed, lowercased, and sorted alphabetically.
 * - String fields are trimmed.
 * - Empty SLA/strings are canonicalized to null.
 */
export function normalizeStructuredCommitments(
  raw: StructuredCommitments,
): StructuredCommitments {
  const rawKeys = new Set(
    (raw.entitlements?.keys ?? []).map((k) => k.trim().toLowerCase()),
  );
  const sanitizedRaw = {
    ...raw,
    entitlements: {
      ...raw.entitlements,
      criticalKeys: (raw.entitlements?.criticalKeys ?? []).filter((k) =>
        rawKeys.has(k.trim().toLowerCase()),
      ),
    },
  };
  const parsed = StructuredCommitmentsSchema.parse(sanitizedRaw);

  const normalizedKeys = Array.from(
    new Set(parsed.entitlements.keys.map((k) => k.trim().toLowerCase())),
  ).sort();

  const normalizedCritical = Array.from(
    new Set(parsed.entitlements.criticalKeys.map((k) => k.trim().toLowerCase())),
  ).sort();

  return {
    support: {
      tier: parsed.support.tier,
      slaHours: parsed.support.slaHours,
      oneOnOneSessionsPerMonth: parsed.support.oneOnOneSessionsPerMonth,
      hasDedicatedHuman: parsed.support.hasDedicatedHuman,
    },
    entitlements: {
      keys: normalizedKeys,
      criticalKeys: normalizedCritical,
    },
    usageLimits: {
      apiRequestsPerMonth: parsed.usageLimits.apiRequestsPerMonth,
      concurrentSeats: parsed.usageLimits.concurrentSeats,
      computeCredits: parsed.usageLimits.computeCredits,
    },
    delivery: {
      type: parsed.delivery.type,
      commitmentSLA: parsed.delivery.commitmentSLA?.trim() || null,
    },
    refundPolicy: {
      windowDays: parsed.refundPolicy.windowDays,
      type: parsed.refundPolicy.type,
    },
  };
}

// ----------------------------------------------------------------------------
// Deterministic Content Fingerprinting (SHA-256)
// ----------------------------------------------------------------------------

export interface CanonicalOfferInput {
  productId: string;
  version: number;
  price: number;
  currency: string;
  billingInterval: string;
  duration: number;
  refundWindowDays: number;
  structuredCommitments: StructuredCommitments;
}

function canonicalizeValue(val: unknown): unknown {
  if (val === null || typeof val !== "object") {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(canonicalizeValue);
  }
  const obj = val as Record<string, unknown>;
  const sortedKeys = Object.keys(obj).sort();
  const res: Record<string, unknown> = {};
  for (const k of sortedKeys) {
    if (obj[k] !== undefined) {
      res[k] = canonicalizeValue(obj[k]);
    }
  }
  return res;
}

/**
 * Computes a deterministic SHA-256 content fingerprint for an offer version.
 * 
 * Note on terminology:
 * This is a deterministic content fingerprint for drift/integrity detection.
 * It is NOT an asymmetric cryptographic digital signature.
 */
export function computeOfferVersionHash(input: CanonicalOfferInput): string {
  const normalizedCommitments = normalizeStructuredCommitments(
    input.structuredCommitments,
  );

  // Canonical canonical representation with stable key ordering
  const canonicalPayload = {
    billingInterval: input.billingInterval.trim().toLowerCase(),
    currency: input.currency.trim().toUpperCase(),
    duration: Math.round(input.duration),
    price: Math.round(input.price),
    productId: input.productId.trim(),
    refundWindowDays: Math.round(input.refundWindowDays),
    structuredCommitments: normalizedCommitments,
    version: Math.round(input.version),
  };

  const canonicalObj = canonicalizeValue(canonicalPayload);
  const serialized = JSON.stringify(canonicalObj);
  return crypto.createHash("sha256").update(serialized, "utf8").digest("hex");
}

// ----------------------------------------------------------------------------
// Candidate Extraction Stub (Non-authoritative AI/rule-based assistant)
// ----------------------------------------------------------------------------

export interface StructuredCommitmentsCandidate {
  commitments: StructuredCommitments;
  isConfirmedByMerchant: false;
  extractedFrom: {
    description: string;
    supportTerms: string;
    semanticTerms: string;
  };
  confidence: number;
}

/**
 * Extracts structured commitment suggestions from merchant unstructured text.
 * 
 * AI / heuristic output is strictly NON-AUTHORITATIVE until explicitly confirmed
 * by the merchant.
 */
export function extractStructuredCommitmentCandidate(input: {
  description: string;
  supportTerms: string;
  semanticTerms: string;
  entitlementKeys: string[];
  refundWindowDays?: number;
}): StructuredCommitmentsCandidate {
  const text = `${input.description} ${input.supportTerms} ${input.semanticTerms}`.toLowerCase();

  // Support tier heuristic suggestion
  let tier: SupportTier = "standard_email";
  let hasDedicatedHuman = false;
  let slaHours: number | null = 48;
  let oneOnOneSessionsPerMonth = 0;

  if (text.includes("dedicated engineer") || text.includes("dedicated senior engineer")) {
    tier = "dedicated_engineer";
    hasDedicatedHuman = true;
    slaHours = 12;
  } else if (text.includes("mentor") || text.includes("1:1") || text.includes("one-on-one")) {
    tier = "dedicated_mentor";
    hasDedicatedHuman = true;
    slaHours = 24;
    oneOnOneSessionsPerMonth = 4;
  } else if (text.includes("priority") || text.includes("24-hour") || text.includes("24h")) {
    tier = "priority_email";
    slaHours = 24;
  } else if (text.includes("discord") || text.includes("community only") || text.includes("forum")) {
    tier = "community";
    slaHours = null;
    hasDedicatedHuman = false;
    oneOnOneSessionsPerMonth = 0;
  }

  // Critical entitlements
  const criticalKeys = input.entitlementKeys.filter((k) => {
    const lk = k.toLowerCase();
    return lk.includes("mentor") || lk.includes("mock") || lk.includes("core") || lk.includes("pro");
  });

  const candidateCommitments: StructuredCommitments = {
    support: {
      tier,
      slaHours,
      oneOnOneSessionsPerMonth,
      hasDedicatedHuman,
    },
    entitlements: {
      keys: input.entitlementKeys.length > 0 ? input.entitlementKeys : ["core_service"],
      criticalKeys: criticalKeys.length > 0 ? criticalKeys : (input.entitlementKeys.slice(0, 1) || ["core_service"]),
    },
    usageLimits: {
      apiRequestsPerMonth: null,
      concurrentSeats: 1,
      computeCredits: null,
    },
    delivery: {
      type: "continuous_saas",
      commitmentSLA: slaHours ? `${slaHours}-hour turnaround` : null,
    },
    refundPolicy: {
      windowDays: input.refundWindowDays ?? 30,
      type: (input.refundWindowDays ?? 30) > 0 ? "conditional" : "non_refundable",
    },
  };

  return {
    commitments: normalizeStructuredCommitments(candidateCommitments),
    isConfirmedByMerchant: false,
    extractedFrom: {
      description: input.description,
      supportTerms: input.supportTerms,
      semanticTerms: input.semanticTerms,
    },
    confidence: 0.85,
  };
}
