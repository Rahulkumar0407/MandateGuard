/**
 * M10 Commerce Brain — Canonical Buyer Intent Contract
 *
 * Core Principle:
 * "Models produce candidate intent. This module validates and canonicalizes it.
 *  The Commerce Brain remains authoritative."
 *
 * This contract is language-independent. Inputs in English, Hindi, Hinglish,
 * or voice transcripts normalize to the identical canonical representation.
 */

export type BudgetConstraintType = "HARD" | "SOFT";

export type BillingCadence =
  | "monthly"
  | "yearly"
  | "quarterly"
  | "weekly"
  | "one_time"
  | "any";

export type SupportTier =
  | "dedicated_mentor"
  | "priority_email"
  | "community"
  | "standard"
  | "any";

export type QualityLevel = "best_value" | "premium" | "budget" | "standard";

export type UrgencyLevel = "low" | "medium" | "high" | "immediate";

export type InteractionChannel =
  | "text"
  | "voice_transcription"
  | "structured_form"
  | "agent_delegation";

/**
 * Budget constraint model:
 * - HARD: Absolute maximum ceiling (e.g. "strictly under ₹4,000").
 * - SOFT: Target budget with optional elasticity (e.g. "around ₹4,000", "can stretch for quality").
 */
export interface IntentBudget {
  amountPaise: number;
  currency: string;
  type: BudgetConstraintType;
  stretchPercentage?: number;
  maxStretchPaise?: number;
}

export interface IntentBilling {
  cadence: BillingCadence;
  isRecurring: boolean;
}

export interface IntentSupportPreference {
  tier: SupportTier;
  hasDedicatedHuman?: boolean;
  minSessionsPerMonth?: number;
  maxSlaHours?: number;
}

export interface IntentQualityPreference {
  level: QualityLevel;
  prioritizeQualityOverPrice: boolean;
}

export interface IntentContext {
  language?: string;
  locale?: string;
  channel?: InteractionChannel;
  rawQuery?: string;
}

/**
 * Canonical Buyer Intent representation used across the Commerce Brain.
 */
export interface CanonicalBuyerIntent {
  category: string;
  budget?: IntentBudget;
  billing: IntentBilling;
  mustHave: string[];
  niceToHave: string[];
  exclusions: string[];
  supportPreference?: IntentSupportPreference;
  qualityPreference?: IntentQualityPreference;
  urgency: UrgencyLevel;
  context?: IntentContext;
  ambiguous: boolean;
  clarificationNeeded: boolean;
  clarificationReasons?: string[];
}

/**
 * Result of comparing two BuyerIntent models.
 */
export interface IntentComparisonResult {
  isEquivalent: boolean;
  hardConstraintMatch: boolean;
  softPreferenceMatch: boolean;
  budgetMatch: boolean;
  differences: string[];
}
