"use client";

import React, { useState } from "react";
import { Navbar, type ViewTab } from "./Navbar";
import { MerchantImpactSimulator } from "./MerchantImpactSimulator";
import { AgentCompatibilityShield } from "./AgentCompatibilityShield";
import { ReauthorizationConsole } from "./ReauthorizationConsole";
import { EndToEndDemoFlow } from "./EndToEndDemoFlow";

export function DemoConsole() {
  const [activeTab, setActiveTab] = useState<ViewTab>("guided_demo");
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    setSeedMessage(null);
    try {
      const res = await fetch("/api/demo/seed", { method: "POST" });
      if (!res.ok) {
        throw new Error("Failed to seed demo environment.");
      }
      const data = await res.json();
      setSeedMessage(data.message || "Demo catalog seeded successfully.");
      setTimeout(() => setSeedMessage(null), 5000);
    } catch (err: unknown) {
      setSeedMessage(
        err instanceof Error ? err.message : "Error seeding demo environment.",
      );
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#08121f] text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-[#0066ff] selection:text-white">
      {/* Top Razorpay-Themed Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSeedDemo={handleSeedDemo}
        isSeeding={isSeeding}
        seedMessage={seedMessage}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "guided_demo" && <EndToEndDemoFlow />}
        {activeTab === "merchant" && <MerchantImpactSimulator />}
        {activeTab === "agent" && <AgentCompatibilityShield />}
        {activeTab === "reauthorization" && <ReauthorizationConsole />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c2340]/40 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              MandateGuard
            </span>
            <span>—</span>
            <span>Semantic Offer Integrity & Autonomous Agent Protection for Razorpay Subscriptions</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Test Mode Verified</span>
            <span>•</span>
            <span>Deterministic Policy Engine</span>
            <span>•</span>
            <span>Server Authoritative</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
