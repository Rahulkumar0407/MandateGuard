import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGateway } from "@/lib/razorpay/gateway";
import { evaluateResume } from "@/lib/subscription/state";
import { localStatusFromRazorpay } from "@/lib/razorpay/status";
import { hasRazorpayCredentials } from "@/lib/env";

type Context = { params: Promise<{ id: string }> };

// POST /api/subscriptions/:id/resume
// Resumes a paused Razorpay subscription and reflects the status in DB.
// Resume is only issued when the local subscription is PAUSED.
export async function POST(_req: Request, ctx: Context) {
  if (!hasRazorpayCredentials()) {
    return NextResponse.json(
      { error: "Razorpay credentials are not configured." },
      { status: 503 },
    );
  }

  const { id } = await ctx.params;
  const record = await prisma.subscription.findUnique({ where: { id } });
  if (!record || !record.razorpaySubscriptionId) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  const evaluation = evaluateResume(record.status);
  if (!evaluation.allowed) {
    return NextResponse.json({ error: evaluation.reason }, { status: 409 });
  }

  const gateway = getGateway();
  try {
    const result = await gateway.resumeSubscription(record.razorpaySubscriptionId);
    const updated = await prisma.subscription.update({
      where: { id },
      data: { status: localStatusFromRazorpay(result.status) },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to resume subscription with Razorpay." },
      { status: 502 },
    );
  }
}
