import Link from "next/link";
import { getMerchantOfferService } from "@/lib/merchant/service";

interface OfferDetail {
  id: string;
  name: string;
  price: number;
  billingInterval: string;
  supportTerms: string | null;
  structuredCommitments: Record<string, unknown> | null;
  isConfirmedByMerchant: boolean;
  versionHash: string;
  entitlements: string[];
  refundWindowDays: number | null;
}

async function getOffers(): Promise<OfferDetail[]> {
  try {
    const service = getMerchantOfferService();
    const offers = await service.listOffers();
    return offers.map((o) => ({
      id: o.id,
      name: o.name,
      price: o.price,
      billingInterval: o.billingInterval || "month",
      supportTerms: o.supportTerms,
      structuredCommitments: o.structuredCommitments as Record<string, unknown> | null,
      isConfirmedByMerchant: Boolean(o.isConfirmedByMerchant),
      versionHash: o.versionHash ?? "",
      entitlements: o.entitlementKeys || [],
      refundWindowDays: o.refundPolicy?.windowDays ?? null,
    }));
  } catch {
    return [];
  }
}

function formatPrice(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function BillingLabel(interval: string): string {
  switch (interval) {
    case "year": return "Billed yearly";
    case "month": return "Billed monthly";
    case "week": return "Billed weekly";
    default: return `Billed ${interval}`;
  }
}

export default async function OfferPage() {
  const offers = await getOffers();
  const primary = offers.find((o) => o.isConfirmedByMerchant) || offers[0] || null;

  const aiCanVerify: string[] = [
    primary?.name ? "Offer name" : null,
    primary?.price !== undefined ? "Price" : null,
    primary?.billingInterval ? "Billing cycle" : null,
    primary?.supportTerms ? "Support terms" : null,
    (primary?.entitlements?.length ?? 0) > 0 ? "Entitlements" : null,
  ].filter((x): x is string => x !== null);

  const aiNeeds: string[] = [
    !primary?.refundWindowDays ? "Refund terms" : null,
    !primary?.structuredCommitments ? "Structured commitments" : null,
    !primary?.supportTerms ? "Support description" : null,
  ].filter((x): x is string => x !== null);

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
          Offer
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--mg-text-secondary)", margin: 0 }}>
          What you&apos;re selling and what AI buyers can understand about it.
        </p>
      </div>

      {!primary ? (
        /* Empty state */
        <div
          style={{
            background: "var(--mg-glass-2-bg)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--mg-glass-2-border)",
            borderRadius: "16px",
            padding: "40px 32px",
            textAlign: "center",
            boxShadow: "var(--mg-glass-2-shadow)",
          }}
        >
          <div
            style={{
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--mg-text-muted)",
              marginBottom: "10px",
            }}
          >
            NO OFFER YET
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
            Create your first offer
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--mg-text-secondary)", margin: "0 0 20px" }}>
            An offer is what you sell — a service, course, subscription, or product.
          </p>
          <button
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
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(11, 92, 255, 0.2)",
            }}
          >
            Create offer →
          </button>
        </div>
      ) : (
        <>
          {/* Offer object */}
          <div
            style={{
              background: "var(--mg-glass-2-bg)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid var(--mg-glass-2-border)",
              borderRadius: "16px",
              padding: "24px 28px",
              marginBottom: "20px",
              boxShadow: "var(--mg-glass-2-shadow)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "16px" }}>
              <div>
                <div
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: primary.isConfirmedByMerchant ? "var(--mg-success)" : "var(--mg-warning)",
                    marginBottom: "4px",
                  }}
                >
                  {primary.isConfirmedByMerchant ? "CONFIRMED OFFER" : "DRAFT OFFER"}
                </div>
                <h2
                  style={{
                    fontFamily: "var(--font-space-grotesk), sans-serif",
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    color: "var(--mg-text)",
                    margin: 0,
                  }}
                >
                  {primary.name}
                </h2>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--font-space-grotesk), sans-serif",
                    fontSize: "1.75rem",
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                    color: "var(--mg-text)",
                  }}
                >
                  {formatPrice(primary.price)}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--mg-text-secondary)", marginTop: "2px" }}>
                  {BillingLabel(primary.billingInterval)}
                </div>
              </div>
            </div>

            {/* What buyer gets */}
            {primary.entitlements.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--mg-text-muted)", marginBottom: "8px" }}>
                  BUYER GETS
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {primary.entitlements.map((e) => (
                    <div key={e} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                        <circle cx="7" cy="7" r="6" fill="rgba(16,185,129,0.1)" stroke="#10B981" strokeWidth="1.5" />
                        <path d="M4 7L6 9L10 5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span style={{ fontSize: "0.875rem", color: "var(--mg-text)" }}>{e}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Support */}
            {primary.supportTerms && (
              <div style={{ marginBottom: "16px", paddingTop: "16px", borderTop: "1px solid var(--mg-glass-2-border)" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--mg-text-muted)", marginBottom: "6px" }}>
                  SUPPORT
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--mg-text)", margin: 0 }}>{primary.supportTerms}</p>
              </div>
            )}

            {/* Version hash */}
            <div style={{ paddingTop: "12px", borderTop: "1px solid var(--mg-glass-2-border)", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.65rem", fontFamily: "var(--font-jetbrains-mono), monospace", color: "var(--mg-text-muted)" }}>
                {primary.versionHash.slice(0, 12)}...
              </span>
            </div>
          </div>

          {/* AI understanding grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            {/* AI can verify */}
            <div
              style={{
                background: "var(--mg-glass-2-bg)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid var(--mg-glass-2-border)",
                borderRadius: "14px",
                padding: "18px 20px",
                boxShadow: "var(--mg-glass-2-shadow)",
              }}
            >
              <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--mg-success)", marginBottom: "10px" }}>
                AI CAN VERIFY
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {aiCanVerify.length > 0 ? aiCanVerify.map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="6" cy="6" r="5" fill="rgba(16,185,129,0.1)" stroke="#10B981" strokeWidth="1.5" />
                      <path d="M3.5 6L5 7.5L8.5 4" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontSize: "0.8rem", color: "var(--mg-text)" }}>{item}</span>
                  </div>
                )) : (
                  <span style={{ fontSize: "0.8rem", color: "var(--mg-text-muted)" }}>No structured data yet</span>
                )}
              </div>
            </div>

            {/* AI needs */}
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
              <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--mg-warning)", marginBottom: "10px" }}>
                AI STILL NEEDS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {aiNeeds.length > 0 ? aiNeeds.map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", border: "1.5px solid var(--mg-warning)", background: "rgba(245,158,11,0.08)", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.8rem", color: "var(--mg-text-secondary)" }}>{item}</span>
                  </div>
                )) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="6" cy="6" r="5" fill="rgba(16,185,129,0.1)" stroke="#10B981" strokeWidth="1.5" />
                      <path d="M3.5 6L5 7.5L8.5 4" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontSize: "0.8rem", color: "var(--mg-success)" }}>All key terms structured</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
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
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(11, 92, 255, 0.2)",
              }}
            >
              Improve offer →
            </button>
            <Link
              href="/ai-buyers"
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
              Preview as AI buyer →
            </Link>
          </div>
        </>
      )}

      {/* All offers */}
      {offers.length > 1 && (
        <div style={{ marginTop: "32px" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--mg-text-muted)", marginBottom: "12px" }}>
            ALL OFFERS ({offers.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {offers.map((o) => (
              <div
                key={o.id}
                style={{
                  background: "var(--mg-glass-1-bg)",
                  border: "1px solid var(--mg-glass-1-border)",
                  borderRadius: "12px",
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--mg-text)" }}>{o.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--mg-text-secondary)" }}>{formatPrice(o.price)} / {o.billingInterval}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {o.isConfirmedByMerchant && (
                    <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--mg-success)", background: "rgba(16,185,129,0.1)", padding: "2px 8px", borderRadius: "99px" }}>
                      CONFIRMED
                    </span>
                  )}
                  <span style={{ fontSize: "0.75rem", color: "var(--mg-brand)" }}>Edit →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
