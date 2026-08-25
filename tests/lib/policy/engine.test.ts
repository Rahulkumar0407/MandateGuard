import { describe, it, expect } from "vitest";
import { evaluatePolicy } from "@/lib/policy/engine";
import type {
  IntegrityReport,
  IntegrityFinding,
  IntegrityStatus,
} from "@/lib/integrity/types";
import type {
  SemanticFinding,
  SemanticEvaluationStatus,
} from "@/lib/integrity/semantic";

function dimensionFor(type: IntegrityFinding["type"]): IntegrityFinding["dimension"] {
  if (type.startsWith("PRICE")) return "PRICE";
  if (type.startsWith("ENTITLEMENT")) return "ENTITLEMENTS";
  if (type.startsWith("DURATION")) return "DURATION";
  if (type.startsWith("REFUND")) return "REFUND";
  return "LINEAGE";
}

function makeFinding(
  type: IntegrityFinding["type"],
  meta?: Record<string, unknown>,
): IntegrityFinding {
  return {
    dimension: dimensionFor(type),
    severity: "WARNING",
    type,
    baseline: {},
    current: {},
    evidence: "e",
    ...(meta ? { meta } : {}),
  };
}

function makeReport(opts: {
  findings?: IntegrityFinding[];
  semanticFindings?: SemanticFinding[];
  semanticStatus?: SemanticEvaluationStatus;
  overall?: IntegrityStatus;
}): IntegrityReport {
  const findings = opts.findings ?? [];
  return {
    mandateId: "m1",
    baselineOfferVersion: 2,
    currentOfferVersion: 3,
    overall: opts.overall ?? (findings.length ? "CHANGED" : "UNCHANGED"),
    findings,
    semanticStatus: opts.semanticStatus ?? "AVAILABLE",
    semanticFindings: opts.semanticFindings ?? [],
    generatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function sem(
  f: Pick<SemanticFinding, "direction" | "type" | "confidence"> &
    Partial<SemanticFinding>,
): SemanticFinding {
  return {
    baseline: "b",
    current: "c",
    explanation: "model free-form text (ignored by policy)",
    severity: "WARNING",
    ...f,
  };
}

const decision = (r: IntegrityReport) => evaluatePolicy(r).decision;

describe("M6 policy — PRICE (STEP 4)", () => {
  it("0% increase (unchanged) -> ALLOW", () => {
    expect(decision(makeReport({ findings: [makeFinding("PRICE_UNCHANGED")] }))).toBe(
      "ALLOW",
    );
  });
  it("4.99% increase -> ALLOW (below review threshold)", () => {
    expect(
      decision(
        makeReport({ findings: [makeFinding("PRICE_INCREASED", { percentageChange: 4.99 })] }),
      ),
    ).toBe("ALLOW");
  });
  it("5% increase -> REVIEW (boundary)", () => {
    expect(
      decision(
        makeReport({ findings: [makeFinding("PRICE_INCREASED", { percentageChange: 5 })] }),
      ),
    ).toBe("REVIEW");
  });
  it("14.99% increase -> REVIEW", () => {
    expect(
      decision(
        makeReport({ findings: [makeFinding("PRICE_INCREASED", { percentageChange: 14.99 })] }),
      ),
    ).toBe("REVIEW");
  });
  it("15% increase -> PAUSE (boundary)", () => {
    expect(
      decision(
        makeReport({ findings: [makeFinding("PRICE_INCREASED", { percentageChange: 15 })] }),
      ),
    ).toBe("PAUSE");
  });
  it("25% increase -> PAUSE", () => {
    expect(
      decision(
        makeReport({ findings: [makeFinding("PRICE_INCREASED", { percentageChange: 25 })] }),
      ),
    ).toBe("PAUSE");
  });
  it("price decrease -> ALLOW", () => {
    expect(decision(makeReport({ findings: [makeFinding("PRICE_DECREASED")] }))).toBe(
      "ALLOW",
    );
  });
  it("currency change -> REVIEW (economic comparison unreliable)", () => {
    expect(
      decision(makeReport({ findings: [makeFinding("PRICE_CURRENCY_CHANGED")] })),
    ).toBe("REVIEW");
  });
});

describe("M6 policy — ENTITLEMENTS (STEP 5 / 6)", () => {
  it("added entitlement -> ALLOW", () => {
    expect(decision(makeReport({ findings: [makeFinding("ENTITLEMENT_ADDED")] }))).toBe(
      "ALLOW",
    );
  });
  it("removed non-critical entitlement -> REVIEW", () => {
    expect(
      decision(
        makeReport({
          findings: [makeFinding("ENTITLEMENT_REMOVED", { removed: ["mock_interviews"] })],
        }),
      ),
    ).toBe("REVIEW");
  });
  it("removed critical entitlement -> PAUSE", () => {
    expect(
      decision(
        makeReport({
          findings: [
            makeFinding("ENTITLEMENT_REMOVED", { removed: ["weekly_mentor_feedback"] }),
          ],
        }),
      ),
    ).toBe("PAUSE");
  });
});

describe("M6 policy — REFUND (STEP 7)", () => {
  it("unchanged -> ALLOW", () => {
    expect(decision(makeReport({ findings: [makeFinding("REFUND_UNCHANGED")] }))).toBe(
      "ALLOW",
    );
  });
  it("reduced -> REVIEW", () => {
    expect(
      decision(makeReport({ findings: [makeFinding("REFUND_WINDOW_REDUCED")] })),
    ).toBe("REVIEW");
  });
  it("removed -> REVIEW", () => {
    expect(
      decision(makeReport({ findings: [makeFinding("REFUND_WINDOW_REMOVED")] })),
    ).toBe("REVIEW");
  });
});

describe("M6 policy — DURATION (STEP 8)", () => {
  it("unchanged -> ALLOW", () => {
    expect(decision(makeReport({ findings: [makeFinding("DURATION_UNCHANGED")] }))).toBe(
      "ALLOW",
    );
  });
  it("reduced -> REVIEW", () => {
    expect(
      decision(makeReport({ findings: [makeFinding("DURATION_REDUCED")] })),
    ).toBe("REVIEW");
  });
  it("increased -> ALLOW", () => {
    expect(
      decision(makeReport({ findings: [makeFinding("DURATION_INCREASED")] })),
    ).toBe("ALLOW");
  });
});

describe("M6 policy — SEMANTIC (STEP 9 / 10 / 11)", () => {
  it("neutral -> ALLOW", () => {
    expect(
      decision(
        makeReport({ semanticFindings: [sem({ direction: "NEUTRAL", type: "VALUE_PROPOSITION_CHANGED", confidence: 0.9 })] }),
      ),
    ).toBe("ALLOW");
  });
  it("improved -> ALLOW", () => {
    expect(
      decision(
        makeReport({ semanticFindings: [sem({ direction: "IMPROVED", type: "SUPPORT_QUALITY_CHANGED", confidence: 0.9 })] }),
      ),
    ).toBe("ALLOW");
  });
  it("degraded high confidence (non-human) -> REVIEW", () => {
    expect(
      decision(
        makeReport({ semanticFindings: [sem({ direction: "DEGRADED", type: "SUPPORT_QUALITY_CHANGED", confidence: 0.95 })] }),
      ),
    ).toBe("REVIEW");
  });
  it("degraded low confidence -> REVIEW (at most)", () => {
    expect(
      decision(
        makeReport({ semanticFindings: [sem({ direction: "DEGRADED", type: "SUPPORT_QUALITY_CHANGED", confidence: 0.5 })] }),
      ),
    ).toBe("REVIEW");
  });
  it("uncertain -> REVIEW, never PAUSE", () => {
    expect(
      decision(
        makeReport({ semanticFindings: [sem({ direction: "UNCERTAIN", type: "SUPPORT_QUALITY_CHANGED", confidence: 0.99 })] }),
      ),
    ).toBe("REVIEW");
  });
  it("human->automated high confidence -> PAUSE", () => {
    expect(
      decision(
        makeReport({ semanticFindings: [sem({ direction: "DEGRADED", type: "HUMAN_TO_AUTOMATED_CHANGED", confidence: 0.95 })] }),
      ),
    ).toBe("PAUSE");
  });
});

describe("M6 policy — COMBINATION (STEP 12)", () => {
  it("ALLOW + ALLOW -> ALLOW", () => {
    expect(
      decision(
        makeReport({
          findings: [makeFinding("PRICE_UNCHANGED"), makeFinding("ENTITLEMENT_ADDED")],
        }),
      ),
    ).toBe("ALLOW");
  });
  it("ALLOW + REVIEW -> REVIEW", () => {
    expect(
      decision(
        makeReport({
          findings: [makeFinding("PRICE_UNCHANGED"), makeFinding("REFUND_WINDOW_REDUCED")],
        }),
      ),
    ).toBe("REVIEW");
  });
  it("REVIEW + PAUSE -> PAUSE", () => {
    expect(
      decision(
        makeReport({
          findings: [
            makeFinding("REFUND_WINDOW_REDUCED"),
            makeFinding("PRICE_INCREASED", { percentageChange: 20 }),
          ],
        }),
      ),
    ).toBe("PAUSE");
  });
  it("price +4% + removed entitlement -> REVIEW", () => {
    expect(
      decision(
        makeReport({
          findings: [
            makeFinding("PRICE_INCREASED", { percentageChange: 4 }),
            makeFinding("ENTITLEMENT_REMOVED", { removed: ["mock_interviews"] }),
          ],
        }),
      ),
    ).toBe("REVIEW");
  });
  it("price +20% + refund reduced -> PAUSE", () => {
    expect(
      decision(
        makeReport({
          findings: [
            makeFinding("PRICE_INCREASED", { percentageChange: 20 }),
            makeFinding("REFUND_WINDOW_REDUCED"),
          ],
        }),
      ),
    ).toBe("PAUSE");
  });
  it("price +2% + semantic neutral -> ALLOW", () => {
    expect(
      decision(
        makeReport({
          findings: [makeFinding("PRICE_INCREASED", { percentageChange: 2 })],
          semanticFindings: [sem({ direction: "NEUTRAL", type: "VALUE_PROPOSITION_CHANGED", confidence: 0.9 })],
        }),
      ),
    ).toBe("ALLOW");
  });
  it("price +3% + critical entitlement removed -> PAUSE", () => {
    expect(
      decision(
        makeReport({
          findings: [
            makeFinding("PRICE_INCREASED", { percentageChange: 3 }),
            makeFinding("ENTITLEMENT_REMOVED", { removed: ["capstone_review"] }),
          ],
        }),
      ),
    ).toBe("PAUSE");
  });
});

describe("M6 policy — FAILURE SAFETY (STEP 22)", () => {
  it("incomplete evaluation never silently becomes ALLOW", () => {
    const r = makeReport({
      findings: [],
      semanticStatus: "UNAVAILABLE",
      overall: "UNCHANGED",
    });
    const result = evaluatePolicy(r);
    expect(result.decision).toBe("REVIEW");
    expect(
      result.reasons.some((x) => x.findingType === "EVALUATION_INCOMPLETE"),
    ).toBe(true);
  });

  it("no current offer yields REVIEW, not ALLOW", () => {
    const r = makeReport({
      findings: [makeFinding("CURRENT_OFFER_UNAVAILABLE")],
      semanticStatus: "UNAVAILABLE",
      overall: "CURRENT_OFFER_UNAVAILABLE",
    });
    expect(evaluatePolicy(r).decision).toBe("REVIEW");
  });
});

describe("M6 policy — DETERMINISM (STEP 16)", () => {
  it("identical inputs produce identical decisions and reasons", () => {
    const r = makeReport({
      findings: [
        makeFinding("PRICE_INCREASED", { percentageChange: 25 }),
        makeFinding("ENTITLEMENT_REMOVED", { removed: ["weekly_mentor_feedback"] }),
      ],
      semanticFindings: [
        sem({ direction: "DEGRADED", type: "SUPPORT_QUALITY_CHANGED", confidence: 0.95 }),
      ],
    });
    expect(evaluatePolicy(r)).toEqual(evaluatePolicy(r));
  });
});
