import type { MerchantOfferService } from "@/lib/merchant/service";
import type {
  EvidenceReference,
  MerchantSupplySnapshot,
  BuyerDecisionTrace,
  LostBuyerAnalysis,
  DemandGapAnalysis,
} from "./types";

/**
 * Collects factual, non-hallucinated evidence across supply, demand,
 * decision results, and transaction outcomes.
 */
export class MerchantEvidenceCollector {
  constructor(private readonly merchantService: MerchantOfferService) {}

  /**
   * Ingests and snapshots the merchant's authoritative catalog supply state.
   */
  async captureSupplySnapshot(): Promise<MerchantSupplySnapshot> {
    const profile = await this.merchantService.getMerchantProfile();
    const merchantId = profile?.merchant.id || "m_unknown";
    const merchantName = profile?.merchant.name || "Unknown Merchant";

    const products = await this.merchantService.listProducts();
    const offers = await this.merchantService.listOffers();

    const activeConfirmedOffers = offers.filter(
      (o) => o.availability === "ACTIVE" && o.isConfirmedByMerchant && o.versionHash,
    ).length;

    const unconfirmedOffers = offers.filter((o) => !o.isConfirmedByMerchant).length;

    const offersWithStructuredCommitments = offers.filter(
      (o) => o.structuredCommitments !== undefined && o.structuredCommitments !== null,
    ).length;

    return {
      merchantId,
      merchantName,
      products,
      offers,
      totalProducts: products.length,
      totalOffers: offers.length,
      activeConfirmedOffers,
      unconfirmedOffers,
      offersWithStructuredCommitments,
    };
  }

  /**
   * Evaluates merchant supply against AI Discoverability, Comprehension,
   * Comparability, and Offer Structure rules.
   */
  collectSupplyEvidence(snapshot: MerchantSupplySnapshot): EvidenceReference[] {
    const items: EvidenceReference[] = [];

    // 1. Discoverability: Check for unconfirmed or inactive offers
    if (snapshot.unconfirmedOffers > 0) {
      items.push({
        id: `ev_disc_unconfirmed_${Date.now()}`,
        category: "DISCOVERABILITY",
        source: "MERCHANT_SUPPLY",
        fact: `${snapshot.unconfirmedOffers} offer version(s) in catalog lack merchant confirmation and version hashes.`,
        metric: {
          label: "Unconfirmed Offers",
          value: snapshot.unconfirmedOffers,
          benchmark: 0,
        },
        entityId: snapshot.merchantId,
        entityType: "merchant",
      });
    }

    // 2. Discoverability: Product category completeness
    for (const product of snapshot.products) {
      if (!product.category || product.category.trim() === "" || product.category === "unspecified") {
        items.push({
          id: `ev_disc_cat_${product.id}`,
          category: "DISCOVERABILITY",
          source: "MERCHANT_SUPPLY",
          fact: `Product '${product.name}' has no specific commercial category assigned.`,
          metric: {
            label: "Product Category",
            value: "unspecified",
            benchmark: "system_design | dsa | mock_interviews",
          },
          entityId: product.id,
          entityType: "product",
        });
      }
    }

    // 3. Comprehension & Structured Commitments
    for (const offer of snapshot.offers) {
      // Check Transaction Readiness: Billing interval consistency
      if (!["daily", "weekly", "monthly", "yearly"].includes(offer.billingInterval.toLowerCase())) {
        items.push({
          id: `ev_readiness_billing_${offer.id}`,
          category: "TRANSACTION_READINESS",
          source: "MERCHANT_SUPPLY",
          fact: `Offer '${offer.name}' uses non-standard billing interval '${offer.billingInterval}'.`,
          metric: {
            label: "Billing Interval",
            value: offer.billingInterval,
            benchmark: "monthly",
          },
          entityId: offer.id,
          entityType: "offer",
        });
      }

      const commitments = offer.structuredCommitments;

      if (!commitments) {
        items.push({
          id: `ev_comp_missing_${offer.id}`,
          category: "COMPREHENSION",
          source: "MERCHANT_SUPPLY",
          fact: `Offer '${offer.name}' (v${offer.version}) lacks machine-readable structured commitments schema.`,
          metric: {
            label: "Structured Commitments Present",
            value: false,
            benchmark: true,
          },
          entityId: offer.id,
          entityType: "offer",
        });
        continue;
      }

      // 4. Comparability: Support SLA quantification
      if (commitments.support && (!commitments.support.slaHours || commitments.support.slaHours <= 0)) {
        items.push({
          id: `ev_comp_sla_${offer.id}`,
          category: "COMPARABILITY",
          source: "MERCHANT_SUPPLY",
          fact: `Offer '${offer.name}' does not specify a guaranteed response SLA in hours.`,
          metric: {
            label: "Support SLA (Hours)",
            value: "Unspecified",
            benchmark: 24,
            unit: "hours",
          },
          entityId: offer.id,
          entityType: "offer",
        });
      }

      // 5. Support: Clarity on human vs automated mentor
      if (
        commitments.support &&
        commitments.support.hasDedicatedHuman &&
        (commitments.support.oneOnOneSessionsPerMonth === undefined || commitments.support.oneOnOneSessionsPerMonth === 0)
      ) {
        items.push({
          id: `ev_supp_sessions_${offer.id}`,
          category: "SUPPORT",
          source: "MERCHANT_SUPPLY",
          fact: `Offer '${offer.name}' promises dedicated human support but specifies 0 monthly 1:1 sessions.`,
          metric: {
            label: "1:1 Sessions Per Month",
            value: 0,
            benchmark: ">= 1",
          },
          entityId: offer.id,
          entityType: "offer",
        });
      }

      // 6. Trust: Refund window verification
      const refundDays = offer.refundPolicy?.windowDays ?? commitments.refundPolicy?.windowDays ?? 0;
      if (refundDays === 0) {
        items.push({
          id: `ev_trust_refund_${offer.id}`,
          category: "TRUST",
          source: "MERCHANT_SUPPLY",
          fact: `Offer '${offer.name}' specifies 0 refund window days.`,
          metric: {
            label: "Refund Window",
            value: 0,
            benchmark: 15,
            unit: "days",
          },
          entityId: offer.id,
          entityType: "offer",
        });
      }
    }


    return items;
  }

  /**
   * Analyzes recorded Buyer Decision traces to diagnose why AI buyers were won or lost.
   */
  collectDecisionEvidence(traces: BuyerDecisionTrace[]): {
    evidenceItems: EvidenceReference[];
    lostBuyerAnalyses: LostBuyerAnalysis[];
    demandGaps: DemandGapAnalysis[];
  } {
    const items: EvidenceReference[] = [];
    const lostBuyerAnalyses: LostBuyerAnalysis[] = [];
    const demandGapsMap = new Map<string, { count: number; category: string; budget?: number; description: string }>();

    const totalDecisions = traces.length;
    let successfulSelections = 0;
    let budgetRejections = 0;
    let supportRejections = 0;
    let entitlementRejections = 0;

    for (const trace of traces) {
      if (trace.selectedOfferId) {
        successfulSelections++;
      } else {
        // Trace lost buyer
        const intent = trace.intent;
        const rejected = trace.rejectedOffers[0];
        let failureStage: LostBuyerAnalysis["failureStage"] = "HARD_CONSTRAINT_FAIL";
        let remedy = "Review offer attributes to align with buyer requirements.";

        if (!trace.recommendation.eligible) {
          const reason = trace.recommendation.refusalReason || "";
          if (reason.toLowerCase().includes("budget") || reason.toLowerCase().includes("price")) {
            failureStage = "BUDGET_CEILING_EXCEEDED";
            budgetRejections++;
            remedy = `Create a tiered/entry offer under ₹${((intent.budget?.amountPaise || 400000) / 100).toLocaleString("en-IN")}.`;
          } else if (reason.toLowerCase().includes("support") || reason.toLowerCase().includes("1:1") || reason.toLowerCase().includes("mentor")) {
            failureStage = "SUPPORT_MISMATCH";
            supportRejections++;
            remedy = "Provide clear 1:1 human mentorship or explicit response SLAs in structured commitments.";
          } else if (reason.toLowerCase().includes("entitlement") || reason.toLowerCase().includes("must-have")) {
            failureStage = "HARD_CONSTRAINT_FAIL";
            entitlementRejections++;
            remedy = `Ensure required entitlement keys (${intent.mustHave.join(", ")}) are tagged and delivered.`;
          } else {
            failureStage = "RETRIEVAL_FILTER";
            remedy = "Confirm offer versions and ensure product category matches buyer search terms.";
          }

          lostBuyerAnalyses.push({
            id: `lost_${trace.id}`,
            buyerQuery: trace.buyerQuery,
            parsedIntent: intent,
            failureStage,
            rejectionReason: reason || "No candidate met all hard constraints.",
            candidateOfferEvaluated: rejected ? {
              offerId: rejected.offerId,
              offerName: rejected.offerName,
              pricePaise: 0,
            } : undefined,
            merchantRemedy: remedy,
          });

          // Aggregate demand gaps
          const gapKey = `${intent.category}_${intent.budget?.amountPaise || 0}_${intent.mustHave.sort().join("+")}`;
          const existing = demandGapsMap.get(gapKey);
          if (existing) {
            existing.count++;
          } else {
            demandGapsMap.set(gapKey, {
              count: 1,
              category: intent.category,
              budget: intent.budget?.amountPaise,
              description: `Demand for '${intent.category}' under ₹${(((intent.budget?.amountPaise || 0) / 100)).toLocaleString("en-IN")} with must-haves: [${intent.mustHave.join(", ")}]`,
            });
          }
        }
      }
    }

    // Convert aggregate counts into factual EvidenceReference items
    if (totalDecisions > 0) {
      const conversionRate = Math.round((successfulSelections / totalDecisions) * 100);
      items.push({
        id: `ev_conv_rate_${Date.now()}`,
        category: "CONVERSION",
        source: "DECISION_RESULT",
        fact: `AI Buyer selection conversion rate is ${conversionRate}% across ${totalDecisions} evaluations.`,
        metric: {
          label: "Conversion Rate",
          value: `${conversionRate}%`,
          benchmark: ">= 75%",
        },
      });

      if (budgetRejections > 0) {
        items.push({
          id: `ev_price_drop_${Date.now()}`,
          category: "PRICING",
          source: "DECISION_RESULT",
          fact: `${budgetRejections} buyer(s) were lost due to hard budget ceiling overages.`,
          metric: {
            label: "Budget Ceiling Drops",
            value: budgetRejections,
            benchmark: 0,
          },
        });
      }

      if (supportRejections > 0) {
        items.push({
          id: `ev_supp_drop_${Date.now()}`,
          category: "SUPPORT",
          source: "DECISION_RESULT",
          fact: `${supportRejections} buyer(s) were lost due to support or mentor session mismatches.`,
          metric: {
            label: "Support Mismatch Drops",
            value: supportRejections,
            benchmark: 0,
          },
        });
      }

      if (entitlementRejections > 0) {
        items.push({
          id: `ev_entitle_drop_${Date.now()}`,
          category: "OFFER_STRUCTURE",
          source: "DECISION_RESULT",
          fact: `${entitlementRejections} buyer(s) were lost due to missing must-have entitlement requirements.`,
          metric: {
            label: "Entitlement Mismatch Drops",
            value: entitlementRejections,
            benchmark: 0,
          },
        });
      }
    }

    // Transform demand gaps map
    const demandGaps: DemandGapAnalysis[] = Array.from(demandGapsMap.values()).map((value, idx) => ({
      id: `gap_${idx + 1}`,
      demandedCategoryOrFeature: value.category,
      targetBudgetPaise: value.budget,
      demandFrequency: value.count,
      currentCatalogCoverage: false,
      gapSummary: value.description,
      suggestedAction: `Consider publishing an entry-tier plan for '${value.category}' targeting budget ₹${((value.budget || 300000) / 100).toLocaleString("en-IN")}.`,
    }));

    return { evidenceItems: items, lostBuyerAnalyses, demandGaps };
  }
}
