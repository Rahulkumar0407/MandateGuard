"use client";

import React, { useRef, useState, useLayoutEffect } from "react";
import { gsap } from "@/lib/gsap";

export function ShiftScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useLayoutEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      const humanCards = sectionRef.current?.querySelectorAll(".shift-human-item");
      const agentCard = sectionRef.current?.querySelector(".shift-agent-panel");

      if (!humanCards || !agentCard) return;

      gsap.to(humanCards, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 65%",
          end: "bottom 40%",
          scrub: 0.6,
          onUpdate: (self) => {
            if (self.progress > 0.5) {
              setIsCollapsed(true);
            } else {
              setIsCollapsed(false);
            }
          },
        },
        opacity: 0.2,
        scale: 0.94,
        y: 8,
        stagger: 0.04,
        ease: "power2.inOut",
      });

      gsap.fromTo(
        agentCard,
        { opacity: 0.5, scale: 0.95, x: 20 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
            end: "bottom 40%",
            scrub: 0.6,
          },
          opacity: 1,
          scale: 1,
          x: 0,
          ease: "power2.out",
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="the-shift"
      className="w-full"
      style={{ background: "var(--mg-bg)", overflow: "hidden" }}
    >
      <div
        className="mg-section"
        style={{
          maxWidth: "var(--container-wide)",
          margin: "0 auto",
          padding: "var(--section-py) var(--section-px)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "clamp(2rem, 5vw, 5rem)",
          alignItems: "center",
        }}
      >
        {/* ─── Left: Editorial Statement ─── */}
        <div>
          <div
            className="mg-micro"
            style={{ color: "var(--mg-text-muted)", marginBottom: "1.5rem", letterSpacing: "0.12em" }}
          >
            01 — THE SHIFT
          </div>

          <h2
            className="mg-display"
            style={{ color: "var(--mg-text)", marginBottom: "1.5rem", maxWidth: "14ch" }}
          >
            The web was built for
            <br />
            <span style={{ color: "var(--mg-text-muted)" }}>people to browse.</span>
          </h2>

          <div
            className="mg-headline mg-brand"
            style={{ marginBottom: "1.5rem", fontWeight: 700 }}
          >
            Commerce is being rebuilt for{" "}
            <span style={{ color: "var(--mg-text)" }}>agents to decide.</span>
          </div>

          <p
            className="mg-body"
            style={{ color: "var(--mg-text-secondary)", maxWidth: "42ch" }}
          >
            AI agents evaluate structured facts and execute authorized purchases
            without human browsing. Your offer must speak their language.
          </p>

          {/* Toggle hint */}
          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="mg-btn-secondary"
              style={{ fontSize: "0.8125rem", padding: "0.5rem 1.25rem" }}
            >
              {isCollapsed ? "Show human browsing" : "Show AI decision"}
            </button>
            <span className="mg-small" style={{ color: "var(--mg-text-muted)" }}>
              {isCollapsed ? "Human tabs collapsed into AI" : "Scroll to collapse"}
            </span>
          </div>
        </div>

        {/* ─── Right: Transformation Visual ─── */}
        <div
          style={{
            position: "relative",
            minHeight: "480px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* Human browsing fragments — scattered browser pieces */}
          <div
            className="shift-human-fragments"
            style={{
              position: "absolute",
              inset: 0,
              transition: "opacity 0.5s ease, transform 0.5s ease",
              opacity: isCollapsed ? 0 : 1,
              transform: isCollapsed ? "scale(0.9)" : "scale(1)",
            }}
          >
            {/* Scattered browser fragments */}
            {[
              { top: "8%", left: "5%", rotate: -4, width: "45%" },
              { top: "25%", left: "20%", rotate: 3, width: "50%" },
              { top: "48%", left: "8%", rotate: -2, width: "42%" },
              { top: "65%", left: "25%", rotate: 5, width: "48%" },
            ].map((pos, i) => (
              <div
                key={i}
                className="shift-human-item"
                style={{
                  position: "absolute",
                  top: pos.top,
                  left: pos.left,
                  width: pos.width,
                  transform: `rotate(${pos.rotate}deg)`,
                  background: "var(--mg-surface)",
                  border: "1px solid var(--mg-glass-1-border)",
                  borderRadius: "0.75rem",
                  padding: "0.875rem 1rem",
                  boxShadow: "0 4px 16px -4px rgba(0,0,0,0.3)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "0.375rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444", opacity: 0.7 }} />
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B", opacity: 0.7 }} />
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", opacity: 0.7 }} />
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "0.625rem",
                    color: "var(--mg-text-muted)",
                    marginBottom: "0.25rem",
                  }}
                >
                  {["search result", "pricing page", "reviews tab", "comparison"][i]}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--mg-text-secondary)",
                  }}
                >
                  {[
                    '"Expert guidance..."',
                    "₹4,200/mo + GST",
                    "4.8★ · 142 reviews",
                    "10 tabs open",
                  ][i]}
                </div>
              </div>
            ))}

            {/* Annotation: scattered decision */}
            <div
              style={{
                position: "absolute",
                bottom: "12%",
                right: "0%",
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "0.6875rem",
                color: "var(--mg-text-muted)",
                background: "var(--mg-surface)",
                border: "1px solid var(--mg-glass-1-border)",
                borderRadius: "0.5rem",
                padding: "0.375rem 0.75rem",
              }}
            >
              10+ decisions · fragmented
            </div>
          </div>

          {/* Arrow pointing right */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 5,
              opacity: isCollapsed ? 1 : 0,
              transition: "opacity 0.4s ease",
            }}
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" fill="var(--mg-brand)" opacity="0.15" />
              <path
                d="M18 24h12M26 20l4 4-4 4"
                stroke="var(--mg-brand)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* AI Decision — single clean surface */}
          <div
            className="shift-agent-panel"
            style={{
              position: "absolute",
              left: "10%",
              right: "0%",
              top: "50%",
              transform: isCollapsed ? "translateY(-50%)" : "translateY(-30%)",
              opacity: isCollapsed ? 1 : 0,
              transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
              background: "var(--mg-surface)",
              border: "1px solid var(--mg-brand)",
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 8px 32px -8px var(--mg-brand-glow), 0 0 0 1px rgba(11,92,255,0.1)",
              zIndex: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--mg-brand)",
                  animation: "pulse-dot 2s ease-in-out infinite",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  color: "var(--mg-brand)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                AI BUYER AGENT
              </span>
            </div>

            <div
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--mg-text)",
                marginBottom: "0.75rem",
              }}
            >
              Intent: Human mentor · ≤ ₹4,000
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
              }}
            >
              {[
                { label: "BUDGET", value: "✓ ₹3,999", ok: true },
                { label: "FORMAT", value: "✓ 1:1 Mentor", ok: true },
                { label: "SLA", value: "✓ 24h Response", ok: true },
                { label: "DECISION", value: "CHOOSEN #1", ok: true },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "var(--mg-bg)",
                    border: "1px solid var(--mg-glass-1-border)",
                    borderRadius: "0.5rem",
                    padding: "0.5rem 0.75rem",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "0.5625rem",
                      color: "var(--mg-text-muted)",
                      letterSpacing: "0.06em",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: item.ok ? "var(--mg-success)" : "var(--mg-critical)",
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Result label */}
          {isCollapsed && (
            <div
              style={{
                position: "absolute",
                bottom: "5%",
                right: "5%",
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "0.6875rem",
                fontWeight: 700,
                color: "var(--mg-success)",
                background: "var(--mg-success-soft)",
                border: "1px solid rgba(16,185,129,0.2)",
                borderRadius: "0.5rem",
                padding: "0.375rem 0.75rem",
              }}
            >
              One deterministic choice.
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </section>
  );
}
