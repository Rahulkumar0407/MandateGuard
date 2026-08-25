import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => {
  const prisma = {
    merchant: {
      upsert: vi.fn().mockResolvedValue({ id: "m_interviewforge" }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    user: {
      upsert: vi.fn().mockResolvedValue({ id: "buyer_demo_user" }),
    },
    product: {
      upsert: vi.fn().mockResolvedValue({ id: "p_sysdesign" }),
    },
    offer: {
      upsert: vi.fn().mockResolvedValue({ id: "o_sysdesign_v1" }),
      findUnique: vi.fn().mockResolvedValue({
        id: "o_sysdesign_v1",
        productId: "p_sysdesign",
        version: 1,
        name: "System Design Pro v1",
        description: "Comprehensive system design mastery with 1:1 mentor feedback.",
        price: 349900,
        currency: "INR",
        billingInterval: "monthly",
        duration: 180,
        entitlementKeys: ["sysdesign_core", "sysdesign_mocks", "mentor_feedback_weekly", "community_access"],
        refundWindowDays: 30,
        supportTerms: "Weekly 1:1 mentor feedback via video with 24-hour turnaround.",
        semanticTerms: "Dedicated senior engineer mentor assigned for 180 days.",
        active: true,
      }),
      findMany: vi.fn().mockResolvedValue([
        { version: 1 },
        { version: 2 },
      ]),
      create: vi.fn().mockImplementation((args: { data: { version: number } }) =>
        Promise.resolve({ id: `o_p_sysdesign_v${args.data.version}`, ...args.data }),
      ),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      update: vi.fn().mockResolvedValue({ id: "o_sysdesign_v1", active: true }),
    },
    authorizedOfferSnapshot: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
  return { prisma };
});

import { POST as seedPOST } from "@/app/api/demo/seed/route";
import { POST as mutatePOST } from "@/app/api/demo/mutate-offer/route";
import { prisma } from "@/lib/db";

const db = prisma as unknown as {
  merchant: { upsert: ReturnType<typeof vi.fn> };
  product: { upsert: ReturnType<typeof vi.fn> };
  offer: {
    upsert: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  authorizedOfferSnapshot: Record<string, ReturnType<typeof vi.fn>>;
};

function jsonReq(body: unknown): Request {
  return new Request("http://localhost/api/demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("M8-A Demo Console Backend API", () => {
  it("POST /api/demo/seed seeds demo merchant, products, and offers", async () => {
    const res = await seedPOST();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(db.merchant.upsert).toHaveBeenCalled();
    expect(db.product.upsert).toHaveBeenCalled();
    expect(db.offer.upsert).toHaveBeenCalled();
  });

  it("POST /api/demo/mutate-offer creates a NEW version 3 (not overwriting v1/v2)", async () => {
    const res = await mutatePOST(
      jsonReq({ productId: "p_sysdesign", scenario: "rogue_full" }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.scenario).toBe("rogue_full");
    expect(data.currentVersion).toBe(3);

    // New offer version created with mutated values, leaving v1/v2 intact.
    expect(db.offer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          productId: "p_sysdesign",
          version: 3,
          price: 412882, // 349900 * 1.18
          supportTerms: expect.stringContaining("Community Discord"),
        }),
      }),
    );
    // No existing version is overwritten via upsert.
    expect(db.offer.upsert).not.toHaveBeenCalled();
    // Newly published version becomes the only active offer.
    expect(db.offer.updateMany).toHaveBeenCalledWith({
      where: { productId: "p_sysdesign", NOT: { id: expect.any(String) } },
      data: { active: false },
    });
  });

  it("POST /api/demo/mutate-offer mints increasing versions on repeated mutations", async () => {
    db.offer.findMany
      .mockResolvedValueOnce([{ version: 1 }, { version: 2 }]) // -> v3
      .mockResolvedValueOnce([{ version: 1 }, { version: 2 }, { version: 3 }]) // -> v4
      .mockResolvedValueOnce([{ version: 1 }, { version: 2 }, { version: 3 }, { version: 4 }]); // -> v5

    for (const expected of [3, 4, 5]) {
      const res = await mutatePOST(
        jsonReq({ productId: "p_sysdesign", scenario: "rogue_full" }),
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.currentVersion).toBe(expected);
    }
    expect(db.offer.create).toHaveBeenCalledTimes(3);
  });

  it("POST /api/demo/mutate-offer does not touch AuthorizedOfferSnapshot", async () => {
    const res = await mutatePOST(
      jsonReq({ productId: "p_sysdesign", scenario: "rogue_full" }),
    );
    expect(res.status).toBe(200);
    expect(db.authorizedOfferSnapshot.findUnique).not.toHaveBeenCalled();
    expect(db.authorizedOfferSnapshot.create).not.toHaveBeenCalled();
    expect(db.authorizedOfferSnapshot.update).not.toHaveBeenCalled();
  });

  it("POST /api/demo/mutate-offer reset restores seeded v2 (not v1)", async () => {
    const res = await mutatePOST(
      jsonReq({ productId: "p_sysdesign", scenario: "reset" }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.scenario).toBe("reset");
    expect(data.currentVersion).toBe(2);

    expect(db.offer.updateMany).toHaveBeenCalledWith({
      where: { productId: "p_sysdesign", version: { gt: 2 } },
      data: { active: false },
    });
    expect(db.offer.updateMany).toHaveBeenCalledWith({
      where: { productId: "p_sysdesign", version: 2 },
      data: { active: true },
    });
  });

  it("POST /api/demo/mutate-offer allows the demo product", async () => {
    const res = await mutatePOST(
      jsonReq({ productId: "p_sysdesign", scenario: "rogue_full" }),
    );
    expect(res.status).toBe(200);
  });

  it("POST /api/demo/mutate-offer rejects unknown product ids with 400", async () => {
    const res = await mutatePOST(
      jsonReq({ productId: "p_evil_arbitrary", scenario: "rogue_full" }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Unknown demo product.");
    // Rejected before any offer lookup/mutation.
    expect(db.offer.findUnique).not.toHaveBeenCalled();
    expect(db.offer.create).not.toHaveBeenCalled();
  });

  it("POST /api/demo/mutate-offer rejects invalid scenario with 400", async () => {
    const res = await mutatePOST(
      jsonReq({ productId: "p_sysdesign", scenario: "invalid_scenario" }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid mutation request.");
  });

  it("POST /api/demo/mutate-offer returns 404 if base offer v1 is missing", async () => {
    db.offer.findUnique.mockResolvedValueOnce(null);
    const res = await mutatePOST(
      jsonReq({ productId: "p_sysdesign", scenario: "rogue_full" }),
    );
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("Base offer v1 not found. Run seed first.");
  });
});
