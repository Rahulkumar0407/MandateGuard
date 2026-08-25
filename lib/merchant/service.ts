import { prisma } from "@/lib/db";
import {
  InMemoryMerchantOfferRepository,
  PrismaMerchantOfferRepository,
  type MerchantOfferRepository,
} from "./repository";
import type {
  MerchantProfileDTO,
  OfferDetailDTO,
  PoliciesDTO,
  ProductDTO,
} from "./types";

// Service boundary consumed by the /agent/* API. It depends ONLY on the
// repository interface, never on Prisma directly, so it is fully testable with
// an injected in-memory repository.
export class MerchantOfferService {
  constructor(private readonly repo: MerchantOfferRepository) {}

  async getMerchantProfile(): Promise<MerchantProfileDTO | null> {
    const m = await this.repo.getActiveMerchant();
    if (!m) return null;
    // Intentionally limited surface: no secrets, no internals.
    return {
      merchant: {
        id: m.id,
        name: m.name,
        description: m.description,
        status: m.status,
      },
    };
  }

  async listProducts(filter: { category?: string } = {}): Promise<ProductDTO[]> {
    const merchant = await this.repo.getActiveMerchant();
    if (!merchant) return [];
    const products = await this.repo.listActiveProducts({
      merchantId: merchant.id,
      category: filter.category,
    });

    const result: ProductDTO[] = [];
    for (const p of products) {
      const offers = await this.repo.listActiveOffers({
        merchantId: merchant.id,
        productId: p.id,
      });
      result.push({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        category: p.category,
        offers: offers.map((o) => ({
          id: o.id,
          version: o.version,
          name: o.name,
          price: o.price,
          currency: o.currency,
          billingInterval: o.billingInterval,
          duration: o.duration,
        })),
      });
    }
    return result;
  }

  async getOffer(offerId: string): Promise<OfferDetailDTO | null> {
    const merchant = await this.repo.getActiveMerchant();
    if (!merchant) return null;
    const offer = await this.repo.getActiveOfferById(offerId);
    if (!offer) return null;
    const product = await this.repo.getProductById(offer.productId);
    // Enforce merchant isolation: an orphaned/foreign offer is not discoverable.
    if (!product || product.merchantId !== merchant.id) return null;

    return {
      id: offer.id,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.category,
        merchantId: product.merchantId,
      },
      version: offer.version,
      name: offer.name,
      description: offer.description,
      price: offer.price,
      currency: offer.currency,
      billingInterval: offer.billingInterval,
      duration: offer.duration,
      entitlementKeys: offer.entitlementKeys,
      refundPolicy: { windowDays: offer.refundWindowDays },
      supportTerms: offer.supportTerms,
      semanticTerms: offer.semanticTerms,
      availability: offer.active ? "ACTIVE" : "INACTIVE",
    };
  }

  // MVP deterministic policy response. Documented as not-yet-persisted.
  getPolicies(): PoliciesDTO {
    return {
      currency: "INR",
      supportedBillingIntervals: ["monthly"],
      refundPolicy: { defaultWindowDays: 30 },
      note: "MVP deterministic representation; not yet persisted as separate policy entities.",
    };
  }

  // Discovery tool for the AI buyer: returns all ACTIVE offers as full DTOs.
  async listOffers(): Promise<OfferDetailDTO[]> {
    const merchant = await this.repo.getActiveMerchant();
    if (!merchant) return [];
    const offers = await this.repo.listActiveOffers({
      merchantId: merchant.id,
    });
    const result: OfferDetailDTO[] = [];
    for (const o of offers) {
      const product = await this.repo.getProductById(o.productId);
      if (!product || product.merchantId !== merchant.id) continue;
      result.push({
        id: o.id,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          category: product.category,
          merchantId: product.merchantId,
        },
        version: o.version,
        name: o.name,
        description: o.description,
        price: o.price,
        currency: o.currency,
        billingInterval: o.billingInterval,
        duration: o.duration,
        entitlementKeys: o.entitlementKeys,
        refundPolicy: { windowDays: o.refundWindowDays },
        supportTerms: o.supportTerms,
        semanticTerms: o.semanticTerms,
        availability: o.active ? "ACTIVE" : "INACTIVE",
      });
    }
    return result;
  }
}

// --- Factory / test seam (no DI framework) --------------------------------

let repoOverride: MerchantOfferRepository | null = null;
let serviceSingleton: MerchantOfferService | null = null;

// Inject a repository (e.g. InMemoryMerchantOfferRepository) for tests, or
// pass null to clear the override.
export function setMerchantOfferRepository(
  repo: MerchantOfferRepository | null,
): void {
  repoOverride = repo;
  serviceSingleton = null;
}

export function getMerchantOfferService(): MerchantOfferService {
  if (repoOverride) return new MerchantOfferService(repoOverride);
  if (!serviceSingleton) {
    serviceSingleton = new MerchantOfferService(
      new PrismaMerchantOfferRepository(prisma),
    );
  }
  return serviceSingleton;
}

export { InMemoryMerchantOfferRepository };
