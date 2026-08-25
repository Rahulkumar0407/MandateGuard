import type { MerchantOfferData } from "./types";

// Deterministic demo dataset for the Merchant Commerce API.
//
// Single merchant: InterviewForge, with a realistic set of subscription offers
// across interview-prep products. All monetary values are in paise (INR).
//
// Versioning demonstration: "System Design Pro" has v1 (superseded, inactive)
// and v2 (current, active) so the data model can express immutable versions.
const TS = new Date("2026-01-01T00:00:00.000Z");

export function buildInterviewForgeData(): MerchantOfferData {
  return {
    merchants: [
      {
        id: "m_interviewforge",
        name: "InterviewForge",
        slug: "interviewforge",
        description:
          "Interview preparation platform helping candidates crack system design, DSA, and behavioral rounds.",
        status: "ACTIVE",
        createdAt: TS,
        updatedAt: TS,
      },
    ],
    products: [
      {
        id: "p_sysdesign",
        merchantId: "m_interviewforge",
        name: "System Design Pro",
        slug: "system-design-pro",
        description:
          "Master system design interviews with structured lessons, mock interviews, and mentor feedback.",
        category: "system-design",
        active: true,
        createdAt: TS,
        updatedAt: TS,
      },
      {
        id: "p_dsa",
        merchantId: "m_interviewforge",
        name: "DSA Interview Track",
        slug: "dsa-interview-track",
        description:
          "Data structures and algorithms intensive with contest practice and mentor feedback.",
        category: "data-structures",
        active: true,
        createdAt: TS,
        updatedAt: TS,
      },
      {
        id: "p_accelerator",
        merchantId: "m_interviewforge",
        name: "Full Interview Accelerator",
        slug: "full-interview-accelerator",
        description:
          "End-to-end interview readiness across DSA, system design, and behavioral rounds.",
        category: "bundles",
        active: true,
        createdAt: TS,
        updatedAt: TS,
      },
      {
        id: "p_mockpack",
        merchantId: "m_interviewforge",
        name: "Mock Interview Pack",
        slug: "mock-interview-pack",
        description:
          "Focused mock interviews with detailed feedback reports.",
        category: "mock-interviews",
        active: true,
        createdAt: TS,
        updatedAt: TS,
      },
      {
        id: "p_careerbasic",
        merchantId: "m_interviewforge",
        name: "Career Prep Basic",
        slug: "career-prep-basic",
        description:
          "Entry-level career preparation with resume and behavioral guidance.",
        category: "career",
        active: true,
        createdAt: TS,
        updatedAt: TS,
      },
    ],
    offers: [
      {
        id: "o_sysdesign_v1",
        productId: "p_sysdesign",
        version: 1,
        name: "System Design Pro v1",
        description:
          "Comprehensive system design mastery with weekly 1:1 mentor feedback and structured mock interviews.",
        price: 349900,
        currency: "INR",
        billingInterval: "monthly",
        duration: 180,
        entitlementKeys: [
          "system_design_course",
          "mock_interviews",
          "mentor_feedback",
        ],
        refundWindowDays: 30,
        supportTerms: "Email and community support within 48 hours.",
        semanticTerms:
          "Comprehensive system design mastery with weekly 1:1 mentor feedback and structured mock interviews.",
        active: false,
        createdAt: TS,
        updatedAt: TS,
      },
      {
        id: "o_sysdesign_v2",
        productId: "p_sysdesign",
        version: 2,
        name: "System Design Pro",
        description:
          "Expanded system design program with capstone review and weekly live sessions.",
        price: 399900,
        currency: "INR",
        billingInterval: "monthly",
        duration: 365,
        entitlementKeys: [
          "system_design_course",
          "mock_interviews",
          "mentor_feedback",
          "capstone_review",
        ],
        refundWindowDays: 30,
        supportTerms: "Priority email and weekly live Q&A sessions.",
        semanticTerms:
          "Expanded system design program with capstone review and weekly live sessions.",
        active: true,
        createdAt: TS,
        updatedAt: TS,
      },
      {
        id: "o_dsa_v1",
        productId: "p_dsa",
        version: 1,
        name: "DSA Interview Track",
        description:
          "Data structures and algorithms intensive with contest practice.",
        price: 299900,
        currency: "INR",
        billingInterval: "monthly",
        duration: 90,
        entitlementKeys: ["dsa_course", "coding_contests", "mentor_feedback"],
        refundWindowDays: 15,
        supportTerms: "Forum support with mentor responses.",
        semanticTerms:
          "Data structures and algorithms intensive with contest practice and mentor feedback.",
        active: true,
        createdAt: TS,
        updatedAt: TS,
      },
      {
        id: "o_accelerator_v1",
        productId: "p_accelerator",
        version: 1,
        name: "Full Interview Accelerator",
        description:
          "End-to-end interview readiness across DSA, system design, and behavioral.",
        price: 499900,
        currency: "INR",
        billingInterval: "monthly",
        duration: 180,
        entitlementKeys: [
          "system_design_course",
          "dsa_course",
          "mock_interviews",
          "resume_review",
          "mentor_feedback",
        ],
        refundWindowDays: 30,
        supportTerms: "Dedicated mentor with weekly check-ins.",
        semanticTerms:
          "End-to-end interview readiness across DSA, system design, and behavioral rounds.",
        active: true,
        createdAt: TS,
        updatedAt: TS,
      },
      {
        id: "o_mockpack_v1",
        productId: "p_mockpack",
        version: 1,
        name: "Mock Interview Pack",
        description: "Focused mock interviews with detailed feedback reports.",
        price: 149900,
        currency: "INR",
        billingInterval: "monthly",
        duration: 30,
        entitlementKeys: ["mock_interviews", "feedback_report"],
        refundWindowDays: 7,
        supportTerms: "Email support for scheduling.",
        semanticTerms:
          "Focused mock interviews with detailed feedback reports.",
        active: true,
        createdAt: TS,
        updatedAt: TS,
      },
      {
        id: "o_careerbasic_v1",
        productId: "p_careerbasic",
        version: 1,
        name: "Career Prep Basic",
        description: "Entry-level career preparation with resume and behavioral guidance.",
        price: 99900,
        currency: "INR",
        billingInterval: "monthly",
        duration: 30,
        entitlementKeys: ["resume_review", "behavioral_guide"],
        refundWindowDays: 7,
        supportTerms: "Community support.",
        semanticTerms:
          "Entry-level career preparation with resume and behavioral guidance.",
        active: true,
        createdAt: TS,
        updatedAt: TS,
      },
    ],
  };
}
