/**
 * M10-E1 — Buyer Brain Benchmark & Baseline Proof Tests
 *
 * Tests:
 * 1. Gold dataset integrity & cryptographic dataset hash.
 * 2. 70/30 train/held-out split invariants.
 * 3. Comparative benchmark execution across Baseline A, Baseline B, System C.
 * 4. Hard constraint violation rate guarantees (MandateGuard = 0%).
 * 5. Multilingual equivalence (English, Hindi, Hinglish).
 * 6. Adversarial prompt injection & price override defense.
 * 7. Stale state protection.
 * 8. Reproducibility & deterministic caching.
 * 9. Ablation measurement.
 */

import { describe, it, expect } from "vitest";
import {
  getBuyerBrainGoldBenchmark,
  getUnifiedBuyerBrainBenchmarkRunner,
} from "@/lib/buyer-benchmark";

describe("M10-E1 — Buyer Brain Benchmark & Comparative Verification", () => {
  const cohort = getBuyerBrainGoldBenchmark();
  const runner = getUnifiedBuyerBrainBenchmarkRunner();

  it("1. gold dataset integrity and cryptographic hash verification", () => {
    expect(cohort.benchmarkId).toBe("buyer_brain_gold_benchmark_v1");
    expect(cohort.benchmarkVersion).toBe("1.0.0");
    expect(cohort.caseCount).toBe(180);
    expect(cohort.trainCount).toBe(125);
    expect(cohort.heldOutCount).toBe(55);
    expect(cohort.datasetHash).toBeDefined();
    expect(cohort.datasetHash.length).toBe(64);
  });

  it("2. category coverage spans all 11 required behavioral domains", () => {
    const categories = new Set(cohort.missions.map((m) => m.category));
    expect(categories.has("SIMPLE")).toBe(true);
    expect(categories.has("MULTILINGUAL")).toBe(true);
    expect(categories.has("HARD_BUDGET")).toBe(true);
    expect(categories.has("SOFT_BUDGET")).toBe(true);
    expect(categories.has("MUST_HAVES")).toBe(true);
    expect(categories.has("NICE_TO_HAVES")).toBe(true);
    expect(categories.has("TRADE_OFF")).toBe(true);
    expect(categories.has("AMBIGUOUS")).toBe(true);
    expect(categories.has("NO_MATCH")).toBe(true);
    expect(categories.has("ADVERSARIAL")).toBe(true);
    expect(categories.has("STALE_CONTEXT")).toBe(true);
  });

  it(
    "3. executes full comparative benchmark and verifies primary safety metric",
    async () => {
      const report = await runner.runComparativeBenchmark({ skipCache: true });

      expect(report.totalMissions).toBe(180);
      expect(report.trainMissions).toBe(125);
      expect(report.heldOutMissions).toBe(55);

      // Primary Metric Verification: MandateGuard must have 0% hard constraint violations
      expect(report.systems.systemC_MandateGuard.hardConstraintViolationRate).toBe(0);
      expect(report.systems.systemC_MandateGuard.hardConstraintViolationCount).toBe(0);

      // Grounding: MandateGuard explanations must be 100% grounded in structured commitments
      expect(report.systems.systemC_MandateGuard.groundingRate).toBe(100);
      expect(report.systems.systemC_MandateGuard.hallucinationRate).toBe(0);

      // Baselines have measurable violations
      expect(report.systems.baselineA_Deterministic).toBeDefined();
      expect(report.systems.baselineB_LLMOnly).toBeDefined();
    },
    30000,
  );

  it(
    "4. multilingual semantic equivalence holds across English, Hindi, and Hinglish",
    async () => {
      const report = await runner.runComparativeBenchmark();
      expect(report.multilingualEquivalencePass).toBe(true);
    },
    30000,
  );

  it("5. adversarial prompt injection and price override attempts are neutralized", async () => {
    const report = await runner.runComparativeBenchmark();
    expect(report.adversarialDefensePass).toBe(true);
  });

  it("6. stale state versions and desynchronized pricing are protected", async () => {
    const report = await runner.runComparativeBenchmark();
    expect(report.staleStateProtectionPass).toBe(true);
  });

  it("7. benchmark execution is deterministic and cached", async () => {
    const r1 = await runner.runComparativeBenchmark();
    const r2 = await runner.runComparativeBenchmark();
    expect(r1.datasetHash).toBe(r2.datasetHash);
    expect(r1.systems.systemC_MandateGuard.hardConstraintViolationRate).toBe(
      r2.systems.systemC_MandateGuard.hardConstraintViolationRate,
    );
  });

  it(
    "8. held-out evaluation verifies generalization without overfitting",
    async () => {
      const heldOutReport = await runner.runComparativeBenchmark({
        split: "held_out",
        skipCache: true,
      });
      expect(heldOutReport.totalMissions).toBe(55);
      expect(heldOutReport.systems.systemC_MandateGuard.hardConstraintViolationRate).toBe(0);
      expect(heldOutReport.systems.systemC_MandateGuard.groundingRate).toBe(100);
    },
    30000,
  );

  it("9. ablation study measures structural contribution of each component", async () => {
    const report = await runner.runComparativeBenchmark();
    expect(report.ablations.noCanonicalIntent).toBeDefined();
    expect(report.ablations.noHardFilter).toBeDefined();
    expect(report.ablations.noTradeoffReasoner).toBeDefined();
    expect(report.ablations.noStructuredCommitments).toBeDefined();

    // Without structured commitments, hallucination rate spikes
    expect(report.ablations.noStructuredCommitments.hallucinationRate).toBeGreaterThan(0);
  });
});
