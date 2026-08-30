"use client";

import React, { useEffect, useRef, useState } from "react";

interface MGBlurFadeProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
  inView?: boolean;
}

/**
 * MGBlurFade — Intersection-observer-triggered blur→clear + translate entrance animation.
 * Inspired by Magic UI Blur Fade. Staggerable via `delay` prop.
 */
export function MGBlurFade({
  children,
  className = "",
  delay = 0,
  duration = 600,
  yOffset = 20,
  inView: controlledInView,
}: MGBlurFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (controlledInView !== undefined) return;

    const prefersReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      const t = setTimeout(() => setIsIntersecting(true), 0);
      return () => clearTimeout(t);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [controlledInView]);

  const isVisible = controlledInView !== undefined ? controlledInView : isIntersecting;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        filter: isVisible ? "blur(0px)" : "blur(8px)",
        transform: isVisible ? "translateY(0)" : `translateY(${yOffset}px)`,
        transition: `opacity ${duration}ms ease ${delay}ms, filter ${duration}ms ease ${delay}ms, transform ${duration}ms ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
