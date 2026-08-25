"use client";

import React, { useState } from "react";

interface IntentResult {
  intent: {
    category?: string;
    maxMonthlyAmount?: number;
    currency?: string;
    requiredEntitlements?: string[];
    summary?: string;
  };
  recommendation: {
    selectedOffer: OfferDetail | null;
    rankedOffers: Array<{
      offer: OfferDetail;
      score: number;
      reasons: string[];
      eligible: boolean;
    }>;
  };
}

interface OfferDetail {
  id: string;
  version: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingInterval: string;
  duration: number;
  entitlementKeys: string[];
  refundPolicy: { windowDays: number };
  supportTerms: string;
  semanticTerms: string;
  product: {
    id: string;
    name: string;
    slug: string;
    category: string;
  };
}

interface MandateSnapshot {
  offerId: string;
  offerVersion: number;
  productId: string;
  productName: string;
  offerName: string;
  description: string;
  price: number;
  currency: string;
  billingInterval: string;
  duration: number;
  entitlementKeys: string[];
  refundWindowDays: number;
  supportTerms: string;
  semanticTerms: string;
}

interface MandateResult {
  id: string;
  userId: string;
  merchantId: string;
  offerId: string;
  razorpaySubscriptionId: string | null;
  status: string;
  authorizedAt: string;
  snapshot: MandateSnapshot;
}

interface IntegrityFinding {
  type: string;
  field: string;
  description: string;
  level: "ALLOW" | "REVIEW" | "PAUSE";
  diff?: { baseline: unknown; current: unknown };
}

interface SemanticFinding {
  direction: "IMPROVED" | "DEGRADED" | "NEUTRAL" | "UNCERTAIN";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  explanation: string;
}

interface IntegrityReport {
  mandateId: string;
  status: "OK" | "VIOLATIONS_FOUND" | "CURRENT_OFFER_UNAVAILABLE";
  findings: IntegrityFinding[];
  semanticStatus: string;
  semanticFindings: SemanticFinding[];
}

interface PolicyDecisionResult {
  decision: "ALLOW" | "REVIEW" | "PAUSE";
  reasons: string[];
  policyVersion: string;
  triggeredRules: string[];
}

interface ActionResult {
  status: "SUCCEEDED" | "FAILED" | "BLOCKED" | "NOT_REQUIRED";
  action: "NO_ACTION" | "REVIEW_REQUIRED" | "PAUSE_SUBSCRIPTION";
  decision: string;
  actionKey: string;
  providerSubscriptionId: string | null;
  providerCalled: boolean;
  reason?: string;
}

interface AuditEventItem {
  id: string;
  eventType: string;
  policyVersion: string | null;
  baselineOfferVersion: number | null;
  currentOfferVersion: number | null;
  decision: string | null;
  action: string | null;
  status: string | null;
  reason: string | null;
  providerSubscriptionId: string | null;
  actionKey: string | null;
  createdAt: string;
}

const EXAMPLE_PROMPTS = [
  "I want a monthly system design service with premium support and guaranteed expert help.",
  "Monthly DSA interview preparation under ₹4,000 with mock interviews.",
  "Career prep basic coaching with resume review.",
];

export function DemoConsole() {
  const [prompt, setPrompt] = useState(EXAMPLE_PROMPTS[0]);
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Demo Pipeline State
  const [intentData, setIntentData] = useState<IntentResult | null>(null);
  const [mandate, setMandate] = useState<MandateResult | null>(null);
  const [currentOffer, setCurrentOffer] = useState<OfferDetail | null>(null);
  const [merchantScenario, setMerchantScenario] = useState<string>("baseline");
  const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null);
  const [policyResult, setPolicyResult] = useState<PolicyDecisionResult | null>(null);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEventItem[]>([]);

  // Step 1: Submit Natural Language Intent
  async function handleSearchIntent(queryText = prompt) {
    setErrorMsg(null);
    setLoadingStep("intent");
    try {
      // Ensure seed catalog exists first
      await fetch("/api/demo/seed", { method: "POST" });

      const res = await fetch("/api/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: queryText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse buyer intent.");

      setIntentData(data);
      if (data.recommendation?.selectedOffer) {
        setCurrentOffer(data.recommendation.selectedOffer);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Intent discovery failed.";
      setErrorMsg(message);
    } finally {
      setLoadingStep(null);
    }
  }

  // Step 2: Authorize Mandate
  async function handleAuthorize(offerId: string) {
    setErrorMsg(null);
    setLoadingStep("authorize");
    try {
      const res = await fetch("/api/mandates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "buyer_demo_user",
          offerId,
          razorpaySubscriptionId: "sub_TTxm2Zjw4MdlZm",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authorization failed.");

      setMandate(data);
      setMerchantScenario("baseline");
      // Reset downstream states for clean demo run
      setIntegrityReport(null);
      setPolicyResult(null);
      setActionResult(null);
      setAuditEvents([]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to authorize mandate.";
      setErrorMsg(message);
    } finally {
      setLoadingStep(null);
    }
  }

  // Step 3: Rogue Merchant Simulation
  async function handleMutateMerchant(scenario: "rogue_full" | "price_only" | "semantic_only" | "reset") {
    setErrorMsg(null);
    setLoadingStep("mutate");
    try {
      const res = await fetch("/api/demo/mutate-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: mandate?.snapshot?.productId || "p_sysdesign",
          scenario,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Mutation failed.");

      setMerchantScenario(scenario);
      if (data.activeOffer) {
        setCurrentOffer({
          ...data.activeOffer,
          product: {
            id: data.activeOffer.productId,
            name: mandate?.snapshot?.productName || "System Design Pro",
            slug: "system-design-pro",
            category: "system-design",
          },
          refundPolicy: { windowDays: data.activeOffer.refundWindowDays },
        });
      }

      // Reset integrity and action for re-run
      setIntegrityReport(null);
      setPolicyResult(null);
      setActionResult(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Merchant simulation failed.";
      setErrorMsg(message);
    } finally {
      setLoadingStep(null);
    }
  }

  // Step 4 & 5: Run Integrity Check & Policy Decision
  async function handleRunIntegrity() {
    if (!mandate) return;
    setErrorMsg(null);
    setLoadingStep("integrity");
    try {
      // 1. Fetch Integrity
      const intRes = await fetch(`/api/mandates/${mandate.id}/integrity`);
      const intData = await intRes.json();
      if (!intRes.ok) throw new Error(intData.error || "Integrity check failed.");
      setIntegrityReport(intData);

      // 2. Fetch Policy
      const polRes = await fetch(`/api/mandates/${mandate.id}/policy`);
      const polData = await polRes.json();
      if (!polRes.ok) throw new Error(polData.error || "Policy evaluation failed.");
      setPolicyResult(polData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Integrity evaluation failed.";
      setErrorMsg(message);
    } finally {
      setLoadingStep(null);
    }
  }

  // Step 6: Execute Policy Action via ActionExecutor
  async function handleExecuteAction() {
    if (!mandate) return;
    setErrorMsg(null);
    setLoadingStep("action");
    try {
      const res = await fetch(`/api/mandates/${mandate.id}/evaluate-and-act`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action execution failed.");
      setActionResult(data);

      // Refresh Audit Trail immediately
      await fetchAuditTrail(mandate.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Action execution failed.";
      setErrorMsg(message);
    } finally {
      setLoadingStep(null);
    }
  }

  // Step 7: Fetch Audit Trail
  async function fetchAuditTrail(mandateId = mandate?.id) {
    if (!mandateId) return;
    try {
      const res = await fetch(`/api/mandates/${mandateId}/audit`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.events)) {
        setAuditEvents(data.events);
      }
    } catch (err) {
      console.error("Audit fetch failed:", err);
    }
  }

  const inr = (paise?: number) =>
    paise != null ? `₹${(paise / 100).toLocaleString("en-IN")}` : "₹0";

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-16 font-sans">
      {/* Global Banner / Header */}
      <header className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Track 01: Agentic Commerce
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
                Razorpay Test Mode
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mt-3">
              MandateGuard Console
            </h1>
            <p className="mt-1 text-sm md:text-base text-neutral-400 font-medium">
              <span className="text-white font-semibold">AI reasons.</span>{" "}
              <span className="text-emerald-400 font-semibold">MandateGuard authorizes.</span>{" "}
              <span className="text-blue-400 font-semibold">Razorpay executes.</span>
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end text-xs text-neutral-400">
            <span className="font-semibold text-neutral-300">Semantic Offer Integrity Layer</span>
            <span className="text-neutral-500">Autonomous Recurring Commerce Protection</span>
          </div>
        </div>
      </header>

      {/* Global Error Banner */}
      {errorMsg && (
        <div className="rounded-xl border border-red-800/50 bg-red-950/40 p-4 text-sm text-red-300 flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-xs text-red-400 hover:text-red-200 underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* STEP 1: Buyer Intent */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 md:p-8 backdrop-blur shadow-lg">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400 border border-blue-500/30">
              1
            </span>
            <h2 className="text-lg font-semibold text-white">Buyer Intent & Discovery</h2>
          </div>
          <span className="text-xs text-neutral-500">Natural Language Recommendation</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              What recurring service or membership are you looking for?
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your desired subscription in plain English..."
                className="flex-1 rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <button
                onClick={() => handleSearchIntent(prompt)}
                disabled={loadingStep === "intent"}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition cursor-pointer"
              >
                {loadingStep === "intent" ? "Discovering..." : "Discover Offers"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-neutral-500 font-medium">Try example:</span>
            {EXAMPLE_PROMPTS.map((ex, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(ex);
                  handleSearchIntent(ex);
                }}
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-xs text-neutral-400 hover:text-neutral-200 hover:border-neutral-700 transition"
              >
                &ldquo;{ex.slice(0, 45)}...&rdquo;
              </button>
            ))}
          </div>

          {/* Structured Intent & Recommendations */}
          {intentData && (
            <div className="mt-6 pt-6 border-t border-neutral-800 space-y-4">
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  AI Interpreted Intent (Strict Structured Output)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2 text-xs">
                  <div>
                    <span className="text-neutral-500">Category:</span>
                    <p className="font-medium text-white">{intentData.intent.category || "General"}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Max Budget:</span>
                    <p className="font-medium text-white">
                      {intentData.intent.maxMonthlyAmount ? inr(intentData.intent.maxMonthlyAmount) : "Flexible"}
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Currency:</span>
                    <p className="font-medium text-white">{intentData.intent.currency || "INR"}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Summary:</span>
                    <p className="font-medium text-neutral-300 truncate">{intentData.intent.summary || "Ready"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Ranked Merchant Offers ({intentData.recommendation?.rankedOffers?.length || 0})
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {intentData.recommendation?.rankedOffers?.map(({ offer, score, eligible }) => (
                    <div
                      key={offer.id}
                      className={`rounded-xl border p-5 transition flex flex-col justify-between ${
                        eligible
                          ? "border-neutral-700 bg-neutral-950/80 hover:border-blue-500/50"
                          : "border-neutral-800/40 bg-neutral-950/30 opacity-60"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                              {offer.product.name}
                            </span>
                            <h3 className="text-base font-bold text-white mt-0.5">{offer.name}</h3>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-bold text-white">{inr(offer.price)}</span>
                            <span className="text-xs text-neutral-400 block">/{offer.billingInterval}</span>
                          </div>
                        </div>

                        <p className="text-xs text-neutral-400 mt-2 line-clamp-2">{offer.description}</p>

                        <div className="mt-3 space-y-1 text-xs">
                          <div className="text-neutral-300">
                            <span className="text-neutral-500">Support: </span>
                            {offer.supportTerms}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {offer.entitlementKeys.map((k) => (
                              <span
                                key={k}
                                className="px-1.5 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-300 font-mono"
                              >
                                {k}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between">
                        <span className="text-xs text-emerald-400 font-medium">Score: {score}/100</span>
                        <button
                          onClick={() => handleAuthorize(offer.id)}
                          disabled={loadingStep === "authorize" || !eligible}
                          className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer"
                        >
                          {loadingStep === "authorize" ? "Freezing..." : "Authorize Mandate"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* STEP 2: Authorized Baseline */}
      {mandate && (
        <section className="rounded-2xl border border-emerald-900/40 bg-emerald-950/10 p-6 md:p-8 backdrop-blur shadow-lg">
          <div className="flex items-center justify-between border-b border-emerald-900/30 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                2
              </span>
              <div>
                <h2 className="text-lg font-semibold text-white">Explicit Authorization & Frozen Baseline</h2>
                <span className="text-xs text-neutral-400">
                  Mandate ID: <code className="font-mono text-emerald-300">{mandate.id}</code>
                </span>
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              IMMUTABLE SNAPSHOT FROZEN
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Frozen Snapshot Card */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Authorized Baseline (Frozen Source of Truth)
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-neutral-500">Product:</span>
                  <p className="font-medium text-white">{mandate.snapshot.productName}</p>
                </div>
                <div>
                  <span className="text-neutral-500">Authorized Price:</span>
                  <p className="font-medium text-emerald-400 font-mono text-sm">
                    {inr(mandate.snapshot.price)} / {mandate.snapshot.billingInterval}
                  </p>
                </div>
                <div>
                  <span className="text-neutral-500">Refund Window:</span>
                  <p className="font-medium text-white">{mandate.snapshot.refundWindowDays} days</p>
                </div>
                <div>
                  <span className="text-neutral-500">Duration:</span>
                  <p className="font-medium text-white">{mandate.snapshot.duration} days</p>
                </div>
              </div>

              <div className="pt-2 text-xs">
                <span className="text-neutral-500 block mb-1">Frozen Support SLA:</span>
                <p className="p-2 rounded bg-neutral-900 text-neutral-300 border border-neutral-800">
                  {mandate.snapshot.supportTerms}
                </p>
              </div>

              <div className="pt-1 text-xs">
                <span className="text-neutral-500 block mb-1">Authorized Entitlements:</span>
                <div className="flex flex-wrap gap-1">
                  {mandate.snapshot.entitlementKeys.map((k) => (
                    <span
                      key={k}
                      className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 text-[11px] font-mono"
                    >
                      ✓ {k}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Current Active Offer Card */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Current Merchant Offer (Live Version: v{currentOffer?.version || 1})
                </span>
                {merchantScenario !== "baseline" && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    Offer Mutated
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-neutral-500">Current Offer:</span>
                  <p className="font-medium text-white">{currentOffer?.name}</p>
                </div>
                <div>
                  <span className="text-neutral-500">Current Price:</span>
                  <p
                    className={`font-medium font-mono text-sm ${
                      (currentOffer?.price ?? 0) > mandate.snapshot.price
                        ? "text-red-400 font-bold"
                        : "text-white"
                    }`}
                  >
                    {inr(currentOffer?.price)} / {currentOffer?.billingInterval}
                    {(currentOffer?.price ?? 0) > mandate.snapshot.price && (
                      <span className="text-[10px] text-red-400 ml-1.5">
                        (+{Math.round((((currentOffer?.price ?? 0) - mandate.snapshot.price) / mandate.snapshot.price) * 100)}%)
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-neutral-500">Refund Window:</span>
                  <p className="font-medium text-white">{currentOffer?.refundPolicy?.windowDays} days</p>
                </div>
                <div>
                  <span className="text-neutral-500">Duration:</span>
                  <p className="font-medium text-white">{currentOffer?.duration} days</p>
                </div>
              </div>

              <div className="pt-2 text-xs">
                <span className="text-neutral-500 block mb-1">Current Support SLA:</span>
                <p
                  className={`p-2 rounded border ${
                    merchantScenario.includes("semantic") || merchantScenario === "rogue_full"
                      ? "bg-red-950/30 text-red-300 border-red-900/50"
                      : "bg-neutral-900 text-neutral-300 border-neutral-800"
                  }`}
                >
                  {currentOffer?.supportTerms}
                </p>
              </div>

              <div className="pt-1 text-xs">
                <span className="text-neutral-500 block mb-1">Current Entitlements:</span>
                <div className="flex flex-wrap gap-1">
                  {currentOffer?.entitlementKeys?.map((k) => (
                    <span
                      key={k}
                      className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[11px] font-mono"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* STEP 3: Rogue Merchant Simulator */}
      {mandate && (
        <section className="rounded-2xl border border-red-900/40 bg-red-950/10 p-6 md:p-8 backdrop-blur shadow-lg">
          <div className="flex items-center justify-between border-b border-red-900/30 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/20 text-xs font-bold text-red-400 border border-red-500/30">
                3
              </span>
              <h2 className="text-lg font-semibold text-white">Rogue Merchant Simulator</h2>
            </div>
            <span className="text-xs text-red-400 font-medium">Controlled Degradation Scenarios</span>
          </div>

          <p className="text-xs text-neutral-400 mb-4">
            Simulate a rogue merchant silently altering commercial terms after the mandate is established.
            The simulator creates a new Offer version (v2) in the merchant lineage without modifying the immutable snapshot.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => handleMutateMerchant("rogue_full")}
              disabled={loadingStep === "mutate"}
              className="rounded-xl border border-red-800/60 bg-red-950/60 hover:bg-red-900/60 p-4 text-left transition cursor-pointer"
            >
              <span className="text-xs font-bold text-red-400 block">🔴 Full Rogue Scenario</span>
              <span className="text-[11px] text-neutral-300 mt-1 block">
                +18% Price Hike (₹4,128) + Discord Only + Removed Mocks
              </span>
            </button>

            <button
              onClick={() => handleMutateMerchant("price_only")}
              disabled={loadingStep === "mutate"}
              className="rounded-xl border border-amber-800/60 bg-amber-950/40 hover:bg-amber-900/50 p-4 text-left transition cursor-pointer"
            >
              <span className="text-xs font-bold text-amber-400 block">🟡 Price Hike Only</span>
              <span className="text-[11px] text-neutral-300 mt-1 block">
                +18% Price Increase (₹3,499 → ₹4,128/mo)
              </span>
            </button>

            <button
              onClick={() => handleMutateMerchant("semantic_only")}
              disabled={loadingStep === "mutate"}
              className="rounded-xl border border-amber-800/60 bg-amber-950/40 hover:bg-amber-900/50 p-4 text-left transition cursor-pointer"
            >
              <span className="text-xs font-bold text-amber-400 block">🟡 Support Downgrade</span>
              <span className="text-[11px] text-neutral-300 mt-1 block">
                Dedicated 1:1 mentor → Community Discord forum
              </span>
            </button>

            <button
              onClick={() => handleMutateMerchant("reset")}
              disabled={loadingStep === "mutate"}
              className="rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 p-4 text-left transition cursor-pointer"
            >
              <span className="text-xs font-bold text-neutral-300 block">🔄 Reset to Baseline</span>
              <span className="text-[11px] text-neutral-400 mt-1 block">
                Restore active offer to v1 baseline terms
              </span>
            </button>
          </div>
        </section>
      )}

      {/* STEP 4 & 5: Integrity Engine & Deterministic Policy Decision */}
      {mandate && (
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 md:p-8 backdrop-blur shadow-lg">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400 border border-purple-500/30">
                4 & 5
              </span>
              <h2 className="text-lg font-semibold text-white">Semantic Integrity & Deterministic Policy</h2>
            </div>
            <button
              onClick={handleRunIntegrity}
              disabled={loadingStep === "integrity"}
              className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50 transition cursor-pointer shadow"
            >
              {loadingStep === "integrity" ? "Evaluating..." : "Run Integrity Check"}
            </button>
          </div>

          {integrityReport && policyResult ? (
            <div className="space-y-6">
              {/* Top Decision Card */}
              <div
                className={`rounded-2xl border p-6 text-center ${
                  policyResult.decision === "PAUSE"
                    ? "border-red-600 bg-red-950/40 text-red-300"
                    : policyResult.decision === "REVIEW"
                    ? "border-amber-600 bg-amber-950/40 text-amber-300"
                    : "border-emerald-600 bg-emerald-950/40 text-emerald-300"
                }`}
              >
                <span className="text-xs font-bold tracking-widest uppercase block text-neutral-400">
                  Deterministic Policy Decision
                </span>
                <span className="text-4xl md:text-5xl font-extrabold tracking-tight block my-2">
                  {policyResult.decision}
                </span>
                <p className="text-xs text-neutral-300 max-w-md mx-auto">
                  Priority Rule: <code className="font-bold">PAUSE &gt; REVIEW &gt; ALLOW</code> (Policy: {policyResult.policyVersion})
                </p>
              </div>

              {/* Integrity Layers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Deterministic Layer (M4) */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Deterministic Integrity Findings (Code, Not LLM)
                  </span>
                  {integrityReport.findings.length === 0 ? (
                    <p className="text-xs text-emerald-400">✓ No deterministic violations found.</p>
                  ) : (
                    <div className="space-y-2">
                      {integrityReport.findings.map((f, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs flex items-start justify-between"
                        >
                          <div>
                            <span className="font-semibold text-white block">{f.field}</span>
                            <span className="text-neutral-400">{f.description}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              f.level === "PAUSE"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {f.level}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Semantic Layer (M5) */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    Semantic Offer Integrity (Constrained LLM Evaluator)
                  </span>
                  {integrityReport.semanticFindings.length === 0 ? (
                    <p className="text-xs text-neutral-400">Semantic evaluation: {integrityReport.semanticStatus}</p>
                  ) : (
                    <div className="space-y-2">
                      {integrityReport.semanticFindings.map((sf, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border text-xs ${
                            sf.direction === "DEGRADED"
                              ? "bg-red-950/20 border-red-900/40"
                              : "bg-neutral-900 border-neutral-800"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                sf.direction === "DEGRADED"
                                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                  : "bg-neutral-800 text-neutral-300"
                              }`}
                            >
                              DIRECTION: {sf.direction}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              CONFIDENCE: {sf.confidence}
                            </span>
                          </div>
                          <p className="text-neutral-300 leading-relaxed">{sf.explanation}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500 text-xs">
              Click &ldquo;Run Integrity Check&rdquo; to evaluate the current offer against the frozen authorized baseline.
            </div>
          )}
        </section>
      )}

      {/* STEP 6: MandateGuard Action Execution */}
      {policyResult && (
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 md:p-8 backdrop-blur shadow-lg">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                6
              </span>
              <h2 className="text-lg font-semibold text-white">MandateGuard Action Boundary</h2>
            </div>
            <span className="text-xs text-neutral-400">Sole Provider Mutation Gateway</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl border border-neutral-800 bg-neutral-950">
            <div>
              <span className="text-xs text-neutral-500">Derived Action from Policy Decision:</span>
              <h3 className="text-base font-bold text-white mt-0.5">
                {policyResult.decision === "PAUSE"
                  ? "PAUSE_SUBSCRIPTION (Razorpay Action)"
                  : policyResult.decision === "REVIEW"
                  ? "REVIEW_REQUIRED (Alert User)"
                  : "NO_ACTION (Allow Billing)"}
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Triggered strictly by deterministic policy rules. The LLM has zero execution privileges.
              </p>
            </div>
            <button
              onClick={handleExecuteAction}
              disabled={loadingStep === "action" || actionResult?.status === "SUCCEEDED"}
              className={`rounded-xl px-5 py-2.5 text-xs font-bold text-white transition cursor-pointer shadow ${
                actionResult?.status === "SUCCEEDED"
                  ? "bg-neutral-800 text-neutral-400 cursor-not-allowed"
                  : policyResult.decision === "PAUSE"
                  ? "bg-red-600 hover:bg-red-500"
                  : "bg-blue-600 hover:bg-blue-500"
              }`}
            >
              {loadingStep === "action"
                ? "Executing..."
                : actionResult?.status === "SUCCEEDED"
                ? "✓ Action Executed"
                : "Execute Policy Action"}
            </button>
          </div>

          {actionResult && (
            <div className="mt-4 p-4 rounded-xl border border-neutral-800 bg-neutral-950 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-300">Action Result:</span>
                <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {actionResult.status}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-neutral-400 font-mono text-[11px]">
                <div>Action Key: {actionResult.actionKey}</div>
                <div>Provider ID: {actionResult.providerSubscriptionId || "N/A"}</div>
                <div>Provider Mutated: {actionResult.providerCalled ? "YES (Test Mode)" : "NO"}</div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* STEP 7: Append-only Audit Trail */}
      {mandate && (
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 md:p-8 backdrop-blur shadow-lg">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-700 text-xs font-bold text-neutral-300">
                7
              </span>
              <h2 className="text-lg font-semibold text-white">Append-only Audit Timeline</h2>
            </div>
            <button
              onClick={() => fetchAuditTrail(mandate.id)}
              className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
            >
              Refresh Timeline ({auditEvents.length})
            </button>
          </div>

          {auditEvents.length === 0 ? (
            <div className="text-center py-6 text-neutral-500 text-xs">
              Audit trail will record entries as integrity, policy, and actions execute.
            </div>
          ) : (
            <div className="space-y-3">
              {auditEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-xs space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-emerald-400 font-mono">{evt.eventType}</span>
                    <span className="text-[11px] text-neutral-500">
                      {new Date(evt.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-neutral-400 text-[11px]">
                    <div>
                      <span className="text-neutral-500">Decision: </span>
                      <span className="font-semibold text-white">{evt.decision || "—"}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Action: </span>
                      <span className="font-semibold text-white">{evt.action || "—"}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Status: </span>
                      <span className="font-semibold text-white">{evt.status || "—"}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Reason: </span>
                      <span className="font-semibold text-white">{evt.reason || "—"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
