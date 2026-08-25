import { describe, it, expect, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ActionGatewayError,
  DisabledRazorpayActionGateway,
  LIVE_ACTIONS_ENABLED,
  MockRazorpayActionGateway,
  RealRazorpayActionGateway,
  getActionGateway,
  resetActionGateway,
  setActionGateway,
} from "@/lib/actions/gateway";

afterEach(() => resetActionGateway());

// STEP 11 — the mock gateway must support deterministic pause success, pause
// failure and provider-unavailable, with NO fake network calls.
describe("M7-A — MockRazorpayActionGateway (STEP 11)", () => {
  it("pause success is deterministic and records the call", async () => {
    const g = new MockRazorpayActionGateway("SUCCESS");
    const r = await g.pauseSubscription("sub_1");
    expect(r).toEqual({ providerSubscriptionId: "sub_1", providerStatus: "paused" });
    expect(g.pauseCalls).toEqual(["sub_1"]);
    expect(g.callCount).toBe(1);
  });

  it("pause failure raises PROVIDER_REJECTED", async () => {
    const g = new MockRazorpayActionGateway("FAILURE");
    await expect(g.pauseSubscription("sub_1")).rejects.toBeInstanceOf(
      ActionGatewayError,
    );
    await expect(g.pauseSubscription("sub_1")).rejects.toMatchObject({
      code: "PROVIDER_REJECTED",
    });
    expect(g.callCount).toBe(2);
  });

  it("provider unavailable raises PROVIDER_UNAVAILABLE", async () => {
    const g = new MockRazorpayActionGateway("UNAVAILABLE");
    await expect(g.pauseSubscription("sub_1")).rejects.toMatchObject({
      code: "PROVIDER_UNAVAILABLE",
    });
  });

  it("makes no network call at all", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const g = new MockRazorpayActionGateway("SUCCESS");
    await g.pauseSubscription("sub_1");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

// STEP 12 — the real adapter is the eventual production implementation, but
// M7-A must never reach it.
describe("M7-A — real Razorpay boundary is not wired (STEP 12)", () => {
  it("live actions are disabled in this milestone", () => {
    expect(LIVE_ACTIONS_ENABLED).toBe(false);
  });

  it("the default gateway is the disabled gateway, never the real one", () => {
    const gateway = getActionGateway();
    expect(gateway).toBeInstanceOf(DisabledRazorpayActionGateway);
    expect(gateway).not.toBeInstanceOf(RealRazorpayActionGateway);
    expect(gateway).not.toBeInstanceOf(MockRazorpayActionGateway);
  });

  it("the disabled gateway refuses to act instead of silently succeeding", async () => {
    await expect(
      new DisabledRazorpayActionGateway().pauseSubscription(),
    ).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE" });
  });

  it("an injected gateway wins, and clearing restores the disabled default", () => {
    const mock = new MockRazorpayActionGateway();
    setActionGateway(mock);
    expect(getActionGateway()).toBe(mock);
    setActionGateway(null);
    expect(getActionGateway()).toBeInstanceOf(DisabledRazorpayActionGateway);
  });

  it("the executor talks to the gateway interface only (no Razorpay import)", () => {
    const src = readFileSync(
      resolve(process.cwd(), "lib/actions/executor.ts"),
      "utf8",
    );
    expect(src).not.toMatch(/@\/lib\/razorpay/);
    expect(src.toLowerCase()).not.toContain("razorpay.");
    expect(src).toContain("./gateway");
  });
});
