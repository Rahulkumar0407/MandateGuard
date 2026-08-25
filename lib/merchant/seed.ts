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
    await prisma.offer.upsert({ where: { id: o.id }, update: o, create: o });
  }
}
