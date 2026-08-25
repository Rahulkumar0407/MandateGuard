import type { IntegrityFinding } from "./types";

// Deterministic billing-interval normalization for PRICE integrity.
//
// We compare ECONOMICALLY EQUIVALENT periods: every price is reduced to a
// "per month" amount before comparison. This is plain arithmetic — no LLM,
// no external rate service.

// How many billing periods occur per year for each supported interval.
const PAYMENTS_PER_YEAR: Record<string, number> = {
  daily: 365,
  weekly: 52,
  monthly: 12,
  yearly: 1,
};

export function isKnownInterval(interval: string): boolean {
  return interval.toLowerCase() in PAYMENTS_PER_YEAR;
}

// Convert a price at a given billing interval into its monthly-equivalent value.
//   monthly = price * (periodsPerYear / 12)
// Examples:
//   ₹3,499 monthly            -> 3499 * (12/12) = 3499
//   ₹36,000 yearly            -> 36000 * (1/12) = 3000
//   ₹1,000 weekly             -> 1000 * (52/12) ≈ 4333.33
export function toMonthlyEquivalent(
  price: number,
  billingInterval: string,
): number {
  const periods = PAYMENTS_PER_YEAR[billingInterval.toLowerCase()] ?? 12;
  return (price * periods) / 12;
}

interface PriceInput {
  price: number;
  currency: string;
  billingInterval: string;
}

function formatPct(pct: number): string {
  const rounded = Math.round(pct * 100) / 100;
  return `${rounded >= 0 ? "+" : ""}${rounded}%`;
}

// Compare two economically-equivalent price points.
//
// Hard guards (no invented rates):
//  - Different currency  -> PRICE_CURRENCY_CHANGED + comparison unavailable.
//  - Unknown interval     -> comparison unavailable (cannot normalize).
// Otherwise normalize to monthly-equivalent and compute the percentage delta.
export function comparePrice(
  baseline: PriceInput,
  current: PriceInput,
): IntegrityFinding[] {
  const findings: IntegrityFinding[] = [];

  // STEP 5 — Currency. Never invent an exchange rate.
  if (baseline.currency !== current.currency) {
    findings.push({
      dimension: "PRICE",
      severity: "WARNING",
      type: "PRICE_CURRENCY_CHANGED",
      baseline: { currency: baseline.currency },
      current: { currency: current.currency },
      evidence: `Currency changed from ${baseline.currency} to ${current.currency}; deterministic price comparison is unavailable and must not invent an exchange rate.`,
      meta: { comparisonUnavailable: true },
    });
    findings.push({
      dimension: "PRICE",
      severity: "INFO",
      type: "PRICE_COMPARISON_UNAVAILABLE",
      baseline: {
        price: baseline.price,
        billingInterval: baseline.billingInterval,
      },
      current: {
        price: current.price,
        billingInterval: current.billingInterval,
      },
      evidence: `Prices (${baseline.price} ${baseline.currency}/${baseline.billingInterval} vs ${current.price} ${current.currency}/${current.billingInterval}) are not directly comparable across currencies.`,
    });
    return findings;
  }

  // Unknown intervals cannot be normalized deterministically.
  if (
    !isKnownInterval(baseline.billingInterval) ||
    !isKnownInterval(current.billingInterval)
  ) {
    findings.push({
      dimension: "PRICE",
      severity: "INFO",
      type: "PRICE_COMPARISON_UNAVAILABLE",
      baseline: {
        price: baseline.price,
        billingInterval: baseline.billingInterval,
      },
      current: {
        price: current.price,
        billingInterval: current.billingInterval,
      },
      evidence: `Billing interval could not be normalized deterministically for comparison (${baseline.billingInterval} vs ${current.billingInterval}).`,
    });
    return findings;
  }

  const baselineMonthly = toMonthlyEquivalent(
    baseline.price,
    baseline.billingInterval,
  );
  const currentMonthly = toMonthlyEquivalent(
    current.price,
    current.billingInterval,
  );

  if (baselineMonthly === currentMonthly) {
    findings.push({
      dimension: "PRICE",
      severity: "INFO",
      type: "PRICE_UNCHANGED",
      baseline: {
        price: baseline.price,
        billingInterval: baseline.billingInterval,
        monthlyEquivalent: baselineMonthly,
      },
      current: {
        price: current.price,
        billingInterval: current.billingInterval,
        monthlyEquivalent: currentMonthly,
      },
      evidence: `Monthly-equivalent price unchanged at ${baselineMonthly} (${baseline.price} ${baseline.currency}/${baseline.billingInterval} vs ${current.price} ${current.currency}/${current.billingInterval}).`,
    });
    return findings;
  }

  const increased = currentMonthly > baselineMonthly;
  const diff = currentMonthly - baselineMonthly;
  const pct = (diff / baselineMonthly) * 100;

  findings.push({
    dimension: "PRICE",
    severity: increased ? "WARNING" : "INFO",
    type: increased ? "PRICE_INCREASED" : "PRICE_DECREASED",
    baseline: {
      price: baseline.price,
      billingInterval: baseline.billingInterval,
      monthlyEquivalent: baselineMonthly,
    },
    current: {
      price: current.price,
      billingInterval: current.billingInterval,
      monthlyEquivalent: currentMonthly,
    },
    evidence: `Monthly-equivalent price ${increased ? "increased" : "decreased"} from ${baselineMonthly} to ${currentMonthly} (${formatPct(pct)}). Raw: ${baseline.price} ${baseline.currency}/${baseline.billingInterval} -> ${current.price} ${current.currency}/${current.billingInterval}.`,
    meta: {
      monthlyEquivalentBaseline: baselineMonthly,
      monthlyEquivalentCurrent: currentMonthly,
      percentageChange: Math.round(pct * 100) / 100,
    },
  });
  return findings;
}
