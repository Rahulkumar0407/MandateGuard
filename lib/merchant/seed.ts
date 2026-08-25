import type { PrismaClient } from "@prisma/client";
import { buildInterviewForgeData } from "./seed-data";

// Idempotent seed of the demo merchant/products/offers. Intended to be run once
// a PostgreSQL database is available (e.g. `prisma migrate dev` + this seed).
// NOT executed in the offline M1-A environment.
export async function seedMerchantData(prisma: PrismaClient): Promise<void> {
  const { merchants, products, offers } = buildInterviewForgeData();

  for (const m of merchants) {
    await prisma.merchant.upsert({ where: { id: m.id }, update: m, create: m });
  }
  for (const p of products) {
    await prisma.product.upsert({ where: { id: p.id }, update: p, create: p });
  }
  for (const o of offers) {
    const data = {
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
      structuredCommitments: (o.structuredCommitments as object) ?? undefined,
      isConfirmedByMerchant: o.isConfirmedByMerchant ?? false,
      versionHash: o.versionHash ?? null,
      active: o.active,
    };
    await prisma.offer.upsert({
      where: { id: o.id },
      update: data,
      create: { id: o.id, ...data },
    });
  }
}
