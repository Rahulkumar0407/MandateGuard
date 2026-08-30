import type { CanonicalBuyerIntent } from "@/lib/intent/types";
import { BuyerCatalogAdapter } from "./adapter";
import { evaluateHardConstraints } from "./filter";
import { scoreEligibleOffer } from "./scorer";
import {
  shouldUseTradeoffReasoner,
  toTradeoffCandidate,
  validateTradeoffResolution,
  type TradeoffReasoningProvider,
  type TradeoffResolution,
} from "./tradeoff";
import type {
  BuyerRecommendationResult,
  RankedAlternative,
  ScoredOffer,
} from "./types";
import type { MerchantOfferService } from "@/lib/merchant/service";

export interface BuyerRankingOptions {
  tradeoffProvider?: TradeoffReasoningProvider;
  maxCandidatesToReason?: number;
}

/**
 * M10 Commerce Brain — Buyer Offer Ranking Engine
 *
 * Coordinates:
 * 1. Confirmed catalog retrieval.
 * 2. Deterministic hard constraint filtering.
 * 3. Multi-attribute buyer-fit scoring.
 * 4. Bounded Trade-off reasoning (when scores/preferences are ambiguous).
 * 5. Grounded, explainable recommendation generation.
 */
export class BuyerOfferRankingEngine {
  private adapter: BuyerCatalogAdapter;
  private tradeoffProvider?: TradeoffReasoningProvider;

  constructor(
    merchantService: MerchantOfferService,
    tradeoffProvider?: TradeoffReasoningProvider,
  ) {
    this.adapter = new BuyerCatalogAdapter(merchantService);
    this.tradeoffProvider = tradeoffProvider;
  }

  /**
   * Retrieves, filters, and ranks candidate offers against the buyer's canonical intent.
   */
  async rankOffers(
    intent: CanonicalBuyerIntent,
    options?: BuyerRankingOptions,
  ): Promise<BuyerRecommendationResult> {
    // 1. Retrieve confirmed active candidate offers from catalog
    const candidates = await this.adapter.retrieveActiveConfirmedOffers(intent.category);

    const eligibleScoredOffers: ScoredOffer[] = [];
    const allRejectionReasons: string[] = [];

    // 2. Evaluate deterministic hard constraints
    for (const offer of candidates) {
      const hardEval = evaluateHardConstraints(offer, intent);

      if (hardEval.isEligible) {
        const scored = scoreEligibleOffer(offer, intent, hardEval.matchedHardConstraints);
        eligibleScoredOffers.push(scored);
      } else {
        allRejectionReasons.push(
          `${offer.name} (v${offer.version}): ${hardEval.rejectionReasons.join("; ")}`,
        );
      }
    }

    // 3. Handle Refusal to Force-Fit if no candidates are eligible
    if (eligibleScoredOffers.length === 0) {
      const refusalReason =
        candidates.length === 0
          ? `No active confirmed merchant offers found in category '${intent.category}'.`
          : `None of the ${candidates.length} candidate offer(s) satisfied all hard constraints:\n• ${allRejectionReasons.join("\n• ")}`;

      return {
        recommendedOffer: null,
        eligible: false,
        score: 0,
        matchedConstraints: [],
        tradeoffs: [],
        rationale:
          "Unable to recommend a verified offer that satisfies all required budget, support, and entitlement constraints.",
        rankedOffers: [],
        alternatives: [],
        refusalReason,
        intent,
        usedTradeoffReasoner: false,
      };
    }

    // 4. Sort eligible candidates by total buyer-fit score (descending)
    eligibleScoredOffers.sort((a, b) => b.score - a.score);

    let topScored = eligibleScoredOffers[0];
    let tradeoffResolution: TradeoffResolution | undefined = undefined;
    let usedTradeoffReasoner = false;

    // 5. Bounded Buyer Trade-off Reasoning (if scores or soft preferences are ambiguous)
    const provider = options?.tradeoffProvider || this.tradeoffProvider;
    if (provider && shouldUseTradeoffReasoner(eligibleScoredOffers, intent)) {
      try {
        const maxN = options?.maxCandidatesToReason ?? 3;
        const topCandidates = eligibleScoredOffers
          .slice(0, maxN)
          .map(toTradeoffCandidate);
        const validCandidateIds = topCandidates.map((c) => c.offerId);

        const resolution = await provider.resolveTradeoff({
          intent,
          candidates: topCandidates,
        });

        // Validate that model output satisfies schema and selected offer is eligible
        const validated = validateTradeoffResolution(resolution, validCandidateIds);

        // If selected offer differs from top deterministic candidate, reorder
        const selectedIndex = eligibleScoredOffers.findIndex(
          (s) => s.offer.id === validated.selectedOfferId,
        );

        if (selectedIndex !== -1) {
          const selectedScored = eligibleScoredOffers[selectedIndex];
          if (selectedIndex !== 0) {
            eligibleScoredOffers.splice(selectedIndex, 1);
            eligibleScoredOffers.unshift(selectedScored);
          }
          topScored = eligibleScoredOffers[0];
          tradeoffResolution = validated;
          usedTradeoffReasoner = true;
        }
      } catch {
        // Fall back gracefully to deterministic ranking on any failure
        usedTradeoffReasoner = false;
      }
    }

    const topOffer = topScored.offer;

    // 6. Generate comparative alternatives
    const alternatives: RankedAlternative[] = eligibleScoredOffers.slice(1).map((alt) => {
      let diffNote = "";
      if (alt.offer.price < topOffer.price) {
        diffNote = `Cheaper by ₹${((topOffer.price - alt.offer.price) / 100).toLocaleString("en-IN")}/mo, but lower overall feature match`;
      } else if (alt.offer.price > topOffer.price) {
        diffNote = `Costs ₹${((alt.offer.price - topOffer.price) / 100).toLocaleString("en-IN")}/mo more`;
      } else {
        diffNote = "Alternative package with different support or entitlement balance";
      }

      return {
        offerId: alt.offer.id,
        name: alt.offer.name,
        version: alt.offer.version,
        pricePaise: alt.offer.price,
        currency: alt.offer.currency,
        score: alt.score,
        comparisonWithTopOffer: diffNote,
      };
    });

    // 7. Generate grounded recommendation rationale
    let rationale = `Recommended '${topOffer.name}' (v${topOffer.version}) at ₹${(
      topOffer.price / 100
    ).toLocaleString("en-IN")}/${topOffer.billingInterval} with a buyer-fit score of ${
      topScored.score
    }/100. It satisfies all hard budget and entitlement constraints and offers the optimal balance of verified support and commitments.`;

    if (tradeoffResolution) {
      rationale = `${tradeoffResolution.rationale} (${tradeoffResolution.tradeoffSummary})`;
    }

    return {
      recommendedOffer: topOffer,
      eligible: true,
      score: topScored.score,
      matchedConstraints: topScored.matchedConstraints,
      tradeoffs: topScored.tradeoffs,
      rationale,
      rankedOffers: eligibleScoredOffers,
      alternatives,
      intent,
      tradeoffResolution,
      usedTradeoffReasoner,
    };
  }
}

