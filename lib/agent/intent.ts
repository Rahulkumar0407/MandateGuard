import { BuyerIntentSchema, type BuyerIntent } from "./types";
import {
  MockLLMProvider,
  RealLLMProvider,
  type LLMProvider,
} from "./provider";

// Thrown when the provider's structured output cannot be validated into a
// safe BuyerIntent. Callers MUST treat this as "do not purchase / do nothing".
export class IntentExtractionError extends Error {}

// Translates natural language into a validated, structured BuyerIntent.
// The LLM only proposes structure; this engine enforces the schema and never
// invents financial constraints. Merchant/offer content is never an input here.
export class IntentEngine {
  constructor(private readonly provider: LLMProvider) {}

  async extractIntent(message: string): Promise<BuyerIntent> {
    const raw = await this.provider.extractIntent(message);
    const parsed = BuyerIntentSchema.safeParse(raw);
    if (!parsed.success) {
      throw new IntentExtractionError(
        "Provider output did not match the required intent schema.",
      );
    }
    return parsed.data;
  }
}

// --- Factory / test seam ---------------------------------------------------

let providerOverride: LLMProvider | null = null;
let engineSingleton: IntentEngine | null = null;

export function setIntentProvider(provider: LLMProvider | null): void {
  providerOverride = provider;
  engineSingleton = null;
}

export function getIntentEngine(): IntentEngine {
  if (providerOverride) return new IntentEngine(providerOverride);
  if (!engineSingleton) {
    engineSingleton = new IntentEngine(new MockLLMProvider());
  }
  return engineSingleton;
}

export { MockLLMProvider, RealLLMProvider };
