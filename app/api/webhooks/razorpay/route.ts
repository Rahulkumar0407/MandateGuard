import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature, buildWebhookDedupKey } from "@/lib/razorpay/webhooks";
import { statusForEvent } from "@/lib/razorpay/status";
import { canApplyWebhookStatus } from "@/lib/subscription/state";
import { hasWebhookSecret } from "@/lib/env";

type WebhookPayload = {
  event?: string;
  payload?: {
    subscription?: { entity?: { id?: string; status?: string } };
    payment?: { entity?: { id?: string; status?: string } };
  };
};

// POST /api/webhooks/razorpay
// Receives Razorpay subscription lifecycle events. Signature-verified,
// out-of-order protected, and idempotent (deduplicated via WebhookEvent record).
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

  // Razorpay sends a canonical, globally-unique event id in the
  // `X-Razorpay-Event-Id` header. Prefer it as the deduplication key; fall
  // back to the body-derived key when the header is absent.
  const providerEventId = req.headers.get("x-razorpay-event-id") ?? undefined;
  const dedupKey = buildWebhookDedupKey(
    { event: eventType, payload: payload.payload },
    providerEventId,
  );

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
    const local = razorpaySubId
      ? await tx.subscription.findFirst({
          where: { razorpaySubscriptionId: razorpaySubId },
          select: { id: true, status: true },
        })
      : null;

    if (razorpaySubId && targetStatus) {
      if (!local || canApplyWebhookStatus(local.status, targetStatus)) {
        await tx.subscription.updateMany({
          where: { razorpaySubscriptionId: razorpaySubId },
          data: { status: targetStatus },
        });
        console.log(
          JSON.stringify({
            level: "info",
            event: "WEBHOOK_STATUS_TRANSITION",
            eventType,
            subscriptionId: local?.id,
            razorpaySubscriptionId: razorpaySubId,
            fromStatus: local?.status ?? "NONE",
            toStatus: targetStatus,
            timestamp: new Date().toISOString(),
          }),
        );
      } else {
        console.log(
          JSON.stringify({
            level: "warn",
            event: "OUT_OF_ORDER_WEBHOOK_IGNORED",
            eventType,
            subscriptionId: local?.id,
            razorpaySubscriptionId: razorpaySubId,
            currentStatus: local.status,
            ignoredTargetStatus: targetStatus,
            timestamp: new Date().toISOString(),
          }),
        );
      }
    }

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
