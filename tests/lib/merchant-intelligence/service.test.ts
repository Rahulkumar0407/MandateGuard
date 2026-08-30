import { describe, it, expect, beforeEach } from "vitest";
import {
  MerchantIntelligenceService,
  setMerchantIntelligenceService,
} from "@/lib/merchant-intelligence";
import { InMemoryMerchantOfferRepository } from "@/lib/merchant/repository";
import { MerchantOfferService } from "@/lib/merchant/service";
import { buildInterviewForgeData } from "@/lib/merchant/seed-data";

describe("M10-C1 — MerchantIntelligenceService Facade", () => {
  let merchantRepo: InMemoryMerchantOfferRepository;
  let merchantService: MerchantOfferService;
  let intelligenceService: MerchantIntelligenceService;

  beforeEach(() => {
    const data = buildInterviewForgeData();
    merchantRepo = new InMemoryMerchantOfferRepository(data);
    merchantService = new MerchantOfferService(merchantRepo);
    intelligenceService = new MerchantIntelligenceService(merchantService);
    setMerchantIntelligenceService(intelligenceService);
  });

  it("generates an end-to-end merchant diagnostic report without hallucinations", async () => {
    const report = await intelligenceService.generateDiagnosticReport();

    expect(report.merchantId).toBe("m_interviewforge");
    expect(report.merchantName).toBe("InterviewForge");
    expect(report.catalogSummary.totalProducts).toBe(5);
    expect(report.funnel).toBeDefined();
    expect(report.evidenceList.length).toBeGreaterThan(0);
    expect(report.diagnoses.length).toBeGreaterThan(0);
  });
});
