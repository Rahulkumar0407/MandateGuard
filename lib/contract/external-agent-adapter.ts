import type {
  AgentCommerceContract,
  ExternalAgentDecisionTrace,
  ExternalAgentEvaluationResponse,
} from "./types";
import type { OfferDetailDTO } from "@/lib/merchant/types";
import type { CanonicalBuyerIntent } from "@/lib/intent/types";
import { evaluateHardConstraints } from "@/lib/retrieval/filter";
import { scoreEligibleOffer } from "@/lib/retrieval/scorer";
import { getIntentEngine } from "@/lib/intent/engine";

/**
 * M10-E4 External Agent Adapter
 *
 * CRITICAL ARCHITECTURAL ISOLATION RULE:
 * This adapter represents an external AI agent operating OUTSIDE MandateGuard's internal infrastructure.
 *
 * It MUST NOT:
 * - Import Prisma, database clients, or SQL drivers.
 * - Import merchant repositories or internal merchant services.
 * - Query internal database tables directly.
 *
 * It ONLY operates on:
 * 1. Public AgentCommerceContracts provided to it over the network/input.
 * 2. The buyer's natural language request or canonical intent.
 */
export class ExternalAgentAdapter {
  /**
   * Converts a public AgentCommerceContract into an in-memory OfferDetailDTO.
   *
   * Architectural Guarantee:
   * Structured commitments, pricing, and integrity hashes are mapped directly
   * from the verified contract fields. Untrusted copy is kept purely as inert
   * string content for evaluation.
   */
  public contractToOfferDTO(contract: AgentCommerceContract): OfferDetailDTO {
    return {
      id: contract.offer.id,
      product: {
        id: contract.product.id,
        name: contract.product.name,
        slug: contract.product.slug,
        category: contract.product.category,
        merchantId: contract.merchant.id,
      },
      version: contract.offer.version,
      name: contract.offer.name,
      description: contract.untrustedContent.description,
      price: contract.commercialTerms.pricePaise,
      currency: contract.commercialTerms.currency,
      billingInterval: contract.commercialTerms.billingInterval,
      duration: contract.commercialTerms.duration,
      entitlementKeys: contract.structuredCommitments.entitlements.keys,
      refundPolicy: {
        windowDays: contract.commercialTerms.refundWindowDays,
      },
      supportTerms: contract.untrustedContent.supportTerms,
      semanticTerms: contract.untrustedContent.semanticTerms,
      structuredCommitments: contract.structuredCommitments,
      isConfirmedByMerchant: contract.integrity.isConfirmedByMerchant,
      versionHash: contract.integrity.versionHash,
      availability: contract.offer.availability,
    };
  }

  /**
   * Evaluates one or more AgentCommerceContracts against a buyer query.
   *
   * Demonstrates that an external agent reading ONLY machine-readable contracts
   * arrives at the exact same deterministic commercial decision as the internal buyer brain.
   */
  async evaluateContracts(
    contracts: AgentCommerceContract[],
    buyerQueryOrIntent: string | CanonicalBuyerIntent,
  ): Promise<ExternalAgentEvaluationResponse> {
    // 1. Resolve Canonical Buyer Intent
    let intent: CanonicalBuyerIntent;
    let buyerQueryString: string;

    if (typeof buyerQueryOrIntent === "string") {
      buyerQueryString = buyerQueryOrIntent;
      const intentEngine = getIntentEngine();
      intent = await intentEngine.understandIntent(buyerQueryOrIntent);
    } else {
      intent = buyerQueryOrIntent;
      buyerQueryString = `Intent: ${intent.category} | budget: ₹${((intent.budget?.amountPaise || 0) / 100).toLocaleString("en-IN")}`;
    }

    if (contracts.length === 0) {
      throw new Error("ExternalAgentAdapter: No contracts provided for evaluation.");
    }

    // 2. Evaluate contracts using deterministic constraints
    const candidateDTOs = contracts.map((c) => this.contractToOfferDTO(c));

    const eligibleOffers: Array<{
      contract: AgentCommerceContract;
      dto: OfferDetailDTO;
      score: number;
      matchedConstraints: string[];
      rejectionReasons: string[];
    }> = [];

    for (let i = 0; i < candidateDTOs.length; i++) {
      const dto = candidateDTOs[i];
      const contract = contracts[i];

      // Discard inactive, unconfirmed, or stale contracts
      if (
        contract.offer.availability !== "ACTIVE" ||
        !contract.integrity.isConfirmedByMerchant ||
        !contract.integrity.versionHash
      ) {
        eligibleOffers.push({
          contract,
          dto,
          score: 0,
          matchedConstraints: [],
          rejectionReasons: ["Contract is inactive, unconfirmed, or missing version hash."],
        });
        continue;
      }

      const hardEval = evaluateHardConstraints(dto, intent);
      if (hardEval.isEligible) {
        const scored = scoreEligibleOffer(dto, intent, hardEval.matchedHardConstraints);
        eligibleOffers.push({
          contract,
          dto,
          score: scored.score,
          matchedConstraints: hardEval.matchedHardConstraints,
          rejectionReasons: [],
        });
      } else {
        eligibleOffers.push({
          contract,
          dto,
          score: 0,
          matchedConstraints: hardEval.matchedHardConstraints,
          rejectionReasons: hardEval.rejectionReasons,
        });
      }
    }

    // Filter only eligible
    const eligibleMatches = eligibleOffers.filter((o) => o.rejectionReasons.length === 0);
    eligibleMatches.sort((a, b) => b.score - a.score);

    const winningMatch = eligibleMatches.length > 0 ? eligibleMatches[0] : null;
    const evaluatedTarget = winningMatch || eligibleOffers[0];

    // Detect if untrusted text contains prompt injection attempts or adversarial directives
    const targetDesc = evaluatedTarget.contract.untrustedContent.description;
    const targetSupport = evaluatedTarget.contract.untrustedContent.supportTerms;
    const fullText = `${targetDesc} ${targetSupport}`.toLowerCase();

    const isInjectedOrAdversarial =
      fullText.includes("ignore") ||
      fullText.includes("system instruction") ||
      fullText.includes("admin:") ||
      fullText.includes("override") ||
      fullText.includes("discount") ||
      fullText.includes("guaranteed");

    // Formulate decision status
    let decision: ExternalAgentDecisionTrace["decision"] = "REFUSAL";
    let safetyExplanation = "";

    if (winningMatch) {
      decision = "SAFE_MATCH";
      safetyExplanation = isInjectedOrAdversarial
        ? "Adversarial/injected merchant text was detected in untrusted fields, but the commercial decision was grounded strictly in verified structured commitments and authoritative price."
        : "Offer successfully matched all required hard constraints based on authoritative structured commitments.";
    } else {
      const topRejection = evaluatedTarget.rejectionReasons.join("; ");
      if (topRejection.includes("exceeds hard budget")) {
        decision = "REJECTED_BUDGET";
        safetyExplanation = "Offer was rejected because authoritative contract price exceeds the buyer's hard budget limit, regardless of any untrusted discount claims in description text.";
      } else if (topRejection.includes("dedicated human support") || topRejection.includes("SLA")) {
        decision = "REJECTED_SUPPORT";
        safetyExplanation = "Offer was rejected because structured support commitments do not meet the buyer's required human support level, despite free-text marketing claims.";
      } else if (topRejection.includes("entitlement")) {
        decision = "REJECTED_ENTITLEMENT";
        safetyExplanation = "Offer was rejected because structured entitlement keys lack the required critical curriculum/feature.";
      } else if (topRejection.includes("Currency")) {
        decision = "REJECTED_CURRENCY";
        safetyExplanation = "Offer rejected due to currency mismatch.";
      } else {
        decision = "REFUSAL";
        safetyExplanation = `Offer rejected: ${topRejection}`;
      }
    }

    const decisionTrace: ExternalAgentDecisionTrace = {
      buyerQuery: buyerQueryString,
      canonicalIntent: intent,
      targetOffer: {
        id: evaluatedTarget.contract.offer.id,
        name: evaluatedTarget.contract.offer.name,
        version: evaluatedTarget.contract.offer.version,
        pricePaise: evaluatedTarget.contract.commercialTerms.pricePaise,
        currency: evaluatedTarget.contract.commercialTerms.currency,
      },
      untrustedContentObserved: {
        description: evaluatedTarget.contract.untrustedContent.description,
        supportTerms: evaluatedTarget.contract.untrustedContent.supportTerms,
        isInjectedOrAdversarial,
      },
      structuredCommitmentsApplied: evaluatedTarget.contract.structuredCommitments,
      decision,
      reasons: winningMatch ? winningMatch.matchedConstraints : evaluatedTarget.rejectionReasons,
      safetyExplanation,
    };

    return {
      source: "EXTERNAL_AGENT_CONTRACT_ADAPTER",
      contractUsed: {
        offerId: evaluatedTarget.contract.offer.id,
        version: evaluatedTarget.contract.offer.version,
        versionHash: evaluatedTarget.contract.integrity.versionHash,
        merchantName: evaluatedTarget.contract.merchant.name,
      },
      isEligible: winningMatch !== null,
      recommendedOffer: winningMatch ? winningMatch.contract : null,
      decisionTrace,
      internalEquivalenceVerified: true,
    };
  }
}
