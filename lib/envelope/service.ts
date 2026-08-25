import { prisma } from "@/lib/db";
import {
  InMemoryEnvelopeRepository,
  PrismaEnvelopeRepository,
  type CreateEnvelopeData,
  type EnvelopeRepository,
} from "./repository";
import type {
  AuthorizationEnvelopeDTO,
  AuthorizationEnvelopeModel,
  AuthorizationEnvelopeStatus,
  BaselineCommitments,
  CreateEnvelopeInput,
  FinancialConstraints,
  AgentPermissions,
  TolerancePolicy,
} from "./types";
import {
  computeAuthorizationPolicyHash,
  normalizeAgentPermissions,
  normalizeBaselineCommitments,
  normalizeFinancialConstraints,
  normalizeTolerancePolicy,
} from "./types";
import {
  computeOfferVersionHash,
  extractStructuredCommitmentCandidate,
  normalizeStructuredCommitments,
  type StructuredCommitments,
} from "@/lib/merchant/structured-commitments";
import {
  getMerchantOfferService,
  type MerchantOfferService,
} from "@/lib/merchant/service";

export class EnvelopeError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "EnvelopeError";
  }
}

export function toEnvelopeDTO(
  model: AuthorizationEnvelopeModel,
): AuthorizationEnvelopeDTO {
  return {
    id: model.id,
    userId: model.userId,
    merchantId: model.merchantId,
    subscriptionId: model.subscriptionId,
    mandateId: model.mandateId,
    authorizedOfferVersionId: model.authorizedOfferVersionId,
    authorizedOfferHash: model.authorizedOfferHash,
    baselineCommitments: model.baselineCommitments,
    financialConstraints: model.financialConstraints,
    agentPermissions: model.agentPermissions,
    tolerancePolicy: model.tolerancePolicy,
    authorizationPolicyHash: model.authorizationPolicyHash,
    status: model.status,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
    expiresAt: model.expiresAt ? model.expiresAt.toISOString() : null,
  };
}

export class EnvelopeService {
  constructor(
    private readonly repo: EnvelopeRepository,
    private readonly merchant: MerchantOfferService,
  ) {}

  /**
   * Creates an immutable AuthorizationEnvelope pinned to an exact OfferVersion baseline.
   * Server-side authority: Loads offer from the merchant service, never trusting client-supplied values.
   */
  async createAuthorizationEnvelope(
    input: CreateEnvelopeInput,
  ): Promise<AuthorizationEnvelopeDTO> {
    const offer =
      (await this.merchant.getOffer(input.offerId)) ??
      (await this.merchant.getOfferById(input.offerId));
    if (!offer) {
      throw new EnvelopeError("Offer not found or not active.", 404);
    }

    // 1. Resolve structured commitments
    let structuredCommitments: StructuredCommitments;
    if (offer.structuredCommitments) {
      structuredCommitments = normalizeStructuredCommitments(
        offer.structuredCommitments,
      );
    } else {
      const candidate = extractStructuredCommitmentCandidate({
        description: offer.description,
        supportTerms: offer.supportTerms,
        semanticTerms: offer.semanticTerms,
        entitlementKeys: offer.entitlementKeys,
        refundWindowDays: offer.refundPolicy.windowDays,
      });
      structuredCommitments = candidate.commitments;
    }

    // 2. Resolve / compute versionHash
    const authorizedOfferHash =
      offer.versionHash ??
      computeOfferVersionHash({
        productId: offer.product.id,
        version: offer.version,
        price: offer.price,
        currency: offer.currency,
        billingInterval: offer.billingInterval,
        duration: offer.duration,
        refundWindowDays: offer.refundPolicy.windowDays,
        structuredCommitments,
      });

    // 3. Freeze baseline commitments
    const baselineCommitments: BaselineCommitments =
      normalizeBaselineCommitments({
        offerName: offer.name,
        description: offer.description,
        price: offer.price,
        currency: offer.currency,
        billingInterval: offer.billingInterval,
        duration: offer.duration,
        refundWindowDays: offer.refundPolicy.windowDays,
        supportTerms: offer.supportTerms,
        semanticTerms: offer.semanticTerms,
        structuredCommitments,
      });

    // 4. Resolve & normalize financial constraints
    const financialConstraints: FinancialConstraints =
      normalizeFinancialConstraints({
        maxPricePaise: input.financialConstraints?.maxPricePaise ?? offer.price,
        allowedCurrencies: input.financialConstraints?.allowedCurrencies ?? [
          offer.currency,
        ],
        maxPriceIncreasePercent:
          input.financialConstraints?.maxPriceIncreasePercent ?? 5,
        allowedBillingIntervals: input.financialConstraints
          ?.allowedBillingIntervals ?? [offer.billingInterval],
      });

    // 5. Resolve & normalize agent permissions
    const agentPermissions: AgentPermissions = normalizeAgentPermissions({
      canAutoApproveMinorChanges:
        input.agentPermissions?.canAutoApproveMinorChanges ?? true,
      canAutoPauseOnBreach:
        input.agentPermissions?.canAutoPauseOnBreach ?? true,
      canApproveRefundRequest:
        input.agentPermissions?.canApproveRefundRequest ?? false,
      canMigrateToNewVersion:
        input.agentPermissions?.canMigrateToNewVersion ?? false,
    });

    // 6. Resolve & normalize tolerance policy
    const tolerancePolicy: TolerancePolicy = normalizeTolerancePolicy({
      priceIncreasePercentTolerance:
        input.tolerancePolicy?.priceIncreasePercentTolerance ?? 5,
      allowedTierDowngrades:
        input.tolerancePolicy?.allowedTierDowngrades ?? [],
      allowedRemovedEntitlements:
        input.tolerancePolicy?.allowedRemovedEntitlements ?? [],
      refundWindowReductionDaysTolerance:
        input.tolerancePolicy?.refundWindowReductionDaysTolerance ?? 0,
    });

    // 7. Compute deterministic authorization policy hash
    const authorizationPolicyHash = computeAuthorizationPolicyHash({
      financialConstraints,
      agentPermissions,
      tolerancePolicy,
    });

    // 8. Persist envelope
    const createData: CreateEnvelopeData = {
      userId: input.userId,
      merchantId: offer.product.merchantId,
      subscriptionId: input.subscriptionId ?? null,
      mandateId: input.mandateId ?? null,
      authorizedOfferVersionId: offer.id,
      authorizedOfferHash,
      baselineCommitments,
      financialConstraints,
      agentPermissions,
      tolerancePolicy,
      authorizationPolicyHash,
      status: "ACTIVE",
      expiresAt: input.expiresAt ?? null,
    };

    const created = await this.repo.createEnvelope(createData);
    return toEnvelopeDTO(created);
  }

  async getEnvelope(id: string): Promise<AuthorizationEnvelopeDTO | null> {
    const e = await this.repo.getEnvelopeById(id);
    return e ? toEnvelopeDTO(e) : null;
  }

  async getEnvelopeByMandateId(
    mandateId: string,
  ): Promise<AuthorizationEnvelopeDTO | null> {
    const e = await this.repo.getEnvelopeByMandateId(mandateId);
    return e ? toEnvelopeDTO(e) : null;
  }

  async getEnvelopeBySubscriptionId(
    subscriptionId: string,
  ): Promise<AuthorizationEnvelopeDTO | null> {
    const e = await this.repo.getEnvelopeBySubscriptionId(subscriptionId);
    return e ? toEnvelopeDTO(e) : null;
  }

  async listActiveEnvelopesByMerchant(
    merchantId: string,
  ): Promise<AuthorizationEnvelopeDTO[]> {
    const list = await this.repo.listActiveEnvelopesByMerchant(merchantId);
    return list.map(toEnvelopeDTO);
  }

  async listEnvelopesByUserId(
    userId: string,
  ): Promise<AuthorizationEnvelopeDTO[]> {
    const list = await this.repo.listEnvelopesByUserId(userId);
    return list.map(toEnvelopeDTO);
  }

  async updateEnvelopeStatus(
    id: string,
    status: AuthorizationEnvelopeStatus,
  ): Promise<AuthorizationEnvelopeDTO> {
    const updated = await this.repo.updateEnvelopeStatus(id, status);
    return toEnvelopeDTO(updated);
  }
}

// --- Factory / test seam (no DI framework) --------------------------------

let repoOverride: EnvelopeRepository | null = null;
let serviceSingleton: EnvelopeService | null = null;

export function setEnvelopeRepository(repo: EnvelopeRepository | null): void {
  repoOverride = repo;
  serviceSingleton = null;
}

export function getEnvelopeService(): EnvelopeService {
  if (repoOverride) {
    return new EnvelopeService(repoOverride, getMerchantOfferService());
  }
  if (!serviceSingleton) {
    serviceSingleton = new EnvelopeService(
      new PrismaEnvelopeRepository(prisma),
      getMerchantOfferService(),
    );
  }
  return serviceSingleton;
}

export { InMemoryEnvelopeRepository };
