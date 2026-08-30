"use client";

import React, { useState } from "react";
import { CommerceFlow } from "./Motifs";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { name: string; email: string }) => void;
  onExploreDemo: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  onExploreDemo,
}: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setTimeout(() => {
      onSuccess({ name: "InterviewForge AI", email: "merchant@interviewforge.ai" });
      setIsLoading(false);
      onClose();
    }, 400);
  };

  const handleEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      onSuccess({ name: email.split("@")[0] || "Merchant", email: email });
      setIsLoading(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 bg-[var(--mg-navy)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-[var(--mg-border)] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-scale-in grid grid-cols-1 md:grid-cols-[1fr_1.2fr]">
        {/* Left Column: Editorial Statement */}
        <div className="bg-[var(--mg-navy)] text-white p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden hidden md:flex">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--mg-brand)] text-white flex items-center justify-center font-black text-base shadow-xs">
                M
              </div>
              <span className="font-extrabold tracking-tight text-base text-white">
                MandateGuard
              </span>
            </div>

            <div className="pt-6 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mg-brand-line)] bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                AI Growth &amp; Commerce
              </span>
              <h3 className="text-xl font-extrabold leading-snug text-white">
                Make your business ready for AI buyers.
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                See how AI buyers discover, evaluate, and choose your offers — and protect every recurring transaction.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-8 space-y-3 border-t border-white/15">
            <CommerceFlow tone="light" />
            <div className="flex items-center space-x-2 text-[11px] text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Razorpay Test Mode</span>
            </div>
          </div>
        </div>

        {/* Right Column: Sign-in Surface */}
        <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="md:hidden w-8 h-8 rounded-lg bg-[var(--mg-brand)] text-white flex items-center justify-center font-bold text-base mb-3 shadow-xs">
                M
              </div>
              <h2 className="text-xl font-extrabold text-[var(--mg-navy)]">Sign in to MandateGuard</h2>
              <p className="text-xs text-[var(--mg-text-secondary)] mt-1">
                 See how AI buyers see your offers and keep every payment protected.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--mg-text-muted)] hover:text-[var(--mg-navy)] text-sm font-bold p-1"
            >
              ✕
            </button>
          </div>

          {/* Auth Methods */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 border border-[var(--mg-border)] rounded-xl hover:bg-[var(--mg-bg)] text-xs font-bold text-[var(--mg-navy)] transition-all shadow-xs disabled:opacity-50 mg-press"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--mg-border)]" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-2 text-[var(--mg-text-muted)] font-bold">Or with work email</span>
              </div>
            </div>

            <form onSubmit={handleEmailSignIn} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@yourcompany.com"
                required
                className="w-full bg-[var(--mg-bg)] border border-[var(--mg-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--mg-navy)] placeholder-[var(--mg-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--mg-brand)] transition-all font-medium"
              />
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full bg-[var(--mg-brand)] hover:bg-[var(--mg-brand-hover)] text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 mg-press"
              >
                {isLoading ? "Signing in..." : "Continue with Email →"}
              </button>
            </form>
          </div>

          {/* Demo Fast-Path Button */}
          <div className="pt-4 border-t border-[var(--mg-border)] text-center space-y-2">
            <span className="text-[11px] text-[var(--mg-text-muted)] block font-medium">Reviewing as a judge or evaluator?</span>
            <button
              onClick={() => {
                onExploreDemo();
                onClose();
              }}
              className="w-full py-2.5 px-3 bg-[var(--mg-success-soft)] hover:bg-emerald-100 text-[var(--mg-success)] border border-[var(--mg-success)]/20 rounded-xl text-xs font-bold transition-all mg-press"
            >
              ⚡ Explore sample business (Instant access)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
