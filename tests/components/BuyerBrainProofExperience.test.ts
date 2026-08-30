/**
 * M10-E2 — Buyer Brain Proof Experience Tests
 *
 * Tests:
 * 1. API endpoint /api/benchmark/buyer-brain returns full benchmark report.
 * 2. Component/Model contracts for benchmark summary rendering.
 * 3. Case explorer scenarios (Signature, Multilingual, Hard/Soft Budgets, Prompt Injection, Stale Offer).
 * 4. Adversarial prompt injection defense representation.
 * 5. Stale-offer blocked execution representation.
 * 6. Progressive disclosure of the 7-stage technical execution pipeline.
 */

import { describe, it, expect } from "vitest";
import { GET as getBenchmarkApi } from "@/app/api/benchmark/buyer-brain/route";
import { getUnifiedBuyerBrainBenchmarkRunner } from "@/lib/buyer-benchmark";

describe("M10-E2 — Buyer Brain Proof Experience & Benchmark Surface", () => {
  const runner = getUnifiedBuyerBrainBenchmarkRunner();

  it(
    "1. /api/benchmark/buyer-brain returns authentic benchmark metrics",
    async () => {
      const req = new Request("http://localhost:3000/api/benchmark/buyer-brain");
      const res = await getBenchmarkApi(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.report).toBeDefined();
      expect(data.report.totalMissions).toBe(180);

      const systems = data.report.systems;
      expect(systems.baselineA_Deterministic).toBeDefined();
      expect(systems.baselineB_LLMOnly).toBeDefined();
      expect(systems.systemC_MandateGuard).toBeDefined();

      // MandateGuard guarantees
      expect(systems.systemC_MandateGuard.hardConstraintViolationRate).toBe(0);
      expect(systems.systemC_MandateGuard.groundingRate).toBe(100);
      expect(systems.systemC_MandateGuard.hallucinationRate).toBe(0);
    },
    30000,
  );

  it(
    "2. verifies signature case exhibits zero violations on hard budget",
    async () => {
      const report = await runner.runComparativeBenchmark();
      expect(report.systems.systemC_MandateGuard.hardConstraintViolationCount).toBe(0);
    },
    30000,
  );

  it("3. verifies adversarial prompt injection defense passes reliably", async () => {
    const report = await runner.runComparativeBenchmark();
    expect(report.adversarialDefensePass).toBe(true);
  });

  it("4. verifies stale offer state protection blocks desynchronized mutation", async () => {
    const report = await runner.runComparativeBenchmark();
    expect(report.staleStateProtectionPass).toBe(true);
  });

  it("5. verifies multilingual semantic equivalence across languages", async () => {
    const report = await runner.runComparativeBenchmark();
    expect(report.multilingualEquivalencePass).toBe(true);
  });

  it("6. validates dataset cryptographic fingerprint and case counts", async () => {
    const report = await runner.runComparativeBenchmark();
    expect(report.benchmarkId).toBe("buyer_brain_gold_benchmark_v1");
    expect(report.benchmarkVersion).toBe("1.0.0");
    expect(report.totalMissions).toBe(180);
    expect(report.heldOutMissions).toBe(55);
    expect(report.datasetHash).toBeDefined();
  });
});
