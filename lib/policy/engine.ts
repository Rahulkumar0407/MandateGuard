import type { IntegrityReport, IntegrityFinding } from "@/lib/integrity/types";
import type { SemanticFinding } from "@/lib/integrity/semantic";
import {
  DEFAULT_POLICY,
  type IntegrityPolicy,
  type MandateDecision,
  type PolicyReason,
  type PolicyResult,
} from "./types";

// Decision priority: PAUSE > REVIEW > ALLOW (STEP 12).
const RANK: Record<MandateDecision, number> = {
  ALLOW: 0,
  REVIEW: 1,
  PAUSE: 2,
};

function maxDecision(a: MandateDecision, b: MandateDecision): MandateDecision {
  return RANK[a] >= RANK[b] ? a : b;
}

function fieldNum(value: unknown, keys: string[]): string {
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    for (const k of keys) {
      if (typeof o[k] === "number") return String(o[k]);
    }
  }
  return "?";
}

interface Scored {
  decision: MandateDecision;
  reason: PolicyReason;
}

// --- Deterministic (M4) findings -------------------------------------------------

function decideDeterministicFinding(
  f: IntegrityFinding,
  policy: IntegrityPolicy,
): Scored | null {
  const reason = (decision: MandateDecision, explanation: string): Scored => ({
    decision,
    reason: {
      findingType: f.type,
      dimension: f.dimension,
      severity: f.severity,
      explanation,
    },
  });

  switch (f.type) {
    case "PRICE_UNCHANGED":
    case "PRICE_DECREASED":
      return reason(
        "ALLOW",
        "Price unchanged or decreased versus the authorized baseline; no price degradation.",
      );

    case "PRICE_INCREASED": {
      const pct =
        typeof f.meta?.percentageChange === "number"
          ? (f.meta.percentageChange as number)
          : 0;
      if (pct >= policy.priceIncreasePausePercent) {
        return reason(
          "PAUSE",
          `Recurring price increased by ${pct}%, exceeding the ${policy.priceIncreasePausePercent}% pause threshold.`,
        );
      }
      if (pct >= policy.priceIncreaseReviewPercent) {
        return reason(
          "REVIEW",
          `Recurring price increased by ${pct}%, within the ${policy.priceIncreaseReviewPercent}%-${policy.priceIncreasePausePercent}% review band.`,
        );
      }
      return reason(
        "ALLOW",
        `Recurring price increased by ${pct}%, below the ${policy.priceIncreaseReviewPercent}% review threshold.`,
      );
    }

    case "PRICE_CURRENCY_CHANGED":
      return reason(
        "REVIEW",
        "Currency changed versus the authorized baseline; deterministic economic comparison is unreliable, requiring manual review.",
      );

    case "PRICE_COMPARISON_UNAVAILABLE":
      return reason(
        "REVIEW",
        "Price could not be normalized for deterministic comparison; manual review required.",
      );

    case "ENTITLEMENT_ADDED":
      return reason(
        "ALLOW",
        "New entitlement(s) added versus the authorized baseline; not a degradation.",
      );

    case "ENTITLEMENT_REMOVED": {
      const removed: string[] = Array.isArray(f.meta?.removed)
        ? (f.meta!.removed as string[])
        : [];
      const critical = removed.filter((k) =>
        policy.criticalEntitlements.includes(k),
      );
      if (critical.length > 0 && policy.criticalFindingPauses) {
        return reason(
          "PAUSE",
          `Critical entitlement(s) removed: ${critical.join(", ")}.`,
        );
      }
      return reason(
        "REVIEW",
        `Authorized entitlement(s) removed: ${
          removed.length ? removed.join(", ") : "unknown"
        }.`,
      );
    }

    case "DURATION_UNCHANGED":
    case "DURATION_INCREASED":
      return reason("ALLOW", "Entitlement duration unchanged or increased.");

    case "DURATION_REDUCED":
      return reason(
        "REVIEW",
        `Entitlement duration reduced from ${fieldNum(
          f.baseline,
          ["duration"],
        )} to ${fieldNum(f.current, ["duration"])} days.`,
      );

    case "REFUND_UNCHANGED":
      return reason("ALLOW", "Refund window unchanged.");

    case "REFUND_WINDOW_REDUCED":
      return reason(
        "REVIEW",
        `Refund window reduced from ${fieldNum(
          f.baseline,
          ["refundWindowDays"],
        )} to ${fieldNum(f.current, ["refundWindowDays"])} days.`,
      );

    case "REFUND_WINDOW_REMOVED":
      return reason(
        "REVIEW",
        `Refund window removed (was ${fieldNum(f.baseline, [
          "refundWindowDays",
        ])} days).`,
      );

    case "REFUND_WINDOW_INCREASED":
      return reason("ALLOW", "Refund window increased.");

    case "LINEAGE_MISMATCH":
      return reason(
        "REVIEW",
        "Offer lineage mismatch; integrity comparison could not be performed safely.",
      );

    case "CURRENT_OFFER_UNAVAILABLE":
      return reason(
        "REVIEW",
        "No current offer available for comparison; integrity evaluation incomplete.",
      );

    default:
      return null;
  }
}

// --- Semantic (M5) findings -----------------------------------------------------

function decideSemanticFinding(
  f: SemanticFinding,
  policy: IntegrityPolicy,
): Scored {
  const reason = (decision: MandateDecision, explanation: string): Scored => ({
    decision,
    reason: {
      findingType: f.type,
      dimension: "SEMANTIC",
      severity: f.severity,
      explanation,
    },
  });

  switch (f.direction) {
    case "IMPROVED":
      return reason(
        "ALLOW",
        `Semantic change improved (${f.type}); not a degradation.`,
      );

    case "NEUTRAL":
      return reason(
        "ALLOW",
        `Semantic change is neutral in meaning (${f.type}).`,
      );

    case "UNCERTAIN":
      // STEP 11 — never PAUSE on uncertain semantic evidence; at most REVIEW.
      return reason(
        "REVIEW",
        `Semantic change is uncertain (confidence ${f.confidence}); manual review required, no automatic pause.`,
      );

    case "DEGRADED": {
      const high = f.confidence >= policy.semanticPauseConfidence;
      // STEP 10 — HUMAN_TO_AUTOMATED at high confidence may force PAUSE.
      if (
        f.type === "HUMAN_TO_AUTOMATED_CHANGED" &&
        high &&
        policy.criticalFindingPauses
      ) {
        return reason(
          "PAUSE",
          `Critical service-model change: human-delivered service replaced by automation (${f.type}, confidence ${f.confidence}).`,
        );
      }
      // High-confidence degradation -> REVIEW by default; lower confidence ->
      // REVIEW at most.
      return reason(
        "REVIEW",
        `Semantic degradation detected (${f.type}, confidence ${f.confidence}); manual review required.`,
      );
    }

    default:
      return reason("ALLOW", "Semantic finding with an unhandled direction.");
  }
}

// --- Combination ---------------------------------------------------------------

// STEP 22 (M6) — a report is only "complete" when the deterministic comparison
// actually ran (UNCHANGED / CHANGED) AND the semantic evaluation was available.
// Exported so downstream layers (M7 action boundary) can apply the same
// definition instead of re-deriving it.
export function isEvaluationComplete(report: IntegrityReport): boolean {
  return (
    (report.overall === "UNCHANGED" || report.overall === "CHANGED") &&
    report.semanticStatus === "AVAILABLE"
  );
}

// Pure, deterministic policy evaluation. Given identical (findings + policy),
// the decision is always identical (STEP 16). Never returns a decision derived
// from free-form explanation text.
export function evaluatePolicy(
  report: IntegrityReport,
  policy: IntegrityPolicy = DEFAULT_POLICY,
  evaluatedAt?: string,
): PolicyResult {
  const reasons: PolicyReason[] = [];
  let decision: MandateDecision = "ALLOW";

  for (const f of report.findings ?? []) {
    const scored = decideDeterministicFinding(f, policy);
    if (scored) {
      reasons.push(scored.reason);
      decision = maxDecision(decision, scored.decision);
    }
  }

  const semanticFindings = (report.semanticFindings ?? []) as SemanticFinding[];
  for (const f of semanticFindings) {
    const scored = decideSemanticFinding(f, policy);
    reasons.push(scored.reason);
    decision = maxDecision(decision, scored.decision);
  }

  // STEP 22 — failure safety: never silently ALLOW when the integrity
  // evaluation was incomplete. Distinguish "no degradation detected" (ALLOW)
  // from "could not evaluate" (protective REVIEW).
  const evaluationComplete = isEvaluationComplete(report);

  if (!evaluationComplete && decision === "ALLOW") {
    decision = "REVIEW";
    reasons.push({
      findingType: "EVALUATION_INCOMPLETE",
      dimension: "POLICY",
      severity: "WARNING",
      explanation:
        "Integrity evaluation was incomplete or unavailable; cannot confirm no degradation, so a protective REVIEW is required instead of ALLOW.",
    });
  }

  return {
    decision, // PAUSE | REVIEW | ALLOW
    reasons,
    evaluatedAt: evaluatedAt ?? new Date().toISOString(),
    policyVersion: policy.policyVersion,
  }; // end PolicyResult
}
