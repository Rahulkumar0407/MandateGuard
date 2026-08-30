"use client";

import React, { useState, useEffect } from "react";
import type {
  AIBuyabilityReport,
  MerchantAnalysisState,
} from "@/lib/merchant-intelligence/buyability-types";
import {
  AgentCommerceContractDrawer,
  ExternalAgentSandboxModal,
} from "@/components/AgentCommerceContractDrawer";
import { ExternalAgentPurchaseModal } from "@/components/ExternalAgentPurchaseModal";
import { MerchantOfferOptimizer } from "@/components/MerchantOfferOptimizer";
import { MerchantGrowthOpportunity } from "@/components/MerchantGrowthOpportunity";
import type { AgentCommerceContract } from "@/lib/contract/types";
import type { ViewTab } from "./Navbar";

interface MerchantBuyabilityBenchmarkProps {
  initialState?: MerchantAnalysisState;
  hasCatalog?: boolean;
  onNavigateTab?: (tab: ViewTab) => void;
}

interface QueryScenario {
  id: string;
  label: string;
  query: string;
  buyerWanted: string[];
  yourOfferTerms: string[];
  verified: string[];
  unverified: string[];
  whyExplanation: string;
  winnerTitle: string;
  winnerPrice: string;
  winnerFeatures: string[];
}

const SAMPLE_SCENARIOS: QueryScenario[] = [
  {
    id: "mentor",
    label: "Human mentor under ₹4,000",
    query: "I need a human mentor under ₹4,000 with 24h response SLA",
    buyerWanted: ["Human mentor (1:1)", "Under ₹4,000", "Monthly billing", "24h response SLA"],
    yourOfferTerms: ["₹3,999 / month", "Monthly billing", "Expert guidance"],
    verified: ["Price fits budget", "Monthly billing interval"],
    unverified: ["Dedicated human mentor", "24h response turnaround guarantee"],
    whyExplanation: "The buyer wanted a dedicated human mentor with 24h SLA, but your offer does not clearly say who provides the support or commit to a turnaround time.",
    winnerTitle: "System Design Pro",
    winnerPrice: "₹3,499",
    winnerFeatures: ["Dedicated 1:1 human mentor", "4 live sessions / month", "24-hour response SLA", "30-day conditional refund"],
  },
  {
    id: "value",
    label: "Best value system design",
    query: "Best value system design coaching with live reviews",
    buyerWanted: ["Architecture track", "Live review sessions", "Competitive pricing"],
    yourOfferTerms: ["₹3,999 / month", "Standard video access"],
    verified: ["Architecture topic matches"],
    unverified: ["Live review sessions", "Lowest price / mentor ratio"],
    whyExplanation: "Competitor offers structured weekly live review sessions at ₹3,499/mo, giving AI buyers stronger verified commitments.",
    winnerTitle: "System Design Pro",
    winnerPrice: "₹3,499",
    winnerFeatures: ["Weekly live architecture reviews", "Complete distributed systems track", "Lowest price / mentor ratio"],
  },
  {
    id: "interview",
    label: "Premium interview prep",
    query: "Senior interview preparation with money-back guarantee",
    buyerWanted: ["Staff / Senior prep", "Money-back guarantee", "Monthly billing"],
    yourOfferTerms: ["₹3,999 / month", "Career coaching"],
    verified: ["Senior prep topic", "Monthly billing"],
    unverified: ["Money-back guarantee terms", "Mock interview frequency"],
    whyExplanation: "The buyer requested a clear money-back guarantee, which is missing from your unstructured description.",
    winnerTitle: "Engineering Leadership Prep",
    winnerPrice: "₹2,499",
    winnerFeatures: ["Executive interview coaching", "100% money-back guarantee", "Direct mock feedback"],
  },
];

export function MerchantBuyabilityBenchmark({
  initialState = "READY_TO_ANALYZE",
  hasCatalog = true,
}: MerchantBuyabilityBenchmarkProps) {
  const [analysisState, setAnalysisState] = useState<MerchantAnalysisState>(
    !hasCatalog ? "NOT_CONFIGURED" : initialState,
  );
  const [report, setReport] = useState<AIBuyabilityReport | null>(null);
  const [loadingBenchmark, setLoadingBenchmark] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Investigation State
  const [selectedScenario, setSelectedScenario] = useState<QueryScenario>(SAMPLE_SCENARIOS[0]);
  const [searchQuery, setSearchQuery] = useState(SAMPLE_SCENARIOS[0].query);
  const [showWhy, setShowWhy] = useState(true);
  const [isOfferImproved, setIsOfferImproved] = useState(false);
  const [simulated, setSimulated] = useState(false);

  // Modals and Drawers
  const [contractDrawerOpen, setContractDrawerOpen] = useState(false);
  const [sandboxModalOpen, setSandboxModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [optimizerModalOpen, setOptimizerModalOpen] = useState(false);
  const [opportunityModalOpen, setOpportunityModalOpen] = useState(false);
  const [contract, setContract] = useState<AgentCommerceContract | null>(null);

  // Load contract
  useEffect(() => {
    let ignore = false;
    const fetchContract = async () => {
      try {
        const res = await fetch("/api/v1/contracts/p_sysdesign");
        if (res.ok) {
          const data = await res.json();
          if (!ignore) setContract(data);
        }
      } catch {
        // Handled gracefully
      }
    };
    void fetchContract();
    return () => {
      ignore = true;
    };
  }, []);

  const runBenchmarkAnalysis = async () => {
    setLoadingBenchmark(true);
    setError(null);
    try {
      const res = await fetch("/api/merchant/simulate-buyers", { method: "POST" });
      if (!res.ok) throw new Error("Simulation failed");
      const data = await res.json();
      setReport(data.report || null);
      setAnalysisState("ANALYZED");
    } catch {
      setError("Unable to run buyer simulation.");
    } finally {
      setLoadingBenchmark(false);
    }
  };

  const handleSelectScenario = (sc: QueryScenario) => {
    setSelectedScenario(sc);
    setSearchQuery(sc.query);
    setIsOfferImproved(false);
    setSimulated(false);
  };

  const handleOpenContractDrawer = () => setContractDrawerOpen(true);
  const handleOpenSandbox = () => {
    setContractDrawerOpen(false);
    setSandboxModalOpen(true);
  };
  const handleOpenPurchaseModal = () => setPurchaseModalOpen(true);

  if (analysisState === "NOT_CONFIGURED") {
    return (
      <div className="mg-glass-1 rounded-3xl border border-[var(--mg-border)] p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6 shadow-sm my-8">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-[#0B5CFF] border border-blue-500/20 flex items-center justify-center font-black text-xl mx-auto">
          🏪
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-[var(--mg-text)]">
            Make your business ready for AI buyers
          </h2>
          <p className="text-xs sm:text-sm text-[var(--mg-text-secondary)] leading-relaxed">
            Connect your catalog so we can test how AI buyers evaluate, rank, and purchase your offers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left py-2">
          <div className="p-3.5 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)] space-y-1">
            <span className="text-[10px] font-bold text-[var(--mg-text-muted)] block">STEP 1</span>
            <span className="text-xs font-bold text-[var(--mg-text)] block">Connect Catalog</span>
          </div>
          <div className="p-3.5 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)] space-y-1">
            <span className="text-[10px] font-bold text-[var(--mg-text-muted)] block">STEP 2</span>
            <span className="text-xs font-bold text-[var(--mg-text)] block">Test with AI buyers</span>
          </div>
          <div className="p-3.5 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)] space-y-1">
            <span className="text-[10px] font-bold text-[var(--mg-text-muted)] block">STEP 3</span>
            <span className="text-xs font-bold text-[var(--mg-text)] block">See What to Improve</span>
          </div>
        </div>

        <button
          onClick={() => setAnalysisState("READY_TO_ANALYZE")}
          className="px-6 py-3 bg-[#0B5CFF] hover:bg-[#004DE6] text-white text-xs font-bold rounded-xl shadow-xs transition-all mg-press"
        >
          Analyze my business &rarr;
        </button>
      </div>
    );
  }

  if (analysisState === "READY_TO_ANALYZE") {
    return (
      <div className="mg-glass-1 rounded-3xl border border-[var(--mg-border)] p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6 shadow-sm my-8">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-black text-xl mx-auto">
          ✓
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-[var(--mg-text)]">
            Your catalog is ready.
          </h2>
          <p className="text-xs sm:text-sm text-[var(--mg-text-secondary)] leading-relaxed">
            Run 100 representative buyer missions to see where AI buyers place your business in live comparisons.
          </p>
        </div>

        <button
          onClick={() => {
            setAnalysisState("ANALYZED");
            void runBenchmarkAnalysis();
          }}
          className="px-6 py-3.5 bg-[#0B5CFF] hover:bg-[#004DE6] text-white text-xs font-bold rounded-xl shadow-xs transition-all mg-press"
        >
          Run AI Buyer Test &rarr;
        </button>
      </div>
    );
  }

  if (analysisState === "ANALYZING") {
    return (
      <div className="mg-glass-1 rounded-3xl border border-[var(--mg-border)] p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6 shadow-sm my-8">
        <div className="w-12 h-12 rounded-2xl bg-[#0B5CFF] text-white flex items-center justify-center font-black text-xl mx-auto animate-pulse">
          M
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-[var(--mg-text)]">
            Analyzing your offers
          </h2>
          <p className="text-xs text-[var(--mg-text-muted)]">
            Running 100 buyer searches...
          </p>
        </div>

        <div className="space-y-2 text-left text-xs text-[var(--mg-text-secondary)] max-w-sm mx-auto pt-2">
          <p>• Discoverability &amp; catalog retrieval</p>
          <p>• Understanding &amp; structured entitlements</p>
          <p>• Comparison &amp; mentor / SLA commitments</p>
          <p>• Fit &amp; semantic trade-off resolution</p>
          <p>• Transaction readiness &amp; spending limit checks</p>
        </div>
      </div>
    );
  }

  if (analysisState === "STALE") {
    return (
      <div className="mg-glass-1 rounded-3xl border border-amber-500/30 p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6 shadow-sm my-8">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center font-black text-xl mx-auto">
          ⚠️
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-[var(--mg-text)]">
            Your last test is out of date.
          </h2>
          <p className="text-xs sm:text-sm text-[var(--mg-text-secondary)] leading-relaxed">
            Your offers changed since the last test.
          </p>
        </div>

        <button
          onClick={() => {
            setAnalysisState("ANALYZED");
            void runBenchmarkAnalysis();
          }}
          className="px-6 py-3 bg-[#0B5CFF] hover:bg-[#004DE6] text-white text-xs font-bold rounded-xl shadow-xs transition-all mg-press"
        >
          Run again →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16 font-sans text-[var(--mg-text)] antialiased">
      {/* =========================================================================
          AI GROWTH HERO WORKSPACE: Immersive Search, Physical Ranking & Why Reveal
          ========================================================================= */}
      <section className="mg-glass-2 border border-[var(--mg-border)] rounded-3xl p-6 sm:p-10 shadow-xl relative mg-spotlight overflow-hidden transition-all duration-300">
        {/* Ambient Lighting Accents */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl opacity-70 pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full filter blur-3xl opacity-60 pointer-events-none" />

        <div className="space-y-8 relative z-10 max-w-4xl">
          {/* Header & Context */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-[#0B5CFF]/15 text-[#0B5CFF] border border-[#0B5CFF]/30 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#0B5CFF] animate-pulse" />
              <span>LIVE AI BUYER SEARCH &bull; AUTONOMOUS COMPARISON</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-[var(--mg-text)] tracking-tight leading-tight">
              How does AI see your business?
            </h1>

            <p className="text-sm sm:text-base text-[var(--mg-text-secondary)] leading-relaxed max-w-2xl font-normal">
              We test real buyer requests against your offers and show you where you can improve to get chosen.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={handleOpenPurchaseModal}
                className="px-6 py-3 bg-[#0B5CFF] hover:bg-[#004DE6] text-white text-xs font-black rounded-2xl shadow-xs transition-all mg-gate-btn mg-press flex items-center space-x-2"
              >
                <span>Test an AI buyer</span>
                <span>&rarr;</span>
              </button>
              <button
                onClick={() => setOptimizerModalOpen(true)}
                className="px-5 py-3 bg-[var(--mg-surface-subtle)] hover:bg-[var(--mg-border)] text-[var(--mg-text)] text-xs font-bold rounded-2xl border border-[var(--mg-border)] transition-all mg-press"
              >
                Improve an offer
              </button>
              <button
                onClick={handleOpenContractDrawer}
                className="px-4 py-3 text-xs font-bold text-[var(--mg-text-secondary)] hover:text-[var(--mg-text)] rounded-2xl hover:bg-[var(--mg-border-subtle)] transition-colors mg-press"
              >
                See details
              </button>
            </div>
          </div>

          {/* Large Search Input */}
          <div className="space-y-3 pt-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--mg-surface-subtle)] border-2 border-[var(--mg-border)] focus:border-[#0B5CFF] rounded-2xl px-5 py-4 text-sm sm:text-base font-bold text-[var(--mg-text)] focus:outline-none shadow-xs transition-colors"
                placeholder="Type a buyer search query..."
              />
              <span className="absolute right-5 top-4 text-lg">🔍</span>
            </div>

            {/* Scenario Selector Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[var(--mg-text-muted)] font-bold mr-1 uppercase tracking-wider text-[11px]">
                Try a buyer scenario:
              </span>
              {SAMPLE_SCENARIOS.map((sc) => {
                const isActive = selectedScenario.id === sc.id;
                return (
                  <button
                    key={sc.id}
                    onClick={() => handleSelectScenario(sc)}
                    className={`px-4 py-2 text-xs font-bold rounded-full transition-all mg-press ${
                      isActive
                        ? "bg-[#0B5CFF] text-white shadow-xs scale-102"
                        : "bg-[var(--mg-surface-subtle)] text-[var(--mg-text-secondary)] hover:text-[var(--mg-text)] border border-[var(--mg-border)]"
                    }`}
                  >
                    {sc.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Ranked Results Experience (Physical Motion & Elevation) */}
          <div className="space-y-3.5 pt-2">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--mg-text-muted)] flex items-center justify-between">
              <span>AI Search Ranking & Shortlist</span>
              <span>{isOfferImproved ? "Status: Optimal Match (#1)" : "Status: Sub-optimal Match (#3)"}</span>
            </div>

            {isOfferImproved ? (
              <div className="space-y-3 transition-all duration-500 ease-out transform">
                {/* Rank 1: YOUR OFFER (Physically Elevated to #1) */}
                <div className="p-5 sm:p-6 bg-emerald-500/15 rounded-2xl border-2 border-emerald-500/60 flex items-center justify-between shadow-lg transition-all">
                  <div className="flex items-center space-x-4">
                    <span className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-base shadow-xs animate-bounce">
                      #1
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm sm:text-base font-black text-[var(--mg-text)]">
                          YOUR OFFER (System Design Pro)
                        </h3>
                        <span className="bg-emerald-500/20 text-emerald-500 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                          Winner
                        </span>
                      </div>
                      <p className="text-xs text-emerald-500 font-bold mt-0.5">
                        ✓ Dedicated 1:1 Human Mentor &bull; 24h Response SLA Verified
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-base sm:text-lg font-black text-[var(--mg-text)]">₹3,499</span>
                    <span className="text-xs text-emerald-500 block font-bold">/ month</span>
                  </div>
                </div>

                {/* Rank 2 */}
                <div className="p-4 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)] flex items-center justify-between shadow-2xs opacity-80">
                  <div className="flex items-center space-x-3.5">
                    <span className="w-8 h-8 rounded-xl bg-[var(--mg-border)] text-[var(--mg-text-muted)] flex items-center justify-center font-black text-xs">
                      #2
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-[var(--mg-text)]">Interview Accelerator</h4>
                      <p className="text-[11px] text-[var(--mg-text-muted)] font-medium">Group Mock Sessions</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[var(--mg-text-secondary)]">₹3,799 / mo</span>
                </div>

                {/* Rank 3 */}
                <div className="p-4 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)] flex items-center justify-between shadow-2xs opacity-70">
                  <div className="flex items-center space-x-3.5">
                    <span className="w-8 h-8 rounded-xl bg-[var(--mg-border)] text-[var(--mg-text-muted)] flex items-center justify-center font-black text-xs">
                      #3
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-[var(--mg-text)]">Legacy Architecture Prep</h4>
                      <p className="text-[11px] text-[var(--mg-text-muted)] font-medium">Self-paced video modules</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[var(--mg-text-secondary)]">₹3,999 / mo</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 transition-all duration-500 ease-out">
                {/* Rank 1: Competitor Winner */}
                <div className="p-4 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)] flex items-center justify-between shadow-2xs">
                  <div className="flex items-center space-x-3.5">
                    <span className="w-8 h-8 rounded-xl bg-[var(--mg-text)] text-[var(--mg-bg)] flex items-center justify-center font-black text-xs">
                      #1
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-[var(--mg-text)]">{selectedScenario.winnerTitle}</h4>
                      <p className="text-[11px] text-[var(--mg-text-muted)] font-medium">
                        {selectedScenario.winnerFeatures.slice(0, 2).join(" • ")}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-[var(--mg-text)]">{selectedScenario.winnerPrice} / mo</span>
                </div>

                {/* Rank 2 */}
                <div className="p-4 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)] flex items-center justify-between shadow-2xs">
                  <div className="flex items-center space-x-3.5">
                    <span className="w-8 h-8 rounded-xl bg-[var(--mg-border)] text-[var(--mg-text-muted)] flex items-center justify-center font-black text-xs">
                      #2
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-[var(--mg-text)]">Interview Accelerator</h4>
                      <p className="text-[11px] text-[var(--mg-text-muted)] font-medium">Group Mock Sessions</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[var(--mg-text-secondary)]">₹3,799 / mo</span>
                </div>

                {/* Rank 3: YOUR OFFER (Unstructured/Ambiguous) */}
                <div className="p-5 sm:p-6 bg-amber-500/10 rounded-2xl border-2 border-amber-500/40 flex items-center justify-between shadow-md">
                  <div className="flex items-center space-x-4">
                    <span className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-base shadow-2xs">
                      #3
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm sm:text-base font-black text-[var(--mg-text)]">YOUR OFFER</h3>
                        <span className="bg-amber-500/20 text-amber-500 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-500/30">
                          Rank #3
                        </span>
                      </div>
                      <p className="text-xs text-amber-500 font-semibold mt-0.5">
                        Unclear support specification &bull; Missing response guarantee SLA
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-base sm:text-lg font-black text-[var(--mg-text)]">₹3,999</span>
                    <span className="text-xs text-amber-500 block font-bold">/ month</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* =========================================================================
              MERCHANT RESULT BANNER (Giant #3 You're #3 Diagnosis & Before/After)
              ========================================================================= */}
          <div className={`p-6 sm:p-8 rounded-3xl border space-y-5 transition-all ${
            isOfferImproved
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-amber-500/10 border-amber-500/30"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl sm:text-4xl font-black text-[var(--mg-text)]">
                    {isOfferImproved ? "You're #1." : "You're #3."}
                  </span>
                  {isOfferImproved && (
                    <span className="bg-emerald-500 text-white text-xs font-black px-2.5 py-1 rounded-full">
                      ✓ Resolved
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-[var(--mg-text-secondary)] mt-1 leading-relaxed max-w-md font-medium">
                  {isOfferImproved
                    ? "Your structured commitments make you the #1 choice for this buyer query."
                    : "Your price fits. AI could not clearly verify your support."}
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => setShowWhy(!showWhy)}
                  className="px-4 py-3 bg-[var(--mg-surface-subtle)] text-[var(--mg-text)] hover:bg-[var(--mg-border)] border border-[var(--mg-border)] text-xs font-bold rounded-xl shadow-xs transition-all mg-press"
                >
                  {showWhy ? "Hide investigation" : "See why"}
                </button>
                <button
                  onClick={() => {
                    setIsOfferImproved(!isOfferImproved);
                    setSimulated(!isOfferImproved);
                  }}
                  className={`px-5 py-3 text-white text-xs font-black rounded-xl shadow-sm transition-all mg-press ${
                    isOfferImproved
                      ? "bg-[#0A1128] hover:bg-[#16203D]"
                      : "bg-[#0B5CFF] hover:bg-[#004DE6]"
                  }`}
                >
                  {isOfferImproved ? "Reset comparison" : "Improve this offer →"}
                </button>
              </div>
            </div>

            {/* Before / After Simulation Counter in Improved State */}
            {isOfferImproved && (
              <div className="p-4 bg-[var(--mg-surface-elevated)] rounded-2xl border border-emerald-500/30 space-y-2 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="text-center">
                      <span className="text-xl font-black text-[var(--mg-text-muted)]">42</span>
                      <span className="text-[10px] text-[var(--mg-text-muted)] block font-bold">requests matched</span>
                    </div>
                    <span className="text-lg font-black text-emerald-500">&rarr;</span>
                    <div className="text-center">
                      <span className="text-2xl font-black text-emerald-500">57</span>
                      <span className="text-[10px] text-emerald-500 block font-bold">requests matched</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-emerald-500/20 text-emerald-500 text-xs font-black px-3 py-1 rounded-full border border-emerald-500/40">
                      +15 matched in simulation
                    </span>
                    <p className="text-[10px] text-[var(--mg-text-muted)] mt-1 font-medium">
                      Same buyer benchmark. Simulation only.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                "WHY BUYERS LEAVE" VISUAL INVESTIGATION REVEAL
                ========================================================================= */}
            {showWhy && !isOfferImproved && (
              <div className="pt-6 border-t border-amber-500/20 space-y-5 animate-in fade-in duration-300">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-500 block">
                  WHY BUYERS CHOOSE COMPETITORS OVER YOUR OFFER
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Buyer Wanted */}
                  <div className="p-4 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)] space-y-2 shadow-2xs">
                    <span className="text-[10px] font-extrabold text-[var(--mg-text-muted)] uppercase tracking-wider block">
                      BUYER WANTED
                    </span>
                    <div className="space-y-1.5 text-xs font-bold text-[var(--mg-text)]">
                      {selectedScenario.buyerWanted.map((item, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <span className="text-[#0B5CFF] font-black">&bull;</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Your Offer */}
                  <div className="p-4 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)] space-y-2 shadow-2xs">
                    <span className="text-[10px] font-extrabold text-[var(--mg-text-muted)] uppercase tracking-wider block">
                      YOUR OFFER
                    </span>
                    <div className="space-y-1.5 text-xs font-medium text-[var(--mg-text-secondary)]">
                      {selectedScenario.yourOfferTerms.map((item, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <span className="text-amber-500 font-black">&bull;</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Verification Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 space-y-2">
                    <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider block">
                      ✓ AI COULD VERIFY
                    </span>
                    {selectedScenario.verified.map((v, i) => (
                      <div key={i} className="flex items-center space-x-2 text-xs text-emerald-500 font-bold">
                        <span className="text-emerald-500 font-black">✓</span>
                        <span>{v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/30 space-y-2">
                    <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider block">
                      ✗ AI COULD NOT VERIFY
                    </span>
                    {selectedScenario.unverified.map((u, i) => (
                      <div key={i} className="flex items-center space-x-2 text-xs text-red-500 font-bold">
                        <span className="text-red-500 font-black">?</span>
                        <span>{u}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plain-English Explanation */}
                <div className="p-4 bg-[var(--mg-surface-subtle)] rounded-2xl border border-amber-500/30 text-xs text-amber-500 font-medium leading-relaxed shadow-2xs">
                  <strong>Investigation Finding:</strong> AI could not clearly verify who provides your support. {selectedScenario.whyExplanation}
                </div>

                {/* Winner Summary */}
                <div className="p-4 bg-[var(--mg-surface-elevated)] rounded-2xl border border-[var(--mg-border)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--mg-text)]">
                    <span>WHY #1 WON: {selectedScenario.winnerTitle} ({selectedScenario.winnerPrice}/mo)</span>
                    <span className="text-emerald-500 font-black">✓ Verified Terms</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedScenario.winnerFeatures.map((f, i) => (
                      <span key={i} className="px-3 py-1 bg-[var(--mg-surface-subtle)] rounded-lg border border-[var(--mg-border)] text-[11px] text-[var(--mg-text-secondary)] font-semibold">
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          ONE PRIMARY FIX & SIMULATION (Closed-Loop Growth)
          ========================================================================= */}
      <section className="mg-glass-1 border border-[var(--mg-border)] rounded-3xl p-6 sm:p-10 shadow-lg space-y-8">
        <div className="space-y-2 max-w-2xl">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-500">
            RECOMMENDED IMPROVEMENT
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--mg-text)] tracking-tight">
            You can make this easier to choose.
          </h2>
          <p className="text-xs sm:text-sm text-[var(--mg-text-secondary)]">
            Preview what happens when you commit to structured support and response terms.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-4xl">
          {/* Action Box */}
          <div className="p-6 bg-[var(--mg-surface-subtle)] rounded-3xl border border-[var(--mg-border)] space-y-5">
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--mg-text-muted)] block">
                PROPOSED COMMITMENTS
              </span>
              <div className="space-y-1.5 text-xs font-bold text-[var(--mg-text)]">
                <div className="flex items-center space-x-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Dedicated 1:1 human mentor</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>4 live sessions / month</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>24-hour response turnaround guarantee</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => {
                  setIsOfferImproved(true);
                  setSimulated(true);
                }}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-[0_0_16px_rgba(16,185,129,0.3)] transition-all mg-press"
              >
                Test this change →
              </button>
              <button
                onClick={() => setOptimizerModalOpen(true)}
                className="px-4 py-2.5 bg-[var(--mg-surface-elevated)] hover:bg-[var(--mg-border)] text-[var(--mg-text)] text-xs font-bold rounded-xl border border-[var(--mg-border)] shadow-xs transition-all mg-press"
              >
                Open full optimizer
              </button>
            </div>
          </div>

          {/* Numerical Before/After Transformation */}
          <div className="p-6 bg-[var(--mg-surface-subtle)] rounded-3xl border border-[var(--mg-border)] text-center space-y-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3 items-center">
              <div className="p-4 bg-[var(--mg-surface-elevated)] rounded-2xl border border-[var(--mg-border)]">
                <span className="text-[10px] font-extrabold uppercase text-[var(--mg-text-muted)]">CURRENT</span>
                <p className="text-2xl font-black text-[var(--mg-text-secondary)] mt-1">42</p>
                <span className="text-[10px] text-[var(--mg-text-muted)]">buyer requests</span>
              </div>
              <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/30">
                <span className="text-[10px] font-extrabold uppercase text-emerald-500">PROPOSED</span>
                <p className="text-2xl font-black text-emerald-500 mt-1">{simulated ? "57" : "57"}</p>
                <span className="text-[10px] text-emerald-500 font-bold">buyer requests</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl">
              <span className="text-xs font-black text-emerald-500">
                +15 matched in simulation
              </span>
            </div>

            <p className="text-[10px] text-[var(--mg-text-muted)]">
              Same buyer benchmark • Simulation only
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          AI BUYABILITY BENCHMARK (Secondary Funnel Surface)
          ========================================================================= */}
      <section className="mg-glass-1 border border-[var(--mg-border)] rounded-3xl p-6 sm:p-10 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#0B5CFF]">
              BUYER JOURNEY
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--mg-text)] tracking-tight mt-1">
              How many buyer requests can reach you?
            </h2>
          </div>
          <button
            onClick={runBenchmarkAnalysis}
            disabled={loadingBenchmark}
            className="px-4 py-2 bg-[var(--mg-surface-subtle)] hover:bg-[var(--mg-border)] border border-[var(--mg-border)] text-[var(--mg-text)] text-xs font-bold rounded-xl transition-all self-start sm:self-auto mg-press"
          >
            {loadingBenchmark ? "Running 100 missions..." : "Re-run 100 missions"}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/30 rounded-2xl text-xs font-bold">
            ⚠️ {error}
          </div>
        )}

        {/* 5-Stage Visual Funnel */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="p-4 bg-[var(--mg-surface-subtle)] rounded-2xl text-center space-y-1 border border-[var(--mg-border)]">
            <span className="text-[10px] font-bold uppercase text-[var(--mg-text-muted)]">1. FOUND</span>
            <p className="text-xl font-black text-[var(--mg-text)]">{report?.funnel?.discovered?.count ?? 100}</p>
            <span className="text-[10px] text-[var(--mg-text-muted)]">Buyer requests</span>
          </div>

          <div className="p-4 bg-[var(--mg-surface-subtle)] rounded-2xl text-center space-y-1 border border-[var(--mg-border)]">
            <span className="text-[10px] font-bold uppercase text-[var(--mg-text-muted)]">2. UNDERSTOOD</span>
            <p className="text-xl font-black text-[var(--mg-text)]">
              {report?.funnel?.understood?.count ?? 84}
            </p>
            <span className="text-[10px] text-[var(--mg-text-muted)]">Terms parsed</span>
          </div>

          <div className="p-4 bg-[var(--mg-surface-subtle)] rounded-2xl text-center space-y-1 border border-[var(--mg-border)]">
            <span className="text-[10px] font-bold uppercase text-[var(--mg-text-muted)]">3. COMPARED</span>
            <p className="text-xl font-black text-[var(--mg-text)]">
              {report?.funnel?.comparable?.count ?? 68}
            </p>
            <span className="text-[10px] text-[var(--mg-text-muted)]">Ranked in top 3</span>
          </div>

          <div className="p-4 bg-emerald-500/10 rounded-2xl text-center space-y-1 border border-emerald-500/30">
            <span className="text-[10px] font-bold uppercase text-emerald-500">4. CHOSEN</span>
            <p className="text-xl font-black text-emerald-500">
              {report?.funnel?.recommended?.count ?? 57}
            </p>
            <span className="text-[10px] text-emerald-500 font-bold">#1 Selected</span>
          </div>

          <div className="p-4 bg-emerald-500/10 rounded-2xl text-center space-y-1 border border-emerald-500/30">
            <span className="text-[10px] font-bold uppercase text-emerald-500">5. READY TO BUY</span>
            <p className="text-xl font-black text-emerald-500">
              {report?.funnel?.transactionReady?.count ?? 57}
            </p>
            <span className="text-[10px] text-emerald-500 font-bold">Gated for payment</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          GROWTH OPPORTUNITY (E7 Engine) & MACHINE-READABLE CONTRACT (E4)
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Next Growth Opportunity */}
        <section className="mg-glass-1 border border-[var(--mg-border)] rounded-3xl p-6 sm:p-8 shadow-lg space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#0B5CFF]">
              GROWTH OPPORTUNITY
            </span>
            <h3 className="text-lg font-extrabold text-[var(--mg-text)]">
              Your next growth opportunity
            </h3>
            <p className="text-xs text-[var(--mg-text-secondary)] leading-relaxed">
              19+ buyer requests wanted human mentoring with weekly reviews. Your catalog does not currently have a clear match.
            </p>
          </div>

          <button
            onClick={() => setOpportunityModalOpen(true)}
            className="w-full py-3 bg-[#0B5CFF] hover:bg-[#004DE6] text-white text-xs font-bold rounded-xl shadow-[0_0_16px_rgba(11,92,255,0.3)] transition-all mg-press"
          >
            Explore opportunity &rarr;
          </button>
        </section>

        {/* Machine-Readable Offer */}
        <section className="mg-glass-1 border border-[var(--mg-border)] rounded-3xl p-6 sm:p-8 shadow-lg space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-500">
              WHAT AI READS
            </span>
            <h3 className="text-lg font-extrabold text-[var(--mg-text)]">
              Make your offer easy for AI to understand.
            </h3>
            <div className="flex flex-wrap gap-2 pt-1 text-xs text-[var(--mg-text-secondary)] font-medium">
              <span>✓ Price</span>
              <span>•</span>
              <span>✓ Billing</span>
              <span>•</span>
              <span>✓ Support</span>
              <span>•</span>
              <span>✓ Refund</span>
              <span>•</span>
              <span>✓ Offer version</span>
            </div>
          </div>

          <button
            onClick={handleOpenContractDrawer}
            className="w-full py-3 bg-[var(--mg-surface-subtle)] hover:bg-[var(--mg-border)] text-[var(--mg-text)] text-xs font-bold rounded-xl border border-[var(--mg-border)] shadow-xs transition-all mg-press"
          >
            View details &rarr;
          </button>
        </section>
      </div>

      {/* =========================================================================
          DRAWERS & MODALS
          ========================================================================= */}
      {/* 1. Agent Commerce Contract Drawer */}
      <AgentCommerceContractDrawer
        isOpen={contractDrawerOpen}
        onClose={() => setContractDrawerOpen(false)}
        contract={contract}
        onRunExternalTest={handleOpenSandbox}
      />

      {/* 2. External Agent Sandbox Modal */}
      <ExternalAgentSandboxModal
        isOpen={sandboxModalOpen}
        onClose={() => setSandboxModalOpen(false)}
        contract={contract}
      />

      {/* 3. External Agent Purchase Modal */}
      <ExternalAgentPurchaseModal
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        contract={contract}
      />

      {/* 4. Full E5 Offer Optimizer Modal */}
      {optimizerModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--mg-bg-panel)] border border-[var(--mg-border)] rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6 text-[var(--mg-text)] animate-scale-in">
            <div className="flex items-center justify-between border-b border-[var(--mg-border)] pb-4">
              <h3 className="text-lg font-extrabold text-[var(--mg-text)]">Improve your offer</h3>
              <button
                onClick={() => setOptimizerModalOpen(false)}
                className="text-[var(--mg-text-muted)] hover:text-[var(--mg-text)] text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <MerchantOfferOptimizer onVersionPublished={() => setOptimizerModalOpen(false)} />
          </div>
        </div>
      )}

      {/* 5. Full E7 Growth Opportunity Modal */}
      {opportunityModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--mg-bg-panel)] border border-[var(--mg-border)] rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6 text-[var(--mg-text)] animate-scale-in">
            <div className="flex items-center justify-between border-b border-[var(--mg-border)] pb-4">
              <h3 className="text-lg font-extrabold text-[var(--mg-text)]">New offer opportunity</h3>
              <button
                onClick={() => setOpportunityModalOpen(false)}
                className="text-[var(--mg-text-muted)] hover:text-[var(--mg-text)] text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <MerchantGrowthOpportunity onOfferCreated={() => setOpportunityModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
