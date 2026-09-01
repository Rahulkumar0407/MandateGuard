import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  serializeSession,
  parseSessionCookie,
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

// Server-side auth with password validation.
// - Wrong password for the demo credential must fail (no session).
// - Empty password must fail.
// - Google method is demo stub and bypasses password (labeled in UI).
// On re-login, preserves the existing onboardingComplete flag so completed
// users are not kicked back to onboarding on every sign-in.
const DEMO_CREDENTIALS: Record<string, string> = {
  "rahulbornking@gmail.com": "12345678",
};

export async function POST(req: Request) {
  let body: { method?: string; email?: string; name?: string; password?: string } = {};
  try {
    body = await req.json();
  } catch {
    // ignore malformed body — fall back to sensible defaults
  }

  const method = body.method === "google" ? "google" : "email";
  const email = (body.email || "").trim().toLowerCase();
  const name = (body.name || email.split("@")[0] || "Merchant").trim();
  const password = typeof body.password === "string" ? body.password : "";

  // Email required
  if (!email) {
    return NextResponse.json({ error: "Enter your email address." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  // Password validation on server (except Google demo stub)
  if (method !== "google") {
    if (!password) {
      return NextResponse.json({ error: "Enter your password." }, { status: 401 });
    }
    const expected = DEMO_CREDENTIALS[email];
    if (expected !== undefined) {
      if (password !== expected) {
        return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
      }
    } else {
      // For non-demo accounts, require minimum length (prevents empty/weak)
      if (password.length < 6) {
        return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
      }
    }
  }

  const profile = await getMerchantOfferService().getMerchantProfile();
  if (!profile) {
    return NextResponse.json({ error: "No merchant available." }, { status: 404 });
  }

  const existingSession = parseSessionCookie((await cookies()).get(SESSION_COOKIE)?.value);
  const wasOnboardingComplete = existingSession?.onboardingComplete ?? false;

  const session = serializeSession({
    merchantId: profile.merchant.id,
    name,
    email,
    isSample: false,
    onboardingComplete: wasOnboardingComplete,
  });

  (await cookies()).set(SESSION_COOKIE, session, cookieOptions());
  return NextResponse.json({ ok: true, method }, { status: 200 });
}
