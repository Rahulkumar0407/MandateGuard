"use client";

import React, { useEffect, useState } from "react";
import { Navbar, type ViewTab } from "./Navbar";
import { HomeOverview } from "./HomeOverview";
import { MerchantOverviewDashboard } from "./MerchantOverviewDashboard";
import { CustomerProtectionPortal } from "./CustomerProtectionPortal";
import { DeveloperConsole } from "./DeveloperConsole";
import { ConversationalBuyerPortal } from "./ConversationalBuyerPortal";
import { PublicLandingPage } from "./PublicLandingPage";
import { AuthModal } from "./AuthModal";
import { BusinessOnboarding } from "./BusinessOnboarding";
import { TransactionsWorkspace } from "./TransactionsWorkspace";
import { CustomersView } from "./CustomersView";

interface PublicSession {
  name: string;
  email: string;
  isSample: boolean;
  onboardingComplete: boolean;
}

interface ResolvedMerchant {
  id: string;
  name: string;
  description: string;
  status: string;
}

interface SessionInfo {
  authenticated: boolean;
  session?: PublicSession;
  merchant: ResolvedMerchant | null;
  offersCount: number;
  analysisState: string | null;
}

type View = "landing" | "onboarding" | "dashboard";

export function AppShell() {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [view, setView] = useState<View>("landing");
  const [activeTab, setActiveTab] = useState<ViewTab>("home");
  const [authOpen, setAuthOpen] = useState(false);
  const [isSample, setIsSample] = useState(false);

  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const refreshSession = async () => {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as SessionInfo;
  };

  useEffect(() => {
    (async () => {
      const data = await refreshSession();
      setSession(data);
      if (data?.authenticated) {
        setIsSample(Boolean(data.session?.isSample));
        setView(data.session?.onboardingComplete ? "dashboard" : "onboarding");
      } else {
        setView("landing");
      }
      setBooting(false);
    })();
  }, []);

  const handleGetStarted = () => setAuthOpen(true);

  const handleAuthSuccess = async (user: { name: string; email: string }) => {
    await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ method: "email", email: user.email, name: user.name }),
    });
    const data = await refreshSession();
    setSession(data);
    setIsSample(Boolean(data?.session?.isSample));
    setView("onboarding");
    setAuthOpen(false);
  };

  const handleExploreDemo = async () => {
    await fetch("/api/auth/sample", { method: "POST" });
    const data = await refreshSession();
    setSession(data);
    setIsSample(true);
    setView("dashboard");
    setActiveTab("home");
  };

  const handleOnboardingComplete = async () => {
    await fetch("/api/auth/onboarding", { method: "POST" });
    const data = await refreshSession();
    setSession(data);
    setIsSample(Boolean(data?.session?.isSample));
    setView("dashboard");
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    setSession(null);
    setIsSample(false);
    setView("landing");
  };

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    setSeedMessage(null);
    try {
      const res = await fetch("/api/demo/seed", { method: "POST" });
      const data = await res.json();
      setSeedMessage(data.message || "Reset demo data complete.");
      setTimeout(() => setSeedMessage(null), 3500);
      const s = await refreshSession();
      setSession(s);
    } catch {
      setSeedMessage("Reset failed");
    } finally {
      setIsSeeding(false);
    }
  };

  if (booting) {
    return (
      <div className="min-h-screen bg-[var(--mg-bg)] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0B5CFF] to-[#004DE6] text-white flex items-center justify-center font-black text-xl shadow-[0_0_24px_rgba(11,92,255,0.5)] animate-pulse">
            M
          </div>
          <span className="text-xs font-bold text-[var(--mg-text-muted)]">Loading MandateGuard...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {view === "landing" && (
        <PublicLandingPage
          onGetStarted={handleGetStarted}
          onExploreDemo={handleExploreDemo}
        />
      )}

      {view === "onboarding" && (
        <div className="min-h-screen bg-[var(--mg-bg)] text-[var(--mg-text)] flex flex-col">
          <header className="border-b border-[var(--mg-border)] mg-glass-1 py-4 px-6 shadow-xs">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-xl bg-[#0B5CFF] text-white flex items-center justify-center font-black text-xs shadow-xs">
                  M
                </div>
                <span className="text-base font-extrabold tracking-tight text-[var(--mg-text)]">MandateGuard</span>
              </div>
              <button
                onClick={handleExploreDemo}
                className="text-xs font-bold text-[#0B5CFF] hover:underline transition-colors mg-press"
              >
                Skip to sample business →
              </button>
            </div>
          </header>
          <main className="flex-1">
            <BusinessOnboarding
              onComplete={handleOnboardingComplete}
              onRunFirstTest={handleOnboardingComplete}
            />
          </main>
        </div>
      )}

      {view === "dashboard" && (
        <div className="min-h-screen bg-[var(--mg-bg)] text-[var(--mg-text)] flex flex-col font-sans antialiased">
          {isSample && (
            <div className="bg-amber-500/10 text-amber-500 text-center text-xs font-bold px-4 py-2 border-b border-amber-500/20 backdrop-blur-sm">
              Sample business · Razorpay Test Mode Sandbox for evaluation.
            </div>
          )}
          <Navbar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onSeedDemo={handleSeedDemo}
            isSeeding={isSeeding}
            seedMessage={seedMessage}
            userName={
              session?.session?.name ||
              session?.merchant?.name ||
              "InterviewForge AI"
            }
            onSignOut={handleSignOut}
            onViewLanding={() => setView("landing")}
          />

          {/* Main Application Canvas */}
          <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <main className="w-full">
              {activeTab === "home" && <HomeOverview onNavigate={setActiveTab} report={null} />}
              {activeTab === "grow" && <MerchantOverviewDashboard onNavigateTab={setActiveTab} />}
              {activeTab === "buy" && <ConversationalBuyerPortal />}
              {activeTab === "transactions" && <TransactionsWorkspace />}
              {activeTab === "customers" && <CustomersView onNavigateToBuyer={() => setActiveTab("buy")} />}
              {activeTab === "protection" && <CustomerProtectionPortal />}
              {activeTab === "developer" && <DeveloperConsole />}
            </main>
          </div>

          <footer className="border-t border-[var(--mg-border)] mg-glass-1 py-6 text-xs text-[var(--mg-text-muted)] mt-auto">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[var(--mg-text)]">MandateGuard</span>
                <span>—</span>
                <span>AI Growth &amp; Agentic Commerce on Razorpay Test Mode</span>
              </div>
              <div className="flex items-center gap-3 font-semibold text-[11px] text-[var(--mg-text-muted)]">
                <span>BUY: Find &amp; Buy</span>
                <span>•</span>
                <span>GROW: How AI sees you</span>
                <span>•</span>
                <span>PROTECT: Gated Authorizations</span>
              </div>
            </div>
          </footer>
        </div>
      )}

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        onExploreDemo={handleExploreDemo}
      />
    </>
  );
}
