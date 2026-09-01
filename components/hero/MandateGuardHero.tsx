"use client";

import React, { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";

/* ═══════════════════════════════════════════════════════════════════════
   M20 — RAZORPAY-DISCIPLINE HERO
   ONE dominant message. ONE commercial object. Premium restraint.
   ═══════════════════════════════════════════════════════════════════════ */

export type HeroPhase =
  | "idle"
  | "offer-enter"
  | "ai-evaluate"
  | "clarify"
  | "clear"
  | "snapshot-lock"
  | "protection-preview"
  | "protection-blocked"
  | "reset";

export const HERO_PHASE_ORDER: HeroPhase[] = [
  "idle",
  "offer-enter",
  "ai-evaluate",
  "clarify",
  "clear",
  "snapshot-lock",
  "protection-preview",
  "protection-blocked",
  "reset",
];

const PHASE_DURATIONS: Record<HeroPhase, number> = {
  "idle": 600,
  "offer-enter": 800,
  "ai-evaluate": 1800,
  "clarify": 1200,
  "clear": 1000,
  "snapshot-lock": 800,
  "protection-preview": 1200,
  "protection-blocked": 1400,
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
   COMMERCIAL OFFER OBJECT — Premium glass card
   ═══════════════════════════════════════════════════════════════════════ */

interface OfferCardProps {
  visible: boolean;
  phase: HeroPhase;
}

function OfferCard({ visible, phase }: OfferCardProps) {
  const isInitial = phase === "offer-enter";
  const isEvaluating = phase === "ai-evaluate";
  const isClarifying = phase === "clarify";
  const isClear = phase === "clear" || phase === "snapshot-lock";
  const isProtectionPreview = phase === "protection-preview";
  const isBlocked = phase === "protection-blocked";

  const showOriginal = isInitial || isEvaluating;
  const showClarified = isClarifying || isClear || isProtectionPreview || isBlocked;

  const features = [
    { original: "Expert guidance", clarified: "Dedicated 1:1 mentor", key: "mentor" },
    { original: "Weekly sessions", clarified: "Guaranteed 24h response", key: "response" },
  ];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "340px",
        background: isClear
          ? "linear-gradient(145deg, rgba(16, 185, 129, 0.08), var(--mg-glass-2-bg))"
          : isBlocked
          ? "linear-gradient(145deg, rgba(239, 68, 68, 0.08), var(--mg-glass-2-bg))"
          : "var(--mg-glass-2-bg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: isClear
          ? "1px solid rgba(16, 185, 129, 0.35)"
          : isBlocked
          ? "1px solid rgba(239, 68, 68, 0.35)"
          : "1px solid var(--mg-glass-2-border)",
        borderRadius: "20px",
        padding: "28px",
        boxShadow: isClear
          ? "0 20px 60px rgba(16, 185, 129, 0.15), var(--mg-glass-2-shadow)"
          : isBlocked
          ? "0 20px 60px rgba(239, 68, 68, 0.15), var(--mg-glass-2-shadow)"
          : "0 12px 40px rgba(0, 0, 0, 0.25), var(--mg-glass-2-shadow)",
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.96)",
        transition: "all 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Storefront badge */}
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
          background: isClear
            ? "linear-gradient(135deg, #10B981, #059669)"
            : "linear-gradient(135deg, #0B5CFF, #004DE6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          fontSize: "11px",
          color: "white",
          boxShadow: isClear
            ? "0 4px 12px rgba(16, 185, 129, 0.3)"
            : "0 4px 12px rgba(11, 92, 255, 0.3)",
          transition: "all 0.4s ease",
        }}>
          IF
        </div>
        <span style={{
          fontSize: "0.6rem",
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: isClear ? "var(--mg-success)" : isBlocked ? "var(--mg-critical)" : "var(--mg-brand)",
          transition: "color 0.4s ease",
        }}>
          YOUR BUSINESS
        </span>
      </div>

      {/* Product title */}
      <h3 style={{
        fontFamily: "var(--font-space-grotesk), sans-serif",
        fontSize: "1.4rem",
        fontWeight: 800,
        letterSpacing: "-0.03em",
        color: "var(--mg-text)",
        margin: "0 0 4px",
      }}>
        System Design Pro
      </h3>

      {/* Price */}
      <div style={{ marginBottom: "20px", position: "relative" }}>
        <span style={{
          fontFamily: "var(--font-space-grotesk), sans-serif",
          fontSize: "1.75rem",
          fontWeight: 900,
          letterSpacing: "-0.04em",
          color: isBlocked ? "var(--mg-critical)" : isClear ? "var(--mg-success)" : "var(--mg-brand)",
          transition: "color 0.4s ease",
        }}>
          {isBlocked ? "₹4,129" : "₹3,999"}
        </span>
        <span style={{
          fontSize: "0.9rem",
          fontWeight: 600,
          color: "var(--mg-text-muted)",
          marginLeft: "6px",
        }}>
          / month
        </span>
        {isBlocked && (
          <div style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: "15%",
            height: "2px",
            background: "var(--mg-critical)",
            transform: "rotate(-2deg)",
            opacity: 0.5,
          }} />
        )}
      </div>

      {/* Features */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {features.map((feature) => (
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
            <div style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: isClear
                ? "var(--mg-success)"
                : isBlocked
                ? "var(--mg-critical)"
                : "var(--mg-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.4s ease",
            }}>
              {isClear ? (
                <svg width="8" height="8" viewBox="0 0 10 10">
                  <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              ) : isBlocked ? (
                <svg width="8" height="8" viewBox="0 0 10 10">
                  <path d="M3 3L7 7M7 3L3 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              ) : null}
            </div>
            <span style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: isClear
                ? "var(--mg-success)"
                : isBlocked
                ? "var(--mg-text-muted)"
                : showClarified
                ? "var(--mg-text-muted)"
                : "var(--mg-text-secondary)",
              textDecoration: isBlocked ? "line-through" : "none",
              transition: "all 0.4s ease",
            }}>
              {showClarified ? feature.clarified : showOriginal ? feature.original : feature.original}
            </span>
          </div>
        ))}
      </div>

      {/* Status indicator */}
      {isEvaluating && (
        <div style={{
          marginTop: "16px",
          padding: "8px 12px",
          borderRadius: "8px",
          background: "var(--mg-brand-soft)",
          border: "1px solid rgba(11, 92, 255, 0.2)",
          textAlign: "center",
        }}>
          <span style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--mg-brand)",
          }}>
            AI evaluates...
          </span>
        </div>
      )}

      {isClear && (
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
            ✓ Clear to AI
          </span>
        </div>
      )}

      {isProtectionPreview && (
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
            APPROVED
          </span>
        </div>
      )}

      {isBlocked && (
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
            UNAUTHORIZED CHANGE
          </span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MANDATE SNAPSHOT — Small geometric seal
   ═══════════════════════════════════════════════════════════════════════ */

interface MandateSnapshotProps {
  visible: boolean;
  phase: HeroPhase;
}

function MandateSnapshot({ visible, phase }: MandateSnapshotProps) {
  const isLocked = phase === "snapshot-lock" || phase === "protection-preview";
  const isBlocked = phase === "protection-blocked";
  const stateColor = isBlocked ? "#EF4444" : isLocked ? "#10B981" : "#0B5CFF";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.85)",
        transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Tiny geometric seal */}
      <div style={{ position: "relative", width: "52px", height: "52px" }}>
        <svg viewBox="0 0 52 52" fill="none" style={{ width: "100%", height: "100%" }}>
          {/* Outer ring */}
          <circle
            cx="26"
            cy="26"
            r="23"
            stroke={stateColor}
            strokeWidth="1"
            strokeDasharray={isLocked ? "none" : "3 2"}
            opacity={isLocked ? 0.7 : 0.35}
          />
          {/* Inner circle */}
          <circle
            cx="26"
            cy="26"
            r="14"
            fill={`${stateColor}12`}
            stroke={stateColor}
            strokeWidth="1"
            opacity={0.8}
          />
          {/* Lock/verify mark */}
          {isLocked && !isBlocked ? (
            <path d="M18 26L22 30L34 21" stroke={stateColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          ) : isBlocked ? (
            <path d="M20 20L32 32M32 20L20 32" stroke={stateColor} strokeWidth="2" strokeLinecap="round" />
          ) : null}
        </svg>
      </div>

      {/* Label */}
      <div style={{
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: "0.55rem",
        fontWeight: 700,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: stateColor,
        padding: "3px 10px",
        borderRadius: "99px",
        background: `${stateColor}10`,
        border: `1px solid ${stateColor}25`,
      }}>
        MANDATE SNAPSHOT — {isLocked ? "LOCKED" : isBlocked ? "MISMATCH" : "CAPTURING"}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN HERO COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

interface MandateGuardHeroProps {
  onGetStarted: () => void;
  onExploreDemo: () => void;
}

export function MandateGuardHero({ onGetStarted, onExploreDemo }: MandateGuardHeroProps) {
  const [phase, setPhase] = useState<HeroPhase>("idle");
  const [isInViewport, setIsInViewport] = useState(true);
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
      const t = setTimeout(() => setPhase("offer-enter"), 200);
      return () => clearTimeout(t);
    }
  }, [isInViewport, phase]);

  const showContent = phase !== "idle";
  const showOffer = phase !== "idle";
  const showSnapshot = phase === "snapshot-lock" || phase === "protection-preview" || phase === "protection-blocked";

  return (
    <section
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(80px, 12vh, 120px) clamp(20px, 4vw, 40px) clamp(60px, 8vh, 100px)",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Subtle atmospheric glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "25%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "700px",
          height: "450px",
          background: "radial-gradient(ellipse at center, rgba(11, 92, 255, 0.06) 0%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Main content grid */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: "1100px",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(40px, 6vw, 80px)",
          alignItems: "center",
        }}
        className="hero-grid"
      >
        {/* Left: Copy */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "clamp(20px, 3vh, 28px)",
            opacity: showContent ? 1 : 0,
            transform: showContent ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Eyebrow */}
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
            }}
          >
            <span style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: "#0B5CFF",
              boxShadow: "0 0 8px #0B5CFF",
            }} />
            THE NEXT SHIFT IN COMMERCE
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: "clamp(2.8rem, 5vw, 4.2rem)",
              fontWeight: 900,
              letterSpacing: "-0.035em",
              lineHeight: 1.0,
              color: "var(--mg-text)",
              margin: 0,
            }}
          >
            <span
              style={{
                display: "block",
                opacity: showContent ? 1 : 0,
                filter: showContent ? "blur(0)" : "blur(4px)",
                transform: showContent ? "translateY(0)" : "translateY(8px)",
                transition: "all 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              AI IS BECOMING
            </span>
            <span
              style={{
                display: "block",
                position: "relative",
                color: "#0B5CFF",
                opacity: showContent ? 1 : 0,
                filter: showContent ? "blur(0)" : "blur(4px)",
                transform: showContent ? "translateY(0)" : "translateY(8px)",
                transition: "all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.12s",
              }}
              className="shine-container"
            >
              THE BUYER.
              {/* White specular shine overlay */}
              {!reducedMotion && (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 40%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 60%, transparent 100%)",
                    backgroundSize: "200% 100%",
                    animation: showContent ? "headline-shine 1.1s ease-out 0.5s forwards" : "none",
                    pointerEvents: "none",
                    mixBlendMode: "overlay",
                  }}
                  className="shine-clip"
                />
              )}
            </span>
          </h1>

          {/* Supporting copy */}
          <p
            style={{
              fontSize: "clamp(1rem, 1.3vw, 1.15rem)",
              color: "var(--mg-text-secondary)",
              maxWidth: "420px",
              lineHeight: 1.55,
              fontWeight: 500,
              margin: 0,
            }}
          >
            Make your offer clear enough to be chosen —
            and keep every approved payment protected.
          </p>

          {/* CTAs */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginTop: "8px",
            }}
          >
            <button
              onClick={onGetStarted}
              style={{
                padding: "14px 28px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #0B5CFF, #004DE6)",
                border: "none",
                color: "white",
                fontSize: "0.9375rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 6px 24px rgba(11, 92, 255, 0.3)",
                transition: "all 0.2s ease",
                alignSelf: "flex-start",
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
                padding: "10px 20px",
                borderRadius: "10px",
                background: "transparent",
                border: "1px solid var(--mg-glass-2-border)",
                color: "var(--mg-text-secondary)",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                alignSelf: "flex-start",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--mg-brand)";
                e.currentTarget.style.color = "var(--mg-brand)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--mg-glass-2-border)";
                e.currentTarget.style.color = "var(--mg-text-secondary)";
              }}
            >
              See how it works
            </button>
          </div>

          {/* Subtle AI caption */}
          {phase === "clear" && (
            <p
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "0.65rem",
                color: "var(--mg-text-muted)",
                margin: 0,
                opacity: 0.7,
              }}
            >
              AI can verify this offer.
            </p>
          )}
        </div>

        {/* Right: Commercial object */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <OfferCard visible={showOffer} phase={phase} />
          <MandateSnapshot visible={showSnapshot} phase={phase} />
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes headline-shine {
          0% { background-position: -100% 0; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { background-position: 200% 0; opacity: 0; }
        }
        .shine-clip {
          background-clip: text;
          -webkit-background-clip: text;
        }
        @media (min-width: 900px) {
          .hero-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            align-items: center !important;
          }
        }
        @media (max-width: 899px) {
          .hero-grid {
            display: flex !important;
            flex-direction: column !important;
            text-align: center !important;
          }
          .hero-grid > div:first-child {
            align-items: center !important;
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

export default MandateGuardHero;
