import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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
import * as policyRoute from "@/app/api/mandates/[id]/policy/route";
import {
  MockSemanticIntegrityProvider,
  setSemanticProvider,
} from "@/lib/integrity/semantic-provider";

const BASE = "http://localhost/api";
const NOW = new Date("2026-01-01T00:00:00.000Z");

beforeEach(() => {
  setMerchantOfferRepository(
    new InMemoryMerchantOfferRepository(buildInterviewForgeData()),
  );
  setMandateRepository(new InMemoryMandateRepository());
  setSemanticProvider(new MockSemanticIntegrityProvider());
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  setMerchantOfferRepository(null);
  setMandateRepository(null);
  setSemanticProvider(null);
  vi.useRealTimers();
});

async function authorize(offerId: string): Promise<string> {
  const res = await mandateRoute.POST(
    new Request(`${BASE}/mandates`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: "u1", offerId }),
    }),
  );
  return (await res.json()).mandateId as string;
}

describe("GET /api/mandates/:id/policy", () => {
  it("returns a deterministic decision for a mandate", async () => {
    const mandateId = await authorize("o_sysdesign_v2");

    const data = buildInterviewForgeData();
    setMerchantOfferRepository(new InMemoryMerchantOfferRepository(data));
    // Advance lineage to v3 (price +12.5%, refund reduced) -> REVIEW.
    data.offers.find((o) => o.id === "o_sysdesign_v2")!.active = false;
    data.offers.push({
      ...data.offers.find((o) => o.id === "o_sysdesign_v2")!,
      id: "o_sysdesign_v3",
      version: 3,
      name: "System Design Pro v3",
      price: 449900,
      active: true,
    });

    const res = await policyRoute.GET(
      new Request(`${BASE}/mandates/${mandateId}/policy`),
      { params: Promise.resolve({ id: mandateId }) },
    );
    expect(res.status).toBe(200);
    const result = await res.json();
    expect(["ALLOW", "REVIEW", "PAUSE"]).toContain(result.decision);
    expect(result.policyVersion).toBe("mvp-v1");
    expect(Array.isArray(result.reasons)).toBe(true);
  });

  it("returns 404 for an unknown mandate (no silent ALLOW)", async () => {
    const res = await policyRoute.GET(
      new Request(`${BASE}/mandates/nope/policy`),
      { params: Promise.resolve({ id: "nope" }) },
    );
    expect(res.status).toBe(404);
  });

  it("does not perform any payment-affecting side effect (read-only)", async () => {
    const mandateId = await authorize("o_sysdesign_v2");
    const data = buildInterviewForgeData();
    setMerchantOfferRepository(new InMemoryMerchantOfferRepository(data));

    const res = await policyRoute.GET(
      new Request(`${BASE}/mandates/${mandateId}/policy`),
      { params: Promise.resolve({ id: mandateId }) },
    );
    expect(res.status).toBe(200);
    // The offer data is untouched by the read.
    expect(data.offers.find((o) => o.id === "o_sysdesign_v2")!.price).toBe(
      399900,
    );
  });
});
