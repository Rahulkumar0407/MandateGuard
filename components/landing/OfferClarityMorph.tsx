"use client";

import React, { useRef, useLayoutEffect } from "react";
import { gsap } from "@/lib/gsap";

export function OfferClarityMorph() {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".clarity-item",
        { opacity: 0.5, y: 20 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 65%",
            end: "top 25%",
            scrub: 0.6,
          },
          opacity: 1,
          y: 0,
          stagger: 0.1,
          ease: "power2.out",
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="offer-clarity"
      className="w-full"
      style={{ background: "var(--mg-bg)" }}
    >
      <div
        className="mg-section"
        style={{ maxWidth: "var(--container-wide)", margin: "0 auto", padding: "var(--section-py) var(--section-px)" }}
      >
        {/* ─── Header ─── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "clamp(2rem, 5vw, 5rem)",
            alignItems: "start",
            marginBottom: "clamp(3rem, 6vw, 5rem)",
          }}
        >
          <div>
            <div className="mg-micro" style={{ color: "var(--mg-text-muted)", marginBottom: "1rem", letterSpacing: "0.12em" }}>
              02 — THE OFFER
            </div>
            <h2 className="mg-display" style={{ color: "var(--mg-text)", maxWidth: "14ch" }}>
              AI can&apos;t choose
              <br />
              <span className="mg-brand">what it can&apos;t read.</span>
            </h2>
          </div>

          <div style={{ paddingTop: "0.5rem" }}>
            <p className="mg-body" style={{ color: "var(--mg-text-secondary)", maxWidth: "44ch" }}>
              If terms are buried in ambiguous marketing copy, AI buyers skip to a
              competitor with explicit, machine-verifiable commitments. Your offer must
              become machine-readable.
            </p>
          </div>
        </div>

        {/* ─── Transformation: Prose → Structured ─── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: "clamp(1.5rem, 3vw, 3rem)",
            alignItems: "start",
          }}
        >
          {/* Left: Messy prose */}
          <div
            className="clarity-item"
            style={{
              padding: "2rem",
              background: "var(--mg-surface)",
              border: "1px solid var(--mg-glass-1-border)",
              borderRadius: "1rem",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "0.625rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--mg-text-muted)",
                marginBottom: "1.25rem",
              }}
            >
              Before — Vague Marketing Copy
            </div>

            <div
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "1.0625rem",
                lineHeight: 1.7,
                color: "var(--mg-text-secondary)",
                fontStyle: "italic",
              }}
            >
              &ldquo;Expert mentorship, fast support, premium experience.
              Get guidance from experienced professionals and take your career to the
              next level with our comprehensive program.&rdquo;
            </div>

            <div
              style={{
                marginTop: "1.5rem",
                padding: "0.875rem 1rem",
                background: "rgba(239, 68, 68, 0.06)",
                border: "1px solid rgba(239, 68, 68, 0.15)",
                borderRadius: "0.5rem",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  color: "var(--mg-critical)",
                  marginBottom: "0.25rem",
                }}
              >
                AI CANNOT VERIFY:
              </div>
              <div
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "0.6875rem",
                  color: "var(--mg-text-muted)",
                }}
              >
                ? Human mentor — how many? who?<br />
                ? Fast — defined how?<br />
                ? Premium — what does this mean?
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              paddingTop: "3rem",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="var(--mg-brand)" strokeWidth="1.5" opacity="0.3" />
              <path d="M12 16h8M17 13l3 3-3 3" stroke="var(--mg-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Right: Structured specification */}
          <div
            className="clarity-item"
            style={{
              padding: "2rem",
              background: "var(--mg-surface)",
              border: "1px solid var(--mg-brand)",
              borderRadius: "1rem",
              boxShadow: "0 0 0 1px rgba(11,92,255,0.1), 0 8px 32px -8px var(--mg-brand-glow)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "0.625rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--mg-brand)",
                marginBottom: "1.25rem",
              }}
            >
              After — Machine-Readable Specification
            </div>

            {/* Offer title */}
            <div
              style={{
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--mg-text)",
                marginBottom: "0.5rem",
              }}
            >
              System Design Pro
            </div>
            <div
              style={{
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--mg-brand)",
                letterSpacing: "-0.03em",
                marginBottom: "1.5rem",
              }}
            >
              ₹3,499
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--mg-text-muted)",
                  marginLeft: "0.375rem",
                }}
              >
                / month
              </span>
            </div>

            {/* Structured facts */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {[
                { label: "FORMAT", value: "Dedicated 1:1 Human Mentor", ok: true },
                { label: "SESSIONS", value: "8 live sessions / month", ok: true },
                { label: "RESPONSE", value: "Guaranteed 24h response SLA", ok: true },
                { label: "BILLING", value: "Monthly recurring · Cancel anytime", ok: true },
                { label: "FORMAT", value: "Slack + video calls included", ok: true },
              ].map((fact) => (
                <div
                  key={fact.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.625rem 0.875rem",
                    background: "var(--mg-bg)",
                    border: "1px solid var(--mg-glass-1-border)",
                    borderRadius: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "0.625rem",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "var(--mg-text-muted)",
                    }}
                  >
                    {fact.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--mg-text)",
                      textAlign: "right",
                    }}
                  >
                    {fact.value}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "1.25rem",
                padding: "0.75rem 1rem",
                background: "var(--mg-success-soft)",
                border: "1px solid rgba(16,185,129,0.2)",
                borderRadius: "0.5rem",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  color: "var(--mg-success)",
                }}
              >
                ✓ AI CAN VERIFY ALL CLAUSES IMMEDIATELY
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
