import type { OfferDetailDTO } from "@/lib/merchant/types";
import type { CanonicalBuyerIntent } from "@/lib/intent/types";
import { normalizeFeatureKey } from "@/lib/intent/normalization";
import type { HardConstraintEvaluation } from "./types";

/**
 * Deterministically evaluates an offer against a CanonicalBuyerIntent's hard constraints.
 * A candidate violating any HARD constraint is immediately marked ineligible.
 */
export function evaluateHardConstraints(
  offer: OfferDetailDTO,
  intent: CanonicalBuyerIntent,
): HardConstraintEvaluation {
  const rejectionReasons: string[] = [];
  const matchedHardConstraints: string[] = [];

  // 1. Currency Match (Hard)
  if (intent.budget?.currency) {
    if (offer.currency !== intent.budget.currency) {
      rejectionReasons.push(
        `Currency mismatch: Offer uses ${offer.currency}, required ${intent.budget.currency}.`,
      );
    } else {
      matchedHardConstraints.push(`Currency: ${offer.currency}`);
    }
  }

  // 2. Budget Ceiling (Hard vs Soft)
  if (intent.budget) {
    const offerPrice = offer.price;
    const targetAmount = intent.budget.amountPaise;

    if (intent.budget.type === "HARD") {
      if (offerPrice > targetAmount) {
        rejectionReasons.push(
          `Price ₹${(offerPrice / 100).toLocaleString("en-IN")} exceeds hard budget ceiling of ₹${(
            targetAmount / 100
          ).toLocaleString("en-IN")}.`,
        );
      } else {
        matchedHardConstraints.push(
          `Price within hard ceiling: ₹${(offerPrice / 100).toLocaleString("en-IN")} <= ₹${(
            targetAmount / 100
          ).toLocaleString("en-IN")}`,
        );
      }
    } else {
      // SOFT budget: check max stretch ceiling if defined
      const maxCeiling = intent.budget.maxStretchPaise || Math.round(targetAmount * 1.25);
      if (offerPrice > maxCeiling) {
        rejectionReasons.push(
          `Price ₹${(offerPrice / 100).toLocaleString("en-IN")} exceeds maximum allowable stretch budget of ₹${(
            maxCeiling / 100
          ).toLocaleString("en-IN")}.`,
        );
      } else {
        matchedHardConstraints.push(
          `Price within soft stretch bounds: ₹${(offerPrice / 100).toLocaleString("en-IN")}`,
        );
      }
    }
  }

  // 3. Billing Cadence Match (Hard)
  if (intent.billing.cadence && intent.billing.cadence !== "any") {
    if (offer.billingInterval !== intent.billing.cadence) {
      rejectionReasons.push(
        `Billing interval mismatch: Offer is '${offer.billingInterval}', required '${intent.billing.cadence}'.`,
      );
    } else {
      matchedHardConstraints.push(`Billing cadence: ${offer.billingInterval}`);
    }
  }

  // 4. Must-Have Entitlements (Hard)
  const offerEntitlementKeys = new Set([
    ...(offer.entitlementKeys || []).map(normalizeFeatureKey),
    ...(offer.structuredCommitments?.entitlements?.keys || []).map(normalizeFeatureKey),
  ]);

  for (const mustKey of intent.mustHave) {
    const normalizedMust = normalizeFeatureKey(mustKey);
    // Allow matching human_mentor if support hasDedicatedHuman is true
    let isSatisfied = offerEntitlementKeys.has(normalizedMust);

    if (!isSatisfied) {
      if (
        normalizedMust === "human_mentor" &&
        offer.structuredCommitments?.support?.hasDedicatedHuman === true
      ) {
        isSatisfied = true;
      } else if (
        normalizedMust === "system_design_curriculum" &&
        (offer.name.toLowerCase().includes("system design") ||
          offer.description.toLowerCase().includes("system design"))
      ) {
        isSatisfied = true;
      } else if (
        normalizedMust === "dsa_curriculum" &&
        (offer.name.toLowerCase().includes("data structures") ||
          offer.name.toLowerCase().includes("dsa") ||
          offer.description.toLowerCase().includes("algorithms"))
      ) {
        isSatisfied = true;
      }
    }

    if (!isSatisfied) {
      rejectionReasons.push(`Missing required must-have entitlement: '${mustKey}'.`);
    } else {
      matchedHardConstraints.push(`Required entitlement: ${mustKey}`);
    }
  }

  // 5. Dedicated Human Support Requirement (Hard)
  if (intent.supportPreference?.hasDedicatedHuman === true) {
    const offerHasHuman =
      offer.structuredCommitments?.support != null
        ? offer.structuredCommitments.support.hasDedicatedHuman === true
        : offer.supportTerms.toLowerCase().includes("mentor") ||
          offer.supportTerms.toLowerCase().includes("human");

    if (!offerHasHuman) {
      rejectionReasons.push(
        "Offer does not provide dedicated human support (automated/community only).",
      );
    } else {
      matchedHardConstraints.push("Dedicated human support verified");
    }
  }

  // 6. Minimum 1:1 Sessions (Hard)
  if (intent.supportPreference?.minSessionsPerMonth) {
    const offerSessions =
      offer.structuredCommitments?.support?.oneOnOneSessionsPerMonth ??
      (offer.structuredCommitments?.support?.hasDedicatedHuman ? 2 : 0);
    if (offerSessions < intent.supportPreference.minSessionsPerMonth) {
      rejectionReasons.push(
        `Insufficient 1:1 sessions: Offer provides ${offerSessions}/month, required ${intent.supportPreference.minSessionsPerMonth}/month.`,
      );
    } else {
      matchedHardConstraints.push(`1:1 Sessions: ${offerSessions}/month`);
    }
  }

  // 7. Maximum Support SLA Hours (Hard)
  if (intent.supportPreference?.maxSlaHours) {
    const offerSla =
      offer.structuredCommitments?.support?.slaHours ?? 720;
    if (offerSla > intent.supportPreference.maxSlaHours) {
      rejectionReasons.push(
        `Support SLA turnaround too slow: Offer SLA is ${offerSla}h, required maximum ${intent.supportPreference.maxSlaHours}h.`,
      );
    } else {
      matchedHardConstraints.push(`Support SLA: ${offerSla}h`);
    }
  }



  // 8. Explicit Exclusions (Hard Rejection)
  for (const exclusion of intent.exclusions) {
    const normalizedExclusion = normalizeFeatureKey(exclusion);
    if (
      offerEntitlementKeys.has(normalizedExclusion) ||
      offer.description.toLowerCase().includes(normalizedExclusion)
    ) {
      rejectionReasons.push(`Contains explicitly excluded feature: '${exclusion}'.`);
    }
  }

  const isEligible = rejectionReasons.length === 0;

  return {
    isEligible,
    rejectionReasons,
    matchedHardConstraints,
  };
}
