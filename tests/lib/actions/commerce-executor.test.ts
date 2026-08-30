import { describe, it, expect, beforeEach } from "vitest";
import {
  CommerceMutationExecutor,
  setCommerceMutationExecutor,
} from "@/lib/actions/commerce-executor";
import { MockRazorpayGateway } from "@/lib/razorpay/gateway";
import { InMemoryMandateRepository } from "@/lib/mandate/repository";
import { MandateService } from "@/lib/mandate/service";
import { InMemoryMerchantOfferRepository } from "@/lib/merchant/repository";
import { MerchantOfferService } from "@/lib/merchant/service";
import { InMemoryAuditRepository } from "@/lib/audit/repository";
import { AuditService } from "@/lib/audit/service";
import type { OfferDetailDTO } from "@/lib/merchant/types";

const TS = new Date("2026-01-01T00:00:00.000Z");

describe("CommerceMutationExecutor — Unified Provider Mutation Boundary", () => {
  let mockGateway: MockRazorpayGateway;
  let mandateRepo: InMemoryMandateRepository;
  let mandateService: MandateService;
  let auditRepo: InMemoryAuditRepository;
  let auditService: AuditService;
  let executor: CommerceMutationExecutor;
  let sampleOffer: OfferDetailDTO;

  beforeEach(() => {
    mockGateway = new MockRazorpayGateway();
    mandateRepo = new InMemoryMandateRepository();
    auditRepo = new InMemoryAuditRepository();
    auditService = new AuditService(auditRepo);

    sampleOffer = {
      id: "o_sd_v1",
      version: 1,
      name: "System Design Pro",
      description: "Full track",
      price: 349900,
      currency: "INR",
      billingInterval: "monthly",
      duration: 180,
      entitlementKeys: ["sd_course", "mentor"],
      refundPolicy: { windowDays: 30 },
      supportTerms: "1:1 Mentor",
      semanticTerms: "Weekly sessions",
      availability: "ACTIVE",
      versionHash: "hash_sd_v1",
      isConfirmedByMerchant: true,
      product: {
        id: "p_sd",
        merchantId: "m_forge",
        name: "System Design",
        slug: "system-design",
        category: "system_design",
      },
      structuredCommitments: {
        support: {
          tier: "dedicated_mentor",
          slaHours: 24,
          oneOnOneSessionsPerMonth: 4,
          hasDedicatedHuman: true,
        },
        entitlements: {
          keys: ["sd_course", "mentor"],
          criticalKeys: ["mentor"],
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
          windowDays: 30,
          type: "conditional",
        },
      },
    };

    const merchantRepo = new InMemoryMerchantOfferRepository({
      merchants: [
        {
          id: "m_forge",
          name: "Forge",
          slug: "forge",
          description: "Tech prep",
          status: "ACTIVE",
          createdAt: TS,
          updatedAt: TS,
        },
      ],
      products: [
        {
          id: "p_sd",
          merchantId: "m_forge",
          name: "System Design",
          slug: "system-design",
          description: "Course",
          category: "system_design",
          active: true,
          createdAt: TS,
          updatedAt: TS,
        },
      ],
      offers: [
        {
          ...sampleOffer,
          productId: "p_sd",
          refundWindowDays: 30,
          active: true,
          createdAt: TS,
          updatedAt: TS,
        },
      ],
    });
    const merchantService = new MerchantOfferService(merchantRepo);
    mandateService = new MandateService(mandateRepo, merchantService);

    executor = new CommerceMutationExecutor(
      mockGateway,
      mandateService,
      auditService,
    );
    setCommerceMutationExecutor(executor);
  });

  describe("PROVISION_SUBSCRIPTION", () => {
    it("executes provider subscription creation and binds immutable snapshot", async () => {
      const res = await executor.execute({
        idempotencyKey: "idem_commerce_1",
        mutation: {
          type: "PROVISION_SUBSCRIPTION",
          data: {
            offer: sampleOffer,
            userId: "usr_buyer_1",
            expectedVersion: 1,
            expectedVersionHash: "hash_sd_v1",
            spendingLimitPaise: 400000,
          },
        },
        context: {
          source: "ai_buyer",
          callerId: "BuyerTransactionService",
        },
      });

      expect(res.mutationType).toBe("PROVISION_SUBSCRIPTION");
      expect(res.status).toBe("SUCCEEDED");
      expect(res.mandateId).toBeDefined();
      expect(res.providerSubscriptionId).toBeDefined();
      expect(mockGateway.subscriptions.size).toBe(1);

      // Verify audit record was written
      const auditLogs = await auditService.listForMandate(res.mandateId!);
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].reason).toBe("EXPLICIT_BUYER_AUTHORIZATION");
    });

    it("enforces early idempotency without calling provider a second time", async () => {
      const req = {
        idempotencyKey: "idem_dedup_test",
        mutation: {
          type: "PROVISION_SUBSCRIPTION" as const,
          data: {
            offer: sampleOffer,
            userId: "usr_buyer_1",
          },
        },
        context: {
          source: "ai_buyer" as const,
          callerId: "BuyerTransactionService",
        },
      };

      const first = await executor.execute(req);
      expect(mockGateway.subscriptions.size).toBe(1);

      const second = await executor.execute(req);
      expect(second.mandateId).toBe(first.mandateId);
      expect(second.idempotent).toBe(true);
      expect(mockGateway.subscriptions.size).toBe(1);
    });

    it("rejects stale preview version with 409", async () => {
      await expect(
        executor.execute({
          mutation: {
            type: "PROVISION_SUBSCRIPTION",
            data: {
              offer: sampleOffer,
              userId: "usr_buyer_1",
              expectedVersion: 99, // Mismatch
            },
          },
          context: { source: "ai_buyer", callerId: "Test" },
        }),
      ).rejects.toThrow("Offer version has changed");
    });

    it("compensates and cancels provider subscription if local mandate persistence fails", async () => {
      mandateRepo.createMandateWithSnapshot = async () => {
        throw new Error("Disk full / DB offline");
      };

      await expect(
        executor.execute({
          mutation: {
            type: "PROVISION_SUBSCRIPTION",
            data: {
              offer: sampleOffer,
              userId: "usr_buyer_1",
            },
          },
          context: { source: "ai_buyer", callerId: "Test" },
        }),
      ).rejects.toThrow("Disk full / DB offline");

      expect(mockGateway.subscriptions.size).toBe(0);
    });
  });

  describe("Lifecycle Mutations", () => {
    it("handles PAUSE_SUBSCRIPTION", async () => {
      mockGateway.subscriptions.set("sub_live_1", {
        id: "sub_live_1",
        planId: "plan_1",
        status: "active",
        totalCount: 12,
      });

      const res = await executor.execute({
        mutation: {
          type: "PAUSE_SUBSCRIPTION",
          data: {
            mandateId: "mnd_1",
            providerSubscriptionId: "sub_live_1",
          },
        },
        context: { source: "integrity_policy", callerId: "ActionExecutor" },
      });

      expect(res.status).toBe("SUCCEEDED");
      expect(res.mutationType).toBe("PAUSE_SUBSCRIPTION");
      expect(mockGateway.subscriptions.get("sub_live_1")?.status).toBe("paused");
    });

    it("handles RESUME_SUBSCRIPTION", async () => {
      mockGateway.subscriptions.set("sub_live_2", {
        id: "sub_live_2",
        planId: "plan_1",
        status: "paused",
        totalCount: 12,
      });

      const res = await executor.execute({
        mutation: {
          type: "RESUME_SUBSCRIPTION",
          data: {
            mandateId: "mnd_2",
            providerSubscriptionId: "sub_live_2",
          },
        },
        context: { source: "reauthorization", callerId: "ReauthService" },
      });

      expect(res.status).toBe("SUCCEEDED");
      expect(res.mutationType).toBe("RESUME_SUBSCRIPTION");
      expect(mockGateway.subscriptions.get("sub_live_2")?.status).toBe("active");
    });
  });
});

