import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  serializeSession,
  parseSessionCookie,
  resolveSession,
  type SessionData,
} from "@/lib/auth/session";
import {
  setMerchantOfferRepository,
  InMemoryMerchantOfferRepository,
} from "@/lib/merchant/service";
import type { MerchantOfferData } from "@/lib/merchant/types";
import type { StructuredCommitments } from "@/lib/merchant/structured-commitments";

function commitments(): StructuredCommitments {
  return {
    support: {
      tier: "dedicated_mentor",
      slaHours: 24,
      oneOnOneSessionsPerMonth: 4,
      hasDedicatedHuman: true,
    },
    entitlements: { keys: ["a"], criticalKeys: ["a"] },
    usageLimits: { apiRequestsPerMonth: 1, concurrentSeats: 1, computeCredits: 1 },
    delivery: { type: "continuous_saas", commitmentSLA: "Weekly 1:1 sessions" },
    refundPolicy: { windowDays: 30, type: "conditional" },
  };
}

function buildData(hasOffers: boolean): MerchantOfferData {
  return {
    merchants: [
      {
        id: "m_forge",
        name: "InterviewForge",
        slug: "if",
        description: "Prep",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    products: [
      {
        id: "p1",
        merchantId: "m_forge",
        name: "SysDesign",
        slug: "sd",
        description: "d",
        category: "coaching",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    offers: hasOffers
      ? [
          {
            id: "o1",
            productId: "p1",
            version: 1,
            name: "Pro",
            description: "d",
            price: 349900,
            currency: "INR",
            billingInterval: "monthly",
            duration: 1,
            entitlementKeys: ["a"],
            refundWindowDays: 30,
            supportTerms: "s",
            semanticTerms: "t",
            structuredCommitments: commitments(),
            isConfirmedByMerchant: true,
            versionHash: "h",
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
      : [],
  };
}

function cookie(over: Partial<SessionData> = {}): string {
  return serializeSession({
    merchantId: "m_forge",
    name: "A Merchant",
    email: "merchant@example.com",
    isSample: false,
    onboardingComplete: false,
    ...over,
  });
}

beforeEach(() => setMerchantOfferRepository(new InMemoryMerchantOfferRepository(buildData(true))));
afterEach(() => setMerchantOfferRepository(null));

describe("M10-D2.1 auth session resolution", () => {
  it("1. unauthenticated user yields no merchant", async () => {
    const r = await resolveSession(undefined);
    expect(r.authenticated).toBe(false);
    expect(r.merchant).toBeNull();
  });

  it("2. authenticated user resolves the correct merchant server-side", async () => {
    const r = await resolveSession(cookie());
    expect(r.authenticated).toBe(true);
    expect(r.merchant?.id).toBe("m_forge");
    expect(r.session?.email).toBe("merchant@example.com");
  });

  it("3. new merchant (no catalog) is NOT_CONFIGURED", async () => {
    setMerchantOfferRepository(new InMemoryMerchantOfferRepository(buildData(false)));
    const r = await resolveSession(cookie());
    expect(r.offersCount).toBe(0);
    expect(r.analysisState).toBe("NOT_CONFIGURED");
  });

  it("4. catalog-ready merchant is READY_TO_ANALYZE", async () => {
    const r = await resolveSession(cookie());
    expect(r.offersCount).toBeGreaterThan(0);
    expect(r.analysisState).toBe("READY_TO_ANALYZE");
  });

  it("5. no fake metrics are exposed before analysis", async () => {
    const r = await resolveSession(cookie());
    // Entry state is a workflow state, never a precomputed score.
    expect(r.analysisState).toBe("READY_TO_ANALYZE");
    expect(("ratePercent" in r) || ("score" in r)).toBe(false);
  });

  it("6. a tampered cookie cannot make the dashboard read another merchant", async () => {
    // Browser sends a malicious merchantId; the server must ignore it.
    const evil = serializeSession({
      merchantId: "evil_attacker",
      name: "Hacker",
      email: "h@x.io",
      isSample: false,
      onboardingComplete: false,
    });
    const r = await resolveSession(evil);
    expect(r.merchant?.id).toBe("m_forge");
    expect(r.merchant?.id).not.toBe("evil_attacker");
  });

  it("7. sample business is clearly flagged and separated", async () => {
    const r = await resolveSession(cookie({ isSample: true, onboardingComplete: true }));
    expect(r.session?.isSample).toBe(true);
  });

  it("8. completing onboarding is persisted in the session", async () => {
    const r = await resolveSession(cookie({ onboardingComplete: true }));
    expect(r.session?.onboardingComplete).toBe(true);
  });

  it("parse/serialize round-trips and rejects garbage", () => {
    const c = cookie();
    expect(parseSessionCookie(c)?.email).toBe("merchant@example.com");
    expect(parseSessionCookie(undefined)).toBeNull();
    expect(parseSessionCookie("not-valid-base64!!!")).toBeNull();
  });
});
