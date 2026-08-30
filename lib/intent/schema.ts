import { z } from "zod";

/**
 * M10 Commerce Brain — Zod Validation Schemas
 *
 * Strict validation boundary for candidate intents produced by reasoning models.
 * Unparseable, negative, or invalid structures are rejected immediately.
 */

export const BudgetConstraintTypeSchema = z.enum(["HARD", "SOFT"]);

export const BillingCadenceSchema = z.enum([
  "monthly",
  "yearly",
  "quarterly",
  "weekly",
  "one_time",
  "any",
]);

export const SupportTierSchema = z.enum([
  "dedicated_mentor",
  "priority_email",
  "community",
  "standard",
  "any",
]);

export const QualityLevelSchema = z.enum([
  "best_value",
  "premium",
  "budget",
  "standard",
]);

export const UrgencyLevelSchema = z.enum(["low", "medium", "high", "immediate"]);

export const InteractionChannelSchema = z.enum([
  "text",
  "voice_transcription",
  "structured_form",
  "agent_delegation",
]);

export const IntentBudgetSchema = z
  .object({
    amountPaise: z
      .number()
      .int("Budget amount in paise must be an integer")
      .nonnegative("Budget amount cannot be negative")
      .max(100_000_000, "Budget cannot exceed 10,000,000 INR (in paise)"),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter uppercase ISO code"),
    type: BudgetConstraintTypeSchema,
    stretchPercentage: z
      .number()
      .nonnegative("Stretch percentage cannot be negative")
      .max(200, "Stretch percentage cannot exceed 200%")
      .optional(),
    maxStretchPaise: z
      .number()
      .int()
      .nonnegative("Max stretch paise cannot be negative")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.type === "HARD" && data.stretchPercentage && data.stretchPercentage > 0) {
        return false;
      }
      return true;
    },
    {
      message: "HARD budget constraints cannot specify a non-zero stretchPercentage",
      path: ["stretchPercentage"],
    },
  );

export const IntentBillingSchema = z.object({
  cadence: BillingCadenceSchema,
  isRecurring: z.boolean().default(true),
});

export const IntentSupportPreferenceSchema = z.object({
  tier: SupportTierSchema.default("standard"),
  hasDedicatedHuman: z.boolean().optional(),
  minSessionsPerMonth: z
    .number()
    .int()
    .nonnegative()
    .max(100)
    .optional(),
  maxSlaHours: z
    .number()
    .int()
    .positive()
    .max(720)
    .optional(),
});

export const IntentQualityPreferenceSchema = z.object({
  level: QualityLevelSchema.default("best_value"),
  prioritizeQualityOverPrice: z.boolean().default(false),
});

export const IntentContextSchema = z.object({
  language: z.string().trim().max(20).optional(),
  locale: z.string().trim().max(20).optional(),
  channel: InteractionChannelSchema.optional(),
  rawQuery: z.string().max(2000).optional(),
});

/**
 * Complete Buyer Intent Schema
 */
export const CanonicalBuyerIntentSchema = z.object({
  category: z
    .string()
    .trim()
    .min(1, "Category must not be empty")
    .max(100, "Category too long"),
  budget: IntentBudgetSchema.optional(),
  billing: IntentBillingSchema,
  mustHave: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
  niceToHave: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
  exclusions: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
  supportPreference: IntentSupportPreferenceSchema.optional(),
  qualityPreference: IntentQualityPreferenceSchema.optional(),
  urgency: UrgencyLevelSchema.default("medium"),
  context: IntentContextSchema.optional(),
  ambiguous: z.boolean().default(false),
  clarificationNeeded: z.boolean().default(false),
  clarificationReasons: z.array(z.string().trim()).max(20).optional(),
});

export type RawCandidateIntentInput = z.input<typeof CanonicalBuyerIntentSchema>;
