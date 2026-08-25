import type { IntegrityFinding } from "./types";

interface RefundInput {
  refundWindowDays: number;
}

// STEP 9 — Refund-window comparison (days). Detection only.
export function compareRefund(
  baseline: RefundInput,
  current: RefundInput,
): IntegrityFinding[] {
  const b = baseline.refundWindowDays;
  const c = current.refundWindowDays;

  if (b === c) {
    return [
      {
        dimension: "REFUND",
        severity: "INFO",
        type: "REFUND_UNCHANGED",
        baseline: { refundWindowDays: b },
        current: { refundWindowDays: c },
        evidence: `Refund window unchanged at ${b} days.`,
      },
    ];
  }

  if (c < b) {
    if (c === 0) {
      return [
        {
          dimension: "REFUND",
          severity: "WARNING",
          type: "REFUND_WINDOW_REMOVED",
          baseline: { refundWindowDays: b },
          current: { refundWindowDays: c },
          evidence: `Refund window removed: was ${b} days, now ${c} days (no refund offered).`,
          meta: { difference: c - b },
        },
      ];
    }
    return [
      {
        dimension: "REFUND",
        severity: "WARNING",
        type: "REFUND_WINDOW_REDUCED",
        baseline: { refundWindowDays: b },
        current: { refundWindowDays: c },
        evidence: `Refund window reduced from ${b} to ${c} days (${Math.abs(c - b)} fewer days).`,
        meta: { difference: c - b },
      },
    ];
  }

  return [
    {
      dimension: "REFUND",
      severity: "INFO",
      type: "REFUND_WINDOW_INCREASED",
      baseline: { refundWindowDays: b },
      current: { refundWindowDays: c },
      evidence: `Refund window increased from ${b} to ${c} days (+${c - b} days).`,
      meta: { difference: c - b },
    },
  ];
}
