import { getGateway, type RazorpayGateway } from "@/lib/razorpay/gateway";
import { getMandateService, MandateService, MandateError } from "@/lib/mandate/service";
import { getAuditService, AuditService } from "@/lib/audit/service";
import type { OfferDetailDTO } from "@/lib/merchant/types";

export type FinancialMutationType =
  | "PROVISION_SUBSCRIPTION"
  | "PAUSE_SUBSCRIPTION"
  | "RESUME_SUBSCRIPTION"
  | "CANCEL_SUBSCRIPTION";

export type MutationStatus =
  | "SUCCEEDED"
  | "FAILED"
  | "BLOCKED"
  | "COMPENSATED";

export type MutationReasonCode =
  | "EXPLICIT_BUYER_AUTHORIZATION"
  | "POLICY_PAUSE_ENFORCEMENT"
  | "BUYER_REAUTHORIZATION_RESUME"
  | "ORPHAN_COMPENSATION_CLEANUP"
  | "MANDATE_NOT_AUTHORIZED"
  | "STALE_OFFER_VERSION"
  | "STALE_TERMS_HASH"
  | "SPENDING_LIMIT_EXCEEDED"
  | "ALREADY_EXECUTED"
  | "PROVIDER_REJECTED"
  | "PROVIDER_UNAVAILABLE";

export interface ProvisionSubscriptionPayload {
  offer: OfferDetailDTO;
  userId: string;
  expectedVersion?: number;
  expectedVersionHash?: string | null;
  spendingLimitPaise?: number;
  customerEmail?: string;
  customerContact?: string;
}

export interface LifecycleSubscriptionPayload {
  mandateId: string;
  providerSubscriptionId: string;
  reasonCode?: string;
}

export type MutationPayload =
  | { type: "PROVISION_SUBSCRIPTION"; data: ProvisionSubscriptionPayload }
  | { type: "PAUSE_SUBSCRIPTION"; data: LifecycleSubscriptionPayload }
  | { type: "RESUME_SUBSCRIPTION"; data: LifecycleSubscriptionPayload }
  | { type: "CANCEL_SUBSCRIPTION"; data: LifecycleSubscriptionPayload };

export interface MutationRequest {
  idempotencyKey?: string;
  mutation: MutationPayload;
  context: {
    source: "ai_buyer" | "integrity_policy" | "reauthorization" | "compensation";
    callerId: string;
  };
}

export interface MutationResult {
  mutationType: FinancialMutationType;
  status: MutationStatus;
  reason: MutationReasonCode;
  mandateId?: string;
  providerSubscriptionId?: string;
  shortUrl?: string | null;
  snapshot?: Record<string, unknown>;
  idempotent: boolean;
  executedAt: string;
  auditEventId?: string;
}

/**
 * CommerceMutationExecutor
 *
 * The unified, policy-gated provider mutation boundary for all financial operations.
 *
 * Invariant:
 * No application or AI domain service may directly invoke Razorpay provider mutations.
 * All mutations cross:
 * Domain / Policy -> CommerceMutationExecutor -> RazorpayGateway -> Razorpay
 */
export class CommerceMutationExecutor {
  private gateway: RazorpayGateway;
  private mandates: MandateService;
  private audit: AuditService;

  constructor(
    gateway?: RazorpayGateway,
    mandates?: MandateService,
    audit?: AuditService,
  ) {
    this.gateway = gateway || getGateway();
    this.mandates = mandates || getMandateService();
    this.audit = audit || getAuditService();
  }

  async execute(request: MutationRequest): Promise<MutationResult> {
    switch (request.mutation.type) {
      case "PROVISION_SUBSCRIPTION":
        return this.executeProvision(
          request.mutation.data,
          request.idempotencyKey,
          request.context,
        );

      case "PAUSE_SUBSCRIPTION":
        return this.executePause(request.mutation.data);

      case "RESUME_SUBSCRIPTION":
        return this.executeResume(request.mutation.data);

      case "CANCEL_SUBSCRIPTION":
        return this.executeCancel(request.mutation.data);

    }
  }

  private async executeProvision(
    data: ProvisionSubscriptionPayload,
    idempotencyKey?: string,
    context?: MutationRequest["context"],
  ): Promise<MutationResult> {
    // 1. Idempotency Check BEFORE any Provider Calls
    if (idempotencyKey) {
      const existing = await this.mandates.getMandateByIdempotencyKey(idempotencyKey);
      if (existing) {
        return {
          mutationType: "PROVISION_SUBSCRIPTION",
          status: "SUCCEEDED",
          reason: "ALREADY_EXECUTED",
          mandateId: existing.id,
          providerSubscriptionId: existing.razorpaySubscriptionId ?? undefined,
          shortUrl: null,
          snapshot: {
            offerVersion: existing.snapshot.offerVersion,
            productName: existing.snapshot.productName,
            offerName: existing.snapshot.offerName,
            price: existing.snapshot.price,
            currency: existing.snapshot.currency,
            billingInterval: existing.snapshot.billingInterval,
            duration: existing.snapshot.duration,
            entitlementKeys: existing.snapshot.entitlementKeys,
            refundWindowDays: existing.snapshot.refundWindowDays,
          },
          idempotent: true,
          executedAt: existing.createdAt.toISOString(),
        };
      }
    }

    const offer = data.offer;
    if (offer.availability !== "ACTIVE") {
      throw new MandateError("Offer not found or not active.", 404);
    }

    // 2. Stale Preview Protection
    if (data.expectedVersion !== undefined && offer.version !== data.expectedVersion) {
      throw new MandateError(
        `Offer version has changed from v${data.expectedVersion} to v${offer.version} since preview (stale preview). Please review the updated offer before authorizing.`,
        409,
      );
    }

    if (
      data.expectedVersionHash !== undefined &&
      offer.versionHash &&
      offer.versionHash !== data.expectedVersionHash
    ) {
      throw new MandateError(
        "Offer terms have been modified by the merchant since preview (stale terms hash). Please review the updated offer before authorizing.",
        409,
      );
    }

    // 3. Spending Limit Validation
    if (data.spendingLimitPaise && offer.price > data.spendingLimitPaise) {
      throw new MandateError(
        `Offer price ₹${(offer.price / 100).toLocaleString("en-IN")} exceeds authorized spending limit of ₹${(
          data.spendingLimitPaise / 100
        ).toLocaleString("en-IN")}.`,
        422,
      );
    }

    // 4. Provider Provisioning with Automatic Compensation
    let createdSubscriptionId: string | null = null;
    try {
      const intervalMap: Record<string, "daily" | "weekly" | "monthly" | "yearly"> = {
        daily: "daily",
        weekly: "weekly",
        monthly: "monthly",
        yearly: "yearly",
      };
      const interval = intervalMap[offer.billingInterval.toLowerCase()] || "monthly";

      const plan = await this.gateway.createPlan({
        name: `${offer.name} (v${offer.version})`,
        amount: offer.price,
        currency: offer.currency,
        interval,
        intervalCount: 1,
      });

      const totalCount = Math.max(1, Math.round(offer.duration / 30)) || 12;
      const subscription = await this.gateway.createSubscription({
        planId: plan.id,
        totalCount,
        customerNotify: true,
        notes: {
          source: "mandateguard-commerce-executor",
          offerId: offer.id,
          offerVersion: String(offer.version),
          callerId: context?.callerId || "buyer_service",
        },
      });
      createdSubscriptionId = subscription.id;

      // 5. Freeze Mandate + AuthorizedOfferSnapshot on Server
      const authResult = await this.mandates.createMandateAuthorization({
        userId: data.userId,
        offerId: offer.id,
        razorpaySubscriptionId: subscription.id,
        idempotencyKey,
      });

      // 6. Append-Only Audit Trail
      let auditEventId: string | undefined;
      try {
        const event = await this.audit.record({
          mandateId: authResult.mandateId,
          eventType: "ACTION_SUCCEEDED",
          baselineOfferVersion: offer.version,
          action: "NO_ACTION",
          status: "SUCCEEDED",
          reason: "EXPLICIT_BUYER_AUTHORIZATION",
          metadata: {
            providerSubscriptionId: subscription.id,
            planId: plan.id,
            price: offer.price,
            currency: offer.currency,
            source: context?.source || "ai_buyer",
          },
        });
        auditEventId = event.id;
      } catch (auditErr) {
        console.warn("[Commerce Mutation Executor] Non-fatal audit log warning:", auditErr);
      }


      return {
        mutationType: "PROVISION_SUBSCRIPTION",
        status: "SUCCEEDED",
        reason: "EXPLICIT_BUYER_AUTHORIZATION",
        mandateId: authResult.mandateId,
        providerSubscriptionId: subscription.id,
        shortUrl: subscription.shortUrl ?? null,
        snapshot: authResult.snapshot,
        idempotent: false,
        executedAt: new Date().toISOString(),
        auditEventId,
      };
    } catch (err) {
      // 7. Partial Failure Compensation
      if (createdSubscriptionId) {
        try {
          await this.gateway.cancelSubscription(createdSubscriptionId);
          console.info(
            `[Commerce Mutation Compensation] Cancelled orphaned Razorpay subscription ${createdSubscriptionId} after authorization failure.`,
          );
        } catch (compErr) {
          console.error(
            `[Commerce Mutation Compensation Failed] Failed to cancel orphaned subscription ${createdSubscriptionId}`,
            compErr,
          );
        }
      }
      throw err;
    }
  }

  private async executePause(
    data: LifecycleSubscriptionPayload,
  ): Promise<MutationResult> {
    const res = await this.gateway.pauseSubscription(data.providerSubscriptionId);
    return {
      mutationType: "PAUSE_SUBSCRIPTION",
      status: "SUCCEEDED",
      reason: "POLICY_PAUSE_ENFORCEMENT",
      mandateId: data.mandateId,
      providerSubscriptionId: res.id,
      idempotent: false,
      executedAt: new Date().toISOString(),
    };
  }

  private async executeResume(
    data: LifecycleSubscriptionPayload,
  ): Promise<MutationResult> {
    const res = await this.gateway.resumeSubscription(data.providerSubscriptionId);
    return {
      mutationType: "RESUME_SUBSCRIPTION",
      status: "SUCCEEDED",
      reason: "BUYER_REAUTHORIZATION_RESUME",
      mandateId: data.mandateId,
      providerSubscriptionId: res.id,
      idempotent: false,
      executedAt: new Date().toISOString(),
    };
  }

  private async executeCancel(
    data: LifecycleSubscriptionPayload,
  ): Promise<MutationResult> {
    const res = await this.gateway.cancelSubscription(data.providerSubscriptionId);
    return {
      mutationType: "CANCEL_SUBSCRIPTION",
      status: "COMPENSATED",
      reason: "ORPHAN_COMPENSATION_CLEANUP",
      mandateId: data.mandateId,
      providerSubscriptionId: res.id,
      idempotent: false,
      executedAt: new Date().toISOString(),
    };
  }


}

let defaultCommerceMutationExecutor: CommerceMutationExecutor | null = null;

export function getCommerceMutationExecutor(): CommerceMutationExecutor {
  if (!defaultCommerceMutationExecutor) {
    defaultCommerceMutationExecutor = new CommerceMutationExecutor();
  }
  return defaultCommerceMutationExecutor;
}

export function setCommerceMutationExecutor(
  executor: CommerceMutationExecutor | null,
): void {
  defaultCommerceMutationExecutor = executor;
}
