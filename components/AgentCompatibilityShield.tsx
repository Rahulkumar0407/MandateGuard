"use client";

import React, { useState, useEffect } from "react";
import type { AgentCompatibilityStatus } from "@/lib/compatibility/types";

export function AgentCompatibilityShield() {
  const [subscriptionId, setSubscriptionId] = useState("sub_demo_active_01");
  const [statusResult, setStatusResult] =
    useState<AgentCompatibilityStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performQuery = async (subId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/v1/subscriptions/${subId}/compatibility-status`,
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to fetch compatibility status.");
      }
      const data = await res.json();
      setStatusResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error querying status.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/v1/subscriptions/${subscriptionId}/compatibility-status`,
        );
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to fetch compatibility status.");
        }
        const data = await res.json();
        if (!ignore) {
          setStatusResult(data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Error querying status.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [subscriptionId]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                Buyer & Agent Protection Shield
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Subscription: {subscriptionId}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              Autonomous Agent Authorization & Commercial Compatibility
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-3xl">
              MandateGuard ensures merchants cannot unilaterally degrade
              recurring commercial terms without your agent detecting breaches
              and blocking unauthorized billing.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={subscriptionId}
              onChange={(e) => setSubscriptionId(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-[#0066ff]"
            >
              <option value="sub_demo_active_01">Demo User (₹4,000 ceiling, 5% tol)</option>
              <option value="sub_demo_active_02">Alice (₹4,500 ceiling, 10% tol)</option>
              <option value="sub_demo_active_03">Bob (₹3,600 ceiling, strict)</option>
            </select>

            <button
              type="button"
              onClick={() => performQuery(subscriptionId)}
              disabled={isLoading}
              className="px-3.5 py-2 bg-[#0066ff] hover:bg-[#0052cc] text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50 flex items-center space-x-1.5"
            >
              <svg
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Refresh Query</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-sm">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}

      {statusResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* Status KPI Overview Card (12 cols) */}
          <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Compatibility Badge */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Compatibility Status
              </div>
              <div className="mt-2 flex items-center space-x-2">
                {statusResult.compatibility === "COMPATIBLE" && (
                  <span className="inline-flex items-center text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1 rounded-md border border-emerald-300 dark:border-emerald-700">
                    🟢 COMPATIBLE
                  </span>
                )}
                {statusResult.compatibility === "REVIEW" && (
                  <span className="inline-flex items-center text-sm font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-3 py-1 rounded-md border border-amber-300 dark:border-amber-700">
                    🟡 REVIEW REQUIRED
                  </span>
                )}
                {statusResult.compatibility === "BREAKING" && (
                  <span className="inline-flex items-center text-sm font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 px-3 py-1 rounded-md border border-rose-300 dark:border-rose-700">
                    🔴 BREAKING BREACH
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Compared against immutable authorized baseline
              </p>
            </div>

            {/* Autonomous Execution Permission */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Autonomous Execution
              </div>
              <div className="mt-2">
                {statusResult.authorization.canProceedAutonomously ? (
                  <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-base">
                    <span>✓</span>
                    <span>AUTONOMOUS ALLOWED</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5 text-rose-600 dark:text-rose-400 font-bold text-base">
                    <span>✕</span>
                    <span>BLOCKED (Human Required)</span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Action required: <span className="font-semibold text-slate-700 dark:text-slate-300">{statusResult.requiredAction}</span>
              </p>
            </div>

            {/* Delegated Monthly Budget */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Delegated Budget Ceiling
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                ₹{(statusResult.authorization.delegatedBudgetLimit / 100).toLocaleString("en-IN")}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Authorized Spend: ₹{(statusResult.authorization.authorizedMonthlySpend / 100).toLocaleString("en-IN")} / mo
              </p>
            </div>

            {/* Baseline Version Pinning */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Version Lineage
              </div>
              <div className="mt-2 flex items-center space-x-2 text-xs">
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded font-mono">
                  Baseline: v{statusResult.authorizedBaseline.version}
                </span>
                <span>→</span>
                <span className="bg-blue-100 dark:bg-blue-950 text-[#0066ff] px-2 py-0.5 rounded font-mono">
                  Current: v{statusResult.currentOffer.version}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 truncate font-mono">
                Hash: {statusResult.authorizedBaseline.versionHash.slice(0, 16)}...
              </p>
            </div>
          </div>

          {/* Finding Reasons */}
          <div className="lg:col-span-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>📋</span>
              <span>Integrity & Compatibility Evaluation Findings ({statusResult.reasons.length})</span>
            </h2>

            {statusResult.reasons.length === 0 ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300">
                ✓ Current merchant offer version perfectly matches your authorized baseline commitments. No degradations or price breaches detected.
              </div>
            ) : (
              <div className="space-y-2.5">
                {statusResult.reasons.map((r, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                      r.severity === "CRITICAL"
                        ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                        : r.severity === "WARNING"
                        ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <div>
                      <div className="font-semibold flex items-center space-x-2">
                        <span className="uppercase text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-current">
                          {r.dimension}
                        </span>
                        <span>{r.code}</span>
                      </div>
                      <p className="mt-1 text-slate-700 dark:text-slate-300">{r.message}</p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        r.severity === "CRITICAL"
                          ? "bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100"
                          : r.severity === "WARNING"
                          ? "bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                      }`}
                    >
                      {r.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
