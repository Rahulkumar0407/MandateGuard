"use client";

import React, { useEffect, useState } from "react";
import type { ViewTab } from "./Navbar";
import type {
  OpportunityAnalysisReport,
  OpportunityType,
} from "@/lib/merchant-intelligence/opportunity-types";

interface MerchantRevenueOpportunitiesProps {
  onNavigateTab?: (tab: ViewTab) => void;
}

const TYPE_COLORS: Record<OpportunityType, { badge: string; border: string }> = {
  UNSERVED_DEMAND: {
    badge: "bg-[var(--mg-brand-soft)] text-[var(--mg-brand)] border-[var(--mg-brand-line)]",
    border: "border-[var(--mg-border)]",
  },
  UNDER_SERVED_DEMAND: {
    badge: "bg-[var(--mg-brand-soft)] text-[var(--mg-brand)] border-[var(--mg-brand-line)]",
    border: "border-[var(--mg-border)]",
  },
  UPSELL: {
    badge: "bg-[var(--mg-success-soft)] text-[var(--mg-success)] border-[var(--mg-success)]/20",
    border: "border-[var(--mg-border)]",
  },
  CROSS_SELL: {
    badge: "bg-[var(--mg-brand-soft)] text-[var(--mg-brand)] border-[var(--mg-brand-line)]",
    border: "border-[var(--mg-border)]",
  },
  OFFER_PACKAGING: {
    badge: "bg-[var(--mg-warning-soft)] text-[var(--mg-warning)] border-[var(--mg-warning)]/30",
    border: "border-[var(--mg-border)]",
  },
  PRICE_VALUE_MISMATCH: {
    badge: "bg-[var(--mg-critical-soft)] text-[var(--mg-critical)] border-[var(--mg-critical)]/30",
    border: "border-[var(--mg-border)]",
  },
  SUPPORT_DRIVEN_OPPORTUNITY: {
    badge: "bg-[var(--mg-brand-soft)] text-[var(--mg-brand)] border-[var(--mg-brand-line)]",
    border: "border-[var(--mg-border)]",
  },
  AI_BUYER_CONVERSION_GAP: {
    badge: "bg-[var(--mg-warning-soft)] text-[var(--mg-warning)] border-[var(--mg-warning)]/30",
    border: "border-[var(--mg-border)]",
  },
};

export function MerchantRevenueOpportunities({
  onNavigateTab,
}: MerchantRevenueOpportunitiesProps) {
  const [report, setReport] = useState<OpportunityAnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [expandedOppId, setExpandedOppId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOpportunities() {
      setLoading(true);
      try {
        const res = await fetch("/api/merchant/revenue-opportunities");
        if (res.ok) {
          const data = await res.json();
          setReport(data);
          if (data.opportunities && data.opportunities.length > 0) {
            setExpandedOppId(data.opportunities[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load revenue opportunities", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOpportunities();
  }, []);

  const opportunities = report?.opportunities || [];
  const filtered =
    selectedType === "ALL"
      ? opportunities
      : opportunities.filter((o) => o.type === selectedType);

  const formatPaise = (paise: number) => {
    return `₹${(paise / 100).toLocaleString("en-IN")}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white border border-[var(--mg-border)] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--mg-success-soft)] text-[var(--mg-success)] border border-[var(--mg-success)]/20">
              Evidence-Backed
            </span>
            <span className="text-xs text-[var(--mg-text-muted)]">M10-C3 Revenue Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--mg-navy)] tracking-tight">
            Catalog Revenue Opportunities
          </h2>
          <p className="text-xs sm:text-sm text-[var(--mg-text-secondary)] max-w-2xl mt-1 leading-relaxed">
            Latent revenue discovery from buyer search patterns, unmet demand clusters, and
            structured catalog enhancements.
          </p>
        </div>

        <div className="bg-[var(--mg-bg)] border border-[var(--mg-border)] rounded-2xl p-5 text-right min-w-[220px]">
          <span className="text-[10px] font-bold text-[var(--mg-text-muted)] block uppercase tracking-wider">
            Total Addressable Revenue
          </span>
          <div className="text-3xl font-black text-[var(--mg-navy)] mt-1">
            {report ? formatPaise(report.totalAddressableMonthlyRevenuePaise) : "₹0"}
            <span className="text-xs font-normal text-[var(--mg-text-muted)] ml-1">/ mo</span>
          </div>
          <span className="text-[11px] text-[var(--mg-text-secondary)] block mt-1">
            From {report?.evidenceGroundedCount || 0} grounded opportunities
          </span>
        </div>
      </div>

      {/* Invariant Safety Notice */}
      <div className="bg-[var(--mg-bg-blue)] border border-[var(--mg-brand-line)] rounded-xl px-4 py-3 text-xs text-[var(--mg-text-secondary)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--mg-brand)]" />
          <span>
            <strong className="text-[var(--mg-navy)]">Safety Invariant:</strong> Detect from empirical
            evidence first. Zero revenue hallucinations. All proposed modifications require merchant
            approval.
          </span>
        </div>
        <span className="text-[var(--mg-brand)] font-mono text-[11px] hidden sm:inline font-semibold">ZERO AUTO-MUTATIONS</span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedType("ALL")}
          className={`px-3.5 py-1.5 rounded-xl border font-bold transition-all ${
            selectedType === "ALL"
              ? "bg-[var(--mg-brand)] text-white border-[var(--mg-brand)] shadow-xs"
              : "bg-white text-[var(--mg-text-secondary)] border-[var(--mg-border)] hover:text-[var(--mg-navy)] hover:bg-[var(--mg-bg)]"
          }`}
        >
          All ({opportunities.length})
        </button>
        {(
          [
            "UNSERVED_DEMAND",
            "UNDER_SERVED_DEMAND",
            "UPSELL",
            "CROSS_SELL",
            "OFFER_PACKAGING",
            "PRICE_VALUE_MISMATCH",
            "SUPPORT_DRIVEN_OPPORTUNITY",
            "AI_BUYER_CONVERSION_GAP",
          ] as OpportunityType[]
        ).map((type) => {
          const count = opportunities.filter((o) => o.type === type).length;
          if (count === 0) return null;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3.5 py-1.5 rounded-xl border font-bold transition-all whitespace-nowrap ${
                selectedType === type
                  ? "bg-[var(--mg-brand)] text-white border-[var(--mg-brand)] shadow-xs"
                  : "bg-white text-[var(--mg-text-secondary)] border-[var(--mg-border)] hover:text-[var(--mg-navy)] hover:bg-[var(--mg-bg)]"
              }`}
            >
              {type.replace(/_/g, " ")} ({count})
            </button>
          );
        })}
      </div>

      {/* Opportunity Cards List */}
      {loading ? (
        <div className="p-12 text-center text-[var(--mg-text-secondary)] bg-white rounded-2xl border border-[var(--mg-border)]">
          <div className="animate-spin w-6 h-6 border-2 border-[var(--mg-brand)] border-t-transparent rounded-full mx-auto mb-3" />
          Analyzing catalog evidence &amp; buyer demand traces...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-[var(--mg-text-secondary)] bg-white rounded-2xl border border-[var(--mg-border)]">
          No opportunities detected matching the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((opp) => {
            const isExpanded = expandedOppId === opp.id;
            const color = TYPE_COLORS[opp.type] || {
              badge: "bg-[var(--mg-bg-muted)] text-[var(--mg-text-secondary)] border-[var(--mg-border)]",
              border: "border-[var(--mg-border)]",
            };

            return (
              <div
                key={opp.id}
                className={`bg-white border ${
                  isExpanded ? "border-[var(--mg-brand)] ring-1 ring-[var(--mg-brand)]/20" : color.border
                } rounded-2xl overflow-hidden transition-all shadow-xs`}
              >
                {/* Main Header Row */}
                <div
                  onClick={() => setExpandedOppId(isExpanded ? null : opp.id)}
                  className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[var(--mg-bg)]/60 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${color.badge}`}
                      >
                        {opp.type.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-[var(--mg-text-muted)] font-mono">
                        Confidence: <strong className="text-[var(--mg-navy)]">{opp.confidence}</strong>
                      </span>
                      {opp.targetCategory && (
                        <span className="text-xs text-[var(--mg-text-secondary)] bg-[var(--mg-bg)] px-2.5 py-0.5 rounded-md border border-[var(--mg-border)]">
                          Category: {opp.targetCategory}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-[var(--mg-navy)]">{opp.title}</h3>
                    <p className="text-xs text-[var(--mg-text-secondary)] line-clamp-2">{opp.summary}</p>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-[var(--mg-border)]">
                    {opp.estimatedImpact && opp.estimatedImpact.isEstimated ? (
                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-[var(--mg-text-muted)] block uppercase font-bold tracking-wider">
                          Est. Monthly Lift
                        </span>
                        <span className="text-lg font-black text-[var(--mg-navy)]">
                          {formatPaise(opp.estimatedImpact.monthlyRevenuePotentialPaise)}
                          <span className="text-xs font-normal text-[var(--mg-text-muted)]">/mo</span>
                        </span>
                      </div>
                    ) : (
                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-[var(--mg-text-muted)] block uppercase font-bold tracking-wider">
                          Revenue Impact
                        </span>
                        <span className="text-xs text-[var(--mg-text-muted)] italic">Grounded (Non-Monetized)</span>
                      </div>
                    )}

                    <button className="text-xs text-[var(--mg-brand)] font-bold hover:text-[var(--mg-brand-hover)] whitespace-nowrap">
                      {isExpanded ? "Hide Details ▲" : "View Evidence & Action ▼"}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-[var(--mg-border)] bg-[var(--mg-bg)] p-6 space-y-5">
                    {/* Evidence Grounding */}
                    <div>
                      <h4 className="text-xs font-bold text-[var(--mg-navy)] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <span>🔍</span> Grounded Evidence &amp; Facts
                      </h4>
                      <div className="space-y-2">
                        {opp.evidence.map((ev, idx) => (
                          <div
                            key={idx}
                            className="bg-white border border-[var(--mg-border)] rounded-xl p-3.5 text-xs text-[var(--mg-navy)] flex items-start justify-between gap-4 shadow-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded bg-[var(--mg-bg)] border border-[var(--mg-border)] text-[10px] font-mono text-[var(--mg-text-secondary)]">
                                  {ev.source}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-[var(--mg-bg)] border border-[var(--mg-border)] text-[10px] font-mono text-[var(--mg-text-secondary)]">
                                  {ev.category}
                                </span>
                              </div>
                              <p className="text-[var(--mg-text-secondary)]">{ev.fact}</p>
                            </div>
                            {ev.metric && (
                              <div className="bg-[var(--mg-bg)] border border-[var(--mg-border)] rounded-lg px-3 py-1.5 text-right shrink-0">
                                <span className="text-[10px] text-[var(--mg-text-muted)] block">{ev.metric.label}</span>
                                <span className="font-bold text-[var(--mg-brand)] text-xs">
                                  {String(ev.metric.value)}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Estimation Formula */}
                    {opp.estimatedImpact && opp.estimatedImpact.isEstimated && (
                      <div className="bg-[var(--mg-success-soft)] border border-[var(--mg-success)]/20 rounded-xl p-3.5 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[var(--mg-success)]">
                            Deterministic Estimation Formula
                          </span>
                          {opp.estimatedImpact.confidenceRangePaise && (
                            <span className="text-[11px] text-[var(--mg-success)] font-mono">
                              Range: {formatPaise(opp.estimatedImpact.confidenceRangePaise.min)} –{" "}
                              {formatPaise(opp.estimatedImpact.confidenceRangePaise.max)}
                            </span>
                          )}
                        </div>
                        <p className="text-[var(--mg-navy)] font-mono text-[11px]">
                          {opp.estimatedImpact.estimationMethodology}
                        </p>
                      </div>
                    )}

                    {/* Action Proposal */}
                    <div className="bg-white border border-[var(--mg-border)] rounded-xl p-5 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[var(--mg-navy)] uppercase tracking-wider">
                            Proposed Commercial Action:
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-[var(--mg-brand-soft)] text-[var(--mg-brand)] border border-[var(--mg-brand-line)]">
                            {opp.recommendedAction.actionType}
                          </span>
                        </div>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[var(--mg-warning-soft)] text-[var(--mg-warning)] border border-[var(--mg-warning)]/30 font-semibold">
                          Requires Merchant Approval
                        </span>
                      </div>

                      <p className="text-xs text-[var(--mg-text-secondary)]">
                        {opp.recommendedAction.description}
                      </p>

                      {opp.recommendedAction.suggestedParameters && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[var(--mg-border)] text-xs">
                          {opp.recommendedAction.suggestedParameters.suggestedPricePaise && (
                            <div className="bg-[var(--mg-bg)] p-2.5 rounded-lg border border-[var(--mg-border)]">
                              <span className="text-[10px] text-[var(--mg-text-muted)] block">Suggested Price</span>
                              <span className="font-bold text-[var(--mg-navy)]">
                                {formatPaise(opp.recommendedAction.suggestedParameters.suggestedPricePaise)}
                              </span>
                            </div>
                          )}
                          {opp.recommendedAction.suggestedParameters.suggestedBillingInterval && (
                            <div className="bg-[var(--mg-bg)] p-2.5 rounded-lg border border-[var(--mg-border)]">
                              <span className="text-[10px] text-[var(--mg-text-muted)] block">Billing Cadence</span>
                              <span className="font-bold text-[var(--mg-navy)] capitalize">
                                {opp.recommendedAction.suggestedParameters.suggestedBillingInterval}
                              </span>
                            </div>
                          )}
                          {opp.recommendedAction.suggestedParameters.suggestedSupportTier && (
                            <div className="bg-[var(--mg-bg)] p-2.5 rounded-lg border border-[var(--mg-border)]">
                              <span className="text-[10px] text-[var(--mg-text-muted)] block">Support Tier</span>
                              <span className="font-bold text-[var(--mg-navy)] capitalize">
                                {opp.recommendedAction.suggestedParameters.suggestedSupportTier.replace(/_/g, " ")}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          onClick={() => {
                            if (onNavigateTab) onNavigateTab("grow");
                          }}
                          className="px-4 py-2 bg-[var(--mg-brand)] hover:bg-[var(--mg-brand-hover)] text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                        >
                          Open in AI Growth &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
