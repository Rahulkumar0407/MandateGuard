"use client";

import React, { useRef, useState, useLayoutEffect } from "react";
import { gsap } from "@/lib/gsap";

interface MarketOffer {
  id: string;
  rank: number;
  name: string;
  price: string;
  traits: string;
  verdict: string;
  isMerchant?: boolean;
}

const INITIAL_OFFERS: MarketOffer[] = [
  {
    id: "sd_pro",
    rank: 1,
    name: "SYSTEM DESIGN PRO",
    price: "₹3,499",
    traits: "1:1 Human mentor · 24h SLA",
    verdict: "✓ Fits budget · Verified 1:1 mentor & 24h SLA",
  },
  {
    id: "interview_acc",
    rank: 2,
    name: "INTERVIEW ACCELERATOR",
    price: "₹3,799",
    traits: "Mock rounds · Group QA",
    verdict: "✓ Fits budget · Group QA (No 1:1 mentor)",
  },
  {
    id: "your_business",
    rank: 3,
    name: "YOUR BUSINESS",
    price: "₹3,999",
    traits: "Expert guidance · Recordings",
    verdict: "⚠ Unclear format · Unclear turnaround SLA",
    isMerchant: true,
  },
];

export function RankingExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const rowsContainerRef = useRef<HTMLDivElement>(null);
  const [offers] = useState<MarketOffer[]>(INITIAL_OFFERS);
  const [selectedRank, setSelectedRank] = useState<number>(3);
  const [isSweeping, setIsSweeping] = useState<boolean>(false);

  useLayoutEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Subtle scan highlight on scroll
      gsap.fromTo(
        ".ranking-row",
        { opacity: 0.85, y: 12 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 65%",
            end: "top 35%",
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

  const handleSweep = () => {
    setIsSweeping(true);
    setTimeout(() => {
      setIsSweeping(false);
      setSelectedRank(3);
    }, 700);
  };

  return (
    <section
      ref={sectionRef}
      id="ai-ranking"
      className="w-full max-w-6xl mx-auto px-5 sm:px-8 md:px-12 py-24 sm:py-32 flex flex-col justify-center box-border"
    >
      {/* ─── Left-Aligned Headline ─── */}
      <div className="w-full text-left mb-10 sm:mb-12">
        <span className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-[var(--mg-brand)] block mb-3">
          03 / THE MARKET
        </span>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.04em] text-[var(--mg-text)] leading-[1.02] mb-3 max-w-[18ch] [text-wrap:balance]">
          When AI becomes the buyer,
          <br />
          <span className="text-[var(--mg-brand)]">ranking becomes the storefront.</span>
        </h2>

        <p className="text-sm sm:text-base text-[var(--mg-text-secondary)] leading-relaxed max-w-[50ch]">
          When AI chooses, your position matters. AI ranks the clearest matching offer first and skips ambiguous claims.
        </p>
      </div>

      {/* ─── Full-Width Ranking Experience ─── */}
      <div className="w-full space-y-4">
        {/* Buyer Criteria Bar */}
        <div className="p-4 rounded-xl bg-[var(--mg-brand-soft)] border border-[var(--mg-brand-line)] flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--mg-brand)] animate-pulse" />
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[var(--mg-brand)]">
              BUYER HARD CONSTRAINTS
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
            <span className="px-3 py-1 rounded-lg bg-[var(--mg-surface)] border border-[var(--mg-border)] text-[var(--mg-text)]">
              UNDER ₹4,000
            </span>
            <span className="px-3 py-1 rounded-lg bg-[var(--mg-surface)] border border-[var(--mg-border)] text-[var(--mg-text)]">
              HUMAN MENTOR
            </span>
            <span className="px-3 py-1 rounded-lg bg-[var(--mg-surface)] border border-[var(--mg-border)] text-[var(--mg-text)]">
              24H RESPONSE
            </span>
            <button
              onClick={handleSweep}
              className="px-3.5 py-1 rounded-lg bg-[var(--mg-brand)] text-white text-xs font-mono font-black shadow-sm cursor-pointer hover:bg-[var(--mg-brand-hover)] transition-all min-h-[36px]"
            >
              {isSweeping ? "Evaluating..." : "Run AI Market Sweep ➔"}
            </button>
          </div>
        </div>

        {/* Generous Leaderboard Rows */}
        <div
          ref={rowsContainerRef}
          className="border border-[var(--mg-border)] rounded-2xl bg-[var(--mg-surface)] overflow-hidden divide-y divide-[var(--mg-border)] shadow-md"
        >
          {offers.map((offer) => {
            const isSelected = selectedRank === offer.rank;
            const isMerchant = offer.isMerchant;

            return (
              <div
                key={offer.id}
                onClick={() => setSelectedRank(offer.rank)}
                className={`ranking-row p-5 sm:p-7 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer transition-all duration-300 ${
                  isMerchant
                    ? "bg-amber-500/[0.08] border-l-4 border-l-amber-500"
                    : isSelected
                    ? "bg-[var(--mg-surface-elevated)] border-l-4 border-l-[var(--mg-brand)]"
                    : "hover:bg-[var(--mg-surface-subtle)] border-l-4 border-l-transparent"
                }`}
              >
                {/* Left: Position & Offer Information */}
                <div className="flex items-center gap-4 min-w-0">
                  <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[var(--mg-text-muted)] min-w-[2ch]">
                    0{offer.rank}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="text-lg sm:text-xl font-bold text-[var(--mg-text)] tracking-tight truncate">
                        {offer.name}
                      </h4>
                      {isMerchant && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-mono text-[10px] font-black">
                          POSITION #3
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--mg-text-secondary)] font-mono mt-0.5 truncate">
                      {offer.traits}
                    </p>
                  </div>
                </div>

                {/* Right: Price & Verdict */}
                <div className="text-left md:text-right space-y-0.5">
                  <div className="text-xl sm:text-2xl font-bold font-mono text-[var(--mg-text)] tracking-tight">
                    {offer.price}
                    <span className="text-xs font-normal text-[var(--mg-text-muted)] font-sans"> / mo</span>
                  </div>
                  <div className="text-xs font-mono text-[var(--mg-text-secondary)]">
                    {offer.verdict}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-1 flex justify-between items-center text-xs font-mono text-[var(--mg-text-muted)]">
          <span>AI evaluates hard constraints first.</span>
          <span className="text-amber-500 font-bold">Your Business: Position #3</span>
        </div>
      </div>
    </section>
  );
}
