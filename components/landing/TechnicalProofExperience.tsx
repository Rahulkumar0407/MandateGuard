"use client";

import React, { useState } from "react";
import { MGBlurFade } from "../mg-primitives";

interface TechPillar {
  id: string;
  tabLabel: string;
  title: string;
  architectureRole: string;
  codeSnippet: string;
}

const TECH_PILLARS: TechPillar[] = [
  {
    id: "snapshot",
    tabLabel: "Immutable Offer Hash",
    title: "Cryptographic Offer Locking",
    architectureRole: "Generates SHA-256 version hashes over commercial commitments. If price or SLA changes without reauthorization, the hash mismatch blocks execution.",
    codeSnippet: `{
  "offerId": "offer_sys_design_pro",
  "version": 3,
  "versionHash": "a8f3b2...e901c",
  "commitments": {
    "priceMonthlyInr": 3499,
    "supportFormat": "1_ON_1_HUMAN",
    "responseSlaHours": 24,
    "moneyBackGuaranteeDays": 30
  }
}`,
  },
  {
    id: "intent",
    tabLabel: "Deterministic Policy Gate",
    title: "Hard-Constraint Validation Layer",
    architectureRole: "Deterministic Zod validation runs before and after AI reasoning. Hard budget and support constraints can never be overridden by model outputs.",
    codeSnippet: `// lib/policy/deterministic-gate.ts
export function validatePurchasePolicy(intent, offer) {
  if (offer.priceMonthly > intent.maxBudget) {
    return { approved: false, reason: "PRICE_EXCEEDS_BUDGET" };
  }
  if (intent.requiresSla && !offer.commitments.responseSlaHours) {
    return { approved: false, reason: "MISSING_SLA_COMMITMENT" };
  }
  return { approved: true };
}`,
  },
  {
    id: "executor",
    tabLabel: "CommerceMutationExecutor",
    title: "Single Provider Mutation Boundary",
    architectureRole: "Domain services cannot directly invoke Razorpay mutation methods. All payments flow through CommerceMutationExecutor with atomic local-first compensation.",
    codeSnippet: `// lib/actions/commerce-executor.ts
export async function executeGatedMutation(action) {
  const isHashValid = await verifyOfferHash(action.offerId, action.snapshotHash);
  if (!isHashValid) throw new PolicyViolationError("TERM_DRIFT_DETECTED");
  
  return await RazorpayGateway.createSubscription({
    plan_id: action.planId,
    customer_id: action.customerId
  });
}`,
  },
];

/**
 * 10 — DEVELOPER / TECHNICAL PROOF
 * Dark Technical Surface with Progressive Disclosure
 * Real engineering underneath for judges and engineers.
 */
export function TechnicalProofExperience() {
  const [selectedPillarId, setSelectedPillarId] = useState("snapshot");

  const activePillar = TECH_PILLARS.find((p) => p.id === selectedPillarId) || TECH_PILLARS[0];

  return (
    <section
      id="technical-proof"
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
            <span>10</span> ARCHITECTURE PROOF
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
            Real engineering underneath.
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
            AI reasons. MandateGuard authorizes. CommerceMutationExecutor gates mutations. Razorpay executes.
          </p>
        </div>
      </MGBlurFade>

      {/* Technical Surface Container */}
      <div
        style={{
          maxWidth: "860px",
          margin: "0 auto",
          background: "var(--mg-surface)",
          border: "1px solid var(--mg-border)",
          borderRadius: "24px",
          padding: "clamp(20px, 3.5vw, 36px)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Technical Proof Layers"
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "20px",
            borderBottom: "1px solid var(--mg-border)",
            paddingBottom: "12px",
          }}
        >
          {TECH_PILLARS.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={selectedPillarId === p.id}
              onClick={() => setSelectedPillarId(p.id)}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                border: "none",
                background: selectedPillarId === p.id ? "rgba(11, 92, 255, 0.15)" : "transparent",
                color: selectedPillarId === p.id ? "#0B5CFF" : "var(--mg-text-secondary)",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {p.tabLabel}
            </button>
          ))}
        </div>

        {/* Pillar Header & Description */}
        <div style={{ marginBottom: "18px" }}>
          <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--mg-text)", marginBottom: "6px" }}>
            {activePillar.title}
          </div>
          <div style={{ fontSize: "13px", color: "var(--mg-text-secondary)", lineHeight: 1.5 }}>
            {activePillar.architectureRole}
          </div>
        </div>

        {/* Code Snippet Box */}
        <div
          style={{
            background: "var(--mg-bg)",
            border: "1px solid var(--mg-border)",
            borderRadius: "14px",
            padding: "16px 20px",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: "12px",
            lineHeight: 1.6,
            color: "var(--mg-text)",
            overflowX: "auto",
          }}
        >
          <pre style={{ margin: 0 }}>
            <code>{activePillar.codeSnippet}</code>
          </pre>
        </div>

        {/* Micro Footer */}
        <div
          style={{
            marginTop: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "11px",
            color: "var(--mg-text-muted)",
            fontWeight: 700,
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <span>Deterministic Invariant: Single application-level provider mutation boundary</span>
          <span style={{ color: "#0B5CFF" }}>Razorpay Test Mode Verified</span>
        </div>
      </div>
    </section>
  );
}
