"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar, type ViewTab } from "./Navbar";
import { HomeOverview } from "./HomeOverview";
import { MerchantOverviewDashboard } from "./MerchantOverviewDashboard";
import { CustomerProtectionPortal } from "./CustomerProtectionPortal";
import { DeveloperConsole } from "./DeveloperConsole";
import { ConversationalBuyerPortal } from "./ConversationalBuyerPortal";
import { PublicLandingPage } from "./PublicLandingPage";
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
  const router = useRouter();
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [view, setView] = useState<View>("landing");
  const [activeTab, setActiveTab] = useState<ViewTab>("home");
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

  const handleGetStarted = () => {
    router.push("/auth/sign-in");
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
      <div className="min-h-screen bg-[var(--mg-bg)] flex items-center justify-center" style={{ transition: "background 0.3s ease" }}>
        <div className="flex flex-col items-center" style={{ gap: "20px" }}>
          {/* Premium loader mark */}
          <div
            style={{
              position: "relative",
              width: "56px",
              height: "56px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Integrity ring SVG */}
            <svg
              viewBox="0 0 56 56"
              fill="none"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                animation: "ring-form 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              }}
            >
              <circle
                cx="28"
                cy="28"
                r="25"
                stroke="var(--mg-brand)"
                strokeWidth="1.5"
                strokeOpacity="0.3"
                fill="none"
              />
              <circle
                cx="28"
                cy="28"
                r="25"
                stroke="var(--mg-brand)"
                strokeWidth="1.5"
                strokeDasharray="157"
                strokeDashoffset="157"
                fill="none"
                strokeLinecap="round"
                style={{
                  animation: "ring-draw 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                  filter: "drop-shadow(0 0 4px rgba(11, 92, 255, 0.4))",
                }}
              />
              {/* Traveling shine dot */}
              <circle
                cx="28"
                cy="3"
                r="2.5"
                fill="var(--mg-brand)"
                style={{
                  animation: "shine-travel 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                  filter: "drop-shadow(0 0 6px rgba(11, 92, 255, 0.8))",
                }}
              />
            </svg>

            {/* M monogram */}
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #0B5CFF, #004DE6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "16px",
                color: "white",
                animation: "mark-appear 0.5s ease-out 0.2s both",
              }}
            >
              M
            </div>
          </div>

          {/* Brand name */}
          <div
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "var(--mg-text-muted)",
              textTransform: "uppercase",
              opacity: 0,
              animation: "text-resolve 0.5s ease-out 0.6s forwards",
            }}
          >
            Secure Commerce Initializing
          </div>
        </div>

        <style>{`
          @keyframes ring-form {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          @keyframes ring-draw {
            0% { stroke-dashoffset: 157; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes shine-travel {
            0% { transform: rotate(0deg) translateX(25px); opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { transform: rotate(360deg) translateX(25px); opacity: 0; }
          }
          @keyframes mark-appear {
            0% { opacity: 0; filter: blur(4px); transform: scale(0.9); }
            100% { opacity: 1; filter: blur(0); transform: scale(1); }
          }
          @keyframes text-resolve {
            0% { opacity: 0; filter: blur(3px); }
            100% { opacity: 1; filter: blur(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
            }
          }
        `}</style>
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
    </>
  );
}
