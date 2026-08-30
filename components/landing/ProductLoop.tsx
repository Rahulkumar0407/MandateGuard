"use client";

import React, { useState } from "react";
import { MGBlurFade } from "../mg-primitives";

interface LoopStage {
  id: number;
  title: string;
  tagline: string;
  detail: string;
  icon: string;
}

const LOOP_STAGES: LoopStage[] = [
  {
    id: 1,
    title: "UNDERSTAND",
    tagline: "Make your offer clear to AI.",
    detail: "Transform unverified prose into deterministic structured commitments with machine-verifiable SLAs.",
    icon: "🔍",
  },
  {
    id: 2,
    title: "GET CHOSEN",
    tagline: "Show up when buyers search.",
    detail: "Rank #1 across simulated and real buyer missions through verified hard-constraint alignment.",
    icon: "⭐",
  },
  {
    id: 3,
    title: "APPROVE",
    tagline: "Buyer authorizes the purchase.",
    detail: "Create immutable authorization snapshots with cryptographically bound budget and provider terms.",
    icon: "✓",
  },
  {
    id: 4,
    title: "PROTECT",
    tagline: "Terms stay protected.",
    detail: "CommerceMutationExecutor intercepts mid-cycle term drift and stops unauthorized charges before Razorpay executes.",
    icon: "🛡️",
  },
  {
    id: 5,
    title: "IMPROVE",
    tagline: "Learn from missed demand.",
    detail: "Continuously extract failure evidence from lost missions to suggest verified catalogue improvements.",
    icon: "⚡",
  },
];

/**
 * 08 — THE LOOP
 * 21st.dev Radial Orbital Timeline Inspired Organic Loop
 * Living continuous commerce engine.
 */
export function ProductLoop() {
  const [activeStageId, setActiveStageId] = useState(1);

  return (
    <section
      id="product-loop"
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
            <span>08</span> CONTINUOUS LOOP
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
            A living commerce engine.
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
            From machine discovery to safe transaction execution, every step feeds the next.
          </p>
        </div>
      </MGBlurFade>

      {/* Interactive Loop Stages Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "14px",
          marginBottom: "28px",
        }}
      >
        {LOOP_STAGES.map((s) => {
          const isActive = s.id === activeStageId;
          return (
            <button
              key={s.id}
              onClick={() => setActiveStageId(s.id)}
              onMouseEnter={() => setActiveStageId(s.id)}
              style={{
                textAlign: "left",
                background: isActive ? "var(--mg-glass-2-bg)" : "var(--mg-surface)",
                backdropFilter: isActive ? "blur(20px)" : "none",
                border: isActive ? "1.5px solid rgba(11, 92, 255, 0.6)" : "1px solid var(--mg-border)",
                borderRadius: "18px",
                padding: "20px 18px",
                cursor: "pointer",
                boxShadow: isActive ? "0 12px 36px rgba(11, 92, 255, 0.2)" : "none",
                transform: isActive ? "translateY(-3px)" : "translateY(0)",
                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "20px" }}>{s.icon}</span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 900,
                    color: isActive ? "#0B5CFF" : "var(--mg-text-muted)",
                  }}
                >
                  0{s.id}
                </span>
              </div>
              <div style={{ fontSize: "14px", fontWeight: 900, color: isActive ? "#0B5CFF" : "var(--mg-text)", marginBottom: "4px" }}>
                {s.title}
              </div>
              <div style={{ fontSize: "12px", color: "var(--mg-text-secondary)", lineHeight: 1.4 }}>
                {s.tagline}
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded Active Stage Detail Banner */}
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          background: "var(--mg-surface)",
          border: "1px solid rgba(11, 92, 255, 0.3)",
          borderRadius: "18px",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <span
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "rgba(11, 92, 255, 0.15)",
            color: "#0B5CFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: "16px",
            flexShrink: 0,
          }}
        >
          0{activeStageId}
        </span>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--mg-text)" }}>
            {LOOP_STAGES.find((s) => s.id === activeStageId)?.title} — {LOOP_STAGES.find((s) => s.id === activeStageId)?.tagline}
          </div>
          <div style={{ fontSize: "12px", color: "var(--mg-text-secondary)", marginTop: "2px" }}>
            {LOOP_STAGES.find((s) => s.id === activeStageId)?.detail}
          </div>
        </div>
      </div>
    </section>
  );
}
