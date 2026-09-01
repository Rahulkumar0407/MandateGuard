import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { MerchantBuyabilityBenchmark } from "@/components/MerchantBuyabilityBenchmark";
import { HomeOverview } from "@/components/HomeOverview";
import { ConversationalBuyerPortal } from "@/components/ConversationalBuyerPortal";
import type { AIBuyabilityReport } from "@/lib/merchant-intelligence/buyability-types";

const mockReport: AIBuyabilityReport = {
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

describe("M10-D1.1 — Product Onboarding & Analysis States", () => {
  it("1. new merchant sees onboarding, no score", () => {
    const html = renderToString(
      <MerchantBuyabilityBenchmark hasCatalog={false} initialState="NOT_CONFIGURED" />,
    );

    expect(html).toContain("Make your business ready for AI buyers");
    expect(html).toContain("Analyze my business");
    expect(html).toContain("Connect Catalog");
    expect(html).toContain("Test with AI buyers");
    expect(html).toContain("See What to Improve");
    // Must NOT contain hard-coded score / 100
    expect(html).not.toContain("68 / 100");
    expect(html).not.toContain("42 / 100");
    expect(html).not.toContain("6-Stage AI Buyability Funnel");
  });

  it("2. catalog-ready merchant sees run-analysis CTA without premature metrics", () => {
    const html = renderToString(
      <MerchantBuyabilityBenchmark hasCatalog={true} initialState="READY_TO_ANALYZE" />,
    );

    expect(html).toContain("Your catalog is ready.");
    expect(html).toContain("Run AI Buyer Test");
    expect(html).toContain("100 representative buyer missions");
    expect(html).not.toContain("68 / 100");
    expect(html).not.toContain("42 / 100");
    expect(html).not.toContain("6-Stage AI Buyability Funnel");
  });

  it("3. analysis state renders calm progress without fake metrics", () => {
    const html = renderToString(
      <MerchantBuyabilityBenchmark hasCatalog={true} initialState="ANALYZING" />,
    );

    expect(html).toContain("Analyzing your offers");
    expect(html).toContain("Discoverability &amp; catalog retrieval");
    expect(html).toContain("Understanding &amp; structured entitlements");
    expect(html).toContain("Comparison &amp; mentor / SLA commitments");
    expect(html).toContain("Fit &amp; semantic trade-off resolution");
    expect(html).toContain("Transaction readiness &amp; spending limit checks");
    expect(html).not.toContain("68 / 100");
    expect(html).not.toContain("42 / 100");
  });

  it("4. analyzed merchant sees actual server metrics", () => {
    const html = renderToString(
      <HomeOverview onNavigate={() => {}} report={mockReport} />,
    );

    // Shows actual server score from mockReport (41)
    expect(html).toContain("41");
    expect(html).toContain("/ 100");
    expect(html).toContain("How AI rates you");
    expect(html).toContain("Ready to buy");
    expect(html).toContain("Human mentor support unstated");
  });

  it("5. stale analysis prompts re-run", () => {
    const html = renderToString(
      <MerchantBuyabilityBenchmark hasCatalog={true} initialState="STALE" />,
    );

    expect(html).toContain("Your last test is out of date.");
    expect(html).toContain("Your offers changed since the last test.");
    expect(html).toContain("Run again");
  });

  it("6. buyer empty state shows no recommendation", () => {
    const html = renderToString(<ConversationalBuyerPortal />);

    expect(html).toContain("What are you looking for?");
    expect(html).toContain("Ask naturally in English or Hinglish");
    expect(html).toContain("Human Mentor (Hinglish)");
    expect(html).toContain("Mock Interviews (English)");
    // Must not show review purchase or purchase confirmation initially
    expect(html).not.toContain("Review Purchase");
    expect(html).not.toContain("You are about to subscribe to");
  });

  it("7. HomeOverview without analysis renders onboarding CTA, no fake score", () => {
    const html = renderToString(
      <HomeOverview onNavigate={() => {}} report={null} />,
    );

    expect(html).toContain("needs your attention");
    expect(html).toContain("Run AI Buyer Test →");
    expect(html).toContain("See where you rank");
    // Must NOT contain hard-coded fake score patterns
    expect(html).not.toContain("68 / 100");
    expect(html).not.toContain("42 / 100");
    expect(html).not.toContain("31 / 100");
  });

  it("8. no hard-coded benchmark values used as live data in unanalyzed state", () => {
    const benchmarkHtml = renderToString(
      <MerchantBuyabilityBenchmark hasCatalog={true} initialState="READY_TO_ANALYZE" />,
    );
    const homeHtml = renderToString(
      <HomeOverview onNavigate={() => {}} report={null} />,
    );

    expect(benchmarkHtml).not.toContain("68 / 100");
    expect(benchmarkHtml).not.toContain("89 / 100");
    expect(benchmarkHtml).not.toContain("76 / 100");
    expect(benchmarkHtml).not.toContain("61 / 100");
    expect(benchmarkHtml).not.toContain("50 / 100");

    expect(homeHtml).not.toContain("68 / 100");
    expect(homeHtml).not.toContain("42 / 100");
  });
});
