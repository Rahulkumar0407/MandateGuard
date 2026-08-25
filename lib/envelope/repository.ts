import { Prisma, PrismaClient } from "@prisma/client";
import type {
  AuthorizationEnvelopeModel,
  AuthorizationEnvelopeStatus,
  BaselineCommitments,
  FinancialConstraints,
  AgentPermissions,
  TolerancePolicy,
} from "./types";
import {
  BaselineCommitmentsSchema,
  FinancialConstraintsSchema,
  AgentPermissionsSchema,
  TolerancePolicySchema,
} from "./types";

export interface CreateEnvelopeData {
  userId: string;
  merchantId: string;
  subscriptionId: string | null;
  mandateId: string | null;
  authorizedOfferVersionId: string;
  authorizedOfferHash: string;
  baselineCommitments: BaselineCommitments;
  financialConstraints: FinancialConstraints;
  agentPermissions: AgentPermissions;
  tolerancePolicy: TolerancePolicy;
  authorizationPolicyHash: string;
  status: AuthorizationEnvelopeStatus;
  expiresAt: Date | null;
}

export interface EnvelopeRepository {
  createEnvelope(data: CreateEnvelopeData): Promise<AuthorizationEnvelopeModel>;
  getEnvelopeById(id: string): Promise<AuthorizationEnvelopeModel | null>;
  getEnvelopeByMandateId(
    mandateId: string,
  ): Promise<AuthorizationEnvelopeModel | null>;
  getEnvelopeBySubscriptionId(
    subscriptionId: string,
  ): Promise<AuthorizationEnvelopeModel | null>;
  listActiveEnvelopesByMerchant(
    merchantId: string,
  ): Promise<AuthorizationEnvelopeModel[]>;
  listEnvelopesByUserId(userId: string): Promise<AuthorizationEnvelopeModel[]>;
  updateEnvelopeStatus(
    id: string,
    status: AuthorizationEnvelopeStatus,
  ): Promise<AuthorizationEnvelopeModel>;
}

// ----------------------------------------------------------------------------
// Prisma Repository Implementation
// ----------------------------------------------------------------------------

function toModel(row: {
  id: string;
  userId: string;
  merchantId: string;
  subscriptionId: string | null;
  mandateId: string | null;
  authorizedOfferVersionId: string;
  authorizedOfferHash: string;
  baselineCommitments: unknown;
  financialConstraints: unknown;
  agentPermissions: unknown;
  tolerancePolicy: unknown;
  authorizationPolicyHash: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
}): AuthorizationEnvelopeModel {
  return {
    id: row.id,
    userId: row.userId,
    merchantId: row.merchantId,
    subscriptionId: row.subscriptionId,
    mandateId: row.mandateId,
    authorizedOfferVersionId: row.authorizedOfferVersionId,
    authorizedOfferHash: row.authorizedOfferHash,
    baselineCommitments: BaselineCommitmentsSchema.parse(
      row.baselineCommitments,
    ),
    financialConstraints: FinancialConstraintsSchema.parse(
      row.financialConstraints,
    ),
    agentPermissions: AgentPermissionsSchema.parse(row.agentPermissions),
    tolerancePolicy: TolerancePolicySchema.parse(row.tolerancePolicy),
    authorizationPolicyHash: row.authorizationPolicyHash,
    status: row.status as AuthorizationEnvelopeStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    expiresAt: row.expiresAt,
  };
}

export class PrismaEnvelopeRepository implements EnvelopeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createEnvelope(
    data: CreateEnvelopeData,
  ): Promise<AuthorizationEnvelopeModel> {
    const created = await this.prisma.authorizationEnvelope.create({
      data: {
        userId: data.userId,
        merchantId: data.merchantId,
        subscriptionId: data.subscriptionId,
        mandateId: data.mandateId,
        authorizedOfferVersionId: data.authorizedOfferVersionId,
        authorizedOfferHash: data.authorizedOfferHash,
        baselineCommitments:
          data.baselineCommitments as unknown as Prisma.InputJsonValue,
        financialConstraints:
          data.financialConstraints as unknown as Prisma.InputJsonValue,
        agentPermissions:
          data.agentPermissions as unknown as Prisma.InputJsonValue,
        tolerancePolicy:
          data.tolerancePolicy as unknown as Prisma.InputJsonValue,
        authorizationPolicyHash: data.authorizationPolicyHash,
        status: data.status,
        expiresAt: data.expiresAt,
      },
    });
    return toModel(created);
  }

  async getEnvelopeById(
    id: string,
  ): Promise<AuthorizationEnvelopeModel | null> {
    const found = await this.prisma.authorizationEnvelope.findUnique({
      where: { id },
    });
    return found ? toModel(found) : null;
  }

  async getEnvelopeByMandateId(
    mandateId: string,
  ): Promise<AuthorizationEnvelopeModel | null> {
    const found = await this.prisma.authorizationEnvelope.findUnique({
      where: { mandateId },
    });
    return found ? toModel(found) : null;
  }

  async getEnvelopeBySubscriptionId(
    subscriptionId: string,
  ): Promise<AuthorizationEnvelopeModel | null> {
    const found = await this.prisma.authorizationEnvelope.findFirst({
      where: {
        OR: [
          { id: subscriptionId },
          { subscriptionId },
          { mandate: { razorpaySubscriptionId: subscriptionId } },
          { subscription: { razorpaySubscriptionId: subscriptionId } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    return found ? toModel(found) : null;
  }

  async listActiveEnvelopesByMerchant(
    merchantId: string,
  ): Promise<AuthorizationEnvelopeModel[]> {
    const list = await this.prisma.authorizationEnvelope.findMany({
      where: { merchantId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
    return list.map(toModel);
  }

  async listEnvelopesByUserId(
    userId: string,
  ): Promise<AuthorizationEnvelopeModel[]> {
    const list = await this.prisma.authorizationEnvelope.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return list.map(toModel);
  }

  async updateEnvelopeStatus(
    id: string,
    status: AuthorizationEnvelopeStatus,
  ): Promise<AuthorizationEnvelopeModel> {
    const updated = await this.prisma.authorizationEnvelope.update({
      where: { id },
      data: { status },
    });
    return toModel(updated);
  }
}

// ----------------------------------------------------------------------------
// In-Memory Repository (Test Double)
// ----------------------------------------------------------------------------

export class InMemoryEnvelopeRepository implements EnvelopeRepository {
  private envelopes = new Map<string, AuthorizationEnvelopeModel>();
  private seq = 0;

  async createEnvelope(
    data: CreateEnvelopeData,
  ): Promise<AuthorizationEnvelopeModel> {
    const now = new Date();
    const id = `env_${++this.seq}`;
    const model: AuthorizationEnvelopeModel = {
      id,
      userId: data.userId,
      merchantId: data.merchantId,
      subscriptionId: data.subscriptionId,
      mandateId: data.mandateId,
      authorizedOfferVersionId: data.authorizedOfferVersionId,
      authorizedOfferHash: data.authorizedOfferHash,
      baselineCommitments: BaselineCommitmentsSchema.parse(
        data.baselineCommitments,
      ),
      financialConstraints: FinancialConstraintsSchema.parse(
        data.financialConstraints,
      ),
      agentPermissions: AgentPermissionsSchema.parse(data.agentPermissions),
      tolerancePolicy: TolerancePolicySchema.parse(data.tolerancePolicy),
      authorizationPolicyHash: data.authorizationPolicyHash,
      status: data.status,
      createdAt: now,
      updatedAt: now,
      expiresAt: data.expiresAt,
    };
    this.envelopes.set(id, model);
    return { ...model };
  }

  async getEnvelopeById(
    id: string,
  ): Promise<AuthorizationEnvelopeModel | null> {
    const e = this.envelopes.get(id);
    return e ? { ...e } : null;
  }

  async getEnvelopeByMandateId(
    mandateId: string,
  ): Promise<AuthorizationEnvelopeModel | null> {
    for (const e of this.envelopes.values()) {
      if (e.mandateId === mandateId) return { ...e };
    }
    return null;
  }

  async getEnvelopeBySubscriptionId(
    subscriptionId: string,
  ): Promise<AuthorizationEnvelopeModel | null> {
    for (const e of this.envelopes.values()) {
      if (e.subscriptionId === subscriptionId) return { ...e };
    }
    return null;
  }

  async listActiveEnvelopesByMerchant(
    merchantId: string,
  ): Promise<AuthorizationEnvelopeModel[]> {
    const result: AuthorizationEnvelopeModel[] = [];
    for (const e of this.envelopes.values()) {
      if (e.merchantId === merchantId && e.status === "ACTIVE") {
        result.push({ ...e });
      }
    }
    return result.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async listEnvelopesByUserId(
    userId: string,
  ): Promise<AuthorizationEnvelopeModel[]> {
    const result: AuthorizationEnvelopeModel[] = [];
    for (const e of this.envelopes.values()) {
      if (e.userId === userId) result.push({ ...e });
    }
    return result.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async updateEnvelopeStatus(
    id: string,
    status: AuthorizationEnvelopeStatus,
  ): Promise<AuthorizationEnvelopeModel> {
    const e = this.envelopes.get(id);
    if (!e) throw new Error(`Envelope '${id}' not found.`);
    e.status = status;
    e.updatedAt = new Date();
    this.envelopes.set(id, e);
    return { ...e };
  }
}
