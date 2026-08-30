import { NextResponse } from "next/server";
import { MerchantOfferOptimizationService } from "@/lib/merchant-intelligence/optimization-service";
import { getMerchantOfferService } from "@/lib/merchant/service";

/**
 * GET /api/merchant/optimization
 *
 * Query params: ?offerId=...
 * Generates an end-to-end optimization plan for an authoritative OfferVersion:
 * 1. Grounded Diagnosis (Buyer needs vs Current terms vs AI verification)
 * 2. Structured Proposal (Explicit Changed vs Unchanged terms)
 * 3. Closed-Loop Gold Benchmark Simulation (+N recovered missions)
 * 4. Contract Diff & Version History
 *
 * ANALYSIS ONLY: Zero mutations or provider actions.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const offerIdParam = searchParams.get("offerId");

    const merchantService = getMerchantOfferService();
    let targetOfferId = offerIdParam;

    if (!targetOfferId) {
      const products = await merchantService.listProducts();
      for (const p of products) {
        for (const o of p.offers) {
          const full = await merchantService.getOffer(o.id);
          if (full && full.availability === "ACTIVE" && full.isConfirmedByMerchant) {
            targetOfferId = full.id;
            break;
          }
        }
        if (targetOfferId) break;
      }
    }

    if (!targetOfferId) {
      return NextResponse.json(
        { error: "No active merchant offers available for optimization." },
        { status: 404 },
      );
    }

    const optimizationService = new MerchantOfferOptimizationService(merchantService);
    const plan = await optimizationService.getOfferOptimizationPlan(targetOfferId);

    return NextResponse.json(plan, { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal error generating optimization plan";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
