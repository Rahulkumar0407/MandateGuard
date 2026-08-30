import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  serializeSession,
} from "@/lib/auth/session";
import { getMerchantOfferService } from "@/lib/merchant/service";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

// Lightweight auth. Resolves the merchant SERVER-SIDE from the active merchant
// record; a client-supplied merchantId is never trusted.
export async function POST(req: Request) {
  let body: { method?: string; email?: string; name?: string } = {};
  try {
    body = await req.json();
  } catch {
    // ignore malformed body — fall back to sensible defaults
  }

  const method = body.method === "google" ? "google" : "email";
  const email = (body.email || "merchant@interviewforge.ai").trim().toLowerCase();
  const name = (body.name || email.split("@")[0] || "Merchant").trim();

  const profile = await getMerchantOfferService().getMerchantProfile();
  if (!profile) {
    return NextResponse.json({ error: "No merchant available." }, { status: 404 });
  }

  const session = serializeSession({
    merchantId: profile.merchant.id,
    name,
    email,
    isSample: false,
    onboardingComplete: false,
  });

  (await cookies()).set(SESSION_COOKIE, session, cookieOptions());
  return NextResponse.json({ ok: true, method }, { status: 200 });
}
