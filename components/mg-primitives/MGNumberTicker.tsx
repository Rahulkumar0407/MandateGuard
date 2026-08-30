"use client";

import React, { useEffect, useRef, useState } from "react";

interface MGNumberTickerProps {
  value: number;
  direction?: "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

/**
 * MGNumberTicker — Animated number counter inspired by Magic UI Number Ticker.
 * Spring-based interpolation from 0 (or previous) to target value.
 * Used for rank transitions (#3→#1) and simulation counters (42→57).
 */
export function MGNumberTicker({
  value,
  direction = "up",
  delay = 0,
  duration = 1200,
  className = "",
  prefix = "",
  suffix = "",
}: MGNumberTickerProps) {
  const [displayValue, setDisplayValue] = useState(direction === "up" ? 0 : value);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Check prefers-reduced-motion
    const prefersReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      const t = setTimeout(() => {
        setDisplayValue(value);
        setHasStarted(true);
      }, 0);
      return () => clearTimeout(t);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted, value]);

  useEffect(() => {
    if (!hasStarted) return;

    const startValue = direction === "up" ? 0 : value * 2;
    const endValue = value;
    const startTime = performance.now() + delay;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed < 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * eased;

      setDisplayValue(Math.round(current));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [hasStarted, value, direction, delay, duration]);

  return (
    <span ref={ref} className={className} aria-label={`${prefix}${value}${suffix}`}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}
