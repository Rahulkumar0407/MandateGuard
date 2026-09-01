"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";

export type AuthNavTab = "overview" | "offer" | "ai-buyers" | "protection" | "settings";

interface MerchantInfo {
  name: string;
  email: string;
  isSample: boolean;
}

interface SessionState {
  authenticated: boolean;
  session: MerchantInfo | null;
  merchant: { name: string } | null;
  onboardingComplete: boolean;
}

interface NavbarV2Props {
  session: SessionState;
  onSignOut: () => void;
  onSeedDemo: () => Promise<void>;
  isSeeding: boolean;
  seedMessage: string | null;
  environment?: "test" | "live";
  onEnvironmentChange?: (env: "test" | "live") => void;
}

const NAV_ITEMS: { id: AuthNavTab; label: string; href: string }[] = [
  { id: "overview", label: "Overview", href: "/overview" },
  { id: "offer", label: "Offer", href: "/offer" },
  { id: "ai-buyers", label: "AI Buyers", href: "/ai-buyers" },
  { id: "protection", label: "Protection", href: "/protection" },
];

export function NavbarV2({
  session,
  onSignOut,
  onSeedDemo,
  isSeeding,
  seedMessage,
  environment: controlledEnv,
  onEnvironmentChange,
}: NavbarV2Props) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [env, setEnv] = useState<"test" | "live">(() => {
    if (controlledEnv) return controlledEnv;
    if (typeof document !== "undefined") {
      const m = document.cookie.match(/(?:^|; )mg_env=(test|live)/);
      if (m) return m[1] as "test" | "live";
    }
    return "test";
  });
  const [showEnvSwitcher, setShowEnvSwitcher] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const envRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const activeEnv = controlledEnv !== undefined ? controlledEnv : env;

  useEffect(() => {
    // Persist env in cookie for refresh/navigation (server-readable)
    if (controlledEnv === undefined && typeof document !== "undefined") {
      const m = document.cookie.match(/(?:^|; )mg_env=(test|live)/);
      if (m && m[1] !== env) {
        // sync from cookie on mount if different (e.g., after refresh)
      } else if (!m) {
        document.cookie = `mg_env=${env}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      }
    }
  }, [env, controlledEnv]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (envRef.current && !envRef.current.contains(e.target as Node)) setShowEnvSwitcher(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sync from cookie on mount (client hydration)
  useEffect(() => {
    if (controlledEnv !== undefined) return;
    const m = document.cookie.match(/(?:^|; )mg_env=(test|live)/);
    if (m && (m[1] as "test" | "live") !== env) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEnv(m[1] as "test" | "live");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnvChange = (newEnv: "test" | "live") => {
    setEnv(newEnv);
    if (typeof document !== "undefined") {
      // eslint-disable-next-line react-hooks/immutability
      document.cookie = `mg_env=${newEnv}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    }
    onEnvironmentChange?.(newEnv);
    setShowEnvSwitcher(false);
  };

  const merchantName = session?.session?.name || session?.merchant?.name || "Your Business";
  const displayName = merchantName.length > 20 ? merchantName.slice(0, 18) + "…" : merchantName;
  const initial = merchantName.charAt(0).toUpperCase();

  const currentTab = NAV_ITEMS.find((n) => pathname.startsWith(n.href))?.id || "overview";

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "var(--mg-glass-1-bg)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--mg-glass-1-border)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "56px",
          }}
        >
            {/* Brand */}
            <Link
              href="/overview"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "9px",
                  background: "linear-gradient(135deg, var(--mg-brand), var(--mg-brand-hover))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "13px",
                  color: "white",
                  boxShadow: "0 4px 12px rgba(11, 92, 255, 0.3)",
                  flexShrink: 0,
                }}
              >
                M
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: "13px",
                    letterSpacing: "-0.02em",
                    color: "var(--mg-text)",
                    whiteSpace: "nowrap",
                  }}
                >
                  MandateGuard
                </span>
                {/* Environment indicator */}
                <div style={{ position: "relative" }} ref={envRef}>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowEnvSwitcher(!showEnvSwitcher); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "3px 9px",
                      borderRadius: "99px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      transition: "all 0.15s ease",
                      background: activeEnv === "test"
                        ? "rgba(16, 185, 129, 0.12)"
                        : "rgba(239, 68, 68, 0.1)",
                      color: activeEnv === "test" ? "#10B981" : "#EF4444",
                      borderColor: activeEnv === "test"
                        ? "rgba(16, 185, 129, 0.25)"
                        : "rgba(239, 68, 68, 0.2)",
                    }}
                  >
                    <div
                      style={{
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        background: activeEnv === "test" ? "#10B981" : "#EF4444",
                        boxShadow: activeEnv === "test"
                          ? "0 0 5px rgba(16, 185, 129, 0.6)"
                          : "0 0 5px rgba(239, 68, 68, 0.6)",
                      }}
                    />
                    {activeEnv === "test" ? "TEST" : "LIVE"}
                  </button>

                  {showEnvSwitcher && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        left: 0,
                        width: "220px",
                        background: "var(--mg-bg-panel)",
                        borderRadius: "14px",
                        border: "1px solid var(--mg-glass-2-border)",
                        boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
                        padding: "6px",
                        zIndex: 100,
                        backdropFilter: "blur(20px)",
                      }}
                    >
                      <div style={{ padding: "8px 10px 10px", borderBottom: "1px solid var(--mg-glass-2-border)", marginBottom: "6px" }}>
                        <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--mg-text-muted)" }}>
                          Workspace
                        </span>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--mg-text)", marginTop: "2px" }}>
                          {merchantName}
                        </div>
                      </div>
                      <div style={{ padding: "2px 4px" }}>
                        <div style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--mg-text-muted)", padding: "4px 8px 6px" }}>
                          Environment
                        </div>
                        {(["test", "live"] as const).map((e) => (
                          <button
                            key={e}
                            onClick={() => handleEnvChange(e)}
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "8px 10px",
                              borderRadius: "10px",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: 600,
                              transition: "all 0.15s ease",
                              background: activeEnv === e ? "var(--mg-brand-soft)" : "transparent",
                              color: activeEnv === e ? "var(--mg-brand)" : "var(--mg-text-secondary)",
                            }}
                          >
                            <div
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                border: `2px solid ${e === "test" ? "#10B981" : "#EF4444"}`,
                                background: activeEnv === e ? (e === "test" ? "#10B981" : "#EF4444") : "transparent",
                                flexShrink: 0,
                              }}
                            />
                            <div style={{ textAlign: "left" }}>
                              <div style={{ fontWeight: 700 }}>{e === "test" ? "TEST" : "LIVE"}</div>
                              <div style={{ fontSize: "10px", fontWeight: 500, color: "var(--mg-text-muted)" }}>
                                {e === "test" ? "Safe · No real money" : "Real commerce"}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Link>

            {/* Desktop nav — single source NAV_ITEMS */}
            <nav
              aria-label="Primary"
              data-testid="desktop-nav"
              className="hidden lg:flex"
              style={{
                alignItems: "center",
                gap: "2px",
                marginLeft: "16px",
                paddingLeft: "16px",
                borderLeft: "1px solid var(--mg-glass-2-border)",
              }}
            >
              {NAV_ITEMS.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={item.label}
                    style={{
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: isActive ? 700 : 500,
                      borderRadius: "10px",
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                      color: isActive ? "var(--mg-brand)" : "var(--mg-text-secondary)",
                      background: isActive ? "var(--mg-brand-soft)" : "transparent",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingRight: "6px" }}>
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
                aria-label="Toggle theme"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "9px",
                  border: "1px solid var(--mg-glass-2-border)",
                  background: "var(--mg-surface-subtle)",
                  cursor: "pointer",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                  color: "var(--mg-text-secondary)",
                  flexShrink: 0,
                }}
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>

              {/* Reset demo — dev-only: hidden from normal merchant; only visible for sample businesses */}
              {session?.session?.isSample && (
                <button
                  onClick={onSeedDemo}
                  disabled={isSeeding}
                  className="hidden xl:inline-flex"
                  data-testid="reset-demo-btn"
                  style={{
                    alignItems: "center",
                    gap: "4px",
                    padding: "6px 12px",
                    borderRadius: "9px",
                    border: "1px solid var(--mg-glass-2-border)",
                    background: "var(--mg-surface-subtle)",
                    cursor: isSeeding ? "not-allowed" : "pointer",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--mg-text-secondary)",
                    opacity: isSeeding ? 0.5 : 1,
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isSeeding ? "Resetting..." : "Reset Demo"}
                </button>
              )}

              {seedMessage && (
                <span
                  className="hidden xl:inline"
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "#10B981",
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    padding: "3px 9px",
                    borderRadius: "8px",
                  }}
                >
                  {seedMessage}
                </span>
              )}

              {/* Settings */}
              <Link
                href="/settings"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "9px",
                  border: "1px solid var(--mg-glass-2-border)",
                  background: "var(--mg-surface-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "var(--mg-text-secondary)",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
              >
                ⚙
              </Link>

              {/* User menu */}
              <div style={{ position: "relative" }} ref={userRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "4px 10px 4px 4px",
                    borderRadius: "11px",
                    border: "1px solid var(--mg-glass-2-border)",
                    background: "var(--mg-surface-subtle)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "7px",
                      background: "var(--mg-brand)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "11px",
                      flexShrink: 0,
                    }}
                  >
                    {initial}
                  </div>
                  <span
                    className="hidden sm:inline"
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--mg-text)",
                      maxWidth: "120px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {displayName}
                  </span>
                </button>

                {showUserMenu && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      marginTop: "8px",
                      width: "200px",
                      background: "var(--mg-bg-panel)",
                      borderRadius: "14px",
                      border: "1px solid var(--mg-glass-2-border)",
                      boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
                      padding: "6px",
                      zIndex: 100,
                      backdropFilter: "blur(20px)",
                    }}
                  >
                    <div
                      style={{
                        padding: "8px 12px 10px",
                        borderBottom: "1px solid var(--mg-glass-2-border)",
                        marginBottom: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "var(--mg-text-muted)",
                          display: "block",
                        }}
                      >
                        Signed in as
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "var(--mg-text)",
                          display: "block",
                          marginTop: "2px",
                        }}
                      >
                        {merchantName}
                      </span>
                    </div>

                    <Link
                      href="/settings"
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 12px",
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "var(--mg-text-secondary)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderRadius: "9px",
                        textDecoration: "none",
                        transition: "color 0.15s ease",
                      }}
                    >
                      <span>Settings</span>
                      <span style={{ fontSize: "10px", fontFamily: "monospace", color: "var(--mg-text-muted)" }}>
                        ⚙
                      </span>
                    </Link>

                    {session?.session?.isSample && (
                      <Link
                        href="/overview"
                        onClick={() => setShowUserMenu(false)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "8px 12px",
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "var(--mg-text-secondary)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          borderRadius: "9px",
                          textDecoration: "none",
                          transition: "color 0.15s ease",
                        }}
                      >
                        <span>Sample business</span>
                        <span style={{ fontSize: "10px", color: "var(--mg-warning)", fontWeight: 600 }}>SAMPLE</span>
                      </Link>
                    )}

                    <button
                      onClick={() => { onSignOut(); setShowUserMenu(false); }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 12px",
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "#EF4444",
                        background: "none",
                        border: "none",
                        borderTop: "1px solid var(--mg-glass-2-border)",
                        cursor: "pointer",
                        borderRadius: "0 0 9px 9px",
                        marginTop: "6px",
                        transition: "color 0.15s ease",
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile menu toggle — hidden on desktop, no inline display override */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="flex lg:hidden mg-mobile-toggle"
                data-testid="mobile-menu-toggle"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "9px",
                  border: "1px solid var(--mg-glass-2-border)",
                  background: "var(--mg-surface-subtle)",
                  cursor: "pointer",
                  fontSize: "14px",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--mg-text-secondary)",
                }}
                aria-label="Toggle menu"
                aria-expanded={showMobileMenu}
              >
                {showMobileMenu ? "✕" : "☰"}
              </button>
            </div>
          </div>

          {/* Mobile expanded menu — only below lg, no inline display override */}
          {showMobileMenu && (
            <div
              className="flex flex-col lg:hidden mg-mobile-expanded"
              data-testid="mobile-expanded-menu"
              style={{
                borderTop: "1px solid var(--mg-glass-2-border)",
                padding: "6px 6px 8px",
              }}
            >
              {NAV_ITEMS.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setShowMobileMenu(false)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "9px 14px",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "var(--mg-brand)" : "var(--mg-text-secondary)",
                      background: isActive ? "var(--mg-brand-soft)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </header>

      {/* Mobile bottom dock — ONE shared NAV_ITEMS, hidden on desktop via CSS + Tailwind, no inline display override */}
      <nav
        aria-label="Mobile primary"
        data-testid="mobile-bottom-nav"
        className="flex lg:hidden mg-bottom-dock"
        style={{
          position: "fixed",
          bottom: "12px",
          left: "12px",
          right: "12px",
          zIndex: 40,
          background: "var(--mg-glass-1-bg)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid var(--mg-glass-1-border)",
          borderRadius: "14px",
          boxShadow: "var(--mg-glass-1-shadow)",
          padding: "5px",
          alignItems: "center",
          justifyContent: "space-around",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = currentTab === item.id;
          const icons: Record<string, string> = {
            overview: "⌂",
            offer: "◇",
            "ai-buyers": "✦",
            protection: "◎",
          };
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                padding: "5px 10px",
                borderRadius: "10px",
                textDecoration: "none",
                fontSize: "13px",
                background: isActive ? "rgba(11, 92, 255, 0.1)" : "transparent",
                color: isActive ? "var(--mg-brand)" : "var(--mg-text-secondary)",
                fontWeight: isActive ? 700 : 500,
                transition: "all 0.15s ease",
              }}
            >
              <span aria-hidden="true">{icons[item.id] || "•"}</span>
              <span style={{ fontSize: "9px", letterSpacing: "-0.01em" }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      {/* Explicit responsive gate: inline display removed, but enforce desktop hide even if Tailwind specificity fails */}
      <style>{`
        @media (min-width: 1024px) {
          .mg-bottom-dock,
          .mg-mobile-toggle,
          .mg-mobile-expanded {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
