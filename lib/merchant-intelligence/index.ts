import {
  getMerchantOfferService,
  type MerchantOfferService,
} from "@/lib/merchant/service";
import { MerchantEvidenceCollector } from "./collector";
import { MerchantDiagnosticEngine } from "./diagnostic-engine";
import { MerchantBuyerSimulationService } from "./simulation";
import {
  DeterministicMerchantReasoningProvider,
} from "./reasoning-provider";
import { MerchantPrioritizationEngine } from "./recommendations";
import { MerchantImprovementSimulator } from "./improvement-simulator";
import { MerchantRevenueOpportunityEngine } from "./opportunity-engine";
import { MerchantBuyabilityEngine } from "./buyability-engine";
import type {
  MerchantDiagnosticReport,
  BuyerMissionEvaluation,
  MerchantReasoningProvider,
  MerchantAIReadiness,
  ImprovementPreviewInput,
  ImprovementPreviewResult,
  ShopMyBusinessResult,
  OpportunityAnalysisReport,
} from "./types";
import type {
  AIBuyabilityReport,
  BuyabilityExperiment,
  BuyabilityBenchmarkCohort,
} from "./buyability-types";
import type { CanonicalBuyerIntent } from "@/lib/intent/types";
import type { OfferDetailDTO } from "@/lib/merchant/types";

export * from "./types";
export * from "./collector";
export * from "./diagnostic-engine";
export * from "./simulation";
export * from "./reasoning-provider";
export * from "./recommendations";
export * from "./improvement-simulator";
export * from "./opportunity-types";
export * from "./opportunity-engine";
export * from "./buyability-types";
export * from "./buyability-benchmark-dataset";
export * from "./buyability-engine";
export * from "./optimization-service";
export * from "./growth-opportunity-service";

/**
 * High-level Merchant Intelligence Service Facade.
 */
export class MerchantIntelligenceService {
  private readonly collector: MerchantEvidenceCollector;
  private readonly engine: MerchantDiagnosticEngine;
  private readonly simulationService: MerchantBuyerSimulationService;
  private readonly reasoningProvider: MerchantReasoningProvider;
  private readonly prioritizationEngine: MerchantPrioritizationEngine;
  private readonly improvementSimulator: MerchantImprovementSimulator;
  private readonly opportunityEngine: MerchantRevenueOpportunityEngine;
  private readonly buyabilityEngine: MerchantBuyabilityEngine;

  constructor(
    private readonly merchantService: MerchantOfferService,
    collector?: MerchantEvidenceCollector,
    engine?: MerchantDiagnosticEngine,
    simulationService?: MerchantBuyerSimulationService,
    reasoningProvider?: MerchantReasoningProvider,
    prioritizationEngine?: MerchantPrioritizationEngine,
    improvementSimulator?: MerchantImprovementSimulator,
    opportunityEngine?: MerchantRevenueOpportunityEngine,
    buyabilityEngine?: MerchantBuyabilityEngine,
  ) {
    this.collector = collector || new MerchantEvidenceCollector(merchantService);
    this.engine = engine || new MerchantDiagnosticEngine();
    this.simulationService =
      simulationService || new MerchantBuyerSimulationService(merchantService);
    this.reasoningProvider =
      reasoningProvider || new DeterministicMerchantReasoningProvider();
    this.prioritizationEngine =
      prioritizationEngine || new MerchantPrioritizationEngine();
    this.improvementSimulator =
      improvementSimulator || new MerchantImprovementSimulator(merchantService);
    this.opportunityEngine =
      opportunityEngine || new MerchantRevenueOpportunityEngine();
    this.buyabilityEngine =
      buyabilityEngine || new MerchantBuyabilityEngine();
  }



  /**
   * Evaluates how the merchant's catalog performs against a buyer mission.
   */
  async simulateMerchantForBuyer(
    merchantId: string,
    buyerMission: CanonicalBuyerIntent,
  ): Promise<BuyerMissionEvaluation> {
    return this.simulationService.simulateMerchantForBuyer(
      merchantId,
      buyerMission,
    );
  }

  /**
   * Generates a complete diagnostic report for the active merchant.
   */
  async generateDiagnosticReport(options?: {
    missionEvaluations?: BuyerMissionEvaluation[];
    historicalIntents?: CanonicalBuyerIntent[];
  }): Promise<MerchantDiagnosticReport> {
    const supplySnapshot = await this.collector.captureSupplySnapshot();
    const supplyEvidence = this.collector.collectSupplyEvidence(supplySnapshot);

    return this.engine.generateReport(
      supplySnapshot,
      supplyEvidence,
      options?.missionEvaluations || [],
      options?.historicalIntents || [],
    );
  }

  /**
   * Calculates 5-dimensional AI Buyer Readiness & prioritized recommendations.
   */
  async getAIReadiness(options?: {
    missionEvaluations?: BuyerMissionEvaluation[];
  }): Promise<MerchantAIReadiness> {
    const snapshot = await this.collector.captureSupplySnapshot();
    const supplyEvidence = this.collector.collectSupplyEvidence(snapshot);
    const report = this.engine.generateReport(
      snapshot,
      supplyEvidence,
      options?.missionEvaluations || [],
    );

    return this.prioritizationEngine.calculateReadiness(
      snapshot,
      report.evidenceList,
      report.diagnoses,
      options?.missionEvaluations || [],
    );
  }

  /**
   * Previews the impact of proposed offer changes without mutating catalog state.
   */
  async previewImprovement(
    input: ImprovementPreviewInput,
  ): Promise<ImprovementPreviewResult> {
    return this.improvementSimulator.previewImprovement(input);
  }

  /**
   * Runs the "Shop My Business" suite against representative buyer missions.
   */
  async runShopMyBusiness(
    merchantId: string,
    customMissions?: CanonicalBuyerIntent[],
  ): Promise<ShopMyBusinessResult> {
    return this.improvementSimulator.runShopMyBusiness(
      merchantId,
      customMissions,
    );
  }

  /**
   * Detects and calculates evidence-grounded revenue opportunities in the catalog.
   */
  async getRevenueOpportunities(options?: {
    missionEvaluations?: BuyerMissionEvaluation[];
    historicalIntents?: CanonicalBuyerIntent[];
  }): Promise<OpportunityAnalysisReport> {
    const snapshot = await this.collector.captureSupplySnapshot();
    const supplyEvidence = this.collector.collectSupplyEvidence(snapshot);
    const report = this.engine.generateReport(
      snapshot,
      supplyEvidence,
      options?.missionEvaluations || [],
      options?.historicalIntents || [],
    );

    return this.opportunityEngine.analyzeOpportunities(
      snapshot,
      report.evidenceList,
      options?.missionEvaluations || [],
      options?.historicalIntents || [],
      report.missingDemand,
    );
  }

  /**
   * Runs the versioned 100-mission benchmark against the merchant catalog.
   */
  async runBuyabilityBenchmark(cohort?: BuyabilityBenchmarkCohort): Promise<AIBuyabilityReport> {
    const snapshot = await this.collector.captureSupplySnapshot();
    return this.buyabilityEngine.evaluateBuyability(snapshot, cohort);
  }

  /**
   * Executes a closed-loop experiment comparing before/after buyability across the same benchmark.
   */
  async runBuyabilityExperiment(
    targetOfferId: string,
    proposedOffer: Partial<OfferDetailDTO>,
    cohort?: BuyabilityBenchmarkCohort,
  ): Promise<BuyabilityExperiment> {
    const snapshot = await this.collector.captureSupplySnapshot();
    return this.buyabilityEngine.runBuyabilityExperiment(
      snapshot,
      targetOfferId,
      proposedOffer,
      cohort,
    );
  }
}



let defaultMerchantIntelligenceService: MerchantIntelligenceService | null = null;

export function getMerchantIntelligenceService(): MerchantIntelligenceService {
  if (!defaultMerchantIntelligenceService) {
    const merchantService = getMerchantOfferService();
    defaultMerchantIntelligenceService = new MerchantIntelligenceService(
      merchantService,
    );
  }
  return defaultMerchantIntelligenceService;
}

export function setMerchantIntelligenceService(
  service: MerchantIntelligenceService | null,
): void {
  defaultMerchantIntelligenceService = service;
}
