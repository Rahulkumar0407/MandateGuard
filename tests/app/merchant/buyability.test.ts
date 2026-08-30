import { describe, it, expect } from "vitest";
import { GET, POST } from "@/app/api/merchant/buyability/route";

describe("Route: /api/merchant/buyability", { timeout: 20000 }, () => {
  it("GET returns 200 with complete AIBuyabilityReport", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.totalMissions).toBe(100);
    expect(body.benchmarkId).toBe("buyability_gold_cohort_v1");
    expect(body.funnel).toBeDefined();
    expect(body.funnel.discovered.status).toBe("MEASURED");
    expect(body.funnel.transactionReady.status).toBe("MEASURED");
    expect(body.failureDistribution).toBeDefined();
    expect(Array.isArray(body.topFailures)).toBe(true);
  });

  it("POST executes closed-loop experiment and returns 200 with BuyabilityExperiment", async () => {
    const req = new Request("http://localhost/api/merchant/buyability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetOfferId: "offer_sys_design_pro",
        proposedOffer: {
          price: 299900,
          structuredCommitments: {
            entitlements: {
              keys: ["system_design_curriculum", "mock_interviews", "mentor_feedback"],
              criticalKeys: ["system_design_curriculum"],
            },
            support: {
              tier: "dedicated_mentor",
              hasDedicatedHuman: true,
              slaHours: 24,
              oneOnOneSessionsPerMonth: 4,
            },
            refundPolicy: {
              windowDays: 14,
              type: "conditional",
            },
          },
        },
      }),
    });


    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.benchmarkId).toBe("buyability_gold_cohort_v1");
    expect(body.before).toBeDefined();
    expect(body.after).toBeDefined();
    expect(body.changes).toBeDefined();
    expect(body.requiresMerchantApproval).toBe(true);
  });

  it("POST returns 400 if required fields are missing", async () => {
    const req = new Request("http://localhost/api/merchant/buyability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
