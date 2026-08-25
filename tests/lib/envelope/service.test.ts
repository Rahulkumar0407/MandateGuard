import { describe, it, expect } from "vitest";
import {
  EnvelopeService,
  InMemoryEnvelopeRepository,
  EnvelopeError,
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
        description: "Fintech & system design prep",
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
        name: "System Design Mentor Tier",
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
        versionHash: "a".repeat(64),
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

  return {
    data,
    merchantRepo,
    merchantService,
    envelopeRepo,
    envelopeService,
  };
}

describe("M9 Phase 2: AuthorizationEnvelope Service", () => {
  describe("1. Envelope Creation & Baseline Pinning", () => {
    it("creates an envelope pinned to exact OfferVersion and captures versionHash", async () => {
      const { envelopeService } = setup();

      const envelope = await envelopeService.createAuthorizationEnvelope({
        userId: "u_alice",
        offerId: "o_sysdesign_v1",
      });

      expect(envelope.id).toBeDefined();
      expect(envelope.userId).toBe("u_alice");
      expect(envelope.merchantId).toBe("m_forge");
      expect(envelope.authorizedOfferVersionId).toBe("o_sysdesign_v1");
      expect(envelope.authorizedOfferHash).toBe("a".repeat(64));
      expect(envelope.baselineCommitments.price).toBe(349900);
      expect(envelope.baselineCommitments.structuredCommitments.support.tier).toBe(
        "dedicated_mentor",
      );
      expect(envelope.status).toBe("ACTIVE");
      expect(envelope.authorizationPolicyHash).toHaveLength(64);
    });

    it("freezes default financial constraints and agent permissions if not explicitly provided", async () => {
      const { envelopeService } = setup();

      const envelope = await envelopeService.createAuthorizationEnvelope({
        userId: "u_alice",
        offerId: "o_sysdesign_v1",
      });

      expect(envelope.financialConstraints.maxPricePaise).toBe(349900);
      expect(envelope.financialConstraints.allowedCurrencies).toEqual(["INR"]);
      expect(envelope.financialConstraints.maxPriceIncreasePercent).toBe(5);
      expect(envelope.agentPermissions.canAutoApproveMinorChanges).toBe(true);
      expect(envelope.agentPermissions.canAutoPauseOnBreach).toBe(true);
      expect(envelope.tolerancePolicy.priceIncreasePercentTolerance).toBe(5);
    });

    it("respects custom financial constraints, agent permissions, and tolerance policy", async () => {
      const { envelopeService } = setup();

      const envelope = await envelopeService.createAuthorizationEnvelope({
        userId: "u_alice",
        offerId: "o_sysdesign_v1",
        financialConstraints: {
          maxPricePaise: 400000,
          maxPriceIncreasePercent: 10,
        },
        agentPermissions: {
          canMigrateToNewVersion: true,
        },
        tolerancePolicy: {
          priceIncreasePercentTolerance: 10,
          allowedTierDowngrades: ["priority_email"],
        },
      });

      expect(envelope.financialConstraints.maxPricePaise).toBe(400000);
      expect(envelope.financialConstraints.maxPriceIncreasePercent).toBe(10);
      expect(envelope.agentPermissions.canMigrateToNewVersion).toBe(true);
      expect(envelope.tolerancePolicy.allowedTierDowngrades).toEqual([
        "priority_email",
      ]);
    });
  });

  describe("2. Baseline Pinning vs Merchant Offer Evolution (Core Invariant)", () => {
    it("keeps Customer A's envelope pinned to v1 when merchant publishes v2", async () => {
      const { envelopeService, merchantService } = setup();

      // 1. Customer A authorizes v1
      const envA = await envelopeService.createAuthorizationEnvelope({
        userId: "u_customer_a",
        offerId: "o_sysdesign_v1",
      });
      expect(envA.authorizedOfferVersionId).toBe("o_sysdesign_v1");
      expect(envA.baselineCommitments.price).toBe(349900);
      expect(envA.baselineCommitments.structuredCommitments.support.tier).toBe(
        "dedicated_mentor",
      );

      // 2. Merchant creates Offer v2 (+18% price, degraded support)
      const v2Commitments = sampleCommitments();
      v2Commitments.support.tier = "community";
      v2Commitments.support.hasDedicatedHuman = false;

      const offerV2 = await merchantService.createOfferVersion("p_sysdesign", {
        name: "System Design Community Tier",
        description: "Community discord support",
        price: 412882,
        duration: 180,
        entitlementKeys: ["sysdesign_core"],
        refundWindowDays: 30,
        supportTerms: "Discord forum",
        semanticTerms: "Community peer support",
        structuredCommitments: v2Commitments,
        confirmImmediately: true,
      });

      expect(offerV2.version).toBe(2);

      // 3. Customer B authorizes v2
      const envB = await envelopeService.createAuthorizationEnvelope({
        userId: "u_customer_b",
        offerId: offerV2.id,
      });
      expect(envB.authorizedOfferVersionId).toBe(offerV2.id);
      expect(envB.baselineCommitments.price).toBe(412882);
      expect(envB.baselineCommitments.structuredCommitments.support.tier).toBe(
        "community",
      );

      // 4. Retrieve Customer A's envelope: must remain pinned to v1
      const retrievedA = await envelopeService.getEnvelope(envA.id);
      expect(retrievedA).not.toBeNull();
      expect(retrievedA!.authorizedOfferVersionId).toBe("o_sysdesign_v1");
      expect(retrievedA!.baselineCommitments.price).toBe(349900);
      expect(
        retrievedA!.baselineCommitments.structuredCommitments.support.tier,
      ).toBe("dedicated_mentor");
      expect(retrievedA!.authorizedOfferHash).toBe(envA.authorizedOfferHash);
    });
  });

  describe("3. Status Lifecycle & Querying", () => {
    it("updates envelope status (ACTIVE -> SUSPENDED -> REVOKED)", async () => {
      const { envelopeService } = setup();

      const env = await envelopeService.createAuthorizationEnvelope({
        userId: "u_alice",
        offerId: "o_sysdesign_v1",
      });
      expect(env.status).toBe("ACTIVE");

      const suspended = await envelopeService.updateEnvelopeStatus(
        env.id,
        "SUSPENDED",
      );
      expect(suspended.status).toBe("SUSPENDED");

      const revoked = await envelopeService.updateEnvelopeStatus(
        env.id,
        "REVOKED",
      );
      expect(revoked.status).toBe("REVOKED");
    });

    it("lists envelopes by userId", async () => {
      const { envelopeService } = setup();

      await envelopeService.createAuthorizationEnvelope({
        userId: "u_user1",
        offerId: "o_sysdesign_v1",
      });
      await envelopeService.createAuthorizationEnvelope({
        userId: "u_user1",
        offerId: "o_sysdesign_v1",
      });
      await envelopeService.createAuthorizationEnvelope({
        userId: "u_user2",
        offerId: "o_sysdesign_v1",
      });

      const user1Envelopes =
        await envelopeService.listEnvelopesByUserId("u_user1");
      expect(user1Envelopes).toHaveLength(2);

      const user2Envelopes =
        await envelopeService.listEnvelopesByUserId("u_user2");
      expect(user2Envelopes).toHaveLength(1);
    });
  });

  describe("4. Error Handling & Server Authority", () => {
    it("rejects non-existent offer with 404", async () => {
      const { envelopeService } = setup();

      await expect(
        envelopeService.createAuthorizationEnvelope({
          userId: "u_alice",
          offerId: "o_non_existent",
        }),
      ).rejects.toThrow(EnvelopeError);
    });
  });
});
