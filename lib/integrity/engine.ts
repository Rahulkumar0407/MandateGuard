import type {
  IntegrityBaseline,
  IntegrityCurrent,
  IntegrityFinding,
  IntegrityFindingType,
  IntegrityReport,
  IntegrityStatus,
} from "./types";
import { comparePrice } from "./price";
import { compareEntitlements } from "./entitlements";
import { compareDuration } from "./duration";
import { compareRefund } from "./refund";

// Finding types that represent an actual difference (vs a purely informational
// "no change / could not compare" state). Used to derive `overall`.
const CHANGE_TYPES = new Set<IntegrityFindingType>([
  "PRICE_INCREASED",
  "PRICE_DECREASED",
  "PRICE_CURRENCY_CHANGED",
  "ENTITLEMENT_REMOVED",
  "ENTITLEMENT_ADDED",
  "DURATION_REDUCED",
  "DURATION_INCREASED",
  "REFUND_WINDOW_REDUCED",
  "REFUND_WINDOW_REMOVED",
  "REFUND_WINDOW_INCREASED",
]);

// STEP 17 — the engine is pure and side-effect free. No database writes, no
// Razorpay calls, no LLM. It returns structured evidence only.
//
// Pipeline:
//   1. Guard: no current offer -> CURRENT_OFFER_UNAVAILABLE.
//   2. Guard: product lineage mismatch -> LINEAGE_MISMATCH (never compare).
//   3. Run each deterministic dimension against the immutable baseline.
//   4. Derive overall = CHANGED when any difference was found.
export function evaluateIntegrity(params: {
  mandateId: string;
  baseline: IntegrityBaseline;
  current: IntegrityCurrent | null;
  generatedAt?: string;
}): IntegrityReport {
  const { mandateId, baseline, current, generatedAt } = params;
  const generatedAtStr = generatedAt ?? new Date().toISOString();

  // STEP 14 — no active current offer exists: do not invent one.
  if (!current) {
    return {
      mandateId,
      baselineOfferVersion: baseline.offerVersion,
      currentOfferVersion: null,
      overall: "CURRENT_OFFER_UNAVAILABLE",
      findings: [
        {
          dimension: "LINEAGE",
          severity: "INFO",
          type: "CURRENT_OFFER_UNAVAILABLE",
          baseline: {
            productId: baseline.productId,
            offerVersion: baseline.offerVersion,
          },
          current: null,
          evidence: `No active current offer found for product ${baseline.productId}; integrity comparison could not be performed.`,
        },
      ],
      generatedAt: generatedAtStr,
    };
  }

  // STEP 15 — product-lineage safety: never compare across different products.
  if (current.productId !== baseline.productId) {
    return {
      mandateId,
      baselineOfferVersion: baseline.offerVersion,
      currentOfferVersion: current.offerVersion,
      overall: "LINEAGE_MISMATCH",
      findings: [
        {
          dimension: "LINEAGE",
          severity: "CRITICAL",
          type: "LINEAGE_MISMATCH",
          baseline: {
            productId: baseline.productId,
            offerVersion: baseline.offerVersion,
          },
          current: {
            productId: current.productId,
            offerVersion: current.offerVersion,
          },
          evidence: `Current offer belongs to product ${current.productId} but the authorized baseline is product ${baseline.productId}; cross-product comparison is not permitted.`,
        },
      ],
      generatedAt: generatedAtStr,
    };
  }

  const findings: IntegrityFinding[] = [
    ...comparePrice(baseline, current),
    ...compareEntitlements(baseline, current),
    ...compareDuration(baseline, current),
    ...compareRefund(baseline, current),
  ];

  const overall: IntegrityStatus = findings.some((f) =>
    CHANGE_TYPES.has(f.type),
  )
    ? "CHANGED"
    : "UNCHANGED";

  return {
    mandateId,
    baselineOfferVersion: baseline.offerVersion,
    currentOfferVersion: current.offerVersion,
    overall,
    findings,
    generatedAt: generatedAtStr,
  };
}
