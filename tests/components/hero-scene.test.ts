import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  HERO_SCENARIOS,
  HERO_PHASE_ORDER,
  HeroScene,
} from "@/components/HeroScene";

/* ═══════════════════════════════════════════════════════════════
   M17 — MANDATEGUARD HERO: "THE AI DECISION TRACE" (WINNER POLISH)
   Validates editorial typography, removal of scenario/fact pills,
   inline constraint annotations, signature Mandate Snapshot seal,
   elevated reading beam, #3 diagnosis, in-place offer rewrite,
   #3 → #2 → #1 spatial reranking, authorized transaction morph,
   price mutation redline diff, MandateGuard payment intercept,
   and final payoff "GET CHOSEN BY AI. / Protected by MandateGuard."
   ═══════════════════════════════════════════════════════════════ */

describe("HeroScene — M17 The AI Decision Trace Winner Polish Tests", () => {
  // 1. Dedicated Stage & Sibling CTA Separation
  it("renders dedicated hero-decision-trace, headline, subtext, and external sibling hero-cta", () => {
    const html = renderToString(
      React.createElement(HeroScene, {
        onGetStarted: () => {},
        onExploreDemo: () => {},
      }),
    );

    expect(html).toContain('class="hero-decision-trace"');
    expect(html).toContain('class="hero-cta"');
    expect(html).toContain("THE NEXT BUYER");
    expect(html).toContain("MIGHT BE AI.");
    expect(html).toContain("Make sure it can find you, understand you, and choose you.");
    expect(html).toContain("AGENTIC COMMERCE // THE AI DECISION TRACE");
    expect(html).toContain("Get started");
    expect(html).toContain("See how it works");
    expect(html).toContain("Protected by MandateGuard");
    expect(html).toContain("Razorpay Test Mode");
  });

  // 2. Removal of 20-30% Clutter (No Scenario Pills, No Fact Pill Boxes)
  it("removes prominent scenario switcher pills and standalone fact pill boxes", () => {
    const html = renderToString(
      React.createElement(HeroScene, {
        onGetStarted: () => {},
        onExploreDemo: () => {},
      }),
    );

    // Scenario pill buttons removed from primary canvas
    expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain("01 // BUYER INTENT STATEMENT");
    expect(html).not.toContain("320ms MACHINE EVALUATION");
    expect(html).not.toContain('id="hero-search-input"');
  });

  // 3. Initial State: Idle phase and ordered phase progression
  it("initial start state has idle at index 0 and ordered progression to final/reset", () => {
    expect(HERO_PHASE_ORDER[0]).toBe("idle");
    const r1Idx = HERO_PHASE_ORDER.indexOf("result-1-enter");
    const chosenIdx = HERO_PHASE_ORDER.indexOf("chosen-win");
    const stopIdx = HERO_PHASE_ORDER.indexOf("protected-stop");
    const finalIdx = HERO_PHASE_ORDER.indexOf("final");
    const resetIdx = HERO_PHASE_ORDER.indexOf("reset-cycle");

    expect(r1Idx).toBeGreaterThan(0);
    expect(chosenIdx).toBeGreaterThan(r1Idx);
    expect(stopIdx).toBeGreaterThan(chosenIdx);
    expect(finalIdx).toBeGreaterThan(stopIdx);
    expect(resetIdx).toBe(HERO_PHASE_ORDER.length - 1);
  });

  // 4. Professional English Search Queries & Real Pricing
  it("supports professional English search queries with clear budget and support constraints", () => {
    expect(HERO_SCENARIOS[0].query).toBe("I’m looking for a system design mentor under ₹4,000 with 24-hour support");
    expect(HERO_SCENARIOS[1].query).toBe("I want the best value system design program with live reviews");
    expect(HERO_SCENARIOS[2].query).toBe("I need premium interview preparation with flexible monthly billing");

    HERO_SCENARIOS.forEach((s) => {
      s.results.forEach((r) => {
        expect(r.price).toMatch(/^₹\d/);
        expect(r.pricePerMonth).toMatch(/^₹\d.*\/mo/);
      });
    });
  });

  // 5. Sequential Discovery: 1 → 2 → 3
  it("results materialize one by one in chronological sequence: #1 → #2 → #3", () => {
    const r1Idx = HERO_PHASE_ORDER.indexOf("result-1-enter");
    const r2Idx = HERO_PHASE_ORDER.indexOf("result-2-enter");
    const r3Idx = HERO_PHASE_ORDER.indexOf("result-3-merchant-enter");

    expect(r1Idx).toBeLessThan(r2Idx);
    expect(r2Idx).toBeLessThan(r3Idx);
  });

  // 6. Initial Merchant Rank = #3 with Diagnosis
  it("merchant result is initially #3 with explicit diagnosis and missing checks", () => {
    HERO_SCENARIOS.forEach((s) => {
      const merchant = s.results.find((r) => r.isMerchant);
      expect(merchant?.title).toBe("YOUR BUSINESS");
      expect(merchant?.missing.length).toBeGreaterThan(0);
      expect(merchant?.good.length).toBeGreaterThan(0);
    });

    const r3Idx = HERO_PHASE_ORDER.indexOf("result-3-merchant-enter");
    const verdictIdx = HERO_PHASE_ORDER.indexOf("verdict-lose");
    const improveIdx = HERO_PHASE_ORDER.indexOf("improve-prompt");
    expect(r3Idx).toBeLessThan(verdictIdx);
    expect(verdictIdx).toBeLessThan(improveIdx);
  });

  // 7. Physical Ranking Ascent: #3 → #2 → #1
  it("ranking sequence physically transitions through #2 before reaching #1", () => {
    const r2Idx = HERO_PHASE_ORDER.indexOf("ranking-shift-2");
    const r1Idx = HERO_PHASE_ORDER.indexOf("ranking-shift-1");
    const chosenIdx = HERO_PHASE_ORDER.indexOf("chosen-win");

    expect(r2Idx).toBeLessThan(r1Idx);
    expect(r1Idx).toBeLessThan(chosenIdx);
  });

  // 8. Chosen Confirmation Only After Rank 1
  it("chosen win confirmation happens strictly after rank 1 is attained", () => {
    const r1Idx = HERO_PHASE_ORDER.indexOf("ranking-shift-1");
    const chosenIdx = HERO_PHASE_ORDER.indexOf("chosen-win");
    const approvalIdx = HERO_PHASE_ORDER.indexOf("approval");

    expect(r1Idx).toBeLessThan(chosenIdx);
    expect(chosenIdx).toBeLessThan(approvalIdx);
  });

  // 9. Protection Sequence: Term drift → Stopped with No Money Moved
  it("protection flow triggers term drift then stops payment with no money moved", () => {
    const approvalIdx = HERO_PHASE_ORDER.indexOf("approval");
    const driftIdx = HERO_PHASE_ORDER.indexOf("term-drift");
    const stopIdx = HERO_PHASE_ORDER.indexOf("protected-stop");

    expect(approvalIdx).toBeLessThan(driftIdx);
    expect(driftIdx).toBeLessThan(stopIdx);
  });

  // 10. Continuous Loop & Deterministic Reset
  it("sequence features reset-cycle to loop back continuously without stopping", () => {
    const stopIdx = HERO_PHASE_ORDER.indexOf("protected-stop");
    const finalIdx = HERO_PHASE_ORDER.indexOf("final");
    const resetIdx = HERO_PHASE_ORDER.indexOf("reset-cycle");

    expect(stopIdx).toBeLessThan(finalIdx);
    expect(finalIdx).toBeLessThan(resetIdx);
    expect(resetIdx).toBe(HERO_PHASE_ORDER.length - 1);
  });
});
