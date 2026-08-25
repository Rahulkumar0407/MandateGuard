import { describe, it, expect } from "vitest";
import {
  CompatibilityService,
  CompatibilityError,
} from "@/lib/compatibility/service";
import {
  EnvelopeService,
  InMemoryEnvelopeRepository,
} from "@/lib/envelope/service";
import {
  MerchantOfferService,
  InMemoryMerchantOfferRepository,
} from "@/lib/merchant/service";
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

function setup() {
  const data: MerchantOfferData = {
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
        description: "1:1 mentor with mock interviews",
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

  const merchantRepo = new InMemoryMerchantOfferRepository(data);
  const merchantService = new MerchantOfferService(merchantRepo);
  const envelopeRepo = new InMemoryEnvelopeRepository();
  const envelopeService = new EnvelopeService(envelopeRepo, merchantService);
  const compatibilityService = new CompatibilityService(
    envelopeService,
    merchantService,
  );

  return {
    data,
    merchantRepo,
    merchantService,
    envelopeRepo,
    envelopeService,
    compatibilityService,
  };
}

describe("M9 Phase 3: Compatibility Service", () => {
  describe("1. Envelope Compatibility Evaluation", () => {
    it("evaluates a compatible proposed offer version against an active envelope", async () => {
      const { envelopeService, compatibilityService } = setup();

      const envelope = await envelopeService.createAuthorizationEnvelope({
        userId: "u_alice",
        offerId: "o_sysdesign_v1",
      });

      const proposed = {
        productId: "p_sysdesign",
        version: 2,
        name: "System Design Mentor Tier v2",
        description: "1:1 mentor with mock interviews and bonus cheatsheet",
        price: 349900,
        currency: "INR",
        billingInterval: "monthly",
        duration: 180,
        entitlementKeys: [
          "sysdesign_core",
          "sysdesign_mocks",
          "mentor_weekly",
          "bonus_cheatsheet",
        ],
        refundWindowDays: 30,
        supportTerms: "Dedicated mentor 24-hour turnaround",
        semanticTerms: "Weekly 1:1 video review",
        structuredCommitments: {
          ...sampleCommitments(),
          entitlements: {
            keys: [
              "sysdesign_core",
              "sysdesign_mocks",
              "mentor_weekly",
              "bonus_cheatsheet",
            ],
            criticalKeys: ["mentor_weekly"],
          },
        },
      };

      const result =
        await compatibilityService.evaluateEnvelopeCompatibility(
          envelope.id,
          proposed,
        );

      expect(result.status).toBe("COMPATIBLE");
      expect(result.envelopeId).toBe(envelope.id);
      expect(result.authorizedOfferVersionId).toBe("o_sysdesign_v1");
      expect(result.proposedOfferVersion).toBe(2);
      expect(result.findings.some((f) => f.code === "ENTITLEMENTS_ADDED")).toBe(
        true,
      );
    });

    it("evaluates a breaking proposed offer (price ceiling breach + lost dedicated human)", async () => {
      const { envelopeService, compatibilityService } = setup();

      const envelope = await envelopeService.createAuthorizationEnvelope({
        userId: "u_alice",
        offerId: "o_sysdesign_v1",
        financialConstraints: { maxPricePaise: 380000 },
      });

      const degradedCommitments = sampleCommitments();
      degradedCommitments.support.tier = "community";
      degradedCommitments.support.hasDedicatedHuman = false;
      degradedCommitments.support.oneOnOneSessionsPerMonth = 0;

      const proposed = {
        productId: "p_sysdesign",
        version: 2,
        name: "System Design Community v2",
        description: "Community tier",
        price: 412882, // +18%, exceeds ₹3800 ceiling
        currency: "INR",
        billingInterval: "monthly",
        duration: 180,
        entitlementKeys: ["sysdesign_core"],
        refundWindowDays: 30,
        supportTerms: "Discord only",
        semanticTerms: "Community peer support",
        structuredCommitments: degradedCommitments,
      };

      const result =
        await compatibilityService.evaluateEnvelopeCompatibility(
          envelope.id,
          proposed,
        );

      expect(result.status).toBe("BREAKING");
      expect(result.findings.some((f) => f.code === "PRICE_CEILING_BREACH")).toBe(
        true,
      );
      expect(result.findings.some((f) => f.code === "DEDICATED_HUMAN_LOST")).toBe(
        true,
      );
    });
  });

  describe("2. Baseline Pinning vs Intermediary Versions", () => {
    it("compares proposed v3 against frozen v1 baseline (not intermediate v2)", async () => {
      const { envelopeService, merchantService, compatibilityService } = setup();

      // 1. Customer A authorizes v1 (with max ceiling of ₹4000 and 15% max increase)
      const envA = await envelopeService.createAuthorizationEnvelope({
        userId: "u_customer_a",
        offerId: "o_sysdesign_v1",
        financialConstraints: {
          maxPricePaise: 400000,
          maxPriceIncreasePercent: 15,
        },
      });

      // 2. Merchant creates v2 (price increased to ₹3600, within 5% tolerance)
      await merchantService.createOfferVersion("p_sysdesign", {
        name: "System Design v2",
        description: "v2",
        price: 360000, // +2.8% from v1
        duration: 180,
        entitlementKeys: ["sysdesign_core", "sysdesign_mocks", "mentor_weekly"],
        refundWindowDays: 30,
        supportTerms: "Mentor support",
        semanticTerms: "1:1 review",
        structuredCommitments: sampleCommitments(),
        confirmImmediately: true,
      });

      // 3. Merchant creates v3 (price increased to ₹3750, +7.1% from v1, but only +4.1% from v2)
      const v3 = await merchantService.createOfferVersion("p_sysdesign", {
        name: "System Design v3",
        description: "v3",
        price: 375000,
        duration: 180,
        entitlementKeys: ["sysdesign_core", "sysdesign_mocks", "mentor_weekly"],
        refundWindowDays: 30,
        supportTerms: "Mentor support",
        semanticTerms: "1:1 review",
        structuredCommitments: sampleCommitments(),
        confirmImmediately: true,
      });

      // 4. Evaluate v3 against Customer A's envelope:
      // Against v1 (₹3499): +7.1% -> exceeds 5% tolerance -> REVIEW
      // (If it had erroneously used v2 as baseline, ₹3750 vs ₹3600 is +4.1% which would have been wrongly COMPATIBLE)
      const result =
        await compatibilityService.evaluateEnvelopeCompatibility(
          envA.id,
          v3,
        );

      expect(result.status).toBe("REVIEW");
      expect(
        result.findings.some(
          (f) => f.code === "PRICE_INCREASE_EXCEEDS_TOLERANCE",
        ),
      ).toBe(true);
    });
  });

  describe("3. Error Handling", () => {
    it("throws 404 for non-existent envelope id", async () => {
      const { compatibilityService } = setup();

      await expect(
        compatibilityService.evaluateEnvelopeCompatibility(
          "env_non_existent",
          {
            productId: "p_sysdesign",
            version: 2,
            name: "Test",
            description: "Test",
            price: 349900,
            currency: "INR",
            billingInterval: "monthly",
            duration: 180,
            entitlementKeys: [],
            refundWindowDays: 30,
            supportTerms: "",
            semanticTerms: "",
          },
        ),
      ).rejects.toThrow(CompatibilityError);
    });
  });
});
