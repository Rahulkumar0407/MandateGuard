import { NextResponse } from "next/server";
import { z } from "zod";
import { getMandateService, MandateError } from "@/lib/mandate/service";

// POST /api/mandates
// Explicit user authorization. The request only supplies intent (which offer
// the user selected); the server loads the current Offer and freezes an
// immutable AuthorizedOfferSnapshot. No Razorpay call is made here.
const BodySchema = z.object({
  userId: z.string().trim().min(1).max(100),
  offerId: z.string().trim().min(1).max(100),
  razorpaySubscriptionId: z.string().trim().min(1).max(200).optional(),
  idempotencyKey: z.string().trim().min(1).max(200).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request." },
        { status: 400 },
      );
    }
    const data = parsed.data;

    const result = await getMandateService().createMandateAuthorization({
      userId: data.userId,
      offerId: data.offerId,
      razorpaySubscriptionId: data.razorpaySubscriptionId,
      idempotencyKey: data.idempotencyKey,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof MandateError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
