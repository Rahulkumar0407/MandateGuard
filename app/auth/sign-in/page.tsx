"use client";

import React, { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type OfferState = "offer" | "reading" | "clarity" | "locked";

const STATE_DURATIONS = {
  offer: 1600,
  reading: 1800,
  clarity: 1400,
  locked: 1800,
};

function LivingOfferObject({ reducedMotion }: { reducedMotion: boolean }) {
  const [state, setState] = useState<OfferState>("offer");
  const [visible, setVisible] = useState(true);
  const [scanLine, setScanLine] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      queueMicrotask(() => setState("locked"));
      return;
    }
    const sequence: OfferState[] = ["offer", "reading", "clarity", "locked"];
    let idx = 0;
    let hold: ReturnType<typeof setTimeout>;

    const advance = () => {
      idx = (idx + 1) % sequence.length;
      setVisible(false);
      hold = setTimeout(() => {
        setState(sequence[idx]);
        if (sequence[idx] === "reading") setScanLine(0);
        setVisible(true);
        hold = setTimeout(advance, STATE_DURATIONS[sequence[idx]]);
      }, 450);
    };

    hold = setTimeout(advance, STATE_DURATIONS.offer);
    return () => clearTimeout(hold);
  }, [reducedMotion]);

  useEffect(() => {
    if (state !== "reading" || reducedMotion) return;
    const lines = [0, 1, 2];
    let i = 0;
    const t = setInterval(() => {
      setScanLine(lines[i % 3]);
      i++;
      if (i >= lines.length * 2) clearInterval(t);
    }, 400);
    return () => clearInterval(t);
  }, [state, reducedMotion]);

  return (
    <div
      style={{
        background: "var(--mg-glass-2-bg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid var(--mg-glass-2-border)",
        borderRadius: "16px",
        padding: "20px 22px",
        boxShadow: "var(--mg-glass-2-shadow)",
        position: "relative",
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
        filter: visible ? "blur(0)" : "blur(2px)",
        transition: `opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                     transform 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                     filter 0.45s cubic-bezier(0.16, 1, 0.3, 1)`,
        animation: reducedMotion ? "none" : "offerBreathe 4s ease-in-out infinite",
      }}
      className="living-offer"
    >
      {/* Subtle inner reflection */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
        }}
      />

      {/* State: OFFER */}
      {state === "offer" && (
        <>
          <div style={{ marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--mg-brand)" }}>
              YOUR OFFER
            </span>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--mg-success)", boxShadow: "0 0 5px rgba(16, 185, 129, 0.6)" }} />
          </div>
          <div style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "1.05rem", fontWeight: 700, color: "var(--mg-text)", letterSpacing: "-0.02em", marginBottom: "2px" }}>
            System Design Pro
          </div>
          <div style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "1.35rem", fontWeight: 800, color: "var(--mg-text)", letterSpacing: "-0.03em", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>₹</span>3,999
            <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--mg-text-secondary)", marginLeft: "4px" }}>/ month</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {["Expert guidance", "Weekly sessions"].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "1.5px solid var(--mg-glass-2-border)", flexShrink: 0 }} />
                <span style={{ fontSize: "0.8rem", color: "var(--mg-text-secondary)" }}>{item}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* State: READING */}
      {state === "reading" && (
        <>
          <div style={{ marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--mg-brand)" }}>
              AI READING OFFER
            </span>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--mg-brand)", boxShadow: "0 0 5px rgba(11, 92, 255, 0.6)", animation: "pulse 1s ease-in-out infinite" }} />
          </div>
          <div style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "1.05rem", fontWeight: 700, color: "var(--mg-text)", letterSpacing: "-0.02em", marginBottom: "2px" }}>
            System Design Pro
          </div>
          <div style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "1.35rem", fontWeight: 800, color: "var(--mg-text)", letterSpacing: "-0.03em", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>₹</span>3,999
            <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--mg-text-secondary)", marginLeft: "4px" }}>/ month</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {[
              { label: "price", checked: scanLine >= 0 },
              { label: "support terms", checked: scanLine >= 1 },
              { label: "response time", checked: scanLine >= 2 },
            ].map(({ label, checked }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    border: `1.5px solid ${checked ? "var(--mg-brand)" : "var(--mg-glass-2-border)"}`,
                    background: checked ? "rgba(11, 92, 255, 0.15)" : "transparent",
                    flexShrink: 0,
                    transition: "all 0.3s ease",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {checked && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: -100,
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(90deg, transparent, rgba(11, 92, 255, 0.4), transparent)",
                        animation: "scanPass 0.4s ease-out forwards",
                      }}
                    />
                  )}
                </div>
                <span style={{ fontSize: "0.8rem", color: checked ? "var(--mg-text)" : "var(--mg-text-secondary)" }}>
                  {checked ? "✓ " : ""}{label}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* State: CLARITY */}
      {state === "clarity" && (
        <>
          <div style={{ marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--mg-success)" }}>
              CLARITY FOUND
            </span>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--mg-success)", boxShadow: "0 0 5px rgba(16, 185, 129, 0.6)" }} />
          </div>
          <div style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "1.05rem", fontWeight: 700, color: "var(--mg-text)", letterSpacing: "-0.02em", marginBottom: "2px" }}>
            System Design Pro
          </div>
          <div style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "1.35rem", fontWeight: 800, color: "var(--mg-text)", letterSpacing: "-0.03em", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>₹</span>3,999
            <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--mg-text-secondary)", marginLeft: "4px" }}>/ month</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {["1:1 mentor", "24h response"].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="7" cy="7" r="6" fill="rgba(16, 185, 129, 0.12)" stroke="#10B981" strokeWidth="1.5" />
                  <path d="M4 7L6 9L10 5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: "0.8rem", color: "var(--mg-text)" }}>{item}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* State: LOCKED */}
      {state === "locked" && (
        <>
          <div style={{ marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--mg-text-muted)" }}>
              MANDATE SNAPSHOT
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.6 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="var(--mg-text-muted)" strokeWidth="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="var(--mg-text-muted)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: "0.6rem", fontFamily: "var(--font-jetbrains-mono), monospace", fontWeight: 600, color: "var(--mg-text-muted)", letterSpacing: "0.05em" }}>
                LOCKED
              </span>
            </div>
          </div>
          <div style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "1.05rem", fontWeight: 700, color: "var(--mg-text)", letterSpacing: "-0.02em", marginBottom: "2px" }}>
            System Design Pro
          </div>
          <div style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "1.35rem", fontWeight: 800, color: "var(--mg-text)", letterSpacing: "-0.03em", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>₹</span>3,999
            <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--mg-text-secondary)", marginLeft: "4px" }}>/ month</span>
          </div>
          {/* Geometric seal */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                border: "1.5px solid var(--mg-success)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: reducedMotion ? "none" : "lockDraw 0.5s ease-out 0.1s both",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M5 12L10 17L20 7" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 30, strokeDashoffset: reducedMotion ? 0 : 30, animation: reducedMotion ? "none" : "tickDraw 0.4s ease-out 0.4s forwards" }} />
              </svg>
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--mg-success)", letterSpacing: "0.03em" }}>
              Snapshot verified
            </span>
          </div>
        </>
      )}

      {/* Status micro line */}
      <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: `1px solid ${state === "locked" ? "rgba(16, 185, 129, 0.15)" : "var(--mg-glass-2-border)"}`, display: "flex", alignItems: "center", gap: "5px" }}>
        <div
          style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: state === "reading" ? "var(--mg-brand)" : "var(--mg-success)",
            boxShadow: state === "reading"
              ? "0 0 5px rgba(11, 92, 255, 0.5)"
              : "0 0 5px rgba(16, 185, 129, 0.5)",
          }}
        />
        <span style={{ fontSize: "0.58rem", fontFamily: "var(--font-jetbrains-mono), monospace", fontWeight: 600, color: "var(--mg-text-muted)", letterSpacing: "0.06em" }}>
          {state === "offer" ? "OFFER RECORDED" :
            state === "reading" ? "AI ANALYZING" :
              state === "clarity" ? "TERMS CONFIRMED" : "MANDATE PROTECTED"}
        </span>
      </div>
    </div>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pageLoaded, setPageLoaded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setPageLoaded(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleGoogleAuth = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError("");
    setEmailError("");
    setPasswordError("");
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ method: "google" }),
      });
      if (res.ok) {
        window.location.href = "/overview";
      } else {
        setError("Authentication failed. Please try again.");
      }
    } catch {
      setError("Connection failed. Please check your network.");
    } finally {
      setIsLoading(false);
    }
  }, [router, isLoading]);

  const handleEmailAuth = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;
    setError("");
    setEmailError("");
    setPasswordError("");
    if (!email.trim()) {
      setEmailError("Enter your email address.");
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Enter a valid email address.");
      hasError = true;
    }
    if (!password) {
      setPasswordError("Enter your password.");
      hasError = true;
    }
    if (hasError) return;
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ method: "email", email, password, name: name || email.split("@")[0] }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        // Hard navigation ensures server redirect (e.g., to /onboarding) is followed correctly after auth
        window.location.href = "/overview";
      } else {
        const msg = typeof data.error === "string" ? data.error : "Email or password is incorrect.";
        if (msg.toLowerCase().includes("email")) setEmailError(msg);
        else if (msg.toLowerCase().includes("password")) setPasswordError(msg);
        setError(msg);
      }
    } catch {
      setError("Connection failed. Please check your network.");
    } finally {
      setIsLoading(false);
    }
  }, [email, password, name, isLoading, router]);

  const handleExploreDemo = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await fetch("/api/auth/sample", { method: "POST" });
      window.location.href = "/overview";
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const switchMode = useCallback((newMode: "signin" | "signup") => {
    setMode(newMode);
    setError("");
    router.replace(newMode === "signup" ? "/auth/sign-in?mode=signup" : "/auth/sign-in", { scroll: false });
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--mg-bg)",
        display: "flex",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "28%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          background: "radial-gradient(ellipse at center, rgba(11, 92, 255, 0.05) 0%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      {/* Container */}
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "clamp(28px, 4vw, 48px)",
          display: "flex",
          gap: "clamp(40px, 5vw, 64px)",
          alignItems: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* LEFT PANEL */}
        <div
          style={{
            flex: "0 0 44%",
            display: "flex",
            flexDirection: "column",
            gap: "0",
            opacity: pageLoaded ? 1 : 0,
            transform: pageLoaded ? "translateX(0)" : "translateX(-16px)",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          className="auth-left"
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "clamp(28px, 4vw, 40px)" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "9px",
                background: "linear-gradient(135deg, var(--mg-brand), var(--mg-brand-hover))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "14px",
                color: "white",
                boxShadow: "0 4px 16px rgba(11, 92, 255, 0.35)",
              }}
            >
              M
            </div>
            <span style={{ fontWeight: 800, fontSize: "15px", color: "var(--mg-text)", letterSpacing: "-0.02em" }}>
              MandateGuard
            </span>
          </div>

          {/* Eyebrow */}
          <div
            style={{
              marginBottom: "10px",
              opacity: pageLoaded ? 1 : 0,
              transform: pageLoaded ? "translateY(0)" : "translateY(8px)",
              transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s",
            }}
          >
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--mg-text-muted)",
              }}
            >
              AI-Ready Commerce
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "var(--mg-text)",
              margin: "0 0 14px",
              opacity: pageLoaded ? 1 : 0,
              transform: pageLoaded ? "translateY(0)" : "translateY(8px)",
              transition: "all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.15s",
            }}
          >
            Make your business
            <br />
            ready for the{" "}
            <span style={{ color: "var(--mg-brand)" }}>next buyer.</span>
          </h1>

          {/* Supporting copy */}
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--mg-text-secondary)",
              lineHeight: 1.6,
              margin: "0 0 clamp(24px, 3vw, 32px)",
              maxWidth: "360px",
              opacity: pageLoaded ? 1 : 0,
              transform: pageLoaded ? "translateY(0)" : "translateY(8px)",
              transition: "all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
            }}
          >
            Turn your offer into something AI can understand,
            choose, and safely pay for.
          </p>

          {/* Living offer object */}
          <div
            style={{
              opacity: pageLoaded ? 1 : 0,
              transform: pageLoaded ? "translateY(0)" : "translateY(10px)",
              transition: "all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.28s",
              maxWidth: "340px",
            }}
          >
            <LivingOfferObject reducedMotion={reducedMotion} />
          </div>

          {/* Micro footer line */}
          <div
            style={{
              marginTop: "clamp(16px, 2vw, 20px)",
              opacity: pageLoaded ? 0.5 : 0,
              transition: "opacity 0.7s ease 0.35s",
            }}
          >
            <p style={{ fontSize: "0.68rem", fontFamily: "var(--font-jetbrains-mono), monospace", color: "var(--mg-text-muted)", margin: 0, letterSpacing: "0.03em" }}>
              Your offer. Your mandate. Your control.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL - Auth Form */}
        <div
          style={{
            flex: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "380px",
              opacity: pageLoaded ? 1 : 0,
              transform: pageLoaded ? "translateY(0)" : "translateY(16px)",
              transition: "all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: "28px" }}>
              <h2
                style={{
                  fontFamily: "var(--font-space-grotesk), sans-serif",
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "var(--mg-text)",
                  margin: "0 0 6px",
                }}
              >
                {mode === "signin" ? "Sign in" : "Create account"}
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--mg-text-secondary)", margin: 0 }}>
                {mode === "signin"
                  ? "Continue where your AI-ready offer begins."
                  : "Set up your MandateGuard workspace."}
              </p>
            </div>

            {/* Google button */}
            <button
              onClick={handleGoogleAuth}
              disabled={isLoading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                width: "100%",
                padding: "13px 20px",
                background: "var(--mg-surface)",
                border: "1px solid var(--mg-glass-2-border)",
                borderRadius: "12px",
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "var(--mg-text)",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
                transition: "all 0.2s ease",
                marginBottom: "18px",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                  e.currentTarget.style.borderColor = "var(--mg-brand)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "var(--mg-glass-2-border)";
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>(Demo)</span>
            </button>

            {/* Divider */}
            <div style={{ position: "relative", marginBottom: "18px" }}>
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "var(--mg-glass-2-border)" }} />
              <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    color: "var(--mg-text-muted)",
                    background: "var(--mg-bg)",
                    padding: "0 12px",
                    textTransform: "uppercase",
                  }}
                >
                  or
                </span>
              </div>
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "18px" }} noValidate>
              {mode === "signup" && (
                <div>
                  <label htmlFor="auth-name" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--mg-text-secondary)", marginBottom: "6px" }}>Full name</label>
                  <input
                    id="auth-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    autoComplete="name"
                    style={{
                      width: "100%",
                      padding: "13px 16px",
                      background: "var(--mg-surface)",
                      border: "1px solid var(--mg-glass-2-border)",
                      borderRadius: "12px",
                      fontSize: "0.9rem",
                      color: "var(--mg-text)",
                      outline: "none",
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--mg-brand)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(11, 92, 255, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--mg-glass-2-border)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
              )}
              <div>
                <label htmlFor="auth-email" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--mg-text-secondary)", marginBottom: "6px" }}>Work email</label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(""); }}
                  placeholder="you@company.com"
                  autoComplete="username"
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? "auth-email-error" : undefined}
                  style={{
                    width: "100%",
                    padding: "13px 16px",
                    background: "var(--mg-surface)",
                    border: `1px solid ${emailError ? "var(--mg-critical)" : "var(--mg-glass-2-border)"}`,
                    borderRadius: "12px",
                    fontSize: "0.9rem",
                    color: "var(--mg-text)",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = emailError ? "var(--mg-critical)" : "var(--mg-brand)";
                    e.currentTarget.style.boxShadow = emailError ? "0 0 0 3px rgba(239,68,68,0.1)" : "0 0 0 3px rgba(11, 92, 255, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = emailError ? "var(--mg-critical)" : "var(--mg-glass-2-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                {emailError && <div id="auth-email-error" style={{ fontSize: "0.75rem", color: "var(--mg-critical)", marginTop: "6px" }}>{emailError}</div>}
              </div>
              <div style={{ position: "relative" }}>
                <label htmlFor="auth-password" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--mg-text-secondary)", marginBottom: "6px" }}>Password</label>
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(""); }}
                  placeholder={mode === "signup" ? "Create password" : "Password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? "auth-password-error" : undefined}
                  style={{
                    width: "100%",
                    padding: "13px 48px 13px 16px",
                    background: "var(--mg-surface)",
                    border: `1px solid ${passwordError ? "var(--mg-critical)" : "var(--mg-glass-2-border)"}`,
                    borderRadius: "12px",
                    fontSize: "0.9rem",
                    color: "var(--mg-text)",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = passwordError ? "var(--mg-critical)" : "var(--mg-brand)";
                    e.currentTarget.style.boxShadow = passwordError ? "0 0 0 3px rgba(239,68,68,0.1)" : "0 0 0 3px rgba(11, 92, 255, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = passwordError ? "var(--mg-critical)" : "var(--mg-glass-2-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    color: "var(--mg-text-muted)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    marginTop: "12px",
                  }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
                {passwordError && <div id="auth-password-error" style={{ fontSize: "0.75rem", color: "var(--mg-critical)", marginTop: "6px" }}>{passwordError}</div>}
              </div>

              <div style={{ textAlign: "right", marginTop: "-4px" }}>
                <button
                  type="button"
                  onClick={() => setError("Password reset is not available in demo — use the test account or Explore with sample business.")}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "0.8125rem",
                    color: "var(--mg-brand)",
                    cursor: "pointer",
                    padding: 0,
                    fontWeight: 500,
                  }}
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <div
                  style={{
                    padding: "12px 14px",
                    background: "rgba(239, 68, 68, 0.06)",
                    border: "1px solid rgba(239, 68, 68, 0.15)",
                    borderRadius: "10px",
                    fontSize: "0.8125rem",
                    color: "var(--mg-critical)",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "13px 20px",
                  background: "linear-gradient(135deg, var(--mg-brand), var(--mg-brand-hover))",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  color: "white",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.6 : 1,
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 16px rgba(11, 92, 255, 0.2)",
                  marginTop: "2px",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(11, 92, 255, 0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(11, 92, 255, 0.2)";
                }}
                onMouseDown={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = "scale(0.98)";
                  }
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
              >
                {isLoading ? "Please wait..." : mode === "signin" ? "Sign in →" : "Create account →"}
              </button>
            </form>

            {/* Mode switch */}
            <div style={{ textAlign: "center", marginBottom: "18px" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--mg-text-muted)" }}>
                {mode === "signin" ? "Don't have an account?" : "Already have an account?"}
                {" "}
                <button
                  onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--mg-brand)",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {mode === "signin" ? "Create one" : "Sign in"}
                </button>
              </span>
            </div>

            {/* Demo access */}
            <div
              style={{
                paddingTop: "18px",
                borderTop: "1px solid var(--mg-glass-2-border)",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "0.75rem", color: "var(--mg-text-muted)", marginBottom: "10px" }}>
                Evaluating MandateGuard?
              </p>
              <button
                onClick={handleExploreDemo}
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "11px 16px",
                  background: "transparent",
                  border: "1px solid var(--mg-glass-2-border)",
                  borderRadius: "10px",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--mg-text-secondary)",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.6 : 1,
                  transition: "all 0.2s ease",
                }}
              >
                Explore with sample business →
              </button>
            </div>

            {/* Trust */}
            <div style={{ marginTop: "22px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="var(--mg-text-muted)" strokeWidth="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="var(--mg-text-muted)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: "0.6875rem", color: "var(--mg-text-muted)" }}>
                Protected by MandateGuard · Razorpay Test Mode
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Back navigation */}
      <Link
        href="/"
        style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "var(--mg-text-muted)",
          textDecoration: "none",
          transition: "color 0.2s ease",
          zIndex: 50,
        }}
        onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--mg-brand)"; }}
        onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--mg-text-muted)"; }}
      >
        ← MandateGuard
      </Link>

      <style>{`
        @keyframes offerBreathe {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes scanPass {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        @keyframes lockDraw {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes tickDraw {
          to { stroke-dashoffset: 0; }
        }
        @media (max-width: 768px) {
          .auth-left { display: none !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function AuthSignInPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "var(--mg-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, var(--mg-brand), var(--mg-brand-hover))" }} />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
