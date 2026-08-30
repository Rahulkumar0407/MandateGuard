"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { GrowthOpportunityReport } from "@/lib/merchant-intelligence/growth-opportunity-service";

interface MerchantGrowthOpportunityProps {
  onOfferCreated?: (newVersion: number) => void;
}

export function MerchantGrowthOpportunity({
  onOfferCreated,
}: MerchantGrowthOpportunityProps) {
  const [report, setReport] = useState<GrowthOpportunityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [customPrice, setCustomPrice] = useState<number>(4499);
  const [approvedResult, setApprovedResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"opportunity" | "simulation" | "contract">("opportunity");

  const loadOpportunity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/merchant/growth-opportunity");
      if (!res.ok) {
        throw new Error(`Failed to load growth opportunity: ${res.statusText}`);
      }
      const data: GrowthOpportunityReport = await res.json();
      setReport(data);
      if (data.topOpportunity?.proposedAction.proposedPricePaise) {
        setCustomPrice(data.topOpportunity.proposedAction.proposedPricePaise / 100);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading growth opportunity");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const fetchInit = async () => {
      try {
        const res = await fetch("/api/merchant/growth-opportunity");
        if (res.ok) {
          const data: GrowthOpportunityReport = await res.json();
          if (!ignore) {
            setReport(data);
            if (data.topOpportunity?.proposedAction.proposedPricePaise) {
              setCustomPrice(data.topOpportunity.proposedAction.proposedPricePaise / 100);
            }
          }
        }
      } catch {
        // Handled gracefully
      }
    };
    void fetchInit();
    return () => {
      ignore = true;
    };
  }, []);

  const handleApproveAndPublish = async () => {
    if (!report?.topOpportunity) return;
    setApproving(true);
    setError(null);

    try {
      const opp = report.topOpportunity;
      const res = await fetch("/api/merchant/growth-opportunity/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: opp.proposedAction.targetProductId,
          customPricePaise: customPrice * 100,
          proposedChanges: {
            name: opp.proposedAction.proposedOfferName,
            description: opp.proposedAction.proposedDescription,
            supportTerms: opp.proposedAction.proposedSupportTerms,
            structuredCommitments: opp.proposedAction.proposedStructuredCommitments,
            entitlementKeys: opp.proposedAction.proposedEntitlementKeys,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Publishing failed: ${res.statusText}`);
      }

      const data = await res.json();
      setApprovedResult(
        `Created and published new offer '${data.newOffer.name}' (v${data.newOffer.version}) • Fingerprint: ${data.newOffer.versionHash?.slice(0, 12)}...`,
      );
      if (onOfferCreated) {
        onOfferCreated(data.newOffer.version);
      }
      await loadOpportunity();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish opportunity offer");
    } finally {
      setApproving(false);
    }
  };

  if (loading && !report) {
    return (
      <div className="p-8 bg-[#0D1527] rounded-2xl border border-white/10 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-[#0B5CFF] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-300">
          Evaluating unserved buyer demand and identifying growth opportunities...
        </p>
      </div>
    );
  }

  if (!report || !report.topOpportunity) {
    return (
      <div className="p-6 bg-[#0D1527] rounded-2xl border border-white/10 text-center space-y-3">
        <span className="text-xs font-mono text-slate-400">INSUFFICIENT EVIDENCE</span>
        <p className="text-xs text-slate-400">
          No unserved demand clusters detected in current benchmark cohort.
        </p>
        <button
          onClick={loadOpportunity}
          className="px-4 py-2 bg-[#0B5CFF] hover:bg-[#004DE6] text-white text-xs font-bold rounded-xl"
        >
          Re-evaluate Opportunities
        </button>
      </div>
    );
  }

  const opp = report.topOpportunity;

  return (
    <div className="bg-[#0D1527] rounded-2xl border border-white/10 p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in duration-200 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/40">
              {opp.type.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {opp.affectedMissionsCount} buyer requests affected
            </span>
          </div>
          <h3 className="text-lg font-extrabold text-white mt-1">
            Your biggest growth opportunity
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {opp.headline}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab("opportunity")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === "opportunity"
                ? "bg-white text-slate-900 shadow-md font-extrabold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Evidence & Package
          </button>
          <button
            onClick={() => setActiveTab("simulation")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === "simulation"
                ? "bg-white text-slate-900 shadow-md font-extrabold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Simulation (+{opp.simulation.missionsRecovered})
          </button>
          <button
            onClick={() => setActiveTab("contract")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === "contract"
                ? "bg-white text-slate-900 shadow-md font-extrabold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            New Contract
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold ml-2">✕</button>
        </div>
      )}

      {approvedResult && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center justify-between">
          <span className="font-semibold">✓ {approvedResult}</span>
          <button onClick={() => setApprovedResult(null)} className="font-bold ml-2">✕</button>
        </div>
      )}

      {/* Tab 1: Evidence & Proposed Package */}
      {activeTab === "opportunity" && (
        <div className="space-y-6">
          {/* Evidence Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
              <span className="text-[11px] font-bold text-[#60A5FA] uppercase tracking-wider block">
                1. REPEATED BUYER DEMAND
              </span>
              <p className="text-xs font-bold text-white">&ldquo;{opp.evidence.buyerDemandQuery}&rdquo;</p>
              <div className="text-[11px] text-slate-300 space-y-1 pt-1">
                {opp.evidence.affectedMissions.map((m, idx) => (
                  <div key={idx} className="italic text-slate-400 truncate">• {m}</div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                2. CURRENT CATALOG GAP
              </span>
              <p className="text-xs text-slate-200 font-medium">
                {opp.evidence.existingOfferSummary}
              </p>
              <span className="text-[11px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 block font-mono">
                No matching package
              </span>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                3. WHY BUYERS LEAVE
              </span>
              <p className="text-xs text-amber-200 leading-relaxed font-medium">
                {opp.evidence.reasonLost}
              </p>
            </div>
          </div>

          {/* Proposed Offer Form */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-xs font-extrabold text-white uppercase tracking-wider">
                  PROPOSED NEW PACKAGE: {opp.proposedAction.proposedOfferName}
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fills the gap with clear, structured commitments.
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded border border-emerald-500/40">
                Draft Suggestion
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">
                  Merchant Price (₹/month)
                </label>
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#0B5CFF]"
                />
                <span className="text-[10px] text-slate-400">Suggested based on buyer budget ceilings</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">Dedicated Human Mentor</label>
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3.5 py-2 text-xs font-bold text-emerald-400">
                  ✓ Yes (Explicit Commitment)
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">1:1 Reviews / Month</label>
                <div className="bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-bold text-white">
                  4 Sessions / Month (Weekly)
                </div>
              </div>
            </div>
          </div>

          {/* Merchant Approval Action Bar */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/15 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Merchant Approval Required
              </span>
              <p className="text-xs text-slate-300 mt-0.5">
                AI identifies the opportunity; only the merchant can publish the new package.
              </p>
            </div>
            <button
              onClick={handleApproveAndPublish}
              disabled={approving}
              className="px-6 py-3 bg-[#0B5CFF] hover:bg-[#004DE6] text-white text-xs font-bold rounded-xl transition-all shadow-md disabled:opacity-50 whitespace-nowrap mg-press"
            >
              {approving ? "Publishing New Package..." : `Approve & Publish '${opp.proposedAction.proposedOfferName}'`}
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Simulation */}
      {activeTab === "simulation" && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#60A5FA]">
                Benchmark Cohort: {opp.simulation.benchmarkId} ({opp.simulation.benchmarkVersion})
              </span>
              <p className="text-xs text-slate-300 mt-0.5 font-mono">
                Dataset Hash: {opp.simulation.datasetHash?.slice(0, 16)}...
              </p>
            </div>
            <span className="text-[11px] font-bold bg-white/10 text-white px-3 py-1 rounded-full border border-white/10">
              {opp.simulation.claimNotice}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-white/5 border border-white/10 text-center">
              <span className="text-xs text-slate-400 font-medium">Before (Current Catalog)</span>
              <p className="text-2xl font-black text-slate-300 mt-1">
                {opp.simulation.missionsBefore} / {opp.simulation.missionsTested}
              </p>
              <span className="text-[11px] text-slate-500 font-mono">Buyer requests served</span>
            </div>

            <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <span className="text-xs text-emerald-400 font-medium">After (With Proposed Package)</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {opp.simulation.missionsAfter} / {opp.simulation.missionsTested}
              </p>
              <span className="text-[11px] text-emerald-300 font-mono">Buyer requests served</span>
            </div>

            <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center">
              <span className="text-xs text-[#60A5FA] font-medium">Recovered Demand</span>
              <p className="text-2xl font-black text-[#60A5FA] mt-1">
                +{opp.simulation.missionsRecovered}
              </p>
              <span className="text-[11px] text-blue-300 font-mono">Newly matched requests</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Contract Preview */}
      {activeTab === "contract" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            How the new package appears to AI buyers:
          </p>
          <pre className="p-4 bg-black/40 text-emerald-400 rounded-xl overflow-x-auto text-[11px] font-mono border border-white/10 max-h-96">
            {JSON.stringify(opp.contractPreview.proposedContract, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
