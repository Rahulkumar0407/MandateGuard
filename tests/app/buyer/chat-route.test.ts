import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setMerchantOfferRepository,
  InMemoryMerchantOfferRepository,
} from "@/lib/merchant/service";
import {
  ConversationalBuyerService,
  setConversationalBuyerService,
} from "@/lib/agent/conversational-buyer";
import { buildInterviewForgeData } from "@/lib/merchant/seed-data";
import * as chatRoute from "@/app/api/buyer/chat/route";

const BASE = "http://localhost/api/buyer/chat";

describe("POST /api/buyer/chat", () => {
  beforeEach(() => {
    const rawData = buildInterviewForgeData();
    // Invariant: Buyer discovery requires active, confirmed offers
    rawData.offers = rawData.offers.map((o) => ({
      ...o,
      isConfirmedByMerchant: true,
      versionHash: `hash_${o.id}`,
      structuredCommitments: {
        support: {
          tier: o.id.includes("mentor") || o.id.includes("sysdesign") ? "dedicated_mentor" : "community",
          hasDedicatedHuman: o.id.includes("mentor") || o.id.includes("sysdesign"),
          slaHours: 24,
          oneOnOneSessionsPerMonth: 4,
        },
        entitlements: {
          keys: o.entitlementKeys,
          criticalKeys: [],
        },
        usageLimits: {
          apiRequestsPerMonth: 10000,
          concurrentSeats: 1,
          computeCredits: 500,
        },
        delivery: {
          type: "continuous_saas",
          commitmentSLA: "24h Turnaround",
        },
        refundPolicy: {
          windowDays: o.refundWindowDays,
          type: "conditional",
        },
      },
    }));


    const repo = new InMemoryMerchantOfferRepository(rawData);
    setMerchantOfferRepository(repo);
    setConversationalBuyerService(new ConversationalBuyerService());
  });

  afterEach(() => {
    setMerchantOfferRepository(null);
    setConversationalBuyerService(null);
  });


  it("processes Hinglish buyer message and returns recommendation payload", async () => {
    const res = await chatRoute.POST(
      new Request(BASE, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: "4k ke andar human mentor chahiye",
        }),
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.intent.category).toBe("interview_prep");
    expect(json.recommendation.eligible).toBe(true);
    expect(json.message).toBeDefined();
    expect(json.suggestedActions.length).toBeGreaterThan(0);
  });


  it("returns 400 when message is empty or missing", async () => {
    const res = await chatRoute.POST(
      new Request(BASE, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "" }),
      }),
    );

    expect(res.status).toBe(400);
  });

  it("returns clarification structure for underspecified requests", async () => {
    const res = await chatRoute.POST(
      new Request(BASE, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "help me prepare" }),
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.clarification).not.toBeNull();
    expect(json.recommendation).toBeNull();
  });
});
