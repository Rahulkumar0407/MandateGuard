import { describe, it, expect, beforeEach } from "vitest";
import {
  ConversationalBuyerService,
  setConversationalBuyerService,
} from "@/lib/agent/conversational-buyer";
import { InMemoryMerchantOfferRepository } from "@/lib/merchant/repository";
import { MerchantOfferService } from "@/lib/merchant/service";
import type { MerchantOfferData } from "@/lib/merchant/types";

const TS = new Date("2026-01-01T00:00:00.000Z");

describe("M10-B5 — Conversational AI Buyer Service", () => {
  let data: MerchantOfferData;
  let repo: InMemoryMerchantOfferRepository;
  let merchantService: MerchantOfferService;
  let service: ConversationalBuyerService;

  beforeEach(() => {
    data = {
      merchants: [
        {
          id: "m_1",
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
          id: "p_1",
          merchantId: "m_1",
          name: "System Design Mastery",
          slug: "system-design-mastery",
          description: "System design comprehensive prep",
          category: "system_design",
          active: true,
          createdAt: TS,
          updatedAt: TS,
        },
      ],
      offers: [
        {
          id: "o_mentor",
          productId: "p_1",
          version: 1,
          name: "System Design Pro (Mentor)",
          description: "Full course with dedicated 1:1 human mentor and mock sessions",
          price: 349900,
          currency: "INR",
          billingInterval: "monthly",
          duration: 180,
          entitlementKeys: ["system_design_curriculum", "human_mentor", "mock_interviews"],
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
              keys: ["system_design_curriculum", "human_mentor", "mock_interviews"],
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
        {
          id: "o_community",
          productId: "p_1",
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
      ],
    };

    repo = new InMemoryMerchantOfferRepository(data);
    merchantService = new MerchantOfferService(repo);
    service = new ConversationalBuyerService(undefined, undefined, merchantService);
    setConversationalBuyerService(service);
  });

  it("handles natural language Hinglish query '4k ke andar human mentor chahiye'", async () => {
    const res = await service.processMessage("4k ke andar human mentor chahiye");

    expect(res.intent.category).toBe("interview_prep");
    expect(res.intent.budget?.amountPaise).toBe(400000);
    expect(res.intent.mustHave).toContain("human_mentor");
    expect(res.recommendation).not.toBeNull();
    expect(res.recommendation?.eligible).toBe(true);
    expect(res.recommendation?.recommendedOffer?.id).toBe("o_mentor");
    expect(res.message).toContain("System Design Pro (Mentor)");
    expect(res.suggestedActions).toContain("Review & Authorize");
  });


  it("handles natural language English query for mock interviews and SLA", async () => {
    const res = await service.processMessage(
      "I need a system design plan with dedicated human mentor under ₹5,000/month",
    );

    expect(res.intent.category).toBe("system_design");
    expect(res.intent.mustHave).toContain("human_mentor");
    expect(res.recommendation?.eligible).toBe(true);
    expect(res.recommendation?.recommendedOffer?.name).toBe("System Design Pro (Mentor)");
    expect(res.message).toContain("Why this plan");
  });

  it("triggers conversational clarification when query is ambiguous or empty", async () => {
    const res = await service.processMessage("prep chahiye");

    expect(res.clarification).not.toBeNull();
    expect(res.clarification?.options.length).toBeGreaterThan(0);
    expect(res.recommendation).toBeNull();
  });

  it("provides helpful refusal message when budget is too low to satisfy hard constraints", async () => {
    const res = await service.processMessage(
      "Human mentor system design course under ₹500/month strictly",
    );

    expect(res.recommendation?.eligible).toBe(false);
    expect(res.message).toContain("couldn't find a verified offer");
    expect(res.suggestedActions).toContain("Increase Budget");
  });
});
