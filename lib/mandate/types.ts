// Domain models + DTOs for the M3-A Authorized Offer Snapshot / Mandate.

export type MandateStatus = "AUTHORIZED" | "CANCELLED";

export interface MandateModel {
  id: string;
  userId: string;
  merchantId: string;
  offerId: string;
  razorpaySubscriptionId: string | null;
  status: MandateStatus;
  idempotencyKey: string | null;
  authorizedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Immutable frozen commercial facts captured at authorization time.
export interface SnapshotModel {
  id: string;
  mandateId: string;
  offerId: string;
  offerVersion: number;
  productId: string;
  productName: string;
  offerName: string;
  description: string;
  price: number;
  currency: string;
  billingInterval: string;
  duration: number;
  entitlementKeys: string[];
  refundWindowDays: number;
  supportTerms: string;
  semanticTerms: string;
  snapshotCreatedAt: Date;
}

export interface MandateWithSnapshot extends MandateModel {
  snapshot: SnapshotModel;
}

// Fields needed to build a snapshot from the server-loaded Offer.
export interface SnapshotFields {
  offerId: string;
  offerVersion: number;
  productId: string;
  productName: string;
  offerName: string;
  description: string;
  price: number;
  currency: string;
  billingInterval: string;
  duration: number;
  entitlementKeys: string[];
  refundWindowDays: number;
  supportTerms: string;
  semanticTerms: string;
}

export interface CreateMandateInput {
  userId: string;
  merchantId: string;
  offerId: string;
  razorpaySubscriptionId: string | null;
  status: MandateStatus;
  idempotencyKey: string | null;
  snapshot: SnapshotFields;
}

// API-facing authorization result (no internal ids leaked beyond mandate).
export interface AuthorizationResult {
  mandateId: string;
  userId: string;
  offerId: string;
  razorpaySubscriptionId: string | null;
  status: MandateStatus;
  snapshot: {
    offerVersion: number;
    productName: string;
    offerName: string;
    price: number;
    currency: string;
    billingInterval: string;
    duration: number;
    entitlementKeys: string[];
    refundWindowDays: number;
  };
}
