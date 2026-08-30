"use client";

import React, { useRef, useState, useLayoutEffect } from "react";
import { gsap } from "@/lib/gsap";

interface OfferFixExperienceProps {
  onSimulateClick?: () => void;
}

export function OfferFixExperience({ onSimulateClick }: OfferFixExperienceProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [isFixed, setIsFixed] = useState(true);

  useLayoutEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Counter animation on scroll
      const scoreObj = { val: 62 };
      gsap.to(scoreObj, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 65%",
          end: "top 25%",
          scrub: 0.5,
          onUpdate: () => {
            const currentScore = Math.round(scoreObj.val);
            const scoreEl = document.getElementById("confidence-counter-num");
            if (scoreEl) scoreEl.textContent = String(currentScore);
          },
        },
        val: 91,
        ease: "power1.inOut",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="fix-it"
      className="w-full max-w-6xl mx-auto px-5 sm:px-8 md:px-12 py-24 sm:py-32 flex flex-col justify-center box-border"
    >
      {/* ─── Left-Aligned Narrative ─── */}
      <div className="w-full text-left mb-10 sm:mb-12">
        <span className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-[var(--mg-brand)] block mb-3">
          05 / THE TRANSFORMATION
        </span>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.04em] text-[var(--mg-text)] leading-[1.02] mb-3 max-w-[16ch] [text-wrap:balance]">
          Make the promise
          <br />
          <span className="text-[var(--mg-brand)]">explicit.</span>
        </h2>

        <p className="text-sm sm:text-base text-[var(--mg-text-secondary)] leading-relaxed max-w-[50ch]">
          Clearer promise. Higher confidence. Better chance of being chosen.
        </p>
      </div>

      {/* ─── In-Place Fix Sheet (Counter is the Focus) ─── */}
      <div className="w-full">
        <div className="p-6 sm:p-10 rounded-2xl border border-[var(--mg-border)] bg-[var(--mg-surface)] shadow-lg space-y-6">
          {/* Header & Match Confidence Counter */}
          <div className="flex justify-between items-start flex-wrap gap-4 border-b border-[var(--mg-border)] pb-6">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--mg-brand)] tracking-widest block mb-1">
                TRANSFORMED PROMISES
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--mg-text)] tracking-tight truncate">
                YOUR BUSINESS (InterviewForge)
              </h3>
            </div>

            {/* Score Focus */}
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--mg-text-muted)] tracking-wider block">
                AI MATCH CONFIDENCE
              </span>
              <div className="flex items-baseline justify-start sm:justify-end gap-1.5">
                <span
                  id="confidence-counter-num"
                  className={`text-4xl sm:text-6xl font-extrabold font-mono tracking-tight transition-colors duration-300 ${
                    isFixed ? "text-[var(--mg-success)]" : "text-amber-500"
                  }`}
                >
                  {isFixed ? 91 : 62}
                </span>
                <span className="text-base font-mono text-[var(--mg-text-muted)] font-bold">/ 100</span>
              </div>
            </div>
          </div>

          {/* Morphing Claims */}
          <div className="space-y-3 font-mono text-xs sm:text-sm">
            <div className="p-4 rounded-xl border-l-4 border-[var(--mg-success)] bg-[var(--mg-surface-subtle)] flex justify-between items-center">
              <span className="font-bold text-[var(--mg-text)]">
                ✓ Price: ₹3,999/month
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-[var(--mg-success-soft)] text-[var(--mg-success)] font-black text-[10px] sm:text-xs">
                VERIFIED BUDGET CAP
              </span>
            </div>

            <div className="p-4 rounded-xl border-l-4 border-[var(--mg-success)] bg-[var(--mg-surface-subtle)] flex justify-between items-center">
              <span className="font-bold text-[var(--mg-text)]">
                ✓ Monthly recurring billing
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-[var(--mg-success-soft)] text-[var(--mg-success)] font-black text-[10px] sm:text-xs">
                VERIFIED AUTO-MANDATE
              </span>
            </div>

            {/* Morph 1 */}
            <div
              style={{ transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }}
              className={`p-4 rounded-xl border-l-4 ${
                isFixed ? "border-[var(--mg-success)] bg-[var(--mg-success-soft)]/20" : "border-amber-500 bg-amber-500/10"
              } flex justify-between items-center`}
            >
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-[var(--mg-text)]">
                  {isFixed ? "✓ DEDICATED 1:1 HUMAN MENTOR" : "? Human mentor: \"Expert guidance\""}
                </span>
                {isFixed && (
                  <span className="text-[11px] font-mono text-[var(--mg-text-muted)] line-through">
                    &ldquo;Expert guidance&rdquo;
                  </span>
                )}
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-md font-black text-[10px] sm:text-xs ${
                  isFixed ? "bg-[var(--mg-success-soft)] text-[var(--mg-success)]" : "bg-amber-500/20 text-amber-500"
                }`}
              >
                {isFixed ? "✓ 8 SESSIONS EXPLICIT" : "? UNVERIFIED"}
              </span>
            </div>

            {/* Morph 2 */}
            <div
              style={{ transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }}
              className={`p-4 rounded-xl border-l-4 ${
                isFixed ? "border-[var(--mg-success)] bg-[var(--mg-success-soft)]/20" : "border-amber-500 bg-amber-500/10"
              } flex justify-between items-center`}
            >
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-[var(--mg-text)]">
                  {isFixed ? "✓ GUARANTEED 24H RESPONSE SLA" : "? Response time: \"Slack access\""}
                </span>
                {isFixed && (
                  <span className="text-[11px] font-mono text-[var(--mg-text-muted)] line-through">
                    &ldquo;Slack access&rdquo;
                  </span>
                )}
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-md font-black text-[10px] sm:text-xs ${
                  isFixed ? "bg-[var(--mg-success-soft)] text-[var(--mg-success)]" : "bg-amber-500/20 text-amber-500"
                }`}
              >
                {isFixed ? "✓ 24H SLA CONTRACT" : "? UNVERIFIED"}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-3 border-t border-[var(--mg-border)] flex flex-wrap justify-between items-center gap-3">
            <button
              onClick={() => setIsFixed(!isFixed)}
              className="text-xs font-mono font-bold text-[var(--mg-brand)] underline hover:text-[var(--mg-brand-hover)] cursor-pointer"
            >
              {isFixed ? "↺ View Unclear State (Score: 62)" : "Apply Explicit Commitments (Score: 91) ➔"}
            </button>

            {onSimulateClick && (
              <button
                onClick={onSimulateClick}
                className="px-5 py-2.5 rounded-xl bg-[var(--mg-brand)] text-white font-mono text-xs font-black shadow hover:bg-[var(--mg-brand-hover)] transition-all cursor-pointer min-h-[40px]"
              >
                See AI Chooses You ➔
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
