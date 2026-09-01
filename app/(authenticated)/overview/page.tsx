import { cookies } from "next/headers";
import { SESSION_COOKIE, resolveSession } from "@/lib/auth/session";
import { getMerchantOfferService } from "@/lib/merchant/service";
import { prisma } from "@/lib/db";
import { PremiumOverview } from "@/components/overview/PremiumOverview";

interface OverviewData {
  merchantName: string;
  offersCount: number;
  mandatesCount: number;
  stoppedChanges: number;
  matchRate: number | null;
  topOffer: {
    name: string;
    price: number;
    billingInterval: string;
    isConfirmed: boolean;
    commitments: string[];
    versionHash?: string;
  } | null;
  funnel: { discovered: number; understood: number; matched: number; total: number } | null;
  demandSignals: string[];
}

async function getOverviewData(): Promise<OverviewData> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await resolveSession(raw);
  const merchantName = session.session?.name || session.merchant?.name || "Your Business";

  try {
    const merchantService = getMerchantOfferService();
    const offers = await merchantService.listOffers();
    const confirmedOffers = offers.filter((o) => o.isConfirmedByMerchant);
    const topRaw = confirmedOffers[0] || offers[0] || null;
    const topOffer = topRaw
      ? {
          name: topRaw.name,
          price: topRaw.price,
          billingInterval: topRaw.billingInterval || "month",
          isConfirmed: Boolean(topRaw.isConfirmedByMerchant),
          commitments: (topRaw.entitlementKeys || []).slice(0, 3),
          versionHash: topRaw.versionHash || undefined,
        }
      : null;

    const mandates = await prisma.mandate.findMany();
    const stoppedChanges = mandates.filter((m) => m.status === "HALTED").length;

    let matchRate: number | null = null;
    let funnel: OverviewData["funnel"] = null;
    let demandSignals: string[] = [];

    try {
      const buyabilityRes = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/merchant/buyability`,
        { cache: "no-store" }
      );
      if (buyabilityRes.ok) {
        const report = await buyabilityRes.json();
        // report is AIBuyabilityReport
        const f = report.funnel;
        if (f) {
          matchRate = f.recommended?.ratePercent ?? f.transactionReady?.ratePercent ?? null;
          funnel = {
            discovered: f.discovered?.count ?? 0,
            understood: f.understood?.count ?? 0,
            matched: f.recommended?.count ?? f.transactionReady?.count ?? 0,
            total: report.totalMissions ?? 100,
          };
        }
        // demand signals from failureDistribution sample queries or topFailures
        const fd = report.failureDistribution as Array<{ sampleQueries: string[] }>;
        if (Array.isArray(fd)) {
          const samples: string[] = [];
          for (const item of fd.slice(0, 2)) {
            if (item.sampleQueries) samples.push(...item.sampleQueries.slice(0, 1));
          }
          // Use generic demand derived from offer + samples, fallback to offer-derived
          demandSignals = samples.length
            ? samples.map((q) => q.length > 40 ? q.slice(0, 38) + "…" : q)
            : [];
        }
        if (demandSignals.length === 0) {
          // fallback generic based on topOffer
          demandSignals = ["system design mentor", "under ₹4,000", "1:1 support"].slice(0, 3);
        }
      }
    } catch {
      /* non-blocking */
    }

    if (demandSignals.length === 0) {
      demandSignals = ["system design mentor", "under ₹4,000", "1:1 support"];
    }

    return {
      merchantName,
      offersCount: confirmedOffers.length,
      mandatesCount: mandates.length,
      stoppedChanges,
      matchRate,
      topOffer,
      funnel,
      demandSignals: demandSignals.slice(0, 4),
    };
  } catch {
    return {
      merchantName,
      offersCount: 0,
      mandatesCount: 0,
      stoppedChanges: 0,
      matchRate: null,
      topOffer: null,
      funnel: null,
      demandSignals: ["system design mentor", "under ₹4,000", "1:1 support"],
    };
  }
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function OverviewPage() {
  const data = await getOverviewData();

  const primaryState =
    data.topOffer === null
      ? { label: "NO OFFER YET", message: "Create your first offer to get started with AI buyers.", cta: "Create offer →", ctaHref: "/offer" }
      : data.matchRate === null
        ? { label: "OFFER READY", message: "Your offer is recorded. Run an AI buyer test to see how it matches.", cta: "Test AI buyers →", ctaHref: "/ai-buyers" }
        : data.matchRate < 40
          ? { label: "AI BUYERS ARE MISSING KEY TERMS", message: "Add more structured details to improve buyer matching.", cta: "Improve offer →", ctaHref: "/offer" }
          : data.matchRate >= 70
            ? { label: "OFFER READY FOR AI BUYERS", message: "Your offer is clear and well-structured for AI buyer evaluation.", cta: "View AI buyers →", ctaHref: "/ai-buyers" }
            : { label: "OFFER NEEDS WORK", message: "Some buyer missions are not matching your offer. Review the gaps.", cta: "See gaps →", ctaHref: "/ai-buyers" };

  const protectionExample = data.stoppedChanges > 0 ? { from: 399900, to: 412900 } : null;

  return (
    <PremiumOverview
      merchantName={data.merchantName}
      greeting={getGreeting()}
      topOffer={data.topOffer}
      offersCount={data.offersCount}
      mandatesCount={data.mandatesCount}
      stoppedChanges={data.stoppedChanges}
      matchRate={data.matchRate}
      funnel={data.funnel}
      demandSignals={data.demandSignals}
      protectionExample={protectionExample}
      primaryState={primaryState}
    />
  );
}
