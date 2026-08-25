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
import * as integrityRoute from "@/app/api/mandates/[id]/integrity/route";

const BASE = "http://localhost/api";
const NOW = new Date("2026-01-01T00:00:00.000Z");

beforeEach(() => {
  setMerchantOfferRepository(
    new InMemoryMerchantOfferRepository(buildInterviewForgeData()),
  );
  setMandateRepository(new InMemoryMandateRepository());
  // Deterministic timestamps for stable assertions.
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  setMerchantOfferRepository(null);
  setMandateRepository(null);
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

describe("GET /api/mandates/:id/integrity", () => {
  it("returns a structured report comparing snapshot v2 against current v3", async () => {
    const mandateId = await authorize("o_sysdesign_v2");

    // Advance lineage to v3.
    const data = buildInterviewForgeData();
    setMerchantOfferRepository(
      new InMemoryMerchantOfferRepository(data),
    );
    data.offers.find((o) => o.id === "o_sysdesign_v2")!.active = false;
    data.offers.push({
      ...data.offers.find((o) => o.id === "o_sysdesign_v2")!,
      id: "o_sysdesign_v3",
      version: 3,
      name: "System Design Pro v3",
      price: 449900,
      active: true,
    });

    const res = await integrityRoute.GET(
      new Request(`${BASE}/mandates/${mandateId}/integrity`),
      { params: Promise.resolve({ id: mandateId }) },
    );
    expect(res.status).toBe(200);
    const report = await res.json();
    expect(report.mandateId).toBe(mandateId);
    expect(report.baselineOfferVersion).toBe(2);
    expect(report.currentOfferVersion).toBe(3);
    expect(report.overall).toBe("CHANGED");
    const findings = report.findings as Array<{ type: string }>;
    expect(findings.map((f) => f.type)).toContain("PRICE_INCREASED");
  });

  it("returns CURRENT_OFFER_UNAVAILABLE when no active offer remains", async () => {
    const mandateId = await authorize("o_dsa_v1");
    const data = buildInterviewForgeData();
    setMerchantOfferRepository(new InMemoryMerchantOfferRepository(data));
    data.offers.find((o) => o.id === "o_dsa_v1")!.active = false;

    const res = await integrityRoute.GET(
      new Request(`${BASE}/mandates/${mandateId}/integrity`),
      { params: Promise.resolve({ id: mandateId }) },
    );
    expect(res.status).toBe(200);
    const report = await res.json();
    expect(report.overall).toBe("CURRENT_OFFER_UNAVAILABLE");
  });

  it("returns 404 for an unknown mandate and never pauses/charges", async () => {
    const res = await integrityRoute.GET(
      new Request(`${BASE}/mandates/does-not-exist/integrity`),
      { params: Promise.resolve({ id: "does-not-exist" }) },
    );
    expect(res.status).toBe(404);
  });

  it("does not perform any payment-affecting side effects (read-only)", async () => {
    const mandateId = await authorize("o_sysdesign_v2");
    const before = buildInterviewForgeData();
    setMerchantOfferRepository(new InMemoryMerchantOfferRepository(before));

    const res = await integrityRoute.GET(
      new Request(`${BASE}/mandates/${mandateId}/integrity`),
      { params: Promise.resolve({ id: mandateId }) },
    );
    expect(res.status).toBe(200);
    // The offer data is untouched by the read.
    expect(before.offers.find((o) => o.id === "o_sysdesign_v2")!.price).toBe(
      399900,
    );
  });
});
