import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, resolveSession } from "@/lib/auth/session";

export async function GET() {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  const result = await resolveSession(raw);
  return NextResponse.json(result, { status: 200 });
}
