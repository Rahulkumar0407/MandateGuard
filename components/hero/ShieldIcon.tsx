"use client";

import React from "react";

interface ShieldIconProps {
  size?: number;
  active?: boolean;
  blocked?: boolean;
  className?: string;
}

/**
 * ShieldIcon — Custom MandateGuard shield.
 * Not a generic lock. The shield carries the "M" brand mark.
 * States: default (subtle), active (blue glow), blocked (coral pulse).
 */
export function ShieldIcon({
  size = 48,
  active = false,
  blocked = false,
  className = "",
}: ShieldIconProps) {
  const fillColor = blocked
    ? "var(--mg-critical)"
    : active
      ? "var(--mg-brand)"
      : "var(--mg-text-muted)";

  const glowColor = blocked
    ? "rgba(239, 68, 68, 0.4)"
    : active
      ? "rgba(11, 92, 255, 0.35)"
      : "none";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      style={{
        filter: (active || blocked) ? `drop-shadow(0 0 12px ${glowColor})` : "none",
        transition: "filter 0.4s ease",
      }}
    >
      {/* Shield body */}
      <path
        d="M24 4L6 12V22C6 33.1 13.7 43.3 24 46C34.3 43.3 42 33.1 42 22V12L24 4Z"
        fill={fillColor}
        fillOpacity={0.12}
        stroke={fillColor}
        strokeWidth="2"
        strokeLinejoin="round"
        style={{ transition: "fill 0.4s ease, stroke 0.4s ease" }}
      />
      {/* Inner shield accent */}
      <path
        d="M24 8L10 14.5V22C10 31 16.5 39.5 24 42C31.5 39.5 38 31 38 22V14.5L24 8Z"
        fill={fillColor}
        fillOpacity={0.06}
        style={{ transition: "fill 0.4s ease" }}
      />
      {/* M brand mark */}
      <text
        x="24"
        y="28"
        textAnchor="middle"
        dominantBaseline="central"
        fill={fillColor}
        fontSize="14"
        fontWeight="900"
        fontFamily="var(--font-inter), system-ui, sans-serif"
        style={{ transition: "fill 0.4s ease" }}
      >
        M
      </text>
    </svg>
  );
}
