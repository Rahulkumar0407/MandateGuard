import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryMerchantOfferRepository } from "@/lib/merchant/repository";
import { MerchantOfferService } from "@/lib/merchant/service";
import { normalizeBuyerIntent } from "@/lib/intent";
import { BuyerOfferRankingEngine } from "@/lib/retrieval";
import type { MerchantOfferData } from "@/lib/merchant/types";

const TS = new Date("2026-01-01T00:00:00.000Z");

describe("M10-B3 — Buyer Catalog Retrieval & Ranking Engine", () => {
  let data: MerchantOfferData;
  let repo: InMemoryMerchantOfferRepository;
  let service: MerchantOfferService;
  let engine: BuyerOfferRankingEngine;

  beforeEach(() => {
    data = {
      merchants: [
        {
          id: "m_test_1",
          name: "InterviewForge",
          slug: "interviewforge",
          description: "Premier tech interview prep",
          status: "ACTIVE",
          createdAt: TS,
          updatedAt: TS,
        },
      ],
      products: [
        {
          id: "p_sysdesign",
          merchantId: "m_test_1",
          name: "System Design Mastery",
          slug: "system-design-mastery",
          description: "Comprehensive system design prep",
          category: "system_design",
          active: true,
          createdAt: TS,
          updatedAt: TS,
        },
      ],
      offers: [
        // Offer 1: Standard Mentor Plan (₹3,499/mo, Confirmed, Active)
        {
          id: "o_sysdesign_mentor",
          productId: "p_sysdesign",
          version: 1,
          name: "System Design Pro (Mentor)",
          description: "Full course with dedicated 1:1 mentor and mock interviews",
          price: 349900,
          currency: "INR",
          billingInterval: "monthly",
          duration: 180,
          entitlementKeys: ["system_design_curriculum", "mock_interviews", "human_mentor"],
          refundWindowDays: 30,
          supportTerms: "Dedicated human mentor assigned with weekly reviews",
          semanticTerms: "1:1 sessions and 24h SLA",
          isConfirmedByMerchant: true,
          versionHash: "hash_mentor_v1",
          active: true,
          createdAt: TS,
          updatedAt: TS,
          structuredCommitments: {
            support: {
              tier: "dedicated_mentor",
              slaHours: 24,
              oneOnOneSessionsPerMonth: 4,
              hasDedicatedHuman: true,
            },
            entitlements: {
              keys: ["system_design_curriculum", "mock_interviews", "human_mentor"],
              criticalKeys: ["human_mentor"],
            },
            usageLimits: {
              apiRequestsPerMonth: 10000,
              concurrentSeats: 1,
              computeCredits: 500,
            },
            delivery: {
              type: "continuous_saas",
              commitmentSLA: "24h Turnaround",
            },
            refundPolicy: {
              windowDays: 30,
              type: "conditional",
            },
          },
        },
        // Offer 2: Community Tier (₹1,999/mo, Confirmed, Active, Discord only)
        {
          id: "o_sysdesign_community",
          productId: "p_sysdesign",
          version: 1,
          name: "System Design Self-Paced (Community)",
          description: "Self-paced lessons with Discord peer community",
          price: 199900,
          currency: "INR",
          billingInterval: "monthly",
          duration: 180,
          entitlementKeys: ["system_design_curriculum"],
          refundWindowDays: 14,
          supportTerms: "Community Discord only",
          semanticTerms: "Peer support",
          isConfirmedByMerchant: true,
          versionHash: "hash_community_v1",
          active: true,
          createdAt: TS,
          updatedAt: TS,
          structuredCommitments: {
            support: {
              tier: "community",
              slaHours: 72,
              oneOnOneSessionsPerMonth: 0,
              hasDedicatedHuman: false,
            },
            entitlements: {
              keys: ["system_design_curriculum"],
              criticalKeys: [],
            },
            usageLimits: {
              apiRequestsPerMonth: 5000,
              concurrentSeats: 1,
              computeCredits: 100,
            },
            delivery: {
              type: "continuous_saas",
              commitmentSLA: "Community SLA",
            },
            refundPolicy: {
              windowDays: 14,
              type: "conditional",
            },
          },
        },
        // Offer 3: Executive Tier (₹5,999/mo, Confirmed, Active)
        {
          id: "o_sysdesign_exec",
          productId: "p_sysdesign",
          version: 1,
          name: "System Design Executive",
          description: "Executive 1:1 coaching with industry staff engineers",
          price: 599900,
          currency: "INR",
          billingInterval: "monthly",
          duration: 180,
          entitlementKeys: ["system_design_curriculum", "mock_interviews", "human_mentor", "placement_support"],
          refundWindowDays: 30,
          supportTerms: "Direct staff engineer mentorship",
          semanticTerms: "Daily access and 6h SLA",
          isConfirmedByMerchant: true,
          versionHash: "hash_exec_v1",
          active: true,
          createdAt: TS,
          updatedAt: TS,
          structuredCommitments: {
            support: {
              tier: "dedicated_mentor",
              slaHours: 6,
              oneOnOneSessionsPerMonth: 8,
              hasDedicatedHuman: true,
            },
            entitlements: {
              keys: ["system_design_curriculum", "mock_interviews", "human_mentor", "placement_support"],
              criticalKeys: ["human_mentor"],
            },
            usageLimits: {
              apiRequestsPerMonth: 50000,
              concurrentSeats: 1,
              computeCredits: 2000,
            },
            delivery: {
              type: "continuous_saas",
              commitmentSLA: "6h Turnaround",
            },
            refundPolicy: {
              windowDays: 30,
              type: "conditional",
            },
          },
        },
        // Offer 4: Unconfirmed Draft (₹3,000/mo, isConfirmedByMerchant: false -> MUST BE EXCLUDED)
        {
          id: "o_sysdesign_draft",
          productId: "p_sysdesign",
          version: 2,
          name: "System Design Draft",
          description: "Unconfirmed draft",
          price: 300000,
          currency: "INR",
          billingInterval: "monthly",
          duration: 180,
          entitlementKeys: ["system_design_curriculum"],
          refundWindowDays: 30,
          supportTerms: "Draft terms",
          semanticTerms: "Draft",
          isConfirmedByMerchant: false,
          versionHash: null,
          active: true,
          createdAt: TS,
          updatedAt: TS,
        },
      ],
    };

    repo = new InMemoryMerchantOfferRepository(data);
    service = new MerchantOfferService(repo);
    engine = new BuyerOfferRankingEngine(service);
  });

  it("retrieves and ranks the optimal offer within hard budget constraints", async () => {
    const intent = normalizeBuyerIntent({
      category: "system_design",
      budget: {
        amountPaise: 400000, // ₹4,000 HARD cap
        currency: "INR",
        type: "HARD",
      },
      billing: { cadence: "monthly", isRecurring: true },
      mustHave: ["human_mentor"],
      niceToHave: ["mock_interviews"],
      supportPreference: {
        hasDedicatedHuman: true,
      },
    });

    const result = await engine.rankOffers(intent);

    expect(result.eligible).toBe(true);
    expect(result.recommendedOffer?.id).toBe("o_sysdesign_mentor"); // ₹3,499 mentor plan
    expect(result.score).toBeGreaterThan(80);
    expect(result.rankedOffers.length).toBe(1); // Only Offer 1 passes (Offer 2 has no human mentor, Offer 3 is > ₹4,000)
    expect(result.rationale).toContain("System Design Pro (Mentor)");
  });

  it("rejects candidate offers that violate hard budget ceilings deterministically", async () => {
    const intent = normalizeBuyerIntent({
      category: "system_design",
      budget: {
        amountPaise: 300000, // ₹3,000 HARD cap (excludes ₹3,499 and ₹5,999)
        currency: "INR",
        type: "HARD",
      },
      billing: { cadence: "monthly", isRecurring: true },
      mustHave: ["system_design_curriculum"],
    });

    const result = await engine.rankOffers(intent);

    expect(result.eligible).toBe(true);
    expect(result.recommendedOffer?.id).toBe("o_sysdesign_community"); // ₹1,999 is within ₹3,000
    expect(result.recommendedOffer?.price).toBe(199900);
  });

  it("allows soft budget stretch candidates when permitted by intent", async () => {
    const intent = normalizeBuyerIntent({
      category: "system_design",
      budget: {
        amountPaise: 300000, // ₹3,000 target
        currency: "INR",
        type: "SOFT",
        stretchPercentage: 20, // max stretch = ₹3,600 -> allows ₹3,499
      },
      billing: { cadence: "monthly", isRecurring: true },
      mustHave: ["human_mentor"],
      qualityPreference: {
        level: "premium",
        prioritizeQualityOverPrice: true,
      },
    });

    const result = await engine.rankOffers(intent);

    expect(result.eligible).toBe(true);
    expect(result.recommendedOffer?.id).toBe("o_sysdesign_mentor"); // ₹3,499 fits in stretch bound
  });

  it("enforces refusal to recommend when no candidate satisfies hard constraints", async () => {
    const intent = normalizeBuyerIntent({
      category: "system_design",
      budget: {
        amountPaise: 100000, // ₹1,000 HARD cap (No plan exists under ₹1,000)
        currency: "INR",
        type: "HARD",
      },
      billing: { cadence: "monthly", isRecurring: true },
      mustHave: ["human_mentor"],
    });

    const result = await engine.rankOffers(intent);

    expect(result.eligible).toBe(false);
    expect(result.recommendedOffer).toBeNull();
    expect(result.refusalReason).toBeDefined();
    expect(result.refusalReason).toContain("satisfied all hard constraints");
  });

  it("excludes unconfirmed draft offers from buyer discovery", async () => {
    const intent = normalizeBuyerIntent({
      category: "system_design",
      billing: { cadence: "monthly", isRecurring: true },
      mustHave: ["system_design_curriculum"],
    });

    const result = await engine.rankOffers(intent);

    // Draft offer 'o_sysdesign_draft' (isConfirmedByMerchant: false) must not appear
    const offerIds = result.rankedOffers.map((r) => r.offer.id);
    expect(offerIds).not.toContain("o_sysdesign_draft");
  });

  it("generates comparative trade-off explanations for alternative offers", async () => {
    const intent = normalizeBuyerIntent({
      category: "system_design",
      budget: {
        amountPaise: 1000000, // ₹10,000 budget -> allows all confirmed plans
        currency: "INR",
        type: "HARD",
      },
      billing: { cadence: "monthly", isRecurring: true },
      mustHave: ["system_design_curriculum"],
      niceToHave: ["mock_interviews"],
    });

    const result = await engine.rankOffers(intent);

    expect(result.eligible).toBe(true);
    expect(result.rankedOffers.length).toBeGreaterThan(1);
    expect(result.alternatives.length).toBeGreaterThan(0);
    expect(result.alternatives[0].comparisonWithTopOffer).toBeDefined();
  });
});
