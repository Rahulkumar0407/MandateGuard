"use client";

import React from "react";

export type ViewTab = "merchant" | "agent" | "reauthorization" | "guided_demo";

interface NavbarProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  onSeedDemo: () => Promise<void>;
  isSeeding: boolean;
  seedMessage: string | null;
}

export function Navbar({
  activeTab,
  onTabChange,
  onSeedDemo,
  isSeeding,
  seedMessage,
}: NavbarProps) {
  return (
    <header className="bg-[#0c2340] border-b border-[#1b3a60] text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#0066ff] to-[#3395ff] flex items-center justify-center shadow-inner">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold tracking-tight text-lg text-white">
                  MandateGuard
                </span>
                <span className="bg-[#1b3a60] text-[#3395ff] text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border border-[#2b5280]">
                  Razorpay Subscriptions
                </span>
              </div>
              <p className="text-xs text-slate-300 hidden sm:block">
                Semantic Commercial Integrity & Autonomous Agent Safeguards
              </p>
            </div>
          </div>

          {/* Quick Seeder & Environment status */}
          <div className="flex items-center space-x-3">
            {seedMessage && (
              <span className="text-xs text-emerald-400 font-medium hidden md:inline animate-fade-in">
                {seedMessage}
              </span>
            )}
            <button
              onClick={onSeedDemo}
              disabled={isSeeding}
              className="inline-flex items-center text-xs font-medium bg-[#143257] hover:bg-[#1c4373] text-slate-200 border border-[#26538a] px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
            >
              <svg
                className={`w-3.5 h-3.5 mr-1.5 text-[#3395ff] ${
                  isSeeding ? "animate-spin" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {isSeeding ? "Seeding..." : "Reset Demo Catalog"}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 sm:space-x-4 border-t border-[#1b3a60]/60 pt-1 -mb-px overflow-x-auto">
          <button
            onClick={() => onTabChange("guided_demo")}
            className={`py-2 px-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              activeTab === "guided_demo"
                ? "border-[#3395ff] text-white"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500"
            }`}
          >
            <span>⚡</span>
            <span>Interactive Guided Demo</span>
          </button>

          <button
            onClick={() => onTabChange("merchant")}
            className={`py-2 px-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              activeTab === "merchant"
                ? "border-[#3395ff] text-white"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500"
            }`}
          >
            <span>🏢</span>
            <span>Merchant Offer Studio & Impact Preview</span>
          </button>

          <button
            onClick={() => onTabChange("agent")}
            className={`py-2 px-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              activeTab === "agent"
                ? "border-[#3395ff] text-white"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500"
            }`}
          >
            <span>🛡️</span>
            <span>Subscriber & Autonomous Agent Shield</span>
          </button>

          <button
            onClick={() => onTabChange("reauthorization")}
            className={`py-2 px-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              activeTab === "reauthorization"
                ? "border-[#3395ff] text-white"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500"
            }`}
          >
            <span>🔄</span>
            <span>Reauthorization State Machine</span>
          </button>
        </div>
      </div>
    </header>
  );
}
