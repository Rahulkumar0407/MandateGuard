"use client";

import React, { useRef, useState, useLayoutEffect } from "react";
import { gsap } from "@/lib/gsap";

export function OfferClarityMorph() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [activeFact, setActiveFact] = useState<"PRICE" | "FORMAT" | "RESPONSE" | "SESSIONS">("PRICE");

  useLayoutEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !sectionRef.current || !cardRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        { y: 30, opacity: 0.85, scale: 0.98 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            end: "top 30%",
            scrub: 0.5,
          },
          y: 0,
          opacity: 1,
          scale: 1,
          ease: "power2.out",
        },
      );

      gsap.fromTo(
        ".offer-fact-item",
        { opacity: 0.8, y: 8 },
        {
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 75%",
            end: "center 50%",
            scrub: 0.5,
          },
          opacity: 1,
          y: 0,
          stagger: 0.08,
          ease: "power2.out",
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="offer-clarity"
      className="w-full max-w-6xl mx-auto px-5 sm:px-8 md:px-12 py-24 sm:py-32 flex flex-col justify-center box-border"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* ─── Left: Editorial Narrative Column ─── */}
        <div className="lg:col-span-5 text-left space-y-4 lg:sticky lg:top-32">
          <span className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-[var(--mg-brand)] block mb-3">
            02 / THE OFFER
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.04em] text-[var(--mg-text)] leading-[1.02] max-w-[14ch] [text-wrap:balance]">
            AI can&apos;t choose
            <br />
            <span className="text-[var(--mg-brand)]">what it can&apos;t understand.</span>
          </h2>

          <p className="text-sm sm:text-base text-[var(--mg-text-secondary)] leading-relaxed max-w-[45ch]">
            AI needs to know exactly what you&apos;re offering. If terms are buried in ambiguous marketing copy, AI buyers skip to a competitor with explicit, machine-verifiable commitments.
          </p>

          <div className="pt-2 hidden lg:block text-xs font-mono text-[var(--mg-text-muted)]">
            <span>Tap any term to verify machine readability ➔</span>
          </div>
        </div>

        {/* ─── Right: Physical Offer Specification Sheet ─── */}
        <div className="lg:col-span-7 w-full">
          <div
            ref={cardRef}
            className="p-6 sm:p-10 rounded-2xl border border-[var(--mg-border)] bg-[var(--mg-surface)] shadow-lg space-y-6"
          >
            {/* Header: Title & Dominant Price */}
            <div className="flex justify-between items-start flex-wrap gap-4 border-b border-[var(--mg-border)] pb-6">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[var(--mg-brand)] tracking-widest block mb-1">
                  OFFER SPECIFICATION
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--mg-text)] tracking-tight">
                  SYSTEM DESIGN PRO
                </h3>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[var(--mg-text)] block tracking-tight">
                  ₹3,499
                </span>
                <span className="text-xs text-[var(--mg-text-muted)] font-mono">
                  / month (Recurring)
                </span>
              </div>
            </div>

            {/* Commitments Line */}
            <div className="py-2.5 border-y border-[var(--mg-border)] font-mono text-xs sm:text-sm font-bold text-[var(--mg-text)] flex flex-wrap gap-x-4 gap-y-1.5">
              <span>HUMAN MENTOR</span>
              <span className="text-[var(--mg-border-strong)]">·</span>
              <span>8 SESSIONS</span>
              <span className="text-[var(--mg-border-strong)]">·</span>
              <span>24H RESPONSE</span>
              <span className="text-[var(--mg-border-strong)]">·</span>
              <span>CANCEL ANYTIME</span>
            </div>

            {/* 4 Simple Questions */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--mg-text-muted)] tracking-wider block">
                AI VERIFICATION (CLICK TO TEST)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setActiveFact("PRICE")}
                  className={`offer-fact-item p-4 rounded-xl border transition-all cursor-pointer ${
                    activeFact === "PRICE"
                      ? "border-[var(--mg-brand)] bg-[var(--mg-brand-soft)] shadow-sm"
                      : "border-[var(--mg-border)] bg-[var(--mg-bg)] hover:border-[var(--mg-border-strong)]"
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] font-mono mb-1">
                    <span className="text-[var(--mg-text-muted)] font-bold">HOW MUCH?</span>
                    <span className="text-[var(--mg-success)] font-bold">✓ PRICE CLEAR</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-[var(--mg-text)]">
                    ₹3,499 / month
                  </div>
                </div>

                <div
                  onClick={() => setActiveFact("FORMAT")}
                  className={`offer-fact-item p-4 rounded-xl border transition-all cursor-pointer ${
                    activeFact === "FORMAT"
                      ? "border-[var(--mg-brand)] bg-[var(--mg-brand-soft)] shadow-sm"
                      : "border-[var(--mg-border)] bg-[var(--mg-bg)] hover:border-[var(--mg-border-strong)]"
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] font-mono mb-1">
                    <span className="text-[var(--mg-text-muted)] font-bold">WHAT FORMAT?</span>
                    <span className="text-[var(--mg-success)] font-bold">✓ HUMAN MENTOR</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-[var(--mg-text)]">
                    1:1 Live Mentorship
                  </div>
                </div>

                <div
                  onClick={() => setActiveFact("RESPONSE")}
                  className={`offer-fact-item p-4 rounded-xl border transition-all cursor-pointer ${
                    activeFact === "RESPONSE"
                      ? "border-[var(--mg-brand)] bg-[var(--mg-brand-soft)] shadow-sm"
                      : "border-[var(--mg-border)] bg-[var(--mg-bg)] hover:border-[var(--mg-border-strong)]"
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] font-mono mb-1">
                    <span className="text-[var(--mg-text-muted)] font-bold">HOW FAST?</span>
                    <span className="text-[var(--mg-success)] font-bold">✓ 24H SLA</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-[var(--mg-text)]">
                    Guaranteed 24-Hour SLA
                  </div>
                </div>

                <div
                  onClick={() => setActiveFact("SESSIONS")}
                  className={`offer-fact-item p-4 rounded-xl border transition-all cursor-pointer ${
                    activeFact === "SESSIONS"
                      ? "border-[var(--mg-brand)] bg-[var(--mg-brand-soft)] shadow-sm"
                      : "border-[var(--mg-border)] bg-[var(--mg-bg)] hover:border-[var(--mg-border-strong)]"
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] font-mono mb-1">
                    <span className="text-[var(--mg-text-muted)] font-bold">WHAT&apos;S INCLUDED?</span>
                    <span className="text-[var(--mg-success)] font-bold">✓ 8 SESSIONS</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-[var(--mg-text)]">
                    8 Sessions + Cancel Anytime
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--mg-border)] flex flex-wrap justify-between items-center text-[11px] font-mono text-[var(--mg-text-muted)] gap-2">
              <span>MandateGuard Structured Specification</span>
              <span className="text-[var(--mg-brand)] font-bold">AI can verify every clause immediately.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
