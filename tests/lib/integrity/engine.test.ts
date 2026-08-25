import { describe, it, expect, vi } from "vitest";
import { evaluateIntegrity } from "@/lib/integrity/engine";
import type {
  IntegrityBaseline,
  IntegrityCurrent,
  IntegrityFindingType,
} from "@/lib/integrity/types";

function base(overrides: Partial<IntegrityBaseline> = {}): IntegrityBaseline {
  return {
    productId: "p_sysdesign",
    offerVersion: 1,
    price: 349900,
    currency: "INR",
    billingInterval: "monthly",
    duration: 365,
    entitlementKeys: ["mock_interviews", "mentor_feedback"],
    refundWindowDays: 30,
    ...overrides,
  };
}

function cur(overrides: Partial<IntegrityCurrent> = {}): IntegrityCurrent {
  return {
    productId: "p_sysdesign",
    offerVersion: 1,
    price: 349900,
    currency: "INR",
    billingInterval: "monthly",
    duration: 365,
    entitlementKeys: ["mock_interviews", "mentor_feedback"],
    refundWindowDays: 30,
    ...overrides,
  };
}

function findingTypes(report = evaluateIntegrity({
  mandateId: "m1",
  baseline: base(),
  current: cur(),
})): IntegrityFindingType[] {
  return report.findings.map((f) => f.type);
}

describe("IntegrityEngine — PRICE", () => {
  it("reports no degradation when price is identical", () => {
    const r = evaluateIntegrity({ mandateId: "m1", baseline: base(), current: cur() });
    expect(findingTypes(r)).toContain("PRICE_UNCHANGED");
    expect(r.overall).toBe("UNCHANGED");
  });

  it("detects a price increase with percentage change", () => {
    const r = evaluateIntegrity({
      mandateId: "m1",
      baseline: base({ price: 349900 }),
      current: cur({ price: 399900 }),
    });
    expect(findingTypes(r)).toContain("PRICE_INCREASED");
    const f = r.findings.find((x) => x.type === "PRICE_INCREASED")!;
    expect((f.meta!.percentageChange as number)).toBeCloseTo(14.29, 1);
    expect(f.severity).toBe("WARNING");
  });

  it("detects a price decrease as a positive change (INFO)", () => {
    const r = evaluateIntegrity({
      mandateId: "m1",
      baseline: base({ price: 349900 }),
      current: cur({ price: 299900 }),
    });
    expect(findingTypes(r)).toContain("PRICE_DECREASED");
    expect(r.findings.find((x) => x.type === "PRICE_DECREASED")!.severity).toBe("INFO");
  });

  it("flags a currency change and refuses to compare prices", () => {
    const r = evaluateIntegrity({
      mandateId: "m1",
      baseline: base({ currency: "INR" }),
      current: cur({ currency: "USD" }),
    });
    expect(findingTypes(r)).toContain("PRICE_CURRENCY_CHANGED");
    expect(findingTypes(r)).toContain("PRICE_COMPARISON_UNAVAILABLE");
    expect(r.overall).toBe("CHANGED");
    const f = r.findings.find((x) => x.type === "PRICE_COMPARISON_UNAVAILABLE")!;
    expect(f.evidence.toLowerCase()).not.toMatch(/exchange rate/);
  });

  it("normalizes monthly vs yearly to compare equivalent periods", () => {
    // ₹3,000/month  vs  ₹36,000/year  -> economically equal (both 300000/mo in paise).
    const r = evaluateIntegrity({
      mandateId: "m1",
      baseline: base({ price: 300000, billingInterval: "monthly" }),
      current: cur({ price: 3600000, billingInterval: "yearly" }),
    });
    expect(findingTypes(r)).toContain("PRICE_UNCHANGED");
    expect(r.overall).toBe("UNCHANGED");
  });

  it("detects an increase across normalized yearly vs monthly", () => {
    const r = evaluateIntegrity({
      mandateId: "m1",
      baseline: base({ price: 360000, billingInterval: "yearly" }),
      current: cur({ price: 349900, billingInterval: "monthly" }),
    });
    expect(findingTypes(r)).toContain("PRICE_INCREASED");
  });
});

describe("IntegrityEngine — ENTITLEMENTS", () => {
  it("reports no change when entitlements are identical", () => {
    const r = evaluateIntegrity({ mandateId: "m1", baseline: base(), current: cur() });
    expect(findingTypes(r)).not.toContain("ENTITLEMENT_REMOVED");
    expect(findingTypes(r)).not.toContain("ENTITLEMENT_ADDED");
  });

  it("flags added entitlements (not degradation) as INFO", () => {
    const r = evaluateIntegrity({
      mandateId: "m1",
      baseline: base({ entitlementKeys: ["mock_interviews"] }),
      current: cur({ entitlementKeys: ["mock_interviews", "mentor_feedback"] }),
    });
    expect(findingTypes(r)).toContain("ENTITLEMENT_ADDED");
    expect(r.findings.find((x) => x.type === "ENTITLEMENT_ADDED")!.severity).toBe("INFO");
    expect(r.overall).toBe("CHANGED");
  });

  it("flags a single removed entitlement as WARNING", () => {
    const r = evaluateIntegrity({
      mandateId: "m1",
      baseline: base({ entitlementKeys: ["mock_interviews", "mentor_feedback"] }),
      current: cur({ entitlementKeys: ["mock_interviews"] }),
    });
    expect(findingTypes(r)).toContain("ENTITLEMENT_REMOVED");
    const f = r.findings.find((x) => x.type === "ENTITLEMENT_REMOVED")!;
    expect((f.meta!.removed as string[])).toEqual(["mentor_feedback"]);
    expect(f.severity).toBe("WARNING");
  });

  it("flags multiple removed entitlements", () => {
    const r = evaluateIntegrity({
      mandateId: "m1",
      baseline: base({
        entitlementKeys: ["weekly_mentor_feedback", "mock_interviews", "capstone_review"],
      }),
      current: cur({ entitlementKeys: ["mock_interviews"] }),
    });
    const f = r.findings.find((x) => x.type === "ENTITLEMENT_REMOVED")!;
    expect((f.meta!.removed as string[]).sort()).toEqual([
      "capstone_review",
      "weekly_mentor_feedback",
    ]);
  });

  it("flags all entitlements removed", () => {
    const r = evaluateIntegrity({
      mandateId: "m1",
      baseline: base({ entitlementKeys: ["a", "b"] }),
      current: cur({ entitlementKeys: [] }),
    });
    const f = r.findings.find((x) => x.type === "ENTITLEMENT_REMOVED")!;
    expect((f.meta!.removed as string[]).sort()).toEqual(["a", "b"]);
  });
});

describe("IntegrityEngine — DURATION", () => {
  it("reports no change for equal duration", () => {
    const r = evaluateIntegrity({ mandateId: "m1", baseline: base(), current: cur() });
    expect(findingTypes(r)).toContain("DURATION_UNCHANGED");
    expect(r.overall).toBe("UNCHANGED");
  });

  it("flags reduced duration", () => {
    const r = evaluateIntegrity({
      mandateId: "m1",
      baseline: base({ duration: 365 }),
      current: cur({ duration: 180 }),
    });
    expect(findingTypes(r)).toContain("DURATION_REDUCED");
    const f = r.findings.find((x) => x.type === "DURATION_REDUCED")!;
    expect((f.meta!.difference as number)).toBe(-185);
    expect(f.severity).toBe("WARNING");
  });

  it("flags increased duration as a positive change", () => {
    const r = evaluateIntegrity({
      mandateId: "m1",
      baseline: base({ duration: 180 }),
      current: cur({ duration: 365 }),
    });
    expect(findingTypes(r)).toContain("DURATION_INCREASED");
    expect(r.findings.find((x) => x.type === "DURATION_INCREASED")!.severity).toBe("INFO");
  });
});

describe("IntegrityEngine — REFUND", () => {
  it("reports no change for equal refund window", () => {
    const r = evaluateIntegrity({ mandateId: "m1", baseline: base(), current: cur() });
    expect(findingTypes(r)).toContain("REFUND_UNCHANGED");
    expect(r.overall).toBe("UNCHANGED");
  });

  it("flags a reduced refund window", () => {
    const r = evaluateIntegrity({
      mandateId: "m1",
      baseline: base({ refundWindowDays: 30 }),
      current: cur({ refundWindowDays: 7 }),
    });
    expect(findingTypes(r)).toContain("REFUND_WINDOW_REDUCED");
    expect(r.findings.find((x) => x.type === "REFUND_WINDOW_REDUCED")!.severity).toBe("WARNING");
  });

  it("flags a removed refund window (zero)", () => {
    const r = evaluateIntegrity({
      mandateId: "m1",
      baseline: base({ refundWindowDays: 30 }),
      current: cur({ refundWindowDays: 0 }),
    });
    expect(findingTypes(r)).toContain("REFUND_WINDOW_REMOVED");
  });

  it("flags an increased refund window as a positive change", () => {
    const r = evaluateIntegrity({
      mandateId: "m1",
      baseline: base({ refundWindowDays: 7 }),
      current: cur({ refundWindowDays: 30 }),
    });
    expect(findingTypes(r)).toContain("REFUND_WINDOW_INCREASED");
    expect(r.findings.find((x) => x.type === "REFUND_WINDOW_INCREASED")!.severity).toBe("INFO");
  });
});

describe("IntegrityEngine — VERSION & BASELINE IDENTITY", () => {
  it("preserves the authorized snapshot version as baseline and records current version", () => {
    const r = evaluateIntegrity({
      mandateId: "m1",
      baseline: base({ offerVersion: 2 }),
      current: cur({ offerVersion: 3 }),
    });
    expect(r.baselineOfferVersion).toBe(2);
    expect(r.currentOfferVersion).toBe(3);
  });

  it("never reconstructs the baseline from the current offer (v2 stays v2 even when current is v3)", () => {
    const r = evaluateIntegrity({
      mandateId: "m1",
      baseline: base({ offerVersion: 2, price: 399900 }),
      current: cur({ offerVersion: 3, price: 449900 }),
    });
    expect(r.baselineOfferVersion).toBe(2);
    const f = r.findings.find((x) => x.type === "PRICE_INCREASED")!;
    expect((f.baseline as { monthlyEquivalent: number }).monthlyEquivalent).toBe(
      399900,
    );
  });
});

describe("IntegrityEngine — PRODUCT SAFETY", () => {
  it("refuses to compare across different products (LINEAGE_MISMATCH)", () => {
    const r = evaluateIntegrity({
      mandateId: "m1",
      baseline: base({ productId: "acme_design", offerVersion: 2 }),
      current: cur({ productId: "acme_dsa", offerVersion: 5 }),
    });
    expect(r.overall).toBe("LINEAGE_MISMATCH");
    expect(findingTypes(r)).toEqual(["LINEAGE_MISMATCH"]);
  });
});

describe("IntegrityEngine — CURRENT OFFER SELECTION", () => {
  it("returns CURRENT_OFFER_UNAVAILABLE when no current offer exists", () => {
    const r = evaluateIntegrity({ mandateId: "m1", baseline: base(), current: null });
    expect(r.overall).toBe("CURRENT_OFFER_UNAVAILABLE");
    expect(r.currentOfferVersion).toBeNull();
    expect(findingTypes(r)).toEqual(["CURRENT_OFFER_UNAVAILABLE"]);
  });
});

describe("IntegrityEngine — determinism (no AI)", () => {
  it("is a synchronous, pure function with identical output across runs", () => {
    const input = {
      mandateId: "m1",
      baseline: base({ offerVersion: 2, price: 399900 }),
      current: cur({ offerVersion: 3, price: 499900, refundWindowDays: 7 }),
    };
    // The clock is frozen so the ONLY possible source of variation is the pure
    // comparison logic itself (`generatedAt` is a wall-clock timestamp and can
    // otherwise straddle a millisecond boundary between two calls).
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    try {
      const a = evaluateIntegrity(input);
      const b = evaluateIntegrity(input);
      expect(a).toEqual(b);
    } finally {
      vi.useRealTimers();
    }
    // Under a real clock the comparison result is still identical; only the
    // generation timestamp may differ.
    const c = evaluateIntegrity(input);
    const d = evaluateIntegrity(input);
    expect({ ...c, generatedAt: "" }).toEqual({ ...d, generatedAt: "" });
  });
});
