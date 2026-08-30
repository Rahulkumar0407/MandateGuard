import { createHash } from "node:crypto";
import type { CanonicalBuyerIntent } from "./types";

/**
 * Deterministically sorts all object keys recursively to produce a stable JSON string.
 */
export function stableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return "null";
  }
  if (typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${obj.map((item) => stableStringify(item)).join(",")}]`;
  }

  const record = obj as Record<string, unknown>;
  const sortedKeys = Object.keys(record).sort();
  const entries: string[] = [];

  for (const key of sortedKeys) {
    const value = record[key];
    if (value !== undefined) {
      entries.push(`${JSON.stringify(key)}:${stableStringify(value)}`);
    }
  }

  return `{${entries.join(",")}}`;
}

/**
 * Serializes a CanonicalBuyerIntent into a deterministic, stable string.
 * Excludes transient context like rawQuery and channel to focus on semantic content.
 */
export function serializeCanonicalBuyerIntent(intent: CanonicalBuyerIntent): string {
  const semanticPayload = {
    category: intent.category,
    budget: intent.budget
      ? {
          amountPaise: intent.budget.amountPaise,
          currency: intent.budget.currency,
          type: intent.budget.type,
          stretchPercentage: intent.budget.stretchPercentage,
          maxStretchPaise: intent.budget.maxStretchPaise,
        }
      : undefined,
    billing: {
      cadence: intent.billing.cadence,
      isRecurring: intent.billing.isRecurring,
    },
    mustHave: intent.mustHave,
    niceToHave: intent.niceToHave,
    exclusions: intent.exclusions,
    supportPreference: intent.supportPreference
      ? {
          tier: intent.supportPreference.tier,
          hasDedicatedHuman: intent.supportPreference.hasDedicatedHuman,
          minSessionsPerMonth: intent.supportPreference.minSessionsPerMonth,
          maxSlaHours: intent.supportPreference.maxSlaHours,
        }
      : undefined,
    qualityPreference: intent.qualityPreference
      ? {
          level: intent.qualityPreference.level,
          prioritizeQualityOverPrice: intent.qualityPreference.prioritizeQualityOverPrice,
        }
      : undefined,
    urgency: intent.urgency,
    ambiguous: intent.ambiguous,
    clarificationNeeded: intent.clarificationNeeded,
  };

  return stableStringify(semanticPayload);
}

/**
 * Computes a SHA-256 cryptographic fingerprint for a CanonicalBuyerIntent.
 */
export function computeBuyerIntentHash(intent: CanonicalBuyerIntent): string {
  const serialized = serializeCanonicalBuyerIntent(intent);
  return createHash("sha256").update(serialized).digest("hex");
}
