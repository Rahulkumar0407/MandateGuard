import { PrismaClient } from "@prisma/client";
import type {
  CreateMandateInput,
  MandateModel,
  MandateStatus,
  MandateWithSnapshot,
  SnapshotModel,
} from "./types";

// Repository boundary for mandates + snapshots. Production uses Prisma; tests
// inject an in-memory implementation. The service never touches Prisma.
export interface MandateRepository {
  findByIdempotencyKey(key: string): Promise<MandateWithSnapshot | null>;
  createMandateWithSnapshot(
    input: CreateMandateInput,
  ): Promise<MandateWithSnapshot>;
  getMandateById(id: string): Promise<MandateWithSnapshot | null>;
}

// --- Production: Prisma ----------------------------------------------------

function toMandateWithSnapshot(row: {
  id: string;
  userId: string;
  merchantId: string;
  offerId: string;
  razorpaySubscriptionId: string | null;
  status: string;
  idempotencyKey: string | null;
  authorizedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  snapshot: {
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
  } | null;
}): MandateWithSnapshot {
  if (!row.snapshot) {
    throw new Error("Mandate created without an associated snapshot.");
  }
  const mandate: MandateModel = {
    id: row.id,
    userId: row.userId,
    merchantId: row.merchantId,
    offerId: row.offerId,
    razorpaySubscriptionId: row.razorpaySubscriptionId,
    status: row.status as MandateStatus,
    idempotencyKey: row.idempotencyKey,
    authorizedAt: row.authorizedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
  const snapshot: SnapshotModel = { ...row.snapshot };
  return { ...mandate, snapshot };
}

export class PrismaMandateRepository implements MandateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByIdempotencyKey(key: string): Promise<MandateWithSnapshot | null> {
    if (!key) return null;
    const m = await this.prisma.mandate.findUnique({
      where: { idempotencyKey: key },
      include: { snapshot: true },
    });
    return m ? toMandateWithSnapshot(m) : null;
  }

  async createMandateWithSnapshot(
    input: CreateMandateInput,
  ): Promise<MandateWithSnapshot> {
    const created = await this.prisma.mandate.create({
      data: {
        userId: input.userId,
        merchantId: input.merchantId,
        offerId: input.offerId,
        razorpaySubscriptionId: input.razorpaySubscriptionId,
        status: input.status,
        idempotencyKey: input.idempotencyKey,
        snapshot: {
          create: {
            offerId: input.snapshot.offerId,
            offerVersion: input.snapshot.offerVersion,
            productId: input.snapshot.productId,
            productName: input.snapshot.productName,
            offerName: input.snapshot.offerName,
            description: input.snapshot.description,
            price: input.snapshot.price,
            currency: input.snapshot.currency,
            billingInterval: input.snapshot.billingInterval,
            duration: input.snapshot.duration,
            entitlementKeys: input.snapshot.entitlementKeys,
            refundWindowDays: input.snapshot.refundWindowDays,
            supportTerms: input.snapshot.supportTerms,
            semanticTerms: input.snapshot.semanticTerms,
          },
        },
      },
      include: { snapshot: true },
    });
    return toMandateWithSnapshot(created);
  }

  async getMandateById(id: string): Promise<MandateWithSnapshot | null> {
    const m = await this.prisma.mandate.findUnique({
      where: { id },
      include: { snapshot: true },
    });
    return m ? toMandateWithSnapshot(m) : null;
  }
}

// --- In-memory (test double / offline) --------------------------------------

export class InMemoryMandateRepository implements MandateRepository {
  private mandates = new Map<string, MandateModel>();
  private snapshots = new Map<string, SnapshotModel>();
  private seq = 0;

  async findByIdempotencyKey(
    key: string,
  ): Promise<MandateWithSnapshot | null> {
    if (!key) return null;
    for (const m of this.mandates.values()) {
      if (m.idempotencyKey === key) return this.attach(m);
    }
    return null;
  }

  async createMandateWithSnapshot(
    input: CreateMandateInput,
  ): Promise<MandateWithSnapshot> {
    if (
      input.idempotencyKey &&
      (await this.findByIdempotencyKey(input.idempotencyKey))
    ) {
      return (await this.findByIdempotencyKey(input.idempotencyKey))!;
    }
    const now = new Date();
    const id = `m_${++this.seq}`;
    const mandate: MandateModel = {
      id,
      userId: input.userId,
      merchantId: input.merchantId,
      offerId: input.offerId,
      razorpaySubscriptionId: input.razorpaySubscriptionId,
      status: input.status,
      idempotencyKey: input.idempotencyKey,
      authorizedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    const snapshot: SnapshotModel = {
      id: `s_${id}`,
      mandateId: id,
      ...input.snapshot,
      snapshotCreatedAt: now,
    };
    this.mandates.set(id, mandate);
    this.snapshots.set(id, snapshot);
    return { ...mandate, snapshot };
  }

  async getMandateById(id: string): Promise<MandateWithSnapshot | null> {
    const m = this.mandates.get(id);
    return m ? this.attach(m) : null;
  }

  private attach(m: MandateModel): MandateWithSnapshot {
    const snapshot = this.snapshots.get(m.id);
    if (!snapshot) throw new Error("Mandate without snapshot found.");
    return { ...m, snapshot };
  }
}
