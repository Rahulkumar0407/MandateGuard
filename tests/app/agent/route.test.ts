import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  setMerchantOfferRepository,
  InMemoryMerchantOfferRepository,
} from "@/lib/merchant/service";
import type { MerchantOfferRepository } from "@/lib/merchant/repository";
import { buildInterviewForgeData } from "@/lib/merchant/seed-data";

import * as profileRoute from "@/app/api/agent/profile/route";
import * as productsRoute from "@/app/api/agent/products/route";
import * as offerRoute from "@/app/api/agent/offers/[offerId]/route";
import * as policiesRoute from "@/app/api/agent/policies/route";

const BASE = "http://localhost/api/agent";

beforeEach(() => {
  setMerchantOfferRepository(
    new InMemoryMerchantOfferRepository(buildInterviewForgeData()),
  );
});

afterEach(() => {
  setMerchantOfferRepository(null);
});

describe("GET /agent/profile", () => {
  it("returns the active merchant profile", async () => {
    const res = await profileRoute.GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.merchant.name).toBe("InterviewForge");
    // No secrets / Razorpay internals.
    expect(JSON.stringify(json)).not.toMatch(/razorpay/i);
  });
});

describe("GET /agent/products", () => {
  it("returns active products with active offers", async () => {
    const res = await productsRoute.GET(new Request(`${BASE}/products`));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.products).toHaveLength(5);
    const sysdes = json.products.find(
      (p: { id: string }) => p.id === "p_sysdesign",
    );
    expect(sysdes.offers).toHaveLength(1);
    expect(sysdes.offers[0].version).toBe(2);
  });

  it("filters by category", async () => {
    const res = await productsRoute.GET(
      new Request(`${BASE}/products?category=mock-interviews`),
    );
    const json = await res.json();
    expect(json.products).toHaveLength(1);
    expect(json.products[0].id).toBe("p_mockpack");
  });

  it("returns 400 on invalid query parameters", async () => {
    const res = await productsRoute.GET(
      new Request(`${BASE}/products?category=${"a".repeat(100)}`),
    );
    expect(res.status).toBe(400);
  });
});

describe("GET /agent/offers/:offerId", () => {
  it("returns a normalized active offer", async () => {
    const res = await offerRoute.GET(new Request(`${BASE}/offers/o_sysdesign_v2`), {
      params: Promise.resolve({ offerId: "o_sysdesign_v2" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.version).toBe(2);
    expect(json.product.name).toBe("System Design Pro");
    expect(json.refundPolicy.windowDays).toBe(30);
  });

  it("returns 400 for an empty/invalid offer id", async () => {
    const res = await offerRoute.GET(new Request(`${BASE}/offers/`), {
      params: Promise.resolve({ offerId: "" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown offer", async () => {
    const res = await offerRoute.GET(
      new Request(`${BASE}/offers/unknown`),
      { params: Promise.resolve({ offerId: "unknown" }) },
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 for an inactive (superseded) version", async () => {
    const res = await offerRoute.GET(
      new Request(`${BASE}/offers/o_sysdesign_v1`),
      { params: Promise.resolve({ offerId: "o_sysdesign_v1" }) },
    );
    expect(res.status).toBe(404);
  });
});

describe("GET /agent/policies", () => {
  it("returns the MVP policy response", async () => {
    const res = await policiesRoute.GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.currency).toBe("INR");
    expect(json.supportedBillingIntervals).toContain("monthly");
  });
});

describe("Agent API — safe internal error handling", () => {
  it("returns 500 without leaking internals", async () => {
    const failing = {
      getActiveMerchant: vi.fn().mockRejectedValue(new Error("db unreachable")),
      listActiveProducts: vi.fn(),
      listActiveOffers: vi.fn(),
      getActiveOfferById: vi.fn(),
      getProductById: vi.fn(),
    } as unknown as MerchantOfferRepository;
    setMerchantOfferRepository(failing);

    const res = await profileRoute.GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(JSON.stringify(json)).not.toMatch(/db unreachable/);
  });
});
