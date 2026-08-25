import { NextResponse } from "next/server";
import {
  getMerchantPreviewService,
  MerchantPreviewError,
} from "@/lib/merchant/preview-service";
import { ImpactPreviewInputSchema } from "@/lib/merchant/preview-types";

/**
 * POST /api/merchant/offers/preview-impact
 * 
 * Merchant Pre-Publish Impact Preview:
 * Simulates downstream subscriber impact of publishing a candidate OfferVersion.
 * ANALYSIS ONLY: Zero mutations to subscriptions, envelopes, or Razorpay state.
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json(
        { error: "Request body must be a valid JSON object." },
        { status: 400 },
      );
    }

    const parsed = ImpactPreviewInputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid impact preview request payload.",
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const service = getMerchantPreviewService();
    const preview = await service.generateImpactPreview(parsed.data);

    return NextResponse.json(preview, { status: 200 });
  } catch (err) {
    if (err instanceof MerchantPreviewError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Internal error generating merchant impact preview." },
      { status: 500 },
    );
  }
}
