"use client";

import React from "react";
import { useTheme } from "./ThemeProvider";
import { MandateGuardHero } from "./hero/MandateGuardHero";
import { ShiftScene } from "./landing/ShiftScene";
import { OfferClarityMorph } from "./landing/OfferClarityMorph";
import { RankingExperience } from "./landing/RankingExperience";
import { BuyerInvestigation } from "./landing/BuyerInvestigation";
import { OfferFixExperience } from "./landing/OfferFixExperience";
import { SimulationField } from "./landing/SimulationField";
import { ProtectionExperience } from "./landing/ProtectionExperience";
import { CommerceLoop } from "./landing/CommerceLoop";
import { EvidenceStory } from "./landing/EvidenceStory";
import { EngineeringCrossSection } from "./landing/EngineeringCrossSection";
import { FinalCTA } from "./landing/FinalCTA";

interface PublicLandingPageProps {
  onGetStarted: () => void;
  onExploreDemo: () => void;
}

export function PublicLandingPage({
  onGetStarted,
  onExploreDemo,
}: PublicLandingPageProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--mg-bg)",
        color: "var(--mg-text)",
        fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
        WebkitFontSmoothing: "antialiased",
        transition: "background-color 0.2s ease, color 0.2s ease",
      }}
    >
      {/* ═══════════════════════════════════════════════════════
          FLOATING LANDING HEADER
          ═══════════════════════════════════════════════════════ */}
      <header
        style={{
          position: "sticky",
          top: "12px",
          zIndex: 50,
          maxWidth: "900px",
          margin: "0 auto",
          padding: "0 16px",
        }}
      >
        <div
          style={{
            background: "var(--mg-glass-2-bg)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--mg-glass-2-border)",
            borderRadius: "18px",
            boxShadow: "var(--mg-glass-2-shadow)",
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "52px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #0B5CFF, #004DE6)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "13px",
                boxShadow: "0 0 16px rgba(11, 92, 255, 0.35)",
              }}
            >
              M
            </div>
            <span style={{ fontWeight: 800, fontSize: "14px", letterSpacing: "-0.02em" }}>
              MandateGuard
            </span>
          </div>

          {/* Quiet Story Navigation Milestones (Desktop Only) */}
          <nav aria-label="Scene navigation" className="hidden md:flex items-center gap-5 text-xs font-mono text-[var(--mg-text-muted)]">
            <a href="#the-shift" className="hover:text-[var(--mg-brand)] transition-colors">01</a>
            <a href="#offer-clarity" className="hover:text-[var(--mg-brand)] transition-colors">02</a>
            <a href="#ai-ranking" className="hover:text-[var(--mg-brand)] transition-colors">03</a>
            <a href="#why-buyers-leave" className="hover:text-[var(--mg-brand)] transition-colors">04</a>
            <a href="#prove-it" className="hover:text-[var(--mg-brand)] transition-colors">05</a>
            <a href="#buy-safely" className="hover:text-[var(--mg-brand)] transition-colors">06</a>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: "1px solid var(--mg-border)",
                background: "transparent",
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <button
              onClick={onGetStarted}
              style={{
                padding: "7px 20px",
                borderRadius: "10px",
                border: "none",
                background: "#0B5CFF",
                color: "white",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 0 20px rgba(11, 92, 255, 0.3)",
                transition: "transform 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          M20 HERO — RAZORPAY DISCIPLINE
          ═══════════════════════════════════════════════════════ */}
      <MandateGuardHero onGetStarted={onGetStarted} onExploreDemo={onExploreDemo} />

      {/* ═══════════════════════════════════════════════════════
          M10-LANDING-ART-DIRECTION-003: PRODUCT FILM EXPERIENCE
          ═══════════════════════════════════════════════════════ */}

      {/* 01 — THE SHIFT */}
      <ShiftScene />

      {/* 02 — MAKE YOUR OFFER UNDERSTANDABLE */}
      <OfferClarityMorph />

      {/* 03 — SEE WHERE YOU STAND */}
      <RankingExperience />

      {/* 04 — WHY BUYERS LEAVE (FORENSIC AUDIT) */}
      <BuyerInvestigation />

      {/* 05 — FIX IT */}
      <OfferFixExperience onSimulateClick={() => {
        const el = document.getElementById("prove-it");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }} />

      {/* 06 — PROVE IT (BUYER MISSION CONSTELLATION) */}
      <SimulationField />

      {/* 07 — BUY SAFELY (TRANSACTION INTERCEPT) */}
      <ProtectionExperience />

      {/* 08 — THE LOOP (LIVING ENGINE) */}
      <CommerceLoop />

      {/* 09 — WHAT WE MEASURE (EDITORIAL DATA STORY) */}
      <EvidenceStory />

      {/* 10 — DEVELOPER / TECHNICAL PROOF (ENGINEERING CROSS-SECTION) */}
      <EngineeringCrossSection />

      {/* 11 — FINAL CTA */}
      <FinalCTA onGetStarted={onGetStarted} onExploreDemo={onExploreDemo} />

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "40px 20px", borderTop: "1px solid var(--mg-border)" }}>
        <p style={{ fontSize: "12px", color: "var(--mg-text-muted)" }}>
          MandateGuard — AI Growth &amp; Agentic Commerce on Razorpay Test Mode
        </p>
      </footer>
    </div>
  );
}
