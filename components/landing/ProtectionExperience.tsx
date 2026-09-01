"use client";

import React, { useRef, useState, useLayoutEffect } from "react";
import { gsap } from "@/lib/gsap";
import { ShieldIcon } from "../hero/ShieldIcon";

export function ProtectionExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const [hasDrifted, setHasDrifted] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useLayoutEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".protection-card",
        { opacity: 0.85, y: 24 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 68%",
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

  const handleTryPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setHasDrifted(true);
    }, 600);
  };

  return (
    <section
      ref={sectionRef}
      id="buy-safely"
      className="w-full"
      style={{ background: "var(--mg-bg)" }}
    >
      <div
        className="mg-section"
        style={{ maxWidth: "var(--container-wide)", margin: "0 auto", padding: "var(--section-py) var(--section-px)" }}
      >
        {/* ─── Editorial Header ─── */}
        <div style={{ marginBottom: "clamp(3rem, 6vw, 5rem)" }}>
          <div className="mg-micro" style={{ color: "var(--mg-text-muted)", marginBottom: "1rem", letterSpacing: "0.12em" }}>
            07 &amp; 08 — THE BARRIER
          </div>

          <h2 className="mg-display" style={{ color: "var(--mg-text)", maxWidth: "16ch", marginBottom: "1.5rem" }}>
            Being chosen is
            <br />
            <span className="mg-brand">only half the job.</span>
          </h2>

          <div className="mg-headline" style={{ color: "var(--mg-text-secondary)", maxWidth: "28ch", marginBottom: "1.5rem" }}>
            If the terms change, the authorization doesn&apos;t.
          </div>

          <p className="mg-body" style={{ color: "var(--mg-text-secondary)", maxWidth: "50ch" }}>
            The buyer approved exact terms. If a merchant tries to charge an unexpected
            amount on renewal, MandateGuard stops the payment before any money moves.
          </p>
        </div>

        {/* ─── Physical Transaction Stop ─── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: "clamp(1.5rem, 3vw, 2.5rem)",
            alignItems: "stretch",
          }}
        >
          {/* Left: Buyer Approved */}
          <div className="protection-card">
            <div
              style={{
                height: "100%",
                padding: "2rem",
                background: "var(--mg-surface)",
                border: "1px solid var(--mg-glass-1-border)",
                borderRadius: "1rem",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div>
                  <div className="mg-micro" style={{ color: "var(--mg-text-muted)", marginBottom: "0.5rem", letterSpacing: "0.08em" }}>
                    BUYER APPROVED
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-space-grotesk), sans-serif",
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "var(--mg-text)",
                    }}
                  >
                    System Design Pro
                  </div>
                </div>
                <span
                  className="mg-pill"
                  style={{ background: "var(--mg-brand-soft)", color: "var(--mg-brand)", border: "1px solid rgba(11,92,255,0.2)" }}
                >
                  AUTHORIZED
                </span>
              </div>

              {/* Price */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div
                  style={{
                    fontFamily: "var(--font-space-grotesk), sans-serif",
                    fontSize: "2.5rem",
                    fontWeight: 700,
                    letterSpacing: "-0.04em",
                    color: "var(--mg-text)",
                    lineHeight: 1,
                  }}
                >
                  ₹3,999
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "var(--mg-text-muted)",
                      marginLeft: "0.375rem",
                    }}
                  >
                    /month
                  </span>
                </div>
              </div>

              {/* Approved terms */}
              <div style={{ flex: 1 }}>
                <div className="mg-micro" style={{ color: "var(--mg-text-muted)", marginBottom: "0.75rem", letterSpacing: "0.08em" }}>
                  LOCKED TERMS
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {[
                    "1:1 Human mentor format",
                    "8 live sessions / month",
                    "Guaranteed 24h response SLA",
                    "Monthly recurring billing",
                  ].map((term) => (
                    <div
                      key={term}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontFamily: "var(--font-inter), sans-serif",
                        fontSize: "0.875rem",
                        color: "var(--mg-text-secondary)",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6" stroke="var(--mg-success)" strokeWidth="1.5" />
                        <path d="M4 7l2 2 4-4" stroke="var(--mg-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {term}
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  marginTop: "1.5rem",
                  padding: "0.75rem 1rem",
                  background: "var(--mg-bg)",
                  border: "1px solid var(--mg-glass-1-border)",
                  borderRadius: "0.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span className="mg-micro" style={{ color: "var(--mg-text-muted)" }}>
                  Snapshot
                </span>
                <span
                  className="mg-micro"
                  style={{ color: "var(--mg-brand)", letterSpacing: "0.04em" }}
                >
                  snap_88f2 · SHA-256
                </span>
              </div>
            </div>
          </div>

          {/* Center: Barrier Visual */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 0.5rem",
            }}
          >
            <div style={{ position: "relative" }}>
              {hasDrifted ? (
                /* Blocked state */
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: "var(--mg-critical-soft)",
                      border: "2px solid var(--mg-critical)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      animation: "stop-pulse 0.6s ease-out",
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <circle cx="14" cy="14" r="12" stroke="var(--mg-critical)" strokeWidth="2" />
                      <path d="M10 10l8 8M18 10l-8 8" stroke="var(--mg-critical)" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "0.5625rem",
                      fontWeight: 700,
                      color: "var(--mg-critical)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      textAlign: "center",
                      maxWidth: "64px",
                    }}
                  >
                    BLOCKED
                  </div>
                </div>
              ) : (
                /* Clear state */
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: "var(--mg-success-soft)",
                      border: "2px solid var(--mg-success)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ShieldIcon size={28} active />
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "0.5625rem",
                      fontWeight: 700,
                      color: "var(--mg-success)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      textAlign: "center",
                      maxWidth: "64px",
                    }}
                  >
                    CLEAR
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Merchant Attempt */}
          <div className="protection-card">
            <div
              style={{
                height: "100%",
                padding: "2rem",
                background: hasDrifted ? "rgba(239, 68, 68, 0.03)" : "rgba(16, 185, 129, 0.03)",
                border: `1px solid ${hasDrifted ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)"}`,
                borderRadius: "1rem",
                display: "flex",
                flexDirection: "column",
                transition: "all 0.4s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div>
                  <div className="mg-micro" style={{ color: "var(--mg-text-muted)", marginBottom: "0.5rem", letterSpacing: "0.08em" }}>
                    {hasDrifted ? "MISMATCH DETECTED" : "CYCLE RENEWAL"}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-space-grotesk), sans-serif",
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: hasDrifted ? "var(--mg-critical)" : "var(--mg-success)",
                    }}
                  >
                    {hasDrifted ? "Price Changed" : "Terms Match"}
                  </div>
                </div>
                <ShieldIcon size={32} blocked={hasDrifted} active={!hasDrifted} />
              </div>

              {/* Attempted price */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div
                  style={{
                    fontFamily: "var(--font-space-grotesk), sans-serif",
                    fontSize: "2.5rem",
                    fontWeight: 700,
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                    color: hasDrifted ? "var(--mg-critical)" : "var(--mg-success)",
                  }}
                >
                  {hasDrifted ? "₹4,129" : "₹3,999"}
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "var(--mg-text-muted)",
                      marginLeft: "0.375rem",
                    }}
                  >
                    /month
                  </span>
                </div>
                {hasDrifted && (
                  <div
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "0.6875rem",
                      color: "var(--mg-text-muted)",
                      marginTop: "0.375rem",
                      textDecoration: "line-through",
                    }}
                  >
                    was ₹3,999
                  </div>
                )}
              </div>

              {/* Result */}
              <div style={{ flex: 1 }}>
                {hasDrifted ? (
                  <>
                    <div
                      style={{
                        padding: "1rem 1.25rem",
                        background: "rgba(239, 68, 68, 0.08)",
                        border: "1px solid rgba(239, 68, 68, 0.2)",
                        borderRadius: "0.75rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--font-inter), sans-serif",
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: "var(--mg-critical)",
                          marginBottom: "0.375rem",
                        }}
                      >
                        PAYMENT STOPPED
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-inter), sans-serif",
                          fontSize: "0.875rem",
                          color: "var(--mg-text-secondary)",
                        }}
                      >
                        Price changed from ₹3,999 to ₹4,129. No money was moved.
                      </div>
                    </div>

                    <div
                      style={{
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        color: "var(--mg-warning)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Re-authorization required
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        padding: "1rem 1.25rem",
                        background: "rgba(16, 185, 129, 0.08)",
                        border: "1px solid rgba(16, 185, 129, 0.2)",
                        borderRadius: "0.75rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--font-inter), sans-serif",
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: "var(--mg-success)",
                          marginBottom: "0.375rem",
                        }}
                      >
                        TERMS MATCHED
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-inter), sans-serif",
                          fontSize: "0.875rem",
                          color: "var(--mg-text-secondary)",
                        }}
                      >
                        All terms match authorized snapshot. Payment executed.
                      </div>
                    </div>

                    <div
                      style={{
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        color: "var(--mg-success)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Razorpay Test Mode
                    </div>
                  </>
                )}
              </div>

              <div
                style={{
                  marginTop: "1.5rem",
                  padding: "0.75rem 1rem",
                  background: "var(--mg-bg)",
                  border: "1px solid var(--mg-glass-1-border)",
                  borderRadius: "0.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span className="mg-micro" style={{ color: "var(--mg-text-muted)" }}>
                  Result
                </span>
                <span
                  className="mg-micro"
                  style={{ color: hasDrifted ? "var(--mg-critical)" : "var(--mg-success)", letterSpacing: "0.04em" }}
                >
                  {hasDrifted ? "Mutation Blocked" : "Authorized"}
                </span>
              </div>
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
          <div
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "0.875rem",
              color: "var(--mg-text-secondary)",
            }}
          >
            The authorization boundary is enforced deterministically. No human review required.
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => setHasDrifted(!hasDrifted)}
              className="mg-btn-secondary"
              style={{ fontSize: "0.8125rem" }}
            >
              {hasDrifted ? "Show match" : "Show drift"}
            </button>
            <button
              onClick={handleTryPayment}
              disabled={isProcessing}
              className="mg-btn-primary"
              style={{ fontSize: "0.8125rem" }}
            >
              {isProcessing ? "Checking..." : hasDrifted ? "Try ₹4,129 →" : "Try ₹3,999 →"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes stop-pulse {
          0% { transform: scale(0.9); opacity: 0.5; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </section>
  );
}
