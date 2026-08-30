"use client";

import React, { useState } from "react";
import { MGBlurFade } from "../mg-primitives";

interface ForensicStep {
  id: number;
  label: string;
  badgeColor: string;
  title: string;
  description: string;
  highlightKey: "wanted" | "offer" | "verified" | "missing";
}

const FORENSIC_STEPS: ForensicStep[] = [
  {
    id: 1,
    label: "STEP 1: BUYER CONSTRAINTS",
    badgeColor: "#0B5CFF",
    title: "Buyer Wanted Specific Commitments",
    description: "The buyer instructed their AI: 'Dedicated human mentor, under ₹4,000/mo, 24h response SLA'. The AI sets these as hard boolean constraints.",
    highlightKey: "wanted",
  },
  {
    id: 2,
    label: "STEP 2: CATALOG RETRIEVAL",
    badgeColor: "var(--mg-text-muted)",
    title: "Your Offer Entered the Candidate Pool",
    description: "Your title 'Expert guidance & recordings' at ₹3,999 matched keyword retrieval and price eligibility.",
    highlightKey: "offer",
  },
  {
    id: 3,
    label: "STEP 3: MACHINE PARSING",
    badgeColor: "var(--mg-success)",
    title: "AI Verified Price & Billing Cadence",
    description: "The price point (₹3,999) and monthly recurrence were confirmed as strictly within the buyer's ₹4,000 ceiling.",
    highlightKey: "verified",
  },
  {
    id: 4,
    label: "STEP 4: CONSTRAINT FAILURE",
    badgeColor: "var(--mg-critical)",
    title: "AI Failed to Verify Mentor & SLA",
    description: "Your catalog description did not specify if 'expert' means 1:1 human assistance, nor did it state a response time SLA. The AI could not take the risk and chose #1 instead.",
    highlightKey: "missing",
  },
];

/**
 * 04 — WHY BUYERS LEAVE
 * Aceternity Sticky Scroll Reveal / Forensic Product Inspection Pattern
 * Turns an invisible loss into an obvious, actionable diagnosis.
 */
export function WhyBuyersLeaveExperience() {
  const [activeStepId, setActiveStepId] = useState(1);

  const activeStep = FORENSIC_STEPS.find((s) => s.id === activeStepId) || FORENSIC_STEPS[0];

  return (
    <section
      id="why-buyers-leave"
      style={{
        maxWidth: "1120px",
        margin: "0 auto",
        padding: "80px 20px",
        position: "relative",
      }}
    >
      <MGBlurFade delay={50}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
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
            <span>04</span> FORENSIC INSPECTION
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
            See exactly why you lost.
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
            When an AI buyer passes on your offer, it leaves an exact audit trail of verified fits and missing commitments.
          </p>
        </div>
      </MGBlurFade>

      {/* Forensic Inspection Surface (Left: Live Offer Inspector, Right: Forensic Timeline) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: "28px",
          alignItems: "start",
        }}
      >
        {/* Left: Dynamic Persistent Offer Contract View */}
        <div
          style={{
            position: "sticky",
            top: "80px",
            background: "var(--mg-glass-2-bg)",
            backdropFilter: "blur(24px)",
            border: "1px solid var(--mg-glass-2-border)",
            borderRadius: "24px",
            padding: "28px",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.15)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: "rgba(11, 92, 255, 0.15)",
                  color: "#0B5CFF",
                  fontWeight: 900,
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                YB
              </div>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--mg-text)" }}>YOUR BUSINESS</span>
            </div>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#0B5CFF" }}>₹3,999/mo</span>
          </div>

          <div
            style={{
              padding: "12px 16px",
              borderRadius: "12px",
              background: activeStep.highlightKey === "offer" ? "rgba(11, 92, 255, 0.12)" : "var(--mg-surface)",
              border: activeStep.highlightKey === "offer" ? "1px solid rgba(11, 92, 255, 0.4)" : "1px solid var(--mg-border)",
              marginBottom: "16px",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ fontSize: "11px", color: "var(--mg-text-muted)", fontWeight: 700 }}>CATALOG DESCRIPTOR</div>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--mg-text)", marginTop: "2px" }}>
              &ldquo;Expert guidance & recordings&rdquo;
            </div>
          </div>

          {/* Verified vs Missing Attributes */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                background: activeStep.highlightKey === "verified" ? "rgba(16, 185, 129, 0.12)" : "var(--mg-surface)",
                border: activeStep.highlightKey === "verified" ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid var(--mg-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 700 }}>Price ≤ ₹4,000 / month</span>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--mg-success)" }}>✓ VERIFIED FIT</span>
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                background: activeStep.highlightKey === "missing" ? "rgba(239, 68, 68, 0.12)" : "var(--mg-surface)",
                border: activeStep.highlightKey === "missing" ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid var(--mg-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 700 }}>Dedicated 1:1 Human Mentor</span>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--mg-critical)" }}>? UNVERIFIED</span>
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                background: activeStep.highlightKey === "missing" ? "rgba(239, 68, 68, 0.12)" : "var(--mg-surface)",
                border: activeStep.highlightKey === "missing" ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid var(--mg-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 700 }}>Guaranteed 24h Response SLA</span>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--mg-critical)" }}>? UNVERIFIED</span>
            </div>
          </div>
        </div>

        {/* Right: Step-by-Step Forensic Timeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {FORENSIC_STEPS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveStepId(s.id)}
              style={{
                textAlign: "left",
                background: activeStepId === s.id ? "var(--mg-surface)" : "transparent",
                border: activeStepId === s.id ? "1px solid rgba(11, 92, 255, 0.4)" : "1px solid var(--mg-border)",
                borderRadius: "16px",
                padding: "18px 20px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: activeStepId === s.id ? "0 4px 20px rgba(0,0,0,0.1)" : "none",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  color: s.badgeColor,
                  marginBottom: "4px",
                }}
              >
                {s.label}
              </div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--mg-text)", marginBottom: "4px" }}>
                {s.title}
              </div>
              <div style={{ fontSize: "12px", color: "var(--mg-text-secondary)", lineHeight: 1.5 }}>
                {s.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
