import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";

vi.mock("@/lib/db", () => {
  const prisma = {
    webhookEvent: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
    },
    subscription: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findFirst: vi.fn().mockResolvedValue({ id: "local_1" }),
    },
    $transaction: vi.fn(async (cb: (tx: unknown) => unknown) => cb(prisma)),
  };
  return { prisma };
});

vi.mock("@/lib/env", () => ({
  env: { RAZORPAY_WEBHOOK_SECRET: "test-webhook-secret" },
  hasRazorpayCredentials: () => true,
  hasWebhookSecret: () => true,
  hasDatabaseUrl: () => false,
}));

import { POST } from "@/app/api/webhooks/razorpay/route";
import { prisma } from "@/lib/db";

const SECRET = "test-webhook-secret";

function signedRequest(body: unknown, signature: string, eventId?: string): Request {
  const headers: Record<string, string> = { "x-razorpay-signature": signature };
  if (eventId) headers["x-razorpay-event-id"] = eventId;
  return new Request("http://localhost/api/webhooks/razorpay", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function sign(body: string): string {
  return crypto.createHmac("sha256", SECRET).update(body).digest("hex");
}

const db = prisma as unknown as {
  webhookEvent: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  subscription: {
    updateMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
  };
};

function payload(event: string, subId = "sub_1", paymentId?: string) {
  return {
    event,
    payload: {
      subscription: { entity: { id: subId } },
      ...(paymentId ? { payment: { entity: { id: paymentId } } } : {}),
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/webhooks/razorpay — signature", () => {
  it("accepts a valid signature and processes the event", async () => {
    const body = payload("subscription.activated");
    const res = await POST(signedRequest(body, sign(JSON.stringify(body))));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
    expect(db.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "ACTIVE" } }),
    );
    expect(db.webhookEvent.create).toHaveBeenCalled();
  });

  it("rejects an invalid signature without mutating state", async () => {
    const body = payload("subscription.activated");
    const res = await POST(signedRequest(body, "invalid"));
    expect(res.status).toBe(400);
    expect(db.subscription.updateMany).not.toHaveBeenCalled();
    expect(db.webhookEvent.create).not.toHaveBeenCalled();
  });

  it("rejects a tampered body (valid signature over wrong content)", async () => {
    const body = payload("subscription.activated");
    const res = await POST(signedRequest(body, sign("{}")));
    expect(res.status).toBe(400);
    expect(db.webhookEvent.create).not.toHaveBeenCalled();
  });

  it("rejects a malformed payload after a valid signature", async () => {
    const raw = "not-json";
    const res = await POST(signedRequest(raw, sign(raw)));
    expect(res.status).toBe(400);
    expect(db.subscription.updateMany).not.toHaveBeenCalled();
  });
});

describe("POST /api/webhooks/razorpay — deduplication", () => {
  it("does not re-process a duplicate delivery", async () => {
    const body = payload("subscription.paused");
    const sig = sign(JSON.stringify(body));
    const first = await POST(signedRequest(body, sig));
    expect(first.status).toBe(200);

    db.webhookEvent.findUnique.mockResolvedValueOnce({ id: "existing" });
    const second = await POST(signedRequest(body, sig));
    const json = await second.json();
    expect(json.duplicate).toBe(true);
    expect(db.subscription.updateMany).toHaveBeenCalledTimes(1);
    expect(db.webhookEvent.create).toHaveBeenCalledTimes(1);
  });

  it("processes two distinct charges on the same subscription", async () => {
    const a = payload("subscription.charged", "sub_1", "pay_A");
    const b = payload("subscription.charged", "sub_1", "pay_B");
    const ra = await POST(signedRequest(a, sign(JSON.stringify(a))));
    const rb = await POST(signedRequest(b, sign(JSON.stringify(b))));
    expect(ra.status).toBe(200);
    expect(rb.status).toBe(200);
    expect(db.webhookEvent.create).toHaveBeenCalledTimes(2);
  });
});

describe("POST /api/webhooks/razorpay — provider event id deduplication", () => {
  it("uses the provider event id as the dedup key when present", async () => {
    const body = payload("subscription.activated", "sub_1");
    const res = await POST(signedRequest(body, sign(JSON.stringify(body)), "evt_123"));
    expect(res.status).toBe(200);
    expect(db.webhookEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ razorpayEventId: "evt_123" }),
      }),
    );
  });

  it("deduplicates repeated delivery of the same provider event id", async () => {
    const body = payload("subscription.paused", "sub_1");
    const sig = sign(JSON.stringify(body));
    const first = await POST(signedRequest(body, sig, "evt_dup_1"));
    expect(first.status).toBe(200);
    expect(db.webhookEvent.create).toHaveBeenCalledTimes(1);

    db.webhookEvent.findUnique.mockResolvedValueOnce({ id: "existing" });
    const second = await POST(signedRequest(body, sig, "evt_dup_1"));
    const json = await second.json();
    expect(json.duplicate).toBe(true);
    expect(db.webhookEvent.create).toHaveBeenCalledTimes(1);
  });

  it("falls back to the synthetic key when the provider event id is absent", async () => {
    const body = payload("subscription.activated", "sub_FB");
    const res = await POST(signedRequest(body, sign(JSON.stringify(body))));
    expect(res.status).toBe(200);
    expect(db.webhookEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ razorpayEventId: "subscription.activated:sub_FB" }),
      }),
    );
  });
});

describe("POST /api/webhooks/razorpay — state mapping", () => {
  it("maps subscription.paused -> PAUSED", async () => {
    const body = payload("subscription.paused");
    await POST(signedRequest(body, sign(JSON.stringify(body))));
    expect(db.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "PAUSED" } }),
    );
  });

  it("maps subscription.halted -> HALTED", async () => {
    const body = payload("subscription.halted");
    await POST(signedRequest(body, sign(JSON.stringify(body))));
    expect(db.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "HALTED" } }),
    );
  });

  it("maps subscription.cancelled -> CANCELLED", async () => {
    const body = payload("subscription.cancelled");
    await POST(signedRequest(body, sign(JSON.stringify(body))));
    expect(db.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "CANCELLED" } }),
    );
  });
});

describe("POST /api/webhooks/razorpay — charge success/failure", () => {
  it("does not change status on a successful charge but persists the event", async () => {
    const body = payload("subscription.charged", "sub_1", "pay_1");
    await POST(signedRequest(body, sign(JSON.stringify(body))));
    expect(db.subscription.updateMany).not.toHaveBeenCalled();
    expect(db.webhookEvent.create).toHaveBeenCalled();
  });

  it("does not record success on a failed payment", async () => {
    const body = {
      event: "payment.failed",
      payload: {
        subscription: { entity: { id: "sub_1" } },
        payment: { entity: { id: "pay_2", status: "failed" } },
      },
    };
    await POST(signedRequest(body, sign(JSON.stringify(body))));
    expect(db.subscription.updateMany).not.toHaveBeenCalled();
    expect(db.webhookEvent.create).toHaveBeenCalled();
  });

  it("persists but does not mutate state for unknown events", async () => {
    const body = payload("subscription.unknown");
    await POST(signedRequest(body, sign(JSON.stringify(body))));
    expect(db.subscription.updateMany).not.toHaveBeenCalled();
    expect(db.webhookEvent.create).toHaveBeenCalled();
  });
});
