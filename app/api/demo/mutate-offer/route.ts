import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  computeOfferVersionHash,
  extractStructuredCommitmentCandidate,
} from "@/lib/merchant/structured-commitments";

const MutateSchema = z.object({
  productId: z.string().default("p_sysdesign"),
  scenario: z.enum(["rogue_full", "price_only", "semantic_only", "reset"]).default("rogue_full"),
});

// Demo is restricted to the known seed catalog so a client cannot target
// arbitrary merchants/products. This is a minimal allowlist for the hackathon
// demo, not a general authorization system.
const DEMO_PRODUCTS = new Set(["p_sysdesign"]);

// POST /api/demo/mutate-offer
// Controlled Rogue Merchant Simulator endpoint. Creates a NEW immutable offer
// version (next available version) representing merchant tampering/degradation,
// or resets the product back to the seeded current version (v2). It never
// mutates an existing offer version or the AuthorizedOfferSnapshot.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = MutateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid mutation request." }, { status: 400 });
    }

    const { productId, scenario } = parsed.data;

    if (!DEMO_PRODUCTS.has(productId)) {
      return NextResponse.json({ error: "Unknown demo product." }, { status: 400 });
    }

    const baseOffer = await prisma.offer.findUnique({
      where: {
        productId_version: {
          productId,
          version: 1,
        },
      },
    });

    if (!baseOffer) {
      return NextResponse.json({ error: "Base offer v1 not found. Run seed first." }, { status: 404 });
    }

    if (scenario === "reset") {
      // Deactivate any rogue version (v3+) and restore the seeded current
      // version (v2) without mutating historical offer records.
      await prisma.offer.updateMany({
        where: { productId, version: { gt: 2 } },
        data: { active: false },
      });
      await prisma.offer.updateMany({
        where: { productId, version: 2 },
        data: { active: true },
      });

      return NextResponse.json({
        success: true,
        scenario: "reset",
        currentVersion: 2,
        activeOffer: baseOffer,
      });
    }

    let mutatedPrice = baseOffer.price;
    let mutatedEntitlements = [...baseOffer.entitlementKeys];
    let mutatedSupport = baseOffer.supportTerms;
    let mutatedSemantic = baseOffer.semanticTerms;
    let mutatedDescription = baseOffer.description;

    if (scenario === "rogue_full" || scenario === "price_only") {
      // +18% price increase: 349900 * 1.18 = 412882 -> rounded to 412900 (or ₹4,128)
      mutatedPrice = Math.round(baseOffer.price * 1.18);
    }

    if (scenario === "rogue_full") {
      // Remove critical entitlements
      mutatedEntitlements = baseOffer.entitlementKeys.filter(
        (key) => key !== "mentor_feedback_weekly" && key !== "sysdesign_mocks",
      );
    }

    if (scenario === "rogue_full" || scenario === "semantic_only") {
      mutatedDescription = "Self-paced system design modules with community Discord peer help.";
      mutatedSupport = "Community Discord support only. No 1:1 mentor feedback or SLA guarantees.";
      mutatedSemantic =
        "Community-driven peer reviews on public Discord channels; response times not guaranteed; self-serve mock interviews.";
    }

    // Determine the next available version so the rogue change is recorded as a
    // NEW immutable offer version (never overwriting an existing version).
    const existingVersions = await prisma.offer.findMany({
      where: { productId },
      select: { version: true },
    });
    const maxVersion = existingVersions.reduce((max, o) => Math.max(max, o.version), 0);
    const nextVersion = maxVersion + 1;

    const candidate = extractStructuredCommitmentCandidate({
      description: mutatedDescription,
      supportTerms: mutatedSupport,
      semanticTerms: mutatedSemantic,
      entitlementKeys: mutatedEntitlements,
      refundWindowDays: baseOffer.refundWindowDays,
    });

    const versionHash = computeOfferVersionHash({
      productId,
      version: nextVersion,
      price: mutatedPrice,
      currency: baseOffer.currency,
      billingInterval: baseOffer.billingInterval,
      duration: baseOffer.duration,
      refundWindowDays: baseOffer.refundWindowDays,
      structuredCommitments: candidate.commitments,
    });

    const rogueOffer = await prisma.offer.create({
      data: {
        id: `o_${productId}_v${nextVersion}`,
        productId,
        version: nextVersion,
        name: `${baseOffer.name} (v${nextVersion} Modified)`,
        description: mutatedDescription,
        price: mutatedPrice,
        currency: baseOffer.currency,
        billingInterval: baseOffer.billingInterval,
        duration: baseOffer.duration,
        entitlementKeys: mutatedEntitlements,
        refundWindowDays: baseOffer.refundWindowDays,
        supportTerms: mutatedSupport,
        semanticTerms: mutatedSemantic,
        structuredCommitments: candidate.commitments as object,
        isConfirmedByMerchant: true,
        versionHash,
        active: true,
      },
    });

    // Make the newly published rogue version the only active offer for the
    // product so downstream integrity compares against the frozen snapshot.
    await prisma.offer.updateMany({
      where: { productId, NOT: { id: rogueOffer.id } },
      data: { active: false },
    });

    return NextResponse.json({
      success: true,
      scenario,
      currentVersion: nextVersion,
      activeOffer: rogueOffer,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: "Failed to mutate offer.", details: message }, { status: 500 });
  }
}
