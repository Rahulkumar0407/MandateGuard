import { NextResponse } from "next/server";
import { getMerchantIntelligenceService } from "@/lib/merchant-intelligence";

/**
 * GET /api/merchant/revenue-opportunities
 *
 * Returns evidence-backed revenue opportunities for the current merchant catalog.
 * READ-ONLY: Zero mutations, zero auto-campaign execution, zero payment actions.
 */
export async function GET() {
  try {
    const service = getMerchantIntelligenceService();
    const report = await service.getRevenueOpportunities();
    return NextResponse.json(report, { status: 200 });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to calculate revenue opportunities.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/merchant/revenue-opportunities
 *
 * Allows querying opportunities with optional mission evaluations or historical intents.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const service = getMerchantIntelligenceService();
    const report = await service.getRevenueOpportunities({
      missionEvaluations: body.missionEvaluations,
      historicalIntents: body.historicalIntents,
    });
    return NextResponse.json(report, { status: 200 });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to calculate revenue opportunities.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
