import { computeBuyerIntentHash } from "./canonical";
import type { CanonicalBuyerIntent, IntentComparisonResult } from "./types";

/**
 * Checks if two CanonicalBuyerIntents are semantically identical based on their hashes.
 */
export function areBuyerIntentsSemanticallyEquivalent(
  a: CanonicalBuyerIntent,
  b: CanonicalBuyerIntent,
): boolean {
  return computeBuyerIntentHash(a) === computeBuyerIntentHash(b);
}

/**
 * Performs a detailed attribute-by-attribute comparison of two CanonicalBuyerIntents.
 * Classifies differences into hard constraints, soft preferences, and budget.
 */
export function compareBuyerIntents(
  a: CanonicalBuyerIntent,
  b: CanonicalBuyerIntent,
): IntentComparisonResult {
  const differences: string[] = [];

  // Category comparison
  if (a.category !== b.category) {
    differences.push(`Category mismatch: '${a.category}' vs '${b.category}'`);
  }

  // Budget comparison
  let budgetMatch = true;
  if (!a.budget && !b.budget) {
    budgetMatch = true;
  } else if (!a.budget || !b.budget) {
    budgetMatch = false;
    differences.push(
      `Budget presence mismatch: ${a.budget ? "defined" : "undefined"} vs ${
        b.budget ? "defined" : "undefined"
      }`,
    );
  } else {
    if (a.budget.amountPaise !== b.budget.amountPaise) {
      budgetMatch = false;
      differences.push(
        `Budget amount: ₹${a.budget.amountPaise / 100} vs ₹${b.budget.amountPaise / 100}`,
      );
    }
    if (a.budget.currency !== b.budget.currency) {
      budgetMatch = false;
      differences.push(`Budget currency: ${a.budget.currency} vs ${b.budget.currency}`);
    }
    if (a.budget.type !== b.budget.type) {
      budgetMatch = false;
      differences.push(`Budget constraint type: ${a.budget.type} vs ${b.budget.type}`);
    }
    if (a.budget.maxStretchPaise !== b.budget.maxStretchPaise) {
      budgetMatch = false;
      differences.push(
        `Max stretch paise: ${a.budget.maxStretchPaise} vs ${b.budget.maxStretchPaise}`,
      );
    }
  }

  // Billing comparison
  let hardConstraintMatch = true;
  if (a.billing.cadence !== b.billing.cadence) {
    hardConstraintMatch = false;
    differences.push(
      `Billing cadence: '${a.billing.cadence}' vs '${b.billing.cadence}'`,
    );
  }
  if (a.billing.isRecurring !== b.billing.isRecurring) {
    hardConstraintMatch = false;
    differences.push(
      `Billing recurring mode: ${a.billing.isRecurring} vs ${b.billing.isRecurring}`,
    );
  }

  // Must-have comparison (Hard constraints)
  const aMust = new Set(a.mustHave);
  const bMust = new Set(b.mustHave);
  for (const m of aMust) {
    if (!bMust.has(m)) {
      hardConstraintMatch = false;
      differences.push(`Missing must-have entitlement in target: '${m}'`);
    }
  }
  for (const m of bMust) {
    if (!aMust.has(m)) {
      hardConstraintMatch = false;
      differences.push(`Extra must-have entitlement in target: '${m}'`);
    }
  }

  // Support human requirements (Hard constraint)
  if (
    a.supportPreference?.hasDedicatedHuman !==
    b.supportPreference?.hasDedicatedHuman
  ) {
    hardConstraintMatch = false;
    differences.push(
      `Dedicated human requirement: ${a.supportPreference?.hasDedicatedHuman} vs ${b.supportPreference?.hasDedicatedHuman}`,
    );
  }

  // Nice-to-have comparison (Soft preferences)
  let softPreferenceMatch = true;
  const aNice = new Set(a.niceToHave);
  const bNice = new Set(b.niceToHave);
  for (const n of aNice) {
    if (!bNice.has(n)) {
      softPreferenceMatch = false;
      differences.push(`Nice-to-have mismatch: '${n}'`);
    }
  }
  for (const n of bNice) {
    if (!aNice.has(n)) {
      softPreferenceMatch = false;
      differences.push(`Nice-to-have mismatch: '${n}'`);
    }
  }

  // Quality preference comparison (Soft preference)
  if (
    a.qualityPreference?.level !== b.qualityPreference?.level ||
    a.qualityPreference?.prioritizeQualityOverPrice !==
      b.qualityPreference?.prioritizeQualityOverPrice
  ) {
    softPreferenceMatch = false;
    differences.push(`Quality preference mismatch`);
  }

  // Urgency
  if (a.urgency !== b.urgency) {
    softPreferenceMatch = false;
    differences.push(`Urgency mismatch: ${a.urgency} vs ${b.urgency}`);
  }

  const isEquivalent = differences.length === 0;

  return {
    isEquivalent,
    hardConstraintMatch,
    softPreferenceMatch,
    budgetMatch,
    differences,
  };
}
