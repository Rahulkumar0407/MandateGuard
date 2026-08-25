import type { IntegrityFinding } from "./types";

interface DurationInput {
  duration: number;
}

function formatPct(pct: number): string {
  const rounded = Math.round(pct * 100) / 100;
  return `${rounded >= 0 ? "+" : ""}${rounded}%`;
}

// STEP 8 — Entitlement-duration comparison (days, same interpretation as Offer).
export function compareDuration(
  baseline: DurationInput,
  current: DurationInput,
): IntegrityFinding[] {
  const b = baseline.duration;
  const c = current.duration;

  if (b === c) {
    return [
      {
        dimension: "DURATION",
        severity: "INFO",
        type: "DURATION_UNCHANGED",
        baseline: { duration: b },
        current: { duration: c },
        evidence: `Entitlement duration unchanged at ${b} days.`,
      },
    ];
  }

  const reduced = c < b;
  const diff = c - b;
  const pct = (diff / b) * 100;

  return [
    {
      dimension: "DURATION",
      severity: reduced ? "WARNING" : "INFO",
      type: reduced ? "DURATION_REDUCED" : "DURATION_INCREASED",
      baseline: { duration: b },
      current: { duration: c },
      evidence: `Entitlement duration ${reduced ? "reduced" : "increased"} from ${b} to ${c} days (${formatPct(pct)}).`,
      meta: { difference: diff, percentageChange: Math.round(pct * 100) / 100 },
    },
  ];
}
