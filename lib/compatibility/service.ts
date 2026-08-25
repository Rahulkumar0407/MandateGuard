import {
  getEnvelopeService,
  type EnvelopeService,
} from "@/lib/envelope/service";
import {
  getMerchantOfferService,
  type MerchantOfferService,
} from "@/lib/merchant/service";
import type {
  CompatibilityEvaluationResult,
  CompatibilityFinding,
  CompatibilityStatus,
  ProposedOfferInput,
} from "./types";
import { evaluateDeterministicCompatibility } from "./engine";
import { evaluateSemanticAdvisory } from "./semantic-advisory";
import type { OfferDetailDTO } from "@/lib/merchant/types";

export class CompatibilityError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "CompatibilityError";
  }
}

function determineMergedStatus(findings: CompatibilityFinding[]): CompatibilityStatus {
  if (findings.some((f) => f.severity === "CRITICAL")) {
    return "BREAKING";
  }
  if (findings.some((f) => f.severity === "WARNING")) {
    return "REVIEW";
  }
  return "COMPATIBLE";
}

function generateMergedSummary(
  status: CompatibilityStatus,
  findings: CompatibilityFinding[],
): string {
  const critical = findings.filter((f) => f.severity === "CRITICAL");
  const warnings = findings.filter((f) => f.severity === "WARNING");

  if (status === "BREAKING") {
    const reasons = critical.map((c) => c.message).join(" ");
    return `BREAKING: Proposed offer breaches authorized commercial envelope constraints. ${reasons}`;
  }
  if (status === "REVIEW") {
    const reasons = warnings.map((w) => w.message).join(" ");
    return `REVIEW REQUIRED: Proposed offer contains commercial changes exceeding automated tolerance. ${reasons}`;
  }
  return "COMPATIBLE: Proposed offer conforms fully to the authorized commercial envelope and tolerances.";
}

export class CompatibilityService {
  constructor(
    private readonly envelopeService: EnvelopeService,
    private readonly merchantService: MerchantOfferService,
  ) {}

  /**
   * Evaluates a proposed OfferVersion against a specific AuthorizationEnvelope.
   * Baseline is always the frozen baseline commitments in the envelope.
   */
  async evaluateEnvelopeCompatibility(
    envelopeId: string,
    proposedOffer: ProposedOfferInput | OfferDetailDTO,
  ): Promise<CompatibilityEvaluationResult> {
    const envelope = await this.envelopeService.getEnvelope(envelopeId);
    if (!envelope) {
      throw new CompatibilityError("Authorization envelope not found.", 404);
    }

    const proposed: ProposedOfferInput = {
      id: proposedOffer.id,
      productId:
        "product" in proposedOffer
          ? (proposedOffer as OfferDetailDTO).product.id
          : proposedOffer.productId,
      version: proposedOffer.version,
      name: proposedOffer.name,
      description: proposedOffer.description,
      price: proposedOffer.price,
      currency: proposedOffer.currency,
      billingInterval: proposedOffer.billingInterval,
      duration: proposedOffer.duration,
      entitlementKeys: proposedOffer.entitlementKeys,
      refundWindowDays:
        "refundPolicy" in proposedOffer
          ? (proposedOffer as OfferDetailDTO).refundPolicy.windowDays
          : (proposedOffer as ProposedOfferInput).refundWindowDays,
      supportTerms: proposedOffer.supportTerms,
      semanticTerms: proposedOffer.semanticTerms,
      structuredCommitments: proposedOffer.structuredCommitments,
      versionHash: proposedOffer.versionHash,
    };

    // 1. Deterministic Core Evaluation
    const deterministic = evaluateDeterministicCompatibility({
      envelope,
      proposed,
    });

    // 2. Constrained Semantic Advisory
    const semanticFindings = await evaluateSemanticAdvisory({
      envelope,
      proposed,
    });

    const allFindings: CompatibilityFinding[] = [
      ...deterministic.findings,
      ...semanticFindings,
    ];

    const overallStatus = determineMergedStatus(allFindings);
    const summary = generateMergedSummary(overallStatus, allFindings);

    return {
      envelopeId: envelope.id,
      authorizedOfferVersionId: envelope.authorizedOfferVersionId,
      authorizedOfferHash: envelope.authorizedOfferHash,
      proposedOfferVersionId: proposed.id,
      proposedOfferVersion: proposed.version,
      proposedOfferHash: proposed.versionHash ?? null,
      status: overallStatus,
      authorizationPolicyHash: envelope.authorizationPolicyHash,
      findings: allFindings,
      summary,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Evaluates the active authorization envelope of a mandate against a proposed offer
   * (or against the latest active offer of that lineage if omitted).
   */
  async evaluateMandateCompatibility(
    mandateId: string,
    proposedOffer?: ProposedOfferInput | OfferDetailDTO,
  ): Promise<CompatibilityEvaluationResult> {
    const envelope = await this.envelopeService.getEnvelopeByMandateId(mandateId);
    if (!envelope) {
      throw new CompatibilityError(
        `No authorization envelope found for mandate '${mandateId}'.`,
        404,
      );
    }

    let targetOffer: ProposedOfferInput | OfferDetailDTO;

    if (proposedOffer) {
      targetOffer = proposedOffer;
    } else {
      const offers = await this.merchantService.listOffers();
      const lineageOffers = offers.filter(
        (o) => o.product.merchantId === envelope.merchantId,
      );
      if (lineageOffers.length === 0) {
        throw new CompatibilityError(
          "No active merchant offers available for comparison.",
          404,
        );
      }
      targetOffer = lineageOffers.reduce((best, o) =>
        o.version > best.version ? o : best,
      );
    }

    return this.evaluateEnvelopeCompatibility(envelope.id, targetOffer);
  }

  /**
   * Agent-facing compatibility and authorization query.
   * Answers:
   * 1. Is the current offer compatible with the subscriber's authorized baseline?
   * 2. Is the agent authorized to proceed autonomously?
   * 3. What action is required before proceeding?
   */
  async getAgentCompatibilityStatus(
    subscriptionOrMandateOrEnvelopeId: string,
  ): Promise<import("./types").AgentCompatibilityStatus> {
    // 1. Resolve AuthorizationEnvelope
    let envelope =
      await this.envelopeService.getEnvelopeBySubscriptionId(
        subscriptionOrMandateOrEnvelopeId,
      );

    if (!envelope) {
      envelope = await this.envelopeService.getEnvelopeByMandateId(
        subscriptionOrMandateOrEnvelopeId,
      );
    }

    if (!envelope) {
      envelope = await this.envelopeService.getEnvelope(
        subscriptionOrMandateOrEnvelopeId,
      );
    }

    if (!envelope) {
      throw new CompatibilityError(
        `Subscription or authorization envelope '${subscriptionOrMandateOrEnvelopeId}' not found.`,
        404,
      );
    }

    // 2. Fetch current active offer for the product lineage
    const offers = await this.merchantService.listOffers();
    const lineageOffers = offers.filter(
      (o) => o.product.merchantId === envelope!.merchantId,
    );

    if (lineageOffers.length === 0) {
      throw new CompatibilityError(
        "No active merchant offers found for comparison.",
        404,
      );
    }

    const currentOffer = lineageOffers.reduce((best, o) =>
      o.version > best.version ? o : best,
    );

    // 3. Evaluate compatibility
    const evaluation = await this.evaluateEnvelopeCompatibility(
      envelope.id,
      currentOffer,
    );

    // 4. Derive autonomous permission
    const canProceedAutonomously =
      evaluation.status === "COMPATIBLE" &&
      envelope.agentPermissions.canAutoApproveMinorChanges;

    // 5. Derive required action
    let requiredAction: "NONE" | "REVIEW" | "REAUTHORIZATION" = "NONE";
    if (evaluation.status === "BREAKING") {
      requiredAction = "REAUTHORIZATION";
    } else if (evaluation.status === "REVIEW") {
      requiredAction = "REVIEW";
    }

    const baselineOffer = await this.merchantService.getOffer(
      envelope.authorizedOfferVersionId,
    );

    return {
      compatibility: evaluation.status,
      authorization: {
        canProceedAutonomously,
        delegatedBudgetLimit: envelope.financialConstraints.maxPricePaise,
        authorizedMonthlySpend: envelope.baselineCommitments.price,
      },
      requiredAction,
      subscriptionId:
        envelope.subscriptionId ?? subscriptionOrMandateOrEnvelopeId,
      authorizedBaseline: {
        offerVersionId: envelope.authorizedOfferVersionId,
        version: baselineOffer?.version ?? 1,
        versionHash: envelope.authorizedOfferHash,
      },
      currentOffer: {
        offerVersionId: currentOffer.id,
        version: currentOffer.version,
        versionHash: currentOffer.versionHash ?? "",
      },
      reasons: evaluation.findings,
      evaluatedAt: evaluation.evaluatedAt,
    };
  }
}

// --- Factory / test seam (no DI framework) --------------------------------

let repoEnvelopeServiceOverride: EnvelopeService | null = null;
let repoMerchantServiceOverride: MerchantOfferService | null = null;
let serviceSingleton: CompatibilityService | null = null;

export function setCompatibilityServices(
  envelopeService: EnvelopeService | null,
  merchantService: MerchantOfferService | null,
): void {
  repoEnvelopeServiceOverride = envelopeService;
  repoMerchantServiceOverride = merchantService;
  serviceSingleton = null;
}

export function getCompatibilityService(): CompatibilityService {
  if (repoEnvelopeServiceOverride && repoMerchantServiceOverride) {
    return new CompatibilityService(
      repoEnvelopeServiceOverride,
      repoMerchantServiceOverride,
    );
  }
  if (!serviceSingleton) {
    serviceSingleton = new CompatibilityService(
      getEnvelopeService(),
      getMerchantOfferService(),
    );
  }
  return serviceSingleton;
}
