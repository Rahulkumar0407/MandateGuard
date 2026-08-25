import { prisma } from "@/lib/db";
import {
  InMemoryMandateRepository,
  PrismaMandateRepository,
  type MandateRepository,
} from "./repository";
import type {
  AuthorizationResult,
  CreateMandateInput,
  MandateWithSnapshot,
  SnapshotFields,
} from "./types";
import type { MerchantOfferService } from "@/lib/merchant/service";
import { getMerchantOfferService } from "@/lib/merchant/service";
import type { OfferDetailDTO } from "@/lib/merchant/types";

// Thrown for controlled authorization failures. `status` maps to an HTTP code.
export class MandateError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export interface AuthorizeInput {
  userId: string;
  offerId: string;
  razorpaySubscriptionId?: string;
  idempotencyKey?: string;
}

// Orchestrates explicit user authorization:
//   load current Offer (server-side) -> validate active -> freeze snapshot.
// It never trusts client-supplied commercial values.
export class MandateService {
  constructor(
    private readonly repo: MandateRepository,
    private readonly merchant: MerchantOfferService,
  ) {}

  async createMandateAuthorization(
    input: AuthorizeInput,
  ): Promise<AuthorizationResult> {
    // Idempotency: a repeated request with the same key returns the existing
    // mandate instead of creating a duplicate.
    if (input.idempotencyKey) {
      const existing = await this.repo.findByIdempotencyKey(
        input.idempotencyKey,
      );
      if (existing) return toResult(existing);
    }

    // SERVER AUTHORITY: the offer is loaded from the merchant service, never
    // from client-supplied commercial fields.
    const offer = await this.merchant.getOffer(input.offerId);
    if (!offer) {
      // getOffer returns null for unknown OR inactive offers.
      throw new MandateError("Offer not found or not active.", 404);
    }

    const snapshot = buildSnapshot(offer);

    const mandateInput: CreateMandateInput = {
      userId: input.userId,
      merchantId: offer.product.merchantId,
      offerId: offer.id,
      razorpaySubscriptionId: input.razorpaySubscriptionId ?? null,
      status: "AUTHORIZED",
      idempotencyKey: input.idempotencyKey ?? null,
      snapshot,
    };

    const created = await this.repo.createMandateWithSnapshot(mandateInput);
    return toResult(created);
  }

  async getMandate(id: string): Promise<MandateWithSnapshot | null> {
    return this.repo.getMandateById(id);
  }
}

// Freeze the commercial facts from the server-loaded offer.
function buildSnapshot(offer: OfferDetailDTO): SnapshotFields {
  return {
    offerId: offer.id,
    offerVersion: offer.version,
    productId: offer.product.id,
    productName: offer.product.name,
    offerName: offer.name,
    description: offer.description,
    price: offer.price,
    currency: offer.currency,
    billingInterval: offer.billingInterval,
    duration: offer.duration,
    entitlementKeys: offer.entitlementKeys,
    refundWindowDays: offer.refundPolicy.windowDays,
    supportTerms: offer.supportTerms,
    semanticTerms: offer.semanticTerms,
  };
}

function toResult(m: MandateWithSnapshot): AuthorizationResult {
  return {
    mandateId: m.id,
    userId: m.userId,
    offerId: m.offerId,
    razorpaySubscriptionId: m.razorpaySubscriptionId,
    status: m.status,
    snapshot: {
      offerVersion: m.snapshot.offerVersion,
      productName: m.snapshot.productName,
      offerName: m.snapshot.offerName,
      price: m.snapshot.price,
      currency: m.snapshot.currency,
      billingInterval: m.snapshot.billingInterval,
      duration: m.snapshot.duration,
      entitlementKeys: m.snapshot.entitlementKeys,
      refundWindowDays: m.snapshot.refundWindowDays,
    },
  };
}

// --- Factory / test seam (no DI framework) --------------------------------

let repoOverride: MandateRepository | null = null;
let serviceSingleton: MandateService | null = null;

export function setMandateRepository(repo: MandateRepository | null): void {
  repoOverride = repo;
  serviceSingleton = null;
}

export function getMandateService(): MandateService {
  if (repoOverride) return new MandateService(repoOverride, getMerchantOfferService());
  if (!serviceSingleton) {
    serviceSingleton = new MandateService(
      new PrismaMandateRepository(prisma),
      getMerchantOfferService(),
    );
  }
  return serviceSingleton;
}

export { InMemoryMandateRepository };
