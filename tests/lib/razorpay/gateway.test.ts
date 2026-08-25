import { describe, it, expect, afterEach } from "vitest";
import {
  MockRazorpayGateway,
  getGateway,
  setRazorpayGateway,
  resetRazorpayGateway,
} from "@/lib/razorpay/gateway";

afterEach(() => {
  resetRazorpayGateway();
});

describe("MockRazorpayGateway", () => {
  it("creates a plan with a generated id and normalised fields", async () => {
    const g = new MockRazorpayGateway();
    const plan = await g.createPlan({
      name: "System Design Pro",
      amount: 349900,
      currency: "INR",
      interval: "monthly",
    });
    expect(plan.id).toMatch(/^plan_\d+$/);
    expect(plan.name).toBe("System Design Pro");
    expect(plan.amount).toBe(349900);
    expect(plan.currency).toBe("INR");
  });

  it("creates a subscription linked to the plan and defaults to created", async () => {
    const g = new MockRazorpayGateway();
    const plan = await g.createPlan({
      name: "X",
      amount: 100,
      interval: "monthly",
    });
    const sub = await g.createSubscription({ planId: plan.id });
    expect(sub.id).toMatch(/^sub_\d+$/);
    expect(sub.planId).toBe(plan.id);
    expect(sub.status).toBe("created");
  });

  it("pause transitions an existing subscription to paused", async () => {
    const g = new MockRazorpayGateway();
    const sub = await g.createSubscription({ planId: "plan_1" });
    const paused = await g.pauseSubscription(sub.id);
    expect(paused.status).toBe("paused");
    expect((await g.getSubscription(sub.id)).status).toBe("paused");
  });

  it("resume transitions an existing subscription to active", async () => {
    const g = new MockRazorpayGateway();
    const sub = await g.createSubscription({ planId: "plan_1" });
    await g.pauseSubscription(sub.id);
    const resumed = await g.resumeSubscription(sub.id);
    expect(resumed.status).toBe("active");
  });

  it("throws when pausing an unknown subscription", async () => {
    const g = new MockRazorpayGateway();
    await expect(g.pauseSubscription("sub_missing")).rejects.toThrow();
  });

  it("cancel terminates an existing subscription and removes it", async () => {
    const g = new MockRazorpayGateway();
    const sub = await g.createSubscription({ planId: "plan_1" });
    const cancelled = await g.cancelSubscription(sub.id);
    expect(cancelled.status).toBe("cancelled");
    // Provider entity is terminated: no longer resolvable.
    await expect(g.getSubscription(sub.id)).rejects.toThrow();
  });

  it("throws when cancelling an unknown subscription", async () => {
    const g = new MockRazorpayGateway();
    await expect(g.cancelSubscription("sub_missing")).rejects.toThrow();
  });

  it("fails the next call when failNext is set", async () => {
    const g = new MockRazorpayGateway();
    g.failNext = true;
    g.failureError = new Error("boom");
    await expect(g.createPlan({ name: "X", amount: 1, interval: "monthly" })).rejects.toThrow(
      "boom",
    );
    // reset afterwards
    expect(g.failNext).toBe(false);
  });

  it("throws on getSubscription for an unknown id", async () => {
    const g = new MockRazorpayGateway();
    await expect(g.getSubscription("nope")).rejects.toThrow();
  });
});

describe("gateway factory seam", () => {
  it("returns the injected gateway (tests) over the real one", () => {
    const mock = new MockRazorpayGateway();
    setRazorpayGateway(mock);
    expect(getGateway()).toBe(mock);
  });

  it("clears the override on reset", () => {
    const mock = new MockRazorpayGateway();
    setRazorpayGateway(mock);
    resetRazorpayGateway();
    expect(getGateway()).not.toBe(mock);
  });
});
