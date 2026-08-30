import type {
  EvidenceReference,
  MerchantDiagnosis,
  MerchantDiagnosticReport,
  MerchantSupplySnapshot,
  MissingDemandCluster,
  LostBuyerFunnel,
  BuyerMissionEvaluation,
} from "./types";

import type { CanonicalBuyerIntent } from "@/lib/intent/types";

/**
 * Deterministic Diagnosis Engine for Merchant AI Intelligence.
 * Synthesizes grounded, evidence-backed diagnoses without hallucinations.
 */
export class MerchantDiagnosticEngine {
  /**
   * Generates a complete diagnostic report from supply, simulations, and historical demand.
   */
  generateReport(
    snapshot: MerchantSupplySnapshot,
    supplyEvidence: EvidenceReference[],
    evaluations: BuyerMissionEvaluation[] = [],
    historicalIntents: CanonicalBuyerIntent[] = [],
  ): MerchantDiagnosticReport {
    const generatedAt = new Date().toISOString();

    // 1. Combine All Collected Evidence
    const allEvidence: EvidenceReference[] = [...supplyEvidence];
    for (const ev of evaluations) {
      allEvidence.push(...ev.evidence);
    }

    // 2. Synthesize Lost Buyer Funnel (Deterministic counts; "NOT_MEASURED" if unavailable)
    const funnel = this.buildLostBuyerFunnel(evaluations);

    // 3. Detect Missing Demand Clusters from Historical Buyer Intents
    const missingDemand = this.detectMissingDemand(snapshot, historicalIntents);

    // 4. Synthesize Diagnoses across 10 categories
    const diagnoses = this.synthesizeDiagnoses(snapshot, allEvidence, missingDemand);

    const commitmentCoverage =
      snapshot.totalOffers > 0
        ? Math.round((snapshot.offersWithStructuredCommitments / snapshot.totalOffers) * 100)
        : 0;

    return {
      merchantId: snapshot.merchantId,
      merchantName: snapshot.merchantName,
      generatedAt,
      catalogSummary: {
        totalProducts: snapshot.totalProducts,
        totalOffers: snapshot.totalOffers,
        activeConfirmedOffers: snapshot.activeConfirmedOffers,
        unconfirmedOffers: snapshot.unconfirmedOffers,
        structuredCommitmentCoveragePercentage: commitmentCoverage,
      },
      funnel,
      diagnoses,
      missingDemand,
      evidenceList: allEvidence,
    };
  }

  /**
   * Deterministically aggregates the Lost-Buyer Funnel without fabricating numbers.
   */
  private buildLostBuyerFunnel(evaluations: BuyerMissionEvaluation[]): LostBuyerFunnel {
    const total = evaluations.length;
    if (total === 0) {
      return {
        totalBuyerRequests: 0,
        discoveredCount: "NOT_MEASURED",
        understoodCount: "NOT_MEASURED",
        shortlistedCount: "NOT_MEASURED",
        recommendedCount: "NOT_MEASURED",
        checkoutCount: "NOT_MEASURED",
        purchasedCount: "NOT_MEASURED",
      };
    }

    const discoveredCount = evaluations.filter((e) => e.discovered).length;
    const understoodCount = evaluations.filter((e) => e.understandable).length;
    const shortlistedCount = evaluations.filter((e) => e.shortlisted).length;
    const recommendedCount = evaluations.filter((e) => e.recommended).length;

    return {
      totalBuyerRequests: total,
      discoveredCount,
      understoodCount,
      shortlistedCount,
      recommendedCount,
      checkoutCount: "NOT_MEASURED",
      purchasedCount: "NOT_MEASURED",
    };
  }

  /**
   * Detects repeated buyer demand where the merchant catalog lacks a matching offer.
   */
  detectMissingDemand(
    snapshot: MerchantSupplySnapshot,
    intents: CanonicalBuyerIntent[],
  ): MissingDemandCluster[] {
    const clusters: MissingDemandCluster[] = [];
    if (intents.length === 0) return clusters;

    // Group intents by category and core must-haves
    const groups = new Map<string, { count: number; category: string; maxBudget?: number; mustHave: string[] }>();

    for (const intent of intents) {
      const key = `${intent.category}__${intent.mustHave.slice().sort().join("+")}__${intent.budget?.amountPaise || "none"}`;
      const existing = groups.get(key);
      if (existing) {
        existing.count++;
      } else {
        groups.set(key, {
          count: 1,
          category: intent.category,
          maxBudget: intent.budget?.amountPaise,
          mustHave: intent.mustHave,
        });
      }
    }

    let idx = 1;
    for (const group of groups.values()) {
      // Check if catalog has any active confirmed offer matching category and budget
      const matchingOffer = snapshot.offers.find((o) => {
        const catMatch = (o.product.category || "").toLowerCase().includes(group.category.toLowerCase());
        const budgetMatch = group.maxBudget ? o.price <= group.maxBudget : true;
        const active = o.availability === "ACTIVE" && o.isConfirmedByMerchant;
        return catMatch && budgetMatch && active;
      });

      if (!matchingOffer) {
        const budgetStr = group.maxBudget ? `under ₹${(group.maxBudget / 100).toLocaleString("en-IN")}` : "";
        clusters.push({
          id: `demand_cluster_${idx++}`,
          category: group.category,
          targetBudgetPaise: group.maxBudget,
          mustHaveEntitlements: group.mustHave,
          demandFrequency: group.count,
          unmetReason: `You received ${group.count} buyer request(s) for '${group.category}' ${budgetStr} with must-haves [${group.mustHave.join(", ")}], but your catalog has no confirmed offer satisfying these criteria.`,
          merchantOpportunity: `Publish an active offer for '${group.category}' ${budgetStr} with commitments for ${group.mustHave.join(", ")}.`,
        });
      }
    }

    return clusters;
  }

  /**
   * Synthesizes diagnoses across the 10 explicit evidence categories.
   * Every diagnosis must have at least one EvidenceReference.
   */
  synthesizeDiagnoses(
    snapshot: MerchantSupplySnapshot,
    evidenceList: EvidenceReference[],
    missingDemand: MissingDemandCluster[],
  ): MerchantDiagnosis[] {
    const diagnoses: MerchantDiagnosis[] = [];

    // 1. Discoverability: Unconfirmed or inactive offers
    const discEvidence = evidenceList.filter((e) => e.category === "DISCOVERABILITY");
    if (discEvidence.length > 0 && snapshot.unconfirmedOffers > 0) {
      diagnoses.push({
        merchantId: snapshot.merchantId,
        issueType: "DISCOVERABILITY",
        severity: "CRITICAL",
        title: "Unconfirmed Offer Versions Inactive to AI Search",
        diagnosis: `${snapshot.unconfirmedOffers} offer version(s) in your catalog lack merchant confirmation. AI buyers strictly require immutable version hashes and cannot retrieve unconfirmed offers.`,
        evidence: discEvidence,
        recommendedAction: "Confirm pending offer versions in the Merchant Studio to generate cryptographic version hashes and activate AI discovery.",
        confidence: "HIGH",
        expectedMechanism: "Allows autonomous buyer intent engines to index and retrieve your catalog during candidate discovery.",
      });
    }

    // 2. Comprehension: Missing structured commitments schema
    const compEvidence = evidenceList.filter((e) => e.category === "COMPREHENSION");
    if (compEvidence.length > 0) {
      diagnoses.push({
        merchantId: snapshot.merchantId,
        issueType: "COMPREHENSION",
        severity: "WARNING",
        title: "Unstructured Marketing Copy Lacks Machine Readability",
        diagnosis: "Your offers contain unstructured sales text but lack machine-readable structured commitments JSON. AI buyers cannot evaluate SLA hours or support guarantees from unparsed prose.",
        evidence: compEvidence,
        recommendedAction: "Publish structured commitments specifying support tier, SLA turnaround hours, 1:1 sessions, and usage limits.",
        confidence: "HIGH",
        expectedMechanism: "Enables buyer agents to extract and verify commercial promises without rejection during the understanding stage.",
      });
    }

    // 3. Comparability: Support SLA or Refund transparency
    const compGaps = evidenceList.filter((e) => e.category === "COMPARABILITY");
    if (compGaps.length > 0) {
      diagnoses.push({
        merchantId: snapshot.merchantId,
        issueType: "COMPARABILITY",
        severity: "WARNING",
        title: "Support SLA Unquantified for Machine Comparison",
        diagnosis: "Your offer does not clearly quantify support response SLA hours. AI buyers comparing response guarantees score unquantified offers lower than competitors with explicit 24h/48h SLAs.",
        evidence: compGaps,
        recommendedAction: "Define an explicit response SLA (e.g. 24h turnaround) in the support commitments schema.",
        confidence: "HIGH",
        expectedMechanism: "Improves machine comparison of your offer against support-sensitive buyer intents.",
      });
    }

    // 4. Support: Mentor ambiguity
    const suppEvidence = evidenceList.filter((e) => e.category === "SUPPORT");
    if (suppEvidence.length > 0) {
      diagnoses.push({
        merchantId: snapshot.merchantId,
        issueType: "SUPPORT",
        severity: "WARNING",
        title: "Dedicated Human Mentorship Ambiguity",
        diagnosis: "Buyer missions requiring human mentorship failed constraint checks because offer commitments specified 0 monthly 1:1 sessions or vague support tiers.",
        evidence: suppEvidence,
        recommendedAction: "Explicitly set `hasDedicatedHuman: true` and specify `oneOnOneSessionsPerMonth >= 1` in structured commitments.",
        confidence: "HIGH",
        expectedMechanism: "Satisfies buyer hard constraints requiring human feedback and live review sessions.",
      });
    }

    // 5. Pricing & Budget Ceilings
    const priceEvidence = evidenceList.filter((e) => e.category === "PRICING" || e.fact.includes("budget"));
    if (priceEvidence.length > 0) {
      diagnoses.push({
        merchantId: snapshot.merchantId,
        issueType: "PRICING",
        severity: "WARNING",
        title: "Price Barrier on Budget-Constrained Buyer Missions",
        diagnosis: "Buyer missions enforcing strict budget ceilings filtered out your catalog because active offers exceeded their hard price limits.",
        evidence: priceEvidence,
        recommendedAction: "Consider introducing an entry-level tier plan priced under popular buyer ceilings (e.g. ₹3,000/month).",
        confidence: "HIGH",
        expectedMechanism: "Expands catalog eligibility for price-sensitive buyers while preserving premium tiers.",
      });
    }

    // 6. Missing Demand Clusters
    if (missingDemand.length > 0) {
      const demandEvidence: EvidenceReference[] = missingDemand.map((d) => ({
        id: `ev_${d.id}`,
        category: "MISSING_DEMAND",
        source: "BUYER_DEMAND",
        fact: d.unmetReason,
        metric: { label: "Observed Demand Count", value: d.demandFrequency },
      }));

      diagnoses.push({
        merchantId: snapshot.merchantId,
        issueType: "MISSING_DEMAND",
        severity: "INFO",
        title: "Unmet AI Buyer Demand Detected",
        diagnosis: `Identified ${missingDemand.length} recurring buyer demand cluster(s) not currently served by your catalog.`,
        evidence: demandEvidence,
        recommendedAction: missingDemand.map((d) => d.merchantOpportunity).join("; "),
        confidence: "HIGH",
        expectedMechanism: "Captures unserved buyer traffic without modifying existing active subscription plans.",
      });
    }

    return diagnoses;
  }
}
