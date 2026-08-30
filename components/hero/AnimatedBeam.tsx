"use client";

import React from "react";

interface AnimatedBeamProps {
  /** 0-1, how much of the beam path is revealed */
  progress: number;
  /** Overall beam color */
  color?: string;
  /** Secondary color for gradient */
  colorTo?: string;
  active?: boolean;
  blocked?: boolean;
  reducedMotion?: boolean;
  className?: string;
}

/**
 * AnimatedBeam — A single causal beam representing the flow:
 *   search → merchant result → chosen offer → approval → shield
 *
 * Uses SVG stroke-dashoffset to progressively reveal the path.
 * When blocked (protection scene), the beam stops and turns coral.
 */
export function AnimatedBeam({
  progress,
  color = "#0B5CFF",
  colorTo = "#10B981",
  active = true,
  blocked = false,
  reducedMotion = false,
  className = "",
}: AnimatedBeamProps) {
  const pathLength = 800;
  const dashOffset = pathLength - pathLength * Math.min(progress, 1);

  const beamColor = blocked ? "var(--mg-critical)" : color;

  return (
    <svg
      viewBox="0 0 600 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
        opacity: active ? 1 : 0,
        transition: "opacity 0.5s ease",
      }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="hero-beam-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={beamColor} stopOpacity="0.6" />
          <stop offset="100%" stopColor={blocked ? beamColor : colorTo} stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Background track (faint) */}
      <path
        d="M 60 40 C 120 40, 180 120, 300 160 S 480 200, 540 280"
        stroke="var(--mg-border)"
        strokeWidth="2"
        strokeDasharray="4 8"
        opacity="0.5"
      />

      {/* Active beam */}
      <path
        d="M 60 40 C 120 40, 180 120, 300 160 S 480 200, 540 280"
        stroke="url(#hero-beam-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={pathLength}
        strokeDashoffset={dashOffset}
        style={{
          transition: reducedMotion ? "none" : "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease",
        }}
      />

      {/* Flowing pulse on beam */}
      {!reducedMotion && progress > 0.1 && !blocked && (
        <circle r="4" fill={color} opacity="0.6">
          <animateMotion
            dur="3s"
            repeatCount="indefinite"
            path="M 60 40 C 120 40, 180 120, 300 160 S 480 200, 540 280"
          />
        </circle>
      )}

      {/* Blocked indicator — red pulse at stop point */}
      {blocked && (
        <>
          <circle
            cx={60 + (540 - 60) * Math.min(progress, 0.75)}
            cy={40 + (280 - 40) * Math.min(progress, 0.75)}
            r="8"
            fill="var(--mg-critical)"
            opacity="0.3"
          >
            {!reducedMotion && (
              <animate
                attributeName="r"
                values="8;14;8"
                dur="1.5s"
                repeatCount="indefinite"
              />
            )}
          </circle>
          <circle
            cx={60 + (540 - 60) * Math.min(progress, 0.75)}
            cy={40 + (280 - 40) * Math.min(progress, 0.75)}
            r="4"
            fill="var(--mg-critical)"
          />
        </>
      )}
    </svg>
  );
}
