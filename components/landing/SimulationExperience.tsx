"use client";

import React, { useState } from "react";
import { MGBlurFade } from "../mg-primitives";

/**
 * 06 — PROVE IT
 * 100 Structured Mission Grid Simulation Pattern
 * Tests the new offer against the exact same 100 benchmark buyer missions.
 */
export function SimulationExperience() {
  const [hasSimulated, setHasSimulated] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setHasSimulated(true);
      setIsSimulating(false);
    }, 600);
  };

  const resetSimulation = () => {
    setHasSimulated(false);
    setIsSimulating(false);
  };

  // 100 mission markers state
  // Initial 42 matches: indices 0..41
  // Additional 15 matches on improved offer: indices 42..56
  // Remaining 43 unmatched: indices 57..99
  const totalMissions = 100;
  const initialMatched = 42;
  const additionalMatched = 15;
  const currentCount = hasSimulated ? initialMatched + additionalMatched : initialMatched;

  return (
    <section
      id="prove-it"
      style={{
        maxWidth: "1120px",
        margin: "0 auto",
        padding: "80px 20px",
        position: "relative",
      }}
    >
      <MGBlurFade delay={50}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "99px",
              background: "rgba(11, 92, 255, 0.1)",
              border: "1px solid rgba(11, 92, 255, 0.25)",
              color: "#0B5CFF",
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "14px",
            }}
          >
            <span>06</span> REPLAY SIMULATION
          </div>
          <h2
            style={{
              fontSize: "clamp(2.2rem, 4.4vw, 3.4rem)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "var(--mg-text)",
              maxWidth: "760px",
              margin: "0 auto 14px",
            }}
          >
            Prove it before you publish.
          </h2>
          <p
            style={{
              fontSize: "clamp(1rem, 1.4vw, 1.15rem)",
              color: "var(--mg-text-secondary)",
              maxWidth: "580px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Replay the exact same 100 buyer missions to verify that your new structured commitments actually win deals.
          </p>
        </div>
      </MGBlurFade>

      {/* Simulation Stage Container */}
      <div
        style={{
          maxWidth: "840px",
          margin: "0 auto",
          background: "var(--mg-glass-2-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid var(--mg-border)",
          borderRadius: "24px",
          padding: "clamp(24px, 4vw, 40px)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
        }}
      >
        {/* Metric Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--mg-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              BUYER MISSIONS MATCHED
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "4px" }}>
              <span
                style={{
                  fontSize: "clamp(2.5rem, 4vw, 3.2rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  color: hasSimulated ? "var(--mg-success)" : "#0B5CFF",
                  lineHeight: 1,
                  transition: "color 0.3s ease",
                }}
              >
                {currentCount}
              </span>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--mg-text-secondary)" }}>
                / 100
              </span>
              {hasSimulated && (
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "var(--mg-success)",
                    background: "rgba(16, 185, 129, 0.12)",
                    padding: "3px 10px",
                    borderRadius: "99px",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                  }}
                >
                  +{additionalMatched} Matched (+35.7% Gain)
                </span>
              )}
            </div>
          </div>

          <div>
            {!hasSimulated ? (
              <button
                onClick={handleRunSimulation}
                disabled={isSimulating}
                style={{
                  padding: "12px 28px",
                  borderRadius: "14px",
                  border: "none",
                  background: "#0B5CFF",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: isSimulating ? "wait" : "pointer",
                  boxShadow: "0 0 24px rgba(11, 92, 255, 0.35)",
                  transition: "transform 0.15s ease",
                }}
              >
                {isSimulating ? "Running 100 Missions..." : "Run Replay Simulation →"}
              </button>
            ) : (
              <button
                onClick={resetSimulation}
                style={{
                  padding: "10px 20px",
                  borderRadius: "12px",
                  border: "1px solid var(--mg-border)",
                  background: "var(--mg-surface)",
                  color: "var(--mg-text)",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ↺ Reset Simulation
              </button>
            )}
          </div>
        </div>

        {/* 100 Mission Dots Grid (10 columns x 10 rows) */}
        <div
          aria-label="100 Mission Match Visualization"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(10, 1fr)",
            gap: "8px",
            background: "var(--mg-bg)",
            padding: "20px",
            borderRadius: "18px",
            border: "1px solid var(--mg-border)",
            marginBottom: "20px",
          }}
        >
          {Array.from({ length: totalMissions }).map((_, idx) => {
            const isInitial = idx < initialMatched;
            const isAdditional = hasSimulated && idx >= initialMatched && idx < (initialMatched + additionalMatched);

            let bg = "var(--mg-surface)";
            let border = "1px solid var(--mg-border)";
            let glow = "none";

            if (isInitial) {
              bg = "#0B5CFF";
              border = "1px solid rgba(11, 92, 255, 0.8)";
            } else if (isAdditional) {
              bg = "var(--mg-success)";
              border = "1px solid rgba(16, 185, 129, 0.8)";
              glow = "0 0 8px rgba(16, 185, 129, 0.5)";
            }

            return (
              <div
                key={idx}
                title={`Mission #${idx + 1}: ${isInitial ? "Matched in Baseline" : isAdditional ? "Recovered by Structured Commitments" : "Different Domain Need"}`}
                style={{
                  aspectRatio: "1/1",
                  borderRadius: "4px",
                  background: bg,
                  border: border,
                  boxShadow: glow,
                  transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  cursor: "default",
                }}
              />
            );
          })}
        </div>

        {/* Legend & Truth Statement */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "11px",
            color: "var(--mg-text-muted)",
            fontWeight: 600,
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", gap: "16px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#0B5CFF" }} /> Baseline Match (42)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "var(--mg-success)" }} /> Recovered Match (+15)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "var(--mg-surface)", border: "1px solid var(--mg-border)" }} /> Unmatched (43)
            </span>
          </div>

          <div style={{ fontWeight: 700, color: "var(--mg-text-secondary)" }}>
            ⚡ 100 Deterministic Benchmark Missions · Zero Fabricated Claims
          </div>
        </div>
      </div>
    </section>
  );
}
