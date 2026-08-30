import { NextResponse } from "next/server";
import { getMerchantIntelligenceService } from "@/lib/merchant-intelligence";

/**
 * POST /api/merchant/preview-improvement
 *
 * Previews the effect of proposed offer optimizations across buyer missions.
 * ANALYSIS-ONLY: Zero persistence or OfferVersion mutations.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.merchantId || !body.targetOfferId || !body.proposedOffer) {
      return NextResponse.json(
        { error: "merchantId, targetOfferId, and proposedOffer are required." },
        { status: 400 },
      );
    }

    const service = getMerchantIntelligenceService();
    const result = await service.previewImprovement({
      merchantId: body.merchantId,
      targetOfferId: body.targetOfferId,
      proposedOffer: body.proposedOffer,
      testMissions: body.testMissions,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to preview improvement.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
