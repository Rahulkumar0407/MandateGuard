import type {
  AgentCommerceContract,
} from "./types";
import type { CanonicalBuyerIntent } from "@/lib/intent/types";
import { getIntentEngine } from "@/lib/intent/engine";

export interface BuyerContext {
  userId?: string;
  spendingLimitPaise: number;
  currency: string;
  billingInterval: string;
  customerEmail?: string;
}

export interface ExternalPurchaseHandoffPayload {
  offerId: string;
  expectedVersion: number;
  expectedVersionHash: string | null;
  canonicalIntent?: CanonicalBuyerIntent;
  buyerContext: BuyerContext;
  clientClaimedPricePaise?: number; // Intentionally allowed in payload to test price-tampering neutralization
}

export interface ExternalAgentPurchaseTrace {
  mode: "MODE_A_DETERMINISTIC" | "MODE_B_SEMANTIC";
  buyerRequest: string;
  contractObserved: {
    offerId: string;
    version: number;
    versionHash: string | null;
    productName: string;
    pricePaise: number;
    currency: string;
    hasDedicatedHuman: boolean;
    slaHours: number | null;
  };
  normalizedIntent: {
    category: string;
    budgetLimitPaise: number;
    billingInterval: string;
    requiresDedicatedHuman: boolean;
  };
  selectionDecision: "SELECT_OFFER" | "REJECT_BUDGET" | "REJECT_TERMS" | "REFUSAL";
  selectedOfferId: string | null;
  decisionReasons: string[];
  handoffPayload: ExternalPurchaseHandoffPayload | null;
}

/**
 * Reference External Agent Client
 *
 * ARCHITECTURAL GUARANTEE:
 * This agent runs strictly OUTSIDE MandateGuard's internal domain and database.
 * It imports ZERO database or Prisma models.
 * It communicates with merchants purely via public AgentCommerceContract structures.
 */
export class ExternalAgentClient {
  /**
   * Mode A: Deterministic Reference Agent
   * Evaluates structured contract terms directly against explicit buyer parameters.
   */
  public evaluateDeterministic(
    contract: AgentCommerceContract,
    params: {
      category: string;
      maxBudgetPaise: number;
      billingInterval: string;
      requireDedicatedHuman: boolean;
      maxSlaHours?: number;
    },
  ): ExternalAgentPurchaseTrace {
    const reasons: string[] = [];
    let isEligible = true;

    // 1. Budget check
    if (contract.commercialTerms.pricePaise > params.maxBudgetPaise) {
      isEligible = false;
      reasons.push(
        `Price ₹${(contract.commercialTerms.pricePaise / 100).toLocaleString("en-IN")} exceeds budget ₹${(params.maxBudgetPaise / 100).toLocaleString("en-IN")}`,
      );
    } else {
      reasons.push(
        `Price ₹${(contract.commercialTerms.pricePaise / 100).toLocaleString("en-IN")} within budget limit`,
      );
    }

    // 2. Billing cadence check
    if (contract.commercialTerms.billingInterval !== params.billingInterval) {
      isEligible = false;
      reasons.push(
        `Billing interval ${contract.commercialTerms.billingInterval} does not match required ${params.billingInterval}`,
      );
    } else {
      reasons.push(`Billing interval ${params.billingInterval} matches`);
    }

    // 3. Dedicated human support check
    if (params.requireDedicatedHuman) {
      if (contract.structuredCommitments.support.hasDedicatedHuman) {
        reasons.push("Dedicated human mentor verified in structured commitments");
      } else {
        isEligible = false;
        reasons.push(
          "Requires dedicated human mentor, but contract lacks structured commitment",
        );
      }
    }

    // 4. SLA check
    if (params.maxSlaHours && contract.structuredCommitments.support.slaHours) {
      if (contract.structuredCommitments.support.slaHours <= params.maxSlaHours) {
        reasons.push(`Response SLA ${contract.structuredCommitments.support.slaHours}h within limit`);
      } else {
        isEligible = false;
        reasons.push(
          `SLA ${contract.structuredCommitments.support.slaHours}h exceeds required ${params.maxSlaHours}h`,
        );
      }
    }

    // 5. Merchant confirmation & version hash check
    if (!contract.integrity.isConfirmedByMerchant || !contract.integrity.versionHash) {
      isEligible = false;
      reasons.push("Contract is unconfirmed or missing integrity hash");
    }

    const decision: ExternalAgentPurchaseTrace["selectionDecision"] = isEligible
      ? "SELECT_OFFER"
      : reasons.some((r) => r.includes("exceeds budget"))
      ? "REJECT_BUDGET"
      : "REJECT_TERMS";

    const canonicalIntent: CanonicalBuyerIntent = {
      category: params.category,
      billing: {
        cadence: params.billingInterval as "monthly" | "yearly" | "quarterly" | "weekly" | "one_time" | "any",
        isRecurring: true,
      },
      budget: {
        amountPaise: params.maxBudgetPaise,
        currency: contract.commercialTerms.currency,
        type: "HARD",
      },
      mustHave: params.requireDedicatedHuman ? ["human_mentor"] : [],
      niceToHave: [],
      exclusions: [],
      supportPreference: {
        tier: params.requireDedicatedHuman ? "dedicated_mentor" : "any",
        hasDedicatedHuman: params.requireDedicatedHuman,
        maxSlaHours: params.maxSlaHours,
      },
      context: {
        rawQuery: `Deterministic request for ${params.category}`,
        channel: "text",
      },
      urgency: "medium",
      ambiguous: false,
      clarificationNeeded: false,
    };

    const handoffPayload: ExternalPurchaseHandoffPayload | null = isEligible
      ? {
          offerId: contract.offer.id,
          expectedVersion: contract.offer.version,
          expectedVersionHash: contract.integrity.versionHash,
          canonicalIntent,
          buyerContext: {
            spendingLimitPaise: params.maxBudgetPaise,
            currency: contract.commercialTerms.currency,
            billingInterval: params.billingInterval,
          },
        }
      : null;

    return {
      mode: "MODE_A_DETERMINISTIC",
      buyerRequest: `Category: ${params.category}, Budget: ₹${(params.maxBudgetPaise / 100).toLocaleString("en-IN")}, Human: ${params.requireDedicatedHuman}`,
      contractObserved: {
        offerId: contract.offer.id,
        version: contract.offer.version,
        versionHash: contract.integrity.versionHash,
        productName: contract.product.name,
        pricePaise: contract.commercialTerms.pricePaise,
        currency: contract.commercialTerms.currency,
        hasDedicatedHuman: contract.structuredCommitments.support.hasDedicatedHuman,
        slaHours: contract.structuredCommitments.support.slaHours,
      },
      normalizedIntent: {
        category: params.category,
        budgetLimitPaise: params.maxBudgetPaise,
        billingInterval: params.billingInterval,
        requiresDedicatedHuman: params.requireDedicatedHuman,
      },
      selectionDecision: decision,
      selectedOfferId: isEligible ? contract.offer.id : null,
      decisionReasons: reasons,
      handoffPayload,
    };
  }

  /**
   * Mode B: Semantic Assistant
   * Resolves messy natural language into CanonicalBuyerIntent, then evaluates public contracts.
   */
  public async evaluateSemantic(
    contracts: AgentCommerceContract[],
    buyerQuery: string,
    buyerContext?: Partial<BuyerContext>,
  ): Promise<ExternalAgentPurchaseTrace> {
    const intentEngine = getIntentEngine();
    const intent = await intentEngine.understandIntent(buyerQuery);

    const budgetCeiling = intent.budget?.amountPaise || 500000;
    const requiresHuman =
      Boolean(intent.supportPreference?.hasDedicatedHuman) ||
      Boolean(intent.mustHave?.includes("human_mentor"));
    const billing = intent.billing?.cadence || "monthly";

    let winningContract: AgentCommerceContract | null = null;
    let winReasons: string[] = [];

    for (const contract of contracts) {
      const reasons: string[] = [];
      let eligible = true;

      // Discard inactive / unconfirmed
      if (
        contract.offer.availability !== "ACTIVE" ||
        !contract.integrity.isConfirmedByMerchant ||
        !contract.integrity.versionHash
      ) {
        continue;
      }

      // Hard budget check
      if (contract.commercialTerms.pricePaise > budgetCeiling) {
        eligible = false;
        reasons.push(
          `Price ₹${(contract.commercialTerms.pricePaise / 100).toLocaleString("en-IN")} exceeds budget limit ₹${(budgetCeiling / 100).toLocaleString("en-IN")}`,
        );
      } else {
        reasons.push(`Price ₹${(contract.commercialTerms.pricePaise / 100).toLocaleString("en-IN")} <= budget limit`);
      }

      // Support requirement check
      if (requiresHuman) {
        if (contract.structuredCommitments.support.hasDedicatedHuman) {
          reasons.push("Dedicated human mentor verified in structured commitments");
        } else {
          eligible = false;
          reasons.push("Lacks machine-readable dedicated human mentor commitment");
        }
      }

      // Billing interval check
      if (contract.commercialTerms.billingInterval === billing) {
        reasons.push(`Billing interval ${billing} matched`);
      }

      if (eligible) {
        winningContract = contract;
        winReasons = reasons;
        break;
      }
    }

    const evaluatedTarget = winningContract || contracts[0];
    const decision: ExternalAgentPurchaseTrace["selectionDecision"] = winningContract
      ? "SELECT_OFFER"
      : "REJECT_TERMS";

    const handoffPayload: ExternalPurchaseHandoffPayload | null = winningContract
      ? {
          offerId: winningContract.offer.id,
          expectedVersion: winningContract.offer.version,
          expectedVersionHash: winningContract.integrity.versionHash,
          canonicalIntent: intent,
          buyerContext: {
            spendingLimitPaise: buyerContext?.spendingLimitPaise || budgetCeiling,
            currency: winningContract.commercialTerms.currency,
            billingInterval: winningContract.commercialTerms.billingInterval,
            customerEmail: buyerContext?.customerEmail,
            userId: buyerContext?.userId,
          },
        }
      : null;

    return {
      mode: "MODE_B_SEMANTIC",
      buyerRequest: buyerQuery,
      contractObserved: {
        offerId: evaluatedTarget.offer.id,
        version: evaluatedTarget.offer.version,
        versionHash: evaluatedTarget.integrity.versionHash,
        productName: evaluatedTarget.product.name,
        pricePaise: evaluatedTarget.commercialTerms.pricePaise,
        currency: evaluatedTarget.commercialTerms.currency,
        hasDedicatedHuman: evaluatedTarget.structuredCommitments.support.hasDedicatedHuman,
        slaHours: evaluatedTarget.structuredCommitments.support.slaHours,
      },
      normalizedIntent: {
        category: intent.category,
        budgetLimitPaise: budgetCeiling,
        billingInterval: billing,
        requiresDedicatedHuman: requiresHuman,
      },
      selectionDecision: decision,
      selectedOfferId: winningContract ? winningContract.offer.id : null,
      decisionReasons: winningContract ? winReasons : ["No contracts met all hard buyer constraints"],
      handoffPayload,
    };
  }
}
