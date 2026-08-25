import {
  buildSemanticPrompt,
  SemanticEvaluationSchema,
  SemanticProviderNotConfiguredError,
  SemanticProviderUnavailableError,
  type SemanticComparisonInput,
  type SemanticEvaluation,
  type SemanticEvaluationStatus,
  type SemanticFinding,
} from "./semantic";

// ---------------------------------------------------------------------------
// Provider boundary (STEP 4). The integrity engine depends ONLY on this
// interface — never on a concrete LLM SDK. Production uses a real, configurable
// provider; tests inject a deterministic mock.
// ---------------------------------------------------------------------------

export interface SemanticIntegrityProvider {
  evaluate(input: SemanticComparisonInput): Promise<SemanticEvaluation>;
}

// ---------------------------------------------------------------------------
// Mock — deterministic, offline. Returns queued evaluations in order, or a
// neutral no-change result when the queue is empty. Used by all M5 tests so no
// real LLM is ever called (STEP 23).
// ---------------------------------------------------------------------------

export class MockSemanticIntegrityProvider implements SemanticIntegrityProvider {
  private queue: Array<SemanticEvaluation | Error> = [];

  push(response: SemanticEvaluation | Error): void {
    this.queue.push(response);
  }

  reset(): void {
    this.queue = [];
  }

  async evaluate(_input: SemanticComparisonInput): Promise<SemanticEvaluation> {
    void _input; // intentionally unused — mock result is independent of input
    if (this.queue.length === 0) {
      // Deterministic default: treat as no material semantic change.
      return { changed: false, findings: [] };
    }
    const next = this.queue.shift()!;
    if (next instanceof Error) throw next;
    return next;
  }
}

// ---------------------------------------------------------------------------
// Real — production seam. Calls a chat-completions-compatible endpoint with a
// strict, injection-hardened prompt, then validates the JSON with Zod. Any
// failure (unconfigured, network, malformed JSON, schema violation) is thrown
// and converted by the runner into SEMANTIC_EVALUATION_UNAVAILABLE. It has no
// tools, no Razorpay access, and performs no action (STEP 13).
// ---------------------------------------------------------------------------

export class RealSemanticIntegrityProvider implements SemanticIntegrityProvider {
  private readonly apiKey?: string;
  private readonly baseUrl?: string;
  private readonly model?: string;

  constructor(opts?: { apiKey?: string; baseUrl?: string; model?: string }) {
    // Never read keys from source — only from the environment or explicit DI.
    this.apiKey = opts?.apiKey ?? process.env.SEMANTIC_LLM_API_KEY;
    this.baseUrl = opts?.baseUrl ?? process.env.SEMANTIC_LLM_BASE_URL;
    this.model = opts?.model ?? process.env.SEMANTIC_LLM_MODEL;
  }

  async evaluate(input: SemanticComparisonInput): Promise<SemanticEvaluation> {
    if (!this.apiKey || !this.baseUrl) {
      throw new SemanticProviderNotConfiguredError();
    }

    const { system, user } = buildSemanticPrompt(input);

    let res: Response;
    try {
      res = await fetch(
        `${this.baseUrl.replace(/\/$/, "")}/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model ?? "gpt-4o-mini",
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            temperature: 0,
            response_format: { type: "json_object" },
          }),
        },
      );
    } catch {
      throw new SemanticProviderUnavailableError(
        "Network error calling semantic LLM.",
      );
    }

    if (!res.ok) {
      throw new SemanticProviderUnavailableError(
        `Semantic LLM returned ${res.status}.`,
      );
    }

    const json = (await res.json().catch(() => null)) as
      | { choices?: Array<{ message?: { content?: unknown } }> }
      | null;
    const content = json?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new SemanticProviderUnavailableError("Malformed LLM response.");
    }

    let raw: unknown;
    try {
      raw = JSON.parse(content);
    } catch {
      throw new SemanticProviderUnavailableError(
        "LLM output was not valid JSON.",
      );
    }

    const parsed = SemanticEvaluationSchema.safeParse(raw);
    if (!parsed.success) {
      throw new SemanticProviderUnavailableError(
        "LLM output failed schema validation.",
      );
    }
    return parsed.data;
  }
}

// ---------------------------------------------------------------------------
// Runner — the single place that turns provider output (or failure) into a
// controlled status. It re-validates with Zod so even a malformed/invalid
// provider result cannot pollute the report (STEP 5 / 16). The deterministic
// M4 report is always preserved upstream; this only adds semantic findings.
// ---------------------------------------------------------------------------

export async function runSemanticEvaluation(
  provider: SemanticIntegrityProvider,
  input: SemanticComparisonInput | null,
): Promise<{
  status: SemanticEvaluationStatus;
  evaluation: SemanticEvaluation | null;
}> {
  // No current offer -> nothing to compare semantically.
  if (!input) {
    return { status: "UNAVAILABLE", evaluation: null };
  }
  try {
    const raw = await provider.evaluate(input);
    const parsed = SemanticEvaluationSchema.safeParse(raw);
    if (!parsed.success) {
      throw new SemanticProviderUnavailableError("Invalid semantic output.");
    }
    return { status: "AVAILABLE", evaluation: parsed.data };
  } catch {
    // Timeout, malformed JSON, schema violation, or provider unavailable.
    return { status: "UNAVAILABLE", evaluation: null };
  }
}

// ---------------------------------------------------------------------------
// DeterministicSemanticIntegrityProvider — offline/demo semantic evaluation.
//
// Evaluates semantic changes deterministically when no external LLM credentials
// are configured in the environment.
// ---------------------------------------------------------------------------

export class DeterministicSemanticIntegrityProvider
  implements SemanticIntegrityProvider
{
  async evaluate(input: SemanticComparisonInput): Promise<SemanticEvaluation> {
    const baselineSupport = (input.baseline.supportTerms ?? "").toLowerCase();
    const currentSupport = (input.current.supportTerms ?? "").toLowerCase();
    const baselineDesc = (input.baseline.description ?? "").toLowerCase();
    const currentDesc = (input.current.description ?? "").toLowerCase();

    const findings: SemanticFinding[] = [];

    if (
      (baselineSupport.includes("mentor") ||
        baselineSupport.includes("1:1") ||
        baselineSupport.includes("48 hours") ||
        baselineSupport.includes("live") ||
        baselineSupport.includes("sla")) &&
      (currentSupport.includes("discord") ||
        currentSupport.includes("no 1:1") ||
        currentSupport.includes("not guaranteed") ||
        currentSupport.includes("community only") ||
        currentSupport.includes("peer"))
    ) {
      findings.push({
        type: "SUPPORT_QUALITY_CHANGED",
        severity: "CRITICAL",
        direction: "DEGRADED",
        baseline: input.baseline.supportTerms,
        current: input.current.supportTerms,
        explanation:
          "Support downgraded from dedicated mentor/guaranteed SLAs to community Discord peer help only.",
        confidence: 0.95,
      });
    }

    if (
      (baselineDesc.includes("mentor") ||
        baselineDesc.includes("1:1") ||
        baselineDesc.includes("structured")) &&
      (currentDesc.includes("discord") ||
        currentDesc.includes("self-paced") ||
        currentDesc.includes("peer"))
    ) {
      findings.push({
        type: "SERVICE_SCOPE_CHANGED",
        severity: "CRITICAL",
        direction: "DEGRADED",
        baseline: input.baseline.description,
        current: input.current.description,
        explanation:
          "Core offering changed from mentor-guided curriculum to self-paced peer modules.",
        confidence: 0.9,
      });
    }

    return {
      changed: findings.length > 0,
      findings,
    };
  }
}

// ---------------------------------------------------------------------------
// Factory / test seam (STEP 23). Default is the real provider if configured;
// otherwise falls back to DeterministicSemanticIntegrityProvider so the demo
// and test mode work offline. Tests inject the Mock via setSemanticProvider.
// ---------------------------------------------------------------------------

let providerOverride: SemanticIntegrityProvider | null = null;
let providerSingleton: SemanticIntegrityProvider | null = null;

export function setSemanticProvider(
  provider: SemanticIntegrityProvider | null,
): void {
  providerOverride = provider;
  providerSingleton = null;
}

export function getSemanticProvider(): SemanticIntegrityProvider {
  if (providerOverride) return providerOverride;
  if (!providerSingleton) {
    if (process.env.SEMANTIC_LLM_API_KEY && process.env.SEMANTIC_LLM_BASE_URL) {
      providerSingleton = new RealSemanticIntegrityProvider();
    } else {
      providerSingleton = new DeterministicSemanticIntegrityProvider();
    }
  }
  return providerSingleton;
}

export {
  SemanticProviderNotConfiguredError,
  SemanticProviderUnavailableError,
};
