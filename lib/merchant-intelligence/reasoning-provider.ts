import type {
  MerchantDiagnosisContext,
  MerchantExplanation,
  MerchantReasoningProvider,
} from "./types";

/**
 * Validates that an explanation cites only factual evidence present in the context.
 * Rejects unsupported claims, invented numbers, or unobserved metrics.
 */
export function validateExplanationGrounding(
  explanationText: string,
  context: MerchantDiagnosisContext,
): { isGrounded: boolean; citedIds: string[]; missingEvidenceReason?: string } {
  const citedIds: string[] = [];

  for (const ev of context.evidence) {
    if (
      explanationText.toLowerCase().includes(ev.fact.toLowerCase()) ||
      explanationText.includes(ev.id) ||
      (ev.metric && explanationText.includes(String(ev.metric.value)))
    ) {
      citedIds.push(ev.id);
    }
  }

  // Check for common hallucination patterns: inventing random currency figures or uplift promises
  const hallucinatedUpliftRegex = /\b(\d+%\s*(revenue|mrr|conversion|sales)\s*(increase|boost|uplift|growth))\b/i;
  if (hallucinatedUpliftRegex.test(explanationText)) {
    const mentionsEvidenceFact = context.evidence.some((e) =>
      explanationText.includes(String(e.metric?.value)),
    );
    if (!mentionsEvidenceFact) {
      return {
        isGrounded: false,
        citedIds: [],
        missingEvidenceReason: "Explanation makes unverified revenue/conversion uplift claims not supported by evidence.",
      };
    }
  }

  return {
    isGrounded: citedIds.length > 0,
    citedIds,
  };
}

/**
 * Deterministic / Provider-Neutral Implementation of MerchantReasoningProvider.
 * Strictly grounds explanation generation in supplied evidence.
 */
export class DeterministicMerchantReasoningProvider implements MerchantReasoningProvider {
  async explainDiagnosis(
    input: MerchantDiagnosisContext,
  ): Promise<MerchantExplanation> {
    if (!input.evidence || input.evidence.length === 0) {
      return {
        explanation: "INSUFFICIENT_EVIDENCE",
        groundedInEvidence: false,
        citedEvidenceIds: [],
        isInsufficientEvidence: true,
      };
    }

    const citedEvidenceIds = input.evidence.map((e) => e.id);
    const facts = input.evidence.map((e) => `• ${e.fact}`).join("\n");

    let explanation = `Diagnosis for ${input.issueType} ('${input.title}'):\n${facts}`;

    if (input.rawWordingSnippet) {
      explanation += `\nAnalyzed terms snippet: "${input.rawWordingSnippet}"`;
    }

    const validation = validateExplanationGrounding(explanation, input);
    if (!validation.isGrounded) {
      return {
        explanation: "INSUFFICIENT_EVIDENCE",
        groundedInEvidence: false,
        citedEvidenceIds: [],
        isInsufficientEvidence: true,
      };
    }

    return {
      explanation,
      groundedInEvidence: true,
      citedEvidenceIds,
      isInsufficientEvidence: false,
    };
  }
}
