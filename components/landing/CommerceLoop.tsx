"use client";

import React, { useRef, useState, useEffect, useLayoutEffect } from "react";
import { gsap } from "@/lib/gsap";

interface LoopStage {
  id: string;
  name: string;
  role: string;
  metric: string;
}

const LOOP_STAGES: LoopStage[] = [
  { id: "discover", name: "01 / DISCOVER", role: "AI searches the market for offers", metric: "148 Missions/day" },
  { id: "understand", name: "02 / UNDERSTAND", role: "AI breaks offers into clear facts", metric: "100% Verifiable" },
  { id: "choose", name: "03 / CHOOSE", role: "AI selects the clearest matching business", metric: "Rank #1 Choice" },
  { id: "authorize", name: "04 / AUTHORIZE", role: "Buyer locks the exact agreed price and terms", metric: "Cryptographic SHA" },
  { id: "protect", name: "05 / PROTECT", role: "Stops any unapproved price changes", metric: "Zero Term Drift" },
  { id: "learn", name: "06 / LEARN", role: "Aggregates what AI buyers are searching for", metric: "3 Demand Signals" },
  { id: "improve", name: "07 / IMPROVE", role: "Helps merchants fix missing terms to win more", metric: "+29% Win Rate" },
];

export function CommerceLoop() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  useLayoutEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".loop-stage-btn",
        { opacity: 0.7, y: 10 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            end: "top 35%",
            scrub: 0.5,
          },
          opacity: 1,
          y: 0,
          stagger: 0.04,
          ease: "power2.out",
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStageIndex((prev) => (prev + 1) % LOOP_STAGES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const activeStage = LOOP_STAGES[activeStageIndex];

  return (
    <section
      ref={sectionRef}
      id="growth-loop"
      className="w-full max-w-6xl mx-auto px-5 sm:px-8 md:px-12 py-24 sm:py-32 flex flex-col justify-center box-border"
    >
      {/* ─── Left-Aligned Narrative ─── */}
      <div className="w-full text-left mb-10 sm:mb-12">
        <span className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-[var(--mg-brand)] block mb-3">
          09 / THE LOOP
        </span>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.04em] text-[var(--mg-text)] leading-[1.02] mb-3 max-w-[16ch] [text-wrap:balance]">
          Transactions create
          <br />
          <span className="text-[var(--mg-brand)]">intelligence.</span>
        </h2>

        <p className="text-sm sm:text-base text-[var(--mg-text-secondary)] leading-relaxed max-w-[50ch]">
          Every choice teaches the market. When buyers transact and unauthorized changes are stopped, MandateGuard learns what AI buyers want—helping businesses improve.
        </p>
      </div>

      {/* ─── Continuous System Flow ─── */}
      <div className="w-full space-y-4">
        {/* Node Flow Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {LOOP_STAGES.map((stg, idx) => {
            const isActive = idx === activeStageIndex;
            return (
              <button
                key={stg.id}
                onClick={() => setActiveStageIndex(idx)}
                className={`loop-stage-btn p-3 rounded-xl border text-left font-mono transition-all cursor-pointer min-w-0 min-h-[44px] ${
                  isActive
                    ? "border-[var(--mg-brand)] bg-[var(--mg-brand-soft)] shadow-sm"
                    : "border-[var(--mg-border)] bg-[var(--mg-surface)] hover:border-[var(--mg-border-strong)] opacity-60"
                }`}
              >
                <span className="text-xs font-bold block text-[var(--mg-text)] truncate mb-0.5">
                  {stg.name}
                </span>
                <span className="text-[10px] text-[var(--mg-text-muted)] block truncate">
                  {stg.metric}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Stage Display */}
        <div className="p-6 sm:p-9 rounded-2xl border border-[var(--mg-brand-line)] bg-[var(--mg-surface)] shadow-lg space-y-5">
          <div className="flex justify-between items-start flex-wrap gap-4 border-b border-[var(--mg-border)] pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--mg-brand)] tracking-widest block mb-1">
                STAGE 0{activeStageIndex + 1}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--mg-text)] tracking-tight truncate">
                {activeStage.name}
              </h3>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xl sm:text-2xl font-bold font-mono text-[var(--mg-brand)] block tracking-tight">
                {activeStage.metric}
              </span>
              <span className="text-[10px] text-[var(--mg-text-muted)] font-mono">
                Demand Signal
              </span>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="text-[var(--mg-text-secondary)] text-xs sm:text-sm leading-relaxed">
              <strong>Role:</strong> {activeStage.role}. Transactions feed back into merchant intelligence, revealing exact buyer demands (like 24h SLA guarantees or 1:1 human mentoring) to optimize merchant win rate.
            </div>

            <div className="p-3 rounded-xl bg-[var(--mg-bg)] border border-[var(--mg-border)] text-xs text-[var(--mg-text)] flex justify-between items-center">
              <span>Flywheel Cycle: Continuous</span>
              <span className="text-[var(--mg-brand)] font-bold">Autonomous Optimization</span>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--mg-border)] flex flex-wrap justify-between items-center text-xs font-mono text-[var(--mg-text-muted)] gap-2">
            <span>MandateGuard Growth Loop</span>
            <span className="text-[var(--mg-brand)] font-bold">Buyer ➔ AI ➔ Choice ➔ Purchase ➔ Improvement</span>
          </div>
        </div>
      </div>
    </section>
  );
}
