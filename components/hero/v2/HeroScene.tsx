"use client";

import React, { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";

/* ═══════════════════════════════════════════════════════════════════════
   M17 — MANDATEGUARD HERO: "THE AI DECISION TRACE" (WINNER POLISH)
   Editorial typography + financial infrastructure + AI reasoning trace.
   Zero pill boxes, zero redundant scaffolding, signature Mandate Snapshot seal,
   elevated optical scan beam, high-contrast typography, and generous negative space.
   ═══════════════════════════════════════════════════════════════════════ */

export type HeroPhase =
  | "idle"
  | "cursor-enter"
  | "typing"
  | "search-click"
  | "result-1-enter"
  | "result-2-enter"
  | "result-3-merchant-enter"
  | "verdict-lose"
  | "why-unfold"
  | "improve-prompt"
  | "ranking-shift-2"
  | "ranking-shift-1"
  | "chosen-win"
  | "approval"
  | "term-drift"
  | "protected-stop"
  | "final"
  | "reset-cycle";

export const HERO_PHASE_ORDER: HeroPhase[] = [
  "idle",
  "cursor-enter",
  "typing",
  "search-click",
  "result-1-enter",
  "result-2-enter",
  "result-3-merchant-enter",
  "verdict-lose",
  "why-unfold",
  "improve-prompt",
  "ranking-shift-2",
  "ranking-shift-1",
  "chosen-win",
  "approval",
  "term-drift",
  "protected-stop",
  "final",
  "reset-cycle",
];

export interface SearchResultItem {
  id: string;
  title: string;
  price: string;
  pricePerMonth: string;
  shortDescriptor: string;
  isMerchant: boolean;
  good: string[];
  missing: string[];
  explanation: string;
}

export interface HeroScenario {
  id: string;
  tabLabel: string;
  query: string;
  requirementsMet: string[];
  requirementsUnverified: string[];
  buyerWanted: string[];
  merchantOffer: string;
  aiCouldNotVerify: string[];
  improvedTo: string[];
  results: SearchResultItem[];
}

export const HERO_SCENARIOS: HeroScenario[] = [
  {
    id: "mentor",
    tabLabel: "Human mentor under ₹4,000",
    query: "I’m looking for a system design mentor under ₹4,000 with 24-hour support",
    requirementsMet: ["Price fits (₹3,999)", "Monthly billing"],
    requirementsUnverified: ["Human mentor", "24h response SLA"],
    buyerWanted: ["Dedicated human mentor", "Under ₹4,000 / mo"],
    merchantOffer: "Expert guidance & recordings",
    aiCouldNotVerify: ["1:1 Human support", "Response time SLA"],
    improvedTo: ["Dedicated 1:1 human mentor", "Guaranteed 24h response SLA"],
    results: [
      {
        id: "r1",
        title: "System Design Pro",
        price: "₹3,499",
        pricePerMonth: "₹3,499/mo",
        shortDescriptor: "Human mentor · 24h response",
        isMerchant: false,
        good: ["₹3,499/month", "Dedicated human mentor", "24h response"],
        missing: [],
        explanation: "Matches all buyer criteria: price under ₹4,000, verified 1:1 human support.",
      },
      {
        id: "r2",
        title: "Interview Accelerator",
        price: "₹3,799",
        pricePerMonth: "₹3,799/mo",
        shortDescriptor: "Mock interviews & QA",
        isMerchant: false,
        good: ["₹3,799/month", "Weekly group QA"],
        missing: ["No dedicated 1:1 mentor", "No 24h response SLA"],
        explanation: "Lower price, but group sessions only without 1:1 mentorship.",
      },
      {
        id: "r3",
        title: "YOUR BUSINESS",
        price: "₹3,999",
        pricePerMonth: "₹3,999/mo",
        shortDescriptor: "Expert guidance & recordings",
        isMerchant: true,
        good: ["₹3,999/month", "Monthly billing"],
        missing: ["Human mentor unclear", "Response time unclear"],
        explanation: "Your offer says 'Expert guidance', but doesn’t clearly explain who provides the support or how quickly they respond.",
      },
    ],
  },
  {
    id: "value",
    tabLabel: "Best value system design",
    query: "I want the best value system design program with live reviews",
    requirementsMet: ["Architecture track", "Live sessions"],
    requirementsUnverified: ["Weekly live reviews", "Curriculum SLA"],
    buyerWanted: ["Live weekly reviews", "Distributed systems track"],
    merchantOffer: "Comprehensive architecture videos",
    aiCouldNotVerify: ["Weekly live review format", "Direct architect feedback"],
    improvedTo: ["Weekly live architecture reviews", "Direct feedback on mocks"],
    results: [
      {
        id: "v1",
        title: "Code Review Club",
        price: "₹1,999",
        pricePerMonth: "₹1,999/mo",
        shortDescriptor: "Weekly live teardowns",
        isMerchant: false,
        good: ["₹1,999/month", "Weekly live teardowns"],
        missing: [],
        explanation: "Lowest cost with active live architecture reviews.",
      },
      {
        id: "v2",
        title: "Architecture Academy",
        price: "₹3,299",
        pricePerMonth: "₹3,299/mo",
        shortDescriptor: "Comprehensive curriculum",
        isMerchant: false,
        good: ["₹3,299/month", "Comprehensive curriculum"],
        missing: ["Review frequency unstated"],
        explanation: "Strong curriculum but review cadence is unverified.",
      },
      {
        id: "v3",
        title: "YOUR BUSINESS",
        price: "₹2,999",
        pricePerMonth: "₹2,999/mo",
        shortDescriptor: "Architecture video track",
        isMerchant: true,
        good: ["₹2,999/month", "Architecture video track"],
        missing: ["Live review frequency unclear", "Direct feedback unclear"],
        explanation: "Offer mentions coaching but does not state live weekly review format.",
      },
    ],
  },
  {
    id: "interview",
    tabLabel: "Premium interview prep",
    query: "I need premium interview preparation with flexible monthly billing",
    requirementsMet: ["Senior-level prep", "Mock rounds"],
    requirementsUnverified: ["Money-back guarantee terms", "1:1 format"],
    buyerWanted: ["100% money-back guarantee", "Staff / Senior mock prep"],
    merchantOffer: "Interview prep & tips",
    aiCouldNotVerify: ["Explicit guarantee terms", "1:1 mock schedule"],
    improvedTo: ["100% money-back if no offer", "4 live mock interviews / mo"],
    results: [
      {
        id: "i1",
        title: "Engineering Leadership Prep",
        price: "₹2,499",
        pricePerMonth: "₹2,499/mo",
        shortDescriptor: "100% money-back guarantee",
        isMerchant: false,
        good: ["₹2,499/month", "100% money-back guarantee", "Direct feedback"],
        missing: [],
        explanation: "Full refund policy and structured senior leadership tracks.",
      },
      {
        id: "i2",
        title: "Tech Interview Bootcamp",
        price: "₹3,499",
        pricePerMonth: "₹3,499/mo",
        shortDescriptor: "Mock interview drills",
        isMerchant: false,
        good: ["₹3,499/month", "Mock rounds"],
        missing: ["No refund guarantee"],
        explanation: "Covers interview drills but lacks money-back protection.",
      },
      {
        id: "i3",
        title: "YOUR BUSINESS",
        price: "₹2,999",
        pricePerMonth: "₹2,999/mo",
        shortDescriptor: "Senior prep content",
        isMerchant: true,
        good: ["₹2,999/month", "Senior prep content"],
        missing: ["Guarantee terms unclear", "Mock format unstated"],
        explanation: "Your offer mentions interview guidance but lacks clear guarantee terms.",
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   CINEMATIC TIMINGS (ms) — TUNED FOR DRAMATIC BREATHING ROOM
   ═══════════════════════════════════════════════════════════════════════ */

const PHASE_DURATIONS: Record<HeroPhase, number> = {
  "idle": 400,
  "cursor-enter": 350,
  "typing": 0, // governed by character typing loop
  "search-click": 900, // inline constraint illumination
  "result-1-enter": 400,
  "result-2-enter": 400,
  "result-3-merchant-enter": 850,
  "verdict-lose": 1100, // dramatic pause before diagnosis
  "why-unfold": 1200,
  "improve-prompt": 1300,
  "ranking-shift-2": 650,
  "ranking-shift-1": 650,
  "chosen-win": 1100, // Mandate Snapshot seal creation
  "approval": 1300, // Authorized transaction state
  "term-drift": 950, // Price mutation redline
  "protected-stop": 1800, // Authoritative Payment Stopped climax
  "final": 3800, // Calm payoff hold
  "reset-cycle": 450,
};

/* ═══════════════════════════════════════════════════════════════════════
   REDUCED MOTION
   ═══════════════════════════════════════════════════════════════════════ */

function subscribeReducedMotion(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function getReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function getReducedMotionServer() {
  return false;
}

interface HeroSceneProps {
  onGetStarted: () => void;
  onExploreDemo: () => void;
}

/* ═══════════════════════════════════════════════════════════════════════
   SIGNATURE MANDATE SNAPSHOT SEAL (BESPOKE SVG COMPONENT)
   ═══════════════════════════════════════════════════════════════════════ */

function MandateSnapshotSeal({ isMutating, isStopped }: { isMutating?: boolean; isStopped?: boolean }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        padding: "6px 14px",
        borderRadius: "99px",
        border: isStopped
          ? "1px solid rgba(239, 68, 68, 0.4)"
          : isMutating
          ? "1px solid rgba(245, 158, 11, 0.4)"
          : "1px solid rgba(16, 185, 129, 0.4)",
        background: isStopped
          ? "rgba(239, 68, 68, 0.08)"
          : isMutating
          ? "rgba(245, 158, 11, 0.08)"
          : "rgba(16, 185, 129, 0.08)",
        transition: "all 0.4s ease",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        {/* Outer concentric micro-ring */}
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={isStopped ? "#EF4444" : isMutating ? "#F59E0B" : "#10B981"}
          strokeWidth="1.5"
          strokeDasharray={isStopped ? "4 2" : "none"}
          opacity="0.8"
        />
        {/* Inner seal circle */}
        <circle
          cx="12"
          cy="12"
          r="6"
          fill={isStopped ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)"}
          stroke={isStopped ? "#EF4444" : "#10B981"}
          strokeWidth="1.5"
        />
        {/* Verification / Lock mark */}
        {isStopped ? (
          <path d="M9 9L15 15M15 9L9 15" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <path d="M8.5 12L10.5 14L15.5 9.5" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
      <span
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "0.6875rem",
          fontWeight: 800,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: isStopped ? "#EF4444" : isMutating ? "#F59E0B" : "#10B981",
        }}
      >
        {isStopped ? "MANDATE SNAPSHOT // MISMATCH BLOCKED" : "MANDATE SNAPSHOT // LOCKED"}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   HERO SCENE MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

export function HeroScene({ onGetStarted, onExploreDemo }: HeroSceneProps) {
  const [phase, setPhase] = useState<HeroPhase>("idle");
  const [scenario] = useState<HeroScenario>(HERO_SCENARIOS[0]);
  const [typedText, setTypedText] = useState("");
  const [isInViewport, setIsInViewport] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionServer,
  );

  // ─── Viewport IntersectionObserver (Scroll Trigger) ───
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
      },
      { threshold: 0.15 },
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // ─── Phase advance ───
  const advancePhase = useCallback(() => {
    setPhase((curr) => {
      const idx = HERO_PHASE_ORDER.indexOf(curr);
      if (curr === "reset-cycle" || idx === HERO_PHASE_ORDER.length - 1) {
        setTypedText("");
        return "idle";
      }
      return HERO_PHASE_ORDER[idx + 1];
    });
  }, []);

  // Main timer (respects hover pause & viewport visibility)
  useEffect(() => {
    if (!isInViewport || isHovered) return;
    const duration = PHASE_DURATIONS[phase];
    if (duration <= 0) return;

    phaseTimerRef.current = setTimeout(
      advancePhase,
      reducedMotion ? Math.min(duration, 150) : duration,
    );
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, [phase, advancePhase, reducedMotion, isInViewport, isHovered]);

  // Typing animation
  useEffect(() => {
    if (!isInViewport) return;
    if (phase !== "typing") {
      typingRef.current = null;
      return;
    }

    const query = scenario.query;
    let i = 0;

    const startTimer = setTimeout(() => {
      setTypedText("");
      typingRef.current = setInterval(() => {
        i++;
        setTypedText(query.slice(0, i));
        if (i >= query.length) {
          if (typingRef.current) clearInterval(typingRef.current);
          setTimeout(advancePhase, 250);
        }
      }, reducedMotion ? 8 : 28);
    }, 50);

    return () => {
      clearTimeout(startTimer);
      if (typingRef.current) clearInterval(typingRef.current);
    };
  }, [phase, scenario.query, advancePhase, reducedMotion, isInViewport]);

  const phaseIndex = HERO_PHASE_ORDER.indexOf(phase);

  // Derived states
  const hasResult1 = phaseIndex >= HERO_PHASE_ORDER.indexOf("result-1-enter");
  const hasResult2 = phaseIndex >= HERO_PHASE_ORDER.indexOf("result-2-enter");
  const hasResult3 = phaseIndex >= HERO_PHASE_ORDER.indexOf("result-3-merchant-enter");
  const showOffers = hasResult1 || hasResult2 || hasResult3;

  const showDiagnosis = phase === "verdict-lose" || phase === "why-unfold";
  const showImprove = phase === "improve-prompt";
  const isRewritten = phaseIndex >= HERO_PHASE_ORDER.indexOf("improve-prompt");

  const merchantRank =
    phase === "ranking-shift-2"
      ? 2
      : phaseIndex >= HERO_PHASE_ORDER.indexOf("ranking-shift-1")
      ? 1
      : 3;

  const showChosen = phase === "chosen-win";
  const showApproval = phase === "approval";
  const showTermDrift = phase === "term-drift";
  const showStop = phaseIndex >= HERO_PHASE_ORDER.indexOf("protected-stop");
  const showFinal = phase === "final";

  const merchant = scenario.results[2];

  return (
    <section
      ref={containerRef}
      className="hero-decision-trace"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "clamp(96px, 12vh, 130px) 24px clamp(60px, 8vh, 80px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box",
        minHeight: "92vh",
      }}
    >
      {/* ─── ATMOSPHERIC BACKGROUND ILLUMINATION ─── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "8%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "90%",
          maxWidth: "850px",
          height: "480px",
          background:
            "radial-gradient(ellipse at center, rgba(11, 92, 255, 0.08) 0%, rgba(16, 185, 129, 0.03) 50%, transparent 75%)",
          filter: "blur(70px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ─── TOP CONTEXTUAL MARKER ─── */}
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "0.6875rem",
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--mg-brand, #0B5CFF)",
          marginBottom: "1.25rem",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          position: "relative",
          zIndex: 2,
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#0B5CFF",
            boxShadow: "0 0 10px #0B5CFF",
            display: "inline-block",
          }}
        />
        AGENTIC COMMERCE // THE AI DECISION TRACE
      </div>

      {/* ─── MAIN HEADLINE ─── */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "2.5rem",
          position: "relative",
          zIndex: 2,
          maxWidth: "850px",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: "clamp(2.6rem, 6.8vw, 5rem)",
            fontWeight: 900,
            letterSpacing: "-0.045em",
            lineHeight: 1.0,
            color: "var(--mg-text, #0F172A)",
            margin: "0 0 1rem",
          }}
        >
          THE NEXT BUYER
          <br />
          <span
            style={{
              color: "#0B5CFF",
              textShadow: "0 0 40px rgba(11, 92, 255, 0.3)",
            }}
          >
            MIGHT BE AI.
          </span>
        </h1>
        <p
          style={{
            fontSize: "clamp(1rem, 1.4vw, 1.25rem)",
            color: "var(--mg-text-secondary, #64748B)",
            maxWidth: "540px",
            margin: "0 auto",
            lineHeight: 1.5,
            fontWeight: 500,
          }}
        >
          Make sure it can find you, understand you, and choose you.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════
          THE AI DECISION TRACE CANVAS (EDITORIAL & SPACIOUS)
          ═══════════════════════════════════════════════════════ */}
      <div
        className="hero-animation-stage"
        style={{
          width: "100%",
          maxWidth: "880px",
          minHeight: "420px",
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          padding: "12px 0",
        }}
      >
        {/* ─── 1. BUYER INTENT STATEMENT WITH INLINE ANNOTATIONS ─── */}
        {!showFinal && (
          <div
            style={{
              textAlign: "center",
              marginBottom: "2.5rem",
              minHeight: "64px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-space-grotesk), var(--font-inter), sans-serif",
                fontSize: "clamp(1.2rem, 2.5vw, 1.75rem)",
                fontWeight: 700,
                color: "var(--mg-text, #0F172A)",
                letterSpacing: "-0.025em",
                lineHeight: 1.4,
                maxWidth: "820px",
              }}
            >
              {phase === "idle" || phase === "cursor-enter" ? (
                <span style={{ color: "var(--mg-text-muted, #94A3B8)", opacity: 0.55 }}>
                  “I’m looking for a system design mentor under ₹4,000 with 24-hour support”
                </span>
              ) : phase === "typing" ? (
                <span>
                  “{typedText}”
                  <span
                    style={{
                      display: "inline-block",
                      width: "3px",
                      height: "1.1em",
                      background: "#0B5CFF",
                      marginLeft: "4px",
                      verticalAlign: "middle",
                    }}
                  />
                </span>
              ) : (
                /* Post-typing: In-sentence constraint illumination (NO PILL BOXES) */
                <span>
                  “I’m looking for a{" "}
                  <span
                    style={{
                      color: "#0B5CFF",
                      borderBottom: "2px solid #0B5CFF",
                      paddingBottom: "2px",
                      position: "relative",
                    }}
                  >
                    system design
                    <sup style={{ fontSize: "0.6em", fontWeight: 800, marginLeft: "3px" }}>DOMAIN</sup>
                  </span>{" "}
                  <span
                    style={{
                      color: "#0B5CFF",
                      borderBottom: "2px solid #0B5CFF",
                      paddingBottom: "2px",
                      position: "relative",
                    }}
                  >
                    mentor
                    <sup style={{ fontSize: "0.6em", fontWeight: 800, marginLeft: "3px" }}>1:1</sup>
                  </span>{" "}
                  <span
                    style={{
                      color: "#0B5CFF",
                      borderBottom: "2px solid #0B5CFF",
                      paddingBottom: "2px",
                      position: "relative",
                    }}
                  >
                    under ₹4,000
                    <sup style={{ fontSize: "0.6em", fontWeight: 800, marginLeft: "3px" }}>MAX</sup>
                  </span>{" "}
                  with{" "}
                  <span
                    style={{
                      color: "#0B5CFF",
                      borderBottom: "2px solid #0B5CFF",
                      paddingBottom: "2px",
                      position: "relative",
                    }}
                  >
                    24-hour support
                    <sup style={{ fontSize: "0.6em", fontWeight: 800, marginLeft: "3px" }}>SLA</sup>
                  </span>
                  ”
                </span>
              )}
            </div>
          </div>
        )}

        {/* ─── 2. DECISION TRACE: HORIZONTAL OFFER STRIPS ─── */}
        {showOffers && !showChosen && !showApproval && !showTermDrift && !showStop && !showFinal && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              width: "100%",
              position: "relative",
            }}
          >
            {/* Luminous AI Reading Beam with Soft Bloom */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "-10px",
                bottom: "-10px",
                left: phaseIndex >= HERO_PHASE_ORDER.indexOf("result-3-merchant-enter") ? "75%" : "25%",
                width: "3px",
                background: "linear-gradient(to bottom, transparent, #0B5CFF, #10B981, transparent)",
                boxShadow: "0 0 24px 6px rgba(11, 92, 255, 0.4)",
                opacity: phaseIndex >= HERO_PHASE_ORDER.indexOf("result-2-enter") ? 0.9 : 0,
                transition: "left 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease",
                pointerEvents: "none",
                zIndex: 10,
              }}
            />

            {/* Strip 1: System Design Pro */}
            {hasResult1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "18px 24px",
                  borderTop: "1px solid var(--mg-border, rgba(0,0,0,0.08))",
                  borderBottom: "1px solid var(--mg-border, rgba(0,0,0,0.08))",
                  opacity:
                    merchantRank === 1
                      ? 0.25
                      : showDiagnosis || showImprove
                      ? 0.3
                      : 1,
                  transform:
                    merchantRank === 1
                      ? "translateY(90px) scale(0.98)"
                      : "translateY(0px)",
                  filter: showDiagnosis || showImprove ? "blur(1.5px)" : "none",
                  transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "0.95rem",
                      fontWeight: 800,
                      color: merchantRank === 1 ? "var(--mg-text-muted)" : "#0B5CFF",
                    }}
                  >
                    {merchantRank === 1 ? "02" : "01"}
                  </span>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-space-grotesk), sans-serif",
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        color: "var(--mg-text, #0F172A)",
                      }}
                    >
                      {scenario.results[0].title}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--mg-text-secondary, #64748B)",
                        marginTop: "3px",
                      }}
                    >
                      {scenario.results[0].shortDescriptor}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      color: "var(--mg-text, #0F172A)",
                    }}
                  >
                    {scenario.results[0].pricePerMonth}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      color: "#10B981",
                      marginTop: "3px",
                    }}
                  >
                    ✓ 1:1 MENTOR · 24H SLA
                  </div>
                </div>
              </div>
            )}

            {/* Strip 2: Interview Accelerator */}
            {hasResult2 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "18px 24px",
                  borderBottom: "1px solid var(--mg-border, rgba(0,0,0,0.08))",
                  opacity:
                    merchantRank === 1 || merchantRank === 2
                      ? 0.25
                      : showDiagnosis || showImprove
                      ? 0.3
                      : 1,
                  transform:
                    merchantRank === 1
                      ? "translateY(90px) scale(0.98)"
                      : merchantRank === 2
                      ? "translateY(90px) scale(0.98)"
                      : "translateY(0px)",
                  filter: showDiagnosis || showImprove ? "blur(1.5px)" : "none",
                  transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "0.95rem",
                      fontWeight: 800,
                      color: "var(--mg-text-muted, #94A3B8)",
                    }}
                  >
                    {merchantRank >= 2 ? "03" : "02"}
                  </span>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-space-grotesk), sans-serif",
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        color: "var(--mg-text, #0F172A)",
                      }}
                    >
                      {scenario.results[1].title}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--mg-text-secondary, #64748B)",
                        marginTop: "3px",
                      }}
                    >
                      {scenario.results[1].shortDescriptor}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      color: "var(--mg-text, #0F172A)",
                    }}
                  >
                    {scenario.results[1].pricePerMonth}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      color: "#D97706",
                      marginTop: "3px",
                    }}
                  >
                    ? GROUP QA ONLY · NO SLA
                  </div>
                </div>
              </div>
            )}

            {/* Strip 3: YOUR BUSINESS (The Hero Focus Strip) */}
            {hasResult3 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "20px 24px",
                  borderBottom: "1px solid var(--mg-border, rgba(0,0,0,0.08))",
                  borderLeft:
                    merchantRank === 1
                      ? "3px solid #10B981"
                      : showDiagnosis || showImprove
                      ? "3px solid #D97706"
                      : "3px solid #0B5CFF",
                  background:
                    merchantRank === 1
                      ? "rgba(16, 185, 129, 0.05)"
                      : showDiagnosis || showImprove
                      ? "rgba(217, 119, 6, 0.05)"
                      : "rgba(11, 92, 255, 0.03)",
                  transform:
                    merchantRank === 1
                      ? "translateY(-175px)"
                      : merchantRank === 2
                      ? "translateY(-88px)"
                      : "translateY(0px)",
                  transition: "all 0.65s cubic-bezier(0.16, 1, 0.3, 1)",
                  position: "relative",
                  zIndex: 5,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        fontSize: "0.95rem",
                        fontWeight: 900,
                        color:
                          merchantRank === 1
                            ? "#10B981"
                            : showDiagnosis || showImprove
                            ? "#D97706"
                            : "#0B5CFF",
                      }}
                    >
                      {merchantRank === 1 ? "01" : merchantRank === 2 ? "02" : "03"}
                    </span>
                    <div>
                      <div
                        style={{
                          fontFamily: "var(--font-space-grotesk), sans-serif",
                          fontSize: "1.15rem",
                          fontWeight: 800,
                          color: "var(--mg-text, #0F172A)",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        {merchant.title}
                        {merchantRank === 1 && (
                          <span
                            style={{
                              fontFamily: "var(--font-jetbrains-mono), monospace",
                              fontSize: "0.625rem",
                              fontWeight: 800,
                              color: "#10B981",
                              background: "rgba(16, 185, 129, 0.12)",
                              padding: "2px 8px",
                              borderRadius: "4px",
                            }}
                          >
                            #1 CHOSEN
                          </span>
                        )}
                      </div>

                      {/* In-Place Morphing Description: Old vs Improved */}
                      <div
                        style={{
                          fontSize: "0.875rem",
                          marginTop: "3px",
                          transition: "color 0.3s ease",
                        }}
                      >
                        {isRewritten ? (
                          <span
                            style={{
                              color: "#10B981",
                              fontWeight: 700,
                            }}
                          >
                            {scenario.improvedTo.join(" · ")}
                          </span>
                        ) : (
                          <span style={{ color: "var(--mg-text-secondary, #64748B)" }}>
                            {merchant.shortDescriptor}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        fontSize: "1.1rem",
                        fontWeight: 800,
                        color: "var(--mg-text, #0F172A)",
                      }}
                    >
                      {merchant.pricePerMonth}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        color:
                          merchantRank === 1
                            ? "#10B981"
                            : showDiagnosis || showImprove
                            ? "#D97706"
                            : "#0B5CFF",
                        marginTop: "3px",
                      }}
                    >
                      {merchantRank === 1
                        ? "✓ 1:1 VERIFIED · SLA GUARANTEED"
                        : showDiagnosis || showImprove
                        ? "? TERMS UNVERIFIED"
                        : "✓ PRICE FITS"}
                    </div>
                  </div>
                </div>

                {/* ─── 3. #3 MOMENT & VISUAL DIAGNOSIS (HERO MOMENT) ─── */}
                {(showDiagnosis || showImprove) && (
                  <div
                    style={{
                      marginTop: "16px",
                      paddingTop: "14px",
                      borderTop: "1px dashed rgba(217, 119, 6, 0.3)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-space-grotesk), sans-serif",
                        fontSize: "0.95rem",
                        fontWeight: 800,
                        color: "#D97706",
                      }}
                    >
                      YOU’RE #3 — AI Diagnosis:
                    </div>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--mg-text, #0F172A)",
                        margin: 0,
                        lineHeight: 1.45,
                        fontWeight: 600,
                      }}
                    >
                      “Your price fits. Your support isn’t clear enough for AI.”
                    </p>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "2px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-jetbrains-mono), monospace",
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          color: "#EF4444",
                        }}
                      >
                        ? Human mentor (unverified)
                      </span>
                      <span style={{ color: "var(--mg-border)" }}>·</span>
                      <span
                        style={{
                          fontFamily: "var(--font-jetbrains-mono), monospace",
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          color: "#EF4444",
                        }}
                      >
                        ? Response SLA (unstated)
                      </span>
                    </div>

                    {showImprove && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginTop: "6px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-jetbrains-mono), monospace",
                            fontSize: "0.6875rem",
                            fontWeight: 800,
                            color: "#10B981",
                          }}
                        >
                          MANDATEGUARD CLARIFIES:
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-jetbrains-mono), monospace",
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            color: "#10B981",
                          }}
                        >
                          + Dedicated 1:1 mentor · Guaranteed 24h response SLA
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── 4. CHOSEN STATE (#1 WINNER WITH SIGNATURE MANDATE SNAPSHOT) ─── */}
        {showChosen && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              padding: "48px 24px",
            }}
          >
            <div style={{ marginBottom: "16px" }}>
              <MandateSnapshotSeal />
            </div>

            <div
              style={{
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontSize: "clamp(2.2rem, 5vw, 3.2rem)",
                fontWeight: 900,
                letterSpacing: "-0.035em",
                color: "var(--mg-text, #0F172A)",
                marginBottom: "6px",
              }}
            >
              {merchant.title}
            </div>

            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "1.6rem",
                fontWeight: 800,
                color: "#10B981",
                marginBottom: "12px",
              }}
            >
              {merchant.price} / month
            </div>

            <div
              style={{
                fontSize: "1rem",
                color: "var(--mg-text-secondary, #64748B)",
                fontWeight: 600,
              }}
            >
              Dedicated 1:1 mentor · Guaranteed 24h response SLA
            </div>
          </div>
        )}

        {/* ─── 5. AUTHORIZED TRANSACTION TRANSFORMATION ─── */}
        {showApproval && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              padding: "48px 24px",
            }}
          >
            <div style={{ marginBottom: "16px" }}>
              <MandateSnapshotSeal />
            </div>

            <div
              style={{
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontSize: "clamp(2.2rem, 5vw, 3.2rem)",
                fontWeight: 900,
                letterSpacing: "-0.035em",
                color: "var(--mg-text, #0F172A)",
                marginBottom: "6px",
              }}
            >
              {merchant.price} / month
            </div>

            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "0.875rem",
                fontWeight: 800,
                color: "#10B981",
                background: "rgba(16, 185, 129, 0.12)",
                padding: "4px 16px",
                borderRadius: "20px",
                marginBottom: "14px",
              }}
            >
              ✓ AUTHORIZED &amp; BOUND
            </div>

            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "0.6875rem",
                color: "var(--mg-text-muted, #94A3B8)",
              }}
            >
              SNAPSHOT HASH: sha256_9f4b1e82c · CEILING: ₹3,999/mo · RAZORPAY TEST MODE
            </div>
          </div>
        )}

        {/* ─── 6. PRICE MUTATION & MANDATEGUARD INTERCEPT ─── */}
        {(showTermDrift || showStop) && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              padding: "48px 24px",
            }}
          >
            <div style={{ marginBottom: "18px" }}>
              <MandateSnapshotSeal isMutating={showTermDrift} isStopped={showStop} />
            </div>

            {/* Price mutation redline diff */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "18px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "1.4rem",
                  color: "var(--mg-text-muted, #94A3B8)",
                  textDecoration: "line-through",
                  opacity: 0.6,
                }}
              >
                ₹3,999/mo
              </span>
              <span style={{ fontSize: "1.3rem", color: "#EF4444" }}>→</span>
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "1.8rem",
                  fontWeight: 900,
                  color: "#EF4444",
                }}
              >
                ₹4,129/mo
              </span>
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "0.6875rem",
                  fontWeight: 800,
                  color: "#EF4444",
                  background: "rgba(239, 68, 68, 0.12)",
                  padding: "3px 10px",
                  borderRadius: "4px",
                }}
              >
                +₹130 UNAUTHORIZED DRIFT
              </span>
            </div>

            {showStop && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-space-grotesk), sans-serif",
                    fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
                    fontWeight: 900,
                    letterSpacing: "-0.03em",
                    color: "#EF4444",
                    marginBottom: "8px",
                  }}
                >
                  PAYMENT STOPPED
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-space-grotesk), sans-serif",
                    fontSize: "clamp(1.1rem, 2.2vw, 1.4rem)",
                    fontWeight: 800,
                    color: "var(--mg-text, #0F172A)",
                    marginBottom: "12px",
                  }}
                >
                  NO MONEY WAS MOVED.
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "0.75rem",
                    color: "var(--mg-text-secondary, #64748B)",
                    maxWidth: "540px",
                    lineHeight: 1.5,
                  }}
                >
                  Mandate Snapshot policy: Price deviation exceeds authorized snapshot (0.00% allowed).
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── 7. FINAL PAYOFF (CINEMATIC TYPOGRAPHY REVEAL) ─── */}
        {showFinal && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              minHeight: "320px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontSize: "clamp(2.6rem, 6.5vw, 4.6rem)",
                fontWeight: 900,
                letterSpacing: "-0.045em",
                lineHeight: 1.05,
                color: "var(--mg-text, #0F172A)",
                marginBottom: "1.25rem",
              }}
            >
              <span>GET </span>
              <span>CHOSEN </span>
              <span
                style={{
                  color: "#0B5CFF",
                  textShadow: "0 0 40px rgba(11, 92, 255, 0.35)",
                }}
              >
                BY AI.
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "0.8125rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--mg-text-muted, #94A3B8)",
              }}
            >
              Protected by MandateGuard.
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          STABLE LOWER CTA
          ═══════════════════════════════════════════════════════ */}
      <div
        className="hero-cta"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
          marginTop: "2rem",
          position: "relative",
          zIndex: 5,
        }}
      >
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={onGetStarted}
            style={{
              padding: "13px 30px",
              borderRadius: "12px",
              border: "none",
              background: "#0B5CFF",
              color: "white",
              fontSize: "0.9375rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(11, 92, 255, 0.35)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            Get started →
          </button>
          <button
            onClick={onExploreDemo}
            style={{
              padding: "13px 26px",
              borderRadius: "12px",
              border: "1px solid var(--mg-border, rgba(0,0,0,0.15))",
              background: "var(--mg-surface, transparent)",
              color: "var(--mg-text, #0F172A)",
              fontSize: "0.9375rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.15s ease",
            }}
          >
            See how it works
          </button>
        </div>
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "0.6875rem",
            color: "var(--mg-text-muted, #94A3B8)",
            letterSpacing: "0.04em",
          }}
        >
          Protected by MandateGuard · Razorpay Test Mode
        </div>
      </div>
    </section>
  );
}
