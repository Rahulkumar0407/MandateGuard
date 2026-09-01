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
   Landing Page Continuous Product Film Tests (M11 Redesign)
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

    // M20 Hero
    expect(html).toContain("AI IS BECOMING");
    expect(html).toContain("THE NEXT SHIFT IN COMMERCE");

    // 01 — THE SHIFT
    expect(html).toContain("01 — THE SHIFT");
    expect(html).toContain("The web was built");

    // 02 — THE OFFER
    expect(html).toContain("02 — THE OFFER");
    expect(html).toContain("AI can&#x27;t choose");

    // 03 — THE MARKET
    expect(html).toContain("03 — THE MARKET");
    expect(html).toContain("When AI becomes");

    // 04 — THE INVESTIGATION
    expect(html).toContain("04 — THE INVESTIGATION");
    expect(html).toContain("You&#x27;re not losing");

    // 05 — THE FIX
    expect(html).toContain("05 — THE FIX");
    expect(html).toContain("Make the promise");

    // 06 — THE CHOICE
    expect(html).toContain("06 — THE CHOICE");
    expect(html).toContain("Now AI");

    // 07 & 08 — THE BARRIER
    expect(html).toContain("07 &amp; 08 — THE BARRIER");
    expect(html).toContain("Being chosen");

    // 09 — THE LOOP
    expect(html).toContain("09 — THE LOOP");
    expect(html).toContain("Intelligence from");

    // 10 — THE PROOF
    expect(html).toContain("10 — THE PROOF");
    expect(html).toContain("Every decision");

    // 11 — UNDER THE HOOD
    expect(html).toContain("11 — UNDER THE HOOD");
    expect(html).toContain("How MandateGuard connects");

    // FINAL CTA
    expect(html).toContain("THE NEW COMMERCE TRUST LAYER");
    expect(html).toContain("Become the business AI");
  });

  // 2. Scene 01: The Shift
  it("renders ShiftScene comparing old commerce vs agent commerce", () => {
    const html = renderToString(React.createElement(ShiftScene));
    expect(html).toContain("The web was built for");
    expect(html).toContain("people to browse.");
    expect(html).toContain("Commerce is being rebuilt");
    expect(html).toContain("agents to decide.");
    expect(html).toContain("AI BUYER AGENT");
  });

  // 3. Scene 02: The Offer
  it("renders OfferClarityMorph with commercial document decomposition", () => {
    const html = renderToString(React.createElement(OfferClarityMorph));
    expect(html).toContain("AI can&#x27;t choose");
    expect(html).toContain("what it can&#x27;t read.");
    expect(html).toContain("System Design Pro");
    expect(html).toContain("₹3,499");
    expect(html).toContain("Dedicated 1:1 Human Mentor");
  });

  // 4. Scene 03: The Market
  it("renders RankingExperience with ranking field and buyer intent", () => {
    const html = renderToString(React.createElement(RankingExperience));
    expect(html).toContain("When AI becomes");
    expect(html).toContain("the buyer,");
    expect(html).toContain("Buyer Hard Constraints");
    expect(html).toContain("≤ ₹4,000");
    expect(html).toContain("Your Business");
  });

  // 5. Scene 04: The Investigation
  it("renders BuyerInvestigation with claim annotations", () => {
    const html = renderToString(React.createElement(BuyerInvestigation));
    expect(html).toContain("You&#x27;re not losing");
    expect(html).toContain("because you&#x27;re bad");
    expect(html).toContain("VERIFIED");
    expect(html).toContain("UNVERIFIED");
    expect(html).toContain("AI just couldn&#x27;t verify");
  });

  // 6. Scene 05: The Transformation
  it("renders OfferFixExperience with explicit commitments and confidence uplift", () => {
    const html = renderToString(React.createElement(OfferFixExperience));
    expect(html).toContain("Make the promise");
    expect(html).toContain("explicit.");
    expect(html).toContain("SCORE: 62");
    expect(html).toContain("SCORE: 91");
    expect(html).toContain("Dedicated 1:1 Human Mentor");
  });

  // 7. Scene 06: The Choice
  it("renders SimulationField with buyer signals and match metric", () => {
    const html = renderToString(React.createElement(SimulationField));
    expect(html).toContain("Now AI");
    expect(html).toContain("CAN CHOOSE YOU");
    expect(html).toContain("BUYER MISSIONS MATCHED");
  });

  // 8. Scene 07 & 08: Authorization & The Barrier
  it("renders ProtectionExperience with terms mismatch and payment stopping", () => {
    const html = renderToString(React.createElement(ProtectionExperience));
    expect(html).toContain("Being chosen");
    expect(html).toContain("only half the job.");
    expect(html).toContain("If the terms change,");
    expect(html).toContain("MISMATCH DETECTED");
    expect(html).toContain("PAYMENT STOPPED");
    expect(html).toContain("Re-authorization required");
  });

  // 9. Scene 09: The Loop
  it("renders CommerceLoop with living system visualization", () => {
    const html = renderToString(React.createElement(CommerceLoop));
    expect(html).toContain("Intelligence from");
    expect(html).toContain("every transaction.");
    expect(html).toContain("Discover");
  });

  // 10. Scene 10: The Proof
  it("renders EvidenceStory with editorial number wall", () => {
    const html = renderToString(React.createElement(EvidenceStory));
    expect(html).toContain("Every decision");
    expect(html).toContain("accountable.");
    expect(html).toContain("100");
    expect(html).toContain("91.7");
    expect(html).toContain("COMMITMENT");
    expect(html).toContain("AUTHORIZATION");
  });

  // 11. Scene 11: Engineering (Under the Hood)
  it("renders EngineeringCrossSection with architecture flow and developer disclosure", () => {
    const html = renderToString(React.createElement(EngineeringCrossSection));
    expect(html).toContain("11 — UNDER THE HOOD");
    expect(html).toContain("How MandateGuard connects");
    expect(html).toContain("the decision to the payment.");
    expect(html).toContain("PARSED");
    expect(html).toContain("AUTHORIZED");
    expect(html).toContain("EXECUTED");
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
    expect(html).toContain("Become the business AI");
    expect(html).toContain("chooses.");
    expect(html).toContain("Get started");
    expect(html).toContain("See how it works");
  });
});
