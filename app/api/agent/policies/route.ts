import { NextResponse } from "next/server";
import { getMerchantOfferService } from "@/lib/merchant/service";

// GET /agent/policies
// Returns merchant commerce policies relevant to a purchasing decision.
// MVP deterministic representation (not yet persisted as separate entities).
export async function GET() {
  try {
    const policies = getMerchantOfferService().getPolicies();
    return NextResponse.json(policies);
  } catch {
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
