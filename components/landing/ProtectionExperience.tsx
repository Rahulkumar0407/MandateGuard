"use client";

import React, { useRef, useState, useLayoutEffect } from "react";
import { gsap } from "@/lib/gsap";
import { ShieldIcon } from "../hero/ShieldIcon";

export function ProtectionExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const [hasDrifted, setHasDrifted] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useLayoutEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Draw border stroke / highlight gate on scroll
      gsap.fromTo(
        ".gate-card",
        { y: 30, opacity: 0.85 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 65%",
            end: "top 30%",
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

  const handleTryPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setHasDrifted(true);
    }, 500);
  };

  return (
    <section
      ref={sectionRef}
      id="buy-safely"
      className="w-full max-w-6xl mx-auto px-5 sm:px-8 md:px-12 py-24 sm:py-32 flex flex-col justify-center box-border"
    >
      {/* ─── Left-Aligned Narrative ─── */}
      <div className="w-full text-left mb-10 sm:mb-12">
        <span className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-[var(--mg-brand)] block mb-3">
          07 &amp; 08 — AUTHORIZATION &amp; THE BARRIER
        </span>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.04em] text-[var(--mg-text)] leading-[1.02] mb-2 max-w-[16ch] [text-wrap:balance]">
          BEING CHOSEN
          <br />
          IS ONLY HALF THE JOB.
        </h2>

        <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-[-0.035em] text-[var(--mg-brand)] leading-[1.05] mb-3 max-w-[20ch] [text-wrap:balance]">
          IF THE TERMS CHANGE,
          <br />
          THE AUTHORIZATION DOESN&apos;T.
        </div>

        <p className="text-sm sm:text-base text-[var(--mg-text-secondary)] leading-relaxed max-w-[50ch]">
          The buyer approves exact terms. If a merchant later tries to charge an unexpected amount, MandateGuard stops the payment instantly before any money moves.
        </p>
      </div>

      {/* ─── Transaction Gated Canvas ─── */}
      <div className="w-full space-y-4">
        {/* Action Header */}
        <div className="flex justify-between items-center pb-2 border-b border-[var(--mg-border)]">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--mg-text-muted)]">
            TRANSACTION PROTECTION
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleTryPayment}
              className="px-4 py-2 text-xs font-mono font-bold rounded-xl bg-[var(--mg-brand)] text-white hover:bg-[var(--mg-brand-hover)] transition-all cursor-pointer shadow-sm min-h-[36px]"
            >
              {isProcessing ? "Checking..." : "Try Payment (₹4,129) ➔"}
            </button>
            <button
              onClick={() => setHasDrifted(!hasDrifted)}
              className="text-xs font-mono text-[var(--mg-text-muted)] hover:underline cursor-pointer min-h-[36px] flex items-center"
            >
              {hasDrifted ? "Simulating: Term Drift" : "Simulating: Exact Match"}
            </button>
          </div>
        </div>

        {/* 2-Column Gate Boundary */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Left: What Buyer Approved */}
          <div className="gate-card md:col-span-6 p-6 sm:p-9 rounded-2xl border border-[var(--mg-border)] bg-[var(--mg-surface)] flex flex-col justify-between space-y-5 shadow-lg min-w-0">
            <div>
              <div className="flex justify-between items-center mb-5">
                <span className="text-[10px] font-mono uppercase font-bold text-[var(--mg-brand)] tracking-widest">
                  BUYER APPROVED
                </span>
                <span className="px-3 py-1 rounded-full bg-[var(--mg-brand-soft)] text-[var(--mg-brand)] font-mono text-[11px] font-black">
                  AUTHORIZED
                </span>
              </div>

              <div className="space-y-1 mb-5">
                <h3 className="text-xl sm:text-2xl font-bold text-[var(--mg-text)] tracking-tight truncate">
                  YOUR BUSINESS
                </h3>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--mg-text)] tracking-tight">
                  ₹3,999 <span className="text-xs font-normal text-[var(--mg-text-muted)] font-sans">/ month</span>
                </div>
              </div>

              <div className="space-y-2 font-mono text-xs text-[var(--mg-text-secondary)] border-t border-[var(--mg-border)] pt-4">
                <div>✓ 1:1 Human mentor format</div>
                <div>✓ 8 live sessions / month</div>
                <div>✓ Guaranteed 24h response SLA</div>
                <div>✓ Authorized snapshot locked</div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--mg-border)] text-xs font-mono text-[var(--mg-text-muted)] flex justify-between">
              <span>Status: Immutable</span>
              <span className="text-[var(--mg-brand)] font-bold">Snapshot: snap_88f2</span>
            </div>
          </div>

          {/* Right: What Was Requested / Stoppage Gate */}
          <div
            className={`gate-card md:col-span-6 p-6 sm:p-9 rounded-2xl border flex flex-col justify-between space-y-5 transition-all duration-300 min-w-0 ${
              hasDrifted
                ? "border-red-500/30 bg-red-500/[0.04] shadow-lg"
                : "border-emerald-500/30 bg-emerald-500/[0.04] shadow-lg"
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-5">
                <span
                  className={`text-[10px] font-mono uppercase font-bold tracking-widest ${
                    hasDrifted ? "text-[var(--mg-critical)]" : "text-[var(--mg-success)]"
                  }`}
                >
                  {hasDrifted ? "MISMATCH DETECTED" : "CYCLE RENEWAL MATCH"}
                </span>
                <ShieldIcon size={28} blocked={hasDrifted} active={!hasDrifted} />
              </div>

              <div className="space-y-1 mb-5">
                <div className="text-[10px] font-mono text-[var(--mg-text-muted)] uppercase tracking-wider">
                  {hasDrifted ? "MERCHANT REQUESTS" : "RECURRING CHARGE"}
                </div>
                <div
                  className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                    hasDrifted ? "text-[var(--mg-critical)]" : "text-[var(--mg-success)]"
                  }`}
                >
                  {hasDrifted ? "₹4,129" : "₹3,999"}{" "}
                  <span className="text-xs font-normal text-[var(--mg-text-muted)] font-sans">/ month</span>
                </div>
              </div>

              <div className="space-y-2.5 font-mono text-xs border-t border-[var(--mg-border)] pt-4">
                {hasDrifted ? (
                  <>
                    <div className="p-3 rounded-xl bg-red-500/15 text-[var(--mg-critical)] font-bold text-xs">
                      🛡️ PAYMENT STOPPED · NO MONEY MOVED.
                    </div>
                    <div className="text-[var(--mg-text-secondary)] text-xs leading-relaxed">
                      <strong>Why?</strong> The price changed from ₹3,999 to ₹4,129. MandateGuard blocked the mutation before any money was moved.
                    </div>
                    <div className="text-amber-500 font-bold text-xs">
                      REAUTHORIZATION REQUIRED
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 rounded-xl bg-emerald-500/15 text-[var(--mg-success)] font-bold text-xs">
                      ✓ TERMS MATCHED · PAYMENT EXECUTING
                    </div>
                    <div className="text-[var(--mg-text-secondary)] text-xs leading-relaxed">
                      All terms match the authorized snapshot. The payment is safely processed on Razorpay Test Mode.
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--mg-border)] text-xs font-mono text-[var(--mg-text-muted)] flex justify-between">
              <span>Razorpay Test Mode</span>
              <span className={hasDrifted ? "text-[var(--mg-critical)] font-bold" : "text-[var(--mg-success)] font-bold"}>
                {hasDrifted ? "Mutation Blocked" : "Mutation Authorized"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
