import { PrismaClient } from "@prisma/client";
import type {
  MerchantModel,
  MerchantOfferData,
  MerchantStatus,
  OfferModel,
  ProductModel,
} from "./types";
import type { StructuredCommitments } from "./structured-commitments";

export interface CreateOfferVersionInput {
  productId: string;
  version: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingInterval: string;
  duration: number;
  entitlementKeys: string[];
  refundWindowDays: number;
  supportTerms: string;
  semanticTerms: string;
  structuredCommitments?: StructuredCommitments | null;
  isConfirmedByMerchant?: boolean;
  versionHash?: string | null;
  active?: boolean;
}

// Repository boundary between the Merchant/Offer service and the database.
// Production uses Prisma; tests inject an in-memory implementation. This keeps
// the service free of Prisma/Db details and testable without a live database.
export interface MerchantOfferRepository {
  getActiveMerchant(): Promise<MerchantModel | null>;
  listActiveProducts(filter: {
    merchantId: string;
    category?: string;
  }): Promise<ProductModel[]>;
  listActiveOffers(filter: {
    merchantId?: string;
    productId?: string;
  }): Promise<OfferModel[]>;
  getActiveOfferById(offerId: string): Promise<OfferModel | null>;
  getOfferById(offerId: string): Promise<OfferModel | null>;
  listAllOffersForProduct(productId: string): Promise<OfferModel[]>;
  getProductById(productId: string): Promise<ProductModel | null>;
  confirmOfferCommitments(
    offerId: string,
    commitments: StructuredCommitments,
    versionHash: string,
  ): Promise<OfferModel>;
  createOfferVersion(input: CreateOfferVersionInput): Promise<OfferModel>;
}

// --- Mappers (Prisma row -> domain model) --------------------------------

function toMerchantModel(m: {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): MerchantModel {
  return {
    id: m.id,
    name: m.name,
    slug: m.slug,
    description: m.description,
    status: m.status as MerchantStatus,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

function toProductModel(p: {
  id: string;
  merchantId: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ProductModel {
  return {
    id: p.id,
    merchantId: p.merchantId,
    name: p.name,
    slug: p.slug,
    description: p.description,
    category: p.category,
    active: p.active,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function toOfferModel(o: {
  id: string;
  productId: string;
  version: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingInterval: string;
  duration: number;
  entitlementKeys: string[];
  refundWindowDays: number;
  supportTerms: string;
  semanticTerms: string;
  structuredCommitments?: unknown;
  isConfirmedByMerchant?: boolean;
  versionHash?: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): OfferModel {
  return {
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
    structuredCommitments: (o.structuredCommitments as StructuredCommitments) ?? null,
    isConfirmedByMerchant: o.isConfirmedByMerchant ?? false,
    versionHash: o.versionHash ?? null,
    active: o.active,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

// --- Production: Prisma ---------------------------------------------------

export class PrismaMerchantOfferRepository implements MerchantOfferRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getActiveMerchant(): Promise<MerchantModel | null> {
    const m = await this.prisma.merchant.findFirst({
      where: { status: "ACTIVE" },
    });
    return m ? toMerchantModel(m) : null;
  }

  async listActiveProducts(filter: {
    merchantId: string;
    category?: string;
  }): Promise<ProductModel[]> {
    const rows = await this.prisma.product.findMany({
      where: {
        merchantId: filter.merchantId,
        active: true,
        ...(filter.category ? { category: filter.category } : {}),
      },
    });
    return rows.map(toProductModel);
  }

  async listActiveOffers(filter: {
    merchantId?: string;
    productId?: string;
  }): Promise<OfferModel[]> {
    const rows = await this.prisma.offer.findMany({
      where: {
        active: true,
        ...(filter.productId ? { productId: filter.productId } : {}),
        product: {
          active: true,
          ...(filter.merchantId ? { merchantId: filter.merchantId } : {}),
        },
      },
    });
    return rows.map(toOfferModel);
  }

  async getActiveOfferById(offerId: string): Promise<OfferModel | null> {
    const o = await this.prisma.offer.findFirst({
      where: { id: offerId, active: true },
    });
    return o ? toOfferModel(o) : null;
  }

  async getOfferById(offerId: string): Promise<OfferModel | null> {
    const o = await this.prisma.offer.findUnique({
      where: { id: offerId },
    });
    return o ? toOfferModel(o) : null;
  }

  async listAllOffersForProduct(productId: string): Promise<OfferModel[]> {
    const rows = await this.prisma.offer.findMany({
      where: { productId },
      orderBy: { version: "asc" },
    });
    return rows.map(toOfferModel);
  }

  async getProductById(productId: string): Promise<ProductModel | null> {
    const p = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    return p ? toProductModel(p) : null;
  }

  async confirmOfferCommitments(
    offerId: string,
    commitments: StructuredCommitments,
    versionHash: string,
  ): Promise<OfferModel> {
    const updated = await this.prisma.offer.update({
      where: { id: offerId },
      data: {
        structuredCommitments: commitments as object,
        isConfirmedByMerchant: true,
        versionHash,
        refundWindowDays: commitments.refundPolicy.windowDays,
      },
    });
    return toOfferModel(updated);
  }

  async createOfferVersion(input: CreateOfferVersionInput): Promise<OfferModel> {
    const created = await this.prisma.offer.create({
      data: {
        productId: input.productId,
        version: input.version,
        name: input.name,
        description: input.description,
        price: input.price,
        currency: input.currency,
        billingInterval: input.billingInterval,
        duration: input.duration,
        entitlementKeys: input.entitlementKeys,
        refundWindowDays: input.refundWindowDays,
        supportTerms: input.supportTerms,
        semanticTerms: input.semanticTerms,
        structuredCommitments: (input.structuredCommitments as object) ?? undefined,
        isConfirmedByMerchant: input.isConfirmedByMerchant ?? false,
        versionHash: input.versionHash ?? null,
        active: input.active ?? true,
      },
    });
    return toOfferModel(created);
  }
}

// --- In-memory (test double / offline) ------------------------------------
//
// Mirrors the production scoping rules (active merchant, active products/
// offers) so service behavior can be exercised without PostgreSQL.
export class InMemoryMerchantOfferRepository implements MerchantOfferRepository {
  constructor(private readonly data: MerchantOfferData) {}

  async getActiveMerchant(): Promise<MerchantModel | null> {
    return (
      this.data.merchants.find((m) => m.status === "ACTIVE") ?? null
    );
  }

  async listActiveProducts(filter: {
    merchantId: string;
    category?: string;
  }): Promise<ProductModel[]> {
    return this.data.products.filter(
      (p) =>
        p.merchantId === filter.merchantId &&
        p.active &&
        (!filter.category || p.category === filter.category),
    );
  }

  async listActiveOffers(filter: {
    merchantId?: string;
    productId?: string;
  }): Promise<OfferModel[]> {
    return this.data.offers.filter((o) => {
      if (!o.active) return false;
      if (filter.productId && o.productId !== filter.productId) return false;
      if (filter.merchantId) {
        const product = this.data.products.find((p) => p.id === o.productId);
        return product?.merchantId === filter.merchantId;
      }
      return true;
    });
  }

  async getActiveOfferById(offerId: string): Promise<OfferModel | null> {
    const o = this.data.offers.find((x) => x.id === offerId);
    return o && o.active ? o : null;
  }

  async getOfferById(offerId: string): Promise<OfferModel | null> {
    const o = this.data.offers.find((x) => x.id === offerId);
    return o ? o : null;
  }

  async listAllOffersForProduct(productId: string): Promise<OfferModel[]> {
    return this.data.offers
      .filter((o) => o.productId === productId)
      .sort((a, b) => a.version - b.version);
  }

  async getProductById(productId: string): Promise<ProductModel | null> {
    return this.data.products.find((p) => p.id === productId) ?? null;
  }

  async confirmOfferCommitments(
    offerId: string,
    commitments: StructuredCommitments,
    versionHash: string,
  ): Promise<OfferModel> {
    const offer = this.data.offers.find((o) => o.id === offerId);
    if (!offer) throw new Error(`Offer '${offerId}' not found.`);
    offer.structuredCommitments = commitments;
    offer.isConfirmedByMerchant = true;
    offer.versionHash = versionHash;
    offer.refundWindowDays = commitments.refundPolicy.windowDays;
    offer.updatedAt = new Date();
    return offer;
  }

  async createOfferVersion(input: CreateOfferVersionInput): Promise<OfferModel> {
    const newOffer: OfferModel = {
      id: `o_${input.productId}_v${input.version}`,
      productId: input.productId,
      version: input.version,
      name: input.name,
      description: input.description,
      price: input.price,
      currency: input.currency,
      billingInterval: input.billingInterval,
      duration: input.duration,
      entitlementKeys: input.entitlementKeys,
      refundWindowDays: input.refundWindowDays,
      supportTerms: input.supportTerms,
      semanticTerms: input.semanticTerms,
      structuredCommitments: input.structuredCommitments ?? null,
      isConfirmedByMerchant: input.isConfirmedByMerchant ?? false,
      versionHash: input.versionHash ?? null,
      active: input.active ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.offers.push(newOffer);
    return newOffer;
  }
}
