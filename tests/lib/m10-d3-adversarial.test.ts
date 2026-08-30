import { describe, it, expect, beforeEach } from "vitest";
import crypto from "crypto";
import { CommerceMutationExecutor } from "@/lib/actions/commerce-executor";
import { MockRazorpayGateway } from "@/lib/razorpay/gateway";
import { InMemoryMandateRepository } from "@/lib/mandate/repository";
import { MandateService } from "@/lib/mandate/service";
import { InMemoryAuditRepository } from "@/lib/audit/repository";
import { AuditService } from "@/lib/audit/service";
import { InMemoryEnvelopeRepository } from "@/lib/envelope/repository";
import { EnvelopeService } from "@/lib/envelope/service";
import { InMemoryMerchantOfferRepository } from "@/lib/merchant/repository";
import { MerchantOfferService } from "@/lib/merchant/service";
import { CompatibilityService } from "@/lib/compatibility/service";
import { ReauthorizationService } from "@/lib/reauthorization/service";
import { InMemoryReauthorizationRepository } from "@/lib/reauthorization/repository";
import { MerchantBuyabilityEngine } from "@/lib/merchant-intelligence/buyability-engine";
import { getGoldBuyabilityCohort } from "@/lib/merchant-intelligence/buyability-benchmark-dataset";
import { canApplyWebhookStatus } from "@/lib/subscription/state";
import { verifyWebhookSignature, buildWebhookDedupKey } from "@/lib/razorpay/webhooks";
import type { OfferDetailDTO } from "@/lib/merchant/types";
import type { StructuredCommitments } from "@/lib/merchant/structured-commitments";

const TS = new Date("2026-01-01T00:00:00.000Z");

function sampleCommitments(): StructuredCommitments {
  return {
    support: {
      tier: "dedicated_mentor",
      slaHours: 24,
      oneOnOneSessionsPerMonth: 4,
      hasDedicatedHuman: true,
    },
    entitlements: {
      keys: ["system_design_curriculum", "human_mentor", "mock_interviews"],
      criticalKeys: ["human_mentor"],
    },
    usageLimits: {
      apiRequestsPerMonth: 1000,
      concurrentSeats: 1,
      computeCredits: 100,
    },
    delivery: {
      type: "continuous_saas",
      commitmentSLA: "24h Turnaround",
    },
    refundPolicy: {
      windowDays: 30,
      type: "conditional",
    },
  };
}

describe("M10-D3 — Production Evidence & Adversarial Hardening Suite", () => {
  let gateway: MockRazorpayGateway;
  let mandateRepo: InMemoryMandateRepository;
  let mandateService: MandateService;
  let auditRepo: InMemoryAuditRepository;
  let auditService: AuditService;
  let executor: CommerceMutationExecutor;
  let merchantRepo: InMemoryMerchantOfferRepository;
  let merchantService: MerchantOfferService;
  let envelopeRepo: InMemoryEnvelopeRepository;
  let envelopeService: EnvelopeService;
  let compatibilityService: CompatibilityService;
  let reauthRepo: InMemoryReauthorizationRepository;
  let reauthService: ReauthorizationService;
  let buyabilityEngine: MerchantBuyabilityEngine;
  let activeOffer: OfferDetailDTO;

  beforeEach(async () => {
    gateway = new MockRazorpayGateway();
    mandateRepo = new InMemoryMandateRepository();
    auditRepo = new InMemoryAuditRepository();
    auditService = new AuditService(auditRepo);

    activeOffer = {
      id: "o_sysdesign_v1",
      version: 1,
      name: "System Design Pro",
      description: "1:1 coaching with senior tech leads",
      price: 349900,
      currency: "INR",
      billingInterval: "monthly",
      duration: 180,
      entitlementKeys: ["system_design_curriculum", "human_mentor", "mock_interviews"],
      refundPolicy: { windowDays: 30 },
      supportTerms: "1:1 dedicated human mentor with 24h turnaround SLA",
      semanticTerms: "Weekly sessions",
      availability: "ACTIVE",
      versionHash: "hash_v1_valid_3499",
      isConfirmedByMerchant: true,
      product: {
        id: "p_sysdesign",
        merchantId: "m_interviewforge",
        name: "System Design Pro",
        slug: "system-design-pro",
        category: "system_design",
      },
      structuredCommitments: sampleCommitments(),
    };

    merchantRepo = new InMemoryMerchantOfferRepository({
      merchants: [
        {
          id: "m_interviewforge",
          name: "InterviewForge AI",
          slug: "interviewforge",
          description: "Technical Interview Coaching",
          status: "ACTIVE",
          createdAt: TS,
          updatedAt: TS,
        },
      ],
      products: [
        {
          id: "p_sysdesign",
          merchantId: "m_interviewforge",
          name: "System Design Pro",
          slug: "system-design-pro",
          description: "Coaching",
          category: "system_design",
          active: true,
          createdAt: TS,
          updatedAt: TS,
        },
      ],
      offers: [
        {
          ...activeOffer,
          productId: "p_sysdesign",
          refundWindowDays: 30,
          active: true,
          createdAt: TS,
          updatedAt: TS,
        },
      ],
    });

    merchantService = new MerchantOfferService(merchantRepo);
    mandateService = new MandateService(mandateRepo, merchantService);
    executor = new CommerceMutationExecutor(gateway, mandateService, auditService);

    envelopeRepo = new InMemoryEnvelopeRepository();
    envelopeService = new EnvelopeService(envelopeRepo, merchantService);
    compatibilityService = new CompatibilityService(envelopeService, merchantService);
    reauthRepo = new InMemoryReauthorizationRepository();
    reauthService = new ReauthorizationService(
      reauthRepo,
      envelopeService,
      merchantService,
      compatibilityService,
    );

    buyabilityEngine = new MerchantBuyabilityEngine();
  });

  // ==========================================
  // 1. MERCHANT / BUYABILITY ADVERSARIAL TESTS
  // ==========================================
  describe("1. Merchant AI Buyability Evidence", () => {
    it("evaluates 100 gold buyer missions deterministically with real traces", async () => {
      const cohort = getGoldBuyabilityCohort();
      expect(cohort.missions.length).toBe(100);

      const report = buyabilityEngine.evaluateBuyability(
        {
          merchantId: "m_interviewforge",
          merchantName: "InterviewForge AI",
          offers: [activeOffer],
          products: [
            {
              id: activeOffer.product.id,
              name: activeOffer.product.name,
              slug: activeOffer.product.slug,
              description: "Coaching",
              category: activeOffer.product.category,
              offers: [activeOffer],
            },
          ],
          totalProducts: 1,
          totalOffers: 1,
          activeConfirmedOffers: 1,
          unconfirmedOffers: 0,
          offersWithStructuredCommitments: 1,
        },
        cohort,
      );

      expect(report.totalMissions).toBe(100);
      expect(report.funnel.discovered.count).toBeGreaterThan(0);
      expect(report.missionResults.length).toBe(100);

      const firstFailed = report.missionResults.find((m) => m.status === "FAILED");
      if (firstFailed) {
        expect(firstFailed.rawQuery).toBeDefined();
        expect(firstFailed.language).toMatch(/en|hi|hinglish/i);
        expect(firstFailed.failureCategory).toBeDefined();
      }
    });

    it("handles empty catalog without crashing or fabricating metrics", () => {
      const report = buyabilityEngine.evaluateBuyability({
        merchantId: "m_empty",
        merchantName: "Empty Merchant",
        offers: [],
        products: [],
        totalProducts: 0,
        totalOffers: 0,
        activeConfirmedOffers: 0,
        unconfirmedOffers: 0,
        offersWithStructuredCommitments: 0,
      });

      expect(report.funnel.discovered.count).toBe(0);
      expect(report.funnel.recommended.count).toBe(0);
      expect(report.funnel.recommended.ratePercent).toBe(0);
    });
  });

  // ==========================================
  // 2. BUY SIDE & HARD AUTHORIZATION BOUNDARY
  // ==========================================
  describe("2. BUY Side & Hard Authorization Gate", () => {
    it("succeeds when expected version, hash, and spending limit match", async () => {
      const result = await executor.execute({
        idempotencyKey: "idem_m10_d3_success_1",
        mutation: {
          type: "PROVISION_SUBSCRIPTION",
          data: {
            offer: activeOffer,
            userId: "user_buyer_valid",
            expectedVersion: activeOffer.version,
            expectedVersionHash: activeOffer.versionHash,
            spendingLimitPaise: 500000,
          },
        },
        context: { source: "ai_buyer", callerId: "test_buyer" },
      });

      expect(result.status).toBe("SUCCEEDED");
      expect(result.reason).toBe("EXPLICIT_BUYER_AUTHORIZATION");
      expect(result.mandateId).toBeDefined();
      expect(result.providerSubscriptionId).toBeDefined();
    });

    it("blocks checkout with 409 when offer version changed after preview (stale version)", async () => {
      await expect(
        executor.execute({
          idempotencyKey: "idem_m10_d3_stale_ver",
          mutation: {
            type: "PROVISION_SUBSCRIPTION",
            data: {
              offer: { ...activeOffer, version: activeOffer.version + 1 },
              userId: "user_buyer_stale",
              expectedVersion: activeOffer.version,
              expectedVersionHash: activeOffer.versionHash,
            },
          },
          context: { source: "ai_buyer", callerId: "test_buyer" },
        }),
      ).rejects.toThrow(/stale preview/i);
    });

    it("blocks checkout with 409 when offer terms hash changed (stale hash)", async () => {
      await expect(
        executor.execute({
          idempotencyKey: "idem_m10_d3_stale_hash",
          mutation: {
            type: "PROVISION_SUBSCRIPTION",
            data: {
              offer: { ...activeOffer, versionHash: "hash_modified_unconsented" },
              userId: "user_buyer_stale_hash",
              expectedVersion: activeOffer.version,
              expectedVersionHash: "hash_v1_valid_3499", // Stale preview hash
            },
          },
          context: { source: "ai_buyer", callerId: "test_buyer" },
        }),
      ).rejects.toThrow(/stale terms hash/i);
    });

    it("blocks checkout with 422 when price exceeds authorized spending limit", async () => {
      await expect(
        executor.execute({
          idempotencyKey: "idem_m10_d3_limit_exceeded",
          mutation: {
            type: "PROVISION_SUBSCRIPTION",
            data: {
              offer: activeOffer, // ₹3,499
              userId: "user_buyer_overlimit",
              expectedVersion: activeOffer.version,
              expectedVersionHash: activeOffer.versionHash,
              spendingLimitPaise: 200000, // Limit ₹2,000
            },
          },
          context: { source: "ai_buyer", callerId: "test_buyer" },
        }),
      ).rejects.toThrow(/exceeds authorized spending limit/i);
    });

    it("is strictly idempotent under duplicate checkout requests", async () => {
      const payload = {
        idempotencyKey: "idem_m10_d3_repeat_key",
        mutation: {
          type: "PROVISION_SUBSCRIPTION" as const,
          data: {
            offer: activeOffer,
            userId: "user_buyer_repeat",
            expectedVersion: activeOffer.version,
            expectedVersionHash: activeOffer.versionHash,
          },
        },
        context: { source: "ai_buyer" as const, callerId: "test_buyer" },
      };

      const first = await executor.execute(payload);
      const second = await executor.execute(payload);

      expect(first.mandateId).toBe(second.mandateId);
      expect(second.reason).toBe("ALREADY_EXECUTED");
      expect(second.idempotent).toBe(true);
    });
  });

  // ==========================================
  // 3. PROTECT SIDE — TERM CHANGE & REAUTHORIZATION
  // ==========================================
  describe("3. PROTECT Side & Term Change Gating", () => {
    it("detects unilateral price increase and requires reauthorization", async () => {
      // 1. Create baseline envelope
      const envelope = await envelopeRepo.createEnvelope({
        userId: "user_m10_protect",
        merchantId: activeOffer.product.merchantId,
        subscriptionId: "sub_initial_test",
        mandateId: "mandate_initial_test",
        authorizedOfferVersionId: activeOffer.id,
        authorizedOfferHash: activeOffer.versionHash || "hash_v1",
        baselineCommitments: {
          offerName: activeOffer.name,
          description: activeOffer.description,
          price: activeOffer.price,
          currency: activeOffer.currency,
          billingInterval: activeOffer.billingInterval,
          duration: activeOffer.duration,
          refundWindowDays: 30,
          supportTerms: activeOffer.supportTerms,
          semanticTerms: activeOffer.semanticTerms,
          structuredCommitments: sampleCommitments(),
        },
        financialConstraints: {
          maxPricePaise: 400000,
          allowedCurrencies: ["INR"],
          maxPriceIncreasePercent: 15,
          allowedBillingIntervals: ["monthly"],
        },
        agentPermissions: {
          canAutoApproveMinorChanges: false,
          canAutoPauseOnBreach: true,
          canApproveRefundRequest: false,
          canMigrateToNewVersion: false,
        },
        tolerancePolicy: {
          priceIncreasePercentTolerance: 5,
          refundWindowReductionDaysTolerance: 0,
          allowedTierDowngrades: [],
          allowedRemovedEntitlements: [],
        },
        authorizationPolicyHash: "auth_policy_hash_1",
        status: "ACTIVE",
        expiresAt: null,
      });

      // 2. Merchant changes price to ₹5,499 (+57% increase, breaches financial boundary)
      const saved = await merchantRepo.createOfferVersion({
        productId: activeOffer.product.id,
        version: activeOffer.version + 1,
        name: activeOffer.name,
        description: activeOffer.description,
        price: 549900,
        currency: activeOffer.currency,
        billingInterval: activeOffer.billingInterval,
        duration: activeOffer.duration,
        entitlementKeys: activeOffer.entitlementKeys,
        refundWindowDays: 30,
        supportTerms: activeOffer.supportTerms,
        semanticTerms: activeOffer.semanticTerms,
        structuredCommitments: sampleCommitments(),
        isConfirmedByMerchant: true,
        versionHash: "hash_v2_price_5499",
        active: true,
      });

      const modifiedOffer = await merchantService.getOffer(saved.id);
      expect(modifiedOffer).not.toBeNull();

      // 3. Evaluate compatibility
      const comp = await compatibilityService.evaluateEnvelopeCompatibility(
        envelope.id,
        modifiedOffer!,
      );

      expect(comp.status).toBe("BREAKING");
      expect(comp.findings.length).toBeGreaterThan(0);

      // 4. Initiate reauthorization workflow
      const reauthReq = await reauthService.initiateReauthorization({
        envelopeId: envelope.id,
        targetOfferVersionId: saved.id,
        reason: "Price increased from ₹3,499 to ₹5,499",
      });

      expect(reauthReq.state).toBe("MIGRATION_PENDING");
      expect(reauthReq.compatibilityStatus).toBe("BREAKING");
      expect(reauthReq.envelopeId).toBe(envelope.id);

      // 5. Verify envelope status updated to MIGRATION_PENDING
      const updatedEnv = await envelopeService.getEnvelope(envelope.id);
      expect(updatedEnv?.status).toBe("MIGRATION_PENDING");

      // 6. Buyer explicitly approves revised terms
      const { request: approvedReq, newEnvelope } = await reauthService.approveReauthorization({
        requestId: reauthReq.id,
        decisionNote: "Approved ₹5,499 revised price",
      });

      expect(approvedReq.state).toBe("REAUTHORIZED");
      expect(newEnvelope).toBeDefined();
      const finalEnv = await envelopeService.getEnvelope(envelope.id);
      expect(finalEnv?.status).toBe("REAUTHORIZED");
    });
  });

  // ==========================================
  // 4. WEBHOOK SECURITY & IDEMPOTENCY
  // ==========================================
  describe("4. Webhook Security, Idempotency & Out-of-Order Safety", () => {
    const secret = "test_webhook_secret_key_12345";

    it("verifies authentic Razorpay HMAC-SHA256 signatures", () => {
      const body = JSON.stringify({ event: "subscription.activated", payload: {} });
      const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

      const isValid = verifyWebhookSignature(body, signature, secret);
      expect(isValid).toBe(true);
    });

    it("rejects forged or tampered webhook signatures", () => {
      const body = JSON.stringify({ event: "subscription.activated", payload: {} });
      const fakeSig = "tampered_invalid_signature_hash";

      const isValid = verifyWebhookSignature(body, fakeSig, secret);
      expect(isValid).toBe(false);
    });

    it("generates stable deduplication keys from headers and body", () => {
      const key1 = buildWebhookDedupKey({ event: "subscription.charged" }, "evt_rzp_unique_999");
      const key2 = buildWebhookDedupKey({ event: "subscription.charged" }, "evt_rzp_unique_999");

      expect(key1).toBe("evt_rzp_unique_999");
      expect(key2).toBe("evt_rzp_unique_999");
    });

    it("protects terminal states (CANCELLED, HALTED) from out-of-order activated webhooks", () => {
      // If a subscription is already CANCELLED, a delayed 'subscription.activated' must NOT revert it to ACTIVE
      expect(canApplyWebhookStatus("CANCELLED", "ACTIVE")).toBe(false);
      expect(canApplyWebhookStatus("CANCELLED", "PENDING")).toBe(false);
      expect(canApplyWebhookStatus("CANCELLED", "PAUSED")).toBe(false);
      expect(canApplyWebhookStatus("CANCELLED", "CANCELLED")).toBe(true);

      // If a subscription is HALTED, only HALTED or CANCELLED is allowed
      expect(canApplyWebhookStatus("HALTED", "ACTIVE")).toBe(false);
      expect(canApplyWebhookStatus("HALTED", "CANCELLED")).toBe(true);

      // Normal transitions are allowed
      expect(canApplyWebhookStatus("ACTIVE", "PAUSED")).toBe(true);
      expect(canApplyWebhookStatus("PAUSED", "ACTIVE")).toBe(true);
      expect(canApplyWebhookStatus("ACTIVE", "CANCELLED")).toBe(true);
    });
  });
});
