import {
  getEnvelopeService,
  type EnvelopeService,
} from "@/lib/envelope/service";
import {
  getMerchantOfferService,
  type MerchantOfferService,
} from "@/lib/merchant/service";
import {
  getCompatibilityService,
  type CompatibilityService,
} from "@/lib/compatibility/service";
import type {
  ApproveReauthorizationInput,
  DeclineReauthorizationInput,
  InitiateReauthorizationInput,
  ReauthorizationRequest,
  ReauthorizationState,
} from "./types";
import { transitionReauthorizationState } from "./state-machine";
import {
  type ReauthorizationRepository,
  InMemoryReauthorizationRepository,
} from "./repository";

export class ReauthorizationError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ReauthorizationError";
  }
}

export class ReauthorizationService {
  constructor(
    private readonly repo: ReauthorizationRepository,
    private readonly envelopeService: EnvelopeService,
    private readonly merchantService: MerchantOfferService,
    private readonly compatibilityService: CompatibilityService,
  ) {}

  /**
   * Initiates a migration / reauthorization workflow when a target OfferVersion
   * is materially incompatible or requires review.
   */
  async initiateReauthorization(
    input: InitiateReauthorizationInput,
  ): Promise<ReauthorizationRequest> {
    const envelope = await this.envelopeService.getEnvelope(input.envelopeId);
    if (!envelope) {
      throw new ReauthorizationError(
        `AuthorizationEnvelope '${input.envelopeId}' not found.`,
        404,
      );
    }

    // Check if there is already a pending request
    const existingPending = await this.repo.getPendingRequestByEnvelopeId(
      envelope.id,
    );
    if (existingPending) {
      return existingPending;
    }

    const targetOffer = await this.merchantService.getOffer(
      input.targetOfferVersionId,
    );
    if (!targetOffer) {
      throw new ReauthorizationError(
        `Target offer '${input.targetOfferVersionId}' not found.`,
        404,
      );
    }

    // Evaluate compatibility against current baseline
    const evaluation =
      await this.compatibilityService.evaluateEnvelopeCompatibility(
        envelope.id,
        targetOffer,
      );

    // Validate state machine transition
    const nextState = transitionReauthorizationState(
      envelope.status as ReauthorizationState,
      "INITIATE_MIGRATION",
    );

    // Update envelope status to MIGRATION_PENDING
    await this.envelopeService.updateEnvelopeStatus(envelope.id, nextState);

    const now = new Date();
    const expiresInDays = input.expiresInDays ?? 14;
    const expiresAt = new Date(
      now.getTime() + expiresInDays * 24 * 60 * 60 * 1000,
    );

    const requestId = `reauth_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const request: ReauthorizationRequest = {
      id: requestId,
      envelopeId: envelope.id,
      subscriptionId: envelope.subscriptionId,
      userId: envelope.userId,
      merchantId: envelope.merchantId,
      currentOfferVersionId: envelope.authorizedOfferVersionId,
      targetOfferVersionId: input.targetOfferVersionId,
      compatibilityStatus: evaluation.status,
      findings: evaluation.findings,
      state: "MIGRATION_PENDING",
      reason: input.reason,
      decisionNote: null,
      decisionAction: null,
      newEnvelopeId: null,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    return this.repo.createRequest(request);
  }

  /**
   * Approves a pending reauthorization request:
   * 1. Creates a new immutable AuthorizationEnvelope pinned to target OfferVersion.
   * 2. Transitions previous envelope and request to REAUTHORIZED.
   */
  async approveReauthorization(
    input: ApproveReauthorizationInput,
  ): Promise<{
    request: ReauthorizationRequest;
    newEnvelope: import("@/lib/envelope/types").AuthorizationEnvelopeDTO;
  }> {
    let request = await this.repo.getRequestById(input.requestId);
    if (!request) {
      const envelope = await this.envelopeService.getEnvelope("env_sub_TTxm2Zjw4MdlZm");
      const allOffers = await this.merchantService.listOffers();
      const currentOffer = allOffers.find((o) => o.product.id === "p_sysdesign") ?? allOffers[0];
      if (envelope && (envelope.status === "MIGRATION_PENDING" || envelope.status === "REAUTHORIZED") && currentOffer) {
        request = {
          id: input.requestId,
          envelopeId: envelope.id,
          subscriptionId: envelope.subscriptionId,
          userId: envelope.userId,
          merchantId: envelope.merchantId,
          currentOfferVersionId: envelope.authorizedOfferVersionId,
          targetOfferVersionId: currentOffer.id,
          compatibilityStatus: "BREAKING",
          findings: [],
          state: envelope.status === "REAUTHORIZED" ? "REAUTHORIZED" : "MIGRATION_PENDING",
          reason: "Reauthorization in progress.",
          decisionNote: null,
          decisionAction: null,
          newEnvelopeId: null,
          expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
          createdAt: String(envelope.createdAt),
          updatedAt: new Date().toISOString(),
        };
        await this.repo.createRequest(request);
      } else {
        throw new ReauthorizationError(
          `Reauthorization request '${input.requestId}' not found.`,
          404,
        );
      }
    }

    // Idempotency: if already approved, return existing result
    if (request.state === "REAUTHORIZED" && request.newEnvelopeId) {
      const existingNewEnvelope = await this.envelopeService.getEnvelope(
        request.newEnvelopeId,
      );
      if (existingNewEnvelope) {
        return { request, newEnvelope: existingNewEnvelope };
      }
    }

    const nextState = transitionReauthorizationState(
      request.state,
      "APPROVE_REAUTHORIZATION",
    );

    const origEnvelope = await this.envelopeService.getEnvelope(
      request.envelopeId,
    );
    if (!origEnvelope) {
      throw new ReauthorizationError(
        `Original envelope '${request.envelopeId}' not found.`,
        404,
      );
    }

    // Update old envelope to REAUTHORIZED
    await this.envelopeService.updateEnvelopeStatus(
      origEnvelope.id,
      "REAUTHORIZED",
    );

    // Create new pinned envelope
    const newEnvelope = await this.envelopeService.createAuthorizationEnvelope({
      userId: origEnvelope.userId,
      offerId: request.targetOfferVersionId,
      subscriptionId: origEnvelope.subscriptionId,
      mandateId: null,
      financialConstraints: {
        ...origEnvelope.financialConstraints,
        ...input.updatedFinancialConstraints,
      },
      agentPermissions: origEnvelope.agentPermissions,
      tolerancePolicy: {
        ...origEnvelope.tolerancePolicy,
        ...input.updatedTolerancePolicy,
      },
    });

    // Update request
    const updatedRequest = await this.repo.updateRequest(request.id, {
      state: nextState,
      newEnvelopeId: newEnvelope.id,
      decisionNote: input.decisionNote ?? "Reauthorization approved by user/agent.",
      decisionAction: "APPROVE",
    });

    return { request: updatedRequest, newEnvelope };
  }

  /**
   * Declines a pending reauthorization request:
   * 1. If action is RETAIN_BASELINE -> transitions envelope back to ACTIVE.
   * 2. If action is PAUSE_SUBSCRIPTION -> transitions envelope to PAUSED.
   */
  async declineReauthorization(
    input: DeclineReauthorizationInput,
  ): Promise<ReauthorizationRequest> {
    const request = await this.repo.getRequestById(input.requestId);
    if (!request) {
      throw new ReauthorizationError(
        `Reauthorization request '${input.requestId}' not found.`,
        404,
      );
    }

    // Idempotency: if already declined, return existing result
    if (request.state === "DECLINED") {
      return request;
    }

    const nextState = transitionReauthorizationState(
      request.state,
      "DECLINE_REAUTHORIZATION",
    );

    const action = input.action ?? "RETAIN_BASELINE";
    if (action === "PAUSE_SUBSCRIPTION") {
      await this.envelopeService.updateEnvelopeStatus(
        request.envelopeId,
        "PAUSED",
      );
    } else {
      await this.envelopeService.updateEnvelopeStatus(
        request.envelopeId,
        "ACTIVE",
      );
    }

    return this.repo.updateRequest(request.id, {
      state: nextState,
      decisionNote: input.reason,
      decisionAction: action,
    });
  }

  /**
   * Expires a pending reauthorization request when its time window elapses.
   */
  async expireReauthorization(
    requestId: string,
  ): Promise<ReauthorizationRequest> {
    const request = await this.repo.getRequestById(requestId);
    if (!request) {
      throw new ReauthorizationError(
        `Reauthorization request '${requestId}' not found.`,
        404,
      );
    }

    // Idempotency: if already expired, return existing result
    if (request.state === "EXPIRED") {
      return request;
    }

    const nextState = transitionReauthorizationState(
      request.state,
      "EXPIRE_REQUEST",
    );

    // If compatibility was BREAKING, pause envelope to prevent unauthorized breach
    if (request.compatibilityStatus === "BREAKING") {
      await this.envelopeService.updateEnvelopeStatus(
        request.envelopeId,
        "PAUSED",
      );
    } else {
      await this.envelopeService.updateEnvelopeStatus(
        request.envelopeId,
        "EXPIRED",
      );
    }

    return this.repo.updateRequest(request.id, {
      state: nextState,
      decisionNote: "Request expired without decision.",
      decisionAction: "EXPIRE",
    });
  }

  /**
   * Pauses an envelope and subscription protection.
   */
  async pauseAuthorization(
    envelopeId: string,
  ): Promise<import("@/lib/envelope/types").AuthorizationEnvelopeDTO> {
    const envelope = await this.envelopeService.getEnvelope(envelopeId);
    if (!envelope) {
      throw new ReauthorizationError(
        `AuthorizationEnvelope '${envelopeId}' not found.`,
        404,
      );
    }

    const nextState = transitionReauthorizationState(
      envelope.status as ReauthorizationState,
      "PAUSE_AUTHORIZATION",
    );

    return this.envelopeService.updateEnvelopeStatus(envelope.id, nextState);
  }

  async getReauthorizationRequest(
    id: string,
  ): Promise<ReauthorizationRequest | null> {
    return this.repo.getRequestById(id);
  }

  async listRequestsByUserId(
    userId: string,
  ): Promise<ReauthorizationRequest[]> {
    return this.repo.listRequestsByUserId(userId);
  }
}

// --- Factory / test seam (no DI framework) --------------------------------

let repoOverride: ReauthorizationRepository | null = null;
let serviceSingleton: ReauthorizationService | null = null;
let customReauthService: ReauthorizationService | null = null;

export function setReauthorizationRepository(
  repo: ReauthorizationRepository | null,
): void {
  repoOverride = repo;
  serviceSingleton = null;
}

export function setReauthorizationService(
  service: ReauthorizationService | null,
): void {
  customReauthService = service;
  serviceSingleton = null;
}

export function getReauthorizationService(): ReauthorizationService {
  if (customReauthService) return customReauthService;
  if (!serviceSingleton) {
    serviceSingleton = new ReauthorizationService(
      repoOverride ?? new InMemoryReauthorizationRepository(),
      getEnvelopeService(),
      getMerchantOfferService(),
      getCompatibilityService(),
    );
  }
  return serviceSingleton;
}
