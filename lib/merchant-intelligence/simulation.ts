import type { CanonicalBuyerIntent } from "@/lib/intent/types";
import type { OfferDetailDTO } from "@/lib/merchant/types";
import type { MerchantOfferService } from "@/lib/merchant/service";
import { evaluateHardConstraints } from "@/lib/retrieval/filter";
import { scoreEligibleOffer } from "@/lib/retrieval/scorer";
import type { BuyerMissionEvaluation, EvidenceReference } from "./types";

export class MerchantBuyerSimulationService {
  constructor(private readonly merchantService: MerchantOfferService) {}

  /**
   * Evaluates a specific merchant's offer(s) against a buyer mission.
   * Reuses the authoritative BUY engine without state mutations.
   */
  async simulateMerchantForBuyer(
    merchantId: string,
    buyerIntent: CanonicalBuyerIntent,
    options?: {
      targetOfferId?: string;
      competingOffers?: OfferDetailDTO[];
    },
  ): Promise<BuyerMissionEvaluation> {
    const evidence: EvidenceReference[] = [];

    // 1. Resolve merchant's candidate offers
    const allOffers = await this.merchantService.listOffers();
    const merchantOffers = allOffers.filter(
      (o) => o.product.merchantId === merchantId,
    );

    let candidateOffer: OfferDetailDTO | undefined;
    if (options?.targetOfferId) {
      candidateOffer = merchantOffers.find((o) => o.id === options.targetOfferId);
    } else {
      // Find best category match
      candidateOffer = merchantOffers.find((o) => {
        const prodCat = (o.product.category || "").toLowerCase();
        const intentCat = (buyerIntent.category || "").toLowerCase();
        return prodCat.includes(intentCat) || intentCat.includes(prodCat) || intentCat === "unspecified";
      }) || merchantOffers[0];
    }

    if (!candidateOffer) {
      evidence.push({
        id: `ev_sim_disc_no_offer_${Date.now()}`,
        category: "DISCOVERABILITY",
        source: "MERCHANT_SUPPLY",
        fact: `Merchant '${merchantId}' has no published products or offers in catalog.`,
        metric: { label: "Published Offers", value: 0, benchmark: ">= 1" },
        entityId: merchantId,
        entityType: "merchant",
      });

      return {
        discovered: false,
        understandable: false,
        comparable: false,
        shortlisted: false,
        recommended: false,
        failedAt: "DISCOVERY",
        evidence,
        diagnosis: "Your catalog has no active products or offers matching this buyer query.",
      };
    }

    const candidateSummary = {
      id: candidateOffer.id,
      name: candidateOffer.name,
      version: candidateOffer.version,
      pricePaise: candidateOffer.price,
    };

    // 2. Stage 1: Discovery (Active, Confirmed, VersionHash, Category Match)
    const isConfirmed = candidateOffer.isConfirmedByMerchant === true;
    const hasHash = Boolean(candidateOffer.versionHash);
    const isActive = candidateOffer.availability === "ACTIVE";
    const prodCat = (candidateOffer.product.category || "").toLowerCase().replace(/[\s-]+/g, "_");
    const intentCat = (buyerIntent.category || "").toLowerCase().replace(/[\s-]+/g, "_");
    const categoryMatches =
      intentCat === "unspecified" ||
      intentCat === "interview_prep" ||
      prodCat.includes(intentCat) ||
      intentCat.includes(prodCat);

    const discovered = isConfirmed && hasHash && isActive && categoryMatches;

    if (!discovered) {
      const reasons: string[] = [];
      if (!isConfirmed) reasons.push("offer is unconfirmed");
      if (!hasHash) reasons.push("missing version hash");
      if (!isActive) reasons.push("offer is marked inactive");
      if (!categoryMatches) reasons.push(`category mismatch ('${prodCat}' vs '${intentCat}')`);

      evidence.push({
        id: `ev_sim_disc_${candidateOffer.id}`,
        category: "DISCOVERABILITY",
        source: "MERCHANT_SUPPLY",
        fact: `Offer '${candidateOffer.name}' could not be discovered by AI buyer: ${reasons.join(", ")}.`,
        metric: { label: "Discovered", value: false },
        entityId: candidateOffer.id,
        entityType: "offer",
      });

      return {
        discovered: false,
        understandable: false,
        comparable: false,
        shortlisted: false,
        recommended: false,
        failedAt: "DISCOVERY",
        evidence,
        candidateOffer: candidateSummary,
        diagnosis: `Your offer was not discovered during AI retrieval because: ${reasons.join("; ")}.`,
      };
    }

    evidence.push({
      id: `ev_sim_disc_ok_${candidateOffer.id}`,
      category: "DISCOVERABILITY",
      source: "MERCHANT_SUPPLY",
      fact: `Offer '${candidateOffer.name}' (v${candidateOffer.version}) was successfully discovered.`,
      metric: { label: "Discovered", value: true },
      entityId: candidateOffer.id,
      entityType: "offer",
    });

    // 3. Stage 2: Understanding (Machine-Readable Structured Commitments)
    const commitments = candidateOffer.structuredCommitments;
    const understandable = Boolean(commitments);

    if (!understandable) {
      evidence.push({
        id: `ev_sim_comp_missing_${candidateOffer.id}`,
        category: "COMPREHENSION",
        source: "MERCHANT_SUPPLY",
        fact: `Offer '${candidateOffer.name}' lacks structured commitments schema.`,
        metric: { label: "Structured Commitments", value: "Missing" },
        entityId: candidateOffer.id,
        entityType: "offer",
      });

      return {
        discovered: true,
        understandable: false,
        comparable: false,
        shortlisted: false,
        recommended: false,
        failedAt: "UNDERSTANDING",
        evidence,
        candidateOffer: candidateSummary,
        diagnosis: "AI buyers cannot parse support guarantees or entitlements without structured commitments.",
      };
    }

    // 4. Stage 3: Comparability (SLA hours, Support Type, Refund window clarity)
    const hasSla = Boolean(commitments?.support?.slaHours && commitments.support.slaHours > 0);
    const hasRefund = (candidateOffer.refundPolicy?.windowDays ?? commitments?.refundPolicy?.windowDays ?? 0) >= 0;
    const comparable = hasSla && hasRefund;

    if (!comparable) {
      evidence.push({
        id: `ev_sim_comparable_gap_${candidateOffer.id}`,
        category: "COMPARABILITY",
        source: "MERCHANT_SUPPLY",
        fact: `Offer '${candidateOffer.name}' missing quantifiable response SLA hours.`,
        metric: { label: "Response SLA Specified", value: hasSla, benchmark: true },
        entityId: candidateOffer.id,
        entityType: "offer",
      });
    }

    // 5. Stage 4: Shortlist (Evaluate Hard Constraints with BUY engine)
    const hardEval = evaluateHardConstraints(candidateOffer, buyerIntent);
    const shortlisted = hardEval.isEligible;

    if (!shortlisted) {
      evidence.push({
        id: `ev_sim_shortlist_fail_${candidateOffer.id}`,
        category: "CONVERSION",
        source: "DECISION_RESULT",
        fact: `Offer '${candidateOffer.name}' failed buyer hard constraints: ${hardEval.rejectionReasons.join("; ")}.`,
        metric: { label: "Passed Hard Constraints", value: false },
        entityId: candidateOffer.id,
        entityType: "offer",
      });

      return {
        discovered: true,
        understandable: true,
        comparable,
        shortlisted: false,
        recommended: false,
        failedAt: "SHORTLIST",
        evidence,
        candidateOffer: candidateSummary,
        diagnosis: `Your offer failed this buyer mission because: ${hardEval.rejectionReasons.join("; ")}.`,
      };
    }

    evidence.push({
      id: `ev_sim_shortlist_ok_${candidateOffer.id}`,
      category: "CONVERSION",
      source: "DECISION_RESULT",
      fact: `Offer '${candidateOffer.name}' passed all hard constraints and was shortlisted.`,
      metric: { label: "Passed Hard Constraints", value: true },
      entityId: candidateOffer.id,
      entityType: "offer",
    });

    // 6. Stage 5: Recommendation (Score candidate against competing offers)
    const scoredMerchant = scoreEligibleOffer(
      candidateOffer,
      buyerIntent,
      hardEval.matchedHardConstraints,
    );

    let competitors = options?.competingOffers || [];
    if (competitors.length === 0) {
      // Find other active offers in catalog as competitors
      competitors = allOffers.filter(
        (o) => o.id !== candidateOffer?.id && o.availability === "ACTIVE" && o.isConfirmedByMerchant,
      );
    }

    let topScore = scoredMerchant.score;
    let winningOfferSummary: BuyerMissionEvaluation["winningOffer"] | undefined;
    let won = true;

    for (const comp of competitors) {
      const compEval = evaluateHardConstraints(comp, buyerIntent);
      if (compEval.isEligible) {
        const compScored = scoreEligibleOffer(
          comp,
          buyerIntent,
          compEval.matchedHardConstraints,
        );
        if (compScored.score > topScore) {
          topScore = compScored.score;
          won = false;
          winningOfferSummary = {
            id: comp.id,
            name: comp.name,
            pricePaise: comp.price,
            merchantName: comp.product.name,
          };
        }
      }
    }


    if (!won) {
      evidence.push({
        id: `ev_sim_rank_loss_${candidateOffer.id}`,
        category: "CONVERSION",
        source: "DECISION_RESULT",
        fact: `Offer '${candidateOffer.name}' scored ${scoredMerchant.score}/100 vs competitor '${winningOfferSummary?.name}' (${topScore}/100).`,
        metric: {
          label: "Buyer Fit Score",
          value: `${scoredMerchant.score}/100`,
          benchmark: `${topScore}/100`,
        },
        entityId: candidateOffer.id,
        entityType: "offer",
      });

      return {
        discovered: true,
        understandable: true,
        comparable,
        shortlisted: true,
        recommended: false,
        failedAt: "RECOMMENDATION",
        evidence,
        candidateOffer: candidateSummary,
        winningOffer: winningOfferSummary,
        diagnosis: `Your offer was shortlisted but competitor '${winningOfferSummary?.name}' had higher buyer alignment.`,
      };
    }

    evidence.push({
      id: `ev_sim_rec_won_${candidateOffer.id}`,
      category: "CONVERSION",
      source: "DECISION_RESULT",
      fact: `Offer '${candidateOffer.name}' won Top-1 recommendation with buyer fit score of ${scoredMerchant.score}/100.`,
      metric: { label: "Top-1 Recommended", value: true },
      entityId: candidateOffer.id,
      entityType: "offer",
    });

    return {
      discovered: true,
      understandable: true,
      comparable,
      shortlisted: true,
      recommended: true,
      evidence,
      candidateOffer: candidateSummary,
      diagnosis: `Your offer successfully won Top-1 recommendation for this buyer mission (Score: ${scoredMerchant.score}/100).`,
    };
  }
}
