"use client";

import React, { useRef, useState, useLayoutEffect } from "react";
import { gsap } from "@/lib/gsap";

export function SimulationField() {
  const sectionRef = useRef<HTMLElement>(null);
  const heroCardRef = useRef<HTMLDivElement>(null);
  const [isPromoted, setIsPromoted] = useState(true);

  useLayoutEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !sectionRef.current || !heroCardRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        heroCardRef.current,
        { scale: 0.96, opacity: 0.85 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 65%",
            end: "top 30%",
            scrub: 0.5,
          },
          scale: 1,
          opacity: 1,
          ease: "power2.out",
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="prove-it"
      className="w-full max-w-5xl mx-auto px-5 sm:px-8 md:px-12 py-28 sm:py-36 flex flex-col justify-center items-center box-border"
    >
      {/* ─── Centered Cinematic Statement (Level A Moment) ─── */}
      <div className="w-full max-w-3xl text-center mb-12 sm:mb-16">
        <span className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-[var(--mg-brand)] inline-block mb-4">
          06 / THE CHOICE
        </span>

        <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.045em] text-[var(--mg-text)] leading-[0.98] mb-4 [text-wrap:balance]">
          NOW AI
          <br />
          <span className="text-[var(--mg-success)]">CAN CHOOSE YOU.</span>
        </h2>

        <p className="text-sm sm:text-base md:text-lg text-[var(--mg-text-secondary)] max-w-lg mx-auto leading-relaxed [text-wrap:balance]">
          Your offer was clear enough for AI to compare and choose.
        </p>
      </div>

      {/* ─── Cinematic Victorious Moment ─── */}
      <div className="w-full max-w-3xl space-y-4">
        {/* Dominant Hero Card */}
        <div
          ref={heroCardRef}
          style={{
            transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          className="p-8 sm:p-12 rounded-3xl border-2 border-[var(--mg-success)] bg-[var(--mg-surface)] shadow-2xl space-y-6"
        >
          <div className="flex justify-between items-start flex-wrap gap-4 border-b border-[var(--mg-border)] pb-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3.5 py-1 rounded-full bg-[var(--mg-success-soft)] text-[var(--mg-success)] font-mono text-xs font-black">
                  {isPromoted ? "RANK #1 · ✓ AI CHOSEN" : "RANK #3 · UNRANKED"}
                </span>
                <span className="text-xs font-mono text-[var(--mg-text-muted)] font-bold">
                  91/100 CONFIDENCE
                </span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-[var(--mg-text)] tracking-tight mt-3 truncate">
                YOUR BUSINESS (InterviewForge)
              </h3>
              <p className="text-xs sm:text-sm text-[var(--mg-text-secondary)] font-mono mt-1">
                ✓ 8 live sessions · Guaranteed 24h SLA · ₹3,999/mo
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-3xl sm:text-5xl font-extrabold font-mono text-[var(--mg-success)] block tracking-tight">
                ₹3,999
              </span>
              <span className="text-xs text-[var(--mg-text-muted)] font-mono">
                / month (Auto-Mandate)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap justify-between items-center text-xs font-mono text-[var(--mg-text-muted)] gap-3">
            <span>Your offer was clear enough for AI to compare and choose.</span>
            <button
              onClick={() => setIsPromoted(!isPromoted)}
              className="text-xs text-[var(--mg-brand)] font-bold hover:underline cursor-pointer min-h-[36px] flex items-center"
            >
              {isPromoted ? "↺ Revert to #3" : "Promote to #1 ➔"}
            </button>
          </div>
        </div>

        {/* Competitors (Receding & Subtle) */}
        <div className="space-y-2 opacity-35">
          <div className="p-3.5 rounded-xl border border-[var(--mg-border)] bg-[var(--mg-surface)] flex justify-between items-center text-xs font-mono">
            <span className="text-[var(--mg-text-muted)]">02 · SYSTEM DESIGN PRO</span>
            <span className="text-[var(--mg-text-secondary)]">₹3,499/mo · Rank #2</span>
          </div>
          <div className="p-3.5 rounded-xl border border-[var(--mg-border)] bg-[var(--mg-surface)] flex justify-between items-center text-xs font-mono">
            <span className="text-[var(--mg-text-muted)]">03 · INTERVIEW ACCELERATOR</span>
            <span className="text-[var(--mg-text-secondary)]">₹3,799/mo · Rank #3</span>
          </div>
        </div>
      </div>
    </section>
  );
}
