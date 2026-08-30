import { NextResponse } from "next/server";
import { z } from "zod";
import { getMerchantOfferService } from "@/lib/merchant/service";
import { getBuyerTransactionService } from "@/lib/agent/buyer-transaction";
import { MandateError } from "@/lib/mandate/service";
import { CanonicalBuyerIntentSchema } from "@/lib/intent/schema";

const HandoffRequestSchema = z.object({
  offerId: z.string().min(1).max(100),
  expectedVersion: z.number().int().positive(),
  expectedVersionHash: z.string().min(1).max(200),
  canonicalIntent: CanonicalBuyerIntentSchema.optional(),
  buyerContext: z.object({
    userId: z.string().optional().default("user_external_buyer_demo"),
    spendingLimitPaise: z.number().int().positive(),
    currency: z.string().default("INR"),
    billingInterval: z.string().default("monthly"),
    customerEmail: z.string().email().optional(),
    customerContact: z.string().optional(),
  }),
  clientClaimedPricePaise: z.number().int().optional(), // Ingested to prove server ignores client claims
  authorizePurchase: z.boolean().default(false),
  idempotencyKey: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = HandoffRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid external purchase handoff payload.",
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 },
      );
    }

    const {
      offerId,
      expectedVersion,
      expectedVersionHash,
      canonicalIntent,
      buyerContext,
      clientClaimedPricePaise,
      authorizePurchase,
      idempotencyKey,
    } = parsed.data;

    const merchantService = getMerchantOfferService();

    // 1. Authoritative Offer Re-resolution
    const authoritativeOffer = await merchantService.getOffer(offerId);
    if (!authoritativeOffer || authoritativeOffer.availability !== "ACTIVE") {
      return NextResponse.json(
        { error: `Authoritative offer '${offerId}' is not found or is no longer active.` },
        { status: 404 },
      );
    }

    // 2. Merchant Confirmation Check
    if (!authoritativeOffer.isConfirmedByMerchant) {
      return NextResponse.json(
        { error: "This offer has unconfirmed merchant terms and cannot be purchased." },
        { status: 422 },
      );
    }

    // 3. Stale Version Defense (Concurrence / Version Lock)
    const allProductOffers = (await merchantService.listOffers()).filter(
      (o) => o.product.id === authoritativeOffer.product.id,
    );
    const latestProductVersion = allProductOffers.reduce(
      (max, o) => Math.max(max, o.version),
      authoritativeOffer.version,
    );

    if (
      latestProductVersion > expectedVersion ||
      authoritativeOffer.version !== expectedVersion
    ) {
      return NextResponse.json(
        {
          error: `Stale offer version detected: Offer is now at v${latestProductVersion}, but client submitted v${expectedVersion}.`,
          code: "STALE_VERSION",
          currentVersion: latestProductVersion,
          expectedVersion,
        },
        { status: 409 },
      );
    }

    if (
      authoritativeOffer.versionHash &&
      authoritativeOffer.versionHash !== expectedVersionHash
    ) {
      return NextResponse.json(
        {
          error: "Offer content hash mismatch. The commercial terms have changed since the external agent evaluated the contract.",
          code: "STALE_HASH",
        },
        { status: 409 },
      );
    }

    // 4. Strict Authoritative Price Enforcement (Client Price Tampering Attack Neutralization)
    const authoritativePricePaise = authoritativeOffer.price;
    const priceTamperingAttempted =
      clientClaimedPricePaise !== undefined &&
      clientClaimedPricePaise !== authoritativePricePaise;

    // 5. Hard Spending Limit Verification
    if (authoritativePricePaise > buyerContext.spendingLimitPaise) {
      return NextResponse.json(
        {
          error: `Authoritative price of ₹${(authoritativePricePaise / 100).toLocaleString("en-IN")} exceeds the buyer's authorized spending limit of ₹${(buyerContext.spendingLimitPaise / 100).toLocaleString("en-IN")}.`,
          code: "SPENDING_LIMIT_EXCEEDED",
          authoritativePricePaise,
          spendingLimitPaise: buyerContext.spendingLimitPaise,
        },
        { status: 422 },
      );
    }

    // 6. Support Commitment Verification
    const requiresHuman = Boolean(
      canonicalIntent?.supportPreference?.hasDedicatedHuman ||
      canonicalIntent?.mustHave?.includes("human_mentor"),
    );
    if (
      requiresHuman &&
      !authoritativeOffer.structuredCommitments?.support?.hasDedicatedHuman
    ) {
      return NextResponse.json(
        {
          error: "Buyer requires dedicated human mentor, but authoritative structured commitments lack this guarantee.",
          code: "UNMET_SUPPORT_REQUIREMENT",
        },
        { status: 422 },
      );
    }

    // 7. Server Revalidation Summary
    const serverRevalidation = {
      status: "VERIFIED",
      authoritativeOfferId: authoritativeOffer.id,
      authoritativeVersion: authoritativeOffer.version,
      authoritativeVersionHash: authoritativeOffer.versionHash,
      authoritativePricePaise,
      clientClaimedPricePaise: clientClaimedPricePaise ?? null,
      priceTamperingDetected: priceTamperingAttempted,
      priceTamperingHandled: priceTamperingAttempted
        ? "Client-supplied price was discarded; authoritative price enforced."
        : "None",
      spendingLimitCompliance: true,
      dedicatedHumanVerified:
        authoritativeOffer.structuredCommitments?.support?.hasDedicatedHuman ?? false,
    };

    // 8. If NOT authorized yet, return authoritative pre-authorization preview
    if (!authorizePurchase) {
      return NextResponse.json(
        {
          status: "READY_FOR_AUTHORIZATION",
          message: "Authoritative terms verified. Explicit buyer authorization required to transact.",
          serverRevalidation,
          preview: {
            offerName: authoritativeOffer.name,
            productName: authoritativeOffer.product.name,
            priceFormatted: `₹${(authoritativePricePaise / 100).toLocaleString("en-IN")} / ${authoritativeOffer.billingInterval}`,
            currency: authoritativeOffer.currency,
            billingInterval: authoritativeOffer.billingInterval,
            durationDays: authoritativeOffer.duration,
            supportTier: authoritativeOffer.structuredCommitments?.support?.tier || "standard",
            hasDedicatedHuman:
              authoritativeOffer.structuredCommitments?.support?.hasDedicatedHuman ?? false,
            slaHours: authoritativeOffer.structuredCommitments?.support?.slaHours ?? null,
            refundWindowDays: authoritativeOffer.refundPolicy.windowDays,
          },
        },
        { status: 200 },
      );
    }

    // 9. Explicit Buyer Authorization: Delegate to BuyerTransactionService (CommerceMutationExecutor boundary)
    const transactionService = getBuyerTransactionService();
    const receipt = await transactionService.authorizeAndTransact({
      userId: buyerContext.userId,
      offerId: authoritativeOffer.id,
      expectedVersion: authoritativeOffer.version,
      expectedVersionHash: authoritativeOffer.versionHash,
      spendingLimitPaise: buyerContext.spendingLimitPaise,
      customerEmail: buyerContext.customerEmail,
      customerContact: buyerContext.customerContact,
      idempotencyKey,
    });

    return NextResponse.json(
      {
        status: "TRANSACTION_AUTHORIZED_AND_EXECUTED",
        message: "Purchase successfully authorized and provisioned through CommerceMutationExecutor.",
        serverRevalidation,
        receipt,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof MandateError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const msg =
      error instanceof Error ? error.message : "Internal error processing purchase handoff.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
