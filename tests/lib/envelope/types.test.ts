import { describe, it, expect } from "vitest";
import {
  FinancialConstraintsSchema,
  AgentPermissionsSchema,
  TolerancePolicySchema,
  BaselineCommitmentsSchema,
  computeAuthorizationPolicyHash,
  type FinancialConstraints,
  type AgentPermissions,
  type TolerancePolicy,
  type BaselineCommitments,
} from "@/lib/envelope/types";
import type { StructuredCommitments } from "@/lib/merchant/structured-commitments";

function sampleCommitments(): StructuredCommitments {
  return {
    support: {
      tier: "dedicated_mentor",
      slaHours: 24,
      oneOnOneSessionsPerMonth: 4,
      hasDedicatedHuman: true,
    },
    entitlements: {
      keys: ["sysdesign_core", "sysdesign_mocks"],
      criticalKeys: ["sysdesign_core"],
    },
    usageLimits: {
      apiRequestsPerMonth: 1000,
      concurrentSeats: 1,
      computeCredits: 100,
    },
    delivery: {
      type: "continuous_saas",
      commitmentSLA: "Weekly",
    },
    refundPolicy: {
      windowDays: 30,
      type: "conditional",
    },
  };
}

describe("M9 Phase 2: Authorization Envelope Types & Validation", () => {
  describe("1. Financial Constraints Validation", () => {
    it("accepts valid financial constraints", () => {
      const valid: FinancialConstraints = {
        maxPricePaise: 399900,
        allowedCurrencies: ["INR"],
        maxPriceIncreasePercent: 5,
        allowedBillingIntervals: ["monthly"],
      };
      const res = FinancialConstraintsSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("rejects negative maxPricePaise", () => {
      const invalid = {
        maxPricePaise: -100,
        allowedCurrencies: ["INR"],
        maxPriceIncreasePercent: 5,
        allowedBillingIntervals: ["monthly"],
      };
      const res = FinancialConstraintsSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });

    it("rejects empty allowedCurrencies array", () => {
      const invalid = {
        maxPricePaise: 10000,
        allowedCurrencies: [],
        maxPriceIncreasePercent: 5,
        allowedBillingIntervals: ["monthly"],
      };
      const res = FinancialConstraintsSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("2. Agent Permissions Validation", () => {
    it("accepts valid agent permissions", () => {
      const valid: AgentPermissions = {
        canAutoApproveMinorChanges: true,
        canAutoPauseOnBreach: true,
        canApproveRefundRequest: false,
        canMigrateToNewVersion: false,
      };
      const res = AgentPermissionsSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("rejects non-boolean permission flags", () => {
      const invalid = {
        canAutoApproveMinorChanges: "yes",
        canAutoPauseOnBreach: true,
        canApproveRefundRequest: false,
        canMigrateToNewVersion: false,
      };
      const res = AgentPermissionsSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("3. Tolerance Policy Validation", () => {
    it("accepts valid tolerance policy", () => {
      const valid: TolerancePolicy = {
        priceIncreasePercentTolerance: 5,
        allowedTierDowngrades: ["priority_email"],
        allowedRemovedEntitlements: ["extra_mock"],
        refundWindowReductionDaysTolerance: 0,
      };
      const res = TolerancePolicySchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("rejects negative price increase tolerance", () => {
      const invalid = {
        priceIncreasePercentTolerance: -2,
        allowedTierDowngrades: [],
        allowedRemovedEntitlements: [],
        refundWindowReductionDaysTolerance: 0,
      };
      const res = TolerancePolicySchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("4. Baseline Commitments Validation", () => {
    it("accepts valid baseline commitments", () => {
      const valid: BaselineCommitments = {
        offerName: "System Design Pro",
        description: "Course with mentor",
        price: 399900,
        currency: "INR",
        billingInterval: "monthly",
        duration: 180,
        refundWindowDays: 30,
        supportTerms: "Weekly 1:1",
        semanticTerms: "Weekly sessions",
        structuredCommitments: sampleCommitments(),
      };
      const res = BaselineCommitmentsSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });
  });

  describe("5. Deterministic Policy Hashing (authorizationPolicyHash)", () => {
    it("generates deterministic SHA-256 fingerprint regardless of field ordering in inputs", () => {
      const financialA: FinancialConstraints = {
        maxPricePaise: 399900,
        allowedCurrencies: ["inr", "USD"],
        maxPriceIncreasePercent: 5,
        allowedBillingIntervals: ["MONTHLY", "yearly"],
      };

      const financialB: FinancialConstraints = {
        maxPricePaise: 399900,
        allowedCurrencies: ["USD", "INR"],
        maxPriceIncreasePercent: 5,
        allowedBillingIntervals: ["yearly", "monthly"],
      };

      const permissions: AgentPermissions = {
        canAutoApproveMinorChanges: true,
        canAutoPauseOnBreach: true,
        canApproveRefundRequest: false,
        canMigrateToNewVersion: false,
      };

      const toleranceA: TolerancePolicy = {
        priceIncreasePercentTolerance: 5,
        allowedTierDowngrades: ["standard_email", "priority_email"],
        allowedRemovedEntitlements: ["extra_mock", "bonus_notes"],
        refundWindowReductionDaysTolerance: 0,
      };

      const toleranceB: TolerancePolicy = {
        priceIncreasePercentTolerance: 5,
        allowedTierDowngrades: ["priority_email", "standard_email"],
        allowedRemovedEntitlements: ["bonus_notes", "extra_mock"],
        refundWindowReductionDaysTolerance: 0,
      };

      const hashA = computeAuthorizationPolicyHash({
        financialConstraints: financialA,
        agentPermissions: permissions,
        tolerancePolicy: toleranceA,
      });

      const hashB = computeAuthorizationPolicyHash({
        financialConstraints: financialB,
        agentPermissions: permissions,
        tolerancePolicy: toleranceB,
      });

      expect(hashA).toHaveLength(64);
      expect(hashA).toBe(hashB);
    });

    it("changes hash when financial constraints change", () => {
      const financial: FinancialConstraints = {
        maxPricePaise: 399900,
        allowedCurrencies: ["INR"],
        maxPriceIncreasePercent: 5,
        allowedBillingIntervals: ["monthly"],
      };

      const permissions: AgentPermissions = {
        canAutoApproveMinorChanges: true,
        canAutoPauseOnBreach: true,
        canApproveRefundRequest: false,
        canMigrateToNewVersion: false,
      };

      const tolerance: TolerancePolicy = {
        priceIncreasePercentTolerance: 5,
        allowedTierDowngrades: [],
        allowedRemovedEntitlements: [],
        refundWindowReductionDaysTolerance: 0,
      };

      const baseHash = computeAuthorizationPolicyHash({
        financialConstraints: financial,
        agentPermissions: permissions,
        tolerancePolicy: tolerance,
      });

      const alteredHash = computeAuthorizationPolicyHash({
        financialConstraints: { ...financial, maxPricePaise: 450000 },
        agentPermissions: permissions,
        tolerancePolicy: tolerance,
      });

      expect(alteredHash).not.toBe(baseHash);
    });

    it("changes hash when agent permissions change", () => {
      const financial: FinancialConstraints = {
        maxPricePaise: 399900,
        allowedCurrencies: ["INR"],
        maxPriceIncreasePercent: 5,
        allowedBillingIntervals: ["monthly"],
      };

      const permissions: AgentPermissions = {
        canAutoApproveMinorChanges: true,
        canAutoPauseOnBreach: true,
        canApproveRefundRequest: false,
        canMigrateToNewVersion: false,
      };

      const tolerance: TolerancePolicy = {
        priceIncreasePercentTolerance: 5,
        allowedTierDowngrades: [],
        allowedRemovedEntitlements: [],
        refundWindowReductionDaysTolerance: 0,
      };

      const baseHash = computeAuthorizationPolicyHash({
        financialConstraints: financial,
        agentPermissions: permissions,
        tolerancePolicy: tolerance,
      });

      const alteredHash = computeAuthorizationPolicyHash({
        financialConstraints: financial,
        agentPermissions: { ...permissions, canMigrateToNewVersion: true },
        tolerancePolicy: tolerance,
      });

      expect(alteredHash).not.toBe(baseHash);
    });
  });
});
