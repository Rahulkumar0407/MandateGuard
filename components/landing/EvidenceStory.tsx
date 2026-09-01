"use client";

import React, { useRef, useLayoutEffect } from "react";
import { gsap } from "@/lib/gsap";

export function EvidenceStory() {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".evidence-stat",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            end: "top 25%",
            scrub: false,
          },
        },
      );

      gsap.fromTo(
        ".evidence-detail",
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 55%",
            end: "top 20%",
            scrub: false,
          },
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="what-we-measure"
      className="w-full"
      style={{ background: "var(--mg-bg)" }}
    >
      {/* ─── Full-width editorial dark band ─── */}
      <div
        style={{
          background: "var(--mg-surface)",
          borderTop: "1px solid var(--mg-glass-1-border)",
          borderBottom: "1px solid var(--mg-glass-1-border)",
        }}
      >
        <div
          className="mg-section"
          style={{ maxWidth: "var(--container-wide)", margin: "0 auto", padding: "var(--section-py) var(--section-px)" }}
        >
          {/* Section label */}
          <div
            className="evidence-detail mg-micro"
            style={{
              color: "var(--mg-text-muted)",
              marginBottom: "clamp(2rem, 4vw, 3rem)",
              letterSpacing: "0.12em",
            }}
          >
            10 — THE PROOF
          </div>

          {/* Editorial Headline */}
          <div
            className="evidence-detail"
            style={{ marginBottom: "clamp(3rem, 6vw, 5rem)" }}
          >
            <h2
              className="mg-display"
              style={{ color: "var(--mg-text)", maxWidth: "16ch" }}
            >
              Every decision
              <br />
              <span className="mg-brand">accountable.</span>
            </h2>
            <p
              className="mg-body"
              style={{
                marginTop: "1.5rem",
                maxWidth: "52ch",
                color: "var(--mg-text-secondary)",
              }}
            >
              From first buyer request to final transaction, every judgment is
              recorded, versioned, and verifiable. No black boxes.
            </p>
          </div>

          {/* ─── Editorial Number Wall ─── */}
          <div
            className="evidence-detail"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "clamp(2rem, 4vw, 3rem)",
              paddingTop: "clamp(2rem, 4vw, 3rem)",
              borderTop: "1px solid var(--mg-glass-1-border)",
            }}
          >
            {/* Stat 1 */}
            <div className="evidence-stat">
              <div
                className="mg-number-display"
                style={{
                  color: "var(--mg-text)",
                  lineHeight: "0.95",
                  letterSpacing: "-0.05em",
                  marginBottom: "0.5rem",
                }}
              >
                100
              </div>
              <div
                style={{
                  fontSize: "0.6875rem",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--mg-brand)",
                  marginBottom: "0.5rem",
                }}
              >
                MISSIONS TESTED
              </div>
              <p
                className="mg-small"
                style={{ color: "var(--mg-text-muted)", maxWidth: "28ch" }}
              >
                Buyer requests evaluated against live market conditions.
              </p>
            </div>

            {/* Stat 2 */}
            <div className="evidence-stat">
              <div
                className="mg-number-display"
                style={{
                  color: "var(--mg-text)",
                  lineHeight: "0.95",
                  letterSpacing: "-0.05em",
                  marginBottom: "0.5rem",
                }}
              >
                91.7
                <span style={{ fontSize: "0.45em", color: "var(--mg-text-muted)" }}>%</span>
              </div>
              <div
                style={{
                  fontSize: "0.6875rem",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--mg-success)",
                  marginBottom: "0.5rem",
                }}
              >
                RECOMMENDATION ACCURACY
              </div>
              <p
                className="mg-small"
                style={{ color: "var(--mg-text-muted)", maxWidth: "28ch" }}
              >
                AI choices grounded in verified merchant commitments only.
              </p>
            </div>

            {/* Stat 3 */}
            <div className="evidence-stat">
              <div
                className="mg-number-display"
                style={{
                  color: "var(--mg-text)",
                  lineHeight: "0.95",
                  letterSpacing: "-0.05em",
                  marginBottom: "0.5rem",
                }}
              >
                0
                <span style={{ fontSize: "0.45em", color: "var(--mg-text-muted)" }}>%</span>
              </div>
              <div
                style={{
                  fontSize: "0.6875rem",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--mg-success)",
                  marginBottom: "0.5rem",
                }}
              >
                HARD-CONSTRAINT VIOLATIONS
              </div>
              <p
                className="mg-small"
                style={{ color: "var(--mg-text-muted)", maxWidth: "28ch" }}
              >
                Budget caps, SLA requirements, and format constraints enforced.
              </p>
            </div>

            {/* Stat 4 */}
            <div className="evidence-stat">
              <div
                className="mg-number-display"
                style={{
                  color: "var(--mg-text)",
                  lineHeight: "0.95",
                  letterSpacing: "-0.05em",
                  marginBottom: "0.5rem",
                }}
              >
                100
                <span style={{ fontSize: "0.45em", color: "var(--mg-text-muted)" }}>%</span>
              </div>
              <div
                style={{
                  fontSize: "0.6875rem",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--mg-brand)",
                  marginBottom: "0.5rem",
                }}
              >
                GROUNDED DECISIONS
              </div>
              <p
                className="mg-small"
                style={{ color: "var(--mg-text-muted)", maxWidth: "28ch" }}
              >
                Every recommendation tied to authoritative offer data.
              </p>
            </div>
          </div>

          {/* ─── Architecture Principle ─── */}
          <div
            className="evidence-detail"
            style={{
              marginTop: "clamp(3rem, 5vw, 4rem)",
              paddingTop: "clamp(2rem, 4vw, 3rem)",
              borderTop: "1px solid var(--mg-glass-1-border)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "clamp(1.5rem, 3vw, 2.5rem)",
            }}
          >
            {[
              {
                label: "COMMITMENT",
                detail: "Every commercial clause is cryptographically signed and versioned.",
              },
              {
                label: "AUTHORIZATION",
                detail: "Buyer-approved terms locked into an immutable snapshot.",
              },
              {
                label: "EXECUTION",
                detail: "Payment gates on exact term match, enforced deterministically.",
              },
              {
                label: "AUDIT",
                detail: "Full decision trail from buyer request to transaction outcome.",
              },
            ].map((item) => (
              <div key={item.label}>
                <div
                  style={{
                    fontSize: "0.6875rem",
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--mg-brand)",
                    marginBottom: "0.5rem",
                  }}
                >
                  {item.label}
                </div>
                <p className="mg-small" style={{ color: "var(--mg-text-secondary)" }}>
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
