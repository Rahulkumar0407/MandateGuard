"use client";

import React, { useState } from "react";

interface BusinessOnboardingProps {
  onComplete: () => void;
  onRunFirstTest: () => void;
}

export function BusinessOnboarding({ onComplete, onRunFirstTest }: BusinessOnboardingProps) {
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState("InterviewForge AI");
  const [category, setCategory] = useState("Technical Interview Coaching");

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete();
      onRunFirstTest();
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-12 px-4 sm:px-6 animate-fade-in" data-testid="onboarding-root">
      {/* Progress */}
      <div className="mb-8 flex items-center justify-between border-b border-[var(--mg-border)] pb-4">
        <div className="flex items-center gap-2.5 text-xs font-bold text-[var(--mg-text-secondary)]">
          <span className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-black text-white bg-[var(--mg-brand)]">
            {step}
          </span>
          <span className="text-[var(--mg-navy)]">Step {step} of 3</span>
        </div>
        <span className="text-xs font-semibold text-[var(--mg-text-muted)]">Business Setup</span>
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="rounded-3xl border border-[var(--mg-border)] p-6 sm:p-8 bg-white shadow-xs space-y-6">
          <div>
            <span className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--mg-brand)] bg-[var(--mg-brand-soft)] border border-[var(--mg-brand-line)]">
              Step 1
            </span>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-[var(--mg-navy)]">
              Tell us about your business.
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[var(--mg-text-secondary)]">
              AI buyers look for a clear business identity and defined offerings.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="mb-1.5 block font-bold text-[var(--mg-text-secondary)]">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. InterviewForge AI"
                className="w-full rounded-xl border border-[var(--mg-border)] bg-[var(--mg-bg)] px-4 py-2.5 text-xs text-[var(--mg-navy)] placeholder-[var(--mg-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--mg-brand)] font-medium"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-bold text-[var(--mg-text-secondary)]">Primary Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Technical Interview Coaching"
                className="w-full rounded-xl border border-[var(--mg-border)] bg-[var(--mg-bg)] px-4 py-2.5 text-xs text-[var(--mg-navy)] placeholder-[var(--mg-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--mg-brand)] font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-[var(--mg-border)] pt-4">
            <button
              onClick={handleNext}
              className="rounded-xl px-6 py-2.5 text-xs font-bold text-white bg-[var(--mg-brand)] hover:bg-[var(--mg-brand-hover)] transition-all shadow-xs mg-press"
            >
              Continue to Catalog →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="rounded-3xl border border-[var(--mg-border)] p-6 sm:p-8 bg-white shadow-xs space-y-6">
          <div>
            <span className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--mg-success)] bg-[var(--mg-success-soft)] border border-[var(--mg-success)]/20">
              Step 2
            </span>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-[var(--mg-navy)]">
              Connect your catalog.
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[var(--mg-text-secondary)]">
              We found 3 active recurring plans ready for AI buyers.
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            {[
              { n: "System Design Pro", d: "1:1 Human Mentor • 24h SLA • 30d Refund", p: "₹3,499 / mo" },
              { n: "DSA Mastery", d: "Self-paced curriculum • 48h SLA", p: "₹1,999 / mo" },
              { n: "Engineering Leadership Prep", d: "Executive coaching • 24h SLA", p: "₹2,499 / mo" },
            ].map((o) => (
              <div
                key={o.n}
                className="flex items-center justify-between rounded-2xl border border-[var(--mg-border)] bg-[var(--mg-bg)] px-4 py-3 shadow-xs"
              >
                <div>
                  <div className="font-extrabold text-[var(--mg-navy)]">{o.n}</div>
                  <div className="text-[11px] text-[var(--mg-text-secondary)] mt-0.5">{o.d}</div>
                </div>
                <span className="font-black text-[var(--mg-brand)] text-sm">{o.p}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-[var(--mg-border)] pt-4">
            <button
              onClick={() => setStep(1)}
              className="text-xs font-bold text-[var(--mg-text-secondary)] hover:text-[var(--mg-navy)] mg-press"
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              className="rounded-xl px-6 py-2.5 text-xs font-bold text-white bg-[var(--mg-brand)] hover:bg-[var(--mg-brand-hover)] transition-all shadow-xs mg-press"
            >
              Continue to AI Test →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="rounded-3xl border border-[var(--mg-border)] p-6 sm:p-8 bg-white shadow-xs text-center space-y-6">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[var(--mg-brand-line)] bg-[var(--mg-brand-soft)] text-2xl font-black text-[var(--mg-brand)] shadow-xs">
            3
          </div>

          <div className="mx-auto max-w-md space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-[var(--mg-navy)]">
              Let&apos;s see how AI buyers experience it.
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[var(--mg-text-secondary)]">
              We&apos;ll evaluate your 3 subscription offers across 100 representative AI buyer missions
              covering English, Hindi, and Hinglish queries.
            </p>
          </div>

          <div className="mx-auto max-w-md rounded-2xl border border-[var(--mg-border)] bg-[var(--mg-bg)] p-4 text-left text-xs space-y-2">
            <div className="font-extrabold text-[var(--mg-navy)] text-xs">What gets evaluated:</div>
            <div className="space-y-1.5 text-[11px] text-[var(--mg-text-secondary)]">
              <div className="flex items-center space-x-2">
                <span className="text-[var(--mg-brand)] font-bold">•</span>
                <span>Can AI discover your catalog in natural searches?</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[var(--mg-brand)] font-bold">•</span>
                 <span>Can AI clearly verify your mentor &amp; SLA commitments?</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[var(--mg-brand)] font-bold">•</span>
                <span>Does pricing fit within buyer budget envelopes?</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={handleNext}
              className="rounded-xl px-8 py-3.5 text-xs font-bold text-white bg-[var(--mg-brand)] hover:bg-[var(--mg-brand-hover)] transition-all shadow-xs mg-press"
            >
               Run my first AI Buyer Test →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
