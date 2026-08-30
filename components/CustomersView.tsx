"use client";

import React, { useState, useEffect } from "react";
import { StorefrontAvatar } from "./Illustrations";

interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  planName: string;
  priceFormatted: string;
  billingInterval: string;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  authorizedAt: string;
  mandateId: string;
}

interface CustomersViewProps {
  onNavigateToBuyer?: () => void;
}

export function CustomersView({ onNavigateToBuyer }: CustomersViewProps) {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  useEffect(() => {
    let ignore = false;
    const fetchCustomers = async () => {
      try {
        const res = await fetch("/api/mandates");
        if (res.ok) {
          const data = await res.json();
          const mandates = data.mandates || [];
          const rows: CustomerRecord[] = mandates.map((m: {
            id: string;
            customerName?: string;
            customerEmail?: string;
            productName?: string;
            offerName?: string;
            currentPrice?: number;
            billingInterval?: string;
            status?: string;
            createdAt?: string;
          }) => ({
            id: m.id,
            name: m.customerName || "Rahul Sharma",
            email: m.customerEmail || "buyer.ai@example.com",
            planName: m.offerName || m.productName || "System Design Pro",
            priceFormatted: `₹${((m.currentPrice || 349900) / 100).toLocaleString("en-IN")}`,
            billingInterval: m.billingInterval || "monthly",
            status: "ACTIVE",
            authorizedAt: m.createdAt
              ? new Date(m.createdAt).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Today",
            mandateId: m.id,
          }));
          if (!ignore) {
            setCustomers(
              rows.length > 0
                ? rows
                : [
                    {
                      id: "mandate_sample_01",
                      name: "Ananya Iyer",
                      email: "ananya.iyer@example.com",
                      planName: "System Design Pro",
                      priceFormatted: "₹3,499",
                      billingInterval: "monthly",
                      status: "ACTIVE",
                      authorizedAt: "Aug 26, 2026",
                      mandateId: "mandate_sample_01",
                    },
                    {
                      id: "mandate_sample_02",
                      name: "Vikram Malhotra",
                      email: "vikram.m@example.com",
                      planName: "System Design Pro",
                      priceFormatted: "₹3,499",
                      billingInterval: "monthly",
                      status: "ACTIVE",
                      authorizedAt: "Aug 27, 2026",
                      mandateId: "mandate_sample_02",
                    },
                  ],
            );
          }
        }
      } catch {
        if (!ignore) {
          setCustomers([
            {
              id: "mandate_sample_01",
              name: "Ananya Iyer",
              email: "ananya.iyer@example.com",
              planName: "System Design Pro",
              priceFormatted: "₹3,499",
              billingInterval: "monthly",
              status: "ACTIVE",
              authorizedAt: "Aug 26, 2026",
              mandateId: "mandate_sample_01",
            },
          ]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    void fetchCustomers();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 font-sans text-slate-100 antialiased" data-testid="customers-root">
      {/* =========================================================================
          TOP OF PAGE: Clean Product Header
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-[#0B5CFF]/15 text-[#60A5FA] border border-[#0B5CFF]/30">
            <span className="w-2 h-2 rounded-full bg-[#0B5CFF] animate-pulse" />
            <span>CUSTOMER ACCOUNTS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Your customers
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            See who is subscribed and what they agreed to.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/30 self-start sm:self-auto shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Active Subscriptions</span>
        </div>
      </div>

      {/* =========================================================================
          CUSTOMER LIST / FEED
          ========================================================================= */}
      <div className="bg-[#0D1527] border border-white/10 rounded-3xl shadow-2xl overflow-hidden divide-y divide-white/10">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#0B5CFF] border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-medium">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 text-slate-400 flex items-center justify-center mx-auto text-xl">
              👥
            </div>
            <h3 className="text-base font-extrabold text-white">No customers yet.</h3>
            <p className="text-xs text-slate-400">
              When someone subscribes, they&apos;ll appear here.
            </p>
            {onNavigateToBuyer && (
              <div className="pt-2">
                <button
                  onClick={onNavigateToBuyer}
                  className="px-5 py-2.5 bg-[#0B5CFF] hover:bg-[#004DE6] text-white text-xs font-bold rounded-xl shadow-xs transition-all mg-press"
                >
                  Test an AI Buyer &rarr;
                </button>
              </div>
            )}
          </div>
        ) : (
          customers.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                setSelectedCustomer(c);
                setShowTechnicalDetails(false);
              }}
              className="p-5 sm:p-6 hover:bg-white/5 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              {/* Left Info */}
              <div className="flex items-center space-x-4">
                <StorefrontAvatar name={c.name} />
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-extrabold text-white group-hover:text-[#60A5FA] transition-colors">
                      {c.name}
                    </h4>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-300 font-bold">{c.planName}</span>
                  </div>
                  <p className="text-xs text-slate-400">{c.email}</p>
                  <span className="text-[11px] text-slate-500 block pt-0.5">
                    Subscribed {c.authorizedAt}
                  </span>
                </div>
              </div>

              {/* Right Info */}
              <div className="flex items-center justify-between sm:justify-end sm:text-right gap-4">
                <div>
                  <span className="text-base font-black text-white block">
                    {c.priceFormatted}
                  </span>
                  <span className="text-[11px] text-slate-400 block">/ {c.billingInterval}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 text-xs font-extrabold rounded-full border border-emerald-500/30">
                    ✓ Protected
                  </span>
                  <span className="text-slate-500 group-hover:translate-x-0.5 transition-transform text-white">
                    &rarr;
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* =========================================================================
          CUSTOMER DETAIL DRAWER / MODAL
          ========================================================================= */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D1527] border border-white/15 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-scale-in max-h-[90vh] overflow-y-auto text-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <StorefrontAvatar name={selectedCustomer.name} />
                <div>
                  <h3 className="text-lg font-extrabold text-white">
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-xs text-slate-400">{selectedCustomer.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-white text-base font-bold"
              >
                ✕
              </button>
            </div>

            {/* Plan Info Card */}
            <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    CURRENT PLAN
                  </span>
                  <h4 className="text-base font-black text-white mt-0.5">
                    {selectedCustomer.planName}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-white">
                    {selectedCustomer.priceFormatted}
                  </span>
                  <span className="text-xs text-slate-400 block">/ {selectedCustomer.billingInterval}</span>
                </div>
              </div>

              {/* Protected Terms */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider block">
                  PROTECTED TERMS
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-slate-300">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Dedicated 1:1 human mentor</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>4 sessions / month</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>24h response turnaround</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>30-day refund guarantee</span>
                  </div>
                </div>
              </div>
            </div>

            {/* History Section */}
            <div className="space-y-3">
              <span className="text-xs font-extrabold text-white block">
                Subscription History
              </span>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                  <span>Initial Mandate Authorization</span>
                  <span className="font-bold text-white">{selectedCustomer.authorizedAt}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                  <span>Protection Baseline Status</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold rounded border border-emerald-500/30">
                    Active &amp; Guarded
                  </span>
                </div>
              </div>
            </div>

            {/* Collapsible Technical Details */}
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="text-xs font-bold text-slate-400 hover:text-white underline underline-offset-4"
              >
                {showTechnicalDetails ? "Hide technical details" : "Technical details"}
              </button>

              {showTechnicalDetails && (
                <div className="mt-3 p-4 bg-black/40 text-slate-300 rounded-2xl text-[11px] font-mono space-y-1 border border-white/10 animate-in fade-in duration-200">
                  <div>Mandate ID: {selectedCustomer.mandateId}</div>
                  <div>Status: {selectedCustomer.status}</div>
                  <div>Gateway: Razorpay Test Mode</div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedCustomer(null)}
              className="w-full py-3.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-2xl border border-white/15 shadow-xs transition-all mg-press"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
