import type { CompatibilityFinding, EnvelopeTarget, ProposedOfferInput } from "./types";
import {
  getSemanticProvider,
  runSemanticEvaluation,
} from "@/lib/integrity/semantic-provider";

/**
 * Constrained, advisory semantic evaluation.
 * 
 * Invariants:
 * 1. AI evaluation is strictly advisory; deterministic findings take precedence.
 * 2. High-confidence semantic degradation produces at most REVIEW (or CRITICAL if service model shifted human->automated).
 * 3. Uncertain semantic output NEVER produces a BREAKING decision.
 */
export async function evaluateSemanticAdvisory(params: {
  envelope: EnvelopeTarget;
  proposed: ProposedOfferInput;
}): Promise<CompatibilityFinding[]> {
  const { envelope, proposed } = params;
  const baseline = envelope.baselineCommitments;

  const baselineText = `${baseline.description} ${baseline.supportTerms} ${baseline.semanticTerms}`.trim();
  const proposedText = `${proposed.description} ${proposed.supportTerms} ${proposed.semanticTerms}`.trim();

  // If text is identical, no semantic evaluation is needed.
  if (baselineText === proposedText) {
    return [
      {
        dimension: "SEMANTIC",
        severity: "INFO",
        code: "SEMANTIC_UNCHANGED",
        message: "Commercial description and terms text unchanged.",
      },
    ];
  }

  const { status, evaluation } = await runSemanticEvaluation(
    getSemanticProvider(),
    {
      baseline: {
        offerName: baseline.offerName,
        description: baseline.description,
        supportTerms: baseline.supportTerms,
        semanticTerms: baseline.semanticTerms,
      },
      current: {
        offerName: proposed.name,
        description: proposed.description,
        supportTerms: proposed.supportTerms,
        semanticTerms: proposed.semanticTerms,
      },
    },
  );

  if (status !== "AVAILABLE" || !evaluation) {
    return [
      {
        dimension: "SEMANTIC",
        severity: "WARNING",
        code: "SEMANTIC_UNAVAILABLE",
        message: "Semantic evaluation was unavailable or could not complete.",
      },
    ];
  }

  const findings: CompatibilityFinding[] = [];

  for (const f of evaluation.findings) {
    if (f.direction === "IMPROVED") {
      findings.push({
        dimension: "SEMANTIC",
        severity: "INFO",
        code: "SEMANTIC_IMPROVED",
        message: `Semantic improvement detected (${f.type}, confidence ${(f.confidence * 100).toFixed(0)}%): ${f.explanation}`,
      });
    } else if (f.direction === "NEUTRAL") {
      findings.push({
        dimension: "SEMANTIC",
        severity: "INFO",
        code: "SEMANTIC_NEUTRAL",
        message: `Semantic change is neutral (${f.type}): ${f.explanation}`,
      });
    } else if (f.direction === "UNCERTAIN") {
      // Invariant: Uncertain never produces CRITICAL/BREAKING
      findings.push({
        dimension: "SEMANTIC",
        severity: "WARNING",
        code: "SEMANTIC_UNCERTAIN",
        message: `Semantic evaluation is uncertain (${f.type}, confidence ${(f.confidence * 100).toFixed(0)}%): ${f.explanation}`,
      });
    } else if (f.direction === "DEGRADED") {
      if (f.type === "HUMAN_TO_AUTOMATED_CHANGED" && f.confidence >= 0.85) {
        findings.push({
          dimension: "SEMANTIC",
          severity: "CRITICAL",
          code: "SEMANTIC_DEGRADED",
          message: `Critical service model shift: human support replaced with automation (${f.type}, confidence ${(f.confidence * 100).toFixed(0)}%): ${f.explanation}`,
        });
      } else {
        findings.push({
          dimension: "SEMANTIC",
          severity: "WARNING",
          code: "SEMANTIC_DEGRADED",
          message: `Semantic degradation detected (${f.type}, confidence ${(f.confidence * 100).toFixed(0)}%): ${f.explanation}`,
        });
      }
    }
  }

  return findings;
}
