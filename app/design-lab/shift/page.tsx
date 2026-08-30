"use client";

import React, { useState, useEffect } from "react";

// --- Types & Dummy Data ---
const QUERY_TEXT = "Find me a good system design mentor under ₹4,000/month.";

export default function ShiftDesignLabPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState<"all" | "a" | "b" | "c">("all");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div
      className="min-h-screen transition-colors duration-500"
      style={{
        backgroundColor: "var(--mg-bg)",
        color: "var(--mg-text)",
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Top Navigation Bar for Design Lab */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-[var(--mg-border)] px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 bg-[var(--mg-bg)]/80">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--mg-brand)] animate-pulse" />
          <span className="text-xs tracking-wider uppercase font-semibold text-[var(--mg-text-muted)]">
            Design Lab / Section 1 Prototypes
          </span>
          <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded bg-[var(--mg-brand-soft)] text-[var(--mg-brand)] font-mono">
            M10-DESIGN-PROTOTYPE
          </span>
        </div>

        {/* Concept Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--mg-surface-subtle)] border border-[var(--mg-border)]">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "all"
                ? "bg-[var(--mg-brand)] text-white shadow-sm"
                : "text-[var(--mg-text-secondary)] hover:text-[var(--mg-text)]"
            }`}
          >
            All Concepts
          </button>
          <button
            onClick={() => setActiveTab("a")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "a"
                ? "bg-[var(--mg-brand)] text-white shadow-sm"
                : "text-[var(--mg-text-secondary)] hover:text-[var(--mg-text)]"
            }`}
          >
            Concept A: AI Takes Over
          </button>
          <button
            onClick={() => setActiveTab("b")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "b"
                ? "bg-[var(--mg-brand)] text-white shadow-sm"
                : "text-[var(--mg-text-secondary)] hover:text-[var(--mg-text)]"
            }`}
          >
            Concept B: Cinematic Search
          </button>
          <button
            onClick={() => setActiveTab("c")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "c"
                ? "bg-[var(--mg-brand)] text-white shadow-sm"
                : "text-[var(--mg-text-secondary)] hover:text-[var(--mg-text)]"
            }`}
          >
            Concept C: Editorial Film
          </button>
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--mg-border)] hover:bg-[var(--mg-surface-elevated)] transition-colors"
          >
            {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-24">
        {/* Lab Overview Intro Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--mg-border-strong)] bg-[var(--mg-brand-soft)] text-xs text-[var(--mg-brand)] font-medium">
            Visual Exploration Stage
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--mg-text)]">
            The Shift: 3 Radical Visual Archetypes
          </h1>
          <p className="text-sm sm:text-base text-[var(--mg-text-secondary)] leading-relaxed">
            AI is becoming the primary commercial buyer. Exploring spatial
            dissolution, vertical search immediacy, and kinetic typography.
          </p>
        </div>

        {/* =========================================================================
            PROTOTYPE A — AI TAKES OVER (Spatial Web Dissolution)
            ========================================================================= */}
        {(activeTab === "all" || activeTab === "a") && (
          <section id="concept-a" className="space-y-6 pt-6 border-t border-[var(--mg-border-subtle)]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest font-mono text-[var(--mg-brand)]">
                  Prototype 01
                </span>
                <h2 className="text-2xl font-bold tracking-tight mt-1">
                  Concept A: Spatial Takeover (Many → One)
                </h2>
                <p className="text-xs sm:text-sm text-[var(--mg-text-secondary)] max-w-xl mt-1">
                  The old web exists as scattered floating fragments (tabs, reviews, checkout). 
                  When the AI buyer enters, the human friction recedes into spatial depth, leaving one crystallized mandate.
                </p>
              </div>
            </div>

            <PrototypeAContainer />
          </section>
        )}

        {/* =========================================================================
            PROTOTYPE B — CINEMATIC SEARCH (Vertical AI Shopping Engine)
            ========================================================================= */}
        {(activeTab === "all" || activeTab === "b") && (
          <section id="concept-b" className="space-y-6 pt-6 border-t border-[var(--mg-border-subtle)]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest font-mono text-[var(--mg-brand)]">
                  Prototype 02
                </span>
                <h2 className="text-2xl font-bold tracking-tight mt-1">
                  Concept B: Cinematic Search (Query as Hero)
                </h2>
                <p className="text-xs sm:text-sm text-[var(--mg-text-secondary)] max-w-xl mt-1">
                  No container cards or browser chrome. The search query itself is the massive typographic anchor. 
                  Ranked results stream vertically, AI autonomously evaluates SLA and mandate fit, and elevates the winner.
                </p>
              </div>
            </div>

            <PrototypeBContainer />
          </section>
        )}

        {/* =========================================================================
            PROTOTYPE C — EDITORIAL TRANSFORMATION (Kinetic Film Sequence)
            ========================================================================= */}
        {(activeTab === "all" || activeTab === "c") && (
          <section id="concept-c" className="space-y-6 pt-6 border-t border-[var(--mg-border-subtle)]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest font-mono text-[var(--mg-brand)]">
                  Prototype 03
                </span>
                <h2 className="text-2xl font-bold tracking-tight mt-1">
                  Concept C: Editorial Kinetic Film
                </h2>
                <p className="text-xs sm:text-sm text-[var(--mg-text-secondary)] max-w-xl mt-1">
                  Typography-first product film. Replaces UI dashboards with raw scale contrasts: 
                  &ldquo;10 TABS&rdquo; → &ldquo;TOO MUCH NOISE&rdquo; → &ldquo;ONE REQUEST&rdquo; → &ldquo;ONE DECISION&rdquo;.
                </p>
              </div>
            </div>

            <PrototypeCContainer />
          </section>
        )}
      </main>
    </div>
  );
}

/* =========================================================================
   PROTOTYPE A IMPLEMENTATION
   Spatial Fragments receding -> AI Intent & Selection crystalizing
   ========================================================================= */
function PrototypeAContainer() {
  const [step, setStep] = useState<0 | 1 | 2>(0); // 0: Old Web Chaos, 1: AI Intercepts, 2: One Offer Selected
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setStep((prev) => ((prev + 1) % 3) as 0 | 1 | 2);
    }, 3800);
    return () => clearInterval(interval);
  }, [autoPlay]);

  return (
    <div className="relative rounded-3xl overflow-hidden border border-[var(--mg-border)] bg-[var(--mg-bg-muted)] p-6 sm:p-10 min-h-[580px] flex flex-col justify-between">
      {/* Step Controller Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 z-30 pb-4 border-b border-[var(--mg-border-subtle)]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setAutoPlay(false);
              setStep(0);
            }}
            className={`px-3 py-1 text-xs rounded-full transition-all ${
              step === 0
                ? "bg-[var(--mg-text)] text-[var(--mg-bg)] font-semibold"
                : "border border-[var(--mg-border)] text-[var(--mg-text-muted)] hover:text-[var(--mg-text)]"
            }`}
          >
            1. Human Web (12 Tabs)
          </button>
          <span className="text-[var(--mg-text-muted)]">→</span>
          <button
            onClick={() => {
              setAutoPlay(false);
              setStep(1);
            }}
            className={`px-3 py-1 text-xs rounded-full transition-all ${
              step === 1
                ? "bg-[var(--mg-brand)] text-white font-semibold"
                : "border border-[var(--mg-border)] text-[var(--mg-text-muted)] hover:text-[var(--mg-text)]"
            }`}
          >
            2. AI Intercepts
          </button>
          <span className="text-[var(--mg-text-muted)]">→</span>
          <button
            onClick={() => {
              setAutoPlay(false);
              setStep(2);
            }}
            className={`px-3 py-1 text-xs rounded-full transition-all ${
              step === 2
                ? "bg-[var(--mg-success)] text-white font-semibold"
                : "border border-[var(--mg-border)] text-[var(--mg-text-muted)] hover:text-[var(--mg-text)]"
            }`}
          >
            3. One Decision
          </button>
        </div>

        <button
          onClick={() => setAutoPlay(!autoPlay)}
          className="text-xs text-[var(--mg-text-secondary)] hover:text-[var(--mg-text)] flex items-center gap-1.5"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              autoPlay ? "bg-[var(--mg-brand)] animate-ping" : "bg-gray-500"
            }`}
          />
          {autoPlay ? "Auto-playing (Click to pause)" : "Paused (Click to loop)"}
        </button>
      </div>

      {/* Spatial 3D Canvas */}
      <div className="relative w-full h-[460px] flex items-center justify-center overflow-hidden my-auto [perspective:1200px]">
        {/* Layer 1: Old Web Loose Fragments (Receding in Step 1 and Step 2) */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-all duration-1000 pointer-events-none"
          style={{
            transform:
              step === 0
                ? "scale(1) translateZ(0px) rotateX(0deg)"
                : step === 1
                ? "scale(0.85) translateZ(-180px) rotateX(8deg) translateY(-20px)"
                : "scale(0.7) translateZ(-350px) rotateX(15deg) translateY(-40px)",
            opacity: step === 0 ? 0.95 : step === 1 ? 0.25 : 0.05,
            filter: step === 0 ? "none" : "blur(4px)",
          }}
        >
          {/* Fragment A: Browser Tabs Bar */}
          <div
            className="absolute top-4 left-4 sm:left-12 max-w-[280px] p-3 rounded-xl border border-[var(--mg-border)] bg-[var(--mg-surface-elevated)] shadow-lg transition-transform duration-700"
            style={{
              transform: step === 0 ? "rotate(-4deg) translateY(0px)" : "rotate(-12deg) translateY(-40px)",
            }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-2 h-2 rounded-full bg-red-400/80" />
              <span className="w-2 h-2 rounded-full bg-amber-400/80" />
              <span className="w-2 h-2 rounded-full bg-green-400/80" />
              <span className="text-[10px] text-[var(--mg-text-muted)] font-mono ml-2">12 Tabs Open</span>
            </div>
            <div className="space-y-1 text-[11px] text-[var(--mg-text-secondary)]">
              <div className="p-1 rounded bg-[var(--mg-surface-subtle)] truncate">📄 Compare Mentors 2026...</div>
              <div className="p-1 rounded bg-[var(--mg-surface-subtle)] truncate">📄 Reddit: Best system design coach?</div>
            </div>
          </div>

          {/* Fragment B: Conflicting Reviews */}
          <div
            className="absolute bottom-10 left-6 sm:left-24 max-w-[240px] p-3.5 rounded-xl border border-[var(--mg-border)] bg-[var(--mg-surface-elevated)] shadow-lg transition-transform duration-700"
            style={{
              transform: step === 0 ? "rotate(3deg) translateY(0px)" : "rotate(8deg) translateY(30px)",
            }}
          >
            <div className="text-[10px] uppercase font-mono text-amber-500 font-semibold mb-1">
              ★ 3.8 / 5 (Mixed Reviews)
            </div>
            <p className="text-[11px] text-[var(--mg-text-muted)] line-clamp-2">
              &ldquo;Great syllabus but weekend batch filled fast. Refund took 14 days.&rdquo;
            </p>
          </div>

          {/* Fragment C: Pricing Matrix Confusion */}
          <div
            className="absolute top-6 right-4 sm:right-16 max-w-[290px] p-3.5 rounded-xl border border-[var(--mg-border)] bg-[var(--mg-surface-elevated)] shadow-lg transition-transform duration-700"
            style={{
              transform: step === 0 ? "rotate(5deg) translateY(0px)" : "rotate(14deg) translateY(-30px)",
            }}
          >
            <div className="flex justify-between items-center text-[11px] font-semibold mb-1.5">
              <span>Tier 3 Pro</span>
              <span className="text-[var(--mg-brand)]">₹4,999/mo + GST</span>
            </div>
            <div className="text-[10px] text-[var(--mg-text-muted)] space-y-0.5">
              <div>⚠️ Billed annually (₹59,988 upfront)</div>
              <div>⚠️ 18% GST added at step 4</div>
            </div>
          </div>

          {/* Fragment D: 14 Checkout Fields */}
          <div
            className="absolute bottom-6 right-8 sm:right-28 max-w-[260px] p-3 rounded-xl border border-[var(--mg-border)] bg-[var(--mg-surface-elevated)] shadow-lg transition-transform duration-700"
            style={{
              transform: step === 0 ? "rotate(-2deg) translateY(0px)" : "rotate(-6deg) translateY(20px)",
            }}
          >
            <span className="text-[10px] text-[var(--mg-critical)] font-mono block mb-1">
              Step 3 of 5: Checkout Form
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="h-5 rounded bg-[var(--mg-surface-subtle)] border border-[var(--mg-border-subtle)]" />
              <div className="h-5 rounded bg-[var(--mg-surface-subtle)] border border-[var(--mg-border-subtle)]" />
              <div className="col-span-2 h-5 rounded bg-[var(--mg-surface-subtle)] border border-[var(--mg-border-subtle)]" />
            </div>
          </div>
        </div>

        {/* Layer 2: Dominant AI Request (Appears in Step 1, stays in Step 2) */}
        <div
          className="relative z-20 w-full max-w-xl transition-all duration-700"
          style={{
            transform:
              step === 0
                ? "translateY(50px) scale(0.92)"
                : step === 1
                ? "translateY(0px) scale(1)"
                : "translateY(-60px) scale(0.96)",
            opacity: step === 0 ? 0.3 : step === 1 ? 1 : 0.85,
          }}
        >
          <div className="p-5 sm:p-6 rounded-2xl border border-[var(--mg-border-strong)] bg-[var(--mg-surface)] shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--mg-brand)]" />
                <span className="text-xs font-mono font-medium text-[var(--mg-brand)]">
                  Autonomous Buyer Agent
                </span>
              </div>
              <span className="text-[10px] font-mono text-[var(--mg-text-muted)]">
                Budget: ₹4,000/mo max
              </span>
            </div>

            <div className="text-base sm:text-lg font-medium text-[var(--mg-text)] leading-snug">
              &ldquo;{QUERY_TEXT}&rdquo;
            </div>

            {/* AI Constraint Badges */}
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-[var(--mg-border-subtle)] text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-[var(--mg-surface-subtle)] border border-[var(--mg-border-subtle)] text-[var(--mg-text-secondary)]">
                ✓ Monthly Recurring
              </span>
              <span className="px-2 py-0.5 rounded bg-[var(--mg-surface-subtle)] border border-[var(--mg-border-subtle)] text-[var(--mg-text-secondary)]">
                ✓ Weekend Cohort
              </span>
              <span className="px-2 py-0.5 rounded bg-[var(--mg-surface-subtle)] border border-[var(--mg-border-subtle)] text-[var(--mg-text-secondary)]">
                ✓ Verified Razorpay SLA
              </span>
            </div>
          </div>
        </div>

        {/* Layer 3: Crystallized Single Choice (Floats up in Step 2) */}
        <div
          className="absolute z-30 w-full max-w-md transition-all duration-700"
          style={{
            transform:
              step === 2
                ? "translateY(55px) scale(1)"
                : "translateY(120px) scale(0.85)",
            opacity: step === 2 ? 1 : 0,
            pointerEvents: step === 2 ? "auto" : "none",
          }}
        >
          <div className="p-5 rounded-2xl border-2 border-[var(--mg-success)] bg-[var(--mg-surface-elevated)] shadow-[0_20px_50px_rgba(16,185,129,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-[var(--mg-success-soft)] text-[var(--mg-success)] mb-1">
                  100% Match · Auto-Authorized
                </div>
                <h3 className="text-lg font-bold text-[var(--mg-text)]">
                  System Design Pro
                </h3>
                <p className="text-xs text-[var(--mg-text-secondary)] mt-0.5">
                  1:1 Weekend Cohort · Razorpay Recurring Mandate
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-[var(--mg-text)]">
                  ₹3,499
                </div>
                <div className="text-[10px] text-[var(--mg-text-muted)] font-mono">
                  / month
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[var(--mg-border-subtle)] flex items-center justify-between text-xs">
              <span className="text-[var(--mg-success)] font-medium flex items-center gap-1">
                ✓ Zero human friction required
              </span>
              <span className="font-mono text-[10px] text-[var(--mg-brand)]">
                Mandate ID: auth_9x81
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   PROTOTYPE B IMPLEMENTATION
   Cinematic Search - Query is the massive anchor, Results flow vertically,
   Inspection & Selection in place.
   ========================================================================= */
function PrototypeBContainer() {
  const [selectedOffer, setSelectedOffer] = useState<number>(0);
  const [inspecting, setInspecting] = useState(false);

  const results = [
    {
      id: "01",
      name: "System Design Pro",
      tagline: "Live 1:1 Senior Architect Mentorship",
      price: "₹3,499",
      cadence: "/mo",
      matchScore: 99,
      badge: "Best Match",
      reasons: ["Within budget limit", "Weekend cohorts confirmed", "Instant Razorpay auto-mandate"],
      highlight: true,
    },
    {
      id: "02",
      name: "Interview Accelerator Cohort",
      tagline: "Group Mock Interviews & Code Reviews",
      price: "₹3,799",
      cadence: "/mo",
      matchScore: 84,
      badge: "Slight Overlap",
      reasons: ["Within budget", "Weekday only (requires schedule override)"],
      highlight: false,
    },
    {
      id: "03",
      name: "Distributed Systems Mastery",
      tagline: "Self-paced + Async mentor Slack support",
      price: "₹3,999",
      cadence: "/mo",
      matchScore: 78,
      badge: "Higher Latency",
      reasons: ["Within budget", "Async response SLA: 48 hours"],
      highlight: false,
    },
  ];

  const handleSelect = (index: number) => {
    setSelectedOffer(index);
    setInspecting(true);
    setTimeout(() => setInspecting(false), 800);
  };

  return (
    <div className="relative rounded-3xl overflow-hidden border border-[var(--mg-border)] bg-[var(--mg-bg-muted)] p-6 sm:p-12 space-y-10">
      {/* Central Hero Query */}
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--mg-brand)] animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--mg-brand)] font-semibold">
            AI Buyer Search Terminal
          </span>
        </div>

        <div className="relative group">
          <h3 className="text-2xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[var(--mg-text)] leading-tight">
            &ldquo;{QUERY_TEXT}&rdquo;
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--mg-text-muted)] font-mono">
            <span className="text-[var(--mg-text-secondary)]">Query tokens: 9</span>
            <span>·</span>
            <span>Hard constraint: &lt;= ₹4,000/mo</span>
            <span>·</span>
            <span>Cadence: Monthly Recurring</span>
          </div>
        </div>
      </div>

      {/* Vertical Result Stream without Outer Boxes */}
      <div className="space-y-3">
        <div className="text-xs font-mono uppercase tracking-widest text-[var(--mg-text-muted)] pb-2 border-b border-[var(--mg-border-subtle)] flex justify-between items-center">
          <span>AI Ranked Commercial Offers (3 of 42 Evaluated)</span>
          <span>Autonomous Evaluation</span>
        </div>

        <div className="space-y-2.5">
          {results.map((res, idx) => {
            const isSelected = selectedOffer === idx;
            return (
              <div
                key={res.id}
                onClick={() => handleSelect(idx)}
                className={`group cursor-pointer rounded-2xl transition-all duration-300 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border ${
                  isSelected
                    ? "border-[var(--mg-brand)] bg-[var(--mg-surface-elevated)] shadow-[0_10px_30px_rgba(11,92,255,0.15)] scale-[1.01]"
                    : "border-[var(--mg-border-subtle)] bg-[var(--mg-surface)] hover:border-[var(--mg-border)] hover:bg-[var(--mg-surface-elevated)]"
                }`}
              >
                {/* Left: Number & Main info */}
                <div className="flex items-start sm:items-center gap-4">
                  <span
                    className={`font-mono text-sm sm:text-base font-bold ${
                      isSelected ? "text-[var(--mg-brand)]" : "text-[var(--mg-text-muted)]"
                    }`}
                  >
                    {res.id}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base sm:text-lg font-semibold text-[var(--mg-text)]">
                        {res.name}
                      </h4>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          res.highlight
                            ? "bg-[var(--mg-brand-soft)] text-[var(--mg-brand)] font-semibold"
                            : "bg-[var(--mg-surface-subtle)] text-[var(--mg-text-muted)]"
                        }`}
                      >
                        {res.badge}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--mg-text-secondary)] mt-0.5">
                      {res.tagline}
                    </p>
                  </div>
                </div>

                {/* Right: Price & Selection Status */}
                <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--mg-border-subtle)]">
                  <div className="text-right">
                    <span className="text-lg font-bold text-[var(--mg-text)] font-mono">
                      {res.price}
                    </span>
                    <span className="text-xs text-[var(--mg-text-muted)] font-mono">
                      {res.cadence}
                    </span>
                  </div>

                  <div
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                      isSelected
                        ? "bg-[var(--mg-brand)] text-white font-medium shadow-sm"
                        : "border border-[var(--mg-border)] text-[var(--mg-text-secondary)] group-hover:border-[var(--mg-text-muted)]"
                    }`}
                  >
                    {isSelected ? (inspecting ? "Inspecting..." : "✓ Selected") : "Select"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time AI Inspection Ribbon */}
      <div className="p-4 rounded-xl border border-[var(--mg-border-strong)] bg-[var(--mg-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[var(--mg-success)]" />
          <span className="text-[var(--mg-text-secondary)]">
            AI Buyer Decision:{" "}
            <strong className="text-[var(--mg-text)] font-semibold">
              {results[selectedOffer].name}
            </strong>{" "}
            selected for checkout execution.
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--mg-brand)]">
          <span>Razorpay Mandate Ready</span>
          <span>·</span>
          <span>Budget Check: Passed</span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   PROTOTYPE C IMPLEMENTATION
   Editorial Kinetic Typography & Phase Transformation
   ========================================================================= */
function PrototypeCContainer() {
  const [phase, setPhase] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const PHASES = [
    { title: "10 TABS.", sub: "Human web fatigue & scattered comparisons", type: "noise" },
    { title: "14 OPTIONS.", sub: "Hidden pricing tiers and obscure cancellation terms", type: "noise" },
    { title: "TOO MUCH NOISE.", sub: "Every purchase requires cognitive friction", type: "noise" },
    { title: "ONE REQUEST.", sub: "Clear autonomous intent expressed in natural language", type: "ai" },
    { title: "ONE DECISION.", sub: "Authoritative mandate matched, verified, and settled", type: "decision" },
  ];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setPhase((prev) => (prev + 1) % PHASES.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [isPlaying, PHASES.length]);

  return (
    <div className="relative rounded-3xl overflow-hidden border border-[var(--mg-border)] bg-[var(--mg-bg-muted)] p-6 sm:p-14 min-h-[560px] flex flex-col justify-between">
      {/* Top Film Marker */}
      <div className="flex items-center justify-between text-xs font-mono text-[var(--mg-text-muted)] border-b border-[var(--mg-border-subtle)] pb-4 z-20">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--mg-brand)] animate-pulse" />
          <span className="uppercase tracking-widest text-[var(--mg-text-secondary)]">
            Editorial Film Sequence
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>
            Phase {phase + 1} / {PHASES.length}
          </span>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="hover:text-[var(--mg-text)] transition-colors underline"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
        </div>
      </div>

      {/* Main Kinetic Typography Stage */}
      <div className="relative my-auto py-12 flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Step 0, 1, 2: Noise Typography */}
        {phase < 3 && (
          <div
            key={phase}
            className="space-y-4 animate-in fade-in zoom-in-95 duration-500 transition-all"
          >
            <div className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-[var(--mg-text-muted)]/70 uppercase">
              {PHASES[phase].title}
            </div>
            <p className="text-sm sm:text-base text-[var(--mg-text-secondary)] max-w-md mx-auto font-mono">
              {PHASES[phase].sub}
            </p>
          </div>
        )}

        {/* Step 3: ONE REQUEST */}
        {phase === 3 && (
          <div
            key="one-request"
            className="space-y-5 animate-in fade-in slide-in-from-bottom-6 duration-600 max-w-2xl mx-auto"
          >
            <span className="text-xs uppercase tracking-widest font-mono text-[var(--mg-brand)] font-bold">
              The Agentic Shift
            </span>
            <div className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[var(--mg-text)]">
              ONE REQUEST.
            </div>
            <div className="p-4 sm:p-5 rounded-2xl border border-[var(--mg-brand-line)] bg-[var(--mg-brand-soft)] text-base sm:text-xl font-medium text-[var(--mg-text)]">
              &ldquo;{QUERY_TEXT}&rdquo;
            </div>
          </div>
        )}

        {/* Step 4: ONE DECISION */}
        {phase === 4 && (
          <div
            key="one-decision"
            className="space-y-6 animate-in fade-in zoom-in-95 duration-600 max-w-lg mx-auto w-full"
          >
            <div className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[var(--mg-success)]">
              ONE DECISION.
            </div>

            <div className="p-6 rounded-2xl border-2 border-[var(--mg-success-border)] bg-[var(--mg-surface)] shadow-2xl text-left space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-bold text-[var(--mg-text)]">
                    System Design Pro
                  </h4>
                  <p className="text-xs text-[var(--mg-text-secondary)] mt-0.5">
                    Live Weekend Mentorship Cohort
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[var(--mg-text)] font-mono">
                    ₹3,499
                  </div>
                  <div className="text-[10px] text-[var(--mg-text-muted)] font-mono">
                    / month
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-[var(--mg-text-secondary)] border-t border-[var(--mg-border-subtle)] pt-3 font-mono">
                <div className="flex items-center gap-2 text-[var(--mg-success)]">
                  <span>✓</span> <span>Human verified mentor</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--mg-success)]">
                  <span>✓</span> <span>Monthly Razorpay recurring mandate</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--mg-success)]">
                  <span>✓</span> <span>Guaranteed 24h SLA response</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Timeline Indicator */}
      <div className="grid grid-cols-5 gap-2 z-20 pt-4 border-t border-[var(--mg-border-subtle)]">
        {PHASES.map((p, idx) => (
          <button
            key={p.title}
            onClick={() => {
              setIsPlaying(false);
              setPhase(idx);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              phase === idx
                ? "bg-[var(--mg-brand)] scale-y-125"
                : phase > idx
                ? "bg-[var(--mg-border-strong)]"
                : "bg-[var(--mg-border)]"
            }`}
            title={p.title}
          />
        ))}
      </div>
    </div>
  );
}
