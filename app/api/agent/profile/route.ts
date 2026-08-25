import { NextResponse } from "next/server";
import { getMerchantOfferService } from "@/lib/merchant/service";

// GET /agent/profile
// Returns the active merchant profile for AI/buyer discovery. Intentionally
// limited: no secrets, no Razorpay internals, no implementation details.
export async function GET() {
  try {
    const profile = await getMerchantOfferService().getMerchantProfile();
    if (!profile) {
      return NextResponse.json(
        { error: "Merchant profile not available." },
        { status: 404 },
      );
    }
    return NextResponse.json(profile);
  } catch {
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
