"use client";

import React, { useRef, useState, useLayoutEffect } from "react";
import { gsap } from "@/lib/gsap";

type Claim = "price" | "billing" | "mentor" | "response";

const CLAIMS: { id: Claim; label: string; value: string; status: "verified" | "unverified"; reason?: string }[] = [
  { id: "price", label: "Price", value: "₹3,999/month", status: "verified" },
  { id: "billing", label: "Billing", value: "Monthly recurring", status: "verified" },
  { id: "mentor", label: "Human mentor", value: '"Expert guidance"', status: "unverified", reason: "'Expert guidance' lacks a 1:1 human format clause." },
  { id: "response", label: "Response time", value: '"Slack access"', status: "unverified", reason: "'Slack access' lacks a machine-enforceable 24h SLA clause." },
];

export function BuyerInvestigation() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeClaim, setActiveClaim] = useState<Claim | null>(null);

  useLayoutEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".investigation-item",
        { opacity: 0.6, x: -12 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 68%",
            end: "top 30%",
            scrub: 0.5,
          },
          opacity: 1,
          x: 0,
          stagger: 0.08,
          ease: "power2.out",
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="why-buyers-leave"
      className="w-full"
      style={{ background: "var(--mg-bg)" }}
    >
      <div
        className="mg-section"
        style={{ maxWidth: "var(--container-wide)", margin: "0 auto", padding: "var(--section-py) var(--section-px)" }}
      >
        {/* ─── Header: Why you lost ─── */}
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
              04 — THE INVESTIGATION
            </div>
            <h2 className="mg-display" style={{ color: "var(--mg-text)", maxWidth: "12ch" }}>
              You&apos;re not losing
              <br />
              <span style={{ color: "var(--mg-text-muted)" }}>because you&apos;re bad.</span>
            </h2>
          </div>

          <div style={{ paddingTop: "0.5rem" }}>
            <p className="mg-body" style={{ color: "var(--mg-text-secondary)", maxWidth: "44ch" }}>
              AI just couldn&apos;t verify what you promised. Human buyers read between the lines.
              AI buyers only evaluate explicit commitments.
            </p>
            <div
              style={{
                marginTop: "1.5rem",
                padding: "1rem 1.25rem",
                background: "var(--mg-surface)",
                border: "1px solid var(--mg-glass-1-border)",
                borderRadius: "0.75rem",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "0.6875rem",
                  color: "var(--mg-text-muted)",
                  marginBottom: "0.5rem",
                }}
              >
                YOUR BUSINESS
              </div>
              <div
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--mg-text)",
                  fontStyle: "italic",
                }}
              >
                &ldquo;Expert guidance &amp; recordings for distributed systems interview prep.&rdquo;
              </div>
            </div>
          </div>
        </div>

        {/* ─── Forensic Inspection Table ─── */}
        <div
          style={{
            background: "var(--mg-surface)",
            border: "1px solid var(--mg-glass-1-border)",
            borderRadius: "1rem",
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2fr 1fr",
              gap: "1rem",
              padding: "1rem 1.5rem",
              borderBottom: "1px solid var(--mg-glass-1-border)",
              background: "var(--mg-bg)",
            }}
          >
            {["CRITERION", "WHAT AI SAW", "VERDICT"].map((h) => (
              <div
                key={h}
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--mg-text-muted)",
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Claims */}
          {CLAIMS.map((claim, idx) => {
            const isActive = activeClaim === claim.id;
            return (
              <div
                key={claim.id}
                className="investigation-item"
                onClick={() => setActiveClaim(isActive ? null : claim.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 2fr 1fr",
                  gap: "1rem",
                  padding: "1.25rem 1.5rem",
                  borderBottom: idx < CLAIMS.length - 1 ? "1px solid var(--mg-glass-1-border)" : "none",
                  background: isActive
                    ? claim.status === "verified"
                      ? "rgba(16, 185, 129, 0.04)"
                      : "rgba(245, 158, 11, 0.04)"
                    : "transparent",
                  cursor: "pointer",
                  transition: "background 0.25s ease",
                }}
              >
                {/* Criterion */}
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "var(--mg-text)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {claim.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--mg-text)",
                    }}
                  >
                    {claim.value}
                  </div>
                </div>

                {/* What AI saw */}
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "0.875rem",
                      color: "var(--mg-text-secondary)",
                    }}
                  >
                    {claim.status === "verified"
                      ? "AI confirmed this matches buyer constraints."
                      : `AI flagged this: "${claim.value}" — ${claim.reason}`}
                  </div>
                  {isActive && claim.status === "unverified" && (
                    <div
                      style={{
                        marginTop: "0.75rem",
                        padding: "0.625rem 0.875rem",
                        background: "rgba(245, 158, 11, 0.08)",
                        border: "1px solid rgba(245, 158, 11, 0.2)",
                        borderRadius: "0.5rem",
                        fontFamily: "var(--font-inter), sans-serif",
                        fontSize: "0.8125rem",
                        color: "var(--mg-warning)",
                        fontWeight: 600,
                      }}
                    >
                      Fix: Replace vague language with explicit, machine-verifiable clause.
                    </div>
                  )}
                </div>

                {/* Verdict */}
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span
                    className="mg-pill"
                    style={{
                      background: claim.status === "verified" ? "var(--mg-success-soft)" : "var(--mg-warning-soft)",
                      color: claim.status === "verified" ? "var(--mg-success)" : "var(--mg-warning)",
                      border: `1px solid ${claim.status === "verified" ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}`,
                    }}
                  >
                    {claim.status === "verified" ? "✓ VERIFIED" : "? UNVERIFIED"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Bottom Insight ─── */}
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem 1.5rem",
            background: "var(--mg-surface)",
            border: "1px solid var(--mg-glass-1-border)",
            borderRadius: "0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "0.875rem",
              color: "var(--mg-text-secondary)",
            }}
          >
            <span style={{ fontWeight: 700, color: "var(--mg-text)" }}>Root cause:</span>{" "}
            {activeClaim && CLAIMS.find((c) => c.id === activeClaim)?.reason
              ? CLAIMS.find((c) => c.id === activeClaim)?.reason
              : "Tap any unverified claim above to see the forensic diagnosis."}
          </div>
          <button
            onClick={() => setActiveClaim(null)}
            className="mg-btn-secondary"
            style={{ fontSize: "0.75rem", padding: "0.375rem 1rem" }}
          >
            Clear
          </button>
        </div>
      </div>
    </section>
  );
}
