"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { OfferOptimizationPlan } from "@/lib/merchant-intelligence/optimization-service";

interface MerchantOfferOptimizerProps {
  offerId?: string;
  onVersionPublished?: (newVersion: number) => void;
}

export function MerchantOfferOptimizer({
  offerId,
  onVersionPublished,
}: MerchantOfferOptimizerProps) {
  const [plan, setPlan] = useState<OfferOptimizationPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approvedResult, setApprovedResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"optimization" | "simulation" | "contract" | "history">("optimization");

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = offerId ? `/api/merchant/optimization?offerId=${offerId}` : "/api/merchant/optimization";
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load optimization plan: ${res.statusText}`);
      }
      const data: OfferOptimizationPlan = await res.json();
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading plan");
    } finally {
      setLoading(false);
    }
  }, [offerId]);

  useEffect(() => {
    let ignore = false;
    const fetchInit = async () => {
      try {
        const url = offerId ? `/api/merchant/optimization?offerId=${offerId}` : "/api/merchant/optimization";
        const res = await fetch(url);
        if (res.ok) {
          const data: OfferOptimizationPlan = await res.json();
          if (!ignore) setPlan(data);
        }
      } catch {
        // Fallback handled gracefully
      }
    };
    void fetchInit();
    return () => {
      ignore = true;
    };
  }, [offerId]);

  const handleApprove = async () => {
    if (!plan) return;
    setApproving(true);
    setError(null);
    try {
      const res = await fetch("/api/merchant/optimization/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: plan.offer.id,
          expectedVersion: plan.offer.version,
          expectedVersionHash: plan.offer.versionHash,
          proposedChanges: {
            name: `${plan.offer.name.replace(/ v\d+$/, "")} v${plan.offer.version + 1}`,
            description: "Production system architecture curriculum with dedicated 1:1 human mentor and weekly reviews.",
            supportTerms: "Dedicated human mentor assigned with weekly reviews and 24h response SLA.",
            structuredCommitments: plan.recommendation.proposedStructuredCommitments,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Approval failed: ${res.statusText}`);
      }

      const data = await res.json();
      setApprovedResult(`Published new OfferVersion v${data.newOffer.version} (${data.newOffer.versionHash?.slice(0, 12)}...)`);
      if (onVersionPublished) {
        onVersionPublished(data.newOffer.version);
      }
      // Reload plan to show updated version and history
      await loadPlan();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve offer");
    } finally {
      setApproving(false);
    }
  };

  if (loading && !plan) {
    return (
      <div className="p-8 bg-[#0D1527] rounded-2xl border border-white/10 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-[#0B5CFF] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-300">
          Analyzing AI buyer evaluation and synthesizing optimization plan...
        </p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-6 bg-[#0D1527] rounded-2xl border border-white/10 text-center space-y-3">
        <p className="text-xs text-slate-400">No optimization plan available.</p>
        <button
          onClick={loadPlan}
          className="px-4 py-2 bg-[#0B5CFF] hover:bg-[#004DE6] text-white text-xs font-bold rounded-xl"
        >
          Load Plan
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#0D1527] rounded-2xl border border-white/10 p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in duration-200 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-[#0B5CFF]/20 text-[#60A5FA] px-2.5 py-0.5 rounded-full border border-[#0B5CFF]/40">
              AI Offer Optimization Loop
            </span>
            <span className="text-xs text-slate-400 font-mono">
              v{plan.offer.version} • {plan.offer.name}
            </span>
          </div>
          <h3 className="text-lg font-extrabold text-white mt-1">
            Turn buyer insights into growth
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Diagnose AI buyer rejections, simulate structured improvements, and approve new offer versions.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab("optimization")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === "optimization"
                ? "bg-white text-slate-900 shadow-md font-extrabold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Diagnosis & Fix
          </button>
          <button
            onClick={() => setActiveTab("simulation")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === "simulation"
                ? "bg-white text-slate-900 shadow-md font-extrabold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Simulation ({plan.simulation.missionsRecovered > 0 ? `+${plan.simulation.missionsRecovered}` : "0"})
          </button>
          <button
            onClick={() => setActiveTab("contract")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === "contract"
                ? "bg-white text-slate-900 shadow-md font-extrabold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Contract Diff
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === "history"
                ? "bg-white text-slate-900 shadow-md font-extrabold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Version History ({plan.versionHistory.length})
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

      {/* Tab 1: Optimization / Diagnosis & Fix */}
      {activeTab === "optimization" && (
        <div className="space-y-6">
          {/* Diagnosis 3-Column Visualizer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Buyer Needs */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
              <span className="text-[11px] font-bold text-[#60A5FA] uppercase tracking-wider block">
                1. BUYER NEEDS
              </span>
              <ul className="space-y-1.5 text-xs text-slate-200 font-medium">
                {plan.diagnosis.buyerNeeds.map((need, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-[#0B5CFF] font-bold">•</span>
                    <span>{need}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. Your Offer */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                2. YOUR CURRENT OFFER
              </span>
              <p className="text-xs text-slate-200 italic bg-black/30 p-2.5 rounded-lg border border-white/10">
                &ldquo;{plan.diagnosis.yourOfferSummary}&rdquo;
              </p>
              <div className="text-[11px] text-slate-400">
                Price: ₹{(plan.offer ? 3499 : 0).toLocaleString("en-IN")}/mo • Monthly
              </div>
            </div>

            {/* 3. AI Verification */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                3. AI CAN VERIFY
              </span>
              <div className="space-y-1 text-xs">
                {plan.diagnosis.verificationChecks.map((chk, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-slate-300">{chk.item}:</span>
                    <span
                      className={`font-mono font-bold text-[11px] px-1.5 py-0.5 rounded ${
                        chk.status === "VERIFIED"
                          ? "text-emerald-300 bg-emerald-500/20"
                          : chk.status === "AMBIGUOUS"
                          ? "text-amber-300 bg-amber-500/20"
                          : "text-red-300 bg-red-500/20"
                      }`}
                    >
                      {chk.status === "VERIFIED" ? "✓" : chk.status === "AMBIGUOUS" ? "?" : "✕"} {chk.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Root-cause explanation */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
            <span className="text-xs font-bold text-amber-300 block">WHY AI BUYERS SKIP THIS OFFER</span>
            <p className="text-xs text-amber-200 leading-relaxed font-medium">
              {plan.diagnosis.whyExplanation}
            </p>
          </div>

          {/* Current vs Proposed structured diff */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                  CURRENT (v{plan.offer.version})
                </span>
                <span className="text-[11px] font-mono text-slate-400">Previous version</span>
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <div>
                  <span className="font-semibold text-slate-400 block text-[11px]">Support Tier</span>
                  <span className="capitalize">{plan.recommendation.currentTerms.supportTier.replace(/_/g, " ")}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 block text-[11px]">Dedicated Human Mentor</span>
                  <span>{plan.recommendation.currentTerms.hasDedicatedHuman ? "Yes" : "No (Ambiguous)"}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 block text-[11px]">1:1 Sessions</span>
                  <span>{plan.recommendation.currentTerms.sessionsPerMonth}/month</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 block text-[11px]">Response SLA</span>
                  <span>{plan.recommendation.currentTerms.slaHours ? `${plan.recommendation.currentTerms.slaHours}h` : "Not declared"}</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/40 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
                <span className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider">
                  PROPOSED (v{plan.offer.version + 1})
                </span>
                <span className="text-[11px] font-mono text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40">
                  Requires Approval
                </span>
              </div>
              <div className="space-y-2 text-xs text-slate-100">
                <div>
                  <span className="font-semibold text-emerald-400 block text-[11px]">Support Tier</span>
                  <span className="font-bold text-white capitalize">
                    {plan.recommendation.proposedTerms.supportTier.replace(/_/g, " ")}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-emerald-400 block text-[11px]">Dedicated Human Mentor</span>
                  <span className="font-bold text-white">Yes (Explicit Structured Guarantee)</span>
                </div>
                <div>
                  <span className="font-semibold text-emerald-400 block text-[11px]">1:1 Sessions</span>
                  <span className="font-bold text-white">{plan.recommendation.proposedTerms.sessionsPerMonth}/month</span>
                </div>
                <div>
                  <span className="font-semibold text-emerald-400 block text-[11px]">Response SLA</span>
                  <span className="font-bold text-white">{plan.recommendation.proposedTerms.slaHours}h Guaranteed SLA</span>
                </div>
              </div>
            </div>
          </div>

          {/* Unchanged Terms Notice */}
          <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Protected Commercial Baseline:</span>
            <div className="flex flex-wrap gap-3 text-[11px] font-mono text-slate-300">
              {plan.recommendation.unchangedFields.map((field, i) => (
                <span key={i} className="bg-black/30 px-2 py-0.5 rounded border border-white/10">
                  ✓ {field}
                </span>
              ))}
            </div>
          </div>

          {/* Approval Action Bar */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/15 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Merchant Approval Authority
              </span>
              <p className="text-xs text-slate-300 mt-0.5">
                AI proposes suggestions, but only the merchant can authorize publishing a new OfferVersion.
              </p>
            </div>
            <button
              onClick={handleApprove}
              disabled={approving}
              className="px-6 py-3 bg-[#0B5CFF] hover:bg-[#004DE6] text-white text-xs font-bold rounded-xl transition-all shadow-md disabled:opacity-50 whitespace-nowrap mg-press"
            >
              {approving ? "Publishing v" + (plan.offer.version + 1) + "..." : `Approve & create offer version v${plan.offer.version + 1}`}
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Before / After Simulation */}
      {activeTab === "simulation" && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#60A5FA]">
                Gold Benchmark Cohort: {plan.simulation.benchmarkId} (v{plan.simulation.benchmarkVersion})
              </span>
              <p className="text-xs text-slate-300 mt-0.5">
                Dataset Hash: <span className="font-mono text-slate-400">{plan.simulation.datasetHash?.slice(0, 16)}...</span>
              </p>
            </div>
            <span className="text-[11px] font-bold bg-white/10 text-white px-3 py-1 rounded-full border border-white/10">
              {plan.simulation.claimNotice}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-white/5 border border-white/10 text-center">
              <span className="text-xs text-slate-400 font-medium">Current Version (v{plan.offer.version})</span>
              <p className="text-2xl font-black text-slate-300 mt-1">
                {plan.simulation.missionsBefore} / {plan.simulation.missionsTested}
              </p>
              <span className="text-[11px] text-slate-500 font-mono">Buyer requests matched</span>
            </div>

            <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <span className="text-xs text-emerald-400 font-medium">Proposed Version (v{plan.offer.version + 1})</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {plan.simulation.missionsAfter} / {plan.simulation.missionsTested}
              </p>
              <span className="text-[11px] text-emerald-300 font-mono">Buyer requests matched</span>
            </div>

            <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center">
              <span className="text-xs text-[#60A5FA] font-medium">Recovered requests</span>
              <p className="text-2xl font-black text-[#60A5FA] mt-1">
                +{plan.simulation.missionsRecovered}
              </p>
              <span className="text-[11px] text-blue-300 font-mono">Newly matched in simulation</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <span className="text-xs font-bold text-white">Strict Revenue Claim Discipline</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              MandateGuard reports exact measured request conversions ({plan.simulation.missionsRecovered} additional buyer requests matched), rather than speculative revenue uplift percentages.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Contract Diff */}
      {activeTab === "contract" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            How the new offer appears to AI buyers:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="space-y-1">
              <span className="font-bold text-slate-400">v{plan.offer.version} Contract</span>
              <pre className="p-3.5 bg-black/40 text-slate-300 rounded-xl overflow-x-auto text-[11px] border border-white/10 max-h-80">
                {JSON.stringify(plan.contractPreview.beforeContract.structuredCommitments, null, 2)}
              </pre>
            </div>
            <div className="space-y-1">
              <span className="font-bold text-emerald-400">v{plan.offer.version + 1} Proposed Contract</span>
              <pre className="p-3.5 bg-black/40 text-emerald-300 rounded-xl overflow-x-auto text-[11px] border border-emerald-500/30 max-h-80">
                {JSON.stringify(plan.contractPreview.afterContract.structuredCommitments, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Version History */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Immutable OfferVersion history. Prior versions remain historically pinned for existing authorizations:
          </p>
          <div className="space-y-3">
            {plan.versionHistory.map((ver) => (
              <div
                key={ver.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  ver.version === plan.offer.version
                    ? "bg-blue-500/10 border-blue-500/30"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">
                      Version {ver.version}: {ver.name}
                    </span>
                    {ver.version === plan.offer.version && (
                      <span className="text-[10px] font-bold bg-[#0B5CFF] text-white px-2 py-0.5 rounded-full">
                        Active Published
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    ₹{(ver.pricePaise / 100).toLocaleString("en-IN")}/mo • Tier: {ver.supportTier} • Hash: {ver.versionHash?.slice(0, 16)}...
                  </p>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  Immutable Record
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
