import { describe, it, expect } from "vitest";
import {
  MerchantOfferService,
  InMemoryMerchantOfferRepository,
} from "@/lib/merchant/service";
import { buildInterviewForgeData } from "@/lib/merchant/seed-data";
import type {
  MerchantModel,
  OfferModel,
  ProductModel,
} from "@/lib/merchant/types";

const TS = new Date("2026-01-01T00:00:00.000Z");

function merchant(over: Partial<MerchantModel> = {}): MerchantModel {
  return {
    id: "m1",
    name: "Merchant",
    slug: "merchant",
    description: "desc",
    status: "ACTIVE",
    createdAt: TS,
    updatedAt: TS,
    ...over,
  };
}

function product(over: Partial<ProductModel> = {}): ProductModel {
  return {
    id: "p1",
    merchantId: "m1",
    name: "Product",
    slug: "product",
    description: "desc",
    category: "cat",
    active: true,
    createdAt: TS,
    updatedAt: TS,
    ...over,
  };
}

function offer(over: Partial<OfferModel> = {}): OfferModel {
  return {
    id: "o1",
    productId: "p1",
    version: 1,
    name: "Offer",
    description: "desc",
    price: 100000,
    currency: "INR",
    billingInterval: "monthly",
    duration: 30,
    entitlementKeys: ["a"],
    refundWindowDays: 7,
    supportTerms: "support",
    semanticTerms: "semantic",
    active: true,
    createdAt: TS,
    updatedAt: TS,
    ...over,
  };
}

describe("MerchantOfferService — profile", () => {
  it("returns the active merchant profile with a limited surface", async () => {
    const svc = new MerchantOfferService(
      new InMemoryMerchantOfferRepository(buildInterviewForgeData()),
    );
    const profile = await svc.getMerchantProfile();
    expect(profile).not.toBeNull();
    expect(profile!.merchant.name).toBe("InterviewForge");
    expect(profile!.merchant.status).toBe("ACTIVE");
    expect(profile!.merchant.id).toBeDefined();
    // No secret/internals leaked.
    expect(Object.keys(profile!.merchant)).toEqual([
      "id",
      "name",
      "description",
      "status",
    ]);
  });

  it("returns null when the active merchant is INACTIVE", async () => {
    const svc = new MerchantOfferService(
      new InMemoryMerchantOfferRepository({
        merchants: [merchant({ status: "INACTIVE" })],
        products: [],
        offers: [],
      }),
    );
    expect(await svc.getMerchantProfile()).toBeNull();
  });
});

describe("MerchantOfferService — product discovery", () => {
  const data = buildInterviewForgeData();

  it("returns only active products", async () => {
    const svc = new MerchantOfferService(
      new InMemoryMerchantOfferRepository({
        merchants: data.merchants,
        products: [
          ...data.products,
          product({ id: "p_inactive", slug: "inactive", active: false }),
        ],
        offers: data.offers,
      }),
    );
    const products = await svc.listProducts();
    expect(products).toHaveLength(data.products.length);
    expect(products.find((p) => p.id === "p_inactive")).toBeUndefined();
  });

  it("supports category filtering", async () => {
    const svc = new MerchantOfferService(
      new InMemoryMerchantOfferRepository(data),
    );
    const products = await svc.listProducts({ category: "mock-interviews" });
    expect(products).toHaveLength(1);
    expect(products[0].id).toBe("p_mockpack");
  });

  it("enforces merchant isolation", async () => {
    const svc = new MerchantOfferService(
      new InMemoryMerchantOfferRepository({
        merchants: [merchant(), merchant({ id: "m2", slug: "m2" })],
        products: [
          product({ id: "pA", merchantId: "m1" }),
          product({ id: "pB", merchantId: "m2" }),
        ],
        offers: [
          offer({ id: "oA", productId: "pA" }),
          offer({ id: "oB", productId: "pB" }),
        ],
      }),
    );
    const products = await svc.listProducts();
    expect(products.map((p) => p.id)).toEqual(["pA"]);
  });
});

describe("MerchantOfferService — offer discovery", () => {
  const data = buildInterviewForgeData();

  it("returns a normalized active offer with product and refund policy", async () => {
    const svc = new MerchantOfferService(
      new InMemoryMerchantOfferRepository(data),
    );
    const result = await svc.getOffer("o_sysdesign_v2");
    expect(result).not.toBeNull();
    expect(result!.product.name).toBe("System Design Pro");
    expect(result!.version).toBe(2);
    expect(result!.refundPolicy.windowDays).toBe(30);
    expect(result!.entitlementKeys).toContain("capstone_review");
    expect(result!.availability).toBe("ACTIVE");
  });

  it("does not return an inactive (superseded) offer version", async () => {
    const svc = new MerchantOfferService(
      new InMemoryMerchantOfferRepository(data),
    );
    expect(await svc.getOffer("o_sysdesign_v1")).toBeNull();
  });

  it("returns null for an unknown offer", async () => {
    const svc = new MerchantOfferService(
      new InMemoryMerchantOfferRepository(data),
    );
    expect(await svc.getOffer("does-not-exist")).toBeNull();
  });

  it("does not return an offer that belongs to another merchant", async () => {
    const svc = new MerchantOfferService(
      new InMemoryMerchantOfferRepository({
        merchants: [merchant(), merchant({ id: "m2", slug: "m2" })],
        products: [
          product({ id: "pA", merchantId: "m1" }),
          product({ id: "pB", merchantId: "m2" }),
        ],
        offers: [offer({ id: "oB", productId: "pB" })],
      }),
    );
    expect(await svc.getOffer("oB")).toBeNull();
  });

  it("surfaces only the active version of a product's offers", async () => {
    const svc = new MerchantOfferService(
      new InMemoryMerchantOfferRepository(data),
    );
    const products = await svc.listProducts();
    const sysdes = products.find((p) => p.id === "p_sysdesign")!;
    expect(sysdes.offers).toHaveLength(1);
    expect(sysdes.offers[0].version).toBe(2);
  });
});

describe("MerchantOfferService — versioning integrity", () => {
  it("allows multiple versions of an offer to coexist and is uniquely keyed", () => {
    const { offers } = buildInterviewForgeData();
    const keys = offers.map((o) => `${o.productId}:${o.version}`);
    expect(new Set(keys).size).toBe(keys.length);
    const sysdesVersions = offers
      .filter((o) => o.productId === "p_sysdesign")
      .map((o) => o.version)
      .sort();
    expect(sysdesVersions).toEqual([1, 2]);
  });

  it("identifies the current/active version distinctly from prior versions", () => {
    const { offers } = buildInterviewForgeData();
    const sysdes = offers.filter((o) => o.productId === "p_sysdesign");
    const active = sysdes.filter((o) => o.active);
    const prior = sysdes.filter((o) => !o.active);
    expect(active).toHaveLength(1);
    expect(active[0].version).toBe(2);
    expect(prior[0].version).toBe(1);
  });
});

describe("MerchantOfferService — policies", () => {
  it("returns a deterministic MVP policy response", async () => {
    const svc = new MerchantOfferService(
      new InMemoryMerchantOfferRepository(buildInterviewForgeData()),
    );
    const policies = svc.getPolicies();
    expect(policies.currency).toBe("INR");
    expect(policies.supportedBillingIntervals).toContain("monthly");
    expect(policies.refundPolicy.defaultWindowDays).toBe(30);
    expect(policies.note).toMatch(/MVP/i);
  });
});
