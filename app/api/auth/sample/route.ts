import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  serializeSession,
} from "@/lib/auth/session";
import { getMerchantOfferService } from "@/lib/merchant/service";

// "Explore sample business" — a clearly-marked sandbox session for judges.
// Resolves the same active merchant server-side but flags the session as sample
// so the UI can separate it from a real merchant's workspace.
export async function POST() {
  const profile = await getMerchantOfferService().getMerchantProfile();
  if (!profile) {
    return NextResponse.json({ error: "No merchant available." }, { status: 404 });
  }

  const session = serializeSession({
    merchantId: profile.merchant.id,
    name: "Sample Business",
    email: "sample@mandateguard.dev",
    isSample: true,
    onboardingComplete: true,
  });

  (await cookies()).set(SESSION_COOKIE, session, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return NextResponse.json({ ok: true, isSample: true }, { status: 200 });
}
