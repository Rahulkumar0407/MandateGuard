"use client";

import React, { useRef, useState, useLayoutEffect } from "react";
import { gsap } from "@/lib/gsap";

export function BuyerInvestigation() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inspectedClaim, setInspectedClaim] = useState<string>("mentor");

  useLayoutEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".investigation-card",
        { y: 25, opacity: 0.85 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            end: "top 35%",
            scrub: 0.5,
          },
          y: 0,
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
      id="why-buyers-leave"
      className="w-full max-w-6xl mx-auto px-5 sm:px-8 md:px-12 py-24 sm:py-32 flex flex-col justify-center box-border"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* ─── Left: Editorial Narrative Column ─── */}
        <div className="lg:col-span-5 text-left space-y-4 lg:sticky lg:top-32">
          <span className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-[var(--mg-brand)] block mb-3">
            04 / THE INVESTIGATION
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.04em] text-[var(--mg-text)] leading-[1.02] max-w-[14ch] [text-wrap:balance]">
            YOU&apos;RE NOT LOSING
            <br />
            BECAUSE YOU&apos;RE BAD.
          </h2>

          <div className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-[-0.035em] text-[var(--mg-brand)] leading-[1.05] [text-wrap:balance]">
            AI JUST COULDN&apos;T
            <br />
            VERIFY THE PROMISE.
          </div>

          <p className="text-sm sm:text-base text-[var(--mg-text-secondary)] leading-relaxed max-w-[45ch]">
            AI just couldn&apos;t verify what you promised. Human buyers might read between the lines, but AI buyers only evaluate explicit commitments.
          </p>

          <div className="pt-2 hidden lg:block text-xs font-mono text-[var(--mg-text-muted)]">
            <span>Tap any unverified claim to reveal the cause ➔</span>
          </div>
        </div>

        {/* ─── Right: Forensic Offer Sheet ─── */}
        <div className="lg:col-span-7 w-full">
          <div className="investigation-card p-6 sm:p-10 rounded-2xl border border-[var(--mg-border)] bg-[var(--mg-surface)] shadow-lg space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start flex-wrap gap-4 border-b border-[var(--mg-border)] pb-6">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-amber-500 tracking-widest block mb-1">
                  LET&apos;S SEE WHAT AI SAW (CLICK TO INSPECT)
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-[var(--mg-text)] tracking-tight truncate">
                  YOUR BUSINESS (InterviewForge)
                </h3>
                <p className="text-xs text-[var(--mg-text-secondary)] font-mono mt-0.5">
                  &ldquo;Expert guidance &amp; recordings for distributed systems interview prep.&rdquo;
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-[var(--mg-text)] block tracking-tight">
                  ₹3,999
                </span>
                <span className="text-xs text-[var(--mg-text-muted)] font-mono">
                  / month
                </span>
              </div>
            </div>

            {/* 4 Simple Claims */}
            <div className="space-y-3 font-mono text-xs sm:text-sm">
              <div
                onClick={() => setInspectedClaim("price")}
                className="p-4 rounded-xl border-l-4 border-[var(--mg-success)] bg-[var(--mg-surface-subtle)] flex justify-between items-center cursor-pointer hover:bg-[var(--mg-surface-elevated)] transition-all min-h-[44px]"
              >
                <span className="font-bold text-[var(--mg-text)]">
                  ✓ Price: ₹3,999/month
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-[var(--mg-success-soft)] text-[var(--mg-success)] font-black text-[10px] sm:text-xs">
                  ✓ VERIFIED (≤ ₹4,000 BUDGET CAP)
                </span>
              </div>

              <div
                onClick={() => setInspectedClaim("billing")}
                className="p-4 rounded-xl border-l-4 border-[var(--mg-success)] bg-[var(--mg-surface-subtle)] flex justify-between items-center cursor-pointer hover:bg-[var(--mg-surface-elevated)] transition-all min-h-[44px]"
              >
                <span className="font-bold text-[var(--mg-text)]">
                  ✓ Monthly billing
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-[var(--mg-success-soft)] text-[var(--mg-success)] font-black text-[10px] sm:text-xs">
                  ✓ VERIFIED (RECURRING CADENCE)
                </span>
              </div>

              <div
                onClick={() => setInspectedClaim("mentor")}
                className={`p-4 rounded-xl border-l-4 border-amber-500 flex justify-between items-center cursor-pointer transition-all min-h-[44px] ${
                  inspectedClaim === "mentor" ? "bg-amber-500/15 shadow-sm" : "bg-amber-500/5 hover:bg-amber-500/10"
                }`}
              >
                <span className="font-bold text-[var(--mg-text)]">
                  ? Human mentor: &ldquo;Expert guidance&rdquo;
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-500 font-black text-[10px] sm:text-xs">
                  ? UNVERIFIED (FORMAT UNSTATED)
                </span>
              </div>

              <div
                onClick={() => setInspectedClaim("response")}
                className={`p-4 rounded-xl border-l-4 border-amber-500 flex justify-between items-center cursor-pointer transition-all min-h-[44px] ${
                  inspectedClaim === "response" ? "bg-amber-500/15 shadow-sm" : "bg-amber-500/5 hover:bg-amber-500/10"
                }`}
              >
                <span className="font-bold text-[var(--mg-text)]">
                  ? Response time: &ldquo;Slack access&rdquo;
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-500 font-black text-[10px] sm:text-xs">
                  ? UNVERIFIED (NO 24H SLA PROOF)
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--mg-border)] flex flex-wrap justify-between items-center text-xs font-mono text-[var(--mg-text-muted)] gap-2">
              <span>Insight: You weren&apos;t worse. Your offer was just harder for AI to verify.</span>
              <span className="text-amber-500 font-bold">
                {inspectedClaim === "mentor"
                  ? "Cause: 'Expert guidance' lacks 1:1 human format clause."
                  : inspectedClaim === "response"
                  ? "Cause: 'Slack access' lacks a machine-enforceable 24h SLA clause."
                  : "Forensic Cause: Missing Verifiable Proof"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
