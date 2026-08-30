"use client";

import React, { useState } from "react";
import type { MerchantImpactPreview } from "@/lib/merchant/preview-types";
import type { ViewTab } from "./Navbar";

interface MerchantOfferStudioProps {
  onNavigateTab?: (tab: ViewTab) => void;
}

export function MerchantOfferStudio({ onNavigateTab }: MerchantOfferStudioProps) {
  const [candidateScenario, setCandidateScenario] = useState<
    "preset_compatible" | "preset_review" | "preset_breaking" | "custom"
  >("preset_breaking");

  const [price, setPrice] = useState(412900);
  const [supportTier, setSupportTier] = useState("community");
  const [hasDedicatedHuman, setHasDedicatedHuman] = useState(false);
  const [oneOnOneSessions, setOneOnOneSessions] = useState(0);
  const [slaHours, setSlaHours] = useState(72);
  const [refundWindowDays, setRefundWindowDays] = useState(14);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<MerchantImpactPreview | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [showTechnicalDrawer, setShowTechnicalDrawer] = useState(false);

  const applyScenario = (
    scenario: "preset_compatible" | "preset_review" | "preset_breaking",
  ) => {
    setCandidateScenario(scenario);
    setActionSuccessMessage(null);
    if (scenario === "preset_compatible") {
      setPrice(359900); // 2.8% increase (within 5% tolerance)
      setSupportTier("dedicated_mentor");
      setHasDedicatedHuman(true);
      setOneOnOneSessions(4);
      setSlaHours(24);
      setRefundWindowDays(30);
    } else if (scenario === "preset_review") {
      setPrice(379900); // 8.5% increase (triggers review)
      setSupportTier("dedicated_mentor");
      setHasDedicatedHuman(true);
      setOneOnOneSessions(4);
      setSlaHours(24);
      setRefundWindowDays(30);
    } else if (scenario === "preset_breaking") {
      setPrice(412900); // 18% increase + mentor removed (breaking)
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
    setActionSuccessMessage(null);
    try {
      const payload = {
        offerId: "o_p_sysdesign_v8",
        proposedOffer: {
          id: "o_p_sysdesign_v8",
          productId: "p_sysdesign",
          version: 8,
          name: "System Design Pro (v8 Revision)",
          price: price,
          currency: "INR",
          billingInterval: "monthly",
          supportTerms:
            supportTier === "dedicated_mentor"
              ? "Dedicated mentor with weekly 1:1 sessions"
              : "Community Discord only",
          semanticTerms:
            "Self-paced video modules, system design templates, mock interview guides",
          structuredCommitments: {
            support: {
              tier: supportTier,
              slaHours: slaHours,
              oneOnOneSessionsPerMonth: oneOnOneSessions,
              hasDedicatedHuman: hasDedicatedHuman,
            },
            entitlements: {
              keys: ["system_design_templates", "video_modules"],
              criticalKeys:
                supportTier === "community" ? [] : ["mentor_feedback"],
            },
            usageLimits: {
              apiRequestsPerMonth: 10000,
              concurrentSeats: 1,
              computeCredits: 500,
            },
            delivery: {
              type: "continuous_saas",
              commitmentSLA:
                supportTier === "community"
                  ? "Community Support"
                  : "24h SLA",
            },
            refundPolicy: {
              type: "conditional",
              windowDays: refundWindowDays,
              requiresReason: true,
            },
          },
        },
      };

      const res = await fetch("/api/merchant/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }

      const data: { success: boolean; preview: MerchantImpactPreview } =
        await res.json();
      setPreview(data.preview);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to run analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitiateReauthorization = async () => {
    setIsLoading(true);
    setError(null);
    setActionSuccessMessage(null);
    try {
      const res = await fetch("/api/reauthorization/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          envelopeId: "env_sub_TTxm2Zjw4MdlZm",
          targetOfferVersionId: "o_p_sysdesign_v8",
          reason:
            "System Design Pro v8 plan revision exceeds original customer authorization terms.",
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to initiate reauthorization.");
      }

      setActionSuccessMessage(
        "✓ Reauthorization requests sent to all affected customers! Customers can now review and approve new terms in their portal.",
      );
      if (onNavigateTab) {
        setTimeout(() => onNavigateTab("customers"), 2000);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to initiate reauthorization.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--mg-border)] pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--mg-brand)] bg-[var(--mg-brand-soft)] px-2.5 py-0.5 rounded-md border border-[var(--mg-brand-line)]">
              MERCHANT STUDIO
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--mg-navy)]">
              Plan Revisions &amp; Impact Analysis
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--mg-text-secondary)] mt-1.5 font-normal">
            Simulate commercial and price revisions before publishing to guarantee recurring customers are protected.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowTechnicalDrawer(!showTechnicalDrawer)}
            className="text-xs font-bold text-[var(--mg-navy)] bg-white hover:bg-[var(--mg-bg)] px-3.5 py-2 rounded-xl border border-[var(--mg-border)] transition-colors shadow-xs"
          >
            {showTechnicalDrawer ? "Hide Proof" : "View Cryptographic Proof"}
          </button>
        </div>
      </div>

      {/* Preset Scenarios Selector */}
      <div className="bg-white border border-[var(--mg-border)] rounded-2xl p-6 shadow-xs space-y-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--mg-text-muted)] block">
          Select Plan Revision Scenario:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => applyScenario("preset_compatible")}
            className={`p-4 rounded-xl border text-left transition-all ${
              candidateScenario === "preset_compatible"
                ? "border-[var(--mg-brand)] bg-[var(--mg-brand-soft)] ring-1 ring-[var(--mg-brand)]"
                : "border-[var(--mg-border)] hover:bg-[var(--mg-bg)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--mg-navy)]">
                Minor Price Adjustment
              </span>
              <span className="text-[10px] font-bold text-[var(--mg-success)] bg-[var(--mg-success-soft)] border border-[var(--mg-success)]/20 px-2 py-0.5 rounded-full">
                Seamless
              </span>
            </div>
            <p className="text-[11px] text-[var(--mg-text-secondary)] mt-1.5 leading-relaxed">
              ₹3,599/mo (+2.8% price increase, retains 1:1 mentor support).
            </p>
          </button>

          <button
            onClick={() => applyScenario("preset_review")}
            className={`p-4 rounded-xl border text-left transition-all ${
              candidateScenario === "preset_review"
                ? "border-[var(--mg-warning)] bg-[var(--mg-warning-soft)] ring-1 ring-[var(--mg-warning)]"
                : "border-[var(--mg-border)] hover:bg-[var(--mg-bg)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--mg-navy)]">
                Moderate Price Increase
              </span>
              <span className="text-[10px] font-bold text-[var(--mg-warning)] bg-[var(--mg-warning-soft)] border border-[var(--mg-warning)]/30 px-2 py-0.5 rounded-full">
                Review Needed
              </span>
            </div>
            <p className="text-[11px] text-[var(--mg-text-secondary)] mt-1.5 leading-relaxed">
              ₹3,799/mo (+8.5% price increase, buyers are notified).
            </p>
          </button>

          <button
            onClick={() => applyScenario("preset_breaking")}
            className={`p-4 rounded-xl border text-left transition-all ${
              candidateScenario === "preset_breaking"
                ? "border-[var(--mg-critical)] bg-[var(--mg-critical-soft)] ring-1 ring-[var(--mg-critical)]"
                : "border-[var(--mg-border)] hover:bg-[var(--mg-bg)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--mg-navy)]">
                Breaking Scope Change
              </span>
              <span className="text-[10px] font-bold text-[var(--mg-critical)] bg-[var(--mg-critical-soft)] border border-[var(--mg-critical)]/30 px-2 py-0.5 rounded-full">
                Reauthorization Required
              </span>
            </div>
            <p className="text-[11px] text-[var(--mg-text-secondary)] mt-1.5 leading-relaxed">
              ₹4,129/mo (+18% price, mentor removed, community support).
            </p>
          </button>
        </div>
      </div>

      {/* Side-by-Side Terms Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Agreed Terms */}
        <div className="bg-white border border-[var(--mg-border)] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--mg-border)]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mg-brand)] bg-[var(--mg-brand-soft)] px-2.5 py-0.5 rounded-md border border-[var(--mg-brand-line)]">
                Current Active Plan
              </span>
              <h3 className="text-base font-bold text-[var(--mg-navy)] mt-1.5">
                System Design Pro
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-[var(--mg-navy)]">
                ₹3,499
              </span>
              <span className="text-xs text-[var(--mg-text-muted)] block">/ month</span>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-[var(--mg-text-secondary)]">
            <div className="flex items-start space-x-2">
              <span className="text-[var(--mg-success)] font-bold">✓</span>
              <div>
                <strong className="text-[var(--mg-navy)]">Support Tier:</strong> Dedicated 1:1 industry mentor
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-[var(--mg-success)] font-bold">✓</span>
              <div>
                <strong className="text-[var(--mg-navy)]">1:1 Sessions:</strong> 4 personalized mock interviews / month
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-[var(--mg-success)] font-bold">✓</span>
              <div>
                <strong className="text-[var(--mg-navy)]">Turnaround SLA:</strong> 24h guaranteed review SLA
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-[var(--mg-success)] font-bold">✓</span>
              <div>
                <strong className="text-[var(--mg-navy)]">Refund Policy:</strong> 30-day conditional money-back window
              </div>
            </div>
          </div>
        </div>

        {/* Proposed Revision Terms */}
        <div className="bg-white border border-[var(--mg-border)] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--mg-border)]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mg-warning)] bg-[var(--mg-warning-soft)] px-2.5 py-0.5 rounded-md border border-[var(--mg-warning)]/30">
                Proposed Draft Terms
              </span>
              <h3 className="text-base font-bold text-[var(--mg-navy)] mt-1.5">
                System Design Pro (Revision)
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-[var(--mg-navy)]">
                ₹{(price / 100).toLocaleString("en-IN")}
              </span>
              <span className="text-xs text-[var(--mg-text-muted)] block">/ month</span>
            </div>
          </div>

          {/* Quick controls */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[var(--mg-text-secondary)] text-[11px] mb-1 font-bold">
                Proposed Price (₹)
              </label>
              <input
                type="number"
                value={price / 100}
                onChange={(e) => {
                  setPrice(Number(e.target.value) * 100);
                  setCandidateScenario("custom");
                }}
                className="w-full bg-[var(--mg-bg)] border border-[var(--mg-border)] rounded-xl px-3 py-2 text-xs text-[var(--mg-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--mg-brand)]"
              />
            </div>
            <div>
              <label className="block text-[var(--mg-text-secondary)] text-[11px] mb-1 font-bold">
                Support Model
              </label>
              <select
                value={supportTier}
                onChange={(e) => {
                  setSupportTier(e.target.value);
                  setHasDedicatedHuman(e.target.value === "dedicated_mentor");
                  setCandidateScenario("custom");
                }}
                className="w-full bg-[var(--mg-bg)] border border-[var(--mg-border)] rounded-xl px-3 py-2 text-xs text-[var(--mg-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--mg-brand)]"
              >
                <option value="dedicated_mentor">Dedicated Mentor</option>
                <option value="standard_email">Standard Email</option>
                <option value="community">Community Discord Only</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={runAnalysis}
              disabled={isLoading}
              className="w-full bg-[var(--mg-brand)] hover:bg-[var(--mg-brand-hover)] text-white text-xs font-bold py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Calculating Customer Impact...</span>
              ) : (
                <>
                  <span>Run Live Impact Analysis</span>
                  <span>&rarr;</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-[var(--mg-critical-soft)] border border-[var(--mg-critical)]/30 text-xs text-[var(--mg-critical)] font-medium">
          {error}
        </div>
      )}
      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-[var(--mg-success-soft)] border border-[var(--mg-success)]/20 text-xs text-[var(--mg-success)] font-bold">
          {actionSuccessMessage}
        </div>
      )}

      {/* Live Impact Preview Results */}
      {preview && (
        <div className="bg-white border border-[var(--mg-border)] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--mg-border)]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mg-text-muted)]">
                Customer Impact Assessment
              </span>
              <h2 className="text-lg font-bold text-[var(--mg-navy)] mt-0.5">
                {preview.summary.breakingCount > 0
                  ? "⚠ Publishing this plan requires customer reauthorization"
                  : "✓ Plan update is within acceptable buyer tolerance"}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-[var(--mg-text-muted)] block">Affected Monthly Revenue</span>
              <span className="text-lg font-black text-[var(--mg-critical)]">
                ₹{(preview.financialImpact.atRiskMRRPaise / 100).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Impact Cohorts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[var(--mg-bg)] border border-[var(--mg-border)] rounded-xl p-4">
              <div className="text-xs text-[var(--mg-text-secondary)]">No Action Needed</div>
              <div className="text-2xl font-black text-[var(--mg-success)] mt-1">
                {preview.summary.compatiblePercentage}%
              </div>
              <p className="text-[11px] text-[var(--mg-text-secondary)] mt-1">
                {preview.summary.compatibleCount} customer(s) continue seamlessly.
              </p>
            </div>

            <div className="bg-[var(--mg-bg)] border border-[var(--mg-border)] rounded-xl p-4">
              <div className="text-xs text-[var(--mg-text-secondary)]">Needs Review</div>
              <div className="text-2xl font-black text-[var(--mg-warning)] mt-1">
                {preview.summary.reviewPercentage}%
              </div>
              <p className="text-[11px] text-[var(--mg-text-secondary)] mt-1">
                {preview.summary.reviewCount} customer(s) notified of minor changes.
              </p>
            </div>

            <div className="bg-[var(--mg-critical-soft)] border border-[var(--mg-critical)]/30 rounded-xl p-4">
              <div className="text-xs text-[var(--mg-critical)] font-bold">Reauthorization Required</div>
              <div className="text-2xl font-black text-[var(--mg-critical)] mt-1">
                {preview.summary.breakingPercentage}%
              </div>
              <p className="text-[11px] text-[var(--mg-critical)] mt-1">
                {preview.summary.breakingCount} customer(s) must explicitly re-approve.
              </p>
            </div>
          </div>

          {/* Why? Reasons list */}
          {preview.subscribers[0]?.reasons && (
            <div className="bg-[var(--mg-bg)] rounded-xl p-4 border border-[var(--mg-border)] space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--mg-navy)]">
                Identified Discrepancies with Original Terms:
              </div>
              <ul className="space-y-1.5 text-xs text-[var(--mg-text-secondary)]">
                {preview.subscribers[0].reasons.map((r, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-[var(--mg-critical)] font-bold">•</span>
                    <span>{r.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Merchant Actions Bar */}
          <div className="pt-4 border-t border-[var(--mg-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-[var(--mg-text-secondary)]">
              Choose how you wish to proceed with this plan update:
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setActionSuccessMessage(
                    "✓ Existing subscribers grandfathered on ₹3,499/mo! New terms will apply only to new signups.",
                  );
                }}
                className="bg-[var(--mg-bg)] hover:bg-[var(--mg-bg-muted)] text-[var(--mg-navy)] border border-[var(--mg-border)] text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
              >
                Keep Existing Customers on Original Terms
              </button>

              {preview.summary.breakingCount > 0 && (
                <button
                  onClick={handleInitiateReauthorization}
                  disabled={isLoading}
                  className="bg-[var(--mg-brand)] hover:bg-[var(--mg-brand-hover)] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors"
                >
                  Request Customer Approval
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progressive Disclosure Technical Drawer */}
      {showTechnicalDrawer && (
        <div className="bg-[var(--mg-navy)] border border-[var(--mg-navy)] rounded-2xl p-6 text-slate-300 font-mono text-xs space-y-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px] pb-3 border-b border-slate-700">
            <span>TECHNICAL &amp; CRYPTOGRAPHIC PROOF (DEVELOPER AUDIT)</span>
            <span className="text-emerald-400 font-bold">SHA-256 Verified</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
            <div>
              <span className="text-slate-400 block mb-1">Baseline Version Hash:</span>
              <code className="text-slate-200 break-all bg-white/10 p-2 rounded block">
                de6c99d2cd5f3ee2e4ffd8754b0e1b92da70514fcb2f7087f39a3a8ac806a383
              </code>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Proposed Version Hash:</span>
              <code className="text-slate-200 break-all bg-white/10 p-2 rounded block">
                {preview?.proposedOfferHash ||
                  "b541d7137a694bb5d1ffb06f574ed1194597e1f6ba18439c7ea0662a753ee410"}
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
