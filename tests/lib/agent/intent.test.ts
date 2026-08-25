import { describe, it, expect } from "vitest";
import { IntentEngine, MockLLMProvider } from "@/lib/agent/intent";
import type { LLMProvider } from "@/lib/agent/provider";

describe("IntentEngine — extraction examples", () => {
  const engine = new IntentEngine(new MockLLMProvider());

  it("parses system-design + ₹5,000/month", async () => {
    const intent = await engine.extractIntent(
      "I need system-design interview preparation under ₹5,000/month.",
    );
    expect(intent.category).toBe("system-design");
    expect(intent.maxMonthlyAmount).toBe(5000);
    expect(intent.currency).toBe("INR");
    expect(intent.requiredFeatures).toEqual([]);
    expect(intent.ambiguous).toBe(false);
  });

  it("parses DSA + ₹3,000/month", async () => {
    const intent = await engine.extractIntent(
      "I want DSA preparation and my budget is ₹3,000 per month.",
    );
    expect(intent.category).toBe("data-structures");
    expect(intent.maxMonthlyAmount).toBe(3000);
    expect(intent.currency).toBe("INR");
  });

  it("parses required mock interviews + ₹2,000/month", async () => {
    const intent = await engine.extractIntent(
      "I need mock interviews for less than ₹2,000/month.",
    );
    expect(intent.category).toBe("mock-interviews");
    expect(intent.maxMonthlyAmount).toBe(2000);
    expect(intent.requiredFeatures).toContain("mock_interviews");
  });

  it("does NOT invent a budget when none is stated", async () => {
    const intent = await engine.extractIntent(
      "I need system-design interview preparation.",
    );
    expect(intent.maxMonthlyAmount).toBeUndefined();
    expect(intent.currency).toBeUndefined();
    expect(intent.category).toBe("system-design");
  });

  it("returns an ambiguous representation for vague input", async () => {
    const intent = await engine.extractIntent("I want to prepare for interviews.");
    expect(intent.ambiguous).toBe(true);
    expect(intent.maxMonthlyAmount).toBeUndefined();
    expect(intent.category).toBeUndefined();
  });
});

describe("IntentEngine — amount parsing reliability", () => {
  const engine = new IntentEngine(new MockLLMProvider());

  it("handles 'maximum ₹5k monthly'", async () => {
    const intent = await engine.extractIntent("maximum ₹5k monthly");
    expect(intent.maxMonthlyAmount).toBe(5000);
  });

  it("handles 'up to 3,500 INR per month'", async () => {
    const intent = await engine.extractIntent("up to 3,500 INR per month");
    expect(intent.maxMonthlyAmount).toBe(3500);
  });

  it("handles 'budget is ₹4,000'", async () => {
    const intent = await engine.extractIntent("budget is ₹4,000");
    expect(intent.maxMonthlyAmount).toBe(4000);
  });
});

describe("IntentEngine — invalid provider output is rejected safely", () => {
  it("throws rather than acting on malformed structured output", async () => {
    const badProvider: LLMProvider = {
      extractIntent: async () => ({ maxMonthlyAmount: "not-a-number" }),
    };
    const engine = new IntentEngine(badProvider);
    await expect(engine.extractIntent("anything")).rejects.toThrow();
  });
});
