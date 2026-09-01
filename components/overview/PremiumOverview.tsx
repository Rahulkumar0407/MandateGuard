"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useSpring, animated } from "@react-spring/web";

interface OverviewPremiumProps {
  merchantName: string;
  greeting: string;
  topOffer: {
    name: string;
    price: number;
    billingInterval: string;
    isConfirmed: boolean;
    commitments: string[];
    versionHash?: string;
  } | null;
  offersCount: number;
  mandatesCount: number;
  stoppedChanges: number;
  matchRate: number | null;
  funnel: {
    discovered: number;
    understood: number;
    matched: number;
    total: number;
  } | null;
  demandSignals: string[];
  protectionExample: { from: number; to: number } | null;
  primaryState: { label: string; message: string; cta: string; ctaHref: string };
}

// Animated number using react-spring (physical spring behavior)
function SpringNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const { number } = useSpring({
    from: { number: 0 },
    to: { number: value },
    config: { tension: 120, friction: 20 },
  });
  return (
    <animated.span>
      {number.to((n) => `${Math.round(n)}${suffix}`)}
    </animated.span>
  );
}

function formatPrice(paise: number, interval: string) {
  const rupees = paise / 100;
  const suffix = interval === "year" ? "/yr" : interval === "month" ? "/mo" : `/${interval}`;
  return { rupees: rupees.toLocaleString("en-IN"), suffix };
}

export function PremiumOverview({
  merchantName,
  greeting,
  topOffer,
  offersCount,
  mandatesCount,
  stoppedChanges,
  matchRate,
  funnel,
  demandSignals,
  protectionExample,
  primaryState,
}: OverviewPremiumProps) {
  const shouldReduceMotion = useReducedMotion();
  const firstName = merchantName.split(" ")[0];
  const price = topOffer ? formatPrice(topOffer.price, topOffer.billingInterval) : null;

  // Offer micro-state: READY -> VERIFIED with subtle transition after mount
  const [offerState, setOfferState] = useState<"READY" | "VERIFIED">("READY");
  useEffect(() => {
    if (shouldReduceMotion) return;
    const t = setTimeout(() => setOfferState("VERIFIED"), 2200);
    return () => clearTimeout(t);
  }, [shouldReduceMotion]);

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "clamp(24px, 4vw, 48px) 24px clamp(32px, 5vw, 64px)",
      }}
    >
      {/* === WORKSPACE IDENTITY + GREETING (Recent-inspired asymmetry) === */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, filter: "blur(8px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: "clamp(20px, 3vw, 32px)" }}
      >
        {/* Eyebrow – workspace */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--mg-text-muted)",
            }}
          >
            {merchantName} · Workspace
          </span>
          <span
            aria-hidden="true"
            style={{
              width: "3px",
              height: "3px",
              borderRadius: "50%",
              background: "var(--mg-glass-2-border)",
            }}
          />
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--mg-text-muted)",
            }}
          >
            {offersCount} offer{offersCount !== 1 ? "s" : ""} · {mandatesCount} mandate{mandatesCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Greeting – Kokonut-inspired subtle entrance, not sliced */}
        <h1
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: "clamp(1.75rem, 3.5vw, 2.4rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "var(--mg-text)",
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          {greeting}, {firstName}
          <span style={{ fontWeight: 400, color: "var(--mg-text-secondary)" }}>.</span>
        </h1>
      </motion.div>

      {/* === HERO GRID: LEFT insight + RIGHT offer object (asymmetrical) === */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.15fr 0.85fr",
          gap: "clamp(24px, 4vw, 48px)",
          alignItems: "start",
          marginBottom: "clamp(24px, 4vw, 40px)",
        }}
        className="pm-hero-grid"
      >
        {/* LEFT – Dominant insight */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Label */}
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: primaryState.label.includes("NO OFFER") ? "var(--mg-warning)" : primaryState.label.includes("MISSING") || primaryState.label.includes("NEEDS") ? "var(--mg-warning)" : "var(--mg-brand)",
              marginBottom: "10px",
            }}
          >
            {primaryState.label}
          </div>

          {/* Headline – editorial, not centered */}
          <h2
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: "clamp(1.6rem, 3.2vw, 2.2rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.15,
              color: "var(--mg-text)",
              margin: "0 0 12px",
              textWrap: "balance",
            }}
          >
            {topOffer
              ? matchRate !== null
                ? matchRate >= 70
                  ? "Your offer is ready for AI buyers."
                  : matchRate >= 40
                    ? "Your offer is understandable — some buyers miss it."
                    : "AI buyers are missing key terms."
                : "Your offer is recorded."
              : "Your offer isn’t ready yet."}
          </h2>

          <p
            style={{
              fontSize: "0.9375rem",
              lineHeight: 1.6,
              color: "var(--mg-text-secondary)",
              margin: "0 0 22px",
              maxWidth: "42ch",
            }}
          >
            {primaryState.message}{" "}
            {topOffer && (
              <span style={{ color: "var(--mg-text-muted)" }}>
                AI can verify price, billing and {topOffer.commitments.length ? topOffer.commitments.slice(0, 2).join(" and ") : "support terms"}.
              </span>
            )}
          </p>

          {/* Primary CTA – single, not 4 buttons */}
          <Link
            href={primaryState.ctaHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "11px 20px",
              background: "var(--mg-brand)",
              color: "white",
              borderRadius: "12px",
              fontSize: "0.875rem",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(59,130,246,0.22)",
              transition: "transform 150ms ease, box-shadow 150ms ease",
            }}
            className="pm-cta"
          >
            {primaryState.cta}
          </Link>

          {/* Quiet secondary links */}
          <div style={{ display: "flex", gap: "16px", marginTop: "14px", flexWrap: "wrap" }}>
            <Link
              href="/offer"
              style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--mg-brand)", textDecoration: "none" }}
            >
              View offer →
            </Link>
            <Link
              href="/ai-buyers"
              style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--mg-text-muted)", textDecoration: "none" }}
            >
              See buyer matches →
            </Link>
            <Link
              href="/protection"
              style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--mg-text-muted)", textDecoration: "none" }}
            >
              View protection →
            </Link>
          </div>
        </motion.div>

        {/* RIGHT – Offer Object anchor (subtle physical depth) */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
          whileHover={shouldReduceMotion ? undefined : { y: -2, transition: { duration: 0.2 } }}
          style={{
            background: "var(--mg-glass-2-bg)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid var(--mg-glass-2-border)",
            borderRadius: "18px",
            padding: "22px 22px 18px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 8px 32px -12px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Inner highlight – subtle, not glassmorphism */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
            }}
          />

          {topOffer ? (
            <>
              {/* Micro label */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--mg-text-muted)",
                  }}
                >
                  YOUR OFFER
                </span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={offerState}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      color: offerState === "VERIFIED" ? "var(--mg-success)" : "var(--mg-text-muted)",
                      background: offerState === "VERIFIED" ? "var(--mg-success-soft)" : "transparent",
                      border: offerState === "VERIFIED" ? "1px solid rgba(52,211,153,0.18)" : "1px solid transparent",
                      padding: "2px 8px",
                      borderRadius: "999px",
                    }}
                  >
                    {offerState === "VERIFIED" ? "✓ VERIFIED" : "READY"}
                  </motion.span>
                </AnimatePresence>
              </div>

              <div
                style={{
                  fontFamily: "var(--font-space-grotesk), sans-serif",
                  fontSize: "1.15rem",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "var(--mg-text)",
                  marginBottom: "4px",
                }}
              >
                {topOffer.name}
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "16px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-space-grotesk), sans-serif",
                    fontSize: "1.7rem",
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                    color: "var(--mg-text)",
                  }}
                >
                  <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>₹</span>
                  {price?.rupees}
                </span>
                <span style={{ fontSize: "0.8125rem", color: "var(--mg-text-secondary)" }}>{price?.suffix}</span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: topOffer.isConfirmed ? "var(--mg-success)" : "var(--mg-warning)",
                    background: topOffer.isConfirmed ? "var(--mg-success-soft)" : "var(--mg-warning-soft)",
                    padding: "3px 8px",
                    borderRadius: "999px",
                  }}
                >
                  {topOffer.isConfirmed ? "Confirmed" : "Draft"}
                </span>
              </div>

              {/* Commitments */}
              {topOffer.commitments.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "7px", marginBottom: "16px" }}>
                  {topOffer.commitments.slice(0, 3).map((c) => (
                    <div key={c} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                        <circle cx="8" cy="8" r="7" fill="var(--mg-success-soft)" stroke="var(--mg-success)" strokeWidth="1.2" />
                        <path d="M4.5 8L7 10.5L11.5 5.5" stroke="var(--mg-success)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span style={{ fontSize: "0.875rem", color: "var(--mg-text)" }}>{c}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* AI verifiable line – low emphasis */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  paddingTop: "12px",
                  borderTop: "1px solid var(--mg-glass-2-border)",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "10px",
                  color: "var(--mg-text-muted)",
                  letterSpacing: "0.02em",
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--mg-success)", flexShrink: 0 }} />
                AI can verify price, billing, {topOffer.commitments.length} commitment{topOffer.commitments.length !== 1 ? "s" : ""}
                {topOffer.versionHash && (
                  <span style={{ marginLeft: "auto", opacity: 0.6 }}>{topOffer.versionHash.slice(0, 8)}…</span>
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "18px 0" }}>
              <div
                style={{
                  fontFamily: "var(--font-space-grotesk), sans-serif",
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  color: "var(--mg-text)",
                  marginBottom: "6px",
                }}
              >
                Your offer isn’t ready yet
              </div>
              <p style={{ fontSize: "0.875rem", color: "var(--mg-text-secondary)", margin: "0 0 16px" }}>
                Add your first offer and see how AI buyers would understand it.
              </p>
              <Link
                href="/offer"
                style={{
                  display: "inline-flex",
                  padding: "8px 16px",
                  background: "var(--mg-brand)",
                  color: "white",
                  borderRadius: "10px",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Create offer →
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* === LOWER GRID: AI buyers + Protection (editorial, not equal cards) === */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: "16px",
        }}
        className="pm-lower-grid"
      >
        {/* AI BUYERS – Bklit-inspired meaningful funnel */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: "var(--mg-surface)",
            border: "1px solid var(--mg-glass-2-border)",
            borderRadius: "16px",
            padding: "20px 22px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--mg-text-muted)",
              marginBottom: "14px",
            }}
          >
            AI BUYERS
          </div>

          {matchRate !== null && funnel ? (
            <>
              {/* Large number with spring */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "10px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-space-grotesk), sans-serif",
                    fontSize: "2.8rem",
                    fontWeight: 800,
                    letterSpacing: "-0.05em",
                    lineHeight: 1,
                    color: "var(--mg-text)",
                  }}
                >
                  <SpringNumber value={matchRate} suffix="%" />
                </span>
                <span style={{ fontSize: "0.8125rem", color: "var(--mg-text-secondary)" }}>
                  of {funnel.total} buyer missions matched
                </span>
              </div>

              {/* Funnel – simple horizontal bars, progressive reveal via motion */}
              <div style={{ display: "flex", flexDirection: "column", gap: "7px", marginBottom: "14px" }}>
                {[
                  { label: "Understood", value: funnel.understood, total: funnel.total },
                  { label: "Matched", value: funnel.matched, total: funnel.total },
                ].map((step, idx) => (
                  <div key={step.label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--mg-text-muted)", width: "78px", textAlign: "right" }}>
                      {step.label}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: "8px",
                        background: "var(--mg-glass-1-bg)",
                        borderRadius: "999px",
                        overflow: "hidden",
                        border: "1px solid var(--mg-glass-2-border)",
                      }}
                    >
                      <motion.div
                        initial={shouldReduceMotion ? false : { width: 0 }}
                        animate={{ width: `${(step.value / step.total) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.4 + idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          height: "100%",
                          background: idx === 1 ? "var(--mg-brand)" : "var(--mg-text-muted)",
                          borderRadius: "999px",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--mg-text)", minWidth: "28px" }}>
                      {step.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Demand signals – lightweight, max 3-5 */}
              {demandSignals.length > 0 && (
                <div style={{ marginBottom: "14px" }}>
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "var(--mg-text-muted)",
                      marginBottom: "8px",
                    }}
                  >
                    Buyers are looking for
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {demandSignals.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "var(--mg-text-secondary)",
                          background: "var(--mg-surface-elevated)",
                          border: "1px solid var(--mg-glass-2-border)",
                          padding: "4px 10px",
                          borderRadius: "999px",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p style={{ fontSize: "0.8125rem", color: "var(--mg-text-secondary)", margin: "0 0 12px", lineHeight: 1.5 }}>
                {matchRate >= 70
                  ? "Your offer matches buyers looking for 1:1 mentoring under ₹4,000."
                  : matchRate >= 40
                    ? "Some buyer missions match — add structured details to improve."
                    : "Add more structured terms so AI can match your offer."}
              </p>
            </>
          ) : (
            <div style={{ padding: "10px 0" }}>
              <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--mg-text)", marginBottom: "6px" }}>
                Not tested yet
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--mg-text-secondary)", margin: 0 }}>
                Run an AI buyer simulation to see how missions match your offer.
              </p>
            </div>
          )}

          <Link
            href="/ai-buyers"
            style={{
              display: "inline-flex",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--mg-brand)",
              textDecoration: "none",
              marginTop: "4px",
            }}
          >
            {matchRate !== null ? "See buyer matches →" : "Test AI buyers →"}
          </Link>
        </motion.div>

        {/* PROTECTION – editorial authoritative */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: "var(--mg-surface)",
            border: "1px solid var(--mg-glass-2-border)",
            borderRadius: "16px",
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--mg-text-muted)",
              marginBottom: "16px",
            }}
          >
            PROTECTION
          </div>

          {mandatesCount > 0 ? (
            <>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "var(--mg-success-soft)",
                  border: "1px solid rgba(52,211,153,0.18)",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  alignSelf: "flex-start",
                  marginBottom: "14px",
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--mg-success)" }} />
                <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: "var(--mg-success)" }}>
                  PROTECTED
                </span>
              </div>

              <div
                style={{
                  fontFamily: "var(--font-space-grotesk), sans-serif",
                  fontSize: "2.2rem",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  color: "var(--mg-text)",
                  marginBottom: "4px",
                }}
              >
                <SpringNumber value={mandatesCount} />
                <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--mg-text-muted)", marginLeft: "6px" }}>
                  mandate{mandatesCount !== 1 ? "s" : ""}
                </span>
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--mg-text-secondary)", marginBottom: "16px" }}>
                protecting your payments
              </div>

              {stoppedChanges > 0 && protectionExample && (
                <div
                  style={{
                    background: "var(--mg-critical-soft)",
                    border: "1px solid rgba(248,113,113,0.18)",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: "var(--mg-critical)", marginBottom: "6px" }}>
                    PAYMENT STOPPED
                  </div>
                  <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "13px", fontWeight: 700, color: "var(--mg-text)", marginBottom: "4px" }}>
                    ₹{(protectionExample.from / 100).toLocaleString("en-IN")} → ₹{(protectionExample.to / 100).toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", color: "var(--mg-critical)" }}>
                    NO MONEY WAS MOVED.
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--mg-text)", marginBottom: "6px" }}>
                No active protection
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--mg-text-secondary)", margin: "0 0 16px" }}>
                Protection starts when a buyer authorizes your offer.
              </p>
            </>
          )}

          <Link
            href="/protection"
            style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--mg-brand)", textDecoration: "none", marginTop: "auto" }}
          >
            View protection →
          </Link>
        </motion.div>
      </div>

      {/* Responsive: stack on mobile */}
      <style>{`
        @media (max-width: 860px) {
          .pm-hero-grid { grid-template-columns: 1fr !important; }
          .pm-lower-grid { grid-template-columns: 1fr !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pm-cta { transition: none !important; }
        }
        .pm-cta:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(59,130,246,0.28) !important; }
        .pm-cta:active { transform: scale(0.99); }
      `}</style>
    </div>
  );
}
