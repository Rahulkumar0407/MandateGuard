/**
 * API Route: /api/merchant/buyability
 *
 * GET: Runs the versioned 100-mission benchmark against the merchant's active catalog.
 * POST: Runs the closed-loop experiment comparing before/after on the exact same benchmark.
 *
 * Invariant: All operations are analysis-only (zero persistence mutations).
 */

import { NextResponse } from "next/server";
import { getMerchantIntelligenceService } from "@/lib/merchant-intelligence";
import type { OfferDetailDTO } from "@/lib/merchant/types";

export async function GET() {
  try {
    const service = getMerchantIntelligenceService();
    const report = await service.runBuyabilityBenchmark();
    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal error running Buyability Benchmark";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { targetOfferId, proposedOffer } = body as {
      targetOfferId: string;
      proposedOffer: Partial<OfferDetailDTO>;
    };

    if (!targetOfferId || !proposedOffer) {
      return NextResponse.json(
        { error: "targetOfferId and proposedOffer are required" },
        { status: 400 },
      );
    }

    const service = getMerchantIntelligenceService();
    const experiment = await service.runBuyabilityExperiment(targetOfferId, proposedOffer);
    return NextResponse.json(experiment, { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal error running Buyability Experiment";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
