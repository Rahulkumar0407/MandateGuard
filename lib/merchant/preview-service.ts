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
  ImpactPreviewInput,
  MerchantImpactPreview,
  SubscriberImpactEvaluation,
} from "./preview-types";
import {
  computeOfferVersionHash,
  extractStructuredCommitmentCandidate,
  normalizeStructuredCommitments,
  type StructuredCommitments,
} from "./structured-commitments";
import type {
  CompatibilityFinding,
  CompatibilityStatus,
  ProposedOfferInput,
} from "@/lib/compatibility/types";

export class MerchantPreviewError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "MerchantPreviewError";
  }
}

export class MerchantPreviewService {
  constructor(
    private readonly envelopeService: EnvelopeService,
    private readonly merchantService: MerchantOfferService,
    private readonly compatibilityService: CompatibilityService,
  ) {}

  /**
   * Generates a pre-publish impact preview for a proposed OfferVersion.
   * ANALYSIS ONLY: Zero state mutations or external provider interactions.
   */
  async generateImpactPreview(
    input: ImpactPreviewInput,
  ): Promise<MerchantImpactPreview> {
    // 1. Resolve product & active offers to determine prospective version number
    const allOffers = await this.merchantService.listOffers();
    const productOffers = allOffers.filter(
      (o) => o.product.id === input.productId,
    );

    let merchantId: string;
    let productName: string;

    if (productOffers.length > 0) {
      merchantId = productOffers[0].product.merchantId;
      productName = productOffers[0].product.name;
    } else {
      // Check products discovery list
      const products = await this.merchantService.listProducts();
      const product = products.find((p) => p.id === input.productId);
      if (!product) {
        throw new MerchantPreviewError(
          `Product '${input.productId}' not found.`,
          404,
        );
      }
      const profile = await this.merchantService.getMerchantProfile();
      if (!profile) {
        throw new MerchantPreviewError("Merchant profile not found.", 404);
      }
      merchantId = profile.merchant.id;
      productName = product.name;
    }

    const maxVersion = productOffers.reduce(
      (max, o) => Math.max(max, o.version),
      0,
    );
    const proposedVersion = maxVersion + 1;

    // 2. Resolve commitments & compute prospective versionHash
    let structuredCommitments: StructuredCommitments;
    if (input.structuredCommitments) {
      structuredCommitments = normalizeStructuredCommitments(
        input.structuredCommitments,
      );
    } else {
      const candidate = extractStructuredCommitmentCandidate({
        description: input.description,
        supportTerms: input.supportTerms,
        semanticTerms: input.semanticTerms,
        entitlementKeys: input.entitlementKeys,
        refundWindowDays: input.refundWindowDays,
      });
      structuredCommitments = candidate.commitments;
    }

    const proposedOfferHash = computeOfferVersionHash({
      productId: input.productId,
      version: proposedVersion,
      price: input.price,
      currency: input.currency ?? "INR",
      billingInterval: input.billingInterval ?? "monthly",
      duration: input.duration,
      refundWindowDays: input.refundWindowDays,
      structuredCommitments,
    });

    const proposedOffer: ProposedOfferInput = {
      productId: input.productId,
      version: proposedVersion,
      name: input.name,
      description: input.description,
      price: input.price,
      currency: input.currency ?? "INR",
      billingInterval: input.billingInterval ?? "monthly",
      duration: input.duration,
      entitlementKeys: input.entitlementKeys,
      refundWindowDays: input.refundWindowDays,
      supportTerms: input.supportTerms,
      semanticTerms: input.semanticTerms,
      structuredCommitments,
      versionHash: proposedOfferHash,
    };

    // 3. Find active AuthorizationEnvelopes for this merchant & product lineage
    const activeEnvelopes =
      await this.envelopeService.listActiveEnvelopesByMerchant(merchantId);

    const productOfferIds = new Set(productOffers.map((o) => o.id));
    const productBase = input.productId.replace(/^p_/, "");
    const lineageEnvelopes = activeEnvelopes.filter(
      (env) =>
        productOfferIds.has(env.authorizedOfferVersionId) ||
        env.authorizedOfferVersionId.includes(productBase) ||
        productOffers.length === 0,
    );

    // 4. Run compatibility evaluation with unique tuple caching
    const evaluationCache = new Map<
      string,
      { status: CompatibilityStatus; findings: CompatibilityFinding[] }
    >();

    const subscriberEvaluations: SubscriberImpactEvaluation[] = [];

    for (const envelope of lineageEnvelopes) {
      const tupleKey = `${envelope.authorizedOfferHash}:${proposedOfferHash}:${envelope.authorizationPolicyHash}`;

      let evalData = evaluationCache.get(tupleKey);
      if (!evalData) {
        const result =
          await this.compatibilityService.evaluateEnvelopeCompatibility(
            envelope.id,
            proposedOffer,
          );
        evalData = {
          status: result.status,
          findings: result.findings,
        };
        evaluationCache.set(tupleKey, evalData);
      }

      let requiredAction: "NONE" | "REVIEW" | "REAUTHORIZATION" = "NONE";
      if (evalData.status === "BREAKING") {
        requiredAction = "REAUTHORIZATION";
      } else if (evalData.status === "REVIEW") {
        requiredAction = "REVIEW";
      }

      subscriberEvaluations.push({
        envelopeId: envelope.id,
        subscriptionId: envelope.subscriptionId,
        userId: envelope.userId,
        authorizedOfferVersionId: envelope.authorizedOfferVersionId,
        authorizedPrice: envelope.baselineCommitments.price,
        compatibility: evalData.status,
        requiredAction,
        reasons: evalData.findings,
      });
    }

    // 5. Aggregate metrics
    const total = subscriberEvaluations.length;
    const compatibleList = subscriberEvaluations.filter(
      (s) => s.compatibility === "COMPATIBLE",
    );
    const reviewList = subscriberEvaluations.filter(
      (s) => s.compatibility === "REVIEW",
    );
    const breakingList = subscriberEvaluations.filter(
      (s) => s.compatibility === "BREAKING",
    );

    const compatibleCount = compatibleList.length;
    const reviewCount = reviewList.length;
    const breakingCount = breakingList.length;

    const compatiblePercentage =
      total > 0 ? Math.round((compatibleCount / total) * 100) : 100;
    const reviewPercentage =
      total > 0 ? Math.round((reviewCount / total) * 100) : 0;
    const breakingPercentage =
      total > 0 ? Math.round((breakingCount / total) * 100) : 0;

    const currentTotalMRRPaise = subscriberEvaluations.reduce(
      (sum, s) => sum + s.authorizedPrice,
      0,
    );
    const projectedTotalMRRPaise = input.price * total;
    const atRiskMRRPaise = breakingList.reduce(
      (sum, s) => sum + s.authorizedPrice,
      0,
    );
    const reviewPendingMRRPaise = reviewList.reduce(
      (sum, s) => sum + s.authorizedPrice,
      0,
    );
    const seamlessMRRPaise = compatibleList.reduce(
      (sum, s) => sum + s.authorizedPrice,
      0,
    );

    // 6. Actionable recommendations
    const recommendations: string[] = [];
    if (breakingCount > 0) {
      recommendations.push(
        `Breaking changes detected for ${breakingCount} subscriber(s) (₹${(atRiskMRRPaise / 100).toFixed(2)} MRR at risk). Publishing this version will require manual reauthorization. Consider grandfathering existing authorizations or retaining critical entitlements.`,
      );
    }
    if (reviewCount > 0) {
      recommendations.push(
        `${reviewCount} subscriber(s) (₹${(reviewPendingMRRPaise / 100).toFixed(2)} MRR) exceed automated tolerance and will require buyer review.`,
      );
    }
    if (compatibleCount === total && total > 0) {
      recommendations.push(
        `100% of existing subscribers (${total}) conform to authorized envelope tolerances and will transition seamlessly.`,
      );
    }
    if (total === 0) {
      recommendations.push(
        "No active subscribers found for this product lineage; new version can be published without subscriber impact.",
      );
    }

    return {
      productId: input.productId,
      productName,
      proposedVersion,
      proposedOfferHash,
      totalSubscribersAffected: total,
      summary: {
        compatibleCount,
        reviewCount,
        breakingCount,
        compatiblePercentage,
        reviewPercentage,
        breakingPercentage,
      },
      financialImpact: {
        currentTotalMRRPaise,
        projectedTotalMRRPaise,
        atRiskMRRPaise,
        reviewPendingMRRPaise,
        seamlessMRRPaise,
      },
      cohortBreakdown: {
        compatible: {
          count: compatibleCount,
          percentage: compatiblePercentage,
          mrrPaise: seamlessMRRPaise,
          envelopeIds: compatibleList.map((s) => s.envelopeId),
        },
        review: {
          count: reviewCount,
          percentage: reviewPercentage,
          mrrPaise: reviewPendingMRRPaise,
          envelopeIds: reviewList.map((s) => s.envelopeId),
        },
        breaking: {
          count: breakingCount,
          percentage: breakingPercentage,
          mrrPaise: atRiskMRRPaise,
          envelopeIds: breakingList.map((s) => s.envelopeId),
        },
      },
      subscribers: subscriberEvaluations,
      recommendations,
      generatedAt: new Date().toISOString(),
    };
  }
}

// --- Factory / test seam (no DI framework) --------------------------------

let serviceSingleton: MerchantPreviewService | null = null;
let customPreviewService: MerchantPreviewService | null = null;

export function setMerchantPreviewService(
  service: MerchantPreviewService | null,
): void {
  customPreviewService = service;
  serviceSingleton = null;
}

export function getMerchantPreviewService(): MerchantPreviewService {
  if (customPreviewService) return customPreviewService;
  if (!serviceSingleton) {
    serviceSingleton = new MerchantPreviewService(
      getEnvelopeService(),
      getMerchantOfferService(),
      getCompatibilityService(),
    );
  }
  return serviceSingleton;
}
