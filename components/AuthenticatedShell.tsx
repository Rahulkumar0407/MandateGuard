"use client";

import React, { useState, useCallback } from "react";
import { NavbarV2 } from "./NavbarV2";

interface SessionState {
  authenticated: boolean;
  session?: {
    name: string;
    email: string;
    isSample: boolean;
    onboardingComplete: boolean;
  };
  merchant: { id: string; name: string; description: string; status: string } | null;
  offersCount: number;
  analysisState: string | null;
  onboardingComplete: boolean;
}

interface AuthenticatedShellProps {
  session: SessionState;
  children: React.ReactNode;
}

export function AuthenticatedShell({ session, children }: AuthenticatedShellProps) {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [resolvedSession, setResolvedSession] = useState<SessionState>(session);

  const refreshSession = useCallback(async () => {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as SessionState;
  }, []);

  const handleSeedDemo = useCallback(async () => {
    setIsSeeding(true);
    setSeedMessage(null);
    try {
      const res = await fetch("/api/demo/seed", { method: "POST" });
      const data = await res.json();
      setSeedMessage(data.message || "Demo data reset.");
      setTimeout(() => setSeedMessage(null), 3500);
      const s = await refreshSession();
      if (s) setResolvedSession(s);
    } catch {
      setSeedMessage("Reset failed.");
    } finally {
      setIsSeeding(false);
    }
  }, [refreshSession]);

  const handleSignOut = useCallback(async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    // Hard navigation avoids hydration mismatch when shell still has open dropdown state
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/auth/sign-in";
  }, []);

  return (
    <div className="min-h-screen bg-[var(--mg-bg)] text-[var(--mg-text)] flex flex-col font-sans antialiased">
      {resolvedSession.session?.isSample && (
        <div
          style={{
            background: "rgba(245, 158, 11, 0.08)",
            borderBottom: "1px solid rgba(245, 158, 11, 0.15)",
            padding: "8px 0",
            textAlign: "center",
            fontSize: "11px",
            fontWeight: 700,
            color: "#F59E0B",
            letterSpacing: "0.02em",
          }}
        >
          Sample business · Test Mode · Safe evaluation environment
        </div>
      )}

      <NavbarV2
        session={{
          authenticated: resolvedSession.authenticated,
          session: resolvedSession.session ?? null,
          merchant: resolvedSession.merchant ? { name: resolvedSession.merchant.name } : null,
          onboardingComplete: resolvedSession.onboardingComplete,
        }}
        onSignOut={handleSignOut}
        onSeedDemo={handleSeedDemo}
        isSeeding={isSeeding}
        seedMessage={seedMessage}
      />

      <main className="flex-1">
        {children}
      </main>

      <footer
        style={{
          borderTop: "1px solid var(--mg-glass-1-border)",
          padding: "20px 0",
          marginTop: "auto",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "11px",
              color: "var(--mg-text-muted)",
            }}
          >
            <span style={{ fontWeight: 800, color: "var(--mg-text)" }}>MandateGuard</span>
            <span>—</span>
            <span>AI Growth &amp; Agentic Commerce</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--mg-text-muted)",
            }}
          >
            <span>BUY</span>
            <span style={{ color: "var(--mg-glass-2-border)" }}>·</span>
            <span>GROW</span>
            <span style={{ color: "var(--mg-glass-2-border)" }}>·</span>
            <span>PROTECT</span>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 640px) {
          footer > div > div:last-child {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
