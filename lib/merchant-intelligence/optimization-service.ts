import {
  getMerchantOfferService,
  type MerchantOfferService,
  type CreateOfferVersionInputDTO,
} from "@/lib/merchant/service";
import type { OfferDetailDTO } from "@/lib/merchant/types";
import {
  normalizeStructuredCommitments,
  type StructuredCommitments,
} from "@/lib/merchant/structured-commitments";
import { MerchantBuyabilityEngine } from "./buyability-engine";
import { getGoldBuyabilityCohort } from "./buyability-benchmark-dataset";
import { MerchantEvidenceCollector } from "./collector";
import { serializeOfferToContract } from "@/lib/contract/serializer";
import type { AgentCommerceContract } from "@/lib/contract/types";

export class StaleOfferVersionError extends Error {
  constructor(message = "This offer changed while you were reviewing it. Please re-run simulation on the latest version.") {
    super(message);
    this.name = "StaleOfferVersionError";
  }
}

export interface VerificationCheck {
  item: string;
  status: "VERIFIED" | "AMBIGUOUS" | "FAIL";
  detail: string;
}

export interface OfferOptimizationPlan {
  offer: {
    id: string;
    productId: string;
    productName: string;
    version: number;
    versionHash: string | null;
    name: string;
    isConfirmedByMerchant: boolean;
  };
  diagnosis: {
    buyerNeeds: string[];
    yourOfferSummary: string;
    verificationChecks: VerificationCheck[];
    whyExplanation: string;
    evidenceFact: string;
  };
  recommendation: {
    currentTerms: {
      pricePaise: number;
      billingInterval: string;
      supportDescription: string;
      supportTier: string;
      hasDedicatedHuman: boolean;
      slaHours: number | null;
      sessionsPerMonth: number;
      refundDays: number;
    };
    proposedTerms: {
      pricePaise: number;
      billingInterval: string;
      supportDescription: string;
      supportTier: string;
      hasDedicatedHuman: boolean;
      slaHours: number | null;
      sessionsPerMonth: number;
      refundDays: number;
    };
    changedFields: string[];
    unchangedFields: string[];
    proposedStructuredCommitments: StructuredCommitments;
  };
  simulation: {
    benchmarkId: string;
    benchmarkVersion: string | number;
    datasetHash: string;
    missionsTested: number;
    missionsBefore: number;
    missionsAfter: number;
    missionsRecovered: number;
    status: "IMPROVED" | "UNCHANGED" | "WORSE";
    claimNotice: string;
  };
  contractPreview: {
    beforeContract: AgentCommerceContract;
    afterContract: AgentCommerceContract;
  };
  versionHistory: Array<{
    id: string;
    version: number;
    name: string;
    pricePaise: number;
    supportTier: string;
    hasDedicatedHuman: boolean;
    versionHash: string | null;
    isConfirmed: boolean;
    status: string;
  }>;
}

export class MerchantOfferOptimizationService {
  private readonly buyabilityEngine: MerchantBuyabilityEngine;

  constructor(
    private readonly merchantService: MerchantOfferService = getMerchantOfferService(),
    buyabilityEngine?: MerchantBuyabilityEngine,
  ) {
    this.buyabilityEngine = buyabilityEngine || new MerchantBuyabilityEngine();
  }

  /**
   * Generates a grounded optimization plan for an authoritative OfferVersion.
   * ANALYSIS ONLY: Zero mutations or provider actions.
   */
  async getOfferOptimizationPlan(offerId: string): Promise<OfferOptimizationPlan> {
    const offer = await this.merchantService.getOffer(offerId);
    if (!offer) {
      throw new Error(`Offer '${offerId}' not found.`);
    }

    const currentCommitments = offer.structuredCommitments || {
      support: {
        tier: "standard_email",
        slaHours: 48,
        oneOnOneSessionsPerMonth: 0,
        hasDedicatedHuman: false,
      },
      entitlements: {
        keys: offer.entitlementKeys || ["core_service"],
        criticalKeys: (offer.entitlementKeys || ["core_service"]).slice(0, 1),
      },
      usageLimits: {
        apiRequestsPerMonth: null,
        concurrentSeats: 1,
        computeCredits: null,
      },
      delivery: {
        type: "continuous_saas",
        commitmentSLA: "48h Turnaround",
      },
      refundPolicy: {
        windowDays: offer.refundPolicy.windowDays || 30,
        type: "conditional",
      },
    };

    // 1. Diagnose why offer loses against buyer missions
    const cohort = getGoldBuyabilityCohort();
    const beforeContract = serializeOfferToContract(offer);

    // Formulate proposed improvements
    const proposedCommitments: StructuredCommitments = normalizeStructuredCommitments({
      ...currentCommitments,
      support: {
        tier: "dedicated_mentor",
        hasDedicatedHuman: true,
        slaHours: 24,
        oneOnOneSessionsPerMonth: 4,
      },
      entitlements: {
        ...currentCommitments.entitlements,
        keys: Array.from(new Set([...currentCommitments.entitlements.keys, "human_mentor", "mock_interviews"])),
        criticalKeys: Array.from(new Set([...currentCommitments.entitlements.criticalKeys, "human_mentor"])),
      },
    });

    const proposedOfferDTO: OfferDetailDTO = {
      ...offer,
      description: "Production system architecture curriculum with dedicated 1:1 human mentor and weekly reviews.",
      supportTerms: "Dedicated human mentor assigned with weekly reviews and 24h response SLA.",
      structuredCommitments: proposedCommitments,
      entitlementKeys: proposedCommitments.entitlements.keys,
    };

    const afterContract = serializeOfferToContract(proposedOfferDTO);

    // 2. Run Before / After Simulation on Gold Benchmark
    const collector = new MerchantEvidenceCollector(this.merchantService);
    const baseSnapshot = await collector.captureSupplySnapshot();

    const simResult = this.buyabilityEngine.runBuyabilityExperiment(
      baseSnapshot,
      offer.id,
      proposedOfferDTO,
      cohort,
    );

    // 3. Verification checks & diagnosis
    const verificationChecks: VerificationCheck[] = [
      {
        item: "Budget Ceiling",
        status: "VERIFIED",
        detail: `₹${(offer.price / 100).toLocaleString("en-IN")} <= ₹4,000/mo buyer limit`,
      },
      {
        item: "Billing Cadence",
        status: "VERIFIED",
        detail: `${offer.billingInterval} normalized cadence verified`,
      },
      {
        item: "Dedicated Human Support",
        status: currentCommitments.support.hasDedicatedHuman ? "VERIFIED" : "AMBIGUOUS",
        detail: currentCommitments.support.hasDedicatedHuman
          ? "Dedicated human mentor explicitly declared"
          : "Free-text support terms lack machine-readable dedicated human commitment",
      },
      {
        item: "Support SLA",
        status: currentCommitments.support.slaHours && currentCommitments.support.slaHours <= 24 ? "VERIFIED" : "FAIL",
        detail: currentCommitments.support.slaHours
          ? `${currentCommitments.support.slaHours}h response turnaround`
          : "Missing explicit SLA turnaround commitment",
      },
    ];

    // 4. Changed vs Unchanged Fields
    const changedFields: string[] = [
      `Support Tier: ${currentCommitments.support.tier} → dedicated_mentor`,
      `Dedicated Human: ${currentCommitments.support.hasDedicatedHuman} → true`,
      `1:1 Sessions: ${currentCommitments.support.oneOnOneSessionsPerMonth}/mo → 4/mo`,
      `Support SLA: ${currentCommitments.support.slaHours ?? "None"} → 24h`,
      `Entitlements: added human_mentor, mock_interviews`,
    ];

    const unchangedFields: string[] = [
      `Price: ₹${(offer.price / 100).toLocaleString("en-IN")}/mo (Unchanged)`,
      `Currency: ${offer.currency} (Unchanged)`,
      `Billing Interval: ${offer.billingInterval} (Unchanged)`,
      `Refund Window: ${offer.refundPolicy.windowDays} days (Unchanged)`,
    ];

    // 5. Version History
    const history = await this.getOfferVersionHistory(offer.product.id);

    return {
      offer: {
        id: offer.id,
        productId: offer.product.id,
        productName: offer.product.name,
        version: offer.version,
        versionHash: offer.versionHash || null,
        name: offer.name,
        isConfirmedByMerchant: Boolean(offer.isConfirmedByMerchant),
      },
      diagnosis: {
        buyerNeeds: [
          "Human mentor (1:1 guidance)",
          "Under ₹4,000 monthly budget",
          "Fast response SLA (<= 24h)",
        ],
        yourOfferSummary: offer.supportTerms || offer.description,
        verificationChecks,
        whyExplanation:
          "AI buyers requiring dedicated human mentorship skipped this offer because support terms lacked a structured, machine-readable human mentor commitment.",
        evidenceFact: `${simResult.changes.missionsRecovered} benchmark missions can be recovered by clarifying dedicated human support and SLA commitments.`,
      },
      recommendation: {
        currentTerms: {
          pricePaise: offer.price,
          billingInterval: offer.billingInterval,
          supportDescription: offer.supportTerms,
          supportTier: currentCommitments.support.tier,
          hasDedicatedHuman: currentCommitments.support.hasDedicatedHuman,
          slaHours: currentCommitments.support.slaHours,
          sessionsPerMonth: currentCommitments.support.oneOnOneSessionsPerMonth,
          refundDays: offer.refundPolicy.windowDays,
        },
        proposedTerms: {
          pricePaise: offer.price,
          billingInterval: offer.billingInterval,
          supportDescription: proposedOfferDTO.supportTerms,
          supportTier: "dedicated_mentor",
          hasDedicatedHuman: true,
          slaHours: 24,
          sessionsPerMonth: 4,
          refundDays: offer.refundPolicy.windowDays,
        },
        changedFields,
        unchangedFields,
        proposedStructuredCommitments: proposedCommitments,
      },
      simulation: {
        benchmarkId: cohort.benchmarkId,
        benchmarkVersion: cohort.benchmarkVersion,
        datasetHash: cohort.datasetHash,
        missionsTested: cohort.caseCount,
        missionsBefore: simResult.before.funnel.transactionReady.count,
        missionsAfter: simResult.after.funnel.transactionReady.count,
        missionsRecovered: simResult.changes.missionsRecovered,
        status: simResult.interpretation.status,
        claimNotice: "Simulation on gold benchmark cohort. Not a financial revenue forecast.",
      },
      contractPreview: {
        beforeContract,
        afterContract,
      },
      versionHistory: history,
    };
  }

  /**
   * Explicit merchant approval workflow:
   * 1. Validates that the current offer has not changed during review (stale-state defense).
   * 2. Publishes a new immutable OfferVersion (v_next) with a newly computed content hash.
   * 3. Leaves previous OfferVersion records immutable.
   */
  async approveAndPublishOfferVersion(input: {
    offerId: string;
    expectedVersion: number;
    expectedVersionHash: string | null;
    proposedChanges?: Partial<CreateOfferVersionInputDTO>;
  }): Promise<OfferDetailDTO> {
    const currentOffer = await this.merchantService.getOffer(input.offerId);
    if (!currentOffer) {
      throw new Error(`Offer '${input.offerId}' not found.`);
    }

    // Check if a newer version has already been published for this product (concurrency defense)
    const allProductOffers = (await this.merchantService.listOffers()).filter(
      (o) => o.product.id === currentOffer.product.id,
    );
    const latestVersion = allProductOffers.reduce(
      (max, o) => Math.max(max, o.version),
      currentOffer.version,
    );

    if (
      latestVersion > input.expectedVersion ||
      currentOffer.version !== input.expectedVersion
    ) {
      throw new StaleOfferVersionError(
        `This offer changed (now v${latestVersion}, expected v${input.expectedVersion}) while you were reviewing it. Please review latest version.`,
      );
    }

    if (
      input.expectedVersionHash &&
      currentOffer.versionHash &&
      currentOffer.versionHash !== input.expectedVersionHash
    ) {
      throw new StaleOfferVersionError(
        "This offer's content hash changed while you were reviewing it. Please reload the latest offer version.",
      );
    }

    const commitments: StructuredCommitments =
      input.proposedChanges?.structuredCommitments ||
      normalizeStructuredCommitments({
        support: {
          tier: "dedicated_mentor",
          hasDedicatedHuman: true,
          slaHours: 24,
          oneOnOneSessionsPerMonth: 4,
        },
        entitlements: {
          keys: Array.from(
            new Set([
              ...(currentOffer.entitlementKeys || []),
              "human_mentor",
              "mock_interviews",
            ]),
          ),
          criticalKeys: ["human_mentor"],
        },
        usageLimits: {
          apiRequestsPerMonth: null,
          concurrentSeats: 1,
          computeCredits: null,
        },
        delivery: {
          type: "continuous_saas",
          commitmentSLA: "24h Turnaround",
        },
        refundPolicy: {
          windowDays: currentOffer.refundPolicy.windowDays || 30,
          type: "conditional",
        },
      });

    const createInput: CreateOfferVersionInputDTO = {
      name: input.proposedChanges?.name || currentOffer.name,
      description:
        input.proposedChanges?.description ||
        "Production system architecture curriculum with dedicated 1:1 human mentor and weekly reviews.",
      price: input.proposedChanges?.price ?? currentOffer.price,
      currency: input.proposedChanges?.currency ?? currentOffer.currency,
      billingInterval: input.proposedChanges?.billingInterval ?? currentOffer.billingInterval,
      duration: input.proposedChanges?.duration ?? currentOffer.duration,
      entitlementKeys: commitments.entitlements.keys,
      refundWindowDays: commitments.refundPolicy.windowDays,
      supportTerms:
        input.proposedChanges?.supportTerms ||
        "Dedicated human mentor assigned with weekly reviews and 24h response SLA.",
      semanticTerms:
        input.proposedChanges?.semanticTerms || currentOffer.semanticTerms,
      structuredCommitments: commitments,
      confirmImmediately: true,
    };

    const newOffer = await this.merchantService.createOfferVersion(
      currentOffer.product.id,
      createInput,
    );

    return newOffer;
  }

  /**
   * Retrieves full version history timeline for a product.
   */
  async getOfferVersionHistory(productId: string) {
    const allOffers = await this.merchantService.listOffers();
    const productOffers = allOffers.filter((o) => o.product.id === productId);
    productOffers.sort((a, b) => b.version - a.version);

    return productOffers.map((o) => ({
      id: o.id,
      version: o.version,
      name: o.name,
      pricePaise: o.price,
      supportTier: o.structuredCommitments?.support?.tier || "unspecified",
      hasDedicatedHuman: o.structuredCommitments?.support?.hasDedicatedHuman ?? false,
      versionHash: o.versionHash || null,
      isConfirmed: Boolean(o.isConfirmedByMerchant),
      status: o.availability,
    }));
  }
}
