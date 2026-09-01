import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { PublicLandingPage } from "@/components/PublicLandingPage";
import { AuthModal } from "@/components/AuthModal";
import { BusinessOnboarding } from "@/components/BusinessOnboarding";
import { HomeOverview } from "@/components/HomeOverview";
import { MerchantBuyabilityBenchmark } from "@/components/MerchantBuyabilityBenchmark";
import type { AIBuyabilityReport } from "@/lib/merchant-intelligence/buyability-types";

const mockAnalyzedReport: AIBuyabilityReport = {
  merchantId: "m_test_123",
  merchantName: "InterviewForge AI",
  benchmarkId: "buyability_gold_cohort_v1",
  benchmarkVersion: "1.0.0",
  datasetHash: "mock_hash_123",
  totalMissions: 100,
  funnel: {
    discovered: { count: 88, ratePercent: 88, measured: true, status: "MEASURED" },
    understood: { count: 75, ratePercent: 75, measured: true, status: "MEASURED" },
    comparable: { count: 60, ratePercent: 60, measured: true, status: "MEASURED" },
    shortlisted: { count: 49, ratePercent: 49, measured: true, status: "MEASURED" },
    recommended: { count: 41, ratePercent: 41, measured: true, status: "MEASURED" },
    transactionReady: { count: 30, ratePercent: 30, measured: true, status: "MEASURED" },
  },
  failureDistribution: [
    {
      category: "SUPPORT_AMBIGUITY",
      reason: "Support SLA not machine readable",
      affectedMissionCount: 27,
      percentageOfFails: 45,
      sampleQueries: ["4k ke andar human mentor chahiye"],
    },
  ],
  topFailures: [
    {
      merchantId: "m_test_123",
      title: "Human mentor support unstated",
      diagnosis: "27 missions dropped during comparability",
      issueType: "SUPPORT",
      severity: "CRITICAL",
      confidence: "HIGH",
      recommendedAction: "Add explicit 24h SLA",
      evidence: [
        {
          id: "ev_1",
          source: "BUYER_DEMAND",
          category: "COMPARABILITY",
          fact: "27 missions failed due to unstated mentor support",
        },
      ],
    },
  ],
  missionResults: [
    {
      missionId: "m_1",
      rawQuery: "4k ke andar human mentor chahiye",
      language: "hinglish",
      category: "interview_prep",
      evaluation: {
        discovered: true,
        understandable: true,
        comparable: true,
        shortlisted: true,
        recommended: true,
        evidence: [],
      },
      status: "PASSED",
    },
  ],
  generatedAt: new Date().toISOString(),
};

describe("M10-D2.1 — Production Entry Experience (Landing → Auth → Onboarding → First Dashboard)", () => {
  it("1. unauthenticated entry renders landing page without leaking private dashboards", () => {
    const html = renderToString(
      <PublicLandingPage onGetStarted={() => {}} onExploreDemo={() => {}} />,
    );

    expect(html).toContain("Make your offer clear enough to be chosen");
    expect(html).toContain("Get started");
    expect(html).toContain("See how it works");
    expect(html).not.toContain("68 / 100");
    expect(html).not.toContain("COMMAND CENTER");
  });

  it("2. auth screen renders editorial split surface with Google and Email methods", () => {
    const html = renderToString(
      <AuthModal
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
        onExploreDemo={() => {}}
      />,
    );

    expect(html).toContain("Sign in to MandateGuard");
    expect(html).toContain("Continue with Google");
    expect(html).toContain("Continue with Email");
    expect(html).toContain("Explore sample business (Instant access)");
    expect(html).toContain("Make your business ready for AI buyers.");
  });

  it("3. business onboarding step 1 collects basic identity without fake scores", () => {
    const html = renderToString(
      <BusinessOnboarding onComplete={() => {}} onRunFirstTest={() => {}} />,
    );

    expect(html).toContain("Tell us about your business.");
    expect(html).toContain("Business Name");
    expect(html).toContain("Primary Category");
    expect(html).toContain("Continue to Catalog →");
    expect(html).not.toContain("68 / 100");
  });

  it("4. new merchant in NOT_CONFIGURED state sees guidance and zero premature scores", () => {
    const html = renderToString(
      <MerchantBuyabilityBenchmark hasCatalog={false} initialState="NOT_CONFIGURED" />,
    );

    expect(html).toContain("Make your business ready for AI buyers");
    expect(html).toContain("Connect Catalog");
    expect(html).toContain("Test with AI buyers");
    expect(html).toContain("See What to Improve");
    expect(html).not.toContain("68 / 100");
    expect(html).not.toContain("42 / 100");
  });

  it("5. catalog-ready merchant sees test prompt without fake metrics", () => {
    const html = renderToString(
      <MerchantBuyabilityBenchmark hasCatalog={true} initialState="READY_TO_ANALYZE" />,
    );

    expect(html).toContain("Your catalog is ready.");
    expect(html).toContain("Run AI Buyer Test");
    expect(html).toContain("100 representative buyer missions");
    expect(html).not.toContain("68 / 100");
  });

  it("6. analyzing state communicates real progress stages without fake percentages", () => {
    const html = renderToString(
      <MerchantBuyabilityBenchmark hasCatalog={true} initialState="ANALYZING" />,
    );

    expect(html).toContain("Analyzing your offers");
    expect(html).toContain("Discoverability &amp; catalog retrieval");
    expect(html).toContain("Understanding &amp; structured entitlements");
    expect(html).toContain("Comparison &amp; mentor / SLA commitments");
    expect(html).toContain("Fit &amp; semantic trade-off resolution");
    expect(html).toContain("Transaction readiness &amp; spending limit checks");
    expect(html).not.toContain("99%");
    expect(html).not.toContain("68 / 100");
  });

  it("7. first dashboard unanalyzed renders clean command center ready to test", () => {
    const html = renderToString(<HomeOverview onNavigate={() => {}} report={null} />);

    expect(html).toContain("needs your attention");
    expect(html).toContain("Run AI Buyer Test →");
    expect(html).toContain("See where you rank");
    expect(html).not.toContain("41 / 100");
  });

  it("8. first dashboard analyzed renders real server score and strongest insight", () => {
    const html = renderToString(
      <HomeOverview onNavigate={() => {}} report={mockAnalyzedReport} />,
    );

    expect(html).toContain("needs your attention");
    expect(html).toContain("41");
    expect(html).toContain("/ 100");
    expect(html).toContain("How AI rates you");
    expect(html).toContain("Ready to buy");
    expect(html).toContain("Human mentor support unstated");
    expect(html).toContain("Improve this offer →");
  });

  it("9. stale analysis prompts re-evaluation without data loss", () => {
    const html = renderToString(
      <MerchantBuyabilityBenchmark hasCatalog={true} initialState="STALE" />,
    );

    expect(html).toContain("Your last test is out of date.");
    expect(html).toContain("Your offers changed since the last test.");
    expect(html).toContain("Run again →");
  });
});
