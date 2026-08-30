/**
 * M10-C2.5 — Gold Standard AI Buyability Benchmark Cohort (100 Buyer Missions)
 *
 * Dataset Version: 1.0.0
 * Multi-lingual: English, Hindi, Hinglish, Code-Switching
 * Real-world Indian commerce phrasing & constraint variations.
 */

import { createHash } from "crypto";
import { normalizeBuyerIntent } from "@/lib/intent";
import type {
  BenchmarkBuyerMission,
  BuyabilityBenchmarkCohort,
  BenchmarkLanguage,
} from "./buyability-types";

interface MissionBlueprint {
  id: string;
  name: string;
  rawQuery: string;
  language: BenchmarkLanguage;
  category: string;
  budgetPaise: number;
  isHardCeiling: boolean;
  mustHave: string[];
  niceToHave?: string[];
  requiresHumanMentor: boolean;
  slaHours?: number;
  refundDays?: number;
  expectedOutcome: {
    expectedWinnerCategory: string;
    shouldRefuseToTransact: boolean;
    acceptableOfferIds?: string[];
    rejectionReason?: string;
  };
}

const BLUEPRINTS: MissionBlueprint[] = [
  // 1-15: System Design Mentorship (English & Hinglish & Hindi)
  {
    id: "bm_sd_001",
    name: "Standard System Design Mentor (Hinglish)",
    rawQuery: "4k ke andar monthly human mentor chahiye system design ke liye",
    language: "hinglish",
    category: "system_design",
    budgetPaise: 400000,
    isHardCeiling: true,
    mustHave: ["system_design_curriculum", "human_mentor"],
    requiresHumanMentor: true,
    slaHours: 24,
    expectedOutcome: { expectedWinnerCategory: "system_design", shouldRefuseToTransact: false },
  },
  {
    id: "bm_sd_002",
    name: "System Design with Quality Stretch (Hinglish)",
    rawQuery: "4 hazaar ke aas paas, quality achhi ho toh thoda stretch kar sakta hu",
    language: "hinglish",
    category: "system_design",
    budgetPaise: 400000,
    isHardCeiling: false,
    mustHave: ["system_design_curriculum"],
    requiresHumanMentor: false,
    expectedOutcome: { expectedWinnerCategory: "system_design", shouldRefuseToTransact: false },
  },
  {
    id: "bm_sd_003",
    name: "Human Mentorship Mandatory (Hindi)",
    rawQuery: "मुझे सिस्टम डिज़ाइन में human wala mentor chahiye, bot nahi chalega",
    language: "code_switching",
    category: "system_design",
    budgetPaise: 450000,
    isHardCeiling: true,
    mustHave: ["system_design_curriculum", "human_mentor"],
    requiresHumanMentor: true,
    slaHours: 48,
    expectedOutcome: { expectedWinnerCategory: "system_design", shouldRefuseToTransact: false },
  },
  {
    id: "bm_sd_004",
    name: "Best Value System Design (Hinglish)",
    rawQuery: "System design ke liye best value monthly plan batao",
    language: "hinglish",
    category: "system_design",
    budgetPaise: 350000,
    isHardCeiling: false,
    mustHave: ["system_design_curriculum"],
    requiresHumanMentor: false,
    expectedOutcome: { expectedWinnerCategory: "system_design", shouldRefuseToTransact: false },
  },
  {
    id: "bm_sd_005",
    name: "Risk-Averse Refund Guarantee (Hinglish)",
    rawQuery: "System design subscription chahiye but refund easy hona chahiye 14 days tak",
    language: "hinglish",
    category: "system_design",
    budgetPaise: 400000,
    isHardCeiling: true,
    mustHave: ["system_design_curriculum"],
    requiresHumanMentor: false,
    refundDays: 14,
    expectedOutcome: { expectedWinnerCategory: "system_design", shouldRefuseToTransact: false },
  },
  {
    id: "bm_sd_006",
    name: "L5 Interview Prep (English)",
    rawQuery: "Need System Design prep for Amazon L5 interview in 4 weeks under 4k/mo with real mock interview feedback.",
    language: "en",
    category: "system_design",
    budgetPaise: 400000,
    isHardCeiling: true,
    mustHave: ["system_design_curriculum", "mock_interviews"],
    requiresHumanMentor: true,
    slaHours: 24,
    expectedOutcome: { expectedWinnerCategory: "system_design", shouldRefuseToTransact: false },
  },
  {
    id: "bm_sd_007",
    name: "Formal System Design Prep (Hindi)",
    rawQuery: "कृपया मुझे सिस्टम डिजाइन की तैयारी के लिए 4000 रुपये प्रति माह की योजना बताएं",
    language: "hi",
    category: "system_design",
    budgetPaise: 400000,
    isHardCeiling: true,
    mustHave: ["system_design_curriculum"],
    requiresHumanMentor: false,
    expectedOutcome: { expectedWinnerCategory: "system_design", shouldRefuseToTransact: false },
  },
  {
    id: "bm_sd_008",
    name: "Urgent 24h SLA Requirement (English)",
    rawQuery: "Urgent interview next week, need 24 hour turn-around SLA for system design reviews under 6000",
    language: "en",
    category: "system_design",
    budgetPaise: 600000,
    isHardCeiling: true,
    mustHave: ["system_design_curriculum", "mentor_feedback"],
    requiresHumanMentor: true,
    slaHours: 24,
    expectedOutcome: { expectedWinnerCategory: "system_design", shouldRefuseToTransact: false },
  },
  {
    id: "bm_sd_009",
    name: "Low Budget Barrier System Design (Hinglish)",
    rawQuery: "Bhai 2k ke andar koi system design course milega kya",
    language: "hinglish",
    category: "system_design",
    budgetPaise: 200000,
    isHardCeiling: true,
    mustHave: ["system_design_curriculum"],
    requiresHumanMentor: false,
    expectedOutcome: { expectedWinnerCategory: "system_design", shouldRefuseToTransact: false },
  },
  {
    id: "bm_sd_010",
    name: "Executive Architecture Coaching (English)",
    rawQuery: "Executive architecture 1:1 mentoring budget 8k/month with minimum 4 mock sessions",
    language: "en",
    category: "system_design",
    budgetPaise: 800000,
    isHardCeiling: false,
    mustHave: ["system_design_curriculum", "mock_interviews", "human_mentor"],
    requiresHumanMentor: true,
    slaHours: 12,
    expectedOutcome: { expectedWinnerCategory: "system_design", shouldRefuseToTransact: false },
  },
  {
    id: "bm_sd_011",
    name: "Self Paced Video Architecture (Hindi)",
    rawQuery: "सिस्टम डिजाइन वीडियो लेसन्स बिना मेंटर के सस्ता प्लान चाहिए",
    language: "hi",
    category: "system_design",
    budgetPaise: 250000,
    isHardCeiling: true,
    mustHave: ["system_design_curriculum"],
    requiresHumanMentor: false,
    expectedOutcome: { expectedWinnerCategory: "system_design", shouldRefuseToTransact: false },
  },
  {
    id: "bm_sd_012",
    name: "Microservices & Distributed Systems (Code-Switching)",
    rawQuery: "Distributed systems deep dive chahiye with weekly live Q&A under 5k",
    language: "code_switching",
    category: "system_design",
    budgetPaise: 500000,
    isHardCeiling: true,
    mustHave: ["system_design_curriculum", "mentor_feedback"],
    requiresHumanMentor: false,
    expectedOutcome: { expectedWinnerCategory: "system_design", shouldRefuseToTransact: false },
  },
  {
    id: "bm_sd_013",
    name: "High Touch Mentoring Only (Hinglish)",
    rawQuery: "Sirf recorded videos nahi chalega, live human reviews chahiye weekly",
    language: "hinglish",
    category: "system_design",
    budgetPaise: 450000,
    isHardCeiling: true,
    mustHave: ["system_design_curriculum", "human_mentor"],
    requiresHumanMentor: true,
    expectedOutcome: { expectedWinnerCategory: "system_design", shouldRefuseToTransact: false },
  },
  {
    id: "bm_sd_014",
    name: "Fintech Architecture Track (English)",
    rawQuery: "Looking for fintech ledger & high scale transaction architecture course under 4000/mo",
    language: "en",
    category: "system_design",
    budgetPaise: 400000,
    isHardCeiling: true,
    mustHave: ["system_design_curriculum"],
    requiresHumanMentor: false,
    expectedOutcome: { expectedWinnerCategory: "system_design", shouldRefuseToTransact: false },
  },
  {
    id: "bm_sd_015",
    name: "30-Day Money Back Request (Code-Switching)",
    rawQuery: "30 days money back guarantee wala system design course batao under 3.5k",
    language: "code_switching",
    category: "system_design",
    budgetPaise: 350000,
    isHardCeiling: true,
    mustHave: ["system_design_curriculum"],
    requiresHumanMentor: false,
    refundDays: 30,
    expectedOutcome: { expectedWinnerCategory: "system_design", shouldRefuseToTransact: false },
  },

  // 16-30: Data Structures & Algorithms (DSA) Track
  {
    id: "bm_dsa_016",
    name: "DSA Problem Solving Track (English)",
    rawQuery: "Comprehensive DSA problem solving course under 2500 per month with leetcode patterns",
    language: "en",
    category: "dsa",
    budgetPaise: 250000,
    isHardCeiling: true,
    mustHave: ["dsa_curriculum", "leetcode_patterns"],
    requiresHumanMentor: false,
    expectedOutcome: { expectedWinnerCategory: "dsa", shouldRefuseToTransact: false },
  },
  {
    id: "bm_dsa_017",
    name: "DSA Intensive with Human Feedback (Hinglish)",
    rawQuery: "DSA intensive chahiye jisme human code review mile under 3k monthly",
    language: "hinglish",
    category: "dsa",
    budgetPaise: 300000,
    isHardCeiling: true,
    mustHave: ["dsa_curriculum", "human_mentor"],
    requiresHumanMentor: true,
    expectedOutcome: { expectedWinnerCategory: "dsa", shouldRefuseToTransact: false },
  },
  {
    id: "bm_dsa_018",
    name: "Competitive Coding Fundamentals (Hindi)",
    rawQuery: "डेटा स्ट्रक्चर्स और एल्गोरिदम सीखने के लिए सबसे अच्छा कोर्स बताएं",
    language: "hi",
    category: "dsa",
    budgetPaise: 200000,
    isHardCeiling: false,
    mustHave: ["dsa_curriculum"],
    requiresHumanMentor: false,
    expectedOutcome: { expectedWinnerCategory: "dsa", shouldRefuseToTransact: false },
  },
  {
    id: "bm_dsa_019",
    name: "Leetcode Hard Mastery (Code-Switching)",
    rawQuery: "Hard leetcode graphs and dp problems master karna hai under 3000",
    language: "code_switching",
    category: "dsa",
    budgetPaise: 300000,
    isHardCeiling: true,
    mustHave: ["dsa_curriculum", "leetcode_patterns"],
    requiresHumanMentor: false,
    expectedOutcome: { expectedWinnerCategory: "dsa", shouldRefuseToTransact: false },
  },
  {
    id: "bm_dsa_020",
    name: "Beginner DSA with Contest Practice (English)",
    rawQuery: "Beginner DSA plan with weekly contests and doubt clearing under 2000 INR",
    language: "en",
    category: "dsa",
    budgetPaise: 200000,
    isHardCeiling: true,
    mustHave: ["dsa_curriculum"],
    requiresHumanMentor: false,
    expectedOutcome: { expectedWinnerCategory: "dsa", shouldRefuseToTransact: false },
  },
  {
    id: "bm_dsa_021",
    name: "Fast DSA Crash Course (Hinglish)",
    rawQuery: "1 month me DSA complete karne wala fast track course batao under 2500",
    language: "hinglish",
    category: "dsa",
    budgetPaise: 250000,
    isHardCeiling: false,
    mustHave: ["dsa_curriculum"],
    requiresHumanMentor: false,
    expectedOutcome: { expectedWinnerCategory: "dsa", shouldRefuseToTransact: false },
  },
  {
    id: "bm_dsa_022",
    name: "Graph Algorithms Specialization (English)",
    rawQuery: "Advanced graph theory and dynamic programming monthly sub under 3500",
    language: "en",
    category: "dsa",
    budgetPaise: 350000,
    isHardCeiling: true,
    mustHave: ["dsa_curriculum"],
    requiresHumanMentor: false,
    expectedOutcome: { expectedWinnerCategory: "dsa", shouldRefuseToTransact: false },
  },
  {
    id: "bm_dsa_023",
    name: "Daily Code Review DSA (Code-Switching)",
    rawQuery: "Daily live doubt clearing session chahiye DSA me budget 4k",
    language: "code_switching",
    category: "dsa",
    budgetPaise: 400000,
    isHardCeiling: true,
    mustHave: ["dsa_curriculum", "mentor_feedback"],
    requiresHumanMentor: true,
    expectedOutcome: { expectedWinnerCategory: "dsa", shouldRefuseToTransact: false },
  },
  {
    id: "bm_dsa_024",
    name: "DSA with 14 Day Trial (Hinglish)",
    rawQuery: "DSA course with refund guarantee if not satisfied under 2k",
    language: "hinglish",
    category: "dsa",
    budgetPaise: 200000,
    isHardCeiling: true,
    mustHave: ["dsa_curriculum"],
    requiresHumanMentor: false,
    refundDays: 14,
    expectedOutcome: { expectedWinnerCategory: "dsa", shouldRefuseToTransact: false },
  },
  {
    id: "bm_dsa_025",
    name: "FAANG DSA Preparation (English)",
    rawQuery: "Targeting Google and Meta coding interviews, need rigorous curriculum under 3000/mo",
    language: "en",
    category: "dsa",
    budgetPaise: 300000,
    isHardCeiling: true,
    mustHave: ["dsa_curriculum", "leetcode_patterns"],
    requiresHumanMentor: false,
    expectedOutcome: { expectedWinnerCategory: "dsa", shouldRefuseToTransact: false },
  },
  {
    id: "bm_dsa_026",
    name: "Hindi Medium DSA (Hindi)",
    rawQuery: "हिंदी में समझाई गई डेटा स्ट्रक्चर्स और एल्गोरिदम क्लासेस",
    language: "hi",
    category: "dsa",
    budgetPaise: 200000,
    isHardCeiling: true,
    mustHave: ["dsa_curriculum"],
    requiresHumanMentor: false,
    expectedOutcome: { expectedWinnerCategory: "dsa", shouldRefuseToTransact: false },
  },
  {
    id: "bm_dsa_027",
    name: "Mock Coding Test Series (Code-Switching)",
    rawQuery: "DSA coding mock tests with timed environment under 2500 per month",
    language: "code_switching",
    category: "dsa",
    budgetPaise: 250000,
    isHardCeiling: true,
    mustHave: ["dsa_curriculum", "mock_interviews"],
    requiresHumanMentor: false,
    expectedOutcome: { expectedWinnerCategory: "dsa", shouldRefuseToTransact: false },
  },
  {
    id: "bm_dsa_028",
    name: "Trie and Segment Trees Focus (English)",
    rawQuery: "Advanced data structures trie segment trees disjoint set union under 3000",
    language: "en",
    category: "dsa",
    budgetPaise: 300000,
    isHardCeiling: false,
    mustHave: ["dsa_curriculum"],
    requiresHumanMentor: false,
    expectedOutcome: { expectedWinnerCategory: "dsa", shouldRefuseToTransact: false },
  },
  {
    id: "bm_dsa_029",
    name: "Student Budget DSA (Hinglish)",
    rawQuery: "College student hu, affordable DSA track under 1500 monthly batao",
    language: "hinglish",
    category: "dsa",
    budgetPaise: 150000,
    isHardCeiling: true,
    mustHave: ["dsa_curriculum"],
    requiresHumanMentor: false,
    expectedOutcome: { expectedWinnerCategory: "dsa", shouldRefuseToTransact: false },
  },
  {
    id: "bm_dsa_030",
    name: "DSA Interview Simulation (English)",
    rawQuery: "Looking for DSA plan that includes 2 monthly 1:1 live mock interviews for under 3500",
    language: "en",
    category: "dsa",
    budgetPaise: 350000,
    isHardCeiling: true,
    mustHave: ["dsa_curriculum", "mock_interviews"],
    requiresHumanMentor: true,
    expectedOutcome: { expectedWinnerCategory: "dsa", shouldRefuseToTransact: false },
  },

  // 31-45: Mock Interviews & Behavioral Prep
  {
    id: "bm_mock_031",
    name: "1:1 Live Mock Interviews (English)",
    rawQuery: "Dedicated 1-on-1 mock interviews with ex-FAANG engineers budget 5k monthly",
    language: "en",
    category: "mock_interviews",
    budgetPaise: 500000,
    isHardCeiling: false,
    mustHave: ["mock_interviews", "human_mentor"],
    requiresHumanMentor: true,
    expectedOutcome: { expectedWinnerCategory: "mock_interviews", shouldRefuseToTransact: false },
  },
  {
    id: "bm_mock_032",
    name: "Behavioral & Leadership Round Prep (Hinglish)",
    rawQuery: "Engineering manager aur behavioral interview prep plan under 3k",
    language: "hinglish",
    category: "behavioral",
    budgetPaise: 300000,
    isHardCeiling: true,
    mustHave: ["behavioral_curriculum"],
    requiresHumanMentor: false,
    expectedOutcome: { expectedWinnerCategory: "behavioral", shouldRefuseToTransact: false },
  },
  {
    id: "bm_mock_033",
    name: "Weekly Mock Pack (Code-Switching)",
    rawQuery: "Monthly plan with 4 real mock interview sessions and written feedback under 6000",
    language: "code_switching",
    category: "mock_interviews",
    budgetPaise: 600000,
    isHardCeiling: true,
    mustHave: ["mock_interviews", "mentor_feedback"],
    requiresHumanMentor: true,
    expectedOutcome: { expectedWinnerCategory: "mock_interviews", shouldRefuseToTransact: false },
  },
  {
    id: "bm_mock_034",
    name: "STAR Method Behavioral Coaching (English)",
    rawQuery: "STAR framework behavioral answers review with senior mentor under 4000 INR",
    language: "en",
    category: "behavioral",
    budgetPaise: 400000,
    isHardCeiling: true,
    mustHave: ["behavioral_curriculum", "human_mentor"],
    requiresHumanMentor: true,
    expectedOutcome: { expectedWinnerCategory: "behavioral", shouldRefuseToTransact: false },
  },
  {
    id: "bm_mock_035",
    name: "Hindi Behavioral Practice (Hindi)",
    rawQuery: "लीडरशिप और बिहेवियरल इंटरव्यू की तैयारी के लिए मार्गदर्शन",
    language: "hi",
    category: "behavioral",
    budgetPaise: 250000,
    isHardCeiling: false,
    mustHave: ["behavioral_curriculum"],
    requiresHumanMentor: false,
    expectedOutcome: { expectedWinnerCategory: "behavioral", shouldRefuseToTransact: false },
  },
  {
    id: "bm_mock_036",
    name: "Mock Interview Urgent Schedule (Hinglish)",
    rawQuery: "2 din me mock interview chahiye with senior engineer budget 5k",
    language: "hinglish",
    category: "mock_interviews",
    budgetPaise: 500000,
    isHardCeiling: true,
    mustHave: ["mock_interviews", "human_mentor"],
    requiresHumanMentor: true,
    slaHours: 24,
    expectedOutcome: { expectedWinnerCategory: "mock_interviews", shouldRefuseToTransact: false },
  },
  {
    id: "bm_mock_037",
    name: "System Design + Mock Combo (English)",
    rawQuery: "Combined system design curriculum and 4 monthly mock interviews under 4500",
    language: "en",
    category: "mock_interviews",
    budgetPaise: 450000,
    isHardCeiling: true,
    mustHave: ["system_design_curriculum", "mock_interviews"],
    requiresHumanMentor: true,
    expectedOutcome: { expectedWinnerCategory: "mock_interviews", shouldRefuseToTransact: false },
  },
  {
    id: "bm_mock_038",
    name: "Salary Negotiation & Offer Review (Code-Switching)",
    rawQuery: "Offer evaluation aur salary negotiation coaching under 4000 per month",
    language: "code_switching",
    category: "career_prep",
    budgetPaise: 400000,
    isHardCeiling: true,
    mustHave: ["career_coaching"],
    requiresHumanMentor: true,
    expectedOutcome: { expectedWinnerCategory: "career_prep", shouldRefuseToTransact: false },
  },
  {
    id: "bm_mock_039",
    name: "Staff Engineer Mock Panel (English)",
    rawQuery: "Staff level L6 mock panel with detailed scorecard under 8000/mo",
    language: "en",
    category: "mock_interviews",
    budgetPaise: 800000,
    isHardCeiling: false,
    mustHave: ["mock_interviews", "human_mentor"],
    requiresHumanMentor: true,
    expectedOutcome: { expectedWinnerCategory: "mock_interviews", shouldRefuseToTransact: false },
  },
  {
    id: "bm_mock_040",
    name: "Resume & Portfolio Review (Hinglish)",
    rawQuery: "Resume review aur LinkedIn profile audit chahiye under 2000",
    language: "hinglish",
    category: "career_prep",
    budgetPaise: 200000,
    isHardCeiling: true,
    mustHave: ["resume_review"],
    requiresHumanMentor: true,
    expectedOutcome: { expectedWinnerCategory: "career_prep", shouldRefuseToTransact: false },
  },
  {
    id: "bm_mock_041",
    name: "Peer Mock Community Access (Hindi)",
    rawQuery: "साथी छात्रों के साथ मॉक इंटरव्यू प्रैक्टिस करने का कम्युनिटी प्लान",
    language: "hi",
    category: "mock_interviews",
    budgetPaise: 150000,
    isHardCeiling: true,
    mustHave: ["mock_interviews"],
    requiresHumanMentor: false,
    expectedOutcome: { expectedWinnerCategory: "mock_interviews", shouldRefuseToTransact: false },
  },
  {
    id: "bm_mock_042",
    name: "Amazon LP Deep Dive (Code-Switching)",
    rawQuery: "Amazon 16 leadership principles prep with mock feedback under 3.5k",
    language: "code_switching",
    category: "behavioral",
    budgetPaise: 350000,
    isHardCeiling: true,
    mustHave: ["behavioral_curriculum"],
    requiresHumanMentor: true,
    expectedOutcome: { expectedWinnerCategory: "behavioral", shouldRefuseToTransact: false },
  },
  {
    id: "bm_mock_043",
    name: "Full Stack Live Coding Simulation (English)",
    rawQuery: "Live coding frontend backend full stack interview simulation under 4000",
    language: "en",
    category: "mock_interviews",
    budgetPaise: 400000,
    isHardCeiling: true,
    mustHave: ["mock_interviews"],
    requiresHumanMentor: true,
    expectedOutcome: { expectedWinnerCategory: "mock_interviews", shouldRefuseToTransact: false },
  },
  {
    id: "bm_mock_044",
    name: "Post-Mock Action Plan (Hinglish)",
    rawQuery: "Mock interview ke baad personalized study roadmap dene wala plan under 4k",
    language: "hinglish",
    category: "mock_interviews",
    budgetPaise: 400000,
    isHardCeiling: false,
    mustHave: ["mock_interviews", "mentor_feedback"],
    requiresHumanMentor: true,
    expectedOutcome: { expectedWinnerCategory: "mock_interviews", shouldRefuseToTransact: false },
  },
  {
    id: "bm_mock_045",
    name: "Guaranteed Mentor Experience (English)",
    rawQuery: "Guaranteed 10+ years experience mentor for executive interview prep under 7000",
    language: "en",
    category: "mock_interviews",
    budgetPaise: 700000,
    isHardCeiling: true,
    mustHave: ["mock_interviews", "human_mentor"],
    requiresHumanMentor: true,
    expectedOutcome: { expectedWinnerCategory: "mock_interviews", shouldRefuseToTransact: false },
  },
];

// Helper to expand blueprints into 100 comprehensive missions
function generate100Missions(): BenchmarkBuyerMission[] {
  const missions: BenchmarkBuyerMission[] = [];

  // Add the 45 curated base blueprints
  for (const bp of BLUEPRINTS) {
    missions.push(buildMissionFromBlueprint(bp));
  }

  // Generate 55 additional realistic parameterized variations to reach exactly 100
  const categories = ["system_design", "dsa", "mock_interviews", "behavioral", "career_prep"];
  const languages: BenchmarkLanguage[] = ["en", "hi", "hinglish", "code_switching"];

  for (let i = 46; i <= 100; i++) {
    const cat = categories[i % categories.length];
    const lang = languages[i % languages.length];
    const budgetPaise = (2000 + (i % 8) * 500) * 100; // ₹2,000 to ₹5,500
    const isHard = i % 2 === 0;
    const hasMentor = i % 3 === 0;

    let rawQuery = `Looking for ${cat.replace(/_/g, " ")} monthly plan under ₹${budgetPaise / 100}`;
    if (lang === "hinglish") {
      rawQuery = `${cat.replace(/_/g, " ")} ke liye monthly course chahiye budget ₹${budgetPaise / 100} ke aas paas`;
    } else if (lang === "hi") {
      rawQuery = `मुझे ₹${budgetPaise / 100} के अंदर ${cat.replace(/_/g, " ")} की तैयारी के लिए कोर्स बताएं`;
    } else if (lang === "code_switching") {
      rawQuery = `${cat.replace(/_/g, " ")} track under ${budgetPaise / 100} with ${hasMentor ? "human mentor" : "self paced lessons"}`;
    }

    const bp: MissionBlueprint = {
      id: `bm_gen_${String(i).padStart(3, "0")}`,
      name: `${cat.replace(/_/g, " ").toUpperCase()} Mission ${i} (${lang})`,
      rawQuery,
      language: lang,
      category: cat,
      budgetPaise,
      isHardCeiling: isHard,
      mustHave: [cat === "system_design" ? "system_design_curriculum" : cat === "dsa" ? "dsa_curriculum" : "mock_interviews"],
      requiresHumanMentor: hasMentor,
      slaHours: hasMentor ? 24 : undefined,
      refundDays: i % 4 === 0 ? 14 : undefined,
      expectedOutcome: {
        expectedWinnerCategory: cat,
        shouldRefuseToTransact: false,
      },
    };

    missions.push(buildMissionFromBlueprint(bp));
  }

  return missions;
}

function buildMissionFromBlueprint(bp: MissionBlueprint): BenchmarkBuyerMission {
  const intent = normalizeBuyerIntent({
    category: bp.category,
    budget: {
      amountPaise: bp.budgetPaise,
      currency: "INR",
      type: bp.isHardCeiling ? "HARD" : "SOFT",
    },
    billing: {
      cadence: "monthly",
      isRecurring: true,
    },
    mustHave: bp.mustHave,
    niceToHave: bp.niceToHave || [],
    supportPreference: bp.requiresHumanMentor
      ? {
          tier: "dedicated_mentor",
          hasDedicatedHuman: true,
          maxSlaHours: bp.slaHours || 24,
        }
      : undefined,
    context: {
      language: bp.language === "hi" ? "hi" : "en",
      rawQuery: bp.rawQuery,
    },
  });

  return {
    id: bp.id,
    name: bp.name,
    rawQuery: bp.rawQuery,
    language: bp.language,
    category: bp.category,
    intent,
    mustHaveEntitlements: bp.mustHave,
    hardBudgetPaise: bp.isHardCeiling ? bp.budgetPaise : undefined,
    isHardCeiling: bp.isHardCeiling,
    requiresHumanMentor: bp.requiresHumanMentor,
    minRefundDays: bp.refundDays,
    maxSlaHours: bp.slaHours,
    expectedAcceptableOutcome: bp.expectedOutcome,
  };
}

const GOLD_MISSIONS = generate100Missions();

// Compute cryptographic SHA-256 hash of dataset to enforce immutability
const canonicalJSON = JSON.stringify(GOLD_MISSIONS.map((m) => ({ id: m.id, q: m.rawQuery, c: m.category, b: m.hardBudgetPaise })));
const datasetHash = createHash("sha256").update(canonicalJSON).digest("hex");

export const GOLD_BUYABILITY_COHORT_V1: BuyabilityBenchmarkCohort = {
  benchmarkId: "buyability_gold_cohort_v1",
  benchmarkVersion: "1.0.0",
  createdAt: "2026-08-26T00:00:00.000Z",
  caseCount: GOLD_MISSIONS.length,
  datasetHash,
  missions: GOLD_MISSIONS,
};

export function getGoldBuyabilityCohort(): BuyabilityBenchmarkCohort {
  return GOLD_BUYABILITY_COHORT_V1;
}
