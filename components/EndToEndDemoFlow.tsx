"use client";

import React, { useState } from "react";
import type { AgentCompatibilityStatus } from "@/lib/compatibility/types";
import type { MerchantImpactPreview } from "@/lib/merchant/preview-types";
import type { ReauthorizationRequest } from "@/lib/reauthorization/types";

export function EndToEndDemoFlow() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Flow State
  const [mandateId, setMandateId] = useState<string | null>("mandate_demo_01");
  const [envelopeId, setEnvelopeId] = useState<string | null>("env_sub_demo_active_01");
  const [impactPreview, setImpactPreview] = useState<MerchantImpactPreview | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentCompatibilityStatus | null>(null);
  const [reauthRequest, setReauthRequest] = useState<ReauthorizationRequest | null>(null);
  const [stepCompleteMessage, setStepCompleteMessage] = useState<string | null>(null);

  // 1. Step 1: Authorize baseline
  const handleStep1 = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Seed & ensure baseline envelope
      const res = await fetch("/api/demo/seed", { method: "POST" });
      if (!res.ok) throw new Error("Failed to initialize baseline.");
      setMandateId("mandate_demo_01");
      setEnvelopeId("env_sub_demo_active_01");
      setStepCompleteMessage("✓ Buyer explicitly authorized 'System Design Mastery v1' @ ₹3,499/mo. Baseline commitments immutable.");
      setCurrentStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Step 1 error.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Step 2: Merchant Pre-Publish Simulation
  const handleStep2 = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/merchant/offers/preview-impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: "p_sysdesign",
          name: "System Design Mastery (v2 Candidate)",
          description: "AI-assisted curriculum with peer community review.",
          price: 419900,
          duration: 180,
          entitlementKeys: ["sysdesign_core", "sysdesign_mocks"],
          refundWindowDays: 14,
          supportTerms: "Discord bot only",
          semanticTerms: "Community peer support",
          structuredCommitments: {
            support: {
              tier: "community",
              slaHours: 72,
              oneOnOneSessionsPerMonth: 0,
              hasDedicatedHuman: false,
            },
            entitlements: {
              keys: ["sysdesign_core", "sysdesign_mocks"],
              criticalKeys: ["mentor_weekly"],
            },
            usageLimits: {
              apiRequestsPerMonth: 10000,
              concurrentSeats: 1,
              computeCredits: 500,
            },
            delivery: {
              type: "continuous_saas",
              commitmentSLA: "Community support",
            },
            refundPolicy: {
              windowDays: 14,
              type: "conditional",
            },
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to generate impact preview.");
      const data = await res.json();
      setImpactPreview(data);
      setStepCompleteMessage(
        `✓ Pre-publish impact analyzed: 100% of subscribers will BREAK (₹${(data.financialImpact.atRiskMRRPaise / 100).toLocaleString("en-IN")} MRR at risk).`,
      );
      setCurrentStep(3);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Step 2 error.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Step 3: Merchant Publishes v2 (mutates catalog version)
  const handleStep3 = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/demo/mutate-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: "o_sysdesign_v1",
          price: 419900, // Price breach +20%
          supportTerms: "Community Discord only",
          semanticTerms: "Automated test runner and peer forum review",
          removedEntitlements: ["mentor_weekly"],
        }),
      });

      if (!res.ok) throw new Error("Failed to publish version mutation.");
      setStepCompleteMessage("✓ Merchant published v2 with ₹4,199 price and removed 1:1 human mentor.");
      setCurrentStep(4);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Step 3 error.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Step 4: Agent Compatibility Query
  const handleStep4 = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "/v1/subscriptions/sub_demo_active_01/compatibility-status",
      );
      if (!res.ok) throw new Error("Failed to query compatibility status.");
      const data = await res.json();
      setAgentStatus(data);
      setStepCompleteMessage(
        `✓ Agent Evaluation: Status is ${data.compatibility}. Autonomous execution BLOCKED. Required Action: ${data.requiredAction}.`,
      );
      setCurrentStep(5);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Step 4 error.");
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Step 5: Approve Reauthorization
  const handleStep5 = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // First initiate if not initiated
      const initRes = await fetch("/api/reauthorization/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          envelopeId: envelopeId || "env_sub_demo_active_01",
          targetOfferVersionId: "o_sysdesign_v2",
          reason: "Major revision approval requested.",
        }),
      });

      if (!initRes.ok) throw new Error("Failed to initiate reauthorization.");
      const reqData = await initRes.json();

      // Now approve
      const approveRes = await fetch(`/api/reauthorization/${reqData.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisionNote: "Buyer approved updated baseline via guided demo.",
          updatedFinancialConstraints: { maxPricePaise: 500000 },
        }),
      });

      if (!approveRes.ok) throw new Error("Failed to approve reauthorization.");
      const approved = await approveRes.json();
      setReauthRequest(approved.request);
      setStepCompleteMessage(
        `✓ Reauthorization Completed! New baseline pinned with envelope ID: ${approved.newEnvelope.id}. Historical v1 baseline preserved.`,
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Step 5 error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0066ff] bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
            Interactive Guided Journey
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Step {currentStep} of 5
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
          End-to-End Semantic Commercial Integrity Demonstration
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-3xl">
          Follow the five-step interactive walkthrough demonstrating baseline
          pinning, pre-publish impact simulation, real-time agent protection,
          and reauthorization resolution.
        </p>
      </div>

      {/* Step Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {[
          { step: 1, title: "1. Baseline Authorization", desc: "Pin initial v1 envelope" },
          { step: 2, title: "2. Impact Simulation", desc: "Pre-publish cohort analysis" },
          { step: 3, title: "3. Merchant Mutation", desc: "Publish breaking change" },
          { step: 4, title: "4. Real-time Agent Query", desc: "Agent blocks breach" },
          { step: 5, title: "5. Reauthorization Hub", desc: "Resolve & pin new baseline" },
        ].map((s) => (
          <div
            key={s.step}
            onClick={() => setCurrentStep(s.step)}
            className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
              currentStep === s.step
                ? "border-[#0066ff] bg-blue-50/60 dark:bg-blue-950/40 shadow-sm ring-1 ring-[#0066ff]"
                : currentStep > s.step
                ? "border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/20 text-slate-700 dark:text-slate-300"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className={currentStep === s.step ? "text-[#0066ff]" : currentStep > s.step ? "text-emerald-600" : ""}>
                {s.title}
              </span>
              {currentStep > s.step && <span className="text-emerald-600 text-xs">✓</span>}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {s.desc}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-sm">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}

      {stepCompleteMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm font-medium animate-fade-in">
          {stepCompleteMessage}
        </div>
      )}

      {/* Step Content Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Step 1: Baseline Commercial Authorization Pinning
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              The buyer authorizes the &ldquo;System Design Mastery v1&rdquo; offer
              at ₹3,499/month. MandateGuard generates an immutable{" "}
              <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                AuthorizationEnvelope
              </code>{" "}
              containing frozen structured commitments (dedicated mentor, 24h SLA, 4
              sessions/month).
            </p>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs space-y-1.5 border border-slate-200 dark:border-slate-700">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Baseline Parameters Pinned:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600 dark:text-slate-300 mt-2">
                <div>Price: <span className="font-medium text-slate-900 dark:text-white">₹3,499 / mo</span></div>
                <div>Support: <span className="font-medium text-slate-900 dark:text-white">Dedicated Mentor</span></div>
                <div>SLA: <span className="font-medium text-slate-900 dark:text-white">24 Hours</span></div>
                <div>1:1 Sessions: <span className="font-medium text-slate-900 dark:text-white">4 / month</span></div>
              </div>
              {envelopeId && (
                <div className="pt-2 text-[11px] text-slate-400 font-mono">
                  Mandate: {mandateId} | Envelope: {envelopeId}
                </div>
              )}
            </div>

            <button
              onClick={handleStep1}
              disabled={isLoading}
              className="py-2.5 px-5 bg-[#0066ff] hover:bg-[#0052cc] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? "Pinning Baseline..." : "1. Confirm & Pin Baseline (Proceed to Step 2 →)"}
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Step 2: Merchant Pre-Publish Impact Simulation
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              Before committing changes, the merchant tests a candidate v2 offer
              (₹4,199/mo, AI Discord bot replacing dedicated mentor). The Impact
              Simulation Engine runs a safe, analysis-only evaluation against all
              active subscriber envelopes.
            </p>

            {impactPreview && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs space-y-1 text-amber-900 dark:text-amber-200">
                <div className="font-semibold">Simulated Impact Summary:</div>
                <div>Breaking: {impactPreview.summary.breakingCount} ({impactPreview.summary.breakingPercentage}%) | At-Risk MRR: ₹{(impactPreview.financialImpact.atRiskMRRPaise / 100).toLocaleString("en-IN")}</div>
              </div>
            )}

            <button
              onClick={handleStep2}
              disabled={isLoading}
              className="py-2.5 px-5 bg-[#0066ff] hover:bg-[#0052cc] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? "Running Simulation..." : "2. Run Pre-Publish Analysis (Proceed to Step 3 →)"}
            </button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Step 3: Merchant Publishes Version 2 to Catalog
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              The merchant publishes the modified offer to the catalog. In a traditional system, this would cause silent degradation or overcharging. In MandateGuard, the existing subscriber baseline remains protected.
            </p>

            <button
              onClick={handleStep3}
              disabled={isLoading}
              className="py-2.5 px-5 bg-[#0066ff] hover:bg-[#0052cc] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? "Publishing Version..." : "3. Publish Candidate Offer (Proceed to Step 4 →)"}
            </button>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Step 4: Real-Time Autonomous Agent Compatibility Query
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              Before issuing recurring billing or subscription mutation, the autonomous buyer agent calls{" "}
              <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                GET /v1/subscriptions/:id/compatibility-status
              </code>
              . The Compatibility Engine immediately flags the breaking breach and blocks autonomous execution.
            </p>

            {agentStatus && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg text-xs space-y-1 text-rose-900 dark:text-rose-200">
                <div className="font-semibold">Live Compatibility Result: {agentStatus.compatibility}</div>
                <div>Autonomous Action: {agentStatus.authorization.canProceedAutonomously ? "ALLOWED" : "BLOCKED"} | Action: {agentStatus.requiredAction}</div>
                <div className="text-[11px] text-rose-700 dark:text-rose-300 pt-1">Reasons: {agentStatus.reasons.map((r) => r.message).join("; ")}</div>
              </div>
            )}

            <button
              onClick={handleStep4}
              disabled={isLoading}
              className="py-2.5 px-5 bg-[#0066ff] hover:bg-[#0052cc] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? "Querying Agent Shield..." : "4. Query Compatibility Status (Proceed to Step 5 →)"}
            </button>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Step 5: Reauthorization State Machine Resolution
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              The buyer reviews the structured differences and explicitly accepts the new v2 baseline. MandateGuard generates a new immutable AuthorizationEnvelope pinned to v2, retiring v1 without mutating history.
            </p>

            {reauthRequest && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs space-y-1 text-emerald-900 dark:text-emerald-200">
                <div className="font-semibold">Reauthorization State: {reauthRequest.state}</div>
                <div>New Envelope Created: <span className="font-mono">{reauthRequest.newEnvelopeId}</span></div>
              </div>
            )}

            <button
              onClick={handleStep5}
              disabled={isLoading}
              className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? "Completing Reauthorization..." : "5. Approve Reauthorization & Pin New Baseline"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
