import { NextResponse } from "next/server";
import { z } from "zod";
import { getMerchantOfferService } from "@/lib/merchant/service";

// GET /agent/offers/:offerId
// Returns a normalized offer DTO (database shape is an implementation detail).
const IdSchema = z.string().trim().min(1).max(100);

type Context = { params: Promise<{ offerId: string }> };

export async function GET(_req: Request, ctx: Context) {
  try {
    const { offerId } = await ctx.params;
    const parsed = IdSchema.safeParse(offerId);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid offer id." }, { status: 400 });
    }
    const offer = await getMerchantOfferService().getOffer(parsed.data);
    if (!offer) {
      return NextResponse.json({ error: "Offer not found." }, { status: 404 });
    }
    return NextResponse.json(offer);
  } catch {
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
