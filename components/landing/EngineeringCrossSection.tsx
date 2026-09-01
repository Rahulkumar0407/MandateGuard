"use client";

import React, { useRef, useState, useLayoutEffect } from "react";
import { gsap } from "@/lib/gsap";

const FLOW_STEPS = [
  {
    step: "01",
    actor: "AI BUYER",
    summary: "I need a human mentor under ₹4,000 with 24h support.",
    detail: "Buyer specifies goals and hard constraints.",
    badge: "INTENT",
  },
  {
    step: "02",
    actor: "MANDATEGUARD",
    summary: "Parses constraints: mentor · ≤₹4,000 · 24h SLA",
    detail: "Extracts machine-verifiable hard constraints.",
    badge: "PARSED",
  },
  {
    step: "03",
    actor: "MARKET",
    summary: "System Design Pro — clearest match",
    detail: "Ranks offers by verified fact density.",
    badge: "RANKED",
  },
  {
    step: "04",
    actor: "BUYER",
    summary: "₹3,999/month — approved",
    detail: "Locks exact terms into immutable snapshot.",
    badge: "AUTHORIZED",
  },
  {
    step: "05",
    actor: "RAZORPAY",
    summary: "₹3,999 executed",
    detail: "Payment gates on exact term match.",
    badge: "EXECUTED",
  },
];

const DEV_SPECS = [
  {
    id: "intent",
    title: "Buyer Intent Schema",
    desc: "Zod schema parsing buyer constraints into budget ceilings and required clauses.",
    code: `export const BuyerIntentSchema = z.object({
  category: z.string(),
  maxBudgetInr: z.number().int().positive(),
  requiredCommitments: z.array(z.string()),
  currency: z.literal("INR")
});`,
  },
  {
    id: "contract",
    title: "Offer Hash",
    desc: "Cryptographic SHA-256 version hash locking merchant commitments.",
    code: `export function computeOfferHash(
  offer: OfferVersion
): string {
  const payload = JSON.stringify(offer.commitments);
  return crypto.createHash("sha256")
    .update(payload).digest("hex");
}`,
  },
  {
    id: "gate",
    title: "Policy Gate",
    desc: "Hard-constraint evaluation enforcing strict boolean price and term invariants.",
    code: `export function evaluatePolicy(
  intent: BuyerIntent,
  offer: Offer
): PolicyVerdict {
  if (offer.price > intent.maxBudgetInr) {
    return { authorized: false,
      reason: "BUDGET_EXCEEDED" };
  }
  return { authorized: true };
}`,
  },
  {
    id: "executor",
    title: "Mutation Executor",
    desc: "Sole application-level provider mutation boundary gating all Razorpay operations.",
    code: `export async function executeGatedMutation(
  action: FinancialAction
) {
  await verifyImmutableSnapshot(
    action.snapshotId, action.expectedHash
  );
  return await RazorpayGateway
    .createSubscription(action.params);
}`,
  },
];

export function EngineeringCrossSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [showDevSpecs, setShowDevSpecs] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useLayoutEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".flow-step",
        { opacity: 0.6, y: 16 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            end: "top 30%",
            scrub: 0.5,
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
      id="technical-proof"
      className="w-full"
      style={{ background: "var(--mg-bg)" }}
    >
      <div
        className="mg-section"
        style={{ maxWidth: "var(--container-wide)", margin: "0 auto", padding: "var(--section-py) var(--section-px)" }}
      >
        {/* ─── Header ─── */}
        <div style={{ marginBottom: "clamp(3rem, 6vw, 5rem)" }}>
          <div className="mg-micro" style={{ color: "var(--mg-text-muted)", marginBottom: "1rem", letterSpacing: "0.12em" }}>
            11 — UNDER THE HOOD
          </div>

          <h2 className="mg-display" style={{ color: "var(--mg-text)", maxWidth: "20ch", marginBottom: "1.5rem" }}>
            How MandateGuard connects
            <br />
            <span className="mg-brand">the decision to the payment.</span>
          </h2>

          <p className="mg-body" style={{ color: "var(--mg-text-secondary)", maxWidth: "52ch" }}>
            AI decides what it wants. MandateGuard makes sure the purchase matches exactly
            what the buyer approved — deterministically, without human review.
          </p>
        </div>

        {/* ─── Architecture Flow ─── */}
        <div style={{ marginBottom: "3rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${FLOW_STEPS.length}, 1fr)`,
              gap: "0.75rem",
              position: "relative",
            }}
          >
            {FLOW_STEPS.map((step, i) => (
              <React.Fragment key={step.step}>
                <div
                  className="flow-step"
                  style={{
                    padding: "1.25rem 1rem",
                    background: "var(--mg-surface)",
                    border: "1px solid var(--mg-glass-1-border)",
                    borderRadius: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        fontSize: "0.5625rem",
                        fontWeight: 700,
                        color: "var(--mg-text-muted)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {step.step}
                    </span>
                    <span
                      style={{
                        padding: "0.125rem 0.5rem",
                        borderRadius: "0.25rem",
                        background: i === 1 || i === 3 ? "var(--mg-brand-soft)" : "var(--mg-bg)",
                        border: `1px solid ${i === 1 || i === 3 ? "rgba(11,92,255,0.2)" : "var(--mg-glass-1-border)"}`,
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        fontSize: "0.5625rem",
                        fontWeight: 700,
                        color: i === 1 || i === 3 ? "var(--mg-brand)" : "var(--mg-text-muted)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {step.badge}
                    </span>
                  </div>

                  <div
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      color: "var(--mg-brand)",
                      marginBottom: "0.375rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {step.actor}
                  </div>

                  <div
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--mg-text)",
                      lineHeight: 1.4,
                      marginBottom: "0.5rem",
                    }}
                  >
                    {step.summary}
                  </div>

                  <div
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "0.75rem",
                      color: "var(--mg-text-muted)",
                      lineHeight: 1.4,
                    }}
                  >
                    {step.detail}
                  </div>
                </div>

                {i < FLOW_STEPS.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: `calc(${(i + 1) * 100 / FLOW_STEPS.length}% - 0.75rem)`,
                      transform: "translateY(-50%)",
                      zIndex: 5,
                      pointerEvents: "none",
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6h8M7 3l3 3-3 3" stroke="var(--mg-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ─── Developer Details ─── */}
        <div
          style={{
            borderTop: "1px solid var(--mg-glass-1-border)",
            paddingTop: "1.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "0.6875rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--mg-text-muted)",
              }}
            >
              FOR DEVELOPERS
            </span>
            <button
              onClick={() => setShowDevSpecs(!showDevSpecs)}
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "0.6875rem",
                fontWeight: 700,
                color: "var(--mg-brand)",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              {showDevSpecs ? "Hide technical detail ↑" : "Show technical detail →"}
            </button>
          </div>

          {showDevSpecs && (
            <div
              style={{
                padding: "1.5rem",
                background: "var(--mg-surface)",
                border: "1px solid var(--mg-glass-1-border)",
                borderRadius: "0.75rem",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${DEV_SPECS.length}, 1fr)`,
                  gap: "0.5rem",
                  marginBottom: "1.25rem",
                }}
              >
                {DEV_SPECS.map((spec, i) => (
                  <button
                    key={spec.id}
                    onClick={() => setActiveTab(i)}
                    style={{
                      padding: "0.625rem 0.875rem",
                      borderRadius: "0.5rem",
                      border: `1px solid ${activeTab === i ? "var(--mg-brand)" : "var(--mg-glass-1-border)"}`,
                      background: activeTab === i ? "var(--mg-brand-soft)" : "var(--mg-bg)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        fontSize: "0.625rem",
                        fontWeight: 700,
                        color: activeTab === i ? "var(--mg-brand)" : "var(--mg-text-muted)",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      {spec.title}
                    </div>
                  </button>
                ))}
              </div>

              <p
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: "0.875rem",
                  color: "var(--mg-text-secondary)",
                  marginBottom: "1rem",
                }}
              >
                {DEV_SPECS[activeTab].desc}
              </p>

              <div
                style={{
                  padding: "1.25rem",
                  background: "var(--mg-bg)",
                  border: "1px solid var(--mg-glass-1-border)",
                  borderRadius: "0.5rem",
                  overflow: "auto",
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "0.75rem",
                    color: "var(--mg-text)",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <code>{DEV_SPECS[activeTab].code}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
