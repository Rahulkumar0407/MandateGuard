export type RazorpayInterval = "daily" | "weekly" | "monthly" | "yearly";

export interface CreatePlanInput {
  name: string;
  amount: number; // amount in smallest currency unit (paise)
  currency?: string;
  interval: RazorpayInterval;
  intervalCount?: number;
  description?: string;
}

export interface CreateSubscriptionInput {
  planId: string;
  totalCount?: number;
  quantity?: number;
  customerNotify?: boolean;
  startAt?: number; // unix seconds
  notes?: Record<string, string | number>;
}

export interface RazorpayPlan {
  id: string;
  name: string;
  amount: number;
  currency: string;
  interval: RazorpayInterval;
  intervalCount: number;
}

export interface RazorpaySubscription {
  id: string;
  planId: string;
  status: string;
  shortUrl?: string;
  totalCount: number;
}

// Mirror of the Razorpay subscription status vocabulary we persist.
export type RazorpaySubscriptionStatus =
  | "created"
  | "authenticated"
  | "active"
  | "paused"
  | "cancelled"
  | "expired"
  | "halted";
