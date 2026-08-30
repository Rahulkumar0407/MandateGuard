"use client";

import React from "react";
import { ShieldIcon } from "./ShieldIcon";

export interface ProductSpotlightProps {
  resultTitle: string;
  rank: number;
  price: string;
  pricePerMonth: string;
  shortDescriptor?: string;
  isMerchant: boolean;
  good: string[];
  missing: string[];
  explanation: string;
  buyerWanted: string[];
  improvedTo: string[];
  isDiagnosis?: boolean;
  isImprovement?: boolean;
  isImprovementPressed?: boolean;
  isChosen?: boolean;
  onTryImprovement?: () => void;
  reducedMotion?: boolean;
}

/**
 * ProductSpotlight — Large, dominant product spotlight stage (21st.dev inspired).
 * Replaces the generic rectangular dashboard inspector.
 * Transforms the focused search candidate into a tactile, rich, focused product surface
 * with integrated attribute evaluation, diagnostic reasoning, and improvement actions.
 */
export function ProductSpotlight({
  resultTitle,
  rank,
  pricePerMonth,
  shortDescriptor,
  isMerchant,
  good,
  missing,
  explanation,
  buyerWanted,
  improvedTo,
  isDiagnosis = false,
  isImprovement = false,
  isImprovementPressed = false,
  isChosen = false,
  onTryImprovement,
  reducedMotion = false,
}: ProductSpotlightProps) {
  const merchantStorefront = isMerchant ? "INTERVIEWFORGE AI" : resultTitle.toUpperCase();

  return (
    <div
      style={{
        position: "relative",
        background: isChosen
          ? "linear-gradient(145deg, rgba(16, 185, 129, 0.12), var(--mg-glass-2-bg))"
          : isDiagnosis
            ? "linear-gradient(145deg, rgba(245, 158, 11, 0.1), var(--mg-glass-2-bg))"
            : "linear-gradient(145deg, rgba(11, 92, 255, 0.08), var(--mg-glass-2-bg))",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: isChosen
          ? "1px solid rgba(16, 185, 129, 0.6)"
          : isDiagnosis
            ? "1px solid rgba(245, 158, 11, 0.5)"
            : "1px solid var(--mg-glass-2-border)",
        borderRadius: "22px",
        padding: "18px 24px",
        boxShadow: isChosen
          ? "0 18px 50px rgba(16, 185, 129, 0.22), var(--mg-glass-2-shadow)"
          : isDiagnosis
            ? "0 16px 45px rgba(245, 158, 11, 0.18), var(--mg-glass-2-shadow)"
            : "0 16px 45px rgba(11, 92, 255, 0.16), var(--mg-glass-2-shadow)",
        transition: reducedMotion
          ? "none"
          : "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* 21st.dev Ambient Focus Spotlight Radial Light */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-30%",
          right: "-20%",
          width: "120%",
          height: "150%",
          background: isChosen
            ? "radial-gradient(circle at 70% 20%, rgba(16, 185, 129, 0.18) 0%, transparent 65%)"
            : isDiagnosis
              ? "radial-gradient(circle at 70% 20%, rgba(245, 158, 11, 0.15) 0%, transparent 65%)"
              : "radial-gradient(circle at 70% 20%, rgba(11, 92, 255, 0.18) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ─── STOREFRONT IDENTITY & STATUS PILL ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "9px",
              background: isChosen
                ? "linear-gradient(135deg, #10B981, #059669)"
                : isMerchant
                  ? "linear-gradient(135deg, #0B5CFF, #004DE6)"
                  : "rgba(255, 255, 255, 0.1)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "12px",
              boxShadow: isChosen
                ? "0 0 16px rgba(16, 185, 129, 0.5)"
                : isMerchant
                  ? "0 0 16px rgba(11, 92, 255, 0.4)"
                  : "none",
            }}
          >
            {isMerchant ? "IF" : resultTitle.slice(0, 2).toUpperCase()}
          </div>

          <div>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: isChosen ? "var(--mg-success)" : "#0B5CFF",
                textTransform: "uppercase",
              }}
            >
              {merchantStorefront}
            </div>
            <div style={{ fontSize: "11px", color: "var(--mg-text-muted)", fontWeight: 500 }}>
              {isMerchant ? "Your Storefront" : "Verified Merchant"}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: isChosen ? "var(--mg-success-soft)" : "var(--mg-surface)",
            padding: "4px 10px",
            borderRadius: "99px",
            border: isChosen ? "1px solid var(--mg-success-border)" : "1px solid var(--mg-border)",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: 900,
              color: isChosen ? "var(--mg-success)" : isMerchant ? "#0B5CFF" : "var(--mg-text-muted)",
            }}
          >
            {isChosen ? "✓ #1 CHOSEN" : `#${rank} IN DISCOVERY`}
          </span>
        </div>
      </div>

      {/* ─── DOMINANT PRODUCT TITLE & PRICE HEADER ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 1 }}>
        <div>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: "var(--mg-text)",
              margin: 0,
            }}
          >
            {resultTitle}
          </h3>
          <div style={{ fontSize: "11px", color: "var(--mg-text-secondary)", marginTop: "2px", fontWeight: 500 }}>
            {shortDescriptor || "Curated system design & architecture mentorship"}
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: isChosen ? "var(--mg-success)" : "#0B5CFF",
            }}
          >
            {pricePerMonth}
          </div>
          <div style={{ fontSize: "10px", color: "var(--mg-text-muted)", fontWeight: 600 }}>
            monthly subscription
          </div>
        </div>
      </div>

      {/* ─── WIN STATE OR ATTRIBUTE EVALUATION SURFACE ─── */}
      {isChosen ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "2px", zIndex: 1 }}>
          <div
            style={{
              background: "var(--mg-success-soft)",
              border: "1px solid var(--mg-success-border)",
              borderRadius: "12px",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <ShieldIcon size={26} active />
            <div>
              <div style={{ fontSize: "13px", fontWeight: 900, color: "var(--mg-success)" }}>
                AI FOUND A CLEAR MATCH.
              </div>
              <div style={{ fontSize: "11px", color: "var(--mg-text-secondary)", marginTop: "2px" }}>
                1:1 human mentorship, guaranteed 24h response SLA, and monthly budget verified.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {buyerWanted.map((req) => (
              <span
                key={req}
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--mg-success)",
                  background: "var(--mg-success-soft)",
                  border: "1px solid var(--mg-success-border)",
                  borderRadius: "99px",
                  padding: "4px 12px",
                }}
              >
                ✓ {req}
              </span>
            ))}
          </div>
        </div>
      ) : (
        /* PROS / CONS & DIAGNOSTIC REASONING */
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", zIndex: 1 }}>
          {/* WHAT'S GOOD & WHAT'S MISSING CHIPS */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {/* Pros */}
            <div
              style={{
                background: "var(--mg-surface-subtle)",
                borderRadius: "10px",
                padding: "8px 12px",
                border: "1px solid var(--mg-border-subtle)",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--mg-success)",
                  marginBottom: "4px",
                }}
              >
                ✓ AI VERIFIED
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {good.map((item) => (
                  <span key={item} style={{ fontSize: "11px", fontWeight: 600, color: "var(--mg-text)" }}>
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Cons / Gaps */}
            <div
              style={{
                background: missing.length > 0 ? "rgba(245, 158, 11, 0.08)" : "var(--mg-surface-subtle)",
                borderRadius: "10px",
                padding: "8px 12px",
                border: missing.length > 0 ? "1px solid rgba(245, 158, 11, 0.25)" : "1px solid var(--mg-border-subtle)",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: missing.length > 0 ? "var(--mg-warning)" : "var(--mg-text-muted)",
                  marginBottom: "4px",
                }}
              >
                {missing.length > 0 ? "? UNCLEAR TO AI" : "NO CRITICAL GAPS"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {missing.length > 0 ? (
                  missing.map((item) => (
                    <span key={item} style={{ fontSize: "11px", fontWeight: 600, color: "var(--mg-warning)" }}>
                      ? {item}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: "11px", color: "var(--mg-text-muted)" }}>All constraints satisfied</span>
                )}
              </div>
            </div>
          </div>

          {/* AI EXPLANATION / REASONING */}
          {explanation && (
            <div
              style={{
                fontSize: "11px",
                color: "var(--mg-text-secondary)",
                lineHeight: 1.45,
                background: "var(--mg-surface-subtle)",
                borderRadius: "10px",
                padding: "8px 12px",
                border: "1px solid var(--mg-border-subtle)",
              }}
            >
              {isMerchant && <strong style={{ color: "var(--mg-text)" }}>Here&apos;s why: </strong>}
              {explanation}
            </div>
          )}

          {/* ─── MERCHANT DIAGNOSIS & CANONICAL IMPROVEMENT BUTTON (ALWAYS FULLY VISIBLE) ─── */}
          {isMerchant && (isDiagnosis || isImprovement) && (
            <div
              style={{
                marginTop: "2px",
                borderTop: "1px solid var(--mg-border)",
                paddingTop: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#0B5CFF",
                  }}
                >
                  Make this easier to choose
                </span>
                <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--mg-warning)" }}>
                  You&apos;re #3
                </span>
              </div>

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {improvedTo.map((imp) => (
                  <span
                    key={imp}
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#0B5CFF",
                      background: "rgba(11, 92, 255, 0.12)",
                      border: "1px solid rgba(11, 92, 255, 0.3)",
                      borderRadius: "99px",
                      padding: "3px 10px",
                    }}
                  >
                    + {imp}
                  </span>
                ))}
              </div>

              <button
                id="hero-try-improvement-btn"
                type="button"
                aria-label="Try this improvement to make your offer easier to choose"
                onClick={onTryImprovement}
                style={{
                  width: "100%",
                  minHeight: "42px",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  background: isImprovementPressed
                    ? "linear-gradient(135deg, #004DE6, #0037A6)"
                    : "linear-gradient(135deg, #0B5CFF, #004DE6)",
                  border: "none",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: isImprovementPressed
                    ? "0 0 32px rgba(11, 92, 255, 0.65)"
                    : "0 0 24px rgba(11, 92, 255, 0.4)",
                  transform: isImprovementPressed ? "scale(0.96)" : "scale(1)",
                  transition: reducedMotion ? "none" : "transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  flexShrink: 0,
                }}
              >
                Try this improvement →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
