"use client";

import React from "react";
import { MGBlurFade } from "../mg-primitives";

interface MetricItem {
  value: string;
  label: string;
  description: string;
}

const BENCHMARK_METRICS: MetricItem[] = [
  {
    value: "100",
    label: "BUYER MISSIONS TESTED",
    description: "Multi-constraint missions spanning budgets, response SLAs, and mentor formats across Indian tech offerings.",
  },
  {
    value: "91.7%",
    label: "RECOMMENDATION ACCURACY",
    description: "Evaluated against human ground-truth rankings across diverse buyer prompts.",
  },
  {
    value: "0%",
    label: "HARD-CONSTRAINT VIOLATIONS",
    description: "Deterministic policy layer strictly blocks any offer exceeding price limits or missing required SLAs.",
  },
  {
    value: "100%",
    label: "GROUNDED REASONS",
    description: "Zero AI hallucination: every recommendation rationale is grounded in verified catalog facts.",
  },
];

/**
 * 09 — WHAT WE MEASURE
 * Evidence-Based Social Proof (Zero Fake Testimonials)
 * Authoritative typographic evaluation metrics on Razorpay Test Mode.
 */
export function EvidenceExperience() {
  return (
    <section
      id="what-we-measure"
      style={{
        maxWidth: "1120px",
        margin: "0 auto",
        padding: "80px 20px",
        position: "relative",
      }}
    >
      <MGBlurFade delay={50}>
        <div style={{ textAlign: "center", marginBottom: "44px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "99px",
              background: "rgba(11, 92, 255, 0.1)",
              border: "1px solid rgba(11, 92, 255, 0.25)",
              color: "#0B5CFF",
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "14px",
            }}
          >
            <span>09</span> WHAT WE MEASURE
          </div>
          <h2
            style={{
              fontSize: "clamp(2.2rem, 4.4vw, 3.4rem)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "var(--mg-text)",
              maxWidth: "760px",
              margin: "0 auto 14px",
            }}
          >
            Evidence, not AI marketing.
          </h2>
          <p
            style={{
              fontSize: "clamp(1rem, 1.4vw, 1.15rem)",
              color: "var(--mg-text-secondary)",
              maxWidth: "580px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            We measure agentic commerce objectively against deterministic ground truth. No fabricated testimonials.
          </p>
        </div>
      </MGBlurFade>

      {/* 4 Large Typographic Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
        }}
      >
        {BENCHMARK_METRICS.map((m, idx) => (
          <div
            key={idx}
            style={{
              background: "var(--mg-surface)",
              border: "1px solid var(--mg-border)",
              borderRadius: "20px",
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "transform 0.2s ease, border-color 0.2s ease",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "clamp(2.6rem, 4.5vw, 3.6rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  color: idx === 2 ? "var(--mg-success)" : "#0B5CFF",
                  lineHeight: 1.05,
                  marginBottom: "12px",
                }}
              >
                {m.value}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--mg-text)",
                  marginBottom: "8px",
                }}
              >
                {m.label}
              </div>
            </div>

            <div style={{ fontSize: "12px", color: "var(--mg-text-secondary)", lineHeight: 1.5 }}>
              {m.description}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
