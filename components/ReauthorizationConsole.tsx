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
    <div className="space-y-6 text-white animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#60A5FA] bg-[#0B5CFF]/15 px-2.5 py-0.5 rounded-full border border-[#0B5CFF]/30">
                Reauthorization State Machine
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">
              Deterministic Offer Migration & Reauthorization Hub
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
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
          { state: "ACTIVE", desc: "Baseline Protected", color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" },
          { state: "MIGRATION_PENDING", desc: "Awaiting Decision", color: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
          { state: "REAUTHORIZED", desc: "New Baseline Pinned", color: "border-blue-500/40 bg-blue-500/10 text-blue-300" },
          { state: "DECLINED", desc: "Terms Rejected", color: "border-white/15 bg-white/5 text-slate-300" },
          { state: "PAUSED", desc: "Protection Halted", color: "border-rose-500/40 bg-rose-500/10 text-rose-300" },
          { state: "EXPIRED", desc: "Window Elapsed", color: "border-white/10 bg-black/30 text-slate-400" },
        ].map((item, idx) => (
          <div key={idx} className={`p-3 rounded-xl border text-center ${item.color}`}>
            <div className="text-xs font-bold font-mono tracking-tight">{item.state}</div>
            <div className="text-[10px] mt-0.5 opacity-80">{item.desc}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}

      {actionMessage && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs">
          {actionMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Initiate Trigger */}
        <div className="lg:col-span-5 bg-[#0D1527] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white border-b border-white/10 pb-3">
            Initiate Migration Workflow
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Select Active Authorization Envelope
            </label>
            <select
              value={envelopeId}
              onChange={(e) => setEnvelopeId(e.target.value)}
              className="w-full text-xs bg-black/40 border border-white/15 rounded-xl p-2.5 text-white focus:ring-1 focus:ring-[#0B5CFF]"
            >
              <option value="env_sub_demo_active_01">env_sub_demo_active_01 (User: Demo Buyer)</option>
              <option value="env_sub_demo_active_02">env_sub_demo_active_02 (User: Alice)</option>
              <option value="env_sub_demo_active_03">env_sub_demo_active_03 (User: Bob)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Target Offer Version ID
            </label>
            <input
              type="text"
              value={targetOfferVersionId}
              onChange={(e) => setTargetOfferVersionId(e.target.value)}
              className="w-full text-xs bg-black/40 border border-white/15 rounded-xl p-2.5 text-white font-mono focus:ring-1 focus:ring-[#0B5CFF]"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Target version to migrate this envelope&rsquo;s baseline to
            </p>
          </div>

          <button
            type="button"
            onClick={initiateReauthorization}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-[#0B5CFF] hover:bg-[#004DE6] text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_16px_rgba(11,92,255,0.3)] disabled:opacity-50 flex items-center justify-center space-x-1.5 mg-press"
          >
            <span>Trigger Migration State (MIGRATION_PENDING)</span>
          </button>
        </div>

        {/* Right: Active Reauthorization Request Details & Decision Hub */}
        <div className="lg:col-span-7 bg-[#0D1527] border border-white/10 rounded-2xl p-6 shadow-xl space-y-5">
          <h2 className="text-sm font-bold text-white border-b border-white/10 pb-3">
            Active Reauthorization Request & Resolution Hub
          </h2>

          {!activeRequest ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No active reauthorization request selected. Click &ldquo;Trigger
              Migration State&rdquo; to begin a workflow.
            </div>
          ) : (
            <div className="space-y-4 text-xs animate-fade-in">
              <div className="grid grid-cols-2 gap-3 bg-white/5 p-3.5 rounded-xl border border-white/10">
                <div>
                  <span className="text-slate-400">Request ID:</span>
                  <div className="font-mono font-semibold text-white mt-0.5">
                    {activeRequest.id}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Workflow State:</span>
                  <div className="mt-0.5">
                    <span className="inline-flex items-center text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 font-mono">
                      {activeRequest.state}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Target Offer Version:</span>
                  <div className="font-mono font-medium text-slate-200 mt-0.5">
                    {activeRequest.targetOfferVersionId}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Compatibility Level:</span>
                  <div className="font-medium text-rose-400 mt-0.5">
                    {activeRequest.compatibilityStatus}
                  </div>
                </div>
              </div>

              {/* Decision Actions when MIGRATION_PENDING */}
              {activeRequest.state === "MIGRATION_PENDING" && (
                <div className="space-y-2.5 pt-2 border-t border-white/10">
                  <div className="font-semibold text-white">
                    Select Reauthorization Resolution Action:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={isLoading}
                      className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all flex flex-col items-center justify-center space-y-1 shadow-sm mg-press"
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
                      className="p-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold text-xs border border-white/15 transition-all flex flex-col items-center justify-center space-y-1 mg-press"
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
                      className="p-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs transition-all flex flex-col items-center justify-center space-y-1 shadow-sm mg-press"
                    >
                      <span>⏸ Decline & Pause</span>
                      <span className="text-[10px] text-rose-100 font-normal">
                        Pause Protection
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {activeRequest.state === "REAUTHORIZED" && (
                <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300">
                  <div className="font-bold">✓ Reauthorization Completed</div>
                  <p className="mt-1">
                    New baseline pinned with envelope ID: <span className="font-mono">{activeRequest.newEnvelopeId}</span>. Previous baseline retired without in-place mutation.
                  </p>
                </div>
              )}

              {activeRequest.state === "DECLINED" && (
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-slate-300">
                  <div className="font-bold">Declined by User</div>
                  <p className="mt-1">
                    Decision action executed: <span className="font-mono font-semibold text-white">{activeRequest.decisionAction}</span>.
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
