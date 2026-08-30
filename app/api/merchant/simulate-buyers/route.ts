import { NextResponse } from "next/server";
import { getMerchantIntelligenceService } from "@/lib/merchant-intelligence";

/**
 * POST /api/merchant/simulate-buyers
 *
 * Runs representative "Shop My Business" buyer missions against catalog.
 * READ-ONLY: Analysis-only, zero mutations.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const service = getMerchantIntelligenceService();
    const merchantId = body.merchantId || "m_interviewforge";
    const result = await service.runShopMyBusiness(merchantId, body.customMissions);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to run buyer simulations.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
