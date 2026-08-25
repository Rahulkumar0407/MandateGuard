import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setMerchantOfferRepository,
  InMemoryMerchantOfferRepository,
} from "@/lib/merchant/service";
import {
  setMandateRepository,
  InMemoryMandateRepository,
} from "@/lib/mandate/service";
import { buildInterviewForgeData } from "@/lib/merchant/seed-data";
import * as mandateRoute from "@/app/api/mandates/route";

const BASE = "http://localhost/api/mandates";

beforeEach(() => {
  setMerchantOfferRepository(
    new InMemoryMerchantOfferRepository(buildInterviewForgeData()),
  );
  setMandateRepository(new InMemoryMandateRepository());
});

afterEach(() => {
  setMerchantOfferRepository(null);
  setMandateRepository(null);
});

describe("POST /api/mandates", () => {
  it("authorizes an active offer and freezes the snapshot (v2)", async () => {
    const res = await mandateRoute.POST(
      new Request(BASE, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: "u1", offerId: "o_sysdesign_v2" }),
      }),
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.mandateId).toBeDefined();
    expect(json.snapshot.offerVersion).toBe(2);
    expect(json.snapshot.price).toBe(399900);
  });

  it("returns 404 for an unknown offer", async () => {
    const res = await mandateRoute.POST(
      new Request(BASE, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: "u1", offerId: "does-not-exist" }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 for an inactive offer", async () => {
    const res = await mandateRoute.POST(
      new Request(BASE, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: "u1", offerId: "o_sysdesign_v1" }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 for a malformed request", async () => {
    const res = await mandateRoute.POST(
      new Request(BASE, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: "u1" /* missing offerId */ }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("is idempotent for a repeated idempotency key", async () => {
    const body = JSON.stringify({
      userId: "u1",
      offerId: "o_sysdesign_v2",
      idempotencyKey: "dup-key",
    });
    const first = await mandateRoute.POST(
      new Request(BASE, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      }),
    );
    const firstId = (await first.json()).mandateId;

    const second = await mandateRoute.POST(
      new Request(BASE, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      }),
    );
    const secondId = (await second.json()).mandateId;
    expect(secondId).toBe(firstId);
  });

  it("does not expose Razorpay secrets and stores only a test subscription id", async () => {
    const res = await mandateRoute.POST(
      new Request(BASE, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: "u1",
          offerId: "o_sysdesign_v2",
          razorpaySubscriptionId: "sub_test_123",
        }),
      }),
    );
    const json = await res.json();
    expect(json.razorpaySubscriptionId).toBe("sub_test_123");
    expect(JSON.stringify(json)).not.toMatch(/secret|razorpay_key/i);
  });
});
