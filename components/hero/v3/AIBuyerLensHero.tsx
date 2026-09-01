"use client";

import React, { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";

/* ═══════════════════════════════════════════════════════════════════════
   M19 — COMPOSITION RESET
   ONE commercial offer as protagonist. No lens metaphor.
   Premium product demonstration with Apple/Stripe-level visual precision.
   ═══════════════════════════════════════════════════════════════════════ */

export type HeroPhase =
  | "idle"
  | "headline-reveal"
  | "buyer-intent"
  | "offer-present"
  | "inspection"
  | "verdict-reveal"
  | "verdict-reason"
  | "improvement"
  | "improvement-done"
  | "rank-2"
  | "rank-1"
  | "chosen"
  | "snapshot-capture"
  | "snapshot-locked"
  | "authorization"
  | "price-mutation"
  | "mutation-detected"
  | "payment-stopped"
  | "payoff"
  | "reset";

export const HERO_PHASE_ORDER: HeroPhase[] = [
  "idle",
  "headline-reveal",
  "buyer-intent",
  "offer-present",
  "inspection",
  "verdict-reveal",
  "verdict-reason",
  "improvement",
  "improvement-done",
  "rank-2",
  "rank-1",
  "chosen",
  "snapshot-capture",
  "snapshot-locked",
  "authorization",
  "price-mutation",
  "mutation-detected",
  "payment-stopped",
  "payoff",
  "reset",
];

const PHASE_DURATIONS: Record<HeroPhase, number> = {
  "idle": 400,
  "headline-reveal": 1000,
  "buyer-intent": 1200,
  "offer-present": 800,
  "inspection": 2000,
  "verdict-reveal": 1200,
  "verdict-reason": 1400,
  "improvement": 300,
  "improvement-done": 1000,
  "rank-2": 700,
  "rank-1": 700,
  "chosen": 1000,
  "snapshot-capture": 800,
  "snapshot-locked": 600,
  "authorization": 700,
  "price-mutation": 1000,
  "mutation-detected": 600,
  "payment-stopped": 1800,
  "payoff": 3000,
  "reset": 400,
};

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
   BUYER INTENT — Pure text, no card
   ═══════════════════════════════════════════════════════════════════════ */

interface BuyerIntentProps {
  visible: boolean;
  text: string;
}

function BuyerIntent({ visible, text }: BuyerIntentProps) {
  if (!visible) return null;

  return (
    <div
      style={{
        fontFamily: "var(--font-space-grotesk), sans-serif",
        fontSize: "clamp(1rem, 2vw, 1.25rem)",
        fontWeight: 500,
        fontStyle: "italic",
        color: "var(--mg-text-secondary)",
        textAlign: "center",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease",
        maxWidth: "600px",
      }}
    >
      &ldquo;{text}&rdquo;
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   INSPECTION FACTS — Small facts appearing around the offer
   ═══════════════════════════════════════════════════════════════════════ */

interface InspectionFactsProps {
  visible: boolean;
  facts: { label: string; value: string; status: "verified" | "unclear" }[];
}

function InspectionFacts({ visible, facts }: InspectionFactsProps) {
  if (!visible) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        position: "absolute",
        right: "-180px",
        top: "50%",
        transform: "translateY(-50%)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}
    >
      {facts.map((fact, i) => (
        <div
          key={fact.label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            opacity: visible ? 1 : 0,
            transition: `opacity 0.3s ease ${i * 150}ms`,
          }}
        >
          <div
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: fact.status === "verified" ? "var(--mg-success)" : "var(--mg-warning)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {fact.status === "verified" ? (
              <svg width="8" height="8" viewBox="0 0 10 10">
                <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            ) : (
              <span style={{ fontSize: "10px", fontWeight: 900, color: "white" }}>?</span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--mg-text-muted)" }}>
              {fact.label}
            </span>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: fact.status === "verified" ? "var(--mg-success)" : "var(--mg-warning)" }}>
              {fact.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   RANKING BADGE — #3, #2, #1
   ═══════════════════════════════════════════════════════════════════════ */

interface RankingBadgeProps {
  rank: number | null;
  visible: boolean;
}

function RankingBadge({ rank, visible }: RankingBadgeProps) {
  if (!visible || rank === null) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: "-40px",
        left: "50%",
        fontFamily: "var(--font-space-grotesk), sans-serif",
        fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
        fontWeight: 900,
        letterSpacing: "-0.05em",
        color: rank === 3 ? "var(--mg-warning)" : rank === 2 ? "var(--mg-text-secondary)" : "var(--mg-success)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease, transform 0.4s ease, color 0.4s ease",
        transform: `translateX(-50%) ${visible ? "scale(1)" : "scale(0.8)"}`,
      }}
    >
      #{rank}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   THE COMMERCIAL OFFER — Our protagonist
   Transforms through all states: present → inspection → chosen → authorized → protected
   ═══════════════════════════════════════════════════════════════════════ */

interface OfferObjectProps {
  title: string;
  pricePerMonth: string;
  features: string[];
  improvedFeatures: string[];
  inspectionStates: Record<string, "pending" | "verified" | "unclear">;
  isImproving: boolean;
  isChosen: boolean;
  isAuthorized: boolean;
  isMutating: boolean;
  mutatedPrice: string | null;
  showOriginal: boolean;
}

function OfferObject({
  title,
  pricePerMonth,
  features,
  improvedFeatures,
  inspectionStates,
  isImproving,
  isChosen,
  isAuthorized,
  isMutating,
  mutatedPrice,
  showOriginal,
}: OfferObjectProps) {
  const currentFeatures = showOriginal || !isImproving ? features : improvedFeatures;
  const displayPrice = isMutating && mutatedPrice ? mutatedPrice : pricePerMonth;

  return (
    <div
      style={{
        position: "relative",
        background: isAuthorized
          ? "linear-gradient(145deg, rgba(16, 185, 129, 0.1), var(--mg-glass-2-bg))"
          : isChosen
          ? "linear-gradient(145deg, rgba(16, 185, 129, 0.08), var(--mg-glass-2-bg))"
          : "var(--mg-glass-2-bg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: isChosen || isAuthorized
          ? "1px solid rgba(16, 185, 129, 0.4)"
          : "1px solid var(--mg-glass-2-border)",
        borderRadius: "20px",
        padding: "clamp(20px, 3vw, 28px)",
        boxShadow: isChosen || isAuthorized
          ? "0 20px 60px rgba(16, 185, 129, 0.2), var(--mg-glass-2-shadow)"
          : "0 12px 40px rgba(0, 0, 0, 0.3), var(--mg-glass-2-shadow)",
        minWidth: "320px",
        maxWidth: "380px",
        transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: isChosen ? "scale(1.02)" : "scale(1)",
      }}
    >
      {/* Storefront label */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "16px",
      }}>
        <div style={{
          width: "28px",
          height: "28px",
          borderRadius: "8px",
          background: isChosen || isAuthorized
            ? "linear-gradient(135deg, #10B981, #059669)"
            : "linear-gradient(135deg, #0B5CFF, #004DE6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          fontSize: "11px",
          color: "white",
        }}>
          IF
        </div>
        <span style={{
          fontSize: "0.6rem",
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: isChosen || isAuthorized ? "var(--mg-success)" : "var(--mg-brand)",
        }}>
          YOUR BUSINESS
        </span>
      </div>

      {/* Product title */}
      <h3 style={{
        fontFamily: "var(--font-space-grotesk), sans-serif",
        fontSize: "clamp(1.2rem, 2.2vw, 1.5rem)",
        fontWeight: 800,
        letterSpacing: "-0.03em",
        color: "var(--mg-text)",
        margin: "0 0 8px",
      }}>
        {title}
      </h3>

      {/* Price */}
      <div style={{ marginBottom: "16px", position: "relative" }}>
        <span style={{
          fontFamily: "var(--font-space-grotesk), sans-serif",
          fontSize: "clamp(1.6rem, 3vw, 2rem)",
          fontWeight: 900,
          letterSpacing: "-0.04em",
          color: isMutating ? "var(--mg-critical)" : isChosen || isAuthorized ? "var(--mg-success)" : "var(--mg-brand)",
          transition: "color 0.3s ease",
        }}>
          {displayPrice}
        </span>
        {isMutating && (
          <>
            <div style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: "2px",
              background: "var(--mg-critical)",
              transform: "rotate(-1deg)",
              opacity: 0.6,
            }} />
            <span style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: "clamp(1rem, 1.5vw, 1.2rem)",
              fontWeight: 600,
              color: "var(--mg-text-muted)",
              textDecoration: "line-through",
              marginLeft: "8px",
            }}>
              {pricePerMonth}
            </span>
          </>
        )}
      </div>

      {/* Features */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {currentFeatures.map((feature) => {
          const key = feature.toLowerCase().split(" ")[0];
          const state = inspectionStates[key] || "pending";
          return (
            <div
              key={feature}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 0",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                opacity: isImproving ? 1 : 0.8,
                transform: isImproving ? "translateY(0)" : "translateY(0)",
                transition: "opacity 0.3s ease",
              }}
            >
              <div style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: state === "verified" ? "var(--mg-success)" : state === "unclear" ? "var(--mg-warning)" : "var(--mg-surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                {state === "verified" ? (
                  <svg width="6" height="6" viewBox="0 0 10 10">
                    <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                ) : state === "unclear" ? (
                  <span style={{ fontSize: "8px", fontWeight: 900, color: "white" }}>?</span>
                ) : null}
              </div>
              <span style={{
                fontSize: "0.8rem",
                fontWeight: 500,
                color: state === "verified" ? "var(--mg-success)" : state === "unclear" ? "var(--mg-warning)" : "var(--mg-text-secondary)",
              }}>
                {feature}
              </span>
            </div>
          );
        })}
      </div>

      {/* Authorized label */}
      {isAuthorized && !isMutating && (
        <div style={{
          marginTop: "16px",
          padding: "8px 12px",
          borderRadius: "8px",
          background: "rgba(16, 185, 129, 0.1)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          textAlign: "center",
        }}>
          <span style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--mg-success)",
          }}>
            AUTHORIZED
          </span>
        </div>
      )}

      {/* Mutation warning */}
      {isMutating && (
        <div style={{
          marginTop: "16px",
          padding: "8px 12px",
          borderRadius: "8px",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          textAlign: "center",
        }}>
          <span style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--mg-critical)",
          }}>
            UNAUTHORIZED CHANGE DETECTED
          </span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MANDATE SNAPSHOT — Compact authorization seal
   ═══════════════════════════════════════════════════════════════════════ */

interface MandateSnapshotProps {
  visible: boolean;
  isLocked: boolean;
  isMutating: boolean;
}

function MandateSnapshot({ visible, isLocked, isMutating }: MandateSnapshotProps) {
  const stateColor = isMutating ? "#F59E0B" : isLocked ? "#10B981" : "#0B5CFF";

  if (!visible) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.9)",
        transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Compact seal */}
      <div style={{
        position: "relative",
        width: "100px",
        height: "100px",
      }}>
        <svg viewBox="0 0 100 100" fill="none" style={{ width: "100%", height: "100%" }}>
          {/* Outer ring */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke={stateColor}
            strokeWidth="1"
            strokeDasharray={isLocked ? "none" : "4 3"}
            opacity={isLocked ? 0.8 : 0.4}
          />
          {/* Middle ring */}
          <circle
            cx="50"
            cy="50"
            r="36"
            stroke={stateColor}
            strokeWidth="1.5"
            opacity={isLocked ? 0.9 : 0.5}
          />
          {/* Inner filled circle */}
          <circle
            cx="50"
            cy="50"
            r="24"
            fill={`${stateColor}15`}
            stroke={stateColor}
            strokeWidth="1"
          />
          {/* Check or pulse */}
          {isLocked && !isMutating ? (
            <path d="M38 50L45 57L62 43" stroke={stateColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          ) : isMutating ? (
            <>
              <path d="M38 38L62 62M62 38L38 62" stroke={stateColor} strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : null}
        </svg>
        {/* Pulse ring when mutating */}
        {isMutating && (
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90px",
            height: "90px",
            borderRadius: "50%",
            border: `2px solid ${stateColor}`,
            animation: "snapshot-pulse 0.8s ease-out infinite",
          }} />
        )}
      </div>

      {/* Label */}
      <div style={{
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: "0.55rem",
        fontWeight: 700,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: stateColor,
        padding: "4px 12px",
        borderRadius: "99px",
        background: `${stateColor}12`,
        border: `1px solid ${stateColor}30`,
      }}>
        MANDATE SNAPSHOT — {isLocked ? "LOCKED" : isMutating ? "MISMATCH" : "CAPTURING"}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PAYMENT STOPPED — The visual climax
   ═══════════════════════════════════════════════════════════════════════ */

interface PaymentStoppedProps {
  visible: boolean;
}

function PaymentStopped({ visible }: PaymentStoppedProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div style={{
        fontFamily: "var(--font-space-grotesk), sans-serif",
        fontSize: "clamp(1.4rem, 3vw, 2rem)",
        fontWeight: 900,
        letterSpacing: "-0.04em",
        color: "var(--mg-critical)",
      }}>
        PAYMENT STOPPED
      </div>
      <div style={{
        fontSize: "0.85rem",
        color: "var(--mg-text-secondary)",
        fontWeight: 500,
      }}>
        No money was moved.
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CINEMATIC PAYOFF
   ═══════════════════════════════════════════════════════════════════════ */

interface HeroPayoffProps {
  visible: boolean;
}

function HeroPayoff({ visible }: HeroPayoffProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.6s ease",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: "var(--font-space-grotesk), sans-serif",
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: 900,
          letterSpacing: "-0.05em",
          color: "var(--mg-text)",
          opacity: visible ? 1 : 0,
          transform: visible ? "blur(0)" : "blur(8px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          GET
        </div>
        <div style={{
          fontFamily: "var(--font-space-grotesk), sans-serif",
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: 900,
          letterSpacing: "-0.05em",
          color: "var(--mg-text)",
          opacity: visible ? 1 : 0,
          transform: visible ? "blur(0)" : "blur(8px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s",
        }}>
          CHOSEN
        </div>
        <div style={{
          fontFamily: "var(--font-space-grotesk), sans-serif",
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: 900,
          letterSpacing: "-0.05em",
          background: "linear-gradient(90deg, #0B5CFF, #3B82F6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          opacity: visible ? 1 : 0,
          transform: visible ? "blur(0)" : "blur(8px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s",
        }}>
          BY AI.
        </div>
      </div>
      <div style={{
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: "0.65rem",
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--mg-text-muted)",
        opacity: visible ? 0.6 : 0,
        transition: "opacity 0.6s ease 0.6s",
      }}>
        Protected by MandateGuard
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN HERO SCENE
   ═══════════════════════════════════════════════════════════════════════ */

interface AIBuyerLensHeroProps {
  onGetStarted: () => void;
  onExploreDemo: () => void;
}

export function AIBuyerLensHero({ onGetStarted, onExploreDemo }: AIBuyerLensHeroProps) {
  const [phase, setPhase] = useState<HeroPhase>("idle");
  const [isInViewport, setIsInViewport] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionServer,
  );

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInViewport(entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const advancePhase = useCallback(() => {
    setPhase((curr) => {
      const idx = HERO_PHASE_ORDER.indexOf(curr);
      if (idx === HERO_PHASE_ORDER.length - 1) {
        return "idle";
      }
      return HERO_PHASE_ORDER[idx + 1];
    });
  }, []);

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

  useEffect(() => {
    if (isInViewport && phase === "idle") {
      const t = setTimeout(() => setPhase("headline-reveal"), 200);
      return () => clearTimeout(t);
    }
  }, [isInViewport, phase]);

  const phaseIndex = HERO_PHASE_ORDER.indexOf(phase);

  // Derived states
  const showHeadline = phaseIndex >= HERO_PHASE_ORDER.indexOf("headline-reveal");
  const showBuyerIntent = phaseIndex >= HERO_PHASE_ORDER.indexOf("buyer-intent") && phaseIndex < HERO_PHASE_ORDER.indexOf("payoff");
  const showOffer = phaseIndex >= HERO_PHASE_ORDER.indexOf("offer-present") && phaseIndex < HERO_PHASE_ORDER.indexOf("payoff");
  const showInspection = phase === "inspection";
  const showVerdict = phase === "verdict-reveal" || phase === "verdict-reason";
  const showImprovement = phase === "improvement" || phase === "improvement-done";
  const showRank2 = phase === "rank-2";
  const showRank1 = phase === "rank-1";
  const isChosen = phase === "chosen";
  const showSnapshot = phaseIndex >= HERO_PHASE_ORDER.indexOf("snapshot-capture") && phaseIndex < HERO_PHASE_ORDER.indexOf("price-mutation");
  const isSnapshotLocked = phase === "snapshot-locked" || phase === "authorization" || phase === "price-mutation";
  const showAuthorization = phase === "authorization";
  const isMutating = phase === "price-mutation" || phase === "mutation-detected";
  const showStop = phase === "payment-stopped";
  const showPayoff = phase === "payoff";

  // Ranking
  const currentRank = showRank2 ? 2 : showRank1 || isChosen ? 1 : phase === "verdict-reveal" || phase === "verdict-reason" ? 3 : null;

  // Inspection facts
  const inspectionFacts = [
    { label: "Price", value: "₹3,999/mo", status: "verified" as const },
    { label: "Mentor", value: "Unclear", status: "unclear" as const },
    { label: "Response", value: "Unclear", status: "unclear" as const },
  ];
  const improvedFacts = [
    { label: "Price", value: "₹3,999/mo", status: "verified" as const },
    { label: "Mentor", value: "1:1 Human", status: "verified" as const },
    { label: "Response", value: "24h SLA", status: "verified" as const },
  ];

  // Inspection states for features
  const inspectionStates: Record<string, "pending" | "verified" | "unclear"> = {
    expert: showInspection || phaseIndex >= HERO_PHASE_ORDER.indexOf("verdict-reveal") && phaseIndex < HERO_PHASE_ORDER.indexOf("improvement") ? "verified" : "pending",
    weekly: showInspection || phaseIndex >= HERO_PHASE_ORDER.indexOf("verdict-reveal") && phaseIndex < HERO_PHASE_ORDER.indexOf("improvement") ? "verified" : "pending",
    response: showInspection || phaseIndex >= HERO_PHASE_ORDER.indexOf("verdict-reveal") && phaseIndex < HERO_PHASE_ORDER.indexOf("improvement") ? "unclear" : "pending",
    dedicated: phaseIndex >= HERO_PHASE_ORDER.indexOf("improvement-done") ? "verified" : "pending",
    guaranteed: phaseIndex >= HERO_PHASE_ORDER.indexOf("improvement-done") ? "verified" : "pending",
    monthly: phaseIndex >= HERO_PHASE_ORDER.indexOf("improvement-done") ? "verified" : "pending",
  };

  const currentFacts = showImprovement || showRank2 || showRank1 || isChosen || showSnapshot ? improvedFacts : inspectionFacts;

  return (
    <section
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(60px, 8vh, 100px) clamp(20px, 4vw, 40px) clamp(80px, 10vh, 120px)",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Subtle atmospheric glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "400px",
          background: "radial-gradient(ellipse at center, rgba(11, 92, 255, 0.05) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Main content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: "900px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(24px, 4vh, 40px)",
        }}
      >
        {/* Top label */}
        {showHeadline && (
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--mg-brand)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              opacity: showHeadline ? 1 : 0,
              transition: "opacity 0.5s ease",
            }}
          >
            <span style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: "#0B5CFF",
              boxShadow: "0 0 8px #0B5CFF",
            }} />
            AGENTIC COMMERCE
          </div>
        )}

        {/* Headline */}
        <div style={{
          textAlign: "center",
          opacity: showHeadline ? 1 : 0,
          transform: showHeadline ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          <h1 style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            color: "var(--mg-text)",
            margin: "0 0 12px",
          }}>
            THE NEXT BUYER
            <br />
            <span style={{
              background: "linear-gradient(90deg, #0B5CFF, #3B82F6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              MIGHT BE AI.
            </span>
          </h1>
          <p style={{
            fontSize: "clamp(0.85rem, 1.3vw, 1rem)",
            color: "var(--mg-text-secondary)",
            maxWidth: "420px",
            margin: "0 auto",
            lineHeight: 1.5,
            fontWeight: 500,
            opacity: showHeadline ? 1 : 0,
            transition: "opacity 0.5s ease 0.3s",
          }}>
            AI chooses from what it can verify.
          </p>
        </div>

        {/* Buyer intent */}
        <BuyerIntent
          visible={showBuyerIntent && !showPayoff}
          text="Find me a good system design mentor under ₹4,000/month"
        />

        {/* Main offer area */}
        {showOffer && !showPayoff && (
          <div style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "clamp(40px, 8vw, 120px)",
            opacity: showOffer ? 1 : 0,
            transform: showOffer ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          }}>
            {/* The offer object */}
            <OfferObject
              title="System Design Pro"
              pricePerMonth="₹3,999 / month"
              features={["Expert guidance", "Weekly sessions", "Response time unclear"]}
              improvedFeatures={["Dedicated 1:1 mentor", "Guaranteed 24h response", "Monthly billing"]}
              inspectionStates={inspectionStates}
              isImproving={showImprovement}
              isChosen={isChosen}
              isAuthorized={showAuthorization}
              isMutating={isMutating}
              mutatedPrice="₹4,129"
              showOriginal={phaseIndex < HERO_PHASE_ORDER.indexOf("improvement")}
            />

            {/* Inspection facts - right side */}
            <InspectionFacts
              visible={showInspection || showImprovement || showRank2 || showRank1 || isChosen}
              facts={currentFacts}
            />

            {/* Ranking badge - above */}
            <RankingBadge rank={currentRank} visible={showVerdict || showImprovement || showRank2 || showRank1 || isChosen} />
          </div>
        )}

        {/* #3 verdict text */}
        {showVerdict && phase === "verdict-reason" && (
          <div style={{
            textAlign: "center",
            opacity: 1,
            transition: "opacity 0.5s ease",
          }}>
            <p style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: "clamp(0.95rem, 1.5vw, 1.1rem)",
              fontWeight: 500,
              color: "var(--mg-text-secondary)",
              maxWidth: "380px",
              lineHeight: 1.5,
              margin: 0,
            }}>
              Your price fits.
              <br />
              Your support isn&apos;t clear enough for AI.
            </p>
          </div>
        )}

        {/* Mandate Snapshot */}
        <MandateSnapshot
          visible={showSnapshot}
          isLocked={isSnapshotLocked}
          isMutating={isMutating}
        />

        {/* Payment Stopped */}
        <PaymentStopped visible={showStop} />

        {/* Cinematic Payoff */}
        <HeroPayoff visible={showPayoff} />

        {/* CTAs */}
        {!showPayoff && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              marginTop: "clamp(16px, 3vh, 32px)",
              opacity: showHeadline ? 1 : 0,
              transition: "opacity 0.5s ease 0.5s",
            }}
          >
            <button
              onClick={onGetStarted}
              style={{
                padding: "12px 28px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #0B5CFF, #004DE6)",
                border: "none",
                color: "white",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 6px 24px rgba(11, 92, 255, 0.3)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 10px 32px rgba(11, 92, 255, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 6px 24px rgba(11, 92, 255, 0.3)";
              }}
            >
              Get started →
            </button>
            <button
              onClick={onExploreDemo}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                background: "transparent",
                border: "1px solid var(--mg-glass-2-border)",
                color: "var(--mg-text-secondary)",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              See how it works
            </button>
          </div>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes snapshot-pulse {
          0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </section>
  );
}

export default AIBuyerLensHero;
