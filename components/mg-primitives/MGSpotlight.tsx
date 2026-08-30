"use client";

import React, { useRef, useState, useCallback } from "react";

interface MGSpotlightProps {
  children: React.ReactNode;
  className?: string;
  size?: number;
  color?: string;
}

/**
 * MGSpotlight — Cursor-following radial gradient highlight.
 * Adapts Aceternity Spotlight pattern. CSS-only with onMouseMove for position tracking.
 * Use on hero scenes, offer cards, and search results.
 */
export function MGSpotlight({
  children,
  className = "",
  size = 400,
  color = "rgba(11, 92, 255, 0.08)",
}: MGSpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    [],
  );

  return (
    <div
      ref={containerRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: "relative", overflow: "hidden" }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1,
          background: isHovered
            ? `radial-gradient(${size}px circle at ${position.x}px ${position.y}px, ${color}, transparent 80%)`
            : "none",
          transition: "background 0.15s ease",
        }}
      />
      <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
    </div>
  );
}
