import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  ReauthorizationService,
  setReauthorizationRepository,
  setReauthorizationService,
} from "@/lib/reauthorization/service";
import {
  EnvelopeService,
  InMemoryEnvelopeRepository,
} from "@/lib/envelope/service";
import {
  MerchantOfferService,
  InMemoryMerchantOfferRepository,
} from "@/lib/merchant/service";
import {
  CompatibilityService,
  setCompatibilityServices,
} from "@/lib/compatibility/service";
import { InMemoryReauthorizationRepository } from "@/lib/reauthorization/repository";
import type { MerchantOfferData } from "@/lib/merchant/types";
import type { StructuredCommitments } from "@/lib/merchant/structured-commitments";
import { POST as initiatePOST } from "@/app/api/reauthorization/initiate/route";
import { POST as approvePOST } from "@/app/api/reauthorization/[id]/approve/route";
import { POST as declinePOST } from "@/app/api/reauthorization/[id]/decline/route";
import { GET as getRequestGET } from "@/app/api/reauthorization/[id]/route";

function sampleCommitments(): StructuredCommitments {
  return {
    support: {
      tier: "dedicated_mentor",
      slaHours: 24,
      oneOnOneSessionsPerMonth: 4,
      hasDedicatedHuman: true,
    },
    entitlements: {
      keys: ["sysdesign_core", "sysdesign_mocks", "mentor_weekly"],
      criticalKeys: ["mentor_weekly"],
    },
    usageLimits: {
      apiRequestsPerMonth: 10000,
      concurrentSeats: 1,
      computeCredits: 500,
    },
    delivery: {
      type: "continuous_saas",
      commitmentSLA: "Weekly 1:1 sessions",
    },
    refundPolicy: {
      windowDays: 30,
      type: "conditional",
    },
  };
}

function setupData(): MerchantOfferData {
  return {
    merchants: [
      {
        id: "m_forge",
        name: "InterviewForge",
        slug: "interviewforge",
        description: "Fintech prep",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    products: [
      {
        id: "p_sysdesign",
        merchantId: "m_forge",
        name: "System Design Mastery",
        slug: "system-design-mastery",
        description: "Advanced prep",
        category: "coaching",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    offers: [
      {
        id: "o_sysdesign_v1",
        productId: "p_sysdesign",
        version: 1,
        name: "System Design Mentor Tier v1",
        description: "1:1 mentor",
        price: 349900,
        currency: "INR",
        billingInterval: "monthly",
        duration: 180,
        entitlementKeys: ["sysdesign_core", "sysdesign_mocks", "mentor_weekly"],
        refundWindowDays: 30,
        supportTerms: "Dedicated mentor 24-hour turnaround",
        semanticTerms: "Weekly 1:1 video review",
        structuredCommitments: sampleCommitments(),
        isConfirmedByMerchant: true,
        versionHash: "h1".repeat(32),
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "o_sysdesign_v2",
        productId: "p_sysdesign",
        version: 2,
        name: "System Design Mentor Tier v2",
        description: "1:1 mentor v2",
        price: 419900,
        currency: "INR",
        billingInterval: "monthly",
        duration: 180,
        entitlementKeys: ["sysdesign_core", "sysdesign_mocks", "mentor_weekly"],
        refundWindowDays: 30,
        supportTerms: "Dedicated mentor 24-hour turnaround",
        semanticTerms: "Weekly 1:1 video review",
        structuredCommitments: sampleCommitments(),
        isConfirmedByMerchant: true,
        versionHash: "h2".repeat(32),
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };
}

let envelopeService: EnvelopeService;

beforeEach(async () => {
  const data = setupData();
  const merchantRepo = new InMemoryMerchantOfferRepository(data);
  const merchantService = new MerchantOfferService(merchantRepo);
  const envelopeRepo = new InMemoryEnvelopeRepository();
  envelopeService = new EnvelopeService(envelopeRepo, merchantService);
  const compatibilityService = new CompatibilityService(
    envelopeService,
    merchantService,
  );
  setCompatibilityServices(envelopeService, merchantService);

  const reauthRepo = new InMemoryReauthorizationRepository();
  setReauthorizationRepository(reauthRepo);
  const reauthService = new ReauthorizationService(
    reauthRepo,
    envelopeService,
    merchantService,
    compatibilityService,
  );
  setReauthorizationService(reauthService);
});

afterEach(() => {
  setCompatibilityServices(null, null);
  setReauthorizationRepository(null);
  setReauthorizationService(null);
});

describe("Reauthorization API Routes", () => {
  it("executes initiate -> GET -> approve flow via HTTP route handlers", async () => {
    const envelope = await envelopeService.createAuthorizationEnvelope({
      userId: "u_route_test",
      offerId: "o_sysdesign_v1",
      subscriptionId: "sub_route_test",
      financialConstraints: { maxPricePaise: 400000 },
    });

    // 1. POST /api/reauthorization/initiate
    const initRes = await initiatePOST(
      new Request("http://localhost/api/reauthorization/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          envelopeId: envelope.id,
          targetOfferVersionId: "o_sysdesign_v2",
          reason: "Offer updated to v2",
        }),
      }),
    );

    expect(initRes.status).toBe(201);
    const request = await initRes.json();
    expect(request.id).toBeDefined();
    expect(request.state).toBe("MIGRATION_PENDING");

    // 2. GET /api/reauthorization/:id
    const getRes = await getRequestGET(
      new Request(`http://localhost/api/reauthorization/${request.id}`),
      { params: Promise.resolve({ id: request.id }) },
    );
    expect(getRes.status).toBe(200);
    const fetched = await getRes.json();
    expect(fetched.id).toBe(request.id);

    // 3. POST /api/reauthorization/:id/approve
    const approveRes = await approvePOST(
      new Request(`http://localhost/api/reauthorization/${request.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisionNote: "Approved via API",
          updatedFinancialConstraints: { maxPricePaise: 500000 },
        }),
      }),
      { params: Promise.resolve({ id: request.id }) },
    );

    expect(approveRes.status).toBe(200);
    const approvedBody = await approveRes.json();
    expect(approvedBody.request.state).toBe("REAUTHORIZED");
    expect(approvedBody.newEnvelope.authorizedOfferVersionId).toBe("o_sysdesign_v2");
  });

  it("handles decline route with 200", async () => {
    const envelope = await envelopeService.createAuthorizationEnvelope({
      userId: "u_route_decline",
      offerId: "o_sysdesign_v1",
      subscriptionId: "sub_route_decline",
    });

    const initRes = await initiatePOST(
      new Request("http://localhost/api/reauthorization/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          envelopeId: envelope.id,
          targetOfferVersionId: "o_sysdesign_v2",
          reason: "Offer updated to v2",
        }),
      }),
    );
    const request = await initRes.json();

    const declineRes = await declinePOST(
      new Request(`http://localhost/api/reauthorization/${request.id}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "Declined by user",
          action: "RETAIN_BASELINE",
        }),
      }),
      { params: Promise.resolve({ id: request.id }) },
    );

    expect(declineRes.status).toBe(200);
    const declinedBody = await declineRes.json();
    expect(declinedBody.state).toBe("DECLINED");
    expect(declinedBody.decisionAction).toBe("RETAIN_BASELINE");
  });
});
