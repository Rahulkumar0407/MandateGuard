import { describe, it, expect, beforeEach } from "vitest";
import {
  BuyerTransactionService,
  setBuyerTransactionService,
} from "@/lib/agent/buyer-transaction";
import { CommerceMutationExecutor } from "@/lib/actions/commerce-executor";
import { InMemoryMerchantOfferRepository } from "@/lib/merchant/repository";

import { MerchantOfferService } from "@/lib/merchant/service";
import { InMemoryMandateRepository } from "@/lib/mandate/repository";
import { MandateService, MandateError } from "@/lib/mandate/service";
import { MockRazorpayGateway } from "@/lib/razorpay/gateway";
import { normalizeBuyerIntent } from "@/lib/intent";
import type { MerchantOfferData } from "@/lib/merchant/types";

const TS = new Date("2026-01-01T00:00:00.000Z");

describe("M10-B6 — Buyer Authorization Preview & Transaction Service", () => {
  let data: MerchantOfferData;
  let merchantRepo: InMemoryMerchantOfferRepository;
  let merchantService: MerchantOfferService;
  let mandateRepo: InMemoryMandateRepository;
  let mandateService: MandateService;
  let mockGateway: MockRazorpayGateway;
  let service: BuyerTransactionService;

  beforeEach(() => {
    data = {
      merchants: [
        {
          id: "m_interviewforge",
          name: "InterviewForge",
          slug: "interviewforge",
          description: "Premier tech interview prep platform",
          status: "ACTIVE",
          createdAt: TS,
          updatedAt: TS,
        },
      ],
      products: [
        {
          id: "p_sysdesign",
          merchantId: "m_interviewforge",
          name: "System Design Mastery",
          slug: "system-design-mastery",
          description: "Comprehensive system design prep",
          category: "system_design",
          active: true,
          createdAt: TS,
          updatedAt: TS,
        },
      ],
      offers: [
        {
          id: "o_mentor",
          productId: "p_sysdesign",
          version: 1,
          name: "System Design Pro",
          description: "Full course with weekly 1:1 human mentor feedback",
          price: 349900,
          currency: "INR",
          billingInterval: "monthly",
          duration: 180,
          entitlementKeys: ["system_design_curriculum", "human_mentor", "mock_interviews"],
          refundWindowDays: 30,
          supportTerms: "1:1 mentor support",
          semanticTerms: "Weekly reviews",
          isConfirmedByMerchant: true,
          versionHash: "hash_mentor_v1",
          active: true,
          createdAt: TS,
          updatedAt: TS,
          structuredCommitments: {
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
        },
      ],
    };

    merchantRepo = new InMemoryMerchantOfferRepository(data);
    merchantService = new MerchantOfferService(merchantRepo);
    mandateRepo = new InMemoryMandateRepository();
    mandateService = new MandateService(mandateRepo, merchantService);
    mockGateway = new MockRazorpayGateway();
    const mutationExecutor = new CommerceMutationExecutor(
      mockGateway,
      mandateService,
    );
    service = new BuyerTransactionService(merchantService, mutationExecutor);
    setBuyerTransactionService(service);
  });


  describe("1. Purchase Preview Generation", () => {
    it("generates authoritative preview with verified commitments and spending limit check", async () => {
      const intent = normalizeBuyerIntent({
        category: "system_design",
        budget: { amountPaise: 400000, currency: "INR", type: "HARD" },
        billing: { cadence: "monthly", isRecurring: true },
        mustHave: ["human_mentor"],
      });

      const preview = await service.getPurchasePreview("o_mentor", intent);

      expect(preview.offerId).toBe("o_mentor");
      expect(preview.offerName).toBe("System Design Pro");
      expect(preview.pricePaise).toBe(349900);
      expect(preview.priceFormatted).toContain("₹3,499");
      expect(preview.spendingLimitCompliance).toBe(true);
      expect(preview.aiSpendingLimit?.amountFormatted).toContain("₹4,000");
      expect(preview.verifiedCommitments.length).toBeGreaterThan(0);
      expect(preview.verifiedCommitments[0]).toContain("1:1 human mentor");
      expect(preview.protectionTerms.length).toBeGreaterThan(0);
    });

    it("flags non-compliance if offer price exceeds hard spending limit", async () => {
      const tightIntent = normalizeBuyerIntent({
        category: "system_design",
        budget: { amountPaise: 300000, currency: "INR", type: "HARD" },
        billing: { cadence: "monthly", isRecurring: true },
      });

      const preview = await service.getPurchasePreview("o_mentor", tightIntent);
      expect(preview.spendingLimitCompliance).toBe(false);
    });

    it("throws 404 MandateError if offer does not exist or is inactive", async () => {
      await expect(service.getPurchasePreview("o_nonexistent")).rejects.toThrow(
        MandateError,
      );
    });
  });

  describe("2. Explicit Authorization & Transaction Execution", () => {
    it("authorizes mandate, creates immutable snapshot, and creates subscription through gateway", async () => {
      const receipt = await service.authorizeAndTransact({
        userId: "user_buyer_123",
        offerId: "o_mentor",
        spendingLimitPaise: 400000,
        customerEmail: "buyer@example.com",
      });

      expect(receipt.mandateId).toBeDefined();
      expect(receipt.status).toBe("AUTHORIZED");
      expect(receipt.razorpaySubscriptionId).toBeDefined();
      expect(receipt.snapshot).toBeDefined();
      expect(receipt.guardrails.length).toBeGreaterThan(0);

      // Verify that mock gateway created the subscription
      expect(mockGateway.subscriptions.size).toBe(1);
      const createdSub = mockGateway.subscriptions.get(receipt.razorpaySubscriptionId!);
      expect(createdSub).toBeDefined();
    });

    it("enforces spending limit guardrail on the server", async () => {
      await expect(
        service.authorizeAndTransact({
          userId: "user_buyer_123",
          offerId: "o_mentor",
          spendingLimitPaise: 300000, // ₹3,000 < ₹3,499
        }),
      ).rejects.toThrow("exceeds authorized spending limit");
    });

    it("rejects confirmation if offer version has changed (stale preview)", async () => {
      await expect(
        service.authorizeAndTransact({
          userId: "user_buyer_123",
          offerId: "o_mentor",
          expectedVersion: 999, // mismatch with v1
        }),
      ).rejects.toThrow("Offer version has changed");
    });

    it("rejects confirmation if offer terms hash has changed (stale preview hash)", async () => {
      await expect(
        service.authorizeAndTransact({
          userId: "user_buyer_123",
          offerId: "o_mentor",
          expectedVersion: 1,
          expectedVersionHash: "hash_old_stale_terms", // mismatch
        }),
      ).rejects.toThrow("Offer terms have been modified");
    });

    it("deduplicates requests with idempotency key before calling gateway", async () => {
      const input = {
        userId: "user_buyer_123",
        offerId: "o_mentor",
        idempotencyKey: "idem_key_buyer_1",
      };

      const first = await service.authorizeAndTransact(input);
      expect(mockGateway.subscriptions.size).toBe(1);

      const second = await service.authorizeAndTransact(input);
      expect(second.mandateId).toBe(first.mandateId);
      // Gateway should not have been called a second time
      expect(mockGateway.subscriptions.size).toBe(1);
    });

    it("compensates and cancels orphaned provider subscription if local mandate persistence fails", async () => {
      // Force mandate repo to fail on create
      mandateRepo.createMandateWithSnapshot = async () => {
        throw new Error("Database deadlock / write failure");
      };

      await expect(
        service.authorizeAndTransact({
          userId: "user_buyer_123",
          offerId: "o_mentor",
        }),
      ).rejects.toThrow("Database deadlock / write failure");

      // In MockRazorpayGateway, cancelSubscription removes from subscriptions map
      expect(mockGateway.subscriptions.size).toBe(0);
    });
  });
});

