import { NextResponse } from "next/server";
import { getMerchantIntelligenceService } from "@/lib/merchant-intelligence";

/**
 * GET /api/merchant/ai-readiness
 *
 * Returns 5-dimensional AI Buyer Readiness, prioritized diagnoses, and recommendations.
 * READ-ONLY: Zero mutations or provider calls.
 */
export async function GET() {
  try {
    const service = getMerchantIntelligenceService();
    const readiness = await service.getAIReadiness();
    return NextResponse.json(readiness, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to calculate AI buyer readiness.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
