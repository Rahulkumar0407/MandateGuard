import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature, buildWebhookDedupKey } from "@/lib/razorpay/webhooks";
import { statusForEvent } from "@/lib/razorpay/status";
import { hasWebhookSecret } from "@/lib/env";

type WebhookPayload = {
  event?: string;
  payload?: {
    subscription?: { entity?: { id?: string; status?: string } };
    payment?: { entity?: { id?: string; status?: string } };
  };
};

// POST /api/webhooks/razorpay
// Receives Razorpay subscription lifecycle events. Signature-verified and
// idempotent (deduplicated via WebhookEvent record).
export async function POST(req: Request) {
  if (!hasWebhookSecret()) {
    return NextResponse.json(
      { error: "Webhook secret is not configured." },
      { status: 503 },
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  let payload: WebhookPayload;
  try {
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const eventType = typeof payload.event === "string" ? payload.event : "";
  const razorpaySubId = payload.payload?.subscription?.entity?.id;

  const dedupKey = buildWebhookDedupKey({ event: eventType, payload: payload.payload });

  const existing = await prisma.webhookEvent.findUnique({
    where: { razorpayEventId: dedupKey },
  });
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // The event determines the authoritative local status. A successful charge
  // (subscription.charged) returns null here, meaning the status is unchanged.
  const targetStatus = statusForEvent(eventType);

  await prisma.$transaction(async (tx) => {
    if (razorpaySubId && targetStatus) {
      await tx.subscription.updateMany({
        where: { razorpaySubscriptionId: razorpaySubId },
        data: { status: targetStatus },
      });
    }
    const local = razorpaySubId
      ? await tx.subscription.findFirst({
          where: { razorpaySubscriptionId: razorpaySubId },
          select: { id: true },
        })
      : null;

    await tx.webhookEvent.create({
      data: {
        razorpayEventId: dedupKey,
        eventType,
        subscriptionId: local?.id ?? null,
        payload,
      },
    });
  });

  return NextResponse.json({ received: true });
}
