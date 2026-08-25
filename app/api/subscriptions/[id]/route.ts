import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Context = { params: Promise<{ id: string }> };

// GET /api/subscriptions/:id
// Returns the locally recorded subscription state. Frontend success state must
// never be treated as payment truth — this is the source of truth we maintain.
export async function GET(_req: Request, ctx: Context) {
  const { id } = await ctx.params;
  const record = await prisma.subscription.findUnique({ where: { id } });
  if (!record) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }
  return NextResponse.json(record);
}
