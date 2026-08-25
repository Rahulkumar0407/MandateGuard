import { describe, it, expect } from "vitest";
import {
  statusForEvent,
  localStatusFromRazorpay,
  chargeOutcome,
  isKnownSubscriptionEvent,
} from "@/lib/razorpay/status";

describe("statusForEvent", () => {
  it("maps subscription.pending -> PENDING", () => {
    expect(statusForEvent("subscription.pending")).toBe("PENDING");
  });

  it("maps subscription.activated -> ACTIVE", () => {
    expect(statusForEvent("subscription.activated")).toBe("ACTIVE");
  });

  it("maps subscription.resumed -> ACTIVE", () => {
    expect(statusForEvent("subscription.resumed")).toBe("ACTIVE");
  });

  it("maps subscription.paused -> PAUSED", () => {
    expect(statusForEvent("subscription.paused")).toBe("PAUSED");
  });

  it("maps subscription.halted -> HALTED", () => {
    expect(statusForEvent("subscription.halted")).toBe("HALTED");
  });

  it("maps subscription.cancelled -> CANCELLED", () => {
    expect(statusForEvent("subscription.cancelled")).toBe("CANCELLED");
  });

  it("does NOT change status on a successful charge", () => {
    expect(statusForEvent("subscription.charged")).toBeNull();
  });

  it("returns null for unknown events (no false state change)", () => {
    expect(statusForEvent("subscription.unknown")).toBeNull();
    expect(statusForEvent("")).toBeNull();
  });
});

describe("isKnownSubscriptionEvent", () => {
  it("recognises the events we handle", () => {
    for (const e of [
      "subscription.pending",
      "subscription.activated",
      "subscription.charged",
      "subscription.paused",
      "subscription.resumed",
      "subscription.halted",
      "subscription.cancelled",
    ]) {
      expect(isKnownSubscriptionEvent(e)).toBe(true);
    }
  });

  it("rejects unknown events", () => {
    expect(isKnownSubscriptionEvent("subscription.bogus")).toBe(false);
  });
});

describe("localStatusFromRazorpay", () => {
  it("maps raw Razorpay statuses to canonical local states", () => {
    expect(localStatusFromRazorpay("created")).toBe("PENDING");
    expect(localStatusFromRazorpay("authenticated")).toBe("ACTIVE");
    expect(localStatusFromRazorpay("active")).toBe("ACTIVE");
    expect(localStatusFromRazorpay("paused")).toBe("PAUSED");
    expect(localStatusFromRazorpay("halted")).toBe("HALTED");
    expect(localStatusFromRazorpay("cancelled")).toBe("CANCELLED");
  });

  it("defaults unknown/empty values to PENDING (safe starting state)", () => {
    expect(localStatusFromRazorpay(undefined)).toBe("PENDING");
    expect(localStatusFromRazorpay(null)).toBe("PENDING");
    expect(localStatusFromRazorpay("weird")).toBe("PENDING");
  });
});

describe("chargeOutcome", () => {
  it("treats a captured subscription.charged as success", () => {
    expect(chargeOutcome("subscription.charged", "captured")).toBe("success");
    expect(chargeOutcome("subscription.charged")).toBe("success");
  });

  it("treats an explicitly failed charged payment as failure", () => {
    expect(chargeOutcome("subscription.charged", "failed")).toBe("failed");
  });

  it("treats payment.failed as failure", () => {
    expect(chargeOutcome("payment.failed")).toBe("failed");
  });

  it("returns none for non-charge events", () => {
    expect(chargeOutcome("subscription.activated")).toBe("none");
  });
});
