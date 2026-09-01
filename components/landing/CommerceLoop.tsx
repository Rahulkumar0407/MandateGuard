"use client";

import React, { useRef, useEffect, useLayoutEffect } from "react";
import { gsap } from "@/lib/gsap";

const LOOP_STAGES = [
  {
    id: "discover",
    name: "Discover",
    description: "AI searches the market for offers matching buyer intent.",
    detail: "148 buyer missions analyzed daily.",
  },
  {
    id: "understand",
    name: "Understand",
    description: "Each offer is parsed into machine-verifiable facts.",
    detail: "100% of commitments indexed.",
  },
  {
    id: "choose",
    name: "Choose",
    description: "Hard constraints filter. The clearest offer wins.",
    detail: "Rank #1 — maximum match confidence.",
  },
  {
    id: "authorize",
    name: "Authorize",
    description: "Buyer locks exact terms into an immutable snapshot.",
    detail: "SHA-256 snapshot bound to authorization.",
  },
  {
    id: "protect",
    name: "Protect",
    description: "Every renewal checked against the original snapshot.",
    detail: "Zero term drift tolerated.",
  },
  {
    id: "learn",
    name: "Learn",
    description: "What buyers searched for becomes merchant intelligence.",
    detail: "3 new demand signals captured.",
  },
  {
    id: "improve",
    name: "Improve",
    description: "Merchants see exactly why they lost and how to win.",
    detail: "+29% win rate after optimization.",
  },
];

export function CommerceLoop() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStage, setActiveStage] = React.useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % LOOP_STAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  useLayoutEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".loop-content",
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            end: "top 30%",
            scrub: false,
          },
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const activeItem = LOOP_STAGES[activeStage];

  return (
    <section
      ref={sectionRef}
      id="growth-loop"
      className="w-full"
      style={{ background: "var(--mg-bg)" }}
    >
      <div
        className="mg-section loop-content"
        style={{ maxWidth: "var(--container-wide)", margin: "0 auto", padding: "var(--section-py) var(--section-px)" }}
      >
        {/* Left-aligned editorial header */}
        <div style={{ marginBottom: "clamp(3rem, 6vw, 5rem)" }}>
          <div
            className="mg-micro"
            style={{
              color: "var(--mg-text-muted)",
              marginBottom: "1rem",
              letterSpacing: "0.12em",
            }}
          >
            09 — THE LOOP
          </div>

          <h2 className="mg-display" style={{ color: "var(--mg-text)", maxWidth: "18ch", marginBottom: "1.5rem" }}>
            Intelligence from
            <br />
            <span className="mg-brand">every transaction.</span>
          </h2>

          <p
            className="mg-body"
            style={{ maxWidth: "48ch", color: "var(--mg-text-secondary)" }}
          >
            Each purchase, authorization, and protection event teaches the market
            what AI buyers need. The loop feeds itself.
          </p>
        </div>

        {/* ─── Living Loop Visualization ─── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "clamp(2rem, 4vw, 4rem)",
            alignItems: "start",
          }}
          className="loop-grid"
        >
          {/* Left: Visual Loop */}
          <div
            style={{
              position: "relative",
              aspectRatio: "1",
              maxWidth: "480px",
            }}
          >
            {/* Outer ring */}
            <svg
              viewBox="0 0 400 400"
              style={{ width: "100%", height: "100%", overflow: "visible" }}
            >
              {/* Background track */}
              <circle
                cx="200"
                cy="200"
                r="160"
                fill="none"
                stroke="var(--mg-glass-1-border)"
                strokeWidth="1"
              />

              {/* Active arc */}
              <circle
                cx="200"
                cy="200"
                r="160"
                fill="none"
                stroke="var(--mg-brand)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="40 12"
                className="loop-arc"
                style={{
                  transformOrigin: "center",
                  transform: "rotate(-90deg)",
                  animation: "spin 8s linear infinite",
                  opacity: 0.7,
                }}
              />

              {/* Node dots */}
              {LOOP_STAGES.map((stage, i) => {
                const angle = (i / LOOP_STAGES.length) * 2 * Math.PI - Math.PI / 2;
                const x = 200 + 160 * Math.cos(angle);
                const y = 200 + 160 * Math.sin(angle);
                const isActive = i === activeStage;
                const isPast = i < activeStage;
                return (
                  <g key={stage.id}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isActive ? 14 : 10}
                      fill={isActive ? "var(--mg-brand)" : isPast ? "var(--mg-brand)" : "var(--mg-surface)"}
                      stroke={isActive ? "var(--mg-brand)" : "var(--mg-glass-1-border)"}
                      strokeWidth={isActive ? 3 : 1.5}
                      style={{
                        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                        filter: isActive ? `drop-shadow(0 0 8px var(--mg-brand-glow))` : "none",
                      }}
                    />
                    <text
                      x={x}
                      y={y + 4}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isActive || isPast ? "#FFFFFF" : "var(--mg-text-muted)"}
                      fontSize="8"
                      fontFamily="var(--font-jetbrains-mono), monospace"
                      fontWeight="700"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </text>
                  </g>
                );
              })}

              {/* Center focal point */}
              <circle
                cx="200"
                cy="200"
                r="56"
                fill="var(--mg-surface)"
                stroke="var(--mg-glass-1-border)"
                strokeWidth="1"
              />
              <text
                x="200"
                y="192"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--mg-text-muted)"
                fontSize="9"
                fontFamily="var(--font-jetbrains-mono), monospace"
                fontWeight="700"
                letterSpacing="0.08em"
              >
                {activeItem.name.toUpperCase()}
              </text>
              <text
                x="200"
                y="212"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--mg-brand)"
                fontSize="11"
                fontFamily="var(--font-space-grotesk), sans-serif"
                fontWeight="700"
              >
                {String(activeStage + 1).padStart(2, "0")} / {String(LOOP_STAGES.length).padStart(2, "0")}
              </text>
            </svg>
          </div>

          {/* Right: Active Stage Detail */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              paddingTop: "2rem",
            }}
          >
            {/* Stage number */}
            <div
              className="mg-micro"
              style={{
                color: "var(--mg-brand)",
                marginBottom: "1rem",
                letterSpacing: "0.12em",
              }}
            >
              STAGE {String(activeStage + 1).padStart(2, "0")} OF {String(LOOP_STAGES.length).padStart(2, "0")}
            </div>

            {/* Stage name */}
            <h3
              className="mg-headline"
              style={{ color: "var(--mg-text)", marginBottom: "1rem" }}
            >
              {activeItem.name}
            </h3>

            {/* Stage description */}
            <p
              className="mg-body"
              style={{ color: "var(--mg-text-secondary)", marginBottom: "1.5rem", maxWidth: "40ch" }}
            >
              {activeItem.description}
            </p>

            {/* Stage detail metric */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.875rem 1.25rem",
                background: "var(--mg-surface)",
                border: "1px solid var(--mg-glass-1-border)",
                borderRadius: "0.75rem",
                width: "fit-content",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "var(--mg-brand)",
                  animation: "pulse 2s ease-in-out infinite",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: "var(--mg-text-secondary)",
                }}
              >
                {activeItem.detail}
              </span>
            </div>

            {/* Stage dots */}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "2rem" }}>
              {LOOP_STAGES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStage(i)}
                  style={{
                    width: i === activeStage ? "24px" : "8px",
                    height: "8px",
                    borderRadius: "4px",
                    background:
                      i === activeStage
                        ? "var(--mg-brand)"
                        : i < activeStage
                        ? "var(--mg-brand)"
                        : "var(--mg-glass-1-border)",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    padding: 0,
                  }}
                  aria-label={`Go to stage ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(-90deg); }
          to { transform: rotate(270deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        @media (max-width: 640px) {
          .loop-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
