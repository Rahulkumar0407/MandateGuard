import { getRazorpay } from "./client";
import type {
  CreatePlanInput,
  CreateSubscriptionInput,
  RazorpayPlan,
  RazorpaySubscription,
} from "./types";

// --- Plan ---

export async function createPlan(input: CreatePlanInput): Promise<RazorpayPlan> {
  const razorpay = getRazorpay();
  const currency = input.currency ?? "INR";
  const intervalCount = input.intervalCount ?? 1;

  const plan = await razorpay.plans.create({
    period: input.interval,
    interval: intervalCount,
    item: {
      name: input.name,
      amount: input.amount,
      currency,
      description: input.description ?? input.name,
    },
  });

  return {
    id: plan.id,
    name: input.name,
    amount: input.amount,
    currency,
    interval: input.interval,
    intervalCount,
  };
}

// --- Subscription ---

export async function createSubscription(
  input: CreateSubscriptionInput,
): Promise<RazorpaySubscription> {
  const razorpay = getRazorpay();
  const totalCount = input.totalCount ?? 12;

  const sub = await razorpay.subscriptions.create({
    plan_id: input.planId,
    total_count: totalCount,
    quantity: input.quantity ?? 1,
    customer_notify: input.customerNotify ?? 1,
    ...(input.startAt ? { start_at: input.startAt } : {}),
    ...(input.notes ? { notes: input.notes } : {}),
  });

  return {
    id: sub.id,
    planId: input.planId,
    status: sub.status,
    shortUrl: sub.short_url,
    totalCount,
  };
}

export async function getSubscription(subscriptionId: string): Promise<RazorpaySubscription> {
  const razorpay = getRazorpay();
  const sub = await razorpay.subscriptions.fetch(subscriptionId);

  return {
    id: sub.id,
    planId: sub.plan_id,
    status: sub.status,
    shortUrl: sub.short_url,
    totalCount: sub.total_count,
  };
}

export async function cancelSubscription(subscriptionId: string): Promise<RazorpaySubscription> {
  const razorpay = getRazorpay();
  // Immediately terminate the subscription (cancelAtCycleEnd = false). This is
  // the correct compensation for an orphaned, never-authenticated subscription:
  // it ends the provider billing relationship instead of merely suspending it.
  const sub = await razorpay.subscriptions.cancel(subscriptionId, false);

  return {
    id: sub.id,
    planId: sub.plan_id,
    status: sub.status,
    shortUrl: sub.short_url,
    totalCount: sub.total_count,
  };
}

export async function pauseSubscription(subscriptionId: string): Promise<RazorpaySubscription> {
  const razorpay = getRazorpay();
  const sub = await razorpay.subscriptions.pause(subscriptionId, { pause_at: "now" });

  return {
    id: sub.id,
    planId: sub.plan_id,
    status: sub.status,
    shortUrl: sub.short_url,
    totalCount: sub.total_count,
  };
}

export async function resumeSubscription(subscriptionId: string): Promise<RazorpaySubscription> {
  const razorpay = getRazorpay();
  const sub = await razorpay.subscriptions.resume(subscriptionId, { resume_at: "now" });

  return {
    id: sub.id,
    planId: sub.plan_id,
    status: sub.status,
    shortUrl: sub.short_url,
    totalCount: sub.total_count,
  };
}
