import type { OfferDetailDTO } from "@/lib/merchant/types";
import type { CanonicalBuyerIntent } from "@/lib/intent/types";
import { normalizeFeatureKey } from "@/lib/intent/normalization";
import type { BuyerFitScoreBreakdown, ScoredOffer } from "./types";

/**
 * Computes a normalized multi-attribute buyer-fit score (0..100) for an eligible offer.
 */
export function scoreEligibleOffer(
  offer: OfferDetailDTO,
  intent: CanonicalBuyerIntent,
  matchedHardConstraints: string[],
): ScoredOffer {
  const tradeoffs: string[] = [];
  const matchedConstraints = [...matchedHardConstraints];

  // 1. Budget Score (0..35 points)
  let budgetScore = 35;
  if (intent.budget) {
    const target = intent.budget.amountPaise;
    const price = offer.price;

    if (price <= target) {
      // Full points for being at or under target budget
      budgetScore = 35;
      if (price < target) {
        tradeoffs.push(
          `Saves ₹${((target - price) / 100).toLocaleString("en-IN")}/mo relative to budget target`,
        );
      }
    } else if (intent.budget.type === "SOFT") {
      const maxCeiling = intent.budget.maxStretchPaise || Math.round(target * 1.25);
      const stretchSpan = maxCeiling - target;
      const overage = price - target;
      const penalty = stretchSpan > 0 ? (overage / stretchSpan) * 15 : 15;
      budgetScore = Math.max(10, Math.round(35 - penalty));
      tradeoffs.push(
        `Requires ₹${(overage / 100).toLocaleString("en-IN")}/mo soft budget stretch`,
      );
    }
  }

  // 2. Nice-to-Have Features Score (0..25 points)
  let niceToHaveScore = 25;
  const offerEntitlementKeys = new Set([
    ...(offer.entitlementKeys || []).map(normalizeFeatureKey),
    ...(offer.structuredCommitments?.entitlements?.keys || []).map(normalizeFeatureKey),
  ]);

  if (intent.niceToHave && intent.niceToHave.length > 0) {
    let matchedCount = 0;
    for (const niceKey of intent.niceToHave) {
      const normKey = normalizeFeatureKey(niceKey);
      if (offerEntitlementKeys.has(normKey)) {
        matchedCount++;
        matchedConstraints.push(`Nice-to-have: ${niceKey}`);
      } else {
        tradeoffs.push(`Does not include optional feature '${niceKey}'`);
      }
    }
    niceToHaveScore = Math.round((matchedCount / intent.niceToHave.length) * 25);
  }

  // 3. Support Model Score (0..20 points)
  let supportScore = 15;
  const supportTier = offer.structuredCommitments?.support?.tier || "standard";
  if (supportTier === "dedicated_mentor") {
    supportScore = 20;
    matchedConstraints.push("Dedicated 1:1 Industry Mentor");
  } else if (supportTier === "priority_email") {
    supportScore = 14;
    matchedConstraints.push("Priority Email Support");
  } else if (supportTier === "community") {
    supportScore = 8;
    tradeoffs.push("Community Discord support (no 1:1 human mentor)");
  }

  // 4. Quality & Refund Policy Score (0..15 points)
  let qualityScore = 10;
  const refundDays = offer.refundPolicy?.windowDays ?? offer.structuredCommitments?.refundPolicy?.windowDays ?? 0;
  if (refundDays >= 30) {
    qualityScore += 5;
    matchedConstraints.push("30-day money-back guarantee");
  } else if (refundDays >= 14) {
    qualityScore += 2;
  }

  if (intent.qualityPreference?.prioritizeQualityOverPrice) {
    if (supportTier === "dedicated_mentor") {
      qualityScore = 15;
    }
  }

  // 5. SLA Turnaround Score (0..5 points)
  let slaScore = 3;
  const slaHours = offer.structuredCommitments?.support?.slaHours ?? 48;
  if (slaHours <= 24) {


    slaScore = 5;
    matchedConstraints.push("24h guaranteed turnaround SLA");
  } else if (slaHours <= 48) {
    slaScore = 3;
  } else {
    slaScore = 1;
    tradeoffs.push(`Slower turnaround SLA (${slaHours} hours)`);
  }

  const totalScore = Math.min(
    100,
    budgetScore + niceToHaveScore + supportScore + qualityScore + slaScore,
  );

  const breakdown: BuyerFitScoreBreakdown = {
    budgetScore,
    niceToHaveScore,
    supportScore,
    qualityScore,
    slaScore,
    totalScore,
  };

  return {
    offer,
    score: totalScore,
    breakdown,
    matchedConstraints,
    tradeoffs,
  };
}
