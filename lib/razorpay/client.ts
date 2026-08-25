import Razorpay from "razorpay";
import { env, hasRazorpayCredentials } from "@/lib/env";

let client: Razorpay | null = null;

// Lazily construct a single Razorpay client. Raw SDK access is isolated here
// so the rest of the app depends only on the typed adapter in this folder.
export function getRazorpay(): Razorpay {
  if (!client) {
    if (!hasRazorpayCredentials()) {
      throw new Error(
        "Razorpay credentials are not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).",
      );
    }
    client = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
  return client;
}
