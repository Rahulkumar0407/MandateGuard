"use client";

import React, { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";

/* ═══════════════════════════════════════════════════════════════════════
   M21 — THE CHOICE
   Buyer demand signals → merchant focal object → metric transition
   ═══════════════════════════════════════════════════════════════════════ */

const BUYER_SIGNALS = [
  "system design mentor",
  "under ₹4,000",
  "1:1 mentor",
  "24h response",
  "live coaching",
  "career mentor",
  "monthly billing",
  "weekend cohort",
  "mock interviews",
  "architecture track",
];

const INITIAL_MATCH_RATE = 42;
const FINAL_MATCH_RATE = 57;
const MATCH_IMPROVEMENT = FINAL_MATCH_RATE - INITIAL_MATCH_RATE;
const MATCH_IMPROVEMENT_PERCENT = Math.round((MATCH_IMPROVEMENT / INITIAL_MATCH_RATE) * 100);

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

type Phase =
  | "idle"
  | "signals-enter"
  | "signals-drift"
  | "offer-focal"
  | "metric-reveal"
  | "offer-improved"
  | "metric-improved"
  | "final"
  | "reset";

const PHASE_ORDER: Phase[] = [
  "idle",
  "signals-enter",
  "signals-drift",
  "offer-focal",
  "metric-reveal",
  "offer-improved",
  "metric-improved",
  "final",
  "reset",
];

const PHASE_DURATIONS: Record<Phase, number> = {
  "idle": 600,
  "signals-enter": 1200,
  "signals-drift": 1000,
  "offer-focal": 800,
  "metric-reveal": 1200,
  "offer-improved": 800,
  "metric-improved": 1000,
  "final": 2000,
  "reset": 400,
};

interface BuyerSignalProps {
  text: string;
  index: number;
  visible: boolean;
  drifting: boolean;
  converged: boolean;
}

function BuyerSignal({ text, index, visible, drifting, converged }: BuyerSignalProps) {
  const positions = [
    { x: -180, y: -80 },
    { x: 160, y: -100 },
    { x: -200, y: 20 },
    { x: 180, y: 60 },
    { x: -140, y: 120 },
    { x: 140, y: -40 },
    { x: -60, y: -140 },
    { x: 80, y: 140 },
    { x: -180, y: -20 },
    { x: 200, y: 0 },
  ];

  const pos = positions[index % positions.length];

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: converged
          ? `translate(calc(-50% + ${pos.x * 0.4}px), calc(-50% + ${pos.y * 0.4}px))`
          : drifting
          ? `translate(calc(-50% + ${pos.x * 0.7}px), calc(-50% + ${pos.y * 0.7}px))`
          : "translate(-50%, -50%)",
        opacity: visible ? (converged ? 0.4 : 0.7) : 0,
        filter: visible ? (converged ? "blur(0px)" : "blur(3px)") : "blur(6px)",
        transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 80}ms`,
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: "0.8rem",
          fontWeight: 500,
          color: converged ? "var(--mg-text-muted)" : "var(--mg-brand)",
          fontStyle: "italic",
        }}
      >
        &ldquo;{text}&rdquo;
      </span>
    </div>
  );
}

interface MerchantOfferProps {
  phase: Phase;
}

function MerchantOffer({ phase }: MerchantOfferProps) {
  const isFocal = phase === "offer-focal" || phase === "metric-reveal";
  const isImproved = phase === "offer-improved" || phase === "metric-improved" || phase === "final";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "320px",
        background: isImproved
          ? "linear-gradient(145deg, rgba(16, 185, 129, 0.1), var(--mg-glass-2-bg))"
          : "var(--mg-glass-2-bg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: isImproved
          ? "1px solid rgba(16, 185, 129, 0.4)"
          : "1px solid var(--mg-glass-2-border)",
        borderRadius: "20px",
        padding: "28px",
        boxShadow: isFocal || isImproved
          ? "0 20px 60px rgba(0, 0, 0, 0.25), var(--mg-glass-2-shadow)"
          : "0 8px 32px rgba(0, 0, 0, 0.15), var(--mg-glass-2-shadow)",
        transform: isFocal || isImproved ? "scale(1.02)" : "scale(1)",
        transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Storefront badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            background: isImproved
              ? "linear-gradient(135deg, #10B981, #059669)"
              : "linear-gradient(135deg, #0B5CFF, #004DE6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: "11px",
            color: "white",
            boxShadow: isImproved
              ? "0 4px 12px rgba(16, 185, 129, 0.3)"
              : "0 4px 12px rgba(11, 92, 255, 0.3)",
            transition: "all 0.4s ease",
          }}
        >
          IF
        </div>
        <span
          style={{
            fontSize: "0.6rem",
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: isImproved ? "var(--mg-success)" : "var(--mg-brand)",
            transition: "color 0.4s ease",
          }}
        >
          YOUR BUSINESS
        </span>
      </div>

      {/* Product title */}
      <h3
        style={{
          fontFamily: "var(--font-space-grotesk), sans-serif",
          fontSize: "1.35rem",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: "var(--mg-text)",
          margin: "0 0 4px",
        }}
      >
        System Design Pro
      </h3>

      {/* Price */}
      <div style={{ marginBottom: "20px" }}>
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: "1.6rem",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            color: isImproved ? "var(--mg-success)" : "var(--mg-brand)",
            transition: "color 0.4s ease",
          }}
        >
          ₹3,999
        </span>
        <span
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "var(--mg-text-muted)",
            marginLeft: "6px",
          }}
        >
          / month
        </span>
      </div>

      {/* Features */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {[
          { original: "Expert guidance", improved: "Dedicated 1:1 mentor", key: "mentor" },
          { original: "Weekly sessions", improved: "Guaranteed 24h response", key: "response" },
        ].map((feature) => (
          <div
            key={feature.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 0",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background: isImproved ? "var(--mg-success)" : "var(--mg-surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.4s ease",
              }}
            >
              {isImproved && (
                <svg width="8" height="8" viewBox="0 0 10 10">
                  <path
                    d="M2 5L4 7L8 3"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              )}
            </div>
            <span
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: isImproved ? "var(--mg-success)" : "var(--mg-text-secondary)",
                transition: "all 0.4s ease",
              }}
            >
              {isImproved ? feature.improved : feature.original}
            </span>
          </div>
        ))}
      </div>

      {/* Status */}
      {isFocal && !isImproved && (
        <div
          style={{
            marginTop: "16px",
            padding: "8px 12px",
            borderRadius: "8px",
            background: "var(--mg-brand-soft)",
            border: "1px solid rgba(11, 92, 255, 0.2)",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--mg-brand)",
            }}
          >
            AI evaluates...
          </span>
        </div>
      )}

      {isImproved && (
        <div
          style={{
            marginTop: "16px",
            padding: "8px 12px",
            borderRadius: "8px",
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--mg-success)",
            }}
          >
            ✓ Clear to AI
          </span>
        </div>
      )}
    </div>
  );
}

interface MatchMetricProps {
  phase: Phase;
}

function MatchMetric({ phase }: MatchMetricProps) {
  const showInitial = phase === "metric-reveal";
  const showImproved = phase === "metric-improved" || phase === "final";
  const isImproved = showImproved;

  const displayRate = isImproved ? FINAL_MATCH_RATE : INITIAL_MATCH_RATE;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        opacity: showInitial || showImproved ? 1 : 0,
        transform: showInitial || showImproved ? "translateY(0)" : "translateY(16px)",
        transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Large metric */}
      <div
        style={{
          fontFamily: "var(--font-space-grotesk), sans-serif",
          fontSize: "clamp(3.5rem, 8vw, 5rem)",
          fontWeight: 900,
          letterSpacing: "-0.05em",
          lineHeight: 1,
          color: isImproved ? "var(--mg-success)" : "var(--mg-text)",
          transition: "color 0.5s ease",
        }}
      >
        {displayRate}
        <span
          style={{
            fontSize: "0.35em",
            fontWeight: 500,
            color: "var(--mg-text-muted)",
            letterSpacing: "-0.02em",
            marginLeft: "0.08em",
          }}
        >
          %
        </span>
      </div>

      {/* Label */}
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "0.6rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--mg-text-muted)",
          textAlign: "center",
        }}
      >
        BUYER MISSIONS MATCHED
      </div>

      {/* Improvement indicator */}
      {isImproved && (
        <div
          style={{
            marginTop: "8px",
            padding: "6px 14px",
            borderRadius: "99px",
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            opacity: 1,
            transform: "translateY(0)",
            transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: "1.1rem",
              fontWeight: 800,
              color: "var(--mg-success)",
              letterSpacing: "-0.03em",
            }}
          >
            +{MATCH_IMPROVEMENT_PERCENT}%
          </span>
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "0.55rem",
              fontWeight: 600,
              color: "var(--mg-success)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            MORE MATCHED
          </span>
        </div>
      )}

      {/* Improvement facts */}
      {isImproved && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            marginTop: "12px",
            opacity: 1,
            transform: "translateY(0)",
            transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.35s",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6L4.5 8.5L10 3"
                stroke="var(--mg-success)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "var(--mg-success)",
              }}
            >
              Dedicated 1:1 mentor
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6L4.5 8.5L10 3"
                stroke="var(--mg-success)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "var(--mg-success)",
              }}
            >
              Guaranteed 24h response
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function SimulationField() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [isInViewport, setIsInViewport] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
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
      { threshold: 0.15 },
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const advancePhase = useCallback(() => {
    setPhase((curr) => {
      const idx = PHASE_ORDER.indexOf(curr);
      if (idx === PHASE_ORDER.length - 1) {
        return "idle";
      }
      return PHASE_ORDER[idx + 1];
    });
  }, []);

  useEffect(() => {
    if (!isInViewport) return;
    const duration = PHASE_DURATIONS[phase];
    if (duration <= 0) return;

    phaseTimerRef.current = setTimeout(
      advancePhase,
      reducedMotion ? Math.min(duration, 150) : duration,
    );
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, [phase, advancePhase, reducedMotion, isInViewport]);

  useEffect(() => {
    if (isInViewport && phase === "idle") {
      const t = setTimeout(() => setPhase("signals-enter"), 200);
      return () => clearTimeout(t);
    }
  }, [isInViewport, phase]);

  const showSignals = phase !== "idle" && phase !== "reset";
  const signalsDrifting = phase === "signals-drift" || phase === "offer-focal" || phase === "metric-reveal";
  const signalsConverged = phase === "offer-improved" || phase === "metric-improved" || phase === "final";

  return (
    <section
      ref={containerRef}
      id="prove-it"
      style={{
        background: "var(--mg-bg)",
        position: "relative",
        overflow: "hidden",
        minHeight: "clamp(600px, 80vh, 750px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Atmospheric glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(800px, 100vw)",
          height: "min(600px, 80vh)",
          background:
            phase === "final"
              ? "radial-gradient(ellipse at center, rgba(16, 185, 129, 0.08) 0%, transparent 70%)"
              : "radial-gradient(ellipse at center, rgba(11, 92, 255, 0.05) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          transition: "background 0.8s ease",
        }}
      />

      <div
        style={{
          maxWidth: "var(--container-wide)",
          margin: "0 auto",
          padding: "var(--section-py) var(--section-px)",
          position: "relative",
          width: "100%",
        }}
      >
        {/* Editorial header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "clamp(2rem, 4vw, 3rem)",
            opacity: phase !== "idle" ? 1 : 0,
            transform: phase !== "idle" ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div
            className="mg-micro"
            style={{
              color: "var(--mg-text-muted)",
              marginBottom: "1rem",
              letterSpacing: "0.12em",
            }}
          >
            06 — THE CHOICE
          </div>

          <h2
            className="mg-display"
            style={{
              color: "var(--mg-text)",
              maxWidth: "16ch",
              margin: "0 auto 1rem",
            }}
          >
            Now AI
            <br />
            <span style={{ color: "var(--mg-brand)" }}>CAN CHOOSE YOU.</span>
          </h2>

          <p
            className="mg-body"
            style={{
              color: "var(--mg-text-secondary)",
              maxWidth: "42ch",
              margin: "0 auto",
            }}
          >
            Make the offer clearer, and more buyer missions can match it.
          </p>
        </div>

        {/* Main composition */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: "clamp(2rem, 4vw, 4rem)",
            alignItems: "center",
            justifyItems: "center",
            position: "relative",
          }}
          className="choice-grid"
        >
          {/* Left: Match metric */}
          <div
            style={{
              justifySelf: "end",
            }}
          >
            <MatchMetric phase={phase} />
          </div>

          {/* Center: Merchant offer with buyer signals */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "340px",
              minWidth: "320px",
            }}
          >
            {/* Buyer signals layer */}
            {showSignals &&
              BUYER_SIGNALS.map((signal, i) => (
                <BuyerSignal
                  key={signal}
                  text={signal}
                  index={i}
                  visible={showSignals}
                  drifting={signalsDrifting}
                  converged={signalsConverged}
                />
              ))}

            {/* Merchant offer focal object */}
            <div
              style={{
                opacity: phase === "offer-focal" || phase === "metric-reveal" || phase === "offer-improved" || phase === "metric-improved" || phase === "final" ? 1 : 0,
                transform:
                  phase === "offer-focal" || phase === "metric-reveal" || phase === "offer-improved" || phase === "metric-improved" || phase === "final"
                    ? "scale(1)"
                    : "scale(0.9)",
                transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <MerchantOffer phase={phase} />
            </div>
          </div>

          {/* Right: Spacer for balance */}
          <div style={{ minWidth: "120px" }} />
        </div>

        {/* Section footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: "clamp(2rem, 4vw, 3rem)",
            opacity: phase === "final" ? 0.8 : 0,
            transform: phase === "final" ? "translateY(0)" : "translateY(8px)",
            transition: "all 0.5s ease 0.3s",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "0.9rem",
              color: "var(--mg-text-muted)",
              fontStyle: "italic",
            }}
          >
            More of the right buyers can now find a clear match.
          </p>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .choice-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 2rem !important;
          }
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

export default SimulationField;
