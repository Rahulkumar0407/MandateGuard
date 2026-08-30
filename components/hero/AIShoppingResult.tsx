"use client";

import React from "react";
import { MGBorderBeam } from "../mg-primitives";

export interface AIShoppingResultProps {
  id: string;
  rank: number;
  title: string;
  price: string;
  pricePerMonth: string;
  shortDescriptor?: string;
  isMerchant: boolean;
  isChosen?: boolean;
  isFocused?: boolean;
  isDimmed?: boolean;
  slotIndex: number;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onFocus?: () => void;
  reducedMotion?: boolean;
}

// Helper for merchant initials / mark
function getMerchantInitials(title: string, isMerchant: boolean): string {
  if (isMerchant) return "IF";
  const words = title.split(" ");
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return title.slice(0, 2).toUpperCase();
}

/**
 * AIShoppingResult — Rich, tactile product search candidate in the AI Shopping Viewport.
 * Features 21st.dev / Aceternity spotlight contrast, physical vertical slot layout,
 * verification badge, merchant monogram mark, and full keyboard accessibility.
 */
export function AIShoppingResult({
  rank,
  title,
  price,
  pricePerMonth,
  shortDescriptor,
  isMerchant,
  isChosen = false,
  isFocused = false,
  isDimmed = false,
  slotIndex,
  onClick,
  onMouseEnter,
  onFocus,
  reducedMotion = false,
}: AIShoppingResultProps) {
  // Physical vertical layout offset: each slot is 92px + 12px gap = 104px
  const yOffset = slotIndex * 104;
  const initials = getMerchantInitials(title, isMerchant);

  const cardContent = (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${rank === 1 && isChosen ? "Chosen #1" : `Rank ${rank}`}: ${title}, ${pricePerMonth}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      style={{
        position: "relative",
        background: isChosen
          ? "var(--mg-glass-2-bg)"
          : isFocused
            ? "var(--mg-surface-elevated)"
            : "var(--mg-surface)",
        border: isChosen
          ? "1px solid rgba(16, 185, 129, 0.55)"
          : isFocused
            ? isMerchant
              ? "1px solid rgba(11, 92, 255, 0.6)"
              : "1px solid var(--mg-border-strong)"
            : "1px solid var(--mg-border)",
        borderRadius: "16px",
        padding: "15px 20px",
        cursor: "pointer",
        outline: "none",
        boxShadow: isChosen
          ? "0 10px 36px rgba(16, 185, 129, 0.22), 0 0 0 1px rgba(16, 185, 129, 0.2)"
          : isFocused
            ? "0 10px 32px rgba(11, 92, 255, 0.22), 0 0 0 1px rgba(11, 92, 255, 0.15)"
            : "0 4px 18px rgba(0, 0, 0, 0.12)",
        transform: isFocused ? "scale(1.025)" : "scale(1)",
        opacity: isDimmed ? 0.52 : 1,
        filter: isDimmed && !reducedMotion ? "blur(0.5px)" : "none",
        transition: reducedMotion
          ? "opacity 0.15s ease"
          : "transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.24s ease, opacity 0.25s ease, filter 0.25s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        overflow: "hidden",
      }}
    >
      {/* 21st.dev / Aceternity Subtle Localized Spotlight Glow */}
      {isFocused && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-50%",
            left: "-20%",
            width: "140%",
            height: "200%",
            background: isChosen
              ? "radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.12) 0%, transparent 60%)"
              : isMerchant
                ? "radial-gradient(circle at 30% 30%, rgba(11, 92, 255, 0.14) 0%, transparent 60%)"
                : "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.06) 0%, transparent 60%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}

      {/* Left: Rank Badge + Merchant Monogram + Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0, zIndex: 1 }}>
        {/* Rank Indicator Pill */}
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "10px",
            background: isChosen
              ? "linear-gradient(135deg, #10B981, #059669)"
              : isMerchant
                ? "linear-gradient(135deg, #0B5CFF, #004DE6)"
                : "rgba(255, 255, 255, 0.07)",
            color: isChosen || isMerchant ? "white" : "var(--mg-text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: "13px",
            flexShrink: 0,
            boxShadow: isChosen
              ? "0 0 14px rgba(16, 185, 129, 0.45)"
              : isMerchant
                ? "0 0 14px rgba(11, 92, 255, 0.35)"
                : "none",
          }}
        >
          {isChosen ? "✓" : `#${rank}`}
        </div>

        {/* Merchant Monogram Icon */}
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            background: isMerchant
              ? "rgba(11, 92, 255, 0.14)"
              : "rgba(255, 255, 255, 0.05)",
            border: isMerchant
              ? "1px solid rgba(11, 92, 255, 0.3)"
              : "1px solid var(--mg-border)",
            color: isMerchant ? "#0B5CFF" : "var(--mg-text-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "11px",
            letterSpacing: "0.04em",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>

        {/* Title & Metadata */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 800,
                color: isMerchant && !isChosen ? "#0B5CFF" : "var(--mg-text)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </span>
            {isMerchant && (
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: isChosen ? "var(--mg-success)" : "#0B5CFF",
                  background: isChosen ? "var(--mg-success-soft)" : "rgba(11, 92, 255, 0.12)",
                  padding: "2px 7px",
                  borderRadius: "5px",
                  border: isChosen
                    ? "1px solid var(--mg-success-border)"
                    : "1px solid rgba(11, 92, 255, 0.25)",
                  flexShrink: 0,
                }}
              >
                {isChosen ? "Winner" : "Your Offer"}
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: "11px",
              color: "var(--mg-text-muted)",
              marginTop: "2px",
              fontWeight: 500,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <span>{isChosen ? "🛡️" : "⚡"}</span>
            <span>
              {shortDescriptor ||
                (isChosen
                  ? "✓ Matched all buyer constraints"
                  : isMerchant
                    ? "Evaluation candidate"
                    : "Marketplace alternative")}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Price Hierarchy */}
      <div style={{ textAlign: "right", flexShrink: 0, zIndex: 1 }}>
        <div
          style={{
            fontSize: "16px",
            fontWeight: 900,
            color: isChosen ? "var(--mg-success)" : isFocused ? "#0B5CFF" : "var(--mg-text)",
            transition: "color 0.2s ease",
            letterSpacing: "-0.02em",
          }}
        >
          {price}
        </div>
        <div style={{ fontSize: "10px", color: "var(--mg-text-muted)", fontWeight: 600 }}>
          / month
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        transform: `translateY(${yOffset}px)`,
        transition: reducedMotion
          ? "none"
          : "transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease",
        zIndex: isFocused ? 10 : 3 - rank,
      }}
    >
      {isMerchant && (isFocused || isChosen) ? (
        <MGBorderBeam
          colorFrom={isChosen ? "#10B981" : "#0B5CFF"}
          colorTo={isChosen ? "#059669" : "#06B6D4"}
          duration={3}
          borderRadius={16}
        >
          {cardContent}
        </MGBorderBeam>
      ) : (
        cardContent
      )}
    </div>
  );
}
