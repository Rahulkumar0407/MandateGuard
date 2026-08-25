import { z } from "zod";
import type { CompatibilityFinding, CompatibilityStatus } from "@/lib/compatibility/types";
import {
  FinancialConstraintsSchema,
  TolerancePolicySchema,
  type FinancialConstraints,
  type TolerancePolicy,
} from "@/lib/envelope/types";

// ============================================================================
// M9 Phase 6: Reauthorization State Machine Types
// ============================================================================

export const ReauthorizationStateSchema = z.enum([
  "ACTIVE",
  "MIGRATION_PENDING",
  "REAUTHORIZED",
  "DECLINED",
  "EXPIRED",
  "PAUSED",
]);

export type ReauthorizationState = z.infer<typeof ReauthorizationStateSchema>;

export type ReauthorizationEventType =
  | "INITIATE_MIGRATION"
  | "APPROVE_REAUTHORIZATION"
  | "DECLINE_REAUTHORIZATION"
  | "EXPIRE_REQUEST"
  | "PAUSE_AUTHORIZATION"
  | "RESUME_AUTHORIZATION";

export interface InitiateReauthorizationInput {
  envelopeId: string;
  targetOfferVersionId: string;
  reason: string;
  expiresInDays?: number;
}

export const InitiateReauthorizationInputSchema = z.object({
  envelopeId: z.string().trim().min(1),
  targetOfferVersionId: z.string().trim().min(1),
  reason: z.string().trim().min(1),
  expiresInDays: z.number().int().min(1).max(90).optional().default(14),
});

export interface ApproveReauthorizationInput {
  requestId: string;
  decisionNote?: string;
  updatedFinancialConstraints?: Partial<FinancialConstraints>;
  updatedTolerancePolicy?: Partial<TolerancePolicy>;
}

export const ApproveReauthorizationInputSchema = z.object({
  requestId: z.string().trim().min(1),
  decisionNote: z.string().optional(),
  updatedFinancialConstraints: FinancialConstraintsSchema.partial().optional(),
  updatedTolerancePolicy: TolerancePolicySchema.partial().optional(),
});

export type DeclineAction = "RETAIN_BASELINE" | "PAUSE_SUBSCRIPTION";

export interface DeclineReauthorizationInput {
  requestId: string;
  reason: string;
  action?: DeclineAction;
}

export const DeclineReauthorizationInputSchema = z.object({
  requestId: z.string().trim().min(1),
  reason: z.string().trim().min(1),
  action: z.enum(["RETAIN_BASELINE", "PAUSE_SUBSCRIPTION"]).optional().default("RETAIN_BASELINE"),
});

export interface ReauthorizationRequest {
  id: string;
  envelopeId: string;
  subscriptionId: string | null;
  userId: string;
  merchantId: string;
  currentOfferVersionId: string;
  targetOfferVersionId: string;
  compatibilityStatus: CompatibilityStatus;
  findings: CompatibilityFinding[];
  state: ReauthorizationState;
  reason: string;
  decisionNote: string | null;
  decisionAction: string | null;
  newEnvelopeId: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}
