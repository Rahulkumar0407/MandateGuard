import type {
  CanonicalBuyerIntent,
  InteractionChannel,
  RawCandidateIntentInput,
} from "./index";

/**
 * Session context provided to intent reasoning providers.
 */
export interface BuyerSessionContext {
  userId?: string;
  locale?: string;
  preferredCurrency?: string;
  channel?: InteractionChannel;
  previousIntent?: CanonicalBuyerIntent;
}

/**
 * Provider-neutral interface for intent extraction models.
 * Implementation can be an LLM (Gemini, Claude, GPT), an open model,
 * or a fast deterministic local rules parser.
 */
export interface IntentReasoningProvider {
  understandIntent(input: {
    query: string;
    context?: BuyerSessionContext;
  }): Promise<unknown>;
}

/**
 * Fast, deterministic local rule-based intent provider.
 * Implements high-speed parsing for English, Hindi, Hinglish, and voice transcriptions
 * without requiring external network calls.
 */
export class DeterministicFastIntentProvider implements IntentReasoningProvider {
  async understandIntent(input: {
    query: string;
    context?: BuyerSessionContext;
  }): Promise<RawCandidateIntentInput> {
    const rawQuery = input.query.trim();
    const query = rawQuery.toLowerCase();

    // 1. Language & Channel Detection
    let language = input.context?.locale?.split("-")[0] || "en";
    if (/[\u0900-\u097F]/.test(rawQuery)) {
      language = "hi";
    } else if (/\b(chahiye|andar|aas paas|bhai|wala|nahi|zaruri|ka)\b/i.test(query)) {
      language = "hi-Latn";
    }

    // 2. Category Extraction
    let category = "interview_prep";
    let isCategorySpecific = false;
    if (
      query.includes("system design") ||
      query.includes("system-design") ||
      query.includes("सिस्टम डिज़ाइन") ||
      query.includes("hld") ||
      query.includes("lld")
    ) {
      category = "system_design";
      isCategorySpecific = true;
    } else if (
      query.includes("dsa") ||
      query.includes("data structure") ||
      query.includes("algorithms") ||
      query.includes("leet")
    ) {
      category = "data_structures";
      isCategorySpecific = true;
    } else if (
      query.includes("leadership") ||
      query.includes("behavioral") ||
      query.includes("management")
    ) {
      category = "engineering_leadership";
      isCategorySpecific = true;
    } else if (
      query.includes("mock interview") ||
      query.includes("mock session")
    ) {
      category = "mock_interviews";
      isCategorySpecific = true;
    }

    // 3. Budget & Hard/Soft Constraint Extraction
    let budget: RawCandidateIntentInput["budget"] = undefined;
    const amountMatch =
      query.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)?(?:\.\d+)?)\s*k?\b/i) ||
      query.match(/(\d+)k\b/i);

    if (amountMatch) {
      const numericStr = amountMatch[1].replace(/,/g, "");
      let parsedNum = parseFloat(numericStr);
      if (amountMatch[0].toLowerCase().includes("k")) {
        parsedNum = parsedNum * 1000;
      } else if (parsedNum < 100 && !query.includes("paise")) {
        // e.g. "4k" parsed as 4 with k elsewhere
        if (query.match(/\b\d+k\b/i)) {
          parsedNum = parsedNum * 1000;
        }
      }

      if (!isNaN(parsedNum) && parsedNum > 0) {
        const amountPaise = Math.round(parsedNum * 100);
        let budgetType: "HARD" | "SOFT" = "HARD";
        let stretchPercentage: number | undefined = undefined;

        const isSoft =
          query.includes("around") ||
          query.includes("approx") ||
          query.includes("aas paas") ||
          query.includes("stretch") ||
          query.includes("thoda") ||
          query.includes("preferred");

        const isHard =
          query.includes("strictly") ||
          query.includes("under") ||
          query.includes("ke andar") ||
          query.includes("max") ||
          query.includes("ke niche") ||
          query.includes("less than") ||
          query.includes("below");

        if (isSoft && !query.includes("strictly")) {
          budgetType = "SOFT";
          if (query.includes("stretch") || query.includes("thoda")) {
            stretchPercentage = 15;
          }
        } else if (isHard) {
          budgetType = "HARD";
        }

        budget = {
          amountPaise,
          currency: input.context?.preferredCurrency || "INR",
          type: budgetType,
          stretchPercentage,
        };
      }
    }

    // 4. Billing Cadence Extraction
    let cadence: "monthly" | "yearly" | "quarterly" | "one_time" | "any" = "monthly";
    if (query.includes("yearly") || query.includes("annual") || query.includes("saal")) {
      cadence = "yearly";
    } else if (query.includes("one time") || query.includes("single payment")) {
      cadence = "one_time";
    } else if (
      query.includes("monthly") ||
      query.includes("per month") ||
      query.includes("/mo") ||
      query.includes("mahina") ||
      query.includes("har mahine")
    ) {
      cadence = "monthly";
    } else if (!budget && !isCategorySpecific) {
      cadence = "any";
    }

    // 5. Entitlements Extraction (Must-Have vs Exclusions)
    const mustHave: string[] = [];
    const niceToHave: string[] = [];
    const exclusions: string[] = [];

    if (
      query.includes("human mentor") ||
      query.includes("mentor") ||
      query.includes("human wala") ||
      query.includes("1:1") ||
      query.includes("mentorship") ||
      query.includes("मेंटर")
    ) {
      mustHave.push("human_mentor");
    }

    if (
      query.includes("mock interview") ||
      query.includes("mock") ||
      query.includes("interview practice")
    ) {
      mustHave.push("mock_interviews");
    }

    if (query.includes("system design") || query.includes("hld")) {
      mustHave.push("system_design_curriculum");
    } else if (query.includes("dsa") || query.includes("algorithm")) {
      mustHave.push("dsa_curriculum");
    }

    if (
      query.includes("no bot") ||
      query.includes("bot review nahi") ||
      query.includes("no automated") ||
      query.includes("cheap bot nahi")
    ) {
      exclusions.push("automated_bot_only");
    }

    // 6. Support Preferences
    let hasDedicatedHuman: boolean | undefined = undefined;
    let tier: "dedicated_mentor" | "priority_email" | "community" | "standard" | "any" =
      "standard";

    if (
      query.includes("human") ||
      query.includes("mentor") ||
      query.includes("1:1") ||
      query.includes("human wala")
    ) {
      hasDedicatedHuman = true;
      tier = "dedicated_mentor";
    } else if (query.includes("discord") || query.includes("community")) {
      tier = "community";
      hasDedicatedHuman = false;
    }

    // 7. Quality Preferences
    let qualityLevel: "best_value" | "premium" | "budget" | "standard" = "best_value";
    let prioritizeQualityOverPrice = false;

    if (
      query.includes("premium") ||
      query.includes("best quality") ||
      query.includes("top quality") ||
      query.includes("cheap nahi, acha chahiye") ||
      query.includes("stretch")
    ) {
      qualityLevel = "premium";
      prioritizeQualityOverPrice = true;
    } else if (query.includes("cheap") || query.includes("sasta") || query.includes("budget")) {
      qualityLevel = "budget";
    }

    // 8. Ambiguity & Clarification Decision
    const ambiguous = !isCategorySpecific && !budget && mustHave.length === 0;
    const clarificationReasons: string[] = [];

    if (ambiguous) {
      clarificationReasons.push(
        "Query is too broad. Please specify target topic (System Design, DSA, etc.) and budget.",
      );
    } else if (!budget && !query.includes("any budget")) {
      // Missing budget preference
      clarificationReasons.push("Budget preference not specified.");
    }

    return {
      category,
      budget,
      billing: {
        cadence,
        isRecurring: cadence !== "one_time",
      },
      mustHave,
      niceToHave,
      exclusions,
      supportPreference: {
        tier,
        hasDedicatedHuman,
        minSessionsPerMonth: hasDedicatedHuman ? 1 : undefined,
      },
      qualityPreference: {
        level: qualityLevel,
        prioritizeQualityOverPrice,
      },
      urgency: query.includes("urgent") || query.includes("soon") ? "high" : "medium",
      context: {
        language,
        locale: input.context?.locale || (language === "hi" ? "hi-IN" : "en-IN"),
        channel: input.context?.channel || "text",
        rawQuery,
      },
      ambiguous,
      clarificationNeeded: ambiguous,
      clarificationReasons: clarificationReasons.length > 0 ? clarificationReasons : undefined,
    };
  }
}

/**
 * Mock intent reasoning provider for testing.
 */
export class MockIntentReasoningProvider implements IntentReasoningProvider {
  constructor(private customHandler?: (input: { query: string }) => Promise<unknown>) {}

  async understandIntent(input: {
    query: string;
    context?: BuyerSessionContext;
  }): Promise<unknown> {
    if (this.customHandler) {
      return this.customHandler(input);
    }
    // Default fallback to deterministic rules
    const fast = new DeterministicFastIntentProvider();
    return fast.understandIntent(input);
  }
}
