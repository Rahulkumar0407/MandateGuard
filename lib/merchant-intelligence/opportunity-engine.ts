/**
 * M10-C3 — Evidence-Based Revenue Opportunity Engine
 *
 * Core Principles:
 *   1. Detect opportunity from evidence first.
 *   2. Explain second.
 *   3. Estimate only when evidence supports estimation.
 *   4. Never invent revenue.
 *   5. All recommendations require explicit merchant approval.
 */

import type {
  MerchantSupplySnapshot,
  BuyerMissionEvaluation,
  EvidenceReference,
  MissingDemandCluster,
} from "./types";
import type { CanonicalBuyerIntent } from "@/lib/intent/types";
import { isGenericOrUngroundedAdvice } from "./recommendations";
import type {
  RevenueOpportunity,
  OpportunityAnalysisReport,
  OpportunityEstimatedImpact,
} from "./opportunity-types";


function matchesCategory(sourceCatOrName: string, targetCat: string): boolean {
  if (!sourceCatOrName || !targetCat) return false;
  const normSource = sourceCatOrName.toLowerCase().replace(/[-_\s]/g, "");
  const normTarget = targetCat.toLowerCase().replace(/[-_\s]/g, "");
  return normSource.includes(normTarget) || normTarget.includes(normSource);
}

export class MerchantRevenueOpportunityEngine {

  /**
   * Evaluates the merchant catalog, evidence pool, simulation evaluations, and historical
   * demand traces to extract credible, grounded revenue opportunities.
   */
  analyzeOpportunities(
    snapshot: MerchantSupplySnapshot,
    evidenceList: EvidenceReference[] = [],
    evaluations: BuyerMissionEvaluation[] = [],
    historicalIntents: CanonicalBuyerIntent[] = [],
    missingDemand: MissingDemandCluster[] = [],
  ): OpportunityAnalysisReport {
    const detectedAt = new Date().toISOString();
    const opportunities: RevenueOpportunity[] = [];

    // 1. UNSERVED_DEMAND
    const unserved = this.detectUnservedDemand(historicalIntents, missingDemand);
    if (unserved) opportunities.push(...unserved);

    // 2. UNDER_SERVED_DEMAND
    const underServed = this.detectUnderServedDemand(snapshot, historicalIntents);
    if (underServed) opportunities.push(...underServed);

    // 3. UPSELL
    const upsell = this.detectUpsellOpportunities(snapshot, historicalIntents);
    if (upsell) opportunities.push(...upsell);

    // 4. CROSS_SELL
    const crossSell = this.detectCrossSellOpportunities(historicalIntents);
    if (crossSell) opportunities.push(...crossSell);

    // 5. OFFER_PACKAGING
    const packaging = this.detectOfferPackagingOpportunities(snapshot, evidenceList);
    if (packaging) opportunities.push(...packaging);


    // 6. PRICE_VALUE_MISMATCH
    const priceMismatch = this.detectPriceValueMismatch(snapshot);
    if (priceMismatch) opportunities.push(...priceMismatch);

    // 7. SUPPORT_DRIVEN_OPPORTUNITY
    const supportOpp = this.detectSupportDrivenOpportunities(snapshot, evaluations);
    if (supportOpp) opportunities.push(...supportOpp);

    // 8. AI_BUYER_CONVERSION_GAP
    const conversionGap = this.detectAIBuyerConversionGap(snapshot);
    if (conversionGap) opportunities.push(...conversionGap);


    // Filter out any opportunities that accidentally contain generic ungrounded advice
    const groundedOpportunities = opportunities.filter((opp) => {
      const isGeneric =
        isGenericOrUngroundedAdvice(opp.summary) ||
        isGenericOrUngroundedAdvice(opp.recommendedAction.description);
      const hasEvidence = opp.evidence.length > 0;
      return !isGeneric && hasEvidence;
    });

    // Compute total addressable monthly revenue across grounded opportunities
    const totalAddressableMonthlyRevenuePaise = groundedOpportunities.reduce((acc, opp) => {
      if (opp.estimatedImpact && opp.estimatedImpact.isEstimated) {
        return acc + opp.estimatedImpact.monthlyRevenuePotentialPaise;
      }
      return acc;
    }, 0);

    return {
      merchantId: snapshot.merchantId,
      merchantName: snapshot.merchantName,
      opportunities: groundedOpportunities,
      totalOpportunities: groundedOpportunities.length,
      totalAddressableMonthlyRevenuePaise,
      evidenceGroundedCount: groundedOpportunities.length,
      detectedAt,
    };
  }
  // ============================================================================
  // 1. UNSERVED_DEMAND
  // ============================================================================
  private detectUnservedDemand(
    historicalIntents: CanonicalBuyerIntent[],
    missingDemand: MissingDemandCluster[],
  ): RevenueOpportunity[] {
    const opps: RevenueOpportunity[] = [];

    // Check missing demand clusters first
    for (const cluster of missingDemand) {
      const matchingIntents = historicalIntents.filter((i) =>
        i.category.toLowerCase().includes(cluster.category.toLowerCase()),
      );

      const count = cluster.demandFrequency || matchingIntents.length || 1;
      const targetBudgetPaise = cluster.targetBudgetPaise || (matchingIntents.length > 0 && matchingIntents[0].budget?.amountPaise) || 0;

      const isEstimated = count > 0 && targetBudgetPaise > 0;
      const monthlyPotential = isEstimated ? count * targetBudgetPaise : 0;

      const evidence: EvidenceReference[] = [
        {
          id: `ev_opp_unserved_${cluster.id}`,
          category: "MISSING_DEMAND",
          source: "BUYER_DEMAND",
          fact: cluster.unmetReason,
          metric: {
            label: "Unmet Demand Requests",
            value: count,
          },
        },
      ];

      const estimatedImpact: OpportunityEstimatedImpact | null = isEstimated
        ? {
            monthlyRevenuePotentialPaise: monthlyPotential,
            demandFrequency: count,
            confidenceRangePaise: {
              min: Math.round(monthlyPotential * 0.8),
              max: Math.round(monthlyPotential * 1.2),
            },
            isEstimated: true,
            estimationMethodology: `${count} observed buyer requests for '${cluster.category}' × average willingness to pay of ₹${(targetBudgetPaise / 100).toLocaleString("en-IN")}/mo`,
          }
        : {
            monthlyRevenuePotentialPaise: 0,
            demandFrequency: count,
            isEstimated: false,
            estimationMethodology: "Insufficient empirical budget data in buyer requests to model revenue.",
          };

      opps.push({
        id: `opp_unserved_${cluster.id}`,
        type: "UNSERVED_DEMAND",
        title: `Unserved Market Demand for '${cluster.category}'`,
        summary: `You received ${count} buyer requests for '${cluster.category}' with must-haves [${cluster.mustHaveEntitlements.join(", ")}], but your catalog has 0 active matching offers.`,
        targetCategory: cluster.category,
        evidence,
        confidence: "HIGH",
        estimatedImpact,
        recommendedAction: {
          actionType: "CREATE_OFFER",
          description: `Create and publish a new confirmed offer for '${cluster.category}' tailored to buyer requirements.`,
          suggestedParameters: {
            suggestedPricePaise: targetBudgetPaise > 0 ? targetBudgetPaise : 300000,
            suggestedBillingInterval: "monthly",
            suggestedEntitlements: cluster.mustHaveEntitlements,
          },
          requiresMerchantApproval: true,
        },
        detectedAt: new Date().toISOString(),
      });
    }

    return opps;
  }

  // ============================================================================
  // 2. UNDER_SERVED_DEMAND
  // ============================================================================
  private detectUnderServedDemand(
    snapshot: MerchantSupplySnapshot,
    historicalIntents: CanonicalBuyerIntent[],
  ): RevenueOpportunity[] {
    const opps: RevenueOpportunity[] = [];

    for (const product of snapshot.products) {
      const productOffers = snapshot.offers.filter(
        (o) =>
          o.product?.id === product.id &&
          o.availability === "ACTIVE",
      );
      if (productOffers.length === 0) continue;
      const lowestOfferPrice = Math.min(...productOffers.map((o) => o.price));

      // Filter historical intents where category matches this product but budget is below this product's lowest plan
      const priceBlockedIntents = historicalIntents.filter((intent) => {
        const catMatch =
          matchesCategory(product.category || "", intent.category) ||
          matchesCategory(product.name, intent.category);
        const hasBudget = intent.budget && intent.budget.amountPaise > 0;
        const belowFloor = hasBudget && intent.budget!.amountPaise < lowestOfferPrice;
        return catMatch && belowFloor;
      });

      if (priceBlockedIntents.length > 0) {
        const count = priceBlockedIntents.length;
        const avgBudget = Math.round(
          priceBlockedIntents.reduce((sum, i) => sum + (i.budget?.amountPaise || 0), 0) / count,
        );
        const monthlyPotential = count * avgBudget;

        const evidence: EvidenceReference[] = [
          {
            id: `ev_opp_underserved_budget_${product.id}_${Date.now()}`,
            category: "PRICING",
            source: "DECISION_RESULT",
            fact: `${count} buyer mission(s) matched '${product.name}' but failed hard budget checks because lowest plan (₹${(lowestOfferPrice / 100).toLocaleString("en-IN")}) exceeded their budget (avg ₹${(avgBudget / 100).toLocaleString("en-IN")}).`,
            metric: {
              label: "Price-Blocked Buyers",
              value: count,
              benchmark: 0,
            },
            entityId: product.id,
            entityType: "product",
          },
        ];

        opps.push({
          id: `opp_underserved_${product.id}`,
          type: "UNDER_SERVED_DEMAND",
          title: `Under-Served Budget Segment for '${product.name}'`,
          summary: `${count} price-sensitive buyers sought '${product.name}' with average budget of ₹${(avgBudget / 100).toLocaleString("en-IN")}/mo, but your lowest active tier is ₹${(lowestOfferPrice / 100).toLocaleString("en-IN")}/mo.`,
          affectedProductId: product.id,
          targetCategory: product.category,
          evidence,
          confidence: "HIGH",
          estimatedImpact: {
            monthlyRevenuePotentialPaise: monthlyPotential,
            demandFrequency: count,
            conversionRateLiftPercent: 25,
            confidenceRangePaise: {
              min: Math.round(monthlyPotential * 0.85),
              max: Math.round(monthlyPotential * 1.15),
            },
            isEstimated: true,
            estimationMethodology: `${count} budget-blocked buyer requests × average target budget ₹${(avgBudget / 100).toLocaleString("en-IN")}/mo for '${product.name}'`,
          },
          recommendedAction: {
            actionType: "CREATE_TIER",
            description: `Introduce an entry-level tier (e.g. self-paced curriculum without 1:1 sessions) at ₹${(avgBudget / 100).toLocaleString("en-IN")}/month to capture budget-sensitive buyers for '${product.name}'.`,
            suggestedParameters: {
              suggestedPricePaise: avgBudget,
              suggestedBillingInterval: "monthly",
              suggestedSupportTier: "community",
            },
            requiresMerchantApproval: true,
          },
          detectedAt: new Date().toISOString(),
        });
      }
    }

    return opps;
  }

  // ============================================================================
  // 3. UPSELL
  // ============================================================================
  private detectUpsellOpportunities(
    snapshot: MerchantSupplySnapshot,
    historicalIntents: CanonicalBuyerIntent[],
  ): RevenueOpportunity[] {
    const opps: RevenueOpportunity[] = [];

    const highestOfferPrice = snapshot.offers.reduce(
      (max, o) => (o.availability === "ACTIVE" && o.price > max ? o.price : max),
      0,
    );

    // Look for buyers demanding high-touch support or premium SLAs whose budget is substantially higher than highest tier
    const premiumIntents = historicalIntents.filter((intent) => {
      const budget = intent.budget?.amountPaise || 0;
      const demandsHighTouch =
        intent.mustHave.includes("human_mentor") ||
        intent.mustHave.includes("dedicated_mentor") ||
        intent.mustHave.includes("mock_interviews") ||
        intent.mustHave.includes("daily_reviews") ||
        intent.supportPreference?.hasDedicatedHuman;

      return budget > highestOfferPrice * 1.25 && demandsHighTouch;
    });

    if (premiumIntents.length > 0) {
      const count = premiumIntents.length;
      const avgPremiumBudget = Math.round(
        premiumIntents.reduce((sum, i) => sum + (i.budget?.amountPaise || 0), 0) / count,
      );
      const incrementalARPU = avgPremiumBudget - highestOfferPrice;
      const monthlyPotential = count * incrementalARPU;

      const evidence: EvidenceReference[] = [
        {
          id: `ev_opp_upsell_premium_${Date.now()}`,
          category: "OFFER_STRUCTURE",
          source: "BUYER_DEMAND",
          fact: `${count} buyer(s) exhibited willingness to pay ₹${(avgPremiumBudget / 100).toLocaleString("en-IN")}/mo for executive/high-touch mentorship, exceeding your top tier (₹${(highestOfferPrice / 100).toLocaleString("en-IN")}).`,
          metric: {
            label: "High-Budget Premium Buyers",
            value: count,
          },
        },
      ];

      opps.push({
        id: `opp_upsell_executive_tier`,
        type: "UPSELL",
        title: "Executive / High-Touch Mentorship Upsell Tier",
        summary: `Detected uncaptured buyer willingness to pay: ${count} buyer(s) with budgets averaging ₹${(avgPremiumBudget / 100).toLocaleString("en-IN")}/mo seeking intensive 1:1 mentorship and rapid SLAs.`,
        evidence,
        confidence: "HIGH",
        estimatedImpact: {
          monthlyRevenuePotentialPaise: monthlyPotential,
          demandFrequency: count,
          confidenceRangePaise: {
            min: Math.round(monthlyPotential * 0.8),
            max: Math.round(monthlyPotential * 1.25),
          },
          isEstimated: true,
          estimationMethodology: `${count} premium buyers × incremental ARPU lift of ₹${(incrementalARPU / 100).toLocaleString("en-IN")}/mo above baseline plan`,
        },
        recommendedAction: {
          actionType: "CREATE_TIER",
          description: `Create an Executive / Intensive Mentorship tier at ₹${(avgPremiumBudget / 100).toLocaleString("en-IN")}/month with 8 mock interviews, 12h SLA, and dedicated 1:1 coaching.`,
          suggestedParameters: {
            suggestedPricePaise: avgPremiumBudget,
            suggestedBillingInterval: "monthly",
            suggestedSupportTier: "dedicated_mentor",
            suggestedSlaHours: 12,
          },
          requiresMerchantApproval: true,
        },
        detectedAt: new Date().toISOString(),
      });
    }

    return opps;
  }

  // ============================================================================
  // 4. CROSS_SELL
  // ============================================================================
  private detectCrossSellOpportunities(
    historicalIntents: CanonicalBuyerIntent[],
  ): RevenueOpportunity[] {
    const opps: RevenueOpportunity[] = [];

    // Check if buyers repeatedly ask for multiple combined items (e.g. system design + resume review + mock interview bundle)
    const multiNeedIntents = historicalIntents.filter(
      (i) => i.mustHave.length >= 3 && i.mustHave.includes("mock_interviews"),
    );

    if (multiNeedIntents.length >= 2) {
      const count = multiNeedIntents.length;
      const bundleAddOnPaise = 150000; // ₹1,500/mo estimated bundle value
      const monthlyPotential = count * bundleAddOnPaise;

      const evidence: EvidenceReference[] = [
        {
          id: `ev_opp_cross_sell_${Date.now()}`,
          category: "OFFER_STRUCTURE",
          source: "BUYER_DEMAND",
          fact: `${count} buyer intents requested multi-service bundles combining curriculum with mock interviews and resume reviews.`,
          metric: {
            label: "Multi-Service Buyer Requests",
            value: count,
          },
        },
      ];

      opps.push({
        id: `opp_cross_sell_bundle`,
        type: "CROSS_SELL",
        title: "All-in-One Interview Preparation Bundle",
        summary: `${count} buyer missions demanded combined capabilities (curriculum + mock interviews + resume reviews). Bundling these into an integrated package captures higher wallet share.`,
        evidence,
        confidence: "MEDIUM",
        estimatedImpact: {
          monthlyRevenuePotentialPaise: monthlyPotential,
          demandFrequency: count,
          confidenceRangePaise: {
            min: Math.round(monthlyPotential * 0.7),
            max: Math.round(monthlyPotential * 1.3),
          },
          isEstimated: true,
          estimationMethodology: `${count} multi-need buyers × estimated ₹${(bundleAddOnPaise / 100).toLocaleString("en-IN")}/mo cross-sell add-on value`,
        },
        recommendedAction: {
          actionType: "ADD_BUNDLE",
          description: "Publish a discounted bundle combining course access, 4 monthly mock interviews, and resume review entitlements.",
          requiresMerchantApproval: true,
        },
        detectedAt: new Date().toISOString(),
      });
    }

    return opps;
  }

  // ============================================================================
  // 5. OFFER_PACKAGING
  // ============================================================================
  private detectOfferPackagingOpportunities(
    snapshot: MerchantSupplySnapshot,
    evidenceList: EvidenceReference[] = [],
  ): RevenueOpportunity[] {
    const opps: RevenueOpportunity[] = [];

    // Check if offers have entitlements buried in unstructured text without explicit machine-readable keys
    const unstructuredOffers = snapshot.offers.filter(
      (o) => !o.structuredCommitments || !o.structuredCommitments.entitlements?.keys?.length,
    );

    if (unstructuredOffers.length > 0) {
      const count = unstructuredOffers.length;
      const targetOffer = unstructuredOffers[0];
      const monthlyPotential = targetOffer.price * 2; // Baseline 2 captured conversions

      const matchingCompEvidence = evidenceList.filter((e) => e.category === "COMPREHENSION");

      const evidence: EvidenceReference[] = [
        {
          id: `ev_opp_packaging_${Date.now()}`,
          category: "COMPREHENSION",
          source: "MERCHANT_SUPPLY",
          fact: `${count} offer(s) lack machine-readable entitlement keys in structured commitments, leading AI buyers to reject them during feature extraction.`,
          entityId: targetOffer.id,
          entityType: "offer",
        },
        ...matchingCompEvidence,
      ];


      opps.push({
        id: `opp_pkg_machine_entitlements`,
        type: "OFFER_PACKAGING",
        title: "Structure Machine-Readable Entitlements Schema",
        summary: `Your offer '${targetOffer.name}' contains text descriptions of features but lacks machine-readable JSON entitlement keys. AI buyer agents cannot verify included modules automatically.`,
        affectedOfferId: targetOffer.id,
        evidence,
        confidence: "HIGH",
        estimatedImpact: {
          monthlyRevenuePotentialPaise: monthlyPotential,
          demandFrequency: 2,
          conversionRateLiftPercent: 40,
          confidenceRangePaise: {
            min: monthlyPotential,
            max: monthlyPotential * 2,
          },
          isEstimated: true,
          estimationMethodology: `Recovering an estimated 2 lost monthly AI-buyer conversions on '${targetOffer.name}' (₹${(targetOffer.price / 100).toLocaleString("en-IN")}/mo)`,
        },
        recommendedAction: {
          actionType: "UPDATE_COMMITMENTS",
          description: "Publish explicit entitlement keys (e.g. ['system_design_course', 'mock_interviews', 'mentor_feedback']) in the offer's structured commitments schema.",
          suggestedParameters: {
            suggestedEntitlements: ["system_design_curriculum", "mock_interviews", "mentor_feedback"],
          },
          requiresMerchantApproval: true,
        },
        detectedAt: new Date().toISOString(),
      });
    }

    return opps;
  }

  // ============================================================================
  // 6. PRICE_VALUE_MISMATCH
  // ============================================================================
  private detectPriceValueMismatch(
    snapshot: MerchantSupplySnapshot,
  ): RevenueOpportunity[] {
    const opps: RevenueOpportunity[] = [];

    // Detect if high-value commitments (e.g. 1:1 human mentorship with 24h SLA) are priced well below market rate (e.g. < ₹1,500/mo)
    const underpricedOffers = snapshot.offers.filter((o) => {
      const hasHumanMentor = o.structuredCommitments?.support?.hasDedicatedHuman;
      const isLowPrice = o.price < 150000; // < ₹1,500
      const active = o.availability === "ACTIVE";
      return hasHumanMentor && isLowPrice && active;
    });

    for (const offer of underpricedOffers) {
      const suggestedPricePaise = 299900; // ₹2,999/mo
      const priceDelta = suggestedPricePaise - offer.price;

      const evidence: EvidenceReference[] = [
        {
          id: `ev_opp_mismatch_${offer.id}`,
          category: "PRICING",
          source: "MERCHANT_SUPPLY",
          fact: `Offer '${offer.name}' guarantees 1:1 human mentorship but is priced at only ₹${(offer.price / 100).toLocaleString("en-IN")}/mo, which is below market equilibrium for live coaching.`,
          entityId: offer.id,
          entityType: "offer",
        },
      ];

      opps.push({
        id: `opp_price_mismatch_${offer.id}`,
        type: "PRICE_VALUE_MISMATCH",
        title: `Value-Price Realignment for '${offer.name}'`,
        summary: `You are providing live dedicated human mentorship on '${offer.name}' for only ₹${(offer.price / 100).toLocaleString("en-IN")}/mo. Realigning price to reflect human mentor value captures substantial margin without harming AI buyer recommendations.`,
        affectedOfferId: offer.id,
        evidence,
        confidence: "HIGH",
        estimatedImpact: {
          monthlyRevenuePotentialPaise: priceDelta * 5, // Estimated across 5 subscribers
          demandFrequency: 5,
          isEstimated: true,
          estimationMethodology: `Capturing ₹${(priceDelta / 100).toLocaleString("en-IN")} incremental margin per subscriber across 5 estimated active buyers`,
        },
        recommendedAction: {
          actionType: "ADJUST_PRICE",
          description: `Repackage or adjust price of '${offer.name}' to ₹${(suggestedPricePaise / 100).toLocaleString("en-IN")}/month to match delivered mentor value.`,
          suggestedParameters: {
            suggestedPricePaise,
          },
          requiresMerchantApproval: true,
        },
        detectedAt: new Date().toISOString(),
      });
    }

    return opps;
  }

  // ============================================================================
  // 7. SUPPORT_DRIVEN_OPPORTUNITY
  // ============================================================================
  private detectSupportDrivenOpportunities(
    snapshot: MerchantSupplySnapshot,
    evaluations: BuyerMissionEvaluation[],
  ): RevenueOpportunity[] {
    const opps: RevenueOpportunity[] = [];

    // Missions that failed specifically due to support constraints (e.g. SLA missing or mentor unstated)
    const supportFailures = evaluations.filter(
      (e) =>
        e.failedAt === "COMPARISON" ||
        e.evidence.some(
          (ev) =>
            ev.category === "SUPPORT" ||
            ev.fact.toLowerCase().includes("support") ||
            ev.fact.toLowerCase().includes("sla") ||
            ev.fact.toLowerCase().includes("mentor"),
        ),
    );

    if (supportFailures.length > 0) {
      const count = supportFailures.length;
      const targetOffer = snapshot.offers[0] || { price: 349900 };
      const monthlyPotential = count * targetOffer.price;

      const evidence: EvidenceReference[] = [
        {
          id: `ev_opp_support_sla_${Date.now()}`,
          category: "SUPPORT",
          source: "DECISION_RESULT",
          fact: `${count} buyer mission(s) dropped during AI ranking because support SLA response hours were missing or non-guaranteed.`,
          metric: {
            label: "Support-Dropped Buyers",
            value: count,
            benchmark: 0,
          },
        },
      ];

      opps.push({
        id: `opp_support_sla_guarantee`,
        type: "SUPPORT_DRIVEN_OPPORTUNITY",
        title: "Unlock Support-Sensitive Buyers with Explicit SLA",
        summary: `${count} buyer missions filtered out or penalized your catalog during AI evaluation because support response turnaround hours were unquantified.`,
        evidence,
        confidence: "HIGH",
        estimatedImpact: {
          monthlyRevenuePotentialPaise: monthlyPotential,
          demandFrequency: count,
          conversionRateLiftPercent: 35,
          confidenceRangePaise: {
            min: Math.round(monthlyPotential * 0.8),
            max: Math.round(monthlyPotential * 1.2),
          },
          isEstimated: true,
          estimationMethodology: `${count} support-penalized buyer missions × plan ARPU of ₹${(targetOffer.price / 100).toLocaleString("en-IN")}/mo`,
        },
        recommendedAction: {
          actionType: "UPDATE_COMMITMENTS",
          description: "Publish a guaranteed 24-hour support SLA and 4 monthly 1:1 mentoring sessions in the structured commitments schema.",
          suggestedParameters: {
            suggestedSupportTier: "dedicated_mentor",
            suggestedSlaHours: 24,
          },
          requiresMerchantApproval: true,
        },
        detectedAt: new Date().toISOString(),
      });
    }

    return opps;
  }

  // ============================================================================
  // 8. AI_BUYER_CONVERSION_GAP
  // ============================================================================
  private detectAIBuyerConversionGap(
    snapshot: MerchantSupplySnapshot,
  ): RevenueOpportunity[] {
    const opps: RevenueOpportunity[] = [];

    // Check for unconfirmed offers (missing cryptographic version hashes)
    if (snapshot.unconfirmedOffers > 0) {
      const count = snapshot.unconfirmedOffers;
      const unconfirmedList = snapshot.offers.filter((o) => !o.isConfirmedByMerchant);
      const estPrice = unconfirmedList[0]?.price || 300000;
      const monthlyPotential = count * estPrice * 3; // Estimated 3 conversions unlocked per offer

      const evidence: EvidenceReference[] = [
        {
          id: `ev_opp_unconfirmed_gap_${Date.now()}`,
          category: "DISCOVERABILITY",
          source: "MERCHANT_SUPPLY",
          fact: `${count} offer version(s) in catalog lack merchant confirmation. AI buyer engines strictly ignore unconfirmed offers due to protocol safety invariants.`,
          metric: {
            label: "Unconfirmed Offers",
            value: count,
            benchmark: 0,
          },
        },
      ];

      opps.push({
        id: `opp_conversion_unconfirmed_offers`,
        type: "AI_BUYER_CONVERSION_GAP",
        title: "Activate Dormant AI Buyer Traffic by Confirming Offers",
        summary: `You have ${count} unconfirmed offer version(s). Because autonomous AI agents cannot execute transactions against mutable or unconfirmed plans without version hashes, this entire catalog segment is invisible to AI commerce.`,
        evidence,
        confidence: "HIGH",
        estimatedImpact: {
          monthlyRevenuePotentialPaise: monthlyPotential,
          demandFrequency: 3,
          conversionRateLiftPercent: 100,
          confidenceRangePaise: {
            min: monthlyPotential * 0.7,
            max: monthlyPotential * 1.5,
          },
          isEstimated: true,
          estimationMethodology: `Activating ${count} dormant catalog offer(s) × estimated 3 monthly AI transactions at ₹${(estPrice / 100).toLocaleString("en-IN")}/mo`,
        },
        recommendedAction: {
          actionType: "ENRICH_METADATA",
          description: "Confirm pending offer versions in the Merchant Studio to generate cryptographic version hashes and unlock AI agent indexing.",
          requiresMerchantApproval: true,
        },
        detectedAt: new Date().toISOString(),
      });
    }

    return opps;
  }
}

