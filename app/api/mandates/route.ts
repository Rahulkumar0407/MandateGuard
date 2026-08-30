import { NextResponse } from "next/server";
import { z } from "zod";
import { getMandateService, MandateError } from "@/lib/mandate/service";
import { prisma } from "@/lib/db";

// GET /api/mandates
// Lists recently authorized mandates for dashboard overviews
export async function GET() {
  try {
    const mandates = await prisma.mandate.findMany({
      include: { snapshot: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({
      mandates: mandates.map((m) => ({
        id: m.id,
        status: m.status,
        userId: m.userId,
        offerId: m.offerId,
        createdAt: m.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ mandates: [] });
  }
}

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
