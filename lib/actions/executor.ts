import { getIntegrityService, type IntegrityService } from "@/lib/integrity/service";
import type { CombinedIntegrityReport } from "@/lib/integrity/types";
import { getMandateService, type MandateService } from "@/lib/mandate/service";
import type { MandateWithSnapshot } from "@/lib/mandate/types";
import { evaluatePolicy, isEvaluationComplete } from "@/lib/policy/engine";
import { DEFAULT_POLICY, type IntegrityPolicy, type PolicyResult } from "@/lib/policy/types";
import { getAuditService, type AuditService } from "@/lib/audit/service";
import { prisma } from "@/lib/db";
import {
  ActionGatewayError,
  getActionGateway,
  type RazorpayActionGateway,
} from "./gateway";
import {
  InMemoryActionRepository,
  PrismaActionRepository,
  type ActionRepository,
} from "./repository";
import {
  ActionError,
  actionForDecision,
  buildActionKey,
  type ActionReasonCode,
  type ActionResult,
  type ActionStatus,
  type ActionType,
} from "./types";

// M7-A — ActionExecutor: the ONLY layer allowed to invoke a provider mutation.
//
//   Integrity -> Policy -> PolicyDecision -> ActionExecutor -> ActionResult
//                                                  |
//                                                  v
//                                       RazorpayActionGateway (mock in M7-A)
//
// Guarantees:
//   * The action is derived deterministically from the policy decision. Neither
//     the client nor an LLM can choose or influence it.
//   * A PAUSE decision is executed ONLY after every prerequisite in
//     `evaluatePausePrerequisites` passes; otherwise NO action is taken and an
//     explicit reason code is recorded.
//   * An unavailable/incomplete integrity evaluation NEVER becomes ALLOW.
//   * Every step is written to the append-only audit trail.
//   * Repeated evaluation of the same (mandate, policy version, baseline
//     version, current version) cannot pause the same subscription twice.

export interface ActionExecutorDeps {
  mandates: MandateService;
  integrity: IntegrityService;
  audit: AuditService;
  actions: ActionRepository;
  // Instance or lazy resolver (so a gateway injected after construction wins).
  gateway: RazorpayActionGateway | (() => RazorpayActionGateway);
  policy?: IntegrityPolicy;
}

type PrerequisiteFailure = { reason: ActionReasonCode; detail: string };

export class ActionExecutor {
  private readonly policy: IntegrityPolicy;

  constructor(private readonly deps: ActionExecutorDeps) {
    this.policy = deps.policy ?? DEFAULT_POLICY;
  }

  private gateway(): RazorpayActionGateway {
    const g = this.deps.gateway;
    return typeof g === "function" ? g() : g;
  }

  // STEP 19 — the single server-side entry point: evaluate integrity, apply
  // policy, audit, determine the action, execute only through this executor,
  // record the result. There is no parameter that lets a caller pick an action.
  async evaluateAndAct(mandateId: string): Promise<ActionResult> {
    const auditEventIds: string[] = [];
    const audit = this.deps.audit;

    // 1. Mandate must exist (safety check #1). A missing mandate is a
    //    controlled error, never an implicit ALLOW.
    const mandate = await this.deps.mandates.getMandate(mandateId);
    if (!mandate) {
      throw new ActionError("Mandate not found.", 404);
    }

    // 2. Integrity evaluation. If it cannot run at all we stop here: no policy
    //    decision exists, so no action may be taken (STEP 16).
    let report: CombinedIntegrityReport;
    try {
      report = await this.deps.integrity.evaluateMandate(mandateId);
    } catch {
      const integrityEvent = await audit.record({
        mandateId,
        eventType: "INTEGRITY_EVALUATED",
        baselineOfferVersion: mandate.snapshot.offerVersion,
        status: "BLOCKED",
        reason: "INTEGRITY_EVALUATION_UNAVAILABLE",
        metadata: { integrityAvailable: false },
      });
      auditEventIds.push(integrityEvent.id);

      const detail =
        "Integrity evaluation was unavailable, so no policy decision exists. No action was taken and no subscription was paused; manual review is required.";
      const failEvent = await audit.record({
        mandateId,
        eventType: "ACTION_FAILED",
        baselineOfferVersion: mandate.snapshot.offerVersion,
        action: "NO_ACTION",
        status: "BLOCKED",
        reason: "INTEGRITY_EVALUATION_UNAVAILABLE",
        metadata: { detail },
      });
      auditEventIds.push(failEvent.id);

      return {
        mandateId,
        decision: null,
        intendedAction: null,
        action: "NO_ACTION",
        status: "BLOCKED",
        reason: "INTEGRITY_EVALUATION_UNAVAILABLE",
        detail,
        requiresManualReview: true,
        idempotent: false,
        policyVersion: this.policy.policyVersion,
        baselineOfferVersion: mandate.snapshot.offerVersion,
        currentOfferVersion: null,
        reasons: [],
        providerSubscriptionId: null,
        actionKey: null,
        evaluatedAt: new Date().toISOString(),
        auditEventIds,
      };
    }

    const complete = isEvaluationComplete(report);
    const integrityEvent = await audit.record({
      mandateId,
      eventType: "INTEGRITY_EVALUATED",
      baselineOfferVersion: report.baselineOfferVersion,
      currentOfferVersion: report.currentOfferVersion,
      status: complete ? "NOT_REQUIRED" : "BLOCKED",
      reason: complete ? null : "EVALUATION_INCOMPLETE",
      metadata: {
        overall: report.overall,
        semanticStatus: report.semanticStatus,
        evaluationComplete: complete,
        findingTypes: report.findings.map((f) => f.type),
        semanticFindingTypes: (report.semanticFindings ?? []).map((f) => f.type),
        generatedAt: report.generatedAt,
      },
    });
    auditEventIds.push(integrityEvent.id);

    // 3. Deterministic policy (M6). The executor never re-decides anything.
    const policyResult: PolicyResult = evaluatePolicy(report, this.policy);
    const intendedAction: ActionType = actionForDecision(policyResult.decision);
    const reasons = policyResult.reasons.map((r) => r.findingType);

    // Frozen decision context — copied into every audit row so the historical
    // record cannot change when the merchant publishes a new Offer version.
    const context = {
      mandateId,
      policyVersion: policyResult.policyVersion,
      baselineOfferVersion: report.baselineOfferVersion,
      currentOfferVersion: report.currentOfferVersion,
      decision: policyResult.decision,
      reasons,
    };

    // NO_ACTION needs nothing (NOT_REQUIRED); REVIEW_REQUIRED and
    // PAUSE_SUBSCRIPTION both start out PENDING.
    const initialStatus: ActionStatus =
      intendedAction === "NO_ACTION" ? "NOT_REQUIRED" : "PENDING";

    const policyEvent = await audit.record({
      mandateId,
      eventType: "POLICY_DECIDED",
      policyVersion: policyResult.policyVersion,
      baselineOfferVersion: report.baselineOfferVersion,
      currentOfferVersion: report.currentOfferVersion,
      decision: policyResult.decision,
      action: intendedAction,
      status: initialStatus,
      metadata: {
        reasons: policyResult.reasons.map((r) => ({
          findingType: r.findingType,
          dimension: r.dimension,
          severity: r.severity,
          explanation: r.explanation,
        })),
        evaluationComplete: complete,
        thresholds: {
          priceIncreaseReviewPercent: this.policy.priceIncreaseReviewPercent,
          priceIncreasePausePercent: this.policy.priceIncreasePausePercent,
          semanticPauseConfidence: this.policy.semanticPauseConfidence,
        },
        evaluatedAt: policyResult.evaluatedAt,
      },
    });
    auditEventIds.push(policyEvent.id);

    const base = {
      mandateId,
      decision: policyResult.decision,
      intendedAction,
      policyVersion: policyResult.policyVersion,
      baselineOfferVersion: report.baselineOfferVersion,
      currentOfferVersion: report.currentOfferVersion,
      reasons,
      evaluatedAt: policyResult.evaluatedAt,
    };

    // STEP 14 — ALLOW: no provider call at all.
    if (intendedAction === "NO_ACTION") {
      return {
        ...base,
        action: "NO_ACTION",
        status: "NOT_REQUIRED",
        reason: "NO_DEGRADATION_DETECTED",
        detail:
          "Policy returned ALLOW: no material degradation versus the authorized snapshot. No provider action was requested.",
        requiresManualReview: false,
        idempotent: false,
        providerSubscriptionId: null,
        actionKey: null,
        auditEventIds,
      };
    }

    // STEP 13 — REVIEW: an audited human-review requirement, never a pause.
    if (intendedAction === "REVIEW_REQUIRED") {
      return {
        ...base,
        action: "REVIEW_REQUIRED",
        status: "PENDING",
        reason: "MANUAL_REVIEW_REQUIRED",
        detail:
          "Policy returned REVIEW: the mandate is flagged for human review. No payment mutation was requested and the subscription was not paused.",
        requiresManualReview: true,
        idempotent: false,
        providerSubscriptionId: null,
        actionKey: null,
        auditEventIds,
      };
    }

    // ------------------------------------------------------------------
    // STEP 15 — PAUSE_SUBSCRIPTION. Validate EVERY prerequisite first.
    // ------------------------------------------------------------------
    const failure = evaluatePausePrerequisites({
      mandate,
      decision: policyResult.decision,
      evaluationComplete: complete,
    });

    if (failure) {
      const failEvent = await audit.record({
        mandateId,
        eventType: "ACTION_FAILED",
        policyVersion: context.policyVersion,
        baselineOfferVersion: context.baselineOfferVersion,
        currentOfferVersion: context.currentOfferVersion,
        decision: context.decision,
        action: "NO_ACTION",
        status: "BLOCKED",
        reason: failure.reason,
        metadata: {
          intendedAction,
          detail: failure.detail,
          providerCalled: false,
          reasons,
        },
      });
      auditEventIds.push(failEvent.id);

      return {
        ...base,
        action: "NO_ACTION",
        status: "BLOCKED",
        reason: failure.reason,
        detail: failure.detail,
        requiresManualReview: true,
        idempotent: false,
        providerSubscriptionId: null,
        actionKey: null,
        auditEventIds,
      };
    }

    // Prerequisite #3 guaranteed a usable provider id by this point.
    const providerSubscriptionId = mandate.razorpaySubscriptionId as string;

    const actionKey = buildActionKey({
      mandateId,
      policyVersion: context.policyVersion,
      baselineOfferVersion: context.baselineOfferVersion,
      currentOfferVersion: context.currentOfferVersion,
      action: intendedAction,
    });

    const requestedEvent = await audit.record({
      mandateId,
      eventType: "ACTION_REQUESTED",
      policyVersion: context.policyVersion,
      baselineOfferVersion: context.baselineOfferVersion,
      currentOfferVersion: context.currentOfferVersion,
      decision: context.decision,
      action: intendedAction,
      status: "PENDING",
      providerSubscriptionId,
      actionKey,
      metadata: { reasons },
    });
    auditEventIds.push(requestedEvent.id);

    // STEP 5 / safety check #6 — reserve the deterministic action key. The
    // database uniqueness constraint is the actual guarantee.
    const reservation = await this.deps.actions.reserve({
      mandateId,
      actionKey,
      action: intendedAction,
      decision: policyResult.decision,
      policyVersion: context.policyVersion,
      baselineOfferVersion: context.baselineOfferVersion,
      currentOfferVersion: context.currentOfferVersion,
      providerSubscriptionId,
    });

    if (!reservation.created) {
      const existing = reservation.record;

      if (existing.status === "SUCCEEDED") {
        // Already paused for exactly this decision context: do NOT call the
        // provider again.
        const detail =
          "This pause was already executed successfully for the same mandate, policy version and offer versions. No new provider call was made.";
        const dupEvent = await audit.record({
          mandateId,
          eventType: "ACTION_SUCCEEDED",
          policyVersion: context.policyVersion,
          baselineOfferVersion: context.baselineOfferVersion,
          currentOfferVersion: context.currentOfferVersion,
          decision: context.decision,
          action: intendedAction,
          status: "SUCCEEDED",
          reason: "ALREADY_EXECUTED",
          providerSubscriptionId,
          actionKey,
          metadata: { idempotent: true, providerCalled: false, detail },
        });
        auditEventIds.push(dupEvent.id);

        return {
          ...base,
          action: intendedAction,
          status: "SUCCEEDED",
          reason: "ALREADY_EXECUTED",
          detail,
          requiresManualReview: false,
          idempotent: true,
          providerSubscriptionId,
          actionKey,
          auditEventIds,
        };
      }

      if (existing.status === "PENDING") {
        // A synchronous attempt for this exact key is already in flight
        // (concurrent request). Never race a second provider mutation.
        const detail =
          "An action for this exact decision context is already in progress; no duplicate provider call was made.";
        const blockedEvent = await audit.record({
          mandateId,
          eventType: "ACTION_FAILED",
          policyVersion: context.policyVersion,
          baselineOfferVersion: context.baselineOfferVersion,
          currentOfferVersion: context.currentOfferVersion,
          decision: context.decision,
          action: "NO_ACTION",
          status: "BLOCKED",
          reason: "ACTION_IN_PROGRESS",
          providerSubscriptionId,
          actionKey,
          metadata: { intendedAction, providerCalled: false, detail },
        });
        auditEventIds.push(blockedEvent.id);

        return {
          ...base,
          action: "NO_ACTION",
          status: "BLOCKED",
          reason: "ACTION_IN_PROGRESS",
          detail,
          requiresManualReview: true,
          idempotent: true,
          providerSubscriptionId,
          actionKey,
          auditEventIds,
        };
      }
      // existing.status === "FAILED": a previous attempt did not pause anything,
      // so retrying is safe and is intentionally allowed.
    }

    // STEP 15 / STEP 11 — the single provider mutation, through the gateway.
    try {
      const result = await this.gateway().pauseSubscription(providerSubscriptionId);
      await this.deps.actions.markSucceeded(reservation.record.id, {
        providerSubscriptionId: result.providerSubscriptionId,
        reason: "PAUSE_EXECUTED",
      });

      const detail =
        "Policy returned PAUSE and all safety prerequisites passed; the subscription pause was executed through the action gateway.";
      const okEvent = await audit.record({
        mandateId,
        eventType: "ACTION_SUCCEEDED",
        policyVersion: context.policyVersion,
        baselineOfferVersion: context.baselineOfferVersion,
        currentOfferVersion: context.currentOfferVersion,
        decision: context.decision,
        action: intendedAction,
        status: "SUCCEEDED",
        reason: "PAUSE_EXECUTED",
        providerSubscriptionId: result.providerSubscriptionId,
        actionKey,
        metadata: {
          providerStatus: result.providerStatus,
          providerCalled: true,
          detail,
        },
      });
      auditEventIds.push(okEvent.id);

      return {
        ...base,
        action: intendedAction,
        status: "SUCCEEDED",
        reason: "PAUSE_EXECUTED",
        detail,
        requiresManualReview: false,
        idempotent: false,
        providerSubscriptionId: result.providerSubscriptionId,
        actionKey,
        auditEventIds,
      };
    } catch (err) {
      // Only a reason CODE is persisted; provider bodies and stack traces are
      // deliberately discarded.
      const code: ActionReasonCode =
        err instanceof ActionGatewayError && err.code === "PROVIDER_UNAVAILABLE"
          ? "PROVIDER_UNAVAILABLE"
          : "PROVIDER_REJECTED";

      await this.deps.actions.markFailed(reservation.record.id, { reason: code });

      const detail =
        code === "PROVIDER_UNAVAILABLE"
          ? "The action gateway was unavailable, so the pause did not take effect. The failure is recorded and manual review is required."
          : "The provider rejected the pause request, so the pause did not take effect. The failure is recorded and manual review is required.";

      const failEvent = await audit.record({
        mandateId,
        eventType: "ACTION_FAILED",
        policyVersion: context.policyVersion,
        baselineOfferVersion: context.baselineOfferVersion,
        currentOfferVersion: context.currentOfferVersion,
        decision: context.decision,
        action: intendedAction,
        status: "FAILED",
        reason: code,
        providerSubscriptionId,
        actionKey,
        metadata: { providerCalled: true, detail },
      });
      auditEventIds.push(failEvent.id);

      return {
        ...base,
        action: intendedAction,
        status: "FAILED",
        reason: code,
        detail,
        requiresManualReview: true,
        idempotent: false,
        providerSubscriptionId,
        actionKey,
        auditEventIds,
      };
    }
  }
}

// STEP 4 — the complete safety checklist for a PAUSE. Pure and independently
// testable; it NEVER guesses. (Check #1 "mandate exists" is enforced by the
// caller before this function can run; check #6 "not already executed" is the
// action-key reservation, which needs the database.)
export function evaluatePausePrerequisites(input: {
  mandate: MandateWithSnapshot;
  decision: string;
  evaluationComplete: boolean;
}): PrerequisiteFailure | null {
  const { mandate, decision, evaluationComplete } = input;

  // #4 — the decision must actually be PAUSE.
  if (decision !== "PAUSE") {
    return {
      reason: "MANUAL_REVIEW_REQUIRED",
      detail: `No pause is permitted for decision '${decision}'.`,
    };
  }

  // #2 — the mandate must still be an authorized mandate.
  if (mandate.status !== "AUTHORIZED") {
    return {
      reason: "MANDATE_NOT_AUTHORIZED",
      detail: `Mandate status is '${mandate.status}', not AUTHORIZED; no provider action was attempted.`,
    };
  }

  // #3 — a provider subscription id must exist. Never guess an id.
  const subscriptionId = mandate.razorpaySubscriptionId;
  if (!subscriptionId || subscriptionId.trim() === "") {
    return {
      reason: "MISSING_PROVIDER_SUBSCRIPTION_ID",
      detail:
        "The mandate has no provider subscription id, so a pause target cannot be determined; no provider action was attempted.",
    };
  }

  // #5 — the policy evaluation must be complete. An incomplete evaluation is
  // never upgraded to a pause and never downgraded to ALLOW (STEP 16).
  if (!evaluationComplete) {
    return {
      reason: "EVALUATION_INCOMPLETE",
      detail:
        "Integrity evaluation was incomplete (missing current offer, lineage mismatch, or unavailable semantic evaluation), so an automatic pause is not permitted; manual review is required.",
    };
  }

  return null;
}

// --- Factory / test seam (no DI framework) --------------------------------

let actionRepoOverride: ActionRepository | null = null;

export function setActionRepository(repo: ActionRepository | null): void {
  actionRepoOverride = repo;
}

export function getActionRepository(): ActionRepository {
  return actionRepoOverride ?? new PrismaActionRepository(prisma);
}

// Constructed fresh per call so the active test overrides (repositories,
// semantic provider, action gateway) are always honoured.
export function getActionExecutor(): ActionExecutor {
  return new ActionExecutor({
    mandates: getMandateService(),
    integrity: getIntegrityService(),
    audit: getAuditService(),
    actions: getActionRepository(),
    gateway: () => getActionGateway(),
    policy: DEFAULT_POLICY,
  });
}

export { InMemoryActionRepository };
