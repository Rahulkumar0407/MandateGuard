import { z } from "zod";

// Structured buyer intent. The LLM/mock provider returns this shape; it is
// validated with Zod before any application logic runs. Merchant/offer content
// is NEVER part of this schema — intent is derived purely from the USER's own
// words, and hard constraints are enforced deterministically by the app.
export const BuyerIntentSchema = z.object({
  // HARD CONSTRAINTS (determine eligibility)
  category: z.string().min(1).max(50).optional(),
  purpose: z.string().max(100).optional(),
  maxMonthlyAmount: z.number().nonnegative().max(100_000_000).optional(),
  currency: z.string().length(3).optional(),
  requiredFeatures: z.array(z.string().min(1).max(50)).max(20).default([]),
  minimumDurationDays: z.number().int().nonnegative().max(3650).optional(),
  // SOFT PREFERENCES (influence ranking only)
  preferredFeatures: z.array(z.string().min(1).max(50)).max(20).default([]),
  // Indicates the model could not derive a usable constraint set; the system
  // must NOT hallucinate constraints when this is true.
  ambiguous: z.boolean().optional(),
});

export type BuyerIntent = z.infer<typeof BuyerIntentSchema>;

export interface AlternativeOffer {
  offerId: string;
  name: string;
  version: number;
  price: number;
  currency: string;
  reason: string;
}

export interface RecommendationResult {
  recommendedOfferId: string | null;
  eligible: boolean;
  score: number;
  reason: string;
  matchedConstraints: string[];
  tradeoffs: string[];
  alternatives: AlternativeOffer[];
}
