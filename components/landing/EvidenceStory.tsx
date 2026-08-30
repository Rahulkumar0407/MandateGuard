"use client";

import React, { useRef, useLayoutEffect } from "react";
import { gsap } from "@/lib/gsap";

export function EvidenceStory() {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".evidence-rule-item",
        { opacity: 0.8, y: 8 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            end: "top 30%",
            scrub: 0.5,
          },
          opacity: 1,
          y: 0,
          stagger: 0.06,
          ease: "power2.out",
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="what-we-measure"
      className="w-full max-w-6xl mx-auto px-5 sm:px-8 md:px-12 py-24 sm:py-32 flex flex-col justify-center box-border"
    >
      {/* ─── Left-Aligned Narrative ─── */}
      <div className="w-full text-left mb-10 sm:mb-12">
        <span className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-[var(--mg-brand)] block mb-3">
          10 / THE PROOF
        </span>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.04em] text-[var(--mg-text)] leading-[1.02] mb-3 max-w-[16ch] [text-wrap:balance]">
          MAKE AI
          <br />
          <span className="text-[var(--mg-brand)]">A BETTER BUYER.</span>
        </h2>

        <p className="text-sm sm:text-base text-[var(--mg-text-secondary)] leading-relaxed max-w-[50ch]">
          Every important decision has a record. From initial search and verified commitments to exact authorized snapshots, MandateGuard ensures complete transparency.
        </p>
      </div>

      {/* ─── Editorial Hairline Proof Wall ─── */}
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-[var(--mg-border)]">
          {/* Item 1 */}
          <div className="evidence-rule-item space-y-1.5 pb-4 border-b md:border-b-0 border-[var(--mg-border-subtle)] min-w-0">
            <span className="text-[10px] font-mono uppercase font-bold text-[var(--mg-brand)] tracking-widest block">
              01 · MACHINE-READABLE OFFER
            </span>
            <div className="text-base sm:text-lg font-bold text-[var(--mg-text)] tracking-tight">
              What the Buyer Saw
            </div>
            <p className="text-xs text-[var(--mg-text-secondary)] leading-relaxed">
              Every commercial commitment is cryptographically signed, versioned, and indexed with a SHA-256 version hash.
            </p>
          </div>

          {/* Item 2 */}
          <div className="evidence-rule-item space-y-1.5 pb-4 border-b md:border-b-0 border-[var(--mg-border-subtle)] min-w-0">
            <span className="text-[10px] font-mono uppercase font-bold text-[var(--mg-brand)] tracking-widest block">
              02 · VERIFIED COMMITMENTS
            </span>
            <div className="text-base sm:text-lg font-bold text-[var(--mg-text)] tracking-tight">
              What Was Grounded
            </div>
            <p className="text-xs text-[var(--mg-text-secondary)] leading-relaxed">
              Zero semantic hallucination: rankings reflect only explicit, verified merchant terms.
            </p>
          </div>

          {/* Item 3 */}
          <div className="evidence-rule-item space-y-1.5 pb-4 border-b md:border-b-0 border-[var(--mg-border-subtle)] min-w-0">
            <span className="text-[10px] font-mono uppercase font-bold text-[var(--mg-brand)] tracking-widest block">
              03 · BUYER INTENT
            </span>
            <div className="text-base sm:text-lg font-bold text-[var(--mg-text)] tracking-tight">
              What Constraints Applied
            </div>
            <p className="text-xs text-[var(--mg-text-secondary)] leading-relaxed">
              Price caps, mentor requirements, and SLAs are enforced as hard boolean gates.
            </p>
          </div>

          {/* Item 4 */}
          <div className="evidence-rule-item space-y-1.5 pb-4 border-b md:border-b-0 border-[var(--mg-border-subtle)] min-w-0">
            <span className="text-[10px] font-mono uppercase font-bold text-[var(--mg-brand)] tracking-widest block">
              04 · SELECTION REASON
            </span>
            <div className="text-base sm:text-lg font-bold text-[var(--mg-text)] tracking-tight">
              Why It Was Chosen
            </div>
            <p className="text-xs text-[var(--mg-text-secondary)] leading-relaxed">
              Auditable decision trail showing exact verified factors for every single transaction.
            </p>
          </div>

          {/* Item 5 */}
          <div className="evidence-rule-item space-y-1.5 pb-4 border-b md:border-b-0 border-[var(--mg-border-subtle)] min-w-0">
            <span className="text-[10px] font-mono uppercase font-bold text-[var(--mg-brand)] tracking-widest block">
              05 · AUTHORIZATION STATE
            </span>
            <div className="text-base sm:text-lg font-bold text-[var(--mg-text)] tracking-tight">
              What Was Approved
            </div>
            <p className="text-xs text-[var(--mg-text-secondary)] leading-relaxed">
              Buyer authorizations are snapshot-bound, preventing mid-cycle term drift.
            </p>
          </div>

          {/* Item 6 */}
          <div className="evidence-rule-item space-y-1.5 pb-4 border-b md:border-b-0 border-[var(--mg-border-subtle)] min-w-0">
            <span className="text-[10px] font-mono uppercase font-bold text-[var(--mg-brand)] tracking-widest block">
              06 · PROTECTION STATE
            </span>
            <div className="text-base sm:text-lg font-bold text-[var(--mg-text)] tracking-tight">
              What Was Gated
            </div>
            <p className="text-xs text-[var(--mg-text-secondary)] leading-relaxed">
              Zero provider mutations execute outside the strictly gated executor boundary.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
