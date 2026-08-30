"use client";

import React, { useState } from "react";
import { useTheme } from "./ThemeProvider";

export type ViewTab =
  | "home"
  | "grow"
  | "buy"
  | "transactions"
  | "customers"
  | "protection"
  | "developer";

interface NavbarProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  onSeedDemo: () => Promise<void>;
  isSeeding: boolean;
  seedMessage: string | null;
  userName?: string;
  onSignOut?: () => void;
  onViewLanding?: () => void;
}

export function Navbar({
  activeTab,
  onTabChange,
  onSeedDemo,
  isSeeding,
  seedMessage,
  userName = "InterviewForge AI",
  onSignOut,
  onViewLanding,
}: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const navItems: { id: ViewTab; label: string }[] = [
    { id: "home", label: "Overview" },
    { id: "grow", label: "AI Growth" },
    { id: "buy", label: "AI Buyer" },
    { id: "transactions", label: "Transactions" },
    { id: "customers", label: "Customers" },
    { id: "protection", label: "Protection" },
    { id: "developer", label: "Developer" },
  ];

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          FLOATING FROSTED GLASS NAVIGATION BAR
          Aceternity Floating Dock inspired — NOT enterprise admin
          ═══════════════════════════════════════════════════════ */}
      <header
        style={{
          position: "sticky",
          top: "12px",
          zIndex: 50,
          margin: "0 auto",
          maxWidth: "1120px",
          padding: "0 16px",
        }}
      >
        <div
          style={{
            background: "var(--mg-glass-2-bg)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--mg-glass-2-border)",
            borderRadius: "20px",
            boxShadow: "var(--mg-glass-2-shadow)",
            padding: "0 8px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: "56px",
              padding: "0 12px",
            }}
          >
            {/* ─── Brand ─── */}
            <button
              onClick={() => onTabChange("home")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #0B5CFF, #004DE6)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "14px",
                  boxShadow: "0 0 20px rgba(11, 92, 255, 0.35)",
                  flexShrink: 0,
                }}
              >
                M
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: "14px",
                    letterSpacing: "-0.02em",
                    color: "var(--mg-text)",
                    whiteSpace: "nowrap",
                  }}
                >
                  MandateGuard
                </span>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#10B981",
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                    padding: "2px 8px",
                    borderRadius: "99px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Razorpay Test Mode
                </span>
              </div>
            </button>

            {/* ─── Desktop Navigation Pills ─── */}
            <nav
              className="hidden md:flex"
              style={{
                alignItems: "center",
                gap: "2px",
                marginLeft: "16px",
                marginRight: "auto",
                paddingLeft: "16px",
                borderLeft: "1px solid var(--mg-border)",
              }}
            >
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    style={{
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: isActive ? 700 : 500,
                      borderRadius: "12px",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      color: isActive ? "#0B5CFF" : "var(--mg-text-secondary)",
                      background: isActive ? "rgba(11, 92, 255, 0.12)" : "transparent",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* ─── Right Controls ─── */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
                aria-label="Toggle Theme"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "10px",
                  border: "1px solid var(--mg-border)",
                  background: "var(--mg-surface-subtle)",
                  cursor: "pointer",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>

              {/* Reset Demo */}
              <button
                onClick={onSeedDemo}
                disabled={isSeeding}
                className="hidden sm:inline-flex"
                style={{
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--mg-border)",
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

              {seedMessage && (
                <span
                  className="hidden md:inline"
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "#10B981",
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                    padding: "4px 10px",
                    borderRadius: "8px",
                  }}
                >
                  {seedMessage}
                </span>
              )}

              {onViewLanding && (
                <button
                  onClick={onViewLanding}
                  className="hidden lg:inline-flex"
                  style={{
                    padding: "6px 12px",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--mg-text-secondary)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "10px",
                    transition: "color 0.15s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  Product Story →
                </button>
              )}

              {/* User Profile */}
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "4px 12px 4px 4px",
                    borderRadius: "12px",
                    border: "1px solid var(--mg-border)",
                    background: "var(--mg-surface-subtle)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      background: "#0B5CFF",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "12px",
                    }}
                  >
                    {userName.charAt(0)}
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
                    {userName}
                  </span>
                </button>

                {showUserMenu && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      marginTop: "8px",
                      width: "220px",
                      background: "var(--mg-bg-panel)",
                      borderRadius: "16px",
                      border: "1px solid var(--mg-border)",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                      padding: "8px 0",
                      zIndex: 50,
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 16px",
                        borderBottom: "1px solid var(--mg-border)",
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
                        Active Merchant
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
                        {userName}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onTabChange("developer");
                        setShowUserMenu(false);
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 16px",
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "var(--mg-text-secondary)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        transition: "color 0.15s ease",
                      }}
                    >
                      <span>Developer Console</span>
                      <span style={{ fontSize: "10px", fontFamily: "monospace", color: "var(--mg-text-muted)" }}>
                        APIs
                      </span>
                    </button>

                    {onSignOut && (
                      <button
                        onClick={() => {
                          onSignOut();
                          setShowUserMenu(false);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 16px",
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "#EF4444",
                          background: "none",
                          border: "none",
                          borderTop: "1px solid var(--mg-border)",
                          cursor: "pointer",
                          transition: "color 0.15s ease",
                        }}
                      >
                        Sign Out
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "10px",
                  border: "1px solid var(--mg-border)",
                  background: "var(--mg-surface-subtle)",
                  cursor: "pointer",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--mg-text-secondary)",
                }}
                aria-label="Toggle navigation menu"
              >
                {showMobileMenu ? "✕" : "☰"}
              </button>
            </div>
          </div>

          {/* ─── Mobile Expanded Menu ─── */}
          {showMobileMenu && (
            <div
              className="md:hidden"
              style={{
                borderTop: "1px solid var(--mg-border)",
                padding: "8px",
              }}
            >
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setShowMobileMenu(false);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: activeTab === item.id ? 700 : 500,
                    color: activeTab === item.id ? "#0B5CFF" : "var(--mg-text-secondary)",
                    background: activeTab === item.id ? "rgba(11, 92, 255, 0.12)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    display: "block",
                    transition: "all 0.15s ease",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          MOBILE BOTTOM DOCK — Quick tab access
          ═══════════════════════════════════════════════════════ */}
      <div
        className="md:hidden"
        style={{
          position: "fixed",
          bottom: "12px",
          left: "12px",
          right: "12px",
          zIndex: 40,
          background: "var(--mg-glass-2-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid var(--mg-glass-2-border)",
          borderRadius: "18px",
          boxShadow: "var(--mg-glass-2-shadow)",
          padding: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
        }}
      >
        {navItems.slice(0, 5).map((item) => {
          const isActive = activeTab === item.id;
          const icons: Record<string, string> = {
            home: "⌂",
            grow: "↗",
            buy: "✦",
            transactions: "⇄",
            customers: "👥",
          };
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                padding: "6px 10px",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                background: isActive ? "rgba(11, 92, 255, 0.12)" : "transparent",
                color: isActive ? "#0B5CFF" : "var(--mg-text-secondary)",
                fontWeight: isActive ? 700 : 500,
                transition: "all 0.15s ease",
              }}
            >
              <span>{icons[item.id] || "•"}</span>
              <span style={{ fontSize: "9px", letterSpacing: "-0.01em" }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
