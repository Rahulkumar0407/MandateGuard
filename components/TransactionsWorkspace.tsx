"use client";

import React, { useState } from "react";

export interface TransactionRecord {
  id: string;
  buyerName: string;
  buyerQuery: string;
  offerName: string;
  amount: string;
  status: "SUCCESSFUL" | "BLOCKED" | "PENDING";
  gateVerdict: string;
  date: string;
  rationale: string;
  authorizedTerms: {
    price: string;
    billingCadence: string;
    mentorSupport: string;
    sla: string;
    refundPolicy: string;
  };
  protectionChecks: {
    name: string;
    status: "PASSED" | "BLOCKED" | "PENDING";
    detail: string;
  }[];
  providerId: string;
}

const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  {
    id: "tx_019283a",
    buyerName: "Ananya S.",
    buyerQuery: "4k ke andar human mentor chahiye with 24h SLA",
    offerName: "System Design Pro",
    amount: "₹3,499",
    status: "SUCCESSFUL",
    gateVerdict: "ALLOW ✓ Gated",
    date: "Today · 16:42",
    rationale: "Matched buyer constraint for 1:1 human mentor within ₹4,000 envelope.",
    authorizedTerms: {
      price: "₹3,499 / month",
      billingCadence: "Monthly auto-recurring",
      mentorSupport: "Dedicated 1:1 Human Mentor (4 calls/mo)",
      sla: "24-hour response SLA verified",
      refundPolicy: "30-day full refund protection",
    },
    protectionChecks: [
      { name: "Spending Limit Invariant", status: "PASSED", detail: "₹3,499 is within user budget limit of ₹4,000" },
      { name: "SLA Commitment Verification", status: "PASSED", detail: "Machine-readable 24h SLA parameter verified" },
      { name: "SHA-256 Snapshot Integrity", status: "PASSED", detail: "Offer terms hash matches immutable authorization record" },
    ],
    providerId: "sub_test_sysdes_01 (Razorpay Active)",
  },
  {
    id: "tx_019283b",
    buyerName: "Rohan K.",
    buyerQuery: "DSA coaching with mock interviews under 2.5k",
    offerName: "DSA Mastery",
    amount: "₹1,999",
    status: "SUCCESSFUL",
    gateVerdict: "ALLOW ✓ Gated",
    date: "Today · 15:18",
    rationale: "Selected for best self-paced curriculum value under ₹2,500.",
    authorizedTerms: {
      price: "₹1,999 / month",
      billingCadence: "Monthly auto-recurring",
      mentorSupport: "Self-paced with TA support",
      sla: "48-hour response SLA",
      refundPolicy: "14-day refund window",
    },
    protectionChecks: [
      { name: "Spending Limit Invariant", status: "PASSED", detail: "₹1,999 is within user budget limit of ₹2,500" },
      { name: "SHA-256 Snapshot Integrity", status: "PASSED", detail: "Offer terms hash matches immutable authorization record" },
    ],
    providerId: "sub_test_dsa_02 (Razorpay Active)",
  },
  {
    id: "tx_019283c",
    buyerName: "Vikram M.",
    buyerQuery: "System design pro renewal",
    offerName: "System Design Pro (Modified)",
    amount: "₹4,129",
    status: "BLOCKED",
    gateVerdict: "PAUSE ✕ Blocked",
    date: "Today · 14:05",
    rationale: "Recurring charge increased by +₹630 without customer reauthorization.",
    authorizedTerms: {
      price: "₹4,129 / month (Attempted hike from ₹3,499)",
      billingCadence: "Monthly auto-recurring",
      mentorSupport: "Support terms modified",
      sla: "48-hour SLA (Downgraded from 24h)",
      refundPolicy: "Unstated",
    },
    protectionChecks: [
      { name: "Unconsented Price Hike", status: "BLOCKED", detail: "Price changed from ₹3,499 to ₹4,129 without consent" },
      { name: "SLA Downgrade Detection", status: "BLOCKED", detail: "Mentor SLA changed from 24h to 48h" },
      { name: "Snapshot Hash Mismatch", status: "BLOCKED", detail: "Incoming terms do not match authorized SHA-256 hash" },
    ],
    providerId: "MUTATION_BLOCKED (No money moved)",
  },
  {
    id: "tx_019283d",
    buyerName: "Priya V.",
    buyerQuery: "Executive interview coaching with money back guarantee",
    offerName: "Engineering Leadership Prep",
    amount: "₹2,499",
    status: "SUCCESSFUL",
    gateVerdict: "ALLOW ✓ Gated",
    date: "Yesterday · 18:20",
    rationale: "Matched buyer constraint for money-back guarantee terms.",
    authorizedTerms: {
      price: "₹2,499 / month",
      billingCadence: "Monthly auto-recurring",
      mentorSupport: "Executive mock interview coaching",
      sla: "24-hour turnaround on mock feedback",
      refundPolicy: "100% money-back guarantee",
    },
    protectionChecks: [
      { name: "Spending Limit Invariant", status: "PASSED", detail: "₹2,499 is within user budget limit of ₹3,000" },
      { name: "SHA-256 Snapshot Integrity", status: "PASSED", detail: "Offer terms hash matches immutable authorization record" },
    ],
    providerId: "sub_test_englead_04 (Razorpay Active)",
  },
];

export function TransactionsWorkspace() {
  const [transactions] = useState<TransactionRecord[]>(INITIAL_TRANSACTIONS);
  const [filter, setFilter] = useState<"ALL" | "SUCCESSFUL" | "BLOCKED">("ALL");
  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "ALL") return true;
    return tx.status === filter;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 font-sans text-[var(--mg-text)] antialiased" data-testid="transactions-workspace-root">
      {/* =========================================================================
          TOP OF PAGE: Clean Product Header
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--mg-border)] pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-[#0B5CFF]/15 text-[#0B5CFF] border border-[#0B5CFF]/30">
            <span className="w-2 h-2 rounded-full bg-[#0B5CFF] animate-pulse" />
            <span>AI COMMERCE AUDIT LOG</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--mg-text)] tracking-tight">
            Every Payment Tells a Story
          </h1>
          <p className="text-xs text-[var(--mg-text-secondary)] font-medium">
            See the full context of what the buyer wanted, what was authorized, and what was protected.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/30 self-start sm:self-auto shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Audit Trail Immutable</span>
        </div>
      </div>

      {/* =========================================================================
          AUDIT SUMMARY METRICS
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 mg-glass-1 rounded-3xl border border-[var(--mg-border)] shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-[var(--mg-text-muted)] uppercase tracking-wider block">
            TOTAL AI TRANSACTIONS
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[var(--mg-text)]">
            {transactions.length}
          </span>
          <span className="text-[11px] text-[var(--mg-text-secondary)] block">Authorized via agent checkout</span>
        </div>

        <div className="p-5 mg-glass-1 rounded-3xl border border-emerald-500/30 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">
            PROTECTED CHARGES
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-500">
            {transactions.filter((t) => t.status === "SUCCESSFUL").length}
          </span>
          <span className="text-[11px] text-emerald-500 block">Active &amp; locked to terms</span>
        </div>

        <div className="p-5 mg-glass-1 rounded-3xl border border-rose-500/30 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
            STOPPED PAYMENTS
          </span>
          <span className="text-2xl sm:text-3xl font-black text-rose-500">
            {transactions.filter((t) => t.status === "BLOCKED").length}
          </span>
          <span className="text-[11px] text-rose-500 block">Zero money moved</span>
        </div>
      </div>

      {/* =========================================================================
          FILTER PILLS & SEARCH BAR
          ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all mg-press ${
              filter === "ALL"
                ? "bg-[#0B5CFF] text-white shadow-xs"
                : "bg-[var(--mg-surface-subtle)] text-[var(--mg-text-secondary)] hover:text-[var(--mg-text)] border border-[var(--mg-border)]"
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => setFilter("SUCCESSFUL")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all mg-press ${
              filter === "SUCCESSFUL"
                ? "bg-emerald-500 text-white shadow-xs"
                : "bg-[var(--mg-surface-subtle)] text-[var(--mg-text-secondary)] hover:text-[var(--mg-text)] border border-[var(--mg-border)]"
            }`}
          >
            Successful
          </button>
          <button
            onClick={() => setFilter("BLOCKED")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all mg-press ${
              filter === "BLOCKED"
                ? "bg-rose-500 text-white shadow-xs"
                : "bg-[var(--mg-surface-subtle)] text-[var(--mg-text-secondary)] hover:text-[var(--mg-text)] border border-[var(--mg-border)]"
            }`}
          >
            Stopped (Safe)
          </button>
        </div>

        <span className="text-xs font-medium text-[var(--mg-text-muted)]">
          Showing {filteredTransactions.length} transaction records
        </span>
      </div>

      {/* =========================================================================
          TRANSACTIONS TABLE / LIST
          ========================================================================= */}
      <div className="mg-glass-1 border border-[var(--mg-border)] rounded-3xl shadow-xl overflow-hidden divide-y divide-[var(--mg-border)]">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--mg-text-muted)] font-medium">
            No transactions found for this filter.
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isBlocked = tx.status === "BLOCKED";
            return (
              <div
                key={tx.id}
                onClick={() => {
                  setSelectedTx(tx);
                  setShowTechnicalDetails(false);
                }}
                className="p-5 sm:p-6 hover:bg-[var(--mg-surface-elevated)] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                {/* Left info */}
                <div className="flex items-start space-x-4">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${
                      isBlocked
                        ? "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                        : "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                    }`}
                  >
                    {isBlocked ? "!" : "✓"}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-extrabold text-[var(--mg-text)] group-hover:text-[#0B5CFF] transition-colors">
                        {tx.buyerName}
                      </h4>
                      <span className="text-[var(--mg-text-muted)]">•</span>
                      <span className="text-xs text-[var(--mg-text-secondary)] font-bold">{tx.offerName}</span>
                    </div>
                    <p className="text-xs text-[var(--mg-text-muted)] line-clamp-1">
                      &quot;{tx.buyerQuery}&quot;
                    </p>
                    <span className="text-[11px] text-[var(--mg-text-muted)] block pt-0.5">{tx.date}</span>
                  </div>
                </div>

                {/* Right info */}
                <div className="flex items-center justify-between sm:justify-end sm:text-right gap-4">
                  <div>
                    <span className="text-base font-black text-[var(--mg-text)] block">
                      {tx.amount}
                    </span>
                    <span className="text-[11px] text-[var(--mg-text-muted)] block">/ month</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center space-x-1 ${
                        isBlocked
                          ? "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                          : "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                      }`}
                    >
                      <span>{isBlocked ? "! Stopped" : "✓ Paid"}</span>
                    </span>
                    <span className="text-[var(--mg-text-muted)] group-hover:translate-x-0.5 transition-transform text-[var(--mg-text)]">
                      &rarr;
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =========================================================================
          TRANSACTION DETAIL DRAWER / MODAL
          ========================================================================= */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--mg-bg-panel)] border border-[var(--mg-border)] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-scale-in max-h-[90vh] overflow-y-auto text-[var(--mg-text)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--mg-border)] pb-4">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{selectedTx.status === "BLOCKED" ? "🛡️" : "💳"}</span>
                <h3 className="text-lg font-extrabold text-[var(--mg-text)]">
                  {selectedTx.status === "BLOCKED" ? "Stopped Payment Story" : "Payment Story"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-[var(--mg-text-muted)] hover:text-[var(--mg-text)] text-base font-bold"
              >
                ✕
              </button>
            </div>

            {/* Blocked vs Successful Content */}
            {selectedTx.status === "BLOCKED" ? (
              <div className="space-y-6">
                <div className="p-5 bg-amber-500/10 rounded-2xl border-2 border-amber-500/40 space-y-3">
                  <div className="flex items-center space-x-2 text-amber-500 font-extrabold text-sm">
                    <span>🛡️</span>
                    <span>No money was moved.</span>
                  </div>
                  <h4 className="text-base font-black text-[var(--mg-text)]">
                    This payment was stopped.
                  </h4>
                  <p className="text-xs text-amber-600 dark:text-amber-300 leading-relaxed">
                    The offer changed after the buyer reviewed it. A price increase to ₹4,129/mo exceeded the authorized baseline.
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                    <div className="p-3 bg-[var(--mg-surface-subtle)] rounded-xl border border-[var(--mg-border)]">
                      <span className="text-[10px] text-[var(--mg-text-muted)] font-bold block">YOU REVIEWED</span>
                      <span className="font-bold text-[var(--mg-text)]">₹3,499 / month</span>
                    </div>
                    <div className="p-3 bg-[var(--mg-surface-subtle)] rounded-xl border border-amber-500/30">
                      <span className="text-[10px] text-amber-500 font-bold block">CURRENT</span>
                      <span className="font-bold text-amber-500">₹4,129 / month</span>
                    </div>
                  </div>
                </div>

                {/* What happened timeline */}
                <div className="space-y-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--mg-text-muted)] block">
                    WHAT HAPPENED?
                  </span>
                  <div className="space-y-2.5 text-xs text-[var(--mg-text-secondary)]">
                    <div className="p-3.5 bg-[var(--mg-surface-subtle)] rounded-xl border border-[var(--mg-border)] space-y-1">
                      <span className="text-[10px] font-bold text-[var(--mg-text-muted)] block">1. BUYER ASKED</span>
                      <p className="font-bold text-[var(--mg-text)]">&quot;{selectedTx.buyerQuery}&quot;</p>
                    </div>
                    <div className="p-3.5 bg-[var(--mg-surface-subtle)] rounded-xl border border-[var(--mg-border)] space-y-1">
                      <span className="text-[10px] font-bold text-[var(--mg-text-muted)] block">2. OFFER CHANGED</span>
                      <p className="font-bold text-[var(--mg-text)]">Price raised to ₹4,129 without re-authorization</p>
                    </div>
                    <div className="p-3.5 bg-rose-500/10 rounded-xl border border-rose-500/30 space-y-1">
                      <span className="text-[10px] font-bold text-rose-500 block">3. MANDATEGUARD ACTION</span>
                      <p className="font-bold text-rose-500">Payment stopped at provider boundary</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Visual Storyline */}
                <div className="space-y-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--mg-text-muted)] block">
                    WHAT HAPPENED?
                  </span>
                  <div className="space-y-2.5 text-xs text-[var(--mg-text-secondary)]">
                    <div className="p-3.5 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)] space-y-0.5">
                      <span className="text-[10px] font-bold text-[var(--mg-text-muted)] block">1. BUYER ASKED</span>
                      <p className="font-bold text-[var(--mg-text)]">&quot;{selectedTx.buyerQuery}&quot;</p>
                    </div>

                    <div className="p-3.5 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)] space-y-0.5">
                      <span className="text-[10px] font-bold text-[var(--mg-text-muted)] block">2. OFFER SELECTED</span>
                      <p className="font-bold text-[var(--mg-text)]">{selectedTx.offerName}</p>
                    </div>

                    <div className="p-3.5 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)] space-y-0.5">
                      <span className="text-[10px] font-bold text-[var(--mg-text-muted)] block">3. BUYER APPROVED</span>
                      <p className="font-bold text-[var(--mg-text)]">{selectedTx.amount} / month (Monthly billing)</p>
                    </div>

                    <div className="p-3.5 bg-emerald-500/15 rounded-2xl border border-emerald-500/30 space-y-0.5">
                      <span className="text-[10px] font-bold text-emerald-500 block">4. PAYMENT &amp; PROTECTION</span>
                      <p className="font-bold text-emerald-500">Completed &amp; Protected under MandateGuard</p>
                    </div>
                  </div>
                </div>

                {/* Authorized Terms Box */}
                <div className="p-4 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)] space-y-2">
                  <span className="text-xs font-extrabold text-[var(--mg-text)] block">
                    Protected Terms on Record
                  </span>
                  <div className="space-y-1 text-xs text-[var(--mg-text-secondary)]">
                    <div>• Support: {selectedTx.authorizedTerms.mentorSupport}</div>
                    <div>• SLA: {selectedTx.authorizedTerms.sla}</div>
                    <div>• Refund Policy: {selectedTx.authorizedTerms.refundPolicy}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Collapsible Technical Details */}
            <div className="pt-2 border-t border-[var(--mg-border)]">
              <button
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="text-xs font-bold text-[var(--mg-text-muted)] hover:text-[var(--mg-text)] underline underline-offset-4"
              >
                {showTechnicalDetails ? "Hide technical details" : "View technical details"}
              </button>

              {showTechnicalDetails && (
                <div className="mt-3 p-4 bg-[var(--mg-surface-subtle)] text-[var(--mg-text-secondary)] rounded-2xl text-[11px] font-mono space-y-1.5 border border-[var(--mg-border)] animate-in fade-in duration-200">
                  <div>Transaction ID: {selectedTx.id}</div>
                  <div>Provider ID: {selectedTx.providerId}</div>
                  <div>Gate Verdict: {selectedTx.gateVerdict}</div>
                  <div>Snapshot Status: VERIFIED_IMMUTABLE</div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full py-3.5 bg-[var(--mg-surface-subtle)] hover:bg-[var(--mg-border)] text-[var(--mg-text)] text-xs font-bold rounded-2xl border border-[var(--mg-border)] shadow-xs transition-all mg-press"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
