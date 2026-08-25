import { describe, it, expect } from "vitest";
import {
  MandateService,
  InMemoryMandateRepository,
} from "@/lib/mandate/service";
import { MerchantOfferService, InMemoryMerchantOfferRepository } from "@/lib/merchant/service";
import { buildInterviewForgeData } from "@/lib/merchant/seed-data";

function setup(data = buildInterviewForgeData()) {
  const merchantRepo = new InMemoryMerchantOfferRepository(data);
  const merchant = new MerchantOfferService(merchantRepo);
  const mandateRepo = new InMemoryMandateRepository();
  const service = new MandateService(mandateRepo, merchant);
  return { data, merchant, mandateRepo, service };
}

describe("MandateService — authorization", () => {
  it("creates a mandate + immutable snapshot for an active offer, capturing version", async () => {
    const { service } = setup();
    const result = await service.createMandateAuthorization({
      userId: "u1",
      offerId: "o_sysdesign_v2",
    });
    expect(result.mandateId).toBeDefined();
    expect(result.snapshot.offerVersion).toBe(2);
    expect(result.snapshot.offerName).toBe("System Design Pro");
    expect(result.snapshot.price).toBe(399900);

    const stored = await service.getMandate(result.mandateId);
    expect(stored).not.toBeNull();
    expect(stored!.snapshot.offerVersion).toBe(2);
  });

  it("rejects an unknown offer with 404", async () => {
    const { service } = setup();
    await expect(
      service.createMandateAuthorization({ userId: "u1", offerId: "nope" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("rejects an inactive offer with 404 (only active offers are authorizable)", async () => {
    const { service } = setup();
    await expect(
      service.createMandateAuthorization({
        userId: "u1",
        offerId: "o_sysdesign_v1", // inactive/superseded
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe("MandateService — server authority", () => {
  it("snapshots server-loaded Offer data, never client-supplied values", async () => {
    const { service } = setup();
    const result = await service.createMandateAuthorization({
      userId: "u1",
      offerId: "o_sysdesign_v2",
    });
    // The client only sent offerId; price/version/entitlements come from the
    // merchant service, proving the server is authoritative.
    expect(result.snapshot.price).toBe(399900);
    expect(result.snapshot.entitlementKeys).toContain("capstone_review");
    expect(result.snapshot.currency).toBe("INR");
  });
});

describe("MandateService — immutability & versioning", () => {
  it("snapshot stays frozen even after the merchant Offer changes", async () => {
    const { data, service } = setup();
    const result = await service.createMandateAuthorization({
      userId: "u1",
      offerId: "o_sysdesign_v2",
    });
    const originalPrice = result.snapshot.price;

    // Merchant edits the live offer after authorization.
    const live = data.offers.find((o) => o.id === "o_sysdesign_v2")!;
    live.price = 1;
    live.duration = 1;

    const stored = await service.getMandate(result.mandateId);
    expect(stored!.snapshot.price).toBe(originalPrice);
    expect(stored!.snapshot.duration).toBe(365);
  });

  it("authorize v2, then merchant creates v3, snapshot remains v2", async () => {
    const { data, service } = setup();
    const result = await service.createMandateAuthorization({
      userId: "u1",
      offerId: "o_sysdesign_v2",
    });

    // Merchant introduces a new version; current offer becomes v3.
    data.offers.find((o) => o.id === "o_sysdesign_v2")!.active = false;
    data.offers.push({
      ...data.offers.find((o) => o.id === "o_sysdesign_v2")!,
      id: "o_sysdesign_v3",
      version: 3,
      name: "System Design Pro v3",
      price: 449900,
      active: true,
    });

    const stored = await service.getMandate(result.mandateId);
    expect(stored!.snapshot.offerVersion).toBe(2);
    expect(stored!.snapshot.price).toBe(399900);
  });

  it("snapshot remains retrievable after the current offer becomes inactive", async () => {
    const { data, service } = setup();
    const result = await service.createMandateAuthorization({
      userId: "u1",
      offerId: "o_dsa_v1",
    });
    data.offers.find((o) => o.id === "o_dsa_v1")!.active = false;

    const stored = await service.getMandate(result.mandateId);
    expect(stored).not.toBeNull();
    expect(stored!.snapshot.offerVersion).toBe(1);
  });
});

describe("MandateService — idempotency", () => {
  it("repeated request with the same idempotency key returns the existing mandate", async () => {
    const { service } = setup();
    const a = await service.createMandateAuthorization({
      userId: "u1",
      offerId: "o_sysdesign_v2",
      idempotencyKey: "k1",
    });
    const b = await service.createMandateAuthorization({
      userId: "u1",
      offerId: "o_sysdesign_v2",
      idempotencyKey: "k1",
    });
    expect(b.mandateId).toBe(a.mandateId);
  });

  it("requests without an idempotency key create distinct mandates", async () => {
    const { service } = setup();
    const a = await service.createMandateAuthorization({
      userId: "u1",
      offerId: "o_sysdesign_v2",
    });
    const b = await service.createMandateAuthorization({
      userId: "u1",
      offerId: "o_sysdesign_v2",
    });
    expect(b.mandateId).not.toBe(a.mandateId);
  });
});

describe("MandateService — Razorpay separation", () => {
  it("stores a provided (test) razorpaySubscriptionId without any live call", async () => {
    const { service } = setup();
    const result = await service.createMandateAuthorization({
      userId: "u1",
      offerId: "o_sysdesign_v2",
      razorpaySubscriptionId: "sub_test_123",
    });
    expect(result.razorpaySubscriptionId).toBe("sub_test_123");
  });
});
