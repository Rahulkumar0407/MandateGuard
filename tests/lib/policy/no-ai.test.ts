import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { evaluatePolicy } from "@/lib/policy/engine";

const POLICY_DIR = resolve(process.cwd(), "lib/policy");

// STEP 20 — the policy layer must have NO LLM dependency. It consumes already
// structured findings and decides deterministically.
const FORBIDDEN_TOKENS = [
  "@/lib/agent",
  "openai",
  "anthropic",
  "gemini",
  "LLMProvider",
  "SemanticIntegrityProvider",
  "extractIntent",
  "RealLLMProvider",
  "MockLLMProvider",
  "chat.completions",
  "fetch(",
];

describe("M6 — policy has no LLM dependency", () => {
  const files = ["types.ts", "engine.ts", "service.ts", "index.ts"];

  for (const file of files) {
    it(`${file} imports no LLM / semantic-AI provider`, () => {
      const src = readFileSync(resolve(POLICY_DIR, file), "utf8");
      for (const token of FORBIDDEN_TOKENS) {
        expect(
          src.toLowerCase().includes(token.toLowerCase()),
          `unexpected token "${token}" in ${file}`,
        ).toBe(false);
      }
    });
  }

  it("evaluatePolicy is synchronous and references no provider", () => {
    expect(typeof evaluatePolicy).toBe("function");
    const result = evaluatePolicy({
      mandateId: "m1",
      baselineOfferVersion: 1,
      currentOfferVersion: 1,
      overall: "UNCHANGED",
      findings: [],
      semanticStatus: "AVAILABLE",
      semanticFindings: [],
      generatedAt: "2026-01-01T00:00:00.000Z",
    });
    // Synchronous return proves no async LLM round-trip.
    expect(result.decision).toBe("ALLOW");
  });
});
