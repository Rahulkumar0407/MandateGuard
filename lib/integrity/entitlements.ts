import type { IntegrityFinding } from "./types";

interface EntitlementInput {
  entitlementKeys: string[];
}

// STEP 6 — Entitlement set comparison.
//
// Removed keys = potential degradation. Added keys = not degradation (more is
// offered). We report the factual sets so the later policy layer can decide
// materiality. Detection only — no severity overreach beyond WARNING/INFO.
export function compareEntitlements(
  baseline: EntitlementInput,
  current: EntitlementInput,
): IntegrityFinding[] {
  const base = new Set(baseline.entitlementKeys);
  const cur = new Set(current.entitlementKeys);

  const removed = baseline.entitlementKeys.filter((k) => !cur.has(k));
  const added = current.entitlementKeys.filter((k) => !base.has(k));
  const unchanged = baseline.entitlementKeys.filter((k) => cur.has(k));

  const findings: IntegrityFinding[] = [];

  if (removed.length > 0) {
    findings.push({
      dimension: "ENTITLEMENTS",
      // STEP 7 — do NOT auto-classify as CRITICAL; policy decides materiality.
      severity: "WARNING",
      type: "ENTITLEMENT_REMOVED",
      baseline: { entitlementKeys: baseline.entitlementKeys },
      current: { entitlementKeys: current.entitlementKeys },
      evidence: `Authorized entitlements removed in current offer: ${removed.join(", ")}.`,
      meta: { removed, added, unchanged },
    });
  }

  if (added.length > 0) {
    findings.push({
      dimension: "ENTITLEMENTS",
      severity: "INFO",
      type: "ENTITLEMENT_ADDED",
      baseline: { entitlementKeys: baseline.entitlementKeys },
      current: { entitlementKeys: current.entitlementKeys },
      evidence: `New entitlements present in current offer (not degradation): ${added.join(", ")}.`,
      meta: { added, removed, unchanged },
    });
  }

  return findings;
}
