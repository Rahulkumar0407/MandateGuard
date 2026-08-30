"use client";

import React from "react";

/**
 * Bespoke Editorial Illustrations for MandateGuard Consumer-Fintech Experience
 * Light, modern SVG scenes explaining product concepts in seconds with Google Pay warmth.
 */

export function HeroCommerceIllustration({ className = "w-full h-auto max-w-md" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="240" cy="160" r="140" fill="#EFF6FF" />
      <circle cx="360" cy="120" r="80" fill="#ECFDF5" />

      <path
        d="M120 160 C 200 160, 280 160, 360 160"
        stroke="#BFDBFE"
        strokeWidth="4"
        strokeDasharray="6 6"
      />

      {/* Buyer Side (Left) */}
      <g transform="translate(60, 90)">
        <rect width="110" height="140" rx="18" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
        <rect x="14" y="18" width="82" height="12" rx="6" fill="#F1F5F9" />
        <rect x="14" y="40" width="82" height="34" rx="8" fill="#EFF6FF" stroke="#BFDBFE" />
        <rect x="22" y="48" width="50" height="6" rx="3" fill="#2563EB" />
        <rect x="22" y="58" width="64" height="6" rx="3" fill="#93C5FD" />
        <circle cx="55" cy="104" r="16" fill="#2563EB" />
        <path d="M48 104 L53 109 L63 99" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Verified Node */}
      <g transform="translate(216, 128)">
        <circle cx="24" cy="24" r="28" fill="#FFFFFF" stroke="#059669" strokeWidth="2.5" />
        <circle cx="24" cy="24" r="22" fill="#ECFDF5" />
        <path d="M16 24 L21 29 L32 18" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Merchant Side (Right) */}
      <g transform="translate(300, 80)">
        <rect width="130" height="160" rx="20" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
        <path d="M12 24 C 12 16, 118 16, 118 24 L118 42 L12 42 Z" fill="#0F172A" />
        <path d="M12 42 Q 22 52 33 42 Q 44 52 55 42 Q 66 52 77 42 Q 88 52 99 42 Q 110 52 118 42" fill="#2563EB" />
        <rect x="20" y="66" width="70" height="10" rx="4" fill="#0F172A" />
        <rect x="20" y="84" width="90" height="6" rx="3" fill="#64748B" />
        <rect x="20" y="96" width="76" height="6" rx="3" fill="#64748B" />
        <rect x="20" y="116" width="90" height="24" rx="8" fill="#ECFDF5" stroke="#A7F3D0" />
        <text x="32" y="132" fill="#059669" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
          ✓ AI-Ready Offer
        </text>
      </g>
    </svg>
  );
}

export function TheShiftIllustration({ className = "w-full h-auto max-w-lg" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 540 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Warm Glow */}
      <circle cx="270" cy="140" r="130" fill="#EFF6FF" />

      {/* Step 1: Person asks */}
      <g transform="translate(30, 60)">
        <rect width="130" height="160" rx="20" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
        <circle cx="65" cy="45" r="22" fill="#DBEAFE" />
        <path d="M55 45 C 55 40, 75 40, 75 45 C 75 52, 55 52, 55 45 Z" fill="#2563EB" />
        <rect x="20" y="82" width="90" height="30" rx="10" fill="#F8FAFC" stroke="#E2E8F0" />
        <text x="28" y="97" fill="#0F172A" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
          &ldquo;Find mentor&rdquo;
        </text>
        <text x="28" y="106" fill="#64748B" fontSize="7" fontFamily="sans-serif">
          under ₹4,000/mo
        </text>
        <rect x="25" y="125" width="80" height="18" rx="6" fill="#2563EB" />
        <text x="38" y="137" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
          Ask AI Buyer
        </text>
      </g>

      {/* Arrow 1 */}
      <path d="M175 140 L205 140" stroke="#93C5FD" strokeWidth="3" strokeDasharray="4 4" />

      {/* Step 2: AI Compares */}
      <g transform="translate(210, 45)">
        <rect width="130" height="190" rx="20" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="2" />
        <rect x="15" y="18" width="100" height="14" rx="7" fill="#EFF6FF" />
        <text x="24" y="29" fill="#1D4ED8" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
          AI Comparing Offers
        </text>
        {/* Competitor 1 */}
        <rect x="15" y="42" width="100" height="36" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
        <text x="22" y="55" fill="#64748B" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Offer A (₹3,799)</text>
        <text x="22" y="66" fill="#94A3B8" fontSize="7" fontFamily="sans-serif">Missing 24h SLA</text>

        {/* Winner Offer */}
        <rect x="15" y="86" width="100" height="42" rx="8" fill="#ECFDF5" stroke="#10B981" strokeWidth="1.5" />
        <text x="22" y="99" fill="#047857" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Your Offer (₹3,499)</text>
        <text x="22" y="110" fill="#059669" fontSize="7" fontFamily="sans-serif">✓ Verified Human 1:1</text>
        <text x="22" y="120" fill="#059669" fontSize="7" fontFamily="sans-serif">✓ 24h Guaranteed SLA</text>

        {/* Competitor 2 */}
        <rect x="15" y="136" width="100" height="36" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
        <text x="22" y="149" fill="#64748B" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Offer B (₹4,499)</text>
        <text x="22" y="160" fill="#94A3B8" fontSize="7" fontFamily="sans-serif">Exceeds Budget</text>
      </g>

      {/* Arrow 2 */}
      <path d="M355 140 L385 140" stroke="#10B981" strokeWidth="3" />

      {/* Step 3: Chosen & Transacted */}
      <g transform="translate(390, 60)">
        <rect width="130" height="160" rx="20" fill="#FFFFFF" stroke="#10B981" strokeWidth="2" />
        <circle cx="65" cy="45" r="22" fill="#ECFDF5" />
        <path d="M56 45 L62 51 L74 39" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <text x="25" y="84" fill="#065F46" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
          Offer Chosen!
        </text>
        <text x="20" y="98" fill="#047857" fontSize="8" fontFamily="sans-serif">
          ₹3,499 / month subscribed
        </text>
        <rect x="18" y="116" width="94" height="26" rx="8" fill="#ECFDF5" stroke="#A7F3D0" />
        <text x="24" y="132" fill="#059669" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
          🛡 Protected & Active
        </text>
      </g>
    </svg>
  );
}

export function AIGrowthIllustration({ className = "w-full h-auto max-w-sm" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 380 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="190" cy="130" r="110" fill="#FFFBEB" />
      {/* Vague Offer (Left) */}
      <g transform="translate(40, 50)">
        <rect width="130" height="160" rx="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="4 4" />
        <rect x="16" y="20" width="80" height="10" rx="5" fill="#94A3B8" />
        <rect x="16" y="42" width="98" height="28" rx="6" fill="#F1F5F9" />
        <text x="24" y="58" fill="#64748B" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
          &ldquo;Premium support&rdquo;
        </text>
        <circle cx="65" cy="110" r="18" fill="#FEE2E2" />
        <text x="60" y="115" fill="#DC2626" fontSize="16" fontWeight="bold" fontFamily="sans-serif">?</text>
        <text x="22" y="145" fill="#DC2626" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
          AI skipped offer
        </text>
      </g>

      {/* Arrow */}
      <path d="M185 130 L205 130" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
      <path d="M200 124 L208 130 L200 136" stroke="#D97706" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      {/* Clear Offer (Right) */}
      <g transform="translate(215, 45)">
        <rect width="135" height="170" rx="16" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
        <rect x="16" y="18" width="90" height="12" rx="6" fill="#0F172A" />
        <rect x="16" y="40" width="103" height="38" rx="8" fill="#ECFDF5" stroke="#A7F3D0" />
        <text x="24" y="55" fill="#059669" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
          ✓ Human Mentor (1:1)
        </text>
        <text x="24" y="70" fill="#059669" fontSize="8" fontFamily="sans-serif">
          ✓ 24h Response SLA
        </text>
        <rect x="16" y="92" width="103" height="30" rx="8" fill="#EFF6FF" />
        <text x="24" y="110" fill="#2563EB" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
          ₹3,499 / mo
        </text>
        <text x="24" y="146" fill="#059669" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
          ✓ +15 Buyers Served
        </text>
      </g>
    </svg>
  );
}

export function BlockedPaymentIllustration({ className = "w-full h-auto max-w-sm" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="180" cy="130" r="110" fill="#FEF2F2" />

      {/* Old Approved Terms */}
      <g transform="translate(30, 50)">
        <rect width="120" height="150" rx="16" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
        <text x="14" y="28" fill="#64748B" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
          Approved (v1)
        </text>
        <text x="14" y="48" fill="#0F172A" fontSize="14" fontWeight="black" fontFamily="sans-serif">
          ₹3,499
        </text>
        <text x="14" y="60" fill="#64748B" fontSize="8" fontFamily="sans-serif">
          / month locked
        </text>
        <rect x="14" y="80" width="92" height="20" rx="6" fill="#ECFDF5" />
        <text x="20" y="94" fill="#059669" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
          ✓ 1:1 Human Mentor
        </text>
      </g>

      {/* Block Shield in Middle */}
      <g transform="translate(155, 95)">
        <circle cx="25" cy="30" r="28" fill="#DC2626" />
        <path d="M18 30 L32 30" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        <text x="8" y="72" fill="#DC2626" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
          STOPPED
        </text>
      </g>

      {/* Attempted Changed Terms */}
      <g transform="translate(210, 50)">
        <rect width="120" height="150" rx="16" fill="#FFFFFF" stroke="#FCA5A5" strokeWidth="2" strokeDasharray="4 4" />
        <text x="14" y="28" fill="#DC2626" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
          Hike Attempt
        </text>
        <text x="14" y="48" fill="#DC2626" fontSize="14" fontWeight="black" fontFamily="sans-serif">
          ₹4,129
        </text>
        <text x="14" y="60" fill="#DC2626" fontSize="8" fontFamily="sans-serif">
          +18% unapproved
        </text>
        <rect x="14" y="80" width="92" height="20" rx="6" fill="#FEF2F2" />
        <text x="20" y="94" fill="#DC2626" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
          ✕ Term mismatch
        </text>
      </g>
    </svg>
  );
}

export function ProtectionShieldIllustration({ className = "w-full h-auto max-w-xs" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="140" cy="140" r="110" fill="#ECFDF5" />
      <circle cx="140" cy="140" r="85" fill="#FFFFFF" />

      {/* Outer Shield Outline */}
      <path
        d="M140 45 C 185 70, 215 85, 215 140 C 215 190, 175 220, 140 235 C 105 220, 65 190, 65 140 C 65 85, 95 70, 140 45 Z"
        fill="#059669"
      />

      {/* Inner Shield */}
      <path
        d="M140 60 C 175 80, 198 95, 198 140 C 198 180, 165 205, 140 218 C 115 205, 82 180, 82 140 C 82 95, 105 80, 140 60 Z"
        fill="#FFFFFF"
      />

      {/* Verification Checkmark */}
      <path
        d="M115 140 L132 157 L170 120"
        stroke="#059669"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StorefrontAvatar({ className = "w-10 h-10", name }: { className?: string; name?: string }) {
  return (
    <div className={`${className} rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-extrabold text-xs shadow-2xs`}>
      {name ? name.slice(0, 2).toUpperCase() : "🏪"}
    </div>
  );
}

