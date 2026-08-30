import { CanonicalBuyerIntentSchema } from "./schema";
import type {
  CanonicalBuyerIntent,
  IntentBudget,
  IntentBilling,
  IntentSupportPreference,
  IntentQualityPreference,
  IntentContext,
} from "./types";

/**
 * Normalizes a raw feature/entitlement string into standard snake_case lowercase token.
 * Examples:
 *  "Mock Interviews" -> "mock_interviews"
 *  "human-mentor"    -> "human_mentor"
 *  " 1:1 sessions "  -> "1:1_sessions"
 */
export function normalizeFeatureKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^\w:]/g, "");
}

/**
 * Normalizes an array of feature keys:
 * 1. Converts each to normalized snake_case token.
 * 2. Filters out empty strings.
 * 3. Deduplicates entries.
 * 4. Sorts alphabetically for deterministic ordering.
 */
export function normalizeFeatureArray(keys?: string[]): string[] {
  if (!keys || !Array.isArray(keys)) return [];
  const normalized = keys
    .map(normalizeFeatureKey)
    .filter((k) => k.length > 0);
  return Array.from(new Set(normalized)).sort((a, b) => a.localeCompare(b));
}

/**
 * Normalizes a budget object:
 * - HARD budget: stretch fields are cleared.
 * - SOFT budget: computes maxStretchPaise if stretchPercentage is provided.
 */
export function normalizeBudget(budget?: IntentBudget): IntentBudget | undefined {
  if (!budget) return undefined;

  const amountPaise = Math.round(budget.amountPaise);
  const currency = budget.currency.trim().toUpperCase();

  if (budget.type === "HARD") {
    return {
      amountPaise,
      currency,
      type: "HARD",
    };
  }

  let maxStretchPaise = budget.maxStretchPaise
    ? Math.round(budget.maxStretchPaise)
    : undefined;

  if (budget.stretchPercentage && budget.stretchPercentage > 0 && !maxStretchPaise) {
    maxStretchPaise = Math.round(amountPaise * (1 + budget.stretchPercentage / 100));
  }

  return {
    amountPaise,
    currency,
    type: "SOFT",
    stretchPercentage: budget.stretchPercentage,
    maxStretchPaise,
  };
}

/**
 * Normalizes billing preferences.
 */
export function normalizeBilling(billing?: Partial<IntentBilling>): IntentBilling {
  return {
    cadence: billing?.cadence || "monthly",
    isRecurring: billing?.isRecurring !== undefined ? billing.isRecurring : true,
  };
}

/**
 * Normalizes support preferences.
 */
export function normalizeSupportPreference(
  support?: IntentSupportPreference,
): IntentSupportPreference | undefined {
  if (!support) return undefined;
  return {
    tier: support.tier || "any",
    hasDedicatedHuman: support.hasDedicatedHuman,
    minSessionsPerMonth:
      support.minSessionsPerMonth !== undefined
        ? Math.round(support.minSessionsPerMonth)
        : undefined,
    maxSlaHours:
      support.maxSlaHours !== undefined
        ? Math.round(support.maxSlaHours)
        : undefined,
  };
}

/**
 * Normalizes quality preferences.
 */
export function normalizeQualityPreference(
  quality?: IntentQualityPreference,
): IntentQualityPreference | undefined {
  if (!quality) return undefined;
  return {
    level: quality.level || "best_value",
    prioritizeQualityOverPrice: Boolean(quality.prioritizeQualityOverPrice),
  };
}

/**
 * Normalizes context metadata.
 */
export function normalizeContext(context?: IntentContext): IntentContext | undefined {
  if (!context) return undefined;
  return {
    language: context.language ? context.language.trim().toLowerCase() : undefined,
    locale: context.locale ? context.locale.trim() : undefined,
    channel: context.channel,
    rawQuery: context.rawQuery ? context.rawQuery.trim() : undefined,
  };
}

/**
 * Validates and canonicalizes a candidate buyer intent.
 * Enforces:
 * - Zod schema validation.
 * - Deduplication and sorting of entitlements.
 * - Removal of niceToHave items already present in mustHave.
 * - Deterministic constraint normalization.
 */
export function normalizeBuyerIntent(raw: unknown): CanonicalBuyerIntent {
  const parsed = CanonicalBuyerIntentSchema.parse(raw);

  const category = parsed.category
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  const mustHave = normalizeFeatureArray(parsed.mustHave);

  // Filter out any niceToHave feature that is already in mustHave
  const niceToHaveRaw = normalizeFeatureArray(parsed.niceToHave);
  const mustHaveSet = new Set(mustHave);
  const niceToHave = niceToHaveRaw.filter((feat) => !mustHaveSet.has(feat));

  const exclusions = normalizeFeatureArray(parsed.exclusions);

  const budget = normalizeBudget(parsed.budget);
  const billing = normalizeBilling(parsed.billing);
  const supportPreference = normalizeSupportPreference(parsed.supportPreference);
  const qualityPreference = normalizeQualityPreference(parsed.qualityPreference);
  const context = normalizeContext(parsed.context);

  const ambiguous = Boolean(parsed.ambiguous);
  let clarificationNeeded = Boolean(parsed.clarificationNeeded);
  if (ambiguous) {
    clarificationNeeded = true;
  }

  const clarificationReasons = parsed.clarificationReasons
    ? Array.from(new Set(parsed.clarificationReasons.map((r) => r.trim()))).filter(
        (r) => r.length > 0,
      )
    : undefined;

  return {
    category,
    budget,
    billing,
    mustHave,
    niceToHave,
    exclusions,
    supportPreference,
    qualityPreference,
    urgency: parsed.urgency,
    context,
    ambiguous,
    clarificationNeeded,
    clarificationReasons,
  };
}
