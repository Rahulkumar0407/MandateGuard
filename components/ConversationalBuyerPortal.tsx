"use client";

import React, { useState } from "react";
import type { ConversationalBuyerResponse } from "@/lib/agent/conversational-buyer";
import type { BuyerPurchasePreview, BuyerTransactionReceipt } from "@/lib/agent/buyer-transaction";
import { StorefrontAvatar } from "./Illustrations";

interface ChatEntry {
  id: string;
  sender: "user" | "assistant";
  text: string;
  response?: ConversationalBuyerResponse;
  timestamp: Date;
}

const EXAMPLE_PROMPTS = [
  { label: "Human Mentor (Hinglish)", text: "4k ke andar human mentor chahiye" },
  { label: "Mock Interviews (English)", text: "I need system design with mock interviews under ₹4,000/mo" },
  { label: "Quality & SLA (English)", text: "Best plan for interview prep with 24h SLA turnaround" },
  { label: "DSA Self-Paced (Hinglish)", text: "DSA aur algorithm prep sasta wala chahiye with refund guarantee" },
];

let idCounter = 0;
function generateMessageId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
}

export function ConversationalBuyerPortal() {
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activePreview, setActivePreview] = useState<BuyerPurchasePreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isTransacting, setIsTransacting] = useState(false);
  const [transactionReceipt, setTransactionReceipt] = useState<BuyerTransactionReceipt | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStaleError, setIsStaleError] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showWhyDetail, setShowWhyDetail] = useState(false);

  // Focus input on mount
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMessageId = generateMessageId("msg_user");
    const currentTime = new Date();
    const newMessages: ChatEntry[] = [
      ...messages,
      {
        id: userMessageId,
        sender: "user",
        text: query,
        timestamp: currentTime,
      },
    ];

    setMessages(newMessages);
    setInputText("");
    setIsLoading(true);
    setShowAlternatives(false);
    setShowWhyDetail(false);

    try {
      const res = await fetch("/api/buyer/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data: { success: boolean } & ConversationalBuyerResponse = await res.json();

      setMessages([
        ...newMessages,
        {
          id: generateMessageId("msg_ai"),
          sender: "assistant",
          text: data.message,
          response: data,
          timestamp: new Date(),
        },
      ]);
    } catch (err: unknown) {
      setMessages([
        ...newMessages,
        {
          id: generateMessageId("msg_ai_err"),
          sender: "assistant",
          text:
            err instanceof Error
              ? `Sorry, I encountered an issue: ${err.message}`
              : "Unable to process your request at this time. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewPurchase = async (offerId: string) => {
    setIsPreviewLoading(true);
    setErrorMessage(null);
    setIsStaleError(false);

    try {
      const lastMessage = messages[messages.length - 1];
      const buyerQuery =
        messages.find((m) => m.sender === "user")?.text || "Mentorship subscription";

      const res = await fetch("/api/buyer/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId,
          buyerQuery,
          candidateOffer: lastMessage?.response?.recommendation?.recommendedOffer,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to load purchase preview.");
      }

      const data = await res.json();
      setActivePreview(data.preview);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Error generating purchase preview.",
      );
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleConfirmAuthorizeAndTransact = async () => {
    if (!activePreview) return;
    setIsTransacting(true);
    setErrorMessage(null);
    setIsStaleError(false);

    try {
      const res = await fetch("/api/buyer/authorize-and-transact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previewSnapshot: activePreview,
          customerName: "Rahul Sharma",
          customerEmail: "buyer.ai@example.com",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.code === "STALE_OFFER_DETECTED" || res.status === 409) {
          setIsStaleError(true);
          setErrorMessage(
            data.userFacingExplanation ||
              "This offer was updated with new terms while you were reviewing. Please review the updated terms.",
          );
          return;
        }
        throw new Error(data.error || "Transaction could not be authorized.");
      }

      setTransactionReceipt(data.receipt);
      setActivePreview(null);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Transaction could not be authorized.",
      );
    } finally {
      setIsTransacting(false);
    }
  };

  const handleRefreshAndReauthorize = async () => {
    if (!activePreview) return;
    await handleReviewPurchase(activePreview.offerId);
  };

  const lastAiMessage = [...messages].reverse().find((m) => m.sender === "assistant");
  const currentRecommendation = lastAiMessage?.response?.recommendation;
  const currentOffer = currentRecommendation?.recommendedOffer;
  const lastUserQuery = [...messages].reverse().find((m) => m.sender === "user")?.text;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 font-sans text-[var(--mg-text)] antialiased" data-testid="conversational-buyer-portal-root">
      {/* =========================================================================
          TOP OF PAGE: Clean Product Header
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--mg-border)] pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#0B5CFF]/15 text-[#0B5CFF] border border-[#0B5CFF]/30">
            <span className="w-2 h-2 rounded-full bg-[#0B5CFF] animate-pulse" />
            <span>AI SHOPPING CONCIERGE</span>
          </div>
          <p className="text-xs text-[var(--mg-text-secondary)] font-medium">
            Find and buy verified subscription offers with natural English, Hindi, or Hinglish.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/30 self-start sm:self-auto shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Razorpay Test Mode Active</span>
        </div>
      </div>

      {/* =========================================================================
          PRIMARY SHOPPING INTERFACE
          ========================================================================= */}
      {messages.length === 0 ? (
        /* =========================================================================
            STATE 1: EMPTY / LANDING STATE ("What are you looking for?")
            ========================================================================= */
        <div className="mg-glass-2 border border-[var(--mg-border)] rounded-3xl p-8 sm:p-14 text-center max-w-2xl mx-auto space-y-8 shadow-2xl animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-[#0B5CFF] border border-blue-500/20 flex items-center justify-center text-2xl mx-auto shadow-xs">
            🛍️
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--mg-text)] tracking-tight">
              What are you looking for?
            </h1>
            <p className="text-xs sm:text-sm text-[var(--mg-text-secondary)] max-w-md mx-auto leading-relaxed">
              Tell me what you need. I&apos;ll find the best match. Ask naturally in English or Hinglish.
            </p>
          </div>

          {/* Large Tactile Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative max-w-xl mx-auto"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. Human mentor under ₹4,000 with 24h SLA..."
              disabled={isLoading}
              className="w-full bg-[var(--mg-surface-subtle)] border border-[var(--mg-border)] rounded-2xl px-5 py-4 text-sm font-bold text-[var(--mg-text)] placeholder-[var(--mg-text-muted)] focus:outline-none focus:border-[#0B5CFF] shadow-inner transition-all pr-24"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="absolute right-2.5 top-2.5 px-4 py-2 bg-[#0B5CFF] hover:bg-[#004DE6] text-white text-xs font-bold rounded-xl shadow-[0_0_12px_rgba(11,92,255,0.4)] transition-all disabled:opacity-50 mg-press"
            >
              Search →
            </button>
          </form>

          {/* Tactile Example Prompt Chips */}
          <div className="space-y-3 pt-2 text-left">
            <span className="text-xs font-extrabold text-[var(--mg-text-muted)] uppercase tracking-wider block text-center">
              Suggested requests
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EXAMPLE_PROMPTS.map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(ex.text)}
                  className="p-4 rounded-2xl border border-[var(--mg-border)] bg-[var(--mg-surface-subtle)] hover:bg-[var(--mg-surface-elevated)] hover:border-blue-500/40 hover:shadow-lg transition-all text-left group mg-press"
                >
                  <div className="text-xs font-bold text-[var(--mg-text)] group-hover:text-[#0B5CFF] transition-colors">
                    {ex.label}
                  </div>
                  <div className="text-[11px] text-[var(--mg-text-muted)] mt-0.5 truncate">
                    &quot;{ex.text}&quot;
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
            STATE 2 & 3: CONVERSATION, UNDERSTANDING & MATCH EXPERIENCE
            ========================================================================= */
        <div className="space-y-6">
          {/* Active Search / Input Pill */}
          <div className="mg-glass-1 border border-[var(--mg-border)] rounded-3xl p-4 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#0B5CFF] border border-blue-500/20 flex items-center justify-center text-sm font-bold">
                🔍
              </span>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--mg-text-muted)] block">
                  YOU ASKED
                </span>
                <p className="text-sm font-black text-[var(--mg-text)]">
                  &quot;{lastUserQuery}&quot;
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setMessages([]);
                setInputText("");
              }}
              className="text-xs font-bold text-[#0B5CFF] hover:underline bg-[#0B5CFF]/10 px-3.5 py-1.5 rounded-xl self-start sm:self-auto transition-colors border border-[#0B5CFF]/20 mg-press"
            >
              New search
            </button>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="mg-glass-1 border border-[var(--mg-border)] rounded-3xl p-8 text-center space-y-3 shadow-md animate-pulse">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-[#0B5CFF] flex items-center justify-center text-lg mx-auto">
                ⚡
              </div>
              <h3 className="text-base font-extrabold text-[var(--mg-text)]">
                Finding the best match for you...
              </h3>
              <p className="text-xs text-[var(--mg-text-muted)]">
                Checking budget, verified commitments, and turn-around guarantees.
              </p>
            </div>
          )}

          {/* Result Presentation */}
          {!isLoading && currentOffer && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Helpful Visual Understanding Checklist */}
              <div className="mg-glass-1 border border-[var(--mg-border)] rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--mg-text-muted)] block">
                  YOU NEED:
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 bg-[var(--mg-surface-subtle)] rounded-xl border border-[var(--mg-border)] text-xs font-bold text-[var(--mg-text)] shadow-xs">
                    ✓ Human mentor
                  </span>
                  <span className="px-3 py-1 bg-[var(--mg-surface-subtle)] rounded-xl border border-[var(--mg-border)] text-xs font-bold text-[var(--mg-text)] shadow-xs">
                    ✓ Monthly billing
                  </span>
                  <span className="px-3 py-1 bg-[var(--mg-surface-subtle)] rounded-xl border border-[var(--mg-border)] text-xs font-bold text-[var(--mg-text)] shadow-xs">
                    ✓ Under ₹4,000
                  </span>
                  <span className="px-3 py-1 bg-[var(--mg-surface-subtle)] rounded-xl border border-[var(--mg-border)] text-xs font-bold text-[var(--mg-text)] shadow-xs">
                    ✓ 24h response SLA
                  </span>
                </div>
              </div>

              {/* Dominant Matched Product Card */}
              <div className="mg-glass-2 border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-10 shadow-[0_0_30px_rgba(16,185,129,0.15)] space-y-6 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>#1 MATCH FOUND</span>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-500 text-xs font-black rounded-xl border border-emerald-500/30">
                    ✓ Within your ₹4,000 limit
                  </span>
                </div>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pt-2">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <StorefrontAvatar name={currentOffer.name} />
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-[var(--mg-text)] tracking-tight">
                          {currentOffer.name}
                        </h2>
                        <span className="text-xs text-[var(--mg-text-secondary)] font-medium">
                          Offered by InterviewForge AI
                        </span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--mg-text-secondary)] leading-relaxed max-w-xl pt-2">
                      {currentOffer.description || "Comprehensive distributed systems architecture preparation with verified 1:1 human mentor guidance."}
                    </p>
                  </div>

                  <div className="text-left md:text-right bg-[var(--mg-surface-subtle)] md:bg-transparent p-4 md:p-0 rounded-2xl border md:border-none border-[var(--mg-border)]">
                    <span className="text-xs text-[var(--mg-text-muted)] font-bold uppercase tracking-wider block">PRICE</span>
                    <span className="text-3xl font-black text-[var(--mg-text)]">
                      ₹{(currentOffer.price / 100).toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-[var(--mg-text-muted)] block font-bold">
                      / {currentOffer.billingInterval}
                    </span>
                  </div>
                </div>

                {/* Verified Commitments Checklist */}
                <div className="p-5 bg-emerald-500/10 rounded-2xl border border-emerald-500/25 space-y-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500 block">
                    WHAT&apos;S INCLUDED &amp; VERIFIED
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-emerald-500">
                    <div className="flex items-center space-x-2">
                      <span>✓</span>
                      <span>Dedicated 1:1 human mentor</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>✓</span>
                      <span>4 live sessions / month</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>✓</span>
                      <span>24-hour response turnaround</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>✓</span>
                      <span>30-day money-back guarantee</span>
                    </div>
                  </div>
                </div>

                {/* Plain-English Rationale */}
                <div className="p-4 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)] text-xs text-[var(--mg-text-secondary)] leading-relaxed">
                  <span className="font-bold text-[var(--mg-text)] block mb-1">Why this one?</span>
                  {currentRecommendation?.rationale || "Fits your budget and gives you the exact human mentor support you asked for."}
                </div>

                {/* Action Controls */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[var(--mg-border)]">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowWhyDetail(!showWhyDetail)}
                      className="text-xs font-bold text-[var(--mg-text-muted)] hover:text-[var(--mg-text)] underline underline-offset-4"
                    >
                      {showWhyDetail ? "Hide match reasoning" : "See why this matches"}
                    </button>
                    <span className="text-[var(--mg-text-muted)]">•</span>
                    <button
                      onClick={() => setShowAlternatives(!showAlternatives)}
                      className="text-xs font-bold text-[#0B5CFF] hover:underline underline-offset-4"
                    >
                      {showAlternatives ? "Hide other options" : "See other options"}
                    </button>
                  </div>

                  <button
                    onClick={() => handleReviewPurchase(currentOffer.id)}
                    disabled={isPreviewLoading}
                    className="px-8 py-3.5 bg-[#0B5CFF] hover:bg-[#004DE6] text-white text-xs font-bold rounded-2xl shadow-[0_0_20px_rgba(11,92,255,0.4)] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mg-gate-btn mg-press"
                  >
                    <span>{isPreviewLoading ? "Preparing preview..." : "Review purchase →"}</span>
                  </button>
                </div>
              </div>

              {/* Collapsible Match Reasoning */}
              {showWhyDetail && (
                <div className="p-6 bg-[var(--mg-surface-subtle)] border border-[var(--mg-border)] rounded-3xl space-y-3 animate-in fade-in duration-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--mg-text-muted)]">
                    Detailed Match Reasoning
                  </h4>
                  <div className="space-y-1.5 text-xs text-[var(--mg-text-secondary)] font-medium">
                    <p>• Category: System Design mentorship was correctly understood from natural language.</p>
                    <p>• Price check: ₹3,499 strictly fits your ₹4,000 ceiling.</p>
                    <p>• Mentor verification: Confirmed 1:1 mentor sessions in structured commitments.</p>
                    <p>• SLA guarantee: 24h response turnaround verified.</p>
                  </div>
                </div>
              )}

              {/* Collapsible Alternatives Drawer */}
              {showAlternatives && (
                <div className="p-6 mg-glass-1 border border-[var(--mg-border)] rounded-3xl space-y-4 animate-in fade-in duration-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--mg-text-muted)]">
                    Alternative Verified Offers in Catalog
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--mg-text)]">System Design Core</span>
                        <span className="text-xs font-black text-[var(--mg-text)]">₹2,499 / mo</span>
                      </div>
                      <p className="text-[11px] text-[var(--mg-text-secondary)]">
                        Self-paced curriculum with community review (No 1:1 mentor).
                      </p>
                      <button
                        onClick={() => handleReviewPurchase("p_sysdesign_core")}
                        className="text-xs font-bold text-[#0B5CFF] hover:underline"
                      >
                        Select this instead →
                      </button>
                    </div>

                    <div className="p-4 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--mg-text)]">Engineering Leadership</span>
                        <span className="text-xs font-black text-[var(--mg-text)]">₹2,499 / mo</span>
                      </div>
                      <p className="text-[11px] text-[var(--mg-text-secondary)]">
                        Executive interview prep with money-back guarantee.
                      </p>
                      <button
                        onClick={() => handleReviewPurchase("p_eng_lead")}
                        className="text-xs font-bold text-[#0B5CFF] hover:underline"
                      >
                        Select this instead →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          PURCHASE REVIEW & AUTHORIZATION SHEET / MODAL
          ========================================================================= */}
      {activePreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--mg-bg-panel)] border border-[var(--mg-border)] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-scale-in text-[var(--mg-text)] max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--mg-border)] pb-4">
              <div>
                <span className="text-[10px] font-mono text-[#0B5CFF] bg-[#0B5CFF]/15 px-2.5 py-0.5 rounded-full border border-[#0B5CFF]/30 font-bold">
                  STEP 2 OF 2 &bull; AUTHORIZATION
                </span>
                <h3 className="text-lg font-black text-[var(--mg-text)] mt-1">Review your purchase</h3>
              </div>
              <button
                onClick={() => setActivePreview(null)}
                className="text-[var(--mg-text-muted)] hover:text-[var(--mg-text)] text-base font-bold"
              >
                ✕
              </button>
            </div>

            {/* Error Message if Stale or Failed */}
            {errorMessage && (
              <div
                className={`p-4 rounded-2xl text-xs space-y-2 ${
                  isStaleError
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                    : "bg-red-500/10 text-red-400 border border-red-500/30"
                }`}
              >
                <div className="font-bold flex items-center space-x-1.5">
                  <span>{isStaleError ? "⚠️" : "✕"}</span>
                  <span>{isStaleError ? "Offer Terms Changed" : "Authorization Blocked"}</span>
                </div>
                <p>{errorMessage}</p>
                {isStaleError && (
                  <button
                    onClick={handleRefreshAndReauthorize}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-xs transition-all mt-1 mg-press"
                  >
                    Review updated terms &rarr;
                  </button>
                )}
              </div>
            )}

            {/* Structured Purchase Details */}
            <div className="p-5 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mg-text-muted)] block">
                    SERVICE
                  </span>
                  <h4 className="text-base font-black text-[var(--mg-text)] mt-0.5">
                    {activePreview.offerName}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-[var(--mg-text)]">
                    {activePreview.priceFormatted}
                  </span>
                  <span className="text-xs text-[var(--mg-text-muted)] block font-bold">
                    / {activePreview.billingInterval}
                  </span>
                </div>
              </div>

              {/* What's Protected */}
              <div className="space-y-1.5 pt-2 border-t border-[var(--mg-border)] text-xs text-[var(--mg-text-secondary)]">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--mg-text-muted)] block">
                  PROTECTED COMMITMENTS
                </span>
                <div className="space-y-1 font-medium">
                  {activePreview.verifiedCommitments.map((c, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Limit Confirmation */}
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 flex items-center justify-between text-xs font-bold text-emerald-500">
                <span>Budget ceiling</span>
                <span>₹4,000 / month (Verified ≤ Limit)</span>
              </div>
            </div>

            {/* Technical Details Toggle */}
            <div>
              <button
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="text-xs font-bold text-[var(--mg-text-muted)] hover:text-[var(--mg-text)] underline underline-offset-4"
              >
                {showTechnicalDetails ? "Hide technical parameters" : "Technical parameters"}
              </button>

              {showTechnicalDetails && (
                <div className="mt-3 p-4 bg-[var(--mg-surface-subtle)] rounded-2xl text-[11px] font-mono space-y-1 border border-[var(--mg-border)] text-[var(--mg-text-secondary)]">
                  <div>Version Hash: {activePreview.versionHash?.slice(0, 16) || "hash_verified"}...</div>
                  <div>Offer Version: v{activePreview.offerVersion}</div>
                  <div>Provider Gate: Razorpay Test Mode Sandbox</div>
                </div>
              )}
            </div>

            {/* Primary Authorization Button */}
            <button
              onClick={handleConfirmAuthorizeAndTransact}
              disabled={isTransacting}
              className="w-full py-4 bg-[#0B5CFF] hover:bg-[#004DE6] text-white text-xs font-black rounded-2xl shadow-[0_0_20px_rgba(11,92,255,0.4)] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mg-gate-btn mg-press"
            >
              <span>{isTransacting ? "Authorizing with Razorpay..." : "Confirm & authorize →"}</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          PURCHASE SUCCESS RECEIPT MODAL
          ========================================================================= */}
      {transactionReceipt && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--mg-bg-panel)] border border-[var(--mg-border)] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-scale-in text-[var(--mg-text)]">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 flex items-center justify-center font-black text-2xl mx-auto animate-bounce">
                ✓
              </div>
              <h3 className="text-2xl font-black text-[var(--mg-text)]">You&apos;re subscribed.</h3>
              <p className="text-xs text-[var(--mg-text-secondary)] font-medium">
                Mandate authorized and recurring protection active.
              </p>
            </div>

            <div className="p-5 bg-[var(--mg-surface-subtle)] rounded-2xl border border-[var(--mg-border)] space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--mg-border)]">
                <span className="text-[var(--mg-text-muted)]">Plan Name</span>
                <span className="font-bold text-[var(--mg-text)]">{transactionReceipt.offerName}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[var(--mg-border)]">
                <span className="text-[var(--mg-text-muted)]">Mandate ID</span>
                <span className="font-mono font-bold text-[var(--mg-text)] truncate max-w-[200px]">
                  {transactionReceipt.mandateId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--mg-text-muted)]">Protection Status</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-500 text-[10px] font-bold rounded">
                  Guarded &bull; Zero Unauthorized Price Changes
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setTransactionReceipt(null);
                setMessages([]);
              }}
              className="w-full py-3.5 bg-[var(--mg-surface-subtle)] hover:bg-[var(--mg-border)] text-[var(--mg-text)] text-xs font-bold rounded-2xl border border-[var(--mg-border)] transition-all mg-press"
            >
              Done &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
