import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildInterviewForgeData } from "@/lib/merchant/seed-data";
import {
  computeOfferVersionHash,
  extractStructuredCommitmentCandidate,
} from "@/lib/merchant/structured-commitments";

// POST /api/demo/seed
// Ensures the demo merchant, products, and baseline offers exist in the database.
export async function POST() {
  try {
    const seedData = buildInterviewForgeData();

    // 1. Merchant
    await prisma.merchant.updateMany({
      where: { id: { not: "m_interviewforge" } },
      data: { status: "INACTIVE" },
    });

    for (const m of seedData.merchants) {
      await prisma.merchant.upsert({
        where: { id: m.id },
        update: {
          name: m.name,
          slug: m.slug,
          description: m.description,
          status: m.status,
        },
        create: {
          id: m.id,
          name: m.name,
          slug: m.slug,
          description: m.description,
          status: m.status,
        },
      });
    }

    // 2. Demo Users
    await prisma.user.upsert({
      where: { id: "buyer_demo_user" },
      update: { email: "buyer-demo@mandateguard.test" },
      create: { id: "buyer_demo_user", email: "buyer-demo@mandateguard.test" },
    });
    await prisma.user.upsert({
      where: { id: "u_demo_buyer" },
      update: { email: "demo-buyer@mandateguard.test" },
      create: { id: "u_demo_buyer", email: "demo-buyer@mandateguard.test" },
    });

    // 3. Products
    for (const p of seedData.products) {
      await prisma.product.upsert({
        where: { id: p.id },
        update: {
          name: p.name,
          slug: p.slug,
          description: p.description,
          category: p.category,
          active: p.active,
        },
        create: {
          id: p.id,
          merchantId: p.merchantId,
          name: p.name,
          slug: p.slug,
          description: p.description,
          category: p.category,
          active: p.active,
        },
      });
    }

    // Deactivate rogue offer versions > 1
    await prisma.offer.updateMany({
      where: { version: { gt: 1 } },
      data: { active: false },
    });

    // 4. Baseline Offers (v1 active)
    for (const o of seedData.offers) {
      const candidate = extractStructuredCommitmentCandidate({
        description: o.description,
        supportTerms: o.supportTerms,
        semanticTerms: o.semanticTerms,
        entitlementKeys: o.entitlementKeys,
        refundWindowDays: o.refundWindowDays,
      });

      const versionHash = computeOfferVersionHash({
        productId: o.productId,
        version: o.version,
        price: o.price,
        currency: o.currency,
        billingInterval: o.billingInterval,
        duration: o.duration,
        refundWindowDays: o.refundWindowDays,
        structuredCommitments: candidate.commitments,
      });

      await prisma.offer.upsert({
        where: {
          productId_version: {
            productId: o.productId,
            version: o.version,
          },
        },
        update: {
          name: o.name,
          description: o.description,
          price: o.price,
          currency: o.currency,
          billingInterval: o.billingInterval,
          duration: o.duration,
          entitlementKeys: o.entitlementKeys,
          refundWindowDays: o.refundWindowDays,
          supportTerms: o.supportTerms,
          semanticTerms: o.semanticTerms,
          structuredCommitments: candidate.commitments as object,
          isConfirmedByMerchant: true,
          versionHash,
          active: o.version === 1 ? true : o.active,
        },
        create: {
          id: o.id,
          productId: o.productId,
          version: o.version,
          name: o.name,
          description: o.description,
          price: o.price,
          currency: o.currency,
          billingInterval: o.billingInterval,
          duration: o.duration,
          entitlementKeys: o.entitlementKeys,
          refundWindowDays: o.refundWindowDays,
          supportTerms: o.supportTerms,
          semanticTerms: o.semanticTerms,
          structuredCommitments: candidate.commitments as object,
          isConfirmedByMerchant: true,
          versionHash,
          active: o.version === 1 ? true : o.active,
        },
      });
    }

    // 5. Demo Authorization Envelopes for demo subscribers
    const baselineOffer = await prisma.offer.findUnique({
      where: { id: "o_sysdesign_v1" },
    });
    if (baselineOffer && baselineOffer.structuredCommitments) {
      const demoUsers = [
        {
          id: "u_demo_buyer",
          subId: "sub_demo_active_01",
          mandateId: "mandate_demo_01",
          maxPrice: 400000,
          tolerance: 5,
        },
        {
          id: "u_subscriber_alice",
          subId: "sub_demo_active_02",
          mandateId: "mandate_demo_02",
          maxPrice: 450000,
          tolerance: 10,
        },
        {
          id: "u_subscriber_bob",
          subId: "sub_demo_active_03",
          mandateId: "mandate_demo_03",
          maxPrice: 360000,
          tolerance: 5,
        },
      ];

      for (const du of demoUsers) {
        await prisma.user.upsert({
          where: { id: du.id },
          update: { email: `${du.id}@mandateguard.test` },
          create: { id: du.id, email: `${du.id}@mandateguard.test` },
        });

        const mandate = await prisma.mandate.upsert({
          where: { id: du.mandateId },
          update: { status: "AUTHORIZED" },
          create: {
            id: du.mandateId,
            userId: du.id,
            merchantId: "m_interviewforge",
            offerId: "o_sysdesign_v1",
            razorpaySubscriptionId: du.subId,
            status: "AUTHORIZED",
          },
        });

        const baselineCommitments = {
          offerId: baselineOffer.id,
          offerVersion: baselineOffer.version,
          offerName: baselineOffer.name,
          description: baselineOffer.description,
          price: baselineOffer.price,
          currency: baselineOffer.currency,
          billingInterval: baselineOffer.billingInterval,
          duration: baselineOffer.duration,
          entitlementKeys: baselineOffer.entitlementKeys,
          refundWindowDays: baselineOffer.refundWindowDays,
          supportTerms: baselineOffer.supportTerms,
          semanticTerms: baselineOffer.semanticTerms,
          structuredCommitments: baselineOffer.structuredCommitments as object,
        };

        const financialConstraints = {
          maxPricePaise: du.maxPrice,
          allowedCurrencies: ["INR"],
          maxPriceIncreasePercent: 15,
          allowedBillingIntervals: ["monthly"],
        };

        const agentPermissions = {
          canAutoApproveMinorChanges: true,
          canAutoPauseOnBreach: true,
          canApproveRefundRequest: false,
          canMigrateToNewVersion: false,
        };

        const tolerancePolicy = {
          priceIncreasePercentTolerance: du.tolerance,
          allowedTierDowngrades: [],
          allowedRemovedEntitlements: [],
          refundWindowReductionDaysTolerance: 0,
        };

        await prisma.authorizationEnvelope.upsert({
          where: { mandateId: mandate.id },
          update: {
            status: "ACTIVE",
            authorizedOfferVersionId: baselineOffer.id,
            authorizedOfferHash: baselineOffer.versionHash ?? "h1".repeat(32),
            baselineCommitments,
            financialConstraints,
            agentPermissions,
            tolerancePolicy,
            authorizationPolicyHash: "pol_demo_hash_01",
          },
          create: {
            id: `env_${du.subId}`,
            userId: du.id,
            merchantId: "m_interviewforge",
            subscriptionId: du.subId,
            mandateId: mandate.id,
            authorizedOfferVersionId: baselineOffer.id,
            authorizedOfferHash: baselineOffer.versionHash ?? "h1".repeat(32),
            baselineCommitments,
            financialConstraints,
            agentPermissions,
            tolerancePolicy,
            authorizationPolicyHash: "pol_demo_hash_01",
            status: "ACTIVE",
          },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Demo catalog & authorization envelopes seeded successfully." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json(
      { error: "Failed to seed demo catalog.", details: message },
      { status: 500 },
    );
  }
}
