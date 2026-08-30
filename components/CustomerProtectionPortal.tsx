"use client";

import React, { useState } from "react";
import { BlockedPaymentIllustration } from "./Illustrations";

export function CustomerProtectionPortal() {
  const [hasPendingChange, setHasPendingChange] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);
  const [reauthModalOpen, setReauthModalOpen] = useState(false);
  const [showWhyDetails, setShowWhyDetails] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const initRes = await fetch("/api/reauthorization/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          envelopeId: "env_sub_TTxm2Zjw4MdlZm",
          targetOfferVersionId: "o_p_sysdesign_v8",
          reason: "Customer portal approval requested.",
        }),
      });

      let requestId = "reauth_portal";
      if (initRes.ok) {
        const initData = await initRes.json();
        requestId = initData.id;
      }

      const approveRes = await fetch(`/api/reauthorization/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisionNote: "Buyer approved revised plan terms via customer portal.",
          updatedFinancialConstraints: { maxPricePaise: 500000 },
        }),
      });

      if (!approveRes.ok) {
        const errJson = await approveRes.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to submit approval.");
      }

      setIsApproved(true);
      setHasPendingChange(false);
      setReauthModalOpen(false);
      setStatusMessage(
        "✓ Your new terms are approved. Future payments will use ₹4,129/month.",
      );
    } catch (e: unknown) {
      setStatusMessage(e instanceof Error ? e.message : "Error accepting terms.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      setDeclined(true);
      setHasPendingChange(false);
      setReauthModalOpen(false);
      setStatusMessage(
        "✓ You kept your original protection. The payment at the higher price remains blocked.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 font-sans text-[var(--mg-text)] antialiased" data-testid="customer-protection-root">
      {/* =========================================================================
          TOP OF PAGE: Clean Product Header
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--mg-border)] pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-[#0B5CFF]/15 text-[#0B5CFF] border border-[#0B5CFF]/30">
            <span className="w-2 h-2 rounded-full bg-[#0B5CFF] animate-pulse" />
            <span>Protected Recurring Purchases</span>
          </div>
          <p className="text-xs text-[var(--mg-text-secondary)] font-medium">
            MandateGuard checks the terms before a recurring payment continues.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/30 self-start sm:self-auto shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Active &amp; Guarded</span>
        </div>
      </div>

      {/* Status Feedback Toast */}
      {statusMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-xs font-bold flex items-center justify-between animate-in fade-in duration-200">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-xs text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* =========================================================================
          BASELINE SUBSCRIPTION CARD (Always Active & Protected)
          ========================================================================= */}
      <section className="mg-glass-1 border border-[var(--mg-border)] rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[var(--mg-border)] pb-5">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-500 text-[10px] font-black rounded-full border border-emerald-500/30">
                ✓ ACTIVE &amp; GUARDED
              </span>
              <span className="text-xs text-[var(--mg-text-muted)] font-mono">
                Mandate ID: sub_TTxm2Zjw4MdlZm
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[var(--mg-text)] pt-1">
              System Design Pro
            </h2>
            <p className="text-xs text-[var(--mg-text-secondary)]">
              Authorized on Aug 26, 2026 via Razorpay Test Mode
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-2xl font-black text-[var(--mg-text)]">₹3,499</span>
            <span className="text-xs text-[var(--mg-text-muted)] block">/ monthly</span>
          </div>
        </div>

        {/* Protected Terms Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)] space-y-1">
            <span className="text-[10px] font-bold text-[var(--mg-text-muted)] uppercase block">MENTOR TIER</span>
            <span className="font-extrabold text-[var(--mg-text)] block">Dedicated Human Mentor</span>
            <span className="text-[10px] text-emerald-500 font-bold block">✓ 4 sessions / month</span>
          </div>

          <div className="p-3.5 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)] space-y-1">
            <span className="text-[10px] font-bold text-[var(--mg-text-muted)] uppercase block">RESPONSE SLA</span>
            <span className="font-extrabold text-[var(--mg-text)] block">24-hour turnaround</span>
            <span className="text-[10px] text-emerald-500 font-bold block">✓ Guaranteed SLA</span>
          </div>

          <div className="p-3.5 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)] space-y-1">
            <span className="text-[10px] font-bold text-[var(--mg-text-muted)] uppercase block">PRICE BOUNDARY</span>
            <span className="font-extrabold text-[var(--mg-text)] block">Locked to ₹3,499</span>
            <span className="text-[10px] text-emerald-500 font-bold block">✓ No unexpected hikes</span>
          </div>

          <div className="p-3.5 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)] space-y-1">
            <span className="text-[10px] font-bold text-[var(--mg-text-muted)] uppercase block">REFUND POLICY</span>
            <span className="font-extrabold text-[var(--mg-text)] block">30-day money-back</span>
            <span className="text-[10px] text-emerald-500 font-bold block">✓ Contractually frozen</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          STOPPED RECURRING CHARGE ALERT (The Core Protection Concept)
          ========================================================================= */}
      {hasPendingChange && !declined && !isApproved ? (
        <section className="mg-glass-2 border-2 border-rose-500/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-500 border border-rose-500/40">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>STOPPED CHARGE ALERT</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[var(--mg-text)] tracking-tight">
                This payment was stopped.
              </h3>
              <p className="text-xs sm:text-sm text-[var(--mg-text-secondary)] leading-relaxed max-w-xl">
                The offer changed after you reviewed it. The merchant published price revisions to &quot;System Design Pro&quot;, so MandateGuard stopped the recurring payment.
              </p>
            </div>

            <div className="p-4 bg-emerald-500/10 border border-emerald-500/40 rounded-2xl text-emerald-500 text-xs font-extrabold flex items-center space-x-2 self-start md:self-auto shadow-xs">
              <span className="text-lg">🛡️</span>
              <span>NO MONEY WAS MOVED</span>
            </div>
          </div>

          {/* Visual Split Comparison & Block Illustration */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* Split Comparison Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Before */}
              <div className="p-5 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mg-text-muted)]">
                    BEFORE: APPROVED TERMS
                  </span>
                  <span className="text-emerald-500 font-extrabold text-xs">₹3,499 / mo</span>
                </div>
                <div className="space-y-1.5 text-xs text-[var(--mg-text-secondary)] font-medium">
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>1:1 Dedicated Mentor (4 sessions)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>24h Guaranteed Response SLA</span>
                  </div>
                </div>
              </div>

              {/* After / Changed */}
              <div className="p-5 bg-rose-500/10 rounded-2xl border border-rose-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                    AFTER: MERCHANT REVISION
                  </span>
                  <span className="text-rose-500 font-extrabold text-xs">₹4,129 / mo (+18%)</span>
                </div>
                <div className="space-y-1.5 text-xs text-[var(--mg-text-secondary)] font-medium">
                  <div className="flex items-center space-x-2 text-rose-500">
                    <span>✕</span>
                    <span>Group mentorship (reduced sessions)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[var(--mg-text-muted)]">
                    <span>•</span>
                    <span>48h response time</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Shield Illustration */}
            <div className="flex justify-center p-2">
              <BlockedPaymentIllustration className="w-full h-auto max-w-[240px]" />
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-[var(--mg-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button
              onClick={() => setShowWhyDetails(!showWhyDetails)}
              className="text-xs text-[var(--mg-text-muted)] hover:text-[var(--mg-text)] underline underline-offset-4 font-bold text-left"
            >
              {showWhyDetails ? "Hide explanation" : "Why was this stopped?"}
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleDecline}
                disabled={isProcessing}
                className="px-4 py-2.5 bg-[var(--mg-surface-subtle)] hover:bg-[var(--mg-border)] text-[var(--mg-text)] border border-[var(--mg-border)] rounded-xl text-xs font-bold transition-all disabled:opacity-50 mg-press"
              >
                Keep my protection
              </button>
              <button
                onClick={() => setReauthModalOpen(true)}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-[#0B5CFF] hover:bg-[#004DE6] text-white rounded-xl text-xs font-bold shadow-[0_0_16px_rgba(11,92,255,0.4)] transition-all disabled:opacity-50 mg-press"
              >
                Review updated offer &rarr;
              </button>
            </div>
          </div>

          {/* Expandable "Why was this stopped?" */}
          {showWhyDetails && (
            <div className="pt-4 border-t border-[var(--mg-border)] space-y-2 text-xs text-[var(--mg-text-secondary)] leading-relaxed animate-in fade-in duration-200">
              <p>• You approved: <strong>₹3,499/month</strong> with 1:1 mentorship and 24h SLA.</p>
              <p>• The merchant now asks: <strong>₹4,129/month</strong> with revised terms.</p>
              <p>• Because the terms changed after your initial review, MandateGuard stopped the payment.</p>
              <p className="text-emerald-500 font-bold">• Result: Zero money moved from your account.</p>
            </div>
          )}
        </section>
      ) : (
        /* Reauthorization Success State */
        <section className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-black text-lg">
              ✓
            </div>
            <div>
              <h3 className="text-lg font-black text-[var(--mg-text)]">
                {isApproved ? "Your new terms are approved." : "Protected Baseline Maintained"}
              </h3>
              <p className="text-xs text-emerald-500 mt-0.5">
                {isApproved
                  ? "Future payments will use ₹4,129/month under your updated authorization."
                  : "All recurring charges are verified and locked to your original authorization."}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          PROTECTION HISTORY / SIMPLE TIMELINE
          ========================================================================= */}
      <section className="mg-glass-1 border border-[var(--mg-border)] rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--mg-border)] pb-4">
          <div>
            <h3 className="text-base font-extrabold text-[var(--mg-text)]">
              Protection Timeline
            </h3>
            <p className="text-xs text-[var(--mg-text-muted)] mt-0.5">
              Verified record of payments and safety checks.
            </p>
          </div>
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="text-xs font-bold text-[var(--mg-text-muted)] hover:text-[var(--mg-text)] underline underline-offset-4"
          >
            {showTechnicalDetails ? "Hide technical details" : "Technical details"}
          </button>
        </div>

        {/* Simple Step Timeline */}
        <div className="space-y-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <span className="text-xs font-extrabold text-[var(--mg-text)] block">Today</span>
              <p className="text-xs text-[var(--mg-text-secondary)] font-medium">
                {isApproved
                  ? "New terms approved (₹4,129/mo) • Purchase protected"
                  : declined
                  ? "Rejection confirmed • Payment at ₹4,129/mo remains blocked"
                  : "Payment stopped by MandateGuard • No money moved"}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
              ✕
            </div>
            <div>
              <span className="text-xs font-extrabold text-[var(--mg-text)] block">Earlier</span>
              <p className="text-xs text-[var(--mg-text-secondary)] font-medium">
                Merchant published revised offer (₹4,129/mo) • Mismatch detected
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="w-7 h-7 rounded-full bg-blue-500/20 text-[#0B5CFF] border border-blue-500/30 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <span className="text-xs font-extrabold text-[var(--mg-text)] block">Initial Purchase</span>
              <p className="text-xs text-[var(--mg-text-secondary)] font-medium">
                Original plan approved (₹3,499/mo) on Razorpay Test Mode
              </p>
            </div>
          </div>
        </div>

        {/* Technical Details Collapsible */}
        {showTechnicalDetails && (
          <div className="p-4 bg-[var(--mg-surface-subtle)] text-[var(--mg-text-secondary)] rounded-2xl text-[11px] font-mono space-y-1 border border-[var(--mg-border)] animate-in fade-in duration-200">
            <div>Snapshot Envelope: env_sub_TTxm2Zjw4MdlZm</div>
            <div>Baseline Version: v1 (₹3,49900 paise)</div>
            <div>Target Version: v8 (₹4,12900 paise)</div>
            <div>Guardrail Policy: MAX_PRICE_DRIFT_15_PERCENT</div>
            <div>Action Result: MUTATION_BLOCKED_PROTECTION_INTACT</div>
          </div>
        )}
      </section>

      {/* =========================================================================
          REAUTHORIZATION MODAL (Clean Fintech Review)
          ========================================================================= */}
      {reauthModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--mg-bg-panel)] border border-[var(--mg-border)] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-scale-in text-[var(--mg-text)]">
            <div className="flex items-center justify-between border-b border-[var(--mg-border)] pb-4">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🛡️</span>
                <h3 className="text-lg font-extrabold text-[var(--mg-text)]">
                  Review Updated Terms
                </h3>
              </div>
              <button
                onClick={() => setReauthModalOpen(false)}
                className="text-[var(--mg-text-muted)] hover:text-[var(--mg-text)] text-base font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-[var(--mg-text-secondary)] leading-relaxed">
                The merchant published revised pricing for <strong>System Design Pro</strong>. Review the change before deciding.
              </p>

              {/* Price Diff */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)]">
                  <span className="text-[10px] font-bold uppercase text-[var(--mg-text-muted)] block">OLD PRICE</span>
                  <p className="text-lg font-black text-[var(--mg-text)] mt-0.5">₹3,499</p>
                  <span className="text-[10px] text-[var(--mg-text-muted)]">/ month</span>
                </div>
                <div className="p-4 bg-blue-500/15 rounded-2xl border border-blue-500/30">
                  <span className="text-[10px] font-bold uppercase text-[#0B5CFF] block">NEW PRICE</span>
                  <p className="text-lg font-black text-[var(--mg-text)] mt-0.5">₹4,129</p>
                  <span className="text-[10px] text-[#0B5CFF]">/ month (+18%)</span>
                </div>
              </div>

              <div className="p-4 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)] text-xs text-[var(--mg-text-secondary)] space-y-1">
                <span className="font-bold text-[var(--mg-text)] block">Summary of change:</span>
                <div>• Price: ₹3,499 &rarr; ₹4,129 / month</div>
                <div>• Everything else: Unchanged recurring monthly billing</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--mg-border)]">
              <button
                onClick={handleDecline}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-2xl border border-[var(--mg-border)] text-xs font-bold text-[var(--mg-text-secondary)] hover:bg-[var(--mg-border-subtle)] disabled:opacity-50 mg-press"
              >
                Keep original protection
              </button>
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-[#0B5CFF] hover:bg-[#004DE6] text-white text-xs font-bold rounded-2xl shadow-xs transition-all disabled:opacity-50 mg-press"
              >
                {isProcessing ? "Approving..." : "Approve new terms →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
