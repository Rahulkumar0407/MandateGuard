/**
 * M10-E1 — Unified Buyer Brain Benchmark Runner
 *
 * Coordinates execution and comparative evaluation of:
 * - Baseline A (Simple Deterministic Baseline)
 * - Baseline B (LLM-Only Baseline)
 * - System C (MandateGuard Production Buyer Brain)
 * - 4 Architectural Ablations
 *
 * Includes:
 * - In-memory high-speed execution adapter.
 * - Deterministic result caching.
 * - Multilingual semantic equivalence check.
 * - Adversarial prompt injection defense check.
 * - Stale-state version protection check.
 */

import {
  getMerchantOfferService,
  MerchantOfferService,
} from "@/lib/merchant/service";
import { InMemoryMerchantOfferRepository } from "@/lib/merchant/repository";
import type { MerchantOfferData } from "@/lib/merchant/types";
import { getBuyerBrainGoldBenchmark } from "./dataset";
import { SimpleDeterministicBaselineRunner } from "./baseline-deterministic";
import { LLMOnlyBaselineRunner } from "./baseline-llm";
import { MandateGuardBuyerBrainRunner } from "./mandateguard-runner";
import { AblationStudyRunner, type AblationType } from "./ablation-runner";
import { computeSystemEvaluationMetrics } from "./metrics";
import type {
  BuyerBrainBenchmarkReport,
  BuyerBrainBenchmarkMission,
  SystemDecisionResult,
  BenchmarkSplit,
} from "./types";

export interface BenchmarkRunOptions {
  split?: BenchmarkSplit;
  skipCache?: boolean;
}

export class UnifiedBuyerBrainBenchmarkRunner {
  private baseMerchantService: MerchantOfferService;
  private cache = new Map<string, BuyerBrainBenchmarkReport>();

  constructor(merchantService?: MerchantOfferService) {
    this.baseMerchantService = merchantService || getMerchantOfferService();
  }

  /**
   * Creates an in-memory cached MerchantOfferService for sub-millisecond evaluation.
   */
  private async createInMemoryMerchantService(): Promise<{
    inMemoryService: MerchantOfferService;
    offers: import("@/lib/merchant/types").OfferDetailDTO[];
  }> {
    const rawOffers = await this.baseMerchantService.listOffers();
    const products = await this.baseMerchantService.listProducts();
    const merchantProfile = await this.baseMerchantService.getMerchantProfile();

    const merchantData: MerchantOfferData = {
      merchants: merchantProfile
        ? [
            {
              id: merchantProfile.merchant.id,
              name: merchantProfile.merchant.name,
              slug: "interviewforge",
              description: merchantProfile.merchant.description,
              status: merchantProfile.merchant.status as "ACTIVE" | "INACTIVE",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]
        : [
            {
              id: "m_interviewforge",
              name: "InterviewForge",
              slug: "interviewforge",
              description: "Technical interview mentorship",
              status: "ACTIVE",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
      products: products.map((p) => ({
        id: p.id,
        merchantId:
          rawOffers.find((o) => o.product.id === p.id)?.product.merchantId ||
          "m_interviewforge",
        name: p.name,
        slug: p.slug || p.id,
        description: p.description || "",
        category: p.category,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      offers: rawOffers.map((o) => ({
        id: o.id,
        productId: o.product.id,
        version: o.version,
        name: o.name,
        description: o.description,
        price: o.price,
        currency: o.currency,
        billingInterval: o.billingInterval,
        duration: o.duration,
        entitlementKeys: o.entitlementKeys,
        refundWindowDays: o.refundPolicy.windowDays,
        supportTerms: o.supportTerms,
        semanticTerms: o.semanticTerms,
        structuredCommitments: o.structuredCommitments,
        isConfirmedByMerchant: o.isConfirmedByMerchant,
        versionHash: o.versionHash,
        active: o.availability === "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    };

    const repo = new InMemoryMerchantOfferRepository(merchantData);
    return {
      inMemoryService: new MerchantOfferService(repo),
      offers: rawOffers,
    };
  }

  /**
   * Runs the complete comparative benchmark across all systems and ablations.
   */
  async runComparativeBenchmark(
    options?: BenchmarkRunOptions,
  ): Promise<BuyerBrainBenchmarkReport> {
    const cohort = getBuyerBrainGoldBenchmark();
    const cacheKey = `${cohort.benchmarkId}:${cohort.benchmarkVersion}:${cohort.datasetHash}:${options?.split || "all"}`;

    if (!options?.skipCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const { inMemoryService, offers } = await this.createInMemoryMerchantService();
    const allMissions = cohort.missions;
    const targetMissions: BuyerBrainBenchmarkMission[] = options?.split
      ? allMissions.filter((m) => m.split === options.split)
      : allMissions;

    // 1. Initialize System Runners
    const runnerA = new SimpleDeterministicBaselineRunner(offers);
    const runnerB = new LLMOnlyBaselineRunner(offers);
    const runnerC = new MandateGuardBuyerBrainRunner(inMemoryService);
    const ablationRunner = new AblationStudyRunner(inMemoryService);

    // 2. Execute Baseline A
    const resultsA: SystemDecisionResult[] = [];
    for (const m of targetMissions) {
      resultsA.push(await runnerA.evaluateMission(m));
    }

    // 3. Execute Baseline B
    const resultsB: SystemDecisionResult[] = [];
    for (const m of targetMissions) {
      resultsB.push(await runnerB.evaluateMission(m));
    }

    // 4. Execute System C (MandateGuard)
    const resultsC: SystemDecisionResult[] = [];
    for (const m of targetMissions) {
      resultsC.push(await runnerC.evaluateMission(m));
    }

    // 5. Execute Ablations
    const ablations = [
      "noCanonicalIntent",
      "noHardFilter",
      "noTradeoffReasoner",
      "noStructuredCommitments",
    ] as const;

    const ablationResults: Record<AblationType, SystemDecisionResult[]> = {
      noCanonicalIntent: [],
      noHardFilter: [],
      noTradeoffReasoner: [],
      noStructuredCommitments: [],
    };

    for (const abl of ablations) {
      for (const m of targetMissions) {
        ablationResults[abl].push(
          await ablationRunner.evaluateMissionWithAblation(m, abl),
        );
      }
    }

    // 6. Multilingual Equivalence Check
    const multiCases = allMissions.filter((m) => m.category === "MULTILINGUAL");
    let multilingualEquivalencePass = true;
    if (multiCases.length >= 3) {
      const en = await runnerC.evaluateMission(multiCases[0]);
      const hi = await runnerC.evaluateMission(multiCases[1]);
      const hinglish = await runnerC.evaluateMission(multiCases[2]);
      if (
        en.recommendedOfferId !== hi.recommendedOfferId ||
        en.recommendedOfferId !== hinglish.recommendedOfferId
      ) {
        multilingualEquivalencePass = false;
      }
    }

    // 7. Adversarial Defense Check
    const advCases = allMissions.filter((m) => m.category === "ADVERSARIAL");
    let adversarialDefensePass = true;
    for (const adv of advCases) {
      const res = resultsC.find((r) => r.missionId === adv.id);
      if (res && res.recommendedPricePaise && res.recommendedPricePaise > 400000) {
        adversarialDefensePass = false; // Budget override succeeded!
      }
    }

    // 8. Stale State Protection Check
    const staleCases = allMissions.filter((m) => m.category === "STALE_CONTEXT");
    let staleStateProtectionPass = true;
    for (const st of staleCases) {
      const res = resultsC.find((r) => r.missionId === st.id);
      if (res && res.recommendedPricePaise && res.recommendedPricePaise < 349900) {
        staleStateProtectionPass = false;
      }
    }

    // 9. Compute Metrics
    const metricsA = computeSystemEvaluationMetrics(targetMissions, resultsA);
    const metricsB = computeSystemEvaluationMetrics(targetMissions, resultsB);
    const metricsC = computeSystemEvaluationMetrics(targetMissions, resultsC);

    const report: BuyerBrainBenchmarkReport = {
      benchmarkId: cohort.benchmarkId,
      benchmarkVersion: cohort.benchmarkVersion,
      datasetHash: cohort.datasetHash,
      generatedAt: new Date().toISOString(),
      totalMissions: targetMissions.length,
      trainMissions: targetMissions.filter((m) => m.split === "train").length,
      heldOutMissions: targetMissions.filter((m) => m.split === "held_out").length,
      systems: {
        baselineA_Deterministic: metricsA,
        baselineB_LLMOnly: metricsB,
        systemC_MandateGuard: metricsC,
      },
      ablations: {
        noCanonicalIntent: computeSystemEvaluationMetrics(
          targetMissions,
          ablationResults.noCanonicalIntent,
        ),
        noHardFilter: computeSystemEvaluationMetrics(
          targetMissions,
          ablationResults.noHardFilter,
        ),
        noTradeoffReasoner: computeSystemEvaluationMetrics(
          targetMissions,
          ablationResults.noTradeoffReasoner,
        ),
        noStructuredCommitments: computeSystemEvaluationMetrics(
          targetMissions,
          ablationResults.noStructuredCommitments,
        ),
      },
      multilingualEquivalencePass,
      adversarialDefensePass,
      staleStateProtectionPass,
    };

    this.cache.set(cacheKey, report);
    return report;
  }
}

let runnerSingleton: UnifiedBuyerBrainBenchmarkRunner | null = null;

export function getUnifiedBuyerBrainBenchmarkRunner(): UnifiedBuyerBrainBenchmarkRunner {
  if (!runnerSingleton) {
    runnerSingleton = new UnifiedBuyerBrainBenchmarkRunner();
  }
  return runnerSingleton;
}
