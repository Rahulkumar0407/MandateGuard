import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  ReauthorizationService,
  setReauthorizationRepository,
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
    ],
  };
}

let merchantService: MerchantOfferService;
let envelopeService: EnvelopeService;
let compatibilityService: CompatibilityService;
let reauthRepo: InMemoryReauthorizationRepository;
let reauthService: ReauthorizationService;

beforeEach(async () => {
  const data = setupData();
  const merchantRepo = new InMemoryMerchantOfferRepository(data);
  merchantService = new MerchantOfferService(merchantRepo);
  const envelopeRepo = new InMemoryEnvelopeRepository();
  envelopeService = new EnvelopeService(envelopeRepo, merchantService);
  compatibilityService = new CompatibilityService(
    envelopeService,
    merchantService,
  );
  setCompatibilityServices(envelopeService, merchantService);

  reauthRepo = new InMemoryReauthorizationRepository();
  setReauthorizationRepository(reauthRepo);
  reauthService = new ReauthorizationService(
    reauthRepo,
    envelopeService,
    merchantService,
    compatibilityService,
  );
});

afterEach(() => {
  setCompatibilityServices(null, null);
  setReauthorizationRepository(null);
});

describe("ReauthorizationService — Lifecycle & Transitions", () => {
  it("executes full reauthorization approval flow (ACTIVE -> MIGRATION_PENDING -> REAUTHORIZED)", async () => {
    // 1. Authorize on v1
    const origEnvelope = await envelopeService.createAuthorizationEnvelope({
      userId: "u_alice",
      offerId: "o_sysdesign_v1",
      subscriptionId: "sub_alice_1",
      financialConstraints: { maxPricePaise: 400000 },
    });

    // 2. Merchant creates v2 (+20% price increase, ₹4199)
    const v2 = await merchantService.createOfferVersion("p_sysdesign", {
      name: "System Design v2 Pro",
      description: "Major revision",
      price: 419900,
      duration: 180,
      entitlementKeys: ["sysdesign_core", "sysdesign_mocks", "mentor_weekly"],
      refundWindowDays: 30,
      supportTerms: "Dedicated mentor 24-hour turnaround",
      semanticTerms: "Weekly 1:1 video review",
      structuredCommitments: sampleCommitments(),
      confirmImmediately: true,
    });

    // 3. Initiate Reauthorization
    const request = await reauthService.initiateReauthorization({
      envelopeId: origEnvelope.id,
      targetOfferVersionId: v2.id,
      reason: "Merchant published major version v2 with price change.",
    });

    expect(request.state).toBe("MIGRATION_PENDING");
    expect(request.compatibilityStatus).toBe("BREAKING"); // Exceeds 400000 ceiling

    // Check envelope status updated
    const envelopeAfterInit = await envelopeService.getEnvelope(origEnvelope.id);
    expect(envelopeAfterInit?.status).toBe("MIGRATION_PENDING");

    // 4. Buyer approves with updated budget ceiling (₹5000)
    const result = await reauthService.approveReauthorization({
      requestId: request.id,
      decisionNote: "Approved price increase to ₹4199 with higher budget.",
      updatedFinancialConstraints: { maxPricePaise: 500000 },
    });

    expect(result.request.state).toBe("REAUTHORIZED");
    expect(result.request.newEnvelopeId).toBeDefined();

    // Check old envelope is REAUTHORIZED
    const oldEnvelope = await envelopeService.getEnvelope(origEnvelope.id);
    expect(oldEnvelope?.status).toBe("REAUTHORIZED");

    // Check new envelope is ACTIVE and pinned to v2
    const newEnvelope = await envelopeService.getEnvelope(result.newEnvelope.id);
    expect(newEnvelope?.status).toBe("ACTIVE");
    expect(newEnvelope?.authorizedOfferVersionId).toBe(v2.id);
    expect(newEnvelope?.baselineCommitments.price).toBe(419900);
    expect(newEnvelope?.financialConstraints.maxPricePaise).toBe(500000);
  });

  it("handles decline flow with RETAIN_BASELINE (reverts envelope to ACTIVE)", async () => {
    const origEnvelope = await envelopeService.createAuthorizationEnvelope({
      userId: "u_bob",
      offerId: "o_sysdesign_v1",
      subscriptionId: "sub_bob_1",
    });

    const v2 = await merchantService.createOfferVersion("p_sysdesign", {
      name: "System Design v2",
      description: "v2",
      price: 377800,
      duration: 180,
      entitlementKeys: ["sysdesign_core", "sysdesign_mocks", "mentor_weekly"],
      refundWindowDays: 30,
      supportTerms: "1:1 mentor",
      semanticTerms: "Video review",
      structuredCommitments: sampleCommitments(),
      confirmImmediately: true,
    });

    const request = await reauthService.initiateReauthorization({
      envelopeId: origEnvelope.id,
      targetOfferVersionId: v2.id,
      reason: "Moderate review-level change.",
    });

    // Decline retaining old baseline
    const declined = await reauthService.declineReauthorization({
      requestId: request.id,
      reason: "Buyer prefers staying on v1 terms.",
      action: "RETAIN_BASELINE",
    });

    expect(declined.state).toBe("DECLINED");
    expect(declined.decisionAction).toBe("RETAIN_BASELINE");

    const envelope = await envelopeService.getEnvelope(origEnvelope.id);
    expect(envelope?.status).toBe("ACTIVE");
  });

  it("handles decline flow with PAUSE_SUBSCRIPTION (transitions envelope to PAUSED)", async () => {
    const origEnvelope = await envelopeService.createAuthorizationEnvelope({
      userId: "u_charlie",
      offerId: "o_sysdesign_v1",
      subscriptionId: "sub_charlie_1",
    });

    const v2 = await merchantService.createOfferVersion("p_sysdesign", {
      name: "System Design v2",
      description: "v2",
      price: 377800,
      duration: 180,
      entitlementKeys: ["sysdesign_core"],
      refundWindowDays: 30,
      supportTerms: "Community",
      semanticTerms: "Community",
      structuredCommitments: sampleCommitments(),
      confirmImmediately: true,
    });

    const request = await reauthService.initiateReauthorization({
      envelopeId: origEnvelope.id,
      targetOfferVersionId: v2.id,
      reason: "Breaking change.",
    });

    const declined = await reauthService.declineReauthorization({
      requestId: request.id,
      reason: "Buyer rejects degraded support and wants to pause.",
      action: "PAUSE_SUBSCRIPTION",
    });

    expect(declined.state).toBe("DECLINED");
    expect(declined.decisionAction).toBe("PAUSE_SUBSCRIPTION");

    const envelope = await envelopeService.getEnvelope(origEnvelope.id);
    expect(envelope?.status).toBe("PAUSED");
  });

  it("handles expiration flow", async () => {
    const origEnvelope = await envelopeService.createAuthorizationEnvelope({
      userId: "u_dave",
      offerId: "o_sysdesign_v1",
      subscriptionId: "sub_dave_1",
    });

    const v2 = await merchantService.createOfferVersion("p_sysdesign", {
      name: "System Design v2",
      description: "v2",
      price: 499900,
      duration: 180,
      entitlementKeys: ["sysdesign_core"],
      refundWindowDays: 30,
      supportTerms: "AI only",
      semanticTerms: "AI only",
      structuredCommitments: sampleCommitments(),
      confirmImmediately: true,
    });

    const request = await reauthService.initiateReauthorization({
      envelopeId: origEnvelope.id,
      targetOfferVersionId: v2.id,
      reason: "Breaking change.",
    });

    const expired = await reauthService.expireReauthorization(request.id);
    expect(expired.state).toBe("EXPIRED");

    // Breaking change without reauthorization causes envelope to be paused
    const envelope = await envelopeService.getEnvelope(origEnvelope.id);
    expect(envelope?.status).toBe("PAUSED");
  });

  it("remains idempotent under repeated approve, decline, and expire calls", async () => {
    const origEnvelope = await envelopeService.createAuthorizationEnvelope({
      userId: "u_idempotent",
      offerId: "o_sysdesign_v1",
      subscriptionId: "sub_idempotent",
    });

    const v2 = await merchantService.createOfferVersion("p_sysdesign", {
      name: "System Design v2",
      description: "v2",
      price: 389900,
      duration: 180,
      entitlementKeys: ["sysdesign_core", "sysdesign_mocks", "mentor_weekly"],
      refundWindowDays: 30,
      supportTerms: "Dedicated mentor",
      semanticTerms: "Video review",
      structuredCommitments: sampleCommitments(),
      confirmImmediately: true,
    });

    const request = await reauthService.initiateReauthorization({
      envelopeId: origEnvelope.id,
      targetOfferVersionId: v2.id,
      reason: "Version upgrade",
    });

    // First approve
    const firstApprove = await reauthService.approveReauthorization({
      requestId: request.id,
      decisionNote: "Approved #1",
    });

    // Second approve (idempotent repeat)
    const secondApprove = await reauthService.approveReauthorization({
      requestId: request.id,
      decisionNote: "Approved #2",
    });

    expect(secondApprove.request.id).toBe(firstApprove.request.id);
    expect(secondApprove.request.state).toBe("REAUTHORIZED");
    expect(secondApprove.newEnvelope.id).toBe(firstApprove.newEnvelope.id);
    expect(secondApprove.newEnvelope.authorizedOfferVersionId).toBe(v2.id);
  });
});
