"use client";

import React, { useState } from "react";
import { MGBlurFade } from "../mg-primitives";

/**
 * 01 — THE SHIFT
 * 21st.dev Container Scroll / Viewport Transformation Pattern
 * Compares the friction of traditional human browsing vs. instantaneous AI delegated shopping.
 */
export function ShiftExperience() {
  const [activeTab, setActiveTab] = useState<"traditional" | "ai">("ai");

  return (
    <section
      id="the-shift"
      style={{
        maxWidth: "1120px",
        margin: "0 auto",
        padding: "100px 20px 80px",
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
            <span>01</span> THE SHIFT
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
            AI is becoming the buyer.
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
            Traditional buyers read marketing copy. AI buyers parse structured commitments.
          </p>
        </div>
      </MGBlurFade>

      {/* Interactive Toggle Switch */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "28px",
        }}
      >
        <div
          role="tablist"
          aria-label="Shopping Paradigm Switcher"
          style={{
            background: "var(--mg-surface)",
            border: "1px solid var(--mg-border)",
            borderRadius: "14px",
            padding: "4px",
            display: "inline-flex",
            gap: "4px",
          }}
        >
          <button
            role="tab"
            aria-selected={activeTab === "traditional"}
            onClick={() => setActiveTab("traditional")}
            style={{
              padding: "8px 20px",
              borderRadius: "10px",
              border: "none",
              background: activeTab === "traditional" ? "var(--mg-text)" : "transparent",
              color: activeTab === "traditional" ? "var(--mg-bg)" : "var(--mg-text-secondary)",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Traditional Human (1995–2024)
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "ai"}
            onClick={() => setActiveTab("ai")}
            style={{
              padding: "8px 20px",
              borderRadius: "10px",
              border: "none",
              background: activeTab === "ai" ? "#0B5CFF" : "transparent",
              color: activeTab === "ai" ? "white" : "var(--mg-text-secondary)",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: activeTab === "ai" ? "0 0 16px rgba(11, 92, 255, 0.35)" : "none",
            }}
          >
            AI Delegated Commerce (Now)
          </button>
        </div>
      </div>

      {/* Container Transformation Viewport (21st.dev Container Scroll Concept) */}
      <div
        style={{
          background: "var(--mg-glass-2-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid var(--mg-border)",
          borderRadius: "24px",
          padding: "clamp(20px, 3.5vw, 36px)",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.15)",
          minHeight: "380px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {activeTab === "traditional" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                background: "var(--mg-surface)",
                border: "1px dashed var(--mg-border)",
                borderRadius: "16px",
                padding: "20px",
                textAlign: "center",
                opacity: 0.85,
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>📑</div>
              <div style={{ fontSize: "14px", fontWeight: 800, marginBottom: "4px" }}>1. Open 12 Tabs</div>
              <div style={{ fontSize: "12px", color: "var(--mg-text-secondary)", lineHeight: 1.4 }}>
                Sifting through SEO articles, sponsored rankings, and popups.
              </div>
            </div>

            <div
              style={{
                background: "var(--mg-surface)",
                border: "1px dashed var(--mg-border)",
                borderRadius: "16px",
                padding: "20px",
                textAlign: "center",
                opacity: 0.85,
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>⏳</div>
              <div style={{ fontSize: "14px", fontWeight: 800, marginBottom: "4px" }}>2. Read 2,000 Words</div>
              <div style={{ fontSize: "12px", color: "var(--mg-text-secondary)", lineHeight: 1.4 }}>
                Trying to figure out who actually teaches and what SLA applies.
              </div>
            </div>

            <div
              style={{
                background: "var(--mg-surface)",
                border: "1px dashed var(--mg-border)",
                borderRadius: "16px",
                padding: "20px",
                textAlign: "center",
                opacity: 0.85,
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>💳</div>
              <div style={{ fontSize: "14px", fontWeight: 800, marginBottom: "4px" }}>3. Manual Checkout</div>
              <div style={{ fontSize: "12px", color: "var(--mg-text-secondary)", lineHeight: 1.4 }}>
                Entering OTPs, risk of hidden terms drift on monthly renewal.
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.2fr",
              gap: "24px",
              alignItems: "center",
            }}
          >
            {/* Left: Natural Buyer Intent */}
            <div
              style={{
                background: "rgba(11, 92, 255, 0.06)",
                border: "1px solid rgba(11, 92, 255, 0.3)",
                borderRadius: "18px",
                padding: "24px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#0B5CFF",
                  marginBottom: "10px",
                }}
              >
                AI BUYER INTENT
              </div>
              <div
                style={{
                  fontSize: "17px",
                  fontWeight: 800,
                  lineHeight: 1.4,
                  color: "var(--mg-text)",
                  fontStyle: "italic",
                }}
              >
                &ldquo;Find me a system design mentor under ₹4,000 with 24-hour response support.&rdquo;
              </div>
              <div style={{ marginTop: "14px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "99px", background: "rgba(11, 92, 255, 0.15)", color: "#0B5CFF" }}>
                  Budget: ≤ ₹4,000
                </span>
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "99px", background: "rgba(11, 92, 255, 0.15)", color: "#0B5CFF" }}>
                  SLA: 24h guaranteed
                </span>
              </div>
            </div>

            {/* Right: Instant Autonomous Evaluation */}
            <div
              style={{
                background: "var(--mg-surface)",
                border: "1px solid var(--mg-border)",
                borderRadius: "18px",
                padding: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--mg-text-muted)" }}>
                  MACHINE RESOLUTION
                </span>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--mg-success)" }}>
                  ✓ 320ms Execution
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--mg-bg)", borderRadius: "10px", border: "1px solid var(--mg-border)" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700 }}>1. Filters 48 catalog items</span>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#0B5CFF" }}>45 eliminated</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--mg-bg)", borderRadius: "10px", border: "1px solid var(--mg-border)" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700 }}>2. Validates SLA & 1:1 support</span>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#0B5CFF" }}>Verified facts</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "10px", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--mg-success)" }}>3. Purchases chosen offer safely</span>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--mg-success)" }}>Protected ₹3,499</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
