import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Mandate, AuthorizedOfferSnapshot } from "@prisma/client";

interface StoppedEvent {
  id: string;
  offerName: string;
  authorizedAmount: number;
  currentAmount: number;
  reason: string;
  date: Date;
}

interface ProtectionData {
  activeMandates: number;
  totalProtected: number;
  stoppedChanges: number;
  stoppedEvents: StoppedEvent[];
}

async function getProtectionData(): Promise<ProtectionData> {
  try {
    const mandates = await prisma.mandate.findMany({
      include: { snapshot: true },
      orderBy: { authorizedAt: "desc" },
    }) as (Mandate & { snapshot: AuthorizedOfferSnapshot | null })[];

    const halted = mandates.filter((m: Mandate & { snapshot: AuthorizedOfferSnapshot | null }) => m.status === "HALTED");
    const authorized = mandates.filter((m: Mandate & { snapshot: AuthorizedOfferSnapshot | null }) => m.status === "AUTHORIZED");

    const stoppedEvents = halted.map((m: Mandate & { snapshot: AuthorizedOfferSnapshot | null }) => ({
      id: m.id,
      offerName: m.snapshot?.offerName || "Unknown Offer",
      authorizedAmount: m.snapshot?.price || 0,
      currentAmount: m.snapshot?.price || 0,
      reason: "Price changed after buyer authorization",
      date: m.authorizedAt,
    }));

    return {
      activeMandates: authorized.length,
      totalProtected: mandates.length,
      stoppedChanges: halted.length,
      stoppedEvents,
    };
  } catch {
    return {
      activeMandates: 0,
      totalProtected: 0,
      stoppedChanges: 0,
      stoppedEvents: [],
    };
  }
}

function formatPrice(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default async function ProtectionPage() {
  const data = await getProtectionData();

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "clamp(28px, 4vw, 48px) 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "clamp(28px, 4vw, 40px)" }}>
        <h1
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "var(--mg-text)",
            margin: "0 0 6px",
          }}
        >
          Protection
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--mg-text-secondary)", margin: 0 }}>
          MandateGuard protects the terms the buyer approved.
        </p>
      </div>

      {/* Protection status */}
      {data.activeMandates > 0 ? (
        <div
          style={{
            background: "var(--mg-glass-2-bg)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            borderRadius: "18px",
            padding: "28px 32px",
            marginBottom: "24px",
            boxShadow: "var(--mg-glass-2-shadow)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              borderRadius: "99px",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              marginBottom: "16px",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1L7.5 3.5L10 4L8 6L8.5 9L6 7.5L3.5 9L4 6L2 4L4.5 3.5L6 1Z" fill="#10B981" />
            </svg>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#10B981" }}>
              PROTECTED
            </span>
          </div>
          <h2
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: "2rem",
              fontWeight: 800,
              color: "var(--mg-text)",
              margin: "0 0 6px",
            }}
          >
            {data.activeMandates} active mandate{data.activeMandates !== 1 ? "s" : ""}
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--mg-text-secondary)", margin: 0 }}>
            {data.totalProtected} total charge{data.totalProtected !== 1 ? "s" : ""} protected
          </p>
        </div>
      ) : (
        <div
          style={{
            background: "var(--mg-glass-2-bg)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--mg-glass-2-border)",
            borderRadius: "18px",
            padding: "40px 32px",
            marginBottom: "24px",
            textAlign: "center",
            boxShadow: "var(--mg-glass-2-shadow)",
          }}
        >
          <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--mg-text-muted)", marginBottom: "10px" }}>
            NO ACTIVE PROTECTION
          </div>
          <h2
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: "1.25rem",
              fontWeight: 800,
              color: "var(--mg-text)",
              margin: "0 0 8px",
            }}
          >
            Protection starts when a buyer authorizes
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--mg-text-secondary)", margin: "0 0 20px" }}>
            When a buyer approves your offer terms, MandateGuard creates an immutable snapshot and protects the authorized amount.
          </p>
          <Link
            href="/ai-buyers"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 20px",
              background: "linear-gradient(135deg, var(--mg-brand), var(--mg-brand-hover))",
              border: "none",
              borderRadius: "10px",
              fontSize: "0.875rem",
              fontWeight: 700,
              color: "white",
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(11, 92, 255, 0.2)",
            }}
          >
            Test AI buyers →
          </Link>
        </div>
      )}

      {/* Stopped events */}
      {data.stoppedChanges > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--mg-critical)", marginBottom: "12px" }}>
            STOPPED EVENTS ({data.stoppedChanges})
          </div>
          {data.stoppedEvents.map((event) => (
            <div
              key={event.id}
              style={{
                background: "rgba(239, 68, 68, 0.04)",
                border: "1px solid rgba(239, 68, 68, 0.15)",
                borderRadius: "14px",
                padding: "18px 22px",
                marginBottom: "12px",
                boxShadow: "0 4px 16px rgba(239, 68, 68, 0.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "10px" }}>
                <div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "3px 10px",
                      borderRadius: "99px",
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.15)",
                      marginBottom: "6px",
                    }}
                  >
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#EF4444" }} />
                    <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#EF4444" }}>
                      PAYMENT STOPPED
                    </span>
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-space-grotesk), sans-serif",
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "var(--mg-text)",
                      margin: 0,
                    }}
                  >
                    {event.offerName}
                  </h3>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "1.1rem", fontWeight: 800, color: "var(--mg-text)" }}>
                    {formatPrice(event.authorizedAmount)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--mg-text-muted)", marginTop: "2px" }}>
                    {formatDate(event.date)}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--mg-text-secondary)", margin: "0 0 10px" }}>
                {event.reason}. The price changed after the buyer authorized.
              </p>
              <div
                style={{
                  background: "var(--mg-glass-1-bg)",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  fontSize: "0.7rem",
                  color: "var(--mg-text-muted)",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                }}
              >
                NO MONEY WAS MOVED · Snapshot verified
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state for no mandates */}
      {data.totalProtected === 0 && (
        <div
          style={{
            background: "var(--mg-glass-2-bg)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--mg-glass-2-border)",
            borderRadius: "14px",
            padding: "24px",
            boxShadow: "var(--mg-glass-2-shadow)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(11, 92, 255, 0.08)",
                border: "1px solid rgba(11, 92, 255, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="var(--mg-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 12L11 14L15 10" stroke="var(--mg-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--mg-text)" }}>
                How protection works
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--mg-text-secondary)" }}>
                When a buyer authorizes, MandateGuard locks the agreed terms as an immutable snapshot. Any change to price, billing, or support after authorization is blocked.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      {data.totalProtected > 0 && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "20px" }}>
          <div
            style={{
              flex: "1 1 140px",
              background: "var(--mg-glass-1-bg)",
              border: "1px solid var(--mg-glass-1-border)",
              borderRadius: "12px",
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--mg-text)", fontFamily: "var(--font-space-grotesk), sans-serif" }}>
              {data.activeMandates}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--mg-text-secondary)" }}>Active mandates</div>
          </div>
          <div
            style={{
              flex: "1 1 140px",
              background: "var(--mg-glass-1-bg)",
              border: "1px solid var(--mg-glass-1-border)",
              borderRadius: "12px",
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--mg-text)", fontFamily: "var(--font-space-grotesk), sans-serif" }}>
              {data.totalProtected}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--mg-text-secondary)" }}>Protected charges</div>
          </div>
          <div
            style={{
              flex: "1 1 140px",
              background: "var(--mg-glass-1-bg)",
              border: "1px solid rgba(239, 68, 68, 0.15)",
              borderRadius: "12px",
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: data.stoppedChanges > 0 ? "#EF4444" : "var(--mg-text)", fontFamily: "var(--font-space-grotesk), sans-serif" }}>
              {data.stoppedChanges}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--mg-text-secondary)" }}>Stopped changes</div>
          </div>
        </div>
      )}
    </div>
  );
}
