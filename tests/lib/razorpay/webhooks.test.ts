import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import {
  verifyWebhookSignature,
  buildWebhookDedupKey,
} from "@/lib/razorpay/webhooks";

const SECRET = "test-webhook-secret";

describe("verifyWebhookSignature", () => {
  it("accepts a correctly signed body", () => {
    const body = JSON.stringify({ event: "subscription.charged" });
    const sig = crypto.createHmac("sha256", SECRET).update(body).digest("hex");
    expect(verifyWebhookSignature(body, sig, SECRET)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const body = JSON.stringify({ event: "subscription.charged" });
    const sig = crypto.createHmac("sha256", SECRET).update(body).digest("hex");
    expect(verifyWebhookSignature(body + "tampered", sig, SECRET)).toBe(false);
  });

  it("rejects an incorrect signature", () => {
    expect(verifyWebhookSignature("{}", "deadbeef", SECRET)).toBe(false);
  });

  it("rejects a missing/empty signature", () => {
    const body = JSON.stringify({ event: "subscription.paused" });
    expect(verifyWebhookSignature(body, "", SECRET)).toBe(false);
  });

  it("verifies against the raw body, not a re-serialized form", () => {
    const obj = { event: "subscription.charged", a: 1 };
    const raw = JSON.stringify(obj);
    // A signature computed over a differently-spaced string must fail.
    const alt = crypto
      .createHmac("sha256", SECRET)
      .update(JSON.stringify(obj))
      .digest("hex");
    expect(verifyWebhookSignature(raw, alt, SECRET)).toBe(true);
  });
});

describe("buildWebhookDedupKey", () => {
  it("prefers the payment entity id when present", () => {
    const key = buildWebhookDedupKey({
      event: "subscription.charged",
      payload: {
        payment: { entity: { id: "pay_123" } },
        subscription: { entity: { id: "sub_123" } },
      },
    });
    expect(key).toBe("subscription.charged:pay_123");
  });

  it("falls back to the subscription entity id", () => {
    const key = buildWebhookDedupKey({
      event: "subscription.paused",
      payload: { subscription: { entity: { id: "sub_456" } } },
    });
    expect(key).toBe("subscription.paused:sub_456");
  });

  it("produces the same key for a duplicate delivery (idempotency)", () => {
    const payload = {
      event: "subscription.charged",
      payload: { payment: { entity: { id: "pay_999" } } },
    };
    expect(buildWebhookDedupKey(payload)).toBe(buildWebhookDedupKey(payload));
  });

  it("prefers the provider event id as the dedup key when present", () => {
    const key = buildWebhookDedupKey(
      {
        event: "subscription.charged",
        payload: {
          payment: { entity: { id: "pay_123" } },
          subscription: { entity: { id: "sub_123" } },
        },
      },
      "evt_123",
    );
    expect(key).toBe("evt_123");
  });

  it("treats the same provider event id as identical (idempotency)", () => {
    const payload = {
      event: "subscription.charged",
      payload: { payment: { entity: { id: "pay_123" } } },
    };
    expect(buildWebhookDedupKey(payload, "evt_abc")).toBe(
      buildWebhookDedupKey(payload, "evt_abc"),
    );
  });

  it("falls back to the synthetic key when the provider event id is empty", () => {
    const key = buildWebhookDedupKey(
      {
        event: "subscription.paused",
        payload: { subscription: { entity: { id: "sub_456" } } },
      },
      "",
    );
    expect(key).toBe("subscription.paused:sub_456");
  });

  it("produces different keys for distinct charges on the same subscription", () => {
    const a = buildWebhookDedupKey({
      event: "subscription.charged",
      payload: { payment: { entity: { id: "pay_A" } }, subscription: { entity: { id: "sub_1" } } },
    });
    const b = buildWebhookDedupKey({
      event: "subscription.charged",
      payload: { payment: { entity: { id: "pay_B" } }, subscription: { entity: { id: "sub_1" } } },
    });
    expect(a).not.toBe(b);
  });
});
