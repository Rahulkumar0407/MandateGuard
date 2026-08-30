"use client";

import React from "react";

interface FinalCTAProps {
  onGetStarted: () => void;
  onExploreDemo: () => void;
}

export function FinalCTA({ onGetStarted, onExploreDemo }: FinalCTAProps) {
  return (
    <section
      className="w-full max-w-5xl mx-auto px-5 sm:px-8 md:px-12 py-28 sm:py-40 flex flex-col justify-center items-center text-center box-border"
    >
      <div className="w-full max-w-3xl space-y-6">
        <span className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-[var(--mg-brand)] inline-block">
          THE NEW COMMERCE TRUST LAYER
        </span>

        <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.045em] text-[var(--mg-text)] leading-[0.98] [text-wrap:balance]">
          BECOME THE
          <br />
          BUSINESS AI
          <br />
          <span className="text-[var(--mg-brand)]">CHOOSES.</span>
        </h2>

        <p className="text-base sm:text-xl text-[var(--mg-text-secondary)] max-w-lg mx-auto leading-relaxed [text-wrap:balance]">
          AI is becoming the buyer. Make sure it can find you, understand your terms, and transact with complete trust.
        </p>

        <div className="flex flex-wrap justify-center gap-3.5 pt-4">
          <button
            onClick={onGetStarted}
            className="px-7 py-3.5 rounded-xl bg-[#0B5CFF] text-white font-bold text-sm tracking-wide shadow-md hover:bg-[#004DE6] transition-all cursor-pointer min-h-[44px]"
          >
            Get started →
          </button>
          <button
            onClick={onExploreDemo}
            className="px-7 py-3.5 rounded-xl bg-[var(--mg-surface)] border border-[var(--mg-border)] text-[var(--mg-text)] font-bold text-sm hover:bg-[var(--mg-surface-elevated)] transition-all cursor-pointer min-h-[44px]"
          >
            See how it works
          </button>
        </div>

        <div className="pt-8 border-t border-[var(--mg-border)] flex flex-wrap justify-center sm:justify-between items-center text-xs font-mono text-[var(--mg-text-muted)] gap-3">
          <span>Get found · Get understood · Get chosen · Stay protected</span>
          <span className="text-[var(--mg-brand)] font-bold">Protected by MandateGuard</span>
        </div>
      </div>
    </section>
  );
}
