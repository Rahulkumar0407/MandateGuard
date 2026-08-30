import { NextResponse } from "next/server";
import { getMerchantOfferService } from "@/lib/merchant/service";
import { serializeOfferToContract } from "@/lib/contract/serializer";

type Context = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/contracts/:id
 *
 * Public Machine-Readable Commerce Contract for a specific Offer.
 * Returns verified contract terms, structured commitments, and untrusted copy boundaries.
 */
export async function GET(_req: Request, ctx: Context) {
  try {
    const { id } = await ctx.params;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid offer identifier." },
        { status: 400 },
      );
    }

    const service = getMerchantOfferService();
    const offer = await service.getOffer(id);

    if (!offer) {
      return NextResponse.json(
        { error: `Offer '${id}' not found.` },
        { status: 404 },
      );
    }

    const contract = serializeOfferToContract(offer);

    return NextResponse.json(contract, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate contract for offer", details: String(error) },
      { status: 500 },
    );
  }
}
