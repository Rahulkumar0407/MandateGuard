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
// idempotent.
//
// Preferred key: the provider's canonical event id, delivered by Razorpay as the
// `X-Razorpay-Event-Id` header. It is globally unique per event and is the
// safest idempotency key for deduplication.
//
// Fallback key (when the provider event id is unavailable, e.g. an environment
// that does not forward the header): combine the event type with the most
// specific entity id available in the body. This preserves the previous
// behaviour exactly for those cases.
export function buildWebhookDedupKey(
  payload: {
    event: string;
    payload?: {
      payment?: { entity?: { id?: string } };
      subscription?: { entity?: { id?: string } };
    };
  },
  eventId?: string,
): string {
  if (eventId) return eventId;
  const paymentId = payload.payload?.payment?.entity?.id;
  const subscriptionId = payload.payload?.subscription?.entity?.id;
  return `${payload.event}:${paymentId ?? subscriptionId ?? "unknown"}`;
}
