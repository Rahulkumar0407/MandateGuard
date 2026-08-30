import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  parseSessionCookie,
  serializeSession,
} from "@/lib/auth/session";

// Marks the active session's onboarding as complete (server-side). Used after
// the merchant finishes the progressive setup flow.
export async function POST() {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  const data = parseSessionCookie(raw);
  if (!data) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const updated = serializeSession({ ...data, onboardingComplete: true });
  (await cookies()).set(SESSION_COOKIE, updated, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return NextResponse.json({ ok: true }, { status: 200 });
}
