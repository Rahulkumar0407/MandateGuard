import { getMerchantOfferService, MerchantOfferService } from "@/lib/merchant/service";
import { MandateError } from "@/lib/mandate/service";
import {
  getCommerceMutationExecutor,
  CommerceMutationExecutor,
  type MutationResult,
} from "@/lib/actions/commerce-executor";
import type { CanonicalBuyerIntent } from "@/lib/intent/types";
import type { OfferDetailDTO } from "@/lib/merchant/types";

export interface BuyerPurchasePreview {
  offerId: string;
  offerVersion: number;
  versionHash?: string | null;
  productName: string;
  offerName: string;
  merchantName: string;
  pricePaise: number;
  priceFormatted: string;
  currency: string;
  billingInterval: string;
  durationDays: number;
  verifiedCommitments: string[];
  aiSpendingLimit?: {
    amountPaise: number;
    amountFormatted: string;
    isHardCeiling: boolean;
  };
  spendingLimitCompliance: boolean;
  protectionTerms: string[];
}

export interface AuthorizeAndTransactInput {
  userId: string;
  offerId: string;
  expectedVersion?: number;
  expectedVersionHash?: string | null;
  spendingLimitPaise?: number;
  customerEmail?: string;
  customerContact?: string;
  idempotencyKey?: string;
}

export interface BuyerTransactionReceipt {
  mandateId: string;
  offerId: string;
  offerName: string;
  status: string;
  razorpaySubscriptionId: string | null;
  shortUrl: string | null;
  snapshot: Record<string, unknown>;
  guardrails: string[];
  authorizedAt: Date;
}

/**
 * M10-B6 — Buyer Authorization Preview & Transaction Service
 *
 * Implements the server-authoritative preview and transaction boundary:
 * 1. Generates purchase preview with verified commitments and spending limit compliance.
 * 2. Enforces stale-offer protection against mid-transaction merchant modifications.
 * 3. Delegates all financial mutations exclusively to CommerceMutationExecutor.
 *
 * Invariant:
 * BuyerTransactionService NEVER invokes Razorpay provider mutations directly.
 * All mutations cross:
 * BuyerTransactionService -> CommerceMutationExecutor -> RazorpayGateway -> Razorpay
 */
export class BuyerTransactionService {
  private merchantService: MerchantOfferService;
  private mutationExecutor: CommerceMutationExecutor;

  constructor(
    merchantService?: MerchantOfferService,
    mutationExecutor?: CommerceMutationExecutor,
  ) {
    this.merchantService = merchantService || getMerchantOfferService();
    this.mutationExecutor = mutationExecutor || getCommerceMutationExecutor();
  }

  /**
   * Generates an authoritative purchase preview for an offer before authorization.
   */
  async getPurchasePreview(
    offerId: string,
    intent?: CanonicalBuyerIntent,
  ): Promise<BuyerPurchasePreview> {
    const offer = await this.merchantService.getOffer(offerId);
    if (!offer || offer.availability !== "ACTIVE") {
      throw new MandateError("Offer not found or not active.", 404);
    }

    const commitments = this.extractVerifiedCommitments(offer);

    let aiSpendingLimit: BuyerPurchasePreview["aiSpendingLimit"] = undefined;
    let spendingLimitCompliance = true;

    if (intent?.budget) {
      const budget = intent.budget;
      const targetPaise = budget.amountPaise;
      const isHard = budget.type === "HARD";
      const ceilingPaise =
        isHard ? targetPaise : budget.maxStretchPaise || Math.round(targetPaise * 1.25);

      spendingLimitCompliance = offer.price <= ceilingPaise;
      aiSpendingLimit = {
        amountPaise: ceilingPaise,
        amountFormatted: `₹${(ceilingPaise / 100).toLocaleString("en-IN")}`,
        isHardCeiling: isHard,
      };
    }

    const priceFormatted = `₹${(offer.price / 100).toLocaleString("en-IN")} / ${offer.billingInterval}`;

    const protectionTerms = [
      "Autonomous pause if merchant increases price by 15% or more",
      "Autonomous review if support drops from dedicated human mentor to automated bot",
      "Immutable snapshot guarantee: baseline terms frozen for lifetime of authorization",
    ];

    return {
      offerId: offer.id,
      offerVersion: offer.version,
      versionHash: offer.versionHash,
      productName: offer.product.name,
      offerName: offer.name,
      merchantName: "InterviewForge", // Authoritative merchant profile
      pricePaise: offer.price,
      priceFormatted,
      currency: offer.currency,
      billingInterval: offer.billingInterval,
      durationDays: offer.duration,
      verifiedCommitments: commitments,
      aiSpendingLimit,
      spendingLimitCompliance,
      protectionTerms,
    };
  }

  /**
   * Explicitly authorizes the purchase and delegates mutation to CommerceMutationExecutor.
   */
  async authorizeAndTransact(
    input: AuthorizeAndTransactInput,
  ): Promise<BuyerTransactionReceipt> {
    // 1. Authoritative Offer Verification
    const offer = await this.merchantService.getOffer(input.offerId);
    if (!offer || offer.availability !== "ACTIVE") {
      throw new MandateError("Offer not found or not active.", 404);
    }

    // 2. Delegate Provider Mutation to CommerceMutationExecutor
    const result: MutationResult = await this.mutationExecutor.execute({
      idempotencyKey: input.idempotencyKey,
      mutation: {
        type: "PROVISION_SUBSCRIPTION",
        data: {
          offer,
          userId: input.userId,
          expectedVersion: input.expectedVersion,
          expectedVersionHash: input.expectedVersionHash,
          spendingLimitPaise: input.spendingLimitPaise,
          customerEmail: input.customerEmail,
          customerContact: input.customerContact,
        },
      },
      context: {
        source: "ai_buyer",
        callerId: "BuyerTransactionService",
      },
    });

    const guardrails = [
      "Autonomous pause if price increased >= 15%",
      "Autonomous review if dedicated human mentor support is degraded to automated bot",
      "Immutable snapshot protection active",
    ];

    return {
      mandateId: result.mandateId || `mnd_${Date.now()}`,
      offerId: offer.id,
      offerName: offer.name,
      status: "AUTHORIZED",
      razorpaySubscriptionId: result.providerSubscriptionId || null,
      shortUrl: result.shortUrl ?? null,
      snapshot: result.snapshot || {
        offerVersion: offer.version,
        productName: offer.product.name,
        offerName: offer.name,
        price: offer.price,
        currency: offer.currency,
        billingInterval: offer.billingInterval,
        duration: offer.duration,
        entitlementKeys: offer.entitlementKeys,
        refundWindowDays: offer.refundPolicy.windowDays,
      },
      guardrails,
      authorizedAt: new Date(result.executedAt),
    };
  }

  private extractVerifiedCommitments(offer: OfferDetailDTO): string[] {
    const commitments: string[] = [];

    if (offer.structuredCommitments?.support?.hasDedicatedHuman) {
      const sessions =
        offer.structuredCommitments.support.oneOnOneSessionsPerMonth ?? 1;
      commitments.push(`Dedicated 1:1 human mentor (${sessions}x sessions/month)`);
    } else {
      commitments.push("Community and forum support");
    }

    if (offer.structuredCommitments?.support?.slaHours) {
      commitments.push(
        `Guaranteed ${offer.structuredCommitments.support.slaHours}h response SLA`,
      );
    }

    const refundDays =
      offer.refundPolicy?.windowDays ??
      offer.structuredCommitments?.refundPolicy?.windowDays;
    if (refundDays && refundDays > 0) {
      commitments.push(`${refundDays}-day money-back refund guarantee`);
    }

    if (
      offer.structuredCommitments?.entitlements?.keys &&
      offer.structuredCommitments.entitlements.keys.length > 0
    ) {
      const keys = offer.structuredCommitments.entitlements.keys
        .slice(0, 3)
        .map((k) => k.replace(/_/g, " "));
      commitments.push(`Includes: ${keys.join(", ")}`);
    }

    return commitments;
  }
}

let defaultBuyerTransactionService: BuyerTransactionService | null = null;

export function getBuyerTransactionService(): BuyerTransactionService {
  if (!defaultBuyerTransactionService) {
    defaultBuyerTransactionService = new BuyerTransactionService();
  }
  return defaultBuyerTransactionService;
}

export function setBuyerTransactionService(
  service: BuyerTransactionService | null,
): void {
  defaultBuyerTransactionService = service;
}
