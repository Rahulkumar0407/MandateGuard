"use client";

import React, { useState } from "react";
import type { ReauthorizationRequest } from "@/lib/reauthorization/types";

export function ReauthorizationConsole() {
  const [envelopeId, setEnvelopeId] = useState("env_sub_demo_active_01");
  const [targetOfferVersionId, setTargetOfferVersionId] =
    useState("o_sysdesign_v2");
  const [activeRequest, setActiveRequest] =
    useState<ReauthorizationRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initiateReauthorization = async () => {
    setIsLoading(true);
    setError(null);
    setActionMessage(null);
    try {
      const res = await fetch("/api/reauthorization/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          envelopeId,
          targetOfferVersionId,
          reason: "Merchant published major revision v2 with pricing/support adjustments.",
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to initiate reauthorization.");
      }

      const data = await res.json();
      setActiveRequest(data);
      setActionMessage("Reauthorization request initiated successfully. Status is MIGRATION_PENDING.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error initiating request.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!activeRequest) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reauthorization/${activeRequest.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisionNote: "Buyer explicitly accepted v2 terms via MandateGuard Console.",
          updatedFinancialConstraints: { maxPricePaise: 500000 },
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to approve reauthorization.");
      }

      const data = await res.json();
      setActiveRequest(data.request);
      setActionMessage(
        `Reauthorization approved! New immutable AuthorizationEnvelope (${data.newEnvelope.id}) created and pinned to v2 baseline.`,
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error approving request.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async (action: "RETAIN_BASELINE" | "PAUSE_SUBSCRIPTION") => {
    if (!activeRequest) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reauthorization/${activeRequest.id}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: action === "RETAIN_BASELINE"
            ? "Buyer declined v2 and opted to retain current v1 baseline terms."
            : "Buyer declined v2 and opted to pause subscription.",
          action,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to decline reauthorization.");
      }

      const data = await res.json();
      setActiveRequest(data);
      setActionMessage(
        action === "RETAIN_BASELINE"
          ? "Reauthorization declined. Envelope reverted to ACTIVE protecting original baseline."
          : "Reauthorization declined. Envelope transitioned to PAUSED state.",
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error declining request.");
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
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                Reauthorization State Machine
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              Deterministic Offer Migration & Reauthorization Hub
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-3xl">
              When a merchant offer undergoes breaking or review-required
              changes, the Reauthorization State Machine safely orchestrates
              buyer acceptance without mutating historical baseline snapshots.
            </p>
          </div>
        </div>
      </div>

      {/* State Transitions Reference Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { state: "ACTIVE", desc: "Baseline Protected", color: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" },
          { state: "MIGRATION_PENDING", desc: "Awaiting Decision", color: "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800" },
          { state: "REAUTHORIZED", desc: "New Baseline Pinned", color: "border-blue-300 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800" },
          { state: "DECLINED", desc: "Terms Rejected", color: "border-slate-300 bg-slate-50 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700" },
          { state: "PAUSED", desc: "Protection Halted", color: "border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800" },
          { state: "EXPIRED", desc: "Window Elapsed", color: "border-slate-300 bg-slate-50 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700" },
        ].map((item, idx) => (
          <div key={idx} className={`p-3 rounded-lg border text-center ${item.color}`}>
            <div className="text-xs font-bold font-mono tracking-tight">{item.state}</div>
            <div className="text-[10px] mt-0.5 opacity-80">{item.desc}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-sm">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}

      {actionMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm">
          {actionMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Initiate Trigger */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Initiate Migration Workflow
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Active Authorization Envelope
            </label>
            <select
              value={envelopeId}
              onChange={(e) => setEnvelopeId(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-2.5 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-[#0066ff]"
            >
              <option value="env_sub_demo_active_01">env_sub_demo_active_01 (User: Demo Buyer)</option>
              <option value="env_sub_demo_active_02">env_sub_demo_active_02 (User: Alice)</option>
              <option value="env_sub_demo_active_03">env_sub_demo_active_03 (User: Bob)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Target Offer Version ID
            </label>
            <input
              type="text"
              value={targetOfferVersionId}
              onChange={(e) => setTargetOfferVersionId(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-2.5 text-slate-800 dark:text-slate-200 font-mono focus:ring-1 focus:ring-[#0066ff]"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Target version to migrate this envelope&rsquo;s baseline to
            </p>
          </div>

          <button
            type="button"
            onClick={initiateReauthorization}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-[#0066ff] hover:bg-[#0052cc] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-1.5"
          >
            <span>Trigger Migration State (MIGRATION_PENDING)</span>
          </button>
        </div>

        {/* Right: Active Reauthorization Request Details & Decision Hub */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Active Reauthorization Request & Resolution Hub
          </h2>

          {!activeRequest ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No active reauthorization request selected. Click &ldquo;Trigger
              Migration State&rdquo; to begin a workflow.
            </div>
          ) : (
            <div className="space-y-4 text-xs animate-fade-in">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-lg">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Request ID:</span>
                  <div className="font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {activeRequest.id}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Workflow State:</span>
                  <div className="mt-0.5">
                    <span className="inline-flex items-center text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800 font-mono">
                      {activeRequest.state}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Target Offer Version:</span>
                  <div className="font-mono font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                    {activeRequest.targetOfferVersionId}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Compatibility Level:</span>
                  <div className="font-medium text-rose-600 dark:text-rose-400 mt-0.5">
                    {activeRequest.compatibilityStatus}
                  </div>
                </div>
              </div>

              {/* Decision Actions when MIGRATION_PENDING */}
              {activeRequest.state === "MIGRATION_PENDING" && (
                <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Select Reauthorization Resolution Action:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={isLoading}
                      className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-xs transition-colors flex flex-col items-center justify-center space-y-1"
                    >
                      <span>✓ Approve & Pin v2</span>
                      <span className="text-[10px] text-emerald-100 font-normal">
                        Create New Envelope
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDecline("RETAIN_BASELINE")}
                      disabled={isLoading}
                      className="p-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium text-xs transition-colors flex flex-col items-center justify-center space-y-1"
                    >
                      <span>✕ Decline & Retain</span>
                      <span className="text-[10px] text-slate-300 font-normal">
                        Stay on v1 Baseline
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDecline("PAUSE_SUBSCRIPTION")}
                      disabled={isLoading}
                      className="p-3 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-medium text-xs transition-colors flex flex-col items-center justify-center space-y-1"
                    >
                      <span>⏸ Decline & Pause</span>
                      <span className="text-[10px] text-rose-200 font-normal">
                        Pause Protection
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {activeRequest.state === "REAUTHORIZED" && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300">
                  <div className="font-semibold">✓ Reauthorization Completed</div>
                  <p className="mt-1">
                    New baseline pinned with envelope ID: <span className="font-mono">{activeRequest.newEnvelopeId}</span>. Previous baseline retired without in-place mutation.
                  </p>
                </div>
              )}

              {activeRequest.state === "DECLINED" && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200">
                  <div className="font-semibold">Declined by User</div>
                  <p className="mt-1">
                    Decision action executed: <span className="font-mono font-semibold">{activeRequest.decisionAction}</span>.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
