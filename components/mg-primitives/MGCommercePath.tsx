"use client";

import React from "react";

interface PathNode {
  label: string;
  icon: string;
}

interface MGCommercePathProps {
  className?: string;
  compact?: boolean;
}

const COMMERCE_PATH: PathNode[] = [
  { label: "Buyer", icon: "👤" },
  { label: "Search", icon: "🔍" },
  { label: "Offer", icon: "📦" },
  { label: "Decision", icon: "⚡" },
  { label: "Payment", icon: "💳" },
  { label: "Shield", icon: "🛡️" },
];

/**
 * MGCommercePath — The signature visual: buyer → search → offer → decision → payment → shield
 * Rendered as connected floating nodes with animated beams between them.
 * NOT a flowchart. Environmental/decorative element.
 */
export function MGCommercePath({ className = "", compact = false }: MGCommercePathProps) {
  const nodeSize = compact ? 40 : 56;
  const fontSize = compact ? "10px" : "12px";
  const iconSize = compact ? "16px" : "20px";

  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? "4px" : "8px",
        opacity: 0.6,
      }}
    >
      {COMMERCE_PATH.map((node, i) => (
        <React.Fragment key={node.label}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <div
              style={{
                width: `${nodeSize}px`,
                height: `${nodeSize}px`,
                borderRadius: "50%",
                background: "var(--mg-surface)",
                border: "1px solid var(--mg-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: iconSize,
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              {node.icon}
            </div>
            <span
              style={{
                fontSize,
                color: "var(--mg-text-secondary)",
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              {node.label}
            </span>
          </div>
          {i < COMMERCE_PATH.length - 1 && (
            <div
              style={{
                width: compact ? "16px" : "32px",
                height: "2px",
                position: "relative",
                overflow: "hidden",
                marginBottom: compact ? "18px" : "22px",
              }}
            >
              {/* Static beam track */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "var(--mg-border)",
                  borderRadius: "1px",
                }}
              />
              {/* Animated beam pulse */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "50%",
                  height: "100%",
                  background: "linear-gradient(90deg, transparent, #0B5CFF, transparent)",
                  borderRadius: "1px",
                  animation: `mg-beam-flow 2s ease-in-out ${i * 0.3}s infinite`,
                }}
              />
            </div>
          )}
        </React.Fragment>
      ))}
      <style>{`
        @keyframes mg-beam-flow {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(300%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
