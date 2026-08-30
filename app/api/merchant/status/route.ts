import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  resolveSession,
} from "@/lib/auth/session";

// Server-derived merchant status for the dashboard entry state. The merchant is
// resolved strictly server-side; the browser never supplies a merchantId.
export async function GET() {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  const result = await resolveSession(raw);
  return NextResponse.json(result, { status: 200 });
}
