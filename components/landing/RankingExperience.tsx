"use client";

import React, { useRef, useState, useLayoutEffect } from "react";
import { gsap } from "@/lib/gsap";

const INITIAL_OFFERS = [
  { id: "sd_pro", rank: 1, name: "System Design Pro", price: "₹3,499", traits: "1:1 mentor · 24h SLA", verdict: "Fits budget · Verified mentor & SLA" },
  { id: "interview_acc", rank: 2, name: "Interview Accelerator", price: "₹3,799", traits: "Mock rounds · Group QA", verdict: "Fits budget · Group sessions only" },
  { id: "your_business", rank: 3, name: "Your Business", price: "₹3,999", traits: "Expert guidance · Recordings", verdict: "Unclear format · Unclear SLA", isMerchant: true },
];

export function RankingExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const [offers] = useState(INITIAL_OFFERS);
  const [merchantRank, setMerchantRank] = useState(3);
  const [isImproving, setIsImproving] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useLayoutEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".ranking-row",
        { opacity: 0.85, y: 12 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 68%",
            end: "top 30%",
            scrub: 0.5,
          },
          opacity: 1,
          y: 0,
          stagger: 0.08,
          ease: "power2.out",
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleImprove = () => {
    if (isImproving) return;
    setIsImproving(true);
    setShowResult(false);

    setTimeout(() => {
      setMerchantRank(2);
    }, 500);

    setTimeout(() => {
      setMerchantRank(1);
      setShowResult(true);
      setIsImproving(false);
    }, 1200);
  };

  const handleReset = () => {
    setMerchantRank(3);
    setShowResult(false);
    setIsImproving(false);
  };

  return (
    <section
      ref={sectionRef}
      id="ai-ranking"
      className="w-full"
      style={{ background: "var(--mg-bg)" }}
    >
      <div
        className="mg-section"
        style={{ maxWidth: "var(--container-wide)", margin: "0 auto", padding: "var(--section-py) var(--section-px)" }}
      >
        {/* ─── Editorial Header ─── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "clamp(2rem, 4vw, 4rem)",
            alignItems: "start",
            marginBottom: "clamp(3rem, 6vw, 5rem)",
          }}
        >
          <div>
            <div className="mg-micro" style={{ color: "var(--mg-text-muted)", marginBottom: "1rem", letterSpacing: "0.12em" }}>
              03 — THE MARKET
            </div>
            <h2 className="mg-display" style={{ color: "var(--mg-text)", maxWidth: "16ch" }}>
              When AI becomes
              <br />
              <span className="mg-brand">the buyer,</span>
            </h2>
          </div>

          <div style={{ paddingTop: "0.5rem" }}>
            <p className="mg-body" style={{ color: "var(--mg-text-secondary)", maxWidth: "44ch" }}>
              AI ranks the clearest matching offer first. If your offer has ambiguous
              terms, it loses to a competitor who was explicit.
            </p>
            <p className="mg-body" style={{ color: "var(--mg-text-secondary)", maxWidth: "44ch", marginTop: "1rem" }}>
              Your position is your storefront. Make it unambiguous.
            </p>
          </div>
        </div>

        {/* ─── Ranking Board ─── */}
        <div style={{ marginBottom: "1.5rem" }}>
          {/* Buyer criteria strip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.75rem",
              padding: "1rem 1.25rem",
              background: "var(--mg-surface)",
              border: "1px solid var(--mg-glass-1-border)",
              borderRadius: "0.75rem 0.75rem 0 0",
              borderBottom: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--mg-brand)",
                  animation: "blink 1.8s ease-in-out infinite",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  color: "var(--mg-text-muted)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Buyer Hard Constraints
              </span>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {["≤ ₹4,000", "Human Mentor", "24h Response"].map((c) => (
                <span
                  key={c}
                  style={{
                    padding: "0.25rem 0.75rem",
                    background: "var(--mg-bg)",
                    border: "1px solid var(--mg-glass-1-border)",
                    borderRadius: "0.375rem",
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    color: "var(--mg-text-secondary)",
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Ranking rows */}
          <div
            style={{
              border: "1px solid var(--mg-glass-1-border)",
              borderRadius: "0 0 0.75rem 0.75rem",
              overflow: "hidden",
            }}
          >
            {offers.map((offer) => {
              const isMerchant = offer.isMerchant;
              const currentRank = isMerchant ? merchantRank : (offer.rank < merchantRank ? offer.rank : offer.rank + (merchantRank <= offer.rank ? 1 : 0));
              const isWinner = currentRank === 1 && isMerchant;
              const isSecond = currentRank === 2 && isMerchant;
              const isLoser = isMerchant && merchantRank === 3;

              return (
                <div
                  key={offer.id}
                  className="ranking-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "4rem 1fr auto",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "1.25rem 1.5rem",
                    background: isWinner
                      ? "rgba(16, 185, 129, 0.06)"
                      : isMerchant
                      ? "rgba(245, 158, 11, 0.04)"
                      : "var(--mg-surface)",
                    borderTop: "1px solid var(--mg-glass-1-border)",
                    transition: "background 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  {/* Rank number */}
                  <div
                    style={{
                      fontFamily: "var(--font-space-grotesk), sans-serif",
                      fontSize: "2rem",
                      fontWeight: 700,
                      letterSpacing: "-0.04em",
                      color: isWinner
                        ? "var(--mg-success)"
                        : isMerchant
                        ? "var(--mg-warning)"
                        : "var(--mg-text-muted)",
                      lineHeight: 1,
                      transition: "color 0.4s ease",
                    }}
                  >
                    {String(currentRank).padStart(2, "0")}
                  </div>

                  {/* Offer info */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-inter), sans-serif",
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: isMerchant ? "var(--mg-text)" : "var(--mg-text)",
                        }}
                      >
                        {offer.name}
                      </span>

                      {isMerchant && (
                        <span
                          className="mg-pill"
                          style={{
                            background: isWinner
                              ? "var(--mg-success-soft)"
                              : isSecond
                              ? "var(--mg-warning-soft)"
                              : "rgba(245,158,11,0.1)",
                            color: isWinner ? "var(--mg-success)" : isSecond ? "var(--mg-warning)" : "var(--mg-text-muted)",
                            border: isWinner
                              ? "1px solid rgba(16,185,129,0.2)"
                              : "1px solid rgba(245,158,11,0.2)",
                          }}
                        >
                          {isWinner ? "✓ #1 WINNER" : isSecond ? "↑ #2" : "#3 BELOW LINE"}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        fontSize: "0.75rem",
                        color: "var(--mg-text-muted)",
                      }}
                    >
                      {offer.traits}
                    </div>
                  </div>

                  {/* Price + verdict */}
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-space-grotesk), sans-serif",
                        fontSize: "1.25rem",
                        fontWeight: 700,
                        color: "var(--mg-text)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {offer.price}
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          color: "var(--mg-text-muted)",
                          marginLeft: "0.25rem",
                        }}
                      >
                        /mo
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        fontSize: "0.6875rem",
                        color: isMerchant && isLoser ? "var(--mg-warning)" : "var(--mg-text-secondary)",
                        marginTop: "0.25rem",
                      }}
                    >
                      {isMerchant && isLoser ? offer.verdict : offer.verdict}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Action Bar ─── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "0.75rem",
              color: merchantRank === 1 ? "var(--mg-success)" : "var(--mg-text-muted)",
            }}
          >
            {merchantRank === 1
              ? "✓ Your Business is #1 — AI chose you."
              : merchantRank === 2
              ? "↑ Your Business moved to #2 — missing some verified terms."
              : "↓ Your Business is #3 — AI cannot verify key commitments."}
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            {merchantRank !== 3 && (
              <button
                onClick={handleReset}
                className="mg-btn-secondary"
                style={{ fontSize: "0.8125rem", padding: "0.5rem 1.25rem" }}
              >
                Reset
              </button>
            )}
            {merchantRank !== 1 && (
              <button
                onClick={handleImprove}
                disabled={isImproving}
                className="mg-btn-primary"
                style={{ fontSize: "0.8125rem", padding: "0.5rem 1.25rem" }}
              >
                {isImproving ? "Improving..." : showResult ? "✓ Improved" : "Improve Offer →"}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </section>
  );
}
