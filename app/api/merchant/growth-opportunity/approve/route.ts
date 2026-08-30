import { NextResponse } from "next/server";
import { MerchantGrowthOpportunityService } from "@/lib/merchant-intelligence/growth-opportunity-service";
import { getMerchantOfferService } from "@/lib/merchant/service";
import { StaleOfferVersionError } from "@/lib/merchant-intelligence/optimization-service";

/**
 * POST /api/merchant/growth-opportunity/approve
 *
 * Explicit Merchant Approval Endpoint:
 * 1. Requires merchant approval to publish the opportunity offer.
 * 2. Creates and publishes a new immutable OfferVersion (v_next) with new SHA-256 fingerprint.
 * 3. Preserves historical versions immutably.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const { productId, customPricePaise, proposedChanges } = body || {};

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required to approve and publish an opportunity package." },
        { status: 400 },
      );
    }

    const merchantService = getMerchantOfferService();
    const opportunityService = new MerchantGrowthOpportunityService(merchantService);

    const newOffer = await opportunityService.approveOpportunityAndPublish({
      productId,
      customPricePaise: customPricePaise ? Number(customPricePaise) : undefined,
      proposedChanges,
    });

    return NextResponse.json(
      {
        status: "OPPORTUNITY_APPROVED_AND_PUBLISHED",
        message: `Successfully created and published new offer '${newOffer.name}' (v${newOffer.version}).`,
        newOffer,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof StaleOfferVersionError) {
      return NextResponse.json({ error: error.message, code: "STALE_VERSION" }, { status: 409 });
    }
    const msg =
      error instanceof Error ? error.message : "Internal error approving opportunity offer";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
