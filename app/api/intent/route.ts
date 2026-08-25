import { NextResponse } from "next/server";
import { z } from "zod";
import { getIntentEngine } from "@/lib/agent/intent";
import { recommend } from "@/lib/agent/recommendation";
import { getMerchantOfferService } from "@/lib/merchant/service";

// POST /api/intent
// Buyer-facing intent + recommendation endpoint. This is a RECOMMENDATION
// engine ONLY. It never creates subscriptions, charges, or touches Razorpay.
const BodySchema = z.object({ message: z.string().trim().min(1).max(2000) });

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const engine = getIntentEngine();
    let intent;
    try {
      intent = await engine.extractIntent(parsed.data.message);
    } catch {
      // Structured-output failure: controlled error, never purchase.
      return NextResponse.json(
        { error: "Could not understand the request." },
        { status: 400 },
      );
    }

    const offers = await getMerchantOfferService().listOffers();
    const recommendation = recommend(intent, offers);

    return NextResponse.json({ intent, recommendation });
  } catch {
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
