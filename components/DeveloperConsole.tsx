"use client";

import React, { useEffect, useState } from "react";
import { BuyerBrainProofExperience } from "./BuyerBrainProofExperience";

interface CompatibilityApiResponse {
  compatibility?: string;
  authorization?: {
    canProceedAutonomously?: boolean;
    delegatedBudgetLimit?: number;
    authorizedMonthlySpend?: number;
  };
  requiredAction?: string;
  reasons?: Array<{
    dimension: string;
    severity: string;
    code: string;
    message: string;
  }>;
  [key: string]: unknown;
}

export function DeveloperConsole() {
  const [activeTab, setActiveTab] = useState<"safety" | "compatibility">("safety");
  const [subId, setSubId] = useState("sub_TTxm2Zjw4MdlZm");
  const [statusResult, setStatusResult] = useState<CompatibilityApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async (idToFetch: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/v1/subscriptions/${idToFetch}/compatibility-status`);
      const data = await res.json();
      setStatusResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error querying compatibility API.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetch(`/v1/subscriptions/${subId}/compatibility-status`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) setStatusResult(data);
      })
      .catch((e: unknown) => {
        if (isMounted) {
          setError(e instanceof Error ? e.message : "Error querying compatibility API.");
        }
      });
    return () => {
      isMounted = false;
    };
  }, [subId]);

  return (
    <div className="space-y-6 animate-fade-in text-white" data-testid="developer-console-root">
      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab("safety")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "safety"
              ? "bg-[#0B5CFF] text-white shadow-[0_0_16px_rgba(11,92,255,0.4)]"
              : "bg-[#0D1527] text-slate-300 hover:text-white border border-white/10 hover:bg-[#131F3B]"
          }`}
        >
          AI Safety & Benchmark Proof
        </button>

        <button
          onClick={() => setActiveTab("compatibility")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "compatibility"
              ? "bg-[#0B5CFF] text-white shadow-[0_0_16px_rgba(11,92,255,0.4)]"
              : "bg-[#0D1527] text-slate-300 hover:text-white border border-white/10 hover:bg-[#131F3B]"
          }`}
        >
          Agent Compatibility Gate API
        </button>
      </div>

      {/* Tab 1: AI Safety & Benchmark Proof Experience */}
      {activeTab === "safety" && <BuyerBrainProofExperience />}

      {/* Tab 2: Autonomous Agent Compatibility Gate Console */}
      {activeTab === "compatibility" && (
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="border-b border-white/10 pb-5">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#60A5FA] bg-[#0B5CFF]/15 px-2.5 py-0.5 rounded-full border border-[#0B5CFF]/30">
                DEVELOPER API
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Autonomous Agent Compatibility Gate
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Machine-readable API for autonomous AI buyers and agents to evaluate whether renewal mutations are permitted.
            </p>
          </div>

          {/* Query Bar */}
          <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Subscription ID or Envelope ID:
                </label>
                <input
                  type="text"
                  value={subId}
                  onChange={(e) => setSubId(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 font-mono text-xs text-white focus:outline-none focus:border-[#0B5CFF]"
                />
              </div>
              <button
                onClick={() => fetchStatus(subId)}
                disabled={isLoading}
                className="w-full sm:w-auto self-end bg-[#0B5CFF] hover:bg-[#004DE6] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all disabled:opacity-50 mg-press"
              >
                {isLoading ? "Querying..." : "Query Compatibility API"}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Structured Agent Response */}
          {statusResult && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Agent Decision Metrics */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Compatibility Status
                  </span>
                  <div>
                    <span
                      className={`text-lg font-bold px-2.5 py-1 rounded-xl inline-block ${
                        statusResult.compatibility === "COMPATIBLE"
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {statusResult.compatibility}
                    </span>
                  </div>
                </div>

                <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Autonomous Action Permission
                  </span>
                  <div>
                    <span
                      className={`text-sm font-bold px-2.5 py-1 rounded-xl inline-block ${
                        statusResult.authorization?.canProceedAutonomously
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {statusResult.authorization?.canProceedAutonomously
                        ? "✓ ALLOWED TO RENEW"
                        : "✕ AUTONOMOUS MUTATION BLOCKED"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    Required Action:{" "}
                    <strong className="text-white">{statusResult.requiredAction}</strong>
                  </div>
                </div>

                <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-5 shadow-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monthly Spend:</span>
                    <span className="font-semibold text-white">
                      ₹{((statusResult.authorization?.authorizedMonthlySpend || 0) / 100).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Delegated Budget:</span>
                    <span className="font-semibold text-white">
                      ₹{((statusResult.authorization?.delegatedBudgetLimit || 0) / 100).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Raw JSON Schema Output */}
              <div className="lg:col-span-2 bg-[#0D1527] border border-white/10 rounded-2xl p-5 shadow-xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs font-mono text-slate-400">
                  <span>GET /v1/subscriptions/:id/compatibility-status</span>
                  <span className="text-emerald-400 font-semibold">200 OK</span>
                </div>
                <pre className="mt-3 flex-1 text-[11px] font-mono text-slate-200 overflow-x-auto p-3 bg-black/40 rounded-xl border border-white/10">
                  {JSON.stringify(statusResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
