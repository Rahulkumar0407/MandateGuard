import crypto from "crypto";
import { env } from "@/lib/env";

// Verify the HMAC-SHA256 signature Razorpay sends on every webhook delivery.
// `rawBody` must be the EXACT request body string (no parsing/re-formatting
// before verification). The secret defaults to RAZORPAY_WEBHOOK_SECRET but can
// be injected for tests without relying on environment configuration.
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string = env.RAZORPAY_WEBHOOK_SECRET,
): boolean {
  if (!secret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured.");
  }
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(signature);
  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

// Build a stable, unique key for a webhook delivery so processing is
// idempotent. Razorpay does not include a global event id in the body, so we
// combine the event type with the most specific entity id available.
export function buildWebhookDedupKey(payload: {
  event: string;
  payload?: {
    payment?: { entity?: { id?: string } };
    subscription?: { entity?: { id?: string } };
  };
}): string {
  const paymentId = payload.payload?.payment?.entity?.id;
  const subscriptionId = payload.payload?.subscription?.entity?.id;
  return `${payload.event}:${paymentId ?? subscriptionId ?? "unknown"}`;
}
