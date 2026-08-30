import type { RawCandidateIntentInput } from "./schema";

/**
 * Benchmark Multi-Lingual Fixtures demonstrating that semantically identical
 * inputs in English, Hindi, and Hinglish normalize to identical CanonicalBuyerIntent models.
 */

// Example 1: English
// "I need a monthly human mentor for system design under ₹4,000."
export const EN_INTENT_SYSTEM_DESIGN: RawCandidateIntentInput = {
  category: "system_design",
  budget: {
    amountPaise: 400000,
    currency: "INR",
    type: "HARD",
  },
  billing: {
    cadence: "monthly",
    isRecurring: true,
  },
  mustHave: ["system_design_curriculum", "human_mentor"],
  niceToHave: ["mock_interviews"],
  exclusions: ["automated_bot_only"],
  supportPreference: {
    tier: "dedicated_mentor",
    hasDedicatedHuman: true,
    minSessionsPerMonth: 2,
    maxSlaHours: 24,
  },
  qualityPreference: {
    level: "best_value",
    prioritizeQualityOverPrice: false,
  },
  urgency: "medium",
  context: {
    language: "en",
    locale: "en-IN",
    channel: "text",
    rawQuery: "I need a monthly human mentor for system design under ₹4,000.",
  },
  ambiguous: false,
  clarificationNeeded: false,
};

// Example 2: Hindi
// "मुझे ₹4,000 के अंदर सिस्टम डिज़ाइन के लिए monthly human mentor चाहिए।"
export const HI_INTENT_SYSTEM_DESIGN: RawCandidateIntentInput = {
  category: "system_design",
  budget: {
    amountPaise: 400000,
    currency: "INR",
    type: "HARD",
  },
  billing: {
    cadence: "monthly",
    isRecurring: true,
  },
  mustHave: ["human_mentor", "system_design_curriculum"], // Different order
  niceToHave: ["mock_interviews"],
  exclusions: ["automated_bot_only"],
  supportPreference: {
    tier: "dedicated_mentor",
    hasDedicatedHuman: true,
    minSessionsPerMonth: 2,
    maxSlaHours: 24,
  },
  qualityPreference: {
    level: "best_value",
    prioritizeQualityOverPrice: false,
  },
  urgency: "medium",
  context: {
    language: "hi",
    locale: "hi-IN",
    channel: "text",
    rawQuery: "मुझे ₹4,000 के अंदर सिस्टम डिज़ाइन के लिए monthly human mentor चाहिए।",
  },
  ambiguous: false,
  clarificationNeeded: false,
};

// Example 3: Hinglish
// "4k ke andar system design monthly human mentor chahiye."
export const HINGLISH_INTENT_SYSTEM_DESIGN: RawCandidateIntentInput = {
  category: "system_design",
  budget: {
    amountPaise: 400000,
    currency: "INR",
    type: "HARD",
  },
  billing: {
    cadence: "monthly",
    isRecurring: true,
  },
  mustHave: ["system_design_curriculum", "human_mentor"],
  niceToHave: ["mock_interviews"],
  exclusions: ["automated_bot_only"],
  supportPreference: {
    tier: "dedicated_mentor",
    hasDedicatedHuman: true,
    minSessionsPerMonth: 2,
    maxSlaHours: 24,
  },
  qualityPreference: {
    level: "best_value",
    prioritizeQualityOverPrice: false,
  },
  urgency: "medium",
  context: {
    language: "hi-Latn",
    locale: "en-IN",
    channel: "voice_transcription",
    rawQuery: "4k ke andar system design monthly human mentor chahiye.",
  },
  ambiguous: false,
  clarificationNeeded: false,
};

// Example 4: Soft Budget with Elastic Stretch
// "around 4k for DSA, but can stretch 15% for premium mentor"
export const SOFT_BUDGET_STRETCH_INTENT: RawCandidateIntentInput = {
  category: "data_structures",
  budget: {
    amountPaise: 400000,
    currency: "INR",
    type: "SOFT",
    stretchPercentage: 15,
  },
  billing: {
    cadence: "monthly",
    isRecurring: true,
  },
  mustHave: ["dsa_curriculum"],
  niceToHave: ["1:1_mentor"],
  exclusions: [],
  supportPreference: {
    tier: "dedicated_mentor",
    hasDedicatedHuman: true,
  },
  qualityPreference: {
    level: "premium",
    prioritizeQualityOverPrice: true,
  },
  urgency: "high",
  context: {
    language: "en",
    locale: "en-IN",
    channel: "text",
    rawQuery: "around 4k for DSA, but can stretch 15% for premium mentor",
  },
  ambiguous: false,
  clarificationNeeded: false,
};

// Example 5: Ambiguous / Underspecified Intent
// "I want to prepare for interviews."
export const AMBIGUOUS_INTENT: RawCandidateIntentInput = {
  category: "interview_prep",
  billing: {
    cadence: "any",
    isRecurring: true,
  },
  mustHave: [],
  niceToHave: [],
  exclusions: [],
  urgency: "low",
  ambiguous: true,
  clarificationNeeded: true,
  clarificationReasons: [
    "Subject domain unspecified (System Design vs DSA vs Leadership)",
    "Budget ceiling not provided",
  ],
  context: {
    rawQuery: "I want to prepare for interviews.",
  },
};
