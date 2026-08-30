"use client";

import React, { useState } from "react";
import type { MerchantImpactPreview } from "@/lib/merchant/preview-types";

export function MerchantImpactSimulator() {
  // Preset candidates
  const [candidateScenario, setCandidateScenario] = useState<
    "preset_compatible" | "preset_review" | "preset_breaking" | "custom"
  >("preset_compatible");

  const [price, setPrice] = useState(359900);
  const [supportTier, setSupportTier] = useState("dedicated_mentor");
  const [hasDedicatedHuman, setHasDedicatedHuman] = useState(true);
  const [oneOnOneSessions, setOneOnOneSessions] = useState(4);
  const [slaHours, setSlaHours] = useState(24);
  const [refundWindowDays, setRefundWindowDays] = useState(30);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<MerchantImpactPreview | null>(null);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  const applyScenario = (
    scenario: "preset_compatible" | "preset_review" | "preset_breaking",
  ) => {
    setCandidateScenario(scenario);
    if (scenario === "preset_compatible") {
      setPrice(359900);
      setSupportTier("dedicated_mentor");
      setHasDedicatedHuman(true);
      setOneOnOneSessions(4);
      setSlaHours(24);
      setRefundWindowDays(30);
    } else if (scenario === "preset_review") {
      setPrice(379900);
      setSupportTier("dedicated_mentor");
      setHasDedicatedHuman(true);
      setOneOnOneSessions(4);
      setSlaHours(24);
      setRefundWindowDays(30);
    } else if (scenario === "preset_breaking") {
      setPrice(349900);
      setSupportTier("community");
      setHasDedicatedHuman(false);
      setOneOnOneSessions(0);
      setSlaHours(72);
      setRefundWindowDays(14);
    }
  };

  const runAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    setPublishMessage(null);

    try {
      const payload = {
        productId: "p_sysdesign",
        name: "System Design Mastery (v_next Candidate)",
        description: hasDedicatedHuman
          ? "Comprehensive System Design curriculum with 1:1 dedicated mentor support."
          : "AI-assisted curriculum with peer community review.",
        price,
        duration: 180,
        entitlementKeys: hasDedicatedHuman
          ? ["sysdesign_core", "sysdesign_mocks", "mentor_weekly"]
          : ["sysdesign_core", "sysdesign_mocks"],
        refundWindowDays,
        supportTerms: hasDedicatedHuman
          ? `Dedicated mentor with ${slaHours}h SLA and ${oneOnOneSessions} 1:1 sessions/mo.`
          : "Community forum and AI bot support.",
        semanticTerms: hasDedicatedHuman
          ? "Weekly 1:1 video review and architecture mock."
          : "Automated test runner and peer forum review.",
        structuredCommitments: {
          support: {
            tier: supportTier,
            slaHours,
            oneOnOneSessionsPerMonth: oneOnOneSessions,
            hasDedicatedHuman,
          },
          entitlements: {
            keys: hasDedicatedHuman
              ? ["sysdesign_core", "sysdesign_mocks", "mentor_weekly"]
              : ["sysdesign_core", "sysdesign_mocks"],
            criticalKeys: ["mentor_weekly"],
          },
          usageLimits: {
            apiRequestsPerMonth: 10000,
            concurrentSeats: 1,
            computeCredits: 500,
          },
          delivery: {
            type: "continuous_saas",
            commitmentSLA: `${slaHours}h Turnaround`,
          },
          refundPolicy: {
            windowDays: refundWindowDays,
            type: "conditional",
          },
        },
      };

      const res = await fetch("/api/merchant/offers/preview-impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to analyze impact.");
      }

      const data = await res.json();
      setPreview(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error generating preview.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-white animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#60A5FA] bg-[#0B5CFF]/15 px-2.5 py-0.5 rounded-full border border-[#0B5CFF]/30">
                Merchant Offer Studio
              </span>
              <span className="text-xs text-slate-400">
                Product: System Design Mastery
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">
              Pre-Publish Offer Compatibility & Impact Simulation
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              Simulate proposed changes to pricing, entitlements, or support
              terms against your existing subscribers’ authorized envelopes
              before publishing.
            </p>
          </div>

          {/* Current Active Baseline snapshot */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs space-y-1">
            <div className="font-semibold text-white">
              Current Active Published Version (v1)
            </div>
            <div className="text-slate-300">
              Price: <span className="font-bold text-white">₹3,499 / mo</span>
            </div>
            <div className="text-slate-300">
              Support: <span className="font-medium text-emerald-400">Dedicated Mentor (4 sessions/mo)</span>
            </div>
            <div className="text-slate-300">
              Refund: <span className="font-medium text-white">30 Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Configurator & Impact Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Proposed Change Configurator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-6 shadow-xl space-y-5">
            <h2 className="text-sm font-bold text-white border-b border-white/10 pb-3">
              1. Configure Proposed Version (v2 Candidate)
            </h2>

            {/* Quick Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Quick Simulation Scenarios
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => applyScenario("preset_compatible")}
                  className={`text-left text-xs p-3 rounded-xl border transition-all ${
                    candidateScenario === "preset_compatible"
                      ? "border-[#0B5CFF] bg-[#0B5CFF]/15 text-white font-medium ring-1 ring-[#0B5CFF]"
                      : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">
                      🟢 Minor Price Refresh (+2.8%)
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      Seamless
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Price ₹3,599/mo (+₹100). Preserves 1:1 mentor and all entitlements.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => applyScenario("preset_review")}
                  className={`text-left text-xs p-3 rounded-xl border transition-all ${
                    candidateScenario === "preset_review"
                      ? "border-[#0B5CFF] bg-[#0B5CFF]/15 text-white font-medium ring-1 ring-[#0B5CFF]"
                      : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">
                      🟡 Price Increase Above Tolerance (+8.5%)
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                      Review Needed
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Price ₹3,799/mo (+₹300). Exceeds 5% automated approval tolerance.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => applyScenario("preset_breaking")}
                  className={`text-left text-xs p-3 rounded-xl border transition-all ${
                    candidateScenario === "preset_breaking"
                      ? "border-[#0B5CFF] bg-[#0B5CFF]/15 text-white font-medium ring-1 ring-[#0B5CFF]"
                      : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-400">
                      🔴 Service Scope Shift (AI Tutor / No 1:1)
                    </span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">
                      Breaking
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Replaces human mentor with AI Discord bot. Removes weekly 1:1 video review.
                  </p>
                </button>
              </div>
            </div>

            {/* Parameter adjustments */}
            <div className="space-y-4 pt-2 border-t border-white/10">
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1">
                  <span>Proposed Monthly Price (INR)</span>
                  <span className="font-bold text-white">
                    ₹{(price / 100).toLocaleString("en-IN")}
                  </span>
                </label>
                <input
                  type="range"
                  min={300000}
                  max={500000}
                  step={5000}
                  value={price}
                  onChange={(e) => {
                    setPrice(Number(e.target.value));
                    setCandidateScenario("custom");
                  }}
                  className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-[#0B5CFF]"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>₹3,000</span>
                  <span>Baseline: ₹3,499</span>
                  <span>₹5,000</span>
                </div>
              </div>

              {/* Support Tier & Human Mentor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Support Tier
                  </label>
                  <select
                    value={supportTier}
                    onChange={(e) => {
                      setSupportTier(e.target.value);
                      setCandidateScenario("custom");
                    }}
                    className="w-full text-xs bg-black/40 border border-white/15 rounded-xl p-2.5 text-white focus:ring-1 focus:ring-[#0B5CFF]"
                  >
                    <option value="dedicated_mentor">Dedicated Mentor</option>
                    <option value="priority_email">Priority Email</option>
                    <option value="community">Community Forum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    1:1 Sessions / Mo
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={12}
                    value={oneOnOneSessions}
                    onChange={(e) => {
                      setOneOnOneSessions(Number(e.target.value));
                      setCandidateScenario("custom");
                    }}
                    className="w-full text-xs bg-black/40 border border-white/15 rounded-xl p-2.5 text-white focus:ring-1 focus:ring-[#0B5CFF]"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="hasHuman"
                  checked={hasDedicatedHuman}
                  onChange={(e) => {
                    setHasDedicatedHuman(e.target.checked);
                    setCandidateScenario("custom");
                  }}
                  className="w-4 h-4 text-[#0B5CFF] rounded border-white/20 bg-black/40 focus:ring-[#0B5CFF]"
                />
                <label
                  htmlFor="hasHuman"
                  className="text-xs text-slate-300 cursor-pointer"
                >
                  Includes Dedicated Human Expert Mentor
                </label>
              </div>
            </div>

            {/* Action Trigger */}
            <div className="pt-3">
              <button
                type="button"
                onClick={runAnalysis}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#0B5CFF] hover:bg-[#004DE6] text-white font-bold text-xs rounded-xl shadow-[0_0_16px_rgba(11,92,255,0.4)] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mg-press"
              >
                {isLoading ? (
                  <span>Evaluating Subscriber Envelopes...</span>
                ) : (
                  <span>Analyze Downstream Impact Before Publishing &rarr;</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Pre-Publish Impact Report (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          {publishMessage && (
            <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs">
              {publishMessage}
            </div>
          )}

          {!preview && !isLoading && !error && (
            <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-12 text-center shadow-xl">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 text-[#60A5FA] flex items-center justify-center mx-auto mb-3">
                ⚡
              </div>
              <h3 className="text-base font-bold text-white">
                No Impact Simulation Generated Yet
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Select a candidate scenario on the left and click &ldquo;Analyze
                Impact Before Publishing&rdquo; to simulate effects on active
                authorizations.
              </p>
            </div>
          )}

          {preview && (
            <div className="space-y-6 animate-fade-in">
              {/* Top Summary Card */}
              <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">
                      2. Downstream Impact Analysis Report
                    </h2>
                    <p className="text-xs text-slate-400">
                      Evaluated against {preview.totalSubscribersAffected} active
                      subscriber authorization envelopes
                    </p>
                  </div>
                  <span className="text-xs bg-white/5 text-slate-300 font-mono px-2.5 py-1 rounded-xl border border-white/10">
                    Candidate Version: v{preview.proposedVersion}
                  </span>
                </div>

                {/* Progress Distribution Bar */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                    <span>Subscriber Transition Distribution</span>
                    <span>
                      {preview.summary.compatiblePercentage}% Seamless Migration
                    </span>
                  </div>
                  <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden flex border border-white/5">
                    <div
                      style={{
                        width: `${preview.summary.compatiblePercentage}%`,
                      }}
                      className="bg-emerald-500 h-full transition-all"
                      title={`Compatible: ${preview.summary.compatibleCount} subscribers`}
                    />
                    <div
                      style={{
                        width: `${preview.summary.reviewPercentage}%`,
                      }}
                      className="bg-amber-500 h-full transition-all"
                      title={`Review: ${preview.summary.reviewCount} subscribers`}
                    />
                    <div
                      style={{
                        width: `${preview.summary.breakingPercentage}%`,
                      }}
                      className="bg-rose-500 h-full transition-all"
                      title={`Breaking: ${preview.summary.breakingCount} subscribers`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Seamless ({preview.summary.compatibleCount})</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>Review Needed ({preview.summary.reviewCount})</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>At-Risk Breaking ({preview.summary.breakingCount})</span>
                    </span>
                  </div>
                </div>

                {/* Financial Metric Cards */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <div className="text-[11px] font-semibold text-emerald-400">
                      Seamless MRR
                    </div>
                    <div className="text-lg font-black text-white mt-0.5">
                      ₹{(preview.financialImpact.seamlessMRRPaise / 100).toLocaleString("en-IN")}
                    </div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">
                      Auto-approved by agent
                    </div>
                  </div>

                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <div className="text-[11px] font-semibold text-amber-400">
                      Review Pending MRR
                    </div>
                    <div className="text-lg font-black text-white mt-0.5">
                      ₹{(preview.financialImpact.reviewPendingMRRPaise / 100).toLocaleString("en-IN")}
                    </div>
                    <div className="text-[10px] text-amber-400 mt-0.5">
                      Requires buyer review
                    </div>
                  </div>

                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                    <div className="text-[11px] font-semibold text-rose-400">
                      At-Risk MRR
                    </div>
                    <div className="text-lg font-black text-white mt-0.5">
                      ₹{(preview.financialImpact.atRiskMRRPaise / 100).toLocaleString("en-IN")}
                    </div>
                    <div className="text-[10px] text-rose-400 mt-0.5">
                      Requires reauthorization
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {preview.recommendations.length > 0 && (
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <div className="text-xs font-bold text-white flex items-center space-x-1.5 mb-1">
                      <span>💡</span>
                      <span>Strategic Merchant Recommendations:</span>
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1 pl-5 list-disc">
                      {preview.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Subscriber Cohort Table */}
              <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white">
                  Subscriber Cohort Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="py-2.5 px-3 font-semibold">Subscriber ID</th>
                        <th className="py-2.5 px-3 font-semibold">Current Baseline</th>
                        <th className="py-2.5 px-3 font-semibold">Status</th>
                        <th className="py-2.5 px-3 font-semibold">Required Action</th>
                        <th className="py-2.5 px-3 font-semibold">Key Finding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-200">
                      {preview.subscribers.map((sub, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-mono font-medium">
                            {sub.userId}
                          </td>
                          <td className="py-2.5 px-3">
                            ₹{(sub.authorizedPrice / 100).toLocaleString("en-IN")} / mo
                          </td>
                          <td className="py-2.5 px-3">
                            {sub.compatibility === "COMPATIBLE" && (
                              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                                COMPATIBLE
                              </span>
                            )}
                            {sub.compatibility === "REVIEW" && (
                              <span className="inline-flex items-center text-[11px] font-semibold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                                REVIEW
                              </span>
                            )}
                            {sub.compatibility === "BREAKING" && (
                              <span className="inline-flex items-center text-[11px] font-semibold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                                BREAKING
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-medium">
                            {sub.requiredAction === "NONE" ? "Seamless Auto-Migration" : sub.requiredAction}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">
                            {sub.reasons[0]?.message || "Conforms to authorized tolerance"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
