import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { PublicLandingPage } from "@/components/PublicLandingPage";
import { ShiftScene } from "@/components/landing/ShiftScene";
import { OfferClarityMorph } from "@/components/landing/OfferClarityMorph";
import { RankingExperience } from "@/components/landing/RankingExperience";
import { BuyerInvestigation } from "@/components/landing/BuyerInvestigation";
import { OfferFixExperience } from "@/components/landing/OfferFixExperience";
import { SimulationField } from "@/components/landing/SimulationField";
import { ProtectionExperience } from "@/components/landing/ProtectionExperience";
import { CommerceLoop } from "@/components/landing/CommerceLoop";
import { EvidenceStory } from "@/components/landing/EvidenceStory";
import { EngineeringCrossSection } from "@/components/landing/EngineeringCrossSection";
import { FinalCTA } from "@/components/landing/FinalCTA";

/* ═══════════════════════════════════════════════════════════════
   Landing Page Continuous Product Film Tests (Calm Editorial Hierarchy)
   ═══════════════════════════════════════════════════════════════ */

describe("Landing Page Continuous Product Film Experiences", () => {
  // 1. Full Landing Page Integration
  it("renders PublicLandingPage with locked HeroScene and all 11 product film scenes", () => {
    const html = renderToString(
      React.createElement(PublicLandingPage, {
        onGetStarted: () => {},
        onExploreDemo: () => {},
      }),
    );

    // Locked Hero
    expect(html).toContain('class="hero-animation-stage"');
    expect(html).toContain("The next buyer might be AI.");
    expect(html).toContain("AI BUYER SEARCH");

    // 01 / THE SHIFT
    expect(html).toContain("01 / THE SHIFT");
    expect(html).toContain("THE WEB WAS BUILT");
    expect(html).toContain("COMMERCE IS BEING REBUILT");

    // 02 / THE OFFER
    expect(html).toContain("02 / THE OFFER");
    expect(html).toContain("AI can&#x27;t choose");
    expect(html).toContain("what it can&#x27;t understand.");

    // 03 / THE MARKET
    expect(html).toContain("03 / THE MARKET");
    expect(html).toContain("When AI becomes the buyer,");
    expect(html).toContain("ranking becomes the storefront.");

    // 04 / THE INVESTIGATION
    expect(html).toContain("04 / THE INVESTIGATION");
    expect(html).toContain("YOU&#x27;RE NOT LOSING");
    expect(html).toContain("VERIFY THE PROMISE.");

    // 05 / THE TRANSFORMATION
    expect(html).toContain("05 / THE TRANSFORMATION");
    expect(html).toContain("Make the promise");
    expect(html).toContain("explicit.");

    // 06 / THE CHOICE
    expect(html).toContain("06 / THE CHOICE");
    expect(html).toContain("NOW AI");
    expect(html).toContain("CAN CHOOSE YOU.");

    // 07 & 08 — AUTHORIZATION & THE BARRIER
    expect(html).toContain("07 &amp; 08 — AUTHORIZATION &amp; THE BARRIER");
    expect(html).toContain("BEING CHOSEN");
    expect(html).toContain("IF THE TERMS CHANGE,");

    // 09 / THE LOOP
    expect(html).toContain("09 / THE LOOP");
    expect(html).toContain("Transactions create");
    expect(html).toContain("intelligence.");

    // 10 / THE PROOF
    expect(html).toContain("10 / THE PROOF");
    expect(html).toContain("MAKE AI");
    expect(html).toContain("A BETTER BUYER.");

    // 11 / UNDER THE HOOD
    expect(html).toContain("11 / UNDER THE HOOD");
    expect(html).toContain("HOW MANDATEGUARD");
    expect(html).toContain("CONNECTS THE DECISION");

    // FINAL CTA
    expect(html).toContain("THE NEW COMMERCE TRUST LAYER");
    expect(html).toContain("BECOME THE");
    expect(html).toContain("BUSINESS AI");
    expect(html).toContain("CHOOSES.");
  });

  // 2. Scene 01: The Shift
  it("renders ShiftScene comparing old commerce vs agent commerce", () => {
    const html = renderToString(React.createElement(ShiftScene));
    expect(html).toContain("THE WEB WAS BUILT");
    expect(html).toContain("FOR PEOPLE TO BROWSE.");
    expect(html).toContain("COMMERCE IS BEING REBUILT");
    expect(html).toContain("HUMAN COMMERCE (FRAGMENTED)");
    expect(html).toContain("AGENT COMMERCE (DETERMINISTIC)");
  });

  // 3. Scene 02: The Offer
  it("renders OfferClarityMorph with commercial document decomposition", () => {
    const html = renderToString(React.createElement(OfferClarityMorph));
    expect(html).toContain("AI can&#x27;t choose");
    expect(html).toContain("SYSTEM DESIGN PRO");
    expect(html).toContain("₹3,499");
    expect(html).toContain("HUMAN MENTOR");
    expect(html).toContain("8 SESSIONS");
    expect(html).toContain("24H RESPONSE");
    expect(html).toContain("CANCEL ANYTIME");
  });

  // 4. Scene 03: The Market
  it("renders RankingExperience with ranking field and buyer intent", () => {
    const html = renderToString(React.createElement(RankingExperience));
    expect(html).toContain("When AI becomes the buyer,");
    expect(html).toContain("ranking becomes the storefront.");
    expect(html).toContain("BUYER HARD CONSTRAINTS");
    expect(html).toContain("UNDER ₹4,000");
    expect(html).toContain("YOUR BUSINESS");
  });

  // 5. Scene 04: The Investigation
  it("renders BuyerInvestigation with claim annotations", () => {
    const html = renderToString(React.createElement(BuyerInvestigation));
    expect(html).toContain("YOU&#x27;RE NOT LOSING");
    expect(html).toContain("YOUR BUSINESS (InterviewForge)");
    expect(html).toContain("✓ Price: ₹3,999/month");
    expect(html).toContain("? UNVERIFIED (FORMAT UNSTATED)");
    expect(html).toContain("? UNVERIFIED (NO 24H SLA PROOF)");
  });

  // 6. Scene 05: The Transformation
  it("renders OfferFixExperience with explicit commitments and confidence uplift", () => {
    const html = renderToString(React.createElement(OfferFixExperience));
    expect(html).toContain("Make the promise");
    expect(html).toContain("explicit.");
    expect(html).toContain("AI MATCH CONFIDENCE");
    expect(html).toContain("DEDICATED 1:1 HUMAN MENTOR");
    expect(html).toContain("GUARANTEED 24H RESPONSE SLA");
  });

  // 7. Scene 06: The Choice
  it("renders SimulationField with ranking moving to #1 and AI CHOSEN", () => {
    const html = renderToString(React.createElement(SimulationField));
    expect(html).toContain("NOW AI");
    expect(html).toContain("CAN CHOOSE YOU.");
    expect(html).toContain("YOUR BUSINESS (InterviewForge)");
    expect(html).toContain("RANK #1 · ✓ AI CHOSEN");
  });

  // 8. Scene 07 & 08: Authorization & The Barrier
  it("renders ProtectionExperience with terms mismatch and payment stopping", () => {
    const html = renderToString(React.createElement(ProtectionExperience));
    expect(html).toContain("BEING CHOSEN");
    expect(html).toContain("IF THE TERMS CHANGE,");
    expect(html).toContain("MISMATCH DETECTED");
    expect(html).toContain("PAYMENT STOPPED · NO MONEY MOVED.");
    expect(html).toContain("REAUTHORIZATION REQUIRED");
  });

  // 9. Scene 09: The Loop
  it("renders CommerceLoop with radial demand signals", () => {
    const html = renderToString(React.createElement(CommerceLoop));
    expect(html).toContain("Transactions create");
    expect(html).toContain("intelligence.");
    expect(html).toContain("01 / DISCOVER");
    expect(html).toContain("02 / UNDERSTAND");
    expect(html).toContain("03 / CHOOSE");
    expect(html).toContain("04 / AUTHORIZE");
    expect(html).toContain("05 / PROTECT");
    expect(html).toContain("06 / LEARN");
    expect(html).toContain("07 / IMPROVE");
  });

  // 10. Scene 10: The Proof
  it("renders EvidenceStory with minimalist evidence wall", () => {
    const html = renderToString(React.createElement(EvidenceStory));
    expect(html).toContain("MAKE AI");
    expect(html).toContain("A BETTER BUYER.");
    expect(html).toContain("01 · MACHINE-READABLE OFFER");
    expect(html).toContain("02 · VERIFIED COMMITMENTS");
    expect(html).toContain("03 · BUYER INTENT");
  });

  // 11. Scene 11: Engineering (Under the Hood)
  it("renders EngineeringCrossSection with 5-step human flow and developer disclosure", () => {
    const html = renderToString(React.createElement(EngineeringCrossSection));
    expect(html).toContain("11 / UNDER THE HOOD");
    expect(html).toContain("HOW MANDATEGUARD");
    expect(html).toContain("CONNECTS THE DECISION");
    expect(html).toContain("TO THE PAYMENT.");
    expect(html).toContain("STEP 01");
    expect(html).toContain("STEP 05");
    expect(html).toContain("FOR DEVELOPERS");
  });

  // 12. Final CTA
  it("renders FinalCTA with clean CTA action buttons", () => {
    const html = renderToString(
      React.createElement(FinalCTA, {
        onGetStarted: () => {},
        onExploreDemo: () => {},
      }),
    );
    expect(html).toContain("BECOME THE");
    expect(html).toContain("BUSINESS AI");
    expect(html).toContain("CHOOSES.");
    expect(html).toContain("Get started →");
    expect(html).toContain("See how it works");
    expect(html).toContain("Protected by MandateGuard");
  });
});
