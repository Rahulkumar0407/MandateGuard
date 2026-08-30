import { describe, it, expect } from "vitest";
import {
  BuyerIntentEngine,
  DeterministicFastIntentProvider,
  MockIntentReasoningProvider,
} from "@/lib/intent";

describe("M10-B2 — Fast Buyer Brain & Intent Engine", () => {
  const engine = new BuyerIntentEngine(new DeterministicFastIntentProvider());

  it("extracts system design intent with hard budget ceiling from English query", async () => {
    const intent = await engine.extractIntent(
      "I need a monthly system design mentor under ₹4,000 strictly.",
    );

    expect(intent.category).toBe("system_design");
    expect(intent.budget?.amountPaise).toBe(400000);
    expect(intent.budget?.type).toBe("HARD");
    expect(intent.billing.cadence).toBe("monthly");
    expect(intent.mustHave).toContain("human_mentor");
    expect(intent.mustHave).toContain("system_design_curriculum");
    expect(intent.ambiguous).toBe(false);
    expect(engine.isReadyForEvaluation(intent)).toBe(true);
  });

  it("extracts intent from Hindi query accurately", async () => {
    const intent = await engine.extractIntent(
      "मुझे ₹4,000 के अंदर सिस्टम डिज़ाइन के लिए monthly mentor चाहिए।",
    );

    expect(intent.category).toBe("system_design");
    expect(intent.budget?.amountPaise).toBe(400000);
    expect(intent.budget?.type).toBe("HARD");
    expect(intent.mustHave).toContain("human_mentor");
    expect(intent.context?.language).toBe("hi");
  });

  it("extracts intent from Hinglish colloquial query accurately", async () => {
    const intent = await engine.extractIntent(
      "4k ke andar system design monthly human mentor chahiye, cheap bot review nahi.",
    );

    expect(intent.category).toBe("system_design");
    expect(intent.budget?.amountPaise).toBe(400000);
    expect(intent.budget?.type).toBe("HARD");
    expect(intent.mustHave).toContain("human_mentor");
    expect(intent.exclusions).toContain("automated_bot_only");
    expect(intent.context?.language).toBe("hi-latn");
  });

  it("handles soft budget constraints with elastic stretch semantics", async () => {
    const intent = await engine.extractIntent(
      "Looking for DSA preparation around 4k but can stretch for premium mentor.",
    );

    expect(intent.category).toBe("data_structures");
    expect(intent.budget?.amountPaise).toBe(400000);
    expect(intent.budget?.type).toBe("SOFT");
    expect(intent.budget?.stretchPercentage).toBe(15);
    expect(intent.budget?.maxStretchPaise).toBe(460000);
    expect(intent.qualityPreference?.level).toBe("premium");
    expect(intent.qualityPreference?.prioritizeQualityOverPrice).toBe(true);
  });

  it("handles vague/ambiguous queries safely without hallucinating constraints", async () => {
    const intent = await engine.extractIntent("I want to prepare for interviews.");

    expect(intent.ambiguous).toBe(true);
    expect(intent.clarificationNeeded).toBe(true);
    expect(intent.budget).toBeUndefined();
    expect(engine.isReadyForEvaluation(intent)).toBe(false);

    const clarifications = engine.getMissingConstraintClarifications(intent);
    expect(clarifications.length).toBeGreaterThan(0);
  });

  it("handles completely empty queries safely", async () => {
    const intent = await engine.extractIntent("   ");

    expect(intent.ambiguous).toBe(true);
    expect(intent.clarificationNeeded).toBe(true);
    expect(intent.category).toBe("unspecified");
    expect(engine.isReadyForEvaluation(intent)).toBe(false);
  });

  it("safely intercepts malformed provider output and falls back gracefully", async () => {
    const badProvider = new MockIntentReasoningProvider(async () => ({
      category: "system_design",
      budget: { amountPaise: "not-a-number", currency: "INVALID_CURRENCY" }, // Malformed
    }));

    const resilientEngine = new BuyerIntentEngine(badProvider);
    const intent = await resilientEngine.extractIntent("test query");

    // Engine must not crash or throw uncaught exception
    expect(intent.ambiguous).toBe(true);
    expect(intent.clarificationNeeded).toBe(true);
    expect(intent.clarificationReasons?.[0]).toContain("Reasoning provider failed");
    expect(resilientEngine.isReadyForEvaluation(intent)).toBe(false);
  });

  it("safely intercepts provider runtime exceptions and falls back gracefully", async () => {
    const failingProvider = new MockIntentReasoningProvider(async () => {
      throw new Error("Network timeout contacting LLM backend");
    });

    const resilientEngine = new BuyerIntentEngine(failingProvider);
    const intent = await resilientEngine.extractIntent("Need DSA course");

    expect(intent.ambiguous).toBe(true);
    expect(intent.clarificationNeeded).toBe(true);
    expect(intent.clarificationReasons?.[0]).toContain(
      "Network timeout contacting LLM backend",
    );
  });
});
