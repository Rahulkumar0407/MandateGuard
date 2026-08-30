"use client";

import React from "react";

export function PlanChangesHistory() {
  const events = [
    {
      id: "ev_1",
      date: "Just now",
      planName: "System Design Pro",
      version: "v8",
      changeSummary: "Price revised from ₹3,499 to ₹4,129; support model updated to community Discord.",
      affectedCount: 181,
      mrrImpact: "₹3,49,000",
      status: "REAUTHORIZATION_REQUIRED",
      action: "Reauthorization Requests Issued (Action Blocked)",
    },
    {
      id: "ev_2",
      date: "Yesterday",
      planName: "DSA Mastery",
      version: "v2",
      changeSummary: "Added 20 new system design practice modules at no extra charge.",
      affectedCount: 640,
      mrrImpact: "₹0",
      status: "COMPATIBLE",
      action: "Seamlessly Applied to All Subscribers",
    },
    {
      id: "ev_3",
      date: "3 days ago",
      planName: "Engineering Leadership",
      version: "v2",
      changeSummary: "Annual billing option added; monthly terms untouched.",
      affectedCount: 463,
      mrrImpact: "₹0",
      status: "COMPATIBLE",
      action: "Grandfathered Active Authorizations",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-[var(--mg-border)] pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--mg-navy)]">
          Plan Revision &amp; Protection History
        </h1>
        <p className="text-xs sm:text-sm text-[var(--mg-text-secondary)] mt-1.5 font-normal">
          Immutable audit record of commercial updates, customer impact cohorts, and authorization outcomes.
        </p>
      </div>

      <div className="bg-white border border-[var(--mg-border)] rounded-2xl overflow-hidden shadow-xs">
        <div className="divide-y divide-[var(--mg-border)]">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="p-6 hover:bg-[var(--mg-bg)]/80 transition-colors space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <h3 className="font-bold text-sm text-[var(--mg-navy)]">
                    {ev.planName} <span className="text-xs text-[var(--mg-text-muted)] font-normal">({ev.version})</span>
                  </h3>
                  {ev.status === "COMPATIBLE" ? (
                    <span className="text-[10px] font-bold text-[var(--mg-success)] bg-[var(--mg-success-soft)] px-2.5 py-0.5 rounded-full border border-[var(--mg-success)]/20">
                      ✓ Seamless / Compatible
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-[var(--mg-critical)] bg-[var(--mg-critical-soft)] px-2.5 py-0.5 rounded-full border border-[var(--mg-critical)]/20">
                      ⚠ Reauthorization Required
                    </span>
                  )}
                </div>
                <span className="text-xs text-[var(--mg-text-muted)]">{ev.date}</span>
              </div>

              <p className="text-xs text-[var(--mg-text-secondary)] leading-relaxed">
                {ev.changeSummary}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 text-[11px] text-[var(--mg-text-muted)] border-t border-[var(--mg-border)]">
                <div className="flex items-center space-x-4">
                  <span>
                    Subscribers Affected: <strong className="text-[var(--mg-navy)]">{ev.affectedCount}</strong>
                  </span>
                  <span>
                    MRR Impact: <strong className="text-[var(--mg-navy)]">{ev.mrrImpact}</strong>
                  </span>
                </div>
                <div className="text-[var(--mg-navy)] font-semibold">
                  {ev.action}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
