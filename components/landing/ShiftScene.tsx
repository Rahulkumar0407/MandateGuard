"use client";

import React, { useRef, useState, useLayoutEffect } from "react";
import { gsap } from "@/lib/gsap";

export function ShiftScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useLayoutEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Gentle scroll-driven collapse
      gsap.to(".shift-human-card", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 60%",
          end: "bottom 50%",
          scrub: 0.6,
          onUpdate: (self) => {
            setIsCollapsed(self.progress > 0.4);
          },
        },
        opacity: 0.35,
        scale: 0.97,
        y: 10,
        stagger: 0.05,
      });

      gsap.fromTo(
        ".shift-agent-card",
        { opacity: 0.7, scale: 0.97 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
            end: "bottom 50%",
            scrub: 0.6,
          },
          opacity: 1,
          scale: 1,
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="the-shift"
      className="w-full max-w-6xl mx-auto px-5 sm:px-8 md:px-12 py-24 sm:py-32 flex flex-col justify-center items-center box-border"
    >
      {/* ─── Centered Editorial Statement (Level A Moment) ─── */}
      <div className="w-full max-w-3xl text-center mb-14 sm:mb-18">
        <span className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-[var(--mg-brand)] inline-block mb-6">
          01 / THE SHIFT
        </span>

        <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.045em] text-[var(--mg-text)] leading-[0.98] mb-3 [text-wrap:balance]">
          THE WEB WAS BUILT
          <br />
          <span className="text-[var(--mg-text-muted)]">FOR PEOPLE TO BROWSE.</span>
        </h2>

        <div className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.04em] text-[var(--mg-brand)] leading-[0.98] mb-6 [text-wrap:balance]">
          COMMERCE IS BEING REBUILT
          <br />
          FOR AGENTS TO DECIDE.
        </div>

        <p className="text-sm sm:text-base md:text-lg text-[var(--mg-text-secondary)] max-w-xl mx-auto leading-relaxed [text-wrap:balance]">
          AI is starting to choose between businesses. Instead of human browsing across tabs, machines evaluate structured facts and execute authorized purchases.
        </p>
      </div>

      {/* ─── Quiet Transformation Canvas ─── */}
      <div ref={containerRef} className="w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
          {/* Left: Human Fragmented Browsing */}
          <div
            style={{
              transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              opacity: isCollapsed ? 0.35 : 0.9,
            }}
            className="shift-human-card md:col-span-5 p-6 rounded-2xl border border-red-500/20 bg-red-500/[0.03] space-y-3 shadow-sm"
          >
            <div className="flex justify-between items-center text-[10px] font-mono font-bold text-red-500/90 uppercase tracking-widest pb-1 border-b border-red-500/15">
              <span>HUMAN COMMERCE (FRAGMENTED)</span>
              <span>10+ TABS</span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-[var(--mg-surface)] border border-[var(--mg-border)] flex justify-between items-center">
                <span className="text-[var(--mg-text-muted)]">Search</span>
                <span className="font-semibold text-[var(--mg-text)]">&ldquo;mentor under ₹4,000&rdquo;</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--mg-surface)] border border-[var(--mg-border)] flex justify-between items-center">
                <span className="text-[var(--mg-text-muted)]">Tabs</span>
                <span className="font-semibold text-[var(--mg-text)]">10 Open Pages</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--mg-surface)] border border-[var(--mg-border)] flex justify-between items-center">
                <span className="text-[var(--mg-text-muted)]">Reviews</span>
                <span className="font-semibold text-[var(--mg-text)]">4.8★ (142 reviews)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--mg-surface)] border border-[var(--mg-border)] flex justify-between items-center">
                <span className="text-[var(--mg-text-muted)]">Pricing</span>
                <span className="font-semibold text-amber-500">₹4,200/mo + GST</span>
              </div>
            </div>
          </div>

          {/* Middle: Subtle State Toggle / Transition Bridge */}
          <div className="md:col-span-2 flex flex-col items-center justify-center py-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-xs font-mono font-bold text-[var(--mg-brand)] hover:text-[var(--mg-brand-hover)] px-3 py-1.5 rounded-lg border border-[var(--mg-brand-line)] bg-[var(--mg-brand-soft)] transition-all cursor-pointer"
            >
              {isCollapsed ? "↺ Expand" : "➔ Collapse"}
            </button>
          </div>

          {/* Right: Agent Structured Choice */}
          <div
            style={{
              transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            className="shift-agent-card md:col-span-5 p-6 rounded-2xl border border-[var(--mg-brand-line)] bg-[var(--mg-brand-soft)] space-y-3 shadow-md"
          >
            <div className="flex justify-between items-center text-[10px] font-mono font-bold text-[var(--mg-brand)] uppercase tracking-widest pb-1 border-b border-[var(--mg-brand-line)]">
              <span>AGENT COMMERCE (DETERMINISTIC)</span>
              <span className="text-[var(--mg-success)] font-black">AUTONOMOUS</span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-[var(--mg-surface)] border border-[var(--mg-border)] flex justify-between items-center">
                <span className="font-bold text-[var(--mg-brand)]">INTENT</span>
                <span className="text-[var(--mg-text)] font-semibold">₹4,000 max · 1:1 mentor</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--mg-surface)] border border-[var(--mg-border)] flex justify-between items-center">
                <span className="font-bold text-[var(--mg-text)]">FACTS</span>
                <span className="text-[var(--mg-success)] font-semibold">100% Machine-Verifiable</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--mg-surface)] border border-[var(--mg-border)] flex justify-between items-center">
                <span className="font-bold text-[var(--mg-success)]">CHOICE</span>
                <span className="text-[var(--mg-text)] font-semibold">System Design Pro (#1)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--mg-surface)] border border-[var(--mg-border)] flex justify-between items-center">
                <span className="font-bold text-[var(--mg-success)]">AUTHORIZATION</span>
                <span className="font-black text-[var(--mg-success)]">CRYPTO SNAPSHOT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
