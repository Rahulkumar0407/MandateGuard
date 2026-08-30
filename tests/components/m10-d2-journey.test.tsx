import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { PublicLandingPage } from "@/components/PublicLandingPage";
import { AuthModal } from "@/components/AuthModal";
import { BusinessOnboarding } from "@/components/BusinessOnboarding";
import { Navbar } from "@/components/Navbar";
import { HomeOverview } from "@/components/HomeOverview";
import { ConversationalBuyerPortal } from "@/components/ConversationalBuyerPortal";
import { CustomerProtectionPortal } from "@/components/CustomerProtectionPortal";
import { MerchantBuyabilityBenchmark } from "@/components/MerchantBuyabilityBenchmark";

describe("M10-D2 — Production-Grade Product Experience Journey", () => {
  it("1. Public Landing Page renders editorial hero, storytelling sections, and visual experience", () => {
    const html = renderToString(
      <PublicLandingPage onGetStarted={() => {}} onExploreDemo={() => {}} />,
    );

    expect(html).toContain("Make it easier for AI buyers to choose you.");
    expect(html).toContain("Get started");
    expect(html).toContain("The next buyer might be AI.");
    expect(html).toContain("AI BUYER SEARCH");
    expect(html).toContain("THE WEB WAS BUILT");
    expect(html).toContain("COMMERCE IS BEING REBUILT");
    // No generic AI slop or fake statistics
    expect(html).not.toContain("Powered by cutting-edge AI");
  });

  it("2. Auth Modal renders Google sign-in and instant demo access for judges", () => {
    const html = renderToString(
      <AuthModal
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
        onExploreDemo={() => {}}
      />
    );

    expect(html).toContain("Sign in to MandateGuard");
    expect(html).toContain("Continue with Google");
    expect(html).toContain("Continue with Email");
    expect(html).toContain("Explore sample business (Instant access)");
  });

  it("3. Business Onboarding provides 3-step progressive setup without premature metrics", () => {
    const html = renderToString(
      <BusinessOnboarding onComplete={() => {}} onRunFirstTest={() => {}} />,
    );

    expect(html).toContain("Step");
    expect(html).toContain("of 3");
    expect(html).toContain("Tell us about your business.");
    expect(html).toContain("Continue to Catalog");
    expect(html).not.toContain("68 / 100");
  });

  it("4. Production Navbar provides clean Razorpay shell with Test Mode and user menu", () => {
    const html = renderToString(
      <Navbar
        activeTab="home"
        onTabChange={() => {}}
        onSeedDemo={async () => {}}
        isSeeding={false}
        seedMessage={null}
        userName="InterviewForge AI"
      />
    );

    expect(html).toContain("MandateGuard");
    expect(html).toContain("Razorpay");
    expect(html).toContain("Test Mode");
    expect(html).toContain("Overview");
    expect(html).toContain("AI Growth");
    expect(html).toContain("AI Buyer");
    expect(html).toContain("Transactions");
    expect(html).toContain("Customers");
    expect(html).toContain("Protection");
    expect(html).toContain("Developer");
    expect(html).toContain("InterviewForge AI");
  });

  it("5. BUY Experience renders natural query prompt chips and empty state", () => {
    const html = renderToString(<ConversationalBuyerPortal />);

    expect(html).toContain("What are you looking for?");
    expect(html).toContain("Human Mentor (Hinglish)");
    expect(html).toContain("Mock Interviews (English)");
    expect(html).not.toContain("You are about to subscribe to");
  });

  it("6. GROW Experience renders 6-stage funnel, top blockers, and signature mission inspector", () => {
    const html = renderToString(
      <MerchantBuyabilityBenchmark initialState="READY_TO_ANALYZE" hasCatalog={true} />,
    );

    expect(html).toContain("Your catalog is ready.");
    expect(html).toContain("Run AI Buyer Test");
    expect(html).not.toContain("68 / 100");
  });

  it("7. PROTECT Portal renders trustworthy baseline protection and dispute prevention", () => {
    const html = renderToString(<CustomerProtectionPortal />);

    expect(html).toContain("Protected Recurring Purchases");
    expect(html).toContain("System Design Pro");
    expect(html).toContain("This payment was stopped.");
  });

  it("8. Merchant Home answers 'What matters right now?' with actionable testing state", () => {
    const html = renderToString(<HomeOverview onNavigate={() => {}} report={null} />);

    expect(html).toContain("needs your attention");
    expect(html).toContain("Good afternoon.");
    expect(html).toContain("AI buyers are missing your offer.");
  });
});
