"use client";

import React from "react";

export type CursorMode = "idle" | "searching" | "checking" | "choosing" | "chose";

interface AICursorProps {
  x: string;
  y: string;
  mode: CursorMode;
  statusLabel?: string;
  visible: boolean;
  isClicking?: boolean;
  reducedMotion?: boolean;
  className?: string;
}

/**
 * AICursor — Refined AI shopper cursor with protag identity marker & dynamic status chip.
 * Protagonist of the AI shopping journey.
 *
 * States:
 *  - idle / entering: "AI"
 *  - searching: "AI SEARCHING"
 *  - checking: "AI CHECKING"
 *  - choosing: "AI CHOOSING"
 *  - chose: "CHOSEN ✓"
 */
export function AICursor({
  x,
  y,
  mode,
  statusLabel,
  visible,
  isClicking = false,
  reducedMotion = false,
  className = "",
}: AICursorProps) {
  const modeColors: Record<CursorMode, string> = {
    idle: "#0B5CFF",
    searching: "#0B5CFF",
    checking: "#F59E0B",
    choosing: "#8B5CF6",
    chose: "#10B981",
  };

  const defaultLabels: Record<CursorMode, string> = {
    idle: "AI",
    searching: "AI SEARCHING",
    checking: "AI CHECKING",
    choosing: "AI CHOOSING",
    chose: "CHOSEN",
  };

  const color = modeColors[mode] || "#0B5CFF";
  const label = statusLabel || defaultLabels[mode] || "AI";

  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        position: "absolute",
        left: x,
        top: y,
        zIndex: 50,
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transform: `translate(-2px, -2px) ${isClicking ? "scale(0.92)" : "scale(1)"}`,
        transition: reducedMotion
          ? "opacity 0.15s ease"
          : `left 0.75s cubic-bezier(0.16, 1, 0.3, 1),
             top 0.75s cubic-bezier(0.16, 1, 0.3, 1),
             transform 0.15s ease,
             opacity 0.35s ease`,
        willChange: "left, top, transform",
      }}
    >
      {/* Subtle trail dots behind movement */}
      {!reducedMotion && (
        <div style={{ position: "absolute", left: "-6px", top: "16px", pointerEvents: "none" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: `${5 - i * 1.2}px`,
                height: `${5 - i * 1.2}px`,
                borderRadius: "50%",
                background: color,
                opacity: 0.35 - i * 0.1,
                left: `${-6 - i * 6}px`,
                top: `${3 + i * 4}px`,
                transition: "background 0.3s ease",
              }}
            />
          ))}
        </div>
      )}

      {/* Click ripple animation */}
      {isClicking && !reducedMotion && (
        <div
          style={{
            position: "absolute",
            left: "-12px",
            top: "-12px",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: `2px solid ${color}`,
            animation: "hero-click-ripple 0.4s ease-out forwards",
          }}
        />
      )}

      {/* Cursor arrow SVG */}
      <svg
        width="22"
        height="26"
        viewBox="0 0 20 24"
        fill="none"
        style={{
          display: "block",
          filter: `drop-shadow(0 2px 8px rgba(0, 0, 0, 0.4))`,
        }}
      >
        <path
          d="M2 1L2 18L6.5 13.5L11 21L14 19.5L9.5 12L16 11L2 1Z"
          fill="var(--mg-text)"
          stroke="var(--mg-bg)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      {/* AI protagonist status pill */}
      <div
        style={{
          position: "absolute",
          left: "16px",
          top: "14px",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          padding: "3px 8px",
          borderRadius: "99px",
          background: "var(--mg-surface)",
          border: `1px solid ${color}40`,
          boxShadow: `0 4px 14px rgba(0, 0, 0, 0.35), 0 0 10px ${color}30`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          whiteSpace: "nowrap",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        }}
      >
        {/* Tiny avatar circle */}
        <div
          style={{
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            background: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "8px",
            fontWeight: 900,
            color: "white",
            boxShadow: `0 0 6px ${color}80`,
            lineHeight: 1,
          }}
        >
          {mode === "chose" ? "✓" : "•"}
        </div>

        {/* Dynamic status label text */}
        <span
          style={{
            fontSize: "9px",
            fontWeight: 800,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--mg-text)",
          }}
        >
          {label}
        </span>
      </div>

      {/* Searching / Evaluating pulse ring */}
      {(mode === "searching" || mode === "checking") && !reducedMotion && (
        <div
          style={{
            position: "absolute",
            left: "-4px",
            top: "-4px",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            border: `1.5px solid ${color}`,
            opacity: 0.4,
            animation: "hero-cursor-pulse 1.8s ease-in-out infinite",
          }}
        />
      )}
    </div>
  );
}
