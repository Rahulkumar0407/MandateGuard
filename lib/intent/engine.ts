import { normalizeBuyerIntent } from "./normalization";
import { DeterministicFastIntentProvider, type BuyerSessionContext, type IntentReasoningProvider } from "./provider";
import type { CanonicalBuyerIntent } from "./types";

/**
 * M10 Commerce Brain — Buyer Intent Engine
 *
 * Core Principle:
 * "Models produce candidate intent.
 *  Commerce Brain validates, normalizes, and decides whether the request is sufficiently understood."
 *
 * The engine guarantees that all outputs conform to the strict, language-independent
 * CanonicalBuyerIntent schema and that malformed model outputs fail safely.
 */
export class BuyerIntentEngine {
  private provider: IntentReasoningProvider;

  constructor(provider?: IntentReasoningProvider) {
    this.provider = provider || new DeterministicFastIntentProvider();
  }

  /**
   * Extracts, validates, and canonicalizes buyer intent from natural-language queries.
   */
  async extractIntent(
    query: string,
    context?: BuyerSessionContext,
  ): Promise<CanonicalBuyerIntent> {
    const trimmedQuery = (query || "").trim();

    // Guard: Empty query returns safe ambiguous intent immediately
    if (!trimmedQuery) {
      return normalizeBuyerIntent({
        category: "unspecified",
        billing: { cadence: "any", isRecurring: true },
        mustHave: [],
        niceToHave: [],
        exclusions: [],
        ambiguous: true,
        clarificationNeeded: true,
        clarificationReasons: ["Query is empty."],
        context: {
          rawQuery: "",
          channel: context?.channel || "text",
        },
      });
    }

    try {
      const candidateRaw = await this.provider.understandIntent({
        query: trimmedQuery,
        context,
      });

      // Strict validation and canonicalization
      return normalizeBuyerIntent(candidateRaw);
    } catch (err: unknown) {
      // Graceful fallback on malformed model output or provider failure
      const errorMessage =
        err instanceof Error ? err.message : "Malformed reasoning model output";

      return normalizeBuyerIntent({
        category: "unspecified",
        billing: { cadence: "any", isRecurring: true },
        mustHave: [],
        niceToHave: [],
        exclusions: [],
        ambiguous: true,
        clarificationNeeded: true,
        clarificationReasons: [
          `Reasoning provider failed to extract valid intent: ${errorMessage}`,
        ],
        context: {
          rawQuery: trimmedQuery,
          channel: context?.channel || "text",
        },
      });
    }
  }

  /**
   * Alias for extractIntent.
   */
  async understandIntent(
    query: string,
    context?: BuyerSessionContext,
  ): Promise<CanonicalBuyerIntent> {
    return this.extractIntent(query, context);
  }

  /**
   * Determines if the extracted intent has sufficient clarity to proceed to offer evaluation.
   */
  isReadyForEvaluation(intent: CanonicalBuyerIntent): boolean {
    if (intent.ambiguous || intent.clarificationNeeded) {
      return false;
    }
    if (!intent.category || intent.category === "unspecified") {
      return false;
    }
    return true;
  }

  /**
   * Returns list of clarification prompts required from the buyer.
   */
  getMissingConstraintClarifications(intent: CanonicalBuyerIntent): string[] {
    if (!intent.clarificationNeeded || !intent.clarificationReasons) {
      return [];
    }
    return intent.clarificationReasons;
  }
}

let defaultIntentEngine: BuyerIntentEngine | null = null;

export function getIntentEngine(): BuyerIntentEngine {
  if (!defaultIntentEngine) {
    defaultIntentEngine = new BuyerIntentEngine();
  }
  return defaultIntentEngine;
}

export function setIntentEngine(engine: BuyerIntentEngine | null): void {
  defaultIntentEngine = engine;
}

