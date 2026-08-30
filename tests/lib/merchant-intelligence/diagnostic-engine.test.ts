import { describe, it, expect, beforeEach } from "vitest";
import { MerchantDiagnosticEngine } from "@/lib/merchant-intelligence/diagnostic-engine";
import { MerchantEvidenceCollector } from "@/lib/merchant-intelligence/collector";
import { InMemoryMerchantOfferRepository } from "@/lib/merchant/repository";
import { MerchantOfferService } from "@/lib/merchant/service";
import { buildInterviewForgeData } from "@/lib/merchant/seed-data";
import { EVIDENCE_CATEGORIES } from "@/lib/merchant-intelligence/types";

describe("M10-C1 — MerchantDiagnosticEngine", () => {
  let merchantRepo: InMemoryMerchantOfferRepository;
  let merchantService: MerchantOfferService;
  let collector: MerchantEvidenceCollector;
  let engine: MerchantDiagnosticEngine;

  beforeEach(() => {
    const data = buildInterviewForgeData();
    merchantRepo = new InMemoryMerchantOfferRepository(data);
    merchantService = new MerchantOfferService(merchantRepo);
    collector = new MerchantEvidenceCollector(merchantService);
    engine = new MerchantDiagnosticEngine();
  });

  it("generates structured diagnostic report with catalog summary and funnel", async () => {
    const snapshot = await collector.captureSupplySnapshot();
    const supplyEvidence = collector.collectSupplyEvidence(snapshot);
    const report = engine.generateReport(snapshot, supplyEvidence);

    expect(report.merchantId).toBe("m_interviewforge");
    expect(report.catalogSummary.totalProducts).toBe(5);
    expect(report.funnel).toBeDefined();
    expect(report.evidenceList.length).toBeGreaterThan(0);
  });

  it("synthesizes evidence-linked diagnoses with actionable recommendations", async () => {
    const snapshot = await collector.captureSupplySnapshot();
    const supplyEvidence = collector.collectSupplyEvidence(snapshot);
    const report = engine.generateReport(snapshot, supplyEvidence);

    expect(report.diagnoses.length).toBeGreaterThan(0);
    for (const diag of report.diagnoses) {
      expect(diag.title).toBeDefined();
      expect(diag.diagnosis).toBeDefined();
      expect(diag.recommendedAction).toBeDefined();
      expect(EVIDENCE_CATEGORIES).toContain(diag.issueType);
      expect(diag.evidence.length).toBeGreaterThan(0);
    }
  });
});
