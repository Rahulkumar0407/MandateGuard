import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setMerchantOfferRepository,
  InMemoryMerchantOfferRepository,
  MerchantOfferService,
} from "@/lib/merchant/service";
import {
  setMandateRepository,
  InMemoryMandateRepository,
  MandateService,
} from "@/lib/mandate/service";
import {
  setRazorpayGateway,
  MockRazorpayGateway,
} from "@/lib/razorpay/gateway";

import {
  BuyerTransactionService,
  setBuyerTransactionService,
} from "@/lib/agent/buyer-transaction";
import { CommerceMutationExecutor } from "@/lib/actions/commerce-executor";
import { buildInterviewForgeData } from "@/lib/merchant/seed-data";

import * as previewRoute from "@/app/api/buyer/preview/route";
import * as transactRoute from "@/app/api/buyer/authorize-and-transact/route";

const PREVIEW_URL = "http://localhost/api/buyer/preview";
const TRANSACT_URL = "http://localhost/api/buyer/authorize-and-transact";

describe("M10-B6 API Routes — Preview & Authorize-and-Transact", () => {
  let mockGateway: MockRazorpayGateway;

  beforeEach(() => {
    const rawData = buildInterviewForgeData();
    // Mark offers active and confirmed
    rawData.offers = rawData.offers.map((o) => ({
      ...o,
      active: true,
      isConfirmedByMerchant: true,
      versionHash: `hash_${o.id}`,
      structuredCommitments: {
        support: {
          tier: "dedicated_mentor",
          hasDedicatedHuman: true,
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

    const merchantRepo = new InMemoryMerchantOfferRepository(rawData);
    setMerchantOfferRepository(merchantRepo);

    const mandateRepo = new InMemoryMandateRepository();
    setMandateRepository(mandateRepo);

    mockGateway = new MockRazorpayGateway();
    setRazorpayGateway(mockGateway);

    const merchantService = new MerchantOfferService(merchantRepo);
    const mandateService = new MandateService(mandateRepo, merchantService);
    const mutationExecutor = new CommerceMutationExecutor(
      mockGateway,
      mandateService,
    );
    const transactionService = new BuyerTransactionService(
      merchantService,
      mutationExecutor,
    );
    setBuyerTransactionService(transactionService);
  });

  afterEach(() => {
    setMerchantOfferRepository(null);
    setMandateRepository(null);
    setRazorpayGateway(null);
    setBuyerTransactionService(null);
  });



  it("POST /api/buyer/preview returns structured preview", async () => {
    const res = await previewRoute.POST(
      new Request(PREVIEW_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          offerId: "o_sysdesign_v2",
        }),
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.preview.offerId).toBe("o_sysdesign_v2");
    expect(json.preview.pricePaise).toBe(399900);
    expect(json.preview.verifiedCommitments.length).toBeGreaterThan(0);
    expect(json.preview.protectionTerms.length).toBeGreaterThan(0);
  });

  it("POST /api/buyer/preview returns 404 for unknown offer", async () => {
    const res = await previewRoute.POST(
      new Request(PREVIEW_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          offerId: "o_unknown_999",
        }),
      }),
    );

    expect(res.status).toBe(404);
  });

  it("POST /api/buyer/authorize-and-transact executes end-to-end authorization", async () => {
    const res = await transactRoute.POST(
      new Request(TRANSACT_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: "user_test_buyer",
          offerId: "o_sysdesign_v2",
          spendingLimitPaise: 500000,
        }),
      }),
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.transaction.mandateId).toBeDefined();
    expect(json.transaction.status).toBe("AUTHORIZED");
    expect(json.transaction.razorpaySubscriptionId).toBeDefined();
    expect(json.transaction.snapshot.offerName).toBe("System Design Pro");
    expect(json.transaction.guardrails.length).toBeGreaterThan(0);
  });

  it("POST /api/buyer/authorize-and-transact rejects spending limit violations with 422", async () => {
    const res = await transactRoute.POST(
      new Request(TRANSACT_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: "user_test_buyer",
          offerId: "o_sysdesign_v2",
          spendingLimitPaise: 200000, // ₹2,000 < ₹3,999
        }),
      }),
    );

    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toContain("exceeds authorized spending limit");
  });

  it("POST /api/buyer/authorize-and-transact rejects stale preview with 409", async () => {
    const res = await transactRoute.POST(
      new Request(TRANSACT_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: "user_test_buyer",
          offerId: "o_sysdesign_v2",
          expectedVersion: 1, // Current is v2
        }),
      }),
    );

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain("Offer version has changed");
  });
});

