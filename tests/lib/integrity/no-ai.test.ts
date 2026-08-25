import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { evaluateIntegrity } from "@/lib/integrity/engine";

const INTEGRITY_DIR = resolve(process.cwd(), "lib/integrity");

const AI_TOKENS = [
  "LLMProvider",
  "RealLLMProvider",
  "MockLLMProvider",
  "extractIntent",
  "@/lib/agent",
  "openai",
  "anthropic",
  "gemini",
  "embedding",
  "chat.completions",
  "fetch(",
];

describe("M4-A — AI dependency guard (deterministic core only)", () => {
  // M5-A intentionally introduces an LLM-backed semantic evaluator in
  // semantic.ts / semantic-provider.ts and wires it through service.ts /
  // index.ts. This guard proves the DETERMINISTIC core remains AI-free — the
  // LLM is isolated to the M5 semantic module and is never invoked by M4.
  const files = [
    "types.ts",
    "price.ts",
    "entitlements.ts",
    "duration.ts",
    "refund.ts",
    "engine.ts",
  ];

  for (const file of files) {
    it(`${file} contains no LLM / semantic-AI dependency`, () => {
      const src = readFileSync(resolve(INTEGRITY_DIR, file), "utf8");
      for (const token of AI_TOKENS) {
        expect(
          src.toLowerCase().includes(token.toLowerCase()),
          `unexpected AI token "${token}" in ${file}`,
        ).toBe(false);
      }
    });
  }

  it("evaluateIntegrity is synchronous (no awaited provider call)", () => {
    expect(typeof evaluateIntegrity).toBe("function");
    const report = evaluateIntegrity({
      mandateId: "m1",
      baseline: {
        productId: "p1",
        offerVersion: 1,
        price: 100,
        currency: "INR",
        billingInterval: "monthly",
        duration: 30,
        entitlementKeys: [],
        refundWindowDays: 7,
      },
      current: null,
    });
    // Synchronous return proves no async LLM round-trip.
    expect(report.overall).toBe("CURRENT_OFFER_UNAVAILABLE");
  });
});
