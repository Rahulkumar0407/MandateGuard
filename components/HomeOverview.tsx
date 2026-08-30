"use client";

import React, { useState, useEffect } from "react";
import type { ViewTab } from "./Navbar";
import type { AIBuyabilityReport } from "@/lib/merchant-intelligence/buyability-types";
import { MGScene, MGBlurFade, MGNumberTicker, MGCommerceObject } from "./mg-primitives";

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
        const res = await fetch("/api/mandates");
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

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning." : hour < 17 ? "Good afternoon." : "Good evening.";

  return (
    <div style={{ padding: "0 20px", maxWidth: "800px", margin: "0 auto" }}>
      {/* ═══════════════════════════════════════════════════════
          EDITORIAL GREETING — Not a dashboard header
          ═══════════════════════════════════════════════════════ */}
      <MGScene ambientColor="rgba(11, 92, 255, 0.04)" ambientPosition="top-left">
        <div style={{ paddingTop: "48px", paddingBottom: "32px" }}>
          <MGBlurFade delay={0}>
            <p style={{ fontSize: "16px", color: "var(--mg-text-secondary)", fontWeight: 500, marginBottom: "4px" }}>
              {greeting}
            </p>
            <h1 style={{
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              marginBottom: "0",
            }}>
              Here&apos;s what needs your attention
            </h1>
          </MGBlurFade>
        </div>
      </MGScene>

      {/* ═══════════════════════════════════════════════════════
          DOMINANT INSIGHT SCENE — One giant floating object
          ═══════════════════════════════════════════════════════ */}
      <MGBlurFade delay={200}>
        <div style={{ marginBottom: "48px" }}>
          {isAnalyzed && score !== undefined ? (
            /* ── Analyzed State: Score + Insight ── */
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}>
              {/* Score Object */}
              <MGCommerceObject variant="highlighted" interactive={false}>
                <div style={{ padding: "32px", textAlign: "center" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--mg-text-muted)", marginBottom: "12px" }}>
                    How AI rates you
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "6px" }}>
                    <MGNumberTicker
                      value={score}
                      className=""
                      duration={1500}
                    />
                    <span style={{
                      fontSize: "clamp(3rem, 8vw, 5rem)",
                      fontWeight: 900,
                      letterSpacing: "-0.04em",
                      color: "var(--mg-text)",
                      lineHeight: 1,
                    }}>
                      {score}
                    </span>
                    <span style={{ fontSize: "20px", fontWeight: 600, color: "var(--mg-text-muted)" }}>/ 100</span>
                  </div>
                  {txReadyCount !== undefined && (
                    <div style={{ fontSize: "13px", color: "var(--mg-text-secondary)", marginTop: "12px" }}>
                      <span style={{ fontWeight: 700, color: "#10B981" }}>{txReadyCount}</span> Ready to buy
                    </div>
                  )}
                </div>
              </MGCommerceObject>

              {/* Top Failure Insight */}
              {topFailure && (
                <MGCommerceObject variant="danger" onClick={() => onNavigate("grow")}>
                  <div style={{ padding: "32px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--mg-critical)", marginBottom: "12px" }}>
                      🔴 Top Blocker
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--mg-text)", marginBottom: "8px", lineHeight: 1.3 }}>
                      {topFailure.title}
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--mg-text-secondary)", lineHeight: 1.5, marginBottom: "16px" }}>
                      {topFailure.diagnosis}
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#0B5CFF" }}>
                      Improve this offer →
                    </span>
                  </div>
                </MGCommerceObject>
              )}
            </div>
          ) : (
            /* ── Unanalyzed State: Single dominant attention object ── */
            <MGCommerceObject variant="highlighted" onClick={() => onNavigate("grow")}>
              <div style={{ padding: "40px 36px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--mg-warning)", marginBottom: "12px" }}>
                  ⚠ Attention
                </div>
                <div style={{
                  fontSize: "clamp(1.2rem, 3vw, 1.6rem)",
                  fontWeight: 800,
                  color: "var(--mg-text)",
                  lineHeight: 1.3,
                  marginBottom: "8px",
                }}>
                  AI buyers are missing your offer.
                </div>
                <div style={{ fontSize: "15px", color: "var(--mg-text-secondary)", marginBottom: "20px" }}>
                  <MGNumberTicker value={stats.missedRequests} duration={1200} />
                  <span style={{ fontWeight: 800, color: "var(--mg-text)", fontSize: "24px", marginRight: "6px" }}>{stats.missedRequests}</span>
                  buyer requests affected.
                </div>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#0B5CFF" }}>
                  See why →
                </span>
              </div>
            </MGCommerceObject>
          )}
        </div>
      </MGBlurFade>

      {/* ═══════════════════════════════════════════════════════
          QUICK ACTIONS — Minimal text links, not cards
          ═══════════════════════════════════════════════════════ */}
      <MGBlurFade delay={400}>
        <div style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "48px",
        }}>
          <button
            onClick={() => onNavigate("grow")}
            style={{
              padding: "12px 24px",
              borderRadius: "12px",
              border: "1px solid var(--mg-border)",
              background: "var(--mg-surface)",
              color: "var(--mg-text)",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Run AI Buyer Test →
          </button>
          <button
            onClick={() => onNavigate("grow")}
            style={{
              padding: "12px 24px",
              borderRadius: "12px",
              border: "1px solid var(--mg-border)",
              background: "transparent",
              color: "var(--mg-text-secondary)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            See where you rank
          </button>
          <button
            onClick={() => onNavigate("buy")}
            style={{
              padding: "12px 24px",
              borderRadius: "12px",
              border: "1px solid var(--mg-border)",
              background: "transparent",
              color: "var(--mg-text-secondary)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Try as AI Buyer
          </button>
        </div>
      </MGBlurFade>

      {/* ═══════════════════════════════════════════════════════
          PROTECTION STATUS — Minimal, not a dashboard card
          ═══════════════════════════════════════════════════════ */}
      <MGBlurFade delay={600}>
        <div style={{
          borderTop: "1px solid var(--mg-border)",
          paddingTop: "32px",
          paddingBottom: "48px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span style={{ fontSize: "16px" }}>🛡️</span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--mg-text)" }}>
              Protection Status
            </span>
          </div>
          <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "#10B981" }}>
                {stats.activeSubscribers}
              </div>
              <div style={{ fontSize: "12px", color: "var(--mg-text-secondary)", fontWeight: 500 }}>
                Active subscribers
              </div>
            </div>
            <div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "var(--mg-text)" }}>
                {stats.protectedCharges}
              </div>
              <div style={{ fontSize: "12px", color: "var(--mg-text-secondary)", fontWeight: 500 }}>
                Protected charges
              </div>
            </div>
            <div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "var(--mg-warning)" }}>
                {stats.stoppedChanges}
              </div>
              <div style={{ fontSize: "12px", color: "var(--mg-text-secondary)", fontWeight: 500 }}>
                Stopped change
              </div>
            </div>
          </div>
        </div>
      </MGBlurFade>
    </div>
  );
}
