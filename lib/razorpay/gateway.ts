import {
  createPlan as realCreatePlan,
  createSubscription as realCreateSubscription,
  getSubscription as realGetSubscription,
  pauseSubscription as realPauseSubscription,
  resumeSubscription as realResumeSubscription,
  cancelSubscription as realCancelSubscription,
} from "./subscriptions";
import type {
  CreatePlanInput,
  CreateSubscriptionInput,
  RazorpayPlan,
  RazorpaySubscription,
} from "./types";

// The application depends ONLY on this interface, never on the raw Razorpay
// SDK. `RealRazorpayGateway` delegates to the existing adapter functions that
// wrap the SDK; `MockRazorpayGateway` is used by tests so no network or
// credentials are required.
export interface RazorpayGateway {
  createPlan(input: CreatePlanInput): Promise<RazorpayPlan>;
  createSubscription(input: CreateSubscriptionInput): Promise<RazorpaySubscription>;
  getSubscription(id: string): Promise<RazorpaySubscription>;
  pauseSubscription(id: string): Promise<RazorpaySubscription>;
  resumeSubscription(id: string): Promise<RazorpaySubscription>;
  cancelSubscription(id: string): Promise<RazorpaySubscription>;
}

class RealRazorpayGateway implements RazorpayGateway {
  createPlan = realCreatePlan;
  createSubscription = realCreateSubscription;
  getSubscription = realGetSubscription;
  pauseSubscription = realPauseSubscription;
  resumeSubscription = realResumeSubscription;
  cancelSubscription = realCancelSubscription;
}

// In-memory gateway for tests. It tracks created entities so get/pause/resume
// reflect realistic status transitions, and can be forced to fail to exercise
// error handling without touching Razorpay.
export class MockRazorpayGateway implements RazorpayGateway {
  private seq = 0;
  readonly plans = new Map<string, RazorpayPlan>();
  readonly subscriptions = new Map<string, RazorpaySubscription>();

  // When true, the NEXT call throws failureError (then resets). Useful for
  // exercising transient-error handling.
  failNext = false;
  failureError: Error = new Error("Razorpay API request failed");

  private nextId(prefix: string): string {
    this.seq += 1;
    return `${prefix}_${this.seq}`;
  }

  private maybeFail(): void {
    if (this.failNext) {
      this.failNext = false;
      throw this.failureError;
    }
  }

  async createPlan(input: CreatePlanInput): Promise<RazorpayPlan> {
    this.maybeFail();
    const plan: RazorpayPlan = {
      id: this.nextId("plan"),
      name: input.name,
      amount: input.amount,
      currency: input.currency ?? "INR",
      interval: input.interval,
      intervalCount: input.intervalCount ?? 1,
    };
    this.plans.set(plan.id, plan);
    return plan;
  }

  async createSubscription(
    input: CreateSubscriptionInput,
  ): Promise<RazorpaySubscription> {
    this.maybeFail();
    const sub: RazorpaySubscription = {
      id: this.nextId("sub"),
      planId: input.planId,
      status: "created",
      totalCount: input.totalCount ?? 12,
    };
    this.subscriptions.set(sub.id, sub);
    return sub;
  }

  async getSubscription(id: string): Promise<RazorpaySubscription> {
    this.maybeFail();
    const sub = this.subscriptions.get(id);
    if (!sub) throw new Error(`Razorpay subscription ${id} not found`);
    return { ...sub };
  }

  async pauseSubscription(id: string): Promise<RazorpaySubscription> {
    this.maybeFail();
    const sub = this.subscriptions.get(id);
    if (!sub) throw new Error(`Razorpay subscription ${id} not found`);
    sub.status = "paused";
    return { ...sub };
  }

  async resumeSubscription(id: string): Promise<RazorpaySubscription> {
    this.maybeFail();
    const sub = this.subscriptions.get(id);
    if (!sub) throw new Error(`Razorpay subscription ${id} not found`);
    sub.status = "active";
    return { ...sub };
  }

  async cancelSubscription(id: string): Promise<RazorpaySubscription> {
    this.maybeFail();
    const sub = this.subscriptions.get(id);
    if (!sub) throw new Error(`Razorpay subscription ${id} not found`);
    sub.status = "cancelled";
    // Terminate the provider entity: remove it so it cannot be resumed/billed.
    this.subscriptions.delete(id);
    return { ...sub };
  }
}

let override: RazorpayGateway | null = null;
let real: RazorpayGateway | null = null;

// Test seam: inject a gateway (e.g. MockRazorpayGateway) or pass null to clear.
export function setRazorpayGateway(gateway: RazorpayGateway | null): void {
  override = gateway;
}

// Returns the injected gateway (tests) or the real SDK-backed gateway.
export function getGateway(): RazorpayGateway {
  if (override) return override;
  if (!real) real = new RealRazorpayGateway();
  return real;
}

// Clears both the test override and any cached real gateway instance.
export function resetRazorpayGateway(): void {
  override = null;
  real = null;
}
