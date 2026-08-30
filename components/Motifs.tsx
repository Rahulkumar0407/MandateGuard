"use client";

import React from "react";

/* ------------------------------------------------------------------ */
/* Signature visual motif: The Commerce Path                           */
/* A recurring flowing connector carrying the product's core sequence:  */
/*   REQUEST → UNDERSTAND → OFFER → DECISION → PAYMENT → SHIELD        */
/* ------------------------------------------------------------------ */

export const COMMERCE_PATH_STAGES = [
  "Request",
  "Understand",
  "Offer",
  "Decision",
  "Payment",
  "Shield",
] as const;

export type CommercePathStage = (typeof COMMERCE_PATH_STAGES)[number];

const STAGES = ["Need", "Understand", "Match", "Trust", "Buy"] as const;

export function CommercePath({
  currentStage = "Request",
  className = "",
  compact = false,
}: {
  currentStage?: CommercePathStage;
  className?: string;
  compact?: boolean;
}) {
  const currentIndex = COMMERCE_PATH_STAGES.indexOf(currentStage);

  return (
    <div className={`w-full ${className}`}>
      <div className="relative flex items-center justify-between">
        <svg
          viewBox="0 0 1000 32"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full pointer-events-none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="commercePathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0B5CFF" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#059669" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0B5CFF" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <path
            d="M 10,16 C 180,6 320,26 500,16 C 680,6 820,26 990,16"
            fill="none"
            stroke="url(#commercePathGrad)"
            strokeWidth="2"
            strokeDasharray="4 6"
            className="mg-flow-dash"
          />
        </svg>

        {COMMERCE_PATH_STAGES.map((stage, idx) => {
          const isPassed = idx <= currentIndex;
          const isCurrent = stage === currentStage;

          return (
            <div key={stage} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                  isCurrent
                    ? "bg-[#0B5CFF] text-white ring-4 ring-[#EEF4FF] shadow-md scale-110"
                    : isPassed
                    ? "bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]"
                    : "bg-white text-[#6B7C96] border border-[#E8E4DC]"
                }`}
              >
                {isPassed && !isCurrent ? "✓" : idx + 1}
              </div>
              {!compact && (
                <span
                  className={`mt-1.5 text-[10px] sm:text-[11px] uppercase tracking-wider font-extrabold transition-colors ${
                    isCurrent
                      ? "text-[#0B5CFF]"
                      : isPassed
                      ? "text-[#059669]"
                      : "text-[#6B7C96]"
                  }`}
                >
                  {stage}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CommerceFlow({
  tone = "ink",
  className = "",
  currentStage,
}: {
  tone?: "ink" | "light";
  className?: string;
  currentStage?: "Need" | "Understand" | "Match" | "Trust" | "Buy";
}) {
  const stroke = tone === "light" ? "rgba(199,210,224,0.55)" : "rgba(11,92,255,0.45)";
  const defaultLabelColor = tone === "light" ? "#C7D2E0" : "#42526E";

  const stagePositions = [8, 252, 500, 748, 992];

  return (
    <div className={className}>
      <svg
        viewBox="0 0 1000 26"
        preserveAspectRatio="none"
        className="h-6 w-full"
        aria-hidden="true"
      >
        <path
          d="M8 13 C 200 3, 320 23, 500 13 S 800 3, 992 13"
          fill="none"
          stroke={stroke}
          strokeWidth="1.5"
          strokeDasharray="3 7"
          className="mg-flow-dash"
        />
        {stagePositions.map((x, i) => {
          const isSelected = currentStage === STAGES[i];
          return (
            <circle
              key={i}
              cx={x}
              cy={13}
              r={isSelected ? 4.5 : 3}
              fill={isSelected ? "var(--mg-brand)" : tone === "light" ? "#0B5CFF" : "#0B5CFF"}
              className={isSelected ? "animate-pulse" : ""}
            />
          );
        })}
      </svg>
      <div className="mt-1.5 flex justify-between text-[10px] font-bold uppercase tracking-[0.14em]">
        {STAGES.map((s) => {
          const isSelected = currentStage === s;
          return (
            <span
              key={s}
              style={{
                color: isSelected ? "var(--mg-brand)" : defaultLabelColor,
                fontWeight: isSelected ? "800" : "600",
              }}
            >
              {s}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* Thin vertical flow connector for stacked sequences (e.g. hero scene). */
export function FlowLine({ tone = "ink" }: { tone?: "ink" | "light" }) {
  const stroke = tone === "light" ? "rgba(199,210,224,0.5)" : "rgba(11,92,255,0.38)";
  return (
    <svg
      viewBox="0 0 4 100"
      preserveAspectRatio="none"
      className="absolute left-[7px] top-3 bottom-3 w-[3px]"
      aria-hidden="true"
    >
      <path
        d="M2 0 C 12 30, -6 60, 2 100"
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeDasharray="2 5"
        className="mg-flow-dash"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Reusable Live State Primitives                                      */
/* Thinking, Analyzing, Matching, Ready, Success, Attention, Blocked   */
/* ------------------------------------------------------------------ */

export type StatePrimitiveTone =
  | "brand"
  | "thinking"
  | "analyzing"
  | "matching"
  | "ready"
  | "success"
  | "attention"
  | "blocked"
  | "muted";

export function StatusPill({
  children,
  tone = "brand",
  pulse = false,
  className = "",
}: {
  children: React.ReactNode;
  tone?: StatePrimitiveTone;
  pulse?: boolean;
  className?: string;
}) {
  let bg = "var(--mg-brand-soft)";
  let text = "var(--mg-brand)";
  let dotColor = "var(--mg-brand)";
  let border = "var(--mg-brand-line)";

  switch (tone) {
    case "thinking":
    case "analyzing":
    case "matching":
    case "brand":
      bg = "var(--mg-brand-soft)";
      text = "var(--mg-brand)";
      dotColor = "var(--mg-brand)";
      border = "var(--mg-brand-line)";
      break;
    case "ready":
    case "success":
      bg = "var(--mg-success-soft)";
      text = "var(--mg-success)";
      dotColor = "var(--mg-success)";
      border = "rgba(15, 157, 107, 0.25)";
      break;
    case "attention":
      bg = "var(--mg-warning-soft)";
      text = "var(--mg-warning)";
      dotColor = "var(--mg-warning)";
      border = "rgba(194, 129, 11, 0.25)";
      break;
    case "blocked":
      bg = "var(--mg-critical-soft)";
      text = "var(--mg-critical)";
      dotColor = "var(--mg-critical)";
      border = "rgba(209, 67, 67, 0.25)";
      break;
    case "muted":
    default:
      bg = "var(--mg-bg-muted)";
      text = "var(--mg-text-secondary)";
      dotColor = "var(--mg-text-muted)";
      border = "var(--mg-border)";
      break;
  }

  const shouldPulse =
    pulse || tone === "thinking" || tone === "analyzing" || tone === "matching";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold border transition-all ${className}`}
      style={{
        background: bg,
        color: text,
        borderColor: border,
      }}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${shouldPulse ? "animate-pulse" : ""}`}
        style={{ background: dotColor }}
      />
      {children}
    </span>
  );
}
