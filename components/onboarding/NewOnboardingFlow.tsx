"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = "business" | "offer" | "buyer" | "review";

const STEPS: Step[] = ["business", "offer", "buyer", "review"];

interface OnboardingData {
  businessName: string;
  businessType: string;
  offerName: string;
  price: string;
  billingInterval: "month" | "year" | "one-time";
  commitments: string[];
}

interface NewOnboardingFlowProps {
  merchantName: string;
}

const BUSINESS_TYPES = ["Services", "Courses", "Subscriptions", "Digital products", "Physical products", "Other"];
const COMMITMENT_OPTIONS = [
  "1:1 support",
  "Live sessions",
  "Recorded content",
  "Priority support",
  "Consulting",
  "Digital delivery",
  "Physical delivery",
];

const BILLING_OPTIONS: { id: "month" | "year" | "one-time"; label: string }[] = [
  { id: "month", label: "Monthly" },
  { id: "year", label: "Yearly" },
  { id: "one-time", label: "One-time" },
];

export function NewOnboardingFlow({ merchantName }: NewOnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("business");
  const [isCompleting, setIsCompleting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    businessName: merchantName,
    businessType: "Services",
    offerName: "",
    price: "",
    billingInterval: "month",
    commitments: [],
  });

  const stepIndex = STEPS.indexOf(step);

  const handleNext = useCallback(() => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) {
      setStep(STEPS[idx + 1]);
    }
  }, [step]);

  const handleBack = useCallback(() => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) {
      setStep(STEPS[idx - 1]);
    }
  }, [step]);

  const handleComplete = useCallback(async () => {
    setIsCompleting(true);
    try {
      await fetch("/api/auth/onboarding", { method: "POST" });
      router.push("/overview");
      router.refresh();
    } catch {
      setIsCompleting(false);
    }
  }, [router]);

  const toggleCommitment = (c: string) => {
    setData((prev) => ({
      ...prev,
      commitments: prev.commitments.includes(c)
        ? prev.commitments.filter((x) => x !== c)
        : [...prev.commitments, c],
    }));
  };

  const priceNum = Number(data.price);
  const priceError = data.price.trim().length === 0 ? null : !Number.isFinite(priceNum) || priceNum <= 0 ? "Price must be greater than ₹0." : null;
  const canProceed = {
    business: data.businessName.trim().length > 0,
    offer: data.offerName.trim().length > 0 && data.price.trim().length > 0 && Number.isFinite(priceNum) && priceNum > 0,
    buyer: true,
    review: true,
  };

  return (
    <div className="min-h-screen bg-[var(--mg-bg)] text-[var(--mg-text)] flex flex-col">
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--mg-glass-2-border)",
          padding: "16px 24px",
        }}
      >
        <div style={{ maxWidth: "600px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
              }}
            >
              M
            </div>
            <span style={{ fontWeight: 800, fontSize: "14px", letterSpacing: "-0.02em" }}>MandateGuard</span>
          </div>
          <Link
            href="/"
            style={{ fontSize: "12px", fontWeight: 600, color: "var(--mg-text-muted)", textDecoration: "none" }}
          >
            ← Back
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
        <div style={{ width: "100%", maxWidth: "560px" }}>
          {/* Progress indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "32px" }}>
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div
                  style={{
                    height: "3px",
                    flex: 1,
                    borderRadius: "99px",
                    background: i <= stepIndex
                      ? "linear-gradient(90deg, var(--mg-brand), var(--mg-brand-hover))"
                      : "var(--mg-glass-2-border)",
                    transition: "background 0.3s ease",
                  }}
                />
              </React.Fragment>
            ))}
          </div>

          {/* Step labels */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "28px" }}>
            {["Business", "Offer", "Buyer", "Review"].map((label, i) => (
              <span
                key={label}
                style={{
                  fontSize: "10px",
                  fontWeight: stepIndex === i ? 700 : 500,
                  color: stepIndex === i ? "var(--mg-brand)" : "var(--mg-text-muted)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  transition: "color 0.2s ease",
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Step: Business */}
          {step === "business" && (
            <div
              style={{
                background: "var(--mg-glass-2-bg)",
                backdropFilter: "blur(20px)",
                border: "1px solid var(--mg-glass-2-border)",
                borderRadius: "20px",
                padding: "28px 32px",
                boxShadow: "var(--mg-glass-2-shadow)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-space-grotesk), sans-serif",
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: "var(--mg-text)",
                  margin: "0 0 6px",
                }}
              >
                What does your business sell?
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--mg-text-secondary)", margin: "0 0 24px" }}>
                Tell us about your business so AI buyers can find you.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--mg-text-secondary)", display: "block", marginBottom: "6px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={data.businessName}
                    onChange={(e) => setData((p) => ({ ...p, businessName: e.target.value }))}
                    placeholder="e.g. InterviewForge AI"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "var(--mg-surface)",
                      border: "1px solid var(--mg-glass-2-border)",
                      borderRadius: "12px",
                      fontSize: "0.9375rem",
                      color: "var(--mg-text)",
                      outline: "none",
                      transition: "border-color 0.2s ease",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--mg-brand)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--mg-glass-2-border)"; }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--mg-text-secondary)", display: "block", marginBottom: "8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Business Type
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {BUSINESS_TYPES.map((t) => {
                      const selected = data.businessType === t;
                      return (
                        <button
                          key={t}
                          onClick={() => setData((p) => ({ ...p, businessType: t }))}
                          style={{
                            padding: "7px 14px",
                            borderRadius: "99px",
                            border: `1px solid ${selected ? "var(--mg-brand)" : "var(--mg-glass-2-border)"}`,
                            background: selected ? "rgba(11,92,255,0.1)" : "var(--mg-surface)",
                            color: selected ? "var(--mg-brand)" : "var(--mg-text-secondary)",
                            fontSize: "12px",
                            fontWeight: selected ? 700 : 500,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step: Offer */}
          {step === "offer" && (
            <div
              style={{
                background: "var(--mg-glass-2-bg)",
                backdropFilter: "blur(20px)",
                border: "1px solid var(--mg-glass-2-border)",
                borderRadius: "20px",
                padding: "28px 32px",
                boxShadow: "var(--mg-glass-2-shadow)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-space-grotesk), sans-serif",
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: "var(--mg-text)",
                  margin: "0 0 6px",
                }}
              >
                What are you selling?
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--mg-text-secondary)", margin: "0 0 24px" }}>
                Create your first offer — what the buyer will pay for.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--mg-text-secondary)", display: "block", marginBottom: "6px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Offer Name
                  </label>
                  <input
                    type="text"
                    value={data.offerName}
                    onChange={(e) => setData((p) => ({ ...p, offerName: e.target.value }))}
                    placeholder="e.g. System Design Pro"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "var(--mg-surface)",
                      border: "1px solid var(--mg-glass-2-border)",
                      borderRadius: "12px",
                      fontSize: "0.9375rem",
                      color: "var(--mg-text)",
                      outline: "none",
                      transition: "border-color 0.2s ease",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--mg-brand)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--mg-glass-2-border)"; }}
                  />
                </div>

                <div>
                  <label htmlFor="onboarding-price" style={{ fontSize: "11px", fontWeight: 700, color: "var(--mg-text-secondary)", display: "block", marginBottom: "6px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Price (₹)
                  </label>
                  <input
                    id="onboarding-price"
                    type="number"
                    value={data.price}
                    onChange={(e) => setData((p) => ({ ...p, price: e.target.value }))}
                    placeholder="3999"
                    min="1"
                    aria-invalid={Boolean(priceError)}
                    aria-describedby={priceError ? "onboarding-price-error" : undefined}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "var(--mg-surface)",
                      border: `1px solid ${priceError ? "var(--mg-critical)" : "var(--mg-glass-2-border)"}`,
                      borderRadius: "12px",
                      fontSize: "0.9375rem",
                      color: "var(--mg-text)",
                      outline: "none",
                      transition: "border-color 0.2s ease",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = priceError ? "var(--mg-critical)" : "var(--mg-brand)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = priceError ? "var(--mg-critical)" : "var(--mg-glass-2-border)"; }}
                  />
                  {priceError && <div id="onboarding-price-error" style={{ fontSize: "0.75rem", color: "var(--mg-critical)", marginTop: "6px" }}>{priceError}</div>}
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--mg-text-secondary)", display: "block", marginBottom: "8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Billing
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {BILLING_OPTIONS.map((b) => {
                      const selected = data.billingInterval === b.id;
                      return (
                        <button
                          key={b.id}
                          onClick={() => setData((p) => ({ ...p, billingInterval: b.id }))}
                          style={{
                            flex: 1,
                            padding: "9px",
                            borderRadius: "10px",
                            border: `1px solid ${selected ? "var(--mg-brand)" : "var(--mg-glass-2-border)"}`,
                            background: selected ? "rgba(11,92,255,0.1)" : "var(--mg-surface)",
                            color: selected ? "var(--mg-brand)" : "var(--mg-text-secondary)",
                            fontSize: "12px",
                            fontWeight: selected ? 700 : 500,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {b.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step: Buyer */}
          {step === "buyer" && (
            <div
              style={{
                background: "var(--mg-glass-2-bg)",
                backdropFilter: "blur(20px)",
                border: "1px solid var(--mg-glass-2-border)",
                borderRadius: "20px",
                padding: "28px 32px",
                boxShadow: "var(--mg-glass-2-shadow)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-space-grotesk), sans-serif",
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: "var(--mg-text)",
                  margin: "0 0 6px",
                }}
              >
                What does the buyer get?
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--mg-text-secondary)", margin: "0 0 24px" }}>
                Select what&apos;s included. AI buyers use these to evaluate your offer.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
                {COMMITMENT_OPTIONS.map((c) => {
                  const selected = data.commitments.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => toggleCommitment(c)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "99px",
                        border: `1px solid ${selected ? "var(--mg-brand)" : "var(--mg-glass-2-border)"}`,
                        background: selected ? "rgba(11,92,255,0.1)" : "var(--mg-surface)",
                        color: selected ? "var(--mg-brand)" : "var(--mg-text-secondary)",
                        fontSize: "12px",
                        fontWeight: selected ? 700 : 500,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      {selected && "✓"} {c}
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  background: "var(--mg-glass-1-bg)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  fontSize: "0.75rem",
                  color: "var(--mg-text-muted)",
                }}
              >
                These structured terms help AI buyers understand and compare your offer. You can refine them later.
              </div>
            </div>
          )}

          {/* Step: Review */}
          {step === "review" && (
            <div
              style={{
                background: "var(--mg-glass-2-bg)",
                backdropFilter: "blur(20px)",
                border: "1px solid var(--mg-glass-2-border)",
                borderRadius: "20px",
                padding: "28px 32px",
                boxShadow: "var(--mg-glass-2-shadow)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-space-grotesk), sans-serif",
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: "var(--mg-text)",
                  margin: "0 0 6px",
                }}
              >
                What MandateGuard understood
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--mg-text-secondary)", margin: "0 0 24px" }}>
                Here&apos;s how your offer will appear to AI buyers.
              </p>

              {/* Offer summary */}
              <div
                style={{
                  background: "var(--mg-glass-1-bg)",
                  borderRadius: "14px",
                  padding: "18px 20px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--mg-brand)", marginBottom: "10px" }}>
                  YOUR OFFER
                </div>
                <div style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "var(--mg-text)", marginBottom: "4px" }}>
                  {data.offerName || "—"}
                </div>
                <div style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--mg-text)", letterSpacing: "-0.03em", marginBottom: "14px" }}>
                  ₹{data.price || "—"}
                  <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--mg-text-secondary)", marginLeft: "4px" }}>
                    / {data.billingInterval === "one-time" ? "one-time" : data.billingInterval === "year" ? "yr" : "mo"}
                  </span>
                </div>

                {data.commitments.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {data.commitments.map((c) => (
                      <div key={c} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <circle cx="6.5" cy="6.5" r="5.5" fill="rgba(16,185,129,0.1)" stroke="#10B981" strokeWidth="1.5" />
                          <path d="M3.5 6.5L5.5 8.5L9.5 4.5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span style={{ fontSize: "0.8125rem", color: "var(--mg-text)" }}>{c}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI understanding */}
              <div
                style={{
                  background: "var(--mg-glass-1-bg)",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  fontSize: "0.75rem",
                  color: "var(--mg-text-muted)",
                  marginBottom: "20px",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: "4px", color: "var(--mg-text-secondary)" }}>AI can now verify:</div>
                {[
                  data.offerName && "Offer name",
                  data.price && "Price",
                  data.billingInterval && `Billing (${data.billingInterval})`,
                  data.commitments.length > 0 && `${data.commitments.length} commitment${data.commitments.length !== 1 ? "s" : ""}`,
                ].filter(Boolean).join(" · ")}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 14px",
                  background: "rgba(16, 185, 129, 0.05)",
                  border: "1px solid rgba(16, 185, 129, 0.15)",
                  borderRadius: "10px",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L8.5 4L12 4.5L9.5 7L10 10.5L7 9L4 10.5L4.5 7L2 4.5L5.5 4L7 1Z" fill="#10B981" />
                </svg>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--mg-success)" }}>
                  Your offer is ready for AI buyers
                </span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px" }}>
            <button
              onClick={handleBack}
              disabled={step === "business"}
              style={{
                padding: "10px 18px",
                borderRadius: "10px",
                border: "1px solid var(--mg-glass-2-border)",
                background: "var(--mg-surface)",
                color: step === "business" ? "var(--mg-text-muted)" : "var(--mg-text-secondary)",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: step === "business" ? "not-allowed" : "pointer",
                opacity: step === "business" ? 0.4 : 1,
                transition: "all 0.15s ease",
              }}
            >
              ← Back
            </button>

            {step !== "review" ? (
              <button
                onClick={handleNext}
                disabled={!canProceed[step]}
                style={{
                  padding: "10px 24px",
                  borderRadius: "10px",
                  border: "none",
                  background: canProceed[step]
                    ? "linear-gradient(135deg, var(--mg-brand), var(--mg-brand-hover))"
                    : "var(--mg-surface)",
                  color: canProceed[step] ? "white" : "var(--mg-text-muted)",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  cursor: canProceed[step] ? "pointer" : "not-allowed",
                  opacity: canProceed[step] ? 1 : 0.5,
                  boxShadow: canProceed[step] ? "0 4px 12px rgba(11,92,255,0.2)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={isCompleting}
                style={{
                  padding: "10px 24px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #10B981, #059669)",
                  color: "white",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  cursor: isCompleting ? "not-allowed" : "pointer",
                  opacity: isCompleting ? 0.6 : 1,
                  boxShadow: "0 4px 12px rgba(16,185,129,0.2)",
                  transition: "all 0.15s ease",
                }}
              >
                {isCompleting ? "Setting up..." : "Looks good →"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
