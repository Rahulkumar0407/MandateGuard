import { NextResponse } from "next/server";
import { z } from "zod";
import { getMerchantOfferService } from "@/lib/merchant/service";

// GET /agent/products?category=...
// Returns discoverable ACTIVE products (with their ACTIVE offers). Inactive
// products are excluded from normal agent discovery.
const QuerySchema = z.object({
  category: z.string().trim().min(1).max(50).optional(),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      category: url.searchParams.get("category") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters." },
        { status: 400 },
      );
    }
    const products = await getMerchantOfferService().listProducts({
      category: parsed.data.category,
    });
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
