"use client";

import React, { useRef, useState, useLayoutEffect } from "react";
import { gsap } from "@/lib/gsap";

interface OfferFixExperienceProps {
  onSimulateClick?: () => void;
}

export function OfferFixExperience({ onSimulateClick }: OfferFixExperienceProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [isFixed, setIsFixed] = useState(false);

  useLayoutEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".fix-content",
        { opacity: 0.85, y: 20 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            end: "top 30%",
            scrub: 0.5,
          },
          opacity: 1,
          y: 0,
          ease: "power2.out",
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="fix-it"
      className="w-full"
      style={{ background: "var(--mg-bg)" }}
    >
      <div
        className="mg-section fix-content"
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
              05 — THE FIX
            </div>
            <h2 className="mg-display" style={{ color: "var(--mg-text)", maxWidth: "14ch" }}>
              Make the promise
              <br />
              <span className="mg-brand">explicit.</span>
            </h2>
          </div>

          <div style={{ paddingTop: "0.5rem" }}>
            <p className="mg-body" style={{ color: "var(--mg-text-secondary)", maxWidth: "44ch" }}>
              AI match confidence measures how well AI can verify your commercial commitments.
              Better clarity means higher confidence and better ranking.
            </p>
          </div>
        </div>

        {/* ─── Offer Transformation ─── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "clamp(2rem, 4vw, 4rem)",
            alignItems: "stretch",
          }}
        >
          {/* Left: Before */}
          <div
            style={{
              padding: "2rem",
              background: isFixed ? "var(--mg-bg)" : "var(--mg-surface)",
              border: `1px solid ${isFixed ? "var(--mg-glass-1-border)" : "var(--mg-glass-1-border)"}`,
              borderRadius: "1rem",
              opacity: isFixed ? 0.5 : 1,
              transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--mg-text-muted)",
                }}
              >
                BEFORE
              </span>
              <span className="mg-pill" style={{ background: "var(--mg-warning-soft)", color: "var(--mg-warning)", border: "1px solid rgba(245,158,11,0.2)" }}>
                SCORE: 62
              </span>
            </div>

            <div
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--mg-text)",
                marginBottom: "1rem",
              }}
            >
              Your Business — InterviewForge
            </div>

            <div
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "1rem",
                lineHeight: 1.7,
                color: "var(--mg-text-secondary)",
                fontStyle: "italic",
                marginBottom: "1.5rem",
              }}
            >
              &ldquo;Expert guidance &amp; recordings for distributed systems interview prep.&rdquo;
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                { label: "PRICE", value: "₹3,999/month", ok: true },
                { label: "MENTOR", value: '"Expert guidance"', ok: false },
                { label: "RESPONSE", value: '"Slack access"', ok: false },
              ].map((item) => (
                <div
                  key={item.label}
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
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      color: "var(--mg-text-muted)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: item.ok ? "var(--mg-success)" : "var(--mg-warning)",
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: After */}
          <div
            style={{
              padding: "2rem",
              background: isFixed ? "var(--mg-surface)" : "var(--mg-bg)",
              border: `1px solid ${isFixed ? "var(--mg-brand)" : "var(--mg-glass-1-border)"}`,
              borderRadius: "1rem",
              boxShadow: isFixed ? "0 0 0 1px rgba(11,92,255,0.1), 0 8px 32px -8px var(--mg-brand-glow)" : "none",
              transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--mg-text-muted)",
                }}
              >
                AFTER
              </span>
              <span className="mg-pill" style={{ background: "var(--mg-success-soft)", color: "var(--mg-success)", border: "1px solid rgba(16,185,129,0.2)" }}>
                SCORE: 91
              </span>
            </div>

            <div
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--mg-text)",
                marginBottom: "1rem",
              }}
            >
              Your Business — InterviewForge
            </div>

            <div
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "1rem",
                lineHeight: 1.7,
                color: "var(--mg-text-secondary)",
                fontStyle: "italic",
                marginBottom: "1.5rem",
                textDecoration: "line-through",
                opacity: 0.4,
              }}
            >
              &ldquo;Expert guidance &amp; recordings for distributed systems interview prep.&rdquo;
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                { label: "PRICE", value: "₹3,999/month", ok: true },
                { label: "MENTOR", value: "Dedicated 1:1 Human Mentor", ok: true },
                { label: "RESPONSE", value: "Guaranteed 24h SLA", ok: true },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.625rem 0.875rem",
                    background: "var(--mg-bg)",
                    border: "1px solid rgba(16,185,129,0.2)",
                    borderRadius: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      color: "var(--mg-text-muted)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--mg-success)",
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Action Bar ─── */}
        <div
          style={{
            marginTop: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <button
              onClick={() => setIsFixed(!isFixed)}
              className="mg-btn-secondary"
              style={{ fontSize: "0.8125rem" }}
            >
              {isFixed ? "Show before" : "Apply fixes →"}
            </button>

            <div
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "0.875rem",
                color: isFixed ? "var(--mg-success)" : "var(--mg-text-secondary)",
                fontWeight: isFixed ? 600 : 400,
                transition: "color 0.3s ease",
              }}
            >
              {isFixed
                ? "✓ AI match confidence improved from 62 to 91"
                : "Toggle to see the transformation"}
            </div>
          </div>

          {onSimulateClick && (
            <button onClick={onSimulateClick} className="mg-btn-primary" style={{ fontSize: "0.8125rem" }}>
              See AI choose you →
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
