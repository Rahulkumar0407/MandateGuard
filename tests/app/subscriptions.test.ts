import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/db", () => {
  const prisma = {
    subscription: {
      create: vi.fn((args: { data: { razorpaySubscriptionId: string; status: string } }) =>
        Promise.resolve({
          id: "local_1",
          razorpaySubscriptionId: args.data.razorpaySubscriptionId,
          status: args.data.status,
          shortUrl: null,
        }),
      ),
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({ id: "local_1", status: "PAUSED" }),
      updateMany: vi.fn().mockResolvedValue({}),
    },
  };
  return { prisma };
});

vi.mock("@/lib/env", () => ({
  env: { RAZORPAY_WEBHOOK_SECRET: "test-webhook-secret" },
  hasRazorpayCredentials: () => true,
  hasWebhookSecret: () => true,
  hasDatabaseUrl: () => false,
}));

import { POST as createPOST } from "@/app/api/subscriptions/route";
import { POST as pausePOST } from "@/app/api/subscriptions/[id]/pause/route";
import { POST as resumePOST } from "@/app/api/subscriptions/[id]/resume/route";
import { prisma } from "@/lib/db";
import {
  setRazorpayGateway,
  resetRazorpayGateway,
  MockRazorpayGateway,
} from "@/lib/razorpay/gateway";

const db = prisma as unknown as {
  subscription: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

let gateway: MockRazorpayGateway;

const URL = "http://localhost/api/subscriptions";

function json(body: unknown): Request {
  return new Request(URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Seed the mock gateway so pause/resume calls operate on a known subscription.
function seedGateway(subId = "sub_1", status = "active") {
  gateway.subscriptions.set(subId, {
    id: subId,
    planId: "plan_1",
    status,
    totalCount: 12,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  gateway = new MockRazorpayGateway();
  setRazorpayGateway(gateway);
});

afterEach(() => {
  resetRazorpayGateway();
});

describe("POST /api/subscriptions — validation", () => {
  it("creates a plan+subscription and stores a PENDING local record", async () => {
    const res = await createPOST(
      json({
        planName: "System Design Pro",
        amount: 349900,
        currency: "INR",
        interval: "monthly",
        intervalCount: 1,
        totalCount: 12,
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.razorpaySubscriptionId).toMatch(/^sub_\d+$/);
    // Local status must be canonical, not the raw Razorpay "created".
    expect(data.status).toBe("PENDING");
    expect(db.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "PENDING" }) }),
    );
  });

  it("rejects an invalid request body (400)", async () => {
    const res = await createPOST(json({ planName: "" }));
    expect(res.status).toBe(400);
    expect(db.subscription.create).not.toHaveBeenCalled();
  });

  it("converts a Razorpay failure into a safe 502 without leaking details", async () => {
    const gateway = new MockRazorpayGateway();
    gateway.failNext = true;
    gateway.failureError = new Error("RAZORPAY_KEY_SECRET invalid: abc");
    setRazorpayGateway(gateway);
    const res = await createPOST(
      json({ planName: "X", amount: 100, interval: "monthly" }),
    );
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(JSON.stringify(data)).not.toMatch(/RAZORPAY_KEY_SECRET/);
  });
});

describe("POST /api/subscriptions/:id/pause — safety", () => {
  function record(status: string, hasRazorpayId = true) {
    return { id: "local_1", razorpaySubscriptionId: hasRazorpayId ? "sub_1" : null, status };
  }

  it("pauses an ACTIVE subscription and stores PAUSED", async () => {
    db.subscription.findUnique.mockResolvedValue(record("ACTIVE"));
    seedGateway("sub_1", "active");
    const res = await pausePOST(json({}), { params: Promise.resolve({ id: "local_1" }) });
    expect(res.status).toBe(200);
    expect(db.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "PAUSED" } }),
    );
  });

  it("does NOT pause a PENDING subscription (409)", async () => {
    db.subscription.findUnique.mockResolvedValue(record("PENDING"));
    const res = await pausePOST(json({}), { params: Promise.resolve({ id: "local_1" }) });
    expect(res.status).toBe(409);
    expect(db.subscription.update).not.toHaveBeenCalled();
  });

  it("does NOT re-pause an already PAUSED subscription (409)", async () => {
    db.subscription.findUnique.mockResolvedValue(record("PAUSED"));
    const res = await pausePOST(json({}), { params: Promise.resolve({ id: "local_1" }) });
    expect(res.status).toBe(409);
    expect(db.subscription.update).not.toHaveBeenCalled();
  });

  it("does NOT pause a CANCELLED subscription (409)", async () => {
    db.subscription.findUnique.mockResolvedValue(record("CANCELLED"));
    const res = await pausePOST(json({}), { params: Promise.resolve({ id: "local_1" }) });
    expect(res.status).toBe(409);
    expect(db.subscription.update).not.toHaveBeenCalled();
  });

  it("returns 404 for a missing subscription", async () => {
    db.subscription.findUnique.mockResolvedValue(null);
    const res = await pausePOST(json({}), { params: Promise.resolve({ id: "missing" }) });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/subscriptions/:id/resume — safety", () => {
  function record(status: string) {
    return { id: "local_1", razorpaySubscriptionId: "sub_1", status };
  }

  it("resumes a PAUSED subscription and stores ACTIVE", async () => {
    db.subscription.findUnique.mockResolvedValue(record("PAUSED"));
    seedGateway("sub_1", "paused");
    const res = await resumePOST(json({}), { params: Promise.resolve({ id: "local_1" }) });
    expect(res.status).toBe(200);
    expect(db.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "ACTIVE" } }),
    );
  });

  it("does NOT resume an already ACTIVE subscription (409)", async () => {
    db.subscription.findUnique.mockResolvedValue(record("ACTIVE"));
    const res = await resumePOST(json({}), { params: Promise.resolve({ id: "local_1" }) });
    expect(res.status).toBe(409);
    expect(db.subscription.update).not.toHaveBeenCalled();
  });

  it("does NOT resume a CANCELLED subscription (409)", async () => {
    db.subscription.findUnique.mockResolvedValue(record("CANCELLED"));
    const res = await resumePOST(json({}), { params: Promise.resolve({ id: "local_1" }) });
    expect(res.status).toBe(409);
    expect(db.subscription.update).not.toHaveBeenCalled();
  });

  it("does NOT resume a HALTED subscription (409)", async () => {
    db.subscription.findUnique.mockResolvedValue(record("HALTED"));
    const res = await resumePOST(json({}), { params: Promise.resolve({ id: "local_1" }) });
    expect(res.status).toBe(409);
    expect(db.subscription.update).not.toHaveBeenCalled();
  });
});
