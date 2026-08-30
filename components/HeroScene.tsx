"use client";

import React, { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import { MGScene, MGBlurFade } from "./mg-primitives";
import { AICursor, type CursorMode } from "./hero/AICursor";
import { ShieldIcon } from "./hero/ShieldIcon";
import { AIShoppingResult } from "./hero/AIShoppingResult";
import { ProductSpotlight } from "./hero/ProductSpotlight";

/* ═══════════════════════════════════════════════════════════════════════
   M10-HERO-VISUAL-RESET: 21ST.DEV PRODUCT SPOTLIGHT STAGE
   Choreographed Mutually Exclusive Scenes:
   1. SEARCH & PRODUCT SPOTLIGHT STAGE: Search input + Discovered Feed + Dominant Product Spotlight
   2. PURCHASE SCENE: Centralized transaction approval surface
   3. PROTECTION SCENE: MandateGuard policy intercept & stop
   4. PAYOFF SCENE: Minimal title card ("CHOSEN BY AI.")
   5. CONTINUOUS LOOP: Deterministic auto-reset & repeat
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

interface HeroSceneProps {
  onGetStarted: () => void;
  onExploreDemo: () => void;
}

/* ═══════════════════════════════════════════════════════════════════════
   SCENARIO DATA WITH VERIFIED ATTRIBUTES & CANDIDATE DESCRIPTORS
   ═══════════════════════════════════════════════════════════════════════ */

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
        explanation: "Your offer says 'Expert guidance', but doesn't clearly explain who provides the support or how quickly they respond.",
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
   DELIBERATE TIMINGS (ms)
   ═══════════════════════════════════════════════════════════════════════ */

const PHASE_DURATIONS: Record<HeroPhase, number> = {
  "idle": 300,
  "cursor-enter": 450,
  "typing": 0, // controlled by typing loop
  "search-click": 380,
  "result-1-enter": 600,
  "result-2-enter": 600,
  "result-3-merchant-enter": 700,
  "verdict-lose": 850,
  "why-unfold": 950,
  "improve-prompt": 1100,
  "ranking-shift-2": 550,
  "ranking-shift-1": 550,
  "chosen-win": 850,
  "approval": 1100,
  "term-drift": 800,
  "protected-stop": 1400,
  "final": 3800, // Ample time for multi-stage payoff, light sweep, support line, and CTA
  "reset-cycle": 500,
};

/* ═══════════════════════════════════════════════════════════════════════
   STAGE-NORMALIZED FALLBACK CURSOR POSITIONS
   Strictly within 6%..90% X, 6%..78% Y (above CTA ceiling)
   ═══════════════════════════════════════════════════════════════════════ */

const BASE_CURSOR_POSITIONS: Record<HeroPhase, { x: string; y: string }> = {
  "idle":                   { x: "8%",  y: "6%" },
  "cursor-enter":           { x: "24%", y: "8%" },
  "typing":                 { x: "42%", y: "8%" },
  "search-click":           { x: "64%", y: "8%" },
  "result-1-enter":         { x: "22%", y: "24%" },
  "result-2-enter":         { x: "22%", y: "38%" },
  "result-3-merchant-enter": { x: "22%", y: "52%" },
  "verdict-lose":           { x: "68%", y: "34%" },
  "why-unfold":             { x: "68%", y: "42%" },
  "improve-prompt":         { x: "74%", y: "68%" },
  "ranking-shift-2":         { x: "22%", y: "38%" },
  "ranking-shift-1":         { x: "22%", y: "24%" },
  "chosen-win":             { x: "22%", y: "22%" },
  "approval":               { x: "50%", y: "50%" },
  "term-drift":             { x: "50%", y: "50%" },
  "protected-stop":          { x: "50%", y: "50%" },
  "final":                  { x: "50%", y: "15%" },
  "reset-cycle":            { x: "8%",  y: "6%" },
};

const CURSOR_MODES: Record<HeroPhase, CursorMode> = {
  "idle": "idle",
  "cursor-enter": "idle",
  "typing": "searching",
  "search-click": "searching",
  "result-1-enter": "checking",
  "result-2-enter": "checking",
  "result-3-merchant-enter": "checking",
  "verdict-lose": "checking",
  "why-unfold": "checking",
  "improve-prompt": "choosing",
  "ranking-shift-2": "choosing",
  "ranking-shift-1": "choosing",
  "chosen-win": "chose",
  "approval": "chose",
  "term-drift": "checking",
  "protected-stop": "checking",
  "final": "chose",
  "reset-cycle": "idle",
};

const CURSOR_STATUS_LABELS: Record<HeroPhase, string> = {
  "idle": "AI",
  "cursor-enter": "AI",
  "typing": "AI SEARCHING",
  "search-click": "AI SEARCHING",
  "result-1-enter": "AI CHECKING #1",
  "result-2-enter": "AI CHECKING #2",
  "result-3-merchant-enter": "AI CHECKING #3",
  "verdict-lose": "AI DIAGNOSIS",
  "why-unfold": "AI DIAGNOSIS",
  "improve-prompt": "AI RE-EVALUATING",
  "ranking-shift-2": "AI RANKING",
  "ranking-shift-1": "AI CHOOSING",
  "chosen-win": "CHOSEN",
  "approval": "PURCHASING",
  "term-drift": "VALIDATING",
  "protected-stop": "STOPPED",
  "final": "PROTECTED",
  "reset-cycle": "RESETTING",
};

// Reduced motion subscription
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

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

export function HeroScene({ onGetStarted, onExploreDemo }: HeroSceneProps) {
  const [phase, setPhase] = useState<HeroPhase>("idle");
  const [scenario, setScenario] = useState<HeroScenario>(HERO_SCENARIOS[0]);
  const [typedText, setTypedText] = useState("");
  const [userFocusedResultId, setUserFocusedResultId] = useState<string | null>(null);
  const [isUserHovering, setIsUserHovering] = useState(false);
  const [priceChanged, setPriceChanged] = useState(false);
  const [isClickingCursor, setIsClickingCursor] = useState(false);
  const [isImprovementPressed, setIsImprovementPressed] = useState(false);
  const [dynamicCursorPos, setDynamicCursorPos] = useState<{ x: string; y: string } | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionServer,
  );

  const phaseIndex = HERO_PHASE_ORDER.indexOf(phase);

  // ─── Continuous auto-advance loop ───
  const advancePhase = useCallback(() => {
    setPhase((curr) => {
      const idx = HERO_PHASE_ORDER.indexOf(curr);
      if (curr === "reset-cycle" || idx === HERO_PHASE_ORDER.length - 1) {
        return "idle";
      }
      return HERO_PHASE_ORDER[idx + 1];
    });
  }, []);

  // When loop resets to idle, clean all transient states asynchronously
  useEffect(() => {
    if (phase === "idle") {
      const t = setTimeout(() => {
        setTypedText("");
        setPriceChanged(false);
        setIsClickingCursor(false);
        setIsImprovementPressed(false);
        setDynamicCursorPos(null);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Main step-timer: paused if user is actively hovering/interacting
  useEffect(() => {
    if (isUserHovering) return; // Never fight the user while inspecting

    const duration = PHASE_DURATIONS[phase];
    if (duration <= 0) return; // typing handled separately

    phaseTimerRef.current = setTimeout(
      advancePhase,
      reducedMotion ? Math.min(duration, 150) : duration,
    );
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, [phase, advancePhase, isUserHovering, reducedMotion]);

  // ─── DOM Element Bounding Measurement Helper (Relative to Animation Stage) ───
  const measureStageRelativeCenter = useCallback((elementId: string): { x: string; y: string } | null => {
    if (typeof document === "undefined" || !stageRef.current) return null;
    const stageEl = stageRef.current;
    const targetEl = document.getElementById(elementId);
    if (!stageEl || !targetEl) return null;
    const stageRect = stageEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    if (stageRect.width <= 0 || stageRect.height <= 0) return null;

    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    // Strictly clamp within stage bounds (above CTA ceiling)
    const relX = Math.min(Math.max(((targetCenterX - stageRect.left) / stageRect.width) * 100, 6), 90);
    const relY = Math.min(Math.max(((targetCenterY - stageRect.top) / stageRect.height) * 100, 6), 78);

    return {
      x: `${relX.toFixed(1)}%`,
      y: `${relY.toFixed(1)}%`,
    };
  }, []);

  // ─── Dynamic Target Coordinates for Cursor (Input, Submit, Button) ───
  useEffect(() => {
    let targetId = "";
    if (phase === "typing") {
      targetId = "hero-search-input";
    } else if (phase === "search-click") {
      targetId = "hero-search-submit-btn";
    } else if (phase === "improve-prompt") {
      targetId = "hero-try-improvement-btn";
    }

    if (targetId) {
      const pos = measureStageRelativeCenter(targetId);
      if (pos) {
        const t = setTimeout(() => setDynamicCursorPos(pos), 8);
        return () => clearTimeout(t);
      }
    } else {
      const tClear = setTimeout(() => setDynamicCursorPos(null), 0);
      return () => clearTimeout(tClear);
    }
  }, [phase, measureStageRelativeCenter]);

  // ─── Character-by-character typing animation ───
  const typingStarted = useRef(false);
  useEffect(() => {
    if (phase !== "typing") {
      typingStarted.current = false;
      return;
    }
    if (typingStarted.current) return;
    typingStarted.current = true;

    const query = scenario.query;
    let i = 0;

    requestAnimationFrame(() => setTypedText(""));

    const startTimer = setTimeout(() => {
      typingRef.current = setInterval(() => {
        i++;
        setTypedText(query.slice(0, i));
        if (i >= query.length) {
          if (typingRef.current) clearInterval(typingRef.current);
          setTimeout(advancePhase, 200);
        }
      }, reducedMotion ? 8 : 32);
    }, 16);

    return () => {
      clearTimeout(startTimer);
      if (typingRef.current) clearInterval(typingRef.current);
    };
  }, [phase, scenario.query, advancePhase, reducedMotion]);

  // ─── Cursor click on search submit ───
  useEffect(() => {
    if (phase === "search-click") {
      const t1 = setTimeout(() => setIsClickingCursor(true), 10);
      const t2 = setTimeout(() => setIsClickingCursor(false), 240);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [phase]);

  // ─── Canonical Improvement Action (Used by BOTH AI click & Human click) ───
  const handleTryImprovement = useCallback(() => {
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    setIsImprovementPressed(true);
    setTimeout(() => setIsImprovementPressed(false), 200);
    setPhase("ranking-shift-2");
  }, []);

  // ─── AI Cursor automatically clicks the actual improvement button ───
  useEffect(() => {
    if (phase === "improve-prompt") {
      const tDown = setTimeout(() => {
        setIsClickingCursor(true);
        setIsImprovementPressed(true);
      }, reducedMotion ? 80 : 450);

      const tUp = setTimeout(() => {
        setIsClickingCursor(false);
        setIsImprovementPressed(false);
        handleTryImprovement();
      }, reducedMotion ? 180 : 700);

      return () => {
        clearTimeout(tDown);
        clearTimeout(tUp);
      };
    }
  }, [phase, handleTryImprovement, reducedMotion]);

  // ─── Price change trigger during protection scene ───
  const priceChangeStarted = useRef(false);
  useEffect(() => {
    if (phase === "term-drift") {
      if (priceChangeStarted.current) return;
      priceChangeStarted.current = true;
      const t = setTimeout(() => setPriceChanged(true), reducedMotion ? 40 : 350);
      return () => clearTimeout(t);
    }
    priceChangeStarted.current = false;
    if (phaseIndex < HERO_PHASE_ORDER.indexOf("term-drift")) {
      requestAnimationFrame(() => setPriceChanged(false));
    }
  }, [phase, phaseIndex, reducedMotion]);

  // ─── Scenario switch: immediately resets state and starts fresh sequence ───
  const switchScenario = useCallback((s: HeroScenario) => {
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    if (typingRef.current) clearInterval(typingRef.current);
    setScenario(s);
    setPhase("idle");
    setTypedText("");
    setUserFocusedResultId(null);
    setIsUserHovering(false);
    setPriceChanged(false);
    setIsClickingCursor(false);
    setIsImprovementPressed(false);
    setDynamicCursorPos(null);
  }, []);

  // ─── User Hover Management: pauses autoplay choreography without fighting user ───
  const handleUserHoverResult = useCallback((id: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setUserFocusedResultId(id);
    setIsUserHovering(true);
  }, []);

  const handleUserLeaveResult = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsUserHovering(false);
      setUserFocusedResultId(null);
    }, 1500);
  }, []);

  /* ═══════════════════════════════════════════════════════════════════
     STRICT MUTUALLY EXCLUSIVE NARRATIVE SCENE DISPATCH
     ═══════════════════════════════════════════════════════════════════ */
  const isSearchScene = phaseIndex <= HERO_PHASE_ORDER.indexOf("chosen-win") && phase !== "reset-cycle";
  const isPurchaseScene = phase === "approval";
  const isProtectionScene = phase === "term-drift" || phase === "protected-stop";
  const isPayoffScene = phase === "final";

  // Sub-states within Search Scene
  const showSearchInput = isSearchScene;
  const isSearchActive = phase === "typing" || phase === "search-click";
  const hasResult1 = isSearchScene && phaseIndex >= HERO_PHASE_ORDER.indexOf("result-1-enter");
  const hasResult2 = isSearchScene && phaseIndex >= HERO_PHASE_ORDER.indexOf("result-2-enter");
  const hasResult3 = isSearchScene && phaseIndex >= HERO_PHASE_ORDER.indexOf("result-3-merchant-enter");
  const showAnyResults = hasResult1 || hasResult2 || hasResult3;

  // Exact Rank State: starts strictly at #3, becomes #2 in ranking-shift-2, and #1 in ranking-shift-1 onwards
  const merchantRank = phase === "ranking-shift-2"
    ? 2
    : (phase === "ranking-shift-1" || phaseIndex >= HERO_PHASE_ORDER.indexOf("ranking-shift-1"))
      ? 1
      : 3;

  const showChosen = phase === "chosen-win";
  const isProtectedStop = phaseIndex >= HERO_PHASE_ORDER.indexOf("protected-stop");

  // Dynamic slot positioning for vertical list
  const getMerchantSlot = (): number => {
    return merchantRank - 1; // Rank 1 -> Slot 0, Rank 2 -> Slot 1, Rank 3 -> Slot 2
  };

  const getOtherSlot = (originalIdx: number): number => {
    if (merchantRank === 3) return originalIdx;
    if (merchantRank === 2) return originalIdx === 0 ? 0 : 2;
    if (merchantRank === 1) return originalIdx === 0 ? 1 : 2;
    return originalIdx;
  };

  const getOtherRankNumber = (originalIdx: number): number => {
    return getOtherSlot(originalIdx) + 1;
  };

  // Focused Result for Product Spotlight Stage
  const getActiveFocusedId = (): string => {
    if (userFocusedResultId) return userFocusedResultId;
    if (showChosen || phase === "ranking-shift-1" || phase === "ranking-shift-2" || phaseIndex >= HERO_PHASE_ORDER.indexOf("result-3-merchant-enter")) {
      return scenario.results[2].id; // Merchant
    }
    if (phase === "result-2-enter") {
      return scenario.results[1].id;
    }
    if (phase === "result-1-enter") {
      return scenario.results[0].id;
    }
    return scenario.results[2].id;
  };

  const activeFocusedId = getActiveFocusedId();
  const focusedResult = scenario.results.find((r) => r.id === activeFocusedId) || scenario.results[2];
  const isMerchantFocused = focusedResult.isMerchant;

  const focusedRank = isMerchantFocused
    ? merchantRank
    : getOtherRankNumber(focusedResult.id === scenario.results[0].id ? 0 : 1);

  const isDiagnosisPhase = phase === "verdict-lose" || phase === "why-unfold";
  const isImprovePhase = phase === "improve-prompt";

  // Cursor properties: only visible in Search Scene
  const basePos = BASE_CURSOR_POSITIONS[phase];
  const cursorPos = dynamicCursorPos || basePos;
  const cursorMode = CURSOR_MODES[phase];
  const cursorStatusLabel = CURSOR_STATUS_LABELS[phase];
  const showCursor = isSearchScene && phaseIndex >= 1 && !isUserHovering;

  return (
    <MGScene ambientColor="rgba(11, 92, 255, 0.08)" ambientPosition="center">
      <div
        style={{
          position: "relative",
          maxWidth: "1160px",
          margin: "0 auto",
          padding: "16px 20px 0",
          minHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {/* ═══ HEADLINE ═══ */}
        <MGBlurFade delay={0}>
          <h1
            style={{
              fontSize: "clamp(2.3rem, 5.2vw, 4.4rem)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1.06,
              textAlign: "center",
              marginTop: "12px",
              marginBottom: "12px",
              maxWidth: "840px",
              marginLeft: "auto",
              marginRight: "auto",
              color: "var(--mg-text)",
            }}
          >
            The next buyer might be AI.
          </h1>
        </MGBlurFade>

        <MGBlurFade delay={100}>
          <p
            style={{
              textAlign: "center",
              fontSize: "clamp(0.95rem, 1.35vw, 1.12rem)",
              color: "var(--mg-text-secondary)",
              maxWidth: "560px",
              margin: "0 auto 16px",
              lineHeight: 1.55,
            }}
          >
            Make sure it can find you, understand you and choose you.
            <span className="sr-only"> Make it easier for AI buyers to choose you.</span>
          </p>
        </MGBlurFade>

        {/* ═══ SCENARIO SELECTOR ═══ */}
        <MGBlurFade delay={180}>
          <div
            role="tablist"
            aria-label="AI buyer scenarios"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
          >
            {HERO_SCENARIOS.map((s) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={scenario.id === s.id}
                onClick={() => switchScenario(s)}
                style={{
                  padding: "7px 16px",
                  borderRadius: "99px",
                  border: scenario.id === s.id
                    ? "1px solid rgba(11, 92, 255, 0.6)"
                    : "1px solid var(--mg-border)",
                  background: scenario.id === s.id
                    ? "rgba(11, 92, 255, 0.14)"
                    : "var(--mg-surface)",
                  color: scenario.id === s.id ? "#0B5CFF" : "var(--mg-text-secondary)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {s.tabLabel}
              </button>
            ))}
          </div>
        </MGBlurFade>

        {/* ═══════════════════════════════════════════════════════════════
            DEDICATED HERO ANIMATION STAGE (.hero-animation-stage)
            Strict clipping boundary & coordinate container above CTA
            ═══════════════════════════════════════════════════════════════ */}
        <div
          ref={stageRef}
          className="hero-animation-stage"
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "1120px",
            margin: "0 auto",
            minHeight: "510px",
            height: "530px",
            overflow: "hidden", // Stage is the sole clipping boundary
            borderRadius: "22px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* ═══════════════════════════════════════════════════════════
              SCENE 1: SEARCH & PRODUCT SPOTLIGHT STAGE (21ST.DEV PATTERN)
              ═══════════════════════════════════════════════════════════ */}
          {isSearchScene && (
            <div
              className="hero-search-scene"
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                animation: reducedMotion ? "none" : "hero-scene-fade-in 0.35s ease forwards",
              }}
            >
              {/* AI Shopper Protagonist Cursor */}
              <AICursor
                x={cursorPos.x}
                y={cursorPos.y}
                mode={cursorMode}
                statusLabel={cursorStatusLabel}
                isClicking={isClickingCursor}
                visible={showCursor}
                reducedMotion={reducedMotion}
              />

              {/* ─── SEARCH BAR ON TOP ─── */}
              {showSearchInput && (
                <div
                  style={{
                    position: "relative",
                    maxWidth: "740px",
                    width: "100%",
                    margin: "4px auto 14px",
                    zIndex: 10,
                  }}
                >
                  <div
                    id="hero-search-input"
                    style={{
                      background: "var(--mg-glass-1-bg)",
                      backdropFilter: "blur(18px)",
                      WebkitBackdropFilter: "blur(18px)",
                      border: isSearchActive
                        ? "1px solid rgba(11, 92, 255, 0.65)"
                        : "1px solid var(--mg-glass-1-border)",
                      borderRadius: "16px",
                      padding: "14px 20px",
                      minHeight: "56px",
                      boxShadow: isSearchActive
                        ? "0 0 28px rgba(11, 92, 255, 0.22), inset 0 0 12px rgba(11, 92, 255, 0.05)"
                        : "var(--mg-glass-1-shadow)",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    }}
                  >
                    <span style={{ fontSize: "17px", opacity: 0.75, flexShrink: 0 }}>🔍</span>
                    <div
                      style={{
                        flex: 1,
                        fontSize: "clamp(14px, 1.2vw, 15.5px)",
                        fontWeight: 600,
                        color: typedText ? "var(--mg-text)" : "var(--mg-text-muted)",
                        minHeight: "24px",
                        fontFamily: "var(--font-inter), system-ui, sans-serif",
                        display: "flex",
                        alignItems: "center",
                        overflowX: "auto",
                        whiteSpace: "nowrap",
                        scrollbarWidth: "none",
                      }}
                    >
                      {typedText || (phase === "idle" || phase === "cursor-enter" ? "Search for courses, tools, coaching..." : scenario.query)}
                      {phase === "typing" && (
                        <span
                          style={{
                            display: "inline-block",
                            width: "2px",
                            height: "18px",
                            background: "#0B5CFF",
                            marginLeft: "2px",
                            flexShrink: 0,
                            animation: reducedMotion ? "none" : "hero-blink 0.8s step-end infinite",
                          }}
                        />
                      )}
                    </div>

                    <button
                      id="hero-search-submit-btn"
                      type="button"
                      tabIndex={-1}
                      aria-label="Submit search query"
                      style={{
                        flexShrink: 0,
                        padding: "8px 18px",
                        borderRadius: "10px",
                        background: phase === "search-click" ? "#004DE6" : "#0B5CFF",
                        border: "none",
                        color: "white",
                        fontSize: "12px",
                        fontWeight: 800,
                        cursor: "default",
                        transform: phase === "search-click" ? "scale(0.92)" : "scale(1)",
                        boxShadow: phase === "search-click" ? "0 0 20px rgba(11, 92, 255, 0.6)" : "0 0 10px rgba(11, 92, 255, 0.25)",
                        transition: "transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease",
                      }}
                    >
                      Search
                    </button>
                  </div>

                  <div
                    style={{
                      position: "absolute",
                      top: "-8px",
                      left: "20px",
                      fontSize: "9px",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#0B5CFF",
                      background: "var(--mg-bg)",
                      padding: "1px 8px",
                      borderRadius: "4px",
                      border: "1px solid rgba(11, 92, 255, 0.25)",
                    }}
                  >
                    {showAnyResults ? "RESULTS FOUND" : (phase === "search-click" ? "SEARCHING..." : "AI BUYER SEARCH")}
                  </div>
                </div>
              )}

              {/* ─── 21ST.DEV PRODUCT SPOTLIGHT STAGE (FEED + FOCUSED PRODUCT) ─── */}
              {showAnyResults && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.35fr",
                    gap: "24px",
                    alignItems: "start",
                    zIndex: 8,
                    position: "relative",
                    marginTop: "2px",
                  }}
                >
                  {/* LEFT COLUMN: DISCOVERED PRODUCTS FEED */}
                  <div>
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "var(--mg-text-muted)",
                        marginBottom: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span>📋</span> DISCOVERED OFFERS (3 CANDIDATES)
                    </div>

                    {/* Vertical Feed Container */}
                    <div
                      style={{ position: "relative", minHeight: "330px" }}
                      onMouseLeave={handleUserLeaveResult}
                    >
                      {/* Result 1 (System Design Pro) */}
                      {hasResult1 && (
                        <AIShoppingResult
                          id={scenario.results[0].id}
                          rank={getOtherRankNumber(0)}
                          title={scenario.results[0].title}
                          price={scenario.results[0].price}
                          pricePerMonth={scenario.results[0].pricePerMonth}
                          shortDescriptor={scenario.results[0].shortDescriptor}
                          isMerchant={false}
                          isChosen={showChosen && merchantRank !== 1 && focusedResult.id === scenario.results[0].id}
                          isFocused={activeFocusedId === scenario.results[0].id}
                          isDimmed={activeFocusedId !== scenario.results[0].id}
                          slotIndex={getOtherSlot(0)}
                          onClick={() => handleUserHoverResult(scenario.results[0].id)}
                          onMouseEnter={() => handleUserHoverResult(scenario.results[0].id)}
                          onFocus={() => handleUserHoverResult(scenario.results[0].id)}
                          reducedMotion={reducedMotion}
                        />
                      )}

                      {/* Result 2 (Interview Accelerator) */}
                      {hasResult2 && (
                        <AIShoppingResult
                          id={scenario.results[1].id}
                          rank={getOtherRankNumber(1)}
                          title={scenario.results[1].title}
                          price={scenario.results[1].price}
                          pricePerMonth={scenario.results[1].pricePerMonth}
                          shortDescriptor={scenario.results[1].shortDescriptor}
                          isMerchant={false}
                          isChosen={false}
                          isFocused={activeFocusedId === scenario.results[1].id}
                          isDimmed={activeFocusedId !== scenario.results[1].id}
                          slotIndex={getOtherSlot(1)}
                          onClick={() => handleUserHoverResult(scenario.results[1].id)}
                          onMouseEnter={() => handleUserHoverResult(scenario.results[1].id)}
                          onFocus={() => handleUserHoverResult(scenario.results[1].id)}
                          reducedMotion={reducedMotion}
                        />
                      )}

                      {/* Result 3 (YOUR BUSINESS — Merchant) */}
                      {hasResult3 && (
                        <AIShoppingResult
                          id={scenario.results[2].id}
                          rank={merchantRank}
                          title={scenario.results[2].title}
                          price={scenario.results[2].price}
                          pricePerMonth={scenario.results[2].pricePerMonth}
                          shortDescriptor={scenario.results[2].shortDescriptor}
                          isMerchant={true}
                          isChosen={showChosen}
                          isFocused={activeFocusedId === scenario.results[2].id}
                          isDimmed={activeFocusedId !== scenario.results[2].id}
                          slotIndex={getMerchantSlot()}
                          onClick={() => handleUserHoverResult(scenario.results[2].id)}
                          onMouseEnter={() => handleUserHoverResult(scenario.results[2].id)}
                          onFocus={() => handleUserHoverResult(scenario.results[2].id)}
                          reducedMotion={reducedMotion}
                        />
                      )}
                    </div>
                  </div>

                  {/* RIGHT COLUMN: DOMINANT PRODUCT SPOTLIGHT (21ST.DEV) */}
                  <div>
                    <ProductSpotlight
                      resultTitle={focusedResult.title}
                      rank={focusedRank}
                      price={focusedResult.price}
                      pricePerMonth={focusedResult.pricePerMonth}
                      shortDescriptor={focusedResult.shortDescriptor}
                      isMerchant={focusedResult.isMerchant}
                      good={focusedResult.good}
                      missing={focusedResult.missing}
                      explanation={focusedResult.explanation}
                      buyerWanted={scenario.buyerWanted}
                      improvedTo={scenario.improvedTo}
                      isDiagnosis={isDiagnosisPhase && isMerchantFocused}
                      isImprovement={isImprovePhase && isMerchantFocused}
                      isImprovementPressed={isImprovementPressed && isMerchantFocused}
                      isChosen={showChosen && isMerchantFocused}
                      onTryImprovement={handleTryImprovement}
                      reducedMotion={reducedMotion}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              SCENE 2: PURCHASE APPROVAL SCENE (OWNS STAGE CLEANLY)
              ═══════════════════════════════════════════════════════════ */}
          {isPurchaseScene && (
            <div
              className="hero-purchase-scene"
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 14,
                animation: reducedMotion ? "none" : "hero-scene-fade-in 0.4s ease forwards",
              }}
            >
              <div
                style={{
                  background: "var(--mg-glass-2-bg)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  border: "1px solid var(--mg-glass-2-border)",
                  borderRadius: "24px",
                  padding: "32px 38px",
                  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25), var(--mg-glass-2-shadow)",
                  maxWidth: "480px",
                  width: "90%",
                  textAlign: "center",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: "rgba(11, 92, 255, 0.15)",
                        border: "1px solid rgba(11, 92, 255, 0.3)",
                        color: "#0B5CFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        fontSize: "11px",
                      }}
                    >
                      SD
                    </div>
                    <span style={{ fontSize: "18px", fontWeight: 900, color: "var(--mg-text)" }}>
                      System Design Pro
                    </span>
                  </div>
                  <ShieldIcon size={30} active />
                </div>

                <div style={{ fontSize: "32px", fontWeight: 900, color: "#0B5CFF", marginBottom: "14px", letterSpacing: "-0.03em" }}>
                  ₹3,499
                  <span style={{ fontSize: "15px", fontWeight: 500, color: "var(--mg-text-secondary)" }}>
                    /month
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "var(--mg-success)",
                    background: "var(--mg-success-soft)",
                    border: "1px solid var(--mg-success-border)",
                    borderRadius: "10px",
                    padding: "8px 16px",
                    display: "inline-flex",
                    gap: "8px",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span>✓</span> Within buyer limit · APPROVED
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              SCENE 3: MANDATEGUARD PROTECTION SCENE (PHYSICAL STOP)
              ═══════════════════════════════════════════════════════════ */}
          {isProtectionScene && (
            <div
              className="hero-protection-scene"
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 14,
                animation: reducedMotion ? "none" : "hero-scene-fade-in 0.4s ease forwards",
              }}
            >
              <div
                style={{
                  background: "var(--mg-glass-2-bg)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  border: isProtectedStop
                    ? "1px solid var(--mg-critical-border)"
                    : "1px solid var(--mg-glass-2-border)",
                  borderRadius: "24px",
                  padding: "32px 38px",
                  boxShadow: isProtectedStop
                    ? "0 20px 65px rgba(239, 68, 68, 0.28)"
                    : "0 20px 60px rgba(0, 0, 0, 0.25)",
                  maxWidth: "480px",
                  width: "90%",
                  textAlign: "center",
                  animation: isProtectedStop && !reducedMotion ? "hero-protection-impact 0.45s ease" : "none",
                  transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: isProtectedStop ? "rgba(239, 68, 68, 0.15)" : "rgba(11, 92, 255, 0.15)",
                        border: isProtectedStop ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(11, 92, 255, 0.3)",
                        color: isProtectedStop ? "var(--mg-critical)" : "#0B5CFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        fontSize: "11px",
                      }}
                    >
                      SD
                    </div>
                    <span style={{ fontSize: "18px", fontWeight: 900, color: "var(--mg-text)" }}>
                      System Design Pro
                    </span>
                  </div>
                  <ShieldIcon size={32} blocked={isProtectedStop} active={!isProtectedStop} />
                </div>

                <div style={{ fontSize: "32px", fontWeight: 900, color: priceChanged ? "var(--mg-critical)" : "#0B5CFF", marginBottom: "16px", letterSpacing: "-0.03em" }}>
                  {priceChanged ? "₹4,129" : "₹3,499"}
                  <span style={{ fontSize: "15px", fontWeight: 500, color: "var(--mg-text-secondary)" }}>
                    /month
                  </span>
                  {priceChanged && (
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--mg-critical)", marginLeft: "10px", textDecoration: "line-through", opacity: 0.6 }}>
                      ₹3,499
                    </span>
                  )}
                </div>

                {isProtectedStop && (
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: 900, color: "var(--mg-critical)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "4px" }}>
                      <span>🛡️</span> PAYMENT STOPPED
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--mg-text-secondary)" }}>
                      NO MONEY WAS MOVED.
                    </div>
                  </div>
                )}
              </div>

              <div style={{ textAlign: "center", marginTop: "14px", fontSize: "11px", fontWeight: 800, color: "var(--mg-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                MandateGuard Policy Intercept
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              SCENE 4: CINEMATIC HERO PAYOFF (M10-HERO-012)
              "BE THE BUSINESS AI CHOOSES."
              "Get found. Get understood. Stay protected."
              ═══════════════════════════════════════════════════════════ */}
          {isPayoffScene && (
            <div
              className="hero-payoff-scene"
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "24px 16px",
                zIndex: 12,
                overflow: "hidden",
              }}
            >
              {/* Soft brand-color radial illumination sweeping behind 'AI' */}
              {!reducedMotion && (
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: "35%",
                    left: "50%",
                    width: "320px",
                    height: "220px",
                    marginLeft: "-160px",
                    marginTop: "-110px",
                    background: "radial-gradient(circle, rgba(11, 92, 255, 0.25) 0%, rgba(11, 92, 255, 0.05) 50%, transparent 70%)",
                    animation: "hero-ai-glow-sweep 1.8s ease 0.5s forwards",
                    pointerEvents: "none",
                  }}
                />
              )}

              {/* Primary Headline: BE THE BUSINESS AI CHOOSES. */}
              <h2
                style={{
                  fontSize: "clamp(2.4rem, 5.8vw, 4.4rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.08,
                  maxWidth: "880px",
                  color: "var(--mg-text)",
                  margin: "0 auto",
                  zIndex: 1,
                  display: "flex",
                  gap: "0.28em",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    animation: reducedMotion ? "none" : "hero-editorial-stagger 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0ms forwards",
                    opacity: reducedMotion ? 1 : 0,
                  }}
                >
                  BE THE BUSINESS
                </span>
                <span
                  style={{
                    display: "inline-block",
                    color: "#0B5CFF",
                    animation: reducedMotion ? "none" : "hero-editorial-stagger 0.65s cubic-bezier(0.16, 1, 0.3, 1) 150ms forwards",
                    opacity: reducedMotion ? 1 : 0,
                    textShadow: "0 0 32px rgba(11, 92, 255, 0.35)",
                  }}
                >
                  AI
                </span>
                <span
                  style={{
                    display: "inline-block",
                    animation: reducedMotion ? "none" : "hero-editorial-stagger 0.65s cubic-bezier(0.16, 1, 0.3, 1) 300ms forwards",
                    opacity: reducedMotion ? 1 : 0,
                  }}
                >
                  CHOOSES.
                </span>
              </h2>

              {/* Secondary Supporting Line: Get found. Get understood. Stay protected. */}
              <p
                style={{
                  marginTop: "16px",
                  fontSize: "clamp(0.95rem, 1.4vw, 1.18rem)",
                  fontWeight: 600,
                  color: "var(--mg-text-secondary)",
                  letterSpacing: "-0.01em",
                  maxWidth: "600px",
                  zIndex: 1,
                  animation: reducedMotion ? "none" : "hero-support-line-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) 850ms forwards",
                  opacity: reducedMotion ? 1 : 0,
                }}
              >
                Get found. Get understood. Stay <span style={{ color: "#0B5CFF", fontWeight: 700 }}>protected.</span>
              </p>

              {/* Payoff CTA Row */}
              <div
                style={{
                  marginTop: "24px",
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  zIndex: 1,
                  animation: reducedMotion ? "none" : "hero-payoff-cta-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) 1300ms forwards",
                  opacity: reducedMotion ? 1 : 0,
                }}
              >
                <button
                  onClick={onGetStarted}
                  aria-label="Get started"
                  style={{
                    padding: "10px 24px",
                    borderRadius: "12px",
                    border: "none",
                    background: "#0B5CFF",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 0 24px rgba(11, 92, 255, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "transform 0.15s ease",
                  }}
                >
                  Get started <span aria-hidden="true">→</span>
                </button>
                <button
                  onClick={onExploreDemo}
                  aria-label="See how it works"
                  style={{
                    padding: "10px 24px",
                    borderRadius: "12px",
                    border: "1px solid var(--mg-border)",
                    background: "var(--mg-surface)",
                    color: "var(--mg-text)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  See how it works
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            HERO CTA AREA (.hero-cta)
            Completely outside .hero-animation-stage (stable normal flow)
            ═══════════════════════════════════════════════════════════════ */}
        <div
          className="hero-cta"
          style={{
            position: "relative",
            marginTop: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 20,
          }}
        >
          {/* Primary CTA Row */}
          <MGBlurFade delay={250}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom: "12px",
              }}
            >
              <button
                onClick={onGetStarted}
                aria-label="Get started"
                style={{
                  padding: "14px 32px",
                  borderRadius: "14px",
                  border: "none",
                  background: "#0B5CFF",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 0 30px rgba(11, 92, 255, 0.35)",
                  transition: "transform 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                Get started <span aria-hidden="true">→</span>
              </button>
              <button
                onClick={onExploreDemo}
                aria-label="See how it works"
                style={{
                  padding: "14px 32px",
                  borderRadius: "14px",
                  border: "1px solid var(--mg-border)",
                  background: "var(--mg-surface)",
                  color: "var(--mg-text)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                See how it works
              </button>
            </div>
          </MGBlurFade>

          {/* Trust Badges */}
          <div
            style={{
              textAlign: "center",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--mg-text-muted)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <ShieldIcon size={14} active /> Protected by MandateGuard
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 500,
                color: "var(--mg-text-muted)",
                opacity: 0.7,
              }}
            >
              Razorpay Test Mode
            </span>
          </div>
        </div>
      </div>
    </MGScene>
  );
}
