"use client";

import React, { useState } from "react";
import { MGBlurFade } from "../mg-primitives";

/**
 * 02 — MAKE YOUR OFFER UNDERSTANDABLE
 * Single Object Morph Pattern
 * AI cannot buy what it cannot clearly understand.
 * Morphs vague marketing adjectives into machine-verifiable commercial commitments.
 */
export function OfferClarityExperience() {
  const [isStructured, setIsStructured] = useState(true);

  return (
    <section
      id="offer-clarity"
      style={{
        maxWidth: "1120px",
        margin: "0 auto",
        padding: "80px 20px",
        position: "relative",
      }}
    >
      <MGBlurFade delay={50}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
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
            <span>02</span> OFFER CLARITY
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
            AI cannot buy what it cannot understand.
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
            Vague marketing language creates uncertainty for AI buyers. Turn prose into machine-verifiable commitments.
          </p>
        </div>
      </MGBlurFade>

      {/* Single Morphing Commercial Object */}
      <div
        style={{
          maxWidth: "780px",
          margin: "0 auto",
          background: "var(--mg-glass-2-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: isStructured ? "1px solid rgba(11, 92, 255, 0.4)" : "1px solid var(--mg-border)",
          borderRadius: "24px",
          padding: "clamp(24px, 4vw, 40px)",
          boxShadow: isStructured ? "0 20px 60px rgba(11, 92, 255, 0.12)" : "0 16px 40px rgba(0, 0, 0, 0.1)",
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Toggle Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: isStructured ? "#0B5CFF" : "var(--mg-text-muted)",
            }}
          >
            {isStructured ? "✓ STRUCTURED COMMITMENTS" : "⚠ UNSTRUCTURED MARKETING"}
          </span>

          <div
            style={{
              display: "flex",
              background: "var(--mg-surface)",
              borderRadius: "12px",
              padding: "3px",
              border: "1px solid var(--mg-border)",
            }}
          >
            <button
              onClick={() => setIsStructured(false)}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "none",
                background: !isStructured ? "rgba(239, 68, 68, 0.15)" : "transparent",
                color: !isStructured ? "var(--mg-critical)" : "var(--mg-text-secondary)",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Vague Copy
            </button>
            <button
              onClick={() => setIsStructured(true)}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "none",
                background: isStructured ? "#0B5CFF" : "transparent",
                color: isStructured ? "white" : "var(--mg-text-secondary)",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: isStructured ? "0 0 14px rgba(11, 92, 255, 0.35)" : "none",
              }}
            >
              Structured Offer
            </button>
          </div>
        </div>

        {/* Content Body */}
        {!isStructured ? (
          <div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--mg-text)",
                lineHeight: 1.5,
                marginBottom: "20px",
                fontStyle: "italic",
              }}
            >
              &ldquo;Premium guidance from industry experts. World-class curriculum with extensive support and guaranteed satisfaction for top engineers.&rdquo;
            </div>

            <div
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                borderRadius: "14px",
                padding: "14px 18px",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--mg-critical)", marginBottom: "6px" }}>
                AI BUYER DIAGNOSIS:
              </div>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "var(--mg-text-secondary)", lineHeight: 1.6 }}>
                <li>Who is the mentor? (Human vs bot vs recordings unstated)</li>
                <li>What is the response time? (No verifiable SLA)</li>
                <li>What are the refund terms? (&ldquo;Satisfaction&rdquo; is not a contract)</li>
              </ul>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "20px" }}>
              <div style={{ background: "var(--mg-surface)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--mg-border)" }}>
                <div style={{ fontSize: "11px", color: "var(--mg-text-muted)", fontWeight: 700 }}>SUPPORT FORMAT</div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--mg-text)", marginTop: "2px" }}>Dedicated 1:1 Human Mentor</div>
                <div style={{ fontSize: "11px", color: "var(--mg-success)", fontWeight: 700, marginTop: "4px" }}>✓ Verified Commitment</div>
              </div>

              <div style={{ background: "var(--mg-surface)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--mg-border)" }}>
                <div style={{ fontSize: "11px", color: "var(--mg-text-muted)", fontWeight: 700 }}>CADENCE</div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--mg-text)", marginTop: "2px" }}>4 Live Sessions / mo</div>
                <div style={{ fontSize: "11px", color: "var(--mg-success)", fontWeight: 700, marginTop: "4px" }}>✓ Verified Commitment</div>
              </div>

              <div style={{ background: "var(--mg-surface)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--mg-border)" }}>
                <div style={{ fontSize: "11px", color: "var(--mg-text-muted)", fontWeight: 700 }}>RESPONSE SLA</div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--mg-text)", marginTop: "2px" }}>Guaranteed 24h SLA</div>
                <div style={{ fontSize: "11px", color: "var(--mg-success)", fontWeight: 700, marginTop: "4px" }}>✓ Verified Commitment</div>
              </div>

              <div style={{ background: "var(--mg-surface)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--mg-border)" }}>
                <div style={{ fontSize: "11px", color: "var(--mg-text-muted)", fontWeight: 700 }}>BILLING & REFUND</div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#0B5CFF", marginTop: "2px" }}>₹3,499/mo · 30-Day Guarantee</div>
                <div style={{ fontSize: "11px", color: "var(--mg-success)", fontWeight: 700, marginTop: "4px" }}>✓ Verified Commitment</div>
              </div>
            </div>

            <div
              style={{
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                borderRadius: "14px",
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span style={{ fontSize: "18px" }}>🛡️</span>
              <div style={{ fontSize: "12px", color: "var(--mg-text)", fontWeight: 600 }}>
                <strong style={{ color: "var(--mg-success)" }}>100% Machine-Verifiable:</strong> AI buyers can extract facts, compare attributes, and authorize purchase with zero hallucination.
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
