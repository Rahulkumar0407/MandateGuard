import type { BuyerIntent, RecommendationResult } from "./types";
import type { OfferDetailDTO } from "@/lib/merchant/types";

// ---------------------------------------------------------------------------
// Recommendation engine.
//
// Fully deterministic and independent of the LLM: eligibility is decided by hard
// constraints, ranking by a documented weighted score. An ineligible offer can
// NEVER win regardless of score. Merchant content (descriptions, semantic
// terms) is read only as inert data — it can never alter control flow.
// ---------------------------------------------------------------------------

// Monthly normalization rule:
//   monthly amount (paise) = offer.price / monthsPerInterval
//   monthly -> 1, yearly -> 12. Other intervals cannot be reliably normalized
//   to a monthly figure, so they return null (treated as "unknown" -> fails
//   any amount-based hard constraint rather than inventing a value).
function monthlyAmountPaise(offer: OfferDetailDTO): number | null {
  switch (offer.billingInterval) {
    case "monthly":
      return offer.price;
    case "yearly":
      return Math.round(offer.price / 12);
    default:
      return null;
  }
}

const formatter = new Intl.NumberFormat("en-IN");
function inr(paise: number): string {
  return `₹${formatter.format(Math.round(paise / 100))}`;
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}

export function evaluateEligibility(
  offer: OfferDetailDTO,
  intent: BuyerIntent,
): EligibilityResult {
  const reasons: string[] = [];

  // Currency (hard)
  if (intent.currency) {
    if (offer.currency !== intent.currency) {
      return {
        eligible: false,
        reasons: [
          `Currency ${offer.currency} does not match required ${intent.currency}`,
        ],
      };
    }
    reasons.push(`Currency ${intent.currency}`);
  }

  // Monthly amount (hard) — application performs the numeric comparison.
  const monthly = monthlyAmountPaise(offer);
  if (intent.maxMonthlyAmount != null) {
    if (monthly == null) {
      return {
        eligible: false,
        reasons: ["Monthly price cannot be determined for comparison"],
      };
    }
    const maxPaise = Math.round(intent.maxMonthlyAmount * 100);
    if (monthly > maxPaise) {
      return {
        eligible: false,
        reasons: [
          `Price ${inr(monthly)}/mo exceeds budget ${inr(maxPaise)}/mo`,
        ],
      };
    }
    reasons.push(`Within budget ${inr(maxPaise)}/mo`);
  }

  // Category (hard)
  if (intent.category) {
    if (offer.product.category !== intent.category) {
      return {
        eligible: false,
        reasons: [
          `Category '${offer.product.category}' does not match '${intent.category}'`,
        ],
      };
    }
    reasons.push(`Category '${intent.category}'`);
  }

  // Required features (hard)
  for (const f of intent.requiredFeatures ?? []) {
    if (!offer.entitlementKeys.includes(f)) {
      return { eligible: false, reasons: [`Missing required feature: ${f}`] };
    }
  }
  if ((intent.requiredFeatures?.length ?? 0) > 0) {
    reasons.push("Required features satisfied");
  }

  // Minimum duration (hard)
  if (intent.minimumDurationDays != null) {
    if (offer.duration < intent.minimumDurationDays) {
      return {
        eligible: false,
        reasons: [
          `Duration ${offer.duration}d is below required ${intent.minimumDurationDays}d`,
        ],
      };
    }
    reasons.push(`Duration ≥ ${intent.minimumDurationDays}d`);
  }

  return { eligible: true, reasons };
}

// Documented ranking weights (sum = 1.0). Only eligible offers are scored.
const WEIGHTS = {
  category: 0.3,
  required: 0.1,
  preferred: 0.2,
  price: 0.25,
  duration: 0.15,
} as const;

function scoreOffer(
  offer: OfferDetailDTO,
  intent: BuyerIntent,
  eligible: OfferDetailDTO[],
  maxBudgetPaise: number | null,
): number {
  const monthly = monthlyAmountPaise(offer) ?? 0;

  const categoryScore = intent.category
    ? offer.product.category === intent.category
      ? 1
      : 0
    : 0.5;

  // Eligible offers always satisfy required features.
  const requiredScore = 1;

  const prefs = intent.preferredFeatures ?? [];
  const preferredScore =
    prefs.length === 0
      ? 0.5
      : prefs.filter((f) => offer.entitlementKeys.includes(f)).length /
        prefs.length;

  let priceScore: number;
  if (maxBudgetPaise != null) {
    priceScore = Math.max(0, Math.min(1, 1 - monthly / maxBudgetPaise));
  } else {
    const prices = eligible.map((o) => monthlyAmountPaise(o) ?? 0);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    priceScore = max === min ? 1 : 1 - (monthly - min) / (max - min);
  }

  const durationScore = intent.minimumDurationDays != null ? 1 : 0.5;

  return (
    categoryScore * WEIGHTS.category +
    requiredScore * WEIGHTS.required +
    preferredScore * WEIGHTS.preferred +
    priceScore * WEIGHTS.price +
    durationScore * WEIGHTS.duration
  );
}

function buildReason(offer: OfferDetailDTO, intent: BuyerIntent): string {
  const parts: string[] = [];
  parts.push(
    `Recommended "${offer.name}" (v${offer.version}) at ${inr(offer.price)}/mo`,
  );
  const why: string[] = [];
  if (intent.category) why.push(`matches your ${intent.category} requirement`);
  if (intent.maxMonthlyAmount != null)
    why.push(`stays within your ${inr(intent.maxMonthlyAmount * 100)}/mo budget`);
  if ((intent.requiredFeatures?.length ?? 0) > 0)
    why.push(`includes ${intent.requiredFeatures!.join(", ")}`);
  if (why.length) parts.push(`because it ${why.join(", and ")}`);
  return parts.join(" ");
}

function buildTradeoffs(
  best: OfferDetailDTO,
  scored: Array<{ offer: OfferDetailDTO; score: number }>,
): string[] {
  const allFeatures = new Set<string>();
  for (const s of scored) s.offer.entitlementKeys.forEach((f) => allFeatures.add(f));
  const tradeoffs: string[] = [];
  for (const f of allFeatures) {
    if (best.entitlementKeys.includes(f)) continue;
    const holder = scored.find((s) => s.offer.entitlementKeys.includes(f));
    if (holder) {
      tradeoffs.push(
        `Does not include '${f}' (available in '${holder.offer.name}').`,
      );
    }
  }
  if (tradeoffs.length === 0) {
    tradeoffs.push("No notable tradeoffs among eligible offers.");
  }
  return tradeoffs;
}

export function recommend(
  intent: BuyerIntent,
  offers: OfferDetailDTO[],
): RecommendationResult {
  const eligible = offers.filter(
    (o) => evaluateEligibility(o, intent).eligible,
  );

  if (eligible.length === 0) {
    return {
      recommendedOfferId: null,
      eligible: false,
      score: 0,
      reason: "No offers match your constraints.",
      matchedConstraints: [],
      tradeoffs: [],
      alternatives: [],
    };
  }

  const maxBudgetPaise =
    intent.maxMonthlyAmount != null
      ? Math.round(intent.maxMonthlyAmount * 100)
      : null;

  const scored = eligible
    .map((offer) => ({
      offer,
      score: scoreOffer(offer, intent, eligible, maxBudgetPaise),
    }))
    // Deterministic ordering: highest score, then cheaper, then stable id.
    .sort(
      (a, b) =>
        b.score - a.score ||
        (monthlyAmountPaise(a.offer) ?? 0) - (monthlyAmountPaise(b.offer) ?? 0) ||
        a.offer.id.localeCompare(b.offer.id),
    );

  const best = scored[0];
  const bestElig = evaluateEligibility(best.offer, intent);

  const alternatives = scored.slice(1).map((s) => ({
    offerId: s.offer.id,
    name: s.offer.name,
    version: s.offer.version,
    price: s.offer.price,
    currency: s.offer.currency,
    reason: `Score ${s.score.toFixed(2)}`,
  }));

  return {
    recommendedOfferId: best.offer.id,
    eligible: true,
    score: Number(best.score.toFixed(4)),
    reason: buildReason(best.offer, intent),
    matchedConstraints: bestElig.reasons,
    tradeoffs: buildTradeoffs(best.offer, scored),
    alternatives,
  };
}
