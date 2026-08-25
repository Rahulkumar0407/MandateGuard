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

import {
  computeOfferVersionHash,
  extractStructuredCommitmentCandidate,
  normalizeStructuredCommitments,
  type StructuredCommitments,
  type StructuredCommitmentsCandidate,
} from "./structured-commitments";

export class OfferAlreadyConfirmedError extends Error {
  constructor(message = "Offer version is already confirmed and immutable.") {
    super(message);
    this.name = "OfferAlreadyConfirmedError";
  }
}

export class OfferNotFoundError extends Error {
  constructor(message = "Offer not found.") {
    super(message);
    this.name = "OfferNotFoundError";
  }
}

export interface CreateOfferVersionInputDTO {
  name: string;
  description: string;
  price: number;
  currency?: string;
  billingInterval?: string;
  duration: number;
  entitlementKeys: string[];
  refundWindowDays: number;
  supportTerms: string;
  semanticTerms: string;
  structuredCommitments?: StructuredCommitments;
  confirmImmediately?: boolean;
}

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
          isConfirmedByMerchant: o.isConfirmedByMerchant,
          versionHash: o.versionHash,
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
      structuredCommitments: offer.structuredCommitments,
      isConfirmedByMerchant: offer.isConfirmedByMerchant,
      versionHash: offer.versionHash,
      availability: offer.active ? "ACTIVE" : "INACTIVE",
    };
  }

  // Confirms structured commercial commitments for an unconfirmed offer version,
  // computes its deterministic content fingerprint (versionHash), and marks it authoritative.
  // Throws if the offer version is already confirmed (immutability protection).
  async confirmOfferCommitments(
    offerId: string,
    rawCommitments: StructuredCommitments,
  ): Promise<OfferDetailDTO> {
    const offer = await this.repo.getOfferById(offerId);
    if (!offer) {
      throw new OfferNotFoundError(`Offer '${offerId}' not found.`);
    }

    if (offer.isConfirmedByMerchant && offer.versionHash) {
      throw new OfferAlreadyConfirmedError(
        `Offer version ${offer.version} is already confirmed and cannot be edited in place. Create a new version instead.`,
      );
    }

    const normalized = normalizeStructuredCommitments(rawCommitments);
    const versionHash = computeOfferVersionHash({
      productId: offer.productId,
      version: offer.version,
      price: offer.price,
      currency: offer.currency,
      billingInterval: offer.billingInterval,
      duration: offer.duration,
      refundWindowDays: normalized.refundPolicy.windowDays,
      structuredCommitments: normalized,
    });

    const updated = await this.repo.confirmOfferCommitments(
      offerId,
      normalized,
      versionHash,
    );

    const product = await this.repo.getProductById(updated.productId);
    if (!product) throw new Error("Product missing for confirmed offer.");

    return {
      id: updated.id,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.category,
        merchantId: product.merchantId,
      },
      version: updated.version,
      name: updated.name,
      description: updated.description,
      price: updated.price,
      currency: updated.currency,
      billingInterval: updated.billingInterval,
      duration: updated.duration,
      entitlementKeys: updated.entitlementKeys,
      refundPolicy: { windowDays: updated.refundWindowDays },
      supportTerms: updated.supportTerms,
      semanticTerms: updated.semanticTerms,
      structuredCommitments: updated.structuredCommitments,
      isConfirmedByMerchant: updated.isConfirmedByMerchant,
      versionHash: updated.versionHash,
      availability: updated.active ? "ACTIVE" : "INACTIVE",
    };
  }

  // Generates a non-authoritative candidate extraction for merchant review.
  async extractCommitmentCandidate(
    offerId: string,
  ): Promise<StructuredCommitmentsCandidate> {
    const offer = await this.repo.getOfferById(offerId);
    if (!offer) {
      throw new OfferNotFoundError(`Offer '${offerId}' not found.`);
    }

    return extractStructuredCommitmentCandidate({
      description: offer.description,
      supportTerms: offer.supportTerms,
      semanticTerms: offer.semanticTerms,
      entitlementKeys: offer.entitlementKeys,
      refundWindowDays: offer.refundWindowDays,
    });
  }

  // Creates a new offer version (v_next) for a product, preserving prior immutable versions.
  async createOfferVersion(
    productId: string,
    input: CreateOfferVersionInputDTO,
  ): Promise<OfferDetailDTO> {
    const existingOffers = await this.repo.listAllOffersForProduct(productId);
    const maxVersion = existingOffers.reduce(
      (max, o) => Math.max(max, o.version),
      0,
    );
    const nextVersion = maxVersion + 1;

    let normalizedCommitments: StructuredCommitments | null = null;
    let versionHash: string | null = null;
    let isConfirmed = false;

    if (input.structuredCommitments && input.confirmImmediately) {
      normalizedCommitments = normalizeStructuredCommitments(
        input.structuredCommitments,
      );
      versionHash = computeOfferVersionHash({
        productId,
        version: nextVersion,
        price: input.price,
        currency: input.currency ?? "INR",
        billingInterval: input.billingInterval ?? "monthly",
        duration: input.duration,
        refundWindowDays: input.refundWindowDays,
        structuredCommitments: normalizedCommitments,
      });
      isConfirmed = true;
    } else if (input.structuredCommitments) {
      normalizedCommitments = normalizeStructuredCommitments(
        input.structuredCommitments,
      );
    }

    const created = await this.repo.createOfferVersion({
      productId,
      version: nextVersion,
      name: input.name,
      description: input.description,
      price: input.price,
      currency: input.currency ?? "INR",
      billingInterval: input.billingInterval ?? "monthly",
      duration: input.duration,
      entitlementKeys: input.entitlementKeys,
      refundWindowDays: input.refundWindowDays,
      supportTerms: input.supportTerms,
      semanticTerms: input.semanticTerms,
      structuredCommitments: normalizedCommitments,
      isConfirmedByMerchant: isConfirmed,
      versionHash,
      active: true,
    });

    const product = await this.repo.getProductById(productId);
    if (!product) throw new Error(`Product '${productId}' not found.`);

    return {
      id: created.id,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.category,
        merchantId: product.merchantId,
      },
      version: created.version,
      name: created.name,
      description: created.description,
      price: created.price,
      currency: created.currency,
      billingInterval: created.billingInterval,
      duration: created.duration,
      entitlementKeys: created.entitlementKeys,
      refundPolicy: { windowDays: created.refundWindowDays },
      supportTerms: created.supportTerms,
      semanticTerms: created.semanticTerms,
      structuredCommitments: created.structuredCommitments,
      isConfirmedByMerchant: created.isConfirmedByMerchant,
      versionHash: created.versionHash,
      availability: created.active ? "ACTIVE" : "INACTIVE",
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
        structuredCommitments: o.structuredCommitments,
        isConfirmedByMerchant: o.isConfirmedByMerchant,
        versionHash: o.versionHash,
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
