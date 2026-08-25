import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getGateway } from "@/lib/razorpay/gateway";
import { localStatusFromRazorpay } from "@/lib/razorpay/status";
import { hasRazorpayCredentials } from "@/lib/env";

const CreateSubscriptionSchema = z.object({
  planName: z.string().min(1),
  amount: z.number().int().positive(),
  currency: z.string().length(3).default("INR"),
  interval: z.enum(["daily", "weekly", "monthly", "yearly"]).default("monthly"),
  intervalCount: z.number().int().positive().default(1),
  totalCount: z.number().int().positive().default(12),
  customerEmail: z.string().email().optional(),
  customerContact: z.string().optional(),
});

// POST /api/subscriptions
// Creates a Razorpay Plan + Subscription and records the authorized snapshot
// in our database. This is the entry point of the M0 subscription skeleton.
export async function POST(req: Request) {
  if (!hasRazorpayCredentials()) {
    return NextResponse.json(
      { error: "Razorpay credentials are not configured." },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const gateway = getGateway();
  let createdSubscriptionId: string | null = null;
  try {
    const plan = await gateway.createPlan({
      name: data.planName,
      amount: data.amount,
      currency: data.currency,
      interval: data.interval,
      intervalCount: data.intervalCount,
    });

    const subscription = await gateway.createSubscription({
      planId: plan.id,
      totalCount: data.totalCount,
      customerNotify: true,
      notes: { source: "mandateguard-m0" },
    });
    createdSubscriptionId = subscription.id;

    const record = await prisma.subscription.create({
      data: {
        razorpayPlanId: plan.id,
        razorpaySubscriptionId: subscription.id,
        planName: data.planName,
        amount: data.amount,
        currency: data.currency,
        interval: data.interval,
        intervalCount: data.intervalCount,
        totalCount: data.totalCount,
        // Persist our canonical local status, never the raw Razorpay string.
        status: localStatusFromRazorpay(subscription.status),
        customerEmail: data.customerEmail,
        customerContact: data.customerContact,
        shortUrl: subscription.shortUrl,
      },
    });

    return NextResponse.json(
      {
        id: record.id,
        razorpaySubscriptionId: record.razorpaySubscriptionId,
        status: record.status,
        shortUrl: record.shortUrl,
      },
      { status: 201 },
    );
  } catch {
    if (createdSubscriptionId) {
      console.error(
        `[Subscription Provisioning Failure] Local DB insert failed after Razorpay subscription creation. Orphaned Razorpay subscription ID: ${createdSubscriptionId}`,
      );
      try {
        await gateway.cancelSubscription(createdSubscriptionId);
        console.info(
          `[Subscription Compensation Succeeded] Cancelled orphaned Razorpay subscription ID: ${createdSubscriptionId}`,
        );
      } catch {
        console.error(
          `[Subscription Compensation Failed] Failed to cancel orphaned Razorpay subscription ID: ${createdSubscriptionId}. Manual reconciliation may be required.`,
        );
      }
    }
    // Do not leak raw SDK/provider errors (they may contain sensitive data).
    return NextResponse.json(
      { error: "Failed to create subscription with Razorpay." },
      { status: 502 },
    );
  }
}
