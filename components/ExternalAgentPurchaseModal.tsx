"use client";

import React, { useState } from "react";
import type { AgentCommerceContract } from "@/lib/contract/types";

interface ExternalAgentPurchaseModalProps {
  contract: AgentCommerceContract | null;
  isOpen: boolean;
  onClose: () => void;
}

interface HandoffPreviewResponse {
  status: string;
  message: string;
  serverRevalidation: {
    status: string;
    authoritativeOfferId: string;
    authoritativeVersion: number;
    authoritativeVersionHash: string | null;
    authoritativePricePaise: number;
    clientClaimedPricePaise: number | null;
    priceTamperingDetected: boolean;
    priceTamperingHandled: string;
    spendingLimitCompliance: boolean;
    dedicatedHumanVerified: boolean;
  };
  preview: {
    offerName: string;
    productName: string;
    priceFormatted: string;
    currency: string;
    billingInterval: string;
    durationDays: number;
    supportTier: string;
    hasDedicatedHuman: boolean;
    slaHours: number | null;
    refundWindowDays: number;
  };
}

interface HandoffReceiptResponse {
  mandateId: string;
  offerId: string;
  offerName: string;
  status: string;
  razorpaySubscriptionId: string | null;
  shortUrl: string | null;
  authorizedAt: string | Date;
}

export function ExternalAgentPurchaseModal({
  contract,
  isOpen,
  onClose,
}: ExternalAgentPurchaseModalProps) {
  const [buyerQuery, setBuyerQuery] = useState("I need a monthly human mentor under ₹4,000");
  const [spendingLimit, setSpendingLimit] = useState(4000);
  const [tamperPrice, setTamperPrice] = useState(false);
  const [simulateStaleVersion, setSimulateStaleVersion] = useState(false);

  const [step, setStep] = useState<"IDLE" | "EVALUATING" | "PREVIEW" | "AUTHORIZING" | "COMPLETED">("IDLE");
  const [previewData, setPreviewData] = useState<HandoffPreviewResponse | null>(null);
  const [receiptData, setReceiptData] = useState<HandoffReceiptResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !contract) return null;

  const handleRunAgentSimulation = async () => {
    setStep("EVALUATING");
    setError(null);
    setPreviewData(null);
    setReceiptData(null);

    try {
      // 1. External Agent Evaluates Public Contract
      const evalRes = await fetch("/api/agent/external-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: contract.offer.id,
          buyerQuery,
        }),
      });

      if (!evalRes.ok) {
        throw new Error("External agent evaluation failed");
      }

      const evalData = await evalRes.json();
      if (!evalData.isEligible) {
        throw new Error(`External agent rejected offer: ${evalData.decisionTrace.safetyExplanation}`);
      }

      // 2. External Agent Formulates Purchase Handoff to MandateGuard
      const handoffBody = {
        offerId: contract.offer.id,
        expectedVersion: simulateStaleVersion ? contract.offer.version - 1 : contract.offer.version,
        expectedVersionHash: simulateStaleVersion ? "stale_hash_000000" : contract.integrity.versionHash,
        canonicalIntent: evalData.decisionTrace.canonicalIntent,
        buyerContext: {
          userId: "user_buyer_external_demo",
          spendingLimitPaise: spendingLimit * 100,
          currency: contract.commercialTerms.currency,
          billingInterval: contract.commercialTerms.billingInterval,
          customerEmail: "buyer.agent@example.com",
        },
        clientClaimedPricePaise: tamperPrice ? 10000 : undefined, // ₹100 tampered price attempt
        authorizePurchase: false,
      };

      const handoffRes = await fetch("/api/agent/external-purchase-handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(handoffBody),
      });

      const handoffData = await handoffRes.json();

      if (!handoffRes.ok) {
        throw new Error(handoffData.error || "Handoff revalidation failed");
      }

      setPreviewData(handoffData);
      setStep("PREVIEW");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed");
      setStep("IDLE");
    }
  };

  const handleAuthorizePurchase = async () => {
    if (!previewData) return;
    setStep("AUTHORIZING");
    setError(null);

    try {
      const handoffBody = {
        offerId: contract.offer.id,
        expectedVersion: contract.offer.version,
        expectedVersionHash: contract.integrity.versionHash,
        buyerContext: {
          userId: "user_buyer_external_demo",
          spendingLimitPaise: spendingLimit * 100,
          currency: contract.commercialTerms.currency,
          billingInterval: contract.commercialTerms.billingInterval,
          customerEmail: "buyer.agent@example.com",
        },
        authorizePurchase: true,
      };

      const res = await fetch("/api/agent/external-purchase-handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(handoffBody),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Purchase authorization failed");
      }

      setReceiptData(data.receipt);
      setStep("COMPLETED");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authorization failed");
      setStep("PREVIEW");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded border border-emerald-500/20">
                External Agent Purchase Path
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {contract.product.name} (v{contract.offer.version})
              </span>
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mt-1">
              Your offer is ready for AI buyers.
            </h3>
            <p className="text-xs text-zinc-400">
              An external AI agent discovers your contract, evaluates buyer constraints, hands off to MandateGuard, and requests explicit authorization.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-center justify-between">
              <span>✕ {error}</span>
              <button onClick={() => setError(null)} className="font-bold ml-2">✕</button>
            </div>
          )}

          {/* Form Controls */}
          {step === "IDLE" && (
            <div className="space-y-4 bg-zinc-900/40 p-5 rounded-xl border border-zinc-800">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Buyer Requirement</label>
                <input
                  type="text"
                  value={buyerQuery}
                  onChange={(e) => setBuyerQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Buyer Hard Spending Limit</label>
                  <input
                    type="number"
                    value={spendingLimit}
                    onChange={(e) => setSpendingLimit(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-2 pt-4">
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tamperPrice}
                      onChange={(e) => setTamperPrice(e.target.checked)}
                      className="rounded border-zinc-700 text-emerald-500"
                    />
                    <span>Test Client Price Tampering (Claim ₹100)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simulateStaleVersion}
                      onChange={(e) => setSimulateStaleVersion(e.target.checked)}
                      className="rounded border-zinc-700 text-emerald-500"
                    />
                    <span>Test Stale Version Rejection (Request Old v{contract.offer.version - 1})</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleRunAgentSimulation}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md"
              >
                Run External AI Buyer Simulation &rarr;
              </button>
            </div>
          )}

          {step === "EVALUATING" && (
            <div className="p-8 bg-zinc-900/30 rounded-xl border border-zinc-800 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium text-zinc-300">
                External AI Agent reading public machine-readable contract and evaluating constraints...
              </p>
            </div>
          )}

          {/* Step: Purchase Preview */}
          {step === "PREVIEW" && previewData && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* External Agent Decision summary */}
              <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  1. AI BUYER SELECTION
                </span>
                <p className="text-xs text-zinc-300 font-medium">
                  External agent selected <strong className="text-white">{previewData.preview.offerName}</strong> because it satisfies the buyer&apos;s ₹{spendingLimit.toLocaleString("en-IN")} spending ceiling and includes dedicated human mentor support.
                </p>
              </div>

              {/* Server Revalidation Audit */}
              <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                    2. SERVER REVALIDATION AT BOUNDARY
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    AUTHORITATIVE PRICE ENFORCED
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                  <div>Authoritative Price: <span className="font-bold text-white">₹{(previewData.serverRevalidation.authoritativePricePaise / 100).toLocaleString("en-IN")} / mo</span></div>
                  <div>Spending Limit: <span className="font-bold text-white">₹{spendingLimit.toLocaleString("en-IN")}</span></div>
                  <div>Version Pinned: <span className="font-mono text-white">v{previewData.serverRevalidation.authoritativeVersion}</span></div>
                  <div>Hash Verified: <span className="font-mono text-white">{previewData.serverRevalidation.authoritativeVersionHash?.slice(0, 12)}...</span></div>
                </div>
                {previewData.serverRevalidation.priceTamperingDetected && (
                  <div className="mt-2 p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] rounded-lg">
                    ⚠️ <strong>Tampering Defeated:</strong> External agent attempted to claim ₹100, but MandateGuard server discarded client claims and enforced authoritative ₹{(previewData.serverRevalidation.authoritativePricePaise / 100).toLocaleString("en-IN")}.
                  </div>
                )}
              </div>

              {/* Purchase Authorization Action */}
              <div className="p-5 bg-zinc-900 rounded-xl border border-zinc-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-emerald-400 block uppercase tracking-wider">
                    3. EXPLICIT BUYER AUTHORIZATION
                  </span>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    No provider mutation occurs until the buyer explicitly authorizes the transaction.
                  </p>
                </div>
                <button
                  onClick={handleAuthorizePurchase}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md whitespace-nowrap"
                >
                  Authorize Purchase &rarr;
                </button>
              </div>
            </div>
          )}

          {step === "AUTHORIZING" && (
            <div className="p-8 bg-zinc-900/30 rounded-xl border border-zinc-800 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium text-zinc-300">
                Authorizing mandate and dispatching to CommerceMutationExecutor...
              </p>
            </div>
          )}

          {/* Step: Completed Receipt */}
          {step === "COMPLETED" && receiptData && (
            <div className="space-y-4 p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center font-bold text-xs">
                  ✓
                </span>
                <h4 className="text-sm font-bold text-emerald-400">
                  Purchase Protected & Authorized
                </h4>
              </div>
              <p className="text-xs text-zinc-300">
                The external AI agent successfully transacted through MandateGuard. The provider mutation was gated, authorized, and executed safely.
              </p>
              <div className="p-3.5 bg-zinc-900 rounded-xl border border-zinc-800 text-xs font-mono space-y-1.5 text-zinc-300">
                <div>Mandate ID: <span className="text-emerald-400">{receiptData.mandateId}</span></div>
                <div>Status: <span className="text-emerald-400">{receiptData.status}</span></div>
                <div>Razorpay Subscription ID: <span className="text-emerald-400">{receiptData.razorpaySubscriptionId || "sub_test_mode_active"}</span></div>
                <div>Authorized At: <span className="text-zinc-400">{new Date(receiptData.authorizedAt).toLocaleString()}</span></div>
              </div>
              <button
                onClick={() => setStep("IDLE")}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition-colors"
              >
                Run Another AI Buyer Test
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
