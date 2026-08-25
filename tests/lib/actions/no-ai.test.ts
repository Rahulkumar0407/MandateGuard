import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const ACTIONS_DIR = resolve(process.cwd(), "lib/actions");
const AUDIT_DIR = resolve(process.cwd(), "lib/audit");
const AGENT_DIR = resolve(process.cwd(), "lib/agent");

// STEP 20 — the AI must have NO access to the action boundary. The permitted
// chain is:
//   AI -> Offer -> User authorization -> Integrity -> Policy -> ActionExecutor
// The AI may only produce intent/recommendation.
const AI_TOKENS = [
  "@/lib/agent",
  "LLMProvider",
  "MockLLMProvider",
  "RealLLMProvider",
  "extractIntent",
  "evaluateEligibility",
  "openai",
  "anthropic",
  "gemini",
  "chat.completions",
  "SemanticIntegrityProvider",
];

describe("M7-A — the action layer has no AI dependency (STEP 20)", () => {
  const files = ["types.ts", "gateway.ts", "repository.ts", "executor.ts", "index.ts"];

  for (const file of files) {
    it(`lib/actions/${file} imports no LLM / agent module`, () => {
      const src = readFileSync(resolve(ACTIONS_DIR, file), "utf8");
      for (const token of AI_TOKENS) {
        expect(
          src.toLowerCase().includes(token.toLowerCase()),
          `unexpected AI token "${token}" in actions/${file}`,
        ).toBe(false);
      }
    });
  }

  for (const file of ["types.ts", "redact.ts", "repository.ts", "service.ts", "index.ts"]) {
    it(`lib/audit/${file} imports no LLM / agent module`, () => {
      const src = readFileSync(resolve(AUDIT_DIR, file), "utf8");
      for (const token of AI_TOKENS) {
        expect(
          src.toLowerCase().includes(token.toLowerCase()),
          `unexpected AI token "${token}" in audit/${file}`,
        ).toBe(false);
      }
    });
  }
});

describe("M7-A — the AI layer cannot reach the action boundary (STEP 20)", () => {
  const FORBIDDEN_FOR_AI = [
    "@/lib/actions",
    "ActionExecutor",
    "pauseSubscription",
    "RazorpayActionGateway",
    "evaluateAndAct",
    "@/lib/razorpay",
  ];

  for (const file of ["types.ts", "provider.ts", "intent.ts", "recommendation.ts"]) {
    it(`lib/agent/${file} cannot import or name any action capability`, () => {
      const src = readFileSync(resolve(AGENT_DIR, file), "utf8");
      for (const token of FORBIDDEN_FOR_AI) {
        expect(
          src.includes(token),
          `agent/${file} must not reference "${token}"`,
        ).toBe(false);
      }
    });
  }

  it("no agent-facing API route can trigger an action", async () => {
    const routes = findRouteFiles(resolve(process.cwd(), "app/api/agent"));
    // The agent surface exists (profile/products/offers/policies) and is read-only.
    expect(routes.length).toBeGreaterThan(0);
    for (const route of routes) {
      const src = readFileSync(route, "utf8");
      expect(src).not.toMatch(/@\/lib\/actions/);
      expect(src).not.toMatch(/evaluateAndAct/);
      expect(src).not.toMatch(/pauseSubscription/);
    }
  });
});

function findRouteFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...findRouteFiles(full));
    else if (entry === "route.ts") out.push(full);
  }
  return out;
}
