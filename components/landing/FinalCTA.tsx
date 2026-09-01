"use client";

import React from "react";

interface FinalCTAProps {
  onGetStarted: () => void;
  onExploreDemo: () => void;
}

export function FinalCTA({ onGetStarted, onExploreDemo }: FinalCTAProps) {
  return (
    <section
      className="w-full"
      style={{
        background: "var(--mg-bg)",
        borderTop: "1px solid var(--mg-glass-1-border)",
      }}
    >
      <div
        className="mg-section"
        style={{
          maxWidth: "var(--container-tight)",
          margin: "0 auto",
          padding: "var(--section-py) var(--section-px)",
          textAlign: "center",
        }}
      >
        {/* Large editorial statement */}
        <div
          style={{
            marginBottom: "clamp(2rem, 4vw, 3rem)",
          }}
        >
          <div className="mg-micro" style={{ color: "var(--mg-text-muted)", marginBottom: "1.5rem", letterSpacing: "0.12em" }}>
            THE NEW COMMERCE TRUST LAYER
          </div>

          <h2 className="mg-display" style={{ color: "var(--mg-text)", maxWidth: "14ch", margin: "0 auto 1.5rem" }}>
            Become the business AI
            <br />
            <span className="mg-brand">chooses.</span>
          </h2>

          <p
            className="mg-body"
            style={{
              color: "var(--mg-text-secondary)",
              maxWidth: "42ch",
              margin: "0 auto",
            }}
          >
            AI is becoming the buyer. Make sure it can find you, understand your terms,
            and transact with complete trust.
          </p>
        </div>

        {/* CTAs */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "clamp(3rem, 5vw, 4rem)",
          }}
        >
          <button onClick={onGetStarted} className="mg-btn-primary">
            Get started →
          </button>
          <button onClick={onExploreDemo} className="mg-btn-secondary">
            See how it works
          </button>
        </div>

        {/* Tagline bar */}
        <div
          style={{
            paddingTop: "clamp(2rem, 4vw, 3rem)",
            borderTop: "1px solid var(--mg-glass-1-border)",
            display: "flex",
            justifyContent: "center",
            gap: "clamp(1rem, 3vw, 2.5rem)",
            flexWrap: "wrap",
          }}
        >
          {["Get found", "Get understood", "Get chosen", "Stay protected"].map((item) => (
            <span
              key={item}
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: "var(--mg-text-muted)",
                letterSpacing: "0.04em",
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
