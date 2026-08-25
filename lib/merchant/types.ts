// Domain models and API DTOs for the Merchant Commerce API.
//
// NOTE ON SECURITY: Offer/merchant content (descriptions, support terms,
// semantic terms) is UNTRUSTED DATA. It is treated purely as data: it is never
// interpreted as instructions, never executed, and never allowed to influence
// application control flow. The future AI buyer may read these fields, but the
// application must never act on their content.

export type MerchantStatus = "ACTIVE" | "INACTIVE";

export interface MerchantModel {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: MerchantStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductModel {
  id: string;
  merchantId: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OfferModel {
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
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Full dataset shape consumed by the repository (used by both the Prisma
// implementation and the in-memory test double).
export interface MerchantOfferData {
  merchants: MerchantModel[];
  products: ProductModel[];
  offers: OfferModel[];
}

// ----------------------------- API DTOs -----------------------------------

export interface OfferSummaryDTO {
  id: string;
  version: number;
  name: string;
  price: number;
  currency: string;
  billingInterval: string;
  duration: number;
}

export interface ProductDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  // Only ACTIVE offers are surfaced in normal discovery.
  offers: OfferSummaryDTO[];
}

export interface OfferDetailDTO {
  id: string;
  product: { id: string; name: string; slug: string; category: string; merchantId: string };
  version: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingInterval: string;
  duration: number;
  entitlementKeys: string[];
  refundPolicy: { windowDays: number };
  supportTerms: string;
  semanticTerms: string;
  availability: "ACTIVE" | "INACTIVE";
}

export interface MerchantProfileDTO {
  merchant: {
    id: string;
    name: string;
    description: string;
    status: MerchantStatus;
  };
}

export interface PoliciesDTO {
  currency: string;
  supportedBillingIntervals: string[];
  refundPolicy: { defaultWindowDays: number };
  note: string;
}
