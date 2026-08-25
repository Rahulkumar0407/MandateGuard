import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildInterviewForgeData } from "@/lib/merchant/seed-data";

// POST /api/demo/seed
// Ensures the demo merchant, products, and baseline offers exist in the database.
export async function POST() {
  try {
    const seedData = buildInterviewForgeData();

    // 1. Merchant
    await prisma.merchant.updateMany({
      where: { id: { not: "m_interviewforge" } },
      data: { status: "INACTIVE" },
    });

    for (const m of seedData.merchants) {
      await prisma.merchant.upsert({
        where: { id: m.id },
        update: {
          name: m.name,
          slug: m.slug,
          description: m.description,
          status: m.status,
        },
        create: {
          id: m.id,
          name: m.name,
          slug: m.slug,
          description: m.description,
          status: m.status,
        },
      });
    }

    // 2. Products
    for (const p of seedData.products) {
      await prisma.product.upsert({
        where: { id: p.id },
        update: {
          name: p.name,
          slug: p.slug,
          description: p.description,
          category: p.category,
          active: p.active,
        },
        create: {
          id: p.id,
          merchantId: p.merchantId,
          name: p.name,
          slug: p.slug,
          description: p.description,
          category: p.category,
          active: p.active,
        },
      });
    }

    // 3. Baseline Offers (v1 active)
    for (const o of seedData.offers) {
      await prisma.offer.upsert({
        where: {
          productId_version: {
            productId: o.productId,
            version: o.version,
          },
        },
        update: {
          name: o.name,
          description: o.description,
          price: o.price,
          currency: o.currency,
          billingInterval: o.billingInterval,
          duration: o.duration,
          entitlementKeys: o.entitlementKeys,
          refundWindowDays: o.refundWindowDays,
          supportTerms: o.supportTerms,
          semanticTerms: o.semanticTerms,
          active: o.version === 1 ? true : o.active,
        },
        create: {
          id: o.id,
          productId: o.productId,
          version: o.version,
          name: o.name,
          description: o.description,
          price: o.price,
          currency: o.currency,
          billingInterval: o.billingInterval,
          duration: o.duration,
          entitlementKeys: o.entitlementKeys,
          refundWindowDays: o.refundWindowDays,
          supportTerms: o.supportTerms,
          semanticTerms: o.semanticTerms,
          active: o.version === 1 ? true : o.active,
        },
      });
    }

    return NextResponse.json({ success: true, message: "Demo catalog seeded successfully." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json(
      { error: "Failed to seed demo catalog.", details: message },
      { status: 500 },
    );
  }
}
