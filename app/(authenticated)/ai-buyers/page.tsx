import Link from "next/link";
import { RunTestButton } from "@/components/ai-buyers/RunTestButton";

async function getBuyabilityData() {
  try {
    const buyabilityRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/merchant/buyability`,
      { cache: "no-store" }
    );
    if (!buyabilityRes.ok) return null;
    return await buyabilityRes.json();
  } catch {
    return null;
  }
}

export default async function AIBuyersPage() {
  const buyability = await getBuyabilityData();
  // M36 Fix7: use real funnel rates (AIBuyabilityReport shape). Previously checked analysis.matchRate which is not present.
  const matchRate =
    buyability?.funnel?.recommended?.ratePercent ??
    buyability?.funnel?.transactionReady?.ratePercent ??
    buyability?.analysis?.matchRate ??
    null;
  // Prerequisite: need at least one confirmed offer to run meaningful test
  const hasOffers = buyability !== null ? true : false;

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
          AI Buyers
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--mg-text-secondary)", margin: 0 }}>
          Would an AI buyer choose your offer?
        </p>
      </div>

      {/* Match rate hero */}
      {matchRate !== null ? (
        <div
          style={{
            background: "var(--mg-glass-2-bg)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--mg-glass-2-border)",
            borderRadius: "18px",
            padding: "28px 32px",
            marginBottom: "24px",
            boxShadow: "var(--mg-glass-2-shadow)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--mg-text-muted)", marginBottom: "8px" }}>
                BUYER MATCH RATE
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-space-grotesk), sans-serif",
                    fontSize: "4rem",
                    fontWeight: 800,
                    letterSpacing: "-0.06em",
                    color: "var(--mg-text)",
                    lineHeight: 1,
                  }}
                >
                  {matchRate}
                </span>
                <span style={{ fontSize: "2rem", fontWeight: 700, color: "var(--mg-text-secondary)" }}>%</span>
              </div>
              <p style={{ fontSize: "0.875rem", color: "var(--mg-text-secondary)", margin: "8px 0 0" }}>
                of buyer missions matched your offer
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "200px" }}>
              <div
                style={{
                  background: "var(--mg-glass-1-bg)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  fontSize: "0.8125rem",
                  color: "var(--mg-text-secondary)",
                }}
              >
                {matchRate >= 70
                  ? "✓ Strong buyer fit — AI can clearly evaluate and choose your offer"
                  : matchRate >= 40
                    ? "→ Partial fit — some buyer requirements are not fully met"
                    : "⚠ Low match rate — add more structured buyer-facing terms"}
              </div>
            </div>
          </div>

          {/* Match bar */}
          <div style={{ marginTop: "20px" }}>
            <div
              style={{
                height: "6px",
                borderRadius: "99px",
                background: "var(--mg-glass-1-border)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${matchRate}%`,
                  borderRadius: "99px",
                  background: matchRate >= 70
                    ? "linear-gradient(90deg, #10B981, #059669)"
                    : matchRate >= 40
                      ? "linear-gradient(90deg, var(--mg-brand), var(--mg-brand-hover))"
                      : "linear-gradient(90deg, #F59E0B, #EF4444)",
                  transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            </div>
          </div>
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
            NOT TESTED YET
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
            Run your first AI buyer test
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--mg-text-secondary)", margin: "0 0 20px" }}>
            Simulate buyer missions to see how your offer matches AI buyer requirements.
          </p>
          {hasOffers ? (
            <RunTestButton label="Run AI buyer test →" />
          ) : (
            <div style={{ fontSize: "0.8125rem", color: "var(--mg-warning)", background: "var(--mg-warning-soft)", border: "1px solid rgba(245,158,11,0.2)", padding: "10px 14px", borderRadius: "10px", display: "inline-block" }}>
              Add an offer before running an AI buyer test.{" "}
              <Link href="/offer" style={{ color: "var(--mg-brand)", fontWeight: 700, textDecoration: "underline" }}>Create offer →</Link>
            </div>
          )}
        </div>
      )}

      {/* Why you match / miss */}
      {buyability && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              background: "var(--mg-glass-2-bg)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(16, 185, 129, 0.15)",
              borderRadius: "14px",
              padding: "18px 20px",
              boxShadow: "var(--mg-glass-2-shadow)",
            }}
          >
            <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--mg-success)", marginBottom: "12px" }}>
              WHY YOU MATCH
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(buyability.strengths || []).slice(0, 4).map((s: string, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                    <circle cx="6" cy="6" r="5" fill="rgba(16,185,129,0.12)" stroke="#10B981" strokeWidth="1.5" />
                    <path d="M3.5 6L5 7.5L8.5 4" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: "0.8125rem", color: "var(--mg-text)" }}>{s}</span>
                </div>
              ))}
              {(!buyability.strengths || buyability.strengths.length === 0) && (
                <span style={{ fontSize: "0.8125rem", color: "var(--mg-text-muted)" }}>Run a test to see matching factors</span>
              )}
            </div>
          </div>

          <div
            style={{
              background: "var(--mg-glass-2-bg)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(245, 158, 11, 0.15)",
              borderRadius: "14px",
              padding: "18px 20px",
              boxShadow: "var(--mg-glass-2-shadow)",
            }}
          >
            <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--mg-warning)", marginBottom: "12px" }}>
              WHY YOU MISS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(buyability.gaps || []).slice(0, 4).map((g: string, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", border: "1.5px solid var(--mg-warning)", background: "rgba(245,158,11,0.08)", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.8125rem", color: "var(--mg-text-secondary)" }}>{g}</span>
                </div>
              ))}
              {(!buyability.gaps || buyability.gaps.length === 0) && (
                <span style={{ fontSize: "0.8125rem", color: "var(--mg-text-muted)" }}>No gaps detected</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <RunTestButton label={matchRate !== null ? "Run new test →" : "Run AI buyer test →"} />
        <Link
          href="/offer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 18px",
            background: "var(--mg-surface)",
            border: "1px solid var(--mg-glass-2-border)",
            borderRadius: "10px",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "var(--mg-text-secondary)",
            textDecoration: "none",
          }}
        >
          Improve offer →
        </Link>
      </div>
    </div>
  );
}
