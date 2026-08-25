import type {
  CompatibilityDimension,
  CompatibilityFinding,
  CompatibilityStatus,
  EnvelopeTarget,
  FindingSeverity,
  ProposedOfferInput,
} from "./types";
import type { SupportTier } from "@/lib/merchant/structured-commitments";

const SUPPORT_TIER_RANK: Record<SupportTier, number> = {
  dedicated_engineer: 5,
  dedicated_mentor: 4,
  priority_email: 3,
  standard_email: 2,
  community: 1,
};

function determineOverallStatus(findings: CompatibilityFinding[]): CompatibilityStatus {
  if (findings.some((f) => f.severity === "CRITICAL")) {
    return "BREAKING";
  }
  if (findings.some((f) => f.severity === "WARNING")) {
    return "REVIEW";
  }
  return "COMPATIBLE";
}

function generateSummary(
  status: CompatibilityStatus,
  findings: CompatibilityFinding[],
): string {
  const critical = findings.filter((f) => f.severity === "CRITICAL");
  const warnings = findings.filter((f) => f.severity === "WARNING");

  if (status === "BREAKING") {
    const reasons = critical.map((c) => c.message).join(" ");
    return `BREAKING: Proposed offer breaches authorized commercial envelope constraints. ${reasons}`;
  }
  if (status === "REVIEW") {
    const reasons = warnings.map((w) => w.message).join(" ");
    return `REVIEW REQUIRED: Proposed offer contains commercial changes exceeding automated tolerance. ${reasons}`;
  }
  return "COMPATIBLE: Proposed offer conforms fully to the authorized commercial envelope and tolerances.";
}

/**
 * Pure, deterministic evaluation of a proposed OfferVersion against the
 * immutable baseline and policies of an AuthorizationEnvelope.
 */
export function evaluateDeterministicCompatibility(params: {
  envelope: EnvelopeTarget;
  proposed: ProposedOfferInput;
}): {
  status: CompatibilityStatus;
  findings: CompatibilityFinding[];
  summary: string;
} {
  const { envelope, proposed } = params;
  const findings: CompatibilityFinding[] = [];

  const addFinding = (
    dimension: CompatibilityDimension,
    severity: FindingSeverity,
    code: string,
    message: string,
    baselineValue?: unknown,
    proposedValue?: unknown,
    isPermittedByTolerance = false,
  ) => {
    findings.push({
      dimension,
      severity,
      code,
      message,
      baselineValue,
      proposedValue,
      isPermittedByTolerance,
    });
  };

  // --------------------------------------------------------------------------
  // 1. Financial Evaluation
  // --------------------------------------------------------------------------
  const basePrice = envelope.baselineCommitments.price;
  const proposedPrice = proposed.price;
  const maxPricePaise = envelope.financialConstraints.maxPricePaise;
  const maxPriceIncreasePercent =
    envelope.financialConstraints.maxPriceIncreasePercent;
  const priceIncreasePercentTolerance =
    envelope.tolerancePolicy.priceIncreasePercentTolerance;

  // Price ceiling check
  if (proposedPrice > maxPricePaise) {
    addFinding(
      "FINANCIAL",
      "CRITICAL",
      "PRICE_CEILING_BREACH",
      `Proposed price of ₹${(proposedPrice / 100).toFixed(2)} exceeds authorized ceiling of ₹${(maxPricePaise / 100).toFixed(2)}.`,
      basePrice,
      proposedPrice,
    );
  } else if (proposedPrice > basePrice) {
    const pctIncrease =
      basePrice > 0 ? ((proposedPrice - basePrice) / basePrice) * 100 : 0;

    if (pctIncrease > maxPriceIncreasePercent) {
      addFinding(
        "FINANCIAL",
        "CRITICAL",
        "PRICE_INCREASE_EXCEEDS_MAX_ALLOWED",
        `Price increased by ${pctIncrease.toFixed(1)}%, exceeding maximum authorized increase threshold of ${maxPriceIncreasePercent}%.`,
        basePrice,
        proposedPrice,
      );
    } else if (pctIncrease > priceIncreasePercentTolerance) {
      addFinding(
        "FINANCIAL",
        "WARNING",
        "PRICE_INCREASE_EXCEEDS_TOLERANCE",
        `Price increased by ${pctIncrease.toFixed(1)}%, exceeding automated tolerance of ${priceIncreasePercentTolerance}%. Review required.`,
        basePrice,
        proposedPrice,
      );
    } else {
      addFinding(
        "FINANCIAL",
        "INFO",
        "PRICE_WITHIN_TOLERANCE",
        `Price increased by ${pctIncrease.toFixed(1)}%, within authorized tolerance of ${priceIncreasePercentTolerance}%.`,
        basePrice,
        proposedPrice,
        true,
      );
    }
  } else if (proposedPrice < basePrice) {
    addFinding(
      "FINANCIAL",
      "INFO",
      "PRICE_DECREASED",
      `Price decreased from ₹${(basePrice / 100).toFixed(2)} to ₹${(proposedPrice / 100).toFixed(2)}.`,
      basePrice,
      proposedPrice,
    );
  } else {
    addFinding(
      "FINANCIAL",
      "INFO",
      "PRICE_UNCHANGED",
      `Price unchanged at ₹${(basePrice / 100).toFixed(2)}.`,
      basePrice,
      proposedPrice,
    );
  }

  // Currency validation
  const allowedCurrencies = envelope.financialConstraints.allowedCurrencies.map(
    (c) => c.toUpperCase(),
  );
  const proposedCurrency = proposed.currency.toUpperCase();
  if (!allowedCurrencies.includes(proposedCurrency)) {
    addFinding(
      "FINANCIAL",
      "CRITICAL",
      "CURRENCY_NOT_ALLOWED",
      `Proposed currency '${proposedCurrency}' is not in authorized allowed currencies [${allowedCurrencies.join(", ")}].`,
      envelope.baselineCommitments.currency,
      proposedCurrency,
    );
  }

  // Billing interval validation
  const allowedIntervals =
    envelope.financialConstraints.allowedBillingIntervals.map((i) =>
      i.toLowerCase(),
    );
  const proposedInterval = proposed.billingInterval.toLowerCase();
  if (!allowedIntervals.includes(proposedInterval)) {
    addFinding(
      "FINANCIAL",
      "CRITICAL",
      "BILLING_INTERVAL_NOT_ALLOWED",
      `Proposed billing interval '${proposedInterval}' is not in authorized allowed intervals [${allowedIntervals.join(", ")}].`,
      envelope.baselineCommitments.billingInterval,
      proposedInterval,
    );
  }

  // --------------------------------------------------------------------------
  // 2. Entitlements Evaluation
  // --------------------------------------------------------------------------
  const baseCommitments = envelope.baselineCommitments.structuredCommitments;
  const baseKeys = baseCommitments.entitlements.keys.map((k) =>
    k.toLowerCase(),
  );
  const baseCriticalKeys = baseCommitments.entitlements.criticalKeys.map((k) =>
    k.toLowerCase(),
  );

  const proposedKeys = (
    proposed.structuredCommitments?.entitlements.keys ??
    proposed.entitlementKeys ??
    []
  ).map((k) => k.toLowerCase());

  const allowedRemoved = new Set(
    envelope.tolerancePolicy.allowedRemovedEntitlements.map((k) =>
      k.toLowerCase(),
    ),
  );

  // Critical entitlements removed
  const removedCritical = baseCriticalKeys.filter(
    (k) => !proposedKeys.includes(k),
  );
  for (const k of removedCritical) {
    if (allowedRemoved.has(k)) {
      addFinding(
        "ENTITLEMENTS",
        "INFO",
        "PERMITTED_ENTITLEMENT_REMOVAL",
        `Critical entitlement '${k}' was removed but is explicitly permitted by tolerance policy.`,
        k,
        null,
        true,
      );
    } else {
      addFinding(
        "ENTITLEMENTS",
        "CRITICAL",
        "CRITICAL_ENTITLEMENT_REMOVED",
        `Critical authorized entitlement '${k}' was removed in the proposed offer.`,
        k,
        null,
      );
    }
  }

  // Non-critical entitlements removed
  const removedNonCritical = baseKeys.filter(
    (k) => !baseCriticalKeys.includes(k) && !proposedKeys.includes(k),
  );
  for (const k of removedNonCritical) {
    if (allowedRemoved.has(k)) {
      addFinding(
        "ENTITLEMENTS",
        "INFO",
        "PERMITTED_ENTITLEMENT_REMOVAL",
        `Entitlement '${k}' was removed but is explicitly permitted by tolerance policy.`,
        k,
        null,
        true,
      );
    } else {
      addFinding(
        "ENTITLEMENTS",
        "WARNING",
        "NON_CRITICAL_ENTITLEMENT_REMOVED",
        `Authorized entitlement '${k}' was removed in the proposed offer. Review required.`,
        k,
        null,
      );
    }
  }

  // Added entitlements
  const addedKeys = proposedKeys.filter((k) => !baseKeys.includes(k));
  if (addedKeys.length > 0) {
    addFinding(
      "ENTITLEMENTS",
      "INFO",
      "ENTITLEMENTS_ADDED",
      `New entitlement(s) added: ${addedKeys.join(", ")}.`,
      [],
      addedKeys,
    );
  } else if (removedCritical.length === 0 && removedNonCritical.length === 0) {
    addFinding(
      "ENTITLEMENTS",
      "INFO",
      "ENTITLEMENTS_UNCHANGED",
      "Authorized entitlements unchanged.",
    );
  }

  // --------------------------------------------------------------------------
  // 3. Support Commitments Evaluation
  // --------------------------------------------------------------------------
  const baseSupport = baseCommitments.support;
  const propSupport = proposed.structuredCommitments?.support;

  if (propSupport) {
    const baseTier = baseSupport.tier;
    const propTier = propSupport.tier;
    const allowedTierDowngrades =
      envelope.tolerancePolicy.allowedTierDowngrades;

    if (baseTier !== propTier) {
      if (allowedTierDowngrades.includes(propTier)) {
        addFinding(
          "SUPPORT",
          "INFO",
          "PERMITTED_TIER_DOWNGRADE",
          `Support tier changed from '${baseTier}' to '${propTier}', permitted by tolerance policy.`,
          baseTier,
          propTier,
          true,
        );
      } else {
        const baseRank = SUPPORT_TIER_RANK[baseTier] ?? 0;
        const propRank = SUPPORT_TIER_RANK[propTier] ?? 0;

        if (propRank < baseRank) {
          if (baseSupport.hasDedicatedHuman && !propSupport.hasDedicatedHuman) {
            addFinding(
              "SUPPORT",
              "CRITICAL",
              "DEDICATED_HUMAN_LOST",
              `Authorized dedicated human support was removed (tier changed from '${baseTier}' to '${propTier}').`,
              baseTier,
              propTier,
            );
          } else {
            addFinding(
              "SUPPORT",
              "WARNING",
              "SUPPORT_TIER_DOWNGRADED",
              `Support tier downgraded from '${baseTier}' to '${propTier}' without tolerance permission. Review required.`,
              baseTier,
              propTier,
            );
          }
        } else {
          addFinding(
            "SUPPORT",
            "INFO",
            "SUPPORT_IMPROVED",
            `Support tier upgraded from '${baseTier}' to '${propTier}'.`,
            baseTier,
            propTier,
          );
        }
      }
    } else {
      addFinding(
        "SUPPORT",
        "INFO",
        "SUPPORT_UNCHANGED",
        `Support tier unchanged at '${baseTier}'.`,
        baseTier,
        propTier,
      );
    }

    if (
      baseSupport.hasDedicatedHuman &&
      !propSupport.hasDedicatedHuman &&
      baseTier === propTier
    ) {
      addFinding(
        "SUPPORT",
        "CRITICAL",
        "DEDICATED_HUMAN_LOST",
        "Dedicated human support removed.",
        true,
        false,
      );
    }

    if (
      baseSupport.slaHours !== null &&
      propSupport.slaHours !== null &&
      propSupport.slaHours > baseSupport.slaHours
    ) {
      addFinding(
        "SUPPORT",
        "WARNING",
        "SLA_HOURS_DEGRADED",
        `Support response SLA increased from ${baseSupport.slaHours}h to ${propSupport.slaHours}h.`,
        baseSupport.slaHours,
        propSupport.slaHours,
      );
    }

    if (
      propSupport.oneOnOneSessionsPerMonth <
      baseSupport.oneOnOneSessionsPerMonth
    ) {
      addFinding(
        "SUPPORT",
        "CRITICAL",
        "SESSIONS_REDUCED",
        `1:1 sessions reduced from ${baseSupport.oneOnOneSessionsPerMonth} to ${propSupport.oneOnOneSessionsPerMonth} per month.`,
        baseSupport.oneOnOneSessionsPerMonth,
        propSupport.oneOnOneSessionsPerMonth,
      );
    }
  }

  // --------------------------------------------------------------------------
  // 4. Usage Limits Evaluation
  // --------------------------------------------------------------------------
  const baseLimits = baseCommitments.usageLimits;
  const propLimits = proposed.structuredCommitments?.usageLimits;

  if (propLimits) {
    if (propLimits.concurrentSeats < baseLimits.concurrentSeats) {
      addFinding(
        "USAGE_LIMITS",
        "CRITICAL",
        "SEATS_REDUCED",
        `Concurrent seats reduced from ${baseLimits.concurrentSeats} to ${propLimits.concurrentSeats}.`,
        baseLimits.concurrentSeats,
        propLimits.concurrentSeats,
      );
    }

    if (
      baseLimits.apiRequestsPerMonth !== null &&
      propLimits.apiRequestsPerMonth !== null &&
      propLimits.apiRequestsPerMonth < baseLimits.apiRequestsPerMonth
    ) {
      addFinding(
        "USAGE_LIMITS",
        "WARNING",
        "API_LIMIT_REDUCED",
        `API request limit reduced from ${baseLimits.apiRequestsPerMonth}/month to ${propLimits.apiRequestsPerMonth}/month.`,
        baseLimits.apiRequestsPerMonth,
        propLimits.apiRequestsPerMonth,
      );
    }

    if (
      baseLimits.computeCredits !== null &&
      propLimits.computeCredits !== null &&
      propLimits.computeCredits < baseLimits.computeCredits
    ) {
      addFinding(
        "USAGE_LIMITS",
        "WARNING",
        "COMPUTE_CREDITS_REDUCED",
        `Compute credits reduced from ${baseLimits.computeCredits} to ${propLimits.computeCredits}.`,
        baseLimits.computeCredits,
        propLimits.computeCredits,
      );
    }
  }

  // --------------------------------------------------------------------------
  // 5. Delivery Evaluation
  // --------------------------------------------------------------------------
  const baseDelivery = baseCommitments.delivery;
  const propDelivery = proposed.structuredCommitments?.delivery;

  if (propDelivery) {
    if (propDelivery.type !== baseDelivery.type) {
      addFinding(
        "DELIVERY",
        "WARNING",
        "DELIVERY_TYPE_CHANGED",
        `Delivery type changed from '${baseDelivery.type}' to '${propDelivery.type}'.`,
        baseDelivery.type,
        propDelivery.type,
      );
    }
  }

  // --------------------------------------------------------------------------
  // 6. Refund Policy Evaluation
  // --------------------------------------------------------------------------
  const baseRefund = baseCommitments.refundPolicy;
  const propRefund = proposed.structuredCommitments?.refundPolicy ?? {
    windowDays: proposed.refundWindowDays,
    type: proposed.refundWindowDays > 0 ? "conditional" : "non_refundable",
  };

  if (propRefund.windowDays < baseRefund.windowDays) {
    const reduction = baseRefund.windowDays - propRefund.windowDays;
    const toleranceReduction =
      envelope.tolerancePolicy.refundWindowReductionDaysTolerance;

    if (reduction <= toleranceReduction) {
      addFinding(
        "REFUND",
        "INFO",
        "PERMITTED_REFUND_REDUCTION",
        `Refund window reduced by ${reduction} days, within authorized tolerance of ${toleranceReduction} days.`,
        baseRefund.windowDays,
        propRefund.windowDays,
        true,
      );
    } else {
      addFinding(
        "REFUND",
        "WARNING",
        "REFUND_WINDOW_REDUCED",
        `Refund window reduced from ${baseRefund.windowDays} to ${propRefund.windowDays} days, exceeding tolerance of ${toleranceReduction} days.`,
        baseRefund.windowDays,
        propRefund.windowDays,
      );
    }
  }

  if (baseRefund.type !== propRefund.type) {
    if (
      propRefund.type === "non_refundable" &&
      baseRefund.type !== "non_refundable"
    ) {
      addFinding(
        "REFUND",
        "CRITICAL",
        "REFUND_TYPE_DEGRADED",
        `Refund policy changed to non-refundable (was ${baseRefund.type}).`,
        baseRefund.type,
        propRefund.type,
      );
    } else if (
      baseRefund.type === "no_questions_asked" &&
      propRefund.type === "conditional"
    ) {
      addFinding(
        "REFUND",
        "WARNING",
        "REFUND_TYPE_DEGRADED",
        "Refund policy changed from no-questions-asked to conditional.",
        baseRefund.type,
        propRefund.type,
      );
    }
  }

  const overallStatus = determineOverallStatus(findings);
  const summary = generateSummary(overallStatus, findings);

  return {
    status: overallStatus,
    findings,
    summary,
  };
}
