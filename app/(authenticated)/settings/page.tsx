import { cookies } from "next/headers";
import Link from "next/link";
import { SESSION_COOKIE, resolveSession } from "@/lib/auth/session";
import { getMerchantOfferService } from "@/lib/merchant/service";

async function getSettingsData() {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await resolveSession(raw);

  const merchantName = session.session?.name || session.merchant?.name || "Unknown";
  const email = session.session?.email || "";
  const isSample = session.session?.isSample || false;

  let offerSnapshots: { name: string; versionHash: string; isConfirmed: boolean }[] = [];
  try {
    const service = getMerchantOfferService();
    const offers = await service.listOffers();
    offerSnapshots = offers.map((o) => ({
      name: o.name,
      versionHash: o.versionHash ?? "",
      isConfirmed: Boolean(o.isConfirmedByMerchant),
    }));
  } catch { /* non-blocking */ }

  return { merchantName, email, isSample, offerSnapshots };
}

export default async function SettingsPage() {
  const data = await getSettingsData();

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
          Settings
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--mg-text-secondary)", margin: 0 }}>
          Workspace configuration and technical details.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "32px" }}>
        {/* Workspace */}
        <div
          style={{
            background: "var(--mg-glass-2-bg)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--mg-glass-2-border)",
            borderRadius: "16px",
            padding: "20px 22px",
            boxShadow: "var(--mg-glass-2-shadow)",
          }}
        >
          <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--mg-text-muted)", marginBottom: "14px" }}>
            WORKSPACE
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--mg-text-muted)", marginBottom: "2px" }}>Business</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--mg-text)" }}>{data.merchantName}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--mg-text-muted)", marginBottom: "2px" }}>Email</div>
              <div style={{ fontSize: "0.875rem", color: "var(--mg-text)" }}>{data.email || "—"}</div>
            </div>
            {data.isSample && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "3px 10px",
                  borderRadius: "99px",
                  background: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.2)",
                  width: "fit-content",
                }}
              >
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#F59E0B" }} />
                <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#F59E0B" }}>
                  SAMPLE BUSINESS
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Environment */}
        <div
          style={{
            background: "var(--mg-glass-2-bg)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--mg-glass-2-border)",
            borderRadius: "16px",
            padding: "20px 22px",
            boxShadow: "var(--mg-glass-2-shadow)",
          }}
        >
          <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--mg-text-muted)", marginBottom: "14px" }}>
            ENVIRONMENT
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.06)",
                border: "1px solid rgba(16, 185, 129, 0.15)",
              }}
            >
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 6px rgba(16,185,129,0.5)" }} />
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#10B981" }}>TEST MODE</div>
                <div style={{ fontSize: "0.7rem", color: "var(--mg-text-muted)" }}>Safe · No real money moves</div>
              </div>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--mg-text-secondary)" }}>
              Test Mode uses Razorpay Test credentials. Live Mode requires Razorpay Live credentials and explicit activation.
            </div>
          </div>
        </div>
      </div>

      {/* Developer section */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--mg-text-muted)", marginBottom: "14px" }}>
          DEVELOPER DETAILS
        </div>
        <div
          style={{
            background: "var(--mg-glass-2-bg)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--mg-glass-2-border)",
            borderRadius: "16px",
            padding: "20px 22px",
            boxShadow: "var(--mg-glass-2-shadow)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Offer snapshots */}
            <div>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--mg-text-muted)", marginBottom: "10px" }}>
                OFFER SNAPSHOTS
              </div>
              {data.offerSnapshots.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {data.offerSnapshots.map((o, i) => (
                    <div key={i} style={{ background: "var(--mg-glass-1-bg)", borderRadius: "8px", padding: "8px 10px" }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--mg-text)" }}>{o.name}</div>
                      <div style={{ fontSize: "0.65rem", fontFamily: "var(--font-jetbrains-mono), monospace", color: "var(--mg-text-muted)", marginTop: "2px" }}>
                        {o.versionHash.slice(0, 16)}...
                      </div>
                      <div style={{ fontSize: "0.65rem", color: o.isConfirmed ? "var(--mg-success)" : "var(--mg-warning)", marginTop: "2px" }}>
                        {o.isConfirmed ? "✓ Confirmed" : "Draft"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: "0.8rem", color: "var(--mg-text-muted)" }}>No offers yet</div>
              )}
            </div>

            {/* Architecture */}
            <div>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--mg-text-muted)", marginBottom: "10px" }}>
                ARCHITECTURE
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {[
                  { label: "Auth boundary", value: "Session cookie" },
                  { label: "Mutation boundary", value: "CommerceMutationExecutor" },
                  { label: "Provider", value: "Razorpay Test Mode" },
                  { label: "DB", value: "PostgreSQL / Prisma" },
                  { label: "AI", value: "Semantic only · Deterministic fallback" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--mg-glass-1-border)" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--mg-text-muted)" }}>{label}</span>
                    <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-jetbrains-mono), monospace", color: "var(--mg-text-secondary)" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Policy gate note */}
          <div
            style={{
              marginTop: "16px",
              padding: "10px 14px",
              background: "var(--mg-glass-1-bg)",
              borderRadius: "10px",
              fontSize: "0.75rem",
              color: "var(--mg-text-muted)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            AI reasons · MandateGuard authorizes · CommerceMutationExecutor gates mutations · Razorpay executes
          </div>
        </div>
      </div>

      {/* Navigation links */}
      <div>
        <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--mg-text-muted)", marginBottom: "14px" }}>
          SECTIONS
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            { href: "/overview", label: "Overview", desc: "Dashboard home" },
            { href: "/offer", label: "Offer", desc: "Manage what you sell" },
            { href: "/ai-buyers", label: "AI Buyers", desc: "Buyer matching analysis" },
            { href: "/protection", label: "Protection", desc: "Mandates and stopped events" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "var(--mg-glass-1-bg)",
                border: "1px solid var(--mg-glass-1-border)",
                borderRadius: "12px",
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
            >
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--mg-text)" }}>{item.label}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--mg-text-muted)" }}>{item.desc}</div>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--mg-brand)" }}>→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
