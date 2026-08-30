"use client";

import React from "react";

interface MGBorderBeamProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  borderRadius?: number;
}

/**
 * MGBorderBeam — Animated gradient border that sweeps around an element.
 * Marks the winning/matched offer. Adapts Magic UI Border Beam.
 */
export function MGBorderBeam({
  children,
  className = "",
  duration = 3,
  borderWidth = 2,
  colorFrom = "#0B5CFF",
  colorTo = "#06B6D4",
  borderRadius = 16,
}: MGBorderBeamProps) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        borderRadius: `${borderRadius}px`,
        overflow: "hidden",
      }}
    >
      {/* Animated sweeping gradient border */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: `${borderRadius}px`,
          padding: `${borderWidth}px`,
          background: `conic-gradient(from var(--mg-beam-angle, 0deg), transparent 60%, ${colorFrom}, ${colorTo}, transparent 100%)`,
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          animation: `mg-border-beam-spin ${duration}s linear infinite`,
          zIndex: 0,
        }}
      />
      {/* Inner content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          borderRadius: `${borderRadius - borderWidth}px`,
        }}
      >
        {children}
      </div>
      <style>{`
        @keyframes mg-border-beam-spin {
          from { --mg-beam-angle: 0deg; }
          to { --mg-beam-angle: 360deg; }
        }
        @property --mg-beam-angle {
          syntax: '<angle>';
          inherits: false;
          initial-value: 0deg;
        }
      `}</style>
    </div>
  );
}
