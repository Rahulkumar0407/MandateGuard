"use client";

import React, { useState } from "react";
import { MGSpotlight } from "./MGSpotlight";

interface MGCommerceObjectProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "highlighted" | "winner" | "danger";
  interactive?: boolean;
  onClick?: () => void;
  spotlightColor?: string;
}

/**
 * MGCommerceObject — A floating card primitive for commerce entities.
 * Buyer requests, offers, payments, shields. Supports hover lift, press depression,
 * spotlight glow, and depth shadow. NOT a layout container — a physical object.
 */
export function MGCommerceObject({
  children,
  className = "",
  variant = "default",
  interactive = true,
  onClick,
  spotlightColor,
}: MGCommerceObjectProps) {
  const [isPressed, setIsPressed] = useState(false);

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: "var(--mg-surface)",
      borderColor: "var(--mg-border)",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)",
    },
    highlighted: {
      background: "var(--mg-surface)",
      borderColor: "rgba(11, 92, 255, 0.3)",
      boxShadow: "0 8px 32px rgba(11, 92, 255, 0.1), 0 2px 8px rgba(0, 0, 0, 0.08)",
    },
    winner: {
      background: "var(--mg-surface)",
      borderColor: "rgba(16, 185, 129, 0.4)",
      boxShadow: "0 8px 32px rgba(16, 185, 129, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)",
    },
    danger: {
      background: "var(--mg-surface)",
      borderColor: "rgba(239, 68, 68, 0.3)",
      boxShadow: "0 8px 32px rgba(239, 68, 68, 0.1), 0 2px 8px rgba(0, 0, 0, 0.08)",
    },
  };

  const spotlightColors: Record<string, string> = {
    default: "rgba(11, 92, 255, 0.06)",
    highlighted: "rgba(11, 92, 255, 0.1)",
    winner: "rgba(16, 185, 129, 0.08)",
    danger: "rgba(239, 68, 68, 0.06)",
  };

  const baseStyle: React.CSSProperties = {
    ...variantStyles[variant],
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "16px",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    transform: isPressed
      ? "scale(0.97)"
      : interactive
        ? "translateY(0px)"
        : "none",
    cursor: interactive ? "pointer" : "default",
  };

  const content = (
    <div
      className={className}
      style={baseStyle}
      onClick={onClick}
      onMouseDown={() => interactive && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e) => {
        if (interactive && onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {children}
    </div>
  );

  const contentWithHover = (
    <div
      className={`${className} mg-commerce-object-hover`}
      style={baseStyle}
      onClick={onClick}
      onMouseDown={() => interactive && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e) => {
        if (interactive && onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {children}
    </div>
  );

  if (!interactive) return content;

  return (
    <MGSpotlight
      size={300}
      color={spotlightColor || spotlightColors[variant]}
    >
      <style>{`
        .mg-commerce-object-hover:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.1) !important;
        }
      `}</style>
      {contentWithHover}
    </MGSpotlight>
  );
}

