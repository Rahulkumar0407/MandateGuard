// LLM provider boundary. The Intent Engine depends only on this interface, so
// the production path can use a real LLM while tests inject a deterministic
// mock. No DI framework — just an interface + factory seam.

export interface LLMProvider {
  // Returns raw structured output. It may be invalid; the engine validates it.
  extractIntent(message: string): Promise<unknown>;
}

// ---------------------------------------------------------------------------
// MockLLMProvider — deterministic, offline intent extraction.
//
// This is a real (not random) implementation used in tests and as a fallback.
// It performs reliable amount/currency/feature normalization itself so the
// final numeric comparisons remain the application's responsibility.
// ---------------------------------------------------------------------------
export class MockLLMProvider implements LLMProvider {
  async extractIntent(message: string): Promise<unknown> {
    return extractIntentFromText(message);
  }
}

// ---------------------------------------------------------------------------
// RealLLMProvider — production seam.
//
// Intentionally a stub in this environment: it would call a hosted LLM with a
// strict JSON schema and an untrusted-content instruction. Without credentials
// it fails safely. It must NEVER invent a budget or follow merchant text.
// ---------------------------------------------------------------------------
export class RealLLMProvider implements LLMProvider {
  async extractIntent(): Promise<unknown> {
    throw new Error(
      "RealLLMProvider is not configured (no LLM credentials in this environment).",
    );
  }
}

const CATEGORY_MAP: Array<[RegExp, string]> = [
  [/system[-\s]?design/i, "system-design"],
  [/dsa|data[-\s]?structure/i, "data-structures"],
  [/mock[-\s]?interview/i, "mock-interviews"],
  [/accelerator|full interview/i, "bundles"],
  [/career|resume|linkedin/i, "career"],
];

const FEATURE_MAP: Array<[RegExp, string]> = [
  [/mock[-\s]?interview/i, "mock_interviews"],
  [/mentor/i, "mentor_feedback"],
  [/capstone/i, "capstone_review"],
  [/resume/i, "resume_review"],
];

const BUDGET_HINT =
  /(under|below|less than|budget|max|up to|within|per month|monthly|\/month|₹|\$|rs|inr|usd|rupees)/i;

export function extractIntentFromText(text: string): Record<string, unknown> {
  const intent: Record<string, unknown> = {};

  // Currency
  let currency: string | undefined;
  if (/\$|usd/i.test(text)) currency = "USD";
  else if (/₹|inr|rs\.?|rupees?/i.test(text)) currency = "INR";

  // Amount (treated as a MAX monthly budget when present alongside a hint)
  const amt = text.match(
    /(?:₹|\$|rs\.?|inr|usd|rupees?)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|lakh|lakhs)?/i,
  );
  if (amt && BUDGET_HINT.test(text)) {
    let value = parseFloat(amt[1].replace(/,/g, ""));
    const mult = amt[2]
      ? amt[2].toLowerCase() === "k"
        ? 1000
        : 100000
      : 1;
    value = value * mult;
    intent.maxMonthlyAmount = value;
    intent.currency = currency ?? "INR";
  }

  // Category
  for (const [re, cat] of CATEGORY_MAP) {
    if (re.test(text)) {
      intent.category = cat;
      break;
    }
  }

  // Purpose
  if (/interview/i.test(text)) intent.purpose = "interview_preparation";

  // Required features (treated as requirements when the user "needs" them)
  const requiredFeatures: string[] = [];
  for (const [re, feat] of FEATURE_MAP) {
    if (re.test(text)) requiredFeatures.push(feat);
  }
  if (requiredFeatures.length) intent.requiredFeatures = requiredFeatures;

  // Ambiguity: do not hallucinate constraints when nothing usable was found.
  const hasConstraint =
    Boolean(intent.category) ||
    intent.maxMonthlyAmount != null ||
    requiredFeatures.length > 0;
  intent.ambiguous = !hasConstraint;

  return intent;
}
