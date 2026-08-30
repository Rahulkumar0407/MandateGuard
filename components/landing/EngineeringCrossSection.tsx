"use client";

import React, { useRef, useState, useLayoutEffect } from "react";
import { gsap } from "@/lib/gsap";

interface FlowStep {
  step: string;
  actor: string;
  summary: string;
  detail: string;
  badge: string;
  highlight?: boolean;
}

const SYSTEM_FLOW: FlowStep[] = [
  {
    step: "01",
    actor: "AI BUYER",
    summary: "&ldquo;I want a human mentor under ₹4,000 with 24-hour support.&rdquo;",
    detail: "Buyer specifies goals and constraints in natural language.",
    badge: "INTENT",
  },
  {
    step: "02",
    actor: "MANDATEGUARD",
    summary: "UNDERSTANDS THE REQUEST",
    detail: "Extracts hard constraints: Human mentor · ≤ ₹4,000 cap · 24h SLA.",
    badge: "PARSED",
    highlight: true,
  },
  {
    step: "03",
    actor: "YOUR BUSINESS",
    summary: "CLEAR OFFER MATCH",
    detail: "Verifies explicit commitments: Human mentor · ₹3,999/mo · 24h response.",
    badge: "RANK #1",
  },
  {
    step: "04",
    actor: "BUYER APPROVES",
    summary: "₹3,999 / month",
    detail: "Locks the exact commercial terms into an immutable authorization snapshot.",
    badge: "AUTHORIZED",
    highlight: true,
  },
  {
    step: "05",
    actor: "PAYMENT EXECUTED",
    summary: "₹3,999 (Razorpay Test Mode)",
    detail: "Payment executes only because the charge matches approved terms.",
    badge: "✓ PROTECTED",
  },
];

interface DevSpec {
  id: string;
  title: string;
  desc: string;
  snippet: string;
}

const DEV_SPECS: DevSpec[] = [
  {
    id: "intent",
    title: "01 · Canonical Buyer Intent",
    desc: "Zod schema parsing buyer constraints into budget ceilings and required clauses.",
    snippet: `export const BuyerIntentSchema = z.object({
  category: z.string(),
  maxBudgetInr: z.number().int().positive(),
  requiredCommitments: z.array(z.string()),
  currency: z.literal("INR")
});`,
  },
  {
    id: "contract",
    title: "02 · Machine-Readable Contract",
    desc: "Cryptographic SHA-256 version hash locking merchant commitments.",
    snippet: `export function computeOfferHash(offer: OfferVersion): string {
  const payload = JSON.stringify(offer.commitments);
  return crypto.createHash("sha256").update(payload).digest("hex");
}`,
  },
  {
    id: "gate",
    title: "03 · Deterministic Policy Gate",
    desc: "Hard-constraint evaluation enforcing strict boolean price and term invariants.",
    snippet: `export function evaluatePolicy(intent: BuyerIntent, offer: Offer): PolicyVerdict {
  if (offer.priceMonthly > intent.maxBudgetInr) {
    return { authorized: false, reason: "BUDGET_CEILING_EXCEEDED" };
  }
  return { authorized: true };
}`,
  },
  {
    id: "executor",
    title: "04 · Commerce Mutation Executor",
    desc: "Sole application-level provider mutation boundary gating all Razorpay operations.",
    snippet: `export async function executeGatedMutation(action: FinancialAction) {
  await verifyImmutableSnapshot(action.snapshotId, action.expectedHash);
  return await RazorpayGateway.createSubscription(action.params);
}`,
  },
];

export function EngineeringCrossSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [showDevSpecs, setShowDevSpecs] = useState(false);
  const [activeDevTab, setActiveDevTab] = useState(0);

  useLayoutEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".flow-step-card",
        { opacity: 0.8, y: 15 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 72%",
            end: "top 32%",
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
      id="technical-proof"
      className="w-full max-w-6xl mx-auto px-5 sm:px-8 md:px-12 py-24 sm:py-32 flex flex-col justify-center box-border"
    >
      {/* ─── Left-Aligned Narrative ─── */}
      <div className="w-full text-left mb-10 sm:mb-14">
        <span className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-[var(--mg-brand)] block mb-3">
          11 / UNDER THE HOOD
        </span>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.04em] text-[var(--mg-text)] leading-[1.02] mb-3 max-w-[20ch] [text-wrap:balance]">
          HOW MANDATEGUARD
          <br />
          CONNECTS THE DECISION
          <br />
          <span className="text-[var(--mg-brand)]">TO THE PAYMENT.</span>
        </h2>

        <p className="text-sm sm:text-base text-[var(--mg-text-secondary)] leading-relaxed max-w-[52ch]">
          AI decides what it wants to buy. MandateGuard makes sure the purchase matches what the buyer actually approved.
        </p>
      </div>

      {/* ─── 5-Step Continuous System Flow (Human-First Architecture) ─── */}
      <div className="w-full space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {SYSTEM_FLOW.map((stepItem) => {
            return (
              <div
                key={stepItem.step}
                className={`flow-step-card p-4 sm:p-5 rounded-2xl border flex flex-col justify-between space-y-3 transition-all min-w-0 ${
                  stepItem.highlight
                    ? "border-[var(--mg-brand-line)] bg-[var(--mg-brand-soft)] shadow-sm"
                    : "border-[var(--mg-border)] bg-[var(--mg-surface)] shadow-xs"
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-mono font-black text-[var(--mg-text-muted)]">
                      {`STEP ${stepItem.step}`}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-black ${
                        stepItem.highlight
                          ? "bg-[var(--mg-brand)] text-white"
                          : "bg-[var(--mg-surface-subtle)] text-[var(--mg-text-secondary)] border border-[var(--mg-border)]"
                      }`}
                    >
                      {stepItem.badge}
                    </span>
                  </div>

                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--mg-brand)] mb-1">
                    {stepItem.actor}
                  </div>

                  <div
                    className="text-xs sm:text-sm font-bold text-[var(--mg-text)] leading-snug"
                    dangerouslySetInnerHTML={{ __html: stepItem.summary }}
                  />
                </div>

                <div className="pt-2 border-t border-[var(--mg-border)] text-[11px] text-[var(--mg-text-secondary)] leading-normal">
                  {stepItem.detail}
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Developer Secondary Progressive Disclosure ─── */}
        <div className="pt-4 border-t border-[var(--mg-border)]">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--mg-text-muted)]">
              FOR DEVELOPERS
            </span>
            <button
              onClick={() => setShowDevSpecs(!showDevSpecs)}
              className="text-xs font-mono font-bold text-[var(--mg-brand)] hover:underline cursor-pointer min-h-[36px] flex items-center"
            >
              {showDevSpecs ? "Hide technical architecture ↑" : "How it works underneath →"}
            </button>
          </div>

          {showDevSpecs && (
            <div className="mt-4 p-5 sm:p-7 rounded-2xl border border-[var(--mg-border)] bg-[var(--mg-surface)] shadow-lg space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DEV_SPECS.map((spec, i) => (
                  <button
                    key={spec.id}
                    onClick={() => setActiveDevTab(i)}
                    className={`p-2.5 rounded-xl border text-left font-mono transition-all cursor-pointer min-w-0 ${
                      activeDevTab === i
                        ? "border-[var(--mg-brand)] bg-[var(--mg-brand-soft)] text-[var(--mg-brand)] font-bold shadow-xs"
                        : "border-[var(--mg-border)] bg-[var(--mg-bg)] text-[var(--mg-text-muted)] hover:border-[var(--mg-border-strong)]"
                    }`}
                  >
                    <span className="text-[11px] block truncate">{spec.title}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-xs font-mono text-[var(--mg-text-secondary)]">
                  {DEV_SPECS[activeDevTab].desc}
                </p>
                <div className="p-4 rounded-xl bg-[var(--mg-bg)] border border-[var(--mg-border)] font-mono text-xs overflow-x-auto text-[var(--mg-text)] shadow-inner">
                  <pre className="m-0">
                    <code>{DEV_SPECS[activeDevTab].snippet}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
