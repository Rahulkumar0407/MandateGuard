import { describe, it, expect } from "vitest";
import {
  normalizeBuyerIntent,
  normalizeFeatureKey,
  normalizeFeatureArray,
  serializeCanonicalBuyerIntent,
  computeBuyerIntentHash,
  areBuyerIntentsSemanticallyEquivalent,
  compareBuyerIntents,
  EN_INTENT_SYSTEM_DESIGN,
  HI_INTENT_SYSTEM_DESIGN,
  HINGLISH_INTENT_SYSTEM_DESIGN,
  SOFT_BUDGET_STRETCH_INTENT,
  AMBIGUOUS_INTENT,
} from "@/lib/intent";

describe("M10-B1 — Buyer Intent Normalization & Canonicalization", () => {
  it("normalizes individual feature keys to lower snake_case", () => {
    expect(normalizeFeatureKey("Mock Interviews")).toBe("mock_interviews");
    expect(normalizeFeatureKey("human-mentor")).toBe("human_mentor");
    expect(normalizeFeatureKey(" 1:1 sessions ")).toBe("1:1_sessions");
    expect(normalizeFeatureKey("SYSTEM_DESIGN")).toBe("system_design");
  });

  it("normalizes, deduplicates, and sorts feature arrays", () => {
    const raw = [
      "mock_interviews",
      "Mock Interviews",
      "human-mentor",
      "HUMAN_MENTOR",
      "architecture_reviews",
    ];
    const normalized = normalizeFeatureArray(raw);
    expect(normalized).toEqual([
      "architecture_reviews",
      "human_mentor",
      "mock_interviews",
    ]);
  });

  it("normalizes English, Hindi, and Hinglish intents to identical canonical semantic representations", () => {
    const enCanonical = normalizeBuyerIntent(EN_INTENT_SYSTEM_DESIGN);
    const hiCanonical = normalizeBuyerIntent(HI_INTENT_SYSTEM_DESIGN);
    const hinglishCanonical = normalizeBuyerIntent(HINGLISH_INTENT_SYSTEM_DESIGN);

    // Hard constraints and semantic fields must be identical
    expect(enCanonical.category).toBe("system_design");
    expect(hiCanonical.category).toBe("system_design");
    expect(hinglishCanonical.category).toBe("system_design");

    expect(enCanonical.budget?.amountPaise).toBe(400000);
    expect(hiCanonical.budget?.amountPaise).toBe(400000);
    expect(hinglishCanonical.budget?.amountPaise).toBe(400000);

    expect(enCanonical.mustHave).toEqual(["human_mentor", "system_design_curriculum"]);
    expect(hiCanonical.mustHave).toEqual(["human_mentor", "system_design_curriculum"]);
    expect(hinglishCanonical.mustHave).toEqual(["human_mentor", "system_design_curriculum"]);

    // Cryptographic hashes across English, Hindi, and Hinglish canonical models must match
    expect(computeBuyerIntentHash(enCanonical)).toBe(computeBuyerIntentHash(hiCanonical));
    expect(computeBuyerIntentHash(enCanonical)).toBe(computeBuyerIntentHash(hinglishCanonical));
    expect(areBuyerIntentsSemanticallyEquivalent(enCanonical, hiCanonical)).toBe(true);
    expect(areBuyerIntentsSemanticallyEquivalent(enCanonical, hinglishCanonical)).toBe(true);
  });

  it("deduplicates features and eliminates niceToHave items that exist in mustHave", () => {
    const raw = {
      category: "dsa_prep",
      billing: { cadence: "monthly", isRecurring: true },
      mustHave: ["Mock Interviews", "Live Classes"],
      niceToHave: ["mock-interviews", "1:1 Reviews"], // "mock_interviews" is redundant
    };
    const canonical = normalizeBuyerIntent(raw);

    expect(canonical.mustHave).toEqual(["live_classes", "mock_interviews"]);
    expect(canonical.niceToHave).toEqual(["1:1_reviews"]); // "mock_interviews" removed from niceToHave
  });

  it("handles HARD budget constraints by clearing stretch parameters", () => {
    const raw = {
      category: "system_design",
      billing: { cadence: "monthly", isRecurring: true },
      budget: {
        amountPaise: 350000,
        currency: "INR",
        type: "HARD",
      },
    };
    const canonical = normalizeBuyerIntent(raw);
    expect(canonical.budget?.type).toBe("HARD");
    expect(canonical.budget?.stretchPercentage).toBeUndefined();
    expect(canonical.budget?.maxStretchPaise).toBeUndefined();
  });

  it("handles SOFT budget constraints by calculating maxStretchPaise automatically", () => {
    const canonical = normalizeBuyerIntent(SOFT_BUDGET_STRETCH_INTENT);
    expect(canonical.budget?.type).toBe("SOFT");
    expect(canonical.budget?.amountPaise).toBe(400000);
    expect(canonical.budget?.stretchPercentage).toBe(15);
    expect(canonical.budget?.maxStretchPaise).toBe(460000); // 400000 * 1.15
  });

  it("handles ambiguous / underspecified intents safely", () => {
    const canonical = normalizeBuyerIntent(AMBIGUOUS_INTENT);
    expect(canonical.ambiguous).toBe(true);
    expect(canonical.clarificationNeeded).toBe(true);
    expect(canonical.clarificationReasons?.length).toBeGreaterThan(0);
  });

  it("produces deterministic serialization strings with sorted keys", () => {
    const canonical = normalizeBuyerIntent(EN_INTENT_SYSTEM_DESIGN);
    const serialized1 = serializeCanonicalBuyerIntent(canonical);
    const serialized2 = serializeCanonicalBuyerIntent(canonical);

    expect(serialized1).toBe(serialized2);
    expect(serialized1).toContain('"category":"system_design"');
    expect(serialized1).toContain('"amountPaise":400000');
  });

  it("detects differences accurately via compareBuyerIntents", () => {
    const base = normalizeBuyerIntent(EN_INTENT_SYSTEM_DESIGN);
    const modified = normalizeBuyerIntent({
      ...EN_INTENT_SYSTEM_DESIGN,
      budget: {
        amountPaise: 500000,
        currency: "INR",
        type: "HARD",
      },
      mustHave: ["system_design_curriculum", "human_mentor", "placement_support"],
    });

    const diff = compareBuyerIntents(base, modified);
    expect(diff.isEquivalent).toBe(false);
    expect(diff.hardConstraintMatch).toBe(false);
    expect(diff.budgetMatch).toBe(false);
    expect(diff.differences.length).toBeGreaterThanOrEqual(2);
  });

  it("rejects invalid budget amounts (negative or non-integer)", () => {
    expect(() =>
      normalizeBuyerIntent({
        category: "test",
        billing: { cadence: "monthly" },
        budget: {
          amountPaise: -500,
          currency: "INR",
          type: "HARD",
        },
      }),
    ).toThrow();
  });

  it("rejects malformed currency codes", () => {
    expect(() =>
      normalizeBuyerIntent({
        category: "test",
        billing: { cadence: "monthly" },
        budget: {
          amountPaise: 50000,
          currency: "INVALID_CURRENCY",
          type: "HARD",
        },
      }),
    ).toThrow();
  });

  it("rejects unsupported billing cadences", () => {
    expect(() =>
      normalizeBuyerIntent({
        category: "test",
        billing: { cadence: "millennium" }, // invalid
      }),
    ).toThrow();
  });
});
