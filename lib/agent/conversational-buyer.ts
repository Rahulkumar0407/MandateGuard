import { BuyerIntentEngine, getIntentEngine } from "@/lib/intent/engine";
import type { CanonicalBuyerIntent } from "@/lib/intent/types";
import type { BuyerSessionContext } from "@/lib/intent/provider";
import { normalizeBuyerIntent } from "@/lib/intent/normalization";
import { BuyerOfferRankingEngine } from "@/lib/retrieval/engine";
import type { BuyerRecommendationResult } from "@/lib/retrieval/types";
import { getMerchantOfferService, MerchantOfferService } from "@/lib/merchant/service";

export interface ClarificationInfo {
  prompt: string;
  options: string[];
}

export interface ConversationalBuyerResponse {
  message: string;
  intent: CanonicalBuyerIntent;
  recommendation: BuyerRecommendationResult | null;
  clarification: ClarificationInfo | null;
  suggestedActions: string[];
}

/**
 * M10-B5 — Conversational AI Buyer Service
 *
 * Coordinates:
 * 1. Multi-lingual intent extraction (English, Hindi, Hinglish).
 * 2. Ambiguity & clarification management.
 * 3. Deterministic catalog filtering, multi-attribute scoring, and bounded trade-off reasoning.
 * 4. Grounded, explainable commerce response generation.
 */
export class ConversationalBuyerService {
  private intentEngine: BuyerIntentEngine;
  private rankingEngine: BuyerOfferRankingEngine;

  constructor(
    intentEngine?: BuyerIntentEngine,
    rankingEngine?: BuyerOfferRankingEngine,
    merchantService?: MerchantOfferService,
  ) {
    const service = merchantService || getMerchantOfferService();
    this.intentEngine = intentEngine || getIntentEngine();
    this.rankingEngine = rankingEngine || new BuyerOfferRankingEngine(service);
  }

  /**
   * Processes a natural language buyer query and generates an explainable commerce response.
   */
  async processMessage(
    userMessage: string,
    context?: BuyerSessionContext,
  ): Promise<ConversationalBuyerResponse> {
    const trimmed = userMessage.trim();
    if (!trimmed) {
      return {
        message: "Please enter what you are looking for (e.g., '4k ke andar human mentor chahiye').",
        intent: normalizeBuyerIntent({
          category: "unspecified",
          billing: { cadence: "monthly", isRecurring: true },
          mustHave: [],
          niceToHave: [],
          exclusions: [],
          ambiguous: true,
          clarificationNeeded: true,
          clarificationReasons: ["Query is empty."],
        }),
        recommendation: null,
        clarification: {
          prompt: "What subject or service are you looking for?",
          options: ["System Design", "DSA & Algorithms", "Mock Interviews"],
        },
        suggestedActions: ["Browse System Design", "Browse DSA", "Set Budget"],
      };
    }


    // 1. Extract & Canonicalize Buyer Intent
    const intent = await this.intentEngine.understandIntent(trimmed, context);

    // 2. Handle Clarification if intent is ambiguous
    if (intent.clarificationNeeded) {
      const isHindi = intent.context?.language === "hi" || intent.context?.language === "hi-Latn";
      const clarificationPrompt = isHindi
        ? "कृपया मुझे थोड़ा और बताएं कि आप क्या ढूंढ रहे हैं (जैसे विषय और आपका मासिक बजट)?"
        : "Could you tell me a bit more about what you need (e.g. topic and target budget)?";

      const options = [
        "System Design (under ₹4,000/mo)",
        "DSA Course (under ₹3,000/mo)",
        "1:1 Mock Interviews (under ₹5,000/mo)",
      ];

      return {
        message: clarificationPrompt,
        intent,
        recommendation: null,
        clarification: {
          prompt: clarificationPrompt,
          options,
        },
        suggestedActions: options,
      };
    }

    // 3. Retrieve and Rank Candidate Offers
    const recommendation = await this.rankingEngine.rankOffers(intent);

    // 4. Generate Grounded Explainable Message
    const message = this.formatExplainableResponse(intent, recommendation);

    const suggestedActions: string[] = [];
    if (recommendation.eligible && recommendation.recommendedOffer) {
      suggestedActions.push("Review & Authorize");
      if (recommendation.alternatives.length > 0) {
        suggestedActions.push(`Compare with ${recommendation.alternatives[0].name}`);
      }
      suggestedActions.push("Modify Requirements");
    } else {
      suggestedActions.push("Increase Budget", "Change Cadence", "View All Courses");
    }

    return {
      message,
      intent,
      recommendation,
      clarification: null,
      suggestedActions,
    };
  }

  /**
   * Formats a clear, friendly, and explainable natural-language response.
   */
  private formatExplainableResponse(
    intent: CanonicalBuyerIntent,
    recommendation: BuyerRecommendationResult,
  ): string {
    const isHindi = intent.context?.language === "hi" || intent.context?.language === "hi-Latn";

    if (!recommendation.eligible || !recommendation.recommendedOffer) {
      if (isHindi) {
        return (
          `मुझे आपकी आवश्यकताओं के अनुसार कोई सही ऑफर नहीं मिला। ` +
          `${recommendation.refusalReason || "कृपया अपना बजट या शर्तें थोड़ी बदल कर देखें।"}`
        );
      }
      return (
        `I couldn't find a verified offer that satisfies all your hard constraints. ` +
        `${recommendation.refusalReason || "Try adjusting your target budget or optional requirements."}`
      );
    }

    const offer = recommendation.recommendedOffer;
    const priceFormatted = `₹${(offer.price / 100).toLocaleString("en-IN")}/${offer.billingInterval}`;
    const score = recommendation.score;

    const commitmentPoints: string[] = [];
    if (offer.structuredCommitments?.support?.hasDedicatedHuman) {
      const sessions = offer.structuredCommitments.support.oneOnOneSessionsPerMonth ?? 1;
      commitmentPoints.push(`${sessions}x dedicated 1:1 monthly sessions`);
    }
    if (offer.structuredCommitments?.support?.slaHours) {
      commitmentPoints.push(`${offer.structuredCommitments.support.slaHours}h turnaround SLA`);
    }
    const refundDays =
      offer.refundPolicy?.windowDays ??
      offer.structuredCommitments?.refundPolicy?.windowDays;
    if (refundDays && refundDays > 0) {
      commitmentPoints.push(`${refundDays}-day money back guarantee`);
    }

    const commitmentsSummary =
      commitmentPoints.length > 0 ? ` (${commitmentPoints.join(", ")})` : "";

    if (isHindi) {
      let text = `आपके लिए सबसे बढ़िया विकल्प है **${offer.name}** (v${offer.version}) — **${priceFormatted}** (Buyer Fit: ${score}/100)${commitmentsSummary}.\n\n`;
      text += `**यह क्यों चुना गया:** ${recommendation.rationale}`;

      if (recommendation.alternatives.length > 0) {
        const alt = recommendation.alternatives[0];
        const altPrice = `₹${(alt.pricePaise / 100).toLocaleString("en-IN")}`;
        text += `\n\n**दूसरा विकल्प:** '${alt.name}' at ${altPrice} — ${alt.comparisonWithTopOffer}.`;
      }
      return text;
    }

    let text = `The best matching plan is **${offer.name}** (v${offer.version}) at **${priceFormatted}** with a **${score}/100** fit score${commitmentsSummary}.\n\n`;
    text += `**Why this plan:** ${recommendation.rationale}`;

    if (recommendation.alternatives.length > 0) {
      const alt = recommendation.alternatives[0];
      const altPrice = `₹${(alt.pricePaise / 100).toLocaleString("en-IN")}`;
      text += `\n\n**Alternative:** '${alt.name}' at ${altPrice} (${alt.comparisonWithTopOffer}).`;
    }

    return text;
  }
}

let defaultBuyerService: ConversationalBuyerService | null = null;

export function getConversationalBuyerService(): ConversationalBuyerService {
  if (!defaultBuyerService) {
    defaultBuyerService = new ConversationalBuyerService();
  }
  return defaultBuyerService;
}

export function setConversationalBuyerService(
  service: ConversationalBuyerService | null,
): void {
  defaultBuyerService = service;
}
