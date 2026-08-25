// Central access to environment configuration.
// SECURITY: this module is only ever imported by server-side code (API routes
// and server lib). Never import it from a Client Component. The Razorpay
// secret and webhook secret must never reach the browser.
import "server-only";

export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ?? "",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ?? "",
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
};

export function hasRazorpayCredentials(): boolean {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

export function hasWebhookSecret(): boolean {
  return Boolean(env.RAZORPAY_WEBHOOK_SECRET);
}

export function hasDatabaseUrl(): boolean {
  return Boolean(env.DATABASE_URL);
}
