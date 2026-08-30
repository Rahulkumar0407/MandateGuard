"use client";

import React from "react";
import type { ViewTab } from "./Navbar";
import { MerchantBuyabilityBenchmark } from "./MerchantBuyabilityBenchmark";

interface MerchantOverviewDashboardProps {
  onNavigateTab?: (tab: ViewTab) => void;
}

export function MerchantOverviewDashboard({
  onNavigateTab,
}: MerchantOverviewDashboardProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Flagship AI Growth Product Workspace */}
      <MerchantBuyabilityBenchmark onNavigateTab={onNavigateTab} />
    </div>
  );
}
