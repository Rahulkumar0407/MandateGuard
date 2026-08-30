import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  MerchantIntelligenceService,
  setMerchantIntelligenceService,
} from "@/lib/merchant-intelligence";
import { InMemoryMerchantOfferRepository } from "@/lib/merchant/repository";
import { MerchantOfferService } from "@/lib/merchant/service";
import { buildInterviewForgeData } from "@/lib/merchant/seed-data";
import { GET, POST } from "@/app/api/merchant/revenue-opportunities/route";

describe("GET & POST /api/merchant/revenue-opportunities API Route Tests", () => {
  let merchantRepo: InMemoryMerchantOfferRepository;
  let merchantService: MerchantOfferService;
  let intelligenceService: MerchantIntelligenceService;

  beforeEach(() => {
    const rawData = buildInterviewForgeData();
    merchantRepo = new InMemoryMerchantOfferRepository(rawData);
    merchantService = new MerchantOfferService(merchantRepo);
    intelligenceService = new MerchantIntelligenceService(merchantService);
    setMerchantIntelligenceService(intelligenceService);
  });

  afterEach(() => {
    setMerchantIntelligenceService(null);
  });

  it("GET returns HTTP 200 with opportunity analysis report", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.merchantId).toBe("m_interviewforge");
    expect(Array.isArray(body.opportunities)).toBe(true);
    expect(typeof body.totalAddressableMonthlyRevenuePaise).toBe("number");
  });

  it("POST accepts custom mission evaluations and historical intents", async () => {
    const req = new Request("http://localhost:3000/api/merchant/revenue-opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        historicalIntents: [
          {
            category: "dsa",
            budget: { amountPaise: 250000, currency: "INR", type: "HARD" },
            billing: { cadence: "monthly", isRecurring: true },
            mustHave: ["leetcode_patterns"],
          },
        ],
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.merchantId).toBe("m_interviewforge");
    expect(Array.isArray(body.opportunities)).toBe(true);
  });
});
