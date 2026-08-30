/**
 * M10-E1 — Baseline A: Simple Deterministic Baseline
 *
 * Implements a naive, rules-based keyword and price matching baseline:
 * - Simple keyword substring search for category matching.
 * - Naive regex for numeric extraction (misses Hinglish words like "hazaar", misses soft/hard stretch semantics).
 * - Exact token matching on entitlements.
 * - Simple sort by lowest price.
 * - No canonical intent schema, no semantic normalization, no structured commitment verification.
 */

import type { OfferDetailDTO } from "@/lib/merchant/types";
import type {
  BuyerBrainBenchmarkMission,
  SystemDecisionResult,
} from "./types";

export class SimpleDeterministicBaselineRunner {
  constructor(private readonly catalog: OfferDetailDTO[]) {}

  async evaluateMission(
    mission: BuyerBrainBenchmarkMission,
  ): Promise<SystemDecisionResult> {
    const start = performance.now();
    const query = mission.rawQuery.toLowerCase();

    // 1. Naive category matching
    let matchedCategory = "unspecified";
    if (query.includes("system design") || query.includes("sys design") || query.includes("hld")) {
      matchedCategory = "system-design";
    } else if (query.includes("dsa") || query.includes("algorithm") || query.includes("coding")) {
      matchedCategory = "data-structures";
    } else if (query.includes("mock") || query.includes("interview pack")) {
      matchedCategory = "mock-interviews";
    } else if (query.includes("resume") || query.includes("career")) {
      matchedCategory = "career";
    } else if (query.includes("accelerator") || query.includes("bundle")) {
      matchedCategory = "bundles";
    }

    // 2. Naive numeric budget extraction
    let extractedMaxPaise: number | undefined = undefined;
    const kMatch = query.match(/(\d+(?:\.\d+)?)\s*k/);
    const numMatch = query.match(/(?:₹|rs\.?|inr)?\s*(\d{3,6})/);

    if (kMatch) {
      extractedMaxPaise = Math.round(parseFloat(kMatch[1]) * 1000 * 100);
    } else if (numMatch) {
      extractedMaxPaise = parseInt(numMatch[1], 10) * 100;
    }
    // Naive baseline misses "hazaar", "rupaye", soft stretch, etc.

    // 3. Ambiguity check (very primitive)
    if (
      matchedCategory === "unspecified" ||
      query.includes("best course") ||
      query.includes("help me prepare")
    ) {
      const end = performance.now();
      return {
        missionId: mission.id,
        systemId: "BASELINE_A_DETERMINISTIC",
        recommendedOfferId: null,
        recommendedOfferName: null,
        recommendedPricePaise: null,
        isEligible: false,
        refusalReason: "Ambiguous query or unknown category.",
        clarificationRequested: true,
        clarificationPrompt: "Please specify the category or subject you want to prepare for.",
        explanation: "Naive baseline could not identify a clear category.",
        groundedFactsCount: 0,
        hallucinatedClaimsCount: 0,
        latencyMs: Math.max(1, Math.round(end - start)),
        apiCallsCount: 0,
      };
    }

    // 4. Filter candidate catalog by category
    const candidates = this.catalog.filter(
      (o) => o.product.category === matchedCategory && o.availability === "ACTIVE",
    );

    if (candidates.length === 0) {
      const end = performance.now();
      return {
        missionId: mission.id,
        systemId: "BASELINE_A_DETERMINISTIC",
        recommendedOfferId: null,
        recommendedOfferName: null,
        recommendedPricePaise: null,
        isEligible: false,
        refusalReason: `No offers found for category '${matchedCategory}'`,
        clarificationRequested: false,
        explanation: "No matching offers in catalog.",
        groundedFactsCount: 0,
        hallucinatedClaimsCount: 0,
        latencyMs: Math.max(1, Math.round(end - start)),
        apiCallsCount: 0,
      };
    }

    // 5. Naive budget filter
    const budgetFiltered = candidates.filter((c) => {
      if (!extractedMaxPaise) return true;
      return c.price <= extractedMaxPaise;
    });

    if (budgetFiltered.length === 0) {
      const end = performance.now();
      return {
        missionId: mission.id,
        systemId: "BASELINE_A_DETERMINISTIC",
        recommendedOfferId: null,
        recommendedOfferName: null,
        recommendedPricePaise: null,
        isEligible: false,
        refusalReason: `All offers exceed naive budget of ${extractedMaxPaise}`,
        clarificationRequested: false,
        explanation: "Offers exceed extracted price limit.",
        groundedFactsCount: 0,
        hallucinatedClaimsCount: 0,
        latencyMs: Math.max(1, Math.round(end - start)),
        apiCallsCount: 0,
      };
    }

    // 6. Naive sort: pick lowest price
    budgetFiltered.sort((a, b) => a.price - b.price);
    const chosen = budgetFiltered[0];

    const end = performance.now();
    return {
      missionId: mission.id,
      systemId: "BASELINE_A_DETERMINISTIC",
      recommendedOfferId: chosen.id,
      recommendedOfferName: chosen.name,
      recommendedPricePaise: chosen.price,
      isEligible: true,
      refusalReason: null,
      clarificationRequested: false,
      explanation: `Selected ${chosen.name} priced at ₹${chosen.price / 100} (lowest matching price).`,
      groundedFactsCount: 1,
      hallucinatedClaimsCount: 0,
      latencyMs: Math.max(1, Math.round(end - start)),
      apiCallsCount: 0,
    };
  }
}
