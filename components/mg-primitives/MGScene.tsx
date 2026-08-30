"use client";

import React from "react";

interface MGSceneProps {
  children: React.ReactNode;
  className?: string;
  ambientColor?: string;
  ambientPosition?: "center" | "top-left" | "top-right" | "bottom";
  fullViewport?: boolean;
}

/**
 * MGScene — Full-width viewport scene container with atmospheric depth.
 * Subtle radial gradients and optional ambient light drift.
 * Each page's hero lives inside one.
 */
export function MGScene({
  children,
  className = "",
  ambientColor = "rgba(11, 92, 255, 0.06)",
  ambientPosition = "center",
  fullViewport = false,
}: MGSceneProps) {
  const positionMap: Record<string, string> = {
    center: "50% 40%",
    "top-left": "20% 20%",
    "top-right": "80% 20%",
    bottom: "50% 80%",
  };

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        minHeight: fullViewport ? "100vh" : undefined,
        overflow: "hidden",
      }}
    >
      {/* Ambient atmospheric glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 600px 400px at ${positionMap[ambientPosition]}, ${ambientColor}, transparent 70%)`,
          pointerEvents: "none",
          zIndex: 0,
          animation: "mg-ambient-drift 20s ease-in-out infinite alternate",
        }}
      />
      {/* Secondary subtle indigo haze */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 400px 300px at 70% 60%, rgba(99, 102, 241, 0.04), transparent 70%)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      <style>{`
        @keyframes mg-ambient-drift {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -10px) scale(1.05); }
          100% { transform: translate(-10px, 15px) scale(0.98); }
        }
      `}</style>
    </div>
  );
}
