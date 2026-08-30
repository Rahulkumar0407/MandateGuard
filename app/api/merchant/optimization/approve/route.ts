import { NextResponse } from "next/server";
import {
  MerchantOfferOptimizationService,
  StaleOfferVersionError,
} from "@/lib/merchant-intelligence/optimization-service";
import { getMerchantOfferService } from "@/lib/merchant/service";

/**
 * POST /api/merchant/optimization/approve
 *
 * Explicit Merchant Approval Endpoint:
 * 1. Requires merchant approval to publish.
 * 2. Checks expected base version and hash (stale-state defense).
 * 3. Creates and publishes a new immutable OfferVersion (v_next) with new SHA-256 fingerprint.
 * 4. Preserves historical versions immutably.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      offerId,
      expectedVersion,
      expectedVersionHash,
      proposedChanges,
    } = body;

    if (!offerId || expectedVersion == null) {
      return NextResponse.json(
        { error: "offerId and expectedVersion are required for approval." },
        { status: 400 },
      );
    }

    const merchantService = getMerchantOfferService();
    const optimizationService = new MerchantOfferOptimizationService(merchantService);

    const newOffer = await optimizationService.approveAndPublishOfferVersion({
      offerId,
      expectedVersion: Number(expectedVersion),
      expectedVersionHash: expectedVersionHash || null,
      proposedChanges,
    });

    return NextResponse.json(
      {
        status: "APPROVED_AND_PUBLISHED",
        message: `Successfully approved and published new OfferVersion v${newOffer.version}.`,
        newOffer,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof StaleOfferVersionError) {
      return NextResponse.json({ error: error.message, code: "STALE_VERSION" }, { status: 409 });
    }
    const msg = error instanceof Error ? error.message : "Internal error approving offer version";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
