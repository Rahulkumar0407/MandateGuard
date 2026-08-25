import { describe, it, expect } from "vitest";
import { evaluateDeterministicCompatibility } from "@/lib/compatibility/engine";
import type { EnvelopeTarget, ProposedOfferInput } from "@/lib/compatibility/types";
import type { StructuredCommitments } from "@/lib/merchant/structured-commitments";

function baseCommitments(): StructuredCommitments {
  return {
    support: {
      tier: "dedicated_mentor",
      slaHours: 24,
      oneOnOneSessionsPerMonth: 4,
      hasDedicatedHuman: true,
    },
    entitlements: {
      keys: ["sysdesign_core", "sysdesign_mocks", "mentor_feedback_weekly"],
      criticalKeys: ["mentor_feedback_weekly"],
    },
    usageLimits: {
      apiRequestsPerMonth: 10000,
      concurrentSeats: 1,
      computeCredits: 500,
    },
    delivery: {
      type: "continuous_saas",
      commitmentSLA: "Weekly 1:1 sessions",
    },
    refundPolicy: {
      windowDays: 30,
      type: "conditional",
    },
  };
}

function sampleEnvelope(): EnvelopeTarget {
  return {
    id: "env_test_123",
    userId: "u_alice",
    merchantId: "m_forge",
    subscriptionId: "sub_123",
    mandateId: "man_123",
    authorizedOfferVersionId: "o_sysdesign_v1",
    authorizedOfferHash: "h".repeat(64),
    baselineCommitments: {
      offerName: "System Design Mastery v1",
      description: "Mentorship system design program",
      price: 349900,
      currency: "INR",
      billingInterval: "monthly",
      duration: 180,
      refundWindowDays: 30,
      supportTerms: "1:1 mentor with 24h SLA",
      semanticTerms: "Weekly video review",
      structuredCommitments: baseCommitments(),
    },
    financialConstraints: {
      maxPricePaise: 400000, // ₹4,000 ceiling
      allowedCurrencies: ["INR"],
      maxPriceIncreasePercent: 15,
      allowedBillingIntervals: ["monthly"],
    },
    agentPermissions: {
      canAutoApproveMinorChanges: true,
      canAutoPauseOnBreach: true,
      canApproveRefundRequest: false,
      canMigrateToNewVersion: false,
    },
    tolerancePolicy: {
      priceIncreasePercentTolerance: 5,
      allowedTierDowngrades: [],
      allowedRemovedEntitlements: [],
      refundWindowReductionDaysTolerance: 7,
    },
    authorizationPolicyHash: "p".repeat(64),
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: null,
  };
}

function sampleProposed(overrides: Partial<ProposedOfferInput> = {}): ProposedOfferInput {
  return {
    productId: "p_sysdesign",
    version: 2,
    name: "System Design Mastery v2",
    description: "Mentorship system design program",
    price: 349900,
    currency: "INR",
    billingInterval: "monthly",
    duration: 180,
    entitlementKeys: ["sysdesign_core", "sysdesign_mocks", "mentor_feedback_weekly"],
    refundWindowDays: 30,
    supportTerms: "1:1 mentor with 24h SLA",
    semanticTerms: "Weekly video review",
    structuredCommitments: baseCommitments(),
    versionHash: "h2".repeat(32),
    ...overrides,
  };
}

describe("M9 Phase 3: Deterministic Compatibility Evaluation Engine", () => {
  describe("1. Identical / Compatible Offers", () => {
    it("returns COMPATIBLE when proposed offer matches authorized baseline exactly", () => {
      const envelope = sampleEnvelope();
      const proposed = sampleProposed();

      const result = evaluateDeterministicCompatibility({ envelope, proposed });

      expect(result.status).toBe("COMPATIBLE");
      expect(result.findings.some((f) => f.severity === "CRITICAL")).toBe(false);
      expect(result.findings.some((f) => f.severity === "WARNING")).toBe(false);
    });
  });

  describe("2. Financial Constraints & Tolerances", () => {
    it("returns COMPATIBLE when price increase is within tolerance (+3% with 5% tolerance)", () => {
      const envelope = sampleEnvelope();
      // ₹3499 -> ₹3603 (+2.97%)
      const proposed = sampleProposed({ price: 360300 });

      const result = evaluateDeterministicCompatibility({ envelope, proposed });

      expect(result.status).toBe("COMPATIBLE");
      const priceFinding = result.findings.find((f) => f.dimension === "FINANCIAL");
      expect(priceFinding?.code).toBe("PRICE_WITHIN_TOLERANCE");
      expect(priceFinding?.isPermittedByTolerance).toBe(true);
    });

    it("returns REVIEW when price increase exceeds tolerance (+8% with 5% tolerance)", () => {
      const envelope = sampleEnvelope();
      // ₹3499 -> ₹3778 (+7.97%)
      const proposed = sampleProposed({ price: 377800 });

      const result = evaluateDeterministicCompatibility({ envelope, proposed });

      expect(result.status).toBe("REVIEW");
      const priceFinding = result.findings.find((f) => f.dimension === "FINANCIAL");
      expect(priceFinding?.code).toBe("PRICE_INCREASE_EXCEEDS_TOLERANCE");
      expect(priceFinding?.severity).toBe("WARNING");
    });

    it("returns BREAKING when price exceeds ceiling maxPricePaise (₹4500 with ₹4000 ceiling)", () => {
      const envelope = sampleEnvelope();
      const proposed = sampleProposed({ price: 450000 });

      const result = evaluateDeterministicCompatibility({ envelope, proposed });

      expect(result.status).toBe("BREAKING");
      const priceFinding = result.findings.find((f) => f.code === "PRICE_CEILING_BREACH");
      expect(priceFinding?.severity).toBe("CRITICAL");
    });

    it("returns BREAKING when price increase exceeds max allowed percentage (+18% with 15% max)", () => {
      const envelope = sampleEnvelope();
      // ₹3499 -> ₹4128 (+18%)
      const proposed = sampleProposed({ price: 412882 });

      const result = evaluateDeterministicCompatibility({ envelope, proposed });

      expect(result.status).toBe("BREAKING");
      const finding = result.findings.find((f) => f.code === "PRICE_CEILING_BREACH" || f.code === "PRICE_INCREASE_EXCEEDS_MAX_ALLOWED");
      expect(finding?.severity).toBe("CRITICAL");
    });

    it("returns BREAKING when currency is not in allowed currencies", () => {
      const envelope = sampleEnvelope();
      const proposed = sampleProposed({ currency: "USD" });

      const result = evaluateDeterministicCompatibility({ envelope, proposed });

      expect(result.status).toBe("BREAKING");
      const currencyFinding = result.findings.find((f) => f.code === "CURRENCY_NOT_ALLOWED");
      expect(currencyFinding?.severity).toBe("CRITICAL");
    });

    it("returns BREAKING when billing interval is not in allowed intervals", () => {
      const envelope = sampleEnvelope();
      const proposed = sampleProposed({ billingInterval: "yearly" });

      const result = evaluateDeterministicCompatibility({ envelope, proposed });

      expect(result.status).toBe("BREAKING");
      const intervalFinding = result.findings.find((f) => f.code === "BILLING_INTERVAL_NOT_ALLOWED");
      expect(intervalFinding?.severity).toBe("CRITICAL");
    });
  });

  describe("3. Entitlements Evaluation", () => {
    it("returns BREAKING when critical entitlement is removed without tolerance permission", () => {
      const envelope = sampleEnvelope();
      const proposedCommitments = baseCommitments();
      proposedCommitments.entitlements.keys = ["sysdesign_core", "sysdesign_mocks"]; // removed mentor_feedback_weekly

      const proposed = sampleProposed({
        entitlementKeys: ["sysdesign_core", "sysdesign_mocks"],
        structuredCommitments: proposedCommitments,
      });

      const result = evaluateDeterministicCompatibility({ envelope, proposed });

      expect(result.status).toBe("BREAKING");
      const entFinding = result.findings.find((f) => f.code === "CRITICAL_ENTITLEMENT_REMOVED");
      expect(entFinding?.severity).toBe("CRITICAL");
    });

    it("returns COMPATIBLE when critical entitlement removal is explicitly permitted by tolerance", () => {
      const envelope = sampleEnvelope();
      envelope.tolerancePolicy.allowedRemovedEntitlements = ["mentor_feedback_weekly"];

      const proposedCommitments = baseCommitments();
      proposedCommitments.entitlements.keys = ["sysdesign_core", "sysdesign_mocks"];

      const proposed = sampleProposed({
        entitlementKeys: ["sysdesign_core", "sysdesign_mocks"],
        structuredCommitments: proposedCommitments,
      });

      const result = evaluateDeterministicCompatibility({ envelope, proposed });

      expect(result.status).toBe("COMPATIBLE");
      const entFinding = result.findings.find((f) => f.code === "PERMITTED_ENTITLEMENT_REMOVAL");
      expect(entFinding?.isPermittedByTolerance).toBe(true);
    });

    it("returns REVIEW when non-critical entitlement is removed without tolerance", () => {
      const envelope = sampleEnvelope();
      const proposedCommitments = baseCommitments();
      proposedCommitments.entitlements.keys = ["sysdesign_core", "mentor_feedback_weekly"]; // removed sysdesign_mocks

      const proposed = sampleProposed({
        entitlementKeys: ["sysdesign_core", "mentor_feedback_weekly"],
        structuredCommitments: proposedCommitments,
      });

      const result = evaluateDeterministicCompatibility({ envelope, proposed });

      expect(result.status).toBe("REVIEW");
      const entFinding = result.findings.find((f) => f.code === "NON_CRITICAL_ENTITLEMENT_REMOVED");
      expect(entFinding?.severity).toBe("WARNING");
    });
  });

  describe("4. Support Commitments Evaluation", () => {
    it("returns BREAKING when dedicated human is lost (dedicated_mentor -> community)", () => {
      const envelope = sampleEnvelope();
      const proposedCommitments = baseCommitments();
      proposedCommitments.support.tier = "community";
      proposedCommitments.support.hasDedicatedHuman = false;
      proposedCommitments.support.oneOnOneSessionsPerMonth = 0;

      const proposed = sampleProposed({ structuredCommitments: proposedCommitments });

      const result = evaluateDeterministicCompatibility({ envelope, proposed });

      expect(result.status).toBe("BREAKING");
      const humanFinding = result.findings.find((f) => f.code === "DEDICATED_HUMAN_LOST");
      expect(humanFinding?.severity).toBe("CRITICAL");
    });

    it("returns COMPATIBLE when support tier downgrade is explicitly permitted by tolerance", () => {
      const envelope = sampleEnvelope();
      envelope.tolerancePolicy.allowedTierDowngrades = ["priority_email"];

      const proposedCommitments = baseCommitments();
      proposedCommitments.support.tier = "priority_email";

      const proposed = sampleProposed({ structuredCommitments: proposedCommitments });

      const result = evaluateDeterministicCompatibility({ envelope, proposed });

      expect(result.status).toBe("COMPATIBLE");
      const tierFinding = result.findings.find((f) => f.code === "PERMITTED_TIER_DOWNGRADE");
      expect(tierFinding?.isPermittedByTolerance).toBe(true);
    });

    it("returns BREAKING when 1:1 sessions are reduced (4 -> 1)", () => {
      const envelope = sampleEnvelope();
      const proposedCommitments = baseCommitments();
      proposedCommitments.support.oneOnOneSessionsPerMonth = 1;

      const proposed = sampleProposed({ structuredCommitments: proposedCommitments });

      const result = evaluateDeterministicCompatibility({ envelope, proposed });

      expect(result.status).toBe("BREAKING");
      const sessFinding = result.findings.find((f) => f.code === "SESSIONS_REDUCED");
      expect(sessFinding?.severity).toBe("CRITICAL");
    });

    it("returns REVIEW when SLA hours degrade (24h -> 72h)", () => {
      const envelope = sampleEnvelope();
      const proposedCommitments = baseCommitments();
      proposedCommitments.support.slaHours = 72;

      const proposed = sampleProposed({ structuredCommitments: proposedCommitments });

      const result = evaluateDeterministicCompatibility({ envelope, proposed });

      expect(result.status).toBe("REVIEW");
      const slaFinding = result.findings.find((f) => f.code === "SLA_HOURS_DEGRADED");
      expect(slaFinding?.severity).toBe("WARNING");
    });
  });

  describe("5. Usage Limits & Refund Policy Evaluation", () => {
    it("returns BREAKING when concurrent seats are reduced (1 -> 0)", () => {
      const envelope = sampleEnvelope();
      const proposedCommitments = baseCommitments();
      proposedCommitments.usageLimits.concurrentSeats = 0;

      const proposed = sampleProposed({ structuredCommitments: proposedCommitments });

      const result = evaluateDeterministicCompatibility({ envelope, proposed });

      expect(result.status).toBe("BREAKING");
      const seatFinding = result.findings.find((f) => f.code === "SEATS_REDUCED");
      expect(seatFinding?.severity).toBe("CRITICAL");
    });

    it("returns COMPATIBLE when refund window is reduced within tolerance (30 -> 25 with 7 day tolerance)", () => {
      const envelope = sampleEnvelope();
      const proposedCommitments = baseCommitments();
      proposedCommitments.refundPolicy.windowDays = 25;

      const proposed = sampleProposed({
        refundWindowDays: 25,
        structuredCommitments: proposedCommitments,
      });

      const result = evaluateDeterministicCompatibility({ envelope, proposed });

      expect(result.status).toBe("COMPATIBLE");
      const refundFinding = result.findings.find((f) => f.code === "PERMITTED_REFUND_REDUCTION");
      expect(refundFinding?.isPermittedByTolerance).toBe(true);
    });

    it("returns REVIEW when refund window reduction exceeds tolerance (30 -> 10 with 7 day tolerance)", () => {
      const envelope = sampleEnvelope();
      const proposedCommitments = baseCommitments();
      proposedCommitments.refundPolicy.windowDays = 10;

      const proposed = sampleProposed({
        refundWindowDays: 10,
        structuredCommitments: proposedCommitments,
      });

      const result = evaluateDeterministicCompatibility({ envelope, proposed });

      expect(result.status).toBe("REVIEW");
      const refundFinding = result.findings.find((f) => f.code === "REFUND_WINDOW_REDUCED");
      expect(refundFinding?.severity).toBe("WARNING");
    });

    it("returns BREAKING when refund policy changes to non-refundable", () => {
      const envelope = sampleEnvelope();
      const proposedCommitments = baseCommitments();
      proposedCommitments.refundPolicy.type = "non_refundable";

      const proposed = sampleProposed({ structuredCommitments: proposedCommitments });

      const result = evaluateDeterministicCompatibility({ envelope, proposed });

      expect(result.status).toBe("BREAKING");
      const refundFinding = result.findings.find((f) => f.code === "REFUND_TYPE_DEGRADED");
      expect(refundFinding?.severity).toBe("CRITICAL");
    });
  });

  describe("6. Decision Priority Hierarchy (BREAKING > REVIEW > COMPATIBLE)", () => {
    it("assigns BREAKING when both BREAKING and REVIEW findings are present", () => {
      const envelope = sampleEnvelope();
      // Price is in review band (+8%), but critical entitlement is also removed (breaking)
      const proposedCommitments = baseCommitments();
      proposedCommitments.entitlements.keys = ["sysdesign_core", "sysdesign_mocks"]; // critical removed

      const proposed = sampleProposed({
        price: 377800, // +8% (review)
        entitlementKeys: ["sysdesign_core", "sysdesign_mocks"],
        structuredCommitments: proposedCommitments,
      });

      const result = evaluateDeterministicCompatibility({ envelope, proposed });

      expect(result.status).toBe("BREAKING");
      expect(result.summary).toContain("BREAKING:");
    });
  });
});
