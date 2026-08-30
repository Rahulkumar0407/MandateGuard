import { NextResponse } from "next/server";
import { MerchantGrowthOpportunityService } from "@/lib/merchant-intelligence/growth-opportunity-service";
import { getMerchantOfferService } from "@/lib/merchant/service";

/**
 * GET /api/merchant/growth-opportunity
 *
 * Discovers empirical revenue opportunities from buyer demand and benchmark rejections.
 * Evaluates closed-loop simulation on the Gold Benchmark cohort.
 *
 * ANALYSIS ONLY: Zero mutations or provider calls.
 */
export async function GET() {
  try {
    const merchantService = getMerchantOfferService();
    const opportunityService = new MerchantGrowthOpportunityService(merchantService);

    const report = await opportunityService.getTopGrowthOpportunity();
    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Internal error evaluating growth opportunity";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
