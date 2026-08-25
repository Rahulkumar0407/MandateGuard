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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0066ff] bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                Merchant Offer Studio
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Product: System Design Mastery
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              Pre-Publish Offer Compatibility & Impact Simulation
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-3xl">
              Simulate proposed changes to pricing, entitlements, or support
              terms against your existing subscribers’ authorized envelopes
              before publishing.
            </p>
          </div>

          {/* Current Active Baseline snapshot */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-xs space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-200">
              Current Active Published Version (v1)
            </div>
            <div className="text-slate-500 dark:text-slate-400">
              Price: <span className="font-medium text-slate-900 dark:text-white">₹3,499 / mo</span>
            </div>
            <div className="text-slate-500 dark:text-slate-400">
              Support: <span className="font-medium text-emerald-600 dark:text-emerald-400">Dedicated Mentor (4 sessions/mo)</span>
            </div>
            <div className="text-slate-500 dark:text-slate-400">
              Refund: <span className="font-medium">30 Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Configurator & Impact Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Proposed Change Configurator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              1. Configure Proposed Version (v2 Candidate)
            </h2>

            {/* Quick Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Quick Simulation Scenarios
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => applyScenario("preset_compatible")}
                  className={`text-left text-xs p-3 rounded-lg border transition-all ${
                    candidateScenario === "preset_compatible"
                      ? "border-[#0066ff] bg-blue-50/50 dark:bg-blue-950/30 text-blue-950 dark:text-blue-200 font-medium ring-1 ring-[#0066ff]"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      🟢 Minor Price Refresh (+2.8%)
                    </span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                      Seamless
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Price ₹3,599/mo (+₹100). Preserves 1:1 mentor and all entitlements.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => applyScenario("preset_review")}
                  className={`text-left text-xs p-3 rounded-lg border transition-all ${
                    candidateScenario === "preset_review"
                      ? "border-[#0066ff] bg-blue-50/50 dark:bg-blue-950/30 text-blue-950 dark:text-blue-200 font-medium ring-1 ring-[#0066ff]"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      🟡 Price Increase Above Tolerance (+8.5%)
                    </span>
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                      Review Needed
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Price ₹3,799/mo (+₹300). Exceeds 5% automated approval tolerance.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => applyScenario("preset_breaking")}
                  className={`text-left text-xs p-3 rounded-lg border transition-all ${
                    candidateScenario === "preset_breaking"
                      ? "border-[#0066ff] bg-blue-50/50 dark:bg-blue-950/30 text-blue-950 dark:text-blue-200 font-medium ring-1 ring-[#0066ff]"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      🔴 Service Scope Shift (AI Tutor / No 1:1)
                    </span>
                    <span className="text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded">
                      Breaking
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Replaces human mentor with AI Discord bot. Removes weekly 1:1 video review.
                  </p>
                </button>
              </div>
            </div>

            {/* Parameter adjustments */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <span>Proposed Monthly Price (INR)</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
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
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#0066ff]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>₹3,000</span>
                  <span>Baseline: ₹3,499</span>
                  <span>₹5,000</span>
                </div>
              </div>

              {/* Support Tier & Human Mentor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Support Tier
                  </label>
                  <select
                    value={supportTier}
                    onChange={(e) => {
                      setSupportTier(e.target.value);
                      setCandidateScenario("custom");
                    }}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-[#0066ff]"
                  >
                    <option value="dedicated_mentor">Dedicated Mentor</option>
                    <option value="priority_email">Priority Email</option>
                    <option value="community">Community Forum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
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
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-[#0066ff]"
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
                  className="w-4 h-4 text-[#0066ff] rounded border-slate-300 dark:border-slate-700 focus:ring-[#0066ff]"
                />
                <label
                  htmlFor="hasHuman"
                  className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
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
                className="w-full py-3 px-4 bg-[#0066ff] hover:bg-[#0052cc] text-white font-medium text-sm rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Evaluating Subscriber Envelopes...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <span>Analyze Downstream Impact Before Publishing</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Pre-Publish Impact Report (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-sm">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          {publishMessage && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm">
              {publishMessage}
            </div>
          )}

          {!preview && !isLoading && !error && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#0066ff] flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                No Impact Simulation Generated Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Select a candidate scenario on the left and click &ldquo;Analyze
                Impact Before Publishing&rdquo; to simulate effects on active
                authorizations.
              </p>
            </div>
          )}

          {preview && (
            <div className="space-y-6 animate-fade-in">
              {/* Top Summary Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                      2. Downstream Impact Analysis Report
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Evaluated against {preview.totalSubscribersAffected} active
                      subscriber authorization envelopes
                    </p>
                  </div>
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono px-2.5 py-1 rounded">
                    Candidate Version: v{preview.proposedVersion}
                  </span>
                </div>

                {/* Progress Distribution Bar */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    <span>Subscriber Transition Distribution</span>
                    <span>
                      {preview.summary.compatiblePercentage}% Seamless Migration
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
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
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2">
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
                  <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-lg">
                    <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                      Seamless MRR
                    </div>
                    <div className="text-lg font-bold text-emerald-900 dark:text-emerald-100 mt-0.5">
                      ₹{(preview.financialImpact.seamlessMRRPaise / 100).toLocaleString("en-IN")}
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Auto-approved by agent
                    </div>
                  </div>

                  <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-lg">
                    <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                      Review Pending MRR
                    </div>
                    <div className="text-lg font-bold text-amber-900 dark:text-amber-100 mt-0.5">
                      ₹{(preview.financialImpact.reviewPendingMRRPaise / 100).toLocaleString("en-IN")}
                    </div>
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                      Requires buyer review
                    </div>
                  </div>

                  <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 rounded-lg">
                    <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                      At-Risk MRR
                    </div>
                    <div className="text-lg font-bold text-rose-900 dark:text-rose-100 mt-0.5">
                      ₹{(preview.financialImpact.atRiskMRRPaise / 100).toLocaleString("en-IN")}
                    </div>
                    <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">
                      Requires reauthorization
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {preview.recommendations.length > 0 && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5 mb-1">
                      <span>💡</span>
                      <span>Strategic Merchant Recommendations:</span>
                    </div>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pl-5 list-disc">
                      {preview.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Subscriber Cohort Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Subscriber Cohort Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                        <th className="py-2.5 px-3 font-semibold">Subscriber ID</th>
                        <th className="py-2.5 px-3 font-semibold">Current Baseline</th>
                        <th className="py-2.5 px-3 font-semibold">Status</th>
                        <th className="py-2.5 px-3 font-semibold">Required Action</th>
                        <th className="py-2.5 px-3 font-semibold">Key Finding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                      {preview.subscribers.map((sub, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-mono font-medium">
                            {sub.userId}
                          </td>
                          <td className="py-2.5 px-3">
                            ₹{(sub.authorizedPrice / 100).toLocaleString("en-IN")} / mo
                          </td>
                          <td className="py-2.5 px-3">
                            {sub.compatibility === "COMPATIBLE" && (
                              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                COMPATIBLE
                              </span>
                            )}
                            {sub.compatibility === "REVIEW" && (
                              <span className="inline-flex items-center text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                REVIEW
                              </span>
                            )}
                            {sub.compatibility === "BREAKING" && (
                              <span className="inline-flex items-center text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                                BREAKING
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-medium">
                            {sub.requiredAction === "NONE" ? "Seamless Auto-Migration" : sub.requiredAction}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
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
