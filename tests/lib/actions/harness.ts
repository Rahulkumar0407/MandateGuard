import {
  MandateService,
  InMemoryMandateRepository,
} from "@/lib/mandate/service";
import {
  MerchantOfferService,
  InMemoryMerchantOfferRepository,
} from "@/lib/merchant/service";
import type { MerchantOfferData } from "@/lib/merchant/types";
import { IntegrityService } from "@/lib/integrity/service";
import {
  MockSemanticIntegrityProvider,
  setSemanticProvider,
} from "@/lib/integrity/semantic-provider";
import { AuditService, InMemoryAuditRepository } from "@/lib/audit/service";
import { ActionExecutor, InMemoryActionRepository } from "@/lib/actions/executor";
import { MockRazorpayActionGateway } from "@/lib/actions/gateway";
import type { SemanticEvaluation } from "@/lib/integrity/semantic";

// Shared offline harness for the M7-A action-boundary tests.
//
// Everything is in-memory: no database, no Razorpay, no LLM. The demo dataset
// is the M4/M5/M6 scenario:
//   authorized v2: ₹3,999/year, weekly mentor feedback + mock interviews +
//                  capstone review, 30-day refund
//   current   v3: ₹4,999/year, mock interviews only, 7-day refund,
//                  community + monthly Q&A
const TS = new Date("2026-01-01T00:00:00.000Z");

export function buildDemoData(): MerchantOfferData {
  return {
    merchants: [
      {
        id: "m_demo",
        name: "InterviewForge",
        slug: "interviewforge",
        description: "demo",
        status: "ACTIVE",
        createdAt: TS,
        updatedAt: TS,
      },
    ],
    products: [
      {
        id: "p_demo",
        merchantId: "m_demo",
        name: "System Design Pro",
        slug: "system-design-pro",
        description: "demo",
        category: "system-design",
        active: true,
        createdAt: TS,
        updatedAt: TS,
      },
    ],
    offers: [
      {
        id: "o_demo_v2",
        productId: "p_demo",
        version: 2,
        name: "System Design Pro",
        description: "Expanded system design program with capstone review.",
        price: 399900, // ₹3,999/year
        currency: "INR",
        billingInterval: "yearly",
        duration: 365,
        entitlementKeys: [
          "weekly_mentor_feedback",
          "mock_interviews",
          "capstone_review",
        ],
        refundWindowDays: 30,
        supportTerms: "Dedicated weekly 1:1 mentor feedback.",
        semanticTerms: "Human mentor reviews your capstone.",
        active: true,
        createdAt: TS,
        updatedAt: TS,
      },
    ],
  };
}

// M5 evidence used by the demo: SUPPORT_QUALITY_CHANGED / DEGRADED / 0.95.
export const DEGRADED_SEMANTIC: SemanticEvaluation = {
  changed: true,
  findings: [
    {
      type: "SUPPORT_QUALITY_CHANGED",
      severity: "WARNING",
      direction: "DEGRADED",
      baseline: "Dedicated weekly 1:1 mentor feedback.",
      current: "Community discussions and monthly group Q&A.",
      explanation: "Model free-form text (never used by policy or actions).",
      confidence: 0.95,
    },
  ],
};

export interface Harness {
  data: MerchantOfferData;
  merchant: MerchantOfferService;
  mandates: MandateService;
  integrity: IntegrityService;
  auditRepo: InMemoryAuditRepository;
  audit: AuditService;
  actionsRepo: InMemoryActionRepository;
  gateway: MockRazorpayActionGateway;
  executor: ActionExecutor;
  semantic: MockSemanticIntegrityProvider;
}

export function buildHarness(
  opts: { data?: MerchantOfferData; gateway?: MockRazorpayActionGateway } = {},
): Harness {
  const data = opts.data ?? buildDemoData();
  const merchant = new MerchantOfferService(
    new InMemoryMerchantOfferRepository(data),
  );
  const mandates = new MandateService(new InMemoryMandateRepository(), merchant);
  const integrity = new IntegrityService(mandates, merchant);
  const auditRepo = new InMemoryAuditRepository();
  const audit = new AuditService(auditRepo);
  const actionsRepo = new InMemoryActionRepository();
  const gateway = opts.gateway ?? new MockRazorpayActionGateway("SUCCESS");
  const semantic = new MockSemanticIntegrityProvider();
  setSemanticProvider(semantic);

  const executor = new ActionExecutor({
    mandates,
    integrity,
    audit,
    actions: actionsRepo,
    gateway,
  });

  return {
    data,
    merchant,
    mandates,
    integrity,
    auditRepo,
    audit,
    actionsRepo,
    gateway,
    executor,
    semantic,
  };
}

// Advance the product lineage to the degraded v3 offer (PRICE_INCREASED +
// ENTITLEMENT_REMOVED (critical) + REFUND_WINDOW_REDUCED).
export function advanceToV3(data: MerchantOfferData): void {
  const v2 = data.offers.find((o) => o.id === "o_demo_v2")!;
  v2.active = false;
  data.offers.push({
    ...v2,
    id: "o_demo_v3",
    version: 3,
    name: "System Design Pro v3",
    description: "Community-driven system design program.",
    price: 499900, // ₹4,999/year
    entitlementKeys: ["mock_interviews"],
    refundWindowDays: 7,
    supportTerms: "Community discussions and monthly group Q&A.",
    semanticTerms: "AI-generated automated feedback.",
    active: true,
  });
}

// A benign v3: price +2% only -> ALLOW.
export function advanceToBenignV3(data: MerchantOfferData): void {
  const v2 = data.offers.find((o) => o.id === "o_demo_v2")!;
  v2.active = false;
  data.offers.push({
    ...v2,
    id: "o_demo_v3",
    version: 3,
    price: 407900, // +2%
    active: true,
  });
}

// A v3 that is a degradation but NOT a critical one: refund window reduced only
// -> REVIEW.
export function advanceToReviewV3(data: MerchantOfferData): void {
  const v2 = data.offers.find((o) => o.id === "o_demo_v2")!;
  v2.active = false;
  data.offers.push({
    ...v2,
    id: "o_demo_v3",
    version: 3,
    refundWindowDays: 7,
    active: true,
  });
}

export function eventTypes(
  events: Array<{ eventType: string }>,
): string[] {
  return events.map((e) => e.eventType);
}
