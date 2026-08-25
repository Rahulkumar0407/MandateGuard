import { describe, it, expect } from "vitest";
import {
  SupportCommitmentSchema,
  EntitlementCommitmentSchema,
  UsageLimitCommitmentSchema,
  RefundPolicyCommitmentSchema,
  StructuredCommitmentsSchema,
  normalizeStructuredCommitments,
  computeOfferVersionHash,
  extractStructuredCommitmentCandidate,
  type StructuredCommitments,
  type CanonicalOfferInput,
} from "@/lib/merchant/structured-commitments";
import {
  MerchantOfferService,
  OfferAlreadyConfirmedError,
  OfferNotFoundError,
} from "@/lib/merchant/service";
import { InMemoryMerchantOfferRepository } from "@/lib/merchant/repository";
import type { MerchantOfferData } from "@/lib/merchant/types";

function validCommitments(): StructuredCommitments {
  return {
    support: {
      tier: "dedicated_mentor",
      slaHours: 24,
      oneOnOneSessionsPerMonth: 4,
      hasDedicatedHuman: true,
    },
    entitlements: {
      keys: ["sysdesign_core", "sysdesign_mocks", "mentor_feedback_weekly"],
      criticalKeys: ["mentor_feedback_weekly"],
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

describe("M9 Phase 1: Structured Commercial Commitments", () => {
  describe("1. Validation & Schema Enforcement", () => {
    it("accepts valid structured commitments", () => {
      const parsed = StructuredCommitmentsSchema.safeParse(validCommitments());
      expect(parsed.success).toBe(true);
    });

    it("rejects invalid support tier", () => {
      const invalid = validCommitments();
      // @ts-expect-error invalid tier
      invalid.support.tier = "non_existent_tier";
      const res = SupportCommitmentSchema.safeParse(invalid.support);
      expect(res.success).toBe(false);
    });

    it("rejects negative SLA hours", () => {
      const invalid = validCommitments();
      invalid.support.slaHours = -5;
      const res = SupportCommitmentSchema.safeParse(invalid.support);
      expect(res.success).toBe(false);
    });

    it("rejects negative session counts", () => {
      const invalid = validCommitments();
      invalid.support.oneOnOneSessionsPerMonth = -1;
      const res = SupportCommitmentSchema.safeParse(invalid.support);
      expect(res.success).toBe(false);
    });

    it("rejects duplicate entitlement keys", () => {
      const invalid = validCommitments();
      invalid.entitlements.keys = ["sysdesign_core", "sysdesign_core"];
      const res = EntitlementCommitmentSchema.safeParse(invalid.entitlements);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain("Duplicate entitlement");
      }
    });

    it("rejects critical entitlement missing from keys", () => {
      const invalid = validCommitments();
      invalid.entitlements.criticalKeys = ["non_existent_critical_feature"];
      const res = EntitlementCommitmentSchema.safeParse(invalid.entitlements);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain("must be present in entitlement keys");
      }
    });

    it("rejects invalid usage limits (negative or zero seats)", () => {
      const invalid = validCommitments();
      invalid.usageLimits.concurrentSeats = 0;
      const res = UsageLimitCommitmentSchema.safeParse(invalid.usageLimits);
      expect(res.success).toBe(false);
    });

    it("rejects negative refund window days", () => {
      const invalid = validCommitments();
      invalid.refundPolicy.windowDays = -10;
      const res = RefundPolicyCommitmentSchema.safeParse(invalid.refundPolicy);
      expect(res.success).toBe(false);
    });
  });

  describe("2. Normalization & Canonicalization", () => {
    it("normalizes entitlement and critical keys order deterministically", () => {
      const unnormalized = validCommitments();
      unnormalized.entitlements.keys = ["sysdesign_mocks", "sysdesign_core", "mentor_feedback_weekly"];
      unnormalized.entitlements.criticalKeys = ["mentor_feedback_weekly"];

      const normalized = normalizeStructuredCommitments(unnormalized);
      expect(normalized.entitlements.keys).toEqual([
        "mentor_feedback_weekly",
        "sysdesign_core",
        "sysdesign_mocks",
      ]);
    });

    it("trims and lowercases keys during normalization", () => {
      const unnormalized = validCommitments();
      unnormalized.entitlements.keys = ["  sysdesign_core  ", "MENTOR_FEEDBACK_WEEKLY", "sysdesign_mocks"];
      unnormalized.entitlements.criticalKeys = [" Mentor_Feedback_Weekly "];

      const normalized = normalizeStructuredCommitments(unnormalized);
      expect(normalized.entitlements.keys).toEqual([
        "mentor_feedback_weekly",
        "sysdesign_core",
        "sysdesign_mocks",
      ]);
      expect(normalized.entitlements.criticalKeys).toEqual(["mentor_feedback_weekly"]);
    });
  });

  describe("3. Deterministic Content Fingerprinting (versionHash)", () => {
    it("generates identical SHA-256 fingerprint for identically valued objects regardless of key ordering", () => {
      const inputA: CanonicalOfferInput = {
        productId: "p_sysdesign",
        version: 1,
        price: 349900,
        currency: "INR",
        billingInterval: "monthly",
        duration: 180,
        refundWindowDays: 30,
        structuredCommitments: validCommitments(),
      };

      const inputB: CanonicalOfferInput = {
        productId: "p_sysdesign",
        version: 1,
        price: 349900,
        currency: "inr", // lowercase
        billingInterval: "MONTHLY", // uppercase
        duration: 180,
        refundWindowDays: 30,
        structuredCommitments: {
          ...validCommitments(),
          entitlements: {
            // Shuffled keys
            keys: ["mentor_feedback_weekly", "sysdesign_mocks", "sysdesign_core"],
            criticalKeys: ["mentor_feedback_weekly"],
          },
        },
      };

      const hashA = computeOfferVersionHash(inputA);
      const hashB = computeOfferVersionHash(inputB);

      expect(hashA).toHaveLength(64);
      expect(hashA).toBe(hashB);
    });

    it("produces a different fingerprint on any commercial field change", () => {
      const base: CanonicalOfferInput = {
        productId: "p_sysdesign",
        version: 1,
        price: 349900,
        currency: "INR",
        billingInterval: "monthly",
        duration: 180,
        refundWindowDays: 30,
        structuredCommitments: validCommitments(),
      };

      const baseHash = computeOfferVersionHash(base);

      // Price changed
      const priceChanged = computeOfferVersionHash({ ...base, price: 412882 });
      expect(priceChanged).not.toBe(baseHash);

      // Tier changed
      const tierChangedCommitments = validCommitments();
      tierChangedCommitments.support.tier = "community";
      const tierChanged = computeOfferVersionHash({
        ...base,
        structuredCommitments: tierChangedCommitments,
      });
      expect(tierChanged).not.toBe(baseHash);

      // Version changed
      const versionChanged = computeOfferVersionHash({ ...base, version: 2 });
      expect(versionChanged).not.toBe(baseHash);
    });
  });

  describe("4. Non-Authoritative Candidate Extraction", () => {
    it("extracts non-authoritative structured commitments candidate from merchant text", () => {
      const candidate = extractStructuredCommitmentCandidate({
        description: "Comprehensive system design mastery with weekly 1:1 mentor feedback and structured mock interviews.",
        supportTerms: "Dedicated senior engineer mentor assigned for 180 days with 24-hour turnaround.",
        semanticTerms: "Weekly 1:1 video mentor feedback.",
        entitlementKeys: ["system_design_course", "mock_interviews", "mentor_feedback"],
        refundWindowDays: 30,
      });

      expect(candidate.isConfirmedByMerchant).toBe(false);
      expect(candidate.commitments.support.tier).toBe("dedicated_engineer");
      expect(candidate.commitments.support.hasDedicatedHuman).toBe(true);
      expect(candidate.commitments.entitlements.keys).toContain("mentor_feedback");
    });
  });

  describe("5. Merchant Confirmation & Version Immutability Lifecycle", () => {
    function setupService(): { svc: MerchantOfferService; data: MerchantOfferData } {
      const data: MerchantOfferData = {
        merchants: [
          {
            id: "m_test",
            name: "Test Merchant",
            slug: "test-merchant",
            description: "Test",
            status: "ACTIVE",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        products: [
          {
            id: "p_test",
            merchantId: "m_test",
            name: "Test Product",
            slug: "test-product",
            description: "Test",
            category: "coaching",
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        offers: [
          {
            id: "o_test_v1",
            productId: "p_test",
            version: 1,
            name: "Test Offer v1",
            description: "Unconfirmed draft offer",
            price: 349900,
            currency: "INR",
            billingInterval: "monthly",
            duration: 180,
            entitlementKeys: ["mentor_feedback_weekly", "sysdesign_core"],
            refundWindowDays: 30,
            supportTerms: "Weekly 1:1 mentor feedback",
            semanticTerms: "1:1 mentor support",
            structuredCommitments: null,
            isConfirmedByMerchant: false,
            versionHash: null,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      const repo = new InMemoryMerchantOfferRepository(data);
      const svc = new MerchantOfferService(repo);
      return { svc, data };
    }

    it("confirms structured commitments and computes versionHash", async () => {
      const { svc } = setupService();

      const confirmed = await svc.confirmOfferCommitments("o_test_v1", validCommitments());

      expect(confirmed.isConfirmedByMerchant).toBe(true);
      expect(confirmed.versionHash).toBeDefined();
      expect(confirmed.versionHash).toHaveLength(64);
      expect(confirmed.structuredCommitments).toBeDefined();
      expect(confirmed.structuredCommitments?.support.tier).toBe("dedicated_mentor");
    });

    it("prevents editing an already confirmed offer version in place", async () => {
      const { svc } = setupService();

      // 1. Confirm v1
      await svc.confirmOfferCommitments("o_test_v1", validCommitments());

      // 2. Attempt to re-confirm/mutate v1 in place
      const mutatedCommitments = validCommitments();
      mutatedCommitments.support.tier = "community";

      await expect(
        svc.confirmOfferCommitments("o_test_v1", mutatedCommitments),
      ).rejects.toThrow(OfferAlreadyConfirmedError);
    });

    it("creates an immutable v2 when commercial terms change", async () => {
      const { svc, data } = setupService();

      // 1. Confirm v1
      const v1 = await svc.confirmOfferCommitments("o_test_v1", validCommitments());
      const v1Hash = v1.versionHash;

      // 2. Create v2 with modified price and degraded support
      const v2Commitments = validCommitments();
      v2Commitments.support.tier = "community";
      v2Commitments.support.hasDedicatedHuman = false;

      const v2 = await svc.createOfferVersion("p_test", {
        name: "Test Offer v2 (Degraded)",
        description: "Community support",
        price: 412882, // +18%
        duration: 180,
        entitlementKeys: ["sysdesign_core"],
        refundWindowDays: 30,
        supportTerms: "Discord only",
        semanticTerms: "Community peer help",
        structuredCommitments: v2Commitments,
        confirmImmediately: true,
      });

      expect(v2.version).toBe(2);
      expect(v2.isConfirmedByMerchant).toBe(true);
      expect(v2.versionHash).toBeDefined();
      expect(v2.versionHash).not.toBe(v1Hash);

      // Verify v1 in repository remained completely untouched
      const v1After = data.offers.find((o) => o.id === "o_test_v1")!;
      expect(v1After.version).toBe(1);
      expect(v1After.versionHash).toBe(v1Hash);
      expect(v1After.structuredCommitments?.support.tier).toBe("dedicated_mentor");
    });

    it("throws OfferNotFoundError for non-existent offer ID", async () => {
      const { svc } = setupService();
      await expect(
        svc.confirmOfferCommitments("o_non_existent", validCommitments()),
      ).rejects.toThrow(OfferNotFoundError);
    });
  });
});
