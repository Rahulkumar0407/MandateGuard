// M4-A — Deterministic Offer Integrity Engine
//
// The engine compares the IMMUTABLE AuthorizedOfferSnapshot (what the user
// authorized) against the CURRENT merchant offer of the SAME product lineage.
// It is strictly a DETECTION layer: it reports WHAT changed, FROM what, TO what.
//
// It makes NO policy decision (pause / resume / charge / re-baseline). It NEVER
// calls an LLM or any semantic AI. M5-A adds a semantic evaluator (see
// lib/integrity/semantic.ts) whose findings are appended to this report without
// altering the deterministic core below.

import type {
  SemanticEvaluationStatus,
  SemanticFinding,
} from "./semantic";

export type IntegrityDimension =
  | "PRICE"
  | "ENTITLEMENTS"
  | "DURATION"
  | "REFUND"
  | "LINEAGE";

export type IntegritySeverity = "INFO" | "WARNING" | "CRITICAL";

export type IntegrityFindingType =
  | "PRICE_UNCHANGED"
  | "PRICE_INCREASED"
  | "PRICE_DECREASED"
  | "PRICE_CURRENCY_CHANGED"
  | "PRICE_COMPARISON_UNAVAILABLE"
  | "ENTITLEMENT_REMOVED"
  | "ENTITLEMENT_ADDED"
  | "DURATION_UNCHANGED"
  | "DURATION_REDUCED"
  | "DURATION_INCREASED"
  | "REFUND_UNCHANGED"
  | "REFUND_WINDOW_REDUCED"
  | "REFUND_WINDOW_REMOVED"
  | "REFUND_WINDOW_INCREASED"
  | "LINEAGE_MISMATCH"
  | "CURRENT_OFFER_UNAVAILABLE";

// Every finding answers: WHAT changed? FROM what? TO what?
export interface IntegrityFinding {
  dimension: IntegrityDimension;
  severity: IntegritySeverity;
  type: IntegrityFindingType;
  // The frozen authorized value(s).
  baseline: unknown;
  // The current merchant value(s).
  current: unknown;
  // Human-readable, factual evidence string.
  evidence: string;
  // Optional structured extras (e.g. percentageChange, removed keys).
  meta?: Record<string, unknown>;
}

// Controlled overall states. "CHANGED" merely means one or more deterministic
// differences were found — it does NOT mean "pause = true". That belongs to the
// future policy layer.
export type IntegrityStatus =
  | "UNCHANGED"
  | "CHANGED"
  | "CURRENT_OFFER_UNAVAILABLE"
  | "LINEAGE_MISMATCH";

export interface IntegrityReport {
  mandateId: string;
  baselineOfferVersion: number;
  currentOfferVersion: number | null;
  overall: IntegrityStatus;
  // Deterministic (M4) findings — never mutated by the semantic evaluator.
  findings: IntegrityFinding[];
  // Semantic (M5) findings — additive only. Absent when not computed (e.g.
  // direct M4 engine usage); the IntegrityService always populates them.
  semanticStatus?: SemanticEvaluationStatus;
  semanticFindings?: SemanticFinding[];
  generatedAt: string;
}

// The report produced by IntegrityService: deterministic M4 findings plus the
// semantic M5 evaluation status and findings (always populated by the service).
export interface CombinedIntegrityReport extends IntegrityReport {
  semanticStatus: SemanticEvaluationStatus;
  semanticFindings: SemanticFinding[];
}

// Normalized inputs to the pure engine. The immutable AuthorizedOfferSnapshot
// maps onto IntegrityBaseline; an OfferModel / OfferDetailDTO maps onto
// IntegrityCurrent. Keeping the engine decoupled from Prisma/merchant DTOs lets
// M5 add a semantic evaluator without rewriting the deterministic core.
export interface IntegrityBaseline {
  productId: string;
  offerVersion: number;
  price: number;
  currency: string;
  billingInterval: string;
  duration: number;
  entitlementKeys: string[];
  refundWindowDays: number;
}

export interface IntegrityCurrent {
  productId: string;
  offerVersion: number;
  price: number;
  currency: string;
  billingInterval: string;
  duration: number;
  entitlementKeys: string[];
  refundWindowDays: number;
}
