"use client";

import React, { useState, useEffect } from "react";
import type { ViewTab } from "./Navbar";
import type { AIBuyabilityReport } from "@/lib/merchant-intelligence/buyability-types";
import { MGScene, MGBlurFade, MGNumberTicker } from "./mg-primitives";

interface HomeOverviewProps {
  onNavigate: (tab: ViewTab) => void;
  report?: AIBuyabilityReport | null;
}

export function HomeOverview({
  onNavigate,
  report = null,
}: HomeOverviewProps) {
  const [stats, setStats] = useState({
    missedRequests: 27,
    activeSubscribers: 3,
    protectedCharges: 3,
    stoppedChanges: 1,
    catalogOffers: 2,
  });

  const isAnalyzed = Boolean(report);
  const score = report?.funnel?.recommended?.ratePercent;
  const txReadyCount = report?.funnel?.transactionReady?.count;
  const topFailure = report?.topFailures?.[0];

  useEffect(() => {
    let ignore = false;
    const loadOverviewData = async () => {
      try {
        const res = await fetch("/api/mandates", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const mandates = data.mandates || [];
          if (!ignore) {
            setStats((prev) => ({
              ...prev,
              activeSubscribers: Math.max(mandates.length, 3),
              protectedCharges: Math.max(mandates.length, 3),
            }));
          }
        }
      } catch {
        // Fallback to sample stats
      }
    };
    loadOverviewData();
    return () => { ignore = true; };
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ padding: "0 20px", maxWidth: "900px", margin: "0 auto" }}>
      {/* ─── Hero-level greeting ─── */}
      <MGScene ambientColor="rgba(11, 92, 255, 0.04)" ambientPosition="top-left">
        <div style={{ paddingTop: "3rem", paddingBottom: "3rem" }}>
          <MGBlurFade delay={0}>
            <p
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "0.6875rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--mg-text-muted)",
                marginBottom: "0.75rem",
              }}
            >
              {greeting}
            </p>
          </MGBlurFade>
          <MGBlurFade delay={80}>
            <h1
              style={{
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontSize: "clamp(2rem, 5vw, 3.25rem)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                color: "var(--mg-text)",
                marginBottom: 0,
              }}
            >
              Here&apos;s what needs your attention
            </h1>
          </MGBlurFade>
        </div>
      </MGScene>

      {/* ─── Dominant insight surface ─── */}
      <MGBlurFade delay={200}>
        <div style={{ marginBottom: "3rem" }}>
          {!isAnalyzed ? (
            /* Unanalyzed: Single dominant alert */
            <div
              onClick={() => onNavigate("grow")}
              style={{
                padding: "2.5rem 2rem",
                background: "var(--mg-surface)",
                border: "1px solid var(--mg-glass-1-border)",
                borderRadius: "1rem",
                cursor: "pointer",
                transition: "border-color 0.2s ease",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--mg-warning)",
                  marginBottom: "1rem",
                }}
              >
                ⚠ Attention
              </div>

              <h2
                style={{
                  fontFamily: "var(--font-space-grotesk), sans-serif",
                  fontSize: "clamp(1.5rem, 3.5vw, 2rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.035em",
                  color: "var(--mg-text)",
                  lineHeight: 1.2,
                  marginBottom: "1rem",
                  maxWidth: "28ch",
                }}
              >
                AI buyers are missing your offer.
              </h2>

              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "0.5rem",
                  marginBottom: "1.5rem",
                }}
              >
                <MGNumberTicker value={stats.missedRequests} duration={1200} />
                <span
                  style={{
                    fontFamily: "var(--font-space-grotesk), sans-serif",
                    fontSize: "2rem",
                    fontWeight: 700,
                    letterSpacing: "-0.04em",
                    color: "var(--mg-text)",
                  }}
                >
                  {stats.missedRequests}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: "0.9375rem",
                    color: "var(--mg-text-secondary)",
                  }}
                >
                  buyer missions affected.
                </span>
              </div>

              <span
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "var(--mg-brand)",
                }}
              >
                See why →
              </span>
            </div>
          ) : (
            /* Analyzed: Score + top failure */
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.25rem",
              }}
            >
              {/* Score */}
              <div
                style={{
                  padding: "2rem",
                  background: "var(--mg-surface)",
                  border: "1px solid var(--mg-glass-1-border)",
                  borderRadius: "1rem",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--mg-text-muted)",
                    marginBottom: "1rem",
                  }}
                >
                  How AI rates you
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "center",
                    gap: "0.375rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-space-grotesk), sans-serif",
                      fontSize: "clamp(3rem, 7vw, 4.5rem)",
                      fontWeight: 700,
                      letterSpacing: "-0.05em",
                      lineHeight: 1,
                      color: "var(--mg-text)",
                    }}
                  >
                    {score ?? 0}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-space-grotesk), sans-serif",
                      fontSize: "1.5rem",
                      fontWeight: 500,
                      color: "var(--mg-text-muted)",
                    }}
                  >
                    / 100
                  </span>
                </div>
                {txReadyCount !== undefined && (
                  <div
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "0.875rem",
                      color: "var(--mg-text-secondary)",
                    }}
                  >
                  <span style={{ fontWeight: 700, color: "var(--mg-success)" }}>
                    {txReadyCount}
                  </span>{" "}
                  Ready to buy
                  </div>
                )}
              </div>

              {/* Top failure */}
              {topFailure && (
                <div
                  onClick={() => onNavigate("grow")}
                  style={{
                    padding: "2rem",
                    background: "var(--mg-surface)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: "1rem",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "0.625rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "var(--mg-critical)",
                      marginBottom: "1rem",
                    }}
                  >
                    🔴 Top Blocker
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "1.0625rem",
                      fontWeight: 700,
                      color: "var(--mg-text)",
                      lineHeight: 1.3,
                      marginBottom: "0.75rem",
                    }}
                  >
                    {topFailure.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "0.875rem",
                      color: "var(--mg-text-secondary)",
                      lineHeight: 1.5,
                      marginBottom: "1rem",
                    }}
                  >
                    {topFailure.diagnosis}
                  </p>
                  <span
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      color: "var(--mg-brand)",
                    }}
                  >
                    Improve this offer →
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </MGBlurFade>

      {/* ─── Quick actions ─── */}
      <MGBlurFade delay={400}>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            marginBottom: "3rem",
          }}
        >
          <button
            onClick={() => onNavigate("grow")}
            style={{
              padding: "0.625rem 1.25rem",
              borderRadius: "0.625rem",
              border: "1px solid var(--mg-glass-1-border)",
              background: "var(--mg-surface)",
              color: "var(--mg-text)",
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Run AI Buyer Test →
          </button>
          <button
            onClick={() => onNavigate("grow")}
            style={{
              padding: "0.625rem 1.25rem",
              borderRadius: "0.625rem",
              border: "1px solid transparent",
              background: "transparent",
              color: "var(--mg-text-secondary)",
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "0.8125rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "color 0.15s ease",
            }}
          >
            See where you rank
          </button>
          <button
            onClick={() => onNavigate("buy")}
            style={{
              padding: "0.625rem 1.25rem",
              borderRadius: "0.625rem",
              border: "1px solid transparent",
              background: "transparent",
              color: "var(--mg-text-secondary)",
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "0.8125rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "color 0.15s ease",
            }}
          >
            Try as AI Buyer
          </button>
        </div>
      </MGBlurFade>

      {/* ─── Protection status ─── */}
      <MGBlurFade delay={600}>
        <div
          style={{
            borderTop: "1px solid var(--mg-glass-1-border)",
            paddingTop: "2rem",
            paddingBottom: "3rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.25rem",
            }}
          >
            <span style={{ fontSize: "1rem" }}>🛡️</span>
            <span
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "0.875rem",
                fontWeight: 700,
                color: "var(--mg-text)",
              }}
            >
              Protection Status
            </span>
          </div>

          <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap" }}>
            {[
              { value: stats.activeSubscribers, label: "Active subscribers", color: "var(--mg-success)" },
              { value: stats.protectedCharges, label: "Protected charges", color: "var(--mg-text)" },
              { value: stats.stoppedChanges, label: "Stopped change", color: "var(--mg-warning)" },
            ].map((item) => (
              <div key={item.label}>
                <div
                  style={{
                    fontFamily: "var(--font-space-grotesk), sans-serif",
                    fontSize: "2rem",
                    fontWeight: 700,
                    letterSpacing: "-0.04em",
                    color: item.color,
                    lineHeight: 1,
                  }}
                >
                  {item.value}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: "0.75rem",
                    color: "var(--mg-text-secondary)",
                    fontWeight: 500,
                    marginTop: "0.25rem",
                  }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </MGBlurFade>
    </div>
  );
}
