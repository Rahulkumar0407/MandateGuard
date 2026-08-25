import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setMerchantOfferRepository, InMemoryMerchantOfferRepository } from "@/lib/merchant/service";
import { setIntentProvider, MockLLMProvider } from "@/lib/agent/intent";
import { buildInterviewForgeData } from "@/lib/merchant/seed-data";
import * as intentRoute from "@/app/api/intent/route";

const BASE = "http://localhost/api/intent";

beforeEach(() => {
  setMerchantOfferRepository(
    new InMemoryMerchantOfferRepository(buildInterviewForgeData()),
  );
  setIntentProvider(new MockLLMProvider());
});

afterEach(() => {
  setMerchantOfferRepository(null);
  setIntentProvider(null);
});

describe("POST /api/intent", () => {
  it("returns structured intent + recommendation for the canonical request", async () => {
    const res = await intentRoute.POST(
      new Request(BASE, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message:
            "I need system-design interview preparation under ₹5,000/month.",
        }),
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.intent.category).toBe("system-design");
    expect(json.intent.maxMonthlyAmount).toBe(5000);
    expect(json.recommendation.eligible).toBe(true);
    expect(json.recommendation.recommendedOfferId).toBe("o_sysdesign_v2");
  });

  it("returns 400 for an invalid body", async () => {
    const res = await intentRoute.POST(
      new Request(BASE, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns an explicit no-match (eligible:false) when nothing fits", async () => {
    const res = await intentRoute.POST(
      new Request(BASE, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: "I need system-design prep with budget ₹100/month.",
        }),
      }),
    );
    const json = await res.json();
    expect(json.recommendation.eligible).toBe(false);
    expect(json.recommendation.recommendedOfferId).toBeNull();
  });

  it("returns a safe 400 when intent extraction fails", async () => {
    setIntentProvider({
      extractIntent: async () => ({ maxMonthlyAmount: "broken" }),
    });
    const res = await intentRoute.POST(
      new Request(BASE, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "anything" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("does not expose any Razorpay/payment surface in the response", async () => {
    const res = await intentRoute.POST(
      new Request(BASE, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: "I need mock interviews for less than ₹2,000/month.",
        }),
      }),
    );
    const json = await res.json();
    expect(JSON.stringify(json)).not.toMatch(/razorpay|subscription|charge/i);
  });
});
